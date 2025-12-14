/**
 * @file global-error.tsx
 * @description 전역 에러 바운더리
 *
 * Next.js 15 App Router의 전역 에러 바운더리로,
 * 루트 레이아웃에서 발생하는 치명적인 에러를 처리합니다.
 *
 * 주의사항:
 * - 루트 레이아웃을 완전히 대체하므로 <html>, <body> 태그 필수
 * - 레이아웃 컴포넌트(Navbar, Footer) 사용 불가
 * - 최소한의 의존성만 사용
 *
 * @see {@link https://nextjs.org/docs/app/api-reference/file-conventions/error | Next.js Error Handling}
 */

'use client';

import { useEffect } from 'react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * 전역 에러 바운더리 컴포넌트
 *
 * 루트 레이아웃에서 발생하는 에러를 처리합니다.
 * 루트 레이아웃을 완전히 대체하므로 <html>, <body> 태그를 포함해야 합니다.
 *
 * @param error - 발생한 에러 객체 (Next.js가 자동으로 전달)
 * @param reset - 에러 상태를 리셋하고 재시도하는 함수 (Next.js가 자동으로 전달)
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  // 에러 로깅
  useEffect(() => {
    const errorLog = {
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      name: error.name,
      timestamp: new Date().toISOString(),
      type: 'global',
    };

    console.error('Global Error:', errorLog);
  }, [error]);

  return (
    <html lang="ko">
      <body>
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <div className="max-w-2xl w-full text-center space-y-6">
            {/* 에러 아이콘 */}
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <svg
                  className="h-8 w-8 text-destructive"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>

            {/* 에러 제목 */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">
                심각한 오류가 발생했습니다
              </h1>
              <p className="text-muted-foreground">
                애플리케이션을 초기화하는 중 오류가 발생했습니다.
                <br />
                아래 버튼을 클릭하여 다시 시도해주세요.
              </p>
            </div>

            {/* 재시도 버튼 */}
            <div className="flex justify-center gap-3">
              <button
                onClick={reset}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium"
              >
                다시 시도
              </button>
              <button
                onClick={() => {
                  window.location.href = '/';
                }}
                className="px-6 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors font-medium"
              >
                홈으로 이동
              </button>
            </div>

            {/* 개발 환경에서만 상세 에러 정보 표시 */}
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-8 p-4 bg-muted rounded-lg text-sm text-left">
                <summary className="cursor-pointer font-semibold mb-2">
                  개발자 정보 (개발 환경에서만 표시)
                </summary>
                <div className="mt-2 space-y-2 font-mono text-xs">
                  <div>
                    <strong>에러 메시지:</strong> {error.message}
                  </div>
                  {error.digest && (
                    <div>
                      <strong>Digest:</strong> {error.digest}
                    </div>
                  )}
                  {error.stack && (
                    <div>
                      <strong>스택 트레이스:</strong>
                      <pre className="mt-1 p-2 bg-background rounded overflow-auto max-h-48">
                        {error.stack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
