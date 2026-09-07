import React from 'react';
import Link from 'next/link';
import { dbRepo } from '@/lib/db/repo';
import { BookOpen, Calendar, User, ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'Kumaş Rehberi & Tekstil Blogu | Bursa Kumaş Dünyası',
  description: 'Viskon, keten, tensel, ayrobin ve giyimlik kumaş rehberleri, bakım tavsiyeleri ve metre hesaplama ipuçları.',
};

export default function BlogListPage() {
  const db = dbRepo.read();
  const posts = db.blog_posts?.filter((b: any) => b.is_published === 1) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-xs font-bold text-blue-900 bg-blue-50 px-3 py-1 rounded-full uppercase">
          Tekstil & Kumaş Bilgi Merkezi
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900">
          Kumaş Rehberi & İlham Verici Fikirler
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Viskon, keten, tensel, ayrobin ve modal kumaşların özellikleri, dikim tüyoları ve kumaş bakım rehberleri.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.map((post: any) => (
          <article
            key={post.id}
            className="group bg-white rounded-3xl border border-slate-200 overflow-hidden hover:shadow-xl transition flex flex-col justify-between"
          >
            <div>
              <Link href={`/blog/${post.slug}`} className="block aspect-[16/9] overflow-hidden bg-slate-100">
                <img
                  src={post.cover_image}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
              </Link>

              <div className="p-6 space-y-3">
                <span className="text-[10px] font-bold text-blue-900 bg-blue-50 px-2.5 py-1 rounded-md uppercase">
                  {post.category}
                </span>

                <Link href={`/blog/${post.slug}`}>
                  <h2 className="text-base font-bold text-slate-900 group-hover:text-blue-900 transition leading-snug line-clamp-2">
                    {post.title}
                  </h2>
                </Link>

                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                  {post.summary}
                </p>
              </div>
            </div>

            <div className="px-6 pb-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>{post.author}</span>
              <Link
                href={`/blog/${post.slug}`}
                className="font-bold text-blue-900 group-hover:underline flex items-center gap-1"
              >
                <span>Yazıyı Oku</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
