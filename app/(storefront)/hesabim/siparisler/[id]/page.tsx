'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  Package, 
  Truck, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ArrowLeft, 
  ExternalLink, 
  RefreshCw, 
  MapPin, 
  CreditCard, 
  FileText, 
  Printer, 
  ShieldCheck,
  Scissors,
  Star
} from 'lucide-react';
import { useCart } from '@/components/storefront/CartContext';

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [reordering, setReordering] = useState(false);
  const [reorderStatus, setReorderStatus] = useState<{ msg: string; warnings?: string[] } | null>(null);

  const { addItem, openCart } = useCart();

  useEffect(() => {
    const fetchOrderDetail = async () => {
      try {
        const res = await fetch(`/api/user/orders/${orderId}`);
        const data = await res.json();
        if (res.ok && data.order) {
          setOrder(data.order);
        } else {
          setErrorMsg(data.error || 'Sipariş detayları alınamadı.');
        }
      } catch (err: any) {
        setErrorMsg('Bağlantı hatası oluştu.');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrderDetail();
    }
  }, [orderId]);

  const handleReorder = async () => {
    if (!order) return;
    setReordering(true);
    setReorderStatus(null);

    try {
      const res = await fetch('/api/user/orders/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: order.id }),
      });

      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.items)) {
        for (const item of data.items) {
          addItem({
            productId: item.productId,
            variantId: item.variantId,
            name: item.name,
            variantTitle: item.variantTitle,
            sku: item.sku,
            image: item.image,
            unitPrice: item.unitPrice,
            meterQuantity: item.meterQuantity,
            maxStockMeter: item.maxStockMeter,
          });
        }
        setReorderStatus({ msg: data.message, warnings: data.warnings });
        openCart();
      } else {
        setReorderStatus({ msg: data.error || 'Sipariş tekrarlanamadı.' });
      }
    } catch (e) {
      setReorderStatus({ msg: 'İşlem sırasında hata oluştu.' });
    } finally {
      setReordering(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-xs text-slate-400">
        Sipariş detayları yükleniyor...
      </div>
    );
  }

  if (errorMsg || !order) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
          <XCircle className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-slate-900 text-sm">Sipariş Bulunamadı</h3>
        <p className="text-xs text-slate-500">{errorMsg || 'Aradığınız sipariş mevcut değil veya erişim yetkiniz yok.'}</p>
        <Link
          href="/hesabim/siparisler"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-900 text-white font-bold text-xs rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Siparişlerime Dön</span>
        </Link>
      </div>
    );
  }

  // Determine Timeline Step Index
  const statusStr = (order.status || '').toLowerCase();
  let currentStep = 1;
  if (statusStr.includes('hazir') || statusStr.includes('processing')) currentStep = 2;
  else if (statusStr.includes('kargo') || statusStr.includes('shipped')) currentStep = 3;
  else if (statusStr.includes('teslim') || statusStr.includes('completed') || statusStr.includes('delivered')) currentStep = 4;
  else if (statusStr.includes('iptal') || statusStr.includes('cancelled')) currentStep = -1;

  const timelineSteps = [
    { step: 1, title: 'Sipariş Alındı', desc: 'Ödeme onaylandı & kesim kuyruğuna alındı', icon: Package },
    { step: 2, title: 'Kesim & Hazırlık', desc: '0.5m hassas lazer metre kesimi yapılıyor', icon: Scissors },
    { step: 3, title: 'Kargoya Verildi', desc: 'DHL Kargo (MNG Kargo) güvencesiyle yola çıktı', icon: Truck },
    { step: 4, title: 'Teslim Edildi', desc: 'Adresinize güvenle teslim edildi', icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Bar with Back Link & Quick Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Link
          href="/hesabim/siparisler"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Tüm Siparişlerime Dön</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition flex items-center gap-1.5 shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Yazdır</span>
          </button>

          <button
            onClick={handleReorder}
            disabled={reordering}
            className="px-3.5 py-1.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${reordering ? 'animate-spin' : ''}`} />
            <span>{reordering ? 'Ekleniyor...' : 'Aynı Siparişi Tekrarla'}</span>
          </button>
        </div>
      </div>

      {/* Reorder feedback alert */}
      {reorderStatus && (
        <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 text-xs font-semibold space-y-1">
          <p>{reorderStatus.msg}</p>
          {reorderStatus.warnings && reorderStatus.warnings.length > 0 && (
            <ul className="list-disc pl-4 text-[11px] text-emerald-700 font-normal">
              {reorderStatus.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Main Order Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-6 p-6">
        {/* Header Details */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-100 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Sipariş Numarası</span>
            <span className="font-black text-slate-900 text-base">#{order.order_number || order.id}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Sipariş Tarihi</span>
            <span className="font-semibold text-slate-700">
              {new Date(order.created_at).toLocaleDateString('tr-TR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Ödeme Yöntemi</span>
            <span className="font-semibold text-slate-700">{order.payment_method || 'Kredi / Banka Kartı'}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Toplam Tutar</span>
            <span className="font-black text-blue-900 text-base">
              {Number(order.final_amount || order.total_amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
            </span>
          </div>
        </div>

        {/* Visual Timeline Section */}
        {currentStep === -1 ? (
          <div className="p-4 bg-rose-50 text-rose-700 rounded-2xl border border-rose-200 text-xs font-bold flex items-center gap-2">
            <XCircle className="w-5 h-5" />
            <span>Bu sipariş iptal edilmiştir. İade tutarı kartınıza yansıtılmıştır.</span>
          </div>
        ) : (
          <div className="py-4">
            <h3 className="text-xs font-bold text-slate-700 mb-6 uppercase tracking-wider">
              Sipariş & Kesim Takip Durumu
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
              {timelineSteps.map((s, idx) => {
                const Icon = s.icon;
                const isPassed = currentStep >= s.step;
                const isCurrent = currentStep === s.step;

                return (
                  <div key={s.step} className="flex flex-col items-start space-y-2 relative">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold transition ${
                          isPassed
                            ? 'bg-blue-900 text-white shadow-md'
                            : 'bg-slate-100 text-slate-400 border border-slate-200'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      {idx < 3 && (
                        <div
                          className={`hidden sm:block absolute left-12 top-5 w-[calc(100%-3rem)] h-0.5 z-0 ${
                            currentStep > s.step ? 'bg-blue-900' : 'bg-slate-200'
                          }`}
                        />
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <p className={`text-xs font-black ${isPassed ? 'text-slate-900' : 'text-slate-400'}`}>
                        {s.title}
                      </p>
                      <p className="text-[11px] text-slate-500 leading-tight">{s.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* DHL / MNG Kargo Direct Tracking Box */}
        {(order.shipping?.tracking_number || order.tracking_number) && (
          <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <p className="font-black text-blue-950 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-blue-700" />
                {order.shipping?.carrier || 'DHL Kargo (MNG Kargo)'} Takip Bilgisi
              </p>
              <p className="text-slate-600">
                Takip No: <strong className="text-slate-900">{order.shipping?.tracking_number || order.tracking_number}</strong>
              </p>
            </div>
            <a
              href={`https://www.mngkargo.com.tr/gonderitakip?takipNo=${encodeURIComponent(
                order.shipping?.tracking_number || order.tracking_number
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs transition inline-flex items-center gap-1.5"
            >
              <span>Kargoyu Canlı Takip Et</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        {/* Order Items Table */}
        <div className="space-y-3">
          <h3 className="text-xs font-black text-slate-900">Siparişteki Kumaşlar ({order.items?.length || 0})</h3>
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
            {order.items?.map((item: any, idx: number) => (
              <div key={idx} className="p-4 hover:bg-slate-50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3">
                  {item.product_image || item.image ? (
                    <img
                      src={item.product_image || item.image}
                      alt={item.product_name || item.name}
                      className="w-14 h-14 object-cover rounded-xl border border-slate-200 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center font-bold text-slate-400 flex-shrink-0">
                      BK
                    </div>
                  )}
                  <div className="space-y-0.5">
                    <p className="font-black text-slate-900">{item.product_name || item.name}</p>
                    {item.variant_title && (
                      <p className="text-[11px] text-slate-500 font-medium">Varyant: {item.variant_title}</p>
                    )}
                    <p className="text-[11px] text-slate-600 font-semibold">
                      Kesim Miktarı: <span className="text-blue-900 font-bold">{item.meter_quantity || item.quantity} Metre</span>
                    </p>
                  </div>
                </div>

                <div className="flex sm:flex-col sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                  <span className="text-[11px] text-slate-400 font-medium">
                    {Number(item.unit_price || 0).toFixed(2)} TL / m
                  </span>
                  <span className="font-black text-blue-900 text-sm">
                    {Number((item.unit_price || 0) * (item.meter_quantity || item.quantity || 1)).toFixed(2)} TL
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3-Column Info Footer: Address Snapshot, Payment & Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs">
          {/* Shipping Address */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
            <h4 className="font-black text-slate-900 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-blue-900" />
              Teslimat Adresi
            </h4>
            <div className="text-slate-600 space-y-0.5 leading-relaxed">
              <p className="font-bold text-slate-800">{order.shipping_name || order.customer_name || 'Alıcı'}</p>
              <p>{order.shipping_address || order.address_line1 || 'Adres bilgisi'}</p>
              <p className="font-semibold text-slate-700">
                {order.shipping_district || order.district} / {order.shipping_city || order.city}
              </p>
              {order.shipping_phone && <p className="text-[11px] text-slate-500">Tel: {order.shipping_phone}</p>}
            </div>
          </div>

          {/* Billing Info */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
            <h4 className="font-black text-slate-900 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-indigo-900" />
              Fatura Bilgileri
            </h4>
            <div className="text-slate-600 space-y-0.5 leading-relaxed">
              <p className="font-bold text-slate-800">
                {order.billing_type === 'corporate' ? order.company_name : order.billing_name || order.shipping_name || 'Bireysel Fatura'}
              </p>
              {order.tax_number && (
                <p className="text-[11px]">Vergi No: {order.tax_number} ({order.tax_office})</p>
              )}
              <p>{order.billing_address || order.shipping_address || 'Teslimat adresi ile aynı'}</p>
              <p className="text-[11px] text-emerald-700 font-bold flex items-center gap-1 pt-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> E-Fatura Düzenlendi
              </p>
            </div>
          </div>

          {/* Totals Breakdown */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
            <h4 className="font-black text-slate-900 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-emerald-700" />
              Ödeme Özeti
            </h4>
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-slate-600">
                <span>Ara Toplam:</span>
                <span className="font-semibold">{Number(order.subtotal || order.total_amount).toFixed(2)} TL</span>
              </div>
              {order.shipping_cost !== undefined && (
                <div className="flex justify-between text-slate-600">
                  <span>Kargo Ücreti:</span>
                  <span className="font-semibold">
                    {order.shipping_cost === 0 ? 'Ücretsiz Kargo' : `${Number(order.shipping_cost).toFixed(2)} TL`}
                  </span>
                </div>
              )}
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Kupon / İndirim:</span>
                  <span>-{Number(order.discount_amount).toFixed(2)} TL</span>
                </div>
              )}
              <div className="flex justify-between text-slate-900 font-black text-sm pt-2 border-t border-slate-200">
                <span>Genel Toplam:</span>
                <span className="text-blue-900">
                  {Number(order.final_amount || order.total_amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
