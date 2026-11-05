"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthProvider";

// 상단 문의 버튼: 일반 회원(·비로그인)은 '문의하기', 관리자는 '문의함'. 안 읽은 메시지 수를 배지로 표시.
export default function InquiryLink() {
  const { session, profile } = useAuth();
  const isAdmin = !!profile?.is_admin;
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!session || !profile) return;
    let alive = true;
    const check = () =>
      supabase
        .from("inquiries")
        .select("id", { count: "exact", head: true })
        .eq(isAdmin ? "admin_unread" : "user_unread", true)
        .then(({ count }) => { if (alive) setCount(count ?? 0); });
    check();
    const timer = setInterval(check, 60_000); // 1분마다 새 메시지 확인
    window.addEventListener("inquiry:changed", check);
    window.addEventListener("focus", check);
    return () => {
      alive = false;
      clearInterval(timer);
      window.removeEventListener("inquiry:changed", check);
      window.removeEventListener("focus", check);
    };
  }, [session, profile, isAdmin]);

  const shown = session ? count : 0;
  return (
    <Link href="/inquiry" className="relative font-bold decoration-lime decoration-4 underline-offset-4 hover:underline">
      {isAdmin ? "📮 문의함" : "💌 문의하기"}
      {shown > 0 && (
        <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs text-white" aria-label={`새 메시지 ${shown}건`}>
          {shown}
        </span>
      )}
    </Link>
  );
}
