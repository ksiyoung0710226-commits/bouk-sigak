import Anthropic from "@anthropic-ai/sdk";
import { userClient } from "@/lib/server/supa";
import { AI_SYSTEM, findSiteMaterial } from "@/lib/server/ai-prompt";

// AI 도우미: 로그인한 회원만, 하루 DAILY_LIMIT 번. 질문 내용은 저장하지 않는다.
export const maxDuration = 60;
const DAILY_LIMIT = 20;
const MAX_TURNS = 10;
const MAX_CHARS = 2000;

type Turn = { role: "user" | "assistant"; content: string };

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "AI 도우미를 준비하고 있어요. 조금만 기다려 주세요." }, { status: 503 });
  }

  const body = await req.json().catch(() => null);
  const raw: unknown[] = Array.isArray(body?.messages) ? body.messages : [];
  const turns: Turn[] = raw
    .filter((m): m is Turn => !!m && typeof m === "object" && ((m as Turn).role === "user" || (m as Turn).role === "assistant") && typeof (m as Turn).content === "string")
    // 이전 AI 답변은 짧게만 다시 보냄(조작된 긴 답으로 지시문을 흔들지 못하게)
    .map((m) => ({ role: m.role, content: m.content.trim().slice(0, m.role === "assistant" ? 1000 : MAX_CHARS) }))
    .filter((m) => m.content)
    .slice(-MAX_TURNS);
  // 첫 메시지는 user, 마지막도 user여야 함
  while (turns.length && turns[0].role !== "user") turns.shift();
  if (!turns.length || turns[turns.length - 1].role !== "user") {
    return Response.json({ error: "질문을 적어 주세요." }, { status: 400 });
  }

  // 로그인 확인 + 하루 사용량 차감(DB 함수가 회원 토큰으로 확인)
  const db = userClient(req);
  const { data: left, error: qErr } = await db.rpc("ai_take_quota", { max_count: DAILY_LIMIT });
  if (qErr) {
    const needLogin = /login|jwt|auth|permission denied/i.test(qErr.message);
    if (!needLogin) console.error("ai_take_quota", qErr.message);
    return Response.json({ error: needLogin ? "로그인한 회원만 AI에게 질문할 수 있어요." : "잠시 후 다시 시도해 주세요." }, { status: needLogin ? 401 : 500 });
  }
  if (left === -1) return Response.json({ error: `오늘 질문 횟수(${DAILY_LIMIT}번)를 다 썼어요. 내일 다시 물어봐 주세요.` }, { status: 429 });

  // 질문(직전 질문 포함)과 관련 있는 사이트 단원 전문을 골라 마지막 질문 앞에 붙인다
  const userTurns = turns.filter((t) => t.role === "user");
  const query = userTurns.slice(-2).map((t) => t.content).join(" ");
  const material = findSiteMaterial(query);
  const last = turns[turns.length - 1];
  const messages: Anthropic.Beta.BetaMessageParam[] = [
    ...turns.slice(0, -1),
    {
      role: "user",
      content: material
        ? [{ type: "text", text: `<사이트_자료>\n${material}</사이트_자료>` }, { type: "text", text: last.content }]
        : last.content,
    },
  ];

  const client = new Anthropic();
  const stream = client.beta.messages.stream({
    model: "claude-opus-5-5",
    max_tokens: 4000,
    output_config: { effort: "medium" },
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: [{ type: "text", text: AI_SYSTEM, cache_control: { type: "ephemeral" } }],
    messages,
  });

  const encoder = new TextEncoder();
  const out = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal") {
          controller.enqueue(encoder.encode("\n\n이 질문에는 답하기 어려워요. 보육·유아교육과 관련된 다른 질문을 해 주세요."));
        } else if (final.stop_reason === "max_tokens") {
          controller.enqueue(encoder.encode("\n\n(답이 길어서 여기까지 보여 드렸어요. 더 궁금한 부분을 이어서 물어봐 주세요.)"));
        }
      } catch (e) {
        // 답을 못 만들었으면 오늘 사용량 1회를 돌려줌
        await db.rpc("ai_refund_quota").then(() => {}, () => {});
        if (e instanceof Anthropic.RateLimitError) {
          controller.enqueue(encoder.encode("\n\n지금 질문이 많아요. 잠시 후 다시 물어봐 주세요."));
        } else {
          console.error("ask", e instanceof Anthropic.APIError ? `${e.status} ${e.message}` : e);
          controller.enqueue(encoder.encode("\n\n답을 만드는 중에 문제가 생겼어요. 잠시 후 다시 시도해 주세요."));
        }
      } finally {
        controller.close();
      }
    },
    cancel() {
      stream.abort();
    },
  });

  return new Response(out, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "X-AI-Remaining": String(left) },
  });
}
