"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import PageTitle from "@/components/PageTitle";
import RequireAuth from "@/components/RequireAuth";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";

type Member = {
  id: string;
  email: string;
  nickname: string;
  kind: string;
  teacher_verified: boolean;
  is_admin: boolean;
  created_at: string;
  last_sign_in_at: string | null;
  post_count: number;
  comment_count: number;
};

const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString("ko-KR") : "-");

function kindLabel(m: Member) {
  if (m.kind === "teacher") return m.teacher_verified ? "현장교사(인증)" : "현장교사(미인증)";
  return "재학생";
}

function DeleteBox({ m, onDone, onCancel }: { m: Member; onDone: () => void; onCancel: () => void }) {
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function remove() {
    if (typed.trim() !== m.nickname) return;
    if (!confirm(`'${m.nickname}' 회원을 정말 탈퇴시킬까요? 되돌릴 수 없어요.`)) return;
    setBusy(true);
    const { error } = await supabase.rpc("admin_delete_member", { target: m.id });
    setBusy(false);
    if (error) {
      const t = error.message.includes("admin") && error.message.includes("cannot")
        ? "다른 관리자는 탈퇴시킬 수 없어요."
        : "탈퇴 처리에 실패했어요. 잠시 후 다시 시도해 주세요.";
      return setErr(t);
    }
    alert(`'${m.nickname}' 회원을 탈퇴 처리했어요.`);
    onDone();
  }

  return (
    <div className="mt-3 space-y-2 rounded-xl border-2 border-red-700 bg-red-50 p-4 text-sm">
      <p className="font-bold text-red-700">⚠️ 이 회원의 모든 정보가 즉시, 완전히 지워지며 되돌릴 수 없어요.</p>
      <p>계정(이메일·닉네임), 쓴 글 {m.post_count}개(그 글에 달린 다른 사람 댓글 포함), 쓴 댓글 {m.comment_count}개, 신고 기록이 함께 지워져요.</p>
      <label className="block">
        <span className="mb-1 block">확인을 위해 닉네임 <b>{m.nickname}</b> 을(를) 그대로 입력해 주세요.</span>
        <input className="w-full rounded-lg border border-line bg-white px-3 py-2" value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={m.nickname} />
      </label>
      {err && <p className="text-red-700">{err}</p>}
      <div className="flex gap-2">
        <button onClick={remove} disabled={busy || typed.trim() !== m.nickname} className="rounded-full bg-red-700 px-4 py-1.5 font-medium text-white disabled:opacity-40">
          {busy ? "처리 중…" : "탈퇴시키기"}
        </button>
        <button onClick={onCancel} className="rounded-full border border-line bg-white px-4 py-1.5">취소</button>
      </div>
    </div>
  );
}

function Inner() {
  const { profile, loading } = useAuth();
  const [members, setMembers] = useState<Member[] | null>(null);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  const isAdmin = !!profile?.is_admin;
  const [version, setVersion] = useState(0);
  const load = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    if (!isAdmin) return;
    let alive = true;
    supabase.rpc("admin_list_members").then(({ data, error }) => {
      if (!alive) return;
      if (error) setError("회원 목록을 불러오지 못했어요.");
      else setMembers(data as Member[]);
    });
    return () => { alive = false; };
  }, [isAdmin, version]);

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!members) return [];
    return s ? members.filter((m) => m.nickname.toLowerCase().includes(s) || m.email.toLowerCase().includes(s)) : members;
  }, [members, q]);

  if (loading || !profile) return <p className="py-20 text-center text-foreground/60">불러오는 중…</p>;
  if (!profile.is_admin)
    return <div className="card mx-auto max-w-md p-8 text-center font-bold">🔒 관리자만 볼 수 있는 페이지예요.</div>;
  if (error) return <p className="card p-6 text-red-700">{error}</p>;
  if (!members) return <p className="py-20 text-center text-foreground/60">불러오는 중…</p>;

  const teachers = members.filter((m) => m.kind === "teacher").length;

  return (
    <div className="space-y-4">
      <div className="panel-lav flex flex-wrap gap-x-6 gap-y-1 p-4 text-sm">
        <span>전체 회원 <b>{members.length}</b>명</span>
        <span>재학생 <b>{members.length - teachers}</b>명</span>
        <span>현장교사 <b>{teachers}</b>명</span>
      </div>
      <input
        className="w-full rounded-lg border border-line bg-white px-3 py-2 outline-none focus:border-brand"
        placeholder="닉네임 또는 이메일로 찾기"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <ul className="space-y-3">
        {shown.map((m) => (
          <li key={m.id} className="card p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-bold">
                  {m.nickname}
                  {m.is_admin && <span className="kw ml-2 text-xs">관리자</span>}
                  {m.id === profile.id && <span className="ml-2 text-xs text-foreground/60">(나)</span>}
                </p>
                <p className="text-sm text-foreground/75">{m.email}</p>
                <p className="mt-1 text-xs text-foreground/60">
                  {kindLabel(m)} · 가입 {fmt(m.created_at)} · 최근 로그인 {fmt(m.last_sign_in_at)} · 글 {m.post_count} · 댓글 {m.comment_count}
                </p>
              </div>
              {!m.is_admin && deleting !== m.id && (
                <button onClick={() => setDeleting(m.id)} className="rounded-full border border-red-700 px-3 py-1 text-sm text-red-700 hover:bg-red-50">
                  탈퇴시키기
                </button>
              )}
            </div>
            {deleting === m.id && (
              <DeleteBox m={m} onCancel={() => setDeleting(null)} onDone={() => { setDeleting(null); load(); }} />
            )}
          </li>
        ))}
        {shown.length === 0 && <li className="py-8 text-center text-foreground/60">찾는 회원이 없어요.</li>}
      </ul>
      <p className="text-xs text-foreground/60">관리자 계정은 이 화면에서 탈퇴시킬 수 없어요. 내 계정 탈퇴는 ‘내 정보’에서 할 수 있어요.</p>
    </div>
  );
}

export default function AdminMembersPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <PageTitle title="회원 관리" desc="가입한 회원을 확인하고, 필요하면 탈퇴 처리할 수 있어요. 관리자만 볼 수 있어요." />
      <RequireAuth>
        <Inner />
      </RequireAuth>
    </div>
  );
}
