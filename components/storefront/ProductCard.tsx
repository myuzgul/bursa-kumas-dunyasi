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
  const currentPrice = product.discount_price || product.base_price;
  const hasDiscount = product.discount_price && product.discount_price < product.base_price;
  const discountPercent = hasDiscount
    ? Math.round(((product.base_price - product.discount_price!) / product.base_price) * 100)
    : 0;

  const isStockTracked = (product as any).track_stock === 1 || (product.stock_meter !== null && product.stock_meter !== undefined && (product as any).track_stock !== 0);
  const isOutOfStock = isStockTracked && Number(product.stock_meter || 0) <= 0;

  return (
    <div className={`group bg-white rounded-xl border overflow-hidden hover:shadow-lg transition duration-200 flex flex-col ${
      isOutOfStock ? 'border-red-200/80 opacity-90' : 'border-slate-200 hover:border-slate-300'
    }`}>
      {/* 1. IMAGE CONTAINER */}
      <Link href={`/urun/${product.slug}`} className="relative block aspect-[4/3] overflow-hidden bg-slate-100">
        <img
          src={product.main_image_url}
          alt={product.name}
          className={`w-full h-full object-cover group-hover:scale-105 transition duration-300 ease-out ${
            isOutOfStock ? 'grayscale-[30%] opacity-85' : ''
          }`}
          loading="lazy"
        />

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
          {isOutOfStock ? (
            <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-sm">
              STOKTA YOK
            </span>
          ) : (
            <>
              {hasDiscount && (
                <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
                  %{discountPercent} İNDİRİM
                </span>
              )}

              {/* Custom Badges from badge_ids */}
              {product.badge_ids &&
                product.badge_ids.map((bId) => {
                  const badgeDef = BADGE_DEFAULTS[bId];
                  if (!badgeDef) return null;
                  return (
                    <span
                      key={bId}
                      className="text-[10px] font-black px-2 py-0.5 rounded shadow-xs"
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
                <span className="bg-amber-500 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
                  ÇOK SATAN
                </span>
              )}
              {product.is_new === 1 && !product.badge_ids?.includes('badge-yeni-sezon') && (
                <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
                  YENİ
                </span>
              )}
            </>
          )}
        </div>
      </Link>

      {/* 2. PRODUCT INFO */}
      <div className="p-3.5 flex-1 flex flex-col justify-between">
        <div>
          {/* Rating */}
          <div className="flex items-center gap-1 mb-1.5">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3 h-3 fill-amber-400" />
              ))}
            </div>
            <span className="text-[10px] text-slate-400 font-medium">(5.0)</span>
          </div>

          {/* Title */}
          <Link href={`/urun/${product.slug}`}>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-2 hover:text-blue-900 transition leading-snug">
              {product.name}
            </h3>
          </Link>

          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>SKU: {product.sku}</span>
            {isOutOfStock ? (
              <span className="text-red-600 font-bold bg-red-50 px-1.5 py-0.2 rounded border border-red-200">
                Stokta Yok
              </span>
            ) : isStockTracked ? (
              <span className="text-emerald-700 font-medium">
                Stokta: {product.stock_meter} m
              </span>
            ) : (
              <span className="text-emerald-700 font-medium">Stokta Var</span>
            )}
          </div>
        </div>

        {/* 3. PRICE & CTA */}
        <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <div>
            {hasDiscount && (
              <div className="text-[11px] text-slate-400 line-through">
                {formatCurrency(product.base_price)}
              </div>
            )}
            <div className="text-sm sm:text-base font-extrabold text-blue-950 leading-none">
              {formatCurrency(currentPrice)}
              <span className="text-[10px] font-normal text-slate-500 ml-1">/ m</span>
            </div>
          </div>

          <Link
            href={`/urun/${product.slug}`}
            className={`px-3 py-1.5 font-bold text-xs rounded-lg transition flex items-center gap-1 border ${
              isOutOfStock
                ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                : 'bg-slate-50 hover:bg-blue-50 text-blue-900 border-slate-200 hover:border-blue-300'
            }`}
          >
            <span>{isOutOfStock ? 'Tükendi' : 'İncele'}</span>
            <span className="text-blue-600">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
