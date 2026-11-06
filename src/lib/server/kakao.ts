import { createHmac, timingSafeEqual } from "node:crypto";
import { anonClient } from "./supa";

// 카카오톡 '나에게 보내기'로 관리자에게 알림을 보낸다.
// 환경 변수: KAKAO_REST_KEY(REST API 키), KAKAO_CLIENT_SECRET(선택), NOTIFY_SECRET
// 토큰은 DB app_secrets 에 저장되고, NOTIFY_SECRET 을 아는 서버만 읽고 쓸 수 있다.
export const SITE = "https://boyuk-insight.vercel.app";
export const REDIRECT_URI = `${SITE}/api/kakao/callback`;
const secret = () => process.env.NOTIFY_SECRET ?? "";

export const kakaoReady = () => Boolean(process.env.KAKAO_REST_KEY && process.env.NOTIFY_SECRET);

export function sameSecret(given: string | null) {
  const a = Buffer.from(given ?? ""), b = Buffer.from(secret());
  return b.length > 0 && a.length === b.length && timingSafeEqual(a, b);
}

// 로그인 요청 위조 방지용 state (10분 유효)
export function makeState() {
  const t = Date.now().toString();
  return `${t}.${createHmac("sha256", secret()).update(t).digest("hex")}`;
}
export function checkState(state: string | null) {
  const [t, sig] = (state ?? "").split(".");
  if (!t || !sig || Date.now() - Number(t) > 10 * 60 * 1000) return false;
  const expect = createHmac("sha256", secret()).update(t).digest("hex");
  return sig.length === expect.length && timingSafeEqual(Buffer.from(sig), Buffer.from(expect));
}

export function authorizeUrl() {
  const q = new URLSearchParams({
    client_id: process.env.KAKAO_REST_KEY!,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: "talk_message",
    state: makeState(),
  });
  return `https://kauth.kakao.com/oauth/authorize?${q}`;
}

type TokenRes = { access_token?: string; expires_in?: number; refresh_token?: string; error?: string; error_description?: string };

async function tokenRequest(params: Record<string, string>): Promise<TokenRes> {
  const body = new URLSearchParams({ client_id: process.env.KAKAO_REST_KEY!, ...params });
  if (process.env.KAKAO_CLIENT_SECRET) body.set("client_secret", process.env.KAKAO_CLIENT_SECRET);
  const res = await fetch("https://kauth.kakao.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
    body,
  });
  return res.json();
}

async function save(t: TokenRes) {
  const { error } = await anonClient().rpc("notify_save_kakao", {
    secret: secret(),
    access: t.access_token ?? null,
    access_expires: t.expires_in ? new Date(Date.now() + (t.expires_in - 60) * 1000).toISOString() : null,
    refresh: t.refresh_token ?? null,
  });
  if (error) throw new Error(`save token: ${error.message}`);
}

export async function connectWithCode(code: string) {
  const t = await tokenRequest({ grant_type: "authorization_code", redirect_uri: REDIRECT_URI, code });
  if (!t.access_token) throw new Error(t.error_description ?? t.error ?? "token error");
  await save(t);
}

async function accessToken(): Promise<string> {
  const { data, error } = await anonClient().rpc("notify_get_kakao", { secret: secret() });
  if (error) throw new Error(error.message);
  const row = (data as { access: string | null; access_expires: string | null; refresh: string | null }[])[0];
  if (!row?.refresh) throw new Error("kakao not connected");
  if (row.access && row.access_expires && new Date(row.access_expires) > new Date()) return row.access;
  // 만료 → refresh token 으로 새로 받기(만료가 가까우면 refresh token 도 새로 옴)
  const t = await tokenRequest({ grant_type: "refresh_token", refresh_token: row.refresh });
  if (!t.access_token) throw new Error(t.error_description ?? t.error ?? "refresh error");
  await save(t);
  return t.access_token;
}

export async function sendKakaoToMe(text: string, path = "/") {
  const token = await accessToken();
  const link = { web_url: SITE + path, mobile_web_url: SITE + path };
  const res = await fetch("https://kapi.kakao.com/v2/api/talk/memo/default/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
    body: new URLSearchParams({
      template_object: JSON.stringify({ object_type: "text", text: text.slice(0, 200), link, button_title: "보육시각에서 보기" }),
    }),
  });
  if (!res.ok) throw new Error(`kakao send ${res.status}: ${await res.text()}`);
}
