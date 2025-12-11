/**
 * @file detail-intro.tsx
 * @description 관광지 상세페이지 운영 정보 섹션 컴포넌트
 *
 * 관광지의 운영 정보를 표시하는 컴포넌트입니다.
 * PRD 2.4.2 운영 정보 섹션 요구사항을 구현합니다.
 *
 * 주요 기능:
 * 1. 운영시간/개장시간 표시
 * 2. 휴무일 표시
 * 3. 이용요금/문의처 표시 (전화번호 자동 링크 변환)
 * 4. 주차 가능 여부 표시
 * 5. 수용인원 표시
 * 6. 체험 프로그램 표시
 * 7. 유모차/반려동물 동반 가능 여부 표시
 * 8. 정보 없는 항목 숨김 처리
 *
 * @dependencies
 * - lib/types/tour.ts (TourIntro)
 * - components/ui/card.tsx
 * - lucide-react (아이콘)
 * - React (전화번호 링크 변환을 위해 Client Component)
 */

'use client';

import type React from 'react';
import {
  Clock,
  Calendar,
  Info,
  Car,
  Users,
  BookOpen,
  Baby,
  Dog,
} from 'lucide-react';
import type { TourIntro } from '@/lib/types/tour';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DetailIntroProps {
  /** 관광지 운영 정보 */
  intro: TourIntro;
}

/**
 * 한국 전화번호 패턴 정규식
 * 
 * 다양한 형식 지원:
 * - 지역번호: 02-1234-5678, 031-123-4567
 * - 휴대전화: 010-1234-5678, 011-1234-5678
 * - 특수번호: 1588-1234, 1544-1234, 1577-1234
 * - 괄호 형식: 02)1234-5678, (02)1234-5678
 * - 공백 형식: 02 1234 5678, 010 1234 5678
 * - 하이픈 없음: 0212345678, 01012345678
 * 
 * 패턴 설명:
 * - (?:0\d{1,2}[-\s)]?)? : 선택적 지역번호 (0으로 시작, 1-2자리 숫자, 하이픈/공백/괄호 선택)
 * - \d{3,4} : 중간 번호 (3-4자리)
 * - [-\s]? : 하이픈 또는 공백 선택
 * - \d{4} : 마지막 번호 (4자리)
 * 
 * @example
 * ```typescript
 * const text = "문의: 02-1234-5678, 팩스: 031-123-4567";
 * const matches = text.match(PHONE_PATTERN);
 * // matches: ["02-1234-5678", "031-123-4567"]
 * ```
 */
const PHONE_PATTERN = /(?:0\d{1,2}[-\s)]?)?\d{3,4}[-\s]?\d{4}/g;

/**
 * 텍스트에서 전화번호를 찾아 React 요소로 변환
 * 
 * 이 함수는 텍스트를 파싱하여 전화번호를 감지하고,
 * 전화번호는 `<a href="tel:...">` 링크로 변환합니다.
 * 전화번호가 아닌 일반 텍스트는 그대로 유지됩니다.
 * 
 * 여러 전화번호가 포함된 경우 모두 링크로 변환됩니다.
 * 전화번호가 없는 경우 원본 텍스트를 그대로 반환합니다.
 * 
 * @param text - 전화번호가 포함될 수 있는 텍스트
 * @returns React 요소 배열 (전화번호는 링크, 나머지는 텍스트)
 * 
 * @example
 * ```typescript
 * parseTextWithPhoneNumbers("문의: 02-1234-5678")
 * // [문의: , <a href="tel:0212345678">02-1234-5678</a>]
 * 
 * parseTextWithPhoneNumbers("전화: 010-1234-5678, 팩스: 02-1234-5678")
 * // [전화: , <a href="tel:01012345678">010-1234-5678</a>, , 팩스: , <a href="tel:0212345678">02-1234-5678</a>]
 * 
 * parseTextWithPhoneNumbers("이용요금: 성인 5,000원")
 * // ["이용요금: 성인 5,000원"] (전화번호 없음)
 * ```
 */
function parseTextWithPhoneNumbers(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  
  // 모든 전화번호 매칭
  const matches = Array.from(text.matchAll(PHONE_PATTERN));
  
  matches.forEach((match) => {
    // 전화번호 이전 텍스트 추가
    if (match.index !== undefined && match.index > lastIndex) {
      const beforeText = text.substring(lastIndex, match.index);
      if (beforeText) {
        parts.push(beforeText);
      }
    }
    
    // 전화번호 링크 생성
    if (match.index !== undefined) {
      const phoneNumber = match[0].replace(/[-\s)]/g, ''); // 하이픈, 공백, 괄호 제거
      parts.push(
        <a
          key={match.index}
          href={`tel:${phoneNumber}`}
          className="text-primary hover:underline"
          aria-label={`${match[0]}로 전화하기`}
        >
          {match[0]}
        </a>
      );
      
      lastIndex = match.index + match[0].length;
    }
  });
  
  // 마지막 텍스트 추가
  if (lastIndex < text.length) {
    const remainingText = text.substring(lastIndex);
    if (remainingText) {
      parts.push(remainingText);
    }
  }
  
  // 매칭된 전화번호가 없으면 원본 텍스트 반환
  return parts.length > 0 ? parts : [text];
}

/**
 * 관광지 운영 정보 섹션 컴포넌트
 */
export default function DetailIntro({ intro }: DetailIntroProps) {
  // 표시할 정보가 있는지 확인
  const hasInfo =
    intro.usetime ||
    intro.restdate ||
    intro.infocenter ||
    intro.parking ||
    intro.accomcount ||
    intro.expguide ||
    intro.chkbabycarriage ||
    intro.chkpet ||
    intro.chkpetleash;

  // 정보가 하나도 없으면 섹션을 표시하지 않음
  if (!hasInfo) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>운영 정보</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 운영시간/개장시간 */}
        {intro.usetime && (
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 mt-0.5 flex-shrink-0 text-muted-foreground" aria-hidden="true" />
            <div className="flex-1">
              <h2 className="text-lg font-semibold mb-1">운영시간</h2>
              <p className="text-muted-foreground whitespace-pre-line">
                {intro.usetime}
              </p>
            </div>
          </div>
        )}

        {/* 휴무일 */}
        {intro.restdate && (
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 mt-0.5 flex-shrink-0 text-muted-foreground" aria-hidden="true" />
            <div className="flex-1">
              <h2 className="text-lg font-semibold mb-1">휴무일</h2>
              <p className="text-muted-foreground whitespace-pre-line">
                {intro.restdate}
              </p>
            </div>
          </div>
        )}

        {/* 이용요금/문의처 */}
        {intro.infocenter && (
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 mt-0.5 flex-shrink-0 text-muted-foreground" aria-hidden="true" />
            <div className="flex-1">
              <h2 className="text-lg font-semibold mb-1">이용요금/문의처</h2>
              <div className="text-muted-foreground whitespace-pre-line">
                {intro.infocenter.split('\n').map((line, lineIndex) => (
                  <span key={lineIndex}>
                    {lineIndex > 0 && <br />}
                    {parseTextWithPhoneNumbers(line)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 주차 가능 여부 */}
        {intro.parking && (
          <div className="flex items-start gap-3">
            <Car className="h-5 w-5 mt-0.5 flex-shrink-0 text-muted-foreground" aria-hidden="true" />
            <div className="flex-1">
              <h2 className="text-lg font-semibold mb-1">주차</h2>
              <p className="text-muted-foreground whitespace-pre-line">
                {intro.parking}
              </p>
            </div>
          </div>
        )}

        {/* 수용인원 */}
        {intro.accomcount && (
          <div className="flex items-start gap-3">
            <Users className="h-5 w-5 mt-0.5 flex-shrink-0 text-muted-foreground" aria-hidden="true" />
            <div className="flex-1">
              <h2 className="text-lg font-semibold mb-1">수용인원</h2>
              <p className="text-muted-foreground">
                {intro.accomcount}
              </p>
            </div>
          </div>
        )}

        {/* 체험 프로그램 */}
        {intro.expguide && (
          <div className="flex items-start gap-3">
            <BookOpen className="h-5 w-5 mt-0.5 flex-shrink-0 text-muted-foreground" aria-hidden="true" />
            <div className="flex-1">
              <h2 className="text-lg font-semibold mb-1">체험 프로그램</h2>
              <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                {intro.expguide}
              </p>
            </div>
          </div>
        )}

        {/* 유모차 대여 여부 */}
        {intro.chkbabycarriage && (
          <div className="flex items-start gap-3">
            <Baby className="h-5 w-5 mt-0.5 flex-shrink-0 text-muted-foreground" aria-hidden="true" />
            <div className="flex-1">
              <h2 className="text-lg font-semibold mb-1">유모차</h2>
              <p className="text-muted-foreground">
                {intro.chkbabycarriage}
              </p>
            </div>
          </div>
        )}

        {/* 반려동물 동반 가능 여부 */}
        {(intro.chkpet || intro.chkpetleash) && (
          <div className="flex items-start gap-3">
            <Dog className="h-5 w-5 mt-0.5 flex-shrink-0 text-muted-foreground" aria-hidden="true" />
            <div className="flex-1">
              <h2 className="text-lg font-semibold mb-1">반려동물 동반</h2>
              <div className="space-y-1">
                {intro.chkpet && (
                  <p className="text-muted-foreground">
                    {intro.chkpet}
                  </p>
                )}
                {intro.chkpetleash && (
                  <p className="text-muted-foreground">
                    {intro.chkpetleash}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

