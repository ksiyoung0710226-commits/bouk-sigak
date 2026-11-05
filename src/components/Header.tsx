import Link from "next/link";

export const NAV = [
  { href: "/curriculum", label: "보육과정" },
  { href: "/theory", label: "발달이론" },
  { href: "/knowledge", label: "보육지식" },
  { href: "/community", label: "커뮤니티" },
  { href: "/tips", label: "교사 노하우" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-3">
        <Link href="/" className="text-xl font-bold text-brand-dark">
          🌱 보육시각
        </Link>
        <nav className="flex flex-wrap gap-4 text-sm font-medium">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="hover:text-brand-dark">
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
