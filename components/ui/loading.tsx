"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingProps {
  /** 크기 변형 */
  size?: "sm" | "md" | "lg";
  /** 로딩 텍스트 (선택 사항) */
  text?: string;
  /** 추가 스타일 클래스 */
  className?: string;
  /** 전체 화면 오버레이 여부 */
  fullScreen?: boolean;
}

const sizeMap = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
};

const textSizeMap = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
};

/**
 * 로딩 스피너 컴포넌트
 *
 * API 호출 중, 지도 로딩 등 다양한 로딩 상태를 표시하는 데 사용됩니다.
 *
 * @example
 * ```tsx
 * // 기본 사용
 * <Loading />
 *
 * // 텍스트와 함께
 * <Loading text="로딩 중..." />
 *
 * // 전체 화면 오버레이
 * <Loading fullScreen text="데이터를 불러오는 중..." />
 *
 * // 크기 지정
 * <Loading size="lg" text="처리 중..." />
 * ```
 */
export function Loading({
  size = "md",
  text,
  className,
  fullScreen = false,
}: LoadingProps) {
  const content = (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2",
        className
      )}
    >
      <Loader2
        className={cn(
          "animate-spin text-muted-foreground",
          sizeMap[size]
        )}
        aria-hidden="true"
      />
      {text && (
        <p className={cn("text-muted-foreground", textSizeMap[size])}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return content;
}

