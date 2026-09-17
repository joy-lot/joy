import type { Metadata } from "next";
import { Jua, Gowun_Dodum } from "next/font/google";
import "./globals.css";

const jua = Jua({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
});

const gowunDodum = Gowun_Dodum({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "향기요정 - 나만의 향 찾기",
  description: "대화를 통해 나에게 맞는 향을 추천받아 보세요.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className={`${jua.variable} ${gowunDodum.variable}`}>{children}</body>
    </html>
  );
}
