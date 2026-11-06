import { requireAdmin } from "@/lib/server/supa";
import { mailReady, sendMail } from "@/lib/server/mail";
import { REPORT_ACTIONS, reportMail } from "@/lib/report-actions";

// 관리자: 신고 처리 완료 → 처분 실행(DB) → 신고자에게 안내 메일
// body: { reportId, action, note, deleteContent } 또는 { resendId } (메일 다시 보내기)
type Row = { id: number; reporter_email: string; reporter_nickname: string; action: string; target_type: string; content_deleted: boolean };

export async function POST(req: Request) {
  const db = await requireAdmin(req);
  if (!db) return Response.json({ error: "관리자만 할 수 있어요." }, { status: 403 });
  const body = await req.json().catch(() => ({}));

  let rows: Row[] = [];
  if (body.resendId) {
    const { data, error } = await db.rpc("admin_report_mail_info", { report_id: Number(body.resendId) });
    if (error) return Response.json({ error: error.message }, { status: 400 });
    rows = data ?? [];
  } else {
    const action = String(body.action ?? "");
    if (!REPORT_ACTIONS.some((a) => a.value === action)) return Response.json({ error: "처분을 골라 주세요." }, { status: 400 });
    const { data, error } = await db.rpc("admin_resolve_report", {
      report_id: Number(body.reportId),
      act: action,
      note: String(body.note ?? "").slice(0, 1000),
      delete_content: Boolean(body.deleteContent),
    });
    if (error) {
      const msg = /already resolved/.test(error.message) ? "이미 처리된 신고예요."
        : /cannot punish admin/.test(error.message) ? "관리자에게는 정지·탈퇴 처분을 할 수 없어요."
        : `처리하지 못했어요: ${error.message}`;
      return Response.json({ error: msg }, { status: 400 });
    }
    rows = data ?? [];
  }

  if (!mailReady()) return Response.json({ resolved: true, mailed: 0, mailError: "메일 서버가 아직 연결되지 않았어요(SMTP 설정 필요)." });

  const sent: number[] = [];
  const failed: string[] = [];
  for (const r of rows) {
    const m = reportMail(r.reporter_nickname, r.action, r.target_type, r.content_deleted);
    try {
      await sendMail(r.reporter_email, m.subject, m.lines);
      sent.push(r.id);
    } catch (e) {
      failed.push(`${r.reporter_nickname}: ${(e as Error).message}`);
    }
  }
  if (sent.length) await db.rpc("admin_mark_reports_notified", { report_ids: sent });
  return Response.json({ resolved: true, mailed: sent.length, mailError: failed.length ? failed.join(" / ") : null });
}
