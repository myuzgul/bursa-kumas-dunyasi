import { dbRepo } from '../db/repo';

export interface StorySlide {
  id: string;
  image_url: string;
  title?: string;
  subtitle?: string;
  button_text?: string;
  button_link?: string;
  duration?: number; // seconds, default 5
}

export interface Story {
  id: string;
  title: string;
  cover_image: string;
  order_index: number;
  is_active: number;
  slides: StorySlide[];
  created_at?: string;
  updated_at?: string;
}

const DEFAULT_INITIAL_STORIES: Story[] = [
  {
    id: 'story-1',
    title: 'Yeni Sezon',
    cover_image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=300&q=80',
    order_index: 1,
    is_active: 1,
    slides: [
      {
        id: 'slide-1-1',
        image_url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80',
        title: '2026 İtalyan Kadife Serisi',
        subtitle: 'Su itici, leke tutmaz ve ultra dayanıklı dokuma',
        button_text: 'Koleksiyonu İncele',
        button_link: '/kategori/kadife-dosemelik-kumas',
        duration: 5,
      },
      {
        id: 'slide-1-2',
        image_url: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=800&q=80',
        title: 'Zengin Renk Kartelası',
        subtitle: '30+ farklı renk seçeneği ile doğrudan fabrikadan',
        button_text: 'Renkleri Gör',
        button_link: '/kategori/kadife-dosemelik-kumas',
        duration: 5,
      }
    ],
  },
  {
    id: 'story-2',
    title: 'Çift En Fonluk',
    cover_image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=300&q=80',
    order_index: 2,
    is_active: 1,
    slides: [
      {
        id: 'slide-2-1',
        image_url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
        title: '300 cm Çift En Fonluk Kumaşlar',
        subtitle: 'Eksiz, dökümlü ve kusursuz pile görünümü',
        button_text: 'Fonluk Kumaşlar',
        button_link: '/kategori/cift-en-fonluk-kumas',
        duration: 5,
      }
    ],
  },
  {
    id: 'story-3',
    title: 'Masa & Duck',
    cover_image: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=300&q=80',
    order_index: 3,
    is_active: 1,
    slides: [
      {
        id: 'slide-3-1',
        image_url: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=800&q=80',
        title: 'Desenli Duck Bezi Kumaşlar',
        subtitle: 'Masa örtüsü, kırlent ve ranır için suya dayanıklı dokuma',
        button_text: 'Duck Bezlerini Gör',
        button_link: '/kategori/duck-bezi-kumas',
        duration: 5,
      }
    ],
  },
  {
    id: 'story-4',
    title: '0.5m Kesim',
    cover_image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=300&q=80',
    order_index: 4,
    is_active: 1,
    slides: [
      {
        id: 'slide-4-1',
        image_url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
        title: '0.5 Metre Hassas Lazer Kesim',
        subtitle: 'İstediğiniz ölçüde sipariş verin, fire vermeyin!',
        button_text: 'Tüm Kumaşlar',
        button_link: '/kategori/kadife-dosemelik-kumas',
        duration: 5,
      }
    ],
  },
  {
    id: 'story-5',
    title: 'Bursa Dokuması',
    cover_image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=300&q=80',
    order_index: 5,
    is_active: 1,
    slides: [
      {
        id: 'slide-5-1',
        image_url: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=800&q=80',
        title: 'Bursa Dokuma Fabrikasından',
        subtitle: 'Aracısız, toptan fiyatına perakende kumaş satışı',
        button_text: 'Hikayemizi İncele',
        button_link: '/kategori/kadife-dosemelik-kumas',
        duration: 5,
      }
    ],
  },
];

export function getStories(): Story[] {
  const db = dbRepo.read();
  if (!db.stories || db.stories.length === 0) {
    db.stories = DEFAULT_INITIAL_STORIES;
    dbRepo.write(db);
    return DEFAULT_INITIAL_STORIES;
  }
  return [...db.stories].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
}

export function getActiveStories(): Story[] {
  const stories = getStories();
  return stories.filter((s) => s.is_active === 1 && s.slides && s.slides.length > 0);
}

export function getStoryById(id: string): Story | null {
  const stories = getStories();
  return stories.find((s) => s.id === id) || null;
}

export function createStory(data: Partial<Story>): Story {
  const db = dbRepo.read();
  if (!db.stories) db.stories = [];

  const slides: StorySlide[] = (data.slides || []).map((slide, idx) => ({
    id: slide.id || `slide-${Date.now()}-${idx + 1}`,
    image_url: slide.image_url,
    title: slide.title,
    subtitle: slide.subtitle,
    button_text: slide.button_text,
    button_link: slide.button_link,
    duration: slide.duration || 5,
  }));

  const newStory: Story = {
    id: `story-${Date.now()}`,
    title: data.title || 'Yeni Hikaye',
    cover_image: data.cover_image || (slides.length > 0 ? slides[0].image_url : '/placeholder.jpg'),
    order_index: data.order_index !== undefined ? Number(data.order_index) : db.stories.length + 1,
    is_active: data.is_active !== undefined ? Number(data.is_active) : 1,
    slides: slides,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  db.stories.push(newStory);
  dbRepo.write(db);
  return newStory;
}

export function updateStory(id: string, updates: Partial<Story>): Story {
  const db = dbRepo.read();
  if (!db.stories) db.stories = [];

  const idx = db.stories.findIndex((s: any) => s.id === id);
  if (idx === -1) {
    throw new Error('Hikaye bulunamadı');
  }

  const existing = db.stories[idx];
  const updated: Story = {
    ...existing,
    ...updates,
    slides: updates.slides !== undefined ? updates.slides : existing.slides,
    updated_at: new Date().toISOString(),
  };

  db.stories[idx] = updated;
  dbRepo.write(db);
  return updated;
}

export function deleteStory(id: string): boolean {
  const db = dbRepo.read();
  if (!db.stories) return false;

  const filtered = db.stories.filter((s: any) => s.id !== id);
  if (filtered.length === db.stories.length) {
    return false;
  }

  db.stories = filtered;
  dbRepo.write(db);
  return true;
}
