/**
 * @file tour-map-layout.tsx
 * @description 관광지 목록-지도 연동 레이아웃 컴포넌트
 *
 * 관광지 목록과 네이버 지도를 함께 표시하며, 두 요소 간 상호작용을 제공합니다.
 * 데스크톱에서는 분할 레이아웃, 모바일에서는 탭 형태로 전환합니다.
 *
 * 주요 기능:
 * 1. 반응형 레이아웃 (데스크톱: 분할, 모바일: 탭)
 * 2. 선택된 관광지 상태 관리
 * 3. 리스트 항목 클릭 시 지도 이동 및 마커 강조
 * 4. 마커 클릭 시 리스트 항목 강조
 *
 * @dependencies
 * - components/tour-list.tsx
 * - components/naver-map.tsx
 * - lib/types/tour.ts (TourItem)
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { TourItem } from '@/lib/types/tour';
import TourList from '@/components/tour-list';
import { NaverMap } from '@/components/naver-map';
import { Button } from '@/components/ui/button';
import { List, Map as MapIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TourMapLayoutProps {
  /** 관광지 목록 */
  tours: TourItem[];
  /** 로딩 상태 */
  isLoading?: boolean;
  /** 에러 상태 */
  error: Error | null;
  /** 검색 모드 여부 */
  isSearchMode?: boolean;
  /** 검색 키워드 */
  keyword?: string;
  /** 추가 스타일 클래스 */
  className?: string;
}

type ViewMode = 'list' | 'map';

/**
 * 관광지 목록-지도 연동 레이아웃 컴포넌트
 *
 * @example
 * ```tsx
 * <TourMapLayout
 *   tours={tourItems}
 *   isLoading={false}
 *   error={null}
 *   isSearchMode={false}
 * />
 * ```
 */
export default function TourMapLayout({
  tours,
  isLoading = false,
  error,
  isSearchMode = false,
  keyword,
  className,
}: TourMapLayoutProps) {
  const [selectedTourId, setSelectedTourId] = useState<string | undefined>();
  const [hoveredTourId, setHoveredTourId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const listContainerRef = useRef<HTMLDivElement>(null);
  const selectedCardRef = useRef<HTMLDivElement>(null);

  /**
   * 관광지 선택 핸들러
   */
  const handleTourSelect = useCallback((tour: TourItem) => {
    setSelectedTourId(tour.contentid);

    // 모바일에서 지도 모드로 자동 전환
    if (window.innerWidth < 768) {
      setViewMode('map');
    }
  }, []);

  /**
   * 관광지 호버 핸들러
   */
  const handleTourHover = useCallback((tour: TourItem | null) => {
    setHoveredTourId(tour?.contentid || null);
  }, []);

  /**
   * 마커 클릭 핸들러
   */
  const handleMarkerClick = useCallback(
    (tour: TourItem) => {
      setSelectedTourId(tour.contentid);

      // 리스트 항목으로 스크롤
      if (listContainerRef.current) {
        const cardElement = listContainerRef.current.querySelector(
          `[data-tour-id="${tour.contentid}"]`
        );
        if (cardElement) {
          cardElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        }
      }

      // 모바일에서 리스트 모드로 전환
      if (window.innerWidth < 768 && viewMode === 'map') {
        // 잠시 후 리스트로 전환하여 스크롤 효과 확인 가능
        setTimeout(() => {
          setViewMode('list');
        }, 500);
      }
    },
    [viewMode]
  );

  /**
   * 선택된 카드로 스크롤
   */
  useEffect(() => {
    if (selectedTourId && selectedCardRef.current) {
      selectedCardRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [selectedTourId]);

  /**
   * 초기 중심 좌표 계산 (관광지 목록의 평균 좌표)
   */
  const getInitialCenter = useCallback((): { lat: number; lng: number } | undefined => {
    if (tours.length === 0) {
      return undefined;
    }

    const validTours = tours.filter((tour) => tour.mapx && tour.mapy);
    if (validTours.length === 0) {
      return undefined;
    }

    // 좌표 변환 및 평균 계산
    let totalLat = 0;
    let totalLng = 0;

    validTours.forEach((tour) => {
      const lng = parseFloat(tour.mapx) / 10000000;
      const lat = parseFloat(tour.mapy) / 10000000;
      totalLat += lat;
      totalLng += lng;
    });

    return {
      lat: totalLat / validTours.length,
      lng: totalLng / validTours.length,
    };
  }, [tours]);

  const initialCenter = getInitialCenter();

  return (
    <div className={cn('space-y-4', className)}>
      {/* 모바일 탭 버튼 */}
      <div className="flex gap-2 md:hidden">
        <Button
          type="button"
          variant={viewMode === 'list' ? 'default' : 'outline'}
          onClick={() => setViewMode('list')}
          className="flex-1"
        >
          <List className="h-4 w-4 mr-2" />
          목록 보기
        </Button>
        <Button
          type="button"
          variant={viewMode === 'map' ? 'default' : 'outline'}
          onClick={() => setViewMode('map')}
          className="flex-1"
        >
          <MapIcon className="h-4 w-4 mr-2" />
          지도 보기
        </Button>
      </div>

      {/* 데스크톱 분할 레이아웃 / 모바일 탭 레이아웃 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[600px]">
        {/* 관광지 목록 */}
        <div
          ref={listContainerRef}
          className={cn(
            'overflow-y-auto',
            viewMode === 'map' ? 'hidden md:block' : 'block',
            'md:max-h-[600px]'
          )}
        >
          <TourList
            items={tours}
            isLoading={isLoading}
            error={error}
            isSearchMode={isSearchMode}
            keyword={keyword}
            selectedTourId={selectedTourId}
            onTourClick={handleTourSelect}
            onTourHover={handleTourHover}
          />
        </div>

        {/* 네이버 지도 */}
        <div
          className={cn(
            'relative',
            viewMode === 'list' ? 'hidden md:block' : 'block',
            'md:sticky md:top-4'
          )}
          style={{ minHeight: '400px', height: '600px' }}
        >
          <NaverMap
            tours={tours}
            selectedTourId={selectedTourId}
            hoveredTourId={hoveredTourId}
            onMarkerClick={handleMarkerClick}
          />
        </div>
      </div>
    </div>
  );
}

