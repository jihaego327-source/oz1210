/**
 * @file page.tsx
 * @description My Trip 홈페이지 - 관광지 목록 페이지
 *
 * 이 페이지는 전국 관광지 정보를 검색하고 조회할 수 있는 메인 페이지입니다.
 *
 * 주요 기능 (Phase 2에서 단계별 구현):
 * 1. 관광지 목록 표시 (Phase 2.2)
 * 2. 지역/타입 필터 (Phase 2.3)
 * 3. 키워드 검색 (Phase 2.4)
 * 4. 네이버 지도 연동 (Phase 2.5)
 * 5. 페이지네이션 (Phase 2.6)
 *
 * 현재 구현:
 * - 기본 레이아웃 구조 (헤더, 메인, 푸터)
 * - 반응형 컨테이너 설정
 *
 * @dependencies
 * - Next.js App Router
 * - Tailwind CSS v4
 */

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Phase 2.2에서 관광지 목록이 들어갈 영역 */}
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-4">관광지 목록</h1>
          <p className="text-muted-foreground">
            전국의 관광지를 검색하고 탐험해보세요.
          </p>
        </div>

        {/* 추후 tour-list 컴포넌트가 들어갈 자리 */}
        <div className="min-h-[400px] flex items-center justify-center border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">
            관광지 목록이 여기에 표시됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
