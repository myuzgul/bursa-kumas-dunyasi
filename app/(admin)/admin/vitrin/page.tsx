'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Sparkles, Save, Search, CheckCircle2, AlertCircle, 
  Layers, Package, Eye, EyeOff, RefreshCw, SlidersHorizontal,
  Sliders, ArrowUpDown, Filter, Check, ChevronRight, ExternalLink
} from 'lucide-react';
import { formatCurrency } from '@/lib/services/meterEngine';

interface ShowcaseSettings {
  title: string;
  subtitle: string;
  badge_suffix: string;
  show_model_count: number;
  show_all_tab: number;
  all_tab_title: string;
  max_items: number;
  is_active: number;
}

interface ProductItem {
  id: string;
  name: string;
  sku: string;
  category_id: string;
  category_name: string;
  base_price: number;
  discount_price?: number;
  main_image_url: string;
  stock_meter: number;
  is_active: number;
  is_featured: number;
  vitrin_order: number;
}

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
}

export default function AdminVitrinPage() {
  const [settings, setSettings] = useState<ShowcaseSettings | null>(null);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterVisibility, setFilterVisibility] = useState<'all' | 'featured' | 'not_featured'>('all');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings/showcase');
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
        setProducts(data.products || []);
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error('Failed to load showcase data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSavingSettings(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/admin/settings/showcase', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', message: 'Vitrin ayarları başarıyla kaydedildi!' });
        setSettings(data.settings);
      } else {
        setFeedback({ type: 'error', message: data.message || 'Kayıt sırasında hata oluştu.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Bağlantı hatası oluştu.' });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleToggleShowcase = async (product: ProductItem) => {
    setTogglingId(product.id);
    const newFeatured = product.is_featured === 1 ? 0 : 1;

    // Optimistic UI update
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, is_featured: newFeatured } : p))
    );

    try {
      const res = await fetch('/api/admin/products/toggle-showcase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, isFeatured: newFeatured === 1 }),
      });
      const data = await res.json();
      if (!data.success) {
        // Revert on error
        setProducts((prev) =>
          prev.map((p) => (p.id === product.id ? { ...p, is_featured: product.is_featured } : p))
        );
        alert(data.message || 'Hata oluştu.');
      }
    } catch (err) {
      // Revert on error
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, is_featured: product.is_featured } : p))
      );
    } finally {
      setTogglingId(null);
    }
  };

  const handleOrderChange = async (productId: string, newOrder: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, vitrin_order: newOrder } : p))
    );

    try {
      await fetch('/api/admin/products/toggle-showcase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, orderIndex: newOrder }),
      });
    } catch (err) {
      console.error('Failed to update vitrin order:', err);
    }
  };

  const handleBatchCategoryAction = async (action: 'enable' | 'disable') => {
    const categoryName = selectedCategory === 'all' 
      ? 'tüm kategorilerdeki' 
      : `"${categories.find((c) => c.id === selectedCategory)?.name}" kategorisindeki`;

    const confirmMsg = action === 'enable'
      ? `${categoryName} tüm ürünler ana sayfa vitrinine eklensin mi?`
      : `${categoryName} tüm ürünler ana sayfa vitrininden kaldırılsın mı?`;

    if (!confirm(confirmMsg)) return;

    setLoading(true);
    try {
      const res = await fetch('/api/admin/products/toggle-showcase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchAction: action, categoryId: selectedCategory }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', message: data.message });
        await fetchData();
      }
    } catch (err) {
      alert('Toplu işlem sırasında hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // Compute counts
  const totalFeaturedCount = products.filter((p) => p.is_featured === 1).length;

  const categoryCounts = categories.map((cat) => {
    const catProducts = products.filter((p) => p.category_id === cat.id);
    const catFeaturedCount = catProducts.filter((p) => p.is_featured === 1).length;
    return {
      ...cat,
      total: catProducts.length,
      featured: catFeaturedCount,
    };
  });

  // Filter products for display
  const filteredProducts = products.filter((p) => {
    // Category filter
    if (selectedCategory !== 'all' && p.category_id !== selectedCategory) {
      return false;
    }
    // Visibility filter
    if (filterVisibility === 'featured' && p.is_featured !== 1) return false;
    if (filterVisibility === 'not_featured' && p.is_featured === 1) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = p.name.toLowerCase().includes(q);
      const matchSku = p.sku.toLowerCase().includes(q);
      const matchCat = p.category_name.toLowerCase().includes(q);
      if (!matchName && !matchSku && !matchCat) return false;
    }

    return true;
  });

  if (loading || !settings) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-slate-500 font-semibold text-sm">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
          <span>Vitrin ayarları ve ürünler yükleniyor...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-amber-500" />
            <span>Ana Sayfa Vitrin Yönetimi</span>
            <span className="text-xs font-bold text-blue-900 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
              {totalFeaturedCount} Vitrin Ürünü Aktif
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Ana sayfa vitrininde listelenecek kumaşları, kategori sekmelerini ve sıralamalarını yönetin.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Vitrini Önizle</span>
          </Link>

          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={savingSettings}
            className="inline-flex items-center justify-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow transition disabled:opacity-50"
          >
            {savingSettings ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{savingSettings ? 'Kaydediliyor...' : 'Ayarları Kaydet'}</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-xs font-semibold ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* 1. VITRIN SETTINGS CARD */}
      <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Vitrin Başlık & Görünüm Ayarları
            </h2>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={settings.is_active === 1}
              onChange={(e) =>
                setSettings({ ...settings, is_active: e.target.checked ? 1 : 0 })
              }
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
            />
            <span className="text-xs font-bold text-slate-800">
              {settings.is_active === 1 ? 'Vitrin Bölümü Aktif' : 'Vitrin Bölümü Pasif'}
            </span>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Vitrin Başlığı (Ana Sayfada Görünen) *
            </label>
            <input
              type="text"
              required
              placeholder="Örn: Öne Çıkan Kumaşlarımız"
              value={settings.title}
              onChange={(e) => setSettings({ ...settings, title: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Sayaç İsim Eki
            </label>
            <input
              type="text"
              placeholder="Örn: Kumaş veya Model"
              value={settings.badge_suffix}
              onChange={(e) => setSettings({ ...settings, badge_suffix: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Maksimum Ürün Sayısı
            </label>
            <input
              type="number"
              min="4"
              max="100"
              value={settings.max_items}
              onChange={(e) => setSettings({ ...settings, max_items: Number(e.target.value) || 24 })}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Alt Açıklama (Opsiyonel)
            </label>
            <input
              type="text"
              placeholder="Boş bırakılabilir"
              value={settings.subtitle}
              onChange={(e) => setSettings({ ...settings, subtitle: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <div className="flex items-center gap-4 pt-4 sm:col-span-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={settings.show_model_count === 1}
                onChange={(e) =>
                  setSettings({ ...settings, show_model_count: e.target.checked ? 1 : 0 })
                }
                className="rounded text-blue-600"
              />
              <span>Başlık Yanında Model Sayacı Göster (Örn: 23 Model)</span>
            </label>
          </div>
        </div>
      </form>

      {/* 2. CATEGORY PILLS & MANAGEMENT BAR */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>Kategoriye Göre Vitrin Ürünlerini Yönet</span>
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Aşağıdaki kategori butonlarına tıklayarak o kategorideki ürünleri listeleyebilir ve vitrine ekleyip çıkarabilirsiniz.
            </p>
          </div>

          {/* Quick Batch Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleBatchCategoryAction('enable')}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition"
            >
              + Bu Kategorideki Tümünü Vitrine Ekle
            </button>
            <button
              type="button"
              onClick={() => handleBatchCategoryAction('disable')}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl text-xs font-bold transition"
            >
              - Bu Kategorideki Tümünü Vitrinden Çıkar
            </button>
          </div>
        </div>

        {/* Category Filter Pills (Exact same visual styling as requested) */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
              selectedCategory === 'all'
                ? 'bg-slate-950 text-white shadow-sm ring-2 ring-slate-900/20'
                : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <span>Tümü</span>
            <span className={`text-[11px] font-semibold px-1.5 py-0.2 rounded-full ${
              selectedCategory === 'all' ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'
            }`}>
              {totalFeaturedCount}
            </span>
          </button>

          {categoryCounts.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-slate-950 text-white shadow-sm ring-2 ring-slate-900/20'
                    : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span>{cat.name}</span>
                <span className={`text-[11px] font-semibold px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'
                }`}>
                  {cat.featured}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Ürün adı, SKU veya kategori ile filtrele..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <div className="sm:col-span-4">
            <select
              value={filterVisibility}
              onChange={(e) => setFilterVisibility(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="all">Tüm Ürünleri Göster</option>
              <option value="featured">Sadece Vitrindekiler ({totalFeaturedCount})</option>
              <option value="not_featured">Vitrinde Olmayanlar</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. PRODUCTS LIST TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800">
            Listelenen Kumaşlar ({filteredProducts.length})
          </span>
          <span className="text-[11px] text-slate-500">
            Vitrin durumu için sağdaki anahtara tıklayınız.
          </span>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Package className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-xs">Seçilen kriterlere uygun kumaş bulunamadı.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
                  <th className="p-3 w-16 text-center">Görsel</th>
                  <th className="p-3">Kumaş Adı & SKU</th>
                  <th className="p-3">Kategori</th>
                  <th className="p-3">Birim Fiyat</th>
                  <th className="p-3 w-28 text-center">Vitrin Sırası</th>
                  <th className="p-3 w-36 text-center">Vitrinde Göster</th>
                  <th className="p-3 w-20 text-center">Düzenle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => {
                  const isFeatured = p.is_featured === 1;
                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-slate-50/70 transition ${
                        isFeatured ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      {/* Image */}
                      <td className="p-3 text-center">
                        <img
                          src={p.main_image_url || '/placeholder.jpg'}
                          alt={p.name}
                          className="w-12 h-12 object-cover rounded-lg border mx-auto"
                        />
                      </td>

                      {/* Name & SKU */}
                      <td className="p-3">
                        <div className="font-bold text-slate-900 line-clamp-1">{p.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{p.sku}</div>
                      </td>

                      {/* Category */}
                      <td className="p-3">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md font-semibold text-[11px]">
                          {p.category_name}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="p-3 font-bold text-blue-950">
                        {formatCurrency(p.discount_price || p.base_price)} / m
                      </td>

                      {/* Vitrin Sırası */}
                      <td className="p-3 text-center">
                        <input
                          type="number"
                          min="0"
                          value={p.vitrin_order}
                          onChange={(e) => handleOrderChange(p.id, parseInt(e.target.value) || 0)}
                          className="w-16 text-center bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-slate-900 focus:bg-white"
                          title="Vitrindeki sıralama önceliği (Küçük sayılar önce gösterilir)"
                        />
                      </td>

                      {/* Vitrinde Göster Switch */}
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleShowcase(p)}
                          disabled={togglingId === p.id}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition ${
                            isFeatured
                              ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-xs ring-2 ring-amber-400/30'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-500 border border-slate-200'
                          }`}
                        >
                          {togglingId === p.id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : isFeatured ? (
                            <Eye className="w-3.5 h-3.5 text-slate-950" />
                          ) : (
                            <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                          )}
                          <span>{isFeatured ? 'Vitrinde Açık' : 'Vitrinde Kapalı'}</span>
                        </button>
                      </td>

                      {/* Edit Button */}
                      <td className="p-3 text-center">
                        <Link
                          href={`/admin/urunler/${p.id}`}
                          className="p-1.5 inline-block text-slate-400 hover:text-blue-900 transition"
                          title="Ürünü Düzenle"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
