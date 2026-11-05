import type { Reference, SourceKind } from "@/lib/knowledge/types";

const GROUPS: { kind: SourceKind; title: string; icon: string }[] = [
  { kind: "guide", title: "고시문 · 해설서", icon: "📘" },
  { kind: "law", title: "법령", icon: "⚖️" },
  { kind: "institution", title: "공식 기관 자료", icon: "🏛️" },
  { kind: "literature", title: "학술 · 원전 문헌", icon: "📚" },
];

export default function References({ items }: { items: Reference[] }) {
  if (items.length === 0) return null;
  return (
    <aside className="card mt-8 p-5" aria-label="출처 및 참고문헌">
      <h2 className="text-xl">📎 출처 및 참고문헌</h2>
      <p className="mt-2 text-sm text-foreground/75">
        이 사이트의 정리 내용은 일반 교재 수준으로 풀어 쓴 학습 자료이며, 아래 자료와 일부 대조했습니다.
        정확한 문구와 최신 내용은 반드시 원문을 확인해 주세요.
      </p>
      <div className="mt-4 space-y-5">
        {GROUPS.map((g) => {
          const list = items.filter((r) => r.kind === g.kind);
          if (list.length === 0) return null;
          return (
            <section key={g.kind}>
              <h3 className="text-base"><span className="hl">{g.icon} {g.title}</span></h3>
              <ul className="mt-2 space-y-2 text-sm">
                {list.map((r) => (
                  <li key={r.name} className="leading-relaxed">
                    {r.url ? (
                      <a href={r.url} target="_blank" rel="noopener noreferrer" className="font-bold text-brand-dark underline underline-offset-2">{r.name}</a>
                    ) : (
                      <span className="font-bold">{r.name}</span>
                    )}
                    {r.note && <span className="block text-foreground/65">{r.note}</span>}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </aside>
  );
}
