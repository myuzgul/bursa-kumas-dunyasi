'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { 
  X, ChevronLeft, ChevronRight, Play, Pause, 
  ExternalLink, ArrowRight, Sparkles 
} from 'lucide-react';
import type { Story, StorySlide } from '@/lib/services/stories';

interface StoriesBarProps {
  initialStories?: Story[];
}

export const StoriesBar: React.FC<StoriesBarProps> = ({ initialStories = [] }) => {
  const [stories, setStories] = useState<Story[]>(initialStories);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0); // 0 to 100

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch active stories if not provided
  useEffect(() => {
    if (initialStories.length === 0) {
      fetch('/api/stories')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.stories) {
            setStories(data.stories);
          }
        })
        .catch(() => {});
    }
  }, [initialStories.length]);

  const currentStory = activeStoryIndex !== null ? stories[activeStoryIndex] : null;
  const currentSlides = currentStory?.slides || [];
  const currentSlide = currentSlides[activeSlideIndex] || null;

  // Next Slide / Story
  const goToNextSlide = useCallback(() => {
    if (activeStoryIndex === null) return;
    
    if (activeSlideIndex < currentSlides.length - 1) {
      setActiveSlideIndex((prev) => prev + 1);
      setProgress(0);
    } else if (activeStoryIndex < stories.length - 1) {
      // Go to next story
      setActiveStoryIndex((prev) => (prev !== null ? prev + 1 : 0));
      setActiveSlideIndex(0);
      setProgress(0);
    } else {
      // Close player at end
      setActiveStoryIndex(null);
      setActiveSlideIndex(0);
      setProgress(0);
    }
  }, [activeSlideIndex, activeStoryIndex, currentSlides.length, stories.length]);

  // Prev Slide / Story
  const goToPrevSlide = useCallback(() => {
    if (activeStoryIndex === null) return;

    if (activeSlideIndex > 0) {
      setActiveSlideIndex((prev) => prev - 1);
      setProgress(0);
    } else if (activeStoryIndex > 0) {
      // Go to previous story last slide
      const prevStory = stories[activeStoryIndex - 1];
      setActiveStoryIndex(activeStoryIndex - 1);
      setActiveSlideIndex(Math.max(0, (prevStory.slides?.length || 1) - 1));
      setProgress(0);
    } else {
      // Restart current slide
      setProgress(0);
    }
  }, [activeSlideIndex, activeStoryIndex, stories]);

  // Story Progress Timer (runs every 50ms for smooth progress bar)
  useEffect(() => {
    if (activeStoryIndex === null || isPaused || !currentSlide) {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      return;
    }

    const durationSeconds = currentSlide.duration || 5;
    const intervalMs = 50;
    const stepIncrement = (intervalMs / (durationSeconds * 1000)) * 100;

    progressTimerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          goToNextSlide();
          return 0;
        }
        return prev + stepIncrement;
      });
    }, intervalMs);

    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [activeStoryIndex, activeSlideIndex, isPaused, currentSlide, goToNextSlide]);

  // Keyboard Navigation & Scroll Lock
  useEffect(() => {
    if (activeStoryIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveStoryIndex(null);
      } else if (e.key === 'ArrowRight') {
        goToNextSlide();
      } else if (e.key === 'ArrowLeft') {
        goToPrevSlide();
      } else if (e.key === ' ') {
        setIsPaused((prev) => !prev);
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeStoryIndex, goToNextSlide, goToPrevSlide]);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Check if stories container is scrollable
  const checkScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
    }
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollContainerRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll, { passive: true });
    }
    window.addEventListener('resize', checkScroll);
    return () => {
      if (el) el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [stories, checkScroll]);

  const openStory = (index: number) => {
    setActiveStoryIndex(index);
    setActiveSlideIndex(0);
    setProgress(0);
    setIsPaused(false);
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -260, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 260, behavior: 'smooth' });
    }
  };

  if (!stories || stories.length === 0) {
    return null;
  }

  return (
    <>
      {/* 1. HORIZONTAL STORIES BAR (Exact Yazar Perde Layout & Spacing) */}
      <section className="bg-white border-b border-slate-200 shadow-2xs">
        <div className="relative max-w-7xl mx-auto px-4 select-none">
          {/* Scroll Left Button */}
          {canScrollLeft && (
            <button
              type="button"
              onClick={scrollLeft}
              className="hidden md:flex absolute -left-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/95 shadow-md border border-slate-200 items-center justify-center text-slate-700 hover:bg-white hover:text-blue-900 transition"
              aria-label="Sola Kaydır"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {/* Story Bubbles Container */}
          <div 
            ref={scrollContainerRef}
            className="flex items-center gap-5 sm:gap-7 overflow-x-auto scrollbar-none py-2.5 sm:py-3.5"
          >
            {stories.map((story, index) => (
              <button
                key={story.id}
                type="button"
                onClick={() => openStory(index)}
                className="flex flex-col items-center gap-2 flex-shrink-0 group cursor-pointer focus:outline-none transition transform hover:scale-105 active:scale-95"
              >
                {/* Avatar Circle with Yazar Perde-style Elegant Blue / Gradient Ring */}
                <div className="relative p-[2px] rounded-full ring-2 ring-blue-600/70 group-hover:ring-blue-600 transition-all duration-200 shadow-xs">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-slate-100">
                    <img
                      src={story.cover_image || '/placeholder.jpg'}
                      alt={story.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                </div>

                {/* Story Title */}
                <span className="text-xs font-semibold text-slate-800 group-hover:text-blue-900 text-center truncate max-w-[80px] sm:max-w-[88px] leading-tight">
                  {story.title}
                </span>
              </button>
            ))}
          </div>

          {/* Scroll Right Button */}
          {canScrollRight && (
            <button
              type="button"
              onClick={scrollRight}
              className="hidden md:flex absolute -right-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/95 shadow-md border border-slate-200 items-center justify-center text-slate-700 hover:bg-white hover:text-blue-900 transition"
              aria-label="Sağa Kaydır"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </section>

      {/* 2. FULLSCREEN / MODAL INSTAGRAM STORY PLAYER */}
      {currentStory && currentSlide && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-0 sm:p-4 select-none animate-in fade-in duration-150"
          onClick={() => setActiveStoryIndex(null)}
        >
          {/* Main Story Phone-Like Player Card */}
          <div 
            className="relative w-full sm:max-w-[420px] h-full sm:h-[90vh] sm:max-h-[820px] bg-slate-900 sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={() => setIsPaused(true)}
            onMouseUp={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
          >
            {/* Story Background Image */}
            <div className="absolute inset-0 z-0">
              <img
                src={currentSlide.image_url}
                alt={currentSlide.title || currentStory.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />
            </div>

            {/* Left / Right Click Nav Overlays */}
            <div 
              className="absolute inset-y-0 left-0 w-1/3 z-10 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                goToPrevSlide();
              }}
              title="Önceki"
            />
            <div 
              className="absolute inset-y-0 right-0 w-2/3 z-10 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                goToNextSlide();
              }}
              title="Sonraki"
            />

            {/* TOP BAR: Segmented Progress + Story Header */}
            <div className="relative z-20 p-4 space-y-3">
              {/* Segmented Progress Bars */}
              <div className="flex items-center gap-1.5">
                {currentSlides.map((slide, idx) => {
                  let fillPercent = 0;
                  if (idx < activeSlideIndex) fillPercent = 100;
                  else if (idx === activeSlideIndex) fillPercent = progress;

                  return (
                    <div 
                      key={slide.id || idx} 
                      className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
                    >
                      <div 
                        className="h-full bg-white transition-all ease-linear"
                        style={{ width: `${fillPercent}%` }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Author & Controls Header */}
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-white/40 bg-slate-800">
                    <img
                      src={currentStory.cover_image}
                      alt={currentStory.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold leading-tight drop-shadow">
                      {currentStory.title}
                    </h4>
                    <span className="text-[10px] text-slate-300">Bursa Kumaş Dünyası</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsPaused(!isPaused);
                    }}
                    className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white transition backdrop-blur-sm"
                  >
                    {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveStoryIndex(null);
                    }}
                    className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white transition backdrop-blur-sm"
                    aria-label="Kapat"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* BOTTOM BAR: Content & Call To Action Button */}
            <div className="relative z-20 p-5 space-y-3">
              {currentSlide.title && (
                <h3 className="text-base sm:text-lg font-black text-white leading-snug drop-shadow-md">
                  {currentSlide.title}
                </h3>
              )}

              {currentSlide.subtitle && (
                <p className="text-xs text-slate-200 leading-relaxed drop-shadow">
                  {currentSlide.subtitle}
                </p>
              )}

              {currentSlide.button_link && (
                <Link
                  href={currentSlide.button_link}
                  onClick={() => setActiveStoryIndex(null)}
                  className="w-full py-3 px-4 bg-white/95 hover:bg-white text-slate-900 font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition transform active:scale-95 backdrop-blur-sm"
                >
                  <span>{currentSlide.button_text || 'Hemen İncele'}</span>
                  <ArrowRight className="w-4 h-4 text-blue-900" />
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
