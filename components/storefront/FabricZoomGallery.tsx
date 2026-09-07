'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';

interface FabricZoomGalleryProps {
  images: Array<{ id: string; image_url: string; alt_text?: string }>;
  productName: string;
}

export const FabricZoomGallery: React.FC<FabricZoomGalleryProps> = ({ images, productName }) => {
  const imageList = images && images.length > 0 
    ? images 
    : [{ id: 'default', image_url: '/placeholder.jpg', alt_text: productName }];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Swipe handling for touch devices
  const touchStartX = useRef<number | null>(null);

  const prevImage = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? imageList.length - 1 : prev - 1));
  }, [imageList.length]);

  const nextImage = useCallback(() => {
    setCurrentIndex((prev) => (prev === imageList.length - 1 ? 0 : prev + 1));
  }, [imageList.length]);

  // Keyboard navigation & body scroll lock
  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLightboxOpen(false);
      } else if (e.key === 'ArrowLeft') {
        prevImage();
      } else if (e.key === 'ArrowRight') {
        nextImage();
      }
    };

    // Lock scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLightboxOpen, nextImage, prevImage]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (diff > 50) {
      nextImage();
    } else if (diff < -50) {
      prevImage();
    }
    touchStartX.current = null;
  };

  const currentImage = imageList[currentIndex] || imageList[0];

  return (
    <div className="flex flex-col w-full">
      {/* 1. MAIN LARGE IMAGE (Exact 3:4 portrait like screenshot) */}
      <div 
        onClick={() => setIsLightboxOpen(true)}
        className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 cursor-zoom-in group shadow-sm select-none"
      >
        <img
          src={currentImage.image_url}
          alt={currentImage.alt_text || productName}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.01]"
        />

        {/* Maximize / Expand Button on Bottom Right (Exact same as screenshot) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsLightboxOpen(true);
          }}
          className="absolute bottom-3 right-3 bg-slate-900/80 hover:bg-slate-900 text-white p-2.5 rounded-lg backdrop-blur-md transition shadow-md z-10"
          aria-label="Büyüt"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {imageList.length > 1 && (
          <div className="absolute top-3 right-3 bg-slate-900/60 text-white text-[11px] font-mono px-2.5 py-1 rounded-full pointer-events-none backdrop-blur-md z-10">
            {currentIndex + 1} / {imageList.length}
          </div>
        )}
      </div>

      {/* 2. THUMBNAILS ROW (Under the main image, exact match to screenshot) */}
      {imageList.length > 1 && (
        <div className="flex items-center gap-2.5 mt-3 overflow-x-auto pb-1 scrollbar-thin">
          {imageList.map((img, idx) => (
            <button
              key={img.id || idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              className={`relative w-16 h-20 sm:w-20 sm:h-24 rounded-xl overflow-hidden border-2 transition flex-shrink-0 bg-slate-100 ${
                currentIndex === idx
                  ? 'border-blue-900 shadow-md ring-2 ring-blue-900/30'
                  : 'border-slate-200 hover:border-slate-400 opacity-75 hover:opacity-100'
              }`}
            >
              <img
                src={img.image_url}
                alt={`${productName} thumbnail ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* 3. FULLSCREEN TOUCH/KEYBOARD LIGHTBOX MODAL */}
      {isLightboxOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 select-none animate-in fade-in duration-200"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between text-white z-10">
            <div className="flex items-center gap-3">
              <span className="font-bold text-sm tracking-wide text-slate-200">
                {productName}
              </span>
              <span className="text-xs text-slate-400 font-mono bg-slate-800/80 px-2.5 py-0.5 rounded-full">
                {currentIndex + 1} / {imageList.length}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="p-2.5 bg-slate-800/80 hover:bg-slate-700 text-white rounded-full transition shadow-lg flex items-center justify-center"
              aria-label="Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Central Image View with Navigation Arrows */}
          <div className="relative flex-1 flex items-center justify-center my-2 max-h-[82vh]">
            {imageList.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                className="absolute left-2 sm:left-4 z-10 p-3 bg-slate-900/80 hover:bg-slate-800 text-white rounded-full transition shadow-xl backdrop-blur-sm"
                aria-label="Önceki Fotoğraf"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            <div className="relative max-w-full max-h-full flex items-center justify-center">
              <img
                src={currentImage.image_url}
                alt={currentImage.alt_text || productName}
                className="max-h-[80vh] max-w-[92vw] object-contain rounded-2xl shadow-2xl transition-all duration-200"
              />
            </div>

            {imageList.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                className="absolute right-2 sm:right-4 z-10 p-3 bg-slate-900/80 hover:bg-slate-800 text-white rounded-full transition shadow-xl backdrop-blur-sm"
                aria-label="Sonraki Fotoğraf"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Bottom Thumbnails */}
          {imageList.length > 1 && (
            <div className="flex justify-center gap-2 overflow-x-auto py-2 z-10">
              {imageList.map((img, idx) => (
                <button
                  key={img.id || idx}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-14 h-16 sm:w-16 sm:h-20 rounded-xl overflow-hidden border-2 transition flex-shrink-0 bg-slate-900 ${
                    currentIndex === idx
                      ? 'border-blue-500 scale-105 ring-2 ring-blue-500/40'
                      : 'border-slate-700 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img.image_url}
                    alt={`${productName} thumb ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
