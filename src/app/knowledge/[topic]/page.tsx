import Link from "next/link";
import { notFound } from "next/navigation";
import PageTitle from "@/components/PageTitle";
import { getTopic, topics } from "@/lib/topics";

export function generateStaticParams() {
  return topics.map((t) => ({ topic: t.slug }));
}

export async function generateMetadata(props: PageProps<"/knowledge/[topic]">) {
  const { topic } = await props.params;
  const t = getTopic(topic);
  return { title: t ? `${t.title} | 보육시각` : "보육시각" };
}

export default async function TopicPage(props: PageProps<"/knowledge/[topic]">) {
  const { topic } = await props.params;
  const t = getTopic(topic);
  if (!t) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link href="/knowledge" className="text-sm text-brand-dark hover:underline">← 필수지식 전체 보기</Link>
      <div className="mt-3">
        <PageTitle title={`${t.emoji} ${t.title}`} desc={t.summary} />
      </div>

      <div className="mb-8 flex flex-wrap gap-2 text-sm">
        {topics.map((x) => (
          <Link key={x.slug} href={`/knowledge/${x.slug}`}
            className={`rounded-full px-3 py-1 ${x.slug === t.slug ? "bg-brand text-white" : "bg-soft hover:bg-line"}`}>
            {x.title}
          </Link>
        ))}
      </div>

      <div className="space-y-5">
        {t.sections.map((s) => (
          <article key={s.heading} className="rounded-2xl border border-line bg-white p-6">
            <h2 className="text-xl font-bold text-brand-dark">{s.heading}</h2>
            {s.intro && <p className="mt-3">{s.intro}</p>}
            {s.bullets && (
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm">
                {s.bullets.map((b) => <li key={b}>{b}</li>)}
              </ul>
            )}
            {s.note && <p className="mt-4 rounded-xl bg-soft p-3 text-sm">💡 {s.note}</p>}
          </article>
        ))}
      </div>
    </div>
  );
}
