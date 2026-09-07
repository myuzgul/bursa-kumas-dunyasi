/**
 * SEO & Schema.org Structured Data Generators
 * Bursa Kumaş Dünyası (bursakumasdunyasi.com)
 */

export const SITE_URL = 'https://bursakumasdunyasi.com';
export const SITE_NAME = 'Bursa Kumaş Dünyası';

export function getOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+90-542-393-98-16',
      contactType: 'customer service',
      areaServed: 'TR',
      availableLanguage: 'Turkish',
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Anadolu, 2. Kanarya Sk. no:14/A',
      postalCode: '16350',
      addressLocality: 'Yıldırım',
      addressRegion: 'Bursa',
      addressCountry: 'TR',
    },
    sameAs: [
      'https://www.instagram.com/bursakumasdunyasi',
      'https://www.facebook.com/bursakumasdunyasi',
    ],
  };
}

export function getProductSchema(product: any, reviews: any[] = []) {
  const ratingValue = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : '5.0';

  return {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.name,
    image: [product.main_image_url],
    description: product.short_description || product.description,
    sku: product.sku,
    mpn: product.sku,
    brand: {
      '@type': 'Brand',
      name: 'Bursa Kumaş Dünyası',
    },
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/urun/${product.slug}`,
      priceCurrency: 'TRY',
      price: (product.discount_price || product.base_price).toString(),
      priceValidUntil: '2027-12-31',
      itemCondition: 'https://schema.org/NewCondition',
      availability: product.stock_meter > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: SITE_NAME,
      },
    },
    ...(reviews.length > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: ratingValue,
        reviewCount: reviews.length.toString(),
      },
    }),
  };
}

export function getBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.url}`,
    })),
  };
}

export function getArticleSchema(article: any) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    image: [article.cover_image],
    datePublished: article.published_at || article.created_at,
    dateModified: article.updated_at || article.created_at,
    author: {
      '@type': 'Person',
      name: article.author || 'Bursa Kumaş Dünyası Uzman Ekibi',
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.png`,
      },
    },
    description: article.summary,
  };
}
