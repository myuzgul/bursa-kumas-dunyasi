import { NextResponse } from 'next/server';
import { readDb } from '@/lib/db/repo';

function escapeXml(unsafe: string = ''): string {
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  try {
    const db = readDb();
    const products = (db.products || []).filter(
      (p: any) => p.is_active === 1 && !p.is_archived
    );
    const categories = db.categories || [];

    const siteUrl = 'https://bursakumasdunyasi.com';

    let itemsXml = '';

    for (const p of products) {
      const cat = categories.find((c: any) => c.id === p.category_id);
      const catName = cat ? cat.name : 'Döşemelik ve Perdelik Kumaş';
      const prodUrl = `${siteUrl}/urun/${p.slug || p.id}`;
      const imageUrl = p.main_image_url || (p.images && p.images[0]) || `${siteUrl}/placeholder.jpg`;

      const basePrice = Number(p.base_price) || 0;
      const discountPrice = p.discount_price ? Number(p.discount_price) : null;
      const inStock = (p.stock_meter || 0) > 0;
      const availability = inStock ? 'in stock' : 'out of stock';

      const variants = (p.variants || []).filter((v: any) => v.is_active === 1);

      if (p.has_variants && variants.length > 0) {
        for (const v of variants) {
          const varPrice = Number(v.price) || basePrice;
          const varDisc = v.discount_price ? Number(v.discount_price) : null;
          const varInStock = (v.stock_meter || 0) > 0;
          const varImage = v.image_url || imageUrl;

          itemsXml += `
    <item>
      <g:id>${escapeXml(v.sku || `${p.sku}-${v.id}`)}</g:id>
      <g:item_group_id>${escapeXml(p.sku || p.id)}</g:item_group_id>
      <g:title>${escapeXml(`${p.name} - ${v.title}`)}</g:title>
      <g:description>${escapeXml(p.description || p.short_description || `${p.name} kumaş.`)}</g:description>
      <g:link>${escapeXml(prodUrl)}</g:link>
      <g:image_link>${escapeXml(varImage)}</g:image_link>
      <g:brand>Bursa Kumaş Dünyası</g:brand>
      <g:condition>new</g:condition>
      <g:availability>${varInStock ? 'in stock' : 'out of stock'}</g:availability>
      <g:price>${varPrice.toFixed(2)} TRY</g:price>
      ${varDisc && varDisc < varPrice ? `<g:sale_price>${varDisc.toFixed(2)} TRY</g:sale_price>` : ''}
      <g:google_product_category>Arts &amp; Entertainment &gt; Hobbies &amp; Creative Arts &gt; Crafts &amp; Hobbies &gt; Fabric</g:google_product_category>
      <g:fb_product_category>home &amp; garden &gt; fabrics</g:fb_product_category>
      ${v.attributes?.Renk ? `<g:color>${escapeXml(v.attributes.Renk)}</g:color>` : ''}
      ${v.attributes?.Desen ? `<g:pattern>${escapeXml(v.attributes.Desen)}</g:pattern>` : ''}
    </item>`;
        }
      } else {
        itemsXml += `
    <item>
      <g:id>${escapeXml(p.sku || p.id)}</g:id>
      <g:title>${escapeXml(p.name)}</g:title>
      <g:description>${escapeXml(p.description || p.short_description || `${p.name} kumaş.`)}</g:description>
      <g:link>${escapeXml(prodUrl)}</g:link>
      <g:image_link>${escapeXml(imageUrl)}</g:image_link>
      <g:brand>Bursa Kumaş Dünyası</g:brand>
      <g:condition>new</g:condition>
      <g:availability>${availability}</g:availability>
      <g:price>${basePrice.toFixed(2)} TRY</g:price>
      ${discountPrice && discountPrice < basePrice ? `<g:sale_price>${discountPrice.toFixed(2)} TRY</g:sale_price>` : ''}
      <g:google_product_category>Arts &amp; Entertainment &gt; Hobbies &amp; Creative Arts &gt; Crafts &amp; Hobbies &gt; Fabric</g:google_product_category>
      <g:fb_product_category>home &amp; garden &gt; fabrics</g:fb_product_category>
    </item>`;
      }
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>Bursa Kumaş Dünyası - Meta / Facebook &amp; Instagram Katalog Beslemesi</title>
    <link>${siteUrl}</link>
    <description>Bursa Kumaş Dünyası Meta Catalog Feed.</description>
    ${itemsXml}
  </channel>
</rss>`;

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 's-maxage=3600, stale-while-revalidate',
      },
    });
  } catch (error: any) {
    return new Response(`Error generating Facebook Catalog feed: ${error.message}`, {
      status: 500,
    });
  }
}
