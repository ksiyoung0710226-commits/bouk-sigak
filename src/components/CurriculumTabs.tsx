"use client";

import { useState } from "react";
import CurriculumView from "./CurriculumView";
import { TRACK_LABEL, sortKey, type Edition, type Track } from "@/lib/curriculum-history";

type Tab = "year" | Track;
const TABS: { id: Tab; label: string }[] = [
  { id: "year", label: "년도별" },
  { id: "standard", label: "표준보육과정" },
  { id: "nuri", label: "누리과정" },
];

const fmtDate = (d?: string | null) => {
  if (!d) return null;
  const [y, m, day] = d.split("-");
  return `${y}년 ${Number(m)}월 ${Number(day)}일`;
};

function CurrentBadge() {
  return <span className="kw rounded-full px-2 py-0.5 text-xs font-bold">현재 적용 중</span>;
}

function Summary({ e, current }: { e: Edition; current: boolean }) {
  return (
    <div className="space-y-3 text-sm">
      <dl className="grid gap-x-4 gap-y-1 sm:grid-cols-[7rem_1fr]">
        <dt className="font-bold">고시</dt>
        <dd>{e.notices.join(" / ")}</dd>
        {e.announced && (<><dt className="font-bold">고시일</dt><dd>{fmtDate(e.announced)}</dd></>)}
        <dt className="font-bold">시행일</dt>
        <dd>{fmtDate(e.effectiveFrom) ?? e.effectiveText ?? "공식 자료에서 확인 중"}</dd>
        <dt className="font-bold">대상</dt>
        <dd>{e.ages}{e.ageLevels ? ` (${e.ageLevels})` : ""}</dd>
        <dt className="font-bold">영역</dt>
        <dd className="flex flex-wrap gap-1.5">
          {e.areas.map((a) => <span key={a} className="rounded-full border border-line bg-white px-2 py-0.5 text-xs">{a}</span>)}
        </dd>
      </dl>
      {e.features.length > 0 && (
        <div>
          <p className="font-bold">{current ? "주요 특징" : "이때 바뀐 점"}</p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            {e.features.map((f) => <li key={f}>{f}</li>)}
          </ul>
        </div>
      )}
      {e.sources.length > 0 && (
        <p className="text-xs text-foreground/70">
          출처:{" "}
          {e.sources.map((s, i) => (
            <span key={s.url}>
              {i > 0 && ", "}
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline">{s.label}</a>
            </span>
          ))}
        </p>
      )}
    </div>
  );
}

function PastList({ editions, currentIds }: { editions: Edition[]; currentIds: string[] }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <ul className="space-y-3">
      {editions.map((e) => {
        const current = currentIds.includes(e.id);
        const isOpen = open === e.id;
        return (
          <li key={e.id} className="card p-4">
            <button onClick={() => setOpen(isOpen ? null : e.id)} className="flex w-full flex-wrap items-center gap-2 text-left" aria-expanded={isOpen}>
              <span className="text-lg font-bold">{sortKey(e).slice(0, 4)}</span>
              <span className="rounded-full bg-soft px-2 py-0.5 text-xs">{TRACK_LABEL[e.track]}</span>
              <span className="font-medium">{e.name}</span>
              {current && <CurrentBadge />}
              <span className="ml-auto text-xs text-foreground/60">{isOpen ? "접기 ▲" : "요약 보기 ▼"}</span>
            </button>
            {isOpen && <div className="mt-3 border-t border-line pt-3"><Summary e={e} current={current} /></div>}
          </li>
        );
      })}
    </ul>
  );
}

function TrackView({ track, editions, currentIds }: { track: Track; editions: Edition[]; currentIds: string[] }) {
  const list = editions.filter((e) => e.track === track).sort((a, b) => sortKey(b).localeCompare(sortKey(a)));
  const current = list.find((e) => currentIds.includes(e.id));
  // 현재 판보다 시행일이 늦은 것 = 아직 시행 전(예정)
  const upcoming = list.filter((e) => current?.effectiveFrom && e.effectiveFrom && e.effectiveFrom > current.effectiveFrom);
  const past = list.filter((e) => e !== current && !upcoming.includes(e));

  return (
    <div className="space-y-10">
      {upcoming.length > 0 && (
        <section className="note p-4 text-sm">
          <p className="font-bold">📅 시행 예정</p>
          {upcoming.map((e) => <p key={e.id}>{e.name} — {fmtDate(e.effectiveFrom)}부터 적용돼요. 그날부터 이 페이지의 원문도 자동으로 바뀌어요.</p>)}
        </section>
      )}
      {current && (
        <section>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-bold">{current.name}</h2>
            <CurrentBadge />
          </div>
          <div className="panel-lav mb-6 p-4"><Summary e={current} current /></div>
          {current.fullText ? (
            <>
              <p className="mb-3 text-sm font-bold">📜 원문 (내용범주와 내용)</p>
              <CurriculumView groups={current.fullText} />
            </>
          ) : (
            <p className="note p-4 text-sm">이 보육과정의 원문은 확인 후 올릴 예정이에요. 위 출처의 공식 원문을 확인해 주세요.</p>
          )}
        </section>
      )}
      {past.length > 0 && (
        <section>
          <h2 className="mb-3 text-xl font-bold">지난 {TRACK_LABEL[track]} (요약)</h2>
          <PastList editions={past} currentIds={currentIds} />
        </section>
      )}
    </div>
  );
}

export default function CurriculumTabs({ editions, currentIds }: { editions: Edition[]; currentIds: string[] }) {
  const [tab, setTab] = useState<Tab>("year");
  const byYear = [...editions].sort((a, b) => sortKey(b).localeCompare(sortKey(a)));

  return (
    <div>
      <div className="mb-8 flex flex-wrap gap-2 border-b-2 border-ink pb-3" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
            className={`rounded-full px-5 py-2 font-bold ${tab === t.id ? "bg-brand text-white" : "border border-line bg-white hover:bg-soft"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "year" ? (
        <div className="space-y-4">
          <p className="text-sm text-foreground/75">
            지금까지 나온 표준보육과정과 누리과정을 시행 연도 순서로 모았어요. 눌러서 요약을 볼 수 있고,
            <b> 현재 적용 중인 과정의 원문</b>은 ‘표준보육과정’, ‘누리과정’ 탭에서 볼 수 있어요.
          </p>
          <PastList editions={byYear} currentIds={currentIds} />
        </div>
      ) : (
        <TrackView track={tab} editions={editions} currentIds={currentIds} />
      )}
    </div>
  );
}
