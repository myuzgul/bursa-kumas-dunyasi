import { NextResponse } from 'next/server';
import { dbRepo } from '@/lib/db/repo';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = dbRepo.read();
  return NextResponse.json(
    {
      coupons: db.coupons || [],
      rules: db.cart_discount_rules || [],
    },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } }
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      type, // 'coupon' | 'rule'
      code,
      title,
      discount_type,
      discount_value,
      min_order_amount,
      max_discount_amount,
      usage_limit,
      per_user_limit,
      start_date,
      expiry_date,
      is_active,
      // rule specific
      min_cart_total,
      discount_percent,
      discount_fixed,
    } = body;

    const db = dbRepo.read();

    if (type === 'rule') {
      if (!title) {
        return NextResponse.json({ message: 'Kural başlığı zorunludur.' }, { status: 400 });
      }
      if (!db.cart_discount_rules) db.cart_discount_rules = [];

      const newRule = {
        id: `rule-${Date.now()}`,
        title: title.trim(),
        min_cart_total: Number(min_cart_total || 0),
        discount_percent: Number(discount_percent || 0),
        discount_fixed: Number(discount_fixed || 0),
        is_active: is_active !== undefined ? Number(is_active) : 1,
        created_at: new Date().toISOString(),
      };

      db.cart_discount_rules.push(newRule);
      dbRepo.write(db);
      return NextResponse.json({ success: true, rule: newRule });
    }

    // Otherwise coupon
    if (!code || !code.trim()) {
      return NextResponse.json({ message: 'Kupon kodu zorunludur.' }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();
    if (!db.coupons) db.coupons = [];

    // Check code duplication
    const exists = db.coupons.some((c: any) => c.code.toUpperCase() === cleanCode);
    if (exists) {
      return NextResponse.json({ message: `"${cleanCode}" kodlu kupon zaten mevcut.` }, { status: 400 });
    }

    const newCoupon = {
      id: `coup-${Date.now()}`,
      code: cleanCode,
      title: title ? title.trim() : cleanCode,
      discount_type: discount_type || 'percent',
      discount_value: Number(discount_value || 10),
      min_order_amount: Number(min_order_amount || 0),
      max_discount_amount: max_discount_amount ? Number(max_discount_amount) : null,
      usage_limit: usage_limit ? Number(usage_limit) : null,
      used_count: 0,
      per_user_limit: Number(per_user_limit || 1),
      start_date: start_date || null,
      expiry_date: expiry_date || null,
      is_active: is_active !== undefined ? Number(is_active) : 1,
      created_at: new Date().toISOString(),
    };

    db.coupons.push(newCoupon);
    dbRepo.write(db);

    return NextResponse.json({ success: true, coupon: newCoupon });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Hata oluştu' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const {
      id,
      type,
      code,
      title,
      discount_type,
      discount_value,
      min_order_amount,
      max_discount_amount,
      usage_limit,
      per_user_limit,
      start_date,
      expiry_date,
      is_active,
      min_cart_total,
      discount_percent,
      discount_fixed,
    } = body;

    if (!id) {
      return NextResponse.json({ message: 'ID zorunludur.' }, { status: 400 });
    }

    const db = dbRepo.read();

    if (type === 'rule') {
      if (!db.cart_discount_rules) db.cart_discount_rules = [];
      const idx = db.cart_discount_rules.findIndex((r: any) => r.id === id);
      if (idx === -1) {
        return NextResponse.json({ message: 'Kural bulunamadı.' }, { status: 404 });
      }
      if (title) db.cart_discount_rules[idx].title = title.trim();
      if (min_cart_total !== undefined) db.cart_discount_rules[idx].min_cart_total = Number(min_cart_total);
      if (discount_percent !== undefined) db.cart_discount_rules[idx].discount_percent = Number(discount_percent);
      if (discount_fixed !== undefined) db.cart_discount_rules[idx].discount_fixed = Number(discount_fixed);
      if (is_active !== undefined) db.cart_discount_rules[idx].is_active = Number(is_active);

      dbRepo.write(db);
      return NextResponse.json({ success: true, rule: db.cart_discount_rules[idx] });
    }

    if (!db.coupons) db.coupons = [];
    const idx = db.coupons.findIndex((c: any) => c.id === id);
    if (idx === -1) {
      return NextResponse.json({ message: 'Kupon bulunamadı.' }, { status: 404 });
    }

    if (code) db.coupons[idx].code = code.trim().toUpperCase();
    if (title) db.coupons[idx].title = title.trim();
    if (discount_type) db.coupons[idx].discount_type = discount_type;
    if (discount_value !== undefined) db.coupons[idx].discount_value = Number(discount_value);
    if (min_order_amount !== undefined) db.coupons[idx].min_order_amount = Number(min_order_amount);
    if (max_discount_amount !== undefined) db.coupons[idx].max_discount_amount = max_discount_amount ? Number(max_discount_amount) : null;
    if (usage_limit !== undefined) db.coupons[idx].usage_limit = usage_limit ? Number(usage_limit) : null;
    if (per_user_limit !== undefined) db.coupons[idx].per_user_limit = Number(per_user_limit);
    if (start_date !== undefined) db.coupons[idx].start_date = start_date || null;
    if (expiry_date !== undefined) db.coupons[idx].expiry_date = expiry_date || null;
    if (is_active !== undefined) db.coupons[idx].is_active = Number(is_active);

    dbRepo.write(db);
    return NextResponse.json({ success: true, coupon: db.coupons[idx] });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Hata oluştu' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const type = searchParams.get('type') || 'coupon';

    if (!id) {
      return NextResponse.json({ message: 'ID belirtilmedi.' }, { status: 400 });
    }

    const db = dbRepo.read();

    if (type === 'rule') {
      db.cart_discount_rules = (db.cart_discount_rules || []).filter((r: any) => r.id !== id);
    } else {
      db.coupons = (db.coupons || []).filter((c: any) => c.id !== id);
    }

    dbRepo.write(db);
    return NextResponse.json({ success: true, message: 'Silindi.' });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Hata oluştu' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, type, is_active } = body;

    if (!id) {
      return NextResponse.json({ message: 'ID zorunludur.' }, { status: 400 });
    }

    const db = dbRepo.read();

    if (type === 'rule') {
      const rule = (db.cart_discount_rules || []).find((r: any) => r.id === id);
      if (!rule) return NextResponse.json({ message: 'Kural bulunamadı' }, { status: 404 });
      rule.is_active = is_active !== undefined ? Number(is_active) : (rule.is_active === 1 ? 0 : 1);
      dbRepo.write(db);
      return NextResponse.json({ success: true, rule });
    }

    const coupon = (db.coupons || []).find((c: any) => c.id === id);
    if (!coupon) return NextResponse.json({ message: 'Kupon bulunamadı' }, { status: 404 });
    coupon.is_active = is_active !== undefined ? Number(is_active) : (coupon.is_active === 1 ? 0 : 1);
    dbRepo.write(db);
    return NextResponse.json({ success: true, coupon });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Hata oluştu' }, { status: 500 });
  }
}
