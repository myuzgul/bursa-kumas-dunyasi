'use client';

import React, { useState } from 'react';
import { RefreshCw, CheckCircle2, AlertCircle, ShoppingBag, Package, Layers, ShieldCheck, Terminal } from 'lucide-react';

export default function WooCommerceSyncPage() {
  const [syncCategories, setSyncCategories] = useState(true);
  const [syncProducts, setSyncProducts] = useState(true);
  const [syncOrders, setSyncOrders] = useState(true);
  const [orderLimit, setOrderLimit] = useState(100);
  const [apiUrl, setApiUrl] = useState('https://bursakumasdunyasi.com');
  const [consumerKey, setConsumerKey] = useState('ck_6dc86fd48c4761862bd63b1f438cb0738993069c');
  const [consumerSecret, setConsumerSecret] = useState('cs_33987a75b760a1664214914a07f6b1f491ee1a41');

  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [summary, setSummary] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleStartSync = async () => {
    if (!confirm('WooCommerce uzerinden guncel veriler cekilerek sistem guncellenecektir. Onayliyor musunuz?')) return;

    setIsLoading(true);
    setErrorMessage(null);
    setStatusMessage('WooCommerce API baglantisi kuruluyor ve veriler cekiliyor... Lutfen bekleyiniz.');
    setSyncLogs(['[' + new Date().toLocaleTimeString('tr-TR') + '] Senkronizasyon baslatildi...']);
    setSummary(null);

    try {
      const res = await fetch('/api/admin/woocommerce-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: apiUrl,
          ck: consumerKey,
          cs: consumerSecret,
          syncCategories,
          syncProducts,
          syncOrders,
          orderLimit: Number(orderLimit),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Senkronizasyon sirasinda bir sorun olustu.');
      }

      setSummary(data.result);
      if (Array.isArray(data.logs)) setSyncLogs(data.logs);
      setStatusMessage('Senkronizasyon basariyla tamamlandi!');
    } catch (err: any) {
      setErrorMessage(err.message || 'Senkronizasyon basarisiz oldu.');
      setStatusMessage(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Baslik Alani */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl border border-purple-100">
              <RefreshCw className={`w-6 h-6 ${isLoading ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">WooCommerce Veri Senkronizasyonu</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Canli WordPress / WooCommerce sitenizdeki aktif urunleri, varyasyonlari, kategorileri ve siparisleri tek tikla sisteme aktarin.
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={handleStartSync}
          disabled={isLoading}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition ${
            isLoading
              ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
              : 'bg-purple-600 hover:bg-purple-700 text-white active:scale-95'
          }`}
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? 'Senkronize Ediliyor...' : 'En Guncel Hali Cek / Yenile'}</span>
        </button>
      </div>

      {/* Ozet Kartlari */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-emerald-100 bg-emerald-50/30 flex items-center gap-3.5">
            <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-lg">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Kategoriler</div>
              <div className="text-lg font-bold text-slate-900">{summary.categoriesCount} Adet</div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-blue-100 bg-blue-50/30 flex items-center gap-3.5">
            <div className="p-2.5 bg-blue-100 text-blue-700 rounded-lg">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Aktif Kumaslar</div>
              <div className="text-lg font-bold text-slate-900">{summary.productsCount} Adet</div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-amber-100 bg-amber-50/30 flex items-center gap-3.5">
            <div className="p-2.5 bg-amber-100 text-amber-700 rounded-lg">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Varyasyonlar</div>
              <div className="text-lg font-bold text-slate-900">{summary.variationsCount} Adet</div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-purple-100 bg-purple-50/30 flex items-center gap-3.5">
            <div className="p-2.5 bg-purple-100 text-purple-700 rounded-lg">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Siparisler</div>
              <div className="text-lg font-bold text-slate-900">{summary.ordersCount} Adet</div>
            </div>
          </div>
        </div>
      )}

      {/* Durum / Hata Mesajlari */}
      {statusMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Secenekler ve Konsol */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sol Kolon */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5 flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-600" />
              <span>Neler Cekilsin?</span>
            </h3>
            <div className="space-y-3 text-xs">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={syncCategories}
                  onChange={(e) => setSyncCategories(e.target.checked)}
                  className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 w-4 h-4"
                />
                <span className="text-slate-700 font-medium">Aktif Kategoriler</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={syncProducts}
                  onChange={(e) => setSyncProducts(e.target.checked)}
                  className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 w-4 h-4"
                />
                <span className="text-slate-700 font-medium">Sadece Aktif Kumaslar & Varyasyonlar</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={syncOrders}
                  onChange={(e) => setSyncOrders(e.target.checked)}
                  className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 w-4 h-4"
                />
                <span className="text-slate-700 font-medium">Siparisler</span>
              </label>
            </div>

            {syncOrders && (
              <div className="pt-3 border-t border-slate-100 text-xs space-y-1.5">
                <label className="block font-medium text-slate-700">Cekilecek Son Siparis Adedi:</label>
                <select
                  value={orderLimit}
                  onChange={(e) => setOrderLimit(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50 text-slate-800 text-xs focus:ring-purple-500"
                >
                  <option value={50}>Son 50 Siparis</option>
                  <option value={100}>Son 100 Siparis (Onerilen)</option>
                  <option value={250}>Son 250 Siparis</option>
                  <option value={500}>Son 500 Siparis</option>
                </select>
              </div>
            )}
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 text-xs">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>API Baglanti Bilgileri</span>
            </h3>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Site URL</label>
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2 text-slate-700 bg-slate-50 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Tuketici Anahtari (CK)</label>
              <input
                type="password"
                value={consumerKey}
                onChange={(e) => setConsumerKey(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2 text-slate-700 bg-slate-50 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Tuketici Gizli Anahtari (CS)</label>
              <input
                type="password"
                value={consumerSecret}
                onChange={(e) => setConsumerSecret(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2 text-slate-700 bg-slate-50 text-xs font-mono"
              />
            </div>
          </div>
        </div>

        {/* Sag Kolon: Terminal Log Ekrani */}
        <div className="md:col-span-2">
          <div className="bg-slate-950 text-slate-200 p-5 rounded-2xl border border-slate-800 shadow-sm flex flex-col h-[480px]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono font-semibold text-white">Canli Senkronizasyon Konsolu</span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">wc-sync-engine v1.0</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1.5 font-mono text-[11px] text-slate-400 pr-2">
              {syncLogs.length === 0 ? (
                <div className="text-slate-600 italic py-8 text-center">
                  'En Guncel Hali Cek / Yenile' butonuna bastiginizda islemler burada anlik olarak listelenecektir.
                </div>
              ) : (
                syncLogs.map((log, idx) => (
                  <div key={idx} className="leading-relaxed">
                    <span className="text-emerald-400 mr-1.5">›</span>
                    <span className={log.includes('tamamlandi') || log.includes('basariyla') ? 'text-emerald-300 font-semibold' : ''}>
                      {log}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
