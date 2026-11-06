import { createClient } from "@supabase/supabase-js";

// 서버에서 쓰는 Supabase 연결. service_role 키는 쓰지 않는다.
// - userClient: 요청한 회원의 로그인 토큰으로 접속 → DB 보안 규칙(관리자 확인 등)이 그대로 적용됨
// - anonClient: 비밀값(NOTIFY_SECRET)으로 보호된 알림용 함수만 부를 때 사용
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const opts = { auth: { persistSession: false, autoRefreshToken: false } };

export function userClient(req: Request) {
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  return createClient(url, key, { ...opts, global: { headers: { Authorization: `Bearer ${token}` } } });
}

export const anonClient = () => createClient(url, key, opts);

export async function requireAdmin(req: Request) {
  const db = userClient(req);
  const { data, error } = await db.rpc("is_admin");
  if (error || data !== true) return null;
  return db;
}
