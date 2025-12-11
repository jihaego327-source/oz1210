/**
 * @file page.tsx
 * @description 관광지 상세페이지
 * 
 * 관광지 상세 정보를 표시하는 페이지입니다.
 * Phase 3 기본 구조 구현 완료 - 향후 운영정보, 이미지 갤러리, 지도 등 추가 예정
 *
 * 주요 기능:
 * 1. 관광지 기본 정보 표시 (이름, 이미지, 주소, 개요)
 * 2. 전화번호 클릭 시 전화 연결
 * 3. 홈페이지 링크
 * 4. 뒤로가기 버튼 (접근성 개선)
 * 5. 섹션별 Card/Separator 레이아웃
 *
 * 향후 구현 예정 (Phase 3 후속 작업):
 * - generateMetadata 함수: 동적 Open Graph 메타태그 생성
 *   - og:title: 관광지명
 *   - og:description: 관광지 설명 (100자 이내)
 *   - og:image: 대표 이미지 (1200x630 권장)
 *   - og:url: 상세페이지 URL
 *   - og:type: "website"
 *
 * @dependencies
 * - lib/api/tour-api.ts (getDetailCommon)
 * - lib/types/tour.ts (TourDetail, CONTENT_TYPE_NAMES)
 * - components/ui/button.tsx
 * - components/ui/card.tsx
 * - components/ui/separator.tsx
 * - Next.js Image, Link 컴포넌트
 */

import { getDetailCommon } from '@/lib/api/tour-api';
import { CONTENT_TYPE_NAMES } from '@/lib/types/tour';
import { ArrowLeft, MapPin, Phone, Globe, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

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
          <Button
            variant="ghost"
            className="mb-6"
            aria-label="목록으로 돌아가기"
          >
            <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
            목록으로 돌아가기
          </Button>
        </Link>

        {/* 메인 콘텐츠 */}
        <div className="space-y-6">
          {/* 기본 정보 섹션 (Card) */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary mb-3">
                    {typeName}
                  </span>
                  <CardTitle className="text-3xl font-bold mt-2">
                    {detail.title}
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 대표 이미지 */}
              {imageUrl ? (
                <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-muted">
                  <Image
                    src={imageUrl}
                    alt={detail.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 896px"
                    unoptimized={imageUrl.startsWith('http') && !imageUrl.includes('data.go.kr')}
                  />
                </div>
              ) : (
                <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                  <p className="text-muted-foreground">이미지 없음</p>
                </div>
              )}

              {/* 연락처 정보 */}
              <div className="space-y-4">
                {/* 주소 */}
                {address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0 text-muted-foreground" aria-hidden="true" />
                    <div className="flex-1">
                      <h2 className="text-lg font-semibold mb-1">주소</h2>
                      <p className="text-muted-foreground">{address}</p>
                    </div>
                  </div>
                )}

                {/* 전화번호 */}
                {detail.tel && (
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 mt-0.5 flex-shrink-0 text-muted-foreground" aria-hidden="true" />
                    <div className="flex-1">
                      <h2 className="text-lg font-semibold mb-1">전화번호</h2>
                      <a
                        href={`tel:${detail.tel}`}
                        className="text-primary hover:underline"
                        aria-label={`${detail.tel}로 전화하기`}
                      >
                        {detail.tel}
                      </a>
                    </div>
                  </div>
                )}

                {/* 홈페이지 */}
                {detail.homepage && (
                  <div className="flex items-start gap-3">
                    <Globe className="h-5 w-5 mt-0.5 flex-shrink-0 text-muted-foreground" aria-hidden="true" />
                    <div className="flex-1">
                      <h2 className="text-lg font-semibold mb-1">홈페이지</h2>
                      <a
                        href={detail.homepage}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1"
                        aria-label={`${detail.title} 홈페이지 열기 (새 창)`}
                      >
                        {detail.homepage}
                        <ExternalLink className="h-4 w-4" aria-hidden="true" />
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
                <CardTitle>개요</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                  {detail.overview}
                </p>
              </CardContent>
            </Card>
          )}

          {/* 향후 추가 예정 섹션 안내 */}
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                💡 Phase 3 후속 작업에서 운영정보, 이미지 갤러리, 지도, 북마크 등 더 상세한 정보를 추가할 예정입니다.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  } catch (error) {
    // 에러 타입별 메시지 구분
    let errorMessage = '알 수 없는 오류가 발생했습니다.';
    let errorTitle = '관광지 정보를 불러올 수 없습니다';

    if (error instanceof Error) {
      // API 에러 메시지 처리
      if (error.message.includes('404') || error.message.includes('찾을 수 없')) {
        errorTitle = '관광지를 찾을 수 없습니다';
        errorMessage = '요청하신 관광지 정보가 존재하지 않거나 삭제되었을 수 있습니다.';
      } else if (error.message.includes('네트워크') || error.message.includes('fetch')) {
        errorTitle = '네트워크 오류';
        errorMessage = '인터넷 연결을 확인하고 다시 시도해주세요.';
      } else {
        errorMessage = error.message;
      }
    }

    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link href="/">
          <Button
            variant="ghost"
            className="mb-6"
            aria-label="목록으로 돌아가기"
          >
            <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
            목록으로 돌아가기
          </Button>
        </Link>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <h1 className="text-2xl font-bold mb-4">{errorTitle}</h1>
              <p className="text-muted-foreground mb-6">{errorMessage}</p>
              <Link href="/">
                <Button>홈으로 돌아가기</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
}

