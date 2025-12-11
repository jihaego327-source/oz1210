/**
 * @file naver-map-script.tsx
 * @description 네이버 지도 API 스크립트 로드 컴포넌트
 *
 * Naver Maps JavaScript API v3 (NCP) 스크립트를 로드하는 Client Component입니다.
 * Server Component에서 이벤트 핸들러를 직접 전달할 수 없으므로,
 * 별도의 Client Component로 분리하여 구현합니다.
 *
 * @dependencies
 * - next/script
 */

'use client';

import Script from 'next/script';

/**
 * 네이버 지도 API 스크립트 로드 컴포넌트
 *
 * @example
 * ```tsx
 * <NaverMapScript />
 * ```
 */
export default function NaverMapScript() {
  const ncpClientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;

  if (!ncpClientId) {
    console.error(
      'NEXT_PUBLIC_NAVER_MAP_CLIENT_ID 환경변수가 설정되지 않았습니다.'
    );
    return null;
  }

  return (
    <Script
      src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${ncpClientId}`}
      strategy="afterInteractive"
      onLoad={() => {
        // API 로드 완료 이벤트 발생
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('naver-maps-loaded'));
        }
      }}
    />
  );
}

