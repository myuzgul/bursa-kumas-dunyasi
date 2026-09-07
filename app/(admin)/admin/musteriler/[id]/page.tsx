'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  Users, 
  ArrowLeft, 
  ShoppingBag, 
  MapPin, 
  ShieldCheck, 
  Mail, 
  Phone, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  CreditCard,
  Ban,
  Package,
  Clock,
  Laptop
} from 'lucide-react';

export default function AdminCustomerDetailPage() {
  const params = useParams();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<any | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [securityLogs, setSecurityLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCustomerDetail = async () => {
    try {
      const res = await fetch(`/api/admin/customers/${customerId}`);
      const data = await res.json();
      if (res.ok && data.customer) {
        setCustomer(data.customer);
        setOrders(data.orders || []);
        setAddresses(data.addresses || []);
        setSecurityLogs(data.security_logs || []);
      }
    } catch (e) {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (customerId) {
      fetchCustomerDetail();
    }
  }, [customerId]);

  const toggleStatus = async () => {
    if (!customer) return;
    const nextStatus = customer.account_status === 'active' ? 'suspended' : 'active';

    try {
      const res = await fetch(`/api/admin/customers/${customer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_status: nextStatus }),
      });

      if (res.ok) {
        setCustomer((prev: any) => ({ ...prev, account_status: nextStatus }));
      }
    } catch (e) {}
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-400">
        Müşteri detayları yükleniyor...
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
        <h3 className="font-bold text-slate-900 text-sm">Müşteri Bulunamadı</h3>
        <Link
          href="/admin/musteriler"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Müşteri Listesine Dön</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Link
          href="/admin/musteriler"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Müşteri Listesine Dön</span>
        </Link>

        <button
          onClick={toggleStatus}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            customer.account_status === 'active'
              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
          }`}
        >
          <Ban className="w-3.5 h-3.5" />
          <span>{customer.account_status === 'active' ? 'Hesabı Askıya Al' : 'Hesabı Aktifleştir'}</span>
        </button>
      </div>

      {/* Customer Info Hero */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-900 to-indigo-800 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-md uppercase">
              {customer.first_name?.[0] || 'M'}{customer.last_name?.[0] || ''}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-slate-900">{customer.full_name}</h1>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                  customer.account_status === 'active'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  {customer.account_status === 'active' ? 'Aktif Hesap' : 'Askıda'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">Müşteri ID: {customer.id}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 font-bold block">Toplam Sipariş</span>
              <span className="font-black text-slate-900 text-sm">{customer.orders_count} Adet</span>
            </div>
            <div className="border-l border-slate-200 pl-4">
              <span className="text-[10px] text-slate-400 font-bold block">Toplam Harcama</span>
              <span className="font-black text-blue-900 text-sm">{customer.total_spent?.toLocaleString('tr-TR')} TL</span>
            </div>
          </div>
        </div>

        {/* 3 Columns Data: Contact, Consents, Timestamps */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1.5">
            <h4 className="font-black text-slate-900 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-blue-600" />
              İletişim Bilgileri
            </h4>
            <p className="text-slate-700 font-medium">{customer.email}</p>
            <p className="text-slate-500">{customer.phone || 'Telefon belirtilmemiş'}</p>
            <div className="pt-1">
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${
                customer.email_verified ? 'text-emerald-700' : 'text-amber-600'
              }`}>
                {customer.email_verified ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                {customer.email_verified ? 'E-Posta Doğrulandı' : 'Doğrulanmamış E-Posta'}
              </span>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1.5">
            <h4 className="font-black text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              KVKK & İletişim İzinleri
            </h4>
            <p className="text-slate-600">
              KVKK Onayı: <strong className="text-slate-900">{customer.kvkk_consent ? 'Kabul Edildi' : 'Yok'}</strong>
            </p>
            <p className="text-slate-600">
              Ticari SMS / E-posta: <strong className="text-slate-900">{customer.marketing_consent ? 'İzin Verildi' : 'İzinsiz'}</strong>
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1.5">
            <h4 className="font-black text-slate-900 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              Tarihçe
            </h4>
            <p className="text-slate-600">
              Kayıt: <strong>{new Date(customer.created_at).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })}</strong>
            </p>
            <p className="text-slate-600">
              Son Giriş: <strong>{customer.last_login_at ? new Date(customer.last_login_at).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-'}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
        <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-blue-600" />
          Müşterinin Siparişleri ({orders.length})
        </h3>

        {orders.length === 0 ? (
          <p className="text-xs text-slate-400 py-4">Bu müşteriye ait sipariş bulunamadı.</p>
        ) : (
          <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden text-xs">
            {orders.map((ord) => (
              <div key={ord.id} className="p-4 hover:bg-slate-50 transition flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-900">#{ord.order_number || ord.id}</span>
                    <span className="px-2 py-0.2 bg-slate-100 text-slate-700 font-bold text-[10px] rounded-full">
                      {ord.status || 'Siparis_Alindi'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {new Date(ord.created_at).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                </div>

                <div className="text-right">
                  <span className="font-black text-blue-900 text-sm">
                    {Number(ord.final_amount || ord.total_amount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Registered Addresses */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
          <MapPin className="w-4 h-4 text-emerald-600" />
          Kayıtlı Adresler ({addresses.length})
        </h3>

        {addresses.length === 0 ? (
          <p className="text-xs text-slate-400 py-4">Müşterinin kayıtlı adresi bulunmuyor.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {addresses.map((addr) => (
              <div key={addr.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-slate-900">{addr.title} ({addr.first_name} {addr.last_name})</p>
                  {Boolean(addr.is_default_shipping) && (
                    <span className="text-[10px] bg-blue-50 text-blue-900 font-bold px-2 py-0.5 rounded-full">
                      Varsayılan Teslimat
                    </span>
                  )}
                </div>
                <p className="text-slate-600">{addr.full_address}</p>
                <p className="text-slate-500 font-semibold">{addr.district} / {addr.city}</p>
                <p className="text-slate-500">Tel: {addr.phone}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
