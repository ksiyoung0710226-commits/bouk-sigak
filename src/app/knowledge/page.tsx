import PageTitle from "@/components/PageTitle";
import { knowledge, theories } from "@/lib/content";

export const metadata = { title: "아동보육 필수지식 | 보육시각" };

export default function Knowledge() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <PageTitle
        title="아동보육 필수지식"
        desc="아동보육과 재학생과 현장 교사에게 필요한 기본 지식을 모았어요."
      />

      <nav className="mb-8 flex gap-2 text-sm">
        <a href="#basics" className="rounded-full bg-soft px-4 py-1.5 font-medium hover:bg-line">보육 기본 지식</a>
        <a href="#theory" className="rounded-full bg-soft px-4 py-1.5 font-medium hover:bg-line">발달이론</a>
      </nav>

      <section id="basics" className="scroll-mt-24">
        <h2 className="mb-4 text-2xl font-bold">보육 기본 지식</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {knowledge.map((k) => (
            <article key={k.title} className="rounded-2xl border border-line bg-white p-6">
              <h3 className="text-lg font-bold">{k.title}</h3>
              <p className="mt-2 text-sm text-foreground/80">{k.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="theory" className="mt-14 scroll-mt-24">
        <h2 className="mb-1 text-2xl font-bold">발달이론</h2>
        <p className="mb-4 text-sm text-foreground/70">꼭 알아야 할 기본 이론입니다.</p>
        <div className="space-y-6">
          {theories.map((t) => (
            <article key={t.name} className="rounded-2xl border border-line bg-white p-6">
              <h3 className="text-xl font-bold text-brand-dark">{t.name}</h3>
              <p className="text-sm text-foreground/60">{t.who}</p>
              <p className="mt-3">{t.summary}</p>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
                {t.points.map((p) => <li key={p}>{p}</li>)}
              </ul>
              <p className="mt-4 rounded-xl bg-soft p-3 text-sm">💡 현장 적용: {t.practice}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
