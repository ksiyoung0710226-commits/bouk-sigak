"use client";

import { useEffect, useState } from "react";
import PageTitle from "@/components/PageTitle";
import RequireAuth from "@/components/RequireAuth";
import AdminMembers from "@/components/AdminMembers";
import AdminReports from "@/components/AdminReports";
import AdminKakao from "@/components/AdminKakao";
import { useAuth } from "@/components/AuthProvider";
import { SAVED_EMAIL_KEY, nicknameErrorMessage, supabase, suspensionText } from "@/lib/supabase";
import { validateNickname } from "@/lib/nickname";
import { STUDENT_NO_RE } from "@/lib/member-info";
import SchoolPicker from "@/components/SchoolPicker";
import CenterPicker from "@/components/CenterPicker";

const input = "w-full rounded-lg border border-line bg-white px-3 py-2 outline-none focus:border-brand";
const primary = "rounded-full bg-brand px-5 py-2 font-medium text-white hover:bg-brand-dark disabled:opacity-50";

type Msg = { ok: boolean; text: string } | null;

function Message({ msg }: { msg: Msg }) {
  if (!msg) return null;
  return (
    <p className={`rounded-lg p-3 text-sm ${msg.ok ? "bg-lime/60" : "bg-red-50 text-red-700"}`} role="status">
      {msg.text}
    </p>
  );
}

function NicknameSection() {
  const { profile, refreshProfile } = useAuth();
  const [nick, setNick] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);

  useEffect(() => {
    if (profile) setNick(profile.nickname);
  }, [profile]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    const n = nick.trim();
    setMsg(null);
    if (n === profile.nickname) return setMsg({ ok: false, text: "지금 쓰는 닉네임과 같아요." });
    const err = validateNickname(n);
    if (err) return setMsg({ ok: false, text: err });
    setBusy(true);
    const { data: free } = await supabase.rpc("nickname_available", { nick: n });
    if (free === false) {
      setBusy(false);
      return setMsg({ ok: false, text: "이미 사용 중인 닉네임이에요." });
    }
    const { error } = await supabase.from("profiles").update({ nickname: n }).eq("id", profile.id);
    setBusy(false);
    if (error) return setMsg({ ok: false, text: nicknameErrorMessage(error) });
    await refreshProfile();
    setMsg({ ok: true, text: "닉네임을 바꿨어요. 내가 쓴 글과 댓글에도 새 닉네임이 보여요." });
  }

  return (
    <form onSubmit={save} className="card space-y-3 p-6">
      <h2 className="text-xl">닉네임 변경</h2>
      <input className={input} value={nick} onChange={(e) => setNick(e.target.value)} maxLength={20} required aria-label="새 닉네임" />
      <p className="text-xs text-foreground/60">
        2~20자. 다른 회원과 같은 닉네임은 쓸 수 없어요(띄어쓰기·대소문자만 다른 것도 같은 닉네임으로 봐요).
        특수문자만으로는 만들 수 없고, 한글·영문·숫자를 하나 이상 넣어야 해요.
      </p>
      <Message msg={msg} />
      <button disabled={busy} className={primary}>{busy ? "저장 중…" : "닉네임 저장"}</button>
    </form>
  );
}

function DetailsSection() {
  const { profile } = useAuth();
  const [school, setSchool] = useState("");
  const [major, setMajor] = useState("");
  const [studentNo, setStudentNo] = useState("");
  const [region, setRegion] = useState("");
  const [centerType, setCenterType] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);
  const teacher = profile?.kind === "teacher";

  useEffect(() => {
    if (!profile) return;
    let alive = true;
    supabase.from("profile_details").select("school,major,region,center_type,is_public").eq("user_id", profile.id).maybeSingle()
      .then(({ data }) => {
        if (!alive) return;
        setSchool(data?.school ?? "");
        setMajor(data?.major ?? "");
        setRegion(data?.region ?? "");
        setCenterType(data?.center_type ?? "");
        setIsPublic(data?.is_public ?? true);
        setLoaded(true);
      });
    supabase.from("profile_private").select("student_no").eq("user_id", profile.id).maybeSingle()
      .then(({ data }) => { if (!alive) return; setStudentNo(data?.student_no ?? ""); });
    return () => { alive = false; };
  }, [profile]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setMsg(null);
    if (!teacher && (!school.trim() || !major.trim())) return setMsg({ ok: false, text: "재학 중인 학교와 학과를 골라 주세요." });
    if (teacher && (!region || !centerType)) return setMsg({ ok: false, text: "근무 지역과 어린이집 유형을 골라 주세요." });
    if (!teacher && studentNo.trim() && !STUDENT_NO_RE.test(studentNo.trim())) return setMsg({ ok: false, text: "학번은 숫자·영문 4~20자로 적어 주세요." });
    setBusy(true);
    const row = teacher
      ? { school: null, major: null, region, center_type: centerType, is_public: isPublic }
      : { school: school.trim(), major: major.trim(), region: null, center_type: null, is_public: isPublic };
    const { data: existing } = await supabase.from("profile_details").select("user_id").eq("user_id", profile.id).maybeSingle();
    const { error } = existing
      ? await supabase.from("profile_details").update({ ...row, updated_at: new Date().toISOString() }).eq("user_id", profile.id)
      : await supabase.from("profile_details").insert({ user_id: profile.id, ...row });
    let error2 = null;
    {
      const priv_row = { student_no: teacher ? null : studentNo.trim() || null };
      const { data: priv } = await supabase.from("profile_private").select("user_id").eq("user_id", profile.id).maybeSingle();
      ({ error: error2 } = priv
        ? await supabase.from("profile_private").update({ ...priv_row, updated_at: new Date().toISOString() }).eq("user_id", profile.id)
        : await supabase.from("profile_private").insert({ user_id: profile.id, ...priv_row }));
    }
    setBusy(false);
    if (error || error2) return setMsg({ ok: false, text: "저장하지 못했어요. 잠시 후 다시 시도해 주세요." });
    setMsg({ ok: true, text: isPublic ? "저장했어요. 다른 회원에게 공개돼요." : "저장했어요. 나와 관리자만 볼 수 있어요." });
  }

  if (!loaded) return null;
  return (
    <form onSubmit={save} className="card space-y-3 p-6">
      <h2 className="text-xl">{teacher ? "근무 정보" : "학교 정보"}</h2>
      {teacher ? (
        <CenterPicker region={region} centerType={centerType}
          onChange={(v) => { setRegion(v.region); setCenterType(v.centerType); }} />
      ) : (
        <div className="text-sm">
          <span className="mb-1 block font-medium">재학 중인 학교와 학과</span>
          <SchoolPicker school={school} major={major} onChange={(s, m) => { setSchool(s); setMajor(m); }} />
          <label className="mt-3 block">
            <span className="mb-1 block font-medium">학번 <span className="font-normal text-foreground/60">(선택)</span></span>
            <input className={input} value={studentNo} onChange={(e) => setStudentNo(e.target.value)} placeholder="예: 2601234" maxLength={20} inputMode="numeric" autoComplete="off" />
            <span className="mt-1 block text-xs text-foreground/60">🔒 학번은 공개 설정과 상관없이 나와 관리자만 볼 수 있어요.</span>
          </label>
        </div>
      )}
      <div className="flex flex-wrap gap-2 text-sm" role="radiogroup" aria-label="공개 설정">
        {[[true, "🌐 다른 회원에게 공개"], [false, "🔒 비공개 (나와 관리자만)"]].map(([v, label]) => (
          <button type="button" key={String(v)} role="radio" aria-checked={isPublic === v} onClick={() => setIsPublic(v as boolean)}
            className={`rounded-full px-4 py-1.5 ${isPublic === v ? "bg-brand text-white" : "border border-line bg-white"}`}>
            {label as string}
          </button>
        ))}
      </div>
      <p className="text-xs text-foreground/60">공개하면 내 글과 댓글의 닉네임 옆에 표시돼요. 비공개여도 운영을 위해 관리자는 볼 수 있어요.</p>
      <Message msg={msg} />
      <button disabled={busy} className={primary}>{busy ? "저장 중…" : "저장"}</button>
    </form>
  );
}

function EmailSection() {
  const { session } = useAuth();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);
  const current = session?.user.email ?? "";
  const pending = session?.user.new_email;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const next = email.trim();
    setMsg(null);
    if (!next || next === current) return setMsg({ ok: false, text: "새 이메일을 입력해 주세요." });
    setBusy(true);
    const { error } = await supabase.auth.updateUser(
      { email: next },
      { emailRedirectTo: `${window.location.origin}/profile` }
    );
    setBusy(false);
    if (error) {
      const text = /already|registered|exists/i.test(error.message)
        ? "이미 다른 계정에서 쓰는 이메일이에요."
        : /rate|limit|seconds/i.test(error.message)
          ? "메일 발송이 잠시 막혔어요. 잠시 후 다시 시도해 주세요."
          : "이메일을 바꾸지 못했어요. 주소를 확인해 주세요.";
      return setMsg({ ok: false, text });
    }
    setEmail("");
    setMsg({
      ok: true,
      text: `확인 메일을 보냈어요. 지금 이메일(${current})과 새 이메일(${next}) 두 곳에 온 링크를 모두 눌러야 변경이 끝나요.`,
    });
  }

  return (
    <form onSubmit={save} className="card space-y-3 p-6">
      <h2 className="text-xl">이메일 변경</h2>
      <p className="text-sm">지금 이메일: <b>{current}</b></p>
      {pending && <p className="text-sm text-foreground/70">변경 대기 중: {pending} (메일의 링크를 눌러 주세요)</p>}
      <input type="email" autoComplete="email" className={input} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="새 이메일" required aria-label="새 이메일" />
      <p className="text-xs text-foreground/60">
        안전을 위해 지금 이메일과 새 이메일 양쪽에서 확인을 받아요. 로그인 아이디도 새 이메일로 바뀌어요.
      </p>
      <Message msg={msg} />
      <button disabled={busy} className={primary}>{busy ? "보내는 중…" : "확인 메일 보내기"}</button>
    </form>
  );
}

function PasswordSection() {
  const { session } = useAuth();
  const [currentPw, setCurrentPw] = useState("");
  const [nextPw, setNextPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (nextPw.length < 8) return setMsg({ ok: false, text: "새 비밀번호는 8자 이상이어야 해요." });
    if (nextPw !== confirmPw) return setMsg({ ok: false, text: "새 비밀번호 두 개가 서로 달라요." });
    if (nextPw === currentPw) return setMsg({ ok: false, text: "지금 비밀번호와 다른 비밀번호를 써 주세요." });
    const email = session?.user.email;
    if (!email) return;
    setBusy(true);
    // 본인 확인: 현재 비밀번호가 맞는지 먼저 확인합니다.
    const { error: authErr } = await supabase.auth.signInWithPassword({ email, password: currentPw });
    if (authErr) {
      setBusy(false);
      return setMsg({ ok: false, text: "지금 비밀번호가 맞지 않아요." });
    }
    const { error } = await supabase.auth.updateUser({ password: nextPw });
    setBusy(false);
    if (error) {
      const text = /weak|short|characters/i.test(error.message)
        ? "비밀번호가 너무 쉬워요. 더 길게 만들어 주세요."
        : "비밀번호를 바꾸지 못했어요. 잠시 후 다시 시도해 주세요.";
      return setMsg({ ok: false, text });
    }
    setCurrentPw("");
    setNextPw("");
    setConfirmPw("");
    setMsg({ ok: true, text: "비밀번호를 바꿨어요. 다음 로그인부터 새 비밀번호를 써 주세요." });
  }

  return (
    <form onSubmit={save} className="card space-y-3 p-6">
      <h2 className="text-xl">비밀번호 변경</h2>
      {/* 브라우저 비밀번호 저장 기능이 어느 계정인지 알 수 있도록 숨은 아이디 칸을 둡니다. */}
      <input type="email" autoComplete="username" value={session?.user.email ?? ""} readOnly hidden />
      <input type="password" autoComplete="current-password" className={input} value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} placeholder="지금 비밀번호" required aria-label="지금 비밀번호" />
      <input type="password" autoComplete="new-password" className={input} value={nextPw} onChange={(e) => setNextPw(e.target.value)} placeholder="새 비밀번호 (8자 이상)" required aria-label="새 비밀번호" />
      <input type="password" autoComplete="new-password" className={input} value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} placeholder="새 비밀번호 확인" required aria-label="새 비밀번호 확인" />
      <Message msg={msg} />
      <button disabled={busy} className={primary}>{busy ? "바꾸는 중…" : "비밀번호 변경"}</button>
    </form>
  );
}

const CONFIRM_TEXT = "탈퇴합니다";

function DeleteSection() {
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);

  async function remove(e: React.FormEvent) {
    e.preventDefault();
    if (typed.trim() !== CONFIRM_TEXT || !agree) return;
    if (!confirm("정말 탈퇴할까요? 이 작업은 되돌릴 수 없어요.")) return;
    setBusy(true);
    const { error } = await supabase.rpc("delete_my_account");
    if (error) {
      setBusy(false);
      return setMsg({ ok: false, text: "탈퇴 처리에 실패했어요. 잠시 후 다시 시도해 주세요." });
    }
    await supabase.auth.signOut({ scope: "local" });
    localStorage.removeItem(SAVED_EMAIL_KEY);
    alert("탈퇴가 완료되었어요. 그동안 보육시각을 이용해 주셔서 감사합니다.");
    window.location.href = "/";
  }

  return (
    <section className="card space-y-3 border-red-700 p-6">
      <h2 className="text-xl text-red-700">회원 탈퇴</h2>
      {!open ? (
        <button onClick={() => setOpen(true)} className="rounded-full border border-red-700 px-5 py-2 text-sm font-medium text-red-700 hover:bg-red-50">
          탈퇴 안내 보기
        </button>
      ) : (
        <form onSubmit={remove} className="space-y-3">
          <div className="rounded-xl border-2 border-red-700 bg-red-50 p-4 text-sm">
            <p className="font-bold text-red-700">⚠️ 탈퇴하면 모든 정보가 즉시, 완전히 지워지며 되돌릴 수 없어요.</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>계정 정보: 이메일, 비밀번호, 닉네임, 가입 유형, 교사 인증 상태</li>
              <li>내가 쓴 <b>모든 글</b>과 그 글에 달린 <b>다른 사람의 댓글</b>까지 함께 지워져요</li>
              <li>내가 다른 글에 쓴 <b>모든 댓글</b></li>
              <li>내가 한 신고 기록</li>
            </ul>
            <p className="mt-2">지운 정보는 운영자도 복구할 수 없어요. 같은 이메일로 다시 가입할 수는 있지만 새 계정으로 시작해요.</p>
            {profile?.is_admin && (
              <p className="mt-2 font-bold text-red-700">지금 계정은 관리자예요. 탈퇴하면 관리자 권한도 사라져요.</p>
            )}
          </div>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1" />
            <span>위 내용을 모두 확인했고, 모든 정보가 지워지는 것에 동의합니다.</span>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block">확인을 위해 <b>{CONFIRM_TEXT}</b> 를 입력해 주세요.</span>
            <input className={input} value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={CONFIRM_TEXT} />
          </label>
          <Message msg={msg} />
          <div className="flex gap-2">
            <button
              disabled={busy || !agree || typed.trim() !== CONFIRM_TEXT}
              className="rounded-full bg-red-700 px-5 py-2 font-medium text-white disabled:opacity-40"
            >
              {busy ? "처리 중…" : "탈퇴하기"}
            </button>
            <button type="button" onClick={() => { setOpen(false); setTyped(""); setAgree(false); }} className="rounded-full border border-line bg-white px-5 py-2">
              취소
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

function Inner() {
  const { profile, session } = useAuth();
  return (
    <div className="space-y-6">
      <div className="panel-lav p-5 text-sm">
        <p><b>{profile?.nickname}</b> · {profile?.kind === "teacher" ? "현장교사" : "재학생"}{profile?.is_admin ? " · 관리자" : ""}</p>
        <p className="mt-1 text-foreground/75">{session?.user.email}</p>
        {suspensionText(profile?.suspended_until) && (
          <p className="mt-2 font-bold text-red-700">⛔ {suspensionText(profile?.suspended_until)} 중 (글·댓글·채팅 쓰기 제한)</p>
        )}
      </div>
      <AdminMembers />
      <AdminReports />
      <AdminKakao />
      <div className="mx-auto max-w-2xl space-y-6">
        <NicknameSection />
        <DetailsSection />
        <EmailSection />
        <PasswordSection />
        <DeleteSection />
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <PageTitle title="내 정보" desc="닉네임, 이메일, 비밀번호를 바꾸거나 탈퇴할 수 있어요." />
      <RequireAuth>
        <Inner />
      </RequireAuth>
    </div>
  );
}
