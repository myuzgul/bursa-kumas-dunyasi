'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Printer, Trash2, Eye, Scissors, Package, CheckCircle2, 
  Clock, Phone, Search, X, RefreshCw, AlertTriangle, Receipt, FileText, Send
} from 'lucide-react';

export default function AdminOrdersManagementPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [statusModalOrder, setStatusModalOrder] = useState<any | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [modalInvoiceLoading, setModalInvoiceLoading] = useState(false);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/admin/products'); // DB reader or custom API
      const data = await res.json();
      // Let's fetch orders directly from our API
      const ordersRes = await fetch('/api/admin/orders-list');
      if (ordersRes.ok) {
        const oData = await ordersRes.json();
        setOrders(oData.orders || []);
        setItems(oData.items || []);
      }
    } catch (e) {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Format currency as ₺1060.60
  const formatTL = (val: number) => {
    return `₺${Number(val || 0).toFixed(2)}`;
  };

  // Format date as 28.08.2026 03:14
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${day}.${month}.${year} ${hours}:${mins}`;
  };

  // Action: Print single order & mark as 'Yazdırıldı'
  const handlePrintOrder = async (order: any) => {
    try {
      await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ print_status: 'Yazdırıldı' }),
      });
    } catch (err) {}

    window.open(`/admin/siparisler/${order.id}`, '_blank');
    fetchOrders();
  };

  // Action: Bulk Print selected orders & mark as 'Yazdırıldı'
  const handleBulkPrint = () => {
    if (selectedIds.length === 0) return;
    window.open(`/admin/siparisler/toplu-yazdir?ids=${selectedIds.join(',')}`, '_blank');
    // Refresh list to update print_status badges
    setTimeout(() => {
      fetchOrders();
      setSelectedIds([]);
    }, 1000);
  };

  // Action: Toggle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredOrders.map((o) => o.id));
    } else {
      setSelectedIds([]);
    }
  };

  // Action: Toggle single row select
  const handleToggleSelect = (orderId: string) => {
    setSelectedIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  // Action: Delete order
  const handleDeleteOrder = async (order: any) => {
    if (!window.confirm(`"${order.order_number}" numaralı siparişi kalıcı olarak silmek istediğinize emin misiniz?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchOrders();
        if (selectedOrder?.id === order.id) setSelectedOrder(null);
      }
    } catch (e) {
      // Ignore
    }
  };

  // Action: Change order status
  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          adminName: 'Süper Yönetici',
          notes: `Durum "${newStatus}" olarak güncellendi.`,
        }),
      });
      setStatusModalOrder(null);
      fetchOrders();
    } catch (e) {}
  };

  // Action: Create Park Bulut Invoice for order
  const handleCreateInvoiceForOrder = async (orderId: string) => {
    setModalInvoiceLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/invoice`, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchOrders();
        // Update selected order if modal is open
        setSelectedOrder((prev: any) => prev ? { ...prev, invoice_status: 'created', invoice_number: data.invoiceNumber } : null);
        alert(data.message || 'Park Bulut faturası başarıyla oluşturuldu!');
      } else {
        alert(data.message || 'Fatura oluşturulurken bir hata oluştu.');
      }
    } catch (e: any) {
      alert('Fatura servisine bağlanılamadı.');
    } finally {
      setModalInvoiceLoading(false);
    }
  };

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    if (filterStatus !== 'all' && o.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        o.order_number?.toLowerCase().includes(q) ||
        o.customer_name?.toLowerCase().includes(q) ||
        o.customer_phone?.includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Sipariş Yönetimi & Kesim Masası
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gelen siparişlerin durumlarını, ödeme yöntemlerini ve yazdırma fişlerini yönetin.
          </p>
        </div>

        {/* Filter / Search Bar */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Sipariş no, müşteri veya tel ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 pl-8 py-2 text-xs w-60 shadow-xs focus:outline-none focus:ring-1 focus:ring-blue-900"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>

          <button
            onClick={fetchOrders}
            className="p-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl transition"
            title="Yenile"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* FILTER BUTTONS & BULK PRINT ACTION BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg border transition ${
              filterStatus === 'all'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Tüm Siparişler ({orders.length})
          </button>
          <button
            onClick={() => setFilterStatus('Hazirlaniyor')}
            className={`px-3 py-1.5 rounded-lg border transition ${
              filterStatus === 'Hazirlaniyor'
                ? 'bg-purple-600 text-white border-purple-600'
                : 'bg-white text-purple-900 border-purple-200 hover:bg-purple-50'
            }`}
          >
            ✂ Üretimde / Kesimde ({orders.filter((o) => o.status === 'Hazirlaniyor' || o.status === 'Uretimde').length})
          </button>
          <button
            onClick={() => setFilterStatus('Siparis_Alindi')}
            className={`px-3 py-1.5 rounded-lg border transition ${
              filterStatus === 'Siparis_Alindi'
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-white text-amber-900 border-amber-200 hover:bg-amber-50'
            }`}
          >
            Sipariş Alındı ({orders.filter((o) => o.status === 'Siparis_Alindi').length})
          </button>
          <button
            onClick={() => setFilterStatus('Kargoya_Verildi')}
            className={`px-3 py-1.5 rounded-lg border transition ${
              filterStatus === 'Kargoya_Verildi'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-blue-900 border-blue-200 hover:bg-blue-50'
            }`}
          >
            📦 Kargoya Verildi ({orders.filter((o) => o.status === 'Kargoya_Verildi').length})
          </button>
        </div>

        {/* Dynamic Bulk Action Bar */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl animate-fadeIn">
            <span className="text-xs font-bold text-blue-950">
              {selectedIds.length} Sipariş Seçildi:
            </span>
            <button
              onClick={handleBulkPrint}
              className="px-3.5 py-1.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-lg shadow transition flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Toplu Çıktı Al (A4 Yazdır)</span>
            </button>
          </div>
        )}
      </div>

      {/* ORDERS TABLE EXACTLY MATCHING USER SCREENSHOT */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold tracking-tight text-[11px]">
                <th className="p-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.length > 0 && selectedIds.length === filteredOrders.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded text-blue-900 cursor-pointer"
                    title="Tümünü Seç / Kaldır"
                  />
                </th>
                <th className="p-3.5">Sipariş No</th>
                <th className="p-3.5">Müşteri</th>
                <th className="p-3.5">Kalemler</th>
                <th className="p-3.5">Tutar</th>
                <th className="p-3.5">Ödeme Yöntemi</th>
                <th className="p-3.5">Yazdırma Durumu</th>
                <th className="p-3.5">Sipariş Durumu</th>
                <th className="p-3.5">Tarih</th>
                <th className="p-3.5 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">
                    Sipariş bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const isSelected = selectedIds.includes(order.id);
                  const orderItemsList = items.filter((it) => it.order_id === order.id);
                  const firstItem = orderItemsList[0];
                  const itemCountLabel =
                    orderItemsList.length > 0
                      ? `${orderItemsList.length} Kumaş (${orderItemsList.reduce((a, b) => a + (b.meter_quantity || 0), 0)}m)`
                      : '1 Ürün';

                  const itemSummary = firstItem
                    ? `${firstItem.product_name} ${firstItem.variant_title ? `(${firstItem.variant_title})` : ''}`
                    : 'Kumaş Kesim Siparişi';

                  const shippingCity =
                    typeof order.shipping_address === 'object'
                      ? order.shipping_address?.city || 'Bursa'
                      : 'Bursa';

                  const isPaid = order.payment_status === 'paid';
                  const isPrinted = order.print_status === 'Yazdırıldı';

                  return (
                    <tr
                      key={order.id}
                      className={`transition group ${isSelected ? 'bg-blue-50/50' : 'hover:bg-slate-50/80'}`}
                    >
                      {/* Checkbox */}
                      <td className="p-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(order.id)}
                          className="rounded text-blue-900 cursor-pointer"
                        />
                      </td>

                      {/* 1. Sipariş No */}
                      <td className="p-3.5">
                        <Link
                          href={`/admin/siparisler/${order.id}`}
                          className="font-bold text-blue-600 hover:text-blue-800 hover:underline transition font-sans"
                        >
                          {order.order_number}
                        </Link>
                      </td>

                      {/* 2. Müşteri & Fatura */}
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 text-xs leading-snug flex items-center gap-1.5">
                          <span>{order.customer_name}</span>
                          {(() => {
                            const billing = typeof order.billing_address === 'string'
                              ? JSON.parse(order.billing_address)
                              : (order.billing_address || order.shipping_address);
                            return Boolean(billing?.isCorporate || billing?.companyName) ? (
                              <span className="text-[9px] font-black bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded border border-purple-200">
                                Kurumsal
                              </span>
                            ) : null;
                          })()}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{order.customer_phone} • {shippingCity}</span>
                        </div>
                        {order.invoice_status === 'created' || order.invoice_number ? (
                          <div className="mt-1">
                            <a
                              href={`/api/admin/orders/${order.id}/invoice-pdf`}
                              target="_blank"
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-200 transition"
                              title="Park Bulut E-Faturayı Görüntüle / İndir"
                            >
                              <Receipt className="w-2.5 h-2.5" />
                              <span>{order.invoice_number || 'E-Fatura Kesildi'}</span>
                            </a>
                          </div>
                        ) : null}
                      </td>

                      {/* 3. Kalemler */}
                      <td className="p-3.5 max-w-[200px]">
                        <div className="font-bold text-slate-900 text-xs">
                          {itemCountLabel}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate" title={itemSummary}>
                          {itemSummary}
                        </div>
                      </td>

                      {/* 4. Tutar */}
                      <td className="p-3.5 font-extrabold text-slate-900 text-xs tracking-tight">
                        {formatTL(order.grand_total)}
                      </td>

                      {/* 5. Ödeme Yöntemi */}
                      <td className="p-3.5">
                        <div className="text-xs font-semibold text-slate-800">
                          {order.payment_method === 'paytr' ? 'PayTR / Kredi Kartı' : 'Havale / EFT'}
                        </div>
                        <div className="text-[11px] font-bold flex items-center gap-1 mt-0.5">
                          {isPaid ? (
                            <span className="text-emerald-700 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block" />
                              <span>Ödendi</span>
                            </span>
                          ) : (
                            <span className="text-amber-700 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-600 inline-block" />
                              <span>Bekliyor</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 6. Yazdırma Durumu */}
                      <td className="p-3.5">
                        {isPrinted ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border border-emerald-300 text-emerald-700 bg-emerald-50/80">
                            <Printer className="w-3.5 h-3.5" />
                            <span>Yazdırıldı</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border border-slate-200 text-slate-500 bg-slate-50">
                            <span>Bekliyor</span>
                          </span>
                        )}
                      </td>

                      {/* 7. Sipariş Durumu */}
                      <td className="p-3.5">
                        <button
                          onClick={() => setStatusModalOrder(order)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition ${
                            order.status === 'Hazirlaniyor' || order.status === 'Uretimde'
                              ? 'border-purple-300 text-purple-700 bg-purple-50/80 hover:bg-purple-100'
                              : order.status === 'Kargoya_Verildi'
                              ? 'border-blue-300 text-blue-700 bg-blue-50/80 hover:bg-blue-100'
                              : order.status === 'Teslim_Edildi'
                              ? 'border-emerald-300 text-emerald-700 bg-emerald-50/80 hover:bg-emerald-100'
                              : 'border-amber-300 text-amber-800 bg-amber-50/80 hover:bg-amber-100'
                          }`}
                          title="Durumu Değiştirmek İçin Tıklayın"
                        >
                          {order.status === 'Hazirlaniyor' || order.status === 'Uretimde' ? (
                            <>
                              <Scissors className="w-3.5 h-3.5 text-purple-600" />
                              <span>Üretimde</span>
                            </>
                          ) : order.status === 'Kargoya_Verildi' ? (
                            <>
                              <Package className="w-3.5 h-3.5 text-blue-600" />
                              <span>Kargoda</span>
                            </>
                          ) : order.status === 'Teslim_Edildi' ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Teslim Edildi</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              <span>Sipariş Alındı</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* 8. Tarih */}
                      <td className="p-3.5 text-slate-500 text-xs whitespace-nowrap font-medium">
                        {formatDate(order.created_at)}
                      </td>

                      {/* 9. İşlemler (3 Buttons: Eye, Print, Trash) */}
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Eye / View Modal */}
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition"
                            title="Sipariş Detayı Görüntüle"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Print / Yazdır */}
                          <button
                            onClick={() => handlePrintOrder(order)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                            title="Yazdır / Sipariş Çıktısı"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* Trash / Sil */}
                          <button
                            onClick={() => handleDeleteOrder(order)}
                            className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition"
                            title="Siparişi Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* QUICK STATUS CHANGE MODAL */}
      {statusModalOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Sipariş Durumunu Değiştir</h3>
                <span className="text-xs text-blue-900 font-mono">#{statusModalOrder.order_number}</span>
              </div>
              <button
                onClick={() => setStatusModalOrder(null)}
                className="p-1 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="space-y-2 text-xs font-semibold">
              <button
                onClick={() => handleUpdateStatus(statusModalOrder.id, 'Siparis_Alindi')}
                className="w-full p-2.5 text-left rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-900 flex items-center gap-2"
              >
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Sipariş Alındı (Ödeme Onaylandı)</span>
              </button>

              <button
                onClick={() => handleUpdateStatus(statusModalOrder.id, 'Hazirlaniyor')}
                className="w-full p-2.5 text-left rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-900 flex items-center gap-2"
              >
                <Scissors className="w-4 h-4 text-purple-600" />
                <span>Üretimde / Kesimde (Masaya Alındı)</span>
              </button>

              <button
                onClick={() => handleUpdateStatus(statusModalOrder.id, 'Kargoya_Verildi')}
                className="w-full p-2.5 text-left rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-900 flex items-center gap-2"
              >
                <Package className="w-4 h-4 text-blue-600" />
                <span>Kargoya Verildi (DHL Kargo - MNG Kargo)</span>
              </button>

              <button
                onClick={() => handleUpdateStatus(statusModalOrder.id, 'Teslim_Edildi')}
                className="w-full p-2.5 text-left rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Teslim Edildi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK VIEW ORDER MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 sm:p-8 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b">
              <div>
                <span className="text-[10px] font-bold uppercase text-blue-900 bg-blue-50 px-2 py-0.5 rounded">
                  Sipariş Detayı
                </span>
                <h3 className="font-black text-lg text-slate-900 mt-0.5">
                  #{selectedOrder.order_number}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePrintOrder(selectedOrder)}
                  className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Yazdır</span>
                </button>

                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Customer, Shipping & Billing Details */}
            {(() => {
              const billing = typeof selectedOrder.billing_address === 'string'
                ? JSON.parse(selectedOrder.billing_address)
                : (selectedOrder.billing_address || selectedOrder.shipping_address);
              const isCorp = Boolean(billing?.isCorporate || billing?.companyName);
              const hasInvoice = selectedOrder.invoice_status === 'created' || Boolean(selectedOrder.invoice_number);

              return (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Müşteri</div>
                    <div className="font-bold text-slate-900 text-sm mt-0.5">{selectedOrder.customer_name}</div>
                    <div className="text-slate-600">{selectedOrder.customer_phone}</div>
                    <div className="text-slate-600 truncate">{selectedOrder.customer_email}</div>
                  </div>

                  <div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Teslimat Adresi</div>
                    <div className="text-slate-800 mt-0.5 leading-relaxed">
                      {typeof selectedOrder.shipping_address === 'string'
                        ? selectedOrder.shipping_address
                        : `${selectedOrder.shipping_address?.addressLine}, ${selectedOrder.shipping_address?.district} / ${selectedOrder.shipping_address?.city}`}
                    </div>
                  </div>

                  {/* Fatura & Park Bulut Section */}
                  <div className="bg-white p-3 rounded-xl border border-blue-200/80 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                        <span className="text-[10px] font-black text-blue-900 uppercase">Fatura Bilgisi</span>
                        <span
                          className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                            isCorp ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {isCorp ? 'Kurumsal' : 'Bireysel'}
                        </span>
                      </div>
                      <div className="mt-1 space-y-0.5">
                        {isCorp && (
                          <div className="font-bold text-slate-900 text-[11px] truncate">
                            {billing?.companyName}
                          </div>
                        )}
                        <div className="text-[11px] text-slate-600">
                          VKN/TCKN: <strong>{billing?.taxNumber || (isCorp ? 'Belirtilmedi' : '11111111111')}</strong>
                        </div>
                        {billing?.taxOffice && (
                          <div className="text-[10px] text-slate-500">V.D.: {billing.taxOffice}</div>
                        )}
                      </div>
                    </div>

                    <div className="pt-2">
                      {hasInvoice ? (
                        <a
                          href={`/api/admin/orders/${selectedOrder.id}/invoice-pdf`}
                          target="_blank"
                          className="w-full py-1.5 text-center bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition"
                        >
                          <FileText className="w-3 h-3" />
                          <span>Faturayı Gör ({selectedOrder.invoice_number})</span>
                        </a>
                      ) : (
                        <button
                          onClick={() => handleCreateInvoiceForOrder(selectedOrder.id)}
                          disabled={modalInvoiceLoading}
                          className="w-full py-1.5 text-center bg-blue-900 hover:bg-blue-800 disabled:bg-slate-400 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition"
                        >
                          <Send className="w-3 h-3" />
                          <span>{modalInvoiceLoading ? 'Fatura Kesiliyor...' : 'Park Bulut E-Fatura Kes'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Items */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                Kesilecek Kumaşlar
              </h4>
              <div className="divide-y divide-slate-100">
                {items
                  .filter((it) => it.order_id === selectedOrder.id)
                  .map((it) => (
                    <div key={it.id} className="py-2.5 flex items-center gap-3">
                      <img
                        src={it.product_image}
                        alt={it.product_name}
                        className="w-12 h-12 rounded-lg object-cover border"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-900 text-xs">{it.product_name}</div>
                        <div className="text-[11px] text-slate-500">
                          {it.variant_title && `${it.variant_title} • `}
                          <strong>{it.meter_quantity} Metre</strong>
                        </div>
                      </div>
                      <div className="font-bold text-slate-900 text-xs">
                        {formatTL(it.total_price)}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Total */}
            <div className="pt-3 border-t flex justify-between items-center text-sm font-black text-slate-900">
              <span>Toplam Sipariş Tutarı:</span>
              <span className="text-blue-900 text-base">{formatTL(selectedOrder.grand_total)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
