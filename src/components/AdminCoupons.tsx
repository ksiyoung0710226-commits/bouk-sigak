"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthProvider";
import { supabase } from "@/lib/supabase";
import { detailsLabel } from "@/lib/member-info";

type Member = {
  id: string; nickname: string; kind: string; is_admin: boolean;
  school: string | null; major: string | null; school_verified: boolean;
  region: string | null; center_type: string | null;
};
type Event = { id: number; title: string; coupon: string; candidate_count: number; winner_count: number; created_at: string };
type Winner = { id: number; event_id: number; user_id: string; code: string; messaged: boolean; profiles: { nickname: string; kind: string } | null };

const input = "w-full rounded-lg border border-line bg-white px-3 py-2 outline-none focus:border-brand";
const when = (s: string) => new Date(s).toLocaleString("ko-KR", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
const kindLabel = (k?: string) => (k === "teacher" ? "현장교사" : "재학생");
const DEFAULT_MSG = "{닉네임} 님, 축하드려요! 🎉\n보육시각 행사에 당첨되어 [{쿠폰}] 쿠폰을 드려요.\n\n쿠폰 번호: {쿠폰번호}\n\n상품을 받으실 방법을 이 메시지에 답장으로 알려 주세요.";

function WinnerList({ winners }: { winners: Winner[] }) {
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {winners.map((w, i) => (
        <li key={w.id} className="flex items-center justify-between gap-2 rounded-xl border-2 border-ink bg-lime/50 px-3 py-2 text-sm">
          <span><b>{i + 1}. {w.profiles?.nickname ?? "탈퇴한 회원"}</b> <span className="text-xs text-foreground/60">{kindLabel(w.profiles?.kind)}</span></span>
          <span className="font-mono text-xs">{w.code}{w.messaged ? " · 📮보냄" : ""}</span>
        </li>
      ))}
    </ul>
  );
}

function SendBox({ ev, winners, onSent }: { ev: Event; winners: Winner[]; onSent: () => void }) {
  const [title, setTitle] = useState(`🎁 ${ev.title} 당첨 안내`);
  const [body, setBody] = useState(DEFAULT_MSG);
  const [busy, setBusy] = useState(false);
  const left = winners.filter((w) => !w.messaged).length;

  async function send() {
    if (!confirm(`당첨자 ${left}명에게 1:1 메시지를 보낼까요?`)) return;
    setBusy(true);
    const { data, error } = await supabase.rpc("admin_message_winners", { eid: ev.id, msg_title: title.trim(), msg_body: body.trim() });
    setBusy(false);
    if (error) return alert("메시지를 보내지 못했어요. 잠시 후 다시 시도해 주세요.");
    alert(`${data}명에게 메시지를 보냈어요. 답장은 📮 문의함에서 볼 수 있어요.`);
    onSent();
  }

  if (left === 0) return <p className="text-sm text-foreground/70">✅ 당첨자 모두에게 메시지를 보냈어요. 답장은 📮 문의함에서 확인하세요.</p>;
  return (
    <div className="space-y-2 rounded-xl border border-line bg-white p-4 text-sm">
      <p className="font-bold">📮 당첨자에게 쿠폰 메시지 보내기 ({left}명)</p>
      <input className={input} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} aria-label="메시지 제목" />
      <textarea className={`${input} min-h-36`} value={body} onChange={(e) => setBody(e.target.value)} maxLength={3000} aria-label="메시지 내용" />
      <p className="text-xs text-foreground/60">{"{닉네임}"}, {"{쿠폰번호}"}, {"{쿠폰}"} 자리에 당첨자마다 알맞은 내용이 자동으로 들어가요.</p>
      <button onClick={send} disabled={busy || !title.trim() || !body.trim()} className="rounded-full bg-brand px-5 py-2 font-medium text-white disabled:opacity-50">
        {busy ? "보내는 중…" : `${left}명에게 보내기`}
      </button>
    </div>
  );
}

export default function AdminCoupons() {
  const { profile, loading } = useAuth();
  const isAdmin = !!profile?.is_admin;
  const [members, setMembers] = useState<Member[] | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [groups, setGroups] = useState({ student: true, teacher: true });
  const [q, setQ] = useState("");
  const [title, setTitle] = useState("");
  const [coupon, setCoupon] = useState("");
  const [count, setCount] = useState(0); // 0 = 아직 인원을 정하지 않음
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [latest, setLatest] = useState<number | null>(null);
  const [openEvent, setOpenEvent] = useState<number | null>(null);
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    if (!isAdmin) return;
    let alive = true;
    supabase.rpc("admin_list_members").then(({ data }) => { if (alive) setMembers(((data as Member[]) ?? []).filter((m) => !m.is_admin)); });
    supabase.from("coupon_events").select("id,title,coupon,candidate_count,winner_count,created_at").order("created_at", { ascending: false }).limit(30)
      .then(({ data }) => { if (alive) setEvents((data as Event[]) ?? []); });
    supabase.from("coupon_winners").select("id,event_id,user_id,code,messaged,profiles(nickname,kind)").order("id").limit(1000)
      .then(({ data }) => { if (alive) setWinners((data as unknown as Winner[]) ?? []); });
    return () => { alive = false; };
  }, [isAdmin, version]);

  const candidates = useMemo(
    () => (members ?? []).filter((m) => groups[m.kind === "teacher" ? "teacher" : "student"] && !excluded.has(m.id)),
    [members, groups, excluded],
  );

  if (loading || !isAdmin) return null;

  const toggle = (id: string) => setExcluded((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  async function draw(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!title.trim() || !coupon.trim()) return setErr("행사 이름과 쿠폰 내용을 적어 주세요.");
    if (candidates.length === 0) return setErr("추첨 대상 회원이 없어요.");
    if (count < 1 || count > candidates.length) return setErr(`당첨 인원은 1명부터 ${candidates.length}명까지 정할 수 있어요.`);
    if (!confirm(`추첨 대상 ${candidates.length}명 중 ${count}명을 무작위로 뽑을까요?\n추첨 결과는 기록으로 남고 다시 뽑을 수 없어요.`)) return;
    setBusy(true);
    const { data, error } = await supabase.rpc("admin_draw_coupons", {
      title: title.trim(), coupon: coupon.trim(), candidates: candidates.map((m) => m.id), n: count,
    });
    setBusy(false);
    if (error) return setErr("추첨하지 못했어요. 잠시 후 다시 시도해 주세요.");
    setLatest(data as number);
    setOpenEvent(data as number);
    setTitle(""); setCoupon(""); setCount(0);
    reload();
  }

  const search = q.trim().toLowerCase();
  const matches = (m: Member) => !search || m.nickname.toLowerCase().includes(search) || detailsLabel(m.kind, m).toLowerCase().includes(search);

  return (
    <section id="admin-coupons" className="scroll-mt-24 space-y-5 border-t-4 border-double border-ink pt-6">
      <div>
        <h2 className="text-xl">🎲 회원 추첨 · 랜덤 행사 쿠폰 발급 <span className="text-sm font-normal text-foreground/60">(관리자만 보여요)</span></h2>
        <p className="mt-1 text-sm text-foreground/70">
          추첨 대상을 고르고 당첨 인원을 정하면 <b>서버가 무작위로</b> 뽑고 당첨자마다 쿠폰 번호를 만들어요. 결과는 기록으로 남아 다시 뽑을 수 없어요.
        </p>
      </div>

      {!members ? <p className="text-sm text-foreground/60">불러오는 중…</p> : (
        <form onSubmit={draw} className="space-y-4">
          <p className="font-bold">① 행사 정보</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm"><span className="mb-1 block font-medium">행사 이름</span>
              <input className={input} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={60} placeholder="예: 11월 출석 이벤트" /></label>
            <label className="block text-sm"><span className="mb-1 block font-medium">쿠폰 내용</span>
              <input className={input} value={coupon} onChange={(e) => setCoupon(e.target.value)} maxLength={100} placeholder="예: 커피 기프티콘" /></label>
          </div>

          <p className="font-bold">② 추첨 대상 고르기</p>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-medium">대상:</span>
            {([["student", "🎓 재학생"], ["teacher", "🧸 현장교사"]] as const).map(([k, label]) => (
              <label key={k} className={`cursor-pointer rounded-full px-3 py-1 ${groups[k] ? "bg-brand text-white" : "border border-line bg-white"}`}>
                <input type="checkbox" className="sr-only" checked={groups[k]} onChange={(e) => setGroups((g) => ({ ...g, [k]: e.target.checked }))} />
                {label}
              </label>
            ))}
            <span className="ml-auto">현재 추첨 대상 <b>{candidates.length}</b>명</span>
          </div>

          <input className={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="회원 찾기 (닉네임, 학교, 지역)" />
          <div className="grid gap-4 md:grid-cols-2">
            {([["student", "🎓 재학생"], ["teacher", "🧸 현장교사"]] as const).map(([k, label]) => {
              const list = members.filter((m) => (m.kind === "teacher" ? "teacher" : "student") === k);
              const shown = list.filter(matches);
              return (
                <div key={k} className={`rounded-2xl border-2 border-ink p-3 ${groups[k] ? "bg-background/60" : "opacity-40"}`}>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="font-bold">{label} <span className="text-sm font-normal text-foreground/70">{list.filter((m) => !excluded.has(m.id)).length}/{list.length}명 포함</span></h3>
                    <div className="flex gap-2 text-xs">
                      <button type="button" className="underline" onClick={() => setExcluded((p) => { const n = new Set(p); list.forEach((m) => n.delete(m.id)); return n; })}>모두 포함</button>
                      <button type="button" className="underline" onClick={() => setExcluded((p) => { const n = new Set(p); list.forEach((m) => n.add(m.id)); return n; })}>모두 빼기</button>
                    </div>
                  </div>
                  <ul className="max-h-60 space-y-1 overflow-y-auto text-sm">
                    {shown.map((m) => (
                      <li key={m.id}>
                        <label className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 hover:bg-soft">
                          <input type="checkbox" checked={!excluded.has(m.id)} onChange={() => toggle(m.id)} disabled={!groups[k]} />
                          <span className="font-medium">{m.nickname}</span>
                          <span className="truncate text-xs text-foreground/60">{detailsLabel(m.kind, m)}</span>
                        </label>
                      </li>
                    ))}
                    {shown.length === 0 && <li className="py-4 text-center text-foreground/60">{list.length === 0 ? "아직 회원이 없어요." : "찾는 회원이 없어요."}</li>}
                  </ul>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-foreground/60">관리자 계정은 추첨 대상에서 자동으로 빠져요. 체크를 풀면 그 회원은 이번 추첨에서 빠져요.</p>
          <div className="space-y-2 rounded-2xl border-2 border-ink bg-white p-4">
            <p className="font-bold">③ 뽑을 인원 정하기</p>
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={() => setCount((c) => Math.max(1, c - 1))} className="h-10 w-10 rounded-full border-2 border-ink text-xl font-bold" aria-label="1명 줄이기">−</button>
              <input type="number" min={1} max={candidates.length} value={count || ""} placeholder="0"
                onChange={(e) => setCount(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
                className="w-20 rounded-lg border-2 border-ink bg-white px-2 py-1.5 text-center text-2xl font-bold" aria-label="뽑을 인원" />
              <button type="button" onClick={() => setCount((c) => Math.min(candidates.length, c + 1))} className="h-10 w-10 rounded-full border-2 border-ink text-xl font-bold" aria-label="1명 늘리기">+</button>
              <span className="text-sm">명 <span className="text-foreground/70">(추첨 대상 {candidates.length}명 중)</span></span>
            </div>
            {count > candidates.length && <p className="text-sm text-red-700">추첨 대상({candidates.length}명)보다 많이 뽑을 수 없어요.</p>}
            {count === 0 && <p className="text-xs text-foreground/60">먼저 몇 명을 뽑을지 정해 주세요. 인원을 정해야 추첨 버튼이 눌려요.</p>}
          </div>
          {err && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{err}</p>}
          <button disabled={busy || candidates.length === 0 || count < 1 || count > candidates.length}
            className="rounded-full bg-brand px-6 py-2.5 text-lg font-bold text-white disabled:opacity-50">
            {busy ? "추첨 중…" : count >= 1 ? `🎲 ${count}명 무작위로 뽑기` : "🎲 인원을 먼저 정해 주세요"}
          </button>
        </form>
      )}

      {events.length > 0 && (
        <div className="space-y-3 border-t-2 border-ink pt-4">
          <h3 className="text-lg font-bold">추첨 기록</h3>
          {events.map((ev) => {
            const ws = winners.filter((w) => w.event_id === ev.id);
            const open = openEvent === ev.id;
            return (
              <div key={ev.id} className={`rounded-2xl border p-4 ${latest === ev.id ? "border-2 border-ink bg-lime/20" : "border-line bg-white/60"}`}>
                <button onClick={() => setOpenEvent(open ? null : ev.id)} className="flex w-full flex-wrap items-center gap-2 text-left">
                  {latest === ev.id && <span className="kw rounded-full px-2 text-xs font-bold">방금 추첨</span>}
                  <b>{ev.title}</b>
                  <span className="text-sm text-foreground/70">· {ev.coupon} · {ev.candidate_count}명 중 {ev.winner_count}명 · {when(ev.created_at)}</span>
                  <span className="ml-auto text-xs text-foreground/60">{open ? "접기 ▲" : "당첨자 보기 ▼"}</span>
                </button>
                {open && (
                  <div className="mt-3 space-y-3">
                    <WinnerList winners={ws} />
                    <SendBox ev={ev} winners={ws} onSent={reload} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
