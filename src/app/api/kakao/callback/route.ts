import { checkState, connectWithCode, sendKakaoToMe, SITE } from "@/lib/server/kakao";

// 카카오 로그인 후 돌아오는 곳 → 토큰 저장 → 연결 확인 메시지 전송
export async function GET(req: Request) {
  const u = new URL(req.url);
  const back = (r: string) => Response.redirect(`${SITE}/profile?kakao=${r}#admin-kakao`, 302);
  if (!checkState(u.searchParams.get("state"))) return back("expired");
  const code = u.searchParams.get("code");
  if (!code) return back("denied");
  try {
    await connectWithCode(code);
    await sendKakaoToMe("🌱 educare insight 알림이 연결되었어요!\n새 회원가입·문의·신고가 들어오면 여기로 알려 드릴게요.", "/profile");
    return back("ok");
  } catch (e) {
    console.error("kakao connect", e);
    return back("fail");
  }
}
