"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthProvider";

type Row = {
  requester_id: string; recipient_id: string; status: string;
  requester_read_at: string; recipient_read_at: string | null; last_message_at: string | null;
};

// 상단 '채팅' 메뉴: 받은 요청 수 + 안 읽은 대화 수를 배지로 표시
export default function ChatLink() {
  const { session } = useAuth();
  const me = session?.user.id;
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!me) return;
    let alive = true;
    const check = () =>
      supabase
        .from("dm_threads")
        .select("requester_id,recipient_id,status,requester_read_at,recipient_read_at,last_message_at")
        .in("status", ["pending", "accepted"])
        .then(({ data }) => {
          if (!alive) return;
          const rows = (data as Row[]) ?? [];
          const n = rows.filter((t) => {
            if (t.status === "pending") return t.recipient_id === me;
            if (!t.last_message_at) return false;
            const read = t.requester_id === me ? t.requester_read_at : t.recipient_read_at;
            return !read || t.last_message_at > read;
          }).length;
          setCount(n);
        });
    check();
    const timer = setInterval(check, 60_000);
    window.addEventListener("dm:changed", check);
    window.addEventListener("focus", check);
    return () => {
      alive = false;
      clearInterval(timer);
      window.removeEventListener("dm:changed", check);
      window.removeEventListener("focus", check);
    };
  }, [me]);

  if (!me) return null;
  return (
    <Link href="/chat" className="font-bold decoration-lime decoration-4 underline-offset-4 hover:underline">
      💬 채팅
      {count > 0 && (
        <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs text-white" aria-label={`새 채팅 알림 ${count}건`}>
          {count}
        </span>
      )}
    </Link>
  );
}
