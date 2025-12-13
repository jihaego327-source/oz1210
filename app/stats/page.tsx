/**
 * @file page.tsx
 * @description 통계 대시보드 페이지
 *
 * 이 페이지는 전국 관광지 데이터를 차트로 시각화하여 사용자가 한눈에 전국 관광지 현황을 파악할 수 있는 통계 페이지입니다.
 *
 * 주요 기능 (Phase 4에서 단계별 구현):
 * 1. 페이지 기본 구조 (Phase 4.1) ✅
 * 2. 통계 데이터 수집 (Phase 4.2) - 향후 구현
 * 3. 통계 요약 카드 (Phase 4.3) - 향후 구현
 * 4. 지역별 분포 차트 (Phase 4.4) - 향후 구현
 * 5. 타입별 분포 차트 (Phase 4.5) - 향후 구현
 *
 * 현재 구현:
 * - 기본 레이아웃 구조 (시맨틱 HTML)
 * - 반응형 디자인 (모바일 우선)
 * - 섹션 구조 준비 (통계 요약, 지역별 차트, 타입별 차트)
 *
 * @dependencies
 * - Next.js App Router (Server Component)
 * - Tailwind CSS v4
 * - 향후: lib/api/stats-api.ts
 * - 향후: components/stats/stats-summary.tsx
 * - 향후: components/stats/region-chart.tsx
 * - 향후: components/stats/type-chart.tsx
 */

export default async function StatsPage() {
  return (
    <main className="flex-1">
      <div className="container mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 md:px-8 md:py-10">
        {/* 페이지 제목 */}
        <header className="mb-6 sm:mb-8">
          <h1
            id="stats-page-title"
            className="text-2xl font-bold sm:text-3xl md:text-4xl"
          >
            통계 대시보드
          </h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            전국 관광지 데이터를 한눈에 확인하세요
          </p>
        </header>

        {/* 섹션 컨테이너 */}
        <div className="space-y-6 sm:space-y-8">
          {/* 통계 요약 카드 섹션 */}
          <section
            id="stats-summary-section"
            aria-labelledby="stats-summary-title"
            className="rounded-lg border bg-card p-4 sm:p-6"
          >
            <h2
              id="stats-summary-title"
              className="mb-4 text-xl font-semibold sm:text-2xl"
            >
              통계 요약
            </h2>
            <div className="text-center text-muted-foreground">
              <p className="text-sm sm:text-base">
                통계 요약 카드가 여기에 표시됩니다.
              </p>
              <p className="mt-2 text-xs sm:text-sm">
                (Phase 4.3에서 구현 예정)
              </p>
            </div>
          </section>

          {/* 지역별 분포 차트 섹션 */}
          <section
            id="region-chart-section"
            aria-labelledby="region-chart-title"
            className="rounded-lg border bg-card p-4 sm:p-6"
          >
            <h2
              id="region-chart-title"
              className="mb-4 text-xl font-semibold sm:text-2xl"
            >
              지역별 관광지 분포
            </h2>
            <div className="text-center text-muted-foreground">
              <p className="text-sm sm:text-base">
                지역별 분포 차트가 여기에 표시됩니다.
              </p>
              <p className="mt-2 text-xs sm:text-sm">
                (Phase 4.4에서 구현 예정)
              </p>
            </div>
          </section>

          {/* 타입별 분포 차트 섹션 */}
          <section
            id="type-chart-section"
            aria-labelledby="type-chart-title"
            className="rounded-lg border bg-card p-4 sm:p-6"
          >
            <h2
              id="type-chart-title"
              className="mb-4 text-xl font-semibold sm:text-2xl"
            >
              관광 타입별 분포
            </h2>
            <div className="text-center text-muted-foreground">
              <p className="text-sm sm:text-base">
                타입별 분포 차트가 여기에 표시됩니다.
              </p>
              <p className="mt-2 text-xs sm:text-sm">
                (Phase 4.5에서 구현 예정)
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

