import { dbRepo } from '../db/repo';

export interface ShowcaseSettings {
  title: string;
  subtitle: string;
  badge_suffix: string; // e.g. "Model" or "Kumaş"
  show_model_count: number;
  show_all_tab: number;
  all_tab_title: string;
  max_items: number;
  is_active: number;
}

export const defaultShowcaseSettings: ShowcaseSettings = {
  title: 'Öne Çıkan Kumaşlarımız',
  subtitle: '',
  badge_suffix: 'Kumaş',
  show_model_count: 1,
  show_all_tab: 1,
  all_tab_title: 'Tümü',
  max_items: 24,
  is_active: 1,
};

export function getShowcaseSettings(): ShowcaseSettings {
  const db = dbRepo.read();
  if (!db.showcase_settings) {
    return defaultShowcaseSettings;
  }
  return {
    ...defaultShowcaseSettings,
    ...db.showcase_settings,
  };
}

export function updateShowcaseSettings(updates: Partial<ShowcaseSettings>): ShowcaseSettings {
  const db = dbRepo.read();
  const current = getShowcaseSettings();
  const merged = { ...current, ...updates };
  db.showcase_settings = merged;
  dbRepo.write(db);
  return merged;
}

export function toggleProductShowcase(productId: string, isFeatured?: boolean): { productId: string; is_featured: number } {
  const db = dbRepo.read();
  const prod = db.products.find((p: any) => p.id === productId);
  if (!prod) {
    throw new Error('Ürün bulunamadı');
  }

  if (isFeatured !== undefined) {
    prod.is_featured = isFeatured ? 1 : 0;
  } else {
    prod.is_featured = prod.is_featured === 1 ? 0 : 1;
  }

  prod.updated_at = new Date().toISOString();
  dbRepo.write(db);
  return { productId: prod.id, is_featured: prod.is_featured };
}

export function updateProductShowcaseOrder(productId: string, orderIndex: number) {
  const db = dbRepo.read();
  const prod = db.products.find((p: any) => p.id === productId);
  if (!prod) {
    throw new Error('Ürün bulunamadı');
  }
  prod.vitrin_order = Number(orderIndex) || 0;
  prod.updated_at = new Date().toISOString();
  dbRepo.write(db);
  return { productId: prod.id, vitrin_order: prod.vitrin_order };
}

export function getShowcaseData() {
  const db = dbRepo.read();
  const settings = getShowcaseSettings();
  
  if (!settings.is_active) {
    return {
      settings,
      totalCount: 0,
      categories: [],
      products: [],
    };
  }

  // Get all active featured products
  const featured = (db.products || [])
    .filter((p: any) => p.is_active === 1 && (p.is_featured === 1 || p.is_featured === true))
    .sort((a: any, b: any) => {
      const orderA = a.vitrin_order !== undefined ? Number(a.vitrin_order) : 999;
      const orderB = b.vitrin_order !== undefined ? Number(b.vitrin_order) : 999;
      if (orderA !== orderB) return orderA - orderB;
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    })
    .slice(0, settings.max_items || 24);

  // Group by categories and get counts
  const categoryMap = new Map<string, { id: string; name: string; slug: string; count: number }>();

  for (const prod of featured) {
    const cat = db.categories?.find((c: any) => c.id === prod.category_id);
    if (cat) {
      if (!categoryMap.has(cat.id)) {
        categoryMap.set(cat.id, {
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          count: 0,
        });
      }
      categoryMap.get(cat.id)!.count += 1;
    }
  }

  const categoryList = Array.from(categoryMap.values()).slice(0, 6);

  return {
    settings,
    totalCount: featured.length,
    categories: categoryList,
    products: featured,
  };
}
