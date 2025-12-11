/**
 * @file tour-pagination.tsx
 * @description 관광지 목록 페이지네이션 컴포넌트
 *
 * 페이지 번호 선택 방식의 페이지네이션을 제공합니다.
 * URL 쿼리 파라미터를 통해 페이지 상태를 관리합니다.
 *
 * 주요 기능:
 * 1. 페이지 번호 버튼 표시 (현재 페이지 하이라이트)
 * 2. 이전/다음 페이지 버튼
 * 3. 페이지 범위 표시 (1 ... 5 6 7 ... 20)
 * 4. 반응형 디자인 (모바일 간소화)
 *
 * @dependencies
 * - Next.js useRouter, useSearchParams
 * - components/ui/button.tsx
 * - lib/types/tour.ts (PaginationInfo)
 */

'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PaginationInfo } from '@/lib/types/tour';

interface TourPaginationProps {
  /** 페이지네이션 정보 */
  pagination: PaginationInfo;
  /** 추가 스타일 클래스 */
  className?: string;
}

/**
 * 페이지 번호 범위 계산
 * 현재 페이지 주변의 페이지 번호들을 계산합니다.
 */
function getPageNumbers(
  currentPage: number,
  totalPages: number,
  maxVisible: number = 5
): (number | 'ellipsis')[] {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | 'ellipsis')[] = [];
  const half = Math.floor(maxVisible / 2);

  // 시작 페이지와 끝 페이지 계산
  let start = Math.max(1, currentPage - half);
  let end = Math.min(totalPages, start + maxVisible - 1);

  // 끝 페이지가 totalPages에 가까우면 시작 페이지 조정
  if (end === totalPages) {
    start = Math.max(1, end - maxVisible + 1);
  }

  // 첫 페이지
  if (start > 1) {
    pages.push(1);
    if (start > 2) {
      pages.push('ellipsis');
    }
  }

  // 중간 페이지들
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  // 마지막 페이지
  if (end < totalPages) {
    if (end < totalPages - 1) {
      pages.push('ellipsis');
    }
    pages.push(totalPages);
  }

  return pages;
}

/**
 * 관광지 목록 페이지네이션 컴포넌트
 *
 * @example
 * ```tsx
 * <TourPagination pagination={paginationInfo} />
 * ```
 */
export default function TourPagination({
  pagination,
  className,
}: TourPaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { pageNo: currentPage, totalPages, totalCount, numOfRows: pageSize } =
    pagination;

  // 페이지 변경 핸들러
  const handlePageChange = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams.toString());

      if (page === 1) {
        params.delete('pageNo');
      } else {
        params.set('pageNo', String(page));
      }

      router.push(`/?${params.toString()}`);
    },
    [router, searchParams]
  );

  // 페이지 번호 목록 계산
  const pageNumbers = useMemo(
    () => getPageNumbers(currentPage, totalPages),
    [currentPage, totalPages]
  );

  // 페이지 범위 계산 (1-20 / 전체 1,234개)
  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  // 이전/다음 페이지 버튼 비활성화 여부
  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === totalPages;

  // 페이지가 1개 이하면 페이지네이션 숨김
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* 페이지 정보 */}
      <div className="text-sm text-muted-foreground text-center">
        {totalCount > 0 ? (
          <>
            {startItem.toLocaleString()}-{endItem.toLocaleString()} / 전체{' '}
            {totalCount.toLocaleString()}개
          </>
        ) : (
          '검색 결과가 없습니다'
        )}
      </div>

      {/* 페이지네이션 버튼 */}
      <div className="flex items-center justify-center gap-1">
        {/* 이전 페이지 버튼 */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={isFirstPage}
          aria-label="이전 페이지"
          className="h-9 w-9"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* 페이지 번호 버튼들 (모바일에서는 간소화) */}
        <div className="hidden sm:flex items-center gap-1">
          {pageNumbers.map((page, index) => {
            if (page === 'ellipsis') {
              return (
                <div
                  key={`ellipsis-${index}`}
                  className="flex items-center justify-center h-9 w-9"
                >
                  <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                </div>
              );
            }

            const isActive = page === currentPage;

            return (
              <Button
                key={page}
                variant={isActive ? 'default' : 'outline'}
                size="icon"
                onClick={() => handlePageChange(page)}
                aria-label={`${page}페이지로 이동`}
                aria-current={isActive ? 'page' : undefined}
                className={cn('h-9 w-9', isActive && 'font-semibold')}
              >
                {page}
              </Button>
            );
          })}
        </div>

        {/* 모바일: 현재 페이지만 표시 */}
        <div className="sm:hidden flex items-center gap-2">
          <span className="text-sm font-medium">
            {currentPage} / {totalPages}
          </span>
        </div>

        {/* 다음 페이지 버튼 */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={isLastPage}
          aria-label="다음 페이지"
          className="h-9 w-9"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

