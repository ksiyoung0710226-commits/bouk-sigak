import PageTitle from "@/components/PageTitle";
import { curriculumAreas } from "@/lib/content";

export const metadata = { title: "보육과정 | 보육시각" };

export default function Curriculum() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <PageTitle title="보육과정" desc="연령별 보육과정의 영역을 정리했어요. 주기마다 최신 내용으로 업데이트할 예정입니다." />
      <div className="grid gap-6 md:grid-cols-2">
        {Object.entries(curriculumAreas).map(([age, areas]) => (
          <section key={age} className="rounded-2xl border border-line bg-white p-6">
            <h2 className="text-xl font-bold text-brand-dark">{age}</h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {areas.map((a) => (
                <li key={a} className="rounded-full bg-soft px-3 py-1 text-sm">{a}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <p className="mt-8 rounded-xl bg-soft p-4 text-sm">
        ※ 상세 내용(연령별 목표, 월별 주제 등)은 공식 보육과정 자료를 확인한 뒤 추가할 예정입니다.
      </p>
    </div>
  );
}
