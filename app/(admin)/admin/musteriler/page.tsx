'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Search, 
  CheckCircle2, 
  XCircle, 
  ShoppingBag, 
  ChevronRight, 
  ShieldCheck, 
  Mail, 
  Phone, 
  Calendar,
  Filter,
  Ban,
  Eye
} from 'lucide-react';

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });

  const fetchCustomers = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '15',
        q: searchQuery,
        status: statusFilter,
      });

      const res = await fetch(`/api/admin/customers?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers || []);
        setPagination(data.pagination || { page: 1, total: 0, totalPages: 1 });
      }
    } catch (e) {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(1);
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCustomers(1);
  };

  const toggleCustomerStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    const actionLabel = nextStatus === 'suspended' ? 'askıya almak' : 'aktifleştirmek';

    if (!confirm(`Bu müşteriyi ${actionLabel} istediğinize emin misiniz?`)) return;

    try {
      const res = await fetch(`/api/admin/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_status: nextStatus }),
      });

      if (res.ok) {
        setCustomers((prev) =>
          prev.map((c) => (c.id === id ? { ...c, account_status: nextStatus } : c))
        );
      }
    } catch (e) {}
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Müşteri Yönetimi & Hesaplar ({pagination.total})
          </h1>
          <p className="text-xs text-slate-500">
            Kayıtlı müşteriler, sipariş geçmişleri, sepet harcamaları ve hesap doğrulama durumları
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:max-w-md">
          <input
            type="text"
            placeholder="İsim, e-posta veya telefon ile ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 text-xs rounded-xl pl-9 pr-4 py-2.5 outline-none focus:bg-white focus:ring-2 focus:ring-blue-600"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-xs font-bold rounded-xl px-3 py-2 text-slate-700 outline-none"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="active">Aktif Müşteriler</option>
            <option value="suspended">Askıya Alınanlar</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Müşteriler listeleniyor...</div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Users className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Arama kriterlerine uygun müşteri bulunamadı.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="px-5 py-3">Müşteri</th>
                  <th className="px-5 py-3">İletişim</th>
                  <th className="px-5 py-3">Doğrulama / İletişim</th>
                  <th className="px-5 py-3">Sipariş Sayısı</th>
                  <th className="px-5 py-3">Toplam Harcama</th>
                  <th className="px-5 py-3">Kayıt Tarihi</th>
                  <th className="px-5 py-3">Durum</th>
                  <th className="px-5 py-3 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-900 text-white flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                          {c.first_name?.[0] || 'M'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{c.full_name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">ID: {c.id}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <p className="text-slate-700 font-medium">{c.email}</p>
                      {c.phone && <p className="text-[11px] text-slate-400">{c.phone}</p>}
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${
                          c.email_verified ? 'text-emerald-700' : 'text-amber-600'
                        }`}>
                          {c.email_verified ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {c.email_verified ? 'E-Posta Onaylı' : 'Onaysız'}
                        </span>
                        <span className={`text-[10px] ${c.marketing_consent ? 'text-blue-700 font-semibold' : 'text-slate-400'}`}>
                          Ticari İleti: {c.marketing_consent ? 'İzinli' : 'İzinsiz'}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-3.5 font-bold text-slate-800">
                      {c.orders_count} Sipariş
                    </td>

                    <td className="px-5 py-3.5 font-black text-blue-950">
                      {Number(c.total_spent || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                    </td>

                    <td className="px-5 py-3.5 text-slate-500 text-[11px]">
                      {new Date(c.created_at).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>

                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        c.account_status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {c.account_status === 'active' ? 'Aktif' : 'Askıda'}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/admin/musteriler/${c.id}`}
                          className="p-1.5 hover:bg-blue-50 text-slate-600 hover:text-blue-900 rounded-lg transition"
                          title="Müşteri Detayı"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>

                        <button
                          onClick={() => toggleCustomerStatus(c.id, c.account_status)}
                          className={`p-1.5 rounded-lg transition ${
                            c.account_status === 'active'
                              ? 'hover:bg-rose-50 text-slate-400 hover:text-rose-600'
                              : 'hover:bg-emerald-50 text-slate-400 hover:text-emerald-600'
                          }`}
                          title={c.account_status === 'active' ? 'Askıya Al' : 'Aktifleştir'}
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-center gap-2">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => fetchCustomers(p)}
                className={`w-8 h-8 rounded-xl font-bold text-xs ${
                  pagination.page === p ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
