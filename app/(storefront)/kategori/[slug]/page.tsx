import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { dbRepo } from '@/lib/db/repo';
import { ProductCard } from '@/components/storefront/ProductCard';
import { CategoryFilterSidebar } from '@/components/storefront/CategoryFilterSidebar';
import { CategorySortSelect } from '@/components/storefront/CategorySortSelect';
import { getBreadcrumbSchema } from '@/lib/utils/seo';
import { ChevronRight } from 'lucide-react';

interface CategoryPageProps {
  params: { slug: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const db = dbRepo.read();
  const slug = params.slug;

  let currentCategory: any = null;
  let products: any[] = [];

  if (slug === 'tum-kumaslar') {
    currentCategory = {
      name: 'Tüm Kumaş Çeşitleri',
      description: 'Bursa Kumaş Dünyası geniş kumaş kataloğu. Viskon, oduncu, keten, tensel, ayrobin, krep, modal ve müslin kumaşları metre bazında satın alın.',
      slug: 'tum-kumaslar',
    };
    products = db.products?.filter((p: any) => p.is_active === 1) || [];
  } else {
    currentCategory = db.categories?.find((c: any) => c.slug === slug);
    if (!currentCategory) {
      notFound();
    }
    // Get direct products or child category products
    const childCatIds = db.categories
      ?.filter((c: any) => c.parent_id === currentCategory.id)
      .map((c: any) => c.id) || [];
    const validCatIds = [currentCategory.id, ...childCatIds];

    products = db.products?.filter((p: any) => {
      if (p.is_active !== 1) return false;
      const pCatIds = Array.isArray(p.category_ids) && p.category_ids.length > 0
        ? p.category_ids
        : (p.category_id ? [p.category_id] : []);
      return validCatIds.some((id) => pCatIds.includes(id));
    }) || [];
  }

  // Handle Search Query if any
  const searchQuery = typeof searchParams.q === 'string' ? searchParams.q.toLowerCase() : '';
  if (searchQuery) {
    products = products.filter(
      (p: any) =>
        p.name.toLowerCase().includes(searchQuery) ||
        p.sku.toLowerCase().includes(searchQuery) ||
        (p.short_description && p.short_description.toLowerCase().includes(searchQuery))
    );
  }

  // Handle Price Filter
  const minPrice = typeof searchParams.min_price === 'string' ? searchParams.min_price : '';
  const maxPrice = typeof searchParams.max_price === 'string' ? searchParams.max_price : '';

  if (minPrice && !isNaN(Number(minPrice))) {
    const minVal = Number(minPrice);
    products = products.filter((p: any) => {
      const effectivePrice = Number(p.discount_price || p.base_price) || 0;
      return effectivePrice >= minVal;
    });
  }

  if (maxPrice && !isNaN(Number(maxPrice))) {
    const maxVal = Number(maxPrice);
    products = products.filter((p: any) => {
      const effectivePrice = Number(p.discount_price || p.base_price) || 0;
      return effectivePrice <= maxVal;
    });
  }

  // Handle Sorting
  const sort = typeof searchParams.sort === 'string' ? searchParams.sort : 'recommended';
  if (sort === 'price_asc') {
    products.sort((a: any, b: any) => (a.discount_price || a.base_price) - (b.discount_price || b.base_price));
  } else if (sort === 'price_desc') {
    products.sort((a: any, b: any) => (b.discount_price || b.base_price) - (a.discount_price || a.base_price));
  } else if (sort === 'newest') {
    products.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  // Categories with counts for sidebar
  const allCategories = (db.categories || [])
    .filter((c: any) => c.is_active === 1 || c.is_active === undefined)
    .map((c: any) => {
      const childIds = (db.categories || [])
        .filter((child: any) => child.parent_id === c.id)
        .map((child: any) => child.id);
      const catIds = [c.id, ...childIds];
      const count = (db.products || []).filter((p: any) => {
        if (p.is_active !== 1) return false;
        const pCatIds = Array.isArray(p.category_ids) && p.category_ids.length > 0
          ? p.category_ids
          : (p.category_id ? [p.category_id] : []);
        return catIds.some((id) => pCatIds.includes(id));
      }).length;
      return {
        id: c.id,
        name: c.name,
        slug: c.slug,
        productCount: count,
      };
    });

  const breadcrumbs = [
    { name: 'Anasayfa', url: '/' },
    { name: 'Kategoriler', url: '/kategori/tum-kumaslar' },
    { name: currentCategory.name, url: `/kategori/${currentCategory.slug}` },
  ];

  const breadcrumbSchema = getBreadcrumbSchema(breadcrumbs);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Schema.org Breadcrumbs */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500">
        <Link href="/" className="hover:text-blue-900 transition">Anasayfa</Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <Link href="/kategori/tum-kumaslar" className="hover:text-blue-900 transition">Kumaşlar</Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="font-bold text-slate-900">{currentCategory.name}</span>
      </nav>

      {/* Category Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
          {currentCategory.name}
        </h1>
        {currentCategory.description && (
          <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-3xl leading-relaxed">
            {currentCategory.description}
          </p>
        )}
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Filters */}
        <div className="lg:col-span-1">
          <CategoryFilterSidebar
            categories={allCategories}
            currentSlug={slug}
            minPrice={minPrice}
            maxPrice={maxPrice}
          />
        </div>

        {/* Product Grid */}
        <main className="lg:col-span-3 space-y-4">
          {/* Sorting Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
            <div className="text-slate-600">
              Toplam <span className="font-bold text-slate-900">{products.length}</span> kumaş modeli listeleniyor
              {(minPrice || maxPrice) && (
                <span className="ml-2 text-blue-900 font-semibold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                  (Filtrelendi: {minPrice ? `${minPrice} TL` : '0 TL'} - {maxPrice ? `${maxPrice} TL` : 'Sınırsız'})
                </span>
              )}
            </div>

            <CategorySortSelect currentSort={sort} />
          </div>

          {/* Grid */}
          {products.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <div className="text-lg font-bold text-slate-800">
                Aradığınız Kriterde Kumaş Bulunamadı
              </div>
              <p className="text-xs text-slate-500">
                Filtreleri temizleyebilir veya diğer kategorilerimize göz atabilirsiniz.
              </p>
              <Link
                href="/kategori/tum-kumaslar"
                className="inline-block px-5 py-2.5 bg-blue-900 text-white text-xs font-bold rounded-xl"
              >
                Tüm Kumaşları İncele
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
              {products.map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
