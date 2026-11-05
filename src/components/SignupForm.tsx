"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

type Kind = "student" | "teacher";
const input = "w-full rounded-lg border border-line bg-white px-3 py-2 outline-none focus:border-brand";

export default function SignupForm() {
  const [kind, setKind] = useState<Kind>("student");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const nick = nickname.trim();
    if (nick.length < 2 || nick.length > 20) return setError("닉네임은 2~20자로 입력해 주세요.");
    if (password.length < 8) return setError("비밀번호는 8자 이상이어야 해요.");
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { nickname: nick, kind },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });
    setBusy(false);
    if (error) return setError(error.message.includes("registered") ? "이미 가입된 이메일이에요." : "가입에 실패했어요: " + error.message);
    // 이메일 인증이 꺼져 있으면 바로 로그인된 세션이 생깁니다.
    if (data.session) window.location.href = kind === "teacher" ? "/tips" : "/community";
    else setDone(true);
  }

  if (done)
    return (
      <div className="rounded-2xl border border-line bg-white p-8 text-center">
        <p className="text-lg font-bold">📧 인증 메일을 보냈어요</p>
        <p className="mt-2 text-sm text-foreground/70">
          {email} 의 메일함(스팸함 포함)에서 인증 링크를 누른 뒤 로그인해 주세요.
        </p>
        <Link href="/login" className="mt-5 inline-block rounded-full bg-brand px-6 py-2 font-medium text-white">로그인하러 가기</Link>
      </div>
    );

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <p className="mb-2 font-medium">가입 유형</p>
        <div className="grid grid-cols-2 gap-3">
          {([["student", "🎓 아동보육과 재학생"], ["teacher", "🧸 현장 보육교사"]] as const).map(([v, label]) => (
            <button type="button" key={v} onClick={() => setKind(v)}
              className={`rounded-xl border px-4 py-3 font-medium ${kind === v ? "border-brand bg-soft text-brand-dark" : "border-line bg-white"}`}>
              {label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-foreground/60">
          유형은 본인이 선택하는 표시이며, 별도의 서류 인증은 하지 않아요.
          {kind === "teacher" && " 교사 노하우 게시판에 글을 쓰려면 가입 후 교사 인증 코드가 필요해요."}
        </p>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-medium">닉네임</span>
        <input className={input} value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="실명 대신 닉네임을 써 주세요" required />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">이메일</span>
        <input type="email" className={input} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@email.com" required />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">비밀번호</span>
        <input type="password" className={input} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="8자 이상" required />
      </label>

      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1" required />
        <span>
          [필수] 이메일, 닉네임, 가입 유형을 서비스 운영 목적으로 수집하는 것에 동의하며, 게시글에
          <b> 아동·기관·학부모의 실명이나 개인정보를 쓰지 않겠습니다.</b>
        </span>
      </label>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <button disabled={busy || !agree} className="w-full rounded-full bg-brand px-6 py-3 font-medium text-white hover:bg-brand-dark disabled:opacity-50">
        {busy ? "가입 중…" : "가입하기"}
      </button>
      <p className="text-center text-sm">이미 계정이 있나요? <Link href="/login" className="text-brand-dark underline">로그인</Link></p>
    </form>
  );
}
