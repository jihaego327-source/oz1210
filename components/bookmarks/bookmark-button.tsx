/**
 * @file bookmark-button.tsx
 * @description 관광지 상세페이지 북마크 버튼 컴포넌트
 *
 * 관광지를 북마크(즐겨찾기)로 추가하거나 제거하는 기능을 제공합니다.
 * PRD 2.4.5 북마크 기능 요구사항을 구현합니다.
 *
 * 주요 기능:
 * 1. 별 아이콘 표시 (채워짐/비어있음)
 * 2. 북마크 상태 확인 및 표시
 * 3. 북마크 추가/제거 기능
 * 4. Clerk 인증 확인
 * 5. 로그인하지 않은 경우 처리
 *
 * @dependencies
 * - components/ui/button.tsx (shadcn/ui)
 * - lucide-react (Star 아이콘)
 * - sonner (toast 메시지)
 * - @clerk/nextjs (useUser, SignInButton)
 * - lib/api/supabase-api.ts (북마크 API 함수들)
 * - lib/supabase/clerk-client.ts (useClerkSupabaseClient)
 */

'use client';

import { useState, useEffect } from 'react';
import { useUser, SignInButton } from '@clerk/nextjs';
import { toast } from 'sonner';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import {
  getSupabaseUserId,
  getBookmark,
  addBookmark,
  removeBookmark,
} from '@/lib/api/supabase-api';

interface BookmarkButtonProps {
  /** 한국관광공사 API contentid (예: "125266") */
  contentId: string;
  /** 관광지명 (토스트 메시지에 사용) */
  title?: string;
  /** 버튼 크기 (기본값: default) */
  size?: 'default' | 'sm' | 'lg' | 'icon';
  /** 버튼 variant (기본값: ghost) */
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
}

/**
 * 관광지 상세페이지 북마크 버튼 컴포넌트
 *
 * 사용자가 관광지를 북마크로 추가하거나 제거할 수 있는 버튼입니다.
 * 로그인하지 않은 경우 로그인 유도를 표시합니다.
 *
 * @example
 * ```tsx
 * <BookmarkButton contentId="125266" title="경복궁" />
 * ```
 */
export default function BookmarkButton({
  contentId,
  title = '관광지',
  size = 'default',
  variant = 'ghost',
}: BookmarkButtonProps) {
  const { user, isLoaded } = useUser();
  const supabase = useClerkSupabaseClient();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);

  /**
   * 북마크 상태 확인
   */
  useEffect(() => {
    async function checkBookmarkStatus() {
      if (!isLoaded || !user) {
        setIsLoading(false);
        return;
      }

      try {
        // Supabase user_id 조회
        const userId = await getSupabaseUserId(supabase, user.id);
        if (!userId) {
          setIsLoading(false);
          return;
        }

        // 북마크 상태 확인
        const bookmark = await getBookmark(supabase, userId, contentId);
        setIsBookmarked(!!bookmark);
      } catch (error) {
        console.error('북마크 상태 확인 실패:', error);
      } finally {
        setIsLoading(false);
      }
    }

    checkBookmarkStatus();
  }, [isLoaded, user, supabase, contentId]);

  /**
   * 북마크 토글 핸들러
   */
  const handleToggleBookmark = async () => {
    if (!user || !isLoaded) {
      return;
    }

    if (isToggling) {
      return;
    }

    try {
      setIsToggling(true);

      // Supabase user_id 조회
      const userId = await getSupabaseUserId(supabase, user.id);
      if (!userId) {
        toast.error('사용자 정보를 찾을 수 없습니다');
        return;
      }

      if (isBookmarked) {
        // 북마크 제거
        const success = await removeBookmark(supabase, userId, contentId);
        if (success) {
          setIsBookmarked(false);
          toast.success(`${title} 북마크가 제거되었습니다`);
        } else {
          toast.error('북마크 제거에 실패했습니다');
        }
      } else {
        // 북마크 추가
        const bookmark = await addBookmark(supabase, userId, contentId);
        if (bookmark) {
          setIsBookmarked(true);
          toast.success(`${title} 북마크에 추가되었습니다`);
        } else {
          toast.error('북마크 추가에 실패했습니다');
        }
      }
    } catch (error) {
      console.error('북마크 토글 실패:', error);
      toast.error('북마크 처리 중 오류가 발생했습니다');
    } finally {
      setIsToggling(false);
    }
  };

  // 로그인하지 않은 경우
  if (!isLoaded || !user) {
    return (
      <SignInButton mode="modal">
        <Button
          variant={variant}
          size={size}
          aria-label="북마크하려면 로그인하세요"
          className="gap-2"
        >
          <Star className="h-4 w-4" aria-hidden="true" />
          <span>북마크</span>
        </Button>
      </SignInButton>
    );
  }

  // 로딩 중
  if (isLoading) {
    return (
      <Button
        variant={variant}
        size={size}
        disabled
        aria-label="북마크 상태 확인 중"
        className="gap-2"
      >
        <Star className="h-4 w-4 opacity-50" aria-hidden="true" />
        <span>북마크</span>
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggleBookmark}
      disabled={isToggling}
      aria-label={
        isBookmarked
          ? `${title} 북마크 제거`
          : `${title} 북마크 추가`
      }
      className="gap-2"
    >
      <Star
        className={`h-4 w-4 transition-all ${
          isBookmarked
            ? 'fill-yellow-400 text-yellow-400'
            : 'text-muted-foreground'
        }`}
        aria-hidden="true"
      />
      <span>{isBookmarked ? '북마크됨' : '북마크'}</span>
    </Button>
  );
}

