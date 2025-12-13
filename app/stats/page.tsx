/**
 * @file page.tsx
 * @description 통계 대시보드 페이지
 *
 * 이 페이지는 전국 관광지 데이터를 차트로 시각화하여 사용자가 한눈에 전국 관광지 현황을 파악할 수 있는 통계 페이지입니다.
 *
 * 주요 기능 (Phase 4에서 단계별 구현):
 * 1. 페이지 기본 구조 (Phase 4.1) ✅
 * 2. 통계 데이터 수집 (Phase 4.2) ✅
 * 3. 통계 요약 카드 (Phase 4.3) ✅
 * 4. 지역별 분포 차트 (Phase 4.4) ✅
 * 5. 타입별 분포 차트 (Phase 4.5) ✅
 *
 * 현재 구현:
 * - 기본 레이아웃 구조 (시맨틱 HTML)
 * - 반응형 디자인 (모바일 우선)
 * - 통계 요약 카드 (전체 관광지 수, Top 3 지역, Top 3 타입)
 * - 지역별 분포 차트 (Bar Chart, 상위 10개 지역)
 * - 타입별 분포 차트 (Donut Chart, 전체 타입)
 *
 * @dependencies
 * - Next.js App Router (Server Component)
 * - lib/api/stats-api.ts (getStatsSummary, getRegionStats, getTypeStats)
 * - components/stats/stats-summary.tsx
 * - components/stats/region-chart.tsx
 * - components/stats/type-chart.tsx
 * - Tailwind CSS v4
 */

import { getStatsSummary, getRegionStats, getTypeStats } from '@/lib/api/stats-api'
import StatsSummary from '@/components/stats/stats-summary'
import RegionChart from '@/components/stats/region-chart'
import TypeChart from '@/components/stats/type-chart'
import { TourApiError } from '@/lib/api/tour-api'

export default async function StatsPage() {
  // 통계 요약 데이터 수집
  let summaryData = null
  let summaryErrorMessage: string | null = null

  try {
    summaryData = await getStatsSummary()
  } catch (error) {
    console.error('통계 요약 데이터 수집 실패:', error)
    if (error instanceof TourApiError) {
      summaryErrorMessage = error.message
    } else {
      summaryErrorMessage =
        '통계 데이터를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
    }
  }

  // 지역별 통계 데이터 수집
  let regionData = null
  let regionErrorMessage: string | null = null

  try {
    regionData = await getRegionStats()
  } catch (error) {
    console.error('지역별 통계 데이터 수집 실패:', error)
    if (error instanceof TourApiError) {
      regionErrorMessage = error.message
    } else {
      regionErrorMessage =
        '지역별 통계 데이터를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
    }
  }

  // 타입별 통계 데이터 수집
  let typeData = null
  let typeErrorMessage: string | null = null

  try {
    typeData = await getTypeStats()
  } catch (error) {
    console.error('타입별 통계 데이터 수집 실패:', error)
    if (error instanceof TourApiError) {
      typeErrorMessage = error.message
    } else {
      typeErrorMessage =
        '타입별 통계 데이터를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
    }
  }

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
            <StatsSummary data={summaryData} error={summaryErrorMessage} />
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
            <RegionChart data={regionData} error={regionErrorMessage} />
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
            <TypeChart data={typeData} error={typeErrorMessage} />
          </section>
        </div>
      </div>
    </main>
  );
}

