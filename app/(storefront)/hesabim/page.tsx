'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Package, 
  MapPin, 
  Heart, 
  Ticket, 
  ArrowRight, 
  Clock, 
  Truck, 
  CheckCircle2, 
  ShoppingBag, 
  ChevronRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/components/storefront/UserContext';

export default function AccountOverviewPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOverviewData = async () => {
      try {
        const [ordersRes, addrRes, coupRes] = await Promise.all([
          fetch('/api/user/orders?limit=3'),
          fetch('/api/user/addresses'),
          fetch('/api/user/coupons'),
        ]);

        if (ordersRes.ok) {
          const d = await ordersRes.json();
          setOrders(d.orders || []);
        }
        if (addrRes.ok) {
          const d = await addrRes.json();
          setAddresses(d.addresses || []);
        }
        if (coupRes.ok) {
          const d = await coupRes.json();
          setCoupons(d.coupons || []);
        }
      } catch (e) {
        // Ignore
      } finally {
        setLoading(false);
      }
    };

    fetchOverviewData();
  }, []);

  const defaultShippingAddr = addresses.find((a) => a.is_default_shipping) || addresses[0];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Teslim Edildi
          </span>
        );
      case 'shipped':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Truck className="w-3 h-3" /> Kargoya Verildi
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" /> Hazırlanıyor
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            İptal Edildi
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <Clock className="w-3 h-3" /> Sipariş Alındı
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 4 Summary Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link
          href="/hesabim/siparisler"
          className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-blue-900 shadow-sm transition group"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center font-bold">
              <Package className="w-4 h-4" />
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-900 transition" />
          </div>
          <div className="mt-3">
            <p className="text-xl font-black text-slate-900">{user?.orders_count || orders.length}</p>
            <p className="text-[11px] font-bold text-slate-500">Toplam Siparişim</p>
          </div>
        </Link>

        <Link
          href="/hesabim/favoriler"
          className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-blue-900 shadow-sm transition group"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <Heart className="w-4 h-4" />
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-900 transition" />
          </div>
          <div className="mt-3">
            <p className="text-xl font-black text-slate-900">{user?.favorites_count || 0}</p>
            <p className="text-[11px] font-bold text-slate-500">Favori Kumaşlarım</p>
          </div>
        </Link>

        <Link
          href="/hesabim/kuponlar"
          className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-blue-900 shadow-sm transition group"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Ticket className="w-4 h-4" />
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-900 transition" />
          </div>
          <div className="mt-3">
            <p className="text-xl font-black text-slate-900">{coupons.filter(c => c.is_active).length}</p>
            <p className="text-[11px] font-bold text-slate-500">Aktif Kuponlarım</p>
          </div>
        </Link>

        <Link
          href="/hesabim/adresler"
          className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-blue-900 shadow-sm transition group"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <MapPin className="w-4 h-4" />
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-900 transition" />
          </div>
          <div className="mt-3">
            <p className="text-xl font-black text-slate-900">{addresses.length}</p>
            <p className="text-[11px] font-bold text-slate-500">Kayıtlı Adresim</p>
          </div>
        </Link>
      </div>

      {/* Recent Orders Section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black text-slate-900">Son Siparişlerim</h2>
            <p className="text-[11px] text-slate-500">En son verdiğiniz siparişlerin anlık durumu</p>
          </div>
          <Link
            href="/hesabim/siparisler"
            className="text-xs font-bold text-blue-900 hover:underline flex items-center gap-1"
          >
            <span>Tümünü Gör</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Siparişler yükleniyor...</div>
        ) : orders.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-800 text-sm">Henüz Bir Siparişiniz Yok</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Bursa Kumaş Dünyası'nın zengin kumaş koleksiyonunu hemen keşfedin.
            </p>
            <Link
              href="/katalog"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-900 text-white font-bold text-xs rounded-xl hover:bg-blue-800 transition"
            >
              Kumaşları Keşfet
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {orders.map((ord) => (
              <div key={ord.id} className="p-5 hover:bg-slate-50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-900 text-xs">#{ord.order_number || ord.id}</span>
                    {getStatusBadge(ord.status)}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Tarih: {new Date(ord.created_at).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })} • {ord.items?.length || 0} Ürün
                  </p>
                  <p className="text-xs font-black text-blue-900">
                    {Number(ord.total_amount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/hesabim/siparisler/${ord.id}`}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-blue-900 hover:text-white text-slate-800 font-bold text-xs rounded-xl border border-slate-200 transition"
                  >
                    Detay ve Takip
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Two Column Grid: Default Address & Quick Safety Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Default Shipping Address Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-900" />
              Varsayılan Teslimat Adresi
            </h3>
            <Link
              href="/hesabim/adresler"
              className="text-[11px] font-bold text-blue-900 hover:underline"
            >
              Yönet
            </Link>
          </div>

          {defaultShippingAddr ? (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1 text-xs">
              <p className="font-bold text-slate-900">{defaultShippingAddr.title} ({defaultShippingAddr.first_name} {defaultShippingAddr.last_name})</p>
              <p className="text-slate-600 leading-relaxed">{defaultShippingAddr.address_line1}</p>
              <p className="text-slate-500 font-medium">{defaultShippingAddr.district} / {defaultShippingAddr.city}</p>
              <p className="text-slate-500 font-medium">Tel: {defaultShippingAddr.phone}</p>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 rounded-2xl text-center space-y-2">
              <p className="text-xs text-slate-500">Kayıtlı teslimat adresiniz bulunmuyor.</p>
              <Link
                href="/hesabim/adresler"
                className="inline-block text-xs font-bold text-blue-900 hover:underline"
              >
                + Yeni Adres Ekle
              </Link>
            </div>
          )}
        </div>

        {/* Account Security Quick Widget */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Hesap ve Güvenlik Durumu
            </h3>
            <Link
              href="/hesabim/guvenlik"
              className="text-[11px] font-bold text-blue-900 hover:underline"
            >
              Ayarlar
            </Link>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">E-Posta Doğrulaması:</span>
              <span className={`font-bold ${user?.email_verified ? 'text-emerald-700' : 'text-amber-600'}`}>
                {user?.email_verified ? 'Doğrulandı' : 'Doğrulanmadı'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Şifre Koruması:</span>
              <span className="font-bold text-emerald-700">Aktif (PBKDF2/SHA-512)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Ticari İletişim İzni:</span>
              <span className="font-bold text-slate-800">
                {user?.marketing_consent ? 'Açık' : 'Kapalı'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
