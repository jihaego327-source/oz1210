/**
 * @file detail-pet-tour.tsx
 * @description 관광지 상세페이지 반려동물 정보 섹션 컴포넌트
 *
 * 관광지의 반려동물 동반 정보를 표시하는 컴포넌트입니다.
 * PRD 2.5 반려동물 동반 여행 요구사항을 구현합니다.
 *
 * 주요 기능:
 * 1. 반려동물 동반 가능 여부 표시
 * 2. 반려동물 크기 제한 정보
 * 3. 반려동물 입장 가능 장소 (실내/실외)
 * 4. 반려동물 동반 추가 요금
 * 5. 반려동물 전용 시설 정보
 * 6. 필요한 조치 사항 (목줄, 입마개 등)
 * 7. 정보 없는 항목 숨김 처리
 *
 * @dependencies
 * - lib/types/tour.ts (PetTourInfo)
 * - components/ui/card.tsx
 * - lucide-react (아이콘)
 */

'use client';

import type React from 'react';
import { Dog, AlertCircle, Info, DollarSign, MapPin } from 'lucide-react';
import type { PetTourInfo } from '@/lib/types/tour';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DetailPetTourProps {
  /** 반려동물 동반 여행 정보 */
  petInfo: PetTourInfo;
}

/**
 * 반려동물 정보가 있는지 확인
 */
function hasPetData(petInfo: PetTourInfo): boolean {
  return !!(
    petInfo.acmpyTypeCd?.trim() ||
    petInfo.etcAcmpyInfo?.trim() ||
    petInfo.acmpyPsblCpam?.trim() ||
    petInfo.acmpyNeedMtr?.trim() ||
    petInfo.chkpetleash?.trim() ||
    petInfo.chkpetsize?.trim() ||
    petInfo.chkpetplace?.trim() ||
    petInfo.chkpetfee?.trim() ||
    petInfo.petinfo?.trim()
  );
}

/**
 * 반려동물 동반 가능 여부 요약 텍스트 생성
 */
function getPetAllowedSummary(petInfo: PetTourInfo): string | null {
  // 실제 API 필드 우선 확인
  if (petInfo.acmpyTypeCd) {
    return petInfo.acmpyTypeCd;
  }
  if (petInfo.acmpyPsblCpam) {
    return petInfo.acmpyPsblCpam;
  }
  // 레거시 필드 확인
  if (petInfo.chkpetleash) {
    return petInfo.chkpetleash;
  }
  if (petInfo.petinfo) {
    // petinfo에서 간단한 요약 추출 시도
    const lower = petInfo.petinfo.toLowerCase();
    if (lower.includes('가능') || lower.includes('허용')) {
      return '반려동물 동반 가능';
    }
    if (lower.includes('불가') || lower.includes('금지')) {
      return '반려동물 동반 불가';
    }
  }
  return null;
}

/**
 * 반려동물 정보 섹션 컴포넌트
 */
export default function DetailPetTour({ petInfo }: DetailPetTourProps) {
  // 데이터가 없으면 섹션 숨김
  if (!hasPetData(petInfo)) {
    return null;
  }

  const summary = getPetAllowedSummary(petInfo);

  return (
    <Card>
      <CardHeader>
        <CardTitle id="detail-pet-tour-title" className="flex items-center gap-2 text-xl sm:text-2xl">
          <Dog className="h-5 w-5 text-primary" aria-hidden="true" />
          반려동물 동반 정보
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        {/* 동반 가능 여부 요약 */}
        {summary && (
          <div className="flex items-start gap-2 sm:gap-3">
            <Info className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-muted-foreground mb-1">동반 가능 여부</p>
              <p className="text-sm sm:text-base break-words">{summary}</p>
            </div>
          </div>
        )}

        {/* 동반 가능 범위 (견종/크기) */}
        {petInfo.acmpyPsblCpam && (
          <div className="flex items-start gap-2 sm:gap-3">
            <Dog className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-muted-foreground mb-1">동반 가능 범위</p>
              <p className="text-sm sm:text-base break-words">{petInfo.acmpyPsblCpam}</p>
            </div>
          </div>
        )}

        {/* 레거시: 크기 제한 (acmpyPsblCpam이 없을 때만) */}
        {!petInfo.acmpyPsblCpam && petInfo.chkpetsize && (
          <div className="flex items-start gap-2 sm:gap-3">
            <Dog className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-muted-foreground mb-1">크기 제한</p>
              <p className="text-sm sm:text-base break-words">{petInfo.chkpetsize}</p>
            </div>
          </div>
        )}

        {/* 필요한 조치 */}
        {petInfo.acmpyNeedMtr && (
          <div className="flex items-start gap-2 sm:gap-3">
            <AlertCircle className="h-4 w-4 mt-0.5 text-amber-500 flex-shrink-0" aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-muted-foreground mb-1">필요한 조치</p>
              <p className="text-sm sm:text-base break-words">{petInfo.acmpyNeedMtr}</p>
            </div>
          </div>
        )}

        {/* 입장 가능 장소 */}
        {petInfo.chkpetplace && (
          <div className="flex items-start gap-2 sm:gap-3">
            <MapPin className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-muted-foreground mb-1">입장 가능 장소</p>
              <p className="text-sm sm:text-base break-words">{petInfo.chkpetplace}</p>
            </div>
          </div>
        )}

        {/* 추가 요금 */}
        {petInfo.chkpetfee && (
          <div className="flex items-start gap-2 sm:gap-3">
            <DollarSign className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-muted-foreground mb-1">추가 요금</p>
              <p className="text-sm sm:text-base break-words">{petInfo.chkpetfee}</p>
            </div>
          </div>
        )}

        {/* 기타 동반 정보 */}
        {petInfo.etcAcmpyInfo && (
          <div className="flex items-start gap-2 sm:gap-3">
            <Info className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-muted-foreground mb-1">기타 정보</p>
              <p className="text-sm sm:text-base whitespace-pre-line break-words">{petInfo.etcAcmpyInfo}</p>
            </div>
          </div>
        )}

        {/* 레거시: 기타 반려동물 정보 (etcAcmpyInfo가 없을 때만) */}
        {!petInfo.etcAcmpyInfo && petInfo.petinfo && (
          <div className="flex items-start gap-2 sm:gap-3">
            <Info className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-muted-foreground mb-1">기타 정보</p>
              <p className="text-sm sm:text-base whitespace-pre-line break-words">{petInfo.petinfo}</p>
            </div>
          </div>
        )}

        {/* 주의사항 강조 (금지 키워드가 포함된 경우) */}
        {(() => {
          const infoText = (petInfo.etcAcmpyInfo || petInfo.petinfo || '').toLowerCase();
          const hasWarning = infoText.includes('불가') || 
                            infoText.includes('금지') || 
                            infoText.includes('제한');
          
          if (hasWarning && (petInfo.etcAcmpyInfo || petInfo.petinfo)) {
            return (
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 text-amber-600 dark:text-amber-400 flex-shrink-0" aria-hidden="true" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                      주의사항
                    </p>
                    <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                      반려동물 동반 시 제한사항이 있을 수 있습니다. 방문 전 반드시 확인해주세요.
                    </p>
                  </div>
                </div>
              </div>
            );
          }
          return null;
        })()}
      </CardContent>
    </Card>
  );
}
