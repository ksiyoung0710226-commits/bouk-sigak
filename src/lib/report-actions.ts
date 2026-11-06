// 신고 처분 종류. DB(014_report_moderation.sql)의 check 목록과 같이 바꿀 것.
export const REPORT_ACTIONS = [
  { value: "none", label: "조치 없음(규칙 위반 아님)", help: "문제가 없다고 판단했을 때" },
  { value: "warning", label: "경고", help: "작성자에게 1:1 메시지로 따로 주의를 줄 때(글은 그대로 둠)" },
  { value: "delete_content", label: "게시물 삭제", help: "신고된 글·댓글만 삭제" },
  { value: "suspend_7", label: "7일 이용 정지", help: "7일 동안 글·댓글·채팅 쓰기 금지" },
  { value: "suspend_30", label: "30일 이용 정지", help: "30일 동안 글·댓글·채팅 쓰기 금지" },
  { value: "suspend_forever", label: "영구 이용 정지", help: "해제할 때까지 쓰기 금지(로그인·읽기는 가능)" },
  { value: "expel", label: "강제 탈퇴", help: "작성자 계정과 모든 글·댓글 삭제(되돌릴 수 없음)" },
] as const;

export type ReportAction = (typeof REPORT_ACTIONS)[number]["value"];

export const actionLabel = (a: string | null) => REPORT_ACTIONS.find((x) => x.value === a)?.label ?? "-";

// 정지·경고와 함께 '게시물도 삭제'를 고를 수 있는 처분
export const canAlsoDelete = (a: string) => ["warning", "suspend_7", "suspend_30", "suspend_forever"].includes(a);

// 신고자에게 보내는 안내 메일 문장(사용자 요청 문구)
export function reportMail(nickname: string, action: string, targetType: string | null, alsoDeleted: boolean) {
  const what = targetType === "comment" ? "댓글" : "게시글";
  const label = actionLabel(action) + (alsoDeleted && canAlsoDelete(action) ? " 및 게시물 삭제" : "");
  return {
    subject: "[보육시각] 신고 처리가 완료되었습니다",
    lines: [
      `${nickname}님의 신고 처리가 완료되었습니다.`,
      `신고하신 ${what}에 대해 '${label}' 처분을 내렸습니다.`,
      "보육시각을 이용해주셔서 감사합니다.",
    ],
  };
}
