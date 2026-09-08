'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
  Printer, ArrowLeft, Truck, Package, CheckCircle2, 
  Clock, Scissors, ShieldCheck, ExternalLink, AlertCircle, 
  Receipt, Building2, User, FileText, Send, Check
} from 'lucide-react';
import { formatCurrency } from '@/lib/services/meterEngine';
import { DHLPrintLabel } from '@/components/admin/DHLPrintLabel';

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');

  // Invoice creation state
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [invoiceMessage, setInvoiceMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data.order);
        setItems(data.items);
        setHistory(data.history);
        setSelectedStatus(data.order.status);
      }
    } catch (e) {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: selectedStatus,
          notes: statusNote,
          adminName: 'Süper Yönetici',
        }),
      });
      if (res.ok) {
        fetchOrder();
        setStatusNote('');
      }
    } catch (err) {
      // Ignore
    } finally {
      setUpdating(false);
    }
  };

  const handlePrintSlip = async () => {
    try {
      await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ print_status: 'Yazdırıldı' }),
      });
      setOrder((prev: any) => ({ ...prev, print_status: 'Yazdırıldı' }));
    } catch (e) {}

    window.print();
  };

  const handleCreateInvoice = async () => {
    setGeneratingInvoice(true);
    setInvoiceMessage(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/invoice`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setInvoiceMessage({
          type: 'success',
          text: data.message || `Fatura (#${data.invoiceNumber}) başarıyla oluşturuldu!`,
        });
        fetchOrder();
      } else {
        setInvoiceMessage({
          type: 'error',
          text: data.message || 'Fatura oluşturulurken bir hata oluştu.',
        });
      }
    } catch (err: any) {
      setInvoiceMessage({
        type: 'error',
        text: 'Sunucuya bağlanırken bir hata meydana geldi.',
      });
    } finally {
      setGeneratingInvoice(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-500">Sipariş yükleniyor...</div>;
  }

  if (!order) {
    return <div className="p-8 text-center text-xs text-red-500">Sipariş bulunamadı.</div>;
  }

  const shippingAddress = typeof order.shipping_address === 'string'
    ? JSON.parse(order.shipping_address)
    : order.shipping_address;

  const billingAddress = typeof order.billing_address === 'string'
    ? JSON.parse(order.billing_address)
    : (order.billing_address || shippingAddress);

  const isCorporate = Boolean(
    billingAddress?.isCorporate ||
    billingAddress?.companyName ||
    billingAddress?.taxOffice ||
    (billingAddress?.taxNumber && billingAddress.taxNumber.length === 10)
  );

  const isInvoiceCreated = order.invoice_status === 'created' || Boolean(order.invoice_number);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* 1. TOP ACTION BAR (Hidden in print) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/admin/siparisler"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Sipariş Listesine Dön</span>
        </Link>

        <div className="flex items-center gap-3">
          {isInvoiceCreated && (
            <a
              href={`/api/admin/orders/${order.id}/invoice-pdf`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              <span>E-Faturayı Görüntüle / PDF</span>
            </a>
          )}

          <button
            type="button"
            onClick={handlePrintSlip}
            className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Sipariş ve Kesim Çıktısı Yazdır (A4)</span>
          </button>
        </div>
      </div>

      {/* 2. ORDER STATUS CHANGER (Hidden in print) */}
      <div className="no-print bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
          Sipariş Durumu Güncelle (Otomatik Kargo & Fatura Tetikleyici)
        </h3>

        <form onSubmit={handleUpdateStatus} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Yeni Durum Seçin
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none"
            >
              <option value="Siparis_Alindi">Sipariş Alındı</option>
              <option value="Hazirlaniyor">Hazırlanıyor / Kesimde</option>
              <option value="Cikti_Alindi">Çıktı Alındı (Fatura Oluştur)</option>
              <option value="Kargoya_Verildi">Kargoya Verildi (DHL Kargo / MNG Kargo Takip No & SMS)</option>
              <option value="Teslim_Edildi">Teslim Edildi</option>
              <option value="Iptal_Edildi">İptal Edildi</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              İşlem Notu (İsteğe Bağlı)
            </label>
            <input
              type="text"
              placeholder="Örn: 10m kadife kesildi..."
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
            />
          </div>

          <button
            type="submit"
            disabled={updating}
            className="w-full py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-bold text-xs rounded-lg transition"
          >
            {updating ? 'Kaydediliyor...' : 'Durumu Güncelle'}
          </button>
        </form>
      </div>

      {/* 3. FATURA & PARK BULUT ENTEGRASYON KARTI (Hidden in print) */}
      <div className="no-print bg-white p-6 rounded-3xl border border-blue-200/80 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-blue-50 text-blue-900 rounded-xl">
              <Receipt className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm text-slate-900">
                  Fatura & Park Bulut E-Dönüşüm Bilgileri
                </h3>
                <span
                  className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                    isCorporate
                      ? 'bg-purple-100 text-purple-800 border border-purple-200'
                      : 'bg-blue-100 text-blue-800 border border-blue-200'
                  }`}
                >
                  {isCorporate ? 'Kurumsal Fatura' : 'Bireysel E-Arşiv'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Müşterinin ödeme adımında beyan ettiği resmi fatura ve vergi bilgileri.
              </p>
            </div>
          </div>

          {/* Action Buttons for Invoicing */}
          <div className="flex items-center gap-2">
            {isInvoiceCreated ? (
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Fatura Kesildi</span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                    No: {order.invoice_number}
                  </div>
                </div>

                <a
                  href={`/api/admin/orders/${order.id}/invoice-pdf`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Görüntüle</span>
                </a>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleCreateInvoice}
                disabled={generatingInvoice}
                className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-400 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-2"
              >
                <Send className={`w-4 h-4 ${generatingInvoice ? 'animate-spin' : ''}`} />
                <span>{generatingInvoice ? 'Fatura Kesiliyor...' : 'Park Bulut ile E-Fatura Kes'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Invoice Message Notification */}
        {invoiceMessage && (
          <div
            className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              invoiceMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {invoiceMessage.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600" />
            )}
            <span>{invoiceMessage.text}</span>
          </div>
        )}

        {/* Billing Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              {isCorporate ? 'Firma Unvanı' : 'Fatura Kişisi'}
            </div>
            <div className="font-bold text-slate-900 mt-1">
              {isCorporate
                ? billingAddress?.companyName || order.customer_name
                : billingAddress?.fullName || order.customer_name}
            </div>
            <div className="text-slate-500 text-[11px] mt-0.5">{order.customer_email}</div>
          </div>

          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              {isCorporate ? 'Vergi Kimlik No (VKN)' : 'T.C. Kimlik No (TCKN)'}
            </div>
            <div className="font-mono font-bold text-blue-900 mt-1">
              {billingAddress?.taxNumber || (isCorporate ? 'Belirtilmedi' : '11111111111 (Bireysel)')}
            </div>
            {isCorporate && (
              <div className="text-slate-600 text-[11px] mt-0.5">
                V.D.: <strong>{billingAddress?.taxOffice || 'Belirtilmedi'}</strong>
              </div>
            )}
          </div>

          <div className="sm:col-span-2">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Fatura Adresi
            </div>
            <div className="text-slate-800 font-medium mt-1 leading-relaxed">
              {billingAddress?.addressLine || shippingAddress?.addressLine}
            </div>
            <div className="text-slate-600 font-bold text-[11px] mt-0.5">
              {billingAddress?.district || shippingAddress?.district} / {billingAddress?.city || shippingAddress?.city}
              {billingAddress?.postalCode ? ` (${billingAddress.postalCode})` : ''}
            </div>
          </div>
        </div>
      </div>

      {/* 4. A4 SIPARIS VE KESIM CIKTISI (PRINTABLE CONTAINER) */}
      {(() => {
        const totalMeters = items.reduce((acc, it) => acc + Number(it.meter_quantity || 0), 0);
        return (
          <div className="print-order-page bg-white p-6 sm:p-8 rounded-3xl border border-slate-300 shadow-md space-y-4 text-slate-900">
            {/* Top Header Grid: Company Info (Left) + Integrated DHL Kargo Label (Right) */}
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4 pb-4 border-b-2 border-slate-900">
              {/* Left Side: Store details & Order Reference */}
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="font-black text-xl tracking-tight text-slate-900">
                    BURSA KUMAŞ DÜNYASI
                  </div>
                  <span className="inline-block bg-slate-900 text-white text-[10px] font-black px-2 py-0.5 rounded tracking-wider uppercase">
                    SİPARİŞ VE KESİM FİŞİ
                  </span>
                </div>

                <div className="text-[11px] text-slate-600 font-medium">
                  Tescilli Kumaş & Döşeme Mağazası • bursakumasdunyasi.com
                </div>
                <div className="text-[11px] text-slate-500">
                  Tel: 0 (542) 393 98 16 • Kazım Karabekir Mah. Yıldırım / BURSA
                </div>

                <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-mono">
                  <div className="bg-slate-100 px-3 py-1 rounded-lg border border-slate-300">
                    <span className="text-slate-500 text-[10px] block font-sans font-bold uppercase">Sipariş No</span>
                    <strong className="text-blue-950 text-sm font-black">#{order.order_number}</strong>
                  </div>

                  <div className="bg-slate-100 px-3 py-1 rounded-lg border border-slate-300">
                    <span className="text-slate-500 text-[10px] block font-sans font-bold uppercase">Sipariş Tarihi</span>
                    <strong className="text-slate-900">{new Date(order.created_at).toLocaleString('tr-TR')}</strong>
                  </div>

                  <div className="bg-emerald-50 text-emerald-900 px-3 py-1 rounded-lg border border-emerald-300">
                    <span className="text-emerald-700 text-[10px] block font-sans font-bold uppercase">Ödeme Durumu</span>
                    <strong className="font-bold">{order.payment_method || 'Kredi Kartı'} (Ödendi)</strong>
                  </div>
                </div>
              </div>

              {/* Right Side: Integrated DHL Kargo Label (Single printout) */}
              <div className="flex-shrink-0 w-full sm:w-auto">
                <DHLPrintLabel
                  order={order}
                  shippingAddress={shippingAddress}
                  totalMeters={totalMeters}
                />
              </div>
            </div>

        {/* Customer & Shipping & Billing Summary */}
        <div className="grid grid-cols-2 gap-6 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div>
            <h4 className="font-black text-slate-800 uppercase tracking-wider mb-1 text-[10px]">
              Müşteri & Alıcı Bilgileri
            </h4>
            <div className="font-bold text-slate-900 text-sm">{order.customer_name}</div>
            <div className="text-slate-600 mt-0.5">Tel: {order.customer_phone}</div>
            <div className="text-slate-600">E-posta: {order.customer_email}</div>
          </div>

          <div>
            <h4 className="font-black text-slate-800 uppercase tracking-wider mb-1 text-[10px]">
              Teslimat & Kargo Adresi
            </h4>
            <div className="text-slate-800 font-medium leading-relaxed">
              {shippingAddress?.addressLine}
            </div>
            <div className="text-slate-800 font-bold">
              {shippingAddress?.district} / {shippingAddress?.city} ({shippingAddress?.postalCode})
            </div>
          </div>

          {/* If Corporate or billing info exists */}
          {isCorporate && (
            <div className="col-span-2 pt-3 border-t border-slate-200">
              <h4 className="font-black text-purple-900 uppercase tracking-wider mb-1 text-[10px]">
                Fatura / Kurumsal Bilgileri (Park Bulut E-Fatura)
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-500">Firma:</span> <strong>{billingAddress?.companyName}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Vergi No / Dairesi:</span>{' '}
                  <strong>{billingAddress?.taxNumber} ({billingAddress?.taxOffice})</strong>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Fabric Cutting Order Note */}
        {order.order_notes && (
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-300 text-xs text-amber-950 font-bold flex items-center gap-2">
            <Scissors className="w-4 h-4 text-amber-700 flex-shrink-0" />
            <span>MÜŞTERİ KESİM TALİMATI: {order.order_notes}</span>
          </div>
        )}

        {/* Items Table for Packaging and Cutting Staff */}
        <div className="space-y-2">
          <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
            Kesilecek Kumaş Listesi
          </h4>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 border-y border-slate-300 text-slate-700 font-bold">
                <th className="p-2 w-16 text-center">Görsel</th>
                <th className="p-2">Kumaş Adı & Varyasyon</th>
                <th className="p-2">Ürün Kodu (SKU)</th>
                <th className="p-2 text-center bg-blue-50/80 text-blue-950 font-black">
                  KESİM METRESİ
                </th>
                <th className="p-2 text-right">Birim Fiyat</th>
                <th className="p-2 text-right">Tutar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="p-2 text-center">
                    <img
                      src={item.product_image}
                      alt={item.product_name}
                      className="w-12 h-12 object-cover rounded border border-slate-300 mx-auto"
                    />
                  </td>
                  <td className="p-2">
                    <div className="font-bold text-slate-900">{item.product_name}</div>
                    {item.variant_title && (
                      <div className="text-[11px] text-slate-600 font-medium">
                        Renk / Desen: <strong>{item.variant_title}</strong>
                      </div>
                    )}
                  </td>
                  <td className="p-2 font-mono font-medium text-slate-600">
                    {item.product_sku}
                  </td>
                  <td className="p-2 text-center bg-blue-50/50 font-black text-sm text-blue-950">
                    {item.meter_quantity} Metre
                  </td>
                  <td className="p-2 text-right text-slate-700">
                    {formatCurrency(item.unit_price)}
                  </td>
                  <td className="p-2 text-right font-bold text-slate-900">
                    {formatCurrency(item.total_price)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Summary */}
        <div className="flex justify-end pt-2">
          <div className="w-64 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Ara Toplam:</span>
              <span className="font-semibold">{formatCurrency(order.subtotal)}</span>
            </div>
            {order.discount_total > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>İndirim:</span>
                <span>-{formatCurrency(order.discount_total)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Kargo (DHL / MNG):</span>
              <span>{order.shipping_total === 0 ? 'ÜCRETSİZ' : formatCurrency(order.shipping_total)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>KDV (%10 Dahil):</span>
              <span>{formatCurrency(order.tax_total)}</span>
            </div>
            <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t-2 border-slate-900">
              <span>Sipariş Toplamı:</span>
              <span className="text-blue-900">{formatCurrency(order.grand_total)}</span>
            </div>
          </div>
        </div>

          {/* Quality Control & Staff Signatures */}
          <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-300 text-xs text-center">
            <div className="border border-dashed border-slate-300 p-4 rounded-xl space-y-4">
              <div className="font-bold text-slate-700">Kesim Masası Kontrol & İmza</div>
              <div className="text-[10px] text-slate-400">Metraj lazerle kontrol edilmiştir.</div>
              <div className="h-6" />
            </div>

            <div className="border border-dashed border-slate-300 p-4 rounded-xl space-y-4">
              <div className="font-bold text-slate-700">Paketleme & Sevkiyat Kontrol</div>
              <div className="text-[10px] text-slate-400">DHL Kargo kuryesine teslim edildi.</div>
              <div className="h-6" />
            </div>
          </div>
        </div>
      );
    })()}
  </div>
);
}
