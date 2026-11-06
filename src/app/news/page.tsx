import { Suspense } from "react";
import PageTitle from "@/components/PageTitle";
import { getNews } from "@/lib/news";

export const metadata = { title: "관련 뉴스 | educare insight" };

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });

async function NewsList() {
  const { items, fetchedAt, ok } = await getNews();
  if (!ok || items.length === 0)
    return <p className="card p-8 text-center text-foreground/70">지금은 뉴스를 불러오지 못했어요. 잠시 후 다시 들어와 주세요.</p>;
  return (
    <>
      <p className="mb-3 text-xs text-foreground/60">마지막 업데이트: {fmt(fetchedAt)} · 최근 7일 기사 {items.length}건</p>
      <ul className="card divide-y divide-line">
        {items.map((n) => (
          <li key={n.link}>
            <a href={n.link} target="_blank" rel="noopener noreferrer" className="block p-4 hover:bg-soft">
              <p className="font-medium"><span className={`mr-1.5 rounded-full border border-ink px-2 py-0.5 align-middle text-xs font-bold ${n.topic === "유치원" ? "bg-[#a8dcff]" : "bg-lime"}`}>{n.topic}</span>{n.title}</p>
              <p className="mt-1 text-xs text-foreground/60">{n.source} · {fmt(n.publishedAt)} ↗</p>
            </a>
          </li>
        ))}
      </ul>
    </>
  );
}

export default function NewsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <PageTitle
        title="관련 뉴스"
        desc="구글 뉴스에 올라온 아동보육(어린이집)과 유아교육(유치원) 관련 최신 기사를 함께 모아 보여 줘요. 몇 분마다 자동으로 새 기사가 반영돼요."
      />
      <p className="mb-6 note p-3 text-sm">
        제목을 누르면 기사 원문(언론사 사이트)이 새 창으로 열려요. 기사 내용은 각 언론사의 것이며, educare insight가 내용을 확인하거나 보증하지 않아요.
      </p>
      <Suspense fallback={<p className="text-foreground/60">뉴스를 불러오는 중…</p>}>
        <NewsList />
      </Suspense>
    </div>
  );
}
