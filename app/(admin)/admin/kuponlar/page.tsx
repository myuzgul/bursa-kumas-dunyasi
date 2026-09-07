'use client';

import React, { useState, useEffect } from 'react';
import { 
  Percent, Tag, Plus, CheckCircle2, Trash2, Edit3, 
  Sparkles, Calendar, TrendingUp, Users, AlertCircle, RefreshCw 
} from 'lucide-react';
import { formatCurrency } from '@/lib/services/meterEngine';

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any | null>(null);
  const [editingRule, setEditingRule] = useState<any | null>(null);

  // Coupon Form State
  const [couponForm, setCouponForm] = useState({
    code: '',
    title: '',
    discount_type: 'percent',
    discount_value: 10,
    min_order_amount: 500,
    max_discount_amount: 300,
    usage_limit: 500,
    per_user_limit: 1,
    start_date: '',
    expiry_date: '',
    is_active: 1,
  });

  // Rule Form State
  const [ruleForm, setRuleForm] = useState({
    title: '',
    min_cart_total: 1500,
    discount_percent: 10,
    discount_fixed: 0,
    is_active: 1,
  });

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; success: boolean } | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/admin/coupons', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setCoupons(data.coupons || []);
        setRules(data.rules || []);
      }
    } catch (e) {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Generate a random high-converting coupon code
  const generateRandomCode = () => {
    const prefixes = ['BURSA', 'KUMAS', 'FIRSAT', 'OZEL', 'YAZ', 'BAHAR'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const num = Math.floor(10 + Math.random() * 90);
    setCouponForm((prev) => ({ ...prev, code: `${prefix}${num}` }));
  };

  const openNewCouponModal = () => {
    setEditingCoupon(null);
    setCouponForm({
      code: 'BURSA15',
      title: 'Özel %15 Kumaş İndirimi',
      discount_type: 'percent',
      discount_value: 15,
      min_order_amount: 500,
      max_discount_amount: 250,
      usage_limit: 200,
      per_user_limit: 1,
      start_date: new Date().toISOString().split('T')[0],
      expiry_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      is_active: 1,
    });
    setIsCouponModalOpen(true);
  };

  const openEditCouponModal = (c: any) => {
    setEditingCoupon(c);
    setCouponForm({
      code: c.code || '',
      title: c.title || '',
      discount_type: c.discount_type || 'percent',
      discount_value: c.discount_value || 10,
      min_order_amount: c.min_order_amount || 0,
      max_discount_amount: c.max_discount_amount || '',
      usage_limit: c.usage_limit || '',
      per_user_limit: c.per_user_limit || 1,
      start_date: c.start_date ? c.start_date.split('T')[0] : '',
      expiry_date: c.expiry_date ? c.expiry_date.split('T')[0] : '',
      is_active: c.is_active !== undefined ? c.is_active : 1,
    });
    setIsCouponModalOpen(true);
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponForm.code.trim()) return;

    setSaving(true);
    setFeedback(null);

    try {
      const url = '/api/admin/coupons';
      const method = editingCoupon ? 'PUT' : 'POST';
      const payload = editingCoupon
        ? { ...couponForm, id: editingCoupon.id, type: 'coupon' }
        : { ...couponForm, type: 'coupon' };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Kupon kaydedilemedi.');

      setIsCouponModalOpen(false);
      setFeedback({
        text: editingCoupon ? 'Kupon başarıyla güncellendi!' : `"${couponForm.code}" kuponu başarıyla oluşturuldu!`,
        success: true,
      });
      fetchData();
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback({ text: err.message, success: false });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCoupon = async (id: string, code: string) => {
    if (!confirm(`"${code}" kuponunu silmek istediğinize emin misiniz?`)) return;

    try {
      const res = await fetch(`/api/admin/coupons?id=${id}&type=coupon`, { method: 'DELETE' });
      if (res.ok) {
        setCoupons((prev) => prev.filter((c) => c.id !== id));
        setFeedback({ text: 'Kupon silindi.', success: true });
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch (e) {
      alert('Silinemedi.');
    }
  };

  const handleToggleCouponActive = async (coupon: any) => {
    const nextStatus = coupon.is_active === 1 ? 0 : 1;
    setCoupons((prev) =>
      prev.map((c) => (c.id === coupon.id ? { ...c, is_active: nextStatus } : c))
    );

    try {
      await fetch('/api/admin/coupons', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: coupon.id, type: 'coupon', is_active: nextStatus }),
      });
    } catch (e) {
      fetchData();
    }
  };

  // Rule Handlers
  const openNewRuleModal = () => {
    setEditingRule(null);
    setRuleForm({
      title: '2.000 TL Üzeri %15 Sepet İndirimi',
      min_cart_total: 2000,
      discount_percent: 15,
      discount_fixed: 0,
      is_active: 1,
    });
    setIsRuleModalOpen(true);
  };

  const openEditRuleModal = (r: any) => {
    setEditingRule(r);
    setRuleForm({
      title: r.title || '',
      min_cart_total: r.min_cart_total || 0,
      discount_percent: r.discount_percent || 0,
      discount_fixed: r.discount_fixed || 0,
      is_active: r.is_active !== undefined ? r.is_active : 1,
    });
    setIsRuleModalOpen(true);
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleForm.title.trim()) return;

    setSaving(true);
    setFeedback(null);

    try {
      const url = '/api/admin/coupons';
      const method = editingRule ? 'PUT' : 'POST';
      const payload = editingRule
        ? { ...ruleForm, id: editingRule.id, type: 'rule' }
        : { ...ruleForm, type: 'rule' };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Kural kaydedilemedi.');

      setIsRuleModalOpen(false);
      setFeedback({
        text: editingRule ? 'Kural güncellendi!' : 'Yeni indirim kuralı oluşturuldu!',
        success: true,
      });
      fetchData();
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback({ text: err.message, success: false });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRule = async (id: string, title: string) => {
    if (!confirm(`"${title}" kuralını silmek istediğinize emin misiniz?`)) return;

    try {
      const res = await fetch(`/api/admin/coupons?id=${id}&type=rule`, { method: 'DELETE' });
      if (res.ok) {
        setRules((prev) => prev.filter((r) => r.id !== id));
        setFeedback({ text: 'Kural silindi.', success: true });
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch (e) {
      alert('Silinemedi.');
    }
  };

  const handleToggleRuleActive = async (rule: any) => {
    const nextStatus = rule.is_active === 1 ? 0 : 1;
    setRules((prev) =>
      prev.map((r) => (r.id === rule.id ? { ...r, is_active: nextStatus } : r))
    );

    try {
      await fetch('/api/admin/coupons', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: rule.id, type: 'rule', is_active: nextStatus }),
      });
    } catch (e) {
      fetchData();
    }
  };

  const totalUsedCount = coupons.reduce((acc, c) => acc + (c.used_count || 0), 0);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Percent className="w-7 h-7 text-rose-500" />
            <span>Kupon & Kampanya Yönetimi</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Müşterileriniz için indirim kupon kodları tanımlayın, minimum sepet limitleri belirleyin ve otomatik sepet indirim kuralları oluşturun.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={openNewRuleModal}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Sepet Kuralı Ekle</span>
          </button>

          <button
            onClick={openNewCouponModal}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Kupon Tanımla</span>
          </button>
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

      {/* 2. STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tanımlı Kuponlar</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{coupons.length}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Aktif Kuponlar</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {coupons.filter((c) => c.is_active === 1).length}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Toplam Kullanım</div>
          <div className="text-2xl font-black text-blue-900 mt-1">{totalUsedCount} Kez</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Kademeli Sepet Kuralları</div>
          <div className="text-2xl font-black text-purple-600 mt-1">{rules.length} Kural</div>
        </div>
      </div>

      {/* 3. KUPONLAR TABLOSU */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Tag className="w-4 h-4 text-rose-600" />
            <span>İndirim Kupon Kodları ({coupons.length})</span>
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="p-3.5">Kupon Kodu</th>
                <th className="p-3.5">Kampanya Başlığı</th>
                <th className="p-3.5">İndirim Tutarı</th>
                <th className="p-3.5">Min. Sepet Tutarı</th>
                <th className="p-3.5">Maks. İndirim</th>
                <th className="p-3.5 text-center">Kullanım / Limit</th>
                <th className="p-3.5 text-center">Durum</th>
                <th className="p-3.5 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    Kuponlar yükleniyor...
                  </td>
                </tr>
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    Henüz kupon tanımlanmadı. &ldquo;Yeni Kupon Tanımla&rdquo; butonu ile ilk kuponunuzu oluşturabilirsiniz.
                  </td>
                </tr>
              ) : (
                coupons.map((c: any) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3.5">
                      <div className="inline-block px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 font-mono font-black text-rose-700 text-xs">
                        {c.code}
                      </div>
                    </td>

                    <td className="p-3.5 font-semibold text-slate-800">
                      {c.title || c.code}
                    </td>

                    <td className="p-3.5 font-bold text-slate-900">
                      {c.discount_type === 'percent' ? (
                        <span className="text-emerald-700 font-black">%{c.discount_value} İndirim</span>
                      ) : (
                        <span className="text-blue-900 font-black">{formatCurrency(c.discount_value)} İndirim</span>
                      )}
                    </td>

                    <td className="p-3.5 text-slate-600 font-semibold">
                      {c.min_order_amount > 0 ? formatCurrency(c.min_order_amount) : 'Yok (0 TL)'}
                    </td>

                    <td className="p-3.5 text-slate-600">
                      {c.max_discount_amount ? formatCurrency(c.max_discount_amount) : 'Sınırsız'}
                    </td>

                    <td className="p-3.5 text-center text-slate-600 font-mono">
                      <span className="font-bold text-slate-900">{c.used_count || 0}</span> / {c.usage_limit || '∞'}
                    </td>

                    <td className="p-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleCouponActive(c)}
                        className={`px-3 py-1 rounded-full text-[10px] font-black transition ${
                          c.is_active === 1
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        }`}
                      >
                        {c.is_active === 1 ? 'Aktif' : 'Pasif'}
                      </button>
                    </td>

                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditCouponModal(c)}
                          className="p-1.5 hover:bg-blue-50 text-blue-900 rounded-lg transition"
                          title="Düzenle"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCoupon(c.id, c.code)}
                          className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition"
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. OTOMATIK SEPET KADEMELI INDIRIM KURALLARI */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Percent className="w-4 h-4 text-purple-600" />
              <span>Otomatik Sepet Kademeli İndirim Kuralları ({rules.length})</span>
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Müşteri sepet tutarı belirli bir eşiği aştığında kupon girmesine gerek kalmadan otomatik olarak uygulanan indirimler.
            </p>
          </div>

          <button
            onClick={openNewRuleModal}
            className="px-3 py-1.5 bg-purple-50 text-purple-900 hover:bg-purple-100 text-xs font-bold rounded-lg border border-purple-200 transition"
          >
            + Yeni Kural
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="p-3.5">Kural Başlığı</th>
                <th className="p-3.5">Min. Sepet Tutarı</th>
                <th className="p-3.5">Uygulanan İndirim</th>
                <th className="p-3.5 text-center">Durum</th>
                <th className="p-3.5 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rules.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    Henüz otomatik sepet kuralı tanımlanmadı.
                  </td>
                </tr>
              ) : (
                rules.map((r: any) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3.5 font-bold text-slate-900">{r.title}</td>
                    <td className="p-3.5 font-bold text-blue-900">{formatCurrency(r.min_cart_total)}</td>
                    <td className="p-3.5">
                      {r.discount_percent > 0 ? (
                        <span className="font-bold text-emerald-700">%{r.discount_percent} İndirim</span>
                      ) : (
                        <span className="font-bold text-blue-900">{formatCurrency(r.discount_fixed)} İndirim</span>
                      )}
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleRuleActive(r)}
                        className={`px-3 py-1 rounded-full text-[10px] font-black transition ${
                          r.is_active === 1
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        }`}
                      >
                        {r.is_active === 1 ? 'Aktif' : 'Pasif'}
                      </button>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditRuleModal(r)}
                          className="p-1.5 hover:bg-blue-50 text-blue-900 rounded-lg transition"
                          title="Düzenle"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRule(r.id, r.title)}
                          className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition"
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. MODAL: KUPON OLUŞTUR / DÜZENLE */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-scaleIn">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Tag className="w-4 h-4 text-rose-400" />
                <span>{editingCoupon ? 'Kuponu Düzenle' : 'Yeni İndirim Kuponu Oluştur'}</span>
              </h3>
              <button
                onClick={() => setIsCouponModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCoupon} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Coupon Code + Random generator */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-800">Kupon Kodu *</label>
                  <button
                    type="button"
                    onClick={generateRandomCode}
                    className="text-[10px] font-bold text-rose-600 hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Rastgele Kod Üret</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="Örn: BURSA15, BAHAR2026..."
                  value={couponForm.code}
                  onChange={(e) =>
                    setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })
                  }
                  className="w-full bg-slate-50 border border-slate-300 focus:bg-white rounded-xl px-3 py-2 text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-rose-600 uppercase"
                />
              </div>

              {/* Title / Description */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Kampanya / Kupon Başlığı
                </label>
                <input
                  type="text"
                  placeholder="Örn: Yeni Üyelere Özel %10 İndirim"
                  value={couponForm.title}
                  onChange={(e) => setCouponForm({ ...couponForm, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              {/* Discount Type & Value */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    İndirim Türü
                  </label>
                  <select
                    value={couponForm.discount_type}
                    onChange={(e) =>
                      setCouponForm({ ...couponForm, discount_type: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
                  >
                    <option value="percent">Yüzdelik Oran (%)</option>
                    <option value="fixed">Sabit Tutar (TL)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    İndirim Miktarı *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={couponForm.discount_value}
                    onChange={(e) =>
                      setCouponForm({ ...couponForm, discount_value: Number(e.target.value) })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
                    placeholder={couponForm.discount_type === 'percent' ? 'Örn: 15 (%)' : 'Örn: 150 (TL)'}
                  />
                </div>
              </div>

              {/* Minimum Order & Maximum Discount */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Min. Sepet Tutarı (TL)
                  </label>
                  <input
                    type="number"
                    value={couponForm.min_order_amount}
                    onChange={(e) =>
                      setCouponForm({ ...couponForm, min_order_amount: Number(e.target.value) })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold"
                    placeholder="0 = Limitsiz"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Maks. İndirim Limiti (TL)
                  </label>
                  <input
                    type="number"
                    value={couponForm.max_discount_amount || ''}
                    onChange={(e) =>
                      setCouponForm({
                        ...couponForm,
                        max_discount_amount: e.target.value ? Number(e.target.value) : 0,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold"
                    placeholder="Boş = Sınırsız"
                  />
                </div>
              </div>

              {/* Usage Limit & Per User */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Toplam Kullanım Limiti
                  </label>
                  <input
                    type="number"
                    value={couponForm.usage_limit || ''}
                    onChange={(e) =>
                      setCouponForm({
                        ...couponForm,
                        usage_limit: e.target.value ? Number(e.target.value) : 0,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold"
                    placeholder="Boş = Sınırsız"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Kişi Başı Kullanım Limiti
                  </label>
                  <input
                    type="number"
                    value={couponForm.per_user_limit}
                    onChange={(e) =>
                      setCouponForm({ ...couponForm, per_user_limit: Number(e.target.value) })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold"
                  />
                </div>
              </div>

              {/* Validity Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Başlangıç Tarihi
                  </label>
                  <input
                    type="date"
                    value={couponForm.start_date}
                    onChange={(e) => setCouponForm({ ...couponForm, start_date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Bitiş Tarihi
                  </label>
                  <input
                    type="date"
                    value={couponForm.expiry_date}
                    onChange={(e) => setCouponForm({ ...couponForm, expiry_date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              {/* Active status */}
              <label className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer text-xs font-bold text-slate-800">
                <input
                  type="checkbox"
                  checked={couponForm.is_active === 1}
                  onChange={(e) =>
                    setCouponForm({ ...couponForm, is_active: e.target.checked ? 1 : 0 })
                  }
                  className="rounded text-rose-600"
                />
                <span>Kupon Hemen Aktif Edilsin</span>
              </label>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCouponModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow transition"
                >
                  {saving ? 'Kaydediliyor...' : editingCoupon ? 'Güncelle' : 'Kuponu Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL: SEPET KURALI OLUŞTUR / DÜZENLE */}
      {isRuleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-scaleIn">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Percent className="w-4 h-4 text-purple-400" />
                <span>{editingRule ? 'Sepet Kuralını Düzenle' : 'Yeni Sepet İndirimi Kuralı'}</span>
              </h3>
              <button
                onClick={() => setIsRuleModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRule} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Kural Başlığı *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Örn: 2.000 TL Üzeri %10 Sepet İndirimi"
                  value={ruleForm.title}
                  onChange={(e) => setRuleForm({ ...ruleForm, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Min. Sepet Tutarı (TL) *
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={ruleForm.min_cart_total}
                  onChange={(e) =>
                    setRuleForm({ ...ruleForm, min_cart_total: Number(e.target.value) })
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    İndirim Oranı (%)
                  </label>
                  <input
                    type="number"
                    value={ruleForm.discount_percent}
                    onChange={(e) =>
                      setRuleForm({
                        ...ruleForm,
                        discount_percent: Number(e.target.value),
                        discount_fixed: 0,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    VEYA Sabit İndirim (TL)
                  </label>
                  <input
                    type="number"
                    value={ruleForm.discount_fixed}
                    onChange={(e) =>
                      setRuleForm({
                        ...ruleForm,
                        discount_fixed: Number(e.target.value),
                        discount_percent: 0,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer text-xs font-bold text-slate-800">
                <input
                  type="checkbox"
                  checked={ruleForm.is_active === 1}
                  onChange={(e) =>
                    setRuleForm({ ...ruleForm, is_active: e.target.checked ? 1 : 0 })
                  }
                  className="rounded text-purple-600"
                />
                <span>Kural Aktif</span>
              </label>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRuleModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow transition"
                >
                  {saving ? 'Kaydediliyor...' : editingRule ? 'Güncelle' : 'Kuralı Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
