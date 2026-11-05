"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthProvider";

type Post = {
  id: number; category: string; title: string; body: string; author_id: string; created_at: string;
  profiles: { nickname: string; kind: string } | null;
};
type Comment = {
  id: number; body: string; author_id: string; created_at: string;
  profiles: { nickname: string; kind: string } | null;
};

const input = "w-full rounded-lg border border-line bg-white px-3 py-2 outline-none focus:border-brand";
const kindLabel = (k?: string) => (k === "teacher" ? "현장교사" : "재학생");
const when = (s: string) => new Date(s).toLocaleDateString("ko-KR", { month: "long", day: "numeric" });

export default function BoardView({
  board, categories, canWrite, writeHint,
}: { board: "community" | "tips"; categories: string[]; canWrite: boolean; writeHint?: React.ReactNode }) {
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

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("posts")
      .select("id,category,title,body,author_id,created_at,profiles(nickname,kind)")
      .eq("board", board)
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
    if (error) return setMsg("글을 올리지 못했어요. 권한이나 입력 내용을 확인해 주세요.");
    setTitle(""); setBody(""); setWriting(false);
    load();
  }

  async function remove(id: number) {
    if (!confirm("이 글을 삭제할까요?")) return;
    await supabase.from("posts").delete().eq("id", id);
    setOpen(null);
    load();
  }

  async function report(kind: "post_id" | "comment_id", id: number) {
    const reason = prompt("신고 사유를 간단히 적어 주세요.");
    if (!reason || !session) return;
    const { error } = await supabase.from("reports").insert({ [kind]: id, reporter_id: session.user.id, reason: reason.slice(0, 500) });
    alert(error ? "신고에 실패했어요." : "신고가 접수되었어요. 관리자가 확인할게요.");
  }

  const shown = filter === "전체" ? posts : posts.filter((p) => p.category === filter);

  return (
    <div>
      <p className="mb-4 note p-3 text-sm">
        🔒 가입한 회원에게만 보이는 공간이에요. <b>아동·학부모·기관의 실명이나 개인정보는 쓰지 말아 주세요.</b>
      </p>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {["전체", ...categories].map((c) => (
            <button key={c} onClick={() => setFilter(c)}
              className={`rounded-full px-3 py-1 text-sm ${filter === c ? "bg-brand text-white" : "bg-soft"}`}>{c}</button>
          ))}
        </div>
        {canWrite && (
          <button onClick={() => setWriting((v) => !v)} className="rounded-full bg-brand px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-dark">
            {writing ? "닫기" : "✏️ 글쓰기"}
          </button>
        )}
      </div>
      {!canWrite && writeHint}

      {writing && (
        <form onSubmit={submit} className="mb-6 space-y-3 card p-5">
          <select className={input} value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
          <input className={input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목 (100자 이내)" maxLength={100} required />
          <textarea className={`${input} min-h-40`} value={body} onChange={(e) => setBody(e.target.value)} placeholder="내용 (5000자 이내)" maxLength={5000} required />
          {msg && <p className="text-sm text-red-700">{msg}</p>}
          <button className="rounded-full bg-brand px-5 py-2 font-medium text-white hover:bg-brand-dark">올리기</button>
        </form>
      )}

      {!loaded ? <p className="text-foreground/60">불러오는 중…</p> : shown.length === 0 ? (
        <p className="card p-8 text-center text-foreground/60">아직 글이 없어요. 첫 글을 남겨 보세요!</p>
      ) : (
        <ul className="divide-y divide-line card">
          {shown.map((p) => (
            <li key={p.id} className="p-4">
              <button className="w-full text-left" onClick={() => setOpen(open === p.id ? null : p.id)} aria-expanded={open === p.id}>
                <span className="text-xs text-brand-dark">[{p.category}]</span>
                <p className="font-medium">{p.title}</p>
              </button>
              <AuthorLine nickname={p.profiles?.nickname} kind={p.profiles?.kind} createdAt={p.created_at}
                onReport={p.author_id === session?.user.id ? undefined : () => report("post_id", p.id)} />
              {open === p.id && (
                <div className="mt-3 border-t border-line pt-3">
                  <p className="whitespace-pre-wrap text-sm">{p.body}</p>
                  {(p.author_id === session?.user.id || profile?.is_admin) && (
                    <div className="mt-3 flex gap-3 text-xs">
                      <button onClick={() => remove(p.id)} className="text-red-700 underline">삭제</button>
                    </div>
                  )}
                  <Comments postId={p.id} onReport={(id) => report("comment_id", id)} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Comments({ postId, onReport }: { postId: number; onReport: (id: number) => void }) {
  const { session, profile } = useAuth();
  const [items, setItems] = useState<Comment[]>([]);
  const [text, setText] = useState("");

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("comments")
      .select("id,body,author_id,created_at,profiles(nickname,kind)")
      .eq("post_id", postId)
      .order("created_at");
    setItems((data as unknown as Comment[]) ?? []);
  }, [postId]);
  useEffect(() => { load(); }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!session || !text.trim()) return;
    await supabase.from("comments").insert({ post_id: postId, body: text.trim(), author_id: session.user.id });
    setText("");
    load();
  }
  async function del(id: number) {
    await supabase.from("comments").delete().eq("id", id);
    load();
  }

  return (
    <div className="mt-4">
      <p className="mb-2 text-sm font-bold">댓글 {items.length}</p>
      <ul className="space-y-2">
        {items.map((c) => (
          <li key={c.id} className="note p-3 text-sm">
            <AuthorLine nickname={c.profiles?.nickname} kind={c.profiles?.kind} createdAt={c.created_at}
              onReport={c.author_id === session?.user.id ? undefined : () => onReport(c.id)} />
            <p className="whitespace-pre-wrap">{c.body}</p>
            {(c.author_id === session?.user.id || profile?.is_admin) && (
              <div className="mt-1 flex gap-3 text-xs">
                <button onClick={() => del(c.id)} className="text-red-700 underline">삭제</button>
              </div>
            )}
          </li>
        ))}
      </ul>
      <form onSubmit={add} className="mt-3 flex gap-2">
        <input className={input} value={text} onChange={(e) => setText(e.target.value)} placeholder="따뜻한 댓글을 남겨 주세요" maxLength={1000} />
        <button className="shrink-0 rounded-full bg-brand px-4 text-sm font-medium text-white">등록</button>
      </form>
    </div>
  );
}

// 작성자 줄: 닉네임 바로 옆에 신고 버튼 (내 글·댓글에는 신고 버튼을 숨김)
function AuthorLine({
  nickname, kind, createdAt, onReport,
}: { nickname?: string; kind?: string; createdAt: string; onReport?: () => void }) {
  return (
    <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-foreground/60">
      <span className="font-bold text-foreground/80">{nickname ?? "탈퇴한 회원"}</span>
      {onReport && (
        <button onClick={onReport} className="rounded-full border border-line px-2 leading-5 hover:bg-red-50 hover:text-red-700" aria-label={`${nickname ?? "작성자"}의 게시물 신고`}>
          🚩 신고
        </button>
      )}
      <span>· {kindLabel(kind)} · {when(createdAt)}</span>
    </p>
  );
}
