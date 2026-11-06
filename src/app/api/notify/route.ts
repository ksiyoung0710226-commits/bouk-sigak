import { kakaoReady, sameSecret, sendKakaoToMe } from "@/lib/server/kakao";
import { mailReady, sendMail } from "@/lib/server/mail";

const SITE = "https://educare-insight.vercel.app";

// DB 트리거(pg_net)가 부르는 알림 주소. NOTIFY_SECRET 을 아는 쪽(DB)만 부를 수 있다.
// body: { text, path }
// 카카오가 연결돼 있으면 카카오톡 '나에게 보내기', 아니면 관리자 메일(NOTIFY_EMAIL, 없으면 SMTP_USER)로 보낸다.
export async function POST(req: Request) {
  if (!sameSecret(req.headers.get("x-notify-secret"))) return new Response("forbidden", { status: 403 });
  const { text, path } = await req.json().catch(() => ({}));
  if (typeof text !== "string" || !text) return Response.json({ ok: false, error: "no text" }, { status: 400 });
  const safePath = typeof path === "string" && path.startsWith("/") ? path : "/";

  try {
    if (kakaoReady()) {
      try {
        await sendKakaoToMe(text, safePath);
        return Response.json({ ok: true, via: "kakao" });
      } catch (e) {
        // 카카오 연결이 안 됐거나 끊겼으면 메일로 대신 보낸다.
        console.error("notify kakao", e);
      }
    }
    const to = process.env.NOTIFY_EMAIL || process.env.SMTP_USER;
    if (!mailReady() || !to) return Response.json({ ok: false, error: "no channel configured" });
    const subject = `[educare insight 알림] ${text.split("\n")[0].slice(0, 60)}`;
    await sendMail(to, subject, [...text.split("\n").filter(Boolean), `바로 가기: ${SITE}${safePath}`]);
    return Response.json({ ok: true, via: "mail" });
  } catch (e) {
    console.error("notify", e);
    return Response.json({ ok: false, error: (e as Error).message }, { status: 502 });
  }
}
