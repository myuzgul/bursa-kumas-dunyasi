'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Play, Pause } from 'lucide-react';

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
    subtitle: 'Evini Yenile',
    slug: 'nevresimlik',
    image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80',
    gradientClass: 'from-[#881337] via-[#9f1239] to-[#be123c]',
  },
  {
    id: 'cat-duck-bezi',
    name: 'Duck Bezi',
    subtitle: 'Kırlent Dik',
    slug: 'duck-bezi',
    image: 'https://images.unsplash.com/photo-1604014237800-1c9102c219da?auto=format&fit=crop&w=800&q=80',
    gradientClass: 'from-[#064e3b] via-[#047857] to-[#059669]',
  },
  {
    id: 'cat-muslin',
    name: 'Müslin',
    subtitle: 'Yumuşacık',
    slug: 'muslin',
    image: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=800&q=80',
    gradientClass: 'from-[#581c87] via-[#6b21a8] to-[#7e22ce]',
  },
  {
    id: 'cat-viskon',
    name: 'Viskon',
    subtitle: 'Dökümlü',
    slug: 'viskon-kumaslar',
    image: 'https://images.unsplash.com/photo-1579656381226-5fc0f0100c3b?auto=format&fit=crop&w=800&q=80',
    gradientClass: 'from-[#7c2d12] via-[#9a3412] to-[#c2410c]',
  },
  {
    id: 'cat-tul-perde',
    name: 'Tül Perde',
    subtitle: 'Evini Yenile',
    slug: 'tul-perde',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
    gradientClass: 'from-[#134e4a] via-[#0f766e] to-[#0d9488]',
  },
  {
    id: 'cat-dantel',
    name: 'Dantel',
    subtitle: 'Abiyeni Dik',
    slug: 'dantel',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80',
    gradientClass: 'from-[#701a75] via-[#86198f] to-[#a21caf]',
  },
  {
    id: 'cat-fisto',
    name: 'Fisto',
    subtitle: 'Gömlek Dik',
    slug: 'fisto',
    image: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=800&q=80',
    gradientClass: 'from-[#1e3a8a] via-[#1d4ed8] to-[#2563eb]',
  },
  {
    id: 'cat-keten',
    name: 'Keten',
    subtitle: 'Takımını Dik',
    slug: 'keten',
    image: 'https://images.unsplash.com/photo-1540518614846-7ede433c4ef7?auto=format&fit=crop&w=800&q=80',
    gradientClass: 'from-[#713f12] via-[#854d0e] to-[#a16207]',
  },
];

export const CategoryShowcaseGrid: React.FC = () => {
  const [isPaused, setIsPaused] = useState(false);

  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-5 sm:mb-6 gap-2">
        <div>
          <div className="text-[11px] sm:text-xs font-black text-[#801030] uppercase tracking-wider">
            Kumaş Koleksiyonları
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Popüler Kumaş Kategorileri
          </h2>
        </div>
        <Link
          href="/kategori/tum-kumaslar"
          className="text-xs font-bold text-[#801030] hover:text-[#5c0b22] flex items-center gap-1 transition"
        >
          <span>Tüm Kategorileri Gör</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Categories Grid (2 Columns on Mobile, 4 Columns on Desktop) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5">
        {SHOWCASE_CATEGORIES.map((cat) => (
          <Link
            key={cat.id}
            href={`/kategori/${cat.slug}`}
            className="group relative aspect-[4/5] sm:aspect-[1/1.05] rounded-2xl overflow-hidden border border-slate-200/90 bg-slate-100 shadow-xs hover:shadow-xl hover:border-slate-300 transition-all duration-300 flex flex-col justify-end"
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

            {/* Colored Bottom Gradient Badge with Rounded Banner (Exact Screenshot Style) */}
            <div
              className={`relative z-10 m-2 sm:m-3 p-2.5 sm:p-3 rounded-xl bg-gradient-to-r ${cat.gradientClass} text-white shadow-lg backdrop-blur-xs flex flex-col items-center justify-center text-center transition-transform duration-300 group-hover:-translate-y-1`}
            >
              <h3 className="text-xs sm:text-sm md:text-base font-black tracking-wide leading-tight drop-shadow-sm">
                {cat.name}
              </h3>
              <p className="text-[10px] sm:text-xs font-semibold text-white/95 leading-tight mt-0.5 drop-shadow-sm">
                {cat.subtitle}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Bottom Footer Controls (Screenshot: Hareketi Durdur) */}
      <div className="flex items-center justify-end mt-3 sm:mt-4">
        <button
          type="button"
          onClick={() => setIsPaused(!isPaused)}
          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-slate-800 transition py-1 px-2.5 rounded-lg hover:bg-slate-100"
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
