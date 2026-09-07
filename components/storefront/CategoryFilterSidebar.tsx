'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { SlidersHorizontal, RotateCcw, ArrowRight, Check } from 'lucide-react';

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  productCount?: number;
}

interface CategoryFilterSidebarProps {
  categories: CategoryItem[];
  currentSlug: string;
  minPrice?: string;
  maxPrice?: string;
}

const PRESET_PRICE_RANGES = [
  { label: 'Tümü', min: '', max: '' },
  { label: '0 - 250 TL', min: '0', max: '250' },
  { label: '250 - 500 TL', min: '250', max: '500' },
  { label: '500 - 1.000 TL', min: '500', max: '1000' },
  { label: '1.000 TL ve Üzeri', min: '1000', max: '' },
];

export const CategoryFilterSidebar: React.FC<CategoryFilterSidebarProps> = ({
  categories,
  currentSlug,
  minPrice = '',
  maxPrice = '',
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [inputMin, setInputMin] = useState(minPrice);
  const [inputMax, setInputMax] = useState(maxPrice);

  const applyPriceFilter = (min: string, max: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (min) {
      params.set('min_price', min);
    } else {
      params.delete('min_price');
    }

    if (max) {
      params.set('max_price', max);
    } else {
      params.delete('max_price');
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyPriceFilter(inputMin.trim(), inputMax.trim());
  };

  const handleClearFilter = () => {
    setInputMin('');
    setInputMax('');
    applyPriceFilter('', '');
  };

  const isFilterActive = Boolean(minPrice || maxPrice);

  return (
    <aside className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-blue-900" />
            <span>Kumaş Filtreleri</span>
          </h3>

          {isFilterActive && (
            <button
              onClick={handleClearFilter}
              type="button"
              className="text-[11px] font-bold text-red-600 hover:text-red-700 flex items-center gap-1 transition cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Temizle</span>
            </button>
          )}
        </div>

        {/* 1. Category Tree */}
        <div>
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">
            Kategoriler
          </h4>
          <ul className="space-y-1 text-xs">
            <li>
              <Link
                href="/kategori/tum-kumaslar"
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg transition font-medium ${
                  currentSlug === 'tum-kumaslar'
                    ? 'bg-blue-900 text-white font-bold'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-blue-900'
                }`}
              >
                <span>Tüm Kumaşlar</span>
              </Link>
            </li>
            {categories.map((cat) => {
              const isActive = currentSlug === cat.slug;
              return (
                <li key={cat.id}>
                  <Link
                    href={`/kategori/${cat.slug}`}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg transition font-medium ${
                      isActive
                        ? 'bg-blue-900 text-white font-bold'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-blue-900'
                    }`}
                  >
                    <span>{cat.name}</span>
                    {cat.productCount !== undefined && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          isActive ? 'bg-blue-800 text-white' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {cat.productCount}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* 2. Price Filter (Fiyat Filtresi) */}
        <div className="pt-3 border-t border-slate-100 space-y-3">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Fiyat Aralığı (TL)
          </h4>

          {/* Quick Preset Ranges */}
          <div className="space-y-1">
            {PRESET_PRICE_RANGES.map((preset, idx) => {
              const isSelected = minPrice === preset.min && maxPrice === preset.max;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setInputMin(preset.min);
                    setInputMax(preset.max);
                    applyPriceFilter(preset.min, preset.max);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white font-bold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span>{preset.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                </button>
              );
            })}
          </div>

          {/* Custom Min / Max Inputs Form */}
          <form onSubmit={handleCustomSubmit} className="pt-2 space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <input
                  type="number"
                  min="0"
                  placeholder="Min TL"
                  value={inputMin}
                  onChange={(e) => setInputMin(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-semibold focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-900"
                />
              </div>
              <span className="text-slate-400 text-xs font-bold">-</span>
              <div className="flex-1">
                <input
                  type="number"
                  min="0"
                  placeholder="Max TL"
                  value={inputMax}
                  onChange={(e) => setInputMax(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-semibold focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-900"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-lg transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Fiyatı Filtrele</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
};
