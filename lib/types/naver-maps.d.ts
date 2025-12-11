/**
 * @file naver-maps.d.ts
 * @description Naver Maps JavaScript API v3 (NCP) 타입 정의
 *
 * 네이버 지도 API 전역 타입을 정의합니다.
 */

export interface NaverMaps {
  Map: new (element: HTMLElement, options: MapOptions) => NaverMap;
  LatLng: new (lat: number, lng: number) => NaverLatLng;
  Marker: new (options: MarkerOptions) => NaverMarker;
  InfoWindow: new (options: InfoWindowOptions) => NaverInfoWindow;
  HTMLMarker: new (options: HTMLMarkerOptions) => NaverHTMLMarker;
  MarkerImage: new (
    url: string,
    size: NaverSize,
    origin: NaverPoint,
    anchor: NaverPoint
  ) => NaverIcon;
  Size: new (width: number, height: number) => NaverSize;
  Point: new (x: number, y: number) => NaverPoint;
  Event: {
    addListener: (
      instance: any,
      eventName: string,
      listener: () => void
    ) => void;
  };
  ControlPosition: {
    TOP_RIGHT: string;
    TOP_LEFT: string;
    BOTTOM_RIGHT: string;
    BOTTOM_LEFT: string;
  };
  MapTypeId: {
    NORMAL: string;
    SATELLITE: string;
    HYBRID: string;
  };
}

export interface MapOptions {
  center: NaverLatLng;
  zoom: number;
  mapTypeControl?: boolean;
  zoomControl?: boolean;
  scaleControl?: boolean;
  zoomControlOptions?: {
    position?: string;
  };
}

export interface MarkerOptions {
  position: NaverLatLng;
  map?: NaverMap;
  title?: string;
  icon?: NaverIcon | string | undefined;
}

export interface HTMLMarkerOptions {
  position: NaverLatLng;
  map?: NaverMap;
  html: string;
  anchor?: NaverPoint;
  zIndex?: number;
}

export interface InfoWindowOptions {
  content: string;
  borderColor?: string;
  borderWidth?: number;
  maxWidth?: number;
  pixelOffset?: NaverPoint;
}

export interface NaverMap {
  panTo: (position: NaverLatLng) => void;
  setZoom: (zoom: number) => void;
  getZoom: () => number;
  setMapTypeId: (mapTypeId: string) => void;
}

export interface NaverLatLng {
  lat: () => number;
  lng: () => number;
}

export interface NaverMarker {
  setMap: (map: NaverMap | null) => void;
  setIcon: (icon: NaverIcon | string | undefined) => void;
  getPosition: () => NaverLatLng;
}

export interface NaverHTMLMarker {
  setMap: (map: NaverMap | null) => void;
  setPosition: (position: NaverLatLng) => void;
  getPosition: () => NaverLatLng;
  setZIndex: (zIndex: number) => void;
}

export interface NaverSize {
  width: number;
  height: number;
}

export interface NaverInfoWindow {
  open: (map: NaverMap, marker: NaverMarker) => void;
  close: () => void;
}

export interface NaverIcon {
  // MarkerImage 인스턴스 또는 커스텀 아이콘
}

export interface NaverPoint {
  x: number;
  y: number;
}

declare global {
  interface Window {
    naver: {
      maps: NaverMaps;
    };
  }
}

export {};
