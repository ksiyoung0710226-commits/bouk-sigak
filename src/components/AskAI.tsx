"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthProvider";

type Turn = { role: "user" | "assistant"; content: string };

const EXAMPLES = [
  "영아반 낮잠 시간에 잠들기 어려워하는 아이를 어떻게 도와주면 좋을까요?",
  "피아제의 전조작기 특징을 쉽게 설명해 주세요.",
  "보육실습 일지에 관찰 기록은 어떻게 쓰나요?",
  "유아교육과와 아동보육과는 무엇이 달라요?",
];

// 아주 간단한 마크다운 → 화면 (굵게, 목록, 사이트 안 링크만 링크로)
function Rich({ text }: { text: string }) {
  return (
    <div className="space-y-1.5 whitespace-pre-wrap break-words">
      {text.split("\n").map((line, i) => {
        const parts = line.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\(\/[^)\s]*\))/g);
        return (
          <p key={i} className={/^\s*[-•]\s/.test(line) ? "pl-3" : /^#{1,4}\s/.test(line) ? "font-bold" : ""}>
            {parts.map((p, k) => {
              const b = p.match(/^\*\*(.+)\*\*$/);
              if (b) return <b key={k}>{b[1]}</b>;
              const l = p.match(/^\[([^\]]+)\]\((\/[^)\s]*)\)$/);
              if (l) return <Link key={k} href={l[2]} className="font-bold text-brand-dark underline">{l[1]}</Link>;
              return <span key={k}>{p.replace(/^#{1,4}\s/, "")}</span>;
            })}
          </p>
        );
      })}
    </div>
  );
}

export default function AskAI({ initial = "" }: { initial?: string }) {
  const { session, loading } = useAuth();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [text, setText] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [left, setLeft] = useState<number | null>(null);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => { bottom.current?.scrollIntoView({ block: "end", behavior: "smooth" }); }, [turns]);

  async function ask(q: string) {
    const question = q.trim();
    if (!question || busy || !session) return;
    setErr(""); setBusy(true); setText("");
    const history: Turn[] = [...turns, { role: "user", content: question }];
    setTurns([...history, { role: "assistant", content: "" }]);
    try {
      const { data } = await supabase.auth.getSession();
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token ?? ""}` },
        body: JSON.stringify({ messages: history }),
      });
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({}));
        setTurns(history.slice(0, -1));
        setText(question);
        return setErr(j.error ?? "답을 받지 못했어요. 잠시 후 다시 시도해 주세요.");
      }
      const r = res.headers.get("X-AI-Remaining");
      if (r) setLeft(Number(r));
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        setTurns([...history, { role: "assistant", content: acc }]);
      }
    } catch {
      setErr("연결이 끊겼어요. 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="text-foreground/60">불러오는 중…</p>;

  return (
    <div className="space-y-4">
      <p className="note p-3 text-sm">
        🤖 보육·유아교육에 맞춘 AI예요. <b>AI 답변은 틀릴 수 있으니 전공 서적과 공식 자료로 꼭 확인해 주세요.</b> 아이·학부모·기관의 실명이나 개인정보는 쓰지 말아 주세요.
        질문 내용은 저장하지 않지만, 답을 만들기 위해 AI 서비스(Anthropic)로 전송돼요.
      </p>

      {!session ? (
        <p className="card p-5 text-sm">
          AI에게 질문하려면 <Link href="/login" className="font-bold underline">로그인</Link> 또는 <Link href="/signup" className="font-bold underline">회원가입</Link>을 해 주세요.
        </p>
      ) : (
        <>
          {turns.length === 0 && (
            <div className="grid gap-2 sm:grid-cols-2">
              {EXAMPLES.map((ex) => (
                <button key={ex} onClick={() => ask(ex)} className="rounded-2xl border-2 border-ink bg-white p-3 text-left text-sm hover:bg-lime/40">💡 {ex}</button>
              ))}
            </div>
          )}
          <div className="space-y-3" aria-live="polite">
            {turns.map((t, i) => (
              <div key={i} className={`flex ${t.role === "user" ? "justify-end" : "justify-start"} gap-2`}>
                {t.role === "assistant" && <span aria-hidden className="text-2xl">🤖</span>}
                <div className={`max-w-[88%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed ${t.role === "user" ? "bg-brand text-white" : "card"}`}>
                  {t.role === "assistant" ? (t.content ? <Rich text={t.content} /> : <span className="text-foreground/60">생각하는 중…</span>) : t.content}
                </div>
              </div>
            ))}
            <div ref={bottom} />
          </div>
          {err && <p className="text-sm text-red-700">{err}</p>}
          <form onSubmit={(e) => { e.preventDefault(); ask(text); }} className="flex gap-2">
            <textarea className="min-h-12 w-full rounded-2xl border-2 border-ink bg-white px-4 py-2 outline-none" value={text} maxLength={2000} rows={2}
              onChange={(e) => setText(e.target.value)} placeholder="보육·유아교육에 대해 무엇이든 물어보세요"
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); ask(text); } }} />
            <button disabled={busy || !text.trim()} className="shrink-0 rounded-full bg-brand px-5 font-medium text-white disabled:opacity-50">{busy ? "…" : "질문"}</button>
          </form>
          <p className="flex justify-between text-xs text-foreground/60">
            <span>Enter로 보내기 · Shift+Enter로 줄바꿈 · 하루 20번까지</span>
            {left !== null && <span>오늘 남은 질문 {left}번</span>}
            {turns.length > 0 && !busy && <button onClick={() => setTurns([])} className="underline">새 대화</button>}
          </p>
        </>
      )}
    </div>
  );
}
