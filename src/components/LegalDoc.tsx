import Link from "next/link";

// 약관·방침 문서 공통 틀
export const EFFECTIVE_DATE = "2026년 11월 6일";
export const CONTACT_EMAIL = "ksiyoung0710226@gmail.com";

export function Article({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-bold">제{n}조 ({title})</h2>
      <div className="space-y-2 text-[15px] leading-relaxed">{children}</div>
    </section>
  );
}

export function LegalFooter() {
  return (
    <p className="border-t-2 border-ink pt-4 text-sm text-foreground/70">
      시행일: {EFFECTIVE_DATE} · 관련 문서: <Link href="/terms" className="underline">이용약관</Link> ·{" "}
      <Link href="/privacy" className="underline">개인정보 처리방침</Link> · 문의: 사이트의 ‘💌 문의하기’ 또는 {CONTACT_EMAIL}
    </p>
  );
}
