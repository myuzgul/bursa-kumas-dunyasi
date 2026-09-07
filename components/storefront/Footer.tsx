'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, Truck, CreditCard, RotateCcw, 
  MapPin, Phone, Mail, Award, CheckCircle2, ArrowRight 
} from 'lucide-react';
import { BrandLogo } from '@/components/ui/BrandLogo';

export const Footer: React.FC = () => {
  const [categories, setCategories] = useState<Array<{ id: string; name: string; slug: string }>>([
    { id: 'cat-1', name: 'Viskon Kumaşlar', slug: 'viskon-kumaslar' },
    { id: 'cat-2', name: 'Keten Kumaşlar', slug: 'keten-kumaslar' },
    { id: 'cat-3', name: 'Tensel & Modal', slug: 'tensel-modal-kumaslar' },
    { id: 'cat-4', name: 'Ayrobin & Krep', slug: 'ayrobin-krep-kumaslar' },
    { id: 'cat-5', name: 'Oduncu Kumaşlar', slug: 'oduncu-kumaslar' },
  ]);

  useEffect(() => {
    fetch('/api/admin/categories', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.categories && data.categories.length > 0) {
          const activeCats = data.categories
            .filter((c: any) => c.is_active === 1 || c.is_active === undefined)
            .sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0))
            .slice(0, 5);
          if (activeCats.length > 0) {
            setCategories(activeCats);
          }
        }
      })
      .catch(() => {});
  }, []);
  return (
    <footer className="bg-slate-950 text-slate-300 pt-12 pb-8 border-t border-slate-800">
      {/* 1. VALUE PROPOSITIONS STRIP */}
      <div className="max-w-7xl mx-auto px-4 pb-12 border-b border-slate-800">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-900/50 border border-slate-800/80">
            <div className="w-11 h-11 rounded-xl bg-blue-600/10 text-blue-400 flex items-center justify-center flex-shrink-0 border border-blue-500/20">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold text-white text-sm leading-snug">Doğrudan Üreticiden</div>
              <div className="text-xs text-slate-400">Bursa dokuma tezgahı kalitesi</div>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-900/50 border border-slate-800/80">
            <div className="w-11 h-11 rounded-xl bg-emerald-600/10 text-emerald-400 flex items-center justify-center flex-shrink-0 border border-emerald-500/20">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold text-white text-sm leading-snug">0.5m Metre Kesim</div>
              <div className="text-xs text-slate-400">İstediğiniz ölçüde net kesim</div>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-900/50 border border-slate-800/80">
            <div className="w-11 h-11 rounded-xl bg-amber-600/10 text-amber-400 flex items-center justify-center flex-shrink-0 border border-amber-500/20">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold text-white text-sm leading-snug">Hızlı DHL (MNG) Kargo</div>
              <div className="text-xs text-slate-400">Tüm Türkiye&apos;ye kargo imkanı</div>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-900/50 border border-slate-800/80">
            <div className="w-11 h-11 rounded-xl bg-purple-600/10 text-purple-400 flex items-center justify-center flex-shrink-0 border border-purple-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold text-white text-sm leading-snug">PayTR 256-Bit SSL</div>
              <div className="text-xs text-slate-400">%100 Güvenli kartlı ödeme</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. FOOTER NAVIGATION LINKS */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Company Bio */}
          <div className="lg:col-span-2 space-y-4">
            <BrandLogo variant="light" size="md" />
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Türkiye&apos;nin tekstil başkenti Bursa&apos;dan viskon, oduncu, keten, tensel, ayrobin, krep, modal ve müslin kumaşları en uygun metre fiyatlarıyla kapınıza ulaştırıyoruz.
            </p>
            <div className="space-y-2 text-xs text-slate-300 pt-2">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <span>Anadolu, 2. Kanarya Sk. no:14/A, 16350 Yıldırım/Bursa</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <a href="tel:05423939816" className="hover:text-white transition">
                  0 (542) 393 98 16
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <a href="mailto:destek@bursakumasdunyasi.com" className="hover:text-white transition">
                  destek@bursakumasdunyasi.com
                </a>
              </div>
            </div>
          </div>

          {/* Kumaş Kategorileri */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 border-l-2 border-blue-500 pl-2">
              Kumaş Çeşitleri
            </h4>
            <ul className="space-y-2 text-xs">
              {categories.slice(0, 5).map((cat) => (
                <li key={cat.id}>
                  <Link href={`/kategori/${cat.slug}`} className="hover:text-white transition">
                    {cat.name}
                  </Link>
                </li>
              ))}
              <li className="pt-1">
                <Link
                  href="/kategori/tum-kumaslar"
                  className="text-blue-400 hover:text-blue-300 font-semibold transition inline-flex items-center gap-1"
                >
                  <span>Tüm Kumaşlar</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Müşteri Hizmetleri */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 border-l-2 border-blue-500 pl-2">
              Müşteri Hizmetleri
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/siparis-takip" className="hover:text-white transition flex items-center gap-1.5 text-blue-400 font-semibold">
                  <Truck className="w-3.5 h-3.5" />
                  <span>Sipariş & Kargo Takibi</span>
                </Link>
              </li>
              <li>
                <Link href="/kurumsal/kargo-ve-teslimat" className="hover:text-white transition">
                  Kargo & Teslimat Koşulları
                </Link>
              </li>
              <li>
                <Link href="/kurumsal/iade-ve-degisim" className="hover:text-white transition">
                  İade ve Metre Kesim Şartları
                </Link>
              </li>
              <li>
                <Link href="/blog/fon-perde-metre-hesabi-nasil-yapilir" className="hover:text-white transition">
                  Kumaş Metre Hesaplama Rehberi
                </Link>
              </li>
              <li>
                <Link href="/kurumsal/sss" className="hover:text-white transition">
                  Sıkça Sorulan Sorular (SSS)
                </Link>
              </li>
            </ul>
          </div>

          {/* Kurumsal & Yasal */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 border-l-2 border-blue-500 pl-2">
              Kurumsal & Yasal
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/kurumsal/hakkimizda" className="hover:text-white transition">
                  Hakkımızda & Fabrikamız
                </Link>
              </li>
              <li>
                <Link href="/kurumsal/kvkk-aydinlatma-metni" className="hover:text-white transition">
                  KVKK Aydınlatma Metni
                </Link>
              </li>
              <li>
                <Link href="/kurumsal/mesafeli-satis-sozlesmesi" className="hover:text-white transition">
                  Mesafeli Satış Sözleşmesi
                </Link>
              </li>
              <li>
                <Link href="/kurumsal/gizlilik-ve-cerez-politikasi" className="hover:text-white transition">
                  Gizlilik ve Çerez Politikası
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-amber-400 transition">
                  Yönetim Paneli
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* 3. COPYRIGHT & TRUST BADGES */}
      <div className="max-w-7xl mx-auto px-4 pt-8 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div>
          © {new Date().getFullYear()} Bursa Kumaş Dünyası (bursakumasdunyasi.com). Tüm hakları saklıdır.
        </div>

        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <span className="bg-slate-900 px-2.5 py-1 rounded border border-slate-800 font-medium">
            PayTR Altyapısı
          </span>
          <span className="bg-slate-900 px-2.5 py-1 rounded border border-slate-800 font-medium">
            DHL (MNG) Kargo
          </span>
          <span className="bg-slate-900 px-2.5 py-1 rounded border border-slate-800 font-medium">
            Park Bulut E-Fatura
          </span>
          <span className="bg-slate-900 px-2.5 py-1 rounded border border-slate-800 font-medium">
            256-Bit SSL
          </span>
        </div>
      </div>
    </footer>
  );
};
