import PageTitle from "@/components/PageTitle";

export const metadata = { title: "커뮤니티 | 보육시각" };

const categories = ["고민상담", "조언", "응원", "실습 이야기"];
const samples = [
  { c: "고민상담", t: "첫 실습 앞두고 너무 떨려요", by: "재학생", n: 4 },
  { c: "조언", t: "영아반 적응기간, 이렇게 해보세요", by: "현장 교사", n: 7 },
  { c: "응원", t: "오늘도 고생 많으셨어요 :)", by: "현장 교사", n: 12 },
];

export default function Community() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <PageTitle title="커뮤니티" desc="재학생과 현장 교사가 고민을 나누고 서로 응원하는 공간입니다." />
      <div className="mb-4 flex flex-wrap gap-2">
        {categories.map((c) => (
          <span key={c} className="rounded-full bg-soft px-3 py-1 text-sm">{c}</span>
        ))}
      </div>
      <p className="mb-4 rounded-xl bg-soft p-3 text-sm">
        ※ 현재는 화면 미리보기입니다. 회원가입, 글쓰기, 댓글 기능은 데이터베이스 연결 후 열릴 예정이에요.
      </p>
      <ul className="divide-y divide-line rounded-2xl border border-line bg-white">
        {samples.map((s) => (
          <li key={s.t} className="flex items-center justify-between p-4">
            <div>
              <span className="text-xs text-brand-dark">[{s.c}]</span>
              <p className="font-medium">{s.t}</p>
              <p className="text-xs text-foreground/60">{s.by}</p>
            </div>
            <span className="text-sm text-foreground/60">댓글 {s.n}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
