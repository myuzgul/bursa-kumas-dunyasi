'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  User, 
  Package, 
  MapPin, 
  Heart, 
  Ticket, 
  Star, 
  Bell, 
  ShieldCheck, 
  LogOut, 
  ChevronRight, 
  Mail, 
  AlertTriangle,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '@/components/storefront/UserContext';

const NAV_ITEMS = [
  { href: '/hesabim', label: 'Genel Bakış', icon: User, exact: true },
  { href: '/hesabim/siparisler', label: 'Siparişlerim', icon: Package },
  { href: '/hesabim/adresler', label: 'Adreslerim', icon: MapPin },
  { href: '/hesabim/favoriler', label: 'Favorilerim', icon: Heart },
  { href: '/hesabim/kuponlar', label: 'Kuponlarım', icon: Ticket },
  { href: '/hesabim/degerlendirmelerim', label: 'Değerlendirmelerim', icon: Star },
  { href: '/hesabim/profil', label: 'Profil Bilgilerim', icon: User },
  { href: '/hesabim/bildirimler', label: 'Bildirimler', icon: Bell, badgeKey: 'unread_notifications_count' },
  { href: '/hesabim/guvenlik', label: 'Güvenlik ve Cihazlar', icon: ShieldCheck },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, isAuthenticated, logout, refreshUser } = useAuth();

  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<{ msg: string; error?: boolean } | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/auth/giris?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, isAuthenticated, router, pathname]);

  const handleResendVerification = async () => {
    setResending(true);
    setResendStatus(null);
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (res.ok) {
        setResendStatus({ msg: data.message || 'Doğrulama e-postası gönderildi.' });
      } else {
        setResendStatus({ msg: data.error || 'İşlem başarısız.', error: true });
      }
    } catch (e: any) {
      setResendStatus({ msg: 'Bağlantı hatası.', error: true });
    } finally {
      setResending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-blue-900 animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Hesap bilgileri yükleniyor...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Unverified Email Warning Banner */}
      {!user.email_verified && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 text-amber-800">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-600" />
            <div>
              <p className="font-bold">E-posta adresiniz henüz doğrulanmadı</p>
              <p className="text-[11px] text-amber-700">
                Hesap güvenliğiniz ve sipariş bildirimlerini sorunsuz alabilmeniz için lütfen <strong>{user.email}</strong> adresini doğrulayınız.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {resendStatus && (
              <span className={`text-[11px] font-bold ${resendStatus.error ? 'text-red-600' : 'text-emerald-700'}`}>
                {resendStatus.msg}
              </span>
            )}
            <button
              onClick={handleResendVerification}
              disabled={resending}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-[11px] rounded-lg shadow-sm transition whitespace-nowrap"
            >
              {resending ? 'Gönderiliyor...' : 'Doğrulama E-postası Gönder'}
            </button>
          </div>
        </div>
      )}

      {/* Account Header Hero */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-900 to-indigo-800 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-md uppercase">
            {user.first_name?.[0] || 'M'}{user.last_name?.[0] || ''}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-slate-900">
                {user.full_name || `${user.first_name} ${user.last_name}`}
              </h1>
              {user.email_verified ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold rounded-full">
                  <CheckCircle2 className="w-3 h-3" />
                  Doğrulanmış Müşteri
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold rounded-full">
                  Doğrulanmamış
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>{user.email}</span>
              {user.phone && (
                <>
                  <span className="text-slate-300">•</span>
                  <span>{user.phone}</span>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Link
            href="/katalog"
            className="flex-1 md:flex-none text-center px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-sm transition"
          >
            Alışverişe Devam Et
          </Link>
          <button
            onClick={logout}
            className="px-3.5 py-2 bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition flex items-center gap-1.5"
            title="Güvenli Çıkış"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Çıkış</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Sidebar + Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Sidebar Nav */}
        <aside className="lg:col-span-3 bg-white border border-slate-200 rounded-3xl p-3 shadow-sm space-y-1">
          <nav className="flex lg:flex-col overflow-x-auto lg:overflow-visible gap-1 pb-1 lg:pb-0 scrollbar-none">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);

              const badgeCount = item.badgeKey ? (user as any)[item.badgeKey] : 0;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex-shrink-0 ${
                    isActive
                      ? 'bg-blue-900 text-white shadow-sm'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {badgeCount > 0 && (
                    <span className={`px-1.5 py-0.2 text-[10px] font-black rounded-full ${
                      isActive ? 'bg-white text-blue-900' : 'bg-red-600 text-white'
                    }`}>
                      {badgeCount}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-3.5 h-3.5 hidden lg:block" />}
                </Link>
              );
            })}

            <button
              onClick={logout}
              className="flex lg:w-full items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition whitespace-nowrap flex-shrink-0 text-left"
            >
              <LogOut className="w-4 h-4" />
              <span>Oturumu Kapat</span>
            </button>
          </nav>
        </aside>

        {/* Content Body */}
        <main className="lg:col-span-9 space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
