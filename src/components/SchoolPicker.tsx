"use client";

import { useMemo, useState } from "react";
import { SCHOOL_MAJORS } from "@/lib/schools-data";

const input = "w-full rounded-lg border border-line bg-white px-3 py-2 outline-none focus:border-brand";
const norm = (s: string) => s.replace(/\s/g, "").toLowerCase();

// '한양여대' → '한양여자대학교', '○○대' → '○○대학교' 처럼 줄임말도 찾을 수 있게
function variants(q: string): string[] {
  const n = norm(q);
  const out = new Set([n]);
  if (n.includes("여대")) out.add(n.replace("여대", "여자대학교"));
  if (n.endsWith("대")) out.add(n + "학교");
  return [...out].filter(Boolean);
}

export function isListed(school: string, major: string) {
  return SCHOOL_MAJORS.some(([s, m]) => s === school && m === major);
}

export default function SchoolPicker({
  school, major, onChange,
}: { school: string; major: string; onChange: (school: string, major: string) => void }) {
  const listed = !!school && !!major && isListed(school, major);
  const [q, setQ] = useState("");
  const [manual, setManual] = useState(!!school && !listed);

  const results = useMemo(() => {
    const vs = variants(q);
    if (!q.trim()) return [];
    return SCHOOL_MAJORS.filter(([s, m]) => vs.some((v) => norm(s + m).includes(v) || norm(s).includes(v) || norm(m).includes(v))).slice(0, 40);
  }, [q]);

  if (listed)
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border-2 border-ink bg-lime/50 px-3 py-2 text-sm">
        <span>
          <b>✓ {school} {major}</b>
          <span className="ml-1 text-xs text-foreground/70">공식 학과 목록에서 확인됨</span>
        </span>
        <button type="button" onClick={() => { onChange("", ""); setQ(""); }} className="text-xs underline">다시 고르기</button>
      </div>
    );

  if (manual)
    return (
      <div className="space-y-2">
        <div className="grid gap-2 sm:grid-cols-2">
          <input className={input} value={school} onChange={(e) => onChange(e.target.value, major)} placeholder="학교 이름 (예: OO교육원)" maxLength={50} aria-label="학교 이름 직접 입력" />
          <input className={input} value={major} onChange={(e) => onChange(school, e.target.value)} placeholder="학과·과정 이름" maxLength={50} aria-label="학과 직접 입력" />
        </div>
        <p className="text-xs text-foreground/60">직접 입력한 학교는 공식 목록에서 확인되지 않아 <b>✓ 표시가 붙지 않아요.</b> (학점은행제·보육교사교육원 등)</p>
        <button type="button" onClick={() => { setManual(false); onChange("", ""); }} className="text-xs underline">목록에서 검색하기</button>
      </div>
    );

  return (
    <div className="space-y-2">
      <input className={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="학교나 학과 이름으로 검색 (예: 한양여대, 아동보육)" aria-label="학교·학과 검색" />
      {q.trim() && (
        <ul className="max-h-64 overflow-y-auto rounded-lg border border-line bg-white text-sm" role="listbox">
          {results.map(([s, m, r, t]) => (
            <li key={s + m}>
              <button type="button" role="option" aria-selected={false} onClick={() => onChange(s, m)} className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-soft">
                <span><b>{s}</b> {m}</span>
                <span className="shrink-0 text-xs text-foreground/60">{r} · {t}</span>
              </button>
            </li>
          ))}
          {results.length === 0 && <li className="px-3 py-2 text-foreground/60">검색 결과가 없어요.</li>}
        </ul>
      )}
      <p className="text-xs text-foreground/60">
        보육·유아교육·아동학 관련 학과가 있는 학교 {new Set(SCHOOL_MAJORS.map(([s]) => s)).size}곳({SCHOOL_MAJORS.length}개 학과)을 대학알리미 공식 자료에서 가져왔어요.{" "}
        <button type="button" onClick={() => setManual(true)} className="underline">목록에 없어요 (직접 입력)</button>
      </p>
    </div>
  );
}
