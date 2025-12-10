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

const DISALLOW_KEYWORDS = ['불가', '금지', '입장불가', '동반불가'];
const ALLOW_KEYWORDS = ['가능', '허용', '동반', 'ok', 'o.k', 'ok!', 'ok.', 'o k'];

/**
 * 텍스트에서 반려동물 동반 가능 여부 추정
 */
export function isPetAllowedFromText(text?: string | null): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  const hasDisallow = DISALLOW_KEYWORDS.some((keyword) => lower.includes(keyword));
  const hasAllow = ALLOW_KEYWORDS.some((keyword) => lower.includes(keyword));
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
 */
export function isPetAllowed(petInfo?: PetTourInfo | null): boolean {
  if (!petInfo) return false;
  const mergedText = [
    petInfo.chkpetleash,
    petInfo.chkpetplace,
    petInfo.chkpetfee,
    petInfo.petinfo,
  ]
    .filter(Boolean)
    .join(' ');

  return isPetAllowedFromText(mergedText);
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
  if (!petAllowed && petSizes.length === 0) return items;

  return items.filter((item) => {
    const allowed = !petAllowed || isPetAllowed(item.petInfo);
    const sizeOk = isPetSizeMatch(item.petInfo, petSizes);
    return allowed && sizeOk;
  });
}

