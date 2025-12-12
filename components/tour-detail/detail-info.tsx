/**
 * @file detail-info.tsx
 * @description 관광지 상세페이지 기본 정보 섹션 컴포넌트
 *
 * 관광지의 기본 정보를 표시하는 컴포넌트입니다.
 * PRD 2.4.1 기본 정보 섹션 요구사항을 구현합니다.
 *
 * 주요 기능:
 * 1. 관광지명 및 타입 뱃지 표시
 * 2. 대표 이미지 표시
 * 3. 주소 표시 및 복사 기능
 * 4. 전화번호 (클릭 시 전화 연결)
 * 5. 홈페이지 링크
 * 6. 개요 (긴 설명문)
 * 7. 카테고리 뱃지 (cat1, cat2, cat3)
 *
 * @dependencies
 * - lib/types/tour.ts (TourDetail, CONTENT_TYPE_NAMES)
 * - components/ui/card.tsx
 * - components/ui/button.tsx
 * - lucide-react (아이콘)
 * - sonner (toast 메시지)
 * - Next.js Image 컴포넌트
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import { MapPin, Phone, Globe, ExternalLink, Copy, Check } from 'lucide-react';
import type { TourDetail } from '@/lib/types/tour';
import { CONTENT_TYPE_NAMES } from '@/lib/types/tour';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ShareButton from '@/components/tour-detail/share-button';
import BookmarkButton from '@/components/bookmarks/bookmark-button';

interface DetailInfoProps {
  /** 관광지 상세 정보 */
  detail: TourDetail;
}

/**
 * 관광지 기본 정보 섹션 컴포넌트
 */
export default function DetailInfo({ detail }: DetailInfoProps) {
  const [copied, setCopied] = useState(false);

  // 이미지 URL 결정 (firstimage 우선, 없으면 firstimage2)
  const imageUrl = detail.firstimage || detail.firstimage2;

  // 주소 조합
  const address = [detail.addr1, detail.addr2].filter(Boolean).join(' ');

  // 관광 타입 이름 가져오기
  const typeName = CONTENT_TYPE_NAMES[detail.contenttypeid] || '관광지';

  /**
   * 홈페이지 URL 정규화 및 유효성 검증
   * 
   * 한국관광공사 API의 homepage 필드는 다양한 형식으로 제공될 수 있습니다:
   * - 프로토콜이 없는 URL: "www.example.com" → "https://www.example.com" (유효성 검증 후)
   * - 이미 올바른 형식: "http://example.com" → "http://example.com" (유효성 검증 후)
   * - 상대 경로: "/path/to/page" → null (표시하지 않음)
   * - 빈 문자열 또는 공백: "" 또는 " " → null (표시하지 않음)
   * - 유효하지 않은 URL: "invalid url!!!" → null (표시하지 않음)
   * 
   * 이 함수는 `new URL()` 생성자를 사용하여 URL 유효성을 검증합니다.
   * 유효하지 않은 URL은 null을 반환하여 표시하지 않습니다.
   * 
   * @param url - 홈페이지 URL (string | undefined)
   * @returns 정규화된 유효한 URL 또는 null (표시하지 않음)
   * 
   * @example
   * ```typescript
   * normalizeHomepageUrl("www.example.com") // "https://www.example.com"
   * normalizeHomepageUrl("http://example.com") // "http://example.com"
   * normalizeHomepageUrl("https://example.com") // "https://example.com"
   * normalizeHomepageUrl("/path/to/page") // null
   * normalizeHomepageUrl("invalid url!!!") // null (유효하지 않음)
   * normalizeHomepageUrl("http://invalid url") // null (유효하지 않음)
   * normalizeHomepageUrl("") // null
   * ```
   */
  const normalizeHomepageUrl = (url: string | undefined): string | null => {
    if (!url || url.trim() === '') return null;
    
    const trimmedUrl = url.trim();
    
    // 이미 http:// 또는 https://로 시작하는 경우
    if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
      try {
        // URL 유효성 검증
        new URL(trimmedUrl);
        return trimmedUrl;
      } catch {
        // 유효하지 않은 URL이면 null 반환
        return null;
      }
    }
    
    // 상대 경로인 경우 (예: /path/to/page) null 반환 (표시하지 않음)
    if (trimmedUrl.startsWith('/')) {
      return null;
    }
    
    // 프로토콜이 없는 경우 https:// 추가
    const normalizedUrl = `https://${trimmedUrl}`;
    
    try {
      // URL 유효성 검증
      new URL(normalizedUrl);
      return normalizedUrl;
    } catch {
      // 유효하지 않은 URL이면 null 반환
      return null;
    }
  };

  /**
   * 전화번호 검증 및 정규화
   * 
   * API 응답의 tel 필드는 빈 문자열("")이거나 공백(" ")일 수 있습니다.
   * 이 함수는 유효한 전화번호만 반환하고, 빈 값이나 공백만 있는 경우 null을 반환합니다.
   * 
   * @param tel - 전화번호 (string | undefined)
   * @returns 정규화된 전화번호 또는 null (표시하지 않음)
   * 
   * @example
   * ```typescript
   * normalizeTel("02-1234-5678") // "02-1234-5678"
   * normalizeTel(" 02-1234-5678 ") // "02-1234-5678" (공백 제거)
   * normalizeTel("") // null
   * normalizeTel(" ") // null
   * ```
   */
  const normalizeTel = (tel: string | undefined): string | null => {
    if (!tel || tel.trim() === '') return null;
    return tel.trim();
  };

  // 정규화된 값 생성
  const normalizedHomepage = normalizeHomepageUrl(detail.homepage);
  const normalizedTel = normalizeTel(detail.tel);

  /**
   * 주소 복사 핸들러
   */
  const handleCopyAddress = async () => {
    if (!address) return;

    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      toast.success('주소가 클립보드에 복사되었습니다');
      
      // 2초 후 복사 상태 초기화
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      toast.error('주소 복사에 실패했습니다');
      console.error('주소 복사 실패:', error);
    }
  };

  return (
    <>
      {/* 기본 정보 섹션 (Card) */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2 sm:mb-3">
                {/* 관광 타입 뱃지 */}
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2 sm:px-2.5 py-0.5 text-xs font-medium text-primary">
                  {typeName}
                </span>
                
                {/* 카테고리 뱃지 */}
                {detail.cat1 && (
                  <span className="inline-flex items-center rounded-full border border-muted-foreground/20 bg-muted/50 px-2 sm:px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                    {detail.cat1}
                  </span>
                )}
                {detail.cat2 && (
                  <span className="inline-flex items-center rounded-full border border-muted-foreground/20 bg-muted/50 px-2 sm:px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                    {detail.cat2}
                  </span>
                )}
                {detail.cat3 && (
                  <span className="inline-flex items-center rounded-full border border-muted-foreground/20 bg-muted/50 px-2 sm:px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                    {detail.cat3}
                  </span>
                )}
              </div>
              <div className="flex items-start justify-between gap-2 sm:gap-4 mt-2">
                <CardTitle id="detail-info-title" className="text-2xl sm:text-3xl font-bold flex-1 min-w-0">
                  {detail.title}
                </CardTitle>
                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                  <BookmarkButton
                    contentId={detail.contentid}
                    title={detail.title}
                    size="sm"
                    variant="ghost"
                  />
                  <ShareButton title={detail.title} size="sm" variant="outline" />
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          {/* 대표 이미지 */}
          {imageUrl ? (
            <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-muted">
              <Image
                src={imageUrl}
                alt={`${detail.title} 대표 이미지`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 100vw, (max-width: 1024px) 80vw, 896px"
                unoptimized={imageUrl.startsWith('http') && !imageUrl.includes('data.go.kr')}
                priority
              />
            </div>
          ) : (
            <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-muted flex items-center justify-center">
              <p className="text-sm sm:text-base text-muted-foreground">이미지 없음</p>
            </div>
          )}

          {/* 연락처 정보 */}
          <div className="space-y-3 sm:space-y-4">
            {/* 주소 */}
            {address && (
              <div className="flex items-start gap-2 sm:gap-3">
                <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0 text-muted-foreground" aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h2 className="text-base sm:text-lg font-semibold">주소</h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyAddress}
                      className="h-9 sm:h-10 px-2 sm:px-3 min-w-[44px] sm:min-w-[48px]"
                      aria-label="주소 복사"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-600" aria-hidden="true" />
                      ) : (
                        <Copy className="h-4 w-4" aria-hidden="true" />
                      )}
                    </Button>
                  </div>
                  <p className="text-sm sm:text-base text-muted-foreground break-words">{address}</p>
                </div>
              </div>
            )}

            {/* 전화번호 */}
            {normalizedTel && (
              <div className="flex items-start gap-2 sm:gap-3">
                <Phone className="h-5 w-5 mt-0.5 flex-shrink-0 text-muted-foreground" aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <h2 className="text-base sm:text-lg font-semibold mb-1">전화번호</h2>
                  <a
                    href={`tel:${normalizedTel}`}
                    className="text-sm sm:text-base text-primary hover:underline break-all"
                    aria-label={`${normalizedTel}로 전화하기`}
                  >
                    {normalizedTel}
                  </a>
                </div>
              </div>
            )}

            {/* 홈페이지 */}
            {normalizedHomepage && (
              <div className="flex items-start gap-2 sm:gap-3">
                <Globe className="h-5 w-5 mt-0.5 flex-shrink-0 text-muted-foreground" aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <h2 className="text-base sm:text-lg font-semibold mb-1">홈페이지</h2>
                  <a
                    href={normalizedHomepage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm sm:text-base text-primary hover:underline flex items-center gap-1 break-all"
                    aria-label={`${detail.title} 홈페이지 열기 (새 창)`}
                  >
                    <span className="truncate">{normalizedHomepage}</span>
                    <ExternalLink className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                  </a>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 상세 정보 섹션 (Card) */}
      {detail.overview && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">개요</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm sm:text-base text-muted-foreground whitespace-pre-line leading-relaxed">
              {detail.overview}
            </p>
          </CardContent>
        </Card>
      )}
    </>
  );
}

