'use client';

import React, { useState, useMemo } from 'react';
import { ProductCard } from './ProductCard';
import { Sparkles, Package } from 'lucide-react';

interface CategoryTab {
  id: string;
  name: string;
  slug: string;
  count: number;
}

interface ShowcaseSettings {
  title: string;
  subtitle?: string;
  badge_suffix?: string;
  show_model_count?: number;
  show_all_tab?: number;
  all_tab_title?: string;
  is_active?: number;
}

interface HomepageShowcaseProps {
  initialProducts: any[];
  categories: CategoryTab[];
  settings: ShowcaseSettings;
}

export const HomepageShowcase: React.FC<HomepageShowcaseProps> = ({
  initialProducts,
  categories,
  settings,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const totalCount = initialProducts.length;
  const badgeSuffix = settings.badge_suffix || 'Kumaş';

  // Filter products by selected category
  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'all') {
      return initialProducts;
    }
    return initialProducts.filter((p) => p.category_id === selectedCategory);
  }, [initialProducts, selectedCategory]);

  if (settings.is_active === 0 || totalCount === 0) {
    return null;
  }

  return (
    <section className="max-w-7xl mx-auto px-4 space-y-6">
      {/* 1. SECTION HEADER */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {settings.title || 'Öne Çıkan Kumaşlarımız'}
          </h2>

          {/* Model/Fabric Count Badge */}
          {settings.show_model_count !== 0 && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
              {totalCount} {badgeSuffix}
            </span>
          )}
        </div>

        {settings.subtitle && settings.subtitle.trim().length > 0 && (
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
            {settings.subtitle}
          </p>
        )}

        {/* 2. CATEGORY FILTER PILLS (Matching screenshot design) */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {/* "Tümü" Pill Button */}
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer select-none ${
              selectedCategory === 'all'
                ? 'bg-slate-950 text-white shadow-sm ring-2 ring-slate-900/20'
                : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <span>{settings.all_tab_title || 'Tümü'}</span>
            <span className="ml-1 text-[11px] opacity-80">({totalCount})</span>
          </button>

          {/* Category Pills */}
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer select-none ${
                  isSelected
                    ? 'bg-slate-950 text-white font-bold shadow-sm ring-2 ring-slate-900/20'
                    : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span>{cat.name}</span>
                <span className="ml-1 text-[11px] opacity-75">({cat.count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. PRODUCT GRID */}
      {filteredProducts.length === 0 ? (
        <div className="p-12 text-center bg-slate-50 rounded-3xl border border-slate-200 text-slate-500 text-xs">
          <Package className="w-8 h-8 mx-auto text-slate-300 mb-2" />
          <span>Bu kategoride vitrinde gösterilecek ürün bulunamadı.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 animate-in fade-in duration-300">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
};
