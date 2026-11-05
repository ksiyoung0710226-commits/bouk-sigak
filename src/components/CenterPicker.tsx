"use client";

import { CENTER_TYPES, REGIONS } from "@/lib/member-info";

const input = "w-full rounded-lg border border-line bg-white px-3 py-2 outline-none focus:border-brand";
const typeLabel = (c: string) => (c === "기타" ? "기타" : `${c} 어린이집`);

// 교사 근무지: ① 지역 → ② 어린이집 분류(버튼 나열)
export default function CenterPicker({
  region, centerType, onChange,
}: {
  region: string; centerType: string;
  onChange: (v: { region: string; centerType: string }) => void;
}) {
  const set = (patch: Partial<{ region: string; centerType: string }>) => onChange({ region, centerType, ...patch });

  return (
    <div className="space-y-4 text-sm">
      <label className="block">
        <span className="mb-1 block font-medium">① 근무 지역</span>
        <select className={input} value={region} onChange={(e) => set({ region: e.target.value })}>
          <option value="">지역을 골라 주세요</option>
          {REGIONS.map((r) => <option key={r}>{r}</option>)}
        </select>
      </label>

      <div className={region ? "" : "pointer-events-none opacity-40"} aria-disabled={!region}>
        <span className="mb-1 block font-medium">② 어린이집 분류</span>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="어린이집 분류">
          {CENTER_TYPES.map((c) => (
            <button type="button" key={c} role="radio" aria-checked={centerType === c} onClick={() => set({ centerType: c })}
              className={`rounded-full px-3 py-1.5 ${centerType === c ? "bg-brand text-white" : "border border-line bg-white hover:bg-soft"}`}>
              {typeLabel(c)}
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
