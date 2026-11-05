// 표준보육과정·누리과정 개정 이력 (요약)
// - 확인 기준: 고시문을 재수록한 중앙육아종합지원센터 페이지, 교육부 고시 첨부파일·보도자료, i-누리 해설서 연혁표 등
//   실제로 열어 본 공식 자료만 사용(2026-11 확인). 확인하지 못한 날짜는 비워 둔다(null).
// - '현재 적용 중'은 시행일(effectiveFrom)이 오늘 이전인 것 중 가장 최근 것 → 새 개정판을 추가하면 시행일에 자동으로 바뀜.
// - 원문(fullText)은 현재 적용 중인 판에만 넣는다. 새 판이 시행되면 그 판의 원문을 curriculum.ts에 추가해 연결할 것.
import { ageGroups, type AgeGroup } from "./curriculum";

export type Track = "standard" | "nuri";
export const TRACK_LABEL: Record<Track, string> = { standard: "표준보육과정", nuri: "누리과정" };

export type Edition = {
  id: string;
  track: Track;
  name: string;
  notices: string[];
  announced: string | null; // 고시일 YYYY-MM-DD
  effectiveFrom: string | null; // 시행일 YYYY-MM-DD (확인 못 하면 null)
  effectiveText?: string; // 시행일을 정확히 확인하지 못했을 때의 설명
  ages: string;
  ageLevels?: string;
  areas: string[];
  features: string[];
  sources: { label: string; url: string }[];
  fullText?: AgeGroup[];
};

const I_NURI = { label: "i-누리 「2024 개정 표준보육과정 해설서」 연혁", url: "https://i-nuri.go.kr/teacher/board/view.do?menu_idx=20&manage_idx=137&data_type=normal&board_idx=4331" };
const nccw = (n: number, label: string) => ({ label: `중앙육아종합지원센터 · ${label}`, url: `https://www.nccw.educare.or.kr/web/care/pag${n}/carePage.do` });
const MOE_2024_TRANSFER = { label: "교육부 · 보육 업무 이관에 따른 고시 제정(2024.6.27)", url: "https://www.moe.go.kr/boardCnts/viewRenew.do?boardID=141&lev=0&statusYN=W&s=moe&m=0404&opType=N&boardSeq=99215" };
const GWE = { label: "강원특별자치도교육청 · 유치원 교육과정 변천", url: "https://www.gwe.go.kr/main/content.do?key=bTIzMDcyMTA2NTM1OTg%3D" };

const group = (id: string) => ageGroups.filter((g) => g.id === id);

export const editions: Edition[] = [
  // ── 표준보육과정 ──
  {
    id: "std-1",
    track: "standard",
    name: "제1차 표준보육과정",
    notices: ["여성가족부 고시 제2007-1호", "보건복지부 고시 제2010-71호 (2010.9.7 재고시, 같은 내용)"],
    announced: "2007-01-03",
    effectiveFrom: null,
    effectiveText: "2007년 1월 고시",
    ages: "0~5세",
    ageLevels: "만 2세 미만 / 만 2세 / 만 3~5세",
    areas: ["기본생활", "신체운동", "사회관계", "의사소통", "자연탐구", "예술경험"],
    features: [
      "2004년 개정된 영유아보육법에 표준보육과정을 개발·보급할 근거가 생기면서, 2007년 1월 처음 고시된 국가 수준의 보육과정이에요.",
      "2010년 보건복지부가 같은 내용을 다시 고시(재고시)했어요.",
    ],
    sources: [nccw(1, "제1차 표준보육과정(2010 재고시본)"), I_NURI],
  },
  {
    id: "std-2",
    track: "standard",
    name: "제2차 표준보육과정",
    notices: ["보건복지부 고시 제2012-28호"],
    announced: "2012-02-29",
    effectiveFrom: "2012-02-29",
    ages: "0~5세 (고시문 표현)",
    ageLevels: "만 2세 미만 / 만 2세 / 만 3~4세",
    areas: ["기본생활", "신체운동", "사회관계", "의사소통", "자연탐구", "예술경험"],
    features: [],
    sources: [nccw(2, "제2차 표준보육과정"), I_NURI],
  },
  {
    id: "std-3",
    track: "standard",
    name: "제3차 어린이집 표준보육과정",
    notices: ["보건복지부 고시 제2013-8호"],
    announced: "2013-01-21",
    effectiveFrom: "2013-03-01",
    ages: "0~5세",
    ageLevels: "0~1세 / 2세 / 3~5세(누리과정)",
    areas: ["0~2세: 기본생활·신체운동·의사소통·사회관계·예술경험·자연탐구", "3~5세: 신체운동·건강·의사소통·사회관계·예술경험·자연탐구"],
    features: [
      "처음으로 0~1세, 2세, 3~5세(누리과정)의 세 과정으로 구성했어요.",
      "3~5세는 누리과정을 그대로 담고, 0~2세는 6개 영역을 유지했어요.",
    ],
    sources: [nccw(3, "제3차 어린이집 표준보육과정"), I_NURI],
  },
  {
    id: "std-4",
    track: "standard",
    name: "제4차 어린이집 표준보육과정",
    notices: ["보건복지부 고시 제2020-75호", "교육부고시 제2024-16호 (2024.6.27 보육 업무 교육부 이관에 따른 재제정, 주요 내용 변경 없음)"],
    announced: "2020-04-09",
    effectiveFrom: "2020-09-01",
    ages: "0~5세",
    ageLevels: "0~1세 / 2세 / 3~5세",
    areas: ["0~2세: 기본생활·신체운동·의사소통·사회관계·예술경험·자연탐구", "3~5세: 신체운동·건강·의사소통·사회관계·예술경험·자연탐구"],
    features: [
      "2019 개정 누리과정이 고시되면서, 0~5세가 끊기지 않고 이어지도록 고쳤어요.",
      "총론 일부와 0~1세·2세의 영역별 목표와 내용을 개정했어요.",
      "‘영유아 중심’과 ‘놀이 중심’을 추구하고, 0~5세 공통 인간상(건강한·자주적인·창의적인·감성이 풍부한·더불어 사는 사람)을 담았어요.",
    ],
    sources: [nccw(4, "제4차 어린이집 표준보육과정"), I_NURI, MOE_2024_TRANSFER],
  },
  {
    id: "std-2024",
    track: "standard",
    name: "2024 개정 표준보육과정",
    notices: ["교육부고시 제2024-23호"],
    announced: "2024-12-09",
    effectiveFrom: "2025-03-01",
    ages: "0~5세 (3~5세는 누리과정)",
    ageLevels: "0~1세 / 2세 / 3~5세",
    areas: ["신체운동·건강", "의사소통", "사회관계", "예술경험", "자연탐구"],
    features: [
      "0~2세의 ‘기본생활’과 ‘신체운동’ 영역을 ‘신체운동·건강’으로 합쳐, 누리과정처럼 5개 영역이 되었어요.",
      "0~1세·2세·3~5세 체계는 유지하고, 영역별 목표를 0~2세로 통합했어요.",
      "영아를 ‘능동적인 어린 학습자’로 보고, 영유아의 주도성과 놀이를 통한 배움을 강조해요.",
      "앞으로 나올 0~5세 영유아교육과정에 앞서, 0~2세 부분을 먼저 개정한 것이에요.",
    ],
    sources: [
      nccw(7, "2024 개정 표준보육과정"),
      { label: "교육부 보도자료(2024.12.9)", url: "https://www.moe.go.kr/boardCnts/viewRenew.do?boardID=294&lev=0&statusYN=W&s=moe&m=020402&opType=N&boardSeq=101898" },
      { label: "대한민국 정책브리핑", url: "https://www.korea.kr/news/policyNewsView.do?newsId=148937170&pWise=sub&pWiseSub=C3" },
      I_NURI,
    ],
    fullText: [...group("age-0-1"), ...group("age-2")],
  },

  // ── 누리과정 ──
  {
    id: "nuri-5",
    track: "nuri",
    name: "5세 누리과정",
    notices: ["교육과학기술부 고시 제2011-30호", "보건복지부 고시 제2011-106호"],
    announced: "2011-09-05",
    effectiveFrom: null,
    effectiveText: "2012년 3월부터 적용",
    ages: "만 5세",
    areas: ["신체운동·건강", "의사소통", "사회관계", "예술경험", "자연탐구"],
    features: [
      "유치원과 어린이집에 다니는 모든 만 5세에게 같은 공통과정을 적용했어요.",
      "기본생활습관과 바른 인성을 강조하고, 놀이 중심의 통합과정과 초등학교와의 연계를 고려했어요.",
    ],
    sources: [GWE, I_NURI],
  },
  {
    id: "nuri-3-5",
    track: "nuri",
    name: "3~5세 연령별 누리과정",
    notices: ["교육과학기술부 고시 제2012-16호", "보건복지부 고시 제2012-82호"],
    announced: "2012-07-10",
    effectiveFrom: "2013-03-01",
    ages: "만 3~5세",
    ageLevels: "3세 / 4세 / 5세 (연령별 구성)",
    areas: ["신체운동·건강", "의사소통", "사회관계", "예술경험", "자연탐구"],
    features: [
      "5세 누리과정을 3~4세까지 넓혀, 유치원·어린이집 어디에 다니든 3~5세가 같은 공통과정을 받게 되었어요.",
      "기본생활습관과 바른 인성에 중점을 두고, 만 3~5세 발달 특성에 맞춰 연령별로 구성했어요(하루 3~5시간 기준).",
      "초등학교 교육과정, 0~2세 표준보육과정과의 연계를 고려했어요.",
    ],
    sources: [
      { label: "교육부 · 교육과학기술부 고시 제2012-16호", url: "https://www.moe.go.kr/boardCnts/view.do?boardID=312&lev=0&statusYN=W&s=moe&m=03&opType=N&boardSeq=49147" },
      GWE,
      I_NURI,
    ],
  },
  {
    id: "nuri-2015",
    track: "nuri",
    name: "3~5세 연령별 누리과정 (2015 일부 개정)",
    notices: ["교육부 고시 제2015-61호"],
    announced: "2015-02-24",
    effectiveFrom: "2015-03-01",
    ages: "만 3~5세",
    ageLevels: "3세 / 4세 / 5세",
    areas: ["신체운동·건강", "의사소통", "사회관계", "예술경험", "자연탐구"],
    features: ["하루 운영시간 기준을 ‘3~5시간’에서 ‘4~5시간’으로 바꿨어요. 나머지 내용은 3~5세 연령별 누리과정과 같아요."],
    sources: [
      { label: "교육부 · 2015 개정 유치원 교육과정(3-5세 연령별 누리과정)", url: "https://www.moe.go.kr/boardCnts/view.do?boardID=312&boardSeq=58557&lev=0&m=0301" },
      GWE,
    ],
  },
  {
    id: "nuri-2019",
    track: "nuri",
    name: "2019 개정 누리과정",
    notices: [
      "교육부 고시 제2019-189호",
      "보건복지부 고시 제2019-152호",
      "교육부고시 제2024-12호 (2024.6.27 보육 업무 교육부 이관에 따른 재제정, 주요 내용 변경 없음)",
    ],
    announced: "2019-07-24",
    effectiveFrom: "2020-03-01",
    ages: "만 3~5세",
    ageLevels: "연령 구분 없이 3~5세 통합",
    areas: ["신체운동·건강", "의사소통", "사회관계", "예술경험", "자연탐구"],
    features: [
      "유아중심·놀이중심 교육과정으로 바뀌었어요.",
      "누리과정을 ‘3~5세 유아를 위한 국가 수준의 공통 교육과정’으로 명시하고, 성격과 추구하는 인간상을 새로 두었어요.",
      "5개 영역은 유지하되, 연령별 세부내용 369개를 연령 통합 59개로 줄여 현장의 자율성을 넓혔어요.",
      "하루 4~5시간을 기준으로 하고, 바깥 놀이를 포함해 놀이가 충분하도록 운영해요.",
    ],
    sources: [
      { label: "교육부 · 2019 개정 누리과정 고시문", url: "https://www.moe.go.kr/boardCnts/viewRenew.do?boardID=312&boardSeq=79419&lev=0" },
      { label: "교육부 보도자료(2019.7.19)", url: "https://moe.go.kr/boardCnts/view.do?boardID=294&boardSeq=78061&lev=0&searchType=null&statusYN=W&page=1&s=moe&m=020402&opType=N" },
      I_NURI,
      MOE_2024_TRANSFER,
    ],
    fullText: group("age-3-5"),
  },
];

// 정렬·연도 표시용 날짜 (시행일이 없으면 고시일)
export const sortKey = (e: Edition) => e.effectiveFrom ?? e.announced ?? "0000";

// 오늘(YYYY-MM-DD) 기준 과정별로 현재 적용 중인 판
export function currentEditionIds(today: string): string[] {
  return (Object.keys(TRACK_LABEL) as Track[]).flatMap((track) => {
    const live = editions
      .filter((e) => e.track === track && e.effectiveFrom && e.effectiveFrom <= today)
      .sort((a, b) => b.effectiveFrom!.localeCompare(a.effectiveFrom!));
    return live[0] ? [live[0].id] : [];
  });
}
