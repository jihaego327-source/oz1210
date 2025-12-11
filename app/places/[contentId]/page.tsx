/**
 * @file page.tsx
 * @description 관광지 상세페이지 (임시)
 * 
 * 관광지 상세 정보를 표시하는 페이지입니다.
 * Phase 3에서 본격적으로 구현할 예정이며, 현재는 기본 정보만 표시합니다.
 *
 * 주요 기능:
 * 1. 관광지 기본 정보 표시 (이름, 이미지, 주소, 개요)
 * 2. 전화번호 클릭 시 전화 연결
 * 3. 홈페이지 링크
 * 4. 뒤로가기 버튼
 *
 * @dependencies
 * - lib/api/tour-api.ts (getDetailCommon)
 * - lib/types/tour.ts (TourDetail, CONTENT_TYPE_NAMES)
 * - components/ui/button.tsx
 * - Next.js Image, Link 컴포넌트
 */

import { getDetailCommon } from '@/lib/api/tour-api';
import { CONTENT_TYPE_NAMES } from '@/lib/types/tour';
import { ArrowLeft, MapPin, Phone, Globe, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

interface PageProps {
  params: Promise<{ contentId: string }>;
}

export default async function PlaceDetailPage({ params }: PageProps) {
  const { contentId } = await params;

  try {
    // API 호출로 상세 정보 가져오기
    const detail = await getDetailCommon({ contentId });

    // 이미지 URL 결정 (firstimage 우선, 없으면 firstimage2)
    const imageUrl = detail.firstimage || detail.firstimage2;

    // 주소 조합
    const address = [detail.addr1, detail.addr2].filter(Boolean).join(' ');

    // 관광 타입 이름 가져오기
    const typeName = CONTENT_TYPE_NAMES[detail.contenttypeid] || '관광지';

    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 뒤로가기 버튼 */}
        <Link href="/">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            목록으로 돌아가기
          </Button>
        </Link>

        {/* 기본 정보 */}
        <div className="space-y-6">
          {/* 관광지명 및 타입 */}
          <div>
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary mb-3">
              {typeName}
            </span>
            <h1 className="text-3xl font-bold">{detail.title}</h1>
          </div>

          {/* 대표 이미지 */}
          {imageUrl ? (
            <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-muted">
              <Image
                src={imageUrl}
                alt={detail.title}
                fill
                className="object-cover"
                sizes="100vw"
                unoptimized={imageUrl.startsWith('http') && !imageUrl.includes('data.go.kr')}
              />
            </div>
          ) : (
            <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-muted flex items-center justify-center">
              <p className="text-muted-foreground">이미지 없음</p>
            </div>
          )}

          {/* 정보 섹션 */}
          <div className="space-y-4">
            {/* 주소 */}
            {address && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0 text-muted-foreground" />
                <div>
                  <h2 className="text-lg font-semibold mb-1">주소</h2>
                  <p className="text-muted-foreground">{address}</p>
                </div>
              </div>
            )}

            {/* 전화번호 */}
            {detail.tel && (
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 mt-0.5 flex-shrink-0 text-muted-foreground" />
                <div>
                  <h2 className="text-lg font-semibold mb-1">전화번호</h2>
                  <a
                    href={`tel:${detail.tel}`}
                    className="text-primary hover:underline"
                  >
                    {detail.tel}
                  </a>
                </div>
              </div>
            )}

            {/* 홈페이지 */}
            {detail.homepage && (
              <div className="flex items-start gap-3">
                <Globe className="h-5 w-5 mt-0.5 flex-shrink-0 text-muted-foreground" />
                <div>
                  <h2 className="text-lg font-semibold mb-1">홈페이지</h2>
                  <a
                    href={detail.homepage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    {detail.homepage}
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            )}

            {/* 개요 */}
            {detail.overview && (
              <div>
                <h2 className="text-lg font-semibold mb-2">개요</h2>
                <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                  {detail.overview}
                </p>
              </div>
            )}
          </div>

          {/* 임시 페이지 안내 */}
          <div className="bg-muted p-4 rounded-lg border">
            <p className="text-sm text-muted-foreground">
              💡 이 페이지는 임시 버전입니다. Phase 3에서 운영정보, 이미지 갤러리, 지도 등 더 상세한 정보를 추가할 예정입니다.
            </p>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link href="/">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            목록으로 돌아가기
          </Button>
        </Link>

        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">관광지 정보를 불러올 수 없습니다</h1>
          <p className="text-muted-foreground mb-4">
            {error instanceof Error
              ? error.message
              : '알 수 없는 오류가 발생했습니다.'}
          </p>
          <Link href="/">
            <Button>홈으로 돌아가기</Button>
          </Link>
        </div>
      </div>
    );
  }
}

