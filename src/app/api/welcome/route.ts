import { sameSecret } from "@/lib/server/kakao";
import { mailReady, sendMail } from "@/lib/server/mail";

// 가입 완료 환영 메일. DB 트리거(023, pg_net)만 부를 수 있다(NOTIFY_SECRET 확인).
// body: { email, nickname }
export async function POST(req: Request) {
  if (!sameSecret(req.headers.get("x-notify-secret"))) return new Response("forbidden", { status: 403 });
  const { email, nickname } = await req.json().catch(() => ({}));
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return Response.json({ ok: false, error: "bad email" }, { status: 400 });
  if (!mailReady()) return Response.json({ ok: false, error: "mail not configured" });
  const nick = typeof nickname === "string" && nickname.trim() ? nickname.trim().slice(0, 20) : "회원";
  try {
    await sendMail(email, `[educare insight] 회원가입이 완료되었습니다`, [
      "회원가입이 완료되었습니다.",
      `환영합니다 ${nick}님!`,
      "educare insight는 유아교육과, 아동보육과, 교사들을 위한 페이지예요. 함께 배우고 나누는 페이지입니다.",
      "지금 바로 커뮤니티와 Q&A에서 이야기를 나눠 보세요.",
    ]);
    return Response.json({ ok: true });
  } catch (e) {
    console.error("welcome", e);
    return Response.json({ ok: false, error: (e as Error).message }, { status: 502 });
  }
}
