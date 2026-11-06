"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { detailsLabel } from "@/lib/member-info";
import AdminCoupons from "./AdminCoupons";

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
  student_no: string | null;
  region: string | null;
  center_type: string | null;
  info_public: boolean;
  teacher_org: string | null;
};

const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString("ko-KR") : "-");

function kindLabel(m: Member) {
  if (m.kind === "teacher") return `${m.teacher_org ?? "현장"} 교사${m.teacher_verified ? "(인증)" : "(미인증)"}`;
  return m.kind === "prospective" ? "예비 재학생" : "재학생";
}

function MessageBox({ m, onClose }: { m: Member; onClose: () => void }) {
  const [title, setTitle] = useState("🎁 상품 전달 안내");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [sentId, setSentId] = useState<number | null>(null);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setBusy(true);
    setErr("");
    const { data, error } = await supabase.rpc("admin_start_inquiry", { target: m.id, title: title.trim(), body: body.trim() });
    setBusy(false);
    if (error) return setErr("메시지를 보내지 못했어요. 잠시 후 다시 시도해 주세요.");
    setSentId(data as number);
  }

  if (sentId)
    return (
      <div className="mt-3 space-y-2 rounded-xl border-2 border-ink bg-lime/50 p-4 text-sm">
        <p className="font-bold">✅ {m.nickname} 님에게 메시지를 보냈어요.</p>
        <p>회원의 ‘💌 문의하기’에 알림이 떠요. 답장도 📮 문의함에서 이어서 주고받을 수 있어요.</p>
        <div className="flex gap-3">
          <Link href="/inquiry" className="font-bold underline">문의함에서 대화 보기</Link>
          <button onClick={onClose} className="underline">닫기</button>
        </div>
      </div>
    );

  return (
    <form onSubmit={send} className="mt-3 space-y-2 rounded-xl border-2 border-ink bg-white p-4 text-sm">
      <p className="font-bold">💬 {m.nickname} 님에게 1:1 메시지</p>
      <input className="w-full rounded-lg border border-line px-3 py-2" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} required aria-label="제목" />
      <textarea className="min-h-28 w-full rounded-lg border border-line px-3 py-2" value={body} onChange={(e) => setBody(e.target.value)} maxLength={3000} required
        placeholder="예: 이벤트에 당첨되셨어요! 상품을 보내 드리려고 하니 받으실 방법을 답장으로 알려 주세요." />
      <p className="text-xs text-foreground/60">이 대화는 이 회원과 관리자만 볼 수 있어요. 수락 없이 바로 전달돼요.</p>
      {err && <p className="text-red-700">{err}</p>}
      <div className="flex gap-2">
        <button disabled={busy || !body.trim()} className="rounded-full bg-brand px-4 py-1.5 font-medium text-white disabled:opacity-50">{busy ? "보내는 중…" : "보내기"}</button>
        <button type="button" onClick={onClose} className="rounded-full border border-line bg-white px-4 py-1.5">취소</button>
      </div>
    </form>
  );
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
  const [messaging, setMessaging] = useState<string | null>(null);

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
    return s ? members.filter((m) => m.nickname.toLowerCase().includes(s) || m.email.toLowerCase().includes(s) || detailsLabel(m.kind, m, m.teacher_org).toLowerCase().includes(s) || (m.student_no ?? "").toLowerCase().includes(s)) : members;
  }, [members, q]);

  if (loading || !profile?.is_admin) return null;

  const teachers = members?.filter((m) => m.kind === "teacher").length ?? 0;

  return (
    <section id="admin-members" className="card scroll-mt-24 space-y-4 p-6">
      <div>
        <h2 className="text-xl">🛠 회원 관리 <span className="text-sm font-normal text-foreground/60">(관리자만 보여요)</span></h2>
        <p className="mt-1 text-sm text-foreground/70">가입한 회원을 확인하고, 1:1 메시지(상품 전달 안내 등)를 보내거나 필요하면 강제 탈퇴시킬 수 있어요.</p>
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
        placeholder="닉네임, 이메일, 학교, 학번, 지역, 어린이집 분류로 찾기 (두 칸 모두에서 찾아요)"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="grid gap-4 md:grid-cols-2">
        {([["student", "🎓 재학생·예비 재학생"], ["teacher", "🧸 교사 (어린이집·유치원)"]] as const).map(([k, label]) => {
          const list = shown.filter((m) => (m.kind === "teacher" ? "teacher" : "student") === k);
          return (
            <div key={k} className="rounded-2xl border-2 border-ink bg-background/60 p-3">
              <h3 className="mb-3 text-lg font-bold">
                {label} <span className="text-sm font-normal text-foreground/70">{list.length}명{q.trim() ? " (검색 결과)" : ""}</span>
              </h3>
              <ul className="space-y-3">
                {list.map((m) => (
              <li key={m.id} className="card p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-bold">
                      {m.nickname}
                      {m.is_admin && <span className="kw ml-2 text-xs">관리자</span>}
                      {m.id === profile.id && <span className="ml-2 text-xs text-foreground/60">(나)</span>}
                    </p>
                    <p className="text-sm text-foreground/75">{m.email}</p>
                    {detailsLabel(m.kind, m, m.teacher_org) && (
                      <p className="text-sm">
                        {m.kind === "teacher" ? "🏫 " : "🎓 "}{detailsLabel(m.kind, m, m.teacher_org)}
                        <span className="ml-1 text-xs text-foreground/60">({m.info_public ? "공개" : "비공개"})</span>
                      </p>
                    )}
                    {m.student_no && <p className="text-xs">🔒 학번 {m.student_no}</p>}
                    <p className="mt-1 text-xs text-foreground/60">
                      {kindLabel(m)} · 가입 {fmt(m.created_at)} · 최근 로그인 {fmt(m.last_sign_in_at)} · 글 {m.post_count} · 댓글 {m.comment_count}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {m.id !== profile.id && messaging !== m.id && (
                      <button onClick={() => { setMessaging(m.id); setDeleting(null); }} className="rounded-full border border-ink bg-white px-3 py-1 text-sm font-medium hover:bg-soft">
                        💬 1:1 메시지
                      </button>
                    )}
                    {!m.is_admin && deleting !== m.id && (
                      <button onClick={() => { setDeleting(m.id); setMessaging(null); }} className="rounded-full border border-red-700 px-3 py-1 text-sm text-red-700 hover:bg-red-50">
                        강제 탈퇴
                      </button>
                    )}
                  </div>
                </div>
                {messaging === m.id && <MessageBox m={m} onClose={() => setMessaging(null)} />}
                {deleting === m.id && (
                  <DeleteBox m={m} onCancel={() => setDeleting(null)} onDone={() => { setDeleting(null); load(); }} />
                )}
              </li>
                ))}
                {list.length === 0 && <li className="py-6 text-center text-sm text-foreground/60">{q.trim() ? "찾는 회원이 없어요." : "아직 회원이 없어요."}</li>}
              </ul>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-foreground/60">관리자 계정은 여기서 탈퇴시킬 수 없어요. 내 계정 탈퇴는 이 페이지 아래 ‘회원 탈퇴’에서 할 수 있어요.</p>
      </>)}
      <AdminCoupons />
    </section>
  );
}

