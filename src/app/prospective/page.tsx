import Link from "next/link";
import PageTitle from "@/components/PageTitle";
import References from "@/components/References";
import { FAQ_GROUPS, FAQ_SOURCES } from "@/lib/prospective-faq";

export const metadata = { title: "예비 재학생을 위한 질문 모음집 | educare insight" };

export default function Prospective() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <PageTitle
        title="예비 재학생을 위한 질문 모음집"
        desc="유아교육과·아동보육과 입학을 준비하는 분들이 자주 묻는 질문을 모았어요. 질문을 누르면 답이 열려요."
      />
      <p className="-mt-4 mb-8 text-sm font-bold">
        <span className="hl-blue">자격 기준과 제도는 바뀔 수 있어요. 지원 전에는 꼭 학교와 공식 기관의 최신 안내를 확인해 주세요.</span>
      </p>
      <div className="space-y-8">
        {FAQ_GROUPS.map((g) => (
          <section key={g.title}>
            <h2 className="mb-3 text-2xl font-bold">{g.emoji} {g.title}</h2>
            <div className="space-y-3">
              {g.items.map((f) => (
                <details key={f.q} className="card group p-0">
                  <summary className="flex cursor-pointer list-none items-start gap-2 p-5 font-bold">
                    <span className="text-brand-dark">Q.</span>
                    <span className="flex-1">{f.q}</span>
                    <span aria-hidden className="transition-transform group-open:rotate-180">▾</span>
                  </summary>
                  <div className="space-y-2 border-t border-line px-5 pb-5 pt-3 text-[15px] leading-relaxed">
                    {f.a.map((p) => <p key={p}>{p}</p>)}
                    {f.links && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {f.links.map((l) =>
                          l.href.startsWith("/") ? (
                            <Link key={l.href} href={l.href} className="rounded-full border border-ink bg-lime/60 px-3 py-1 text-sm font-bold">{l.label}</Link>
                          ) : (
                            <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" className="rounded-full border border-ink bg-white px-3 py-1 text-sm font-bold">{l.label} ↗</a>
                          ),
                        )}
                      </div>
                    )}
                  </div>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>
      <p className="mt-10 card p-5 text-sm">
        🙋 여기 없는 질문이 있나요? <Link href="/qna" className="font-bold underline">Q&amp;A</Link>에서 <b>‘예비 재학생’</b> 분류로 질문해 주세요.
      </p>
      <References items={FAQ_SOURCES} />
    </div>
  );
}
