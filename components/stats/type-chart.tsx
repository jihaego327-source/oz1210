/**
 * @file type-chart.tsx
 * @description 타입별 관광지 분포 Donut Chart 컴포넌트
 *
 * 통계 대시보드 페이지에서 타입별 관광지 개수를 Donut Chart로 시각화합니다.
 * PRD.md 섹션 2.6.2 (관광 타입별 분포)를 기반으로 작성되었습니다.
 *
 * 주요 기능:
 * 1. 타입별 관광지 개수 Donut Chart 표시
 * 2. 섹션 클릭 시 해당 타입의 관광지 목록 페이지로 이동
 * 3. 호버 시 툴팁 표시 (타입명, 개수, 비율)
 * 4. 반응형 디자인 (모바일/태블릿/데스크톱)
 * 5. 로딩 상태 (Skeleton UI)
 * 6. 에러 처리
 * 7. 접근성 (ARIA 라벨, 스크린 리더용 데이터 테이블)
 *
 * @dependencies
 * - shadcn/ui Chart 컴포넌트 (recharts 기반)
 * - lucide-react 아이콘
 * - lib/types/stats.ts (TypeStats, DonutChartDataPoint 타입)
 *
 * @see {@link ../PRD.md | PRD 문서 - 섹션 2.6.2 (관광 타입별 분포)}
 */

'use client'

import { useRouter } from 'next/navigation'
import { Pie, PieChart, Cell } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
} from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'
import { Tag } from 'lucide-react'
import type { TypeStats, DonutChartDataPoint } from '@/lib/types/stats'

interface TypeChartProps {
  /** 타입별 통계 데이터 */
  data: TypeStats[] | null
  /** 로딩 상태 */
  isLoading?: boolean
  /** 에러 메시지 */
  error?: string | null
}

/**
 * 차트 색상 배열 (chart-1 ~ chart-8)
 */
const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--chart-1))', // 6번째부터 반복
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
] as const

/**
 * TypeStats 배열을 DonutChartDataPoint 배열로 변환
 *
 * @param typeStats - 타입별 통계 데이터
 * @returns 차트 데이터 포인트 배열
 */
function transformTypeStatsToChartData(
  typeStats: TypeStats[]
): DonutChartDataPoint[] {
  // 정렬: 관광지 개수 기준 내림차순
  const sorted = [...typeStats].sort((a, b) => b.count - a.count)

  // DonutChartDataPoint로 변환
  return sorted.map((type, index) => ({
    name: type.typeName,
    value: type.count,
    percentage: type.percentage,
    contentTypeId: type.contentTypeId,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }))
}

/**
 * 타입별 관광지 분포 Donut Chart 컴포넌트
 *
 * 타입별 관광지 개수를 Donut Chart로 시각화하고, 섹션 클릭 시 해당 타입의
 * 관광지 목록 페이지로 이동합니다.
 *
 * @param props - 컴포넌트 props
 * @param props.data - 타입별 통계 데이터
 * @param props.isLoading - 로딩 상태 (기본값: false)
 * @param props.error - 에러 메시지
 *
 * @example
 * ```tsx
 * const typeStats = await getTypeStats()
 * <TypeChart data={typeStats} />
 * ```
 */
export default function TypeChart({
  data,
  isLoading = false,
  error,
}: TypeChartProps) {
  const router = useRouter()

  // 에러 상태
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
        <div className="text-destructive">
          <Tag className="h-12 w-12" />
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
    return <TypeChartSkeleton />
  }

  // 데이터 변환
  const chartData = transformTypeStatsToChartData(data)

  // 숫자 포맷팅 (천 단위 구분)
  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('ko-KR').format(num)
  }

  // 섹션 클릭 핸들러
  const handlePieClick = (data: DonutChartDataPoint) => {
    if (data.contentTypeId) {
      router.push(`/?contentTypeIds=${data.contentTypeId}`)
    }
  }

  // 차트 설정 (타입별 색상 정의)
  const chartConfig: Record<string, { label: string; color: string }> = {}
  chartData.forEach((item, index) => {
    chartConfig[item.contentTypeId] = {
      label: item.name,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }
  })

  return (
    <div className="space-y-4">
      {/* 차트 제목 및 설명 */}
      <div className="flex items-center gap-2">
        <Tag className="h-5 w-5 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          전체 {chartData.length}개 타입 표시
        </p>
      </div>

      {/* 차트 */}
      <ChartContainer
        config={chartConfig}
        className="h-[300px] sm:h-[400px]"
        role="img"
        aria-label="타입별 관광지 분포 차트"
      >
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius="60%"
            outerRadius="90%"
            paddingAngle={2}
            startAngle={90}
            endAngle={-270}
            onClick={(data) => {
              handlePieClick(data as DonutChartDataPoint)
            }}
            className="cursor-pointer transition-opacity hover:opacity-80"
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]}
              />
            ))}
          </Pie>
          <ChartTooltip
            content={({ active, payload }) => {
              if (!active || !payload || payload.length === 0) {
                return null
              }

              // PieChart의 payload 구조에 맞게 안전하게 데이터 추출
              const payloadItem = payload[0]
              if (!payloadItem) {
                return null
              }

              // payload[0].payload가 있으면 사용, 없으면 payload[0] 자체 사용
              const data = (payloadItem.payload || payloadItem) as DonutChartDataPoint

              // 데이터 유효성 검사
              if (!data || (!data.name && !data.value)) {
                return null
              }

              return (
                <div className="border-border/50 bg-background grid min-w-[8rem] items-start gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs shadow-xl">
                  <div className="space-y-2">
                    <div className="font-semibold">{data.name || '알 수 없음'}</div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">관광지 개수:</span>
                      <span className="font-mono font-medium">
                        {formatNumber(data.value || 0)}개
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
                </div>
              )
            }}
          />
        </PieChart>
      </ChartContainer>

      {/* 접근성: 데이터 테이블 (스크린 리더용) */}
      <div className="sr-only">
        <table>
          <caption>타입별 관광지 분포 데이터</caption>
          <thead>
            <tr>
              <th>타입명</th>
              <th>관광지 개수</th>
              <th>비율</th>
            </tr>
          </thead>
          <tbody>
            {chartData.map((item) => (
              <tr key={item.contentTypeId}>
                <td>{item.name}</td>
                <td>{formatNumber(item.value)}개</td>
                <td>{item.percentage.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/**
 * 타입별 분포 차트 스켈레톤 UI
 *
 * 로딩 중일 때 표시되는 스켈레톤 컴포넌트입니다.
 */
function TypeChartSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-5 w-48" />
      <Skeleton className="h-[300px] w-full rounded-full sm:h-[400px]" />
    </div>
  )
}

