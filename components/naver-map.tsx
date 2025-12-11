/**
 * @file naver-map.tsx
 * @description 네이버 지도 컴포넌트
 *
 * Naver Maps JavaScript API v3 (NCP)를 사용하여 지도를 표시하고,
 * 관광지 목록을 마커로 표시합니다.
 *
 * 주요 기능:
 * 1. 지도 초기화 및 표시
 * 2. 관광지 마커 표시 (좌표 변환 포함)
 * 3. 마커 클릭 시 인포윈도우 표시
 * 4. 선택된 마커 강조
 *
 * @dependencies
 * - Naver Maps JavaScript API v3 (NCP)
 * - lib/api/tour-api.ts (convertKATECToWGS84)
 * - lib/types/tour.ts (TourItem)
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  convertKATECToWGS84,
  isValidKoreanCoordinate,
} from '@/lib/api/tour-api';
import type { TourItem } from '@/lib/types/tour';
import { Button } from '@/components/ui/button';
import { Navigation } from 'lucide-react';
import type {
  NaverMap,
  NaverMarker,
  NaverInfoWindow,
  NaverMaps,
  NaverIcon,
  NaverSize,
  NaverPoint,
} from '@/lib/types/naver-maps';

interface NaverMapProps {
  /** 관광지 목록 */
  tours: TourItem[];
  /** 선택된 관광지 ID */
  selectedTourId?: string | null;
  /** 호버된 관광지 ID */
  hoveredTourId?: string | null;
  /** 마커 클릭 콜백 */
  onMarkerClick?: (tour: TourItem) => void;
}

/**
 * 네이버 지도 컴포넌트
 */
export function NaverMap({
  tours,
  selectedTourId,
  hoveredTourId,
  onMarkerClick,
}: NaverMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<NaverMap | null>(null);
  const markersRef = useRef<Map<string, NaverMarker>>(new Map());
  const infoWindowRef = useRef<NaverInfoWindow | null>(null);
  const currentLocationMarkerRef = useRef<NaverMarker | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isMapInitialized, setIsMapInitialized] = useState(false);

  /**
   * 관광지 목록의 평균 좌표 계산
   */
  const calculateCenter = useCallback((): { lat: number; lng: number } | null => {
    if (tours.length === 0) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[calculateCenter] tours가 비어있음');
      }
      return null;
    }

    const validTours = tours.filter(
      (tour) => tour.mapx && tour.mapy && tour.mapx !== '0' && tour.mapy !== '0'
    );

    if (validTours.length === 0) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[calculateCenter] 유효한 좌표가 있는 관광지가 없음');
      }
      return null;
    }

    const coords = validTours
      .map((tour) => convertKATECToWGS84(tour.mapx, tour.mapy))
      .filter((coord) => isValidKoreanCoordinate(coord.lng, coord.lat));

    if (coords.length === 0) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[calculateCenter] 검증을 통과한 좌표가 없음', {
          totalTours: tours.length,
          validTours: validTours.length,
          skipped: validTours.length,
        });
      }
      return null;
    }

    const avgLat = coords.reduce((sum, coord) => sum + coord.lat, 0) / coords.length;
    const avgLng = coords.reduce((sum, coord) => sum + coord.lng, 0) / coords.length;

    if (process.env.NODE_ENV === 'development') {
      console.log('[calculateCenter] 중심 좌표 계산 완료', {
        totalTours: tours.length,
        validTours: validTours.length,
        validCoords: coords.length,
        center: { lat: avgLat, lng: avgLng },
      });
    }

    return { lat: avgLat, lng: avgLng };
  }, [tours]);

  // 지도 초기화 (한 번만 실행)
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    function initializeMap() {
      if (!mapRef.current || mapInstance.current) return;

      const naver = window.naver;
      if (!naver?.maps) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[NaverMap] naver.maps가 아직 로드되지 않았습니다.');
        }
        return;
      }

      // 중심 좌표 결정 (관광지 목록의 평균 좌표 또는 기본값)
      const centerCoord = calculateCenter();
      const center = centerCoord
        ? new naver.maps.LatLng(centerCoord.lat, centerCoord.lng)
        : new naver.maps.LatLng(37.5665, 126.978); // 서울 기본값

      // ✅ Step 2: 지도 옵션 설정
      const mapOptions = {
        center,
        zoom: centerCoord ? 11 : 10, // 관광지가 있으면 줌 11, 없으면 10
        mapTypeControl: true,
        zoomControl: true,
        scaleControl: true,
        // ✅ 안전한 방식: 문자열로 position 지정
        zoomControlOptions: {
          position: 'TOP_RIGHT', // ← 문자열 사용!
        },
      };

      // ✅ Step 3: 지도 생성
      mapInstance.current = new naver.maps.Map(mapRef.current, mapOptions);
      setIsMapInitialized(true); // 초기화 완료 표시
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[NaverMap] 지도 초기화 완료');
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
        console.log('[NaverMap] 네이버 지도 API 로드 완료');
      }
      initializeMap();
    };

    window.addEventListener('naver-maps-loaded', handleNaverMapsLoaded);

    // 타임아웃 설정 (5초 이상 로드 안 되면 폴백으로 setInterval 사용)
    const timeout = setTimeout(() => {
      if (!mapInstance.current && typeof window !== 'undefined') {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[NaverMap] API 로드 이벤트 타임아웃, 폴백 방식으로 확인 시작');
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 빈 배열로 한 번만 실행 (지도는 한 번만 초기화)

  // 지도 중심 업데이트 (tours 변경 시)
  useEffect(() => {
    if (!mapInstance.current) return;

    const naver = window.naver;
    if (!naver?.maps) return;

    const centerCoord = calculateCenter();
    if (!centerCoord) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[NaverMap] 지도 중심 좌표를 계산할 수 없습니다.');
      }
      return;
    }

    // 마커가 생성되었는지 확인
    if (markersRef.current.size === 0) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[NaverMap] 표시할 마커가 없습니다.');
      }
      return;
    }

    // 모든 마커를 포함하도록 범위 계산
    const bounds = new naver.maps.LatLngBounds();
    markersRef.current.forEach((marker) => {
      bounds.extend(marker.getPosition());
    });

    // 지도 범위 자동 조정 (모든 마커 포함)
    mapInstance.current.fitBounds(bounds, {
      padding: 50, // 여백 50px
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('[NaverMap] 지도 범위 자동 조정 완료', {
        center: centerCoord,
        markerCount: markersRef.current.size,
      });
    }
  }, [calculateCenter, tours]);

  // 마커 업데이트 (tours 변경 시)
  useEffect(() => {
    // 지도 초기화 완료 확인
    if (!mapInstance.current || !isMapInitialized) {
      if (process.env.NODE_ENV === 'development') {
        if (!mapInstance.current) {
          console.warn('[NaverMap] 지도 인스턴스가 없습니다. 마커 생성을 건너뜁니다.');
        } else if (!isMapInitialized) {
          console.warn('[NaverMap] 지도 초기화가 완료되지 않았습니다. 마커 생성을 건너뜁니다.');
        }
      }
      return;
    }

    const naver = window.naver;
    if (!naver?.maps) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[NaverMap] naver.maps가 없습니다. 마커 생성을 건너뜁니다.');
      }
      return;
    }

    // 기존 마커 제거
    markersRef.current.forEach((marker) => {
      marker.setMap(null);
    });
    markersRef.current.clear();

    // 기존 인포윈도우 닫기
    if (infoWindowRef.current) {
      infoWindowRef.current.close();
      infoWindowRef.current = null;
    }

    // 새 마커 생성 (유효한 좌표만)
    let createdCount = 0;
    let skippedCount = 0;
    const skippedTours: Array<{
      title: string;
      reason: string;
      mapx: string;
      mapy: string;
      coord?: { lng: number; lat: number };
    }> = [];

    tours.forEach((tour) => {
      // 좌표 검증 강화: 좌표가 없거나 '0'인 경우
      if (!tour.mapx || !tour.mapy || tour.mapx === '0' || tour.mapy === '0') {
        skippedCount++;
        if (process.env.NODE_ENV === 'development') {
          skippedTours.push({
            title: tour.title,
            reason: '좌표 없음',
            mapx: tour.mapx || '(없음)',
            mapy: tour.mapy || '(없음)',
          });
        }
        return;
      }

      // 좌표 변환 (예외 처리)
      let coord: { lng: number; lat: number };
      try {
        coord = convertKATECToWGS84(tour.mapx, tour.mapy);
      } catch (error) {
        skippedCount++;
        if (process.env.NODE_ENV === 'development') {
          skippedTours.push({
            title: tour.title,
            reason: `좌표 변환 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
            mapx: tour.mapx,
            mapy: tour.mapy,
          });
        }
        return;
      }
      
      // 한국 영역 범위 검증
      if (!isValidKoreanCoordinate(coord.lng, coord.lat)) {
        skippedCount++;
        if (process.env.NODE_ENV === 'development') {
          skippedTours.push({
            title: tour.title,
            reason: '한국 영역 범위 벗어남',
            mapx: tour.mapx,
            mapy: tour.mapy,
            coord,
          });
        }
        return;
      }

      // 마커 생성
      createMarker(tour, naver);
      createdCount++;
    });

    if (process.env.NODE_ENV === 'development') {
      console.group('[NaverMap] 마커 생성 결과');
      console.log('전체 관광지:', tours.length);
      console.log('마커 생성:', createdCount);
      console.log('마커 건너뜀:', skippedCount);
      if (skippedTours.length > 0) {
        console.warn('건너뛴 관광지:', skippedTours);
      }
      console.groupEnd();
    }
  }, [tours, onMarkerClick, isMapInitialized]);

  // 마커 클릭 시 선택 상태 및 호버 상태 업데이트
  useEffect(() => {
    if (!mapInstance.current) return;

    const naver = window.naver;
    if (!naver?.maps) return;

    markersRef.current.forEach((marker, id) => {
      const tour = tours.find((t) => t.contentid === id);
      if (!tour) return;

      if (id === selectedTourId) {
        // 선택된 마커: 빨간색으로 강조
        marker.setIcon(getSelectedMarkerIcon(naver));

        // 지도 중심 이동
        const position = marker.getPosition();
        mapInstance.current?.panTo(position);
        mapInstance.current?.setZoom(15);
      } else if (id === hoveredTourId) {
        // 호버된 마커: 타입별 색상으로 약간 크게
        marker.setIcon(getHoveredMarkerIcon(naver, tour.contenttypeid));
      } else {
        // 일반 마커: 타입별 색상
        marker.setIcon(getMarkerIconByType(naver, tour.contenttypeid));
      }
    });
  }, [selectedTourId, hoveredTourId, tours]);

  // 마커 생성 헬퍼 함수
  function createMarker(tour: TourItem, naver: NaverMaps) {
    // 좌표 변환 (KATEC → WGS84)
    const { lat, lng } = convertKATECToWGS84(tour.mapx, tour.mapy);

    const marker = new naver.maps.Marker({
      position: new naver.maps.LatLng(lat, lng),
      title: tour.title,
      icon: getMarkerIconByType(naver, tour.contenttypeid),
      map: mapInstance.current,
    });

    // 마커 클릭 이벤트
    naver.maps.Event.addListener(marker, 'click', () => {
      // 기존 인포윈도우 닫기
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
      }

      // 새로운 인포윈도우 생성
      const address = [tour.addr1, tour.addr2].filter(Boolean).join(' ');
      const overview = tour.overview
        ? tour.overview.length > 100
          ? tour.overview.substring(0, 100) + '...'
          : tour.overview
        : '';

      const infoContent = `
        <div style="padding: 12px; width: 250px; font-family: Arial, sans-serif;">
          <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">${tour.title}</h3>
          ${address ? `<p style="margin: 0 0 8px 0; font-size: 12px; color: #666;">📍 ${address}</p>` : ''}
          ${overview ? `<p style="margin: 0 0 8px 0; font-size: 12px; color: #999; max-height: 60px; overflow: hidden;">${overview}</p>` : ''}
        <a 
          href="/places/${tour.contentid}" 
            style="display: inline-block; padding: 6px 12px; background: #1f6b8f; color: white; border-radius: 4px; text-decoration: none; font-size: 12px; margin-top: 8px;"
          onclick="window.open(this.href, '_self'); return false;"
        >
            상세보기 →
        </a>
      </div>
    `;

      infoWindowRef.current = new naver.maps.InfoWindow({
        content: infoContent,
        borderColor: '#1f6b8f',
        borderWidth: 2,
      });

      infoWindowRef.current.open(mapInstance.current, marker);

      // 부모에 알림
      onMarkerClick?.(tour);
    });

    // 마커 저장
    markersRef.current.set(tour.contentid, marker);
  }

  /**
   * 현재 위치로 이동
   */
  const handleCurrentLocation = useCallback(() => {
    if (!mapInstance.current) return;

    if (!navigator.geolocation) {
      alert('이 브라우저는 위치 정보를 지원하지 않습니다.');
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const naver = window.naver;
        if (!naver?.maps || !mapInstance.current) return;

        const { latitude, longitude } = position.coords;
        const location = new naver.maps.LatLng(latitude, longitude);

        // 지도 중심 이동
        mapInstance.current.panTo(location);
        mapInstance.current.setZoom(15);

        // 기존 현재 위치 마커 제거
        if (currentLocationMarkerRef.current) {
          currentLocationMarkerRef.current.setMap(null);
        }

        // 현재 위치 마커 표시
        currentLocationMarkerRef.current = new naver.maps.Marker({
          position: location,
          map: mapInstance.current,
          icon: new naver.maps.PointingIcon(16, 24, 'red'),
          title: '현재 위치',
        });

        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
        let errorMessage = '위치 정보를 가져올 수 없습니다.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = '위치 정보 권한이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해주세요.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = '위치 정보를 사용할 수 없습니다.';
            break;
          case error.TIMEOUT:
            errorMessage = '위치 정보 요청 시간이 초과되었습니다.';
            break;
        }
        alert(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  return (
      <div
        ref={mapRef}
      style={{
        width: '100%',
        height: '100%',
        minHeight: '400px',
        position: 'relative',
      }}
    >
      {/* 현재 위치 버튼 */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          zIndex: 1000,
        }}
      >
        <Button
          type="button"
          variant="default"
          size="icon"
          onClick={handleCurrentLocation}
          disabled={isLocating}
          aria-label="현재 위치로 이동"
          className="bg-white hover:bg-gray-100 text-gray-700 shadow-lg border"
        >
          <Navigation
            className={`h-4 w-4 ${isLocating ? 'animate-spin' : ''}`}
          />
        </Button>
      </div>
    </div>
  );
}

// 마커 아이콘 헬퍼
/**
 * 관광 타입별 마커 색상 매핑
 */
function getMarkerColorByType(contentTypeId: string): string {
  const colorMap: Record<string, string> = {
    '12': '#3b82f6',   // 관광지 - 파란색
    '14': '#a855f7',   // 문화시설 - 보라색
    '15': '#f97316',   // 축제/행사 - 주황색
    '25': '#22c55e',   // 여행코스 - 초록색
    '28': '#ef4444',   // 레포츠 - 빨간색
    '32': '#ec4899',   // 숙박 - 분홍색
    '38': '#eab308',   // 쇼핑 - 노란색
    '39': '#a16207',   // 음식점 - 갈색
  };
  return colorMap[contentTypeId] || '#3b82f6'; // 기본값: 파란색
}

/**
 * SVG 문자열을 Data URL로 변환
 */
function createSVGDataURL(color: string, size: number): string {
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 2}" fill="${color}" stroke="white" stroke-width="2"/>
    </svg>
  `.trim();
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}

/**
 * 관광 타입에 따른 마커 아이콘 생성 (SVG 기반)
 */
function getMarkerIconByType(naver: NaverMaps, contentTypeId: string): NaverIcon | undefined {
  const color = getMarkerColorByType(contentTypeId);
  const size = 20;
  const svgDataURL = createSVGDataURL(color, size);
  
  try {
    return new naver.maps.MarkerImage(
      svgDataURL,
      new naver.maps.Size(size, size),
      new naver.maps.Point(0, 0),
      new naver.maps.Point(size / 2, size / 2)
    ) as NaverIcon;
  } catch (error) {
    console.warn('마커 아이콘 생성 실패, 기본 마커 사용:', error);
    return undefined;
  }
}

/**
 * 기본 마커 아이콘 (호버 상태용)
 */
function getNormalMarkerIcon(naver: NaverMaps): NaverIcon | undefined {
  const color = '#3b82f6'; // 파란색
  const size = 20;
  const svgDataURL = createSVGDataURL(color, size);
  
  try {
    return new naver.maps.MarkerImage(
      svgDataURL,
      new naver.maps.Size(size, size),
      new naver.maps.Point(0, 0),
      new naver.maps.Point(size / 2, size / 2)
    ) as NaverIcon;
  } catch (error) {
    console.warn('마커 아이콘 생성 실패, 기본 마커 사용:', error);
    return undefined;
  }
}

/**
 * 선택된 마커 아이콘 (빨간색, 크게)
 */
function getSelectedMarkerIcon(naver: NaverMaps): NaverIcon | undefined {
  const color = '#ef4444'; // 빨간색
  const size = 28;
  const svgDataURL = createSVGDataURL(color, size);
  
  try {
    return new naver.maps.MarkerImage(
      svgDataURL,
      new naver.maps.Size(size, size),
      new naver.maps.Point(0, 0),
      new naver.maps.Point(size / 2, size / 2)
    ) as NaverIcon;
  } catch (error) {
    console.warn('마커 아이콘 생성 실패, 기본 마커 사용:', error);
    return undefined;
  }
}

/**
 * 호버된 마커 아이콘 (타입별 색상, 약간 크게)
 */
function getHoveredMarkerIcon(naver: NaverMaps, contentTypeId: string): NaverIcon | undefined {
  const color = getMarkerColorByType(contentTypeId);
  const size = 24;
  const svgDataURL = createSVGDataURL(color, size);
  
  try {
    return new naver.maps.MarkerImage(
      svgDataURL,
      new naver.maps.Size(size, size),
      new naver.maps.Point(0, 0),
      new naver.maps.Point(size / 2, size / 2)
    ) as NaverIcon;
  } catch (error) {
    console.warn('마커 아이콘 생성 실패, 기본 마커 사용:', error);
    return undefined;
  }
}
