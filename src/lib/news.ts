import { cacheLife } from "next/cache";

export type NewsItem = { title: string; link: string; source: string; publishedAt: string };

// 구글 뉴스 RSS 검색 결과(제목·언론사·날짜·링크만 사용, 기사 본문은 가져오지 않음)
const QUERY = "(보육 OR 어린이집 OR 보육교사 OR 영유아) when:7d";
const FEED = `https://news.google.com/rss/search?q=${encodeURIComponent(QUERY)}&hl=ko&gl=KR&ceid=KR:ko`;

const decode = (s: string) =>
  s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
    .trim();

const tag = (xml: string, name: string) => {
  const m = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`));
  return m ? decode(m[1]) : "";
};

export async function getNews(): Promise<{ items: NewsItem[]; fetchedAt: string; ok: boolean }> {
  "use cache";
  // 5분마다 새로 가져옴(방문자가 있을 때 뒤에서 갱신)
  cacheLife({ stale: 60, revalidate: 300, expire: 3600 });
  const fetchedAt = new Date().toISOString();
  try {
    const res = await fetch(FEED, { headers: { "User-Agent": "Mozilla/5.0 (educare-insight news)" } });
    if (!res.ok) return { items: [], fetchedAt, ok: false };
    const xml = await res.text();
    const seen = new Set<string>();
    const items: NewsItem[] = [];
    for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
      const it = m[1];
      const source = tag(it, "source");
      let title = tag(it, "title");
      if (source && title.endsWith(` - ${source}`)) title = title.slice(0, -(source.length + 3));
      const link = tag(it, "link");
      const date = new Date(tag(it, "pubDate"));
      // 구글 뉴스 링크만 허용(데이터에 이상한 링크가 섞여도 열지 않도록)
      if (!title || !link.startsWith("https://news.google.com/") || isNaN(date.getTime())) continue;
      if (seen.has(title)) continue;
      seen.add(title);
      items.push({ title, link, source: source || "언론사 미상", publishedAt: date.toISOString() });
    }
    items.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
    return { items: items.slice(0, 40), fetchedAt, ok: true };
  } catch {
    return { items: [], fetchedAt, ok: false };
  }
}
