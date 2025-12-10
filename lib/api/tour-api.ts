/**
 * @file tour-api.ts
 * @description 한국관광공사 공공 API 클라이언트
 *
 * 한국관광공사 공공 API(KorService2)를 호출하는 타입 안전한 클라이언트 모듈입니다.
 * 모든 API 호출은 에러 처리 및 재시도 로직이 포함되어 있습니다.
 *
 * @see {@link https://www.data.go.kr/data/15101578/openapi.do | 한국관광공사 API 문서}
 * @see {@link ../PRD.md | PRD 문서 - 섹션 4 (API 명세)}
 */

import type {
  TourItem,
  TourDetail,
  TourIntro,
  TourImage,
  PetTourInfo,
  AreaCode,
  TourApiResponse,
  TourListResponse,
  SearchResponse,
  PaginationInfo,
} from '@/lib/types/tour';

// =====================================================
// 상수 정의
// =====================================================

/** API Base URL */
const BASE_URL = 'https://apis.data.go.kr/B551011/KorService2';

/** 공통 파라미터 */
const COMMON_PARAMS = {
  MobileOS: 'ETC',
  MobileApp: 'MyTrip',
  _type: 'json',
} as const;

/** 재시도 설정 */
const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000, // 1초
  maxDelay: 4000, // 4초
} as const;

// =====================================================
// 에러 처리
// =====================================================

/**
 * 한국관광공사 API 에러 클래스
 */
export class TourApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly response?: unknown,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'TourApiError';
    Object.setPrototypeOf(this, TourApiError.prototype);
  }
}

/**
 * 에러 타입 구분
 */
type ErrorType = 'network' | 'api' | 'parse' | 'unknown';

/**
 * 에러 타입 판별
 */
function getErrorType(error: unknown): ErrorType {
  if (error instanceof TourApiError) {
    return 'api';
  }
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return 'network';
  }
  if (error instanceof SyntaxError) {
    return 'parse';
  }
  return 'unknown';
}

/**
 * 에러 메시지 한글화
 */
function getErrorMessage(error: unknown, type: ErrorType): string {
  switch (type) {
    case 'network':
      return '네트워크 연결에 실패했습니다. 인터넷 연결을 확인해주세요.';
    case 'parse':
      return '응답 데이터를 파싱하는 중 오류가 발생했습니다.';
    case 'api':
      if (error instanceof TourApiError) {
        return error.message;
      }
      return 'API 호출 중 오류가 발생했습니다.';
    default:
      return '알 수 없는 오류가 발생했습니다.';
  }
}

// =====================================================
// 재시도 로직
// =====================================================

/**
 * 지수 백오프로 대기 시간 계산
 */
function calculateBackoffDelay(attempt: number): number {
  const delay = RETRY_CONFIG.initialDelay * Math.pow(2, attempt);
  return Math.min(delay, RETRY_CONFIG.maxDelay);
}

/**
 * 재시도 가능한 에러인지 확인
 */
function isRetryableError(error: unknown): boolean {
  const type = getErrorType(error);
  // 네트워크 에러와 일부 API 에러는 재시도 가능
  return type === 'network' || (type === 'api' && error instanceof TourApiError && (!error.statusCode || error.statusCode >= 500));
}

/**
 * 재시도 로직이 포함된 API 호출 래퍼
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  retries = RETRY_CONFIG.maxRetries
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // 재시도 불가능한 에러이거나 마지막 시도인 경우
      if (!isRetryableError(error) || attempt === retries) {
        throw error;
      }

      // 지수 백오프로 대기
      const delay = calculateBackoffDelay(attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// =====================================================
// 유틸리티 함수
// =====================================================

/**
 * 환경변수에서 API 키 가져오기
 * 서버 사이드 우선: TOUR_API_KEY > NEXT_PUBLIC_TOUR_API_KEY
 */
function getApiKey(): string {
  const serverKey = process.env.TOUR_API_KEY;
  const publicKey = process.env.NEXT_PUBLIC_TOUR_API_KEY;

  const apiKey = serverKey || publicKey;

  if (!apiKey) {
    throw new TourApiError(
      'API 키가 설정되지 않았습니다. TOUR_API_KEY 또는 NEXT_PUBLIC_TOUR_API_KEY 환경변수를 설정해주세요.'
    );
  }

  return apiKey;
}

/**
 * URL 파라미터 빌더
 */
function buildQueryParams(params: Record<string, string | number | undefined>): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });

  return searchParams.toString();
}

/**
 * API 응답 파싱 및 검증
 */
function parseApiResponse<T>(data: unknown): T {
  if (!data || typeof data !== 'object') {
    throw new TourApiError('응답 데이터가 올바르지 않습니다.', undefined, data);
  }

  const response = data as TourApiResponse<T>;

  // 응답 헤더 확인
  if (!response.response || !response.response.header) {
    throw new TourApiError('응답 형식이 올바르지 않습니다.', undefined, data);
  }

  const { resultCode, resultMsg } = response.response.header;

  // API 에러 확인
  if (resultCode !== '0000') {
    throw new TourApiError(
      `API 오류: ${resultMsg} (코드: ${resultCode})`,
      parseInt(resultCode, 10),
      response
    );
  }

  // body 확인
  if (!response.response.body) {
    throw new TourApiError('응답 body가 없습니다.', undefined, response);
  }

  return response as unknown as T;
}

/**
 * 배열 응답 추출 (item이 배열 또는 단일 객체일 수 있음)
 */
function extractItems<T>(response: TourApiResponse<T>): T[] {
  const items = response.response.body.items?.item;
  if (!items) {
    return [];
  }
  return Array.isArray(items) ? items : [items];
}

/**
 * 페이지네이션 정보 계산
 */
function calculatePagination(
  numOfRows: number,
  pageNo: number,
  totalCount: number
): PaginationInfo {
  return {
    pageNo,
    numOfRows,
    totalCount,
    totalPages: Math.ceil(totalCount / numOfRows),
  };
}

/**
 * KATEC 좌표를 WGS84로 변환
 * KATEC 좌표는 정수형으로 저장되어 있으므로 10000000으로 나눔
 */
export function convertKATECToWGS84(mapx: string, mapy: string): { lng: number; lat: number } {
  return {
    lng: parseFloat(mapx) / 10000000,
    lat: parseFloat(mapy) / 10000000,
  };
}

// =====================================================
// API 호출 함수
// =====================================================

/**
 * 지역 코드 조회
 *
 * @param areaCode - 상위 지역 코드 (선택, 없으면 시/도 목록 조회)
 * @returns 지역 코드 목록
 *
 * @example
 * ```ts
 * // 시/도 목록 조회
 * const areas = await getAreaCode();
 *
 * // 시/군/구 목록 조회
 * const sigungu = await getAreaCode('1'); // 서울
 * ```
 */
export async function getAreaCode(areaCode?: string): Promise<AreaCode[]> {
  return withRetry(async () => {
    const apiKey = getApiKey();
    const params = {
      ...COMMON_PARAMS,
      serviceKey: apiKey,
      ...(areaCode && { areaCode }),
    };

    const queryString = buildQueryParams(params);
    const url = `${BASE_URL}/areaCode2?${queryString}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new TourApiError(
          `HTTP 오류: ${response.status} ${response.statusText}`,
          response.status
        );
      }

      const data = await response.json();
      const parsed = parseApiResponse<TourApiResponse<AreaCode>>(data);
      const items = extractItems(parsed);

      // AreaCode 형식으로 변환 (API 응답 형식에 맞게 조정 필요)
      return items.map((item: any) => ({
        code: item.code || item.areacode || '',
        name: item.name || item.areaname || '',
        rnum: item.rnum,
      }));
    } catch (error) {
      const type = getErrorType(error);
      const message = getErrorMessage(error, type);
      throw new TourApiError(message, undefined, undefined, error as Error);
    }
  });
}

/**
 * 지역 기반 관광지 목록 조회
 *
 * @param params - 조회 파라미터
 * @param params.areaCode - 지역 코드 (필수)
 * @param params.contentTypeId - 콘텐츠 타입 ID (필수)
 * @param params.sigunguCode - 시군구 코드 (선택)
 * @param params.numOfRows - 페이지당 항목 수 (기본: 10)
 * @param params.pageNo - 페이지 번호 (기본: 1)
 * @param params.arrange - 정렬 방식 (A: 제목순, B: 조회순, C: 수정일순, D: 생성일순)
 * @returns 관광지 목록 및 페이지네이션 정보
 *
 * @example
 * ```ts
 * const result = await getAreaBasedList({
 *   areaCode: '1', // 서울
 *   contentTypeId: '12', // 관광지
 *   numOfRows: 20,
 *   pageNo: 1,
 * });
 * ```
 */
export async function getAreaBasedList(params: {
  areaCode: string;
  contentTypeId: string;
  sigunguCode?: string;
  numOfRows?: number;
  pageNo?: number;
  arrange?: 'A' | 'B' | 'C' | 'D';
}): Promise<TourListResponse> {
  return withRetry(async () => {
    const apiKey = getApiKey();
    const requestParams = {
      ...COMMON_PARAMS,
      serviceKey: apiKey,
      areaCode: params.areaCode,
      contentTypeId: params.contentTypeId,
      sigunguCode: params.sigunguCode,
      numOfRows: params.numOfRows || 10,
      pageNo: params.pageNo || 1,
      arrange: params.arrange || 'A',
    };

    const queryString = buildQueryParams(requestParams);
    const url = `${BASE_URL}/areaBasedList2?${queryString}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new TourApiError(
          `HTTP 오류: ${response.status} ${response.statusText}`,
          response.status
        );
      }

      const data = await response.json();
      const parsed = parseApiResponse<TourApiResponse<TourItem>>(data);
      const items = extractItems<TourItem>(parsed);

      const body = parsed.response.body;
      const pagination = calculatePagination(
        body.numOfRows || requestParams.numOfRows || 10,
        body.pageNo || requestParams.pageNo || 1,
        body.totalCount || items.length
      );

      return {
        items,
        pagination,
      };
    } catch (error) {
      const type = getErrorType(error);
      const message = getErrorMessage(error, type);
      throw new TourApiError(message, undefined, undefined, error as Error);
    }
  });
}

/**
 * 키워드 검색
 *
 * @param params - 검색 파라미터
 * @param params.keyword - 검색 키워드 (필수)
 * @param params.areaCode - 지역 코드 (선택)
 * @param params.contentTypeId - 콘텐츠 타입 ID (선택)
 * @param params.numOfRows - 페이지당 항목 수 (기본: 10)
 * @param params.pageNo - 페이지 번호 (기본: 1)
 * @param params.arrange - 정렬 방식 (A: 제목순, B: 조회순, C: 수정일순, D: 생성일순)
 * @returns 검색 결과 및 페이지네이션 정보
 *
 * @example
 * ```ts
 * const result = await searchKeyword({
 *   keyword: '해운대',
 *   areaCode: '6', // 부산
 *   contentTypeId: '12', // 관광지
 * });
 * ```
 */
export async function searchKeyword(params: {
  keyword: string;
  areaCode?: string;
  contentTypeId?: string;
  numOfRows?: number;
  pageNo?: number;
  arrange?: 'A' | 'B' | 'C' | 'D';
}): Promise<SearchResponse> {
  return withRetry(async () => {
    const apiKey = getApiKey();
    const requestParams = {
      ...COMMON_PARAMS,
      serviceKey: apiKey,
      keyword: params.keyword,
      areaCode: params.areaCode,
      contentTypeId: params.contentTypeId,
      numOfRows: params.numOfRows || 10,
      pageNo: params.pageNo || 1,
      arrange: params.arrange || 'A',
    };

    const queryString = buildQueryParams(requestParams);
    const url = `${BASE_URL}/searchKeyword2?${queryString}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new TourApiError(
          `HTTP 오류: ${response.status} ${response.statusText}`,
          response.status
        );
      }

      const data = await response.json();
      const parsed = parseApiResponse<TourApiResponse<TourItem>>(data);
      const items = extractItems<TourItem>(parsed);

      const body = parsed.response.body;
      const pagination = calculatePagination(
        body.numOfRows || requestParams.numOfRows || 10,
        body.pageNo || requestParams.pageNo || 1,
        body.totalCount || items.length
      );

      return {
        items,
        pagination,
        keyword: params.keyword,
      };
    } catch (error) {
      const type = getErrorType(error);
      const message = getErrorMessage(error, type);
      throw new TourApiError(message, undefined, undefined, error as Error);
    }
  });
}

/**
 * 관광지 공통 정보 조회
 *
 * @param params - 조회 파라미터
 * @param params.contentId - 콘텐츠 ID (필수)
 * @returns 관광지 상세 정보
 *
 * @example
 * ```ts
 * const detail = await getDetailCommon({ contentId: '125266' });
 * ```
 */
export async function getDetailCommon(params: {
  contentId: string;
}): Promise<TourDetail> {
  return withRetry(async () => {
    const apiKey = getApiKey();
    const requestParams = {
      ...COMMON_PARAMS,
      serviceKey: apiKey,
      contentId: params.contentId,
    };

    const queryString = buildQueryParams(requestParams);
    const url = `${BASE_URL}/detailCommon2?${queryString}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new TourApiError(
          `HTTP 오류: ${response.status} ${response.statusText}`,
          response.status
        );
      }

      const data = await response.json();
      const parsed = parseApiResponse<TourApiResponse<TourDetail>>(data);
      const items = extractItems<TourDetail>(parsed);

      if (items.length === 0) {
        throw new TourApiError(`관광지 정보를 찾을 수 없습니다. (contentId: ${params.contentId})`);
      }

      return items[0];
    } catch (error) {
      const type = getErrorType(error);
      const message = getErrorMessage(error, type);
      throw new TourApiError(message, undefined, undefined, error as Error);
    }
  });
}

/**
 * 관광지 소개 정보 조회 (운영 정보)
 *
 * @param params - 조회 파라미터
 * @param params.contentId - 콘텐츠 ID (필수)
 * @param params.contentTypeId - 콘텐츠 타입 ID (필수)
 * @returns 관광지 운영 정보
 *
 * @example
 * ```ts
 * const intro = await getDetailIntro({
 *   contentId: '125266',
 *   contentTypeId: '12',
 * });
 * ```
 */
export async function getDetailIntro(params: {
  contentId: string;
  contentTypeId: string;
}): Promise<TourIntro> {
  return withRetry(async () => {
    const apiKey = getApiKey();
    const requestParams = {
      ...COMMON_PARAMS,
      serviceKey: apiKey,
      contentId: params.contentId,
      contentTypeId: params.contentTypeId,
    };

    const queryString = buildQueryParams(requestParams);
    const url = `${BASE_URL}/detailIntro2?${queryString}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new TourApiError(
          `HTTP 오류: ${response.status} ${response.statusText}`,
          response.status
        );
      }

      const data = await response.json();
      const parsed = parseApiResponse<TourApiResponse<TourIntro>>(data);
      const items = extractItems<TourIntro>(parsed);

      if (items.length === 0) {
        throw new TourApiError(
          `관광지 소개 정보를 찾을 수 없습니다. (contentId: ${params.contentId})`
        );
      }

      return items[0];
    } catch (error) {
      const type = getErrorType(error);
      const message = getErrorMessage(error, type);
      throw new TourApiError(message, undefined, undefined, error as Error);
    }
  });
}

/**
 * 관광지 이미지 목록 조회
 *
 * @param params - 조회 파라미터
 * @param params.contentId - 콘텐츠 ID (필수)
 * @param params.numOfRows - 페이지당 항목 수 (기본: 10)
 * @param params.pageNo - 페이지 번호 (기본: 1)
 * @returns 이미지 목록
 *
 * @example
 * ```ts
 * const images = await getDetailImage({
 *   contentId: '125266',
 *   numOfRows: 20,
 * });
 * ```
 */
export async function getDetailImage(params: {
  contentId: string;
  numOfRows?: number;
  pageNo?: number;
}): Promise<TourImage[]> {
  return withRetry(async () => {
    const apiKey = getApiKey();
    const requestParams = {
      ...COMMON_PARAMS,
      serviceKey: apiKey,
      contentId: params.contentId,
      numOfRows: params.numOfRows || 10,
      pageNo: params.pageNo || 1,
    };

    const queryString = buildQueryParams(requestParams);
    const url = `${BASE_URL}/detailImage2?${queryString}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new TourApiError(
          `HTTP 오류: ${response.status} ${response.statusText}`,
          response.status
        );
      }

      const data = await response.json();
      const parsed = parseApiResponse<TourApiResponse<TourImage>>(data);
      const items = extractItems<TourImage>(parsed);

      return items;
    } catch (error) {
      const type = getErrorType(error);
      const message = getErrorMessage(error, type);
      throw new TourApiError(message, undefined, undefined, error as Error);
    }
  });
}

/**
 * 반려동물 동반 여행 정보 조회
 *
 * @param params - 조회 파라미터
 * @param params.contentId - 콘텐츠 ID (필수)
 * @returns 반려동물 동반 여행 정보
 *
 * @example
 * ```ts
 * const petInfo = await getDetailPetTour({ contentId: '125266' });
 * ```
 */
export async function getDetailPetTour(params: {
  contentId: string;
}): Promise<PetTourInfo | null> {
  return withRetry(async () => {
    const apiKey = getApiKey();
    const requestParams = {
      ...COMMON_PARAMS,
      serviceKey: apiKey,
      contentId: params.contentId,
    };

    const queryString = buildQueryParams(requestParams);
    const url = `${BASE_URL}/detailPetTour2?${queryString}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new TourApiError(
          `HTTP 오류: ${response.status} ${response.statusText}`,
          response.status
        );
      }

      const data = await response.json();
      const parsed = parseApiResponse<TourApiResponse<PetTourInfo>>(data);
      const items = extractItems<PetTourInfo>(parsed);

      // 반려동물 정보가 없을 수 있음
      if (items.length === 0) {
        return null;
      }

      return items[0];
    } catch (error) {
      const type = getErrorType(error);
      const message = getErrorMessage(error, type);
      throw new TourApiError(message, undefined, undefined, error as Error);
    }
  });
}

