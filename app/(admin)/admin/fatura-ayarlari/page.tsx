'use client';

import React, { useState, useEffect } from 'react';
import { 
  Receipt, Save, ShieldCheck, CheckCircle2, AlertCircle, 
  ExternalLink, Key, Building2, FileText, RefreshCw, Send, Check
} from 'lucide-react';

export default function AdminInvoiceSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [settings, setSettings] = useState({
    is_active: 1,
    is_test_mode: 0,
    is_auto_invoice: 1,
    parkbulut_api_url: 'https://api.parkbulut.com',
    parkbulut_username: '',
    parkbulut_password: '',
    parkbulut_company_code: '',
    series_prefix_efatura: 'EFB',
    series_prefix_earsiv: 'EAF',
    sender_title: 'Bursa Kumaş Dünyası Tekstil Tic. Ltd. Şti.',
    sender_tax_number: '1234567890',
    sender_tax_office: 'Yıldırım Vergi Dairesi',
    sender_address: 'İhsaniye Mah. Barbaros Cad. No:14 Nilüfer / Bursa',
    sender_email: 'fatura@bursakumasdunyasi.com',
    sender_phone: '05423939816',
    default_vat_rate: 10,
  });

  useEffect(() => {
    fetch('/api/admin/settings/invoice')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings) {
          setSettings((prev) => ({ ...prev, ...data.settings }));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setTestResult(null);

    try {
      const res = await fetch('/api/admin/settings/invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      // Ignore
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/admin/settings/invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test_connection',
          settings,
        }),
      });
      const data = await res.json();
      setTestResult({
        success: data.success,
        message: data.message || 'Bağlantı testi tamamlandı.',
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: 'Bağlantı hatası: Sunucuya erişilemedi.',
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center text-xs text-slate-500">
        Park Bulut Fatura Ayarları Yükleniyor...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-900/10 text-blue-900 rounded-xl">
              <Receipt className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-black text-slate-900">
                Park Bulut E-Fatura & E-Arşiv Ayarları
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                ParkBulut API entegrasyonu ile siparişlerinize tek tıkla veya otomatik resmi e-fatura kesin.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="https://parkbulut.com"
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition inline-flex items-center gap-1.5"
          >
            <span>ParkBulut Portalı</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
          </a>

          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing}
            className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-900 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin text-blue-700' : ''}`} />
            <span>{testing ? 'Test Ediliyor...' : 'Bağlantıyı Test Et'}</span>
          </button>
        </div>
      </div>

      {/* Test Connection Banner */}
      {testResult && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-3 border ${
            testResult.success
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}
        >
          {testResult.success ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          )}
          <div className="flex-1">{testResult.message}</div>
        </div>
      )}

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Fatura ayarları başarıyla kaydedildi ve sisteme uygulandı.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. ÇALIŞMA MODU VE AKTİFLİK */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b">
            <ShieldCheck className="w-4 h-4 text-blue-900" />
            <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Entegrasyon Durumu ve Çalışma Modu
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Entegrasyon Durumu</span>
                <input
                  type="checkbox"
                  checked={settings.is_active === 1}
                  onChange={(e) => setSettings({ ...settings, is_active: e.target.checked ? 1 : 0 })}
                  className="w-4 h-4 accent-blue-900 cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                Park Bulut fatura servisinin mağazada aktif olup olmadığını belirler.
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Çalışma Modu</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    settings.is_test_mode === 1
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {settings.is_test_mode === 1 ? 'Test Modu' : 'Canlı / Resmi'}
                </span>
              </div>
              <div className="flex items-center gap-3 pt-1">
                <label className="flex items-center gap-1 text-xs cursor-pointer text-slate-700">
                  <input
                    type="radio"
                    name="test_mode"
                    checked={settings.is_test_mode === 0}
                    onChange={() => setSettings({ ...settings, is_test_mode: 0 })}
                  />
                  <span>Canlı Mod (Resmi Fatura)</span>
                </label>
                <label className="flex items-center gap-1 text-xs cursor-pointer text-slate-700">
                  <input
                    type="radio"
                    name="test_mode"
                    checked={settings.is_test_mode === 1}
                    onChange={() => setSettings({ ...settings, is_test_mode: 1 })}
                  />
                  <span>Test Modu</span>
                </label>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Otomatik Fatura Kesimi</span>
                <input
                  type="checkbox"
                  checked={settings.is_auto_invoice === 1}
                  onChange={(e) =>
                    setSettings({ ...settings, is_auto_invoice: e.target.checked ? 1 : 0 })
                  }
                  className="w-4 h-4 accent-blue-900 cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                Sipariş onaylandığında faturayı otomatik oluşturup müşteriye bağlar.
              </p>
            </div>
          </div>
        </div>

        {/* 2. PARK BULUT API BİLGİLERİ */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b">
            <Key className="w-4 h-4 text-blue-900" />
            <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Park Bulut API Kimlik Bilgileri
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                API Sunucu Adresi (URL) *
              </label>
              <input
                type="text"
                required
                value={settings.parkbulut_api_url}
                onChange={(e) => setSettings({ ...settings, parkbulut_api_url: e.target.value })}
                placeholder="https://api.parkbulut.com"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-900"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Park Bulut tarafından iletilen REST API endpoint adresi.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Firma Kodu / Entegratör VKN *
              </label>
              <input
                type="text"
                value={settings.parkbulut_company_code}
                onChange={(e) => setSettings({ ...settings, parkbulut_company_code: e.target.value })}
                placeholder="Örn: 1234567890 veya FIRMA_KODU"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                API Kullanıcı Adı / E-Posta *
              </label>
              <input
                type="text"
                value={settings.parkbulut_username}
                onChange={(e) => setSettings({ ...settings, parkbulut_username: e.target.value })}
                placeholder="fatura@bursakumasdunyasi.com veya api_user"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                API Şifre / Entegrasyon Anahtarı (Token) *
              </label>
              <input
                type="password"
                value={settings.parkbulut_password}
                onChange={(e) => setSettings({ ...settings, parkbulut_password: e.target.value })}
                placeholder="••••••••••••••••"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-900"
              />
            </div>
          </div>
        </div>

        {/* 3. FATURA SERİ VE NUMARALANDIRMA */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b">
            <FileText className="w-4 h-4 text-blue-900" />
            <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Fatura Serileri & KDV Oranları
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                E-Fatura Seri Öneki (Kurumsal)
              </label>
              <input
                type="text"
                maxLength={3}
                value={settings.series_prefix_efatura}
                onChange={(e) =>
                  setSettings({ ...settings, series_prefix_efatura: e.target.value.toUpperCase() })
                }
                placeholder="EFB"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 uppercase"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Örnek: EFB2026000000001
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                E-Arşiv Seri Öneki (Bireysel)
              </label>
              <input
                type="text"
                maxLength={3}
                value={settings.series_prefix_earsiv}
                onChange={(e) =>
                  setSettings({ ...settings, series_prefix_earsiv: e.target.value.toUpperCase() })
                }
                placeholder="EAF"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 uppercase"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Örnek: EAF2026000000001
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Varsayılan KDV Oranı (%)
              </label>
              <select
                value={settings.default_vat_rate}
                onChange={(e) =>
                  setSettings({ ...settings, default_vat_rate: Number(e.target.value) })
                }
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900"
              >
                <option value={10}>%10 (Kumaş & Tekstil Standart)</option>
                <option value={20}>%20 (Genel KDV)</option>
                <option value={1}>%1 (Özel)</option>
                <option value={0}>%0 (KDV Muaf)</option>
              </select>
            </div>
          </div>
        </div>

        {/* 4. GÖNDERİCİ FİRMA BİLGİLERİ (FATURA ÜST BİLGİLERİ) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b">
            <Building2 className="w-4 h-4 text-blue-900" />
            <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Faturada Görünecek Firma Bilgileriniz
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Firma Resmi Unvanı *
              </label>
              <input
                type="text"
                required
                value={settings.sender_title}
                onChange={(e) => setSettings({ ...settings, sender_title: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Vergi Kimlik No (VKN / TCKN) *
              </label>
              <input
                type="text"
                required
                value={settings.sender_tax_number}
                onChange={(e) => setSettings({ ...settings, sender_tax_number: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Vergi Dairesi *
              </label>
              <input
                type="text"
                required
                value={settings.sender_tax_office}
                onChange={(e) => setSettings({ ...settings, sender_tax_office: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Firma Adresi *
              </label>
              <textarea
                rows={2}
                required
                value={settings.sender_address}
                onChange={(e) => setSettings({ ...settings, sender_address: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Fatura İletişim E-Postası
              </label>
              <input
                type="email"
                value={settings.sender_email}
                onChange={(e) => setSettings({ ...settings, sender_email: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Fatura İletişim Telefonu
              </label>
              <input
                type="text"
                value={settings.sender_phone}
                onChange={(e) => setSettings({ ...settings, sender_phone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900"
              />
            </div>
          </div>
        </div>

        {/* BOTTOM SAVE BUTTON */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-blue-900 hover:bg-blue-800 disabled:bg-slate-400 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Kaydediliyor...' : 'Tüm Fatura Ayarlarını Kaydet'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
