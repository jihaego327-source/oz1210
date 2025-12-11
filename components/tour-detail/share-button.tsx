/**
 * @file share-button.tsx
 * @description 관광지 상세페이지 공유 버튼 컴포넌트
 *
 * 관광지 상세페이지의 URL을 클립보드에 복사하는 기능을 제공합니다.
 * PRD 2.4.5 공유 기능 요구사항을 구현합니다.
 *
 * 주요 기능:
 * 1. 현재 페이지 URL 복사 (클립보드 API)
 * 2. HTTPS 환경 확인 (클립보드 API는 HTTPS에서만 동작)
 * 3. 복사 완료 토스트 메시지
 * 4. 복사 상태 표시 (Share/Check 아이콘 전환)
 *
 * @dependencies
 * - components/ui/button.tsx (shadcn/ui)
 * - lucide-react (Share, Check 아이콘)
 * - sonner (toast 메시지)
 * - next/navigation (usePathname)
 */

'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { Share, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ShareButtonProps {
  /** 공유할 관광지명 (토스트 메시지에 사용) */
  title?: string;
  /** 버튼 크기 (기본값: default) */
  size?: 'default' | 'sm' | 'lg' | 'icon';
  /** 버튼 variant (기본값: outline) */
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
}

/**
 * 관광지 상세페이지 공유 버튼 컴포넌트
 *
 * 현재 페이지 URL을 클립보드에 복사하고, 복사 완료 토스트를 표시합니다.
 * HTTPS 환경이 아닌 경우 에러 메시지를 표시합니다.
 *
 * @example
 * ```tsx
 * <ShareButton title="경복궁" />
 * ```
 */
export default function ShareButton({
  title = '관광지',
  size = 'default',
  variant = 'outline',
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const pathname = usePathname();

  /**
   * URL 복사 핸들러
   *
   * 현재 페이지의 절대 URL을 생성하여 클립보드에 복사합니다.
   * HTTPS 환경이 아닌 경우 에러를 표시합니다.
   */
  const handleShare = async () => {
    try {
      // HTTPS 환경 확인 (localhost는 예외)
      const isSecure =
        typeof window !== 'undefined' &&
        (window.location.protocol === 'https:' ||
          window.location.hostname === 'localhost' ||
          window.location.hostname === '127.0.0.1');

      if (!isSecure) {
        toast.error('HTTPS 환경에서만 공유 기능을 사용할 수 있습니다');
        return;
      }

      // 절대 URL 생성
      const baseUrl =
        typeof window !== 'undefined'
          ? `${window.location.protocol}//${window.location.host}`
          : '';
      const url = `${baseUrl}${pathname}`;

      // 클립보드에 복사
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success(`${title} 링크가 클립보드에 복사되었습니다`);

      // 2초 후 복사 상태 초기화
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      // 클립보드 API 실패 시 에러 처리
      toast.error('링크 복사에 실패했습니다');
      console.error('링크 복사 실패:', error);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleShare}
      aria-label={copied ? '링크가 복사되었습니다' : '링크 공유하기'}
      className="gap-2"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4" aria-hidden="true" />
          <span>복사됨</span>
        </>
      ) : (
        <>
          <Share className="h-4 w-4" aria-hidden="true" />
          <span>공유</span>
        </>
      )}
    </Button>
  );
}

