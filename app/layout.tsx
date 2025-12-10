import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { koKR } from "@clerk/localizations";
import { Geist, Geist_Mono } from "next/font/google";

import Navbar from "@/components/Navbar";
import { SyncUserProvider } from "@/components/providers/sync-user-provider";
import "./globals.css";

/**
 * Clerk 한국어 로컬라이제이션 설정
 *
 * @see {@link https://clerk.com/docs/guides/customizing-clerk/localization | Clerk 로컬라이제이션 가이드}
 *
 * `@clerk/localizations` 패키지에서 제공하는 `koKR` (ko-KR) 로컬라이제이션을 사용합니다.
 * 이 설정은 모든 Clerk 컴포넌트(SignIn, SignUp, UserButton 등)의 텍스트를 한국어로 표시합니다.
 *
 * 참고: 로컬라이제이션 기능은 현재 실험적(experimental) 기능입니다.
 */

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SaaS 템플릿",
  description: "Next.js + Clerk + Supabase 보일러플레이트",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider localization={koKR}>
      <html lang="ko">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <SyncUserProvider>
            <Navbar />
            {children}
          </SyncUserProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
