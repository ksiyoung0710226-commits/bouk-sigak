"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthProvider";

// 회원이 받는 정보: 문제와 보기만(정답·해설 없음). 정답은 제출한 뒤 서버가 알려 줌.
type QuizSet = { id: number; title: string; description: string | null; starts_at: string; ends_at: string | null; published: boolean; created_at: string };
type Phase = "upcoming" | "event" | "practice";
// 기간 중 = 이벤트(문제당 1번, 추첨 기록) / 마감 후 = 연습(누구나 무제한, 기록 없음)
const phaseOf = (s: QuizSet, now = Date.now()): Phase =>
  now < new Date(s.starts_at).getTime() ? "upcoming" : s.ends_at && now >= new Date(s.ends_at).getTime() ? "practice" : "event";
const fmtDate = (d: string) => new Date(d).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
const PHASE_LABEL: Record<Phase, string> = { upcoming: "· 곧 시작", event: "· 🎁 이벤트 중", practice: "· 연습 모드" };
type Quiz = { id: number; set_id: number; qtype: "choice" | "short"; category: string; question: string; choices: string[] | null; published: boolean; created_at: string };
type Result = { is_correct: boolean; answer: number | null; answers: string[] | null; explanation: string | null; choice?: number | null; text_answer?: string | null };
type Stat = { id: number; answer: number | null; answers: string[] | null; explanation: string | null; attempts: number; correct: number; choice_counts: number[] | null };

const input = "w-full rounded-lg border border-line bg-white px-3 py-2 outline-none focus:border-brand";
const CATEGORIES = ["발달", "보육과정·누리과정", "유아교육", "건강·안전", "관찰·평가", "부모·가족", "기타"];
const NUM = ["①", "②", "③", "④", "⑤"];
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);

export default function QuizBoard() {
  const { session, profile } = useAuth();
  const isAdmin = !!profile?.is_admin;
  const [sets, setSets] = useState<QuizSet[] | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [setId, setSetId] = useState<number | null>(null);
  const [typeFilter, setTypeFilter] = useState<"all" | "choice" | "short">("all");
  const [results, setResults] = useState<Record<number, Result>>({});
  const [stats, setStats] = useState<Record<number, Stat>>({});
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [{ data: s }, { data: q }] = await Promise.all([
        supabase.from("quiz_sets").select("id,title,description,starts_at,ends_at,published,created_at").order("created_at", { ascending: false }),
        supabase.from("quizzes").select("id,set_id,qtype,category,question,choices,published,created_at").order("created_at").limit(500),
      ]);
      if (!alive) return;
      setSets((s as QuizSet[]) ?? []);
      setQuizzes((q as Quiz[]) ?? []);
      if (session) {
        const { data: mine } = await supabase.rpc("my_quiz_answers");
        if (alive) setResults(Object.fromEntries(((mine as (Result & { quiz_id: number })[]) ?? []).map((r) => [r.quiz_id, r])));
      } else setResults({});
      if (isAdmin) {
        const { data: st } = await supabase.rpc("admin_quiz_stats");
        if (alive) setStats(Object.fromEntries(((st as Stat[]) ?? []).map((r) => [r.id, r])));
      }
    })();
    return () => { alive = false; };
  }, [version, session, isAdmin]);

  const current = useMemo(() => sets?.find((s) => s.id === setId) ?? sets?.[0] ?? null, [sets, setId]);
  const inSet = quizzes.filter((q) => q.set_id === current?.id);
  const shown = inSet.filter((q) => typeFilter === "all" || q.qtype === typeFilter);
  const doneCount = inSet.filter((q) => results[q.id]).length;

  return (
    <div className="space-y-6">
      {isAdmin && <AdminPanel sets={sets ?? []} defaultSet={current?.id ?? null} onChange={reload} />}

      {sets === null ? <p className="text-foreground/60">불러오는 중…</p> : sets.length === 0 ? (
        <p className="card p-8 text-center text-foreground/70">아직 퀴즈가 없어요. 곧 올라올 거예요!</p>
      ) : (
        <>
          <nav className="flex flex-wrap gap-2" aria-label="퀴즈 묶음">
            {sets.map((s) => (
              <button key={s.id} onClick={() => setSetId(s.id)}
                className={`rounded-2xl border-2 border-ink px-4 py-2 text-left text-sm font-bold ${current?.id === s.id ? "bg-lime" : "bg-white"} ${s.published ? "" : "opacity-60"}`}>
                ✏️ {s.title}
                <span className="ml-1 text-xs font-normal">{PHASE_LABEL[phaseOf(s)]}{!s.published && " · 숨김"}</span>
              </button>
            ))}
          </nav>

          {current && (
            <section className="space-y-4">
              <div className="card p-5">
                <h2 className="text-2xl font-bold">{current.title}</h2>
                {current.description && <p className="mt-1 whitespace-pre-wrap text-foreground/80">{current.description}</p>}
                <p className="mt-2 text-sm">
                  {phaseOf(current) === "event" && <>🎁 <b>이벤트 기간</b>{current.ends_at ? ` (${fmtDate(current.starts_at)} ~ ${fmtDate(current.ends_at)})` : ""}: 참여한 회원 중에서 상품 추첨을 해요. 문제마다 한 번만 제출할 수 있어요.</>}
                  {phaseOf(current) === "upcoming" && <>⏳ {fmtDate(current.starts_at)}에 시작해요.</>}
                  {phaseOf(current) === "practice" && <>📚 이벤트가 끝나 <b>연습 모드</b>예요. 누구나 몇 번이든 풀어 볼 수 있어요(기록은 남지 않아요).</>}
                  {session && phaseOf(current) === "event" && <span className="ml-2 font-bold">내 참여 {doneCount}/{inSet.length}</span>}
                </p>
                {!session && phaseOf(current) === "event" && (
                  <p className="mt-3 note p-3 text-sm">
                    퀴즈에 참여하려면 <Link href="/login" className="font-bold underline">로그인</Link> 또는 <Link href="/signup" className="font-bold underline">회원가입</Link>을 해 주세요.
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="문제 유형">
                {([["all", "전체 유형"], ["choice", "🔘 객관식"], ["short", "✍️ 주관식"]] as const).map(([k, label]) => (
                  <button key={k} role="radio" aria-checked={typeFilter === k} onClick={() => setTypeFilter(k)}
                    className={`rounded-full border-2 border-ink px-4 py-1.5 text-sm font-bold ${typeFilter === k ? "bg-lime" : "bg-white"}`}>{label}</button>
                ))}
              </div>

              {shown.length === 0 ? <p className="card p-6 text-center text-foreground/70">이 묶음에 문제가 아직 없어요.</p> : (
                <ol className="space-y-4">
                  {shown.map((q, i) => (
                    <QuizCard key={q.id} q={q} n={i + 1} phase={phaseOf(current)} loggedIn={!!session}
                      result={phaseOf(current) === "event" ? results[q.id] : undefined} stat={isAdmin ? stats[q.id] : undefined}
                      onResult={(r) => setResults((m) => ({ ...m, [q.id]: r }))} onChange={reload} />
                  ))}
                </ol>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}

function QuizCard({ q, n, phase, loggedIn, result: saved, stat, onResult, onChange }: {
  q: Quiz; n: number; phase: Phase; loggedIn: boolean; result?: Result; stat?: Stat;
  onResult: (r: Result) => void; onChange: () => void;
}) {
  const [pick, setPick] = useState<number | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [practice, setPractice] = useState<Result | null>(null); // 연습 모드 결과(이 화면에서만)
  const result = phase === "practice" ? practice ?? undefined : saved;
  const done = !!result;
  const canAnswer = !done && (phase === "practice" || (phase === "event" && loggedIn));

  async function submit() {
    if (q.qtype === "choice" ? pick === null : !text.trim()) return setErr(q.qtype === "choice" ? "보기를 골라 주세요." : "답을 적어 주세요.");
    setBusy(true); setErr("");
    const args = { qid: q.id, pick: q.qtype === "choice" ? pick : null, txt: q.qtype === "short" ? text.trim() : null };
    const { data, error } = await supabase.rpc(phase === "practice" ? "practice_quiz_answer" : "submit_quiz_answer", args);
    setBusy(false);
    const r = (data as Result[] | null)?.[0];
    if (error || !r) return setErr(error?.message.includes("closed") ? "이벤트가 마감됐어요. 새로고침하면 연습 모드로 풀 수 있어요." : "제출하지 못했어요. 잠시 후 다시 시도해 주세요.");
    const full = { ...r, choice: pick, text_answer: text.trim() };
    if (phase === "practice") setPractice(full); else onResult(full);
  }

  const myChoice = result?.choice ?? null;
  const rightAnswer = q.qtype === "choice" ? (result?.answer ?? stat?.answer ?? null) : null;

  return (
    <li className={`card p-5 ${q.published ? "" : "opacity-60"}`}>
      <p className="text-xs font-medium text-brand-dark">
        Q{n} · {q.qtype === "short" ? "✍️ 주관식" : "🔘 객관식"} · {q.category}{!q.published && " · 🙈 숨김(관리자만 보임)"}
      </p>
      <p className="mt-1 text-lg font-bold">{q.question}</p>

      {q.qtype === "choice" ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {(q.choices ?? []).map((c, k) => {
            const isAns = done && k === rightAnswer, wrong = done && k === myChoice && myChoice !== rightAnswer, sel = !done && pick === k;
            return (
              <button key={k} disabled={!canAnswer} onClick={() => setPick(k)} aria-pressed={sel}
                className={`rounded-xl border-2 px-4 py-2.5 text-left ${isAns ? "border-ink bg-lime" : wrong ? "border-red-700 bg-red-50" : sel ? "border-ink bg-lav/60" : "border-line bg-white enabled:hover:border-ink"} disabled:cursor-default`}>
                <span className="mr-2 font-bold">{NUM[k]}</span>{c}{isAns && " ✅"}{wrong && " ❌"}
              </button>
            );
          })}
        </div>
      ) : (
        <input className={`${input} mt-3`} value={done ? (result?.text_answer ?? "") : text} disabled={!canAnswer} maxLength={100}
          placeholder={done ? "" : "정답을 적어 주세요"} onChange={(e) => setText(e.target.value)} aria-label={`Q${n} 답 입력`} />
      )}

      {canAnswer && (
        <div className="mt-3 flex items-center gap-3">
          <button onClick={submit} disabled={busy} className="rounded-full bg-brand px-5 py-2 text-sm font-medium text-white disabled:opacity-50">{busy ? "제출 중…" : "제출하기"}</button>
          <span className="text-xs text-foreground/60">{phase === "practice" ? "연습 모드: 몇 번이든 다시 풀 수 있어요." : "제출하면 바꿀 수 없어요."}</span>
        </div>
      )}
      {err && <p className="mt-2 text-sm text-red-700">{err}</p>}

      {done && result && (
        <div className={`mt-3 rounded-xl p-3 text-sm ${result.is_correct ? "bg-lime/60" : "bg-red-50"}`} role="status">
          <p className="text-base font-bold">
            {phase === "practice" ? (result.is_correct ? "🎉 정답이에요!" : "😢 아쉬워요. 다시 도전해 봐요!") : result.is_correct ? "🎉 축하해요! 추첨을 기다려요!" : "😢 아쉽지만 다음에 또 도전해요!"}
          </p>
          <p className="mt-1">정답: <b>{q.qtype === "choice" ? `${NUM[result.answer ?? 0]} ${(q.choices ?? [])[result.answer ?? 0] ?? ""}` : (result.answers ?? []).join(" / ")}</b></p>
          {result.explanation && <p className="mt-1 whitespace-pre-wrap">{result.explanation}</p>}
          {phase === "practice" && (
            <button onClick={() => { setPractice(null); setPick(null); setText(""); }} className="mt-2 rounded-full border border-ink bg-white px-4 py-1 font-bold">🔁 다시 풀기</button>
          )}
        </div>
      )}

      {stat && <AdminStat q={q} stat={stat} onChange={onChange} />}
    </li>
  );
}

// 관리자만: 정답, 참여 수, 정답 비율, 보기별 선택 수 + 숨기기/지우기
function AdminStat({ q, stat, onChange }: { q: Quiz; stat: Stat; onChange: () => void }) {
  async function toggle() {
    const { error } = await supabase.from("quizzes").update({ published: !q.published }).eq("id", q.id);
    if (error) return alert("바꾸지 못했어요.");
    onChange();
  }
  async function remove() {
    if (!confirm("이 문제를 지울까요? 회원들의 제출 기록도 함께 지워지고 되돌릴 수 없어요.")) return;
    const { error } = await supabase.from("quizzes").delete().eq("id", q.id);
    if (error) return alert("지우지 못했어요.");
    onChange();
  }
  return (
    <div className="mt-3 space-y-1 rounded-xl border border-dashed border-ink bg-white/70 p-3 text-xs">
      <p><b>🔒 관리자만 보임</b> · 정답: <b>{q.qtype === "choice" ? NUM[stat.answer ?? 0] : (stat.answers ?? []).join(" / ")}</b></p>
      <p>참여 <b>{stat.attempts}</b>명 · 정답 {stat.correct}명 · 정답 비율 <b>{pct(stat.correct, stat.attempts)}%</b></p>
      {q.qtype === "choice" && stat.choice_counts && (
        <p>보기별 선택: {stat.choice_counts.map((c, k) => `${NUM[k]} ${c}명`).join(" · ")}</p>
      )}
      <p className="flex gap-3 pt-1">
        <button onClick={toggle} className="underline">{q.published ? "🙈 숨기기" : "👀 다시 공개"}</button>
        <button onClick={remove} className="text-red-700 underline">🗑 문제 지우기</button>
      </p>
    </div>
  );
}

function AdminPanel({ sets, defaultSet, onChange }: { sets: QuizSet[]; defaultSet: number | null; onChange: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="panel-lav space-y-4 p-5">
      <button onClick={() => setOpen((v) => !v)} className="font-bold">🛠 관리자: 퀴즈 묶음·문제 관리 {open ? "▲" : "▼"}</button>
      {open && (
        <>
          <SetManager sets={sets} onChange={onChange} />
          {sets.length > 0 ? <QuizEditor sets={sets} defaultSet={defaultSet} onSaved={onChange} /> : <p className="text-sm">먼저 퀴즈 묶음을 만들어 주세요.</p>}
        </>
      )}
    </section>
  );
}

function SetManager({ sets, onChange }: { sets: QuizSet[]; onChange: () => void }) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [busy, setBusy] = useState(false);
  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    if (start && end && new Date(end) <= new Date(start)) return alert("마감일은 시작일보다 뒤여야 해요.");
    setBusy(true);
    const { error } = await supabase.from("quiz_sets").insert({
      title: title.trim(), description: desc.trim() || null,
      starts_at: start ? new Date(start).toISOString() : new Date().toISOString(),
      ends_at: end ? new Date(end).toISOString() : null,
    });
    setBusy(false);
    if (error) return alert("묶음을 만들지 못했어요.");
    setTitle(""); setDesc(""); setStart(""); setEnd(""); onChange();
  }
  async function patch(s: QuizSet, v: Partial<QuizSet>) {
    const { error } = await supabase.from("quiz_sets").update(v).eq("id", s.id);
    if (error) return alert("바꾸지 못했어요.");
    onChange();
  }
  async function remove(s: QuizSet) {
    if (!confirm(`‘${s.title}’ 묶음을 지울까요?\n안의 문제와 회원 제출 기록이 모두 지워지고 되돌릴 수 없어요.`)) return;
    const { error } = await supabase.from("quiz_sets").delete().eq("id", s.id);
    if (error) return alert("지우지 못했어요.");
    onChange();
  }
  return (
    <div className="space-y-3 rounded-2xl border-2 border-ink bg-white/70 p-4 text-sm">
      <p className="font-bold">① 퀴즈 묶음 (예: 11월 퀴즈 이벤트)</p>
      <form onSubmit={create} className="flex flex-wrap gap-2">
        <input className={`${input} flex-1`} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={40} placeholder="묶음 이름 (예: 11월 발달 퀴즈)" />
        <input className={`${input} flex-[2]`} value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={300} placeholder="설명 (선택, 예: 참여자 중 2명 추첨)" />
        <label className="flex items-center gap-1 text-xs">시작 <input type="datetime-local" className={`${input} w-auto`} value={start} onChange={(e) => setStart(e.target.value)} /></label>
        <label className="flex items-center gap-1 text-xs">마감 <input type="datetime-local" className={`${input} w-auto`} value={end} onChange={(e) => setEnd(e.target.value)} /></label>
        <button disabled={busy} className="rounded-full bg-brand px-4 py-2 font-medium text-white disabled:opacity-50">묶음 만들기</button>
      </form>
      <p className="text-xs text-foreground/60">시작을 비우면 지금부터, 마감을 비우면 계속 이벤트예요. 마감이 지나면 자동으로 ‘연습 모드’(누구나 무제한으로 풀기)로 바뀌어요.</p>
      {sets.length > 0 && (
        <ul className="divide-y divide-line">
          {sets.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center gap-2 py-2">
              <b>{s.title}</b>
              <span className="text-xs text-foreground/60">
                {fmtDate(s.starts_at)} ~ {s.ends_at ? fmtDate(s.ends_at) : "마감 없음"} {PHASE_LABEL[phaseOf(s)]} · {s.published ? "공개" : "숨김"}
              </span>
              <span className="ml-auto flex gap-3 text-xs">
                {phaseOf(s) !== "practice" && <button onClick={() => { if (confirm("지금 바로 마감할까요? 마감하면 연습 모드로 바뀌어요.")) patch(s, { ends_at: new Date().toISOString() }); }} className="underline">⏰ 지금 마감</button>}
                <button onClick={() => patch(s, { published: !s.published })} className="underline">{s.published ? "🙈 숨기기" : "👀 공개"}</button>
                <button onClick={() => remove(s)} className="text-red-700 underline">🗑 지우기</button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function QuizEditor({ sets, defaultSet, onSaved }: { sets: QuizSet[]; defaultSet: number | null; onSaved: () => void }) {
  const { profile } = useAuth();
  const [setId, setSetId] = useState<number>(defaultSet ?? sets[0].id);
  const [qtype, setQtype] = useState<"choice" | "short">("choice");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [question, setQuestion] = useState("");
  const [choices, setChoices] = useState(["", "", "", ""]);
  const [answer, setAnswer] = useState(0);
  const [answers, setAnswers] = useState("");
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
      row = { qtype, choices: filled, answer: list.slice(0, answer).filter(Boolean).length };
    } else {
      const list = answers.split(",").map((a) => a.trim()).filter(Boolean).slice(0, 5);
      if (list.length === 0) return setMsg("주관식 정답을 적어 주세요.");
      row = { qtype, answers: list };
    }
    setBusy(true); setMsg("");
    const { error } = await supabase.from("quizzes").insert({
      ...row, set_id: setId, category, question: question.trim(), explanation: explanation.trim() || null, created_by: profile?.id,
    });
    setBusy(false);
    if (error) return setMsg("저장하지 못했어요. 잠시 후 다시 시도해 주세요.");
    setQuestion(""); setChoices(["", "", "", ""]); setAnswer(0); setAnswers(""); setExplanation("");
    setMsg("문제를 올렸어요! ✅");
    onSaved();
  }

  return (
    <form onSubmit={save} className="space-y-3 rounded-2xl border-2 border-ink bg-white/70 p-4 text-sm">
      <p className="font-bold">② 문제 만들기</p>
      <label className="block">
        <span className="mb-1 block font-medium">넣을 묶음</span>
        <select className={input} value={setId} onChange={(e) => setSetId(Number(e.target.value))}>
          {sets.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
        </select>
      </label>
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
        <textarea className={`${input} min-h-20`} value={question} onChange={(e) => setQuestion(e.target.value)} maxLength={300} placeholder="예: 피아제가 말한, 눈앞에서 사라져도 물체가 계속 존재한다는 것을 아는 능력은?" />
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
        <span className="mb-1 block font-medium">해설 (선택 · 회원은 제출한 뒤에 봐요)</span>
        <textarea className={`${input} min-h-20`} value={explanation} onChange={(e) => setExplanation(e.target.value)} maxLength={1000} placeholder="정답인 이유를 짧게 적어 주세요. 출처가 있으면 함께 적어 주세요." />
      </label>
      {msg && <p className={msg.includes("✅") ? "text-green-800" : "text-red-700"}>{msg}</p>}
      <button disabled={busy} className="rounded-full bg-brand px-5 py-2 font-medium text-white disabled:opacity-50">{busy ? "올리는 중…" : "문제 올리기"}</button>
    </form>
  );
}
