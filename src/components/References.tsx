import type { Reference } from "@/lib/knowledge/types";

export default function References({ items }: { items: Reference[] }) {
  if (items.length === 0) return null;
  return (
    <aside className="mt-8 card p-5">
      <h2 className="text-base font-bold">📎 함께 확인하세요 (공식 기관 자료)</h2>
      <p className="mt-1 text-xs text-foreground/60">
        이 내용은 학습용 정리입니다. 정확한 기준과 최신 내용은 아래 공식 기관에서 확인해 주세요.
      </p>
      <ul className="mt-3 space-y-1.5 text-sm">
        {items.map((r) => (
          <li key={r.name}>
            {r.url ? (
              <a href={r.url} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-dark underline">{r.name}</a>
            ) : (
              <span className="font-medium">{r.name}</span>
            )}
            {r.note && <span className="text-foreground/60"> · {r.note}</span>}
          </li>
        ))}
      </ul>
    </aside>
  );
}
