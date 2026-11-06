"use client";

import Link from "next/link";
import { useState } from "react";
import PageTitle from "@/components/PageTitle";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";

const input = "w-full rounded-lg border border-line bg-white px-3 py-2 outline-none focus:border-brand";

// 비밀번호 재설정 메일의 링크로 들어오면 임시로 로그인된 상태가 되고, 여기서 새 비밀번호를 정한다.
export default function ResetPassword() {
  const { session, loading } = useAuth();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (pw.length < 8) return setError("비밀번호는 8자 이상이어야 해요.");
    if (pw !== pw2) return setError("두 비밀번호가 서로 달라요.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return setError(/different|same/i.test(error.message) ? "이전과 다른 비밀번호를 써 주세요." : "바꾸지 못했어요. 링크가 만료되었다면 다시 요청해 주세요.");
    setDone(true);
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <PageTitle title="새 비밀번호 정하기" />
      {loading ? (
        <p className="text-foreground/60">확인 중…</p>
      ) : done ? (
        <div className="card space-y-3 p-6 text-sm">
          <p className="font-bold">✅ 비밀번호를 바꿨어요.</p>
          <Link href="/community" className="inline-block underline">커뮤니티로 가기</Link>
        </div>
      ) : !session ? (
        <div className="card space-y-3 p-6 text-sm">
          <p>링크가 만료되었거나 잘못되었어요. 비밀번호 찾기를 다시 해 주세요.</p>
          <Link href="/forgot-password" className="inline-block underline">비밀번호 찾기</Link>
        </div>
      ) : (
        <form onSubmit={submit} className="card space-y-4 p-6">
          <p className="text-sm text-foreground/70">{session.user.email} 계정의 새 비밀번호를 정해 주세요.</p>
          <input type="text" name="username" autoComplete="username" value={session.user.email ?? ""} readOnly hidden />
          <input type="password" autoComplete="new-password" className={input} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="새 비밀번호 (8자 이상)" required />
          <input type="password" autoComplete="new-password" className={input} value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="새 비밀번호 확인" required />
          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <button disabled={busy} className="w-full rounded-full bg-brand px-6 py-3 font-medium text-white hover:bg-brand-dark disabled:opacity-50">
            {busy ? "저장 중…" : "새 비밀번호 저장"}
          </button>
        </form>
      )}
    </div>
  );
}
