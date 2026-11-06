import { GoogleGenAI } from "@google/genai";
import { userClient } from "@/lib/server/supa";
import { AI_SYSTEM, helperAnswer, materialText, retrieve, sourcesOf } from "@/lib/server/ai-prompt";

// AI 도우미(구글 Gemini 무료 요금제). 로그인 회원만, 하루 DAILY_LIMIT 번. 질문 내용은 사이트에 저장하지 않는다.
// 답의 근거는 사이트의 확인된 자료만 쓰고, 출처는 서버가 X-Sources 헤더로 함께 보내 화면이 항상 표시한다.
// GEMINI_API_KEY가 없거나 무료 사용량을 넘으면 '지식 도우미'(자료 요약)로 대신 답한다.
export const maxDuration = 60;
const DAILY_LIMIT = 10;
// 무료 요금제 모델. 앞의 모델이 바쁘거나(503) 한도를 넘으면(429) 다음 모델로 넘어감
const MODELS = ["gemini-3.8-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-2.5-flash-lite"];

const enc = (v: unknown) => Buffer.from(JSON.stringify(v), "utf8").toString("base64");

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const question = typeof body?.question === "string" ? body.question.trim().slice(0, 1000) : "";
  if (!question) return Response.json({ error: "질문을 적어 주세요." }, { status: 400 });

  // 로그인 확인 + 하루 사용량 차감(DB 함수가 회원 토큰으로 확인)
  const db = userClient(req);
  const { data: left, error: qErr } = await db.rpc("ai_take_quota", { max_count: DAILY_LIMIT });
  if (qErr) {
    const needLogin = /login|jwt|auth|permission denied/i.test(qErr.message);
    if (!needLogin) console.error("ai_take_quota", qErr.message);
    return Response.json({ error: needLogin ? "로그인한 회원만 AI에게 질문할 수 있어요." : "잠시 후 다시 시도해 주세요." }, { status: needLogin ? 401 : 500 });
  }
  if (left === -1) return Response.json({ error: `오늘 질문 횟수(${DAILY_LIMIT}번)를 다 썼어요. 내일 다시 물어봐 주세요.` }, { status: 429 });

  const found = retrieve(question);
  const headers = {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store",
    "X-AI-Remaining": String(left),
    "X-Sources": enc(sourcesOf(found)),
  };

  // 확인된 자료에 관련 내용이 없으면 AI를 부르지 않음(지어내지 않게) + 사용량 돌려주기
  if (found.length === 0) {
    await db.rpc("ai_refund_quota").then(() => {}, () => {});
    return new Response(
      "확인된 자료에서는 이 질문에 대한 내용을 찾지 못했어요. 😢\n\n" +
      "다른 낱말로 다시 물어보거나, [Q&A 게시판](/qna)에서 현장 선생님께 질문해 보세요. 전공 서적과 공식 기관 자료도 함께 확인해 주세요.",
      { headers: { ...headers, "X-AI-Remaining": String(left + 1), "X-Mode": "none" } },
    );
  }

  if (!process.env.GEMINI_API_KEY) {
    return new Response(helperAnswer(found), { headers: { ...headers, "X-Mode": "helper" } });
  }

  const ai = new GoogleGenAI({});
  const input = `<자료>\n${materialText(found)}</자료>\n\n질문: ${question}`;
  const encoder = new TextEncoder();
  const out = new ReadableStream<Uint8Array>({
    async start(controller) {
      let wrote = false;
      try {
        let lastErr: unknown = null;
        for (const model of MODELS) {
          try {
            const stream = await ai.interactions.create({
              model,
              system_instruction: AI_SYSTEM,
              input,
              store: false,
              stream: true,
              generation_config: { thinking_level: "low", max_output_tokens: 1500 },
            });
            for await (const event of stream) {
              if (event.event_type === "step.delta" && event.delta.type === "text" && event.delta.text) {
                controller.enqueue(encoder.encode(event.delta.text));
                wrote = true;
              }
            }
            if (wrote) { lastErr = null; break; }
            lastErr = new Error(`empty answer from ${model}`);
          } catch (e) {
            lastErr = e;
            console.error("ask gemini", model, e instanceof Error ? e.message : e);
            if (wrote) break; // 이미 답을 쓰기 시작했으면 다른 모델로 이어 쓰지 않음
          }
        }
        if (lastErr) throw lastErr;
      } catch {
        // AI가 답하지 못하면(무료 사용량 초과 등) 자료 요약으로 대신 답하고 사용량은 돌려줌
        await db.rpc("ai_refund_quota").then(() => {}, () => {});
        controller.enqueue(encoder.encode((wrote ? "\n\n(답이 중간에 끊겼어요. 아래 자료를 함께 확인해 주세요.)\n\n" : "지금은 AI가 바빠서 확인된 자료로 대신 답해 드릴게요.\n\n") + helperAnswer(found)));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(out, { headers: { ...headers, "X-Mode": "ai" } });
}
