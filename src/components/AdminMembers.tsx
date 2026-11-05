"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { detailsLabel } from "@/lib/member-info";

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
  school: string | null;
  major: string | null;
  school_verified: boolean;
  region: string | null;
  center_type: string | null;
  info_public: boolean;
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
    if (!confirm(`'${m.nickname}' 회원을 정말 강제 탈퇴시킬까요? 되돌릴 수 없어요.`)) return;
    setBusy(true);
    const { error } = await supabase.rpc("admin_delete_member", { target: m.id });
    setBusy(false);
    if (error) {
      const t = error.message.includes("admin") && error.message.includes("cannot")
        ? "다른 관리자는 탈퇴시킬 수 없어요."
        : "탈퇴 처리에 실패했어요. 잠시 후 다시 시도해 주세요.";
      return setErr(t);
    }
    alert(`'${m.nickname}' 회원을 강제 탈퇴시켰어요.`);
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
          {busy ? "처리 중…" : "강제 탈퇴"}
        </button>
        <button onClick={onCancel} className="rounded-full border border-line bg-white px-4 py-1.5">취소</button>
      </div>
    </div>
  );
}

export default function AdminMembers() {
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
    return s ? members.filter((m) => m.nickname.toLowerCase().includes(s) || m.email.toLowerCase().includes(s) || detailsLabel(m.kind, m).toLowerCase().includes(s)) : members;
  }, [members, q]);

  if (loading || !profile?.is_admin) return null;

  const teachers = members?.filter((m) => m.kind === "teacher").length ?? 0;

  return (
    <section id="admin-members" className="card scroll-mt-24 space-y-4 p-6">
      <div>
        <h2 className="text-xl">🛠 회원 관리 <span className="text-sm font-normal text-foreground/60">(관리자만 보여요)</span></h2>
        <p className="mt-1 text-sm text-foreground/70">가입한 회원을 확인하고, 필요하면 강제 탈퇴시킬 수 있어요.</p>
      </div>
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {!members && !error && <p className="text-sm text-foreground/60">불러오는 중…</p>}
      {members && (<>
      <div className="panel-lav flex flex-wrap gap-x-6 gap-y-1 p-4 text-sm">
        <span>전체 회원 <b>{members.length}</b>명</span>
        <span>재학생 <b>{members.length - teachers}</b>명</span>
        <span>현장교사 <b>{teachers}</b>명</span>
      </div>
      <input
        className="w-full rounded-lg border border-line bg-white px-3 py-2 outline-none focus:border-brand"
        placeholder="닉네임, 이메일, 학교, 지역으로 찾기"
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
                {detailsLabel(m.kind, m) && (
                  <p className="text-sm">
                    {m.kind === "teacher" ? "🏫 " : "🎓 "}{detailsLabel(m.kind, m)}
                    <span className="ml-1 text-xs text-foreground/60">({m.info_public ? "공개" : "비공개"})</span>
                  </p>
                )}
                <p className="mt-1 text-xs text-foreground/60">
                  {kindLabel(m)} · 가입 {fmt(m.created_at)} · 최근 로그인 {fmt(m.last_sign_in_at)} · 글 {m.post_count} · 댓글 {m.comment_count}
                </p>
              </div>
              {!m.is_admin && deleting !== m.id && (
                <button onClick={() => setDeleting(m.id)} className="rounded-full border border-red-700 px-3 py-1 text-sm text-red-700 hover:bg-red-50">
                  강제 탈퇴
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
      <p className="text-xs text-foreground/60">관리자 계정은 여기서 탈퇴시킬 수 없어요. 내 계정 탈퇴는 이 페이지 아래 ‘회원 탈퇴’에서 할 수 있어요.</p>
      </>)}
    </section>
  );
}

