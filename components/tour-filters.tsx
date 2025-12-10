/**
 * @file tour-filters.tsx
 * @description 관광지 목록 필터 컴포넌트
 *
 * 지역 필터, 관광 타입 필터, 정렬 옵션을 제공하는 필터 컴포넌트입니다.
 * URL 쿼리 파라미터를 단일 소스로 사용하여 필터 상태를 관리합니다.
 *
 * 주요 기능:
 * 1. 지역 필터 (시/도 선택)
 * 2. 관광 타입 필터 (다중 선택)
 * 3. 정렬 옵션 (최신순, 이름순)
 * 4. 필터 변경 시 URL 업데이트
 *
 * @dependencies
 * - Next.js useRouter, useSearchParams
 * - components/ui/select.tsx
 * - components/ui/checkbox.tsx
 * - lib/types/filter.ts
 * - lib/types/tour.ts (CONTENT_TYPE_NAMES)
 */

'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { CONTENT_TYPE_NAMES } from '@/lib/types/tour';
import type { AreaCode } from '@/lib/types/tour';
import type { SortBy, PetSize } from '@/lib/types/filter';
import { PET_SIZE_LABELS } from '@/lib/types/filter';
import { cn } from '@/lib/utils';

interface TourFiltersProps {
  /** 지역 코드 목록 (시/도) */
  areaCodes: AreaCode[];
  /** 추가 스타일 클래스 */
  className?: string;
}

/**
 * 관광지 필터 컴포넌트
 *
 * @example
 * ```tsx
 * <TourFilters areaCodes={areaCodes} />
 * ```
 */
export default function TourFilters({ areaCodes, className }: TourFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 현재 필터 값 읽기
  // searchParams.get()은 string | null을 반환하므로 nullish coalescing 사용
  const currentAreaCode = searchParams.get('areaCode');
  const currentContentTypeIds = useMemo(() => {
    const ids = searchParams.get('contentTypeIds');
    if (!ids) return [];
    return ids.split(',').filter(Boolean);
  }, [searchParams]);
  const currentPetAllowed = searchParams.get('petAllowed') === 'true';
  const currentPetSizes = useMemo<PetSize[]>(() => {
    const sizes = searchParams.get('petSizes');
    if (!sizes) return [];
    return sizes
      .split(',')
      .map((size) => size.trim())
      .filter((size): size is PetSize => ['small', 'medium', 'large'].includes(size));
  }, [searchParams]);
  const currentSortBy = (searchParams.get('sortBy') || 'modifiedtime') as SortBy;

  /**
   * URL 쿼리 파라미터 업데이트
   */
  const updateFilters = useCallback(
    (updates: {
      areaCode?: string | undefined;
      contentTypeIds?: string[];
      petAllowed?: boolean;
      petSizes?: PetSize[];
      sortBy?: SortBy;
      pageNo?: number;
    }) => {
      console.log('📍 updateFilters 호출됨:', updates);
      const params = new URLSearchParams(searchParams.toString());

      // areaCode 업데이트
      if ('areaCode' in updates) {
        console.log('📍 areaCode 업데이트:', updates.areaCode);
        if (updates.areaCode && updates.areaCode !== 'all') {
          params.set('areaCode', updates.areaCode);
          console.log('📍 params.set 실행: areaCode =', updates.areaCode);
        } else {
          // undefined, null, 빈 문자열, 'all' 모두 URL에서 제거
          params.delete('areaCode');
          console.log('📍 params.delete 실행: areaCode 제거');
        }
      }

      // contentTypeIds 업데이트
      if (updates.contentTypeIds !== undefined) {
        if (updates.contentTypeIds.length > 0) {
          params.set('contentTypeIds', updates.contentTypeIds.join(','));
        } else {
          params.delete('contentTypeIds');
        }
      }

      // petAllowed 업데이트
      if (updates.petAllowed !== undefined) {
        if (updates.petAllowed) {
          params.set('petAllowed', 'true');
        } else {
          params.delete('petAllowed');
        }
      }

      // petSizes 업데이트
      if (updates.petSizes !== undefined) {
        if (updates.petSizes.length > 0) {
          params.set('petSizes', updates.petSizes.join(','));
        } else {
          params.delete('petSizes');
        }
      }

      // sortBy 업데이트
      if (updates.sortBy !== undefined) {
        params.set('sortBy', updates.sortBy);
      }

      // pageNo 업데이트 (필터 변경 시 1페이지로 리셋)
      if (updates.pageNo !== undefined) {
        if (updates.pageNo === 1) {
          params.delete('pageNo');
        } else {
          params.set('pageNo', String(updates.pageNo));
        }
      } else {
        // 필터 변경 시 항상 1페이지로 리셋
        params.delete('pageNo');
      }

      // URL 업데이트 (변경 여부와 관계없이 항상 실행하여 Select 리렌더링 보장)
      const newUrl = `/?${params.toString()}`;
      router.replace(newUrl);
    },
    [router, searchParams]
  );

  /**
   * 지역 필터 변경 핸들러
   * 
   * '전체' 선택 시 currentAreaCode를 null로 설정하여
   * 다시 '전체'를 선택해도 변화를 감지할 수 있도록 함
   */
  const handleAreaCodeChange = useCallback(
    (value: string) => {
      console.log('=== 🔍 지역 필터 변경 시작 ===');
      console.log('선택한 값:', value);
      console.log('현재 currentAreaCode:', currentAreaCode);
      console.log('value === "all"?', value === 'all');

      if (value === 'all') {
        console.log('✅ "전체" 선택됨 → updateFilters 호출할 예정');
        updateFilters({
          areaCode: undefined,
          pageNo: 1,
        });
        console.log('✅ updateFilters 호출 완료');
      } else {
        console.log('✅ 지역 선택됨:', value, '→ updateFilters 호출할 예정');
        updateFilters({
          areaCode: value,
          pageNo: 1,
        });
        console.log('✅ updateFilters 호출 완료');
      }
      console.log('=== 🔍 지역 필터 변경 끝 ===');
    },
    [updateFilters, currentAreaCode]
  );

  /**
   * 관광 타입 필터 변경 핸들러
   */
  const handleContentTypeChange = useCallback(
    (contentTypeId: string, checked: boolean) => {
      const newIds = checked
        ? [...currentContentTypeIds, contentTypeId]
        : currentContentTypeIds.filter((id) => id !== contentTypeId);

      updateFilters({
        contentTypeIds: newIds,
        pageNo: 1,
      });
    },
    [currentContentTypeIds, updateFilters]
  );

  /**
   * 반려동물 동반 가능 토글 핸들러
   */
  const handlePetAllowedChange = useCallback(
    (checked: boolean) => {
      updateFilters({
        petAllowed: checked,
        petSizes: checked ? currentPetSizes : [],
        pageNo: 1,
      });
    },
    [currentPetSizes, updateFilters]
  );

  /**
   * 반려동물 크기 필터 변경 핸들러
   */
  const handlePetSizeChange = useCallback(
    (size: PetSize, checked: boolean) => {
      const newSizes = checked
        ? [...currentPetSizes, size]
        : currentPetSizes.filter((s) => s !== size);

      updateFilters({
        petSizes: newSizes,
        petAllowed: newSizes.length > 0 ? true : currentPetAllowed,
        pageNo: 1,
      });
    },
    [currentPetAllowed, currentPetSizes, updateFilters]
  );

  /**
   * 정렬 옵션 변경 핸들러
   */
  const handleSortByChange = useCallback(
    (value: string) => {
      updateFilters({
        sortBy: value as SortBy,
        pageNo: 1,
      });
    },
    [updateFilters]
  );

  return (
    <div
      className={cn(
        'space-y-4 rounded-lg border bg-card p-4 shadow-sm',
        className
      )}
    >
      <h2 className="text-lg font-semibold">필터</h2>

      <div className="grid gap-4 md:grid-cols-3">
        {/* 지역 필터 */}
        <div className="space-y-2">
          <label className="text-sm font-medium">지역</label>
          <Select
            key={`area-select-${currentAreaCode || 'all'}`}
            value={currentAreaCode || 'all'}
            onValueChange={handleAreaCodeChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="지역 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              {areaCodes.map((area) => (
                <SelectItem key={area.code} value={area.code}>
                  {area.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 관광 타입 필터 */}
        <div className="space-y-2">
          <label className="text-sm font-medium">관광 타입</label>
          <div className="space-y-2 rounded-md border p-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="type-all"
                checked={currentContentTypeIds.length === 0}
                onCheckedChange={(checked) => {
                  if (checked) {
                    updateFilters({ contentTypeIds: [], pageNo: 1 });
                  }
                }}
              />
              <label
                htmlFor="type-all"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                전체
              </label>
            </div>
            {Object.entries(CONTENT_TYPE_NAMES).map(([id, name]) => (
              <div key={id} className="flex items-center space-x-2">
                <Checkbox
                  id={`type-${id}`}
                  checked={currentContentTypeIds.includes(id)}
                  onCheckedChange={(checked) =>
                    handleContentTypeChange(id, checked === true)
                  }
                />
                <label
                  htmlFor={`type-${id}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {name}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* 반려동물 필터 */}
        <div className="space-y-2 md:col-span-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="pet-allowed"
                checked={currentPetAllowed}
                onCheckedChange={(checked) => handlePetAllowedChange(checked === true)}
              />
              <label
                htmlFor="pet-allowed"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                반려동물 동반 가능
              </label>
            </div>
            <span className="text-xs text-muted-foreground">
              토글을 켜면 반려동물 가능 관광지만 표시합니다.
            </span>
          </div>

          <div className="space-y-2 rounded-md border p-3 bg-muted/30">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="pet-size-all"
                checked={currentPetSizes.length === 0}
                onCheckedChange={(checked) => {
                  if (checked) {
                    updateFilters({ petSizes: [], pageNo: 1 });
                  }
                }}
                disabled={!currentPetAllowed}
              />
              <label
                htmlFor="pet-size-all"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                크기 전체
              </label>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(PET_SIZE_LABELS).map(([key, label]) => {
                const size = key as PetSize;
                return (
                  <div key={size} className="flex items-center space-x-2">
                    <Checkbox
                      id={`pet-size-${size}`}
                      checked={currentPetSizes.includes(size)}
                      onCheckedChange={(checked) =>
                        handlePetSizeChange(size, checked === true)
                      }
                      disabled={!currentPetAllowed}
                    />
                    <label
                      htmlFor={`pet-size-${size}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {label}
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 정렬 옵션 */}
        <div className="space-y-2">
          <label className="text-sm font-medium">정렬</label>
          <Select value={currentSortBy} onValueChange={handleSortByChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="정렬 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="modifiedtime">최신순</SelectItem>
              <SelectItem value="title">이름순</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

