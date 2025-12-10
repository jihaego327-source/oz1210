/**
 * @file tour-search.tsx
 * @description 관광지 검색 컴포넌트
 *
 * 키워드로 관광지를 검색하는 검색창 컴포넌트입니다.
 * URL 쿼리 파라미터를 사용하여 검색 상태를 관리합니다.
 *
 * 주요 기능:
 * 1. 검색어 입력
 * 2. Enter 키 또는 검색 버튼으로 검색 실행
 * 3. URL 쿼리 파라미터와 동기화
 * 4. 검색 중 로딩 상태 표시
 *
 * @dependencies
 * - Next.js useRouter, useSearchParams
 * - components/ui/input.tsx
 * - components/ui/button.tsx
 * - lucide-react (Search 아이콘)
 */

'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TourSearchProps {
  /** 추가 스타일 클래스 */
  className?: string;
  /** 검색창 placeholder */
  placeholder?: string;
}

/**
 * 관광지 검색 컴포넌트
 *
 * @example
 * ```tsx
 * <TourSearch
 *   placeholder="관광지 검색..."
 *   minWidthMobile="300px"
 *   minWidthDesktop="500px"
 * />
 * ```
 */
export default function TourSearch({
  className,
  placeholder = '관광지 검색...',
}: TourSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // URL에서 현재 검색 키워드 읽기
  const currentKeyword = searchParams.get('keyword') || '';

  // URL의 keyword와 동기화
  useEffect(() => {
    setSearchValue(currentKeyword);
  }, [currentKeyword]);

  /**
   * 검색 실행
   */
  const handleSearch = useCallback(
    (keyword: string) => {
      const trimmedKeyword = keyword.trim();
      const params = new URLSearchParams(searchParams.toString());

      if (trimmedKeyword) {
        // 검색어가 있으면 keyword 파라미터 추가
        params.set('keyword', trimmedKeyword);
        // 검색 시 페이지를 1로 리셋
        params.delete('pageNo');
      } else {
        // 검색어가 없으면 keyword 파라미터 제거
        params.delete('keyword');
        params.delete('pageNo');
      }

      // URL 업데이트
      const newUrl = `/?${params.toString()}`;
      router.replace(newUrl);
    },
    [router, searchParams]
  );

  /**
   * Enter 키 입력 핸들러
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSearch(searchValue);
      }
    },
    [searchValue, handleSearch]
  );

  /**
   * 검색 버튼 클릭 핸들러
   */
  const handleSearchClick = useCallback(() => {
    handleSearch(searchValue);
  }, [searchValue, handleSearch]);

  /**
   * 입력값 변경 핸들러
   */
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  }, []);

  return (
    <div className={cn('flex-1 max-w-md mx-4', className)}>
      <div className="relative flex items-center gap-2">
        {/* 검색 아이콘 */}
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />

        {/* 검색 입력 필드 */}
        <Input
          ref={inputRef}
          type="search"
          placeholder={placeholder}
          value={searchValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="pl-10 w-full min-w-[300px] md:min-w-[500px]"
          aria-label="관광지 검색"
        />

        {/* 검색 버튼 */}
        <Button
          type="button"
          onClick={handleSearchClick}
          size="sm"
          className="shrink-0"
          aria-label="검색"
        >
          검색
        </Button>
      </div>
    </div>
  );
}

