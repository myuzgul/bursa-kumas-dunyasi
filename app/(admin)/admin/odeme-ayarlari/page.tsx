'use client';

import React, { useState, useEffect } from 'react';
import { 
  CreditCard, Landmark, Truck, Banknote, Save, Plus, Trash2, 
  CheckCircle2, AlertCircle, Info, ShieldCheck, RefreshCw, Copy, Check
} from 'lucide-react';
import { formatCurrency } from '@/lib/services/meterEngine';

interface BankAccount {
  id: string;
  bank_name: string;
  account_holder: string;
  iban: string;
  branch_code?: string;
  account_number?: string;
  is_active: number;
}

interface PaymentSettings {
  paytr: {
    is_active: number;
    title: string;
    description: string;
    merchant_id: string;
    merchant_key: string;
    merchant_salt: string;
    test_mode: number;
    max_installment: number;
  };
  bank_transfer: {
    is_active: number;
    title: string;
    description: string;
    discount_percentage: number;
    accounts: BankAccount[];
  };
  cash_on_delivery: {
    is_active: number;
    title: string;
    description: string;
    additional_fee: number;
  };
  card_on_delivery: {
    is_active: number;
    title: string;
    description: string;
    additional_fee: number;
  };
}

export default function AdminPaymentSettingsPage() {
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'paytr' | 'bank_transfer' | 'cash_on_delivery' | 'card_on_delivery'>('paytr');
  const [copiedCallback, setCopiedCallback] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings/payment');
      const data = await res.json();
      if (data.success && data.settings) {
        setSettings(data.settings);
      }
    } catch (err) {
      console.error('Failed to load payment settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSaving(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/admin/settings/payment', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', message: 'Ödeme ayarları başarıyla kaydedildi!' });
        setSettings(data.settings);
      } else {
        setFeedback({ type: 'error', message: data.message || 'Kayıt sırasında hata oluştu.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Bağlantı hatası oluştu.' });
    } finally {
      setSaving(false);
    }
  };

  const addBankAccount = () => {
    if (!settings) return;
    const newAcc: BankAccount = {
      id: `bank-${Date.now()}`,
      bank_name: '',
      account_holder: 'Bursa Kumaş Dünyası Tekstil Tic. Ltd. Şti.',
      iban: 'TR',
      branch_code: '',
      account_number: '',
      is_active: 1,
    };
    setSettings({
      ...settings,
      bank_transfer: {
        ...settings.bank_transfer,
        accounts: [...settings.bank_transfer.accounts, newAcc],
      },
    });
  };

  const updateBankAccount = (id: string, field: keyof BankAccount, value: any) => {
    if (!settings) return;
    setSettings({
      ...settings,
      bank_transfer: {
        ...settings.bank_transfer,
        accounts: settings.bank_transfer.accounts.map((acc) =>
          acc.id === id ? { ...acc, [field]: value } : acc
        ),
      },
    });
  };

  const removeBankAccount = (id: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      bank_transfer: {
        ...settings.bank_transfer,
        accounts: settings.bank_transfer.accounts.filter((acc) => acc.id !== id),
      },
    });
  };

  const callbackUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/api/payment/paytr-callback` 
    : 'https://bursakumasdunyasi.com/api/payment/paytr-callback';

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCallback(true);
    setTimeout(() => setCopiedCallback(false), 2500);
  };

  if (loading || !settings) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-slate-500 font-semibold text-sm">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
          <span>Ödeme ayarları yükleniyor...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
            <CreditCard className="w-6 h-6 text-blue-600" />
            <span>Ödeme Yöntemleri & PayTR Entegrasyonu</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Kredi Kartı (PayTR), Havale/EFT, Kapıda Nakit ve Kapıda Kredi Kartı ödeme kurallarını ve ek ücretleri yönetin.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow transition disabled:opacity-50"
        >
          {saving ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}</span>
        </button>
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

      {/* Navigation Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('paytr')}
          className={`flex items-center gap-2.5 p-3.5 rounded-xl border text-xs font-bold transition text-left ${
            activeTab === 'paytr'
              ? 'bg-blue-900 text-white border-blue-900 shadow-sm'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <CreditCard className={`w-4 h-4 ${activeTab === 'paytr' ? 'text-white' : 'text-blue-600'}`} />
          <div className="flex-1 min-w-0">
            <div className="truncate">Kredi Kartı (PayTR)</div>
            <div className={`text-[10px] font-normal ${activeTab === 'paytr' ? 'text-blue-200' : 'text-slate-400'}`}>
              {settings.paytr.is_active ? '● Aktif' : '○ Pasif'}
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('bank_transfer')}
          className={`flex items-center gap-2.5 p-3.5 rounded-xl border text-xs font-bold transition text-left ${
            activeTab === 'bank_transfer'
              ? 'bg-blue-900 text-white border-blue-900 shadow-sm'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Landmark className={`w-4 h-4 ${activeTab === 'bank_transfer' ? 'text-white' : 'text-emerald-600'}`} />
          <div className="flex-1 min-w-0">
            <div className="truncate">Havale / EFT</div>
            <div className={`text-[10px] font-normal ${activeTab === 'bank_transfer' ? 'text-blue-200' : 'text-slate-400'}`}>
              {settings.bank_transfer.is_active ? `● Aktif (%${settings.bank_transfer.discount_percentage} İndirim)` : '○ Pasif'}
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('cash_on_delivery')}
          className={`flex items-center gap-2.5 p-3.5 rounded-xl border text-xs font-bold transition text-left ${
            activeTab === 'cash_on_delivery'
              ? 'bg-blue-900 text-white border-blue-900 shadow-sm'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Banknote className={`w-4 h-4 ${activeTab === 'cash_on_delivery' ? 'text-white' : 'text-amber-600'}`} />
          <div className="flex-1 min-w-0">
            <div className="truncate">Kapıda Nakit</div>
            <div className={`text-[10px] font-normal ${activeTab === 'cash_on_delivery' ? 'text-blue-200' : 'text-slate-400'}`}>
              {settings.cash_on_delivery.is_active ? `● Aktif (+${settings.cash_on_delivery.additional_fee} TL)` : '○ Pasif'}
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('card_on_delivery')}
          className={`flex items-center gap-2.5 p-3.5 rounded-xl border text-xs font-bold transition text-left ${
            activeTab === 'card_on_delivery'
              ? 'bg-blue-900 text-white border-blue-900 shadow-sm'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Truck className={`w-4 h-4 ${activeTab === 'card_on_delivery' ? 'text-white' : 'text-purple-600'}`} />
          <div className="flex-1 min-w-0">
            <div className="truncate">Kapıda Kart (Tek Çekim)</div>
            <div className={`text-[10px] font-normal ${activeTab === 'card_on_delivery' ? 'text-blue-200' : 'text-slate-400'}`}>
              {settings.card_on_delivery.is_active ? `● Aktif (+${settings.card_on_delivery.additional_fee} TL)` : '○ Pasif'}
            </div>
          </div>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. PAYTR TAB */}
        {activeTab === 'paytr' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center font-bold">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">PayTR Kredi & Banka Kartı Ödeme Ayarları</h2>
                  <p className="text-xs text-slate-500">PayTR Sanal POS iFrame API ve Callback Entegrasyonu</p>
                </div>
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={settings.paytr.is_active === 1}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      paytr: { ...settings.paytr, is_active: e.target.checked ? 1 : 0 },
                    })
                  }
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span className="text-xs font-bold text-slate-800">
                  {settings.paytr.is_active === 1 ? 'Ödeme Yöntemi Aktif' : 'Ödeme Yöntemi Pasif'}
                </span>
              </label>
            </div>

            {/* PayTR Webhook Notice Box */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
              <div className="font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>PayTR Mağaza Paneli Bildirim URL (Callback URL):</span>
              </div>
              <p className="text-slate-600">
                PayTR Mağaza panelinizde <strong>Ayarlar &gt; Bildirim URL (Callback URL)</strong> alanına aşağıdaki adresi yapıştırınız:
              </p>
              <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-300">
                <code className="text-blue-700 font-mono flex-1 text-[11px] truncate">
                  {callbackUrl}
                </code>
                <button
                  type="button"
                  onClick={() => copyToClipboard(callbackUrl)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold transition"
                >
                  {copiedCallback ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCallback ? 'Kopyalandı' : 'Kopyala'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ödeme Başlığı (Sepette Görünen)
                </label>
                <input
                  type="text"
                  required
                  value={settings.paytr.title}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      paytr: { ...settings.paytr, title: e.target.value },
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Maksimum Taksit Sayısı
                </label>
                <select
                  value={settings.paytr.max_installment}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      paytr: { ...settings.paytr, max_installment: Number(e.target.value) },
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                >
                  <option value={1}>Tek Çekim (Taksitsiz)</option>
                  <option value={2}>2 Taksit</option>
                  <option value={3}>3 Taksit</option>
                  <option value={6}>6 Taksit</option>
                  <option value={9}>9 Taksit</option>
                  <option value={12}>12 Taksit</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Açıklama Metni
                </label>
                <input
                  type="text"
                  value={settings.paytr.description}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      paytr: { ...settings.paytr, description: e.target.value },
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  PayTR Mağaza No (Merchant ID) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Örn: 123456"
                  value={settings.paytr.merchant_id}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      paytr: { ...settings.paytr, merchant_id: e.target.value },
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  PayTR Mağaza Parolası (Merchant Key) *
                </label>
                <input
                  type="password"
                  required
                  placeholder="PayTR Merchant Key"
                  value={settings.paytr.merchant_key}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      paytr: { ...settings.paytr, merchant_key: e.target.value },
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  PayTR Mağaza Gizli Anahtar (Merchant Salt) *
                </label>
                <input
                  type="password"
                  required
                  placeholder="PayTR Merchant Salt"
                  value={settings.paytr.merchant_salt}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      paytr: { ...settings.paytr, merchant_salt: e.target.value },
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Çalışma Modu (Test / Canlı)
                </label>
                <select
                  value={settings.paytr.test_mode}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      paytr: { ...settings.paytr, test_mode: Number(e.target.value) },
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                >
                  <option value={1}>🧪 Test Modu (Simülasyon / Geliştirme)</option>
                  <option value={0}>🚀 Canlı Mod (Gerçek Kart Çekimi)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* 2. BANK TRANSFER (HAVALE / EFT) TAB */}
        {activeTab === 'bank_transfer' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-900 flex items-center justify-center font-bold">
                  <Landmark className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Havale / EFT Ayarları & Banka Hesapları</h2>
                  <p className="text-xs text-slate-500">Havale indirim yüzdesi ve müşterilere gösterilecek IBAN listesi</p>
                </div>
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={settings.bank_transfer.is_active === 1}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      bank_transfer: { ...settings.bank_transfer, is_active: e.target.checked ? 1 : 0 },
                    })
                  }
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <span className="text-xs font-bold text-slate-800">
                  {settings.bank_transfer.is_active === 1 ? 'Ödeme Yöntemi Aktif' : 'Ödeme Yöntemi Pasif'}
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ödeme Başlığı
                </label>
                <input
                  type="text"
                  required
                  value={settings.bank_transfer.title}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      bank_transfer: { ...settings.bank_transfer, title: e.target.value },
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Havale İndirimi Oranı (%)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-bold text-xs">%</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={settings.bank_transfer.discount_percentage}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        bank_transfer: {
                          ...settings.bank_transfer,
                          discount_percentage: Number(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-7 pr-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Müşteri Havale seçtiğinde sepet tutarından anında düşülecek indirim oranı (Örn: 2 = %2 indirim).
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Açıklama Metni
                </label>
                <input
                  type="text"
                  value={settings.bank_transfer.description}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      bank_transfer: { ...settings.bank_transfer, description: e.target.value },
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>
            </div>

            {/* Bank Accounts List */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <span>Tanımlı Banka Hesapları ({settings.bank_transfer.accounts.length})</span>
                </h3>
                <button
                  type="button"
                  onClick={addBankAccount}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Yeni Banka Hesabı Ekle</span>
                </button>
              </div>

              {settings.bank_transfer.accounts.length === 0 ? (
                <div className="text-center p-6 bg-slate-50 rounded-xl text-slate-500 text-xs">
                  Henüz tanımlı banka hesabı bulunmuyor. Yeni banka hesabı ekleyebilirsiniz.
                </div>
              ) : (
                <div className="space-y-3">
                  {settings.bank_transfer.accounts.map((acc, index) => (
                    <div
                      key={acc.id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                        <span className="text-xs font-bold text-slate-800">
                          {index + 1}. Banka Hesabı {acc.bank_name && `(${acc.bank_name})`}
                        </span>

                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                            <input
                              type="checkbox"
                              checked={acc.is_active === 1}
                              onChange={(e) => updateBankAccount(acc.id, 'is_active', e.target.checked ? 1 : 0)}
                              className="w-3.5 h-3.5 text-emerald-600 rounded"
                            />
                            <span>{acc.is_active ? 'Aktif' : 'Pasif'}</span>
                          </label>

                          <button
                            type="button"
                            onClick={() => removeBankAccount(acc.id)}
                            className="text-rose-500 hover:text-rose-700 p-1 transition"
                            title="Hesabı Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Banka Adı *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Örn: Garanti BBVA"
                            value={acc.bank_name}
                            onChange={(e) => updateBankAccount(acc.id, 'bank_name', e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Hesap Sahibi / Unvan *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Firma / Şahıs Adı"
                            value={acc.account_holder}
                            onChange={(e) => updateBankAccount(acc.id, 'account_holder', e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                          />
                        </div>

                        <div className="sm:col-span-2 md:col-span-1">
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            IBAN Numarası *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="TR00 0000 0000 0000 0000 0000 00"
                            value={acc.iban}
                            onChange={(e) => updateBankAccount(acc.id, 'iban', e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Şube Kodu (İsteğe Bağlı)
                          </label>
                          <input
                            type="text"
                            placeholder="Örn: 0123"
                            value={acc.branch_code || ''}
                            onChange={(e) => updateBankAccount(acc.id, 'branch_code', e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Hesap No (İsteğe Bağlı)
                          </label>
                          <input
                            type="text"
                            placeholder="Örn: 1234567"
                            value={acc.account_number || ''}
                            onChange={(e) => updateBankAccount(acc.id, 'account_number', e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. CASH ON DELIVERY (KAPIDA NAKİT ÖDEME) TAB */}
        {activeTab === 'cash_on_delivery' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-900 flex items-center justify-center font-bold">
                  <Banknote className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Kapıda Nakit Ödeme Ayarları</h2>
                  <p className="text-xs text-slate-500">Kargo teslimatında nakit ödeme ve ek hizmet bedeli</p>
                </div>
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={settings.cash_on_delivery.is_active === 1}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      cash_on_delivery: { ...settings.cash_on_delivery, is_active: e.target.checked ? 1 : 0 },
                    })
                  }
                  className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                />
                <span className="text-xs font-bold text-slate-800">
                  {settings.cash_on_delivery.is_active === 1 ? 'Ödeme Yöntemi Aktif' : 'Ödeme Yöntemi Pasif'}
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ödeme Başlığı
                </label>
                <input
                  type="text"
                  required
                  value={settings.cash_on_delivery.title}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      cash_on_delivery: { ...settings.cash_on_delivery, title: e.target.value },
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kapıda Nakit Ödeme Hizmet Bedeli (TL) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={settings.cash_on_delivery.additional_fee}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        cash_on_delivery: {
                          ...settings.cash_on_delivery,
                          additional_fee: Number(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                  <span className="absolute right-3 top-2 text-slate-400 font-bold text-xs">TL</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Örn: 100 TL. Bu tutar kargo ücretinden bağımsız olarak kapıda nakit tahsilat bedeli olarak siparişe eklenir.
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Açıklama Metni
                </label>
                <input
                  type="text"
                  value={settings.cash_on_delivery.description}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      cash_on_delivery: { ...settings.cash_on_delivery, description: e.target.value },
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>
            </div>
          </div>
        )}

        {/* 4. CARD ON DELIVERY (KAPIDA KREDİ KARTI TEK ÇEKİM) TAB */}
        {activeTab === 'card_on_delivery' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-900 flex items-center justify-center font-bold">
                  <Truck className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Kapıda Kredi Kartı Tek Çekim Ayarları</h2>
                  <p className="text-xs text-slate-500">Kargo mobil POS cihazıyla teslimatta tek çekim kart ödemesi</p>
                </div>
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={settings.card_on_delivery.is_active === 1}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      card_on_delivery: { ...settings.card_on_delivery, is_active: e.target.checked ? 1 : 0 },
                    })
                  }
                  className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
                />
                <span className="text-xs font-bold text-slate-800">
                  {settings.card_on_delivery.is_active === 1 ? 'Ödeme Yöntemi Aktif' : 'Ödeme Yöntemi Pasif'}
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ödeme Başlığı
                </label>
                <input
                  type="text"
                  required
                  value={settings.card_on_delivery.title}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      card_on_delivery: { ...settings.card_on_delivery, title: e.target.value },
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kapıda Kart Tek Çekim Hizmet Bedeli (TL) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={settings.card_on_delivery.additional_fee}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        card_on_delivery: {
                          ...settings.card_on_delivery,
                          additional_fee: Number(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                  <span className="absolute right-3 top-2 text-slate-400 font-bold text-xs">TL</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Örn: 100 TL. Bu tutar kapıda kart ile ödeme seçildiğinde siparişe eklenir. İstediğiniz an yukarıdaki switch ile bu yöntemi kaldırabilirsiniz.
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Açıklama Metni
                </label>
                <input
                  type="text"
                  value={settings.card_on_delivery.description}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      card_on_delivery: { ...settings.card_on_delivery, description: e.target.value },
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
