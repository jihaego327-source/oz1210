import type { NextConfig } from "next";

/**
 * Next.js 이미지 최적화 설정
 * 
 * 한국관광공사 API에서 제공하는 이미지 URL 도메인:
 * - firstimage, firstimage2: 관광지 대표 이미지
 * - originimgurl, smallimageurl: 갤러리 이미지
 * 
 * 일반적으로 사용되는 도메인:
 * - tong.visitkorea.or.kr (가장 많이 사용)
 * - www.visitkorea.or.kr
 * - api.visitkorea.or.kr
 * 
 * 이미지 로딩 실패 시 개발자 도구에서 실제 이미지 URL 도메인을 확인하고
 * 필요시 추가 도메인을 remotePatterns에 추가하세요.
 */
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: "img.clerk.com" }, // Clerk 프로필 이미지
      { hostname: "www.visitkorea.or.kr" }, // 한국관광공사 메인 도메인
      { hostname: "tong.visitkorea.or.kr" }, // 한국관광공사 이미지 CDN (가장 많이 사용)
      { hostname: "api.visitkorea.or.kr" }, // 한국관광공사 API 이미지
      { hostname: "naver.com" }, // 네이버 지도 정적 리소스
      { hostname: "map.naver.com" }, // 네이버 지도 이미지
    ],
  },
};

export default nextConfig;
