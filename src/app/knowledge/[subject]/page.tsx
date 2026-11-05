import Link from "next/link";
import { notFound } from "next/navigation";
import PageTitle from "@/components/PageTitle";
import References from "@/components/References";
import { getSubject, subjects } from "@/lib/knowledge";

export function generateStaticParams() {
  return subjects.map((s) => ({ subject: s.slug }));
}

export async function generateMetadata(props: PageProps<"/knowledge/[subject]">) {
  const { subject } = await props.params;
  const s = getSubject(subject);
  return { title: s ? `${s.title} | 보육시각` : "보육시각" };
}

export default async function SubjectPage(props: PageProps<"/knowledge/[subject]">) {
  const { subject } = await props.params;
  const s = getSubject(subject);
  if (!s) notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link href="/knowledge" className="text-sm text-brand-dark hover:underline">← 필수지식 전체 과목</Link>
      <div className="mt-3">
        <PageTitle title={`${s.emoji} ${s.title}`} desc={s.summary} />
      </div>
      <ol className="grid gap-3 sm:grid-cols-2">
        {s.units.map((u, i) => (
          <li key={u.slug}>
            <Link href={`/knowledge/${s.slug}/${u.slug}`} className="block h-full card p-5">
              <p className="text-xs text-brand-dark">단원 {i + 1}</p>
              <h2 className="mt-1 font-bold">{u.title}</h2>
              <p className="mt-1 text-sm text-foreground/70">{u.summary}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {u.keywords.map((k) => (
                  <span key={k} className="kw-sm">#{k}</span>
                ))}
              </div>
            </Link>
          </li>
        ))}
      </ol>
      <References items={s.references ?? []} />
    </div>
  );
}
