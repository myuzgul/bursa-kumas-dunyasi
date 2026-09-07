import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { dbRepo } from '@/lib/db/repo';
import { ProductDetailClient } from '@/components/storefront/ProductDetailClient';
import { getProductSchema, getBreadcrumbSchema } from '@/lib/utils/seo';

interface ProductPageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const db = dbRepo.read();
  const product = db.products?.find((p: any) => p.slug === params.slug && p.is_active === 1);
  if (!product) return {};

  return {
    title: `${product.name} - Metre Fiyatı | Bursa Kumaş Dünyası`,
    description: product.short_description || product.description?.substring(0, 160),
    openGraph: {
      title: product.name,
      description: product.short_description,
      images: [{ url: product.main_image_url }],
    },
  };
}

export default function ProductPage({ params }: ProductPageProps) {
  const db = dbRepo.read();
  const product = db.products?.find((p: any) => p.slug === params.slug && p.is_active === 1);

  if (!product) {
    notFound();
  }

  const category = db.categories?.find((c: any) => c.id === product.category_id);
  const variants = db.product_variants?.filter((v: any) => v.product_id === product.id && v.is_active === 1) || [];
  const dbImages = db.product_images?.filter((i: any) => i.product_id === product.id) || [];
  const reviews = db.reviews?.filter((r: any) => r.product_id === product.id && r.is_approved === 1) || [];
  
  // 4 Random active products (excluding current product)
  const otherProducts = db.products?.filter((p: any) => p.id !== product.id && p.is_active === 1) || [];
  const shuffledProducts = [...otherProducts].sort(() => 0.5 - Math.random());
  const relatedProducts = shuffledProducts.slice(0, 4);

  // Compile all images from product.images (array), db.product_images, and main_image_url
  let allImages: Array<{ id: string; image_url: string; alt_text?: string }> = [];
  if (Array.isArray(product.images) && product.images.length > 0) {
    allImages = product.images.map((img: any, idx: number) => ({
      id: typeof img === 'object' && img.id ? img.id : `img-${idx}`,
      image_url: typeof img === 'object' ? (img.image_url || img.url) : String(img),
      alt_text: product.name,
    }));
  } else if (dbImages.length > 0) {
    allImages = dbImages.map((img: any, idx: number) => ({
      id: img.id || `img-${idx}`,
      image_url: img.image_url || img.url || String(img),
      alt_text: img.alt_text || product.name,
    }));
  } else if (product.main_image_url) {
    allImages = [{ id: 'main', image_url: product.main_image_url, alt_text: product.name }];
  }

  const productSchema = getProductSchema(product, reviews);
  const breadcrumbs = [
    { name: 'Anasayfa', url: '/' },
    { name: category ? category.name : 'Kumaşlar', url: category ? `/kategori/${category.slug}` : '/kategori/tum-kumaslar' },
    { name: product.name, url: `/urun/${product.slug}` },
  ];
  const breadcrumbSchema = getBreadcrumbSchema(breadcrumbs);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Schema.org Product & Breadcrumb JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <ProductDetailClient
        product={product}
        category={category}
        variants={variants}
        images={allImages}
        reviews={reviews}
        relatedProducts={relatedProducts}
      />
    </div>
  );
}
