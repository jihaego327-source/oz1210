/**
 * @file stats-api.ts
 * @description 통계 데이터 수집 API 클라이언트
 *
 * 통계 대시보드 페이지에서 사용할 통계 데이터를 수집하는 함수들을 제공합니다.
 * 지역별 및 타입별 관광지 개수를 집계하고, 전체 통계 요약 정보를 생성합니다.
 *
 * @see {@link ../PRD.md | PRD 문서 - 섹션 2.6 (통계 대시보드)}
 * @see {@link ../types/stats.ts | 통계 타입 정의}
 */

import { unstable_cache } from 'next/cache';
import { getAreaBasedList, getAreaCode, TourApiError } from '@/lib/api/tour-api';
import type {
  RegionStats,
  TypeStats,
  StatsSummary,
  TopRegion,
  TopType,
} from '@/lib/types/stats';
import { CONTENT_TYPE_NAMES } from '@/lib/types/stats';

// =====================================================
// 지역별 통계 수집
// =====================================================

/**
 * 지역별 관광지 개수 집계 (내부 함수)
 *
 * 모든 지역의 관광지 개수를 수집하여 반환합니다.
 * 각 지역별로 areaBasedList2 API를 호출하여 totalCount를 가져옵니다.
 *
 * @returns 지역별 통계 배열 (지역명, 지역 코드, 개수, 비율 포함)
 */
async function getRegionStatsInternal(): Promise<RegionStats[]> {
  try {
    // 1. 지역 코드 목록 조회
    const areas = await getAreaCode();

    // 2. 각 지역별로 병렬 호출 (전체 타입 대상)
    // contentTypeId를 지정하지 않고 전체 타입의 개수를 가져오기 위해
    // 각 타입별로 호출하여 합산하거나, 또는 타입 없이 호출
    // API 제약상 contentTypeId는 필수이므로, 각 타입별로 호출하여 합산
    const contentTypeIds = Object.keys(CONTENT_TYPE_NAMES);

    const regionPromises = areas.map(async (area) => {
      try {
        // 각 타입별로 호출하여 합산
        const typePromises = contentTypeIds.map(async (contentTypeId) => {
          try {
            const result = await getAreaBasedList({
              areaCode: area.code,
              contentTypeId,
              numOfRows: 1, // totalCount만 필요하므로 최소값
              pageNo: 1,
            });
            return result.pagination.totalCount;
          } catch (error) {
            // 일부 타입 실패 시 0으로 처리
            console.warn(
              `지역 ${area.name}(${area.code}) 타입 ${contentTypeId} 통계 수집 실패:`,
              error
            );
            return 0;
          }
        });

        const typeCounts = await Promise.allSettled(typePromises);
        const totalCount = typeCounts.reduce((sum, result) => {
          if (result.status === 'fulfilled') {
            return sum + result.value;
          }
          return sum;
        }, 0);

        return {
          areaCode: area.code,
          name: area.name,
          count: totalCount,
        };
      } catch (error) {
        // 지역별 통계 수집 실패 시 0으로 처리
        console.warn(`지역 ${area.name}(${area.code}) 통계 수집 실패:`, error);
        return {
          areaCode: area.code,
          name: area.name,
          count: 0,
        };
      }
    });

    const results = await Promise.allSettled(regionPromises);
    const regionStats: RegionStats[] = results
      .map((result) => {
        if (result.status === 'fulfilled') {
          return result.value;
        }
        return null;
      })
      .filter((stat): stat is RegionStats => stat !== null);

    // 3. 전체 개수 계산 및 비율 계산
    const totalCount = regionStats.reduce((sum, stat) => sum + stat.count, 0);

    return regionStats.map((stat) => ({
      ...stat,
      percentage: totalCount > 0 ? (stat.count / totalCount) * 100 : 0,
    }));
  } catch (error) {
    throw new TourApiError(
      `지역별 통계 수집 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      undefined,
      undefined,
      error as Error
    );
  }
}

// =====================================================
// 타입별 통계 수집
// =====================================================

/**
 * 타입별 관광지 개수 집계 (내부 함수)
 *
 * 모든 관광 타입의 관광지 개수를 수집하여 반환합니다.
 * 각 타입별로 areaBasedList2 API를 호출하여 totalCount를 가져옵니다.
 *
 * @returns 타입별 통계 배열 (타입명, 타입 ID, 개수, 비율 포함)
 */
async function getTypeStatsInternal(): Promise<TypeStats[]> {
  try {
    // 1. 모든 타입 ID 목록
    const contentTypeIds = Object.keys(CONTENT_TYPE_NAMES);

    // 2. 각 타입별로 병렬 호출 (전체 지역 대상)
    // API 제약상 areaCode는 필수이므로, 모든 지역을 합산하는 방식으로 구현
    const areas = await getAreaCode();

    const typePromises = contentTypeIds.map(async (contentTypeId) => {
      try {
        const areaPromises = areas.map(async (area) => {
          try {
            const areaResult = await getAreaBasedList({
              areaCode: area.code,
              contentTypeId,
              numOfRows: 1,
              pageNo: 1,
            });
            return areaResult.pagination.totalCount;
          } catch (error) {
            console.warn(
              `타입 ${contentTypeId} 지역 ${area.name}(${area.code}) 통계 수집 실패:`,
              error
            );
            return 0;
          }
        });

        const areaCounts = await Promise.allSettled(areaPromises);
        const totalCount = areaCounts.reduce((sum, result) => {
          if (result.status === 'fulfilled') {
            return sum + result.value;
          }
          return sum;
        }, 0);

        return {
          contentTypeId,
          typeName: CONTENT_TYPE_NAMES[contentTypeId],
          count: totalCount,
          percentage: 0, // 나중에 계산
        };
      } catch (error) {
        // 타입별 통계 수집 실패 시 0으로 처리
        console.warn(`타입 ${contentTypeId} 통계 수집 실패:`, error);
        return {
          contentTypeId,
          typeName: CONTENT_TYPE_NAMES[contentTypeId],
          count: 0,
          percentage: 0,
        };
      }
    });

    const results = await Promise.allSettled(typePromises);
    const typeStats: TypeStats[] = results
      .map((result) => {
        if (result.status === 'fulfilled') {
          return result.value;
        }
        return null;
      })
      .filter((stat): stat is TypeStats => stat !== null);

    // 3. 전체 개수 계산 및 비율 계산
    const totalCount = typeStats.reduce((sum, stat) => sum + stat.count, 0);

    return typeStats.map((stat) => ({
      ...stat,
      percentage: totalCount > 0 ? (stat.count / totalCount) * 100 : 0,
    }));
  } catch (error) {
    throw new TourApiError(
      `타입별 통계 수집 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      undefined,
      undefined,
      error as Error
    );
  }
}

// =====================================================
// 통계 요약
// =====================================================

/**
 * 전체 통계 요약 정보 생성 (내부 함수)
 *
 * 지역별 및 타입별 통계를 수집하여 요약 정보를 생성합니다.
 * Top 3 지역 및 Top 3 타입을 추출하고, 전체 관광지 수를 계산합니다.
 *
 * @returns 통계 요약 정보 (전체 개수, Top 3 지역, Top 3 타입, 마지막 업데이트 시간)
 */
async function getStatsSummaryInternal(): Promise<StatsSummary> {
  try {
    // 1. 병렬로 지역별 및 타입별 통계 수집
    const [regionResult, typeResult] = await Promise.allSettled([
      getRegionStatsInternal(),
      getTypeStatsInternal(),
    ]);

    // 2. 결과 처리 (일부 실패 시에도 가능한 데이터 반환)
    const regionStats: RegionStats[] =
      regionResult.status === 'fulfilled' ? regionResult.value : [];
    const typeStats: TypeStats[] =
      typeResult.status === 'fulfilled' ? typeResult.value : [];

    // 3. 전체 개수 계산 (타입별 통계의 합계 사용)
    const totalCount = typeStats.reduce((sum, stat) => sum + stat.count, 0);

    // 4. Top 3 지역 추출 (개수 기준 내림차순)
    const topRegions: TopRegion[] = regionStats
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map((region, index) => ({
        areaCode: region.areaCode,
        name: region.name,
        count: region.count,
        rank: index + 1,
      }));

    // 5. Top 3 타입 추출 (개수 기준 내림차순)
    const topTypes: TopType[] = typeStats
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map((type, index) => ({
        contentTypeId: type.contentTypeId,
        typeName: type.typeName,
        count: type.count,
        rank: index + 1,
      }));

    // 6. 마지막 업데이트 시간 생성 (현재 시간 ISO 8601 형식)
    const lastUpdated = new Date().toISOString();

    return {
      totalCount,
      topRegions,
      topTypes,
      lastUpdated,
    };
  } catch (error) {
    throw new TourApiError(
      `통계 요약 생성 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      undefined,
      undefined,
      error as Error
    );
  }
}

// =====================================================
// 캐싱된 공개 함수
// =====================================================

/**
 * 지역별 관광지 개수 집계 (캐싱 적용)
 *
 * 모든 지역의 관광지 개수를 수집하여 반환합니다.
 * 각 지역별로 areaBasedList2 API를 호출하여 totalCount를 가져옵니다.
 * 결과는 1시간 동안 캐싱됩니다.
 *
 * @returns 지역별 통계 배열 (지역명, 지역 코드, 개수, 비율 포함)
 *
 * @example
 * ```typescript
 * const stats = await getRegionStats();
 * // [
 * //   { areaCode: '1', name: '서울', count: 1234, percentage: 15.2 },
 * //   { areaCode: '2', name: '인천', count: 567, percentage: 7.0 },
 * //   ...
 * // ]
 * ```
 */
export const getRegionStats = unstable_cache(
  async () => getRegionStatsInternal(),
  ['region-stats'],
  {
    revalidate: 3600, // 1시간
    tags: ['stats', 'region-stats'],
  }
);

/**
 * 타입별 관광지 개수 집계 (캐싱 적용)
 *
 * 모든 관광 타입의 관광지 개수를 수집하여 반환합니다.
 * 각 타입별로 areaBasedList2 API를 호출하여 totalCount를 가져옵니다.
 * 결과는 1시간 동안 캐싱됩니다.
 *
 * @returns 타입별 통계 배열 (타입명, 타입 ID, 개수, 비율 포함)
 *
 * @example
 * ```typescript
 * const stats = await getTypeStats();
 * // [
 * //   { contentTypeId: '12', typeName: '관광지', count: 5000, percentage: 25.5 },
 * //   { contentTypeId: '14', typeName: '문화시설', count: 3000, percentage: 15.3 },
 * //   ...
 * // ]
 * ```
 */
export const getTypeStats = unstable_cache(
  async () => getTypeStatsInternal(),
  ['type-stats'],
  {
    revalidate: 3600, // 1시간
    tags: ['stats', 'type-stats'],
  }
);

/**
 * 전체 통계 요약 정보 생성 (캐싱 적용)
 *
 * 지역별 및 타입별 통계를 수집하여 요약 정보를 생성합니다.
 * Top 3 지역 및 Top 3 타입을 추출하고, 전체 관광지 수를 계산합니다.
 * 결과는 1시간 동안 캐싱됩니다.
 *
 * @returns 통계 요약 정보 (전체 개수, Top 3 지역, Top 3 타입, 마지막 업데이트 시간)
 *
 * @example
 * ```typescript
 * const summary = await getStatsSummary();
 * // {
 * //   totalCount: 50000,
 * //   topRegions: [
 * //     { areaCode: '1', name: '서울', count: 5000, rank: 1 },
 * //     ...
 * //   ],
 * //   topTypes: [
 * //     { contentTypeId: '12', typeName: '관광지', count: 10000, rank: 1 },
 * //     ...
 * //   ],
 * //   lastUpdated: '2025-01-15T10:30:00.000Z'
 * // }
 * ```
 */
export const getStatsSummary = unstable_cache(
  async () => getStatsSummaryInternal(),
  ['stats-summary'],
  {
    revalidate: 3600, // 1시간
    tags: ['stats', 'stats-summary'],
  }
);

