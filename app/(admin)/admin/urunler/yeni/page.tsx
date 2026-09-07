'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Save, Sparkles, Layers, 
  DollarSign, Image as ImageIcon, Search, CheckCircle2, 
  Award, Plus, Trash2, Sliders, Scissors, AlertCircle, Upload 
} from 'lucide-react';
import { CategoryMultiSelect } from '@/components/admin/CategoryMultiSelect';

export default function AdminNewProductPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'info' | 'pricing' | 'variants' | 'images' | 'vitrin'>('info');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; success: boolean } | null>(null);

  // Categories & Badges
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [availableBadges, setAvailableBadges] = useState<any[]>([]);
  const [selectedBadgeIds, setSelectedBadgeIds] = useState<string[]>([]);

  // 1. CLEAN IMAGES (Zero dummy/demo images!)
  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // 2. FORM STATE
  const [formData, setFormData] = useState({
    name: '',
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
    stock_meter: '',
    has_variants: false,
    is_featured: false,
    is_bestseller: false,
    is_new: true,
    vitrin_order: '0',
    meta_title: '',
    meta_description: '',
  });

  // 3. ATTRIBUTE & VARIATION MATRIX STATE
  const [attributesList, setAttributesList] = useState<Array<{ name: string; values: string[] }>>([
    { name: 'Renk', values: ['Zümrüt Yeşili', 'Gece Mavisi', 'Asil Bordo'] },
  ]);
  const [newAttrName, setNewAttrName] = useState('');
  const [newAttrValueInput, setNewAttrValueInput] = useState<Record<string, string>>({});

  const [generatedVariants, setGeneratedVariants] = useState<any[]>([]);

  useEffect(() => {
    // Fetch categories and badges
    fetch('/api/admin/categories', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.categories) {
          setCategories(data.categories);
          if (data.categories.length > 0) {
            setSelectedCategoryIds([data.categories[0].id]);
            setFormData((prev) => ({ ...prev, category_id: data.categories[0].id }));
          }
        }
      })
      .catch(() => {});

    fetch('/api/admin/badges', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.badges) {
          setAvailableBadges(data.badges.filter((b: any) => b.is_active === 1));
        }
      })
      .catch(() => {});
  }, []);

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

  // Computer Local Image Upload
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

  // Generate Variation Matrix Combinations
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

    const newVariants = combinations.map((combo, idx) => {
      const title = Object.values(combo).join(' - ');
      const skuSuffix = Object.values(combo)
        .map((v: any) => v.substring(0, 3).toUpperCase())
        .join('-');
      return {
        id: `var-temp-${idx + 1}`,
        title,
        attributes: combo,
        sku: `${baseSku}-${skuSuffix || idx + 1}`,
        barcode: '',
        price: basePrice,
        discount_price: discountPrice,
        stock_meter: parseFloat(formData.stock_meter) || 50,
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Kumaş kaydedilemedi.');

      setMessage({ text: 'Kumaş ve varyasyonları başarıyla kaydedildi!', success: true });
      setTimeout(() => {
        router.push('/admin/urunler');
      }, 1200);
    } catch (err: any) {
      setMessage({ text: err.message, success: false });
      setIsSaving(false);
    }
  };

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

        <h1 className="text-xl font-black text-slate-900">
          Yeni Kumaş & Varyasyon Tanımla
        </h1>
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
            <span>2. Metre Fiyatı & Stok</span>
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
            <span>3. Varyasyonlar (Renk / Desen)</span>
            {formData.has_variants && (
              <span className="w-2 h-2 rounded-full bg-purple-600"></span>
            )}
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
                    placeholder="Örn: İtalyan Jakarlı Kadife Döşemelik Kumaş"
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
                    placeholder="Örn: BKD-KAD-007"
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
                  placeholder="Örn: 8680001234567"
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
                  placeholder="Örn: 60.000 Martindale aşınma dayanımlı, su itici jakar desenli lüks koltuk kadifesi."
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
                  placeholder="Kumaşın teknik özellikleri, kullanım alanları, yıkama talimatı..."
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs leading-relaxed"
                />
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
                    placeholder="Örn: 295.00"
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
                    placeholder="Örn: 250.00"
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
                      ⚡ Varyasyon Kombinasyonlarını Otomatik Oluştur
                    </button>
                  </div>

                  {/* Generated Variations Table */}
                  {generatedVariants.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-black text-slate-900">
                        Oluşturulan Varyasyonlar ({generatedVariants.length})
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
                                    value={v.stock_meter}
                                    onChange={(e) => updateVariantRow(idx, 'stock_meter', parseFloat(e.target.value) || 0)}
                                    className="w-20 bg-slate-50 border border-slate-300 rounded px-1.5 py-1 text-xs font-black text-emerald-800"
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
                    Bilgisayarınızdan yüksek çözünürlüklü kumaş fotoğraflarını seçin. 1. sıradaki fotoğraf otomatik olarak <strong>Kapak Fotoğrafı</strong> olur.
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

              {/* Uploaded Images List with Reordering */}
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
              <span>{isSaving ? 'Kaydediliyor...' : 'Kumaşı Kaydet & Yayınla'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
