/**
 * @file error.tsx
 * @description 라우트 세그먼트 에러 바운더리
 *
 * Next.js 15 App Router의 에러 바운더리 패턴을 사용하여
 * 특정 라우트 세그먼트에서 발생하는 예기치 않은 에러를 처리합니다.
 *
 * 주요 기능:
 * 1. 에러 타입별 메시지 구분 (TourApiError, 네트워크 에러 등)
 * 2. 에러 로깅 (console.error)
 * 3. 재시도 기능 (reset 함수)
 * 4. 홈으로 돌아가기 기능
 *
 * @see {@link https://nextjs.org/docs/app/api-reference/file-conventions/error | Next.js Error Handling}
 * @see {@link ../components/ui/error.tsx | Error 컴포넌트}
 */

'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Home } from 'lucide-react';
import { Error } from '@/components/ui/error';
import { Button } from '@/components/ui/button';
import { TourApiError } from '@/lib/api/tour-api';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * 에러 타입 판별 및 사용자 친화적인 메시지 생성
 */
function getErrorInfo(error: Error) {
  // TourApiError인 경우
  if (error instanceof TourApiError) {
    return {
      type: 'api' as const,
      title: 'API 오류',
      message: error.message || '데이터를 불러오는 중 오류가 발생했습니다.',
    };
  }

  // 네트워크 에러인 경우
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      type: 'network' as const,
      title: '네트워크 오류',
      message: '인터넷 연결을 확인해주세요.',
    };
  }

  // 파싱 에러인 경우
  if (error instanceof SyntaxError) {
    return {
      type: 'api' as const,
      title: '데이터 파싱 오류',
      message: '응답 데이터를 처리하는 중 오류가 발생했습니다.',
    };
  }

  // 기타 에러
  return {
    type: 'unknown' as const,
    title: '오류 발생',
    message: error.message || '예기치 않은 오류가 발생했습니다.',
  };
}

/**
 * 라우트 세그먼트 에러 바운더리 컴포넌트
 *
 * @param error - 발생한 에러 객체 (Next.js가 자동으로 전달)
 * @param reset - 에러 상태를 리셋하고 재시도하는 함수 (Next.js가 자동으로 전달)
 */
export default function ErrorBoundary({ error, reset }: ErrorProps) {
  const errorInfo = getErrorInfo(error);

  // 에러 로깅
  useEffect(() => {
    const errorLog = {
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      name: error.name,
      timestamp: new Date().toISOString(),
      type: errorInfo.type,
    };

    console.error('Route Segment Error:', errorLog);
  }, [error, errorInfo.type]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <Error
          title={errorInfo.title}
          message={errorInfo.message}
          type={errorInfo.type}
          onRetry={reset}
        />

        {/* 추가 액션 버튼 */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={reset}
            className="gap-2"
          >
            다시 시도
          </Button>
          <Button variant="default" size="sm" asChild className="gap-2">
            <Link href="/">
              <Home className="h-4 w-4" aria-hidden="true" />
              홈으로 돌아가기
            </Link>
          </Button>
        </div>

        {/* 개발 환경에서만 상세 에러 정보 표시 */}
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-8 p-4 bg-muted rounded-lg text-sm">
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
  );
}
