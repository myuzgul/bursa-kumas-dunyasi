'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Ticket, Plus, Edit3, Trash2, Copy, Power, Search, Percent, Banknote, Truck,
  AlertCircle, CheckCircle2, X, History, Shuffle, Download, Layers, Eye, Check,
} from 'lucide-react';
import { formatCurrency } from '@/lib/services/meterEngine';
import {
  useAdminCatalog, StatusBadge, FieldLabel, inputCls, Toggle, DateRangeFields, TargetingFields,
  CustomerFields, Section, isoToLocalInput, localInputToIso, formatDateTime,
  type TargetingValue, type CustomerValue,
} from '@/components/admin/promo/shared';

type CouponType = 'percent' | 'fixed' | 'free_shipping';

interface CouponForm extends TargetingValue, CustomerValue {
  id?: string;
  code: string;
  title: string;
  description: string;
  discount_type: CouponType;
  discount_value: string;
  max_discount_amount: string;
  min_order_amount: string;
  min_total_meters: string;
  start_at: string;
  end_at: string;
  usage_limit: string;
  per_customer_limit: string;
  combinable_with_cart_discount: boolean;
  is_public: boolean;
  is_active: boolean;
  bulk_enabled: boolean;
  bulk_count: string;
  bulk_prefix: string;
  bulk_length: string;
}

const emptyForm = (): CouponForm => ({
  code: '',
  title: '',
  description: '',
  discount_type: 'percent',
  discount_value: '10',
  max_discount_amount: '',
  min_order_amount: '',
  min_total_meters: '',
  start_at: '',
  end_at: '',
  usage_limit: '',
  per_customer_limit: '1',
  applies_to: 'all',
  category_ids: [],
  product_ids: [],
  exclude_product_ids: [],
  exclude_sale_items: 0,
  customer_scope: 'all',
  allowed_emails: '',
  combinable_with_cart_discount: true,
  is_public: false,
  is_active: true,
  bulk_enabled: false,
  bulk_count: '50',
  bulk_prefix: 'BKD',
  bulk_length: '6',
});

const FILTERS = [
  { key: 'all', label: 'Tümü' },
  { key: 'active', label: 'Yayında' },
  { key: 'scheduled', label: 'Planlandı' },
  { key: 'expired', label: 'Süresi / Limiti Doldu' },
  { key: 'inactive', label: 'Pasif' },
  { key: 'bulk', label: 'Toplu Üretilenler' },
];

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const randomCode = (len = 8) => Array.from({ length: len }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join('');

function discountText(c: any) {
  if (c.discount_type === 'free_shipping') return 'Ücretsiz Kargo';
  if (c.discount_type === 'percent') return `%${c.discount_value}`;
  return formatCurrency(c.discount_value);
}

export default function AdminCouponsPage() {
  const { categories, products } = useAdminCatalog();
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<CouponForm>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);
  const [authError, setAuthError] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [usageFor, setUsageFor] = useState<any | null>(null);
  const [usages, setUsages] = useState<any[]>([]);
  const [usageLoading, setUsageLoading] = useState(false);

  const notify = (ok: boolean, text: string) => {
    setToast({ ok, text });
    setTimeout(() => setToast(null), 3500);
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/coupons', { cache: 'no-store' });
      if (res.status === 401) {
        setAuthError(true);
        return;
      }
      const data = await res.json();
      setCoupons(data.coupons || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => {
    const active = coupons.filter((c) => c.status === 'active').length;
    const used = coupons.reduce((a, c) => a + (c.used_count || 0), 0);
    const given = coupons.reduce((a, c) => a + (c.total_discount_given || 0), 0);
    const batches = new Set(coupons.filter((c) => c.batch_id).map((c) => c.batch_id)).size;
    return { active, used, given, batches, total: coupons.length };
  }, [coupons]);

  const batches = useMemo(() => {
    const map = new Map<string, { id: string; count: number; used: number; sample: any }>();
    for (const c of coupons) {
      if (!c.batch_id) continue;
      const b = map.get(c.batch_id) || { id: c.batch_id, count: 0, used: 0, sample: c };
      b.count++;
      if (c.used_count > 0) b.used++;
      map.set(c.batch_id, b);
    }
    return Array.from(map.values());
  }, [coupons]);

  const visible = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('tr-TR');
    return coupons
      .filter((c) => {
        if (filter === 'all') return true;
        if (filter === 'bulk') return !!c.batch_id;
        if (filter === 'expired') return c.status === 'expired' || c.status === 'exhausted';
        return c.status === filter;
      })
      .filter((c) => !q || `${c.code} ${c.title}`.toLocaleLowerCase('tr-TR').includes(q))
      .slice(0, 500);
  }, [coupons, filter, query]);

  const openNew = () => {
    setForm({ ...emptyForm(), code: randomCode(8) });
    setFormError(null);
    setIsOpen(true);
  };

  const openEdit = (c: any) => {
    setForm({
      ...emptyForm(),
      id: c.id,
      code: c.code,
      title: c.title === c.code ? '' : c.title || '',
      description: c.description || '',
      discount_type: c.discount_type,
      discount_value: String(c.discount_value ?? ''),
      max_discount_amount: c.max_discount_amount ? String(c.max_discount_amount) : '',
      min_order_amount: c.min_order_amount ? String(c.min_order_amount) : '',
      min_total_meters: c.min_total_meters ? String(c.min_total_meters) : '',
      start_at: isoToLocalInput(c.start_at),
      end_at: isoToLocalInput(c.end_at),
      usage_limit: c.usage_limit ? String(c.usage_limit) : '',
      per_customer_limit: c.per_customer_limit ? String(c.per_customer_limit) : '',
      applies_to: c.applies_to,
      category_ids: c.category_ids || [],
      product_ids: c.product_ids || [],
      exclude_product_ids: c.exclude_product_ids || [],
      exclude_sale_items: c.exclude_sale_items || 0,
      customer_scope: c.customer_scope,
      allowed_emails: (c.allowed_emails || []).join('\n'),
      combinable_with_cart_discount: !!c.combinable_with_cart_discount,
      is_public: !!c.is_public,
      is_active: !!c.is_active,
    });
    setFormError(null);
    setIsOpen(true);
  };

  const save = async () => {
    setSaving(true);
    setFormError(null);
    try {
      const payload: any = {
        ...form,
        code: form.code.trim().toUpperCase(),
        start_at: localInputToIso(form.start_at),
        end_at: localInputToIso(form.end_at),
      };
      if (!form.id && form.bulk_enabled) {
        payload.bulk = { count: Number(form.bulk_count), prefix: form.bulk_prefix, length: Number(form.bulk_length) };
        if (!payload.usage_limit) payload.usage_limit = 1;
      }
      const res = await fetch('/api/admin/coupons', {
        method: form.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.message || 'Kaydedilemedi.');
        return;
      }
      setIsOpen(false);
      if (data.batch_id) {
        notify(true, `${data.coupons.length} adet kupon üretildi. Listeyi "Toplu Gruplar" bölümünden indirebilirsiniz.`);
      } else {
        notify(true, form.id ? 'Kupon güncellendi.' : 'Kupon oluşturuldu.');
      }
      load();
    } catch {
      setFormError('Bağlantı hatası.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (c: any) => {
    const res = await fetch('/api/admin/coupons', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: c.id, is_active: c.is_active ? 0 : 1 }),
    });
    if (res.ok) {
      notify(true, c.is_active ? 'Kupon durduruldu.' : 'Kupon yayına alındı.');
      load();
    }
  };

  const duplicate = async (c: any) => {
    const res = await fetch('/api/admin/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'duplicate', id: c.id }),
    });
    const data = await res.json();
    if (res.ok) {
      notify(true, `Kupon kopyalandı: ${data.coupon?.code} (pasif)`);
      load();
    } else notify(false, data.message || 'Kopyalanamadı.');
  };

  const remove = async (c: any) => {
    if (!confirm(`"${c.code}" kuponu silinsin mi? Geçmiş siparişler etkilenmez.`)) return;
    const res = await fetch(`/api/admin/coupons?id=${encodeURIComponent(c.id)}`, { method: 'DELETE' });
    if (res.ok) {
      notify(true, 'Kupon silindi.');
      load();
    }
  };

  const removeBatch = async (batchId: string, count: number) => {
    if (!confirm(`Bu gruptaki ${count} kuponun tamamı silinsin mi?`)) return;
    const res = await fetch(`/api/admin/coupons?batch_id=${encodeURIComponent(batchId)}`, { method: 'DELETE' });
    if (res.ok) {
      notify(true, 'Kupon grubu silindi.');
      load();
    }
  };

  const exportBatch = (batchId: string) => {
    const rows = coupons.filter((c) => c.batch_id === batchId);
    const header = ['Kupon Kodu', 'İndirim', 'Kullanıldı', 'Başlangıç', 'Bitiş'];
    const lines = rows.map((c) =>
      [c.code, discountText(c), c.used_count > 0 ? 'Evet' : 'Hayır', formatDateTime(c.start_at), c.end_at ? formatDateTime(c.end_at) : 'Süresiz']
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(';')
    );
    const csv = '﻿' + [header.join(';'), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kuponlar-${batchId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyCode = (code: string) => {
    try {
      navigator.clipboard.writeText(code);
      setCopied(code);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // ignore
    }
  };

  const openUsages = async (c: any) => {
    setUsageFor(c);
    setUsages([]);
    setUsageLoading(true);
    try {
      const res = await fetch(`/api/admin/coupons?usages=${encodeURIComponent(c.id)}`, { cache: 'no-store' });
      const data = await res.json();
      setUsages(data.usages || []);
    } finally {
      setUsageLoading(false);
    }
  };

  const scopeText: Record<string, string> = {
    all: '',
    members: 'Sadece üyeler',
    first_order: 'İlk sipariş',
    specific: 'Belirli müşteriler',
  };

  if (authError) {
    return (
      <div className="max-w-lg mx-auto mt-16 p-6 bg-white rounded-2xl border border-red-200 text-center space-y-2">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
        <h2 className="font-bold text-slate-900">Oturum gerekli</h2>
        <p className="text-xs text-slate-600">Bu sayfayı görüntülemek için yönetici olarak giriş yapınız.</p>
        <a href="/auth/giris" className="inline-block mt-2 px-4 py-2 bg-blue-900 text-white text-xs font-bold rounded-lg">
          Giriş Yap
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Ticket className="w-6 h-6 text-rose-600" />
            Kupon Kodları
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Yüzde, tutar veya ücretsiz kargo kuponları; tarih, limit, kategori/ürün ve müşteri kısıtlamalarıyla.
          </p>
        </div>
        <button onClick={openNew} className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow">
          <Plus className="w-4 h-4" />
          Yeni Kupon
        </button>
      </div>

      {toast && (
        <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 border ${toast.ok ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
          {toast.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.text}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Toplam Kupon', value: String(stats.total) },
          { label: 'Yayındaki Kupon', value: String(stats.active) },
          { label: 'Toplam Kullanım', value: `${stats.used} sipariş` },
          { label: 'Verilen Toplam İndirim', value: formatCurrency(stats.given) },
        ].map((s) => (
          <div key={s.label} className="bg-white p-4 rounded-2xl border border-slate-200">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</div>
            <div className="text-xl font-black text-slate-900 mt-1">{s.value}</div>
          </div>
        ))}
      </div>

      {batches.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2">
          <div className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" /> Toplu Gruplar
          </div>
          <div className="divide-y divide-slate-100">
            {batches.map((b) => (
              <div key={b.id} className="py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div>
                  <span className="font-bold text-slate-900">{b.sample.title || 'Toplu kupon'}</span>
                  <span className="text-slate-500"> • {b.count} kod • {b.used} kullanıldı • {discountText(b.sample)}</span>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => exportBatch(b.id)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-slate-700">
                    <Download className="w-3.5 h-3.5" /> CSV İndir
                  </button>
                  <button onClick={() => removeBatch(b.id, b.count)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 font-bold text-red-600">
                    <Trash2 className="w-3.5 h-3.5" /> Grubu Sil
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100">
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <button key={f.key} onClick={() => setFilter(f.key)} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold ${filter === f.key ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {f.label}
              </button>
            ))}
          </div>
          <div className="relative md:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Kod veya ad ara..." className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-900" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="p-3">Kupon</th>
                <th className="p-3">İndirim</th>
                <th className="p-3">Koşullar</th>
                <th className="p-3">Geçerlilik</th>
                <th className="p-3 text-center">Kullanım</th>
                <th className="p-3 text-center">Durum</th>
                <th className="p-3 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center text-slate-500">Yükleniyor...</td></tr>
              ) : visible.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center">
                    <div className="text-slate-500 font-semibold">Kupon bulunamadı.</div>
                    <button onClick={openNew} className="mt-2 text-blue-900 font-bold text-xs hover:underline">+ Yeni kupon oluşturun</button>
                  </td>
                </tr>
              ) : (
                visible.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 align-top">
                    <td className="p-3">
                      <button onClick={() => copyCode(c.code)} title="Kodu kopyala" className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 font-mono font-black text-rose-700">
                        {c.code}
                        {copied === c.code ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3 opacity-60" />}
                      </button>
                      {c.title && c.title !== c.code && <div className="text-[11px] text-slate-700 font-semibold mt-1">{c.title}</div>}
                      <div className="flex flex-wrap gap-1 mt-1">
                        {c.is_public === 1 && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">Hesabım’da görünür</span>}
                        {c.batch_id && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">Toplu</span>}
                      </div>
                    </td>
                    <td className="p-3 font-black text-slate-900 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1">
                        {c.discount_type === 'free_shipping' && <Truck className="w-3.5 h-3.5 text-blue-700" />}
                        {discountText(c)}
                      </span>
                      {c.max_discount_amount && <div className="text-[10px] font-medium text-slate-500">maks. {formatCurrency(c.max_discount_amount)}</div>}
                    </td>
                    <td className="p-3 text-slate-600 space-y-0.5">
                      {c.min_order_amount > 0 && <div>Min. {formatCurrency(c.min_order_amount)}</div>}
                      {c.min_total_meters > 0 && <div>Min. {c.min_total_meters} metre</div>}
                      {c.applies_to !== 'all' && (
                        <div className="text-[11px]">{c.applies_to === 'categories' ? `${c.category_ids.length} kategori` : `${c.product_ids.length} ürün`}</div>
                      )}
                      {scopeText[c.customer_scope] && <div className="text-[11px] text-purple-700 font-semibold">{scopeText[c.customer_scope]}</div>}
                      {!c.combinable_with_cart_discount && <div className="text-[10px] text-amber-700">Sepet indirimiyle birleşmez</div>}
                    </td>
                    <td className="p-3 text-slate-600 whitespace-nowrap">
                      <div>{formatDateTime(c.start_at)}</div>
                      <div className="text-slate-400">→ {c.end_at ? formatDateTime(c.end_at) : 'Süresiz'}</div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="font-bold text-slate-900">{c.used_count || 0}<span className="text-slate-400 font-normal"> / {c.usage_limit || '∞'}</span></div>
                      {c.per_customer_limit && <div className="text-[10px] text-slate-500">kişi başı {c.per_customer_limit}</div>}
                      <div className="text-[10px] text-slate-500">{formatCurrency(c.total_discount_given || 0)}</div>
                    </td>
                    <td className="p-3 text-center"><StatusBadge status={c.status} /></td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openUsages(c)} title="Kullanım geçmişi" className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"><History className="w-4 h-4" /></button>
                        <button onClick={() => toggleActive(c)} title={c.is_active ? 'Durdur' : 'Yayına al'} className={`p-1.5 rounded-lg ${c.is_active ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-100'}`}><Power className="w-4 h-4" /></button>
                        <button onClick={() => openEdit(c)} title="Düzenle" className="p-1.5 rounded-lg text-blue-900 hover:bg-blue-50"><Edit3 className="w-4 h-4" /></button>
                        <button onClick={() => duplicate(c)} title="Kopyala" className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"><Copy className="w-4 h-4" /></button>
                        <button onClick={() => remove(c)} title="Sil" className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Kullanım geçmişi */}
      {usageFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setUsageFor(null)} />
          <div className="relative w-full max-w-2xl max-h-[80vh] bg-white rounded-2xl shadow-2xl flex flex-col">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4" /> {usageFor.code} — Kullanım Geçmişi
              </h3>
              <button onClick={() => setUsageFor(null)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {usageLoading ? (
                <div className="p-8 text-center text-xs text-slate-500">Yükleniyor...</div>
              ) : usages.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">Bu kupon henüz kullanılmadı.</div>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] uppercase text-slate-500">
                      <th className="p-2.5 text-left">Sipariş</th>
                      <th className="p-2.5 text-left">Müşteri</th>
                      <th className="p-2.5 text-right">İndirim</th>
                      <th className="p-2.5 text-left">Tarih</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {usages.map((u) => (
                      <tr key={u.id} className={u.status === 'cancelled' ? 'opacity-50 line-through' : ''}>
                        <td className="p-2.5">
                          <a href={`/admin/siparisler/${u.order_id}`} className="font-bold text-blue-900 hover:underline inline-flex items-center gap-1">
                            #{u.order_number} <Eye className="w-3 h-3" />
                          </a>
                        </td>
                        <td className="p-2.5">
                          <div className="font-semibold text-slate-800">{u.customer_name || '-'}</div>
                          <div className="text-[10px] text-slate-500">{u.email}</div>
                        </td>
                        <td className="p-2.5 text-right font-bold text-emerald-700">
                          {u.free_shipping ? 'Ücretsiz kargo' : `-${formatCurrency(u.discount_amount || 0)}`}
                        </td>
                        <td className="p-2.5 text-slate-600">{formatDateTime(u.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => !saving && setIsOpen(false)} />
          <div className="relative ml-auto w-full max-w-2xl h-full bg-slate-50 shadow-2xl flex flex-col">
            <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between">
              <h2 className="font-black text-slate-900 text-sm">{form.id ? 'Kuponu Düzenle' : 'Yeni Kupon'}</h2>
              <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <Section title="Kupon Kodu">
                {!form.id && (
                  <Toggle checked={form.bulk_enabled} onChange={(v) => setForm({ ...form, bulk_enabled: v })} label="Toplu benzersiz kod üret" hint="Influencer, SMS veya kartvizit kampanyaları için her biri tek kullanımlık çok sayıda kod." />
                )}
                {form.bulk_enabled && !form.id ? (
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <FieldLabel>Adet (1-1000)</FieldLabel>
                      <input type="number" min="1" max="1000" value={form.bulk_count} onChange={(e) => setForm({ ...form, bulk_count: e.target.value })} className={inputCls} />
                    </div>
                    <div>
                      <FieldLabel>Önek</FieldLabel>
                      <input value={form.bulk_prefix} onChange={(e) => setForm({ ...form, bulk_prefix: e.target.value.toUpperCase() })} className={`${inputCls} font-mono uppercase`} />
                    </div>
                    <div>
                      <FieldLabel>Kod Uzunluğu</FieldLabel>
                      <input type="number" min="4" max="16" value={form.bulk_length} onChange={(e) => setForm({ ...form, bulk_length: e.target.value })} className={inputCls} />
                    </div>
                    <div className="col-span-3 text-[11px] text-slate-500">
                      Örnek kod: <span className="font-mono font-bold text-slate-800">{form.bulk_prefix ? `${form.bulk_prefix}-` : ''}{randomCode(Number(form.bulk_length) || 6)}</span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <FieldLabel hint="Harf, rakam, tire ve alt çizgi. Büyük/küçük harf fark etmez.">Kod *</FieldLabel>
                    <div className="flex gap-2">
                      <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().replace(/\s+/g, '') })} placeholder="ORNEK: KETEN20" className={`${inputCls} font-mono font-bold uppercase`} />
                      <button type="button" onClick={() => setForm({ ...form, code: randomCode(8) })} className="px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold inline-flex items-center gap-1">
                        <Shuffle className="w-3.5 h-3.5" /> Üret
                      </button>
                    </div>
                  </div>
                )}
                <div>
                  <FieldLabel hint="Müşterinin Hesabım > Kuponlarım sayfasında ve panelde görünür.">Kupon Başlığı</FieldLabel>
                  <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Örn: Yeni Üyelere Özel %15" className={inputCls} />
                </div>
                <div>
                  <FieldLabel>Açıklama</FieldLabel>
                  <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputCls} />
                </div>
              </Section>

              <Section title="İndirim">
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'percent', label: 'Yüzde (%)', icon: <Percent className="w-4 h-4" /> },
                    { key: 'fixed', label: 'Sabit Tutar', icon: <Banknote className="w-4 h-4" /> },
                    { key: 'free_shipping', label: 'Ücretsiz Kargo', icon: <Truck className="w-4 h-4" /> },
                  ].map((t) => (
                    <button key={t.key} type="button" onClick={() => setForm({ ...form, discount_type: t.key as CouponType })} className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[11px] font-bold border ${form.discount_type === t.key ? 'bg-blue-900 text-white border-blue-900' : 'bg-white text-slate-700 border-slate-200'}`}>
                      {t.icon}
                      {t.label}
                    </button>
                  ))}
                </div>
                {form.discount_type !== 'free_shipping' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <FieldLabel>{form.discount_type === 'percent' ? 'İndirim Oranı (%) *' : 'İndirim Tutarı (TL) *'}</FieldLabel>
                      <input type="number" min="0" step="0.01" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: e.target.value })} className={inputCls} />
                    </div>
                    {form.discount_type === 'percent' && (
                      <div>
                        <FieldLabel hint="İsteğe bağlı üst sınır">Maksimum İndirim (TL)</FieldLabel>
                        <input type="number" min="0" step="0.01" value={form.max_discount_amount} onChange={(e) => setForm({ ...form, max_discount_amount: e.target.value })} placeholder="Sınırsız" className={inputCls} />
                      </div>
                    )}
                  </div>
                )}
              </Section>

              <Section title="Koşullar">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FieldLabel hint="Kapsamdaki ürünlerin toplamı">Minimum Sepet Tutarı (TL)</FieldLabel>
                    <input type="number" min="0" step="0.01" value={form.min_order_amount} onChange={(e) => setForm({ ...form, min_order_amount: e.target.value })} placeholder="Yok" className={inputCls} />
                  </div>
                  <div>
                    <FieldLabel hint="Kumaşa özel: toplam metre şartı">Minimum Toplam Metre</FieldLabel>
                    <input type="number" min="0" step="0.5" value={form.min_total_meters} onChange={(e) => setForm({ ...form, min_total_meters: e.target.value })} placeholder="Yok" className={inputCls} />
                  </div>
                </div>
                <TargetingFields value={form} onChange={(v) => setForm({ ...form, ...v })} categories={categories} products={products} />
              </Section>

              <Section title="Kullanım Limitleri">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FieldLabel hint={form.bulk_enabled && !form.id ? 'Toplu kodlarda boşsa her kod 1 kez kullanılır' : 'Tüm müşteriler için toplam'}>Toplam Kullanım Limiti</FieldLabel>
                    <input type="number" min="0" value={form.usage_limit} onChange={(e) => setForm({ ...form, usage_limit: e.target.value })} placeholder={form.bulk_enabled && !form.id ? '1' : 'Sınırsız'} className={inputCls} />
                  </div>
                  <div>
                    <FieldLabel hint="E-posta, telefon ve üyelik ile kontrol edilir">Müşteri Başına Limit</FieldLabel>
                    <input type="number" min="0" value={form.per_customer_limit} onChange={(e) => setForm({ ...form, per_customer_limit: e.target.value })} placeholder="Sınırsız" className={inputCls} />
                  </div>
                </div>
                <CustomerFields value={form} onChange={(v) => setForm({ ...form, ...v })} noun="kupon" />
              </Section>

              <Section title="Zamanlama">
                <DateRangeFields start={form.start_at} end={form.end_at} onChange={(s, e) => setForm({ ...form, start_at: s, end_at: e })} />
              </Section>

              <Section title="Gelişmiş">
                <Toggle checked={form.combinable_with_cart_discount} onChange={(v) => setForm({ ...form, combinable_with_cart_discount: v })} label="Sepette indirim kampanyalarıyla birlikte kullanılabilir" hint="Kapalıysa müşteriye kupon ile kampanyadan hangisi daha avantajlıysa o uygulanır." />
                <Toggle checked={form.is_public} onChange={(v) => setForm({ ...form, is_public: v })} label="Müşterilerin Hesabım > Kuponlarım sayfasında göster" />
                <Toggle checked={form.is_active} onChange={(v) => setForm({ ...form, is_active: v })} label="Kupon aktif" />
              </Section>
            </div>

            <div className="p-4 bg-white border-t border-slate-200 space-y-2">
              {formError && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {formError}
                </div>
              )}
              <div className="flex gap-2 justify-end">
                <button onClick={() => setIsOpen(false)} className="px-4 py-2.5 text-xs font-bold text-slate-600 rounded-xl hover:bg-slate-100">Vazgeç</button>
                <button onClick={save} disabled={saving} className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-xl disabled:opacity-50">
                  {saving ? 'Kaydediliyor...' : form.id ? 'Değişiklikleri Kaydet' : form.bulk_enabled ? `${form.bulk_count || 0} Kupon Üret` : 'Kuponu Oluştur'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
