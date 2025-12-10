/**
 * @file stats.ts
 * @description 통계 대시보드 타입 정의
 *
 * 통계 대시보드 페이지에서 사용하는 타입들을 정의합니다.
 * PRD.md 섹션 2.6 (통계 대시보드)를 기반으로 작성되었습니다.
 *
 * @see {@link ../PRD.md | PRD 문서 - 섹션 2.6 (통계 대시보드)}
 */

/**
 * 콘텐츠 타입 ID와 이름 매핑
 */
export const CONTENT_TYPE_NAMES: Record<string, string> = {
  '12': '관광지',
  '14': '문화시설',
  '15': '축제/행사',
  '25': '여행코스',
  '28': '레포츠',
  '32': '숙박',
  '38': '쇼핑',
  '39': '음식점',
} as const;

/**
 * 지역별 관광지 통계
 */
export interface RegionStats {
  /** 지역 코드 */
  areaCode: string;
  /** 지역명 (예: 서울, 부산, 제주) */
  name: string;
  /** 관광지 개수 */
  count: number;
  /** 전체 대비 비율 (백분율, 0-100) */
  percentage?: number;
}

/**
 * 관광 타입별 통계
 */
export interface TypeStats {
  /** 콘텐츠 타입 ID (12: 관광지, 14: 문화시설, 15: 축제/행사, 25: 여행코스, 28: 레포츠, 32: 숙박, 38: 쇼핑, 39: 음식점) */
  contentTypeId: string;
  /** 타입명 (예: 관광지, 문화시설) */
  typeName: string;
  /** 관광지 개수 */
  count: number;
  /** 전체 대비 비율 (백분율, 0-100) */
  percentage: number;
}

/**
 * Top 3 지역 정보
 */
export interface TopRegion {
  /** 지역 코드 */
  areaCode: string;
  /** 지역명 */
  name: string;
  /** 관광지 개수 */
  count: number;
  /** 순위 (1, 2, 3) */
  rank: number;
}

/**
 * Top 3 타입 정보
 */
export interface TopType {
  /** 콘텐츠 타입 ID */
  contentTypeId: string;
  /** 타입명 */
  typeName: string;
  /** 관광지 개수 */
  count: number;
  /** 순위 (1, 2, 3) */
  rank: number;
}

/**
 * 통계 요약 정보
 */
export interface StatsSummary {
  /** 전체 관광지 수 */
  totalCount: number;
  /** 가장 많은 관광지가 있는 지역 Top 3 */
  topRegions: TopRegion[];
  /** 가장 많은 관광 타입 Top 3 */
  topTypes: TopType[];
  /** 마지막 업데이트 시간 (ISO 8601 형식) */
  lastUpdated: string;
}

/**
 * 차트 데이터 포인트 (Bar Chart용)
 */
export interface ChartDataPoint {
  /** 라벨 (지역명 또는 타입명) */
  label: string;
  /** 값 (관광지 개수) */
  value: number;
  /** 전체 대비 비율 (백분율) */
  percentage?: number;
  /** 추가 메타데이터 (지역 코드 또는 타입 ID) */
  metadata?: {
    areaCode?: string;
    contentTypeId?: string;
  };
}

/**
 * Donut Chart 데이터 포인트
 */
export interface DonutChartDataPoint {
  /** 라벨 (타입명) */
  name: string;
  /** 값 (관광지 개수) */
  value: number;
  /** 전체 대비 비율 (백분율) */
  percentage: number;
  /** 콘텐츠 타입 ID */
  contentTypeId: string;
  /** 차트 색상 (선택 사항) */
  color?: string;
}

