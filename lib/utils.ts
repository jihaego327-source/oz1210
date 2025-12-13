import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * ISO 8601 형식의 날짜를 한국어 형식으로 변환
 *
 * @param isoString - ISO 8601 형식의 날짜 문자열 (예: "2025-01-15T10:30:00.000Z")
 * @returns 한국어 형식의 날짜 문자열 (예: "2025년 1월 15일 10:30")
 *
 * @example
 * ```typescript
 * formatKoreanDateTime("2025-01-15T10:30:00.000Z")
 * // "2025년 1월 15일 10:30"
 * ```
 */
export function formatKoreanDateTime(isoString: string): string {
  const date = new Date(isoString)
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hours = date.getHours()
  const minutes = date.getMinutes().toString().padStart(2, '0')

  return `${year}년 ${month}월 ${day}일 ${hours}:${minutes}`
}
