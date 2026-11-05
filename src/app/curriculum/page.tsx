import { cacheLife } from "next/cache";
import PageTitle from "@/components/PageTitle";
import CurriculumTabs from "@/components/CurriculumTabs";
import References from "@/components/References";
import { editions, currentEditionIds } from "@/lib/curriculum-history";
import { curriculumPageSources } from "@/lib/knowledge/sources";

export const metadata = { title: "보육과정 | 보육시각" };

// 오늘 날짜(한국 시간) 기준으로 '현재 적용 중'인 과정을 고른다. 1시간마다 다시 계산.
async function todayKST() {
  "use cache";
  cacheLife({ stale: 300, revalidate: 3600, expire: 86400 });
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" }); // YYYY-MM-DD
}

export default async function Curriculum() {
  const today = await todayKST();
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <PageTitle
        title="보육과정"
        desc="지금까지 나온 표준보육과정과 누리과정을 한곳에 모았어요. 현재 적용 중인 과정은 고시문 원문을, 지난 과정은 요약을 볼 수 있어요."
      />
      <CurriculumTabs editions={editions} currentIds={currentEditionIds(today)} />
      <References items={curriculumPageSources} />
      <p className="mt-10 note p-4 text-sm">
        ※ 현재 적용 중인 과정의 내용범주와 내용은 교육부 고시문 원문을 옮긴 것이고, 지난 과정은 공식 자료를 바탕으로 요약한 것이에요.
        정확한 사용 전에는 반드시 공식 고시문과 해설서를 확인해 주세요.
      </p>
    </div>
  );
}
