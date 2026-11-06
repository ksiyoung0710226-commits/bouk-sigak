import Link from "next/link";
import PageTitle from "@/components/PageTitle";

export const metadata = { title: "보육시각이란? | 보육시각" };

const features = [
  { href: "/curriculum", e: "📚", t: "보육과정", d: "교육부 고시문을 바탕으로 표준보육과정과 누리과정의 영역·내용을 정리했어요." },
  { href: "/knowledge", e: "🧠", t: "아동보육 필수지식", d: "발달이론, 영유아 발달, 관찰, 건강·안전 등 아동보육과에서 꼭 알아야 할 기본 지식을 과목별로 모았어요." },
  { href: "/community", e: "💬", t: "커뮤니티", d: "재학생과 현장 교사가 고민을 나누고, 조언하고, 서로 응원하는 공간이에요." },
  { href: "/qna", e: "🙋", t: "Q&A", d: "실습·수업·현장에 대해 묻고 답해요. 인증된 현장 교사의 답변에는 표시가 붙어요." },
  { href: "/news", e: "📰", t: "보육 뉴스", d: "구글 뉴스에 올라온 최신 보육 소식을 자동으로 모아 보여 줘요." },
  { href: "/inquiry", e: "💌", t: "1:1 문의", d: "궁금한 점이나 불편한 점을 관리자에게 바로 보낼 수 있어요." },
];

export default function About() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <PageTitle title="보육시각이란?" />
      <section className="panel-lav space-y-3 p-6 text-base leading-relaxed">
        <p>
          <b>보육시각</b>은 <span className="hl font-bold">아동보육과 재학생과 현장 보육교사가 함께 배우고 나누는 공간</span>이에요.
        </p>
        <p>
          학교에서 배우는 보육과정과 기본 이론을 한곳에서 찾아보고, 현장에 있는 선배 교사들과 고민과 경험을 나눌 수 있도록 만들었어요.
          재학생에게는 현장을 미리 들여다보는 창이, 교사에게는 동료와 후배를 만나는 자리가 되었으면 해요.
        </p>
      </section>

      <h2 className="mt-10 mb-4 text-2xl font-bold">이런 걸 할 수 있어요</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {features.map((f) => (
          <Link key={f.href} href={f.href} className="card p-5">
            <p className="text-lg font-bold">{f.e} {f.t}</p>
            <p className="mt-1 text-sm text-foreground/75">{f.d}</p>
          </Link>
        ))}
      </div>

      <section className="mt-10 note space-y-2 p-5 text-sm">
        <p className="font-bold">알아 두세요</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <span className="hl-blue">이 웹사이트는 정확한 자료 제공을 위해 노력하나, 꼭 전공 서적을 참고하여 주시기 바랍니다.</span>
          </li>
          <li>커뮤니티와 Q&amp;A 글은 누구나 읽을 수 있고, 글쓰기·댓글·1:1 채팅·1:1 문의는 가입한 회원만 이용할 수 있어요.</li>
          <li>아동·학부모·기관의 실명이나 개인정보는 쓰지 말아 주세요.</li>
        </ul>
      </section>
    </div>
  );
}
