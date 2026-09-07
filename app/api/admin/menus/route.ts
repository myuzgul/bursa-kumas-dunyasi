import { NextResponse } from 'next/server';
import { dbRepo } from '@/lib/db/repo';
import { logAuditAction } from '@/lib/services/auditLogger';

export async function GET() {
  const db = dbRepo.read();

  // Initialize high-level hierarchical menus (similar to Yazar Perde) if empty
  if (!db.navigation_menus || db.navigation_menus.length === 0) {
    const initialMenus = [
      // 1. Döşemelik Kumaşlar (Parent)
      { id: 'm-dosemelik', parent_id: null, category_id: 'cat-dosemelik', title: 'Döşemelik Kumaşlar', url: '/kategori/dosemelik-kumaslar', display_order: 1, is_active: 1, is_highlight: 0, badge_text: '' },
      { id: 'm-sub-1', parent_id: 'm-dosemelik', category_id: 'cat-kadife', title: 'Kadife Koltuk Kumaşları', url: '/kategori/kadife-dosemelik-kumas', display_order: 1, is_active: 1, is_highlight: 0, badge_text: 'Popüler' },
      { id: 'm-sub-2', parent_id: 'm-dosemelik', category_id: 'cat-sonil', title: 'Şönil & Buklet Kumaşlar', url: '/kategori/sonil-buklet-kumaslar', display_order: 2, is_active: 1, is_highlight: 0, badge_text: '' },
      { id: 'm-sub-3', parent_id: 'm-dosemelik', category_id: null, title: 'Leke Tutmaz & Silinebilir Kumaşlar', url: '/kategori/dosemelik-kumaslar?feature=leke-tutmaz', display_order: 3, is_active: 1, is_highlight: 0, badge_text: 'Su İtici' },
      { id: 'm-sub-4', parent_id: 'm-dosemelik', category_id: null, title: 'İskandinav Buklet & Tulum Kumaş', url: '/kategori/sonil-buklet-kumaslar', display_order: 4, is_active: 1, is_highlight: 0, badge_text: 'Yeni' },

      // 2. Perdelik Kumaşlar (Parent)
      { id: 'm-perdelik', parent_id: null, category_id: 'cat-perdelik', title: 'Perdelik Kumaşlar (280 cm)', url: '/kategori/perdelik-kumaslar', display_order: 2, is_active: 1, is_highlight: 0, badge_text: 'Çift En' },
      { id: 'm-sub-5', parent_id: 'm-perdelik', category_id: 'cat-fon', title: '280 cm Çift En Fonluklar', url: '/kategori/fon-perdelik-kumaslar', display_order: 1, is_active: 1, is_highlight: 0, badge_text: '' },
      { id: 'm-sub-6', parent_id: 'm-perdelik', category_id: 'cat-blackout', title: 'Blackout Karartma Fon Perde', url: '/kategori/blackout-karartma-perde', display_order: 2, is_active: 1, is_highlight: 0, badge_text: '%100 Işık Keser' },
      { id: 'm-sub-7', parent_id: 'm-perdelik', category_id: null, title: 'Keten Dökümlü Salon Fonluğu', url: '/kategori/fon-perdelik-kumaslar', display_order: 3, is_active: 1, is_highlight: 0, badge_text: '' },

      // 3. Giyimlik & Pamuk Poplin (Parent)
      { id: 'm-giyimlik', parent_id: null, category_id: 'cat-giyimlik', title: 'Giyimlik Kumaşlar', url: '/kategori/giyimlik-kumaslar', display_order: 3, is_active: 1, is_highlight: 0, badge_text: '' },
      { id: 'm-sub-8', parent_id: 'm-giyimlik', category_id: 'cat-poplin', title: '%100 Pamuk Poplin & Müslin', url: '/kategori/pamuk-poplin-muslin', display_order: 1, is_active: 1, is_highlight: 0, badge_text: 'Doğal' },
      { id: 'm-sub-9', parent_id: 'm-giyimlik', category_id: null, title: 'Viskon & Keten Giyimlik', url: '/kategori/giyimlik-kumaslar', display_order: 2, is_active: 1, is_highlight: 0, badge_text: '' },

      // 4. Duck Keten & Masa Örtüsü (Parent)
      { id: 'm-masa', parent_id: null, category_id: 'cat-masa', title: 'Duck Keten & Masa Örtüsü', url: '/kategori/masa-ortusu-duck-keten', display_order: 4, is_active: 1, is_highlight: 0, badge_text: '' },
      { id: 'm-sub-10', parent_id: 'm-masa', category_id: null, title: 'Dertsiz Leke Tutmaz Masa Kumaşı', url: '/kategori/masa-ortusu-duck-keten', display_order: 1, is_active: 1, is_highlight: 0, badge_text: 'Dertsiz' },
      { id: 'm-sub-11', parent_id: 'm-masa', category_id: null, title: 'Baskılı & Desenli Duck Ketenler', url: '/kategori/masa-ortusu-duck-keten', display_order: 2, is_active: 1, is_highlight: 0, badge_text: '' },

      // 5. Blog / Rehber (Direct item)
      { id: 'm-blog', parent_id: null, category_id: null, title: 'Kumaş Rehberi & Blog', url: '/blog', display_order: 5, is_active: 1, is_highlight: 1, badge_text: 'Rehber' },
    ];

    db.navigation_menus = initialMenus;
    dbRepo.write(db);
  } else {
    // Keep category names synchronized
    const categoriesMap = new Map((db.categories || []).map((c: any) => [c.id, c]));
    for (const menu of db.navigation_menus) {
      if (menu.category_id && categoriesMap.has(menu.category_id)) {
        const cat = categoriesMap.get(menu.category_id)!;
        menu.title = cat.name;
        menu.url = `/kategori/${cat.slug}`;
      }
    }
  }

  // Build hierarchical tree
  const allMenus = [...db.navigation_menus].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  const parents = allMenus.filter((m) => !m.parent_id);
  const children = allMenus.filter((m) => m.parent_id);

  const tree = parents.map((p) => ({
    ...p,
    children: children.filter((c) => c.parent_id === p.id),
  }));

  return NextResponse.json(
    {
      menus: allMenus,
      tree: tree,
      categories: db.categories || [],
    },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } }
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const db = dbRepo.read();

    if (!db.navigation_menus) db.navigation_menus = [];

    const menuId = body.id || `menu-${Date.now()}`;
    let finalUrl = body.url ? body.url.trim() : '';
    if (!finalUrl) {
      if (body.category_id) {
        const cat = (db.categories || []).find((c: any) => c.id === body.category_id);
        if (cat) finalUrl = `/kategori/${cat.slug}`;
      }
      if (!finalUrl && body.title) {
        const slug = body.title
          .toLowerCase()
          .replace(/ğ/g, 'g')
          .replace(/ü/g, 'u')
          .replace(/ş/g, 's')
          .replace(/ı/g, 'i')
          .replace(/ö/g, 'o')
          .replace(/ç/g, 'c')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
        finalUrl = `/kategori/${slug}`;
      }
    }

    const newMenuItem = {
      id: menuId,
      parent_id: body.parent_id || null,
      category_id: body.category_id || null,
      title: body.title || (body.category_id ? (db.categories || []).find((c: any) => c.id === body.category_id)?.name : 'Menü'),
      url: finalUrl || '/kategori/tum-kumaslar',
      type: body.type || 'header',
      display_order: parseInt(body.display_order) || db.navigation_menus.length + 1,
      is_active: body.is_active !== undefined ? (body.is_active ? 1 : 0) : 1,
      is_highlight: body.is_highlight ? 1 : 0,
      badge_text: body.badge_text || '',
      target: body.target || '_self',
    };

    const existingIdx = db.navigation_menus.findIndex((m: any) => m.id === menuId);
    if (existingIdx > -1) {
      db.navigation_menus[existingIdx] = { ...db.navigation_menus[existingIdx], ...newMenuItem };
      logAuditAction({
        adminEmail: 'admin@bursakumasdunyasi.com',
        action: 'MENU_UPDATE',
        details: `Menü öğesi güncellendi: ${body.title} (${body.url})`,
      });
    } else {
      db.navigation_menus.push(newMenuItem);
      logAuditAction({
        adminEmail: 'admin@bursakumasdunyasi.com',
        action: 'MENU_CREATE',
        details: `Yeni menü öğesi eklendi: ${body.title} (Üst: ${body.parent_id || 'Ana Menü'})`,
      });
    }

    dbRepo.write(db);

    return NextResponse.json(
      { success: true, menu: newMenuItem },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Menü kaydedilemedi.' }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ message: 'ID gereklidir.' }, { status: 400 });

    const db = dbRepo.read();
    // Delete item and its sub-items
    db.navigation_menus = (db.navigation_menus || []).filter(
      (m: any) => m.id !== id && m.parent_id !== id
    );
    dbRepo.write(db);

    logAuditAction({
      adminEmail: 'admin@bursakumasdunyasi.com',
      action: 'MENU_DELETE',
      details: `Menü öğesi ve bağlı alt menüleri silindi: ID ${id}`,
    });

    return NextResponse.json(
      { success: true, message: 'Menü öğesi silindi.' },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Menü silinemedi.' }, { status: 400 });
  }
}
