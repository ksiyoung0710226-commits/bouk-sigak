import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-10 border-t-2 border-ink bg-lav py-6 text-center text-sm font-medium">
      <p>© educare insight · 유아교육과, 아동보육과, 교사들을 위한 공간</p>
      <p className="mt-2 space-x-3">
        <Link href="/terms" className="underline-offset-4 hover:underline">이용약관</Link>
        <Link href="/privacy" className="font-bold underline-offset-4 hover:underline">개인정보 처리방침</Link>
      </p>
    </footer>
  );
}
