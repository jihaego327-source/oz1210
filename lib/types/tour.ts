/**
 * @file tour.ts
 * @description 한국관광공사 API 응답 타입 정의
 *
 * 한국관광공사 공공 API(KorService2)의 모든 응답 타입을 정의합니다.
 * PRD.md 섹션 5 (데이터 구조)를 기반으로 작성되었습니다.
 *
 * @see {@link https://www.data.go.kr/data/15101578/openapi.do | 한국관광공사 API 문서}
 */

/**
 * 관광지 목록 항목 (areaBasedList2, searchKeyword2 응답)
 */
export interface TourItem {
  /** 주소 */
  addr1: string;
  /** 상세주소 */
  addr2?: string;
  /** 지역코드 */
  areacode: string;
  /** 콘텐츠ID (관광지 고유 ID) */
  contentid: string;
  /** 콘텐츠타입ID (12: 관광지, 14: 문화시설, 15: 축제/행사, 25: 여행코스, 28: 레포츠, 32: 숙박, 38: 쇼핑, 39: 음식점) */
  contenttypeid: string;
  /** 관광지명 */
  title: string;
  /** 경도 (KATEC 좌표계, 정수형) */
  mapx: string;
  /** 위도 (KATEC 좌표계, 정수형) */
  mapy: string;
  /** 대표이미지1 (원본) */
  firstimage?: string;
  /** 대표이미지2 (썸네일) */
  firstimage2?: string;
  /** 전화번호 */
  tel?: string;
  /** 대분류 */
  cat1?: string;
  /** 중분류 */
  cat2?: string;
  /** 소분류 */
  cat3?: string;
  /** 수정일 (YYYYMMDD 형식) */
  modifiedtime: string;
  /** 간단한 개요 (1-2줄) */
  overview?: string;
  /** 시군구코드 */
  sigungucode?: string;
}

/**
 * 관광지 상세 정보 (detailCommon2 응답)
 */
export interface TourDetail {
  /** 콘텐츠ID */
  contentid: string;
  /** 콘텐츠타입ID */
  contenttypeid: string;
  /** 관광지명 */
  title: string;
  /** 주소 */
  addr1: string;
  /** 상세주소 */
  addr2?: string;
  /** 우편번호 */
  zipcode?: string;
  /** 전화번호 */
  tel?: string;
  /** 홈페이지 URL */
  homepage?: string;
  /** 개요 (긴 설명문) */
  overview?: string;
  /** 대표이미지1 (원본) */
  firstimage?: string;
  /** 대표이미지2 (썸네일) */
  firstimage2?: string;
  /** 경도 (KATEC 좌표계, 정수형) */
  mapx: string;
  /** 위도 (KATEC 좌표계, 정수형) */
  mapy: string;
  /** 지역코드 */
  areacode?: string;
  /** 시군구코드 */
  sigungucode?: string;
}

/**
 * 관광지 운영 정보 (detailIntro2 응답)
 * 타입별로 필드가 다르므로 모든 필드를 optional로 정의
 */
export interface TourIntro {
  /** 콘텐츠ID */
  contentid: string;
  /** 콘텐츠타입ID */
  contenttypeid: string;
  /** 이용시간 */
  usetime?: string;
  /** 휴무일 */
  restdate?: string;
  /** 문의처 */
  infocenter?: string;
  /** 주차 가능 여부 */
  parking?: string;
  /** 반려동물 동반 가능 여부 */
  chkpet?: string;
  /** 수용인원 */
  accomcount?: string;
  /** 체험 프로그램 */
  expguide?: string;
  /** 유모차 대여 여부 */
  chkbabycarriage?: string;
  /** 유모차 동반 가능 여부 */
  chkpetleash?: string;
  /** 애완동물 크기 제한 */
  chkpetsize?: string;
  /** 애완동물 입장 가능 장소 */
  chkpetplace?: string;
  /** 애완동물 추가 요금 */
  chkpetfee?: string;
  /** 기타 반려동물 정보 */
  petinfo?: string;
  /** 기타 정보 */
  [key: string]: string | undefined;
}

/**
 * 관광지 이미지 정보 (detailImage2 응답)
 */
export interface TourImage {
  /** 콘텐츠ID */
  contentid: string;
  /** 이미지 순번 */
  serialnum?: string;
  /** 원본 이미지 URL */
  originimgurl?: string;
  /** 썸네일 이미지 URL */
  smallimageurl?: string;
  /** 이미지 설명 */
  imgname?: string;
  /** 이미지 크기 */
  cpyrhtDivCd?: string;
}

/**
 * 반려동물 동반 여행 정보 (detailPetTour2 응답)
 */
export interface PetTourInfo {
  /** 콘텐츠ID */
  contentid: string;
  /** 콘텐츠타입ID */
  contenttypeid: string;
  /** 애완동물 동반 여부 */
  chkpetleash?: string;
  /** 애완동물 크기 제한 */
  chkpetsize?: string;
  /** 애완동물 입장 가능 장소 */
  chkpetplace?: string;
  /** 애완동물 추가 요금 */
  chkpetfee?: string;
  /** 기타 반려동물 정보 */
  petinfo?: string;
  /** 주차장 정보 */
  parking?: string;
}

/**
 * 지역 코드 정보 (areaCode2 응답)
 */
export interface AreaCode {
  /** 지역코드 */
  code: string;
  /** 지역명 */
  name: string;
  /** 하위 지역 목록 (시/군/구) */
  rnum?: string;
}

/**
 * API 응답 래퍼 타입 (공통 구조)
 * 한국관광공사 API는 response.body.items.item 구조를 사용
 */
export interface TourApiResponse<T> {
  response: {
    header: {
      resultCode: string;
      resultMsg: string;
    };
    body: {
      items?: {
        item: T | T[];
      };
      numOfRows?: number;
      pageNo?: number;
      totalCount?: number;
    };
  };
}

/**
 * 페이지네이션 정보
 */
export interface PaginationInfo {
  /** 현재 페이지 번호 */
  pageNo: number;
  /** 페이지당 항목 수 */
  numOfRows: number;
  /** 전체 항목 수 */
  totalCount: number;
  /** 전체 페이지 수 */
  totalPages: number;
}

/**
 * 관광지 목록 응답 (페이지네이션 포함)
 */
export interface TourListResponse {
  /** 관광지 목록 */
  items: TourItem[];
  /** 페이지네이션 정보 */
  pagination: PaginationInfo;
}

/**
 * 검색 결과 응답 (페이지네이션 포함)
 */
export interface SearchResponse {
  /** 검색 결과 목록 */
  items: TourItem[];
  /** 페이지네이션 정보 */
  pagination: PaginationInfo;
  /** 검색 키워드 */
  keyword: string;
}

