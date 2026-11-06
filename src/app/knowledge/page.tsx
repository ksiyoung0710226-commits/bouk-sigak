import Link from "next/link";
import PageTitle from "@/components/PageTitle";
import KnowledgeSearch from "@/components/KnowledgeSearch";
import { getSubject, searchIndex, subjectGroups } from "@/lib/knowledge";

export const metadata = { title: "아동 필수 지식 | educare insight" };

export default function Knowledge() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <PageTitle
        title="아동 필수 지식"
        desc="분야별로 과목을 묶었어요. 과목을 고르면 단원 목록이 나오고, 위 검색창에서 낱말로 단원을 바로 찾을 수도 있어요."
      />
      <p className="-mt-4 mb-6 text-base font-bold">
        <span className="hl-blue">이 웹사이트는 정확한 자료 제공을 위해 노력하나, 꼭 전공 서적을 참고하여 주시기 바랍니다.</span>
      </p>
      <KnowledgeSearch items={searchIndex}>
        <nav className="mb-8 flex flex-wrap gap-2 text-sm" aria-label="분야 바로가기">
          {subjectGroups.map((g) => (
            <a key={g.title} href={`#group-${g.title}`} className="rounded-full border border-ink bg-white px-3 py-1 font-bold hover:bg-lime/60">{g.emoji} {g.title}</a>
          ))}
        </nav>
        <div className="space-y-10">
          {subjectGroups.map((g) => (
            <section key={g.title} id={`group-${g.title}`} className="scroll-mt-24">
              <h2 className="text-2xl font-bold">{g.emoji} {g.title}</h2>
              <p className="mt-1 mb-4 text-sm text-foreground/70">{g.desc}</p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {g.slugs.map((slug) => getSubject(slug)).filter((s) => !!s).map((s) => (
                  <Link key={s.slug} href={`/knowledge/${s.slug}`} className="card p-6">
                    <div className="text-3xl">{s.emoji}</div>
                    <h3 className="mt-3 text-lg font-bold">{s.title}</h3>
                    <p className="mt-1 text-sm text-foreground/70">{s.summary}</p>
                    <p className="mt-3 text-xs font-medium text-brand-dark">{s.units.length}개 단원 →</p>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </KnowledgeSearch>
      <p className="mt-8 note p-4 text-sm">
        ※ 학습을 돕기 위한 정리 자료입니다. 각 과목 하단의 공식 기관 자료를 함께 확인하고, 법령과 제도는 최신 내용을 꼭 확인해 주세요.
      </p>
    </div>
  );
}
