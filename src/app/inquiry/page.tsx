"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import PageTitle from "@/components/PageTitle";
import RequireAuth from "@/components/RequireAuth";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";

type Inquiry = {
  id: number; user_id: string; title: string; status: "open" | "answered" | "closed";
  admin_unread: boolean; user_unread: boolean; created_at: string; updated_at: string; started_by_admin: boolean;
  profiles: { nickname: string } | null;
};
type Message = {
  id: number; sender_id: string; body: string; created_at: string;
  profiles: { nickname: string; is_admin: boolean } | null;
};

const input = "w-full rounded-lg border border-line bg-white px-3 py-2 outline-none focus:border-brand";
const primary = "rounded-full bg-brand px-5 py-2 font-medium text-white hover:bg-brand-dark disabled:opacity-50";
const when = (s: string) =>
  new Date(s).toLocaleString("ko-KR", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });

const STATUS: Record<Inquiry["status"], { label: string; cls: string }> = {
  open: { label: "답변 대기", cls: "bg-soft text-foreground/70" },
  answered: { label: "답변 완료", cls: "bg-lime" },
  closed: { label: "종료", cls: "bg-line text-foreground/60" },
};

// 관리자가 먼저 보낸 메시지는 '관리자 메시지'로 표시 (종료되면 '종료')
function StatusBadge({ i }: { i: Inquiry }) {
  if (i.started_by_admin && i.status !== "closed")
    return <span className="rounded-full border border-ink bg-white px-2 py-0.5 text-xs font-bold">📮 관리자 메시지</span>;
  return <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS[i.status].cls}`}>{STATUS[i.status].label}</span>;
}

// 헤더 알림 숫자를 바로 갱신하도록 알림
const notifyHeader = () => window.dispatchEvent(new Event("inquiry:changed"));

function NewInquiry({ onCreated }: { onCreated: (id: number) => void }) {
  const { session } = useAuth();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    setBusy(true);
    setErr("");
    const { data, error } = await supabase
      .from("inquiries")
      .insert({ user_id: session.user.id, title: title.trim() })
      .select("id")
      .single();
    if (error || !data) {
      setBusy(false);
      return setErr("문의를 보내지 못했어요. 잠시 후 다시 시도해 주세요.");
    }
    const { error: e2 } = await supabase
      .from("inquiry_messages")
      .insert({ inquiry_id: data.id, sender_id: session.user.id, body: body.trim() });
    setBusy(false);
    if (e2) return setErr("문의 내용을 저장하지 못했어요. 잠시 후 다시 시도해 주세요.");
    setTitle("");
    setBody("");
    onCreated(data.id);
  }

  return (
    <form onSubmit={submit} className="card space-y-3 p-5">
      <h2 className="text-lg">💌 새 문의 보내기</h2>
      <input className={input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목 (100자 이내)" maxLength={100} required />
      <textarea className={`${input} min-h-32`} value={body} onChange={(e) => setBody(e.target.value)} placeholder="궁금한 점이나 불편한 점을 적어 주세요 (3000자 이내)" maxLength={3000} required />
      <p className="text-xs text-foreground/60">관리자에게만 보이는 1:1 문의예요. 답변이 오면 상단 ‘문의하기’ 옆에 표시가 떠요.</p>
      {err && <p className="text-sm text-red-700">{err}</p>}
      <button disabled={busy} className={primary}>{busy ? "보내는 중…" : "문의 보내기"}</button>
    </form>
  );
}

function Thread({ inquiry, isAdmin, onBack, onChanged }: { inquiry: Inquiry; isAdmin: boolean; onBack: () => void; onChanged: () => void }) {
  const { session } = useAuth();
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [version, setVersion] = useState(0);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    supabase
      .from("inquiry_messages")
      .select("id,sender_id,body,created_at,profiles(nickname,is_admin)")
      .eq("inquiry_id", inquiry.id)
      .order("created_at")
      .then(({ data }) => {
        if (!alive) return;
        setMessages((data as unknown as Message[]) ?? []);
        setTimeout(() => bottom.current?.scrollIntoView({ block: "nearest" }), 0);
      });
    supabase.rpc("mark_inquiry_read", { iid: inquiry.id }).then(() => { if (alive) notifyHeader(); });
    return () => { alive = false; };
  }, [inquiry.id, version]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!session || !text.trim()) return;
    setBusy(true);
    const { error } = await supabase
      .from("inquiry_messages")
      .insert({ inquiry_id: inquiry.id, sender_id: session.user.id, body: text.trim() });
    setBusy(false);
    if (error) return alert("메시지를 보내지 못했어요.");
    setText("");
    setVersion((v) => v + 1);
    onChanged();
  }

  async function toggleClosed() {
    const closing = inquiry.status !== "closed";
    if (closing && !confirm("이 문의를 종료할까요? 종료하면 메시지를 더 보낼 수 없어요.")) return;
    await supabase.rpc("set_inquiry_closed", { iid: inquiry.id, closed: closing });
    onChanged();
  }

  const closed = inquiry.status === "closed";

  return (
    <div className="card space-y-4 p-5">
      <button onClick={onBack} className="text-sm underline">← 목록으로</button>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-lg">{inquiry.title}</h2>
          <p className="text-xs text-foreground/60">
            {isAdmin && <>보낸 회원: <b>{inquiry.profiles?.nickname ?? "탈퇴한 회원"}</b> · </>}
            {when(inquiry.created_at)}
          </p>
        </div>
        <StatusBadge i={inquiry} />
      </div>

      {!messages ? (
        <p className="text-sm text-foreground/60">불러오는 중…</p>
      ) : (
        <ul className="space-y-3">
          {messages.map((m) => {
            const mine = m.sender_id === session?.user.id;
            const fromAdmin = m.profiles?.is_admin;
            return (
              <li key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl border border-ink p-3 text-sm ${mine ? "bg-lav" : "bg-white"}`}>
                  <p className="mb-1 text-xs text-foreground/60">
                    <b>{fromAdmin ? "🛠 관리자" : m.profiles?.nickname ?? "탈퇴한 회원"}</b> · {when(m.created_at)}
                  </p>
                  <p className="whitespace-pre-wrap">{m.body}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <div ref={bottom} />

      {closed ? (
        <p className="note p-3 text-sm">종료된 문의예요. 다시 문의하려면 ‘다시 열기’를 누르거나 새 문의를 보내 주세요.</p>
      ) : (
        <form onSubmit={send} className="flex gap-2">
          <textarea className={`${input} min-h-12`} value={text} onChange={(e) => setText(e.target.value)} maxLength={3000}
            placeholder={isAdmin ? "답변을 입력해 주세요" : "추가로 궁금한 점을 적어 주세요"} />
          <button disabled={busy || !text.trim()} className="shrink-0 rounded-full bg-brand px-4 text-sm font-medium text-white disabled:opacity-50">보내기</button>
        </form>
      )}
      <button onClick={toggleClosed} className="text-xs underline text-foreground/70">
        {closed ? "다시 열기" : "문의 종료하기"}
      </button>
    </div>
  );
}

function Inner() {
  const { profile, loading } = useAuth();
  const isAdmin = !!profile?.is_admin;
  const [list, setList] = useState<Inquiry[] | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);
  const [writing, setWriting] = useState(false);
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    if (!profile) return;
    let alive = true;
    supabase
      .from("inquiries")
      .select("id,user_id,title,status,admin_unread,user_unread,created_at,updated_at,started_by_admin,profiles(nickname)")
      .order("updated_at", { ascending: false })
      .limit(200)
      .then(({ data }) => { if (alive) setList((data as unknown as Inquiry[]) ?? []); });
    return () => { alive = false; };
  }, [profile, version]);

  if (loading || !profile || !list) return <p className="py-10 text-center text-foreground/60">불러오는 중…</p>;

  const current = list.find((i) => i.id === openId);
  if (current)
    return <Thread inquiry={current} isAdmin={isAdmin} onBack={() => { setOpenId(null); reload(); }} onChanged={reload} />;

  const unread = (i: Inquiry) => (isAdmin ? i.admin_unread : i.user_unread);
  const unreadCount = list.filter(unread).length;

  return (
    <div className="space-y-4">
      {!isAdmin && (
        writing ? (
          <NewInquiry onCreated={(id) => { setWriting(false); setOpenId(id); reload(); notifyHeader(); }} />
        ) : (
          <button onClick={() => setWriting(true)} className={primary}>💌 새 문의 보내기</button>
        )
      )}
      {isAdmin && (
        <p className="panel-lav p-4 text-sm">
          회원들이 보낸 1:1 문의예요. 새 메시지 <b>{unreadCount}</b>건 · 전체 {list.length}건
        </p>
      )}
      {list.length === 0 ? (
        <p className="card p-8 text-center text-foreground/60">{isAdmin ? "아직 받은 문의가 없어요." : "아직 보낸 문의가 없어요."}</p>
      ) : (
        <ul className="card divide-y divide-line">
          {list.map((i) => (
            <li key={i.id}>
              <button onClick={() => setOpenId(i.id)} className="flex w-full items-start justify-between gap-3 p-4 text-left hover:bg-soft">
                <div>
                  <p className="font-medium">
                    {unread(i) && <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-red-600 align-middle" aria-label="새 메시지" />}
                    {i.title}
                  </p>
                  <p className="mt-1 text-xs text-foreground/60">
                    {isAdmin && <>{i.profiles?.nickname ?? "탈퇴한 회원"} · </>}최근 {when(i.updated_at)}
                  </p>
                </div>
                <span className="shrink-0"><StatusBadge i={i} /></span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function InquiryPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <PageTitle title="1:1 문의" desc="궁금한 점이나 불편한 점을 관리자에게 바로 보낼 수 있어요. 관리자가 보내는 안내(상품 전달 등)도 여기로 와요. 대화는 나와 관리자만 볼 수 있어요." />
      <RequireAuth>
        <Inner />
      </RequireAuth>
    </div>
  );
}
