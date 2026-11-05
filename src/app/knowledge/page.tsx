import Link from "next/link";
import PageTitle from "@/components/PageTitle";
import { topics } from "@/lib/topics";

export const metadata = { title: "아동보육 필수지식 | 보육시각" };

export default function Knowledge() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <PageTitle
        title="아동보육 필수지식"
        desc="아동보육과 재학생과 현장 교사에게 필요한 지식을 주제별로 모았어요."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {topics.map((t) => (
          <Link key={t.slug} href={`/knowledge/${t.slug}`} className="rounded-2xl border border-line bg-white p-6 transition hover:shadow-md">
            <div className="text-3xl">{t.emoji}</div>
            <h2 className="mt-3 text-lg font-bold">{t.title}</h2>
            <p className="mt-1 text-sm text-foreground/70">{t.summary}</p>
          </Link>
        ))}
      </div>
      <p className="mt-8 rounded-xl bg-soft p-4 text-sm">
        ※ 학습을 돕는 일반적인 개요입니다. 시험이나 현장 적용 전에는 교재와 최신 법령, 기관 지침을 함께 확인해 주세요.
      </p>
    </div>
  );
}
