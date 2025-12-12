/**
 * @file page.tsx
 * @description 관광지 상세페이지
 * 
 * 관광지 상세 정보를 표시하는 페이지입니다.
 * Phase 3 기본 정보 섹션 구현 완료 - 운영정보, 이미지 갤러리, 지도, 반려동물 정보 포함
 *
 * 주요 기능:
 * 1. 관광지 기본 정보 표시 (DetailInfo 컴포넌트)
 * 2. 운영 정보 표시 (DetailIntro 컴포넌트)
 * 3. 이미지 갤러리 (DetailGallery 컴포넌트)
 * 4. 반려동물 동반 정보 (DetailPetTour 컴포넌트)
 * 5. 지도 표시 (DetailMap 컴포넌트)
 * 6. 뒤로가기 버튼 (접근성 개선)
 * 7. 에러 처리 및 사용자 친화적 메시지
 * 8. 동적 Open Graph 메타태그 생성 (generateMetadata)
 * 9. 공유 기능 (ShareButton 컴포넌트)
 *
 * @dependencies
 * - lib/api/tour-api.ts (getDetailCommon, getDetailIntro, getDetailPetTour)
 * - components/tour-detail/detail-info.tsx
 * - components/tour-detail/detail-intro.tsx
 * - components/tour-detail/detail-gallery.tsx
 * - components/tour-detail/detail-map.tsx
 * - components/tour-detail/detail-pet-tour.tsx
 * - components/tour-detail/share-button.tsx
 * - components/ui/button.tsx
 * - components/ui/card.tsx
 * - Next.js Link 컴포넌트
 * - Next.js Metadata API (generateMetadata)
 */

import { getDetailCommon, getDetailIntro, getDetailPetTour } from '@/lib/api/tour-api';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { headers } from 'next/headers';
import type { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import DetailInfo from '@/components/tour-detail/detail-info';
import DetailIntro from '@/components/tour-detail/detail-intro';
import DetailGallery from '@/components/tour-detail/detail-gallery';
import DetailMap from '@/components/tour-detail/detail-map';
import DetailPetTour from '@/components/tour-detail/detail-pet-tour';
import ShareButton from '@/components/tour-detail/share-button';

interface PageProps {
  params: Promise<{ contentId: string }>;
}

/**
 * 동적 Open Graph 메타태그 생성
 *
 * 관광지 상세 정보를 기반으로 소셜 미디어 공유용 메타태그를 생성합니다.
 * PRD 2.4.5 공유 기능 요구사항을 구현합니다.
 *
 * @param props - 페이지 props (params 포함)
 * @returns Next.js Metadata 객체
 */
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  try {
    const { contentId } = await params;
    const detail = await getDetailCommon({ contentId });

    // 절대 URL 생성 (headers에서 host 정보 가져오기)
    const headersList = await headers();
    const host = headersList.get('host') || 'localhost:3000';
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const baseUrl = `${protocol}://${host}`;
    const url = `${baseUrl}/places/${contentId}`;

    // 설명 텍스트 정리 (100자 이내, HTML 태그 제거)
    let description = detail.overview || '한국관광공사 공공 API를 활용한 관광지 정보 서비스';
    // HTML 태그 제거
    description = description.replace(/<[^>]*>/g, '');
    // 100자 제한
    if (description.length > 100) {
      description = description.substring(0, 100) + '...';
    }

    // 이미지 URL 정규화 (절대 경로로 변환)
    let imageUrl = detail.firstimage || detail.firstimage2;
    if (imageUrl) {
      // 이미 절대 경로인 경우 그대로 사용
      if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
        // 상대 경로인 경우 절대 경로로 변환
        imageUrl = `${baseUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
      }
    } else {
      // 기본 이미지 사용
      imageUrl = `${baseUrl}/og-image.png`;
    }

    return {
      title: `${detail.title} - My Trip`,
      description,
      openGraph: {
        title: detail.title,
        description,
        type: 'website',
        url,
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: detail.title,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: detail.title,
        description,
        images: [imageUrl],
      },
    };
  } catch (error) {
    // API 실패 시 기본 메타태그 반환
    console.error('메타태그 생성 실패:', error);
    return {
      title: '관광지 정보 - My Trip',
      description: '한국관광공사 공공 API를 활용한 관광지 정보 서비스',
    };
  }
}

export default async function PlaceDetailPage({ params }: PageProps) {
  const { contentId } = await params;

  try {
    // API 호출로 상세 정보 가져오기
    const detail = await getDetailCommon({ contentId });

    // 운영 정보 및 반려동물 정보 API 호출 (병렬 처리, 실패해도 기본 정보는 표시)
    const [intro, petInfo] = await Promise.allSettled([
      getDetailIntro({
        contentId,
        contentTypeId: detail.contenttypeid,
      }),
      getDetailPetTour({ contentId }),
    ]);

    // 운영 정보 처리
    let introData = null;
    if (intro.status === 'fulfilled') {
      introData = intro.value;
    } else {
      console.warn('운영 정보를 불러올 수 없습니다:', intro.reason);
    }

    // 반려동물 정보 처리
    let petInfoData = null;
    if (petInfo.status === 'fulfilled') {
      petInfoData = petInfo.value;
    } else {
      console.warn('반려동물 정보를 불러올 수 없습니다:', petInfo.reason);
    }

    return (
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl">
        {/* 뒤로가기 버튼 */}
        <nav aria-label="페이지 네비게이션">
          <Link href="/">
            <Button
              variant="ghost"
              className="mb-4 sm:mb-6 h-10 sm:h-11 px-3 sm:px-4"
              aria-label="목록으로 돌아가기"
            >
              <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
              <span className="text-sm sm:text-base">목록으로 돌아가기</span>
            </Button>
          </Link>
        </nav>

        {/* 메인 콘텐츠 */}
        <main className="space-y-4 sm:space-y-6">
          {/* 기본 정보 섹션 */}
          <section aria-labelledby="detail-info-title">
            <DetailInfo detail={detail} />
          </section>

          {/* 이미지 갤러리 섹션 */}
          <section aria-labelledby="detail-gallery-title">
            <DetailGallery contentId={contentId} title={detail.title} />
          </section>

          {/* 운영 정보 섹션 */}
          {introData && (
            <section aria-labelledby="detail-intro-title">
              <DetailIntro intro={introData} />
            </section>
          )}

          {/* 반려동물 정보 섹션 */}
          {petInfoData && (
            <section aria-labelledby="detail-pet-tour-title">
              <DetailPetTour petInfo={petInfoData} />
            </section>
          )}

          {/* 지도 섹션 */}
          {detail.mapx &&
            detail.mapy &&
            detail.mapx !== '0' &&
            detail.mapy !== '0' && (
              <section aria-labelledby="detail-map-title">
                <DetailMap detail={detail} />
              </section>
            )}
        </main>
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

