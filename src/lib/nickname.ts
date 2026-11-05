// 닉네임 규칙 (데이터베이스 규칙과 같게 유지: supabase/migrations/003_nickname_rules.sql)
export function validateNickname(raw: string): string | null {
  const n = raw.trim();
  if (n.length < 2 || n.length > 20) return "닉네임은 2~20자로 입력해 주세요.";
  if (/\s{2,}/.test(n)) return "띄어쓰기는 연속으로 쓸 수 없어요.";
  if (/[\u0000-\u001f\u007f​-‍﻿ ]/.test(n)) return "사용할 수 없는 문자가 들어 있어요.";
  if (!/[ㄱ-ㅎㅏ-ㅣ가-힣A-Za-z0-9]/.test(n))
    return "특수문자만으로는 만들 수 없어요. 한글, 영문, 숫자를 하나 이상 넣어 주세요.";
  return null;
}
