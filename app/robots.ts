import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://bursakumasdunyasi.com';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/admin/*', '/checkout', '/sepet', '/api/*', '/hesap/*'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
