"use client";

import { CENTER_TYPES, REGIONS } from "@/lib/member-info";

const input = "w-full rounded-lg border border-line bg-white px-3 py-2 outline-none focus:border-brand";
const typeLabel = (c: string) => (c === "기타" ? "기타" : `${c} 어린이집`);

// 교사 근무지: ① 지역 → ② 어린이집 유형(버튼 나열) → ③ 어린이집 이름
export default function CenterPicker({
  region, centerType, centerName, onChange,
}: {
  region: string; centerType: string; centerName: string;
  onChange: (v: { region: string; centerType: string; centerName: string }) => void;
}) {
  const set = (patch: Partial<{ region: string; centerType: string; centerName: string }>) =>
    onChange({ region, centerType, centerName, ...patch });

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
        <span className="mb-1 block font-medium">② 어린이집 유형</span>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="어린이집 유형">
          {CENTER_TYPES.map((c) => (
            <button type="button" key={c} role="radio" aria-checked={centerType === c} onClick={() => set({ centerType: c })}
              className={`rounded-full px-3 py-1.5 ${centerType === c ? "bg-brand text-white" : "border border-line bg-white hover:bg-soft"}`}>
              {typeLabel(c)}
            </button>
          ))}
        </div>
      </div>

      <label className={`block ${region && centerType ? "" : "pointer-events-none opacity-40"}`}>
        <span className="mb-1 block font-medium">③ 근무하는 어린이집 이름</span>
        <input className={input} value={centerName} onChange={(e) => set({ centerName: e.target.value })} maxLength={60}
          placeholder={region && centerType ? `예: ${region} OO${centerType === "기타" ? " 기관" : " 어린이집"}` : "지역과 유형을 먼저 골라 주세요"} />
        <span className="mt-1 block text-xs text-foreground/60">
          🔒 어린이집 이름은 <b>다른 회원에게 공개되지 않고</b> 나와 관리자만 볼 수 있어요. (지역·유형만 공개 설정에 따라 보여요)
        </span>
      </label>
    </div>
  );
}
