import type { Subject } from "./types";
import { subjectSources } from "./sources";
import { developmentSubject } from "./development";
import { curriculumSubject } from "./curriculum-theory";
import { teacherCharacterSubject } from "./teacher-character";
import { specialNeedsSubject } from "./special-needs";
import { adminSubject } from "./admin";
import { assessmentSubject } from "./assessment";
import { programSubject } from "./program";
import { healthSubject } from "./health";
import { observationSubject } from "./observation";
import { eceIntroSubject } from "./ece-intro";
import { playGuidanceSubject } from "./play-guidance";
import { languageLiteratureSubject } from "./language-literature";
import { mathScienceSubject } from "./math-science";
import { parentEducationSubject } from "./parent-education";


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
  // 유아교육 전공 과목 (2026-11-06 추가)
  eceIntroSubject,
  playGuidanceSubject,
  languageLiteratureSubject,
  mathScienceSubject,
  parentEducationSubject,
];

export const subjects: Subject[] = base.map((s) => ({ ...s, references: subjectSources[s.slug] ?? [] }));

export const getSubject = (slug: string) => subjects.find((s) => s.slug === slug);
export const getUnit = (subject: string, unit: string) =>
  getSubject(subject)?.units.find((u) => u.slug === unit);

// 과목 묶음(아동 필수 지식 첫 화면). 새 과목을 만들면 여기에도 slug를 넣을 것.
export const subjectGroups: { title: string; emoji: string; desc: string; slugs: string[] }[] = [
  { title: "발달", emoji: "👶", desc: "영유아의 성장과 발달, 특별한 지원이 필요한 아동 이해", slugs: ["development", "special-needs"] },
  { title: "보육", emoji: "🏠", desc: "어린이집 보육과정, 보육교사, 운영과 건강·안전", slugs: ["curriculum", "teacher-character", "program", "admin-practice", "child-health"] },
  { title: "유아교육", emoji: "🏫", desc: "유치원·유아교육 전공의 핵심 과목", slugs: ["ece-intro", "play-guidance", "language-literature", "math-science"] },
  { title: "관찰·평가", emoji: "🔍", desc: "영유아를 관찰하고 기록하고 평가하는 방법", slugs: ["observation", "assessment"] },
  { title: "가족·부모", emoji: "👨‍👩‍👧", desc: "부모교육과 가정과의 협력", slugs: ["parent-education"] },
];

// 검색용 가벼운 목록(본문 문장 대신 제목·요약·키워드·소제목만)
export const searchIndex = subjects.flatMap((s) =>
  s.units.map((u) => ({
    subject: s.slug, subjectTitle: s.title, emoji: s.emoji,
    unit: u.slug, title: u.title, summary: u.summary, keywords: u.keywords,
    headings: u.sections.map((x) => x.heading),
  })),
);
export type SearchItem = (typeof searchIndex)[number];
