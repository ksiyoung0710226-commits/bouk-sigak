"use client";

import Link from "next/link";
import { useAuth } from "./AuthProvider";

export const NAV = [
  { href: "/curriculum", label: "보육과정" },
  { href: "/knowledge", label: "필수지식" },
  { href: "/community", label: "커뮤니티" },
  { href: "/tips", label: "교사 노하우" },
];

export default function Header() {
  const { session, profile, signOut, loading } = useAuth();
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-3">
        <Link href="/" className="text-xl font-bold text-brand-dark">🌱 보육시각</Link>
        <nav className="flex flex-wrap items-center gap-4 text-sm font-medium">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="hover:text-brand-dark">{n.label}</Link>
          ))}
          {!loading &&
            (session ? (
              <>
                <span className="text-foreground/60">
                  {profile?.nickname ?? "회원"}
                  {profile?.is_admin ? " (관리자)" : ""}
                </span>
                <button onClick={signOut} className="rounded-full border border-line px-3 py-1 hover:bg-soft">로그아웃</button>
              </>
            ) : (
              <>
                <Link href="/login" className="hover:text-brand-dark">로그인</Link>
                <Link href="/signup" className="rounded-full bg-brand px-3 py-1 text-white hover:bg-brand-dark">회원가입</Link>
              </>
            ))}
        </nav>
      </div>
    </header>
  );
}
