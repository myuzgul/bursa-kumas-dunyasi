import { NextResponse } from 'next/server';
import { dbRepo } from '@/lib/db/repo';

export const dynamic = 'force-dynamic';

const defaultBadges = [
  {
    id: 'badge-cok-satan',
    title: 'Çok Satan',
    slug: 'cok-satan',
    bg_color: '#f59e0b',
    text_color: '#0f172a',
    icon_name: 'Star',
    position: 'image_top_left',
    display_order: 1,
    is_active: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: 'badge-yeni-sezon',
    title: 'Yeni Sezon',
    slug: 'yeni-sezon',
    bg_color: '#2563eb',
    text_color: '#ffffff',
    icon_name: 'Sparkles',
    position: 'image_top_left',
    display_order: 2,
    is_active: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: 'badge-su-itici',
    title: 'Su & Leke İtici',
    slug: 'su-leke-itici',
    bg_color: '#0284c7',
    text_color: '#ffffff',
    icon_name: 'ShieldCheck',
    position: 'image_top_left',
    display_order: 3,
    is_active: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: 'badge-pamuk',
    title: '%100 Doğal Pamuk',
    slug: 'dogal-pamuk',
    bg_color: '#16a34a',
    text_color: '#ffffff',
    icon_name: 'ShieldCheck',
    position: 'image_top_left',
    display_order: 4,
    is_active: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: 'badge-bursa-dokumasi',
    title: 'Bursa Dokuması',
    slug: 'bursa-dokumasi',
    bg_color: '#1e1b4b',
    text_color: '#facc15',
    icon_name: 'Award',
    position: 'image_top_left',
    display_order: 5,
    is_active: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: 'badge-cift-en',
    title: '280 cm Çift En',
    slug: '280-cm-cift-en',
    bg_color: '#7c3aed',
    text_color: '#ffffff',
    icon_name: 'Scissors',
    position: 'image_top_left',
    display_order: 6,
    is_active: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: 'badge-firsat',
    title: 'Fırsat Ürünü',
    slug: 'firsat-urunu',
    bg_color: '#dc2626',
    text_color: '#ffffff',
    icon_name: 'Flame',
    position: 'image_top_left',
    display_order: 7,
    is_active: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: 'badge-pet-friendly',
    title: 'Pet-Friendly (Tırnak Geçmez)',
    slug: 'pet-friendly',
    bg_color: '#0d9488',
    text_color: '#ffffff',
    icon_name: 'Heart',
    position: 'image_top_left',
    display_order: 8,
    is_active: 1,
    created_at: new Date().toISOString(),
  },
];

export async function GET() {
  const db = dbRepo.read();
  let badges = db.product_badges;

  if (!badges || badges.length === 0) {
    badges = [...defaultBadges];
    db.product_badges = badges;
    dbRepo.write(db);
  }

  return NextResponse.json(
    { badges: badges.sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0)) },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } }
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, bg_color, text_color, icon_name, position, display_order, is_active } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ message: 'Rozet başlığı zorunludur.' }, { status: 400 });
    }

    const db = dbRepo.read();
    if (!db.product_badges) db.product_badges = [];

    const slug = title
      .toLowerCase()
      .trim()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const newBadge = {
      id: `badge-${Date.now()}`,
      title: title.trim(),
      slug: slug || `badge-${Date.now()}`,
      bg_color: bg_color || '#2563eb',
      text_color: text_color || '#ffffff',
      icon_name: icon_name || 'Sparkles',
      position: position || 'image_top_left',
      display_order: Number(display_order || db.product_badges.length + 1),
      is_active: is_active !== undefined ? Number(is_active) : 1,
      created_at: new Date().toISOString(),
    };

    db.product_badges.push(newBadge);
    dbRepo.write(db);

    return NextResponse.json({ success: true, badge: newBadge });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Hata oluştu' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, title, bg_color, text_color, icon_name, position, display_order, is_active } = body;

    if (!id) {
      return NextResponse.json({ message: 'Rozet ID zorunludur.' }, { status: 400 });
    }

    const db = dbRepo.read();
    if (!db.product_badges) db.product_badges = [];

    const index = db.product_badges.findIndex((b: any) => b.id === id);
    if (index === -1) {
      return NextResponse.json({ message: 'Rozet bulunamadı.' }, { status: 404 });
    }

    if (title) db.product_badges[index].title = title.trim();
    if (bg_color !== undefined) db.product_badges[index].bg_color = bg_color;
    if (text_color !== undefined) db.product_badges[index].text_color = text_color;
    if (icon_name !== undefined) db.product_badges[index].icon_name = icon_name;
    if (position !== undefined) db.product_badges[index].position = position;
    if (display_order !== undefined) db.product_badges[index].display_order = Number(display_order);
    if (is_active !== undefined) db.product_badges[index].is_active = Number(is_active);

    db.product_badges[index].updated_at = new Date().toISOString();
    dbRepo.write(db);

    return NextResponse.json({ success: true, badge: db.product_badges[index] });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Hata oluştu' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'Rozet ID belirtilmedi.' }, { status: 400 });
    }

    const db = dbRepo.read();
    if (!db.product_badges) db.product_badges = [];

    db.product_badges = db.product_badges.filter((b: any) => b.id !== id);
    dbRepo.write(db);

    return NextResponse.json({ success: true, message: 'Rozet silindi.' });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Hata oluştu' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, is_active } = body;

    if (!id) {
      return NextResponse.json({ message: 'ID zorunludur' }, { status: 400 });
    }

    const db = dbRepo.read();
    if (!db.product_badges) db.product_badges = [];

    const badge = db.product_badges.find((b: any) => b.id === id);
    if (!badge) {
      return NextResponse.json({ message: 'Rozet bulunamadı' }, { status: 404 });
    }

    badge.is_active = is_active !== undefined ? Number(is_active) : (badge.is_active === 1 ? 0 : 1);
    dbRepo.write(db);

    return NextResponse.json({ success: true, badge });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Hata oluştu' }, { status: 500 });
  }
}
