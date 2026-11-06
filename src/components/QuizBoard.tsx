"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthProvider";

type Quiz = { id: number; category: string; question: string; choices: string[]; answer: number; explanation: string | null; published: boolean; created_at: string };

const input = "w-full rounded-lg border border-line bg-white px-3 py-2 outline-none focus:border-brand";
const CATEGORIES = ["발달", "보육과정·누리과정", "유아교육", "건강·안전", "관찰·평가", "부모·가족", "기타"];

export default function QuizBoard() {
  const { profile } = useAuth();
  const isAdmin = !!profile?.is_admin;
  const [quizzes, setQuizzes] = useState<Quiz[] | null>(null);
  const [filter, setFilter] = useState("전체");
  const [picked, setPicked] = useState<Record<number, number>>({});
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let alive = true;
    supabase.from("quizzes").select("id,category,question,choices,answer,explanation,published,created_at")
      .order("created_at", { ascending: false }).limit(300)
      .then(({ data }) => { if (alive) setQuizzes((data as Quiz[]) ?? []); });
    return () => { alive = false; };
  }, [version, isAdmin]);

  const cats = useMemo(() => ["전체", ...Array.from(new Set((quizzes ?? []).map((q) => q.category)))], [quizzes]);
  const shown = (quizzes ?? []).filter((q) => filter === "전체" || q.category === filter);
  const answered = shown.filter((q) => picked[q.id] !== undefined);
  const correct = answered.filter((q) => picked[q.id] === q.answer).length;

  return (
    <div className="space-y-6">
      {isAdmin && <QuizEditor onSaved={reload} />}

      {quizzes === null ? <p className="text-foreground/60">불러오는 중…</p> : quizzes.length === 0 ? (
        <p className="card p-8 text-center text-foreground/70">아직 퀴즈가 없어요. 곧 올라올 거예요!</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            {cats.map((c) => (
              <button key={c} onClick={() => setFilter(c)} className={`rounded-full px-3 py-1 text-sm ${filter === c ? "bg-brand text-white" : "bg-soft"}`}>{c}</button>
            ))}
            <span className="ml-auto text-sm">
              맞힌 문제 <b>{correct}</b> / 푼 문제 {answered.length} · 전체 {shown.length}
              {answered.length > 0 && <button onClick={() => setPicked({})} className="ml-2 underline">다시 풀기</button>}
            </span>
          </div>
          <ol className="space-y-4">
            {shown.map((q, i) => {
              const my = picked[q.id];
              const done = my !== undefined;
              return (
                <li key={q.id} className={`card p-5 ${q.published ? "" : "opacity-60"}`}>
                  <p className="text-xs font-medium text-brand-dark">
                    Q{i + 1} · {q.category}{!q.published && " · 🙈 숨김(관리자만 보임)"}
                  </p>
                  <p className="mt-1 text-lg font-bold">{q.question}</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {q.choices.map((c, k) => {
                      const right = done && k === q.answer, wrong = done && k === my && my !== q.answer;
                      return (
                        <button key={k} disabled={done} onClick={() => setPicked((p) => ({ ...p, [q.id]: k }))}
                          className={`rounded-xl border-2 px-4 py-2.5 text-left ${right ? "border-ink bg-lime" : wrong ? "border-red-700 bg-red-50" : "border-line bg-white hover:border-ink"} disabled:cursor-default`}>
                          <span className="mr-2 font-bold">{["①", "②", "③", "④", "⑤"][k]}</span>{c}{right && " ✅"}{wrong && " ❌"}
                        </button>
                      );
                    })}
                  </div>
                  {done && (
                    <div className={`mt-3 rounded-xl p-3 text-sm ${my === q.answer ? "bg-lime/50" : "bg-red-50"}`} role="status">
                      <b>{my === q.answer ? "정답이에요! 🎉" : `아쉬워요. 정답은 ${["①", "②", "③", "④", "⑤"][q.answer]}이에요.`}</b>
                      {q.explanation && <p className="mt-1 whitespace-pre-wrap">{q.explanation}</p>}
                    </div>
                  )}
                  {isAdmin && <AdminQuizActions q={q} onChange={reload} />}
                </li>
              );
            })}
          </ol>
        </>
      )}
    </div>
  );
}

function AdminQuizActions({ q, onChange }: { q: Quiz; onChange: () => void }) {
  async function toggle() {
    const { error } = await supabase.from("quizzes").update({ published: !q.published }).eq("id", q.id);
    if (error) return alert("바꾸지 못했어요.");
    onChange();
  }
  async function remove() {
    if (!confirm("이 퀴즈를 지울까요? 되돌릴 수 없어요.")) return;
    const { error } = await supabase.from("quizzes").delete().eq("id", q.id);
    if (error) return alert("지우지 못했어요.");
    onChange();
  }
  return (
    <div className="mt-3 flex gap-3 border-t border-line pt-2 text-xs">
      <span className="font-bold">관리자:</span>
      <button onClick={toggle} className="underline">{q.published ? "🙈 숨기기" : "👀 다시 공개"}</button>
      <button onClick={remove} className="text-red-700 underline">🗑 지우기</button>
    </div>
  );
}

function QuizEditor({ onSaved }: { onSaved: () => void }) {
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [question, setQuestion] = useState("");
  const [choices, setChoices] = useState(["", "", "", ""]);
  const [answer, setAnswer] = useState(0);
  const [explanation, setExplanation] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const list = choices.map((c) => c.trim());
    const filled = list.filter(Boolean);
    if (!question.trim()) return setMsg("문제를 적어 주세요.");
    if (filled.length < 2) return setMsg("보기를 2개 이상 적어 주세요.");
    if (!list[answer]) return setMsg("정답으로 고른 보기가 비어 있어요.");
    // 빈 보기는 빼고, 정답 번호를 다시 맞춘다
    const newAnswer = list.slice(0, answer).filter(Boolean).length;
    setBusy(true); setMsg("");
    const { error } = await supabase.from("quizzes").insert({
      category, question: question.trim(), choices: filled, answer: newAnswer,
      explanation: explanation.trim() || null, created_by: profile?.id,
    });
    setBusy(false);
    if (error) return setMsg("저장하지 못했어요. 잠시 후 다시 시도해 주세요.");
    setQuestion(""); setChoices(["", "", "", ""]); setAnswer(0); setExplanation("");
    setMsg("퀴즈를 올렸어요! ✅");
    onSaved();
  }

  return (
    <section className="panel-lav p-5">
      <button onClick={() => setOpen((v) => !v)} className="font-bold">🛠 관리자: 퀴즈 만들기 {open ? "▲" : "▼"}</button>
      {open && (
        <form onSubmit={save} className="mt-4 space-y-3 text-sm">
          <label className="block">
            <span className="mb-1 block font-medium">분야</span>
            <select className={input} value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block font-medium">문제</span>
            <textarea className={`${input} min-h-20`} value={question} onChange={(e) => setQuestion(e.target.value)} maxLength={300} placeholder="예: 피아제의 인지발달 단계 중 대상영속성이 생기는 시기는?" />
          </label>
          <fieldset>
            <legend className="mb-1 font-medium">보기 (2~5개) — 정답에 동그라미를 눌러 주세요</legend>
            <div className="space-y-2">
              {choices.map((c, k) => (
                <div key={k} className="flex items-center gap-2">
                  <input type="radio" name="quiz-answer" checked={answer === k} onChange={() => setAnswer(k)} aria-label={`${k + 1}번을 정답으로`} />
                  <input className={input} value={c} maxLength={150} placeholder={`보기 ${k + 1}`}
                    onChange={(e) => setChoices((list) => list.map((x, j) => (j === k ? e.target.value : x)))} />
                  {choices.length > 2 && (
                    <button type="button" onClick={() => { setChoices((l) => l.filter((_, j) => j !== k)); setAnswer((a) => (a === k ? 0 : a > k ? a - 1 : a)); }} className="text-xs underline">빼기</button>
                  )}
                </div>
              ))}
            </div>
            {choices.length < 5 && <button type="button" onClick={() => setChoices((l) => [...l, ""])} className="mt-2 text-xs underline">+ 보기 추가</button>}
          </fieldset>
          <label className="block">
            <span className="mb-1 block font-medium">해설 (선택)</span>
            <textarea className={`${input} min-h-20`} value={explanation} onChange={(e) => setExplanation(e.target.value)} maxLength={1000} placeholder="정답인 이유를 짧게 적어 주세요. 출처가 있으면 함께 적어 주세요." />
          </label>
          {msg && <p className={msg.includes("✅") ? "text-green-800" : "text-red-700"}>{msg}</p>}
          <button disabled={busy} className="rounded-full bg-brand px-5 py-2 font-medium text-white disabled:opacity-50">{busy ? "올리는 중…" : "퀴즈 올리기"}</button>
        </form>
      )}
    </section>
  );
}
