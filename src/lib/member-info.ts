// 회원 추가 정보. 값 목록은 DB(009_member_details_and_dm.sql)의 check 조건과 같아야 함 — 같이 바꿀 것.
export const REGIONS = [
  "서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종",
  "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주",
] as const;

// 영유아보육법상 어린이집 유형 + 기타
export const CENTER_TYPES = ["국공립", "사회복지법인", "법인·단체등", "민간", "가정", "협동", "직장", "기타"] as const;

export type Details = { school: string | null; region: string | null; center_type: string | null; is_public?: boolean };

// 게시판 등에 보여 줄 짧은 표시 (예: "OO대학교" / "서울 · 국공립 어린이집")
export function detailsLabel(kind: string | undefined, d: Details | null | undefined): string {
  if (!d) return "";
  if (kind === "teacher") {
    const parts = [d.region, d.center_type && (d.center_type === "기타" ? "기타 기관" : `${d.center_type} 어린이집`)].filter(Boolean);
    return parts.join(" · ");
  }
  return d.school ?? "";
}

// PostgREST 1:1 관계는 객체 또는 배열로 올 수 있어 하나로 맞춤
export function one<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  return Array.isArray(v) ? v[0] ?? null : v;
}
