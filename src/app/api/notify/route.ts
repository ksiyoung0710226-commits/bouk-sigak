import { kakaoReady, sameSecret, sendKakaoToMe } from "@/lib/server/kakao";

// DB 트리거(pg_net)가 부르는 알림 주소. NOTIFY_SECRET 을 아는 쪽(DB)만 부를 수 있다.
// body: { text, path }
export async function POST(req: Request) {
  if (!sameSecret(req.headers.get("x-notify-secret"))) return new Response("forbidden", { status: 403 });
  if (!kakaoReady()) return Response.json({ ok: false, error: "kakao not configured" });
  const { text, path } = await req.json().catch(() => ({}));
  if (typeof text !== "string" || !text) return Response.json({ ok: false, error: "no text" }, { status: 400 });
  try {
    await sendKakaoToMe(text, typeof path === "string" && path.startsWith("/") ? path : "/");
    return Response.json({ ok: true });
  } catch (e) {
    console.error("notify", e);
    return Response.json({ ok: false, error: (e as Error).message }, { status: 502 });
  }
}
