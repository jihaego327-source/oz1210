/**
 * @file page.tsx
 * @description 관광지 상세페이지
 * 
 * 관광지 상세 정보를 표시하는 페이지입니다.
 * Phase 3 기본 정보 섹션 구현 완료 - 향후 운영정보, 이미지 갤러리, 지도 등 추가 예정
 *
 * 주요 기능:
 * 1. 관광지 기본 정보 표시 (DetailInfo 컴포넌트)
 * 2. 뒤로가기 버튼 (접근성 개선)
 * 3. 에러 처리 및 사용자 친화적 메시지
 *
 * 향후 구현 예정 (Phase 3 후속 작업):
 * - generateMetadata 함수: 동적 Open Graph 메타태그 생성
 *   - og:title: 관광지명
 *   - og:description: 관광지 설명 (100자 이내)
 *   - og:image: 대표 이미지 (1200x630 권장)
 *   - og:url: 상세페이지 URL
 *   - og:type: "website"
 * - 운영정보 섹션 (detail-intro.tsx) ✅
 * - 이미지 갤러리 (detail-gallery.tsx)
 * - 지도 섹션 (detail-map.tsx)
 * - 북마크 기능 (bookmark-button.tsx)
 *
 * @dependencies
 * - lib/api/tour-api.ts (getDetailCommon, getDetailIntro)
 * - components/tour-detail/detail-info.tsx
 * - components/tour-detail/detail-intro.tsx
 * - components/ui/button.tsx
 * - components/ui/card.tsx
 * - Next.js Link 컴포넌트
 */

import { getDetailCommon, getDetailIntro } from '@/lib/api/tour-api';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import DetailInfo from '@/components/tour-detail/detail-info';
import DetailIntro from '@/components/tour-detail/detail-intro';

interface PageProps {
  params: Promise<{ contentId: string }>;
}

export default async function PlaceDetailPage({ params }: PageProps) {
  const { contentId } = await params;

  try {
    // API 호출로 상세 정보 가져오기
    const detail = await getDetailCommon({ contentId });

    // 운영 정보 API 호출 (병렬 처리, 실패해도 기본 정보는 표시)
    let intro = null;
    try {
      intro = await getDetailIntro({
        contentId,
        contentTypeId: detail.contenttypeid,
      });
    } catch (error) {
      // 운영 정보가 없어도 기본 정보는 표시
      console.warn('운영 정보를 불러올 수 없습니다:', error);
    }

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
          {/* 기본 정보 섹션 */}
          <DetailInfo detail={detail} />

          {/* 운영 정보 섹션 */}
          {intro && <DetailIntro intro={intro} />}

          {/* 향후 추가 예정 섹션 안내 */}
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                💡 Phase 3 후속 작업에서 이미지 갤러리, 지도, 북마크 등 더 상세한 정보를 추가할 예정입니다.
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

