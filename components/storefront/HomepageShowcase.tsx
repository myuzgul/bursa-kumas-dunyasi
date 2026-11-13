'use client';

import React from 'react';
import { ProductCard } from './ProductCard';
import { Package } from 'lucide-react';

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
  settings,
}) => {
  const totalCount = initialProducts.length;
  const badgeSuffix = settings.badge_suffix || 'Kumaş';

  // Vitrin yalnızca tek tek vitrine eklenen ürünlerden oluşur (kategori sekmesi yok)
  const filteredProducts = initialProducts;

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
      </div>

      {/* 3. PRODUCT GRID */}
      {filteredProducts.length === 0 ? (
        <div className="p-12 text-center bg-slate-50 rounded-3xl border border-slate-200 text-slate-500 text-xs">
          <Package className="w-8 h-8 mx-auto text-slate-300 mb-2" />
          <span>Vitrinde gösterilecek ürün bulunamadı.</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6 animate-in fade-in duration-300">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
};
