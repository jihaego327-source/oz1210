/**
 * @file tour-list.tsx
 * @description 관광지 목록 컴포넌트
 *
 * 관광지 목록을 그리드 레이아웃으로 표시하는 컴포넌트입니다.
 * 로딩 상태, 빈 상태, 에러 상태를 처리합니다.
 *
 * 주요 기능:
 * 1. 반응형 그리드 레이아웃 (모바일 1열, 태블릿 2열, 데스크톱 3열)
 * 2. TourCard 목록 표시
 * 3. 로딩 상태 (Skeleton UI)
 * 4. 빈 상태 처리
 * 5. 에러 상태 처리 (재시도 버튼)
 *
 * @dependencies
 * - components/tour-card.tsx
 * - components/ui/skeleton.tsx
 * - components/ui/error.tsx
 * - lib/types/tour.ts (TourItem)
 */

'use client';

import { TourApiError } from '@/lib/api/tour-api';
import type { TourItem } from '@/lib/types/tour';
import TourCard from '@/components/tour-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Error } from '@/components/ui/error';
import { cn } from '@/lib/utils';

interface TourListProps {
  /** 관광지 목록 */
  items: TourItem[];
  /** 로딩 상태 */
  isLoading?: boolean;
  /** 에러 상태 */
  error: Error | null;
  /** 재시도 함수 (선택 사항) */
  onRetry?: () => void;
  /** 추가 스타일 클래스 */
  className?: string;
  /** 검색 모드 여부 */
  isSearchMode?: boolean;
  /** 검색 키워드 */
  keyword?: string;
  /** 선택된 관광지 ID */
  selectedTourId?: string | null;
  /** 관광지 클릭 핸들러 */
  onTourClick?: (tour: TourItem) => void;
  /** 관광지 호버 핸들러 */
  onTourHover?: (tour: TourItem | null) => void;
}

/**
 * 관광지 목록 컴포넌트
 *
 * @example
 * ```tsx
 * <TourList
 *   items={tourItems}
 *   isLoading={false}
 *   error={null}
 *   onRetry={() => refetch()}
 * />
 * ```
 */
export default function TourList({
  items,
  isLoading = false,
  error,
  onRetry,
  className,
  isSearchMode = false,
  keyword,
  selectedTourId,
  onTourClick,
  onTourHover,
}: TourListProps) {
  // 에러 상태 처리
  if (error) {
    const errorType =
      error instanceof TourApiError
        ? 'api'
        : error.message.includes('network') || error.message.includes('fetch')
          ? 'network'
          : 'unknown';

    // 재시도 핸들러: 전달된 함수가 있으면 사용, 없으면 페이지 새로고침
    const handleRetry = onRetry || (() => window.location.reload());

    return (
      <div className={cn('py-8', className)}>
        <Error
          title="관광지 목록을 불러올 수 없습니다"
          message={error.message || '알 수 없는 오류가 발생했습니다.'}
          type={errorType}
          onRetry={handleRetry}
        />
      </div>
    );
  }

  // 로딩 상태 처리
  if (isLoading) {
    return (
      <div
        className={cn(
          'grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3',
          className
        )}
      >
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="rounded-lg border bg-card shadow-sm overflow-hidden"
          >
            <Skeleton className="aspect-video w-full" />
            <div className="p-4 space-y-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // 빈 상태 처리
  if (items.length === 0) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center py-16 text-center',
          className
        )}
      >
        <p className="text-lg font-medium text-foreground mb-2">
          {isSearchMode && keyword
            ? `"${keyword}" 검색 결과가 없습니다`
            : '관광지가 없습니다'}
        </p>
        <p className="text-sm text-muted-foreground">
          {isSearchMode && keyword
            ? '다른 키워드로 검색하거나 필터를 변경해보세요.'
            : '다른 지역이나 타입을 선택해보세요.'}
        </p>
      </div>
    );
  }

  // 목록 표시
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3',
        className
      )}
      role="list"
      aria-label="관광지 목록"
    >
      {items.map((tour) => (
        <div
          key={tour.contentid}
          role="listitem"
          data-tour-id={tour.contentid}
          onClick={() => onTourClick?.(tour)}
          onMouseEnter={() => onTourHover?.(tour)}
          onMouseLeave={() => onTourHover?.(null)}
          className={cn(
            'cursor-pointer transition-all',
            selectedTourId === tour.contentid && 'ring-2 ring-primary ring-offset-2 rounded-lg'
          )}
        >
          <TourCard tour={tour} />
        </div>
      ))}
    </div>
  );
}

