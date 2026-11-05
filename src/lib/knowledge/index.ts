import type { Reference, Subject } from "./types";
import { developmentSubject } from "./development";
import { curriculumSubject } from "./curriculum-theory";
import { teacherCharacterSubject } from "./teacher-character";
import { specialNeedsSubject } from "./special-needs";
import { adminSubject } from "./admin";
import { assessmentSubject } from "./assessment";
import { programSubject } from "./program";
import { healthSubject } from "./health";
import { observationSubject } from "./observation";

const R = {
  moe: { name: "교육부", url: "https://www.moe.go.kr", note: "교육·보육과정 고시, 정책 자료" },
  mohw: { name: "보건복지부", url: "https://www.mohw.go.kr", note: "보육·복지 정책, 지침" },
  law: { name: "국가법령정보센터", url: "https://www.law.go.kr", note: "법령 원문과 최신 개정 확인" },
  inuri: { name: "i-누리(중앙육아종합지원센터)", url: "https://i-nuri.go.kr", note: "보육과정 고시문·해설서, 현장지원자료" },
  kicce: { name: "육아정책연구소(KICCE)", url: "https://www.kicce.re.kr", note: "영유아 정책·연구 보고서" },
  childcare: { name: "보육포털 아이사랑", url: "https://www.childcare.go.kr", note: "어린이집 운영·지침 안내" },
  nise: { name: "국가특수교육원", url: "https://www.nise.go.kr", note: "특수교육 자료와 지원 정보" },
  ncrc: { name: "아동권리보장원", url: "https://www.ncrc.or.kr", note: "아동 권리, 학대 예방 자료" },
  kdca: { name: "질병관리청", url: "https://www.kdca.go.kr", note: "감염병·예방접종 정보" },
  mfds: { name: "식품의약품안전처", url: "https://www.mfds.go.kr", note: "식품 안전·알레르기 정보" },
  safekorea: { name: "국민재난안전포털", url: "https://www.safekorea.go.kr", note: "안전·재난 대처 정보" },
} satisfies Record<string, Reference>;

const refs: Record<string, Reference[]> = {
  development: [R.inuri, R.kicce, R.kdca],
  curriculum: [R.moe, R.inuri, R.law],
  "teacher-character": [R.ncrc, R.law, R.mohw],
  "special-needs": [R.nise, R.moe, R.mohw, R.law],
  "admin-practice": [R.childcare, R.mohw, R.law],
  assessment: [R.kicce, R.mohw, R.inuri],
  program: [R.inuri, R.moe, R.kicce],
  "child-health": [R.kdca, R.mfds, R.mohw, R.safekorea],
  observation: [R.inuri, R.kicce],
};

const base: Subject[] = [
  developmentSubject,
  curriculumSubject,
  teacherCharacterSubject,
  specialNeedsSubject,
  adminSubject,
  assessmentSubject,
  programSubject,
  healthSubject,
  observationSubject,
];

export const subjects: Subject[] = base.map((s) => ({ ...s, references: refs[s.slug] ?? [] }));

export const getSubject = (slug: string) => subjects.find((s) => s.slug === slug);
export const getUnit = (subject: string, unit: string) =>
  getSubject(subject)?.units.find((u) => u.slug === unit);
