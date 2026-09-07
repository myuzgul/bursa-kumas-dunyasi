'use client';

import React, { useState, useEffect } from 'react';
import { 
  Activity, Save, CheckCircle2, ShieldCheck, 
  Send, RefreshCw, Layers, Radio, Globe, AlertTriangle
} from 'lucide-react';
import { trackStorefrontEvent } from '@/lib/analytics/dataTier';

export default function AdminTrackingPage() {
  const [settings, setSettings] = useState({
    meta_pixel_id: '',
    meta_capi_token: '',
    meta_test_code: '',
    ga4_measurement_id: '',
    gtm_id: '',
    google_ads_conversion_id: '',
    google_ads_conversion_label: '',
    is_active: 1,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ text: string; success: boolean } | null>(null);
  const [testResult, setTestResult] = useState<any | null>(null);

  useEffect(() => {
    fetch('/api/admin/tracking-settings', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.settings) {
          setSettings(data.settings);
        }
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ? 1 : 0) : value,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const res = await fetch('/api/admin/tracking-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ayarlar kaydedilemedi.');

      setSaveMessage({ text: 'İzleme & CAPI ayarları başarıyla kaydedildi!', success: true });
    } catch (err: any) {
      setSaveMessage({ text: err.message, success: false });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendTestEvent = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const testEventId = `TEST_${Date.now()}`;
      const res = await fetch('/api/tracking/meta-capi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_name: 'ViewContent',
          event_id: testEventId,
          event_source_url: 'https://bursakumasdunyasi.com/admin/tracking',
          user_data: {
            email: 'test@bursakumasdunyasi.com',
            phone: '905551234567',
            firstName: 'Murat',
            lastName: 'Test',
            city: 'Bursa',
            country: 'tr',
          },
          custom_data: {
            content_name: 'Test İtalyan İpek Kumaş',
            content_category: 'Döşemelik Kumaş',
            value: 450.0,
            currency: 'TRY',
          },
        }),
      });

      const data = await res.json();
      setTestResult(data);
    } catch (err: any) {
      setTestResult({ success: false, error: err.message });
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-500 font-bold text-sm flex items-center justify-center gap-2">
        <RefreshCw className="w-5 h-5 animate-spin text-blue-900" />
        <span>İzleme ayarları yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-900" />
            <span>İzleme, Meta CAPI & Google Analytics Ayarları</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Meta Pixel + CAPI tekilleştirme (deduplication) ve Google Analytics/Ads yapılandırması.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-bold cursor-pointer text-slate-800">
            <input
              type="checkbox"
              name="is_active"
              checked={settings.is_active === 1}
              onChange={handleChange}
              className="rounded text-blue-900"
            />
            <span>İzleme Motoru Aktif</span>
          </label>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. Meta Pixel & CAPI Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-5">
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center font-bold">
                f
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900">Meta Pixel & Conversions API (CAPI)</h2>
                <p className="text-[11px] text-slate-500">
                  Tarayıcı ve sunucu tarafı olaylarını <code className="text-blue-900 font-mono">event_id</code> ile eşleştirerek %100 tekilleştirir.
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 text-[10px] font-bold rounded-full border border-emerald-200">
              CAPI Destekli
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Meta Pixel ID
              </label>
              <input
                type="text"
                name="meta_pixel_id"
                placeholder="Örn: 123456789012345"
                value={settings.meta_pixel_id}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-300 focus:bg-white rounded-xl px-3 py-2 text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Meta Conversions API (CAPI) Erişim Jetonu (Access Token)
              </label>
              <input
                type="password"
                name="meta_capi_token"
                placeholder="Örn: EAAG..."
                value={settings.meta_capi_token}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-300 focus:bg-white rounded-xl px-3 py-2 text-xs font-mono outline-none focus:ring-2 focus:ring-blue-900"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Meta Business Manager → Olay Yöneticisi → Ayarlar → Doğrudan Entegrasyon bölümünden oluşturulur.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Meta Olay Test Kodu (Test Event Code - Opsiyonel)
              </label>
              <input
                type="text"
                name="meta_test_code"
                placeholder="Örn: TEST12345"
                value={settings.meta_test_code}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-300 focus:bg-white rounded-xl px-3 py-2 text-xs font-mono outline-none focus:ring-2 focus:ring-blue-900"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Meta Olay Yöneticisi "Olayları Test Et" sekmesindeki test kodunu girerek canlı test yapabilirsiniz. Canlı yayındayken boş bırakın.
              </p>
            </div>
          </div>

          {/* Test Dispatch Button */}
          <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <div className="text-xs font-bold text-slate-800">CAPI Bağlantısını Canlı Test Et</div>
              <div className="text-[11px] text-slate-500">
                Meta Graph API sunucularına anlık örnek bir <code>ViewContent</code> testi gönderir.
              </div>
            </div>

            <button
              type="button"
              onClick={handleSendTestEvent}
              disabled={isTesting || !settings.meta_pixel_id || !settings.meta_capi_token}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isTesting ? 'Gönderiliyor...' : 'Test Eventi Gönder'}</span>
            </button>
          </div>

          {testResult && (
            <div className="p-4 rounded-2xl bg-slate-900 text-slate-100 text-xs font-mono space-y-2 overflow-x-auto">
              <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Test Yanıtı:</span>
              </div>
              <pre className="text-[11px]">{JSON.stringify(testResult, null, 2)}</pre>
            </div>
          )}
        </div>

        {/* 2. Google Analytics & Google Ads Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-5">
          <div className="flex items-center gap-2 border-b pb-4">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-900 flex items-center justify-center font-bold">
              G
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900">Google Analytics 4 & Google Ads</h2>
              <p className="text-[11px] text-slate-500">
                Google Etiket Yöneticisi (GTM), GA4 Ölçüm Kimliği ve Google Ads Dönüşüm Etiketi.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Google Analytics 4 Ölçüm Kimliği (Measurement ID)
              </label>
              <input
                type="text"
                name="ga4_measurement_id"
                placeholder="Örn: G-BKD2026XYZ"
                value={settings.ga4_measurement_id}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-300 focus:bg-white rounded-xl px-3 py-2 text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Google Tag Manager Container ID (Opsiyonel)
              </label>
              <input
                type="text"
                name="gtm_id"
                placeholder="Örn: GTM-BKD2026"
                value={settings.gtm_id}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-300 focus:bg-white rounded-xl px-3 py-2 text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Google Ads Dönüşüm Kimliği (Conversion ID)
              </label>
              <input
                type="text"
                name="google_ads_conversion_id"
                placeholder="Örn: AW-123456789"
                value={settings.google_ads_conversion_id}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-300 focus:bg-white rounded-xl px-3 py-2 text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Google Ads Satın Alma Dönüşüm Etiketi (Conversion Label)
              </label>
              <input
                type="text"
                name="google_ads_conversion_label"
                placeholder="Örn: AbCdEfGhIjKlMnOpQrSt"
                value={settings.google_ads_conversion_label}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-300 focus:bg-white rounded-xl px-3 py-2 text-xs font-mono outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>
          </div>
        </div>

        {/* 3. Data Feeds Quick Links */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <Globe className="w-5 h-5 text-blue-900" />
            <h2 className="text-sm font-black text-slate-900">Entegre Ürün Feed Bağlantıları</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="font-bold text-slate-900">Google Merchant Center XML Feed</div>
              <div className="text-slate-500 text-[11px]">
                Google Alışveriş reklamları için RSS 2.0 formatında otomatik güncellenen XML beslemesi.
              </div>
              <a
                href="/api/feeds/google-merchant"
                target="_blank"
                className="inline-block font-mono text-[11px] text-blue-900 bg-white px-2.5 py-1 rounded-lg border border-blue-200 hover:underline"
              >
                /api/feeds/google-merchant
              </a>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="font-bold text-slate-900">Meta / Facebook Katalog Feed</div>
              <div className="text-slate-500 text-[11px]">
                Instagram Alışveriş ve Meta Dinamik Reklamlar için XML katalog beslemesi.
              </div>
              <a
                href="/api/feeds/facebook-catalog"
                target="_blank"
                className="inline-block font-mono text-[11px] text-blue-900 bg-white px-2.5 py-1 rounded-lg border border-blue-200 hover:underline"
              >
                /api/feeds/facebook-catalog
              </a>
            </div>
          </div>
        </div>

        {saveMessage && (
          <div
            className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 ${
              saveMessage.success
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{saveMessage.text}</span>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 bg-blue-900 hover:bg-blue-800 text-white font-black text-xs rounded-xl shadow transition flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Kaydediliyor...' : 'Tüm İzleme Ayarlarını Kaydet'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
