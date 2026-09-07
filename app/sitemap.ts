import { MetadataRoute } from 'next';
import { dbRepo } from '@/lib/db/repo';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://bursakumasdunyasi.com';
  const db = dbRepo.read();

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/kategori/tum-kumaslar`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/siparis-takip`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/kurumsal/hakkimizda`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/kurumsal/kvkk-aydinlatma-metni`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/kurumsal/iade-ve-degisim`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ];

  const categoryPages: MetadataRoute.Sitemap = (db.categories || [])
    .filter((c: any) => c.is_active === 1)
    .map((c: any) => ({
      url: `${baseUrl}/kategori/${c.slug}`,
      lastModified: new Date(c.created_at || Date.now()),
      changeFrequency: 'weekly',
      priority: 0.85,
    }));

  const productPages: MetadataRoute.Sitemap = (db.products || [])
    .filter((p: any) => p.is_active === 1)
    .map((p: any) => ({
      url: `${baseUrl}/urun/${p.slug}`,
      lastModified: new Date(p.updated_at || p.created_at || Date.now()),
      changeFrequency: 'daily',
      priority: 0.95,
    }));

  const blogPages: MetadataRoute.Sitemap = (db.blog_posts || [])
    .filter((b: any) => b.is_published === 1)
    .map((b: any) => ({
      url: `${baseUrl}/blog/${b.slug}`,
      lastModified: new Date(b.published_at || b.created_at || Date.now()),
      changeFrequency: 'monthly',
      priority: 0.75,
    }));

  return [...staticPages, ...categoryPages, ...productPages, ...blogPages];
}
