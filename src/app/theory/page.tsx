import PageTitle from "@/components/PageTitle";
import { theories } from "@/lib/content";

export const metadata = { title: "발달이론 | 보육시각" };

export default function Theory() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <PageTitle title="발달이론" desc="아동보육과 재학생이라면 꼭 알아야 할 기본 이론입니다." />
      <div className="space-y-6">
        {theories.map((t) => (
          <article key={t.name} className="rounded-2xl border border-line bg-white p-6">
            <h2 className="text-xl font-bold text-brand-dark">{t.name}</h2>
            <p className="text-sm text-foreground/60">{t.who}</p>
            <p className="mt-3">{t.summary}</p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
              {t.points.map((p) => <li key={p}>{p}</li>)}
            </ul>
            <p className="mt-4 rounded-xl bg-soft p-3 text-sm">💡 현장 적용: {t.practice}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
