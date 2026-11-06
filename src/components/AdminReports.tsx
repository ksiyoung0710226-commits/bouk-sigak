"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { REPORT_ACTIONS, actionLabel, canAlsoDelete, targetWord } from "@/lib/report-actions";

type Report = {
  id: number;
  created_at: string;
  reason: string;
  reporter_id: string;
  reporter_nickname: string | null;
  reporter_email: string | null;
  target_type: "post" | "comment" | "dm";
  post_id: number | null;
  comment_id: number | null;
  target_exists: boolean;
  target_author_id: string | null;
  target_author_nickname: string | null;
  target_author_email: string | null;
  target_author_exists: boolean;
  target_author_suspended_until: string | null;
  target_author_report_count: number;
  target_board: string | null;
  target_title: string | null;
  target_body: string | null;
  status: "open" | "resolved";
  action: string | null;
  admin_note: string | null;
  resolved_at: string | null;
  notified_at: string | null;
};

const dt = (d: string | null) => (d ? new Date(d).toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" }) : "-");
const boardName = (b: string | null) => (b === "qna" ? "Q&A" : b === "community" ? "커뮤니티" : b === "dm" ? "1:1 채팅" : "-");

function suspendText(until: string | null) {
  if (!until) return null;
  if (until === "infinity" || new Date(until).getFullYear() > 9000) return "영구 정지 중";
  if (new Date(until) <= new Date()) return null;
  return `${dt(until)}까지 정지 중`;
}

// 신고된 회원에게 보내는 1:1 메시지(경고·삭제·정지 때)
function targetMessage(action: string, alsoDelete: boolean, what: string) {
  const label = actionLabel(action) + (alsoDelete && canAlsoDelete(action) ? " 및 게시물 삭제" : "");
  return `회원님이 작성한 ${what}이(가) 신고되어 운영진이 확인했습니다.\n\n처분: ${label}\n\n보육시각은 서로 존중하는 공간을 위해 운영 규칙(이용약관)을 지키도록 안내하고 있어요. 처분에 대해 궁금한 점이 있으면 이 메시지에 답장해 주세요.`;
}

function ResolveBox({ r, onDone }: { r: Report; onDone: (msg: string) => void }) {
  const [action, setAction] = useState("");
  const [alsoDelete, setAlsoDelete] = useState(false);
  const [note, setNote] = useState("");
  const [tellTarget, setTellTarget] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const what = targetWord(r.target_type);
  const targetGone = !r.target_author_exists;

  async function submit() {
    if (!action) return setErr("처분을 골라 주세요.");
    const label = actionLabel(action) + (alsoDelete && canAlsoDelete(action) ? " + 게시물 삭제" : "");
    const warn = action === "expel" ? "\n\n⚠️ 강제 탈퇴는 되돌릴 수 없어요. 작성자의 계정과 모든 글·댓글이 지워져요." : "";
    if (!confirm(`'${label}' 처분으로 처리 완료할까요?\n신고자에게 처리 완료 메일이 발송돼요.${warn}`)) return;
    setBusy(true);
    setErr("");
    const { data: s } = await supabase.auth.getSession();
    const res = await fetch("/api/admin/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${s.session?.access_token ?? ""}` },
      body: JSON.stringify({ reportId: r.id, action, note, deleteContent: alsoDelete }),
    });
    const out = await res.json().catch(() => ({ error: "서버 응답을 읽지 못했어요." }));
    if (!res.ok || out.error) {
      setBusy(false);
      return setErr(out.error ?? "처리하지 못했어요.");
    }
    // 신고된 회원에게도 1:1 메시지로 처분을 알림(조치 없음·강제 탈퇴 제외)
    let told = "";
    if (tellTarget && r.target_author_id && !targetGone && action !== "none" && action !== "expel") {
      const { error } = await supabase.rpc("admin_start_inquiry", {
        target: r.target_author_id,
        title: "🚩 신고 처리 안내",
        body: targetMessage(action, alsoDelete, what),
      });
      told = error ? " 작성자에게 보내는 1:1 메시지는 실패했어요." : " 작성자에게 1:1 메시지로 처분을 알렸어요.";
    }
    setBusy(false);
    const mail = out.mailed > 0 ? `신고자에게 메일 ${out.mailed}통을 보냈어요.` : `⚠️ 메일은 보내지 못했어요(${out.mailError ?? "알 수 없는 오류"}). '처리 완료' 칸에서 다시 보낼 수 있어요.`;
    onDone(`✅ 처리 완료: ${label}. ${mail}${told}`);
  }

  return (
    <div className="mt-4 space-y-3 rounded-xl border-2 border-ink bg-white p-4 text-sm">
      <p className="font-bold">⚖️ 처분 결정</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {REPORT_ACTIONS.map((a) => {
          const disabled = targetGone && ["suspend_7", "suspend_30", "suspend_forever", "expel"].includes(a.value);
          return (
            <label key={a.value} className={`flex cursor-pointer gap-2 rounded-lg border p-2 ${action === a.value ? "border-ink bg-lime/50" : "border-line"} ${disabled ? "opacity-40" : ""}`}>
              <input type="radio" name={`act-${r.id}`} value={a.value} checked={action === a.value} disabled={disabled}
                onChange={() => { setAction(a.value); if (!canAlsoDelete(a.value)) setAlsoDelete(false); }} />
              <span>
                <b className={a.value === "expel" ? "text-red-700" : ""}>{a.label}</b>
                <span className="block text-xs text-foreground/60">{a.help}</span>
              </span>
            </label>
          );
        })}
      </div>
      {canAlsoDelete(action) && r.target_exists && (
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={alsoDelete} onChange={(e) => setAlsoDelete(e.target.checked)} />
          신고된 {what}도 함께 삭제
        </label>
      )}
      {action && action !== "none" && action !== "expel" && !targetGone && (
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={tellTarget} onChange={(e) => setTellTarget(e.target.checked)} />
          작성자({r.target_author_nickname})에게 1:1 메시지로 처분 알리기
        </label>
      )}
      <label className="block">
        <span className="mb-1 block font-medium">판단 메모 <span className="font-normal text-foreground/60">(관리자만 보여요 · 선택)</span></span>
        <textarea className="min-h-20 w-full rounded-lg border border-line px-3 py-2" value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000}
          placeholder="예: 욕설 포함, 같은 회원 신고 2회째라 7일 정지" />
      </label>
      {err && <p className="rounded-lg bg-red-50 p-2 text-red-700">{err}</p>}
      <button onClick={submit} disabled={busy || !action} className="rounded-full bg-brand px-5 py-2 font-medium text-white hover:bg-brand-dark disabled:opacity-50">
        {busy ? "처리 중…" : "✔ 처리 완료 (신고자에게 메일 발송)"}
      </button>
    </div>
  );
}

function ReportCard({ r, onChange }: { r: Report; onChange: (msg?: string) => void }) {
  const [busy, setBusy] = useState(false);
  const what = targetWord(r.target_type);
  const suspended = suspendText(r.target_author_suspended_until);

  async function resend() {
    setBusy(true);
    const { data: s } = await supabase.auth.getSession();
    const res = await fetch("/api/admin/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${s.session?.access_token ?? ""}` },
      body: JSON.stringify({ resendId: r.id }),
    });
    const out = await res.json().catch(() => ({}));
    setBusy(false);
    onChange(out.mailed > 0 ? "✅ 메일을 다시 보냈어요." : `⚠️ 메일을 보내지 못했어요. ${out.mailError ?? out.error ?? ""}`);
  }

  async function unsuspend() {
    if (!r.target_author_id || !confirm(`${r.target_author_nickname} 님의 이용 정지를 풀까요?`)) return;
    const { error } = await supabase.rpc("admin_unsuspend", { target: r.target_author_id });
    onChange(error ? "정지 해제에 실패했어요." : `✅ ${r.target_author_nickname} 님의 이용 정지를 풀었어요.`);
  }

  return (
    <li className="card p-4 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-bold">
          🚩 {boardName(r.target_board)} {what} 신고
          {r.status === "resolved" && <span className="kw ml-2 text-xs">처리 완료</span>}
        </p>
        <p className="text-xs text-foreground/60">신고 {dt(r.created_at)}</p>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-line bg-background/50 p-3">
          <p className="text-xs font-bold text-foreground/60">신고한 사람</p>
          <p><b>{r.reporter_nickname ?? "-"}</b> <span className="text-foreground/70">{r.reporter_email}</span></p>
          <p className="mt-2 text-xs font-bold text-foreground/60">신고 이유</p>
          <p className="whitespace-pre-wrap rounded bg-red-50 p-2">{r.reason}</p>
        </div>
        <div className="rounded-lg border border-line bg-background/50 p-3">
          <p className="text-xs font-bold text-foreground/60">신고당한 사람(작성자)</p>
          <p>
            <b>{r.target_author_nickname ?? "-"}</b> <span className="text-foreground/70">{r.target_author_email ?? ""}</span>
            {!r.target_author_exists && <span className="ml-1 text-xs text-red-700">(탈퇴함)</span>}
          </p>
          <p className="text-xs">이 회원이 받은 신고 누적 <b>{r.target_author_report_count}</b>건</p>
          {suspended && (
            <p className="mt-1 text-xs font-bold text-red-700">
              ⛔ {suspended}
              {r.target_author_exists && <button onClick={unsuspend} className="ml-2 font-normal underline">정지 풀기</button>}
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 rounded-lg border-2 border-ink bg-white p-3">
        <p className="text-xs font-bold text-foreground/60">
          신고된 {what} 내용 (신고 당시 그대로 저장) {r.target_exists ? "· 지금도 사이트에 있음" : "· 이미 삭제됨"}
        </p>
        {r.target_title && <p className="mt-1 font-bold">{r.target_type === "comment" ? `글 「${r.target_title}」에 단 댓글` : r.target_type === "dm" ? `${r.target_title} (회원 간 1:1 채팅, 신고된 부분만 보임)` : r.target_title}</p>}
        <p className="mt-1 max-h-60 overflow-auto whitespace-pre-wrap">{r.target_body ?? "-"}</p>
      </div>

      {r.status === "open" ? (
        <ResolveBox r={r} onDone={(m) => onChange(m)} />
      ) : (
        <div className="mt-3 space-y-1 rounded-lg bg-lime/40 p-3">
          <p>처분: <b>{actionLabel(r.action)}</b> · 처리 {dt(r.resolved_at)}</p>
          {r.admin_note && <p className="whitespace-pre-wrap text-foreground/80">메모: {r.admin_note}</p>}
          <p className="text-xs">
            {r.notified_at ? `📧 신고자에게 메일 보냄 (${dt(r.notified_at)})` : "📧 아직 메일을 보내지 못했어요."}
            <button onClick={resend} disabled={busy} className="ml-2 underline disabled:opacity-50">{busy ? "보내는 중…" : r.notified_at ? "다시 보내기" : "메일 보내기"}</button>
          </p>
        </div>
      )}
    </li>
  );
}

export default function AdminReports() {
  const { profile, loading } = useAuth();
  const [reports, setReports] = useState<Report[] | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"open" | "resolved">("open");
  const [notice, setNotice] = useState("");
  const [version, setVersion] = useState(0);
  const isAdmin = !!profile?.is_admin;

  useEffect(() => {
    if (!isAdmin) return;
    let alive = true;
    supabase.rpc("admin_list_reports").then(({ data, error }) => {
      if (!alive) return;
      if (error) setError("신고 목록을 불러오지 못했어요.");
      else setReports(data as Report[]);
    });
    return () => { alive = false; };
  }, [isAdmin, version]);

  const reload = useCallback((msg?: string) => {
    if (msg) setNotice(msg);
    setVersion((v) => v + 1);
    window.dispatchEvent(new Event("boyuk:reports-changed"));
  }, []);

  if (loading || !isAdmin) return null;
  const open = reports?.filter((r) => r.status === "open") ?? [];
  const done = reports?.filter((r) => r.status === "resolved") ?? [];
  const list = tab === "open" ? open : done;

  return (
    <section id="admin-reports" className="card scroll-mt-24 space-y-4 p-6">
      <div>
        <h2 className="text-xl">🚩 신고 관리 <span className="text-sm font-normal text-foreground/60">(관리자만 보여요)</span></h2>
        <p className="mt-1 text-sm text-foreground/70">
          신고 이유와 신고된 내용을 확인한 뒤 처분(경고·삭제·이용 정지·강제 탈퇴)을 고르고 ‘처리 완료’를 누르면,
          신고자에게 “○○님의 신고 처리가 완료되었습니다”라는 메일이 자동으로 가요. 메일 발송 기록이 남아서 처리했다는 증거가 돼요.
        </p>
      </div>
      <div className="flex gap-2 text-sm">
        {([["open", `대기 중 ${open.length}`], ["resolved", `처리 완료 ${done.length}`]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`rounded-full border-2 border-ink px-4 py-1 font-medium ${tab === k ? "bg-lime" : "bg-white"}`}>{l}</button>
        ))}
      </div>
      {notice && (
        <p className="rounded-lg bg-lime/60 p-3 text-sm" role="status">
          {notice} <button onClick={() => setNotice("")} className="ml-2 underline">닫기</button>
        </p>
      )}
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {!reports && !error && <p className="text-sm text-foreground/60">불러오는 중…</p>}
      {reports && (
        <ul className="space-y-4">
          {list.map((r) => <ReportCard key={r.id} r={r} onChange={reload} />)}
          {list.length === 0 && <li className="py-6 text-center text-sm text-foreground/60">{tab === "open" ? "처리할 신고가 없어요. 🎉" : "아직 처리한 신고가 없어요."}</li>}
        </ul>
      )}
    </section>
  );
}
