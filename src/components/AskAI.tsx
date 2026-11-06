"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthProvider";

type Sources = { site: { label: string; url: string }[]; official: { label: string; url?: string }[] };
type Turn = { role: "user" | "assistant"; content: string; sources?: Sources; mode?: string };

// 서버가 보낸 출처(헤더, base64 JSON) 읽기
function readSources(h: string | null): Sources | undefined {
  if (!h) return undefined;
  try { return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(h), (c) => c.charCodeAt(0)))); } catch { return undefined; }
}

// 답 아래 출처 상자: 사이트 자료(안쪽 링크) + 공식 출처(https만 바깥 링크)
function SourceBox({ src }: { src: Sources }) {
  if (!src.site.length && !src.official.length) return null;
  return (
    <div className="mt-3 rounded-xl border border-ink bg-white/80 p-3 text-xs leading-relaxed">
      <p className="font-bold">📎 출처</p>
      {src.site.length > 0 && (
        <ul className="mt-1 list-disc pl-4">
          {src.site.map((x) => <li key={x.url + x.label}><Link href={x.url} className="font-medium text-brand-dark underline">{x.label}</Link> <span className="text-foreground/60">(educare insight)</span></li>)}
        </ul>
      )}
      {src.official.length > 0 && (
        <>
          <p className="mt-2 font-bold">공식 자료</p>
          <ul className="mt-1 list-disc pl-4">
            {src.official.map((x) => (
              <li key={(x.url ?? "") + x.label}>
                {x.url && /^https:\/\//.test(x.url)
                  ? <a href={x.url} target="_blank" rel="noopener noreferrer" className="underline">{x.label} ↗</a>
                  : x.label}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

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
        // 사이트 안 주소(/로 시작, //·/\ 는 제외)만 링크로
        const parts = line.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\(\/(?![\/\\])[^)\s]*\))/g);
        return (
          <p key={i} className={/^\s*[-•]\s/.test(line) ? "pl-3" : /^#{1,4}\s/.test(line) ? "font-bold" : ""}>
            {parts.map((p, k) => {
              const b = p.match(/^\*\*(.+)\*\*$/);
              if (b) return <b key={k}>{b[1]}</b>;
              const l = p.match(/^\[([^\]]+)\]\((\/(?![\/\\])[^)\s]*)\)$/);
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
    // 질문마다 따로 답해요(앞 대화는 보내지 않음)
    const history: Turn[] = [...turns, { role: "user", content: question }];
    setTurns([...history, { role: "assistant", content: "" }]);
    try {
      const { data } = await supabase.auth.getSession();
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token ?? ""}` },
        body: JSON.stringify({ question }),
      });
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({}));
        setTurns(history.slice(0, -1));
        setText(question);
        return setErr(j.error ?? "답을 받지 못했어요. 잠시 후 다시 시도해 주세요.");
      }
      const r = res.headers.get("X-AI-Remaining");
      if (r) setLeft(Number(r));
      const sources = readSources(res.headers.get("X-Sources"));
      const mode = res.headers.get("X-Mode") ?? "";
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        setTurns([...history, { role: "assistant", content: acc, sources, mode }]);
      }
    } catch {
      setErr("연결이 끊겼어요. 다시 시도해 주세요.");
      // 받다 만 답이 없으면 빈 말풍선을 지움
      setTurns((cur) => (cur.length && cur[cur.length - 1].role === "assistant" && !cur[cur.length - 1].content ? cur.slice(0, -1) : cur));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="text-foreground/60">불러오는 중…</p>;

  return (
    <div className="space-y-4">
      <p className="note p-3 text-sm">
        🤖 보육·유아교육에 특화된 AI예요. <b>사이트가 공식 자료로 확인한 내용으로만 답하고, 모든 답에 출처를 붙여요.</b> 그래도 AI 답변은 틀릴 수 있으니 전공 서적과 공식 자료로 꼭 확인해 주세요.
        아이·학부모·기관의 실명이나 개인정보는 쓰지 말아 주세요. 질문은 사이트에 저장하지 않지만, 답을 만들기 위해 구글 AI(Gemini 무료 요금제)로 전송되며 구글 서비스 개선에 쓰일 수 있어요.
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
                  {t.role === "assistant" ? (
                    t.content ? (
                      <>
                        {t.mode === "helper" && <p className="mb-1 text-xs font-bold text-brand-dark">📚 지식 도우미 (사이트 자료 요약)</p>}
                        <Rich text={t.content} />
                        {t.sources && <SourceBox src={t.sources} />}
                      </>
                    ) : <span className="text-foreground/60">확인된 자료를 찾는 중…</span>
                  ) : t.content}
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
            <span>Enter로 보내기 · Shift+Enter로 줄바꿈 · 하루 10번까지 · 질문마다 따로 답해요</span>
            {left !== null && <span>오늘 남은 질문 {left}번</span>}
            {turns.length > 0 && !busy && <button onClick={() => setTurns([])} className="underline">새 대화</button>}
          </p>
        </>
      )}
    </div>
  );
}
