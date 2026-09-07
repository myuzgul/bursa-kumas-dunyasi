'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Plus, Search, Edit3, Sliders, Layers, Sparkles, 
  Trash2, Copy, Eye, CheckCircle2, AlertTriangle, 
  RefreshCw, Filter, Archive, ArrowUpDown, Tag, PackageCheck
} from 'lucide-react';
import { formatCurrency } from '@/lib/services/meterEngine';

export default function AdminProductsListPage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState('20');
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });

  // Quick Action Modals
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; product: any | null }>({
    isOpen: false,
    product: null,
  });
  const [stockModal, setStockModal] = useState<{ isOpen: boolean; product: any | null; newStock: number; reason: string }>({
    isOpen: false,
    product: null,
    newStock: 0,
    reason: 'Manuel Stok Düzeltme',
  });

  const [feedback, setFeedback] = useState<{ text: string; success: boolean } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load products with debounce search
  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', limit);
      if (search.trim()) params.set('q', search.trim());
      if (selectedCategory) params.set('category_id', selectedCategory);
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const res = await fetch(`/api/admin/products?${params.toString()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
        setCategories(data.categories || []);
        if (data.pagination) setPagination(data.pagination);
      }
    } catch (e) {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadProducts();
    }, 200);
    return () => clearTimeout(timer);
  }, [search, selectedCategory, statusFilter, page, limit]);

  // Toggle Active/Passive
  const handleToggleStatus = async (product: any) => {
    const nextStatus = product.is_active === 1 ? 0 : 1;
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, is_active: nextStatus } : p))
    );

    try {
      await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: product.id, is_active: nextStatus }),
      });
      setFeedback({
        text: `"${product.name}" durumu ${nextStatus === 1 ? 'Yayında' : 'Pasif'} olarak güncellendi.`,
        success: true,
      });
      setTimeout(() => setFeedback(null), 3000);
    } catch (e) {
      loadProducts();
    }
  };

  // Duplicate Product
  const handleDuplicate = async (product: any) => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/admin/products/duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: product.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback({ text: data.message, success: true });
        loadProducts();
      } else {
        setFeedback({ text: data.message || 'Kopyalanamadı.', success: false });
      }
      setTimeout(() => setFeedback(null), 4000);
    } catch (e) {
      alert('Kopyalama sırasında hata oluştu.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Smart Delete with Order Integrity Check
  const handleConfirmDelete = async () => {
    if (!deleteModal.product) return;
    setIsProcessing(true);

    try {
      const res = await fetch(`/api/admin/products?id=${deleteModal.product.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      setDeleteModal({ isOpen: false, product: null });

      if (res.ok) {
        setFeedback({ text: data.message, success: true });
        loadProducts();
      } else {
        setFeedback({ text: data.message || 'Silinemedi.', success: false });
      }
      setTimeout(() => setFeedback(null), 4000);
    } catch (e) {
      alert('Silme sırasında hata oluştu.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Toggle Vitrin
  const handleToggleVitrin = async (product: any) => {
    const newFeatured = product.is_featured === 1 ? 0 : 1;
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, is_featured: newFeatured } : p))
    );
    try {
      const res = await fetch('/api/admin/products/toggle-showcase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, isFeatured: newFeatured === 1 }),
      });
      if (res.ok) {
        setFeedback({
          text: `"${product.name}" ${newFeatured ? 'ana sayfa vitrinine eklendi.' : 'vitrinden kaldırıldı.'}`,
          success: true,
        });
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch (e) {
      console.error('Vitrin güncelleme hatası:', e);
    }
  };

  // Save Quick Stock
  const handleSaveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockModal.product) return;

    setIsProcessing(true);
    try {
      const res = await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: stockModal.product.id,
          stock_meter: stockModal.newStock,
          reason: stockModal.reason,
        }),
      });

      const data = await res.json();
      setStockModal({ isOpen: false, product: null, newStock: 0, reason: '' });

      if (res.ok) {
        setFeedback({
          text: `"${stockModal.product.name}" stoğu ${stockModal.newStock} metre olarak güncellendi.`,
          success: true,
        });
        loadProducts();
      } else {
        setFeedback({ text: data.message || 'Stok güncellenemedi.', success: false });
      }
      setTimeout(() => setFeedback(null), 3000);
    } catch (e) {
      alert('Stok kaydedilemedi.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>Kumaş & Varyasyon Kataloğu</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 font-bold font-mono">
              {pagination.total} Kumaş
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Viskon, keten, tensel, ayrobin ve tüm kumaşların metre fiyatlarını, varyasyonlarını, stok hareketlerini ve vitrin sıralarını yönetin.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/toplu-guncelleme"
            className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
          >
            <Sliders className="w-4 h-4 text-blue-900" />
            <span>Toplu Fiyat & Stok</span>
          </Link>

          <Link
            href="/admin/urunler/yeni"
            className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Kumaş Ekle</span>
          </Link>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn ${
            feedback.success
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-red-50 text-red-900 border border-red-200'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{feedback.text}</span>
        </div>
      )}

      {/* 2. FILTER & SEARCH BAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Kumaş adı, SKU kodu veya kumaş türü ile arayın..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-300 focus:bg-white text-slate-900 text-xs rounded-xl pl-9 pr-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>

          {/* Category Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 outline-none"
            >
              <option value="">Tüm Kategoriler</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="sm:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 outline-none"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="active">Yalnızca Yayında Olanlar</option>
              <option value="inactive">Pasif / Taslak</option>
              <option value="out_of_stock">Tükenenler (0 Metre)</option>
              <option value="archived">Arşivlenmiş Ürünler</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. PRODUCTS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="p-3.5 w-14">Görsel</th>
                <th className="p-3.5">Kumaş Adı & SKU</th>
                <th className="p-3.5">Kategori</th>
                <th className="p-3.5">Birim Fiyat</th>
                <th className="p-3.5">Metre Stoğu</th>
                <th className="p-3.5">Varyasyon</th>
                <th className="p-3.5">Vitrin</th>
                <th className="p-3.5 text-center">Durum</th>
                <th className="p-3.5 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-900" />
                    <span>Kumaşlar yükleniyor...</span>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-500 space-y-2">
                    <p className="font-bold">Eşleşen kumaş bulunamadı.</p>
                    <p className="text-xs text-slate-400">Arama kriterlerinizi değiştirebilir veya yeni kumaş ekleyebilirsiniz.</p>
                  </td>
                </tr>
              ) : (
                products.map((p: any) => {
                  const isStockTracked = p.track_stock === 1 || (p.stock_meter !== null && p.stock_meter !== undefined && p.track_stock !== 0);
                  const isOutOfStock = isStockTracked && Number(p.stock_meter || 0) <= 0;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition">
                      {/* Image */}
                      <td className="p-3.5">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0">
                          {p.main_image_url ? (
                            <img
                              src={p.main_image_url}
                              alt={p.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[9px] text-slate-400">
                              Yok
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Name & SKU */}
                      <td className="p-3.5 max-w-[220px]">
                        <Link
                          href={`/admin/urunler/${p.id}`}
                          className="font-bold text-slate-900 hover:text-blue-900 line-clamp-1 text-xs"
                        >
                          {p.name}
                        </Link>
                        <div className="font-mono text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>{p.sku}</span>
                          {p.barcode && <span className="text-slate-400">• {p.barcode}</span>}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="p-3.5">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {p.category_names && p.category_names.length > 0 ? (
                            p.category_names.map((name: string, i: number) => (
                              <span
                                key={i}
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                                  i === 0
                                    ? 'bg-blue-50 text-blue-900 border border-blue-200'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {name}
                              </span>
                            ))
                          ) : (
                            <span className="bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded">
                              {p.category_name || 'Genel'}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Price */}
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">
                          {formatCurrency(p.base_price)} / m
                        </div>
                        {p.discount_price && (
                          <div className="text-[11px] font-bold text-blue-900">
                            İndirimli: {formatCurrency(p.discount_price)}
                          </div>
                        )}
                      </td>

                      {/* Stock */}
                      <td className="p-3.5">
                        <button
                          type="button"
                          onClick={() =>
                            setStockModal({
                              isOpen: true,
                              product: p,
                              newStock: Number(p.stock_meter || 0),
                              reason: 'Hızlı Stok Güncelleme',
                            })
                          }
                          className={`font-black text-xs px-2.5 py-1 rounded-lg border flex items-center gap-1 transition ${
                            !isStockTracked
                              ? 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                              : isOutOfStock
                              ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                          }`}
                          title="Stoğu Hızlı Güncelle"
                        >
                          <span>
                            {!isStockTracked
                              ? 'Sınırsız Stok'
                              : isOutOfStock
                              ? 'Tükendi (0m)'
                              : `${p.stock_meter} Metre`}
                          </span>
                          <Edit3 className="w-3 h-3 text-slate-400 ml-0.5" />
                        </button>
                      </td>

                      {/* Variation Status */}
                      <td className="p-3.5">
                        {p.has_variants === 1 ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200">
                            {p.variant_count || 0} Varyasyon
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-slate-400">
                            Basit Ürün
                          </span>
                        )}
                      </td>

                      {/* Vitrin Toggle */}
                      <td className="p-3.5">
                        <button
                          type="button"
                          onClick={() => handleToggleVitrin(p)}
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded transition ${
                            p.is_featured === 1
                              ? 'text-amber-900 bg-amber-100/90 hover:bg-amber-200 border border-amber-300'
                              : 'text-slate-400 bg-slate-50 hover:bg-slate-100 border border-slate-200'
                          }`}
                          title="Vitrin durumunu değiştirmek için tıklayın"
                        >
                          <Sparkles className={`w-3 h-3 ${p.is_featured === 1 ? 'text-amber-600' : 'text-slate-300'}`} />
                          <span>{p.is_featured === 1 ? 'Vitrinde' : 'Kapalı'}</span>
                        </button>
                      </td>

                      {/* Status Toggle */}
                      <td className="p-3.5 text-center">
                        {p.is_archived === 1 ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                            Arşivde
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(p)}
                            className={`px-3 py-1 rounded-full text-[10px] font-black transition ${
                              p.is_active === 1
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-red-100 text-red-800 hover:bg-red-200'
                            }`}
                          >
                            {p.is_active === 1 ? 'Yayında' : 'Pasif'}
                          </button>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Edit */}
                          <Link
                            href={`/admin/urunler/${p.id}`}
                            className="p-1.5 hover:bg-blue-50 text-blue-900 rounded-lg transition"
                            title="Düzenle & Varyasyonları Yönet"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Link>

                          {/* Duplicate */}
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleDuplicate(p)}
                            className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition"
                            title="Ürünü Kopyala"
                          >
                            <Copy className="w-4 h-4" />
                          </button>

                          {/* Preview Storefront */}
                          <Link
                            href={`/urun/${p.slug}`}
                            target="_blank"
                            className="p-1.5 hover:bg-emerald-50 text-emerald-700 rounded-lg transition"
                            title="Mağazada Önizle"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => setDeleteModal({ isOpen: true, product: p })}
                            className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition"
                            title="Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 4. PAGINATION FOOTER */}
        {pagination.totalPages > 1 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div>
              Toplam <strong>{pagination.total}</strong> kumaştan{' '}
              <strong>{(page - 1) * parseInt(limit) + 1}</strong> -{' '}
              <strong>{Math.min(page * parseInt(limit), pagination.total)}</strong> arası gösteriliyor.
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg disabled:opacity-40 hover:bg-slate-100 font-bold"
              >
                ← Önceki
              </button>

              <span className="font-bold text-slate-900 px-2">
                Sayfa {page} / {pagination.totalPages}
              </span>

              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg disabled:opacity-40 hover:bg-slate-100 font-bold"
              >
                Sonraki →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 5. SMART DELETE CONFIRMATION MODAL */}
      {deleteModal.isOpen && deleteModal.product && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-scaleIn">
            <div className="p-5 bg-red-600 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                <span>Kumaş Silme Onayı</span>
              </h3>
              <button
                onClick={() => setDeleteModal({ isOpen: false, product: null })}
                className="text-red-200 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3.5 bg-red-50 rounded-2xl border border-red-200 text-xs text-red-950 space-y-2">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <span>&ldquo;{deleteModal.product.name}&rdquo; silinecek.</span>
                </p>
                <p className="text-[11px] text-red-800 leading-relaxed">
                  <strong>Akıllı Veri Bütünlüğü:</strong> Bu kumaş daha önce herhangi bir müşteri siparişinde yer almışsa geçmiş siparişlerin ve faturaların bozulmaması için <strong>arşive kaldırılacak ve yayından çekilecektir</strong>. Hiç sipariş almamışsa sistemden kalıcı olarak silinecektir.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteModal({ isOpen: false, product: null })}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  İptal
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleConfirmDelete}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow transition"
                >
                  {isProcessing ? 'İşleniyor...' : 'Onayla & Sil'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. QUICK STOCK UPDATE MODAL */}
      {stockModal.isOpen && stockModal.product && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-scaleIn">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <PackageCheck className="w-4 h-4 text-emerald-400" />
                <span>Hızlı Stok Metresi Güncelle</span>
              </h3>
              <button
                onClick={() => setStockModal({ isOpen: false, product: null, newStock: 0, reason: '' })}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStock} className="p-6 space-y-4">
              <div>
                <div className="text-xs font-bold text-slate-900">{stockModal.product.name}</div>
                <div className="text-[11px] text-slate-500 font-mono">SKU: {stockModal.product.sku}</div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Yeni Stok Miktarı (Metre) *
                </label>
                <input
                  type="number"
                  step="0.5"
                  required
                  min={0}
                  value={stockModal.newStock}
                  onChange={(e) =>
                    setStockModal({ ...stockModal, newStock: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Stok Güncelleme Nedeni
                </label>
                <select
                  value={stockModal.reason}
                  onChange={(e) => setStockModal({ ...stockModal, reason: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700"
                >
                  <option value="Yeni Top Kumaş Girişi">Yeni Top Kumaş Girişi</option>
                  <option value="Manuel Sayım Düzeltmesi">Manuel Sayım Düzeltmesi</option>
                  <option value="Defo / Kesim Fire Çıkışı">Defo / Kesim Fire Çıkışı</option>
                  <option value="Müşteri İade Girişi">Müşteri İade Girişi</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStockModal({ isOpen: false, product: null, newStock: 0, reason: '' })}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow transition"
                >
                  {isProcessing ? 'Kaydediliyor...' : 'Stoğu Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
