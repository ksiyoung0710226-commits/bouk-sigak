import Link from "next/link";

const cards = [
  { href: "/curriculum", t: "보육과정", d: "주기마다 바뀌는 보육과정을 한눈에 정리해요.", e: "📚" },
  { href: "/knowledge", t: "아동보육 필수지식", d: "발달이론, 영유아 발달, 교재교구 등 12개 주제의 기본 지식.", e: "🧠" },
  { href: "/community", t: "커뮤니티", d: "고민, 조언, 응원을 나누는 재학생·교사 공간.", e: "💬" },
  { href: "/tips", t: "교사 노하우", d: "놀이자료 활용법과 추천 방법을 교사끼리 공유.", e: "🧸" },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <section className="rounded-3xl bg-soft p-10 text-center">
        <h1 className="text-4xl font-bold text-brand-dark">보육시각</h1>
        <p className="mt-4 text-lg">
          아동보육과 재학생과 현장 보육교사가
          <br />
          함께 배우고 나누는 공간입니다.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/community" className="rounded-full bg-brand px-6 py-2 font-medium text-white hover:bg-brand-dark">
            커뮤니티 둘러보기
          </Link>
          <Link href="/curriculum" className="rounded-full border border-brand px-6 py-2 font-medium text-brand-dark hover:bg-white">
            보육과정 보기
          </Link>
        </div>
      </section>
      <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.href} href={c.href} className="rounded-2xl border border-line bg-white p-6 transition hover:shadow-md">
            <div className="text-3xl">{c.e}</div>
            <h2 className="mt-3 text-lg font-bold">{c.t}</h2>
            <p className="mt-1 text-sm text-foreground/70">{c.d}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
