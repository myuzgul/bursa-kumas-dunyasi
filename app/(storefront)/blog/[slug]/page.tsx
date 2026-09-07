import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { dbRepo } from '@/lib/db/repo';
import { getArticleSchema, getBreadcrumbSchema } from '@/lib/utils/seo';
import { ChevronRight, Calendar, User, ArrowLeft, Scissors, Truck } from 'lucide-react';

interface BlogPageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: BlogPageProps): Promise<Metadata> {
  const db = dbRepo.read();
  const post = db.blog_posts?.find((b: any) => b.slug === params.slug && b.is_published === 1);
  if (!post) return {};

  return {
    title: `${post.title} | Bursa Kumaş Dünyası Rehber`,
    description: post.summary || post.meta_description,
    openGraph: {
      title: post.title,
      description: post.summary,
      images: [{ url: post.cover_image }],
    },
  };
}

export default function BlogDetailPage({ params }: BlogPageProps) {
  const db = dbRepo.read();
  const post = db.blog_posts?.find((b: any) => b.slug === params.slug && b.is_published === 1);

  if (!post) {
    notFound();
  }

  const articleSchema = getArticleSchema(post);
  const breadcrumbs = [
    { name: 'Anasayfa', url: '/' },
    { name: 'Kumaş Rehberi', url: '/blog' },
    { name: post.title, url: `/blog/${post.slug}` },
  ];
  const breadcrumbSchema = getBreadcrumbSchema(breadcrumbs);

  return (
    <article className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Schema.org Article & Breadcrumbs */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500">
        <Link href="/" className="hover:text-blue-900 transition">Anasayfa</Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <Link href="/blog" className="hover:text-blue-900 transition">Kumaş Rehberi</Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="font-bold text-slate-900 truncate">{post.title}</span>
      </nav>

      {/* Main Card */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm p-6 sm:p-10 space-y-6">
        <div className="space-y-3">
          <span className="text-xs font-bold text-blue-900 bg-blue-50 px-3 py-1 rounded-full uppercase">
            {post.category}
          </span>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 leading-tight">
            {post.title}
          </h1>

          <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
            <span>Yazar: <strong className="text-slate-800">{post.author}</strong></span>
            <span>•</span>
            <span>Tarih: {new Date(post.published_at || post.created_at).toLocaleDateString('tr-TR')}</span>
          </div>
        </div>

        {/* Cover Image */}
        <div className="aspect-[16/9] rounded-2xl overflow-hidden bg-slate-100">
          <img
            src={post.cover_image}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Summary Callout */}
        <div className="p-4 bg-slate-50 rounded-2xl border-l-4 border-blue-900 text-xs sm:text-sm text-slate-700 font-medium leading-relaxed italic">
          {post.summary}
        </div>

        {/* Article Body */}
        <div className="prose prose-slate max-w-none text-xs sm:text-sm text-slate-700 leading-relaxed space-y-4 whitespace-pre-line">
          {post.content}
        </div>

        {/* Promotion Box */}
        <div className="p-6 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="font-bold text-sm text-white">
              Kumaşınızı Metre Bazında Hemen Sipariş Edin
            </h4>
            <p className="text-xs text-slate-400">
              0.5m adımlarla dilediğiniz kumaşı seçin, aynı gün kargoya verelim.
            </p>
          </div>
          <Link
            href="/kategori/tum-kumaslar"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex-shrink-0 transition shadow"
          >
            Kumaşları İncele
          </Link>
        </div>
      </div>
    </article>
  );
}
