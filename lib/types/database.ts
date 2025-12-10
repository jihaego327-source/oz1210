/**
 * @file database.ts
 * @description Supabase 데이터베이스 타입 정의
 *
 * Supabase users, bookmarks 테이블의 TypeScript 타입을 정의합니다.
 * db.sql 마이그레이션 파일을 기반으로 작성되었습니다.
 *
 * @see {@link ../../supabase/migrations/db.sql | 데이터베이스 스키마}
 * @see {@link ../PRD.md | PRD 문서 - 섹션 2.4.5 (북마크 기능)}
 */

/**
 * 사용자 정보 (users 테이블)
 * Clerk 인증과 연동되는 사용자 정보를 저장하는 테이블
 */
export interface User {
  /** 사용자 고유 ID (UUID) */
  id: string;
  /** Clerk User ID (예: user_2abc...) - UNIQUE 제약 */
  clerk_id: string;
  /** 사용자 이름 */
  name: string;
  /** 생성일시 (ISO 8601 형식) */
  created_at: string;
}

/**
 * 북마크 정보 (bookmarks 테이블)
 * 사용자가 관광지를 북마크할 수 있는 기능
 * 각 사용자는 동일한 관광지를 한 번만 북마크 가능 (UNIQUE 제약)
 */
export interface Bookmark {
  /** 북마크 고유 ID (UUID) */
  id: string;
  /** 사용자 ID (users 테이블 참조) */
  user_id: string;
  /** 한국관광공사 API contentid (예: 125266) */
  content_id: string;
  /** 생성일시 (ISO 8601 형식) */
  created_at: string;
}

/**
 * 북마크 + 관광지 정보 조인 타입
 * 북마크 목록 조회 시 관광지 정보를 함께 가져올 때 사용
 */
export interface BookmarkWithTour {
  /** 북마크 정보 */
  bookmark: Bookmark;
  /** 관광지 정보 */
  tour: import('./tour').TourItem;
}

/**
 * 사용자 + 북마크 목록 조인 타입
 * 사용자 정보와 함께 북마크 목록을 가져올 때 사용
 */
export interface UserWithBookmarks {
  /** 사용자 정보 */
  user: User;
  /** 북마크 목록 */
  bookmarks: Bookmark[];
}

/**
 * 북마크 생성 입력 타입
 * 북마크를 생성할 때 필요한 필드만 포함
 */
export interface CreateBookmarkInput {
  /** 사용자 ID */
  user_id: string;
  /** 한국관광공사 API contentid */
  content_id: string;
}

/**
 * 북마크 API 응답 타입
 * 북마크 관련 API 응답에 사용
 */
export interface BookmarkResponse {
  /** 성공 여부 */
  success: boolean;
  /** 북마크 정보 (성공 시) */
  bookmark?: Bookmark;
  /** 에러 메시지 (실패 시) */
  error?: string;
}

