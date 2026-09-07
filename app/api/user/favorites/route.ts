import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { readDb, writeDb } from '@/lib/db/repo';

// GET User's Favorites
export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth || auth.role !== 'customer') {
      return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });
    }

    const db = readDb();
    const wishlists = (db.wishlists || []).filter((w: any) => w.user_id === auth.user.id);
    const products = db.products || [];

    const favoriteProducts = wishlists.map((w: any) => {
      const prod = products.find((p: any) => p.id === w.product_id);
      if (!prod) return null;

      return {
        id: prod.id,
        favorite_id: w.id,
        name: prod.name,
        slug: prod.slug,
        sku: prod.sku,
        base_price: prod.base_price,
        discount_price: prod.discount_price,
        main_image_url: prod.main_image_url || (prod.images && prod.images[0]),
        stock_meter: prod.stock_meter,
        is_active: prod.is_active,
        added_at: w.created_at,
      };
    }).filter(Boolean);

    return NextResponse.json({ favorites: favoriteProducts });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST Add to Favorites (Supports single product or bulk array for guest merge)
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth || auth.role !== 'customer') {
      return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });
    }

    const body = await req.json();
    const { product_id, product_ids } = body;

    const db = readDb();
    if (!db.wishlists) db.wishlists = [];

    const idsToAdd: string[] = [];
    if (product_id && typeof product_id === 'string') idsToAdd.push(product_id);
    if (Array.isArray(product_ids)) idsToAdd.push(...product_ids);

    let addedCount = 0;
    const nowIso = new Date().toISOString();

    for (const pId of idsToAdd) {
      const exists = db.wishlists.some(
        (w: any) => w.user_id === auth.user.id && w.product_id === pId
      );
      if (!exists) {
        db.wishlists.push({
          id: `fav-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          user_id: auth.user.id,
          product_id: pId,
          created_at: nowIso,
        });
        addedCount++;
      }
    }

    writeDb(db);
    const totalCount = db.wishlists.filter((w: any) => w.user_id === auth.user.id).length;

    return NextResponse.json({
      success: true,
      added_count: addedCount,
      total_count: totalCount,
      message: 'Favorilere eklendi.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE Remove from Favorites
export async function DELETE(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth || auth.role !== 'customer') {
      return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json({ error: 'Ürün ID gereklidir.' }, { status: 400 });
    }

    const db = readDb();
    db.wishlists = (db.wishlists || []).filter(
      (w: any) => !(w.user_id === auth.user.id && (w.product_id === productId || w.id === productId))
    );

    writeDb(db);
    const totalCount = (db.wishlists || []).filter((w: any) => w.user_id === auth.user.id).length;

    return NextResponse.json({
      success: true,
      total_count: totalCount,
      message: 'Favorilerden kaldırıldı.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
