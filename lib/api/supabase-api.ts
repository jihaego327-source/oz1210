/**
 * @file supabase-api.ts
 * @description Supabase 북마크 API 함수
 *
 * 북마크 관련 Supabase 쿼리 함수들을 제공합니다.
 * Clerk 인증과 Supabase를 연동하여 사용자별 북마크를 관리합니다.
 *
 * 주요 기능:
 * 1. Clerk user ID를 Supabase user_id로 변환
 * 2. 북마크 조회, 추가, 제거, 목록 조회
 *
 * @dependencies
 * - lib/supabase/clerk-client.ts (useClerkSupabaseClient)
 * - lib/types/database.ts (Bookmark, User 타입)
 * - @supabase/supabase-js (SupabaseClient 타입)
 *
 * @see {@link ../supabase/migrations/db.sql | 데이터베이스 스키마}
 * @see {@link ../PRD.md | PRD 문서 - 섹션 2.4.5 (북마크 기능)}
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Bookmark, User } from '@/lib/types/database';

/**
 * Clerk user ID로 Supabase users 테이블에서 user_id 조회
 *
 * @param supabase - Supabase 클라이언트 인스턴스
 * @param clerkId - Clerk User ID (예: user_2abc...)
 * @returns Supabase user_id (UUID) 또는 null (사용자를 찾을 수 없는 경우)
 *
 * @example
 * ```ts
 * const supabase = useClerkSupabaseClient();
 * const userId = await getSupabaseUserId(supabase, user.id);
 * if (userId) {
 *   // 북마크 추가/조회 등
 * }
 * ```
 */
export async function getSupabaseUserId(
  supabase: SupabaseClient,
  clerkId: string
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', clerkId)
      .single();

    if (error) {
      // 사용자를 찾을 수 없는 경우 (PGRST116: no rows returned)
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data?.id || null;
  } catch (error) {
    // 에러 로깅 (구조화된 로깅)
    console.error('Supabase user ID 조회 실패:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      clerkId,
      timestamp: new Date().toISOString(),
    });
    return null;
  }
}

/**
 * 특정 관광지의 북마크 상태 확인
 *
 * @param supabase - Supabase 클라이언트 인스턴스
 * @param userId - Supabase user_id (UUID)
 * @param contentId - 한국관광공사 API contentid (예: "125266")
 * @returns 북마크 정보 또는 null (북마크가 없는 경우)
 *
 * @example
 * ```ts
 * const bookmark = await getBookmark(supabase, userId, "125266");
 * if (bookmark) {
 *   console.log('북마크됨:', bookmark);
 * }
 * ```
 */
export async function getBookmark(
  supabase: SupabaseClient,
  userId: string,
  contentId: string
): Promise<Bookmark | null> {
  try {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', userId)
      .eq('content_id', contentId)
      .single();

    if (error) {
      // 북마크가 없는 경우 (PGRST116: no rows returned)
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data as Bookmark;
  } catch (error) {
    // 에러 로깅 (구조화된 로깅)
    console.error('북마크 조회 실패:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId,
      contentId,
      timestamp: new Date().toISOString(),
    });
    return null;
  }
}

/**
 * 북마크 추가
 *
 * @param supabase - Supabase 클라이언트 인스턴스
 * @param userId - Supabase user_id (UUID)
 * @param contentId - 한국관광공사 API contentid (예: "125266")
 * @returns 생성된 북마크 정보 또는 null (실패 시)
 *
 * @example
 * ```ts
 * const bookmark = await addBookmark(supabase, userId, "125266");
 * if (bookmark) {
 *   console.log('북마크 추가됨:', bookmark);
 * }
 * ```
 */
export async function addBookmark(
  supabase: SupabaseClient,
  userId: string,
  contentId: string
): Promise<Bookmark | null> {
  try {
    const { data, error } = await supabase
      .from('bookmarks')
      .insert({
        user_id: userId,
        content_id: contentId,
      })
      .select()
      .single();

    if (error) {
      // UNIQUE 제약 위반 (중복 북마크 시도)
      if (error.code === '23505') {
        // 이미 북마크된 경우, 기존 북마크 반환
        return await getBookmark(supabase, userId, contentId);
      }
      throw error;
    }

    return data as Bookmark;
  } catch (error) {
    // 에러 로깅 (구조화된 로깅)
    console.error('북마크 추가 실패:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId,
      contentId,
      timestamp: new Date().toISOString(),
    });
    return null;
  }
}

/**
 * 북마크 제거
 *
 * @param supabase - Supabase 클라이언트 인스턴스
 * @param userId - Supabase user_id (UUID)
 * @param contentId - 한국관광공사 API contentid (예: "125266")
 * @returns 성공 여부
 *
 * @example
 * ```ts
 * const success = await removeBookmark(supabase, userId, "125266");
 * if (success) {
 *   console.log('북마크 제거됨');
 * }
 * ```
 */
export async function removeBookmark(
  supabase: SupabaseClient,
  userId: string,
  contentId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('user_id', userId)
      .eq('content_id', contentId);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    // 에러 로깅 (구조화된 로깅)
    console.error('북마크 제거 실패:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId,
      contentId,
      timestamp: new Date().toISOString(),
    });
    return false;
  }
}

/**
 * 사용자의 모든 북마크 목록 조회
 *
 * @param supabase - Supabase 클라이언트 인스턴스
 * @param userId - Supabase user_id (UUID)
 * @returns 북마크 목록 (최신순 정렬)
 *
 * @example
 * ```ts
 * const bookmarks = await getUserBookmarks(supabase, userId);
 * console.log('북마크 개수:', bookmarks.length);
 * ```
 */
export async function getUserBookmarks(
  supabase: SupabaseClient,
  userId: string
): Promise<Bookmark[]> {
  try {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (data || []) as Bookmark[];
  } catch (error) {
    // 에러 로깅 (구조화된 로깅)
    console.error('북마크 목록 조회 실패:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId,
      timestamp: new Date().toISOString(),
    });
    return [];
  }
}

