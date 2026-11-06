import type { Metadata } from "next";
import { Noto_Sans_KR, Jua } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AuthProvider from "@/components/AuthProvider";

const noto = Noto_Sans_KR({
  variable: "--font-noto",
  subsets: ["latin"],
  weight: ["400", "500", "700", "800", "900"],
});

const jua = Jua({
  variable: "--font-jua",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "educare insight | 유아교육과, 아동보육과, 교사들을 위한 페이지",
  description:
    "보육과정 안내, 발달이론 등 아동 필수 지식, 그리고 재학생과 현장 교사가 함께 나누는 커뮤니티.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${noto.variable} ${jua.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
