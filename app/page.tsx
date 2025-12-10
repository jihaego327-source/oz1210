/**
 * @file page.tsx
 * @description My Trip 홈페이지 - 관광지 목록 페이지
 *
 * 이 페이지는 전국 관광지 정보를 검색하고 조회할 수 있는 메인 페이지입니다.
 *
 * 주요 기능 (Phase 2에서 단계별 구현):
 * 1. 관광지 목록 표시 (Phase 2.2) ✅
 * 2. 지역/타입 필터 (Phase 2.3)
 * 3. 키워드 검색 (Phase 2.4)
 * 4. 네이버 지도 연동 (Phase 2.5)
 * 5. 페이지네이션 (Phase 2.6)
 *
 * 현재 구현:
 * - 기본 레이아웃 구조 (헤더, 메인, 푸터)
 * - 관광지 목록 표시 (서울, 관광지, 20개 항목)
 * - API 연동 (getAreaBasedList)
 *
 * @dependencies
 * - Next.js App Router (Server Component)
 * - lib/api/tour-api.ts (getAreaBasedList)
 * - components/tour-list.tsx
 * - Tailwind CSS v4
 */

import { getAreaBasedList } from '@/lib/api/tour-api';
import TourList from '@/components/tour-list';

export default async function Home() {
  let tourData = null;
  let error: Error | null = null;

  try {
    // 기본값: 서울(areaCode: '1'), 관광지(contentTypeId: '12'), 20개 항목
    tourData = await getAreaBasedList({
      areaCode: '1', // 서울
      contentTypeId: '12', // 관광지
      numOfRows: 20,
      pageNo: 1,
    });
  } catch (err) {
    error = err instanceof Error ? err : new Error('알 수 없는 오류가 발생했습니다.');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* 페이지 헤더 */}
        <div>
          <h1 className="text-3xl font-bold mb-4">관광지 목록</h1>
          <p className="text-muted-foreground">
            전국의 관광지를 검색하고 탐험해보세요.
          </p>
        </div>

        {/* 관광지 목록 */}
        <TourList
          items={tourData?.items || []}
          isLoading={false}
          error={error}
        />
      </div>
    </div>
  );
}
