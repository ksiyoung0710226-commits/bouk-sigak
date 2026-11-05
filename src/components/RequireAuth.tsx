"use client";

import Link from "next/link";
import { useAuth } from "./AuthProvider";

// 로그인하지 않으면 내용을 렌더링하지 않고 안내만 보여 줍니다.
// (실제 데이터 보호는 데이터베이스 보안 규칙이 담당합니다.)
export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return <p className="py-20 text-center text-foreground/60">불러오는 중…</p>;
  if (!session)
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-line bg-white p-8 text-center">
        <p className="text-lg font-bold">🔒 가입한 회원만 볼 수 있어요</p>
        <p className="mt-2 text-sm text-foreground/70">로그인하거나 가입하면 이 공간을 이용할 수 있습니다.</p>
        <div className="mt-5 flex justify-center gap-3">
          <Link href="/login" className="rounded-full bg-brand px-5 py-2 font-medium text-white hover:bg-brand-dark">로그인</Link>
          <Link href="/signup" className="rounded-full border border-brand px-5 py-2 font-medium text-brand-dark">회원가입</Link>
        </div>
      </div>
    );
  return <>{children}</>;
}
