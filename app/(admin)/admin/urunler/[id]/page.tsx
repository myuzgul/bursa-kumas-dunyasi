'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, Save, Sparkles, Layers, 
  DollarSign, Image as ImageIcon, CheckCircle2, 
  Award, Sliders, Scissors, AlertCircle, Upload,
  History, ExternalLink, RefreshCw
} from 'lucide-react';
import { CategoryMultiSelect } from '@/components/admin/CategoryMultiSelect';

export default function AdminEditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params?.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'pricing' | 'variants' | 'images' | 'vitrin' | 'history'>('info');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; success: boolean } | null>(null);

  // Categories & Badges
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [availableBadges, setAvailableBadges] = useState<any[]>([]);
  const [selectedBadgeIds, setSelectedBadgeIds] = useState<string[]>([]);

  // Images
  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Histories
  const [priceHistory, setPriceHistory] = useState<any[]>([]);
  const [stockHistory, setStockHistory] = useState<any[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    sku: '',
    barcode: '',
    category_id: '',
    short_description: '',
    description: '',
    base_price: '',
    discount_price: '',
    min_order_meter: '1.0',
    meter_step: '0.5',
    max_order_meter: '50.0',
    stock_meter: '100.0',
    has_variants: false,
    is_active: 1,
    is_featured: false,
    is_bestseller: false,
    is_new: false,
    vitrin_order: '0',
    meta_title: '',
    meta_description: '',
  });

  // Attribute & Variation Matrix
  const [attributesList, setAttributesList] = useState<Array<{ name: string; values: string[] }>>([]);
  const [newAttrName, setNewAttrName] = useState('');
  const [newAttrValueInput, setNewAttrValueInput] = useState<Record<string, string>>({});
  const [generatedVariants, setGeneratedVariants] = useState<any[]>([]);

  useEffect(() => {
    // 1. Fetch Categories & Badges & Product
    Promise.all([
      fetch('/api/admin/categories', { cache: 'no-store' }).then((r) => r.ok ? r.json() : null),
      fetch('/api/admin/badges', { cache: 'no-store' }).then((r) => r.ok ? r.json() : null),
      fetch(`/api/admin/products/${productId}`, { cache: 'no-store' }).then((r) => r.ok ? r.json() : null),
    ]).then(([catData, badgeData, prodData]) => {
      if (catData?.categories) setCategories(catData.categories);
      if (badgeData?.badges) setAvailableBadges(badgeData.badges.filter((b: any) => b.is_active === 1));

      if (prodData?.product) {
        const p = prodData.product;
        setFormData({
          name: p.name || '',
          slug: p.slug || '',
          sku: p.sku || '',
          barcode: p.barcode || '',
          category_id: p.category_id || '',
          short_description: p.short_description || '',
          description: p.description || '',
          base_price: String(p.base_price ?? ''),
          discount_price: p.discount_price !== null && p.discount_price !== undefined ? String(p.discount_price) : '',
          min_order_meter: String(p.min_order_meter ?? '1.0'),
          meter_step: String(p.meter_step ?? '0.5'),
          max_order_meter: String(p.max_order_meter ?? '50.0'),
          stock_meter: p.stock_meter !== null && p.stock_meter !== undefined && p.track_stock !== 0 ? String(p.stock_meter) : '',
          has_variants: Boolean(p.has_variants),
          is_active: p.is_active ?? 1,
          is_featured: Boolean(p.is_featured),
          is_bestseller: Boolean(p.is_bestseller),
          is_new: Boolean(p.is_new),
          vitrin_order: String(p.vitrin_order ?? '0'),
          meta_title: p.meta_title || '',
          meta_description: p.meta_description || '',
        });

        // Set Categories
        const initialCatIds = Array.isArray(p.category_ids) && p.category_ids.length > 0
          ? p.category_ids
          : (p.category_id ? [p.category_id] : []);
        setSelectedCategoryIds(initialCatIds);

        // Set Images
        if (p.images && Array.isArray(p.images) && p.images.length > 0) {
          setImages(p.images);
        } else if (p.main_image_url) {
          setImages([p.main_image_url]);
        } else {
          setImages([]);
        }

        // Set Badges
        if (p.badge_ids && Array.isArray(p.badge_ids)) {
          setSelectedBadgeIds(p.badge_ids);
        }

        // Set Attributes & Variants
        if (p.attributes && typeof p.attributes === 'object') {
          const loadedAttrs = Object.entries(p.attributes).map(([key, vals]: [string, any]) => ({
            name: key,
            values: Array.isArray(vals) ? vals : [vals],
          }));
          setAttributesList(loadedAttrs);
        }

        if (p.variants && Array.isArray(p.variants)) {
          setGeneratedVariants(p.variants);
        }

        // History
        if (prodData.priceHistory) setPriceHistory(prodData.priceHistory);
        if (prodData.stockHistory) setStockHistory(prodData.stockHistory);
      }
      setIsLoading(false);
    }).catch(() => {
      setIsLoading(false);
    });
  }, [productId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const toggleBadge = (badgeId: string) => {
    setSelectedBadgeIds((prev) =>
      prev.includes(badgeId) ? prev.filter((id) => id !== badgeId) : [...prev, badgeId]
    );
  };

  // Local Image Upload
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      const newUploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const data = new FormData();
        data.append('file', file);

        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          body: data,
        });

        if (res.ok) {
          const resData = await res.json();
          if (resData.url) newUploadedUrls.push(resData.url);
        }
      }
      setImages((prev) => [...prev, ...newUploadedUrls]);
    } catch (e) {
      alert('Fotoğraf yüklenirken hata oluştu.');
    } finally {
      setIsUploading(false);
    }
  };

  // Attribute Management
  const addAttribute = () => {
    if (!newAttrName.trim()) return;
    if (attributesList.some((a) => a.name.toLowerCase() === newAttrName.trim().toLowerCase())) {
      alert('Bu nitelik zaten ekli.');
      return;
    }
    setAttributesList([...attributesList, { name: newAttrName.trim(), values: [] }]);
    setNewAttrName('');
  };

  const addAttributeValue = (attrName: string) => {
    const val = (newAttrValueInput[attrName] || '').trim();
    if (!val) return;

    setAttributesList((prev) =>
      prev.map((attr) => {
        if (attr.name === attrName && !attr.values.includes(val)) {
          return { ...attr, values: [...attr.values, val] };
        }
        return attr;
      })
    );
    setNewAttrValueInput((prev) => ({ ...prev, [attrName]: '' }));
  };

  const removeAttributeValue = (attrName: string, valToRemove: string) => {
    setAttributesList((prev) =>
      prev.map((attr) => {
        if (attr.name === attrName) {
          return { ...attr, values: attr.values.filter((v) => v !== valToRemove) };
        }
        return attr;
      })
    );
  };

  // Generate Matrix
  const generateVariationsMatrix = () => {
    const activeAttrs = attributesList.filter((a) => a.values.length > 0);
    if (activeAttrs.length === 0) {
      alert('Lütfen en az bir nitelik ve değer tanımlayın (Örn: Renk: Mavi, Siyah).');
      return;
    }

    const combinations: any[] = [];
    const buildCombinations = (current: Record<string, string>, index: number) => {
      if (index === activeAttrs.length) {
        combinations.push({ ...current });
        return;
      }
      const attr = activeAttrs[index];
      for (const val of attr.values) {
        current[attr.name] = val;
        buildCombinations(current, index + 1);
      }
    };

    buildCombinations({}, 0);

    const baseSku = formData.sku ? formData.sku.trim().toUpperCase() : 'BKD-KUMAS';
    const basePrice = parseFloat(formData.base_price) || 0;
    const discountPrice = formData.discount_price ? parseFloat(formData.discount_price) : basePrice;

    const hasParentStock = formData.stock_meter && formData.stock_meter.trim() !== '';
    const defaultVarStock = hasParentStock ? parseFloat(formData.stock_meter) : null;
    const defaultVarTrack = hasParentStock ? 1 : 0;

    const newVariants = combinations.map((combo, idx) => {
      const title = Object.values(combo).join(' - ');
      const skuSuffix = Object.values(combo)
        .map((v: any) => v.substring(0, 3).toUpperCase())
        .join('-');
      
      // Check if variant already exists with matching title
      const existing = generatedVariants.find((gv) => gv.title === title);
      if (existing) {
        return existing;
      }

      return {
        id: `var-${Date.now()}-${idx + 1}`,
        title,
        attributes: combo,
        sku: `${baseSku}-${skuSuffix || idx + 1}`,
        barcode: '',
        price: basePrice,
        discount_price: discountPrice,
        stock_meter: defaultVarStock,
        track_stock: defaultVarTrack,
        image_url: images.length > 0 ? images[0] : '',
        is_active: 1,
      };
    });

    setGeneratedVariants(newVariants);
  };

  const updateVariantRow = (index: number, field: string, value: any) => {
    setGeneratedVariants((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setMessage({ text: 'Lütfen kumaş adını giriniz.', success: false });
      setActiveTab('info');
      return;
    }
    if (!formData.sku.trim()) {
      setMessage({ text: 'Lütfen SKU kodunu giriniz.', success: false });
      setActiveTab('info');
      return;
    }

    setIsSaving(true);
    setMessage(null);

    const payload = {
      id: productId,
      ...formData,
      category_id: selectedCategoryIds[0] || formData.category_id || 'cat-genel',
      category_ids: selectedCategoryIds,
      base_price: parseFloat(formData.base_price) || 0,
      discount_price: formData.discount_price ? parseFloat(formData.discount_price) : null,
      stock_meter: formData.stock_meter.trim() !== '' ? parseFloat(formData.stock_meter) : null,
      track_stock: formData.stock_meter.trim() !== '' ? 1 : 0,
      has_variants: formData.has_variants ? 1 : 0,
      variants: formData.has_variants ? generatedVariants : [],
      attributes: attributesList.reduce((acc, curr) => {
        if (curr.values.length > 0) acc[curr.name] = curr.values;
        return acc;
      }, {} as any),
      badge_ids: selectedBadgeIds,
      images,
      main_image_url: images.length > 0 ? images[0] : '/placeholder.jpg',
    };

    try {
      const res = await fetch('/api/admin/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Güncelleme başarısız oldu.');

      setMessage({ text: 'Kumaş ve varyasyonları başarıyla güncellendi!', success: true });
      setTimeout(() => {
        router.push('/admin/urunler');
      }, 1200);
    } catch (err: any) {
      setMessage({ text: err.message, success: false });
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-500 font-bold text-sm flex items-center justify-center gap-2">
        <RefreshCw className="w-5 h-5 animate-spin text-blue-900" />
        <span>Kumaş detayları yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/urunler"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kumaş Listesine Dön</span>
        </Link>

        <div className="flex items-center gap-3">
          {formData.slug && (
            <Link
              href={`/urun/${formData.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
            >
              <span>Mağazada İncele</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          )}

          <h1 className="text-xl font-black text-slate-900 truncate max-w-md">
            Düzenle: {formData.name}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 overflow-x-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`py-3.5 px-5 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'info'
                ? 'border-blue-900 text-blue-950 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>1. Genel Bilgiler</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pricing')}
            className={`py-3.5 px-5 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'pricing'
                ? 'border-blue-900 text-blue-950 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>2. Fiyat & Stok</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('variants')}
            className={`py-3.5 px-5 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'variants'
                ? 'border-blue-900 text-blue-950 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Scissors className="w-4 h-4" />
            <span>3. Varyasyonlar ({generatedVariants.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('images')}
            className={`py-3.5 px-5 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'images'
                ? 'border-blue-900 text-blue-950 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>4. Fotoğraflar ({images.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('vitrin')}
            className={`py-3.5 px-5 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'vitrin'
                ? 'border-blue-900 text-blue-950 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>5. Vitrin & Rozetler</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`py-3.5 px-5 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-blue-900 text-blue-950 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4" />
            <span>6. Denetim & Geçmiş</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* 1. INFO TAB */}
          {activeTab === 'info' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Kumaş Adı *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-300 focus:bg-white rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    SKU / Ürün Kodu *
                  </label>
                  <input
                    type="text"
                    name="sku"
                    required
                    value={formData.sku}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-300 focus:bg-white rounded-xl px-3 py-2 text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-blue-900 uppercase"
                  />
                </div>
              </div>

              {/* Multi-Category Selector */}
              <CategoryMultiSelect
                categories={categories}
                selectedIds={selectedCategoryIds}
                onChange={(ids) => {
                  setSelectedCategoryIds(ids);
                  if (ids.length > 0) {
                    setFormData((prev) => ({ ...prev, category_id: ids[0] }));
                  }
                }}
              />

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Barkod / GTIN (Opsiyonel)
                </label>
                <input
                  type="text"
                  name="barcode"
                  value={formData.barcode}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-300 focus:bg-white rounded-xl px-3 py-2 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Kısa Açıklama (Spot Metin)
                </label>
                <input
                  type="text"
                  name="short_description"
                  value={formData.short_description}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Detaylı Kumaş Açıklaması & Dokuma Özellikleri
                </label>
                <textarea
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs leading-relaxed"
                />
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-black text-slate-900">Yayın Durumu</div>
                  <div className="text-[11px] text-slate-500">Pasif ürünler mağazada ve arama motorlarında gizlenir.</div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold">
                  <input
                    type="checkbox"
                    checked={formData.is_active === 1}
                    onChange={(e) => setFormData((prev) => ({ ...prev, is_active: e.target.checked ? 1 : 0 }))}
                    className="rounded text-blue-900"
                  />
                  <span>Satışta / Yayında</span>
                </label>
              </div>

              {/* Vitrin & Öne Çıkarma Seçeneği */}
              <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="font-extrabold text-xs text-amber-950 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>Ana Sayfa Vitrininde Gösterilsin mi?</span>
                  </div>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    İşaretlendiğinde bu kumaş ana sayfadaki vitrin bölümünde ve ilgili kategori sekmesinde öne çıkarılır.
                  </p>
                </div>

                <label className="flex items-center gap-2 cursor-pointer bg-white px-3.5 py-2 rounded-xl border border-amber-200 shadow-xs">
                  <input
                    type="checkbox"
                    name="is_featured"
                    checked={formData.is_featured}
                    onChange={handleChange}
                    className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                  />
                  <span className="text-xs font-bold text-slate-900">
                    {formData.is_featured ? '🌟 Vitrinde Göster (Aktif)' : 'Vitrinde Gösterme (Pasif)'}
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* 2. PRICING TAB */}
          {activeTab === 'pricing' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Metre Birim Fiyatı (TL) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="base_price"
                    required
                    value={formData.base_price}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    İndirimli Metre Fiyatı (TL - Opsiyonel)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="discount_price"
                    value={formData.discount_price}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-blue-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Min. Sipariş (Metre)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    name="min_order_meter"
                    value={formData.min_order_meter}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Metre Artış Adımı (0.5m Kesim)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    name="meter_step"
                    value={formData.meter_step}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-800">
                      Mevcut Stok (Metre)
                    </label>
                    <span className="text-[10px] text-slate-400 font-semibold">İsteğe Bağlı</span>
                  </div>
                  <input
                    type="number"
                    step="0.5"
                    name="stock_meter"
                    placeholder="Boş bırakılırsa sınırsız stok"
                    value={formData.stock_meter}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 placeholder:text-slate-400"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    * Boş bırakılırsa stok sınırsızdır. Miktar yazılırsa her siparişte düşer, bittiğinde &quot;Stokta Yok&quot; olur.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 3. VARIANTS TAB */}
          {activeTab === 'variants' && (
            <div className="space-y-6">
              {/* Variable Product Toggle */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-black text-slate-900">Bu Kumaşın Varyasyonları Var mı?</div>
                  <div className="text-[11px] text-slate-500">
                    Farklı renk veya desen seçeneklerine sahip kumaşlar için işaretleyiniz.
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="has_variants"
                    checked={formData.has_variants}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              {formData.has_variants && (
                <div className="space-y-6">
                  {/* Attribute Builder */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-purple-600" />
                      <span>Kumaş Nitelikleri & Seçenekleri</span>
                    </h3>

                    <div className="space-y-3">
                      {attributesList.map((attr, attrIdx) => (
                        <div key={attrIdx} className="p-3.5 bg-white border border-slate-200 rounded-2xl space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-slate-900">{attr.name}</span>
                            <button
                              type="button"
                              onClick={() => setAttributesList(attributesList.filter((_, i) => i !== attrIdx))}
                              className="text-[11px] text-red-600 hover:underline"
                            >
                              Niteliği Sil
                            </button>
                          </div>

                          {/* Value Pills */}
                          <div className="flex flex-wrap gap-1.5">
                            {attr.values.map((v, vIdx) => (
                              <span
                                key={vIdx}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-200"
                              >
                                <span>{v}</span>
                                <button
                                  type="button"
                                  onClick={() => removeAttributeValue(attr.name, v)}
                                  className="text-slate-400 hover:text-red-600"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>

                          {/* Add Value Input */}
                          <div className="flex gap-2 pt-1">
                            <input
                              type="text"
                              placeholder={`${attr.name} değeri ekle (örn: Krem)...`}
                              value={newAttrValueInput[attr.name] || ''}
                              onChange={(e) =>
                                setNewAttrValueInput({ ...newAttrValueInput, [attr.name]: e.target.value })
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  addAttributeValue(attr.name);
                                }
                              }}
                              className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs"
                            />
                            <button
                              type="button"
                              onClick={() => addAttributeValue(attr.name)}
                              className="px-3 py-1 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg"
                            >
                              Ekle
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Add New Attribute */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Yeni Nitelik Adı (Örn: Desen, Kumaş Eni)..."
                          value={newAttrName}
                          onChange={(e) => setNewAttrName(e.target.value)}
                          className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                        />
                        <button
                          type="button"
                          onClick={addAttribute}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl"
                        >
                          + Nitelik Ekle
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={generateVariationsMatrix}
                      className="w-full py-2.5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-black text-xs rounded-xl shadow transition"
                    >
                      ⚡ Varyasyon Matrisini Yenile / Birleştir
                    </button>
                  </div>

                  {/* Generated Variations Table */}
                  {generatedVariants.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-black text-slate-900">
                        Tanımlı Varyasyonlar ({generatedVariants.length})
                      </h4>

                      <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[10px]">
                              <th className="p-3">Varyasyon</th>
                              <th className="p-3">Varyasyon SKU</th>
                              <th className="p-3">Metre Fiyatı (TL)</th>
                              <th className="p-3">İndirimli (TL)</th>
                              <th className="p-3">Stok (Metre)</th>
                              <th className="p-3 text-center">Aktif</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {generatedVariants.map((v, idx) => (
                              <tr key={idx}>
                                <td className="p-3 font-bold text-slate-900">{v.title}</td>
                                <td className="p-3">
                                  <input
                                    type="text"
                                    value={v.sku}
                                    onChange={(e) => updateVariantRow(idx, 'sku', e.target.value)}
                                    className="w-28 bg-slate-50 border border-slate-300 rounded px-1.5 py-1 text-xs font-mono"
                                  />
                                </td>
                                <td className="p-3">
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={v.price}
                                    onChange={(e) => updateVariantRow(idx, 'price', parseFloat(e.target.value) || 0)}
                                    className="w-20 bg-slate-50 border border-slate-300 rounded px-1.5 py-1 text-xs font-bold"
                                  />
                                </td>
                                <td className="p-3">
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={v.discount_price}
                                    onChange={(e) => updateVariantRow(idx, 'discount_price', parseFloat(e.target.value) || 0)}
                                    className="w-20 bg-slate-50 border border-slate-300 rounded px-1.5 py-1 text-xs font-bold text-blue-900"
                                  />
                                </td>
                                <td className="p-3">
                                  <input
                                    type="number"
                                    step="0.5"
                                    placeholder="Sınırsız"
                                    value={v.stock_meter !== null && v.stock_meter !== undefined ? v.stock_meter : ''}
                                    onChange={(e) => {
                                      const val = e.target.value.trim();
                                      updateVariantRow(idx, 'stock_meter', val === '' ? null : parseFloat(val));
                                      updateVariantRow(idx, 'track_stock', val === '' ? 0 : 1);
                                    }}
                                    className="w-24 bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs font-black text-emerald-800 placeholder:text-slate-400 placeholder:font-normal"
                                  />
                                </td>
                                <td className="p-3 text-center">
                                  <input
                                    type="checkbox"
                                    checked={v.is_active === 1}
                                    onChange={(e) => updateVariantRow(idx, 'is_active', e.target.checked ? 1 : 0)}
                                    className="rounded text-purple-600"
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 4. IMAGES TAB */}
          {activeTab === 'images' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-black text-slate-900">Kumaş Fotoğrafları</h3>
                  <p className="text-[11px] text-slate-500">
                    Bilgisayarınızdan fotoğraf ekleyin veya sıralamayı değiştirin. 1. sıradaki fotoğraf <strong>Kapak Fotoğrafı</strong> olarak kullanılır.
                  </p>
                </div>

                <label className="px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow cursor-pointer flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  <span>{isUploading ? 'Yükleniyor...' : 'Bilgisayardan Fotoğraf Seç'}</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    disabled={isUploading}
                    onChange={(e) => handleFileUpload(e.target.files)}
                    className="hidden"
                  />
                </label>
              </div>

              {images.length === 0 ? (
                <div className="p-12 text-center border-2 border-dashed border-slate-300 rounded-3xl space-y-2 text-slate-500">
                  <ImageIcon className="w-10 h-10 text-slate-400 mx-auto" />
                  <p className="font-bold text-sm text-slate-700">Henüz fotoğraf eklenmedi.</p>
                  <p className="text-xs text-slate-400">
                    Yukarıdaki butona tıklayarak bilgisayarınızdan kumaş görsellerini yükleyebilirsiniz.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {images.map((imgUrl, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-2xl border bg-white shadow-xs space-y-2 relative transition ${
                        idx === 0 ? 'border-blue-900 ring-2 ring-blue-900/20' : 'border-slate-200'
                      }`}
                    >
                      {idx === 0 && (
                        <span className="absolute top-4 left-4 z-10 bg-blue-900 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-md">
                          🌟 KAPAK FOTOĞRAFI
                        </span>
                      )}

                      <div className="w-full h-40 rounded-xl overflow-hidden bg-slate-100 border">
                        <img
                          src={imgUrl}
                          alt={`Kumaş Fotoğrafı ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] font-bold text-slate-500 font-mono">
                          Sıra: #{idx + 1}
                        </span>

                        <div className="flex items-center gap-1">
                          {idx > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                const copy = [...images];
                                const [moved] = copy.splice(idx, 1);
                                copy.unshift(moved);
                                setImages(copy);
                              }}
                              className="px-2 py-1 bg-blue-50 text-blue-900 hover:bg-blue-100 font-bold rounded text-[10px]"
                            >
                              Kapak Yap
                            </button>
                          )}

                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => {
                              if (idx === 0) return;
                              const copy = [...images];
                              const temp = copy[idx];
                              copy[idx] = copy[idx - 1];
                              copy[idx - 1] = temp;
                              setImages(copy);
                            }}
                            className="p-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 rounded text-slate-700"
                            title="Yukarı Taşı"
                          >
                            ▲
                          </button>

                          <button
                            type="button"
                            disabled={idx === images.length - 1}
                            onClick={() => {
                              if (idx === images.length - 1) return;
                              const copy = [...images];
                              const temp = copy[idx];
                              copy[idx] = copy[idx + 1];
                              copy[idx + 1] = temp;
                              setImages(copy);
                            }}
                            className="p-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 rounded text-slate-700"
                            title="Aşağı Taşı"
                          >
                            ▼
                          </button>

                          <button
                            type="button"
                            onClick={() => setImages(images.filter((_, i) => i !== idx))}
                            className="p-1 bg-red-50 hover:bg-red-100 text-red-600 rounded"
                            title="Sil"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 5. VITRIN & ROZETLER TAB */}
          {activeTab === 'vitrin' && (
            <div className="space-y-6">
              {/* Vitrin Visibility Toggles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 text-xs">
                  <input
                    type="checkbox"
                    name="is_featured"
                    checked={formData.is_featured}
                    onChange={handleChange}
                    className="rounded text-blue-900"
                  />
                  <span>Vitrinde Göster</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 text-xs">
                  <input
                    type="checkbox"
                    name="is_bestseller"
                    checked={formData.is_bestseller}
                    onChange={handleChange}
                    className="rounded text-blue-900"
                  />
                  <span>Çok Satan</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 text-xs">
                  <input
                    type="checkbox"
                    name="is_new"
                    checked={formData.is_new}
                    onChange={handleChange}
                    className="rounded text-blue-900"
                  />
                  <span>Yeni Ürün</span>
                </label>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-xs">
                    Vitrin Sırası
                  </label>
                  <input
                    type="number"
                    name="vitrin_order"
                    value={formData.vitrin_order}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold"
                  />
                </div>
              </div>

              {/* Badges Selector */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-amber-500" />
                      <span>Bu Kumaşa Eklenecek Rozetler</span>
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Kart üzerinde ve ürün detayında görünmesini istediğiniz rozetlere tıklayarak aktif/pasif yapın.
                    </p>
                  </div>
                  <Link
                    href="/admin/rozetler"
                    target="_blank"
                    className="text-[11px] font-bold text-blue-900 hover:underline flex items-center gap-1"
                  >
                    <span>+ Yeni Rozet Tanımla</span>
                  </Link>
                </div>

                <div className="flex flex-wrap gap-2.5 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  {availableBadges.length === 0 ? (
                    <div className="text-xs text-slate-400">Rozetler yükleniyor...</div>
                  ) : (
                    availableBadges.map((badge) => {
                      const isSelected = selectedBadgeIds.includes(badge.id);
                      return (
                        <button
                          key={badge.id}
                          type="button"
                          onClick={() => toggleBadge(badge.id)}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-black flex items-center gap-1.5 transition-all shadow-xs ${
                            isSelected
                              ? 'ring-2 ring-slate-900 ring-offset-2 scale-102'
                              : 'opacity-40 grayscale hover:opacity-80 hover:grayscale-0'
                          }`}
                          style={{
                            backgroundColor: badge.bg_color || '#2563eb',
                            color: badge.text_color || '#ffffff',
                          }}
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>{badge.title}</span>
                          {isSelected && <span className="ml-1 text-[10px]">✓</span>}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 6. AUDIT & HISTORY TAB */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Stock History */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <History className="w-4 h-4 text-emerald-600" />
                    <span>Stok Değişim Geçmişi</span>
                  </h3>

                  {stockHistory.length === 0 ? (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-400">
                      Kayıtlı stok hareket kaydı bulunamadı.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {stockHistory.map((sh, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                          <div className="flex items-center justify-between font-bold">
                            <span className="text-slate-800">{sh.reason || 'Manuel Düzenleme'}</span>
                            <span className="text-slate-500 font-mono text-[11px]">
                              {new Date(sh.created_at).toLocaleString('tr-TR')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-600 text-[11px]">
                            <span>Önceki: {sh.old_stock}m</span>
                            <span>→</span>
                            <span className="font-bold text-emerald-700">Yeni: {sh.new_stock}m</span>
                            <span className="text-slate-400">({sh.change_amount > 0 ? `+${sh.change_amount}` : sh.change_amount}m)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Price History */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-blue-600" />
                    <span>Fiyat Değişim Geçmişi</span>
                  </h3>

                  {priceHistory.length === 0 ? (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-400">
                      Kayıtlı fiyat hareket kaydı bulunamadı.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {priceHistory.map((ph, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                          <div className="flex items-center justify-between font-bold">
                            <span className="text-slate-800">Fiyat Güncellemesi</span>
                            <span className="text-slate-500 font-mono text-[11px]">
                              {new Date(ph.created_at).toLocaleString('tr-TR')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-600 text-[11px]">
                            <span>Önceki: {ph.old_price} TL</span>
                            <span>→</span>
                            <span className="font-bold text-blue-900">Yeni: {ph.new_price} TL</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {message && (
            <div
              className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                message.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{message.text}</span>
            </div>
          )}

          {/* Footer Submit */}
          <div className="pt-6 border-t border-slate-200 flex justify-end gap-3">
            <Link
              href="/admin/urunler"
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
            >
              İptal
            </Link>

            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
