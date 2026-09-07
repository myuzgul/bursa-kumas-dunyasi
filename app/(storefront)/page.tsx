import React from 'react';
import Link from 'next/link';
import { dbRepo } from '@/lib/db/repo';
import { ProductCard } from '@/components/storefront/ProductCard';
import { HomepageShowcase } from '@/components/storefront/HomepageShowcase';
import { StoriesBar } from '@/components/storefront/StoriesBar';
import { getShowcaseData } from '@/lib/services/showcaseSettings';
import { getActiveStories } from '@/lib/services/stories';
import { 
  ArrowRight, ShieldCheck, Award, Sparkles, CheckCircle2, 
  Truck, Star, BookOpen, Layers, Scissors, HeartHandshake
} from 'lucide-react';
import { getOrganizationSchema } from '@/lib/utils/seo';

export const revalidate = 60; // ISR cache revalidation

export default function HomePage() {
  const db = dbRepo.read();
  const showcaseData = getShowcaseData();
  const activeStories = getActiveStories();
  const banners = db.homepage_banners?.filter((b: any) => b.is_active === 1) || [];
  const categories = (db.categories?.filter((c: any) => c.is_active === 1 && c.is_featured_home === 1) || [])
    .sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0))
    .slice(0, 6);
  const reviews = (db.reviews?.filter((r: any) => r.is_approved === 1) || [])
    .sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
    .slice(0, 6);
  const blogPosts = db.blog_posts?.filter((b: any) => b.is_published === 1).slice(0, 3) || [];

  const mainBanner = banners[0] || {
    title: 'İlham Veren Kumaşlar: Viskon, Krep ve Ayrobin Koleksiyonu',
    subtitle: 'Gömlek, ceket ve şık kışlık tasarımlarınız için tok ve yumuşak dokulu oduncu kumaşlar uygun parça fiyatlarıyla sizi bekliyor.',
    image_url: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1600&q=85',
    link_url: '/kategori/tum-kumaslar',
    button_text: 'Ürünleri İnceleyin'
  };

  const orgSchema = getOrganizationSchema();

  return (
    <div className="pb-16">
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
      />

      {/* 0. INSTAGRAM STORIES BAR */}
      <StoriesBar initialStories={activeStories} />

      <div className="space-y-10 mt-3 sm:mt-4">
        {/* 1. HERO BANNER SECTION */}
        <section className="relative bg-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1600&q=85"
            alt="İlham Veren Kumaşlar: Viskon, Krep ve Ayrobin Koleksiyonu"
            className="w-full h-full object-cover opacity-35 filter brightness-90"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 py-16 sm:py-24 lg:py-32 flex flex-col justify-center min-h-[500px]">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-600/30 border border-blue-400/40 text-blue-300 text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>KUMAŞIN BAŞKENTİ BURSA&apos;DAN DOĞRUDAN KAPINIZA</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white">
              İlham Veren Kumaşlar: Viskon, Krep ve Ayrobin Koleksiyonu
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
              Gömlek, ceket ve şık kışlık tasarımlarınız için tok ve yumuşak dokulu oduncu kumaşlar uygun parça fiyatlarıyla sizi bekliyor.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/kategori/tum-kumaslar"
                className="px-7 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition transform active:scale-95"
              >
                <span>Ürünleri İnceleyin</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. POPULAR CATEGORIES GRID */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-2">
          <div>
            <div className="text-xs font-bold text-blue-900 uppercase tracking-wider">
              Kumaş Koleksiyonları
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              Popüler Kumaş Kategorileri
            </h2>
          </div>
          <Link
            href="/kategori/tum-kumaslar"
            className="text-xs font-bold text-blue-900 hover:text-blue-700 flex items-center gap-1 transition"
          >
            <span>Tüm Kategorileri Gör</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {categories.map((cat: any) => (
            <Link
              key={cat.id}
              href={`/kategori/${cat.slug}`}
              className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md hover:border-slate-300 transition text-center p-3 flex flex-col items-center"
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-slate-100 mb-3 border-2 border-slate-100 group-hover:border-blue-900 group-hover:scale-105 transition duration-300">
                <img
                  src={cat.image_url}
                  alt={cat.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xs font-bold text-slate-900 group-hover:text-blue-900 transition line-clamp-1">
                {cat.name}
              </h3>
              <span className="text-[10px] text-slate-500 mt-0.5">
                Metre Satışı
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. FEATURED PRODUCTS SHOWCASE (ÖNE ÇIKAN VİTRİN KUMAŞLARI) */}
      <HomepageShowcase
        initialProducts={showcaseData.products}
        categories={showcaseData.categories}
        settings={showcaseData.settings}
      />



      {/* 5. WHY BURSA KUMAŞ DÜNYASI (AVANTAJLAR VE KALİTE STANDARTLARI) */}
      <section className="bg-slate-100 py-12 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              Neden Bursa Kumaş Dünyası?
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Geleneksel Bursa dokuma tecrübesini modern e-ticaret teknolojisi ve garantili metre kesimiyle buluşturuyoruz.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center">
                <Scissors className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">
                0.5m Hassas Metraj & Kesim Masası
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                İhtiyacınız kadar alın, kumaş israfını önleyin. Özel kesim masalarımızda hassas şekilde ölçülerek tek parça halinde özenle sevk edilir.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-900 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">
                Leke Tutmaz & Pet-Friendly Dokuma
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Su itici nano apre ve 60.000 Martindale aşınma testli kumaşlarımız; çocuklu ve evcil hayvanlı aileler için uzun yıllar dayanıklılık sağlar.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-900 flex items-center justify-center">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">
                Aynı Gün DHL Kargo (MNG Kargo) Sevk
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Hafta içi 14:00&apos;e kadar verilen siparişler aynı gün kesilip özel ambalajında kargoya teslim edilir. Anlık SMS ve e-posta ile takip edilir.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. VERIFIED REVIEWS */}
      {reviews.length > 0 && (
        <section className="max-w-7xl mx-auto px-4">
          <div className="text-center max-w-lg mx-auto mb-8">
            <div className="text-xs font-bold text-blue-900 uppercase tracking-wider">
              Müşteri Memnuniyeti
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              Gerçek Müşteri Deneyimleri
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {reviews.map((r: any) => {
              const product = db.products?.find((p: any) => p.id === r.product_id);

              return (
                <div
                  key={r.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex text-amber-400">
                        {[...Array(r.rating || 5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-amber-400" />
                        ))}
                      </div>
                      {r.is_verified_purchase === 1 && (
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Doğrulanmış Sipariş
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed italic">
                      &ldquo;{r.comment}&rdquo;
                    </p>
                  </div>

                  <div className="space-y-2.5 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900">{r.customer_name}</span>
                      <span className="text-[11px] text-slate-400">Bursa Kumaş Dünyası Müşterisi</span>
                    </div>

                    {/* Clickable Product Link on Bottom Right */}
                    {product && (
                      <Link
                        href={`/urun/${product.slug}`}
                        className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200/80 hover:border-blue-300 transition group"
                        title={`${product.name} ürününü incele`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={product.main_image_url}
                            alt={product.name}
                            className="w-8 h-8 rounded-lg object-cover border border-slate-200 flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="text-[10px] text-slate-400 font-medium">İlgili Kumaş:</div>
                            <div className="text-xs font-bold text-slate-900 group-hover:text-blue-950 truncate">
                              {product.name}
                            </div>
                          </div>
                        </div>
                        <span className="text-[11px] font-black text-blue-900 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 flex-shrink-0 whitespace-nowrap bg-white group-hover:bg-blue-100/60 px-2 py-1 rounded-lg border border-slate-200/80 group-hover:border-blue-200">
                          <span>Ürüne Git</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 7. BLOG & SEO GUIDES */}
      {blogPosts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-2">
            <div>
              <div className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                Tekstil & Dekorasyon
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Kumaş Rehberi & Blog
              </h2>
            </div>
            <Link
              href="/blog"
              className="text-xs font-bold text-blue-900 hover:text-blue-700 flex items-center gap-1 transition"
            >
              <span>Tüm Yazıları Oku</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogPosts.map((post: any) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition flex flex-col"
              >
                <div className="aspect-[16/9] overflow-hidden bg-slate-100">
                  <img
                    src={post.cover_image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded">
                      {post.category}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-900 transition mt-2 line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                      {post.summary}
                    </p>
                  </div>
                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span>{post.author}</span>
                    <span className="text-blue-900 font-bold group-hover:underline flex items-center gap-0.5">
                      Devamını Oku →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
      </div>
    </div>
  );
}
