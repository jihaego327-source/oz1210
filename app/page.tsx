/**
 * @file page.tsx
 * @description My Trip 홈페이지 - 관광지 목록 페이지
 *
 * 이 페이지는 전국 관광지 정보를 검색하고 조회할 수 있는 메인 페이지입니다.
 *
 * 주요 기능 (Phase 2에서 단계별 구현):
 * 1. 관광지 목록 표시 (Phase 2.2) ✅
 * 2. 지역/타입 필터 (Phase 2.3) ✅
 * 3. 키워드 검색 (Phase 2.4)
 * 4. 네이버 지도 연동 (Phase 2.5)
 * 5. 페이지네이션 (Phase 2.6)
 *
 * 현재 구현:
 * - 기본 레이아웃 구조 (헤더, 메인, 푸터)
 * - 관광지 목록 표시 (필터 적용)
 * - 필터 기능 (지역, 타입, 정렬)
 * - API 연동 (getAreaBasedList, getAreaCode)
 *
 * @dependencies
 * - Next.js App Router (Server Component)
 * - lib/api/tour-api.ts (getAreaBasedList, getAreaCode)
 * - components/tour-list.tsx
 * - components/tour-filters.tsx
 * - lib/types/filter.ts
 * - Tailwind CSS v4
 */

import { getAreaBasedList, getAreaCode, getDetailPetTour } from '@/lib/api/tour-api';
import TourList from '@/components/tour-list';
import TourFilters from '@/components/tour-filters';
import { DEFAULT_FILTERS, SORT_ARRANGE_MAP } from '@/lib/types/filter';
import type { SortBy, PetSize } from '@/lib/types/filter';
import { filterToursByPet, type TourWithPetInfo } from '@/lib/utils/pet-filter';

interface HomeProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function Home({ searchParams }: HomeProps) {
  // searchParams를 await로 받기 (Next.js 15)
  const params = await searchParams;

  // 필터 값 추출
  // areaCode가 없으면 undefined (기본값 사용 안 함 - "전체" 의미)
  const areaCode = params.areaCode
    ? Array.isArray(params.areaCode)
      ? params.areaCode[0]
      : params.areaCode
    : undefined;

  const contentTypeIds = params.contentTypeIds
    ? Array.isArray(params.contentTypeIds)
      ? params.contentTypeIds[0].split(',').filter(Boolean)
      : params.contentTypeIds.split(',').filter(Boolean)
    : DEFAULT_FILTERS.contentTypeIds;

  const sortBy = (params.sortBy
    ? Array.isArray(params.sortBy)
      ? params.sortBy[0]
      : params.sortBy
    : DEFAULT_FILTERS.sortBy) as SortBy;

  const pageNo = params.pageNo
    ? parseInt(
        Array.isArray(params.pageNo) ? params.pageNo[0] : params.pageNo,
        10
      )
    : DEFAULT_FILTERS.pageNo;

  const petAllowed =
    params.petAllowed !== undefined
      ? (Array.isArray(params.petAllowed) ? params.petAllowed[0] : params.petAllowed) ===
        'true'
      : DEFAULT_FILTERS.petAllowed ?? false;

  const petSizes = params.petSizes
    ? (Array.isArray(params.petSizes) ? params.petSizes[0] : params.petSizes)
        .split(',')
        .map((size) => size.trim())
        .filter((size): size is PetSize => ['small', 'medium', 'large'].includes(size))
    : DEFAULT_FILTERS.petSizes ?? [];

  const shouldApplyPetFilter = petAllowed || petSizes.length > 0;

  // API 호출을 위한 파라미터 설정
  // contentTypeIds가 여러 개인 경우 첫 번째만 사용 (API 제약)
  const contentTypeId = contentTypeIds.length > 0 ? contentTypeIds[0] : '12';
  const arrange = SORT_ARRANGE_MAP[sortBy];

  // 지역 목록과 관광지 목록 가져오기
  let areaCodes: Awaited<ReturnType<typeof getAreaCode>> = [];
  let tourData = null;
  let error: Error | null = null;

  try {
    // 지역 목록 가져오기
    areaCodes = await getAreaCode().catch(() => []);

    // 관광지 목록 가져오기
    // areaCode가 undefined인지 명시적으로 확인
    if (areaCode !== undefined) {
      // 특정 지역 선택 시 - 단일 API 호출
      tourData = await getAreaBasedList({
        areaCode,
        contentTypeId,
        numOfRows: 20,
        pageNo,
        arrange,
      });
    } else {
      // "전체" 선택 시 - 모든 지역 조회 후 병합
      if (areaCodes.length === 0) {
        // 지역 목록을 가져오지 못한 경우 기본값 사용
        tourData = await getAreaBasedList({
          areaCode: '1', // 서울 기본값
          contentTypeId,
          numOfRows: 20,
          pageNo,
          arrange,
        });
      } else {
        // 모든 지역에 대해 병렬로 API 호출
        const allAreaPromises = areaCodes.map((area) =>
          getAreaBasedList({
            areaCode: area.code,
            contentTypeId,
            numOfRows: 20, // 각 지역당 20개씩 조회
            pageNo: 1, // 전체 조회 시 각 지역의 첫 페이지만
            arrange,
          }).catch((err) => {
            // 개별 지역 API 호출 실패 시 빈 결과 반환
            console.error(`지역 ${area.name} (${area.code}) 조회 실패:`, err);
            return {
              items: [],
              pagination: {
                pageNo: 1,
                numOfRows: 20,
                totalCount: 0,
                totalPages: 0,
              },
            };
          })
        );

        const allAreaResults = await Promise.all(allAreaPromises);

        // 모든 지역의 결과를 병합
        const allItems = allAreaResults.flatMap((result) => result.items);
        const totalCount = allItems.length;

        // 정렬 처리 (서버에서 정렬된 결과를 받았지만, 병합 후 재정렬 필요할 수 있음)
        let sortedItems = allItems;
        if (sortBy === 'title') {
          // 이름순 정렬 (가나다순)
          sortedItems = [...allItems].sort((a, b) =>
            a.title.localeCompare(b.title, 'ko')
          );
        } else if (sortBy === 'modifiedtime') {
          // 최신순 정렬 (수정일 내림차순)
          sortedItems = [...allItems].sort((a, b) => {
            const dateA = parseInt(a.modifiedtime || '0', 10);
            const dateB = parseInt(b.modifiedtime || '0', 10);
            return dateB - dateA;
          });
        }

        // 페이지네이션 처리 (전체 조회 시 첫 20개만 표시)
        const startIndex = (pageNo - 1) * 20;
        const endIndex = startIndex + 20;
        const paginatedItems = sortedItems.slice(startIndex, endIndex);

        tourData = {
          items: paginatedItems,
          pagination: {
            pageNo,
            numOfRows: 20,
            totalCount,
            totalPages: Math.ceil(totalCount / 20),
          },
        };
      }
    }
  } catch (err) {
    error = err instanceof Error ? err : new Error('알 수 없는 오류가 발생했습니다.');
  }

  // 반려동물 필터 적용
  if (tourData && shouldApplyPetFilter) {
    const beforeCount = tourData.pagination.totalCount;
    const pageSize = tourData.pagination.numOfRows || 20;

    const itemsWithPetInfo: TourWithPetInfo[] = await Promise.all(
      tourData.items.map(async (item) => {
        const inlinePetInfo =
          item.chkpet ||
          item.chkpetsize ||
          item.chkpetplace ||
          item.chkpetfee ||
          item.petinfo
            ? {
                contentid: item.contentid,
                contenttypeid: item.contenttypeid,
                chkpetleash: item.chkpet,
                chkpetsize: item.chkpetsize,
                chkpetplace: item.chkpetplace,
                chkpetfee: item.chkpetfee,
                petinfo: item.petinfo,
                parking: undefined,
              }
            : null;

        if (inlinePetInfo) {
          return { ...item, petInfo: inlinePetInfo };
        }

        try {
          const petInfo = await getDetailPetTour({ contentId: item.contentid });
          return { ...item, petInfo };
        } catch (petError) {
          console.error(`반려동물 정보 조회 실패 (contentId: ${item.contentid})`, petError);
          return { ...item, petInfo: null };
        }
      })
    );

    const filteredItems = filterToursByPet(itemsWithPetInfo, {
      petAllowed,
      petSizes,
    });

    tourData = {
      items: filteredItems,
      pagination: {
        ...tourData.pagination,
        pageNo: 1,
        totalCount: filteredItems.length,
        totalPages: Math.max(1, Math.ceil(filteredItems.length / pageSize)),
      },
    };

    console.groupCollapsed('pet-filter');
    console.log('petAllowed', petAllowed, 'petSizes', petSizes);
    console.log('beforeCount', beforeCount, 'afterCount', filteredItems.length);
    console.groupEnd();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* 페이지 헤더 */}
        <div>
          <h1 className="text-3xl font-bold mb-4">관광지 목록</h1>
          <p className="text-muted-foreground">
            전국의 관광지를 검색하고 탐험해보세요.
          </p>
        </div>

        {/* 필터 */}
        <TourFilters areaCodes={areaCodes} />

        {/* 관광지 목록 */}
        <TourList
          items={tourData?.items || []}
          isLoading={false}
          error={error}
        />
      </div>
    </div>
  );
}
