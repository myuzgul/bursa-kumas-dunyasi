'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';

export interface CategoryShowcaseItem {
  id: string;
  name: string;
  slug: string;
  image: string;
  gradientClass: string;
}

const GRADIENT_PALETTES = [
  'from-[#881337] via-[#9f1239] to-[#be123c]', // Claret / Rose
  'from-[#064e3b] via-[#047857] to-[#059669]', // Emerald
  'from-[#581c87] via-[#6b21a8] to-[#7e22ce]', // Purple
  'from-[#7c2d12] via-[#9a3412] to-[#c2410c]', // Rust
  'from-[#134e4a] via-[#0f766e] to-[#0d9488]', // Teal
  'from-[#701a75] via-[#86198f] to-[#a21caf]', // Magenta
  'from-[#1e3a8a] via-[#1d4ed8] to-[#2563eb]', // Royal Blue
  'from-[#713f12] via-[#854d0e] to-[#a16207]', // Amber
  'from-[#312e81] via-[#3730a3] to-[#4338ca]', // Indigo
  'from-[#831843] via-[#9d174d] to-[#be185d]', // Pink/Burgundy
];

function mapToCategoryItems(rawList: any[]): CategoryShowcaseItem[] {
  return rawList
    .filter((c: any) => c && c.is_active === 1 && c.is_featured_home === 1)
    .sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0))
    .map((c: any, index: number) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      image: c.image_url && c.image_url !== '/placeholder.jpg' ? c.image_url : '/placeholder.jpg',
      gradientClass: GRADIENT_PALETTES[index % GRADIENT_PALETTES.length],
    }));
}

interface CategoryShowcaseGridProps {
  initialCategories?: any[];
}

export const CategoryShowcaseGrid: React.FC<CategoryShowcaseGridProps> = ({ initialCategories = [] }) => {
  const [categories, setCategories] = useState<CategoryShowcaseItem[]>(() =>
    mapToCategoryItems(initialCategories)
  );
  const [isPaused, setIsPaused] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Dynamically load active featured categories from Admin Panel
  useEffect(() => {
    fetch('/api/admin/categories', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.categories)) {
          setCategories(mapToCategoryItems(data.categories));
        }
      })
      .catch(() => {});
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (!sliderRef.current) return;
    const scrollAmount = direction === 'left' ? -240 : 240;
    sliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  // Auto-scroll loop (only if there are multiple items that overflow)
  useEffect(() => {
    if (isPaused || categories.length <= 1) return;

    const interval = setInterval(() => {
      if (!sliderRef.current) return;
      const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
      if (scrollWidth <= clientWidth) return;

      if (scrollLeft + clientWidth >= scrollWidth - 10) {
        sliderRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        sliderRef.current.scrollBy({ left: 160, behavior: 'smooth' });
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [isPaused, categories.length]);

  // If no categories are marked as featured for the homepage vitrin, hide gracefully
  if (categories.length === 0) {
    return null;
  }

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

        {/* Slider Controls (shown if more than 1 category) */}
        {categories.length > 1 && (
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
        )}
      </div>

      {/* Horizontal Slider (Single row on both desktop and mobile) */}
      <div className="relative">
        <div
          ref={sliderRef}
          className="flex items-center gap-2.5 sm:gap-3 md:gap-3.5 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 pt-1 px-0.5"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/kategori/${cat.slug}`}
              className="group relative flex-shrink-0 w-[125px] sm:w-[140px] md:w-[150px] snap-start aspect-square rounded-2xl overflow-hidden border border-slate-200/90 bg-slate-100 shadow-xs hover:shadow-xl hover:border-slate-300 transition-all duration-300 flex flex-col justify-end"
            >
              {/* Background High-Res Fabric Stack Photo (Full Visibility) */}
              <img
                src={cat.image || '/placeholder.jpg'}
                alt={cat.name}
                onError={(e) => {
                  if (e.currentTarget.src !== '/placeholder.jpg') {
                    e.currentTarget.src = '/placeholder.jpg';
                  }
                }}
                className={`absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 ease-out ${
                  isPaused ? '' : 'group-hover:scale-108'
                }`}
                loading="lazy"
              />

              {/* Gentle bottom darkening for contrast */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

              {/* Kibar, Küçük & Sadece Kategori İsmi İçeren Şık Rozet */}
              <div
                className={`relative z-10 mx-2 mb-2 py-1 sm:py-1.5 px-2 rounded-lg bg-gradient-to-r ${cat.gradientClass} text-white shadow-sm flex items-center justify-center text-center transition-transform duration-300 group-hover:-translate-y-0.5`}
              >
                <span className="text-[10px] sm:text-[11px] font-bold tracking-tight text-white drop-shadow-xs truncate">
                  {cat.name}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom Footer Controls */}
      <div className="flex items-center justify-between mt-2 sm:mt-3 text-slate-500">
        <Link
          href="/kategori/tum-kumaslar"
          className="text-[11px] sm:text-xs font-bold text-[#801030] hover:text-[#5c0b22] flex items-center gap-1 transition"
        >
          <span>Tüm Kategorileri Gör</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>

        {categories.length > 1 && (
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
        )}
      </div>
    </section>
  );
};
