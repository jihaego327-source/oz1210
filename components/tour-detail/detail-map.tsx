/**
 * @file detail-map.tsx
 * @description 관광지 상세페이지 지도 섹션 컴포넌트
 *
 * 관광지의 위치를 네이버 지도에 표시하는 컴포넌트입니다.
 * PRD 2.4.4 지도 섹션 요구사항을 구현합니다.
 *
 * 주요 기능:
 * 1. 네이버 지도 API 초기화 및 지도 표시
 * 2. 단일 관광지 마커 표시 (해당 관광지 위치)
 * 3. 좌표 변환 (KATEC → WGS84)
 * 4. 좌표 정보 표시 (선택 사항)
 *
 * @dependencies
 * - Naver Maps JavaScript API v3 (NCP)
 * - lib/api/tour-api.ts (convertKATECToWGS84, isValidKoreanCoordinate)
 * - lib/types/tour.ts (TourDetail)
 * - components/ui/card.tsx
 * - lucide-react (MapPin)
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import {
  convertKATECToWGS84,
  isValidKoreanCoordinate,
} from '@/lib/api/tour-api';
import type { TourDetail } from '@/lib/types/tour';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type {
  NaverMap,
  NaverMarker,
  NaverInfoWindow,
  NaverMaps,
} from '@/lib/types/naver-maps';

interface DetailMapProps {
  /** 관광지 상세 정보 */
  detail: TourDetail;
}

/**
 * 관광지 상세페이지 지도 섹션 컴포넌트
 */
export default function DetailMap({ detail }: DetailMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<NaverMap | null>(null);
  const markerRef = useRef<NaverMarker | null>(null);
  const infoWindowRef = useRef<NaverInfoWindow | null>(null);
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  const [coordinates, setCoordinates] = useState<{
    lng: number;
    lat: number;
  } | null>(null);

  // 좌표 검증 및 변환
  useEffect(() => {
    // 좌표가 없거나 '0'인 경우 처리
    if (
      !detail.mapx ||
      !detail.mapy ||
      detail.mapx === '0' ||
      detail.mapy === '0'
    ) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[DetailMap] 좌표가 없습니다:', {
          mapx: detail.mapx,
          mapy: detail.mapy,
        });
      }
      return;
    }

    try {
      // 좌표 변환 (KATEC → WGS84)
      const coord = convertKATECToWGS84(detail.mapx, detail.mapy);

      // 한국 영역 범위 검증
      if (!isValidKoreanCoordinate(coord.lng, coord.lat)) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[DetailMap] 한국 영역 범위를 벗어난 좌표:', coord);
        }
        return;
      }

      setCoordinates(coord);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[DetailMap] 좌표 변환 실패:', error);
      }
    }
  }, [detail.mapx, detail.mapy]);

  // 지도 초기화
  useEffect(() => {
    if (!mapRef.current || mapInstance.current || !coordinates) return;

    function initializeMap() {
      if (!mapRef.current || mapInstance.current || !coordinates) return;

      const naver = window.naver;
      if (!naver?.maps) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[DetailMap] naver.maps가 아직 로드되지 않았습니다.');
        }
        return;
      }

      // 지도 중심 좌표 설정
      const center = new naver.maps.LatLng(coordinates.lat, coordinates.lng);

      // 지도 옵션 설정
      const mapOptions = {
        center,
        zoom: 15, // 상세페이지는 줌 레벨을 높게 설정
        mapTypeControl: true,
        zoomControl: true,
        scaleControl: true,
        zoomControlOptions: {
          position: 'TOP_RIGHT',
        },
      };

      // 지도 생성
      mapInstance.current = new naver.maps.Map(mapRef.current, mapOptions);
      setIsMapInitialized(true);

      if (process.env.NODE_ENV === 'development') {
        console.log('[DetailMap] 지도 초기화 완료', { coordinates });
      }
    }

    // 이미 로드된 경우 즉시 초기화
    if (typeof window !== 'undefined' && (window as any).naver?.maps) {
      initializeMap();
      return;
    }

    // API 로드 완료 이벤트 리스너 등록
    const handleNaverMapsLoaded = () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('[DetailMap] 네이버 지도 API 로드 완료');
      }
      initializeMap();
    };

    window.addEventListener('naver-maps-loaded', handleNaverMapsLoaded);

    // 타임아웃 설정 (5초 이상 로드 안 되면 폴백으로 setInterval 사용)
    const timeout = setTimeout(() => {
      if (!mapInstance.current && typeof window !== 'undefined') {
        if (process.env.NODE_ENV === 'development') {
          console.warn(
            '[DetailMap] API 로드 이벤트 타임아웃, 폴백 방식으로 확인 시작'
          );
        }
        const checkNaverMapsLoaded = setInterval(() => {
          if ((window as any).naver?.maps) {
            clearInterval(checkNaverMapsLoaded);
            initializeMap();
          }
        }, 100);

        // 폴백도 5초 후 중단
        setTimeout(() => clearInterval(checkNaverMapsLoaded), 5000);
      }
    }, 5000);

    return () => {
      window.removeEventListener('naver-maps-loaded', handleNaverMapsLoaded);
      clearTimeout(timeout);
    };
  }, [coordinates]);

  // 마커 생성
  useEffect(() => {
    if (!mapInstance.current || !isMapInitialized || !coordinates) return;

    const naver = window.naver;
    if (!naver?.maps) return;

    // 기존 마커 제거
    if (markerRef.current) {
      markerRef.current.setMap(null);
      markerRef.current = null;
    }

    // 기존 인포윈도우 닫기
    if (infoWindowRef.current) {
      infoWindowRef.current.close();
      infoWindowRef.current = null;
    }

    // 마커 생성
    const marker = new naver.maps.Marker({
      position: new naver.maps.LatLng(coordinates.lat, coordinates.lng),
      title: detail.title,
      map: mapInstance.current,
    });

    markerRef.current = marker;

    // 인포윈도우 생성 및 표시
    const address = [detail.addr1, detail.addr2].filter(Boolean).join(' ');
    const infoContent = `
      <div style="padding: 12px; width: 250px; font-family: Arial, sans-serif;">
        <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">${detail.title}</h3>
        ${address ? `<p style="margin: 0 0 8px 0; font-size: 12px; color: #666;">📍 ${address}</p>` : ''}
      </div>
    `;

    infoWindowRef.current = new naver.maps.InfoWindow({
      content: infoContent,
      borderColor: '#1f6b8f',
      borderWidth: 2,
    });

    infoWindowRef.current.open(mapInstance.current, marker);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMapInitialized, coordinates, detail.title, detail.addr1, detail.addr2]);

  // 좌표가 없거나 유효하지 않은 경우 null 반환 (섹션 숨김)
  if (!coordinates) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle id="detail-map-title" className="flex items-center gap-2 text-xl sm:text-2xl">
          <MapPin className="h-5 w-5" aria-hidden="true" />
          위치 정보
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        {/* 지도 컨테이너 */}
        <div
          ref={mapRef}
          className="w-full h-[300px] sm:h-[400px] md:h-[600px] rounded-lg overflow-hidden"
          aria-label={`${detail.title} 위치 지도`}
          role="application"
          aria-roledescription="지도"
        />

        {/* 좌표 정보 */}
        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" aria-hidden="true" />
          <span className="break-all">
            경도: {coordinates.lng.toFixed(6)}, 위도: {coordinates.lat.toFixed(6)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

