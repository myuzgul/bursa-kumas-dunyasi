import React from 'react';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { formatCurrency } from '@/lib/services/meterEngine';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    sku: string;
    base_price: number;
    discount_price?: number;
    main_image_url: string;
    is_meter_sale?: number;
    stock_meter?: number;
    is_bestseller?: number;
    is_new?: number;
    category_name?: string;
    badge_ids?: string[];
    badges?: Array<{ title: string; bg_color?: string; text_color?: string }>;
  };
}

const BADGE_DEFAULTS: Record<string, { title: string; bg: string; text: string }> = {
  'badge-cok-satan': { title: 'Çok Satan', bg: '#f59e0b', text: '#0f172a' },
  'badge-yeni-sezon': { title: 'Yeni Sezon', bg: '#2563eb', text: '#ffffff' },
  'badge-su-itici': { title: 'Su & Leke İtici', bg: '#0284c7', text: '#ffffff' },
  'badge-pamuk': { title: '%100 Pamuk', bg: '#16a34a', text: '#ffffff' },
  'badge-bursa-dokumasi': { title: 'Bursa Dokuması', bg: '#1e1b4b', text: '#facc15' },
  'badge-cift-en': { title: '280 cm Çift En', bg: '#7c3aed', text: '#ffffff' },
  'badge-firsat': { title: 'Fırsat Ürünü', bg: '#dc2626', text: '#ffffff' },
  'badge-pet-friendly': { title: 'Pet-Friendly', bg: '#0d9488', text: '#ffffff' },
};

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const currentPrice = product.discount_price && product.discount_price < product.base_price 
    ? product.discount_price 
    : product.base_price;
  const hasDiscount = Boolean(product.discount_price && product.discount_price < product.base_price);
  const discountDifference = hasDiscount ? Math.round(product.base_price - product.discount_price!) : 0;
  const discountPercent = hasDiscount
    ? Math.round(((product.base_price - product.discount_price!) / product.base_price) * 100)
    : 0;

  const isStockTracked = (product as any).track_stock === 1 || (product.stock_meter !== null && product.stock_meter !== undefined && (product as any).track_stock !== 0);
  const isOutOfStock = (product as any).stock_status === 'outofstock' || (isStockTracked && Number(product.stock_meter || 0) <= 0);

  return (
    <div className={`group bg-white rounded-2xl border overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col justify-between ${
      isOutOfStock ? 'border-red-200/80 opacity-90' : 'border-slate-200/90 hover:border-[#801030]/40'
    }`}>
      {/* 1. IMAGE CONTAINER (Portrait 3:4 - Prevents half cut-off) */}
      <div className="relative">
        <Link href={`/urun/${product.slug}`} className="relative block aspect-[3/4] overflow-hidden bg-slate-50">
          <img
            src={product.main_image_url}
            alt={product.name}
            className={`w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out ${
              isOutOfStock ? 'grayscale-[30%] opacity-85' : ''
            }`}
            loading="lazy"
          />

          {/* Badges on Top-Left */}
          <div className="absolute top-2 left-2 flex flex-col gap-1 z-10 pointer-events-none">
            {isOutOfStock ? (
              <span className="bg-slate-900/95 text-white text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded shadow-sm">
                STOKTA YOK
              </span>
            ) : (
              <>
                {/* % İndirim Badge (Screenshot Compliant) */}
                {hasDiscount && (
                  <span className="bg-[#801030] text-white text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-md shadow-xs">
                    %{discountPercent} İndirim
                  </span>
                )}

                {/* Custom Badges from badge_ids */}
                {product.badge_ids &&
                  product.badge_ids.slice(0, 1).map((bId) => {
                    const badgeDef = BADGE_DEFAULTS[bId];
                    if (!badgeDef) return null;
                    return (
                      <span
                        key={bId}
                        className="text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded shadow-xs"
                        style={{
                          backgroundColor: badgeDef.bg,
                          color: badgeDef.text,
                        }}
                      >
                        {badgeDef.title}
                      </span>
                    );
                  })}

                {product.is_bestseller === 1 && !product.badge_ids?.includes('badge-cok-satan') && (
                  <span className="bg-amber-500 text-slate-950 text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
                    ÇOK SATAN
                  </span>
                )}
                {product.is_new === 1 && !product.badge_ids?.includes('badge-yeni-sezon') && !hasDiscount && (
                  <span className="bg-blue-600 text-white text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
                    YENİ
                  </span>
                )}
              </>
            )}
          </div>
        </Link>
      </div>

      {/* 2. PRODUCT INFO & DETAILS */}
      <div className="p-2.5 sm:p-3.5 flex-1 flex flex-col justify-between">
        <div>
          {/* Rating */}
          <div className="flex items-center gap-1 mb-1">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-amber-400" />
              ))}
            </div>
            <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium">(5.0)</span>
          </div>

          {/* Title */}
          <Link href={`/urun/${product.slug}`}>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-2 hover:text-[#801030] transition leading-snug">
              {product.name}
            </h3>
          </Link>

          <div className="text-[10px] sm:text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span className="truncate">SKU: {product.sku}</span>
            {isOutOfStock ? (
              <span className="text-red-600 font-bold bg-red-50 px-1.5 py-0.2 rounded border border-red-200">
                Tükendi
              </span>
            ) : isStockTracked ? (
              <span className="text-emerald-700 font-medium">
                {product.stock_meter}m
              </span>
            ) : (
              <span className="text-emerald-700 font-medium">Mevcut</span>
            )}
          </div>
        </div>

        {/* 3. PRICE, "HER METREDE X TL İNDİRİM" & BUTTON */}
        <div className="pt-2 sm:pt-2.5 mt-2 border-t border-slate-100 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-1.5 min-h-[44px]">
            {/* Price Column */}
            <div className="flex-1 min-w-0">
              {hasDiscount && (
                <div className="text-[10px] sm:text-xs text-slate-400 line-through leading-tight">
                  {formatCurrency(product.base_price)}
                </div>
              )}
              <div className="text-sm sm:text-base md:text-lg font-black text-[#801030] leading-none mt-0.5">
                {formatCurrency(currentPrice)}
              </div>
              <div className="text-[10px] font-medium text-slate-500 mt-0.5">
                / metre
              </div>
            </div>

            {/* "Her metrede X TL indirim" Badge (Screenshot Exact Match) */}
            {hasDiscount && discountDifference > 0 && (
              <div className="flex-shrink-0 bg-[#FFF8F6] border border-[#801030]/25 rounded-xl px-2 py-1 text-center shadow-2xs">
                <div className="text-[8.5px] sm:text-[9.5px] font-medium text-[#801030] leading-tight">
                  Her metrede
                </div>
                <div className="text-xs sm:text-sm font-black text-[#801030] leading-tight my-0.5 whitespace-nowrap">
                  {discountDifference} TL
                </div>
                <div className="text-[8.5px] sm:text-[9.5px] font-medium text-[#801030] leading-tight">
                  indirim
                </div>
              </div>
            )}
          </div>

          {/* Kumaşa Bak → Button (Full Width Burgundy Button) */}
          <Link
            href={`/urun/${product.slug}`}
            className={`w-full py-2 px-2.5 sm:px-3 rounded-xl font-bold text-xs sm:text-sm text-center transition flex items-center justify-center gap-1.5 shadow-xs active:scale-[0.99] ${
              isOutOfStock
                ? 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                : 'bg-[#801030] hover:bg-[#680b26] text-white'
            }`}
          >
            <span>{isOutOfStock ? 'Tükendi' : 'Kumaşa Bak'}</span>
            {!isOutOfStock && <span className="text-xs transition-transform group-hover:translate-x-0.5">→</span>}
          </Link>
        </div>
      </div>
    </div>
  );
};
