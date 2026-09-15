import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "향기요정 - 나만의 향 찾기",
  description: "대화를 통해 나에게 맞는 향을 추천받고, 안전한 향수 만들기 방법을 배워보세요.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
