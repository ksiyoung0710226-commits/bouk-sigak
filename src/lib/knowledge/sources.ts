import type { Reference } from "./types";

// 모든 링크는 열람 가능 여부를 확인한 것만 넣었습니다.
// 학술 문헌은 해당 이론의 원전(고전)만 실었고, 확인되지 않은 국내 교재는 싣지 않았습니다.

const GUIDE_2024: Reference = {
  kind: "guide",
  name: "2024 개정 표준보육과정(0~2세) 해설서",
  url: "https://i-nuri.go.kr/teacher/board/view.do?menu_idx=20&manage_idx=137&data_type=normal&board_idx=4331",
  note: "교육부·중앙육아종합지원센터 i-누리. 개정 배경, 총론, 영역별 목표와 내용 해설",
};
const GOSI_2024: Reference = {
  kind: "guide",
  name: "2024 개정 표준보육과정(0~2세) 고시문 (교육부 고시 제2024-23호)",
  url: "https://i-nuri.go.kr/teacher/board/view.do?menu_idx=20&manage_idx=137&data_type=normal&board_idx=4332",
  note: "0~1세·2세·3~5세 내용범주와 내용 원문. 이 사이트 보육과정 페이지의 근거",
};
const GUIDE_NURI_2019: Reference = {
  kind: "guide",
  name: "(2019 개정 누리과정) 해설서",
  url: "https://repo.kicce.re.kr/handle/2019.oak/4997",
  note: "육아정책연구소(KICCE) 자료실. 3~5세 누리과정 해설",
};
const MOE_NURI_2019: Reference = {
  kind: "institution",
  name: "교육부 「2019 개정 누리과정 확정·발표」 보도자료",
  url: "https://www.moe.go.kr/boardCnts/view.do?boardID=294&lev=0&statusYN=W&s=moe&m=0204&opType=N&boardSeq=78061",
  note: "유아·놀이 중심, 5개 영역 유지, 2020년 3월 시행 등",
};

const L = {
  childcare: { kind: "law", name: "영유아보육법", url: "https://www.law.go.kr/법령/영유아보육법", note: "어린이집, 보육교직원, 보육과정의 법적 근거" },
  welfare: { kind: "law", name: "아동복지법", url: "https://www.law.go.kr/법령/아동복지법", note: "아동 권리와 보호, 학대 행위 정의" },
  abuse: { kind: "law", name: "아동학대범죄의 처벌 등에 관한 특례법", url: "https://www.law.go.kr/법령/아동학대범죄의처벌등에관한특례법", note: "신고의무자(제10조) 등" },
  privacy: { kind: "law", name: "개인정보 보호법", url: "https://www.law.go.kr/법령/개인정보보호법", note: "영유아·부모 개인정보 처리 원칙" },
  special: { kind: "law", name: "장애인 등에 대한 특수교육법", url: "https://www.law.go.kr/법령/장애인등에대한특수교육법", note: "특수교육 대상자와 지원 체계" },
} satisfies Record<string, Reference>;

const LIT = {
  piaget1952: { kind: "literature", name: "Piaget, J. (1952). The Origins of Intelligence in Children. International Universities Press.", note: "감각운동기, 대상영속성" },
  piaget1932: { kind: "literature", name: "Piaget, J. (1932). The Moral Judgment of the Child. Kegan Paul.", note: "도덕성 발달" },
  vygotsky: { kind: "literature", name: "Vygotsky, L. S. (1978). Mind in Society: The Development of Higher Psychological Processes. Harvard University Press.", note: "근접발달영역, 비계" },
  erikson: { kind: "literature", name: "Erikson, E. H. (1950). Childhood and Society. W. W. Norton.", note: "심리사회적 발달" },
  bowlby: { kind: "literature", name: "Bowlby, J. (1969). Attachment and Loss, Vol. 1: Attachment. Basic Books.", note: "애착 이론" },
  ainsworth: { kind: "literature", name: "Ainsworth, M. D. S., Blehar, M. C., Waters, E., & Wall, S. (1978). Patterns of Attachment: A Psychological Study of the Strange Situation. Lawrence Erlbaum.", note: "애착 유형" },
  bandura1977: { kind: "literature", name: "Bandura, A. (1977). Social Learning Theory. Prentice Hall.", note: "관찰학습" },
  bandura1961: { kind: "literature", name: "Bandura, A., Ross, D., & Ross, S. A. (1961). Transmission of aggression through imitation of aggressive models. Journal of Abnormal and Social Psychology, 63(3), 575–582.", note: "보보인형 실험" },
  bronfenbrenner: { kind: "literature", name: "Bronfenbrenner, U. (1979). The Ecology of Human Development. Harvard University Press.", note: "생태학적 체계" },
  thomas: { kind: "literature", name: "Thomas, A., & Chess, S. (1977). Temperament and Development. Brunner/Mazel.", note: "기질 9가지" },
  parten: { kind: "literature", name: "Parten, M. B. (1932). Social participation among preschool children. Journal of Abnormal and Social Psychology, 27(3), 243–269.", note: "사회적 놀이 단계" },
  kohlberg: { kind: "literature", name: "Kohlberg, L. (1969). Stage and sequence: The cognitive-developmental approach to socialization. In D. A. Goslin (Ed.), Handbook of Socialization Theory and Research (pp. 347–480). Rand McNally.", note: "도덕성 발달 단계" },
  skinner: { kind: "literature", name: "Skinner, B. F. (1953). Science and Human Behavior. Macmillan.", note: "조작적 조건형성, 강화" },
  katz: { kind: "literature", name: "Katz, L. G., & Chard, S. C. (1989). Engaging Children's Minds: The Project Approach. Ablex.", note: "프로젝트 접근법" },
  dewey: { kind: "literature", name: "Dewey, J. (1938). Experience and Education. Macmillan.", note: "경험 중심 교육" },
  montessori: { kind: "literature", name: "Montessori, M. (1949). The Absorbent Mind.", note: "흡수하는 정신, 준비된 환경" },
  uncrc: { kind: "literature", name: "United Nations (1989). Convention on the Rights of the Child.", note: "유엔아동권리협약" },
  dsm5: { kind: "literature", name: "American Psychiatric Association (2013). Diagnostic and Statistical Manual of Mental Disorders (5th ed.). American Psychiatric Publishing.", note: "진단용 전문 자료입니다. 교사는 진단하지 않으며 용어 이해 참고용으로만 보세요" },
  standards: { kind: "literature", name: "AERA, APA, & NCME (2014). Standards for Educational and Psychological Testing. American Educational Research Association.", note: "검사의 타당도·신뢰도·공정성 기준" },
} satisfies Record<string, Reference>;

const I = {
  kicce: { kind: "institution", name: "육아정책연구소(KICCE)", url: "https://www.kicce.re.kr", note: "영유아 정책·연구 보고서" },
  childcare: { kind: "institution", name: "보육포털 아이사랑", url: "https://www.childcare.go.kr", note: "어린이집 운영·지침 안내" },
  mohw: { kind: "institution", name: "보건복지부", url: "https://www.mohw.go.kr", note: "보육·복지 정책, 지침" },
  mohwReport: { kind: "institution", name: "보건복지부 신고의무자 안내 (아동학대)", url: "https://www.mohw.go.kr/menu.es?mid=a10711050100", note: "어린이집 종사자는 신고의무자, 신고처 안내" },
  mohwBorderline: { kind: "institution", name: "보건복지부 보도자료 (2024.4.22)", url: "https://mohw.go.kr/board.es?act=view&bid=0027&list_no=1481149&mid=a10503010200&nPage=1&tag=", note: "경계선 지능인 지원 관련 정의 표현" },
  ncrc: { kind: "institution", name: "아동권리보장원", url: "https://www.ncrc.or.kr", note: "아동 권리, 학대 예방 자료" },
  nise: { kind: "institution", name: "국가특수교육원", url: "https://www.nise.go.kr", note: "특수교육 자료와 지원 정보" },
  niseHealth: { kind: "institution", name: "국가특수교육원 건강장애 안내", url: "https://www.nise.go.kr/jsp/field/2010-3/05.jsp", note: "특수교육법 시행령상 건강장애 정의" },
  nhisKdst: { kind: "institution", name: "국민건강보험공단 영유아 발달선별검사 안내", url: "https://www.nhis.or.kr/nhis/healthin/wbhaca05000m01.do", note: "K-DST가 영유아 건강검진에서 쓰이는 방식" },
  kdca: { kind: "institution", name: "질병관리청", url: "https://www.kdca.go.kr", note: "감염병·예방접종 정보" },
  kdcaFeeding: { kind: "institution", name: "질병관리청 국가건강정보포털 · 식이영양(영유아)", url: "https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=5212", note: "이유식 시작 시기와 개인차" },
  kdcaSids: { kind: "institution", name: "질병관리청 국가건강정보포털 · 영아돌연사증후군", url: "https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=5467", note: "영아 수면 안전(똑바로 눕혀 재우기 등)" },
  who: { kind: "institution", name: "WHO 헌장(Constitution)", url: "https://www.who.int/about/governance/constitution", note: "건강의 정의" },
  mfds: { kind: "institution", name: "식품의약품안전처", url: "https://www.mfds.go.kr", note: "식품 안전·알레르기 정보" },
  safekorea: { kind: "institution", name: "국민재난안전포털", url: "https://www.safekorea.go.kr", note: "안전·재난 대처 정보" },
  medline: { kind: "institution", name: "MedlinePlus · 타임아웃 사용법", url: "https://medlineplus.gov/ency/patientinstructions/000756.htm", note: "미국 국립의학도서관의 보호자용 안내" },
} satisfies Record<string, Reference>;

export const subjectSources: Record<string, Reference[]> = {
  development: [
    GUIDE_2024, GOSI_2024, GUIDE_NURI_2019, I.kicce, I.nhisKdst,
    LIT.piaget1952, LIT.piaget1932, LIT.vygotsky, LIT.erikson, LIT.bowlby, LIT.ainsworth,
    LIT.bandura1977, LIT.bronfenbrenner, LIT.thomas, LIT.parten, LIT.kohlberg,
  ],
  curriculum: [GOSI_2024, GUIDE_2024, GUIDE_NURI_2019, MOE_NURI_2019, L.childcare, I.kicce],
  "teacher-character": [L.abuse, L.welfare, L.childcare, I.mohwReport, I.ncrc, LIT.uncrc],
  "special-needs": [L.special, L.childcare, L.welfare, I.nise, I.niseHealth, I.mohwBorderline, LIT.dsm5],
  "admin-practice": [L.childcare, L.welfare, L.privacy, I.childcare, I.mohw],
  assessment: [I.nhisKdst, I.kicce, I.mohw, GUIDE_2024, LIT.standards],
  program: [GUIDE_2024, GUIDE_NURI_2019, MOE_NURI_2019, I.kicce, LIT.katz, LIT.dewey, LIT.montessori],
  "child-health": [L.childcare, I.kdca, I.kdcaFeeding, I.kdcaSids, I.who, I.mfds, I.safekorea],
  observation: [GUIDE_2024, GUIDE_NURI_2019, I.kicce, I.medline, LIT.bandura1961, LIT.bandura1977, LIT.skinner, LIT.parten],
};

export const curriculumPageSources: Reference[] = [GOSI_2024, GUIDE_2024, GUIDE_NURI_2019, MOE_NURI_2019, L.childcare];
