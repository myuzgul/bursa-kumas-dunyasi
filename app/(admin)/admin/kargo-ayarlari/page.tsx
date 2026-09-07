'use client';

import React, { useEffect, useState } from 'react';
import { 
  Truck, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ShoppingBag, 
  CreditCard, 
  Info,
  Layers,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { formatCurrency } from '@/lib/services/meterEngine';

export default function AdminShippingSettingsPage() {
  const [threshold, setThreshold] = useState<number>(1000);
  const [cost, setCost] = useState<number>(79.90);
  const [carrierName, setCarrierName] = useState<string>('DHL Kargo (MNG Kargo)');
  const [announcementText, setAnnouncementText] = useState<string>('');
  const [isActive, setIsActive] = useState<number>(1);

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings/shipping');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setThreshold(data.settings.free_shipping_threshold ?? 1000);
          setCost(data.settings.shipping_cost ?? 79.90);
          setCarrierName(data.settings.carrier_name || 'DHL Kargo (MNG Kargo)');
          setAnnouncementText(data.settings.announcement_text || '');
          setIsActive(data.settings.is_active ?? 1);
        }
      }
    } catch (e) {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await fetch('/api/admin/settings/shipping', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          free_shipping_threshold: Number(threshold),
          shipping_cost: Number(cost),
          carrier_name: carrierName,
          announcement_text: announcementText,
          is_active: isActive,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg('Kargo ve ücretsiz teslimat ayarları başarıyla güncellendi!');
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(data.error || 'Ayarlar kaydedilemedi.');
      }
    } catch (err: any) {
      setErrorMsg('Bir bağlantı hatası oluştu.');
    } finally {
      setSaving(false);
    }
  };

  const isAlwaysFree = Number(threshold) === 0;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Truck className="w-6 h-6 text-blue-600" />
            Kargo ve Ücretsiz Teslimat Ayarları
          </h1>
          <p className="text-xs text-slate-500">
            Ücretsiz kargo sepet limiti, sabit kargo ücreti ve duyuru çubuğu metinlerini buradan yönetebilirsiniz.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 text-red-700 rounded-2xl border border-red-200 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-xs text-slate-400">
          Ayarlar yükleniyor...
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Form (7 cols) */}
            <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5 text-xs">
              {/* Free Shipping Threshold */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 text-sm">
                    Ücretsiz Kargo Sepet Alt Limiti (TL)
                  </label>
                  {isAlwaysFree ? (
                    <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-black text-[11px]">
                      🎉 Tüm Siparişlerde Kargo Bedava!
                    </span>
                  ) : (
                    <span className="text-slate-500 font-semibold">
                      {Number(threshold).toLocaleString('tr-TR')} TL ve üzeri
                    </span>
                  )}
                </div>

                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="50"
                    required
                    value={threshold}
                    onChange={(e) => setThreshold(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-900 font-bold text-base focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                    TL
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  💡 <strong>Önemli Kural:</strong> Buraya <strong>0</strong> yazarsanız sepet tutarı ne olursa olsun <strong>tüm siparişlerde kargo doğrudan bedava</strong> olur.
                </p>

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-slate-400 text-[11px] self-center mr-1">Hızlı Seçim:</span>
                  {[
                    { label: '0 TL (Her Zaman Bedava)', val: 0 },
                    { label: '500 TL', val: 500 },
                    { label: '750 TL', val: 750 },
                    { label: '1.000 TL', val: 1000 },
                    { label: '1.500 TL', val: 1500 },
                    { label: '2.000 TL', val: 2000 },
                  ].map((p) => (
                    <button
                      key={p.val}
                      type="button"
                      onClick={() => setThreshold(p.val)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition border ${
                        threshold === p.val
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Standard Shipping Cost */}
              <div className="space-y-2 pt-3 border-t border-slate-100">
                <label className="font-bold text-slate-800 text-sm block">
                  Sabit Kargo Ücreti (Limit Altı İçin)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.10"
                    required
                    value={cost}
                    onChange={(e) => setCost(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 font-bold text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                    TL
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Ücretsiz kargo limitinin altında kalan siparişlerden tahsil edilecek kargo bedeli.
                </p>
              </div>

              {/* Carrier Name */}
              <div className="space-y-2 pt-3 border-t border-slate-100">
                <label className="font-bold text-slate-800 text-sm block">
                  Anlaşmalı Kargo Firması
                </label>
                <input
                  type="text"
                  required
                  value={carrierName}
                  onChange={(e) => setCarrierName(e.target.value)}
                  placeholder="Örn: DHL Kargo (MNG Kargo)"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {/* Save Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Kaydediliyor...' : 'Kargo Ayarlarını Kaydet'}</span>
                </button>
              </div>
            </div>

            {/* Right Live Preview Box (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-sm space-y-4">
                <h3 className="font-black text-sm text-slate-200 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Müşterinin Göreceği Canlı Önizleme
                </h3>

                {/* 1. Header Top Announcement */}
                <div className="space-y-1.5 bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700 text-xs">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">1. Site Üst Duyuru Çubuğu</span>
                  <div className="flex items-center gap-2 font-bold text-white">
                    <Truck className="w-4 h-4 text-blue-400" />
                    <span>
                      {isAlwaysFree
                        ? 'Tüm Siparişlerde Ücretsiz Kargo'
                        : `${Number(threshold).toLocaleString('tr-TR')} TL Üzeri Ücretsiz Kargo`}
                    </span>
                  </div>
                </div>

                {/* 2. Product Detail Page Box */}
                <div className="space-y-1.5 bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700 text-xs">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">2. Ürün Detay Sayfası</span>
                  <p className="text-slate-300">
                    {isAlwaysFree
                      ? 'KDV Dahildir. Tüm siparişlerde kargo ücretsizdir.'
                      : `KDV Dahildir. ${Number(threshold).toLocaleString('tr-TR')} TL üzeri siparişlerde kargo ücretsizdir.`}
                  </p>
                </div>

                {/* 3. Cart Drawer Calculation */}
                <div className="space-y-1.5 bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700 text-xs">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">3. Sepet Çekmecesi & Ödeme</span>
                  <div className="bg-slate-950 p-3 rounded-xl space-y-1">
                    <div className="flex justify-between text-slate-400">
                      <span>Örnek Sepet Tutarı:</span>
                      <span>450,00 TL</span>
                    </div>
                    <div className="flex justify-between text-slate-300 font-bold">
                      <span>Kargo Ücreti:</span>
                      <span className={isAlwaysFree ? 'text-emerald-400' : 'text-slate-200'}>
                        {isAlwaysFree ? 'ÜCRETSİZ' : `${Number(cost).toFixed(2)} TL`}
                      </span>
                    </div>
                    <div className="flex justify-between text-white font-black pt-1 border-t border-slate-800">
                      <span>Genel Toplam:</span>
                      <span className="text-amber-400">
                        {isAlwaysFree ? '450,00 TL' : `${(450 + Number(cost)).toFixed(2)} TL`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-3xl text-xs text-blue-900 space-y-1.5">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-700" />
                  Otomatik Eşzamanlama
                </p>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  Burada yaptığınız değişiklikler veritabanına anında yazılır ve mağaza başlığı, ürün sayfaları, sepet çekmecesi ve checkout adımlarında anında aktif olur.
                </p>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
