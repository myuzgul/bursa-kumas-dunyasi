'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Search, Truck, Package, CheckCircle2, Clock, 
  ExternalLink, ArrowRight, ShieldCheck, MapPin 
} from 'lucide-react';
import { formatCurrency } from '@/lib/services/meterEngine';
import { getYurticiTrackingTimeline } from '@/lib/services/shipping';

function OrderTrackingContent() {
  const searchParams = useSearchParams();
  const initialOrder = searchParams.get('order') || '';

  const [orderQuery, setOrderQuery] = useState(initialOrder);
  const [orderData, setOrderData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderQuery.trim()) return;

    setIsLoading(true);
    setErrorMsg('');
    setOrderData(null);

    try {
      const res = await fetch(`/api/orders/track?order=${encodeURIComponent(orderQuery.trim())}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Sipariş bulunamadı.');
      }
      setOrderData(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Sipariş sorgulanırken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-search on mount if query provided
  React.useEffect(() => {
    if (initialOrder) {
      handleSearch({ preventDefault: () => {} } as any);
    }
  }, [initialOrder]);

  const timeline = orderData ? getYurticiTrackingTimeline(orderData.order.status) : [];

  return (
    <div className="space-y-8">
      {/* Query Form */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm max-w-xl mx-auto">
        <form onSubmit={handleSearch} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Sipariş Numarası *
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="Örn: BKD-2026-000101"
                value={orderQuery}
                onChange={(e) => setOrderQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-900 uppercase"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-blue-900 hover:bg-blue-800 disabled:bg-slate-400 text-white font-bold text-xs sm:text-sm rounded-xl transition flex items-center justify-center gap-2 shadow"
          >
            <Search className="w-4 h-4" />
            <span>{isLoading ? 'Sorgulanıyor...' : 'Siparişi Sorgula'}</span>
          </button>
        </form>

        {errorMsg && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
            {errorMsg}
          </div>
        )}
      </div>

      {/* Order Results Card */}
      {orderData && (
        <div className="space-y-6 animate-fadeIn">
          {/* Status Timeline */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
              <div>
                <span className="text-[11px] font-bold text-blue-900 bg-blue-50 px-2.5 py-1 rounded-full uppercase">
                  Sipariş No: {orderData.order.order_number}
                </span>
                <div className="text-xs text-slate-500 mt-1">
                  Sipariş Tarihi: {new Date(orderData.order.created_at).toLocaleDateString('tr-TR')}
                </div>
              </div>

              {orderData.order.tracking_number && (
                <a
                  href={orderData.order.tracking_url || 'https://www.mngkargo.com.tr/gonderitakip'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold rounded-lg transition"
                >
                  <Truck className="w-4 h-4 text-amber-600" />
                  <span>DHL Kargo (MNG Kargo) Takip: {orderData.order.tracking_number}</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-1" />
                </a>
              )}
            </div>

            {/* Timeline steps */}
            <div className="relative grid grid-cols-1 md:grid-cols-5 gap-4 pt-2">
              {timeline.map((step, idx) => (
                <div
                  key={step.key}
                  className={`flex md:flex-col items-center gap-3 md:text-center p-3 rounded-xl border transition ${
                    step.isCompleted
                      ? 'bg-blue-50/60 border-blue-200 text-blue-950'
                      : 'bg-slate-50/50 border-slate-200 text-slate-400 opacity-60'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-xs flex-shrink-0 ${
                      step.isCompleted
                        ? 'bg-blue-900 text-white'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {step.isCompleted ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                  </div>
                  <div>
                    <div className="text-xs font-bold">{step.label}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                      {step.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ordered Products & Delivery Address */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Products */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-slate-900 pb-2 border-b border-slate-100">
                Kesilen Kumaşlar ({orderData.items.length})
              </h3>
              <div className="divide-y divide-slate-100 space-y-2">
                {orderData.items.map((item: any) => (
                  <div key={item.id} className="pt-2 flex items-center gap-3">
                    <img
                      src={item.product_image}
                      alt={item.product_name}
                      className="w-14 h-14 rounded-lg object-cover border flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {item.product_name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {item.variant_title && `${item.variant_title} • `}
                        <strong>{item.meter_quantity} Metre</strong>
                      </div>
                      <div className="text-xs font-bold text-blue-950">
                        {formatCurrency(item.total_price)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-between text-xs font-extrabold text-slate-900">
                <span>Toplam Tutar:</span>
                <span className="text-blue-900">{formatCurrency(orderData.order.grand_total)}</span>
              </div>
            </div>

            {/* Address Details */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-900" />
                <span>Teslimat Bilgileri</span>
              </h3>

              <div className="space-y-2 text-xs text-slate-700 leading-relaxed">
                <div>
                  <span className="text-slate-400">Alıcı:</span>{' '}
                  <strong>{orderData.order.customer_name}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Telefon:</span>{' '}
                  <strong>{orderData.order.customer_phone}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Adres:</span>{' '}
                  <span>
                    {typeof orderData.order.shipping_address === 'string'
                      ? orderData.order.shipping_address
                      : `${orderData.order.shipping_address?.addressLine}, ${orderData.order.shipping_address?.district} / ${orderData.order.shipping_address?.city}`}
                  </span>
                </div>
                {orderData.order.order_notes && (
                  <div className="p-2.5 bg-amber-50 rounded-xl text-amber-900 border border-amber-200 text-[11px]">
                    <strong>Kesim Notu:</strong> {orderData.order.order_notes}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrderTrackingPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
          Sipariş & Kargo Takibi
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
          Üye olmadan da sipariş numaranız ile kumaşınızın kesim, paketleme ve kargo durumunu anlık takip edebilirsiniz.
        </p>
      </div>

      <Suspense fallback={<div className="text-center p-8 text-xs text-slate-500">Yükleniyor...</div>}>
        <OrderTrackingContent />
      </Suspense>
    </div>
  );
}
