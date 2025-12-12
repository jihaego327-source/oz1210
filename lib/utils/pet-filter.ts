/**
 * @file pet-filter.ts
 * @description 반려동물 필터 유틸리티
 *
 * 목록 필터링 시 반려동물 동반 가능 여부와 크기 제한 정보를 해석/적용합니다.
 *
 * @dependencies
 * - lib/types/filter.ts (PetSize)
 * - lib/types/tour.ts (TourItem, PetTourInfo)
 */

import type { PetSize } from '@/lib/types/filter';
import type { PetTourInfo, TourItem } from '@/lib/types/tour';

/** 리스트 아이템에 반려동물 정보를 추가한 타입 */
export type TourWithPetInfo = TourItem & {
  petInfo?: PetTourInfo | null;
};

const PET_SIZE_KEYWORDS: Record<PetSize, string[]> = {
  small: ['소형', '소형견'],
  medium: ['중형', '중형견'],
  large: ['대형', '대형견'],
};

// 금지 키워드 - 더 포괄적으로 확장
const DISALLOW_KEYWORDS = [
  '불가',
  '금지',
  '입장불가',
  '입장 불가',
  '동반불가',
  '동반 불가',
  '출입불가',
  '출입 불가',
  '반입불가',
  '반입 불가',
  '불가능',
  '안됨',
  '안 됨',
  '안됩니다',
  '없습니다', // "반려동물 동반 장소 없습니다" 등
];

// 허용 키워드 - 반려동물과 직접 관련된 것만 포함
const ALLOW_KEYWORDS = [
  // 명확한 허용 표현
  '동반가능',
  '동반 가능',
  '입장가능',
  '입장 가능',
  '출입가능',
  '출입 가능',
  '반입가능',
  '반입 가능',
  // 반려동물 관련 구체적 키워드
  '전 견종',
  '소형견',
  '중형견',
  '대형견',
  '소형 견',
  '중형 견',
  '대형 견',
  '전견종',
  // 동반 조건 (이런 조건이 있다면 동반 가능한 것)
  '목줄',
  '리드줄',
  '입마개',
  '켄넬',
  '이동장',
  '배변봉투',
  // 기타 허용 표현
  '가능함',
  '허용됨',
  '일부구역',
  '일부 구역',
  '전 구역',
  '전구역',
];

/**
 * 텍스트에서 반려동물 동반 가능 여부 추정
 */
export function isPetAllowedFromText(text?: string | null): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  const hasDisallow = DISALLOW_KEYWORDS.some((keyword) => lower.includes(keyword.toLowerCase()));
  const hasAllow = ALLOW_KEYWORDS.some((keyword) => lower.includes(keyword.toLowerCase()));
  return hasAllow && !hasDisallow;
}

/**
 * 반려동물 크기 텍스트가 지정된 크기 목록과 매칭되는지 확인
 */
export function matchesPetSize(text: string | undefined, petSizes: PetSize[]): boolean {
  if (petSizes.length === 0) return true;
  if (!text) return false;

  const normalized = text.toLowerCase();
  return petSizes.some((size) =>
    PET_SIZE_KEYWORDS[size].some((keyword) => normalized.includes(keyword))
  );
}

/**
 * petInfo 객체를 사용해 필터링 조건을 평가
 * 
 * 판단 기준:
 * 1. petInfo가 없으면 false
 * 2. acmpyTypeCd 필드에서 우선 판단 (가장 명확한 기준)
 *    - '동반가능', '일부구역', '전구역' 등 허용 관련 키워드가 있으면 true
 *    - '불가', '금지' 등 금지 관련 키워드가 있으면 false
 * 3. API 필드에 데이터가 있으면 mergedText로 키워드 매칭
 * 4. 레거시 필드에 데이터가 있으면 mergedText로 키워드 매칭
 * 5. 어떤 데이터도 없으면 false
 */
export function isPetAllowed(petInfo?: PetTourInfo | null): boolean {
  if (!petInfo) {
    // petInfo가 null이면 동반 불가능으로 간주
    return false;
  }

  // API 필드에 데이터가 있는지 확인
  const hasApiData = !!(
    petInfo.acmpyTypeCd?.trim() ||
    petInfo.etcAcmpyInfo?.trim() ||
    petInfo.acmpyPsblCpam?.trim() ||
    petInfo.acmpyNeedMtr?.trim()
  );

  // 레거시 필드에 데이터가 있는지 확인
  const hasLegacyData = !!(
    petInfo.chkpetleash?.trim() ||
    petInfo.chkpetsize?.trim() ||
    petInfo.chkpetplace?.trim() ||
    petInfo.chkpetfee?.trim() ||
    petInfo.petinfo?.trim()
  );

  // 데이터가 전혀 없으면 false
  if (!hasApiData && !hasLegacyData) {
    return false;
  }

  // acmpyTypeCd 필드 우선 체크 (가장 명확한 동반 가능 여부 판단 기준)
  // 예: '일부구역 동반가능', '전 구역 동반가능', '동반불가'
  if (petInfo.acmpyTypeCd?.trim()) {
    const typeCd = petInfo.acmpyTypeCd.toLowerCase();

    // 금지 키워드가 있으면 즉시 false
    if (DISALLOW_KEYWORDS.some((keyword) => typeCd.includes(keyword.toLowerCase()))) {
      return false;
    }

    // acmpyTypeCd에 허용 관련 키워드가 있으면 true
    // 이 필드는 반려동물 전용 API에서 왔으므로 신뢰할 수 있음
    const hasAllowInTypeCd = ALLOW_KEYWORDS.some((keyword) =>
      typeCd.includes(keyword.toLowerCase())
    );

    if (hasAllowInTypeCd) {
      return true;
    }
  }

  // mergedText 생성
  const mergedText = [
    // 레거시 필드
    petInfo.chkpetleash,
    petInfo.chkpetsize,
    petInfo.chkpetplace,
    petInfo.chkpetfee,
    petInfo.petinfo,
    // 실제 API 필드 (detailPetTour2)
    petInfo.acmpyTypeCd,
    petInfo.etcAcmpyInfo,
    petInfo.acmpyPsblCpam,
    petInfo.acmpyNeedMtr,
  ]
    .filter(Boolean)
    .join(' ');

  // 빈 텍스트면 동반 불가능으로 간주
  if (!mergedText.trim()) {
    return false;
  }

  // 금지 키워드가 있으면 false
  const lowerText = mergedText.toLowerCase();
  const hasDisallowKeyword = DISALLOW_KEYWORDS.some((keyword) =>
    lowerText.includes(keyword.toLowerCase())
  );

  if (hasDisallowKeyword) {
    return false;
  }

  // 허용 키워드가 있으면 true
  const hasAllowKeyword = ALLOW_KEYWORDS.some((keyword) =>
    lowerText.includes(keyword.toLowerCase())
  );

  // 디버깅: 결과 로그 (개발 환경에서만)
  if (process.env.NODE_ENV === 'development') {
    console.log('[isPetAllowed]', {
      result: hasAllowKeyword,
      mergedText: mergedText.substring(0, 100) + (mergedText.length > 100 ? '...' : ''),
      hasApiData,
      hasLegacyData,
      hasAllowKeyword,
      hasDisallowKeyword,
      acmpyTypeCd: petInfo.acmpyTypeCd,
    });
  }

  return hasAllowKeyword;
}

/**
 * petInfo 기반 크기 필터 평가
 */
export function isPetSizeMatch(petInfo: PetTourInfo | null | undefined, petSizes: PetSize[]) {
  if (petSizes.length === 0) return true;
  return matchesPetSize(petInfo?.chkpetsize, petSizes);
}

/**
 * 반려동물 필터를 적용해 목록을 필터링
 */
export function filterToursByPet(
  items: TourWithPetInfo[],
  options: { petAllowed: boolean; petSizes: PetSize[] }
): TourWithPetInfo[] {
  const { petAllowed, petSizes } = options;

  // 필터가 비활성화된 경우 모든 아이템 반환
  if (!petAllowed && petSizes.length === 0) return items;

  const filtered = items.filter((item) => {
    // petAllowed가 true일 때만 동반 가능 여부 확인
    // petInfo가 null이면 동반 불가능으로 간주하여 필터링
    const allowed = petAllowed ? isPetAllowed(item.petInfo) : true;

    // 크기 필터 확인 (petSizes가 비어있으면 모든 크기 허용)
    const sizeOk = isPetSizeMatch(item.petInfo, petSizes);

    // 두 조건 모두 만족해야 통과
    return allowed && sizeOk;
  });

  // 디버깅: 필터링 결과 로그 (서버/클라이언트 모두)
  if (petAllowed) {
    const withPetInfo = items.filter((item) => item.petInfo !== null && item.petInfo !== undefined).length;
    const allowedCount = items.filter((item) => isPetAllowed(item.petInfo)).length;

    // 필터를 통과한 아이템의 상세 정보 로그
    console.log('[pet-filter] 필터 통과 아이템 상세:');
    filtered.forEach((item, index) => {
      const mergedText = [
        item.petInfo?.chkpetleash,
        item.petInfo?.chkpetsize,
        item.petInfo?.chkpetplace,
        item.petInfo?.chkpetfee,
        item.petInfo?.petinfo,
        item.petInfo?.acmpyTypeCd,
        item.petInfo?.etcAcmpyInfo,
        item.petInfo?.acmpyPsblCpam,
        item.petInfo?.acmpyNeedMtr,
      ]
        .filter(Boolean)
        .join(' | ');

      console.log(`  [${index + 1}] ${item.title}`, {
        contentid: item.contentid,
        acmpyTypeCd: item.petInfo?.acmpyTypeCd || '(없음)',
        acmpyPsblCpam: item.petInfo?.acmpyPsblCpam || '(없음)',
        acmpyNeedMtr: item.petInfo?.acmpyNeedMtr || '(없음)',
        etcAcmpyInfo: item.petInfo?.etcAcmpyInfo?.substring(0, 50) || '(없음)',
        mergedText: mergedText.substring(0, 100) + (mergedText.length > 100 ? '...' : ''),
      });
    });

    console.log('[pet-filter]', {
      total: items.length,
      withPetInfo,
      allowed: allowedCount,
      filtered: filtered.length,
      petAllowed,
      petSizes,
    });
  }

  return filtered;
}

