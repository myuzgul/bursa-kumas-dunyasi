import { NextRequest, NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db/repo';

// GET approved reviews for a specific product
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');

    const db = readDb();
    let reviews = db.reviews || [];

    if (productId) {
      reviews = reviews.filter((r: any) => r.product_id === productId && r.is_approved === 1);
    } else {
      reviews = reviews.filter((r: any) => r.is_approved === 1);
    }

    // Sort by latest
    reviews.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({ reviews });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST new customer review (Pending admin approval)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { product_id, customer_name, rating, comment, images = [] } = body;

    if (!product_id || !customer_name?.trim() || !comment?.trim() || !rating) {
      return NextResponse.json(
        { error: 'Lütfen isim, yıldız puanı ve yorum alanlarını eksiksiz doldurunuz.' },
        { status: 400 }
      );
    }

    const db = readDb();
    if (!db.reviews) db.reviews = [];

    const newReview = {
      id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      product_id,
      user_id: null,
      customer_name: customer_name.trim(),
      rating: Math.min(5, Math.max(1, Number(rating) || 5)),
      comment: comment.trim(),
      images: Array.isArray(images) ? images : [],
      is_verified_purchase: 1,
      is_approved: 0, // Pending admin moderation
      created_at: new Date().toISOString(),
    };

    db.reviews.unshift(newReview);
    writeDb(db);

    return NextResponse.json({
      success: true,
      message: 'Değerlendirmeniz ve fotoğraflarınız başarıyla alındı. Yönetici onayından sonra yayına alınacaktır.',
      review: newReview,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
