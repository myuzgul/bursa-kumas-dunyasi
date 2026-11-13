'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Scissors, Plus, Edit3, Trash2, Power, AlertCircle, CheckCircle2, X, Clock, Settings2,
  Upload, Search, Info, Eye, ShoppingBag, RefreshCw,
} from 'lucide-react';
import { formatCurrency } from '@/lib/services/meterEngine';
import {
  useAdminCatalog, FieldLabel, inputCls, Toggle, DateRangeFields, Section,
  isoToLocalInput, localInputToIso, formatDateTime,
} from '@/components/admin/promo/shared';

interface OfferForm {
  id?: string;
  title: string;
  description: string;
  note: string;
  product_id: string;
  image_url: string;
  meter_length: string;
  offer_price: string;
  original_price: string;
  sku: string;
  quantity: string;
  sold_count: string;
  min_cart_total: string;
  sort_order: string;
  start_at: string;
  end_at: string;
  is_active: boolean;
}

const emptyForm = (): OfferForm => ({
  title: '',
  description: '',
  note: '',
  product_id: '',
  image_url: '',
  meter_length: '',
  offer_price: '',
  original_price: '',
  sku: '',
  quantity: '1',
  sold_count: '0',
  min_cart_total: '',
  sort_order: '0',
  start_at: '',
  end_at: '',
  is_active: true,
});

const RES_STATUS: Record<string, { label: string; cls: string }> = {
  active: { label: 'Gösteriliyor', cls: 'bg-blue-50 text-blue-700' },
  accepted: { label: 'Siparişe eklendi', cls: 'bg-emerald-50 text-emerald-700' },
  converted: { label: 'Satıldı', cls: 'bg-emerald-600 text-white' },
  declined: { label: 'İstemedi', cls: 'bg-slate-100 text-slate-600' },
  expired: { label: 'Süre doldu', cls: 'bg-amber-50 text-amber-700' },
  released: { label: 'Serbest bırakıldı', cls: 'bg-slate-100 text-slate-500' },
};

export default function AdminOutletPage() {
  const { products } = useAdminCatalog();
  const [offers, setOffers] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<OfferForm>(emptyForm());
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [productQuery, setProductQuery] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsForm, setSettingsForm] = useState<any>(null);

  const notify = (ok: boolean, text: string) => {
    setToast({ ok, text });
    setTimeout(() => setToast(null), 3500);
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/outlet', { cache: 'no-store' });
      if (res.status === 401) {
        setAuthError(true);
        return;
      }
      const data = await res.json();
      setOffers(data.offers || []);
      setReservations(data.reservations || []);
      setSettings(data.settings || null);
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
    const onSale = offers.filter((o) => o.is_active && o.in_window && o.sold_count < o.quantity).length;
    const sold = offers.reduce((a, o) => a + (o.sold_count || 0), 0);
    const revenue = offers.reduce((a, o) => a + (o.sold_count || 0) * (o.offer_price || 0), 0);
    const live = offers.reduce((a, o) => a + (o.live_holds || 0), 0);
    return { onSale, sold, revenue, live };
  }, [offers]);

  const filteredProducts = useMemo(() => {
    const q = productQuery.trim().toLocaleLowerCase('tr-TR');
    if (!q) return [];
    return products
      .filter((p) => p.name.toLocaleLowerCase('tr-TR').includes(q) || p.sku.toLowerCase().includes(q))
      .slice(0, 8);
  }, [products, productQuery]);

  const linkedProduct = products.find((p) => p.id === form.product_id) || null;
  const computedOriginal =
    linkedProduct && Number(form.meter_length) > 0 ? Math.round(linkedProduct.price * Number(form.meter_length) * 100) / 100 : 0;

  const openNew = () => {
    setForm(emptyForm());
    setFormError(null);
    setProductQuery('');
    setIsOpen(true);
  };

  const openEdit = (o: any) => {
    setForm({
      id: o.id,
      title: o.title || '',
      description: o.description || '',
      note: o.note || '',
      product_id: o.product_id || '',
      image_url: o.image_url || '',
      meter_length: String(o.meter_length ?? ''),
      offer_price: String(o.offer_price ?? ''),
      original_price: o.original_price ? String(o.original_price) : '',
      sku: o.sku || '',
      quantity: String(o.quantity ?? 1),
      sold_count: String(o.sold_count ?? 0),
      min_cart_total: o.min_cart_total ? String(o.min_cart_total) : '',
      sort_order: String(o.sort_order || 0),
      start_at: isoToLocalInput(o.start_at),
      end_at: isoToLocalInput(o.end_at),
      is_active: !!o.is_active,
    });
    setFormError(null);
    setProductQuery('');
    setIsOpen(true);
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok && data.url) setForm((f) => ({ ...f, image_url: data.url }));
      else setFormError(data.message || 'Görsel yüklenemedi.');
    } catch {
      setFormError('Görsel yüklenemedi.');
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        ...form,
        start_at: localInputToIso(form.start_at),
        end_at: localInputToIso(form.end_at),
      };
      const res = await fetch('/api/admin/outlet', {
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
      notify(true, form.id ? 'Outlet ürün güncellendi.' : 'Outlet ürün eklendi.');
      load();
    } catch {
      setFormError('Bağlantı hatası.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (o: any) => {
    const res = await fetch('/api/admin/outlet', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: o.id, is_active: o.is_active ? 0 : 1 }),
    });
    if (res.ok) load();
  };

  const remove = async (o: any) => {
    if (!confirm(`"${o.title}" outlet ürünü silinsin mi?`)) return;
    const res = await fetch(`/api/admin/outlet?id=${encodeURIComponent(o.id)}`, { method: 'DELETE' });
    if (res.ok) {
      notify(true, 'Outlet ürün silindi.');
      load();
    }
  };

  const saveSettings = async () => {
    const res = await fetch('/api/admin/outlet', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: settingsForm }),
    });
    const data = await res.json();
    if (res.ok) {
      setSettings(data.settings);
      setSettingsOpen(false);
      notify(true, 'Outlet ayarları kaydedildi.');
    } else notify(false, data.message || 'Ayarlar kaydedilemedi.');
  };

  const offerState = (o: any) => {
    if (o.sold_count >= o.quantity) return { label: 'Tükendi', cls: 'bg-slate-800 text-white' };
    if (!o.is_active) return { label: 'Pasif', cls: 'bg-red-50 text-red-600 border border-red-200' };
    if (!o.in_window) return { label: 'Tarih dışı', cls: 'bg-blue-50 text-blue-700 border border-blue-200' };
    if (o.available <= 0 && o.live_holds > 0) return { label: 'Şu an bir müşteride', cls: 'bg-amber-50 text-amber-700 border border-amber-200' };
    return { label: 'Satışta', cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' };
  };

  if (authError) {
    return (
      <div className="max-w-lg mx-auto mt-16 p-6 bg-white rounded-2xl border border-red-200 text-center space-y-2">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
        <h2 className="font-bold text-slate-900">Oturum gerekli</h2>
        <p className="text-xs text-slate-600">Bu sayfayı görüntülemek için yönetici olarak giriş yapınız.</p>
        <a href="/auth/giris" className="inline-block mt-2 px-4 py-2 bg-blue-900 text-white text-xs font-bold rounded-lg">Giriş Yap</a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Scissors className="w-6 h-6 text-amber-600" />
            Outlet Fırsatları (Ödeme Sayfası)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Parça / top sonu kumaşlar ödeme adımında müşteriye süreli “size özel” teklif olarak gösterilir.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl">
            <RefreshCw className="w-4 h-4" /> Yenile
          </button>
          <button
            onClick={() => {
              setSettingsForm({ ...settings });
              setSettingsOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl"
          >
            <Settings2 className="w-4 h-4" /> Ayarlar
          </button>
          <button onClick={openNew} className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow">
            <Plus className="w-4 h-4" /> Outlet Ürün Ekle
          </button>
        </div>
      </div>

      {toast && (
        <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 border ${toast.ok ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
          {toast.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.text}
        </div>
      )}

      {settings && !settings.is_active && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> Outlet teklifleri şu an kapalı. Ayarlar’dan açabilirsiniz.
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Satıştaki Parça', value: String(stats.onSale) },
          { label: 'Şu An Rezerve', value: String(stats.live) },
          { label: 'Satılan Parça', value: String(stats.sold) },
          { label: 'Outlet Cirosu', value: formatCurrency(stats.revenue) },
        ].map((s) => (
          <div key={s.label} className="bg-white p-4 rounded-2xl border border-slate-200">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</div>
            <div className="text-xl font-black text-slate-900 mt-1">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900 flex items-start gap-2">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span>
          Müşteri ödeme sayfasına geldiğinde sıradaki uygun parça ona <strong>{settings?.hold_minutes || 5} dakika</strong> ayrılır;
          bu sürede başka müşteriye gösterilmez (varsa sıradaki parça gösterilir). Müşteri “Siparişime Ekle” derse parça
          ödemeyi tamamlaması için {settings?.accepted_hold_minutes || 20} dakika daha tutulur. Satılan parça bir daha
          gösterilmez; sipariş iptal edilirse tekrar satışa açılır. Outlet parçaları ürün metre stoğundan düşülmez ve kupon /
          sepet indirimlerine dahil edilmez.
        </span>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="p-3">Parça</th>
                <th className="p-3">Metre</th>
                <th className="p-3">Fiyat</th>
                <th className="p-3 text-center">Adet / Satılan</th>
                <th className="p-3 text-center">Gösterim / Kabul</th>
                <th className="p-3 text-center">Durum</th>
                <th className="p-3 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center text-slate-500">Yükleniyor...</td></tr>
              ) : offers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center">
                    <div className="text-slate-500 font-semibold">Henüz outlet ürün eklenmedi.</div>
                    <button onClick={openNew} className="mt-2 text-blue-900 font-bold text-xs hover:underline">+ İlk outlet parçayı ekleyin</button>
                  </td>
                </tr>
              ) : (
                offers.map((o) => {
                  const st = offerState(o);
                  return (
                    <tr key={o.id} className="hover:bg-slate-50/70 align-top">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          {o.display_image ? (
                            <img
                              src={o.display_image}
                              alt={o.title}
                              className="w-12 h-14 object-cover rounded-lg border border-slate-200"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.visibility = 'hidden';
                              }}
                            />
                          ) : (
                            <div className="w-12 h-14 rounded-lg border border-slate-200 bg-amber-50 flex items-center justify-center">
                              <Scissors className="w-5 h-5 text-amber-400" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900">{o.title}</div>
                            {o.product_name && <div className="text-[10px] text-slate-500">Bağlı ürün: {o.product_name}</div>}
                            {o.note && <div className="text-[10px] text-slate-500 italic">{o.note}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="p-3 font-bold text-slate-900 whitespace-nowrap">{o.meter_length} m</td>
                      <td className="p-3 whitespace-nowrap">
                        <div className="font-black text-emerald-700">{formatCurrency(o.offer_price)}</div>
                        {o.display_original_price && <div className="text-[10px] text-slate-400 line-through">{formatCurrency(o.display_original_price)}</div>}
                      </td>
                      <td className="p-3 text-center">
                        <div className="font-bold text-slate-900">{o.sold_count} / {o.quantity}</div>
                        {o.live_holds > 0 && (
                          <div className="text-[10px] text-amber-700 font-semibold inline-flex items-center gap-0.5"><Clock className="w-3 h-3" />{o.live_holds} rezerve</div>
                        )}
                      </td>
                      <td className="p-3 text-center text-slate-600">
                        <span className="inline-flex items-center gap-1"><Eye className="w-3 h-3" />{o.views}</span>
                        <span className="mx-1 text-slate-300">/</span>
                        <span className="inline-flex items-center gap-1"><ShoppingBag className="w-3 h-3" />{o.accepted_total}</span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${st.cls}`}>{st.label}</span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => toggleActive(o)} title={o.is_active ? 'Durdur' : 'Satışa aç'} className={`p-1.5 rounded-lg ${o.is_active ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-100'}`}><Power className="w-4 h-4" /></button>
                          <button onClick={() => openEdit(o)} title="Düzenle" className="p-1.5 rounded-lg text-blue-900 hover:bg-blue-50"><Edit3 className="w-4 h-4" /></button>
                          <button onClick={() => remove(o)} title="Sil" className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Son hareketler */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2">
        <div className="text-[11px] font-black uppercase tracking-wider text-slate-500">Son Teklif Hareketleri</div>
        {reservations.length === 0 ? (
          <div className="text-xs text-slate-400 py-4 text-center">Henüz hareket yok.</div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
            {reservations.map((r) => {
              const st = RES_STATUS[r.status] || RES_STATUS.released;
              return (
                <div key={r.id} className="py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="min-w-0">
                    <span className="font-semibold text-slate-800">{r.offer_title}</span>
                    {r.order_number && (
                      <a href={`/admin/siparisler/${r.order_id}`} className="ml-2 text-blue-900 font-bold hover:underline">#{r.order_number}</a>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500">{formatDateTime(r.created_at)}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${st.cls}`}>{st.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Ayarlar */}
      {settingsOpen && settingsForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setSettingsOpen(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-sm text-slate-900">Outlet Teklif Ayarları</h3>
              <button onClick={() => setSettingsOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-5 h-5" /></button>
            </div>
            <Toggle checked={!!settingsForm.is_active} onChange={(v) => setSettingsForm({ ...settingsForm, is_active: v ? 1 : 0 })} label="Ödeme sayfasında outlet teklifi göster" />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel hint="Müşterinin karar süresi">Karar Süresi (dk)</FieldLabel>
                <input type="number" min="1" max="60" value={settingsForm.hold_minutes} onChange={(e) => setSettingsForm({ ...settingsForm, hold_minutes: e.target.value })} className={inputCls} />
              </div>
              <div>
                <FieldLabel hint="Ekledikten sonra ödeme için">Ödeme Süresi (dk)</FieldLabel>
                <input type="number" min="5" max="120" value={settingsForm.accepted_hold_minutes} onChange={(e) => setSettingsForm({ ...settingsForm, accepted_hold_minutes: e.target.value })} className={inputCls} />
              </div>
            </div>
            <div>
              <FieldLabel hint="Bu tutarın altındaki sepetlerde teklif gösterilmez">Minimum Sepet Tutarı (TL)</FieldLabel>
              <input type="number" min="0" value={settingsForm.min_cart_total} onChange={(e) => setSettingsForm({ ...settingsForm, min_cart_total: e.target.value })} className={inputCls} />
            </div>
            <div>
              <FieldLabel>Başlık</FieldLabel>
              <input value={settingsForm.headline} onChange={(e) => setSettingsForm({ ...settingsForm, headline: e.target.value })} className={inputCls} />
            </div>
            <div>
              <FieldLabel>Alt Metin</FieldLabel>
              <input value={settingsForm.subtext} onChange={(e) => setSettingsForm({ ...settingsForm, subtext: e.target.value })} className={inputCls} />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setSettingsOpen(false)} className="px-4 py-2.5 text-xs font-bold text-slate-600 rounded-xl hover:bg-slate-100">Vazgeç</button>
              <button onClick={saveSettings} className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-xl">Kaydet</button>
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
              <h2 className="font-black text-slate-900 text-sm">{form.id ? 'Outlet Ürünü Düzenle' : 'Yeni Outlet Ürün'}</h2>
              <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <Section title="Bağlı Ürün (İsteğe Bağlı)">
                <p className="text-[11px] text-slate-500">
                  Parçayı katalogdaki bir kumaşa bağlarsanız görsel ve normal metre fiyatı otomatik kullanılır. Ürün stoğu etkilenmez.
                </p>
                {linkedProduct ? (
                  <div className="flex items-center justify-between gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="flex items-center gap-2 min-w-0">
                      {linkedProduct.image && <img src={linkedProduct.image} alt="" className="w-9 h-9 rounded object-cover" />}
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">{linkedProduct.name}</div>
                        <div className="text-[10px] text-slate-500">{linkedProduct.sku} • {formatCurrency(linkedProduct.price)}/m</div>
                      </div>
                    </div>
                    <button type="button" onClick={() => setForm({ ...form, product_id: '' })} className="text-[11px] font-bold text-red-600 hover:underline">Kaldır</button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    <input value={productQuery} onChange={(e) => setProductQuery(e.target.value)} placeholder="Ürün adı veya stok kodu ile ara..." className={`${inputCls} pl-8`} />
                    {filteredProducts.length > 0 && (
                      <div className="mt-1 border border-slate-200 rounded-xl bg-white divide-y divide-slate-100 max-h-60 overflow-y-auto">
                        {filteredProducts.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setForm({ ...form, product_id: p.id, title: form.title || p.name, sku: form.sku || p.sku });
                              setProductQuery('');
                            }}
                            className="w-full flex items-center gap-2 p-2 text-left hover:bg-slate-50"
                          >
                            {p.image && <img src={p.image} alt="" className="w-8 h-8 rounded object-cover" />}
                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-slate-900 truncate">{p.name}</div>
                              <div className="text-[10px] text-slate-500">{p.sku} • {formatCurrency(p.price)}/m</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Section>

              <Section title="Parça Bilgisi">
                <div>
                  <FieldLabel>Müşteriye Görünen Ad *</FieldLabel>
                  <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Örn: Doğal Keten Kumaş – Bej" className={inputCls} />
                </div>
                <div>
                  <FieldLabel>Kısa Açıklama</FieldLabel>
                  <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Örn: Masa örtüsü ve minder için ideal top sonu parça" className={inputCls} />
                </div>
                <div>
                  <FieldLabel hint="Fişte de görünür (renk, kusur bilgisi vb.)">Not</FieldLabel>
                  <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Örn: Renk: Bej • En: 150 cm" className={inputCls} />
                </div>
                <div>
                  <FieldLabel hint="Boşsa bağlı ürünün görseli kullanılır">Görsel</FieldLabel>
                  <div className="flex items-center gap-3">
                    {(form.image_url || linkedProduct?.image) ? (
                      <img src={form.image_url || linkedProduct?.image} alt="" className="w-14 h-16 rounded-lg object-cover border border-slate-200" onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }} />
                    ) : (
                      <div className="w-14 h-16 rounded-lg border border-dashed border-slate-300 flex items-center justify-center text-slate-300"><Scissors className="w-5 h-5" /></div>
                    )}
                    <div className="flex-1 space-y-1.5">
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 cursor-pointer">
                        <Upload className="w-3.5 h-3.5" />
                        {uploading ? 'Yükleniyor...' : 'Fotoğraf Yükle'}
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])} />
                      </label>
                      <input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="veya görsel adresi (/uploads/...)" className={inputCls} />
                    </div>
                  </div>
                </div>
                <div>
                  <FieldLabel>Stok / Raf Kodu</FieldLabel>
                  <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="Örn: OUT-KTN-032" className={inputCls} />
                </div>
              </Section>

              <Section title="Metre & Fiyat">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <FieldLabel>Metre *</FieldLabel>
                    <input type="number" min="0.1" step="0.1" value={form.meter_length} onChange={(e) => setForm({ ...form, meter_length: e.target.value })} placeholder="3.2" className={inputCls} />
                  </div>
                  <div>
                    <FieldLabel>Outlet Fiyatı (TL) *</FieldLabel>
                    <input type="number" min="0" step="0.01" value={form.offer_price} onChange={(e) => setForm({ ...form, offer_price: e.target.value })} placeholder="200" className={inputCls} />
                  </div>
                  <div>
                    <FieldLabel hint={computedOriginal ? `Boşsa: ${formatCurrency(computedOriginal)}` : 'Üzeri çizili gösterilir'}>Normal Fiyat</FieldLabel>
                    <input type="number" min="0" step="0.01" value={form.original_price} onChange={(e) => setForm({ ...form, original_price: e.target.value })} placeholder={computedOriginal ? String(computedOriginal) : 'İsteğe bağlı'} className={inputCls} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <FieldLabel hint="Aynı ölçüde kaç parça var">Adet</FieldLabel>
                    <input type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className={inputCls} />
                  </div>
                  {form.id && (
                    <div>
                      <FieldLabel hint="Elle düzeltme">Satılan</FieldLabel>
                      <input type="number" min="0" value={form.sold_count} onChange={(e) => setForm({ ...form, sold_count: e.target.value })} className={inputCls} />
                    </div>
                  )}
                  <div>
                    <FieldLabel hint="Küçük önce gösterilir">Sıra</FieldLabel>
                    <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} className={inputCls} />
                  </div>
                </div>
                <div>
                  <FieldLabel hint="Bu tutarın altındaki sepetlerde bu parça gösterilmez">Minimum Sepet Tutarı (TL)</FieldLabel>
                  <input type="number" min="0" value={form.min_cart_total} onChange={(e) => setForm({ ...form, min_cart_total: e.target.value })} placeholder="Yok" className={inputCls} />
                </div>
              </Section>

              <Section title="Zamanlama">
                <DateRangeFields start={form.start_at} end={form.end_at} onChange={(s, e) => setForm({ ...form, start_at: s, end_at: e })} />
                <Toggle checked={form.is_active} onChange={(v) => setForm({ ...form, is_active: v })} label="Satışta" />
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
                <button onClick={save} disabled={saving || uploading} className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-xl disabled:opacity-50">
                  {saving ? 'Kaydediliyor...' : form.id ? 'Değişiklikleri Kaydet' : 'Outlet Ürünü Ekle'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
