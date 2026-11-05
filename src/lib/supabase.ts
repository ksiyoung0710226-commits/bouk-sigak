import { createClient } from "@supabase/supabase-js";

// 자동 로그인: 켜면 브라우저를 닫아도 로그인 유지(localStorage),
// 끄면 브라우저(탭)를 닫을 때 로그아웃(sessionStorage).
export const REMEMBER_KEY = "boyuk:auto-login";
export const SAVED_EMAIL_KEY = "boyuk:saved-email";

const hasWindow = () => typeof window !== "undefined";
export const isAutoLogin = () => !hasWindow() || localStorage.getItem(REMEMBER_KEY) !== "0";
export function setAutoLogin(on: boolean) {
  if (hasWindow()) localStorage.setItem(REMEMBER_KEY, on ? "1" : "0");
}

const storage = {
  getItem: (k: string) => (hasWindow() ? localStorage.getItem(k) ?? sessionStorage.getItem(k) : null),
  setItem: (k: string, v: string) => {
    if (!hasWindow()) return;
    if (isAutoLogin()) {
      localStorage.setItem(k, v);
      sessionStorage.removeItem(k);
    } else {
      sessionStorage.setItem(k, v);
      localStorage.removeItem(k);
    }
  },
  removeItem: (k: string) => {
    if (!hasWindow()) return;
    localStorage.removeItem(k);
    sessionStorage.removeItem(k);
  },
};

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  { auth: { storage, persistSession: true, autoRefreshToken: true } }
);

export type Profile = {
  id: string;
  nickname: string;
  kind: "student" | "teacher";
  teacher_verified: boolean;
  is_admin: boolean;
};

// 데이터베이스 오류를 사용자에게 보여 줄 문장으로 바꿉니다.
export function nicknameErrorMessage(err: { code?: string; message?: string } | null): string {
  if (!err) return "";
  if (err.code === "23505" || /duplicate|unique/i.test(err.message ?? "")) return "이미 사용 중인 닉네임이에요.";
  if (err.code === "23514" || /check constraint/i.test(err.message ?? "")) return "닉네임 규칙에 맞지 않아요.";
  return "저장하지 못했어요. 잠시 후 다시 시도해 주세요.";
}
