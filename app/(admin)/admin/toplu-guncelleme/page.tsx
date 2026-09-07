'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sliders, AlertTriangle, CheckCircle2, Percent, Plus, 
  TrendingUp, TrendingDown, Tag, RefreshCw, Layers, Sparkles, DollarSign 
} from 'lucide-react';
import { formatCurrency } from '@/lib/services/meterEngine';

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  parent_id?: string | null;
  productCount?: number;
}

export default function AdminBatchPriceUpdatePage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loadingCats, setLoadingCats] = useState(true);

  const [categoryId, setCategoryId] = useState('all');
  const [actionType, setActionType] = useState<
    'price_increase_percent' | 'price_discount_percent' | 'price_fixed_add' | 'price_fixed_subtract' | 'price_set_fixed' | 'remove_discount'
  >('price_increase_percent');
  const [percentage, setPercentage] = useState('10');
  const [fixedAmount, setFixedAmount] = useState('50');
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultMsg, setResultMsg] = useState<{ text: string; success: boolean } | null>(null);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/admin/batch-update');
      const data = await res.json();
      if (res.ok) {
        setCategories(data.categories || []);
        setTotalProducts(data.totalProducts || 0);
      }
    } catch (e) {
      // Fallback
    } finally {
      setLoadingCats(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const selectedCatObj = categories.find((c) => c.id === categoryId);
  const affectedCount = categoryId === 'all'
    ? totalProducts
    : (selectedCatObj?.productCount ?? 0);

  // Simulation calculation
  const sampleBasePrice = 250;
  let simulatedPrice = sampleBasePrice;
  const numPercent = parseFloat(percentage) || 0;
  const numFixed = parseFloat(fixedAmount) || 0;

  if (actionType === 'price_increase_percent') {
    simulatedPrice = Number((sampleBasePrice * (1 + numPercent / 100)).toFixed(2));
  } else if (actionType === 'price_discount_percent') {
    simulatedPrice = Number((sampleBasePrice * (1 - numPercent / 100)).toFixed(2));
  } else if (actionType === 'price_fixed_add') {
    simulatedPrice = Number((sampleBasePrice + numFixed).toFixed(2));
  } else if (actionType === 'price_fixed_subtract') {
    simulatedPrice = Math.max(1, Number((sampleBasePrice - numFixed).toFixed(2)));
  } else if (actionType === 'price_set_fixed') {
    simulatedPrice = numFixed;
  } else if (actionType === 'remove_discount') {
    simulatedPrice = sampleBasePrice;
  }

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    const catName = categoryId === 'all' ? 'Tüm Kategoriler' : (selectedCatObj?.name || 'Seçili Kategori');
    if (!window.confirm(`"${catName}" kapsamındaki ${affectedCount} adet kumaşın fiyatları güncellenecektir. Onaylıyor musunuz?`)) {
      return;
    }

    setIsProcessing(true);
    setResultMsg(null);

    try {
      const res = await fetch('/api/admin/batch-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId,
          actionType,
          percentage,
          fixedAmount,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Güncelleme başarısız.');

      setResultMsg({ text: data.message, success: true });
      fetchCategories();
    } catch (err: any) {
      setResultMsg({ text: err.message, success: false });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-900/10 text-blue-900 rounded-xl">
              <Sliders className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-black text-slate-900">
                Toplu Fiyat Güncelleme
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Seçtiğiniz kategori bazında veya tüm mağazada tek tıkla % zam, kampanya indirimi veya sabit fiyat güncellemesi uygulayın.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchCategories}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          <span>Kategorileri Yenile</span>
        </button>
      </div>

      <form onSubmit={handleExecute} className="space-y-6">
        {/* 1. HEDEF KATEGORİ SEÇİMİ */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-900" />
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                1. Hedef Kategori Seçimi
              </h2>
            </div>
            <span className="text-xs font-bold text-blue-900 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
              {affectedCount} Kumaş Etkilenecek
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Fiyatı Güncellenecek Kategori *
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={loadingCats}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-900"
            >
              <option value="all">
                🌐 Tüm Mağaza (Tüm Kategoriler - {totalProducts} Kumaş)
              </option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.parent_id ? '　↳ ' : '📁 '}
                  {cat.name} ({cat.productCount ?? 0} Kumaş)
                </option>
              ))}
            </select>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Kumaş birden fazla kategoride yer alıyorsa seçilen kategoriye ait olması güncelleme için yeterlidir.
            </span>
          </div>
        </div>

        {/* 2. İŞLEM TÜRÜ SEÇİMİ */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b">
            <Tag className="w-4 h-4 text-blue-900" />
            <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              2. Yapılacak Fiyat İşlemi
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {/* 1. Yüzde Zam */}
            <label
              onClick={() => setActionType('price_increase_percent')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between ${
                actionType === 'price_increase_percent'
                  ? 'border-blue-900 bg-blue-50/60 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="p-2 bg-blue-100 text-blue-900 rounded-xl">
                  <TrendingUp className="w-4 h-4" />
                </span>
                <input
                  type="radio"
                  name="actionType"
                  checked={actionType === 'price_increase_percent'}
                  onChange={() => setActionType('price_increase_percent')}
                  className="accent-blue-900"
                />
              </div>
              <div className="mt-3">
                <div className="text-xs font-black text-slate-900">% Fiyat Zammı</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Fiyatları belirlenen yüzde oranında artırır.
                </div>
              </div>
            </label>

            {/* 2. Yüzde İndirim */}
            <label
              onClick={() => setActionType('price_discount_percent')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between ${
                actionType === 'price_discount_percent'
                  ? 'border-blue-900 bg-blue-50/60 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="p-2 bg-emerald-100 text-emerald-900 rounded-xl">
                  <Percent className="w-4 h-4" />
                </span>
                <input
                  type="radio"
                  name="actionType"
                  checked={actionType === 'price_discount_percent'}
                  onChange={() => setActionType('price_discount_percent')}
                  className="accent-blue-900"
                />
              </div>
              <div className="mt-3">
                <div className="text-xs font-black text-slate-900">% Kampanya İndirimi</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Baz fiyattan %X indirimli satış fiyatı oluşturur.
                </div>
              </div>
            </label>

            {/* 3. Sabit TL Ekle */}
            <label
              onClick={() => setActionType('price_fixed_add')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between ${
                actionType === 'price_fixed_add'
                  ? 'border-blue-900 bg-blue-50/60 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="p-2 bg-purple-100 text-purple-900 rounded-xl">
                  <Plus className="w-4 h-4" />
                </span>
                <input
                  type="radio"
                  name="actionType"
                  checked={actionType === 'price_fixed_add'}
                  onChange={() => setActionType('price_fixed_add')}
                  className="accent-blue-900"
                />
              </div>
              <div className="mt-3">
                <div className="text-xs font-black text-slate-900">Sabit TL Ekle (+₺)</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Her ürünün metre fiyatına sabit tutar ekler.
                </div>
              </div>
            </label>

            {/* 4. Sabit TL Düşür */}
            <label
              onClick={() => setActionType('price_fixed_subtract')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between ${
                actionType === 'price_fixed_subtract'
                  ? 'border-blue-900 bg-blue-50/60 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="p-2 bg-amber-100 text-amber-900 rounded-xl">
                  <TrendingDown className="w-4 h-4" />
                </span>
                <input
                  type="radio"
                  name="actionType"
                  checked={actionType === 'price_fixed_subtract'}
                  onChange={() => setActionType('price_fixed_subtract')}
                  className="accent-blue-900"
                />
              </div>
              <div className="mt-3">
                <div className="text-xs font-black text-slate-900">Sabit TL İndir (-₺)</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Her ürünün metre fiyatından sabit tutar düşer.
                </div>
              </div>
            </label>

            {/* 5. Sabit Birim Fiyat Belirle */}
            <label
              onClick={() => setActionType('price_set_fixed')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between ${
                actionType === 'price_set_fixed'
                  ? 'border-blue-900 bg-blue-50/60 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="p-2 bg-cyan-100 text-cyan-900 rounded-xl">
                  <DollarSign className="w-4 h-4" />
                </span>
                <input
                  type="radio"
                  name="actionType"
                  checked={actionType === 'price_set_fixed'}
                  onChange={() => setActionType('price_set_fixed')}
                  className="accent-blue-900"
                />
              </div>
              <div className="mt-3">
                <div className="text-xs font-black text-slate-900">Tek Fiyat Belirle</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Kategorideki tüm kumaşları tek fiyata eşitler.
                </div>
              </div>
            </label>

            {/* 6. İndirimleri Sıfırla */}
            <label
              onClick={() => setActionType('remove_discount')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between ${
                actionType === 'remove_discount'
                  ? 'border-blue-900 bg-blue-50/60 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="p-2 bg-rose-100 text-rose-900 rounded-xl">
                  <Sparkles className="w-4 h-4" />
                </span>
                <input
                  type="radio"
                  name="actionType"
                  checked={actionType === 'remove_discount'}
                  onChange={() => setActionType('remove_discount')}
                  className="accent-blue-900"
                />
              </div>
              <div className="mt-3">
                <div className="text-xs font-black text-slate-900">İndirimleri Kaldır</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Kampanyalı indirim fiyatlarını kaldırıp baz fiyata döner.
                </div>
              </div>
            </label>
          </div>

          {/* Value Inputs */}
          {actionType === 'price_increase_percent' || actionType === 'price_discount_percent' ? (
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Uygulanacak Yüzde Oranı (%) *
              </label>
              <div className="relative max-w-xs">
                <input
                  type="number"
                  step="0.5"
                  required
                  min="0.5"
                  max="500"
                  value={percentage}
                  onChange={(e) => setPercentage(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                  %
                </span>
              </div>
            </div>
          ) : actionType === 'price_fixed_add' || actionType === 'price_fixed_subtract' || actionType === 'price_set_fixed' ? (
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {actionType === 'price_set_fixed' ? 'Belirlenecek Yeni Metre Fiyatı (TL) *' : 'Uygulanacak Tutar (TL) *'}
              </label>
              <div className="relative max-w-xs">
                <input
                  type="number"
                  step="0.5"
                  required
                  min="0.5"
                  value={fixedAmount}
                  onChange={(e) => setFixedAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                  ₺
                </span>
              </div>
            </div>
          ) : null}
        </div>

        {/* 3. CANLI ÖNİZLEME & HESAPLAMA SİMÜLATÖRÜ */}
        <div className="bg-slate-900 text-white p-6 rounded-3xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-amber-400">
              Canlı Fiyat Simülasyonu
            </span>
            <span className="text-[11px] text-slate-400">
              Örnek 250,00 TL'lik bir kumaş üzerinden hesaplama
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Mevcut Fiyat</div>
              <div className="text-base font-black text-white mt-1">250,00 TL / m</div>
            </div>

            <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Uygulanacak İşlem</div>
              <div className="text-base font-black text-amber-400 mt-1">
                {actionType === 'price_increase_percent' && `+%${percentage} Zam`}
                {actionType === 'price_discount_percent' && `-%${percentage} İndirim`}
                {actionType === 'price_fixed_add' && `+${fixedAmount} TL Zam`}
                {actionType === 'price_fixed_subtract' && `-${fixedAmount} TL İndirim`}
                {actionType === 'price_set_fixed' && `Sabit ${fixedAmount} TL`}
                {actionType === 'remove_discount' && 'İndirim Kaldırma'}
              </div>
            </div>

            <div className="bg-blue-950 p-3.5 rounded-2xl border border-blue-800">
              <div className="text-[10px] text-blue-300 font-bold uppercase">Yeni Satış Fiyatı</div>
              <div className="text-base font-black text-emerald-400 mt-1">
                {formatCurrency(simulatedPrice)} / m
              </div>
            </div>
          </div>
        </div>

        {/* Warning Banner */}
        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex items-start gap-3 text-amber-900 text-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed font-medium">
            Bu işlem seçili kategorideki <strong>{affectedCount} adet kumaşın</strong> ve varsa tüm renk/desen varyasyonlarının fiyatlarını anında güncelleyecektir. İşlem sistem audit loglarına kaydedilir.
          </div>
        </div>

        {/* Result Message */}
        {resultMsg && (
          <div
            className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-3 border ${
              resultMsg.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {resultMsg.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
            )}
            <span>{resultMsg.text}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isProcessing || affectedCount === 0}
          className="w-full py-4 bg-blue-900 hover:bg-blue-800 disabled:bg-slate-400 text-white font-bold text-xs rounded-2xl shadow-lg transition flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Fiyatlar Güncelleniyor...</span>
            </>
          ) : (
            <>
              <Sliders className="w-4 h-4" />
              <span>Toplu Fiyat Güncellemesini Uygula ({affectedCount} Kumaş)</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
