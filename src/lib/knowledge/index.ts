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

export const subjects: Subject[] = base.map((s) => ({ ...s, references: subjectSources[s.slug] ?? [] }));

export const getSubject = (slug: string) => subjects.find((s) => s.slug === slug);
export const getUnit = (subject: string, unit: string) =>
  getSubject(subject)?.units.find((u) => u.slug === unit);
