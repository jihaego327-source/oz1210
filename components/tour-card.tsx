/**
 * @file tour-card.tsx
 * @description 관광지 카드 컴포넌트
 *
 * 관광지 정보를 카드 형태로 표시하는 컴포넌트입니다.
 * 썸네일 이미지, 관광지명, 주소, 타입 뱃지, 개요를 표시하고,
 * 클릭 시 상세페이지로 이동합니다.
 *
 * 주요 기능:
 * 1. 썸네일 이미지 표시 (기본 이미지 fallback)
 * 2. 관광지명 및 주소 표시
 * 3. 관광 타입 뱃지 표시
 * 4. 간단한 개요 표시 (1-2줄)
 * 5. 호버 효과 (scale, shadow)
 * 6. 상세페이지 링크
 *
 * @dependencies
 * - Next.js Link, Image 컴포넌트
 * - lib/types/tour.ts (TourItem, CONTENT_TYPE_NAMES)
 * - Tailwind CSS v4
 */

import Link from 'next/link';
import Image from 'next/image';
import type { TourItem } from '@/lib/types/tour';
import { CONTENT_TYPE_NAMES } from '@/lib/types/tour';
import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TourCardProps {
  /** 관광지 정보 */
  tour: TourItem;
  /** 추가 스타일 클래스 */
  className?: string;
}

/**
 * 관광지 카드 컴포넌트
 *
 * @example
 * ```tsx
 * <TourCard tour={tourItem} />
 * ```
 */
export default function TourCard({ tour, className }: TourCardProps) {
  // 이미지 URL 결정 (firstimage2 우선, 없으면 firstimage, 둘 다 없으면 기본 이미지)
  const imageUrl =
    tour.firstimage2 || tour.firstimage || '/placeholder-tour.jpg';

  // 관광 타입 이름 가져오기
  const typeName = CONTENT_TYPE_NAMES[tour.contenttypeid] || '관광지';

  // 주소 조합 (addr1 + addr2)
  const address = [tour.addr1, tour.addr2].filter(Boolean).join(' ');

  // 개요 텍스트 (1-2줄로 제한, 최대 100자)
  const overview = tour.overview
    ? tour.overview.length > 100
      ? `${tour.overview.slice(0, 100)}...`
      : tour.overview
    : '';

  return (
    <Link
      href={`/places/${tour.contentid}`}
      className={cn(
        'group block rounded-lg border bg-card text-card-foreground shadow-sm transition-all hover:scale-[1.02] hover:shadow-md',
        className
      )}
      aria-label={`${tour.title} 상세보기`}
    >
      {/* 썸네일 이미지 */}
      <div className="relative aspect-video w-full overflow-hidden rounded-t-lg bg-muted">
        <Image
          src={imageUrl}
          alt={tour.title}
          fill
          className="object-cover transition-transform group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          unoptimized={imageUrl.startsWith('http') && !imageUrl.includes('data.go.kr')}
        />
      </div>

      {/* 카드 내용 */}
      <div className="p-4 space-y-3">
        {/* 관광 타입 뱃지 */}
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            {typeName}
          </span>
        </div>

        {/* 관광지명 */}
        <h3 className="text-lg font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
          {tour.title}
        </h3>

        {/* 주소 */}
        {address && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
            <span className="line-clamp-1">{address}</span>
          </div>
        )}

        {/* 개요 */}
        {overview && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {overview}
          </p>
        )}
      </div>
    </Link>
  );
}

