"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import PageTitle from "@/components/PageTitle";
import RequireAuth from "@/components/RequireAuth";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";

type Inquiry = {
  id: number; user_id: string; title: string; status: "open" | "answered" | "closed";
  admin_unread: boolean; user_unread: boolean; created_at: string; updated_at: string; started_by_admin: boolean;
  category: string | null;
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

// 문의 종류와 도우미 안내 (DB check와 같은 이름)
const KINDS = [
  { key: "수정 문의", emoji: "✏️", desc: "내 정보·글 수정, 사이트 내용이 틀렸을 때",
    tip: "닉네임, 학교·근무 정보, 공개 설정은 ‘내 정보’에서 바로 고칠 수 있고, 내 글은 글을 열어 ‘✏️ 수정’을 누르면 돼요. 사이트 내용이 틀렸다면 어느 페이지의 어떤 부분인지 알려 주세요. 확인해서 고칠게요.",
    title: "예: 아동 필수 지식 ‘애착과 기질’ 내용 확인 부탁드려요" },
  { key: "탈퇴 문의", emoji: "👋", desc: "탈퇴 방법, 탈퇴 후 정보 처리",
    tip: "‘내 정보’ 맨 아래 ‘회원 탈퇴’에서 직접 탈퇴할 수 있어요. 탈퇴하면 계정과 내가 쓴 글·댓글이 모두 지워지고 되돌릴 수 없어요. 직접 하기 어렵거나 궁금한 점이 있으면 아래에 적어 주세요.",
    title: "예: 탈퇴하면 글이 모두 지워지나요?" },
  { key: "기타 문의", emoji: "💬", desc: "그 밖의 궁금한 점, 제안, 불편한 점",
    tip: "무엇이든 편하게 적어 주세요. 관리자에게 바로 전달돼요.",
    title: "예: 이런 기능이 있으면 좋겠어요" },
] as const;

function Bubble({ me, children }: { me?: boolean; children: React.ReactNode }) {
  return (
    <div className={`flex ${me ? "justify-end" : "justify-start"} gap-2`}>
      {!me && <span aria-hidden className="text-2xl">🤖</span>}
      <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${me ? "bg-brand text-white" : "border border-line bg-white"}`}>{children}</div>
    </div>
  );
}

// 대화형 문의 도우미: ① 어떤 일로 문의하는지 묻고 ② 종류별 안내 후 ③ 관리자에게 바로 보냄
function NewInquiry({ onCreated, onCancel }: { onCreated: (id: number) => void; onCancel: () => void }) {
  const { session } = useAuth();
  const [kind, setKind] = useState<(typeof KINDS)[number] | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!session || !kind) return;
    setBusy(true);
    setErr("");
    const { data, error } = await supabase
      .from("inquiries")
      .insert({ user_id: session.user.id, title: title.trim(), category: kind.key })
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
    <div className="card space-y-3 p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg">💌 문의 도우미</h2>
        <button type="button" onClick={onCancel} className="text-xs underline">닫기</button>
      </div>
      <Bubble>안녕하세요! 어떤 일로 문의하시나요? 아래에서 골라 주세요.</Bubble>
      {!kind ? (
        <div className="grid gap-2 sm:grid-cols-3">
          {KINDS.map((k) => (
            <button key={k.key} type="button" onClick={() => setKind(k)} className="rounded-2xl border-2 border-ink bg-white p-3 text-left hover:bg-lime/40">
              <p className="font-bold">{k.emoji} {k.key}</p>
              <p className="mt-1 text-xs text-foreground/70">{k.desc}</p>
            </button>
          ))}
        </div>
      ) : (
        <>
          <Bubble me>{kind.emoji} {kind.key}</Bubble>
          <Bubble>{kind.tip}</Bubble>
          <form onSubmit={submit} className="space-y-3 pt-1">
            <input className={input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={kind.title} maxLength={100} required aria-label="제목" />
            <textarea className={`${input} min-h-32`} value={body} onChange={(e) => setBody(e.target.value)} placeholder="자세한 내용을 적어 주세요 (3000자 이내)" maxLength={3000} required aria-label="내용" />
            <p className="text-xs text-foreground/60">관리자에게 바로 전달되는 1:1 문의예요(관리자에게 메일 알림이 가요). 답변이 오면 상단 ‘문의하기’ 옆에 숫자가 떠요.</p>
            {err && <p className="text-sm text-red-700">{err}</p>}
            <div className="flex flex-wrap gap-2">
              <button disabled={busy} className={primary}>{busy ? "보내는 중…" : "관리자에게 보내기"}</button>
              <button type="button" onClick={() => setKind(null)} className="rounded-full border border-line bg-white px-5 py-2">종류 다시 고르기</button>
            </div>
          </form>
        </>
      )}
    </div>
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
      .select("id,user_id,title,status,admin_unread,user_unread,created_at,updated_at,started_by_admin,category,profiles(nickname)")
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
          <NewInquiry onCreated={(id) => { setWriting(false); setOpenId(id); reload(); notifyHeader(); }} onCancel={() => setWriting(false)} />
        ) : (
          <div className="card flex flex-wrap items-center justify-between gap-3 p-5">
            <div>
              <p className="font-bold">💌 관리자에게 바로 문의하기</p>
              <p className="mt-1 text-sm text-foreground/70">✏️ 수정 문의 · 👋 탈퇴 문의 · 💬 기타 문의</p>
            </div>
            <button onClick={() => setWriting(true)} className={primary}>문의 시작하기</button>
          </div>
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
                    {i.category && <span className="mr-1.5 rounded-full border border-ink bg-white px-2 py-0.5 align-middle text-xs font-bold">{i.category}</span>}
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
