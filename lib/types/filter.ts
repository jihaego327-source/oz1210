/**
 * @file filter.ts
 * @description 필터 관련 타입 정의
 *
 * 관광지 목록 필터링에 사용되는 타입들을 정의합니다.
 * URL 쿼리 파라미터와 내부 상태 관리를 위한 타입입니다.
 */

/**
 * 필터 정렬 옵션
 */
export type SortBy = 'modifiedtime' | 'title';

/**
 * 반려동물 크기 타입
 */
export type PetSize = 'small' | 'medium' | 'large';

/**
 * 반려동물 크기 라벨 매핑
 */
export const PET_SIZE_LABELS: Record<PetSize, string> = {
  small: '소형',
  medium: '중형',
  large: '대형',
} as const;

/**
 * 관광지 필터 인터페이스
 */
export interface TourFilters {
  /** 지역 코드 (undefined는 "전체"를 의미) */
  areaCode?: string;
  /** 관광 타입 ID 배열 (빈 배열은 "전체"를 의미) */
  contentTypeIds: string[];
  /** 반려동물 동반 가능 여부 */
  petAllowed?: boolean;
  /** 반려동물 크기 필터 */
  petSizes?: PetSize[];
  /** 정렬 기준 */
  sortBy: SortBy;
  /** 페이지 번호 */
  pageNo: number;
  /** 검색 키워드 */
  keyword?: string;
}

/**
 * URL 쿼리 파라미터 타입
 */
export interface FilterQueryParams {
  /** 지역 코드 (string 또는 undefined) */
  areaCode?: string | string[];
  /** 콤마로 구분된 타입 ID 문자열 또는 배열 */
  contentTypeIds?: string | string[];
  /** 반려동물 동반 가능 여부 */
  petAllowed?: string | string[];
  /** 반려동물 크기 */
  petSizes?: string | string[];
  /** 정렬 기준 */
  sortBy?: string | string[];
  /** 페이지 번호 */
  pageNo?: string | string[];
  /** 검색 키워드 */
  keyword?: string | string[];
}

/**
 * 필터 기본값
 */
export const DEFAULT_FILTERS: TourFilters = {
  areaCode: '1', // 서울 (기본값)
  contentTypeIds: ['12'], // 관광지 (기본값)
  petAllowed: false,
  petSizes: [],
  sortBy: 'modifiedtime', // 최신순 (기본값)
  pageNo: 1,
  keyword: undefined,
} as const;

/**
 * 필터 기본값 (전체)
 */
export const DEFAULT_FILTERS_ALL: TourFilters = {
  areaCode: undefined, // 전체 지역
  contentTypeIds: [], // 전체 타입
  petAllowed: false,
  petSizes: [],
  sortBy: 'modifiedtime',
  pageNo: 1,
  keyword: undefined,
} as const;

/**
 * 정렬 옵션 매핑 (API arrange 파라미터)
 */
export const SORT_ARRANGE_MAP: Record<SortBy, 'A' | 'B' | 'C' | 'D'> = {
  modifiedtime: 'C', // 수정일순
  title: 'A', // 제목순
} as const;

