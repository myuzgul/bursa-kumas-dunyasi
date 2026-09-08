'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Printer, ArrowLeft, Scissors, CheckCircle2, Truck } from 'lucide-react';
import { formatCurrency } from '@/lib/services/meterEngine';
import { DHLPrintLabel } from '@/components/admin/DHLPrintLabel';

function BulkPrintContent() {
  const searchParams = useSearchParams();
  const idsParam = searchParams.get('ids') || '';
  const orderIds = idsParam ? idsParam.split(',').filter(Boolean) : [];

  const [orders, setOrders] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderIds.length === 0) {
      setLoading(false);
      return;
    }

    const loadOrders = async () => {
      try {
        const res = await fetch('/api/admin/orders-list');
        if (res.ok) {
          const data = await res.json();
          const filtered = (data.orders || []).filter((o: any) =>
            orderIds.includes(o.id) || orderIds.includes(o.order_number)
          );
          setOrders(filtered);
          setItems(data.items || []);

          // Auto-mark all selected as printed & in cutting phase
          await fetch('/api/admin/orders/bulk-print', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderIds }),
          });
        }
      } catch (e) {
        // Ignore
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [idsParam]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-500">Toplu siparişler yükleniyor...</div>;
  }

  if (orders.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-slate-500 space-y-3">
        <p>Yazdırılacak sipariş seçilmedi.</p>
        <Link href="/admin/siparisler" className="text-blue-900 font-bold underline">
          Sipariş Listesine Dön
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Action Bar (Hidden in Print) */}
      <div className="no-print bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Link
            href="/admin/siparisler"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-900 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Sipariş Listesine Dön</span>
          </Link>
          <span className="text-slate-300">|</span>
          <span className="text-xs font-bold text-slate-900">
            {orders.length} Adet Sipariş Seçildi (Otomatik Olarak &quot;Yazdırıldı / Kesimde&quot; İşaretlendi)
          </span>
        </div>

        <button
          type="button"
          onClick={handlePrint}
          className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-2"
        >
          <Printer className="w-4 h-4" />
          <span>Tümünü Yazdır (A4 Çıktı + DHL Etiketi)</span>
        </button>
      </div>

      {/* Printable Containers (One A4 Page Per Order, Zero Margin Spillover) */}
      <div className="space-y-8">
        {orders.map((order) => {
          const orderItems = items.filter((it) => it.order_id === order.id);
          const shippingAddress =
            typeof order.shipping_address === 'string'
              ? JSON.parse(order.shipping_address)
              : order.shipping_address;

          const totalMeters = orderItems.reduce(
            (acc, it) => acc + Number(it.meter_quantity || 0),
            0
          );

          return (
            <div
              key={order.id}
              className="print-order-page bg-white p-6 sm:p-8 rounded-3xl border border-slate-300 shadow-md space-y-4 text-slate-900"
            >
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

              {/* Customer & Shipping Summary (Clean 2-Column Info) */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <h4 className="font-black text-slate-800 uppercase tracking-wider mb-0.5 text-[10px]">
                    Müşteri Bilgileri
                  </h4>
                  <div className="font-bold text-slate-900 text-sm">{order.customer_name}</div>
                  <div className="text-slate-600">Tel: {order.customer_phone}</div>
                  <div className="text-slate-600 text-[11px] truncate">E-posta: {order.customer_email}</div>
                </div>

                <div>
                  <h4 className="font-black text-slate-800 uppercase tracking-wider mb-0.5 text-[10px]">
                    Teslimat & Sevkiyat Adresi
                  </h4>
                  <div className="text-slate-800 font-medium leading-relaxed line-clamp-2">
                    {shippingAddress?.addressLine}
                  </div>
                  <div className="text-slate-900 font-bold">
                    {shippingAddress?.district} / {shippingAddress?.city} {shippingAddress?.postalCode ? `(${shippingAddress.postalCode})` : ''}
                  </div>
                </div>
              </div>

              {/* Fabric Cutting Order Note */}
              {order.order_notes && (
                <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-300 text-xs text-amber-950 font-bold flex items-center gap-2">
                  <Scissors className="w-4 h-4 text-amber-700 flex-shrink-0" />
                  <span>MÜŞTERİ KESİM TALİMATI: {order.order_notes}</span>
                </div>
              )}

              {/* Items Table for Packaging and Cutting Staff */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                    Kesilecek Kumaş Listesi ({orderItems.length} Kalem - Toplam {totalMeters} m)
                  </h4>
                  <span className="text-[10px] text-slate-500 font-medium">Lazer metre hassasiyetinde kesiniz</span>
                </div>

                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-y border-slate-300 text-slate-700 font-bold">
                      <th className="p-2 w-14 text-center">Görsel</th>
                      <th className="p-2">Kumaş Adı & Varyasyon</th>
                      <th className="p-2 w-32">Ürün Kodu (SKU)</th>
                      <th className="p-2 text-center bg-blue-50/80 text-blue-950 font-black w-32">
                        KESİM METRESİ
                      </th>
                      <th className="p-2 text-right w-24">Birim Fiyat</th>
                      <th className="p-2 text-right w-24">Tutar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {orderItems.map((item) => (
                      <tr key={item.id}>
                        <td className="p-1.5 text-center">
                          <img
                            src={item.product_image}
                            alt={item.product_name}
                            className="w-10 h-10 object-cover rounded border border-slate-300 mx-auto"
                          />
                        </td>
                        <td className="p-1.5">
                          <div className="font-bold text-slate-900">{item.product_name}</div>
                          {item.variant_title && (
                            <div className="text-[11px] text-slate-600 font-medium">
                              Renk / Desen: <strong>{item.variant_title}</strong>
                            </div>
                          )}
                        </td>
                        <td className="p-1.5 font-mono font-medium text-slate-600 text-[11px]">
                          {item.product_sku || order.order_number}
                        </td>
                        <td className="p-1.5 text-center bg-blue-50/50 font-black text-sm text-blue-950">
                          {item.meter_quantity} Metre
                        </td>
                        <td className="p-1.5 text-right text-slate-700 text-[11px]">
                          {formatCurrency(item.unit_price || item.total_price / (item.meter_quantity || 1))}
                        </td>
                        <td className="p-1.5 text-right font-bold text-slate-900">
                          {formatCurrency(item.total_price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Summary */}
              <div className="flex justify-end pt-1">
                <div className="w-56 space-y-1 text-xs">
                  <div className="flex justify-between text-slate-600 text-[11px]">
                    <span>Ara Toplam:</span>
                    <span className="font-semibold">{formatCurrency(order.subtotal)}</span>
                  </div>
                  {order.discount_total > 0 && (
                    <div className="flex justify-between text-emerald-700 text-[11px]">
                      <span>İndirim:</span>
                      <span>-{formatCurrency(order.discount_total)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600 text-[11px]">
                    <span>Kargo (DHL):</span>
                    <span>{order.shipping_total === 0 ? 'ÜCRETSİZ' : formatCurrency(order.shipping_total)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 text-[11px]">
                    <span>KDV (%10 Dahil):</span>
                    <span>{formatCurrency(order.tax_total)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-black text-slate-900 pt-1 border-t border-slate-900">
                    <span>Sipariş Toplamı:</span>
                    <span className="text-blue-900">{formatCurrency(order.grand_total)}</span>
                  </div>
                </div>
              </div>

              {/* Quality Control & Staff Signatures */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-300 text-xs text-center">
                <div className="border border-dashed border-slate-300 p-2.5 rounded-xl space-y-2">
                  <div className="font-bold text-slate-700 text-[11px]">Kesim Masası Kontrol & İmza</div>
                  <div className="text-[10px] text-slate-400">Metraj lazerle kontrol edilerek kesildi.</div>
                  <div className="h-4" />
                </div>

                <div className="border border-dashed border-slate-300 p-2.5 rounded-xl space-y-2">
                  <div className="font-bold text-slate-700 text-[11px]">Paketleme & DHL Kargo Teslim</div>
                  <div className="text-[10px] text-slate-400">DHL Kargo kuryesine sağlam teslim edildi.</div>
                  <div className="h-4" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function BulkPrintOrdersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Yükleniyor...</div>}>
      <BulkPrintContent />
    </Suspense>
  );
}
