"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { validateNickname } from "@/lib/nickname";
import { CENTER_TYPES, REGIONS } from "@/lib/member-info";

type Kind = "student" | "teacher";
const input = "w-full rounded-lg border border-line bg-white px-3 py-2 outline-none focus:border-brand";

export default function SignupForm() {
  const [kind, setKind] = useState<Kind>("student");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [school, setSchool] = useState("");
  const [region, setRegion] = useState("");
  const [centerType, setCenterType] = useState("");
  const [infoPublic, setInfoPublic] = useState(true);
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const nick = nickname.trim();
    const nickErr = validateNickname(nick);
    if (nickErr) return setError(nickErr);
    if (password.length < 8) return setError("비밀번호는 8자 이상이어야 해요.");
    if (kind === "student" && !school.trim()) return setError("재학 중인 학교를 적어 주세요.");
    if (kind === "teacher" && (!region || !centerType)) return setError("근무 지역과 어린이집 유형을 골라 주세요.");
    setBusy(true);
    const { data: free } = await supabase.rpc("nickname_available", { nick });
    if (free === false) {
      setBusy(false);
      return setError("이미 사용 중인 닉네임이에요. 다른 닉네임을 써 주세요.");
    }
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: kind === "student"
          ? { nickname: nick, kind, school: school.trim(), info_public: infoPublic }
          : { nickname: nick, kind, region, center_type: centerType, info_public: infoPublic },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });
    setBusy(false);
    if (error) {
      if (error.message.includes("registered")) return setError("이미 가입된 이메일이에요.");
      if (/database error/i.test(error.message)) return setError("닉네임이 이미 쓰이고 있거나 규칙에 맞지 않아요. 다른 닉네임으로 시도해 주세요.");
      return setError("가입에 실패했어요: " + error.message);
    }
    // 이메일 인증이 꺼져 있으면 바로 로그인된 세션이 생깁니다.
    if (data.session) window.location.href = kind === "teacher" ? "/qna" : "/community";
    else setDone(true);
  }

  if (done)
    return (
      <div className="card p-8 text-center">
        <p className="text-lg font-bold">📧 보육시각 이메일 인증 메일을 보냈어요</p>
        <p className="mt-2 text-sm text-foreground/70">
          {email} 의 메일함에서 인증 링크를 눌러 가입을 마무리해 주세요.
        </p>
        <p className="mt-3 note p-3 text-xs text-foreground/70">
          보낸 사람이 <b>Supabase Auth</b>로 보일 수 있어요. 보육시각 가입 인증 메일이 맞으니 안심하세요.
          메일이 안 보이면 스팸함도 확인해 주세요.
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
          {kind === "teacher" && " 가입 후 교사 인증 코드를 입력하면 Q&amp;A 답변에 ‘인증 교사’ 표시가 붙어요."}
        </p>
      </div>

      <div className="space-y-3 rounded-xl border border-line bg-white/60 p-4">
        {kind === "student" ? (
          <label className="block">
            <span className="mb-1 block text-sm font-medium">재학 중인 학교</span>
            <input className={input} value={school} onChange={(e) => setSchool(e.target.value)} placeholder="예: OO대학교" maxLength={50} required />
          </label>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium">근무 지역</span>
              <select className={input} value={region} onChange={(e) => setRegion(e.target.value)} required>
                <option value="">선택해 주세요</option>
                {REGIONS.map((r) => <option key={r}>{r}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">근무하는 어린이집 유형</span>
              <select className={input} value={centerType} onChange={(e) => setCenterType(e.target.value)} required>
                <option value="">선택해 주세요</option>
                {CENTER_TYPES.map((c) => <option key={c} value={c}>{c === "기타" ? "기타" : `${c} 어린이집`}</option>)}
              </select>
            </label>
          </div>
        )}
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" checked={infoPublic} onChange={(e) => setInfoPublic(e.target.checked)} className="mt-1" />
          <span>
            {kind === "student" ? "학교를" : "근무 지역과 어린이집 유형을"} 다른 회원에게 공개할게요.
            <span className="mt-0.5 block text-xs text-foreground/60">
              공개하면 내 글과 댓글의 닉네임 옆에 표시돼요. <b>원치 않으면 체크를 풀어 숨길 수 있고, 가입 후에도 ‘내 정보’에서 언제든 바꿀 수 있어요.</b>
              숨겨도 이 정보는 운영(관리자 확인)을 위해 수집돼요.
            </span>
          </span>
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-medium">닉네임</span>
        <input className={input} value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="실명 대신 닉네임을 써 주세요" maxLength={20} required />
        <span className="mt-1 block text-xs text-foreground/60">2~20자, 다른 회원과 같은 닉네임은 쓸 수 없어요. 특수문자만으로는 만들 수 없어요.</span>
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">이메일</span>
        <input type="email" name="email" autoComplete="username" className={input} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@email.com" required />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">비밀번호</span>
        <input type="password" name="new-password" autoComplete="new-password" className={input} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="8자 이상" required />
      </label>

      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1" required />
        <span>
          [필수] 이메일, 닉네임, 가입 유형, {kind === "student" ? "재학 중인 학교" : "근무 지역과 어린이집 유형"}을 서비스 운영 목적으로 수집하는 것에 동의하며, 게시글에
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
