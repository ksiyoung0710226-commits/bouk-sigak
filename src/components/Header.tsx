"use client";

import Link from "next/link";
import { useAuth } from "./AuthProvider";
import InquiryLink from "./InquiryLink";
import ChatLink from "./ChatLink";

export const NAV = [
  { href: "/curriculum", label: "보육과정" },
  { href: "/knowledge", label: "필수지식" },
  { href: "/community", label: "커뮤니티" },
  { href: "/qna", label: "Q&A" },
  { href: "/news", label: "보육 뉴스" },
];

export default function Header() {
  const { session, profile, signOut, loading } = useAuth();
  return (
    <header className="sticky top-0 z-10 border-b-2 border-ink bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-3">
        <Link href="/" className="flex items-center gap-1.5" aria-label="보육시각 홈">
          <span aria-hidden className="text-xl">🌱</span>
          <span className="logo-font text-3xl">보육시각</span>
        </Link>
        <nav className="flex flex-wrap items-center gap-4 text-sm font-medium">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="font-bold decoration-lime decoration-4 underline-offset-4 hover:underline">{n.label}</Link>
          ))}
          {!loading &&
            (session ? (
              <>
                <Link href="/profile" className="font-bold decoration-lime decoration-4 underline-offset-4 hover:underline" title="내 정보 수정">
                  👤 {profile?.nickname ?? "회원"}
                  {profile?.is_admin ? " (관리자)" : ""}
                </Link>
                {profile?.is_admin && (
                  <Link href="/profile#admin-members" className="font-bold decoration-lime decoration-4 underline-offset-4 hover:underline">🛠 회원 관리</Link>
                )}
                <ChatLink />
                <InquiryLink />
                <button onClick={signOut} className="rounded-full border border-line px-3 py-1 hover:bg-soft">로그아웃</button>
              </>
            ) : (
              <>
                <InquiryLink />
                <Link href="/login" className="hover:text-brand-dark">로그인</Link>
                <Link href="/signup" className="rounded-full bg-brand px-3 py-1 text-white hover:bg-brand-dark">회원가입</Link>
              </>
            ))}
        </nav>
      </div>
    </header>
  );
}
