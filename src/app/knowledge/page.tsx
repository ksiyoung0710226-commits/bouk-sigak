import PageTitle from "@/components/PageTitle";
import { knowledge } from "@/lib/content";

export const metadata = { title: "보육지식 | 보육시각" };

export default function Knowledge() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <PageTitle title="보육지식" desc="재학 중 꼭 알아야 할 핵심 지식을 모았어요." />
      <div className="grid gap-4 sm:grid-cols-2">
        {knowledge.map((k) => (
          <article key={k.title} className="rounded-2xl border border-line bg-white p-6">
            <h2 className="text-lg font-bold">{k.title}</h2>
            <p className="mt-2 text-sm text-foreground/80">{k.body}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
