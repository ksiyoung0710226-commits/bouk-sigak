// 회원 추가 정보. 값 목록은 DB(009_member_details_and_dm.sql)의 check 조건과 같아야 함 — 같이 바꿀 것.
export const REGIONS = [
  "서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종",
  "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주",
] as const;

// 영유아보육법상 어린이집 유형 + 기타
export const CENTER_TYPES = ["국공립", "사회복지법인", "법인·단체등", "민간", "가정", "협동", "직장", "기타"] as const;
// 유아교육법상 유치원 구분 + 기타
export const KINDERGARTEN_TYPES = ["국립", "공립", "사립", "기타"] as const;

// 회원 유형 (DB profiles.kind check와 같음)
export type Kind = "student" | "prospective" | "teacher";
export const TEACHER_ORGS = ["어린이집", "유치원"] as const;
export type TeacherOrg = (typeof TEACHER_ORGS)[number];
export const orgTypes = (org: string | null | undefined) => (org === "유치원" ? KINDERGARTEN_TYPES : CENTER_TYPES);

// 닉네임 옆에 붙는 유형 표시: 재학생 / 예비 재학생 / 어린이집 교사 / 유치원 교사
export function kindLabel(kind: string | null | undefined, org?: string | null): string {
  if (kind === "teacher") return org ? `${org} 교사` : "현장 교사";
  if (kind === "prospective") return "예비 재학생";
  return "재학생";
}

// 학번: 개인정보 최소화를 위해 입학 연도 숫자 두 자리만 (예: 24). DB check와 같음
export const STUDENT_NO_RE = /^[0-9]{2}$/;

export type Details = {
  school: string | null; major?: string | null; school_verified?: boolean;
  region: string | null; center_type: string | null; is_public?: boolean;
};

// 게시판 등에 보여 줄 짧은 표시 (예: "OO대학교" / "서울 · 국공립 어린이집")
export function detailsLabel(kind: string | undefined, d: Details | null | undefined, org?: string | null): string {
  if (!d) return "";
  if (kind === "teacher") {
    const parts = [d.region, d.center_type && (d.center_type === "기타" ? "기타 기관" : `${d.center_type} ${org ?? "어린이집"}`)].filter(Boolean);
    return parts.join(" · ");
  }
  if (!d.school) return "";
  return `${d.school}${d.major ? ` ${d.major}` : ""}${d.school_verified ? " ✓" : ""}`;
}

// PostgREST 1:1 관계는 객체 또는 배열로 올 수 있어 하나로 맞춤
export function one<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  return Array.isArray(v) ? v[0] ?? null : v;
}
