"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { SearchItem } from "@/lib/knowledge";

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, "");

// 아동 필수 지식 검색: 단원 제목·요약·키워드·소제목에서 찾는다. 띄어쓰기는 무시.
export default function KnowledgeSearch({ items, children }: { items: SearchItem[]; children: React.ReactNode }) {
  const [q, setQ] = useState("");
  const terms = norm(q) ? q.trim().split(/\s+/).map(norm).filter(Boolean) : [];

  const results = useMemo(() => {
    if (terms.length === 0) return [];
    return items
      .map((it) => {
        const title = norm(it.title), kw = it.keywords.map(norm), sum = norm(it.summary), hd = it.headings.map(norm), subj = norm(it.subjectTitle);
        let score = 0;
        for (const t of terms) {
          let hit = 0;
          if (title.includes(t)) hit += 5;
          if (kw.some((k) => k.includes(t))) hit += 4;
          if (hd.some((h) => h.includes(t))) hit += 2;
          if (sum.includes(t)) hit += 2;
          if (subj.includes(t)) hit += 1;
          if (!hit) return null; // 모든 낱말이 들어 있어야 함
          score += hit;
        }
        return { it, score };
      })
      .filter((x): x is { it: SearchItem; score: number } => !!x)
      .sort((a, b) => b.score - a.score)
      .slice(0, 50);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, items]);

  return (
    <div>
      <div className="mb-8">
        <label className="block">
          <span className="sr-only">아동 필수 지식 검색</span>
          <input
            type="search" value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="🔎 궁금한 낱말로 찾기 (예: 애착, 피아제, 일화기록, 그림책, 부모 상담)"
            className="w-full rounded-full border-2 border-ink bg-white px-5 py-3 text-base outline-none shadow-[3px_3px_0_var(--lav)] focus:shadow-[3px_3px_0_var(--ink)]"
          />
        </label>
      </div>
      {terms.length > 0 ? (
        <section aria-live="polite">
          <p className="mb-3 text-sm text-foreground/70">‘{q.trim()}’ 검색 결과 <b>{results.length}</b>개 단원{results.length === 50 ? " (상위 50개)" : ""}</p>
          {results.length === 0 ? (
            <p className="card p-8 text-center text-foreground/70">찾는 단원이 없어요. 다른 낱말로 찾아보세요.</p>
          ) : (
            <ul className="space-y-3">
              {results.map(({ it }) => (
                <li key={`${it.subject}/${it.unit}`}>
                  <Link href={`/knowledge/${it.subject}/${it.unit}`} className="card block p-4">
                    <p className="text-xs font-medium text-brand-dark">{it.emoji} {it.subjectTitle}</p>
                    <p className="mt-1 font-bold">{it.title}</p>
                    <p className="mt-1 text-sm text-foreground/70">{it.summary}</p>
                    <p className="mt-2 flex flex-wrap gap-1">
                      {it.keywords.slice(0, 6).map((k) => <span key={k} className="kw text-xs">{k}</span>)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : children}
    </div>
  );
}
