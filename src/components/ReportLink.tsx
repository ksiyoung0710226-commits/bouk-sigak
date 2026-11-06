"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthProvider";

// 관리자 헤더: '🚩 신고 관리' + 처리 안 된 신고 수 배지
export default function ReportLink() {
  const { profile } = useAuth();
  const isAdmin = !!profile?.is_admin;
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isAdmin) return;
    let alive = true;
    const check = () => supabase.rpc("admin_open_report_count").then(({ data }) => { if (alive) setCount(Number(data ?? 0)); });
    check();
    const timer = setInterval(check, 60_000);
    window.addEventListener("boyuk:reports-changed", check);
    window.addEventListener("focus", check);
    return () => {
      alive = false;
      clearInterval(timer);
      window.removeEventListener("boyuk:reports-changed", check);
      window.removeEventListener("focus", check);
    };
  }, [isAdmin]);

  if (!isAdmin) return null;
  return (
    <Link href="/profile#admin-reports" className="font-bold decoration-lime decoration-4 underline-offset-4 hover:underline">
      🚩 신고 관리
      {count > 0 && (
        <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs text-white" aria-label={`처리할 신고 ${count}건`}>
          {count}
        </span>
      )}
    </Link>
  );
}
