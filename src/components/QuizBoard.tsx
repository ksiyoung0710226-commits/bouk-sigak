"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthProvider";

type Quiz = { id: number; qtype: "choice" | "short"; category: string; question: string; choices: string[] | null; answer: number | null; answers: string[] | null; explanation: string | null; published: boolean; created_at: string };

// 주관식 채점: 띄어쓰기·대소문자·끝 문장부호 무시
const normAns = (s: string) => s.toLowerCase().replace(/[\s.·,!?]/g, "");
const NUM = ["①", "②", "③", "④", "⑤"];

const input = "w-full rounded-lg border border-line bg-white px-3 py-2 outline-none focus:border-brand";
const CATEGORIES = ["발달", "보육과정·누리과정", "유아교육", "건강·안전", "관찰·평가", "부모·가족", "기타"];

export default function QuizBoard() {
  const { profile } = useAuth();
  const isAdmin = !!profile?.is_admin;
  const [quizzes, setQuizzes] = useState<Quiz[] | null>(null);
  const [filter, setFilter] = useState("전체");
  const [typeFilter, setTypeFilter] = useState<"all" | "choice" | "short">("all");
  const [picked, setPicked] = useState<Record<number, number>>({});
  // 주관식: 내가 쓴 답(제출 후 채점)
  const [written, setWritten] = useState<Record<number, { text: string; done: boolean }>>({});
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let alive = true;
    supabase.from("quizzes").select("id,qtype,category,question,choices,answer,answers,explanation,published,created_at")
      .order("created_at", { ascending: false }).limit(300)
      .then(({ data }) => { if (alive) setQuizzes((data as Quiz[]) ?? []); });
    return () => { alive = false; };
  }, [version, isAdmin]);

  const cats = useMemo(() => ["전체", ...Array.from(new Set((quizzes ?? []).map((q) => q.category)))], [quizzes]);
  const shown = (quizzes ?? []).filter((q) => (filter === "전체" || q.category === filter) && (typeFilter === "all" || q.qtype === typeFilter));
  const isDone = (q: Quiz) => (q.qtype === "short" ? !!written[q.id]?.done : picked[q.id] !== undefined);
  const isRight = (q: Quiz) => q.qtype === "short"
    ? (q.answers ?? []).some((a) => normAns(a) === normAns(written[q.id]?.text ?? ""))
    : picked[q.id] === q.answer;
  const answered = shown.filter(isDone);
  const correct = answered.filter(isRight).length;

  return (
    <div className="space-y-6">
      {isAdmin && <QuizEditor onSaved={reload} />}

      {quizzes === null ? <p className="text-foreground/60">불러오는 중…</p> : quizzes.length === 0 ? (
        <p className="card p-8 text-center text-foreground/70">아직 퀴즈가 없어요. 곧 올라올 거예요!</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="문제 유형">
            {([["all", "전체 유형"], ["choice", "🔘 객관식"], ["short", "✍️ 주관식"]] as const).map(([k, label]) => (
              <button key={k} role="radio" aria-checked={typeFilter === k} onClick={() => setTypeFilter(k)}
                className={`rounded-full border-2 border-ink px-4 py-1.5 text-sm font-bold ${typeFilter === k ? "bg-lime" : "bg-white"}`}>{label}</button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {cats.map((c) => (
              <button key={c} onClick={() => setFilter(c)} className={`rounded-full px-3 py-1 text-sm ${filter === c ? "bg-brand text-white" : "bg-soft"}`}>{c}</button>
            ))}
            <span className="ml-auto text-sm">
              맞힌 문제 <b>{correct}</b> / 푼 문제 {answered.length} · 전체 {shown.length}
              {answered.length > 0 && <button onClick={() => { setPicked({}); setWritten({}); }} className="ml-2 underline">다시 풀기</button>}
            </span>
          </div>
          <ol className="space-y-4">
            {shown.map((q, i) => {
              const done = isDone(q), right = done && isRight(q);
              return (
                <li key={q.id} className={`card p-5 ${q.published ? "" : "opacity-60"}`}>
                  <p className="text-xs font-medium text-brand-dark">
                    Q{i + 1} · {q.qtype === "short" ? "✍️ 주관식" : "🔘 객관식"} · {q.category}{!q.published && " · 🙈 숨김(관리자만 보임)"}
                  </p>
                  <p className="mt-1 text-lg font-bold">{q.question}</p>
                  {q.qtype === "choice" ? (
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {(q.choices ?? []).map((c, k) => {
                        const my = picked[q.id];
                        const isAns = done && k === q.answer, wrong = done && k === my && my !== q.answer;
                        return (
                          <button key={k} disabled={done} onClick={() => setPicked((p) => ({ ...p, [q.id]: k }))}
                            className={`rounded-xl border-2 px-4 py-2.5 text-left ${isAns ? "border-ink bg-lime" : wrong ? "border-red-700 bg-red-50" : "border-line bg-white hover:border-ink"} disabled:cursor-default`}>
                            <span className="mr-2 font-bold">{NUM[k]}</span>{c}{isAns && " ✅"}{wrong && " ❌"}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); if ((written[q.id]?.text ?? "").trim()) setWritten((w) => ({ ...w, [q.id]: { text: w[q.id]?.text ?? "", done: true } })); }}>
                      <input className={input} value={written[q.id]?.text ?? ""} disabled={done} maxLength={100} placeholder="정답을 적어 주세요"
                        onChange={(e) => setWritten((w) => ({ ...w, [q.id]: { text: e.target.value, done: false } }))} aria-label={`Q${i + 1} 답 입력`} />
                      <button disabled={done} className="shrink-0 rounded-full bg-brand px-4 text-sm font-medium text-white disabled:opacity-50">정답 확인</button>
                    </form>
                  )}
                  {done && (
                    <div className={`mt-3 rounded-xl p-3 text-sm ${right ? "bg-lime/50" : "bg-red-50"}`} role="status">
                      <b>{right ? "정답이에요! 🎉" : q.qtype === "short" ? `아쉬워요. 정답은 ‘${(q.answers ?? []).join("’ 또는 ‘")}’예요.` : `아쉬워요. 정답은 ${NUM[q.answer ?? 0]}이에요.`}</b>
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
  const [qtype, setQtype] = useState<"choice" | "short">("choice");
  const [answers, setAnswers] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [question, setQuestion] = useState("");
  const [choices, setChoices] = useState(["", "", "", ""]);
  const [answer, setAnswer] = useState(0);
  const [explanation, setExplanation] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) return setMsg("문제를 적어 주세요.");
    let row: Record<string, unknown>;
    if (qtype === "choice") {
      const list = choices.map((c) => c.trim());
      const filled = list.filter(Boolean);
      if (filled.length < 2) return setMsg("보기를 2개 이상 적어 주세요.");
      if (!list[answer]) return setMsg("정답으로 고른 보기가 비어 있어요.");
      // 빈 보기는 빼고, 정답 번호를 다시 맞춘다
      row = { qtype, choices: filled, answer: list.slice(0, answer).filter(Boolean).length };
    } else {
      const list = answers.split(",").map((a) => a.trim()).filter(Boolean).slice(0, 5);
      if (list.length === 0) return setMsg("주관식 정답을 적어 주세요.");
      row = { qtype, answers: list };
    }
    setBusy(true); setMsg("");
    const { error } = await supabase.from("quizzes").insert({
      ...row, category, question: question.trim(),
      explanation: explanation.trim() || null, created_by: profile?.id,
    });
    setBusy(false);
    if (error) return setMsg("저장하지 못했어요. 잠시 후 다시 시도해 주세요.");
    setQuestion(""); setChoices(["", "", "", ""]); setAnswer(0); setAnswers(""); setExplanation("");
    setMsg("퀴즈를 올렸어요! ✅");
    onSaved();
  }

  return (
    <section className="panel-lav p-5">
      <button onClick={() => setOpen((v) => !v)} className="font-bold">🛠 관리자: 퀴즈 만들기 {open ? "▲" : "▼"}</button>
      {open && (
        <form onSubmit={save} className="mt-4 space-y-3 text-sm">
          <div className="flex gap-2" role="radiogroup" aria-label="문제 유형">
            {([["choice", "🔘 객관식"], ["short", "✍️ 주관식"]] as const).map(([k, label]) => (
              <button type="button" key={k} role="radio" aria-checked={qtype === k} onClick={() => setQtype(k)}
                className={`rounded-full border-2 border-ink px-4 py-1.5 font-bold ${qtype === k ? "bg-lime" : "bg-white"}`}>{label}</button>
            ))}
          </div>
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
          {qtype === "short" ? (
            <label className="block">
              <span className="mb-1 block font-medium">정답 (여러 표현이면 쉼표로 구분, 최대 5개)</span>
              <input className={input} value={answers} onChange={(e) => setAnswers(e.target.value)} maxLength={300} placeholder="예: 대상영속성, 대상 영속성, object permanence" />
              <span className="mt-1 block text-xs text-foreground/60">채점할 때 띄어쓰기·대소문자·마침표는 무시해요.</span>
            </label>
          ) : (
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
          )}
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
