import Link from "next/link";
import { AI_ENABLED } from "@/lib/features";

const cards = [
  { href: "/curriculum", t: "표준보육과정 · 누리과정", d: "주기마다 바뀌는 표준보육과정과 누리과정을 한눈에 정리해요.", e: "📚" },
  { href: "/knowledge", t: "아동 필수 지식", d: "발달·보육·유아교육·관찰평가·부모교육 14개 과목 197개 단원. 검색도 돼요.", e: "🧠" },
  { href: "/community", t: "커뮤니티", d: "고민, 조언, 응원을 나누는 재학생·교사 공간.", e: "💬" },
  { href: "/qna", t: "Q&A", d: "재학생이 묻고 현장 교사가 답하는 질문·답변 공간.", e: "🙋" },
  { href: "/prospective", t: "예비 재학생을 위한 질문 모음집", d: "입학을 준비하는 분들이 자주 묻는 질문과 답을 모았어요.", e: "🌱" },
  { href: "/news", t: "관련 뉴스", d: "어린이집·유치원 관련 최신 소식을 모아 봐요.", e: "📰" },
  { href: "/quiz", t: "퀴즈", d: "배운 내용을 퀴즈로 풀어 보며 확인해요.", e: "✏️" },
  { href: "/ask", t: "AI에게 질문하기", d: "보육·유아교육에 특화된 AI에게 질문해 보세요. 사이트의 모든 자료를 바탕으로 답해요.", e: "🤖" },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <section className="panel-lav px-4 py-8 sm:p-10 text-center shadow-[5px_5px_0_var(--ink)]">
        <h1 className="logo-font flex flex-wrap items-center justify-center gap-2 text-4xl sm:text-7xl">
          educare insight
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mascot.svg" alt="" aria-hidden width={56} height={56} className="h-12 w-12 sm:h-14 sm:w-14" />
        </h1>
        <p className="mt-4 text-lg">
             아동보육과 유아교육과 교사들을 위한 페이지
          <br />
          <span className="hl font-bold">함께 배우고 나누는 페이지</span>입니다.
        </p>
        <div className="mt-6 flex justify-center">
          <Link href="/about" className="rounded-full border-2 border-ink bg-sun px-6 py-2 font-bold text-ink shadow-[3px_3px_0_var(--ink)] hover:translate-x-px hover:translate-y-px hover:shadow-[2px_2px_0_var(--ink)]">
            educare insight란?
          </Link>
        </div>
      </section>
      <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.filter((c) => AI_ENABLED || c.href !== "/ask").map((c) => (
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
