"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import PageTitle from "@/components/PageTitle";
import { SAVED_EMAIL_KEY, isAutoLogin, setAutoLogin, supabase } from "@/lib/supabase";

const input = "w-full rounded-lg border border-line bg-white px-3 py-2 outline-none focus:border-brand";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saveEmail, setSaveEmail] = useState(false);
  const [autoLogin, setAuto] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(SAVED_EMAIL_KEY);
    if (saved) {
      setEmail(saved);
      setSaveEmail(true);
    }
    setAuto(isAutoLogin());
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    // 로그인 전에 저장 방식을 정해야 세션이 올바른 곳에 저장됩니다.
    setAutoLogin(autoLogin);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) {
      setError(error.message.includes("not confirmed") ? "이메일 인증을 먼저 완료해 주세요." : "이메일 또는 비밀번호가 맞지 않아요.");
      return;
    }
    if (saveEmail) localStorage.setItem(SAVED_EMAIL_KEY, email.trim());
    else localStorage.removeItem(SAVED_EMAIL_KEY);
    window.location.href = "/community";
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <PageTitle title="로그인" />
      <form onSubmit={submit} className="card space-y-4 p-6">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">이메일</span>
          <input type="email" name="email" autoComplete="username" className={input} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@email.com" required />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">비밀번호</span>
          <input type="password" name="password" autoComplete="current-password" className={input} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호" required />
        </label>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={saveEmail} onChange={(e) => setSaveEmail(e.target.checked)} />
            이메일(아이디) 저장
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={autoLogin} onChange={(e) => setAuto(e.target.checked)} />
            자동 로그인
          </label>
        </div>
        <p className="text-xs text-foreground/60">
          자동 로그인을 켜면 브라우저를 닫아도 로그인이 유지돼요. 여러 사람이 함께 쓰는 컴퓨터에서는 꺼 주세요.
          비밀번호는 사이트가 저장하지 않고, 브라우저의 『비밀번호 저장』 기능으로 저장할 수 있어요.
        </p>
        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <button disabled={busy} className="w-full rounded-full bg-brand px-6 py-3 font-medium text-white hover:bg-brand-dark disabled:opacity-50">
          {busy ? "로그인 중…" : "로그인"}
        </button>
        <p className="text-center text-sm">처음이세요? <Link href="/signup" className="text-brand-dark underline">회원가입</Link></p>
      </form>
    </div>
  );
}
