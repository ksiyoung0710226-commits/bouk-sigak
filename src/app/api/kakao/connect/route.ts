import { requireAdmin } from "@/lib/server/supa";
import { authorizeUrl, kakaoReady, sendKakaoToMe } from "@/lib/server/kakao";

// 관리자만: { } → 카카오 로그인 주소(알림 받을 카카오 계정 연결) / { test: true } → 시험 알림 보내기
export async function POST(req: Request) {
  if (!(await requireAdmin(req))) return Response.json({ error: "관리자만 할 수 있어요." }, { status: 403 });
  if (!kakaoReady()) return Response.json({ error: "카카오 앱 키가 아직 설정되지 않았어요." }, { status: 400 });
  const body = await req.json().catch(() => ({}));
  if (body.test) {
    try {
      await sendKakaoToMe("🔔 educare insight 시험 알림이에요. 잘 받으셨다면 연결이 정상이에요!", "/profile");
      return Response.json({ ok: true });
    } catch (e) {
      return Response.json({ error: `보내지 못했어요: ${(e as Error).message}` }, { status: 502 });
    }
  }
  return Response.json({ url: authorizeUrl() });
}
