/**
 * @file Footer.tsx
 * @description My Trip 웹사이트 푸터 컴포넌트
 *
 * 이 컴포넌트는 웹사이트 하단에 표시되는 푸터를 구현합니다.
 *
 * 주요 기능:
 * 1. 저작권 정보 표시
 * 2. 한국관광공사 API 출처 안내
 * 3. 반응형 디자인 (모바일/데스크톱)
 *
 * @dependencies
 * - Next.js Link 컴포넌트
 * - Tailwind CSS v4
 */

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t bg-background mt-auto">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* 저작권 정보 */}
          <div className="text-sm text-muted-foreground text-center md:text-left">
            <p>My Trip © 2025</p>
          </div>

          {/* 링크 영역 (선택 사항) */}
          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            {/* 추후 About, Contact 링크 추가 가능 */}
          </nav>

          {/* API 출처 안내 */}
          <div className="text-sm text-muted-foreground text-center md:text-right">
            <p>
              데이터 제공:{" "}
              <Link
                href="https://www.data.go.kr/data/15101578/openapi.do"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground underline transition-colors"
              >
                한국관광공사 API
              </Link>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

