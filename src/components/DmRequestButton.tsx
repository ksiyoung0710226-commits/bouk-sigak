"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthProvider";

type Thread = { id: number; requester_id: string; status: "pending" | "accepted" | "declined"; blocked_by: string | null };

// 작성자 닉네임 옆 '1:1 채팅' 버튼. 처음에는 멘트를 적어 수락 요청을 보내고, 상대가 수락해야 채팅할 수 있다.
export default function DmRequestButton({ userId, nickname }: { userId: string; nickname: string }) {
  const { session } = useAuth();
  const me = session?.user.id;
  const [open, setOpen] = useState(false);
  const [thread, setThread] = useState<Thread | null | undefined>(undefined);
  const [intro, setIntro] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  if (!me || me === userId) return null;

  async function start() {
    setOpen(true);
    setErr("");
    const { data } = await supabase
      .from("dm_threads")
      .select("id,requester_id,status,blocked_by")
      .or(`and(requester_id.eq.${me},recipient_id.eq.${userId}),and(requester_id.eq.${userId},recipient_id.eq.${me})`)
      .maybeSingle();
    setThread((data as Thread) ?? null);
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!intro.trim()) return;
    setBusy(true);
    const { data, error } = await supabase
      .from("dm_threads")
      .insert({ requester_id: me, recipient_id: userId, intro: intro.trim() })
      .select("id,requester_id,status,blocked_by")
      .single();
    setBusy(false);
    if (error) return setErr("요청을 보내지 못했어요. 이미 요청한 적이 있는지 확인해 주세요.");
    setThread(data as Thread);
    setIntro("");
    window.dispatchEvent(new Event("dm:changed"));
  }

  const close = () => { setOpen(false); setThread(undefined); };

  return (
    <>
      <button onClick={start} className="rounded-full border border-line px-2 leading-5 hover:bg-soft" aria-label={`${nickname}에게 1:1 채팅 요청`}>
        💬 1:1 채팅
      </button>
      {open && (
        <div role="dialog" aria-modal="true" aria-label="1:1 채팅 요청" className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/40 p-4" onClick={close}>
          <div className="card w-full max-w-md space-y-3 p-6 text-sm text-foreground" onClick={(e) => e.stopPropagation()}>
            <p className="text-lg font-bold">💬 {nickname} 님과 1:1 채팅</p>
            {thread === undefined ? (
              <p className="text-foreground/60">확인 중…</p>
            ) : thread === null ? (
              <form onSubmit={send} className="space-y-3">
                <p>
                  처음에는 <b>수락 요청</b>을 보내요. 상대가 수락하면 그때부터 채팅할 수 있어요.
                  어떤 이야기를 나누고 싶은지 인사와 함께 적어 주세요.
                </p>
                <textarea className="min-h-28 w-full rounded-lg border border-line bg-white px-3 py-2 outline-none focus:border-brand"
                  value={intro} onChange={(e) => setIntro(e.target.value)} maxLength={300} required
                  placeholder="예: 안녕하세요! 영아반 놀이자료에 대해 여쭤보고 싶어서 연락드려요." />
                <p className="text-xs text-foreground/60">{intro.length}/300 · 상대가 거절하면 같은 분께 다시 요청할 수 없어요.</p>
                {err && <p className="text-red-700">{err}</p>}
                <div className="flex gap-2">
                  <button disabled={busy || !intro.trim()} className="rounded-full bg-brand px-5 py-2 font-medium text-white disabled:opacity-50">
                    {busy ? "보내는 중…" : "수락 요청 보내기"}
                  </button>
                  <button type="button" onClick={close} className="rounded-full border border-line bg-white px-5 py-2">취소</button>
                </div>
              </form>
            ) : thread.blocked_by ? (
              <p>{thread.blocked_by === me ? "내가 차단한 회원이에요. 채팅 메뉴의 ‘차단한 회원’에서 풀 수 있어요." : "이 회원과는 채팅할 수 없어요."}</p>
            ) : thread.status === "accepted" ? (
              <div className="space-y-3">
                <p>이미 채팅이 연결되어 있어요.</p>
                <Link href={`/chat?t=${thread.id}`} className="inline-block rounded-full bg-brand px-5 py-2 font-medium text-white">채팅방으로 가기</Link>
              </div>
            ) : thread.status === "pending" ? (
              thread.requester_id === me ? (
                <p>수락 요청을 보냈어요. 상대가 수락하면 <b>채팅</b> 메뉴에서 대화를 시작할 수 있어요.</p>
              ) : (
                <div className="space-y-3">
                  <p>이 회원이 나에게 채팅을 요청했어요.</p>
                  <Link href="/chat" className="inline-block rounded-full bg-brand px-5 py-2 font-medium text-white">요청 확인하러 가기</Link>
                </div>
              )
            ) : (
              <p>{thread.requester_id === me ? "상대가 채팅 요청을 수락하지 않았어요." : "이전에 이 회원의 채팅 요청을 거절했어요."}</p>
            )}
            {thread !== null && thread !== undefined && (
              <button onClick={close} className="text-xs underline">닫기</button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
