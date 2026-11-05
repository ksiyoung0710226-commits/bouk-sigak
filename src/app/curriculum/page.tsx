import PageTitle from "@/components/PageTitle";
import CurriculumView from "@/components/CurriculumView";
import { ageGroups } from "@/lib/curriculum";

export const metadata = { title: "보육과정 | 보육시각" };

export default function Curriculum() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <PageTitle
        title="보육과정"
        desc="2024 개정 표준보육과정(0~2세)과 2019 개정 누리과정(3~5세)의 영역별 내용범주와 내용입니다."
      />
      <CurriculumView groups={ageGroups} />
      <p className="mt-10 note p-4 text-sm">
        ※ 내용범주와 내용은 교육부 고시문 원문을 옮긴 것입니다. 일부 영역(0~2세 신체운동·건강, 의사소통)의
        목표 문구는 원문 확인 후 추가할 예정입니다. 정확한 사용 전에는 반드시 공식 고시문과 해설서를 확인해 주세요.
      </p>
    </div>
  );
}
