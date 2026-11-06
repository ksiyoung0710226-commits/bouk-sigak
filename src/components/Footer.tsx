import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-10 border-t-2 border-ink bg-lav py-6 text-center text-sm font-medium">
      <p>© 보육시각 · 아동보육 재학생과 현장 교사를 위한 공간</p>
      <p className="mt-2 space-x-3">
        <Link href="/terms" className="underline-offset-4 hover:underline">이용약관</Link>
        <Link href="/privacy" className="font-bold underline-offset-4 hover:underline">개인정보 처리방침</Link>
      </p>
    </footer>
  );
}
