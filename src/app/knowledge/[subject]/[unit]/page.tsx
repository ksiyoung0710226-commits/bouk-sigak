import Link from "next/link";
import { notFound } from "next/navigation";
import References from "@/components/References";
import { getSubject, getUnit, subjects } from "@/lib/knowledge";

export function generateStaticParams() {
  return subjects.flatMap((s) => s.units.map((u) => ({ subject: s.slug, unit: u.slug })));
}

export async function generateMetadata(props: PageProps<"/knowledge/[subject]/[unit]">) {
  const { subject, unit } = await props.params;
  const u = getUnit(subject, unit);
  return { title: u ? `${u.title} | educare insight` : "educare insight" };
}

export default async function UnitPage(props: PageProps<"/knowledge/[subject]/[unit]">) {
  const { subject, unit } = await props.params;
  const s = getSubject(subject);
  const u = getUnit(subject, unit);
  if (!s || !u) notFound();

  const idx = s.units.findIndex((x) => x.slug === u.slug);
  const prev = s.units[idx - 1];
  const next = s.units[idx + 1];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <nav className="text-sm text-brand-dark">
        <Link href="/knowledge" className="hover:underline">아동 필수 지식</Link>
        {" › "}
        <Link href={`/knowledge/${s.slug}`} className="hover:underline">{s.title}</Link>
      </nav>

      <h1 className="sticker mt-3 text-4xl sm:text-5xl">{u.title}</h1>
      <p className="mt-2 text-foreground/70">{u.summary}</p>

      <section aria-label="핵심 키워드" className="panel-lav mt-6 p-5">
        <p className="mb-3 font-display text-lg">🔑 핵심 키워드</p>
        <div className="flex flex-wrap gap-2">
          {u.keywords.map((k) => (
            <span key={k} className="kw text-sm">{k}</span>
          ))}
        </div>
      </section>

      <div className="mt-6 space-y-5">
        {u.sections.map((sec) => (
          <article key={sec.heading} className="card p-6">
            <h2 className="text-xl font-bold text-brand-dark">{sec.heading}</h2>
            {sec.intro && <p className="mt-3">{sec.intro}</p>}
            {sec.bullets && (
              <ul className="mt-3 list-disc space-y-2 pl-5 text-[15px]">
                {sec.bullets.map((b) => <li key={b}>{b}</li>)}
              </ul>
            )}
            {sec.note && <p className="note mt-4 p-3 text-sm">💡 {sec.note.replace(/^💡\s*/, "")}</p>}
          </article>
        ))}
      </div>

      <References items={s.references ?? []} />

      <div className="mt-8 flex justify-between gap-3 text-sm">
        {prev ? (
          <Link href={`/knowledge/${s.slug}/${prev.slug}`} className="card-sm px-4 py-3 hover:bg-soft">← {prev.title}</Link>
        ) : <span />}
        {next && (
          <Link href={`/knowledge/${s.slug}/${next.slug}`} className="card-sm px-4 py-3 text-right hover:bg-soft">{next.title} →</Link>
        )}
      </div>
    </div>
  );
}
