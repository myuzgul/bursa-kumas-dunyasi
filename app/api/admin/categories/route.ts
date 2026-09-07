import { NextResponse } from 'next/server';
import { dbRepo } from '@/lib/db/repo';
import { logAuditAction } from '@/lib/services/auditLogger';

export async function GET() {
  const db = dbRepo.read();
  return NextResponse.json(
    { categories: db.categories || [] },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } }
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const db = dbRepo.read();

    const categoryId = body.id || `cat-${Date.now()}`;
    const slug =
      body.slug && body.slug.trim()
        ? body.slug.trim()
        : body.name
            .toLowerCase()
            .replace(/ğ/g, 'g')
            .replace(/ü/g, 'u')
            .replace(/ş/g, 's')
            .replace(/ı/g, 'i')
            .replace(/ö/g, 'o')
            .replace(/ç/g, 'c')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');

    const newCategory = {
      id: categoryId,
      parent_id: body.parent_id || null,
      name: body.name,
      slug: slug,
      description: body.description || '',
      image_url: body.image_url || 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=600&q=80',
      display_order: parseInt(body.display_order) || (db.categories?.length || 0) + 1,
      is_active: body.is_active !== undefined ? (body.is_active ? 1 : 0) : 1,
      is_featured_home: body.is_featured_home ? 1 : 0,
      show_in_menu: body.show_in_menu !== undefined ? (body.show_in_menu ? 1 : 0) : 1,
      meta_title: body.meta_title || `${body.name} - Bursa Kumaş Dünyası`,
      meta_description: body.meta_description || body.description,
      created_at: new Date().toISOString(),
    };

    if (!db.navigation_menus) db.navigation_menus = [];

    const existingCatIdx = (db.categories || []).findIndex((c: any) => c.id === categoryId);
    let oldSlug = '';

    if (existingCatIdx > -1) {
      oldSlug = db.categories[existingCatIdx].slug;
      db.categories[existingCatIdx] = { ...db.categories[existingCatIdx], ...newCategory };
      logAuditAction({
        adminEmail: 'admin@bursakumasdunyasi.com',
        action: 'CATEGORY_UPDATE',
        details: `Kategori güncellendi: ${body.name} (Slug: ${slug})`,
      });
    } else {
      if (!db.categories) db.categories = [];
      db.categories.push(newCategory);
      logAuditAction({
        adminEmail: 'admin@bursakumasdunyasi.com',
        action: 'CATEGORY_CREATE',
        details: `Yeni kategori eklendi: ${body.name}`,
      });
    }

    // AUTOMATIC SYNCHRONIZATION WITH NAVIGATION MENUS
    const oldUrl = oldSlug ? `/kategori/${oldSlug}` : null;
    const newUrl = `/kategori/${slug}`;

    const menuIdx = db.navigation_menus.findIndex(
      (m: any) =>
        m.category_id === categoryId ||
        (oldUrl && m.url === oldUrl) ||
        m.url === newUrl
    );

    if (newCategory.show_in_menu === 1 && newCategory.is_active === 1) {
      if (menuIdx > -1) {
        // Update existing menu item with new title, URL and display order
        db.navigation_menus[menuIdx] = {
          ...db.navigation_menus[menuIdx],
          category_id: categoryId,
          title: newCategory.name,
          url: newUrl,
          is_active: 1,
          display_order: newCategory.display_order,
        };
      } else {
        // Create new menu item
        db.navigation_menus.push({
          id: `menu-cat-${categoryId}`,
          category_id: categoryId,
          title: newCategory.name,
          url: newUrl,
          type: 'header',
          display_order: newCategory.display_order || db.navigation_menus.length + 1,
          is_active: 1,
          is_highlight: 0,
        });
      }
    } else if (newCategory.show_in_menu === 0 || newCategory.is_active === 0) {
      // Remove from navigation menu if show_in_menu is unchecked or inactive
      if (menuIdx > -1) {
        db.navigation_menus.splice(menuIdx, 1);
      }
    }

    dbRepo.write(db);

    return NextResponse.json(
      { success: true, category: newCategory },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Kategori kaydedilemedi.' }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ message: 'ID gereklidir.' }, { status: 400 });

    const db = dbRepo.read();
    const targetCat = (db.categories || []).find((c: any) => c.id === id);

    db.categories = (db.categories || []).filter((c: any) => c.id !== id);

    // Also remove from navigation menus
    if (db.navigation_menus && targetCat) {
      db.navigation_menus = db.navigation_menus.filter(
        (m: any) => m.category_id !== id && m.url !== `/kategori/${targetCat.slug}`
      );
    }

    dbRepo.write(db);

    logAuditAction({
      adminEmail: 'admin@bursakumasdunyasi.com',
      action: 'CATEGORY_DELETE',
      details: `Kategori ve bağlı menü öğesi silindi: ID ${id}`,
    });

    return NextResponse.json(
      { success: true, message: 'Kategori ve bağlı menü öğesi silindi.' },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Kategori silinemedi.' }, { status: 400 });
  }
}
