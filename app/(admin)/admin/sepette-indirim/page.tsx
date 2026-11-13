'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  ShoppingCart, Plus, Edit3, Trash2, Copy, Power, Search, Percent, Banknote,
  AlertCircle, CheckCircle2, X, Info, TrendingUp, CalendarClock, Gift,
} from 'lucide-react';
import { formatCurrency } from '@/lib/services/meterEngine';
import {
  useAdminCatalog, StatusBadge, FieldLabel, inputCls, Toggle, DateRangeFields, TargetingFields,
  CustomerFields, Section, isoToLocalInput, localInputToIso, formatDateTime,
  type TargetingValue, type CustomerValue,
} from '@/components/admin/promo/shared';

interface RuleForm extends TargetingValue, CustomerValue {
  id?: string;
  title: string;
  label: string;
  description: string;
  discount_type: 'percent' | 'fixed';
  discount_value: string;
  max_discount_amount: string;
  min_cart_total: string;
  min_total_meters: string;
  start_at: string;
  end_at: string;
  combinable_with_coupon: boolean;
  show_progress_hint: boolean;
  usage_limit: string;
  priority: string;
  is_active: boolean;
}

const emptyForm = (): RuleForm => ({
  title: '',
  label: '',
  description: '',
  discount_type: 'percent',
  discount_value: '10',
  max_discount_amount: '',
  min_cart_total: '1000',
  min_total_meters: '',
  start_at: '',
  end_at: '',
  applies_to: 'all',
  category_ids: [],
  product_ids: [],
  exclude_product_ids: [],
  exclude_sale_items: 0,
  customer_scope: 'all',
  allowed_emails: '',
  combinable_with_coupon: true,
  show_progress_hint: true,
  usage_limit: '',
  priority: '0',
  is_active: true,
});

const FILTERS = [
  { key: 'all', label: 'Tümü' },
  { key: 'active', label: 'Yayında' },
  { key: 'scheduled', label: 'Planlandı' },
  { key: 'expired', label: 'Süresi Doldu' },
  { key: 'inactive', label: 'Pasif' },
];

export default function AdminCartDiscountPage() {
  const { categories, products } = useAdminCatalog();
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<RuleForm>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);
  const [authError, setAuthError] = useState(false);

  const notify = (ok: boolean, text: string) => {
    setToast({ ok, text });
    setTimeout(() => setToast(null), 3500);
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/cart-discounts', { cache: 'no-store' });
      if (res.status === 401) {
        setAuthError(true);
        return;
      }
      const data = await res.json();
      setRules(data.rules || []);
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
    const active = rules.filter((r) => r.status === 'active').length;
    const scheduled = rules.filter((r) => r.status === 'scheduled').length;
    const used = rules.reduce((a, r) => a + (r.used_count || 0), 0);
    const given = rules.reduce((a, r) => a + (r.total_discount_given || 0), 0);
    return { active, scheduled, used, given };
  }, [rules]);

  const visible = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('tr-TR');
    return rules
      .filter((r) => (filter === 'all' ? true : filter === 'expired' ? r.status === 'expired' || r.status === 'exhausted' : r.status === filter))
      .filter((r) => !q || `${r.title} ${r.label}`.toLocaleLowerCase('tr-TR').includes(q));
  }, [rules, filter, query]);

  const openNew = () => {
    setForm(emptyForm());
    setFormError(null);
    setIsOpen(true);
  };

  const openEdit = (r: any) => {
    setForm({
      id: r.id,
      title: r.title || '',
      label: r.label || '',
      description: r.description || '',
      discount_type: r.discount_type,
      discount_value: String(r.discount_value ?? ''),
      max_discount_amount: r.max_discount_amount ? String(r.max_discount_amount) : '',
      min_cart_total: r.min_cart_total ? String(r.min_cart_total) : '',
      min_total_meters: r.min_total_meters ? String(r.min_total_meters) : '',
      start_at: isoToLocalInput(r.start_at),
      end_at: isoToLocalInput(r.end_at),
      applies_to: r.applies_to,
      category_ids: r.category_ids || [],
      product_ids: r.product_ids || [],
      exclude_product_ids: r.exclude_product_ids || [],
      exclude_sale_items: r.exclude_sale_items || 0,
      customer_scope: r.customer_scope,
      allowed_emails: (r.allowed_emails || []).join('\n'),
      combinable_with_coupon: !!r.combinable_with_coupon,
      show_progress_hint: !!r.show_progress_hint,
      usage_limit: r.usage_limit ? String(r.usage_limit) : '',
      priority: String(r.priority || 0),
      is_active: !!r.is_active,
    });
    setFormError(null);
    setIsOpen(true);
  };

  const previewLabel =
    form.label.trim() ||
    (form.discount_type === 'percent'
      ? `Sepette %${form.discount_value || 0} İndirim`
      : `Sepette ${formatCurrency(Number(form.discount_value) || 0)} İndirim`);

  const save = async () => {
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        ...form,
        start_at: localInputToIso(form.start_at),
        end_at: localInputToIso(form.end_at),
        allowed_emails: form.allowed_emails,
      };
      const res = await fetch('/api/admin/cart-discounts', {
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
      notify(true, form.id ? 'Kampanya güncellendi.' : 'Kampanya oluşturuldu.');
      load();
    } catch {
      setFormError('Bağlantı hatası.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (r: any) => {
    const res = await fetch('/api/admin/cart-discounts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: r.id, is_active: r.is_active ? 0 : 1 }),
    });
    if (res.ok) {
      notify(true, r.is_active ? 'Kampanya durduruldu.' : 'Kampanya yayına alındı.');
      load();
    }
  };

  const duplicate = async (r: any) => {
    const res = await fetch('/api/admin/cart-discounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'duplicate', id: r.id }),
    });
    const data = await res.json();
    if (res.ok) {
      notify(true, 'Kampanya kopyalandı (pasif olarak).');
      load();
    } else notify(false, data.message || 'Kopyalanamadı.');
  };

  const remove = async (r: any) => {
    if (!confirm(`"${r.title}" kampanyası silinsin mi? Bu işlem geri alınamaz.`)) return;
    const res = await fetch(`/api/admin/cart-discounts?id=${encodeURIComponent(r.id)}`, { method: 'DELETE' });
    if (res.ok) {
      notify(true, 'Kampanya silindi.');
      load();
    }
  };

  const describeTarget = (r: any) => {
    if (r.applies_to === 'categories') {
      const names = (r.category_ids || []).map((id: string) => categories.find((c) => c.id === id)?.name).filter(Boolean);
      return `Kategoriler: ${names.slice(0, 3).join(', ')}${names.length > 3 ? ` +${names.length - 3}` : ''}`;
    }
    if (r.applies_to === 'products') return `${(r.product_ids || []).length} seçili ürün`;
    return 'Tüm ürünler';
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
      {/* Başlık */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-emerald-600" />
            Sepette İndirim
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Belirli tarih aralığında, sepet tutarına / metrajına göre otomatik uygulanan yüzde veya tutar indirimleri.
          </p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow"
        >
          <Plus className="w-4 h-4" />
          Yeni Kampanya
        </button>
      </div>

      {toast && (
        <div
          className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
            toast.ok ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
          }`}
        >
          {toast.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.text}
        </div>
      )}

      {/* İstatistikler */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Yayındaki Kampanya', value: String(stats.active), icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" /> },
          { label: 'Planlanan', value: String(stats.scheduled), icon: <CalendarClock className="w-4 h-4 text-blue-600" /> },
          { label: 'Toplam Kullanım', value: `${stats.used} sipariş`, icon: <TrendingUp className="w-4 h-4 text-purple-600" /> },
          { label: 'Verilen Toplam İndirim', value: formatCurrency(stats.given), icon: <Gift className="w-4 h-4 text-rose-600" /> },
        ].map((s) => (
          <div key={s.label} className="bg-white p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {s.icon}
              {s.label}
            </div>
            <div className="text-xl font-black text-slate-900 mt-1">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900 flex items-start gap-2">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span>
          Aynı anda birden fazla kampanyanın koşulları sağlanırsa müşteriye <strong>en avantajlı olan tek kampanya</strong> uygulanır.
          Koşulu henüz sağlanmayan kampanyalar için sepette “X TL daha ekleyin, indirim kazanın” bilgisi gösterilir.
        </span>
      </div>

      {/* Liste */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100">
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold ${
                  filter === f.key ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="relative md:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Kampanya ara..."
              className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-900"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="p-3">Kampanya</th>
                <th className="p-3">İndirim</th>
                <th className="p-3">Koşullar</th>
                <th className="p-3">Tarih Aralığı</th>
                <th className="p-3 text-center">Kullanım</th>
                <th className="p-3 text-center">Durum</th>
                <th className="p-3 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">Yükleniyor...</td>
                </tr>
              ) : visible.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center">
                    <div className="text-slate-500 font-semibold">Henüz kampanya yok.</div>
                    <button onClick={openNew} className="mt-2 text-blue-900 font-bold text-xs hover:underline">
                      + İlk sepette indirim kampanyasını oluşturun
                    </button>
                  </td>
                </tr>
              ) : (
                visible.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 align-top">
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{r.title}</div>
                      <div className="text-[11px] text-emerald-700 font-semibold">
                        {r.label || (r.discount_type === 'percent' ? `Sepette %${r.discount_value} İndirim` : `Sepette ${formatCurrency(r.discount_value)} İndirim`)}
                      </div>
                    </td>
                    <td className="p-3 font-black text-slate-900 whitespace-nowrap">
                      {r.discount_type === 'percent' ? `%${r.discount_value}` : formatCurrency(r.discount_value)}
                      {r.max_discount_amount && (
                        <div className="text-[10px] font-medium text-slate-500">maks. {formatCurrency(r.max_discount_amount)}</div>
                      )}
                    </td>
                    <td className="p-3 text-slate-600 space-y-0.5">
                      {r.min_cart_total > 0 && <div>Min. {formatCurrency(r.min_cart_total)}</div>}
                      {r.min_total_meters > 0 && <div>Min. {r.min_total_meters} metre</div>}
                      <div className="text-[11px]">{describeTarget(r)}</div>
                      {scopeText[r.customer_scope] && (
                        <div className="text-[11px] text-purple-700 font-semibold">{scopeText[r.customer_scope]}</div>
                      )}
                      {!r.combinable_with_coupon && <div className="text-[10px] text-amber-700">Kuponla birleşmez</div>}
                    </td>
                    <td className="p-3 text-slate-600 whitespace-nowrap">
                      <div>{formatDateTime(r.start_at)}</div>
                      <div className="text-slate-400">→ {r.end_at ? formatDateTime(r.end_at) : 'Süresiz'}</div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="font-bold text-slate-900">
                        {r.used_count || 0}
                        <span className="text-slate-400 font-normal"> / {r.usage_limit || '∞'}</span>
                      </div>
                      <div className="text-[10px] text-slate-500">{formatCurrency(r.total_discount_given || 0)}</div>
                    </td>
                    <td className="p-3 text-center">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => toggleActive(r)} title={r.is_active ? 'Durdur' : 'Yayına al'} className={`p-1.5 rounded-lg ${r.is_active ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-100'}`}>
                          <Power className="w-4 h-4" />
                        </button>
                        <button onClick={() => openEdit(r)} title="Düzenle" className="p-1.5 rounded-lg text-blue-900 hover:bg-blue-50">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => duplicate(r)} title="Kopyala" className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100">
                          <Copy className="w-4 h-4" />
                        </button>
                        <button onClick={() => remove(r)} title="Sil" className="p-1.5 rounded-lg text-red-600 hover:bg-red-50">
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

      {/* Form */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => !saving && setIsOpen(false)} />
          <div className="relative ml-auto w-full max-w-2xl h-full bg-slate-50 shadow-2xl flex flex-col">
            <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between">
              <h2 className="font-black text-slate-900 text-sm">
                {form.id ? 'Kampanyayı Düzenle' : 'Yeni Sepette İndirim Kampanyası'}
              </h2>
              <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <Section title="Kampanya Bilgisi">
                <div>
                  <FieldLabel hint="Yalnızca panelde görünür.">Kampanya Adı *</FieldLabel>
                  <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Örn: Kasım Keten Haftası" className={inputCls} />
                </div>
                <div>
                  <FieldLabel hint="Sepette ve ödeme sayfasında müşteriye gösterilir. Boş bırakılırsa otomatik oluşturulur.">Müşteriye Görünen Etiket</FieldLabel>
                  <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder={previewLabel} className={inputCls} />
                </div>
                <div>
                  <FieldLabel>Açıklama / İç Not</FieldLabel>
                  <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputCls} />
                </div>
              </Section>

              <Section title="İndirim">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'percent', label: 'Yüzde (%)', icon: <Percent className="w-4 h-4" /> },
                    { key: 'fixed', label: 'Sabit Tutar (TL)', icon: <Banknote className="w-4 h-4" /> },
                  ].map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setForm({ ...form, discount_type: t.key as 'percent' | 'fixed' })}
                      className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold border ${
                        form.discount_type === t.key ? 'bg-blue-900 text-white border-blue-900' : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      {t.icon}
                      {t.label}
                    </button>
                  ))}
                </div>
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
              </Section>

              <Section title="Koşullar">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FieldLabel hint="Kapsamdaki ürünlerin toplamı">Minimum Sepet Tutarı (TL)</FieldLabel>
                    <input type="number" min="0" step="0.01" value={form.min_cart_total} onChange={(e) => setForm({ ...form, min_cart_total: e.target.value })} placeholder="Yok" className={inputCls} />
                  </div>
                  <div>
                    <FieldLabel hint="Kumaşa özel: toplam metre şartı">Minimum Toplam Metre</FieldLabel>
                    <input type="number" min="0" step="0.5" value={form.min_total_meters} onChange={(e) => setForm({ ...form, min_total_meters: e.target.value })} placeholder="Yok" className={inputCls} />
                  </div>
                </div>
                <TargetingFields
                  value={form}
                  onChange={(v) => setForm({ ...form, ...v })}
                  categories={categories}
                  products={products}
                />
              </Section>

              <Section title="Müşteri">
                <CustomerFields value={form} onChange={(v) => setForm({ ...form, ...v })} noun="kampanya" />
              </Section>

              <Section title="Zamanlama">
                <DateRangeFields start={form.start_at} end={form.end_at} onChange={(s, e) => setForm({ ...form, start_at: s, end_at: e })} />
              </Section>

              <Section title="Gelişmiş">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FieldLabel hint="Bu kadar siparişte kullanıldıktan sonra durur">Toplam Kullanım Limiti</FieldLabel>
                    <input type="number" min="0" value={form.usage_limit} onChange={(e) => setForm({ ...form, usage_limit: e.target.value })} placeholder="Sınırsız" className={inputCls} />
                  </div>
                  <div>
                    <FieldLabel hint="Eşit indirimde yüksek öncelik kazanır">Öncelik</FieldLabel>
                    <input type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className={inputCls} />
                  </div>
                </div>
                <Toggle checked={form.combinable_with_coupon} onChange={(v) => setForm({ ...form, combinable_with_coupon: v })} label="Kupon kodlarıyla birlikte kullanılabilir" hint="Kapalıysa müşteri kupon girdiğinde en avantajlı olan uygulanır." />
                <Toggle checked={form.show_progress_hint} onChange={(v) => setForm({ ...form, show_progress_hint: v })} label="Sepette teşvik mesajı göster" hint="“Sepetinize 250 TL daha ekleyin, %10 indirim kazanın!”" />
                <Toggle checked={form.is_active} onChange={(v) => setForm({ ...form, is_active: v })} label="Kampanya aktif" hint="Tarih aralığı geldiğinde otomatik yayına girer." />
              </Section>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
                <div className="text-[10px] font-black uppercase text-emerald-700 mb-1">Sepette Görünüm</div>
                <div className="flex justify-between font-semibold text-emerald-800">
                  <span>{previewLabel}</span>
                  <span>-{form.discount_type === 'percent' ? `%${form.discount_value || 0}` : formatCurrency(Number(form.discount_value) || 0)}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white border-t border-slate-200 space-y-2">
              {formError && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {formError}
                </div>
              )}
              <div className="flex gap-2 justify-end">
                <button onClick={() => setIsOpen(false)} className="px-4 py-2.5 text-xs font-bold text-slate-600 rounded-xl hover:bg-slate-100">
                  Vazgeç
                </button>
                <button onClick={save} disabled={saving} className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-xl disabled:opacity-50">
                  {saving ? 'Kaydediliyor...' : form.id ? 'Değişiklikleri Kaydet' : 'Kampanyayı Oluştur'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
