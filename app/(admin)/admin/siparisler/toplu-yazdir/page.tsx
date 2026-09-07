'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Printer, ArrowLeft, Scissors, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '@/lib/services/meterEngine';

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

          // Auto-mark all selected as printed
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
            {orders.length} Adet Sipariş Seçildi (Otomatik Olarak &quot;Yazdırıldı&quot; İşaretlendi)
          </span>
        </div>

        <button
          type="button"
          onClick={handlePrint}
          className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-2"
        >
          <Printer className="w-4 h-4" />
          <span>Tümünü Yazdır (A4 Çıktı)</span>
        </button>
      </div>

      {/* Printable Containers (One A4 Page Per Order) */}
      <div className="space-y-12">
        {orders.map((order, orderIdx) => {
          const orderItems = items.filter((it) => it.order_id === order.id);
          const shippingAddress =
            typeof order.shipping_address === 'string'
              ? JSON.parse(order.shipping_address)
              : order.shipping_address;

          return (
            <div
              key={order.id}
              className="print-container bg-white p-8 sm:p-12 rounded-3xl border border-slate-300 shadow-lg space-y-6 text-slate-900 break-after-page"
              style={{ pageBreakAfter: 'always' }}
            >
              {/* Header Strip with Official Watermark Notice */}
              <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between">
                <div>
                  <div className="font-black text-xl tracking-tight text-slate-900">
                    BURSA KUMAŞ DÜNYASI
                  </div>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">
                    Tescilli Kumaş & Döşeme Mağazası • bursakumasdunyasi.com
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Tel: 0 (542) 393 98 16 • Yıldırım / BURSA
                  </div>
                </div>

                <div className="text-right">
                  <div className="inline-block bg-slate-900 text-white text-[11px] font-black px-3 py-1 rounded tracking-wider uppercase">
                    FATURA DEĞİLDİR / SİPARİŞ ÇIKTISIDIR
                  </div>
                  <div className="text-sm font-black text-blue-900 font-mono mt-1">
                    #{order.order_number}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Tarih: {new Date(order.created_at).toLocaleString('tr-TR')}
                  </div>
                </div>
              </div>

              {/* Customer & Shipping Summary */}
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
                    {orderItems.map((item) => (
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
                          {item.product_sku || order.order_number}
                        </td>
                        <td className="p-2 text-center bg-blue-50/50 font-black text-sm text-blue-950">
                          {item.meter_quantity} Metre
                        </td>
                        <td className="p-2 text-right text-slate-700">
                          {formatCurrency(item.unit_price || item.total_price / (item.meter_quantity || 1))}
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
                    <span>Kargo:</span>
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
                  <div className="text-[10px] text-slate-400">DHL Kargo (MNG Kargo) kuryesine teslim edildi.</div>
                  <div className="h-6" />
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
