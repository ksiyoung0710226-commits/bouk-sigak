import PageTitle from "@/components/PageTitle";

export const metadata = { title: "교사 노하우 | 보육시각" };

const samples = [
  { t: "신문지 놀이, 이렇게 확장했어요", m: "만 2세 · 감각놀이", n: 9 },
  { t: "자연물 분류 놀이자료 활용법", m: "만 4세 · 자연탐구", n: 6 },
];

export default function Tips() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <PageTitle title="교사 노하우" desc="현장 교사가 놀이자료 활용 방법과 추천 노하우를 공유하는 공간입니다." />
      <p className="mb-4 rounded-xl bg-soft p-3 text-sm">
        ※ 이 게시판은 가입 시 &lsquo;현장 교사&rsquo;를 선택한 회원만 글을 쓸 수 있도록 만들 예정입니다. 지금은 화면 미리보기입니다.
      </p>
      <ul className="grid gap-4 sm:grid-cols-2">
        {samples.map((s) => (
          <li key={s.t} className="rounded-2xl border border-line bg-white p-5">
            <p className="text-xs text-brand-dark">{s.m}</p>
            <h2 className="mt-1 font-bold">{s.t}</h2>
            <p className="mt-2 text-sm text-foreground/60">추천 {s.n}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
