"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageTitle from "@/components/PageTitle";
import RequireAuth from "@/components/RequireAuth";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";

type Person = { nickname: string; kind: string } | null;
type Thread = {
  id: number; requester_id: string; recipient_id: string; intro: string;
  status: "pending" | "accepted" | "declined";
  requester_read_at: string; recipient_read_at: string | null; last_message_at: string | null; created_at: string;
  requester: Person; recipient: Person;
};
type Msg = { id: number; sender_id: string; body: string; created_at: string };

const when = (s: string) =>
  new Date(s).toLocaleString("ko-KR", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
const kindLabel = (k?: string) => (k === "teacher" ? "현장교사" : "재학생");
const notify = () => window.dispatchEvent(new Event("dm:changed"));

export const isUnread = (t: Thread, me: string) => {
  if (t.status !== "accepted" || !t.last_message_at) return false;
  const read = t.requester_id === me ? t.requester_read_at : t.recipient_read_at;
  return !read || t.last_message_at > read;
};

function Conversation({ t, me, onBack }: { t: Thread; me: string; onBack: () => void }) {
  const partner = t.requester_id === me ? t.recipient : t.requester;
  const [msgs, setMsgs] = useState<Msg[] | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0);
  const bottom = useRef<HTMLDivElement>(null);
  const count = useRef(0);

  useEffect(() => {
    let alive = true;
    supabase.from("dm_messages").select("id,sender_id,body,created_at").eq("thread_id", t.id).order("created_at").limit(500)
      .then(({ data }) => {
        if (!alive) return;
        const list = (data as Msg[]) ?? [];
        setMsgs(list);
        if (list.length !== count.current) {
          count.current = list.length;
          setTimeout(() => bottom.current?.scrollIntoView({ block: "nearest" }), 0);
          supabase.rpc("mark_dm_read", { tid: t.id }).then(notify);
        }
      });
    return () => { alive = false; };
  }, [t.id, tick]);

  // 대화방이 열려 있는 동안 5초마다 새 메시지 확인
  useEffect(() => {
    const timer = setInterval(() => setTick((v) => v + 1), 5000);
    return () => clearInterval(timer);
  }, []);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    const { error } = await supabase.from("dm_messages").insert({ thread_id: t.id, sender_id: me, body: text.trim() });
    setBusy(false);
    if (error) return alert("메시지를 보내지 못했어요.");
    setText("");
    setTick((v) => v + 1);
  }

  return (
    <div className="card space-y-4 p-5">
      <button onClick={onBack} className="text-sm underline">← 채팅 목록</button>
      <p className="text-lg font-bold">💬 {partner?.nickname ?? "탈퇴한 회원"} <span className="text-sm font-normal text-foreground/60">· {kindLabel(partner?.kind)}</span></p>
      <div className="note p-3 text-sm">
        <p className="text-xs text-foreground/60">처음 보낸 요청 멘트 · {when(t.created_at)}</p>
        <p className="mt-1 whitespace-pre-wrap">{t.intro}</p>
      </div>
      {!msgs ? <p className="text-sm text-foreground/60">불러오는 중…</p> : (
        <ul className="space-y-2">
          {msgs.map((m) => {
            const mine = m.sender_id === me;
            return (
              <li key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl border border-ink px-3 py-2 text-sm ${mine ? "bg-lav" : "bg-white"}`}>
                  <p className="whitespace-pre-wrap">{m.body}</p>
                  <p className="mt-0.5 text-right text-[11px] text-foreground/50">{when(m.created_at)}</p>
                </div>
              </li>
            );
          })}
          {msgs.length === 0 && <li className="text-center text-sm text-foreground/60">채팅이 연결됐어요. 첫 인사를 건네 보세요!</li>}
        </ul>
      )}
      <div ref={bottom} />
      <form onSubmit={send} className="flex gap-2">
        <input className="w-full rounded-lg border border-line bg-white px-3 py-2 outline-none focus:border-brand" value={text}
          onChange={(e) => setText(e.target.value)} maxLength={2000} placeholder="메시지를 입력하세요" />
        <button disabled={busy || !text.trim()} className="shrink-0 rounded-full bg-brand px-4 text-sm font-medium text-white disabled:opacity-50">보내기</button>
      </form>
      <p className="text-xs text-foreground/60">아동·학부모·기관의 실명이나 개인정보는 보내지 말아 주세요.</p>
    </div>
  );
}

function Inner() {
  const { session } = useAuth();
  const me = session!.user.id;
  const router = useRouter();
  const params = useSearchParams();
  const openId = Number(params.get("t")) || null;
  const [threads, setThreads] = useState<Thread[] | null>(null);
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let alive = true;
    supabase
      .from("dm_threads")
      .select("id,requester_id,recipient_id,intro,status,requester_read_at,recipient_read_at,last_message_at,created_at,requester:profiles!dm_threads_requester_id_fkey(nickname,kind),recipient:profiles!dm_threads_recipient_id_fkey(nickname,kind)")
      .order("created_at", { ascending: false })
      .then(({ data }) => { if (alive) setThreads((data as unknown as Thread[]) ?? []); });
    return () => { alive = false; };
  }, [version]);

  async function respond(id: number, accept: boolean) {
    if (!accept && !confirm("거절하면 이 회원은 다시 요청할 수 없어요. 거절할까요?")) return;
    const { error } = await supabase.rpc("respond_dm", { tid: id, accept });
    if (error) return alert("처리하지 못했어요.");
    notify();
    if (accept) router.push(`/chat?t=${id}`);
    reload();
  }

  if (!threads) return <p className="py-10 text-center text-foreground/60">불러오는 중…</p>;

  const current = threads.find((t) => t.id === openId && t.status === "accepted");
  if (current) return <Conversation t={current} me={me} onBack={() => { router.push("/chat"); reload(); }} />;

  const received = threads.filter((t) => t.status === "pending" && t.recipient_id === me);
  const sent = threads.filter((t) => t.status === "pending" && t.requester_id === me);
  const chats = threads
    .filter((t) => t.status === "accepted")
    .sort((a, b) => (b.last_message_at ?? b.created_at).localeCompare(a.last_message_at ?? a.created_at));

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-xl font-bold">📨 받은 채팅 요청 {received.length > 0 && <span className="text-red-600">{received.length}</span>}</h2>
        {received.length === 0 ? <p className="text-sm text-foreground/60">새로 받은 요청이 없어요.</p> : (
          <ul className="space-y-3">
            {received.map((t) => (
              <li key={t.id} className="card space-y-2 p-4 text-sm">
                <p><b>{t.requester?.nickname ?? "탈퇴한 회원"}</b> <span className="text-foreground/60">· {kindLabel(t.requester?.kind)} · {when(t.created_at)}</span></p>
                <p className="note whitespace-pre-wrap p-3">{t.intro}</p>
                <div className="flex gap-2">
                  <button onClick={() => respond(t.id, true)} className="rounded-full bg-brand px-4 py-1.5 font-medium text-white">수락하고 채팅하기</button>
                  <button onClick={() => respond(t.id, false)} className="rounded-full border border-line bg-white px-4 py-1.5">거절</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold">💬 채팅 목록</h2>
        {chats.length === 0 ? <p className="text-sm text-foreground/60">아직 연결된 채팅이 없어요. 게시판에서 회원 닉네임 옆 ‘💬 1:1 채팅’을 눌러 요청해 보세요.</p> : (
          <ul className="card divide-y divide-line">
            {chats.map((t) => {
              const partner = t.requester_id === me ? t.recipient : t.requester;
              return (
                <li key={t.id}>
                  <button onClick={() => router.push(`/chat?t=${t.id}`)} className="flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-soft">
                    <span>
                      {isUnread(t, me) && <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-red-600 align-middle" aria-label="새 메시지" />}
                      <b>{partner?.nickname ?? "탈퇴한 회원"}</b> <span className="text-xs text-foreground/60">· {kindLabel(partner?.kind)}</span>
                    </span>
                    <span className="text-xs text-foreground/60">{t.last_message_at ? when(t.last_message_at) : "새 채팅"}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {sent.length > 0 && (
        <section>
          <h2 className="mb-3 text-xl font-bold">⏳ 보낸 요청 (수락 대기)</h2>
          <ul className="space-y-2 text-sm">
            {sent.map((t) => (
              <li key={t.id} className="card-sm p-3"><b>{t.recipient?.nickname ?? "탈퇴한 회원"}</b> 님에게 · {when(t.created_at)}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export default function ChatPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <PageTitle title="1:1 채팅" desc="회원끼리 정보를 나누는 1:1 채팅이에요. 상대가 수락 요청을 받아들여야 대화할 수 있고, 대화는 두 사람만 볼 수 있어요." />
      <RequireAuth>
        <Suspense fallback={<p className="py-10 text-center text-foreground/60">불러오는 중…</p>}>
          <Inner />
        </Suspense>
      </RequireAuth>
    </div>
  );
}
