import React from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, ShoppingCart, Package, BarChart3, 
  Percent, Sliders, FileText, Bell, ExternalLink, ShieldAlert, Users, Layers, Award, MessageSquare, Truck, CreditCard, Sparkles, Receipt
} from 'lucide-react';
import { BrandLogo } from '@/components/ui/BrandLogo';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-slate-100 text-slate-900 font-sans">
      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-950 text-slate-300 flex flex-col justify-between flex-shrink-0 hidden md:flex border-r border-slate-800">
        <div>
          {/* Logo & Portal Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <Link href="/admin" className="flex items-center gap-2.5 group">
              <BrandLogo variant="icon-only" size="sm" href="" />
              <div>
                <div className="font-extrabold text-xs text-white leading-tight">
                  BURSA KUMAŞ DÜNYASI
                </div>
                <div className="text-[10px] text-amber-400 font-semibold font-mono">
                  Yönetim Paneli
                </div>
              </div>
            </Link>
          </div>

          {/* Navigation Links (Alphabetical Order except Dashboard) */}
          <nav className="p-3 space-y-1 text-xs font-semibold">
            {/* 1. Dashboard (Özet) - En Üstte */}
            <Link
              href="/admin"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-900 hover:text-white transition text-slate-300"
            >
              <LayoutDashboard className="w-4 h-4 text-blue-400" />
              <span>Dashboard (Özet)</span>
            </Link>

            {/* A - Ana Sayfa Vitrini */}
            <Link
              href="/admin/vitrin"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-900 hover:text-white transition text-slate-300"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Ana Sayfa Vitrini</span>
            </Link>

            {/* H - Hikayeler (Stories) */}
            <Link
              href="/admin/hikayeler"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-900 hover:text-white transition text-slate-300"
            >
              <Sparkles className="w-4 h-4 text-pink-400" />
              <span>Hikayeler (Stories)</span>
            </Link>

            {/* K - Kargo & Teslimat Ayarları */}
            <Link
              href="/admin/kargo-ayarlari"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-900 hover:text-white transition text-slate-300"
            >
              <Truck className="w-4 h-4 text-blue-400" />
              <span>Kargo & Teslimat Ayarları</span>
            </Link>

            {/* K - Kategori & Menü Yönetimi */}
            <Link
              href="/admin/kategoriler"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-900 hover:text-white transition text-slate-300"
            >
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Kategori & Menü Yönetimi</span>
            </Link>

            {/* K - Kumaşlar & Varyasyonlar */}
            <Link
              href="/admin/urunler"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-900 hover:text-white transition text-slate-300"
            >
              <Package className="w-4 h-4 text-amber-400" />
              <span>Kumaşlar & Varyasyonlar</span>
            </Link>

            {/* K - Kuponlar & İndirimler */}
            <Link
              href="/admin/kuponlar"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-900 hover:text-white transition text-slate-300"
            >
              <Percent className="w-4 h-4 text-rose-400" />
              <span>Kuponlar & İndirimler</span>
            </Link>

            {/* M - Metre Satış Raporları */}
            <Link
              href="/admin/raporlar"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-900 hover:text-white transition text-slate-300"
            >
              <BarChart3 className="w-4 h-4 text-purple-400" />
              <span>Metre Satış Raporları</span>
            </Link>

            {/* M - Müşteri Yönetimi */}
            <Link
              href="/admin/musteriler"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-900 hover:text-white transition text-slate-300"
            >
              <Users className="w-4 h-4 text-teal-400" />
              <span>Müşteri Yönetimi</span>
            </Link>

            {/* M - Müşteri Yorumları & Onay */}
            <Link
              href="/admin/yorumlar"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-900 hover:text-white transition text-slate-300"
            >
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span>Müşteri Yorumları & Onay</span>
            </Link>

            {/* Ö - Ödeme Yöntemleri & PayTR */}
            <Link
              href="/admin/odeme-ayarlari"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-900 hover:text-white transition text-slate-300"
            >
              <CreditCard className="w-4 h-4 text-amber-400" />
              <span>Ödeme Yöntemleri & PayTR</span>
            </Link>

            {/* P - Park Bulut E-Fatura */}
            <Link
              href="/admin/fatura-ayarlari"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-900 hover:text-white transition text-slate-300"
            >
              <Receipt className="w-4 h-4 text-emerald-400" />
              <span>Park Bulut E-Fatura</span>
            </Link>

            {/* R - Reklam & CAPI İzleme */}
            <Link
              href="/admin/tracking"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-900 hover:text-white transition text-slate-300"
            >
              <FileText className="w-4 h-4 text-blue-400" />
              <span>Reklam & CAPI İzleme</span>
            </Link>

            {/* R - Rozet Yönetimi */}
            <Link
              href="/admin/rozetler"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-900 hover:text-white transition text-slate-300"
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>Rozet Yönetimi</span>
            </Link>

            {/* S - Siparişler & Kesim Fişi */}
            <Link
              href="/admin/siparisler"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-900 hover:text-white transition text-slate-300"
            >
              <ShoppingCart className="w-4 h-4 text-emerald-400" />
              <span>Siparişler & Kesim Fişi</span>
            </Link>

            {/* S - Sistem & Audit Logları */}
            <Link
              href="/admin/audit-logs"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-900 hover:text-white transition text-slate-300"
            >
              <ShieldAlert className="w-4 h-4 text-orange-400" />
              <span>Sistem & Audit Logları</span>
            </Link>

            {/* T - Toplu Fiyat Güncelleme */}
            <Link
              href="/admin/toplu-guncelleme"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-900 hover:text-white transition text-slate-300"
            >
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>Toplu Fiyat Güncelleme</span>
            </Link>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-3 py-2 bg-slate-900 hover:bg-slate-800 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
              <span>Mağazayı Görüntüle</span>
            </span>
            <span className="text-[10px] bg-blue-900/60 text-blue-300 px-1.5 py-0.5 rounded">
              Canlı
            </span>
          </Link>

          <div className="flex items-center gap-2.5 px-2">
            <div className="w-8 h-8 rounded-full bg-blue-700 text-white font-bold text-xs flex items-center justify-center">
              AD
            </div>
            <div className="text-[11px] leading-tight">
              <div className="font-bold text-white">Yönetici Paneli</div>
              <div className="text-slate-500">Super Admin (RBAC)</div>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Bursa Kumaş Dünyası
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-bold text-slate-900">
              Yönetim & Satış Konsolu
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Sistem Aktif (PayTR / DHL (MNG) / Park Bulut)</span>
            </div>
          </div>
        </header>

        {/* Page Body */}
        <main className="p-6 sm:p-8 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
