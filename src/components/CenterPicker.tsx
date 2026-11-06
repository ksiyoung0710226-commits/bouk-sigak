"use client";

import { REGIONS, TEACHER_ORGS, orgTypes } from "@/lib/member-info";

const input = "w-full rounded-lg border border-line bg-white px-3 py-2 outline-none focus:border-brand";

type Value = { org: string; region: string; centerType: string };

// 교사 근무지: ① 어린이집/유치원(필수) → ② 지역 → ③ 기관 분류(버튼 나열)
export default function CenterPicker({
  org, region, centerType, onChange,
}: Value & { onChange: (v: Value) => void }) {
  const set = (patch: Partial<Value>) => onChange({ org, region, centerType, ...patch });
  const types = orgTypes(org);
  const typeLabel = (c: string) => (c === "기타" ? "기타" : `${c} ${org}`);

  return (
    <div className="space-y-4 text-sm">
      <div>
        <span className="mb-1 block font-medium">① 근무 기관 <span className="text-red-700">(필수)</span></span>
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="근무 기관">
          {TEACHER_ORGS.map((o) => (
            <button type="button" key={o} role="radio" aria-checked={org === o}
              onClick={() => set({ org: o, centerType: org === o ? centerType : "" })}
              className={`rounded-xl px-3 py-2.5 font-bold ${org === o ? "bg-brand text-white" : "border border-line bg-white hover:bg-soft"}`}>
              {o === "어린이집" ? "🏠 어린이집" : "🏫 유치원"}
            </button>
          ))}
        </div>
        <span className="mt-1 block text-xs text-foreground/60">고른 기관은 닉네임 옆에 ‘{org || "어린이집"} 교사’로 표시돼요.</span>
      </div>

      <label className={`block ${org ? "" : "pointer-events-none opacity-40"}`}>
        <span className="mb-1 block font-medium">② 근무 지역</span>
        <select className={input} value={region} onChange={(e) => set({ region: e.target.value })} disabled={!org}>
          <option value="">지역을 골라 주세요</option>
          {REGIONS.map((r) => <option key={r}>{r}</option>)}
        </select>
      </label>

      <div className={org && region ? "" : "pointer-events-none opacity-40"} aria-disabled={!(org && region)}>
        <span className="mb-1 block font-medium">③ {org || "기관"} 종류</span>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={`${org || "기관"} 종류`}>
          {types.map((c) => (
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
