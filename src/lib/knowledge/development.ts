import type { Subject } from "./types";
import { developmentUnitsA } from "./development-a";
import { developmentUnitsB } from "./development-b";

export const developmentSubject: Subject = {
  slug: "development",
  emoji: "👶",
  title: "영유아 발달",
  summary: "발달의 원리와 이론, 영역별 발달(신체·운동·인지·언어·정서·사회·도덕), 연령별 특성",
  units: [...developmentUnitsA, ...developmentUnitsB],
};
