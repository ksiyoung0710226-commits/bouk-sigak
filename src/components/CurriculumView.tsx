"use client";

import { useState } from "react";
import type { AgeGroup } from "@/lib/curriculum";

export default function CurriculumView({ groups }: { groups: AgeGroup[] }) {
  const [gi, setGi] = useState(0);
  const [ai, setAi] = useState(0);
  const g = groups[gi];
  const area = g.areas[Math.min(ai, g.areas.length - 1)];

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {groups.map((x, i) => (
          <button
            key={x.id}
            onClick={() => { setGi(i); setAi(0); }}
            className={`rounded-full px-5 py-2 font-medium ${i === gi ? "bg-brand text-white" : "border border-line bg-white hover:bg-soft"}`}
          >
            {x.label}
          </button>
        ))}
      </div>
      <p className="mt-3 text-sm text-foreground/70">
        {g.title} · 출처: {g.source}
      </p>

      <div className="mt-6 flex flex-wrap gap-2 border-b border-line pb-3">
        {g.areas.map((a, i) => (
          <button
            key={a.name}
            onClick={() => setAi(i)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium ${i === ai ? "bg-soft text-brand-dark" : "hover:bg-soft"}`}
          >
            {a.name}
          </button>
        ))}
      </div>

      <section className="mt-6">
        <h2 className="text-2xl font-bold text-brand-dark">{area.name}</h2>
        {area.goal && (
          <div className="mt-3 rounded-xl bg-soft p-4">
            <p className="font-medium">목표: {area.goal}</p>
            {area.subGoals && (
              <ul className="mt-2 list-decimal space-y-0.5 pl-5 text-sm">
                {area.subGoals.map((s) => <li key={s}>{s}</li>)}
              </ul>
            )}
          </div>
        )}
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {area.categories.map((c) => (
            <div key={c.name} className="rounded-2xl border border-line bg-white p-5">
              <h3 className="font-bold">
                <span className="mr-2 text-xs text-brand-dark">내용범주</span>
                {c.name}
              </h3>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm">
                {c.items.map((it) => <li key={it}>{it}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
