'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Heart, 
  Trash2, 
  ShoppingBag, 
  ArrowRight, 
  Scissors, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { useCart } from '@/components/storefront/CartContext';
import { formatCurrency } from '@/lib/services/meterEngine';

export default function CustomerFavoritesPage() {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { addItem, openCart } = useCart();
  const [addedId, setAddedId] = useState<string | null>(null);

  const fetchFavorites = async () => {
    try {
      const res = await fetch('/api/user/favorites');
      if (res.ok) {
        const data = await res.json();
        setFavorites(data.favorites || []);
      }
    } catch (e) {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const handleRemove = async (productId: string) => {
    try {
      const res = await fetch(`/api/user/favorites?productId=${productId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setFavorites((prev) => prev.filter((f) => f.id !== productId));
      }
    } catch (e) {
      // Ignore
    }
  };

  const handleAddToCart = (product: any) => {
    addItem({
      productId: product.id,
      name: product.name,
      sku: product.sku,
      image: product.main_image_url,
      unitPrice: product.discount_price || product.base_price,
      meterQuantity: 1,
      maxStockMeter: product.stock_meter || 100,
    });
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 2000);
    openCart();
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-600 fill-rose-600" />
            Favori Kumaşlarım ({favorites.length})
          </h1>
          <p className="text-xs text-slate-500">
            Beğendiğiniz ve daha sonra satın almak üzere kaydettiğiniz kumaşlar
          </p>
        </div>

        <Link
          href="/katalog"
          className="px-4 py-2 bg-slate-100 hover:bg-blue-900 hover:text-white text-slate-800 font-bold text-xs rounded-xl border border-slate-200 transition"
        >
          Koleksiyonu İncele
        </Link>
      </div>

      {/* Favorites List */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-xs text-slate-400">
          Favoriler yükleniyor...
        </div>
      ) : favorites.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
          <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto">
            <Heart className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900">Henüz Favori Kumaşınız Yok</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Beğendiğiniz kumaşları kalp ikonuna tıklayarak favorilerinize ekleyebilirsiniz.
            </p>
          </div>
          <Link
            href="/katalog"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-900 text-white font-bold text-xs rounded-xl hover:bg-blue-800 transition"
          >
            <span>Kumaşları Keşfet</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {favorites.map((product) => {
            const currentPrice = product.discount_price || product.base_price;
            const hasStock = (product.stock_meter || 0) > 0;

            return (
              <div
                key={product.id}
                className="bg-white rounded-3xl border border-slate-200 p-4 shadow-sm hover:border-slate-300 transition flex flex-col justify-between space-y-3 group"
              >
                <div className="space-y-3">
                  {/* Image & Quick Remove */}
                  <div className="relative aspect-4/3 rounded-2xl overflow-hidden bg-slate-100 border border-slate-100">
                    <Link href={`/urun/${product.slug}`}>
                      <img
                        src={product.main_image_url || '/placeholder.png'}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    </Link>

                    <button
                      onClick={() => handleRemove(product.id)}
                      className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs text-rose-600 hover:bg-rose-600 hover:text-white flex items-center justify-center shadow-md transition"
                      title="Favorilerden Kaldır"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    {product.discount_price && (
                      <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 bg-rose-600 text-white font-black text-[10px] rounded-lg shadow-sm">
                        İndirimli
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      SKU: {product.sku}
                    </p>
                    <Link
                      href={`/urun/${product.slug}`}
                      className="font-bold text-xs text-slate-900 line-clamp-2 hover:text-blue-900 transition"
                    >
                      {product.name}
                    </Link>

                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-sm font-black text-blue-950">
                        {formatCurrency(currentPrice)} / m
                      </span>
                      {product.discount_price && product.base_price > product.discount_price && (
                        <span className="text-xs text-slate-400 line-through">
                          {formatCurrency(product.base_price)}
                        </span>
                      )}
                    </div>

                    <p className={`text-[10px] font-bold ${hasStock ? 'text-emerald-700' : 'text-rose-600'}`}>
                      {hasStock ? `Stokta: ${product.stock_meter} Metre Mevcut` : 'Tükendi'}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => handleAddToCart(product)}
                    disabled={!hasStock}
                    className="flex-1 py-2.5 bg-blue-900 hover:bg-blue-800 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>{addedId === product.id ? 'Sepete Eklendi ✓' : 'Sepete Ekle (1m)'}</span>
                  </button>

                  <Link
                    href={`/urun/${product.slug}`}
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
                    title="Ürün Detayı"
                  >
                    <Scissors className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
