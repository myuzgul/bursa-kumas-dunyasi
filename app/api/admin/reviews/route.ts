import { NextRequest, NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db/repo';

// GET all reviews with product details
export async function GET(req: NextRequest) {
  try {
    const db = readDb();
    const reviews = db.reviews || [];
    const products = db.products || [];

    const enrichedReviews = reviews.map((r: any) => {
      const prod = products.find((p: any) => p.id === r.product_id);
      return {
        ...r,
        product_name: prod ? prod.name : 'Silinmiş / Bilinmeyen Kumaş',
        product_slug: prod ? prod.slug : '',
        product_image: prod ? (prod.main_image_url || (prod.images && prod.images[0])) : '',
      };
    });

    // Sort by latest
    enrichedReviews.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({ reviews: enrichedReviews });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT update review status (approve, reject)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, is_approved } = body;

    if (!id) {
      return NextResponse.json({ error: 'Review ID is required.' }, { status: 400 });
    }

    const db = readDb();
    const reviewIdx = (db.reviews || []).findIndex((r: any) => r.id === id);

    if (reviewIdx === -1) {
      return NextResponse.json({ error: 'Yorum bulunamadı.' }, { status: 404 });
    }

    db.reviews[reviewIdx].is_approved = Number(is_approved);
    db.reviews[reviewIdx].updated_at = new Date().toISOString();

    writeDb(db);

    return NextResponse.json({
      success: true,
      message: is_approved === 1 ? 'Yorum onaylandı ve yayına alındı.' : 'Yorum durumu güncellendi.',
      review: db.reviews[reviewIdx],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE review
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Review ID is required.' }, { status: 400 });
    }

    const db = readDb();
    const initialLen = (db.reviews || []).length;
    db.reviews = (db.reviews || []).filter((r: any) => r.id !== id);

    if (db.reviews.length === initialLen) {
      return NextResponse.json({ error: 'Yorum bulunamadı.' }, { status: 404 });
    }

    writeDb(db);

    return NextResponse.json({ success: true, message: 'Yorum başarıyla silindi.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
