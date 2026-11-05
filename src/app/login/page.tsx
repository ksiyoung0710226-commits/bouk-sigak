"use client";

import Link from "next/link";
import { useState } from "react";
import PageTitle from "@/components/PageTitle";
import { supabase } from "@/lib/supabase";

const input = "w-full rounded-lg border border-line bg-white px-3 py-2 outline-none focus:border-brand";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) {
      setError(error.message.includes("not confirmed") ? "이메일 인증을 먼저 완료해 주세요." : "이메일 또는 비밀번호가 맞지 않아요.");
      return;
    }
    window.location.href = "/community";
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <PageTitle title="로그인" />
      <form onSubmit={submit} className="space-y-4">
        <input type="email" className={input} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="이메일" required />
        <input type="password" className={input} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호" required />
        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <button disabled={busy} className="w-full rounded-full bg-brand px-6 py-3 font-medium text-white hover:bg-brand-dark disabled:opacity-50">
          {busy ? "로그인 중…" : "로그인"}
        </button>
        <p className="text-center text-sm">처음이세요? <Link href="/signup" className="text-brand-dark underline">회원가입</Link></p>
      </form>
    </div>
  );
}
