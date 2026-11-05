export type Section = {
  heading: string;
  /** 짧은 설명 문단 (선택) */
  intro?: string;
  /** 핵심 내용 목록 */
  bullets?: string[];
  /** 💡 박스: 현장 적용 팁, 주의사항, 확인 안내 등 (선택) */
  note?: string;
};

export type Unit = {
  /** 영문 소문자-하이픈. 같은 과목 안에서 유일해야 함 */
  slug: string;
  title: string;
  /** 단원 목록 카드에 보일 한 줄 요약 */
  summary: string;
  /** 단원 맨 위에 보이는 핵심 키워드 3~8개 (본문에 실제로 나오는 용어) */
  keywords: string[];
  sections: Section[];
};

export type Reference = { name: string; url?: string; note?: string };

export type Subject = {
  slug: string;
  emoji: string;
  title: string;
  summary: string;
  /** 과목 전체의 신뢰할 수 있는 확인처 (사이트 운영자가 관리) */
  references?: Reference[];
  units: Unit[];
};
