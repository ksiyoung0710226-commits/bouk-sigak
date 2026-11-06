"use client";

import Link from "next/link";
import { useState } from "react";
import PageTitle from "@/components/PageTitle";
import { supabase } from "@/lib/supabase";

const input = "w-full rounded-lg border border-line bg-white px-3 py-2 outline-none focus:border-brand";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
    setBusy(false);
    // 가입 여부를 알려 주지 않도록, 없는 이메일이어도 같은 안내를 보여 줌
    if (error && /rate|seconds/i.test(error.message)) return setError("잠시 후 다시 시도해 주세요(1분에 한 번 보낼 수 있어요).");
    setSent(true);
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <PageTitle title="비밀번호 찾기" desc="가입한 이메일로 비밀번호를 새로 정하는 링크를 보내 드려요." />
      {sent ? (
        <div className="card space-y-3 p-6 text-sm">
          <p className="font-bold">📧 메일을 보냈어요.</p>
          <p>가입된 이메일이라면 몇 분 안에 ‘보육시각’ 메일이 도착해요. 메일의 버튼을 눌러 새 비밀번호를 정해 주세요. 메일이 안 보이면 스팸함도 확인해 주세요.</p>
          <Link href="/login" className="inline-block underline">로그인으로 돌아가기</Link>
        </div>
      ) : (
        <form onSubmit={submit} className="card space-y-4 p-6">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">가입한 이메일</span>
            <input type="email" autoComplete="username" className={input} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@email.com" required />
          </label>
          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <button disabled={busy} className="w-full rounded-full bg-brand px-6 py-3 font-medium text-white hover:bg-brand-dark disabled:opacity-50">
            {busy ? "보내는 중…" : "재설정 메일 받기"}
          </button>
        </form>
      )}
    </div>
  );
}
