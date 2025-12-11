/**
 * @file detail-gallery.tsx
 * @description 관광지 상세페이지 이미지 갤러리 섹션 컴포넌트
 *
 * 관광지의 이미지 갤러리를 표시하는 컴포넌트입니다.
 * PRD 2.4.3 이미지 갤러리 섹션 요구사항을 구현합니다.
 *
 * 주요 기능:
 * 1. 이미지 목록 조회 (getDetailImage API)
 * 2. Swiper를 사용한 이미지 슬라이드
 * 3. 이미지 클릭 시 전체화면 모달
 * 4. 이미지 없을 때 처리
 * 5. Next.js Image 컴포넌트 사용 (최적화)
 *
 * @dependencies
 * - lib/api/tour-api.ts (getDetailImage)
 * - lib/types/tour.ts (TourImage)
 * - components/ui/card.tsx
 * - components/ui/dialog.tsx
 * - swiper (이미지 슬라이더)
 * - Next.js Image 컴포넌트
 */

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import { X } from 'lucide-react';
import { getDetailImage } from '@/lib/api/tour-api';
import type { TourImage } from '@/lib/types/tour';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';

// Swiper 스타일 import
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface DetailGalleryProps {
  /** 관광지 콘텐츠 ID */
  contentId: string;
  /** 관광지명 (이미지 alt 텍스트용) */
  title: string;
}

/**
 * 관광지 이미지 갤러리 섹션 컴포넌트
 * 
 * 이미지 목록을 Swiper 슬라이더로 표시하고, 클릭 시 전체화면 모달로 확대하여 볼 수 있습니다.
 * 
 * @param contentId - 관광지 콘텐츠 ID (한국관광공사 API contentid)
 * @param title - 관광지명 (이미지 alt 텍스트용)
 * 
 * @example
 * ```tsx
 * <DetailGallery contentId="125266" title="경복궁" />
 * ```
 * 
 * Swiper 설정:
 * - 네비게이션: 이전/다음 버튼
 * - 페이지네이션: 하단 점 표시
 * - 반응형: 모바일 1개, 태블릿 2개, 데스크톱 3개
 * - 터치 제스처: 모바일에서 스와이프 지원
 */
export default function DetailGallery({ contentId, title }: DetailGalleryProps) {
  /** 이미지 목록 상태 */
  const [images, setImages] = useState<TourImage[]>([]);
  /** 로딩 상태 */
  const [loading, setLoading] = useState(true);
  /** 에러 메시지 상태 */
  const [error, setError] = useState<string | null>(null);
  /** 선택된 이미지 인덱스 (모달 열림 상태) */
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  /** 모달 내 Swiper 인스턴스 */
  const [modalSwiper, setModalSwiper] = useState<SwiperType | null>(null);

  /**
   * 이미지 목록 가져오기
   * 
   * getDetailImage API를 호출하여 관광지의 이미지 목록을 가져옵니다.
   * 최대 20개의 이미지를 가져옵니다.
   */
  useEffect(() => {
    async function fetchImages() {
      try {
        setLoading(true);
        setError(null);
        const imageList = await getDetailImage({
          contentId,
          numOfRows: 20, // 최대 20개 이미지
        });
        setImages(imageList);
      } catch (err) {
        console.error('이미지 목록을 불러오는 중 오류 발생:', err);
        setError('이미지를 불러올 수 없습니다.');
      } finally {
        setLoading(false);
      }
    }

    fetchImages();
  }, [contentId]);

  /**
   * 이미지 클릭 핸들러
   * 
   * 갤러리의 이미지를 클릭하면 해당 이미지 인덱스를 저장하고 모달을 엽니다.
   * 
   * @param index - 클릭한 이미지의 인덱스
   */
  const handleImageClick = (index: number) => {
    console.log('[DetailGallery] 이미지 클릭:', {
      index,
      imageUrl: images[index]?.originimgurl || images[index]?.smallimageurl,
      totalImages: images.length,
    });
    setSelectedImageIndex(index);
  };

  /**
   * 모달 닫기 핸들러
   * 
   * 모달을 닫고 선택된 이미지 인덱스를 초기화합니다.
   */
  const handleCloseModal = () => {
    setSelectedImageIndex(null);
  };

  /**
   * 모달 Swiper 초기화 시 선택된 이미지로 이동
   * 
   * 모달이 열릴 때 클릭한 이미지로 자동으로 이동합니다.
   */
  useEffect(() => {
    if (modalSwiper && selectedImageIndex !== null) {
      console.log('[DetailGallery] Swiper 초기화 완료, 이미지로 이동:', selectedImageIndex);
      modalSwiper.slideTo(selectedImageIndex);
    }
  }, [modalSwiper, selectedImageIndex]);

  /**
   * 디버깅: 선택된 이미지 정보 로깅
   */
  useEffect(() => {
    if (selectedImageIndex !== null) {
      const selectedImage = images[selectedImageIndex];
      const imageUrl = selectedImage?.originimgurl || selectedImage?.smallimageurl;
      console.log('[DetailGallery] 모달 열림:', {
        selectedImageIndex,
        imageUrl,
        imageName: selectedImage?.imgname,
        totalImages: images.length,
        hasImageUrl: !!imageUrl,
      });
      
      // 이미지 URL이 유효한지 확인
      if (imageUrl) {
        console.log('[DetailGallery] 이미지 URL 확인:', imageUrl);
      } else {
        console.warn('[DetailGallery] 이미지 URL이 없습니다:', selectedImage);
      }
    }
  }, [selectedImageIndex, images]);

  // 이미지가 없으면 섹션을 표시하지 않음
  if (loading) {
    return null; // 로딩 중에는 표시하지 않음 (다른 섹션과 일관성)
  }

  if (error || images.length === 0) {
    return null; // 에러 또는 이미지 없을 때는 섹션 숨김
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>이미지 갤러리</CardTitle>
        </CardHeader>
        <CardContent>
          <Swiper
            modules={[Navigation, Pagination]}
            navigation
            pagination={{ clickable: true }}
            spaceBetween={10}
            slidesPerView={1}
            breakpoints={{
              640: {
                slidesPerView: 2,
                spaceBetween: 15,
              },
              1024: {
                slidesPerView: 3,
                spaceBetween: 20,
              },
            }}
            className="w-full"
          >
            {images.map((image, index) => {
              const imageUrl = image.originimgurl || image.smallimageurl;
              if (!imageUrl) return null;

              return (
                <SwiperSlide key={image.serialnum || index}>
                  <div
                    className="relative aspect-video w-full rounded-lg overflow-hidden bg-muted cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => handleImageClick(index)}
                  >
                    <Image
                      src={imageUrl}
                      alt={image.imgname || `${title} 이미지 ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      unoptimized={imageUrl.startsWith('http') && !imageUrl.includes('data.go.kr')}
                    />
                  </div>
                </SwiperSlide>
              );
            })}
          </Swiper>
        </CardContent>
      </Card>

      {/* 전체화면 모달 */}
      <Dialog open={selectedImageIndex !== null} onOpenChange={(open) => !open && handleCloseModal()}>
        <DialogContent className="!max-w-none !p-0 !rounded-none !bg-black/95 !fixed !inset-0 !top-0 !left-0 !right-0 !bottom-0 !translate-x-0 !translate-y-0 !grid-none !block z-50 w-full h-full border-none [&>button]:hidden">
          <DialogTitle className="sr-only">이미지 갤러리</DialogTitle>
          <div className="relative w-full h-full flex items-center justify-center">
            {/* 닫기 버튼 */}
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
              aria-label="닫기"
            >
              <X className="h-6 w-6" />
            </button>

            {/* 모달 내 Swiper */}
            {selectedImageIndex !== null && (
              <Swiper
                key={selectedImageIndex}
                modules={[Navigation, Pagination]}
                navigation
                pagination={{ clickable: true }}
                spaceBetween={20}
                slidesPerView={1}
                onSwiper={setModalSwiper}
                onAfterInit={(swiper) => {
                  if (selectedImageIndex !== null) {
                    swiper.slideTo(selectedImageIndex);
                  }
                }}
                className="w-full h-full"
              >
                {images.map((image, index) => {
                  const imageUrl = image.originimgurl || image.smallimageurl;
                  if (!imageUrl) return null;

                  return (
                    <SwiperSlide key={image.serialnum || index}>
                      <div className="w-full h-full flex items-center justify-center p-4">
                        <img
                          src={imageUrl}
                          alt={image.imgname || `${title} 이미지 ${index + 1}`}
                          className="max-w-full max-h-[90vh] w-auto h-auto object-contain"
                          onError={(e) => {
                            console.error('[DetailGallery] 이미지 로딩 실패:', imageUrl);
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      </div>
                    </SwiperSlide>
                  );
                })}
              </Swiper>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

