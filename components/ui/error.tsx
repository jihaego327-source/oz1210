"use client";

import * as React from "react";
import { AlertCircle, WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorProps {
  /** 에러 제목 */
  title: string;
  /** 에러 메시지 */
  message: string;
  /** 에러 타입 */
  type?: "api" | "network" | "unknown";
  /** 재시도 함수 (선택 사항) */
  onRetry?: () => void;
  /** 추가 스타일 클래스 */
  className?: string;
}

const errorTypeConfig = {
  api: {
    icon: AlertCircle,
    defaultTitle: "API 오류",
    defaultMessage: "데이터를 불러오는 중 오류가 발생했습니다.",
  },
  network: {
    icon: WifiOff,
    defaultTitle: "네트워크 오류",
    defaultMessage: "인터넷 연결을 확인해주세요.",
  },
  unknown: {
    icon: AlertCircle,
    defaultTitle: "오류 발생",
    defaultMessage: "예기치 않은 오류가 발생했습니다.",
  },
};

/**
 * 에러 메시지 컴포넌트
 *
 * API 에러, 네트워크 에러 등 다양한 에러 상황을 표시하는 데 사용됩니다.
 * 재시도 버튼을 포함할 수 있습니다.
 *
 * @example
 * ```tsx
 * // 기본 사용
 * <Error
 *   title="데이터 로드 실패"
 *   message="관광지 정보를 불러올 수 없습니다."
 * />
 *
 * // API 에러
 * <Error
 *   type="api"
 *   title="API 오류"
 *   message="서버에 연결할 수 없습니다."
 *   onRetry={() => refetch()}
 * />
 *
 * // 네트워크 에러
 * <Error
 *   type="network"
 *   title="네트워크 오류"
 *   message="인터넷 연결을 확인해주세요."
 *   onRetry={() => window.location.reload()}
 * />
 * ```
 */
export function Error({
  title,
  message,
  type = "unknown",
  onRetry,
  className,
}: ErrorProps) {
  const config = errorTypeConfig[type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 p-8 text-center",
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-2">
        <Icon className="h-12 w-12 text-destructive" aria-hidden="true" />
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-md">{message}</p>
      </div>

      {onRetry && (
        <Button
          onClick={onRetry}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          다시 시도
        </Button>
      )}
    </div>
  );
}

