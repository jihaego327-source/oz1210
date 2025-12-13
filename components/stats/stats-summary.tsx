/**
 * @file stats-summary.tsx
 * @description 통계 요약 카드 컴포넌트
 *
 * 통계 대시보드 페이지에서 전체 관광지 수, Top 3 지역, Top 3 타입을 카드 형태로 표시합니다.
 * PRD.md 섹션 2.6.3 (통계 요약 카드)를 기반으로 작성되었습니다.
 *
 * 주요 기능:
 * 1. 전체 관광지 수 표시 (메인 카드)
 * 2. Top 3 지역 표시 (그리드 레이아웃)
 * 3. Top 3 타입 표시 (그리드 레이아웃)
 * 4. 마지막 업데이트 시간 표시
 * 5. 로딩 상태 (Skeleton UI)
 * 6. 에러 처리
 *
 * @dependencies
 * - shadcn/ui Card, Skeleton 컴포넌트
 * - lucide-react 아이콘
 * - lib/types/stats.ts (StatsSummary 타입)
 * - lib/utils.ts (formatKoreanDateTime 함수)
 *
 * @see {@link ../PRD.md | PRD 문서 - 섹션 2.6.3 (통계 요약 카드)}
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { BarChart3, Clock, MapPin, Tag, Trophy } from 'lucide-react'
import { formatKoreanDateTime } from '@/lib/utils'
import type { StatsSummary } from '@/lib/types/stats'

interface StatsSummaryProps {
  /** 통계 요약 데이터 */
  data: StatsSummary | null
  /** 로딩 상태 */
  isLoading?: boolean
  /** 에러 메시지 */
  error?: string | null
}

/**
 * 통계 요약 카드 컴포넌트
 *
 * 전체 관광지 수, Top 3 지역, Top 3 타입을 카드 형태로 표시합니다.
 * 로딩 중이거나 에러가 발생한 경우 적절한 UI를 표시합니다.
 *
 * @param props - 컴포넌트 props
 * @param props.data - 통계 요약 데이터
 * @param props.isLoading - 로딩 상태 (기본값: false)
 * @param props.error - 에러 메시지
 *
 * @example
 * ```tsx
 * const summary = await getStatsSummary()
 * <StatsSummary data={summary} />
 * ```
 */
export default function StatsSummary({
  data,
  isLoading = false,
  error,
}: StatsSummaryProps) {
  // 에러 상태
  if (error) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
          <div className="text-destructive">
            <BarChart3 className="h-12 w-12" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">데이터를 불러올 수 없습니다</h3>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  // 로딩 상태
  if (isLoading || !data) {
    return <StatsSummarySkeleton />
  }

  // 숫자 포맷팅 (천 단위 구분)
  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('ko-KR').format(num)
  }

  // 순위별 색상 클래스
  const getRankColor = (rank: number): string => {
    switch (rank) {
      case 1:
        return 'text-primary border-primary'
      case 2:
        return 'text-secondary-foreground border-secondary'
      case 3:
        return 'text-muted-foreground border-muted'
      default:
        return 'text-foreground border-border'
    }
  }

  return (
    <div className="space-y-6">
      {/* 전체 관광지 수 카드 (메인) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            <span>전체 관광지 수</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold sm:text-5xl">
              {formatNumber(data.totalCount)}
            </span>
            <span className="text-lg text-muted-foreground">개</span>
          </div>
        </CardContent>
      </Card>

      {/* Top 3 지역 카드 */}
      <div>
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <MapPin className="h-5 w-5" />
          <span>지역별 Top 3</span>
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.topRegions.map((region) => (
            <Card key={region.areaCode} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{region.name}</CardTitle>
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 font-bold ${getRankColor(region.rank)}`}
                  >
                    <Trophy className="h-4 w-4" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold sm:text-3xl">
                    {formatNumber(region.count)}
                  </span>
                  <span className="text-sm text-muted-foreground">개</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {region.rank}위
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Top 3 타입 카드 */}
      <div>
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Tag className="h-5 w-5" />
          <span>타입별 Top 3</span>
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.topTypes.map((type) => (
            <Card key={type.contentTypeId} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{type.typeName}</CardTitle>
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 font-bold ${getRankColor(type.rank)}`}
                  >
                    <Trophy className="h-4 w-4" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold sm:text-3xl">
                    {formatNumber(type.count)}
                  </span>
                  <span className="text-sm text-muted-foreground">개</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {type.rank}위
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* 마지막 업데이트 시간 */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" />
        <span>
          마지막 업데이트: {formatKoreanDateTime(data.lastUpdated)}
        </span>
      </div>
    </div>
  )
}

/**
 * 통계 요약 카드 스켈레톤 UI
 *
 * 로딩 중일 때 표시되는 스켈레톤 컴포넌트입니다.
 */
function StatsSummarySkeleton() {
  return (
    <div className="space-y-6">
      {/* 전체 관광지 수 카드 스켈레톤 */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-12 w-24" />
        </CardContent>
      </Card>

      {/* Top 3 지역 카드 스켈레톤 */}
      <div>
        <Skeleton className="mb-4 h-6 w-24" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Top 3 타입 카드 스켈레톤 */}
      <div>
        <Skeleton className="mb-4 h-6 w-24" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* 마지막 업데이트 시간 스켈레톤 */}
      <Skeleton className="h-4 w-48" />
    </div>
  )
}

