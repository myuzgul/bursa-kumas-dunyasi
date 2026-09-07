import React from 'react';
import { getFabricSalesReport, getDashboardStats } from '@/lib/services/reports';
import { formatCurrency } from '@/lib/services/meterEngine';
import { BarChart3, Calendar, Scissors, Download, TrendingUp } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function AdminReportsPage({
  searchParams,
}: {
  searchParams: { start?: string; end?: string };
}) {
  const reports = getFabricSalesReport(searchParams.start, searchParams.end);
  const stats = getDashboardStats();

  const totalReportMeters = reports.reduce((acc, r) => acc + r.totalMetersSold, 0);
  const totalReportRevenue = reports.reduce((acc, r) => acc + r.totalRevenue, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Kumaş Satış & Metraj Raporları
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Hangi kumaştan kaç metre satıldı, ne kadar ciro oluşturuldu ve en çok satan kumaş türleri.
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-xs text-slate-500 font-medium">Toplam Kesilen Kumaş</div>
          <div className="text-2xl font-black text-blue-900">
            {totalReportMeters} <span className="text-sm font-bold text-slate-600">Metre</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-xs text-slate-500 font-medium">Toplam Kumaş Cirosu</div>
          <div className="text-2xl font-black text-emerald-950">
            {formatCurrency(totalReportRevenue)}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-xs text-slate-500 font-medium">Ortalama Metre Başı Gelir</div>
          <div className="text-2xl font-black text-purple-950">
            {totalReportMeters > 0
              ? formatCurrency(totalReportRevenue / totalReportMeters)
              : '0,00 TL'}{' '}
            <span className="text-sm font-normal text-slate-500">/ m</span>
          </div>
        </div>
      </div>

      {/* Fabric Sales Report Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">
            Ürün Bazlı Metre Satış Dökümü
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            Sipariş hacmine göre sıralanmıştır
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="p-4 w-14">Görsel</th>
                <th className="p-4">Kumaş Adı & SKU</th>
                <th className="p-4">Kategori</th>
                <th className="p-4 text-center bg-blue-50/70 text-blue-950 font-black">
                  SATILAN METRE
                </th>
                <th className="p-4 text-center">Sipariş Sayısı</th>
                <th className="p-4 text-right">Ort. Birim Fiyat</th>
                <th className="p-4 text-right font-black text-slate-900">Oluşturulan Ciro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reports.map((item) => (
                <tr key={item.productId} className="hover:bg-slate-50/70 transition">
                  <td className="p-4">
                    <img
                      src={item.mainImage}
                      alt={item.name}
                      className="w-10 h-10 rounded-lg object-cover border border-slate-200"
                    />
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-slate-900">{item.name}</div>
                    <div className="font-mono text-[11px] text-slate-500">{item.sku}</div>
                  </td>
                  <td className="p-4">
                    <span className="bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded">
                      {item.categoryName}
                    </span>
                  </td>
                  <td className="p-4 text-center bg-blue-50/30 font-black text-sm text-blue-950">
                    {item.totalMetersSold} Metre
                  </td>
                  <td className="p-4 text-center font-bold text-slate-700">
                    {item.orderCount} adet
                  </td>
                  <td className="p-4 text-right font-medium text-slate-600">
                    {formatCurrency(item.averageUnitPrice)}
                  </td>
                  <td className="p-4 text-right font-black text-emerald-900 text-sm">
                    {formatCurrency(item.totalRevenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
