import React from 'react';
import Link from 'next/link';
import { dbRepo } from '@/lib/db/repo';
import { getDashboardStats } from '@/lib/services/reports';
import { formatCurrency } from '@/lib/services/meterEngine';
import { 
  TrendingUp, ShoppingCart, Package, Scissors, 
  Truck, CheckCircle2, Clock, Plus, Sliders, ArrowRight, Printer 
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function AdminDashboardPage() {
  const stats = getDashboardStats();
  const db = dbRepo.read();
  const recentOrders = (db.orders || []).slice(0, 5);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* 1. TOP HEADER & QUICK ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Yönetim & Satış Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Canlı sipariş akışı, metre bazlı satış hacmi ve entegrasyon durumları.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/admin/urunler/yeni"
            className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Kumaş Ekle</span>
          </Link>

          <Link
            href="/admin/toplu-guncelleme"
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
          >
            <Sliders className="w-4 h-4 text-blue-900" />
            <span>Toplu Fiyat Güncelle</span>
          </Link>
        </div>
      </div>

      {/* 2. SALES STATS METRICS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Sales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Bugünkü Ciro</span>
            <span className="p-1.5 bg-blue-50 text-blue-900 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {formatCurrency(stats.todaySales)}
          </div>
          <div className="text-[11px] text-slate-400">
            Dünkü Ciro: <strong>{formatCurrency(stats.yesterdaySales)}</strong>
          </div>
        </div>

        {/* This Month's Sales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Bu Ayki Ciro</span>
            <span className="p-1.5 bg-emerald-50 text-emerald-900 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-950">
            {formatCurrency(stats.thisMonthSales)}
          </div>
          <div className="text-[11px] text-slate-400">
            Bu Hafta: <strong>{formatCurrency(stats.thisWeekSales)}</strong>
          </div>
        </div>

        {/* Total Fabric Meters Sold */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Toplam Satılan Kumaş</span>
            <span className="p-1.5 bg-amber-50 text-amber-900 rounded-lg">
              <Scissors className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-amber-950">
            {stats.totalMetersSold} <span className="text-sm font-bold text-slate-500">Metre</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Tüm siparişlerde kesilen toplam kumaş
          </div>
        </div>

        {/* Average Order Value */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Ortalama Sipariş Tutarı</span>
            <span className="p-1.5 bg-purple-50 text-purple-900 rounded-lg">
              <ShoppingCart className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-purple-950">
            {formatCurrency(stats.averageOrderValue)}
          </div>
          <div className="text-[11px] text-slate-400">
            Toplam {stats.totalOrdersCount} Sipariş
          </div>
        </div>
      </div>

      {/* 3. ORDER STATUS BREAKDOWN BARS */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
          Sipariş Durum Sayaçları
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200">
            <div className="text-xs text-amber-800 font-semibold">Bekleyen / Yeni</div>
            <div className="text-xl font-black text-amber-950 mt-0.5">{stats.pendingOrdersCount}</div>
          </div>

          <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200">
            <div className="text-xs text-blue-800 font-semibold">Kesimde / Hazırlanıyor</div>
            <div className="text-xl font-black text-blue-950 mt-0.5">{stats.preparingOrdersCount}</div>
          </div>

          <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-200">
            <div className="text-xs text-purple-800 font-semibold">DHL (MNG) Kargoda</div>
            <div className="text-xl font-black text-purple-950 mt-0.5">{stats.shippedOrdersCount}</div>
          </div>

          <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200">
            <div className="text-xs text-emerald-800 font-semibold">Teslim Edildi</div>
            <div className="text-xl font-black text-emerald-950 mt-0.5">{stats.completedOrdersCount}</div>
          </div>
        </div>
      </div>

      {/* 4. RECENT ORDERS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Son Gelen Siparişler
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Kesim masası, kargo ve yazdırma fişi kontrolleri
            </p>
          </div>

          <Link
            href="/admin/siparisler"
            className="text-xs font-bold text-blue-900 hover:text-blue-700 flex items-center gap-1 transition"
          >
            <span>Tüm Siparişleri Gör</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="p-4">Sipariş No</th>
                <th className="p-4">Müşteri</th>
                <th className="p-4">Tutar</th>
                <th className="p-4">Durum</th>
                <th className="p-4">Tarih</th>
                <th className="p-4 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentOrders.map((order: any) => {
                let statusBadge = (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                    {order.status}
                  </span>
                );

                if (order.status === 'Siparis_Alindi') {
                  statusBadge = (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                      Sipariş Alındı
                    </span>
                  );
                } else if (order.status === 'Hazirlaniyor') {
                  statusBadge = (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                      Kesimde / Hazırlanıyor
                    </span>
                  );
                } else if (order.status === 'Kargoya_Verildi') {
                  statusBadge = (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                      Kargoya Verildi
                    </span>
                  );
                }

                return (
                  <tr key={order.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-4 font-mono font-bold text-blue-900">
                      {order.order_number}
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{order.customer_name}</div>
                      <div className="text-[11px] text-slate-500">{order.customer_phone}</div>
                    </td>
                    <td className="p-4 font-extrabold text-slate-900">
                      {formatCurrency(order.grand_total)}
                    </td>
                    <td className="p-4">{statusBadge}</td>
                    <td className="p-4 text-slate-500">
                      {new Date(order.created_at).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <Link
                        href={`/admin/siparisler/${order.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg transition"
                      >
                        <Printer className="w-3.5 h-3.5 text-blue-900" />
                        <span>Fiş / Detay</span>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
