import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { readDb } from '@/lib/db/repo';

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth || auth.role !== 'customer') {
      return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });
    }

    const db = readDb();
    const allReviews = db.reviews || [];
    const products = db.products || [];
    const orders = db.orders || [];
    const orderItems = db.order_items || [];

    // User's own reviews
    const userReviews = allReviews.filter(
      (r: any) => r.user_id === auth.user.id || (r.customer_name && r.customer_name.toLowerCase() === auth.user.full_name?.toLowerCase())
    ).map((r: any) => {
      const prod = products.find((p: any) => p.id === r.product_id);
      return {
        ...r,
        product_name: prod ? prod.name : 'Kumaş',
        product_slug: prod ? prod.slug : '',
        product_image: prod ? (prod.main_image_url || (prod.images && prod.images[0])) : '',
      };
    });

    // Find purchased products eligible for review
    const userOrders = orders.filter(
      (o: any) => o.user_id === auth.user.id || (o.customer_email && o.customer_email.toLowerCase() === auth.user.email.toLowerCase())
    );
    const userOrderIds = userOrders.map((o: any) => o.id);
    const purchasedItems = orderItems.filter((it: any) => userOrderIds.includes(it.order_id));

    const reviewedProductIds = new Set(userReviews.map((r: any) => r.product_id));
    const eligibleProductsMap = new Map<string, any>();

    for (const it of purchasedItems) {
      if (it.product_id && !reviewedProductIds.has(it.product_id)) {
        const prod = products.find((p: any) => p.id === it.product_id);
        if (prod && !eligibleProductsMap.has(prod.id)) {
          eligibleProductsMap.set(prod.id, {
            id: prod.id,
            name: prod.name,
            slug: prod.slug,
            image: prod.main_image_url || (prod.images && prod.images[0]),
            sku: prod.sku,
          });
        }
      }
    }

    return NextResponse.json({
      reviews: userReviews,
      eligible_to_review: Array.from(eligibleProductsMap.values()),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
