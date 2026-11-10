'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';

export interface CategoryShowcaseItem {
  id: string;
  name: string;
  subtitle: string;
  slug: string;
  image: string;
  gradientClass: string;
}

export const SHOWCASE_CATEGORIES: CategoryShowcaseItem[] = [
  {
    id: 'cat-nevresimlik',
    name: 'Nevresimlik',
    subtitle: 'Desen Seç →',
    slug: 'nevresimlik',
    image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80',
    gradientClass: 'from-[#881337] via-[#9f1239] to-[#be123c]',
  },
  {
    id: 'cat-duck-bezi',
    name: 'Duck Bezi',
    subtitle: 'Desen Seç →',
    slug: 'duck-bezi',
    image: 'https://images.unsplash.com/photo-1604014237800-1c9102c219da?auto=format&fit=crop&w=800&q=80',
    gradientClass: 'from-[#064e3b] via-[#047857] to-[#059669]',
  },
  {
    id: 'cat-muslin',
    name: 'Müslin',
    subtitle: 'Desen Seç →',
    slug: 'muslin',
    image: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=800&q=80',
    gradientClass: 'from-[#581c87] via-[#6b21a8] to-[#7e22ce]',
  },
  {
    id: 'cat-viskon',
    name: 'Viskon',
    subtitle: 'Desen Seç →',
    slug: 'viskon-kumaslar',
    image: 'https://images.unsplash.com/photo-1579656381226-5fc0f0100c3b?auto=format&fit=crop&w=800&q=80',
    gradientClass: 'from-[#7c2d12] via-[#9a3412] to-[#c2410c]',
  },
  {
    id: 'cat-tul-perde',
    name: 'Tül Perde',
    subtitle: 'Zarif Tüller',
    slug: 'tul-perde',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
    gradientClass: 'from-[#134e4a] via-[#0f766e] to-[#0d9488]',
  },
  {
    id: 'cat-dantel',
    name: 'Dantel',
    subtitle: 'Özel Günlere',
    slug: 'dantel',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80',
    gradientClass: 'from-[#701a75] via-[#86198f] to-[#a21caf]',
  },
  {
    id: 'cat-fisto',
    name: 'Fisto',
    subtitle: 'Nakışlı Doku',
    slug: 'fisto',
    image: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=800&q=80',
    gradientClass: 'from-[#1e3a8a] via-[#1d4ed8] to-[#2563eb]',
  },
  {
    id: 'cat-keten',
    name: 'Keten',
    subtitle: 'Sade Şıklık',
    slug: 'keten',
    image: 'https://images.unsplash.com/photo-1540518614846-7ede433c4ef7?auto=format&fit=crop&w=800&q=80',
    gradientClass: 'from-[#713f12] via-[#854d0e] to-[#a16207]',
  },
];

export const CategoryShowcaseGrid: React.FC = () => {
  const [isPaused, setIsPaused] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!sliderRef.current) return;
    const scrollAmount = direction === 'left' ? -240 : 240;
    sliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  // Auto-scroll loop
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      if (!sliderRef.current) return;
      const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
      if (scrollLeft + clientWidth >= scrollWidth - 10) {
        sliderRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        sliderRef.current.scrollBy({ left: 160, behavior: 'smooth' });
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [isPaused]);

  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div>
          <div className="text-[10px] sm:text-xs font-black text-[#801030] uppercase tracking-wider">
            Kumaş Koleksiyonları
          </div>
          <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
            Popüler Kumaş Kategorileri
          </h2>
        </div>

        {/* Slider Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => scroll('left')}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-slate-200 bg-white shadow-xs hover:bg-slate-50 flex items-center justify-center text-slate-700 hover:text-slate-950 transition cursor-pointer"
            aria-label="Önceki Kategoriler"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => scroll('right')}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-slate-200 bg-white shadow-xs hover:bg-slate-50 flex items-center justify-center text-slate-700 hover:text-slate-950 transition cursor-pointer"
            aria-label="Sonraki Kategoriler"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Slider (Single row on both desktop and mobile) */}
      <div className="relative">
        <div
          ref={sliderRef}
          className="flex items-center gap-2 sm:gap-3 md:gap-3.5 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 pt-1 px-0.5"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {SHOWCASE_CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              href={`/kategori/${cat.slug}`}
              className="group relative flex-shrink-0 w-[128px] sm:w-[145px] md:w-[155px] lg:flex-1 snap-start aspect-square rounded-2xl overflow-hidden border border-slate-200/90 bg-slate-100 shadow-xs hover:shadow-xl hover:border-slate-300 transition-all duration-300 flex flex-col justify-end"
            >
              {/* Background High-Res Fabric Stack Photo */}
              <img
                src={cat.image}
                alt={cat.name}
                className={`absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 ease-out ${
                  isPaused ? '' : 'group-hover:scale-108'
                }`}
                loading="lazy"
              />

              {/* Gradient Darkening for contrast */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/5 pointer-events-none" />

              {/* Colored Bottom Gradient Badge Banner (Altına Doğru ve Küçük Yazı Tipi) */}
              <div
                className={`relative z-10 m-1 sm:m-1.5 p-1.5 sm:p-2 rounded-xl bg-gradient-to-r ${cat.gradientClass} text-white shadow-md backdrop-blur-xs flex flex-col items-center justify-center text-center transition-transform duration-300 group-hover:-translate-y-0.5`}
              >
                <h3 className="text-[10px] sm:text-[11px] md:text-xs font-black tracking-tight leading-tight drop-shadow-sm truncate w-full">
                  {cat.name}
                </h3>
                <p className="text-[8.5px] sm:text-[9.5px] font-medium text-white/95 leading-tight mt-0.5 drop-shadow-sm truncate w-full">
                  {cat.subtitle}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom Footer Controls (Screenshot: Hareketi Durdur) */}
      <div className="flex items-center justify-between mt-2 sm:mt-3 text-slate-500">
        <Link
          href="/kategori/tum-kumaslar"
          className="text-[11px] sm:text-xs font-bold text-[#801030] hover:text-[#5c0b22] flex items-center gap-1 transition"
        >
          <span>Tüm Kategorileri Gör</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>

        <button
          type="button"
          onClick={() => setIsPaused(!isPaused)}
          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-slate-800 transition py-1 px-2.5 rounded-lg hover:bg-slate-100 cursor-pointer"
          title="Kategori kartları animasyonunu kontrol et"
        >
          {isPaused ? (
            <>
              <Play className="w-3 h-3 text-emerald-600 fill-emerald-600" />
              <span>Akışı Başlat</span>
            </>
          ) : (
            <>
              <Pause className="w-3 h-3 text-slate-500" />
              <span>Hareketi Durdur</span>
            </>
          )}
        </button>
      </div>
    </section>
  );
};
