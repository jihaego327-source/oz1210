/**
 * @file region-chart.tsx
 * @description 지역별 관광지 분포 Bar Chart 컴포넌트
 *
 * 통계 대시보드 페이지에서 지역별 관광지 개수를 Bar Chart로 시각화합니다.
 * PRD.md 섹션 2.6.1 (지역별 관광지 분포)를 기반으로 작성되었습니다.
 *
 * 주요 기능:
 * 1. 지역별 관광지 개수 Bar Chart 표시
 * 2. 바 클릭 시 해당 지역의 관광지 목록 페이지로 이동
 * 3. 호버 시 툴팁 표시 (지역명, 개수, 비율)
 * 4. 반응형 디자인 (모바일/태블릿/데스크톱)
 * 5. 로딩 상태 (Skeleton UI)
 * 6. 에러 처리
 * 7. 접근성 (ARIA 라벨, 키보드 네비게이션)
 *
 * @dependencies
 * - shadcn/ui Chart 컴포넌트 (recharts 기반)
 * - lucide-react 아이콘
 * - lib/types/stats.ts (RegionStats, ChartDataPoint 타입)
 * - lib/utils.ts (숫자 포맷팅)
 *
 * @see {@link ../PRD.md | PRD 문서 - 섹션 2.6.1 (지역별 관광지 분포)}
 */

'use client'

import { useRouter } from 'next/navigation'
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Cell } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'
import { BarChart3, MapPin } from 'lucide-react'
import type { RegionStats, ChartDataPoint } from '@/lib/types/stats'

interface RegionChartProps {
  /** 지역별 통계 데이터 */
  data: RegionStats[] | null
  /** 로딩 상태 */
  isLoading?: boolean
  /** 에러 메시지 */
  error?: string | null
  /** 표시할 최대 지역 수 (기본값: 10) */
  maxItems?: number
}

/**
 * RegionStats 배열을 ChartDataPoint 배열로 변환
 *
 * @param regionStats - 지역별 통계 데이터
 * @param maxItems - 표시할 최대 지역 수
 * @returns 차트 데이터 포인트 배열
 */
function transformRegionStatsToChartData(
  regionStats: RegionStats[],
  maxItems: number = 10
): ChartDataPoint[] {
  // 정렬: 관광지 개수 기준 내림차순
  const sorted = [...regionStats].sort((a, b) => b.count - a.count)

  // 상위 N개만 선택
  const topRegions = sorted.slice(0, maxItems)

  // 전체 개수 계산 (비율 계산용)
  const totalCount = regionStats.reduce((sum, stat) => sum + stat.count, 0)

  // ChartDataPoint로 변환
  return topRegions.map((region) => ({
    label: region.name,
    value: region.count,
    percentage: totalCount > 0 ? (region.count / totalCount) * 100 : 0,
    metadata: {
      areaCode: region.areaCode,
    },
  }))
}

/**
 * 지역별 관광지 분포 Bar Chart 컴포넌트
 *
 * 지역별 관광지 개수를 Bar Chart로 시각화하고, 바 클릭 시 해당 지역의
 * 관광지 목록 페이지로 이동합니다.
 *
 * @param props - 컴포넌트 props
 * @param props.data - 지역별 통계 데이터
 * @param props.isLoading - 로딩 상태 (기본값: false)
 * @param props.error - 에러 메시지
 * @param props.maxItems - 표시할 최대 지역 수 (기본값: 10)
 *
 * @example
 * ```tsx
 * const regionStats = await getRegionStats()
 * <RegionChart data={regionStats} />
 * ```
 */
export default function RegionChart({
  data,
  isLoading = false,
  error,
  maxItems = 10,
}: RegionChartProps) {
  const router = useRouter()

  // 에러 상태
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
        <div className="text-destructive">
          <BarChart3 className="h-12 w-12" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">차트를 불러올 수 없습니다</h3>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  // 로딩 상태
  if (isLoading || !data || data.length === 0) {
    return <RegionChartSkeleton />
  }

  // 데이터 변환
  const chartData = transformRegionStatsToChartData(data, maxItems)

  // 숫자 포맷팅 (천 단위 구분)
  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('ko-KR').format(num)
  }

  // 바 클릭 핸들러
  const handleBarClick = (data: ChartDataPoint) => {
    if (data.metadata?.areaCode) {
      router.push(`/?areaCode=${data.metadata.areaCode}`)
    }
  }

  // 차트 설정
  const chartConfig = {
    count: {
      label: '관광지 개수',
      color: 'hsl(var(--chart-1))',
    },
  }

  return (
    <div className="space-y-4">
      {/* 차트 제목 및 설명 */}
      <div className="flex items-center gap-2">
        <MapPin className="h-5 w-5 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          상위 {Math.min(maxItems, chartData.length)}개 지역 표시
        </p>
      </div>

      {/* 차트 */}
      <ChartContainer
        config={chartConfig}
        className="h-[300px] sm:h-[400px]"
        role="img"
        aria-label="지역별 관광지 분포 차트"
      >
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          onClick={(data) => {
            if (data && data.activePayload && data.activePayload.length > 0) {
              const chartDataPoint = data.activePayload[0]
                .payload as ChartDataPoint
              handleBarClick(chartDataPoint)
            }
          }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="label"
            angle={-45}
            textAnchor="end"
            height={80}
            className="text-xs"
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis
            tickFormatter={(value) => formatNumber(value)}
            className="text-xs"
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <ChartTooltip
            content={({ active, payload }) => {
              if (!active || !payload || payload.length === 0) {
                return null
              }

              const data = payload[0].payload as ChartDataPoint
              return (
                <ChartTooltipContent>
                  <div className="space-y-2">
                    <div className="font-semibold">{data.label}</div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">관광지 개수:</span>
                      <span className="font-mono font-medium">
                        {formatNumber(data.value)}개
                      </span>
                    </div>
                    {data.percentage !== undefined && (
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-muted-foreground">비율:</span>
                        <span className="font-mono font-medium">
                          {data.percentage.toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                </ChartTooltipContent>
              )
            }}
          />
          <Bar
            dataKey="value"
            fill="var(--color-count)"
            className="cursor-pointer transition-opacity hover:opacity-80"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill="var(--color-count)" />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>

      {/* 접근성: 데이터 테이블 (스크린 리더용) */}
      <div className="sr-only">
        <table>
          <caption>지역별 관광지 분포 데이터</caption>
          <thead>
            <tr>
              <th>지역명</th>
              <th>관광지 개수</th>
              <th>비율</th>
            </tr>
          </thead>
          <tbody>
            {chartData.map((item) => (
              <tr key={item.label}>
                <td>{item.label}</td>
                <td>{formatNumber(item.value)}개</td>
                <td>
                  {item.percentage !== undefined
                    ? `${item.percentage.toFixed(1)}%`
                    : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/**
 * 지역별 분포 차트 스켈레톤 UI
 *
 * 로딩 중일 때 표시되는 스켈레톤 컴포넌트입니다.
 */
function RegionChartSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-5 w-48" />
      <Skeleton className="h-[300px] w-full sm:h-[400px]" />
    </div>
  )
}

