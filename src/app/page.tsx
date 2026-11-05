import Link from "next/link";

const cards = [
  { href: "/curriculum", t: "보육과정", d: "주기마다 바뀌는 보육과정을 한눈에 정리해요.", e: "📚" },
  { href: "/knowledge", t: "아동보육 필수지식", d: "발달이론, 영유아 발달, 교재교구 등 12개 주제의 기본 지식.", e: "🧠" },
  { href: "/community", t: "커뮤니티", d: "고민, 조언, 응원을 나누는 재학생·교사 공간.", e: "💬" },
  { href: "/qna", t: "Q&A", d: "재학생이 묻고 현장 교사가 답하는 질문·답변 공간.", e: "🙋" },
  { href: "/news", t: "보육 뉴스", d: "구글 뉴스에 올라온 최신 보육 소식을 모아 봐요.", e: "📰" },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <section className="panel-lav p-10 text-center shadow-[5px_5px_0_var(--ink)]">
        <h1 className="logo-font text-6xl sm:text-7xl">보육시각</h1>
        <p className="mt-4 text-lg">
          아동보육과 재학생과 현장 보육교사가
          <br />
          <span className="hl font-bold">함께 배우고 나누는 공간</span>입니다.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/community" className="rounded-full border-2 border-ink bg-sun px-6 py-2 font-bold text-ink shadow-[3px_3px_0_var(--ink)] hover:translate-x-px hover:translate-y-px hover:shadow-[2px_2px_0_var(--ink)]">
            커뮤니티 둘러보기
          </Link>
          <Link href="/curriculum" className="rounded-full border-2 border-ink bg-white px-6 py-2 font-bold text-ink shadow-[3px_3px_0_var(--ink)] hover:translate-x-px hover:translate-y-px hover:shadow-[2px_2px_0_var(--ink)]">
            보육과정 보기
          </Link>
        </div>
      </section>
      <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.href} href={c.href} className="card p-6">
            <div className="text-3xl">{c.e}</div>
            <h2 className="mt-3 text-lg font-bold">{c.t}</h2>
            <p className="mt-1 text-sm text-foreground/70">{c.d}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
