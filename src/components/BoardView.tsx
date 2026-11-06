"use client";

import Link from "next/link";

import { useCallback, useEffect, useState } from "react";
import { supabase, suspensionText } from "@/lib/supabase";
import { useAuth } from "./AuthProvider";
import DmRequestButton from "./DmRequestButton";
import { detailsLabel, one, type Details } from "@/lib/member-info";

type Author = { nickname: string; kind: string; teacher_verified: boolean; profile_details: Details | Details[] | null } | null;
const AUTHOR = "profiles(nickname,kind,teacher_verified,profile_details(school,major,school_verified,region,center_type))";
type Post = {
  id: number; category: string; title: string; body: string; author_id: string; created_at: string; pinned_at: string | null;
  profiles: Author; comments: { count: number }[];
};
type Comment = {
  id: number; body: string; author_id: string; created_at: string;
  profiles: Author;
};

const input = "w-full rounded-lg border border-line bg-white px-3 py-2 outline-none focus:border-brand";
const kindLabel = (k?: string) => (k === "teacher" ? "현장교사" : "재학생");
const when = (s: string) => new Date(s).toLocaleDateString("ko-KR", { month: "long", day: "numeric" });

export default function BoardView({
  board, categories, canWrite, writeHint,
}: { board: "community" | "qna"; categories: string[]; canWrite: boolean; writeHint?: React.ReactNode }) {
  const qna = board === "qna";
  const { session, profile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [filter, setFilter] = useState("전체");
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState<number | null>(null);
  const [writing, setWriting] = useState(false);
  const [category, setCategory] = useState(categories[0]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [msg, setMsg] = useState("");
  const [reporting, setReporting] = useState<{ kind: "post_id" | "comment_id"; id: number; nickname: string } | null>(null);
  const suspended = suspensionText(profile?.suspended_until);
  const writable = canWrite && !!session;

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("posts")
      .select(`id,category,title,body,author_id,created_at,pinned_at,${AUTHOR},comments(count)`)
      .eq("board", board)
      .order("pinned_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(100);
    setPosts((data as unknown as Post[]) ?? []);
    setLoaded(true);
  }, [board]);

  useEffect(() => { load(); }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    setMsg("");
    const { error } = await supabase.from("posts").insert({
      board, category, title: title.trim(), body: body.trim(), author_id: session.user.id,
    });
    if (error) return setMsg(suspended ? `${suspended} 중이라 글을 쓸 수 없어요.` : "글을 올리지 못했어요. 권한이나 입력 내용을 확인해 주세요.");
    setTitle(""); setBody(""); setWriting(false);
    load();
  }

  async function remove(id: number) {
    if (!confirm("이 글을 삭제할까요?")) return;
    await supabase.from("posts").delete().eq("id", id);
    setOpen(null);
    load();
  }

  function report(kind: "post_id" | "comment_id", id: number, nickname?: string | null) {
    setReporting({ kind, id, nickname: nickname ?? "작성자" });
  }

  async function togglePin(p: Post) {
    const { error } = await supabase.rpc("admin_set_pinned", { pid: p.id, pin: !p.pinned_at });
    if (error) return alert("고정 상태를 바꾸지 못했어요.");
    load();
  }

  const openPost = posts.find((p) => p.id === open) ?? null;
  const shown = filter === "전체" ? posts : posts.filter((p) => p.category === filter);

  return (
    <div>
      <p className="mb-4 note p-3 text-sm">
        누구나 읽을 수 있고, 글쓰기·댓글은 가입한 회원만 할 수 있어요. <b>아동·학부모·기관의 실명이나 개인정보는 쓰지 말아 주세요.</b>
      </p>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {["전체", ...categories].map((c) => (
            <button key={c} onClick={() => setFilter(c)}
              className={`rounded-full px-3 py-1 text-sm ${filter === c ? "bg-brand text-white" : "bg-soft"}`}>{c}</button>
          ))}
        </div>
        {writable && !suspended && (
          <button onClick={() => setWriting((v) => !v)} className="rounded-full bg-brand px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-dark">
            {writing ? "닫기" : qna ? "🙋 질문하기" : "✏️ 글쓰기"}
          </button>
        )}
      </div>
      {suspended && (
        <p className="mb-4 rounded-lg border-2 border-red-700 bg-red-50 p-3 text-sm text-red-800" role="alert">
          ⛔ 운영 규칙 위반으로 <b>{suspended}</b> 중이에요. 그동안 글·댓글·1:1 채팅을 쓸 수 없어요(읽기는 가능). 궁금한 점은 ‘💌 문의하기’로 알려 주세요.
        </p>
      )}
      {!session && <LoginHint what={qna ? "질문" : "글"} />}
      {session && !canWrite && writeHint}

      {writing && (
        <form onSubmit={submit} className="mb-6 space-y-3 card p-5">
          <select className={input} value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
          <input className={input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={qna ? "질문 제목 (100자 이내)" : "제목 (100자 이내)"} maxLength={100} required />
          <textarea className={`${input} min-h-40`} value={body} onChange={(e) => setBody(e.target.value)} placeholder={qna ? "궁금한 점을 자세히 적어 주세요 (5000자 이내)" : "내용 (5000자 이내)"} maxLength={5000} required />
          {msg && <p className="text-sm text-red-700">{msg}</p>}
          <button className="rounded-full bg-brand px-5 py-2 font-medium text-white hover:bg-brand-dark">{qna ? "질문 올리기" : "올리기"}</button>
        </form>
      )}

      {!loaded ? <p className="text-foreground/60">불러오는 중…</p> : shown.length === 0 ? (
        <p className="card p-8 text-center text-foreground/60">{qna ? "아직 질문이 없어요. 첫 질문을 남겨 보세요!" : "아직 글이 없어요. 첫 글을 남겨 보세요!"}</p>
      ) : (
        <ul className="divide-y divide-line card">
          {shown.map((p) => (
            <li key={p.id} className={`p-4 ${p.pinned_at ? "bg-lime/40" : ""}`}>
              <button className="w-full text-left" onClick={() => setOpen(p.id)} aria-haspopup="dialog">
                {p.pinned_at && <span className="mr-1.5 rounded-full border border-ink bg-white px-2 py-0.5 text-xs font-bold">📌 고정</span>}
                <span className="text-xs text-brand-dark">[{p.category}]</span>
                <p className="font-medium">
                  {qna && <span className="mr-1 font-bold">Q.</span>}{p.title}
                  {qna ? (
                    <span className={`ml-2 rounded-full px-2 py-0.5 align-middle text-xs ${(p.comments?.[0]?.count ?? 0) > 0 ? "bg-lime" : "bg-soft text-foreground/60"}`}>
                      {(p.comments?.[0]?.count ?? 0) > 0 ? `답변 ${p.comments[0].count}` : "답변 대기"}
                    </span>
                  ) : (p.comments?.[0]?.count ?? 0) > 0 && (
                    <span className="ml-1.5 text-xs text-foreground/60">💬 {p.comments[0].count}</span>
                  )}
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-foreground/70">{p.body}</p>
              </button>
              <AuthorLine author={p.profiles} userId={p.author_id} createdAt={p.created_at}
                onReport={!session || p.author_id === session.user.id ? undefined : () => report("post_id", p.id, p.profiles?.nickname)} />
            </li>
          ))}
        </ul>
      )}
      {openPost && (
        <PostModal onClose={() => setOpen(null)}>
          <span className="text-sm text-brand-dark">
            {openPost.pinned_at && <span className="mr-1.5 rounded-full border border-ink bg-white px-2 py-0.5 text-xs font-bold text-foreground">📌 고정</span>}
            [{openPost.category}]
          </span>
          <h2 id="post-title" className="mt-2 text-2xl font-bold sm:text-3xl">
            {qna && <span className="mr-1.5">Q.</span>}{openPost.title}
          </h2>
          <div className="mt-2">
            <AuthorLine author={openPost.profiles} userId={openPost.author_id} createdAt={openPost.created_at}
              onReport={!session || openPost.author_id === session.user.id ? undefined : () => report("post_id", openPost.id, openPost.profiles?.nickname)} />
          </div>
          <p className="mt-6 whitespace-pre-wrap text-base leading-relaxed">{openPost.body}</p>
          {(openPost.author_id === session?.user.id || profile?.is_admin) && (
            <div className="mt-6 flex gap-3 text-sm">
              <button onClick={() => remove(openPost.id)} className="text-red-700 underline">삭제</button>
              {profile?.is_admin && (
                <button onClick={() => togglePin(openPost)} className="font-bold underline">
                  {openPost.pinned_at ? "📌 고정 해제" : "📌 맨 위에 고정"}
                </button>
              )}
            </div>
          )}
          <div className="mt-8 border-t-2 border-ink pt-4">
            <Comments postId={openPost.id} qna={qna} onReport={(id, nick) => report("comment_id", id, nick)} onChange={load} />
          </div>
        </PostModal>
      )}
      {reporting && <ReportDialog target={reporting} onClose={() => setReporting(null)} />}
    </div>
  );
}

// 신고 창: 이유를 고르고(필수) 자세한 내용을 적을 수 있다 → 관리자 신고 관리 화면에 그대로 보임
const REPORT_REASONS = ["욕설·비방·혐오 표현", "아동·학부모·기관 개인정보 노출", "광고·홍보·도배", "음란하거나 불쾌한 내용", "허위·잘못된 정보", "기타"];

export type ReportTarget = { kind: "post_id" | "comment_id" | "dm_message_id" | "dm_thread_id"; id: number; nickname: string };

export function ReportDialog({ target, onClose }: { target: ReportTarget; onClose: () => void }) {
  const { session } = useAuth();
  const [reason, setReason] = useState("");
  const [detail, setDetail] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const what = { post_id: "글", comment_id: "댓글", dm_message_id: "채팅 메시지", dm_thread_id: "채팅 요청 멘트" }[target.kind];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    if (!reason) return setErr("신고 이유를 골라 주세요.");
    if (reason === "기타" && !detail.trim()) return setErr("‘기타’를 고르셨다면 이유를 적어 주세요.");
    setBusy(true);
    const text = `[${reason}]${detail.trim() ? " " + detail.trim() : ""}`.slice(0, 500);
    const { error } = await supabase.from("reports").insert({ [target.kind]: target.id, reporter_id: session.user.id, reason: text });
    setBusy(false);
    if (error) return setErr("신고에 실패했어요. 잠시 후 다시 시도해 주세요.");
    alert("신고가 접수되었어요. 관리자가 확인한 뒤 처리 결과를 가입한 이메일로 알려 드릴게요.");
    onClose();
  }

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="report-title" className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <form onSubmit={send} onClick={(e) => e.stopPropagation()} className="card w-full max-w-md space-y-3 bg-background p-5 text-sm">
        <h2 id="report-title" className="text-lg font-bold">🚩 {target.nickname} 님의 {what} 신고</h2>
        <fieldset className="space-y-1.5">
          <legend className="mb-1 font-medium">신고 이유 (필수)</legend>
          {REPORT_REASONS.map((r) => (
            <label key={r} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 ${reason === r ? "border-ink bg-lime/50" : "border-line bg-white"}`}>
              <input type="radio" name="report-reason" value={r} checked={reason === r} onChange={() => setReason(r)} />
              {r}
            </label>
          ))}
        </fieldset>
        <label className="block">
          <span className="mb-1 block font-medium">자세한 내용 {reason === "기타" ? "(필수)" : "(선택)"}</span>
          <textarea className={`${input} min-h-20`} value={detail} onChange={(e) => setDetail(e.target.value)} maxLength={450}
            placeholder="어떤 부분이 문제인지 적어 주시면 처리에 도움이 돼요." />
        </label>
        {target.kind.startsWith("dm_") && <p className="text-xs text-foreground/60">운영자는 평소 채팅 내용을 볼 수 없고, 신고한 이 메시지 한 개만 확인해요.</p>}
        <p className="text-xs text-foreground/60">신고한 사람은 상대방에게 알려지지 않아요. 허위 신고가 반복되면 이용이 제한될 수 있어요.</p>
        {err && <p className="text-red-700">{err}</p>}
        <div className="flex gap-2">
          <button disabled={busy} className="rounded-full bg-red-700 px-5 py-2 font-medium text-white disabled:opacity-50">{busy ? "보내는 중…" : "신고하기"}</button>
          <button type="button" onClick={onClose} className="rounded-full border border-line bg-white px-5 py-2">취소</button>
        </div>
      </form>
    </div>
  );
}

// 글 크게 보기: 화면 전체를 덮는 창 (Esc 또는 닫기 버튼으로 닫음)
function PostModal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
  }, [onClose]);
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="post-title" className="fixed inset-0 z-50 overflow-y-auto bg-background">
      <div className="sticky top-0 z-10 border-b-2 border-ink bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <button onClick={onClose} className="font-bold">← 목록으로</button>
          <button onClick={onClose} aria-label="닫기" className="rounded-full border border-ink px-3 py-1 text-sm hover:bg-soft">✕ 닫기</button>
        </div>
      </div>
      <article className="mx-auto max-w-3xl px-4 py-8">{children}</article>
    </div>
  );
}

function Comments({ postId, qna, onReport, onChange }: { postId: number; qna: boolean; onReport: (id: number, nickname?: string | null) => void; onChange: () => void }) {
  const { session, profile } = useAuth();
  const [items, setItems] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  const suspended = suspensionText(profile?.suspended_until);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("comments")
      .select(`id,body,author_id,created_at,${AUTHOR}`)
      .eq("post_id", postId)
      .order("created_at");
    setItems((data as unknown as Comment[]) ?? []);
  }, [postId]);
  useEffect(() => { load(); }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!session || !text.trim()) return;
    setErr("");
    const { error } = await supabase.from("comments").insert({ post_id: postId, body: text.trim(), author_id: session.user.id });
    if (error) return setErr(suspended ? `${suspended} 중이라 쓸 수 없어요.` : "등록하지 못했어요. 잠시 후 다시 시도해 주세요.");
    setText("");
    load();
    onChange();
  }
  async function del(id: number) {
    if (!confirm(qna ? "이 답변을 삭제할까요?" : "이 댓글을 삭제할까요?")) return;
    await supabase.from("comments").delete().eq("id", id);
    load();
    onChange();
  }
  const isTeacherAnswer = (c: Comment) => qna && c.profiles?.kind === "teacher" && c.profiles.teacher_verified;

  return (
    <div className="mt-4">
      <p className="mb-2 text-sm font-bold">{qna ? "답변" : "댓글"} {items.length}</p>
      <ul className="space-y-2">
        {items.map((c) => (
          <li key={c.id} className={`note p-3 text-sm ${isTeacherAnswer(c) ? "border-2 border-ink" : ""}`}>
            {isTeacherAnswer(c) && <p className="mb-1 text-xs font-bold"><span className="kw">✅ 인증 교사 답변</span></p>}
            <AuthorLine author={c.profiles} userId={c.author_id} createdAt={c.created_at}
              onReport={!session || c.author_id === session.user.id ? undefined : () => onReport(c.id, c.profiles?.nickname)} />
            <p className="whitespace-pre-wrap">{c.body}</p>
            {(c.author_id === session?.user.id || profile?.is_admin) && (
              <div className="mt-1 flex gap-3 text-xs">
                <button onClick={() => del(c.id)} className="text-red-700 underline">삭제</button>
              </div>
            )}
          </li>
        ))}
      </ul>
      {err && <p className="mt-2 text-sm text-red-700">{err}</p>}
      {!session ? (
        <p className="mt-3 text-sm text-foreground/70">
          <Link href="/login" className="font-medium underline">로그인</Link>하면 {qna ? "답변" : "댓글"}을 남길 수 있어요.
        </p>
      ) : suspended ? (
        <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">⛔ {suspended} 중이라 {qna ? "답변" : "댓글"}을 쓸 수 없어요.</p>
      ) : (
      <form onSubmit={add} className="mt-3 flex gap-2">
        <input className={input} value={text} onChange={(e) => setText(e.target.value)} placeholder={qna ? "알고 있는 내용이나 경험을 답변으로 남겨 주세요" : "따뜻한 댓글을 남겨 주세요"} maxLength={1000} />
        <button className="shrink-0 rounded-full bg-brand px-4 text-sm font-medium text-white">등록</button>
      </form>
      )}
    </div>
  );
}

// 작성자 줄: 닉네임 바로 옆에 신고 버튼 (내 글·댓글에는 신고 버튼을 숨김)
function AuthorLine({
  author, userId, createdAt, onReport,
}: { author: Author; userId: string; createdAt: string; onReport?: () => void }) {
  const nickname = author?.nickname;
  const kind = author?.kind;
  const info = detailsLabel(kind, one(author?.profile_details));
  return (
    <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-foreground/60">
      <span className="font-bold text-foreground/80">{nickname ?? "탈퇴한 회원"}</span>
      {author && <DmRequestButton userId={userId} nickname={nickname ?? "회원"} />}
      {onReport && (
        <button onClick={onReport} className="rounded-full border border-line px-2 leading-5 hover:bg-red-50 hover:text-red-700" aria-label={`${nickname ?? "작성자"}의 게시물 신고`}>
          🚩 신고
        </button>
      )}
      <span>· {kindLabel(kind)}{kind === "teacher" && author?.teacher_verified ? " ✅" : ""}{info ? ` · ${info}` : ""} · {when(createdAt)}</span>
    </p>
  );
}

function LoginHint({ what }: { what: string }) {
  return (
    <p className="mb-4 card-sm p-3 text-sm">
      ✏️ {what}을 쓰려면{" "}
      <Link href="/login" className="font-medium underline">로그인</Link> 또는{" "}
      <Link href="/signup" className="font-medium underline">회원가입</Link>을 해 주세요.
    </p>
  );
}
