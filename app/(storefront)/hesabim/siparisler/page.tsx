'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Package, 
  Truck, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  RefreshCw, 
  ExternalLink,
  ShoppingBag,
  Search
} from 'lucide-react';
import { useCart } from '@/components/storefront/CartContext';

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>({ page: 1, totalPages: 1, totalOrders: 0 });
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const [reorderMsg, setReorderMsg] = useState<{ id: string; msg: string; warnings?: string[] } | null>(null);

  const { addItem, openCart } = useCart();

  const fetchOrders = async (page = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/user/orders?page=${page}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
        setPagination(data.pagination || { page: 1, totalPages: 1, totalOrders: 0 });
      }
    } catch (e) {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(1);
  }, []);

  const handleReorder = async (orderId: string) => {
    setReorderingId(orderId);
    setReorderMsg(null);

    try {
      const res = await fetch('/api/user/orders/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId }),
      });

      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.items)) {
        // Add items to cart
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
        setReorderMsg({ id: orderId, msg: data.message, warnings: data.warnings });
        openCart();
      } else {
        setReorderMsg({ id: orderId, msg: data.error || 'Sipariş tekrarlanamadı.' });
      }
    } catch (e) {
      setReorderMsg({ id: orderId, msg: 'İşlem sırasında bağlantı hatası oluştu.' });
    } finally {
      setReorderingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'delivered':
      case 'Teslim_Edildi':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> Teslim Edildi
          </span>
        );
      case 'shipped':
      case 'Kargoya_Verildi':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Truck className="w-3.5 h-3.5" /> Kargoda
          </span>
        );
      case 'processing':
      case 'Hazirlaniyor':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5" /> Hazırlanıyor
          </span>
        );
      case 'cancelled':
      case 'Iptal':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5" /> İptal Edildi
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <Clock className="w-3.5 h-3.5" /> Sipariş Alındı
          </span>
        );
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (filterStatus === 'all') return true;
    return o.order_status?.toLowerCase().includes(filterStatus.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-900" />
            Sipariş Geçmişim ({pagination.totalOrders})
          </h1>
          <p className="text-xs text-slate-500">
            Geçmiş ve aktif tüm siparişlerinizin detayları, kargo takip bilgileri ve faturaları
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'Tümü' },
            { id: 'hazirlan', label: 'Hazırlananlar' },
            { id: 'kargo', label: 'Kargodakiler' },
            { id: 'teslim', label: 'Teslim Edilenler' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                filterStatus === tab.id
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-xs text-slate-400">
          Siparişleriniz yükleniyor...
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
          <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900">Sipariş Bulunamadı</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Seçtiğiniz filtreye uygun bir sipariş kaydı bulunmuyor.
            </p>
          </div>
          <Link
            href="/katalog"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-900 text-white font-bold text-xs rounded-xl hover:bg-blue-800 transition"
          >
            Alışverişe Başla
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden hover:border-slate-300 transition"
            >
              {/* Order Card Top Bar */}
              <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-4 flex-wrap">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Sipariş No</span>
                    <span className="font-black text-slate-900">#{order.order_number || order.id}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Tarih</span>
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
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Toplam Tutar</span>
                    <span className="font-black text-blue-900">
                      {Number(order.final_amount || order.total_amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {getStatusBadge(order.order_status)}
                </div>
              </div>

              {/* Order Card Items Summary */}
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {order.items_summary?.map((it: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-2xl border border-slate-100">
                      {it.image ? (
                        <img
                          src={it.image}
                          alt={it.name}
                          className="w-12 h-12 object-cover rounded-xl border border-slate-200 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-slate-200 rounded-xl flex items-center justify-center text-slate-400 font-bold text-xs flex-shrink-0">
                          BK
                        </div>
                      )}
                      <div className="min-w-0 flex-1 text-xs">
                        <p className="font-bold text-slate-900 truncate">{it.name}</p>
                        <p className="text-[11px] text-slate-500">
                          {it.variant && `${it.variant} • `}{it.meter} Metre
                        </p>
                        {it.unit_price && (
                          <p className="text-[11px] font-black text-blue-900">
                            {Number(it.unit_price).toFixed(2)} TL / m
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Cargo Tracking quick pill */}
                {order.tracking_number && (
                  <div className="p-3 bg-blue-50/70 rounded-2xl border border-blue-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-blue-950 font-bold">
                      <Truck className="w-4 h-4 text-blue-700" />
                      <span>{order.carrier || 'DHL Kargo (MNG Kargo)'} Takip No: <strong>{order.tracking_number}</strong></span>
                    </div>
                    <a
                      href={`https://www.mngkargo.com.tr/gonderitakip?takipNo=${encodeURIComponent(order.tracking_number)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-bold text-blue-700 hover:underline inline-flex items-center gap-1"
                    >
                      <span>Kargo Sorgula</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                {/* Reorder feedback */}
                {reorderMsg && reorderMsg.id === order.id && (
                  <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs font-semibold space-y-1">
                    <p>{reorderMsg.msg}</p>
                    {reorderMsg.warnings && reorderMsg.warnings.length > 0 && (
                      <ul className="list-disc pl-4 text-[11px] text-emerald-700 font-normal">
                        {reorderMsg.warnings.map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* Card Action Buttons */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <Link
                    href={`/hesabim/siparisler/${order.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs transition"
                  >
                    <span>Sipariş Detayını ve Faturayı İncele</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>

                  <button
                    onClick={() => handleReorder(order.id)}
                    disabled={reorderingId === order.id}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-200 transition disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${reorderingId === order.id ? 'animate-spin' : ''}`} />
                    <span>{reorderingId === order.id ? 'Sepete Ekleniyor...' : 'Tekrar Satın Al'}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => fetchOrders(p)}
                  className={`w-9 h-9 rounded-xl font-bold text-xs transition ${
                    pagination.page === p
                      ? 'bg-blue-900 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
