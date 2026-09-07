'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FabricZoomGallery } from './FabricZoomGallery';
import { MeterSelector } from './MeterSelector';
import { ProductCard } from './ProductCard';
import { useCart } from './CartContext';
import { formatCurrency } from '@/lib/services/meterEngine';
import { 
  ShoppingBag, Zap, ShieldCheck, Truck, RotateCcw, 
  MessageSquare, Star, MessageCircle, Scissors, Award, Sparkles,
  Camera, Upload, CheckCircle2, AlertCircle, X, Maximize2
} from 'lucide-react';

interface ProductDetailClientProps {
  product: any;
  category: any;
  variants: any[];
  images: any[];
  reviews: any[];
  relatedProducts: any[];
}

export const ProductDetailClient: React.FC<ProductDetailClientProps> = ({
  product,
  category,
  variants,
  images,
  reviews: initialReviews,
  relatedProducts,
}) => {
  const router = useRouter();
  const { addItem } = useCart();

  const [selectedVariant, setSelectedVariant] = useState<any>(
    variants && variants.length > 0 ? variants[0] : null
  );

  const [meter, setMeter] = useState<number>(product.min_order_meter || 1.0);
  const [activeTab, setActiveTab] = useState<'desc' | 'reviews'>('desc');

  const scrollToReviews = () => {
    setActiveTab('reviews');
    const el = document.getElementById('product-reviews-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Review Form State
  const [reviewsList, setReviewsList] = useState<any[]>(initialReviews || []);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewHoverRating, setReviewHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewImages, setReviewImages] = useState<string[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSuccessMessage, setReviewSuccessMessage] = useState<string | null>(null);
  const [reviewErrorMessage, setReviewErrorMessage] = useState<string | null>(null);
  const [selectedReviewPhoto, setSelectedReviewPhoto] = useState<string | null>(null);
  const [showSewingGuideModal, setShowSewingGuideModal] = useState(false);
  const [shippingSettings, setShippingSettings] = useState<{ free_shipping_threshold: number; announcement_text?: string } | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowSewingGuideModal(false);
        setSelectedReviewPhoto(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    fetch('/api/settings/shipping')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.settings) {
          setShippingSettings(data.settings);
        }
      })
      .catch(() => {});
  }, []);

  const unitPrice = selectedVariant?.discount_price || selectedVariant?.price || product.discount_price || product.base_price;
  const originalPrice = selectedVariant?.price || product.base_price;
  const hasDiscount = originalPrice > unitPrice;
  const discountPercent = hasDiscount ? Math.round(((originalPrice - unitPrice) / originalPrice) * 100) : 0;
  
  // Stock determination: optional tracking or tracked limit
  const isStockTracked = (selectedVariant?.track_stock ?? product.track_stock) === 1 ||
    ((selectedVariant?.stock_meter ?? product.stock_meter) !== null &&
     (selectedVariant?.stock_meter ?? product.stock_meter) !== undefined &&
     (selectedVariant?.track_stock ?? product.track_stock) !== 0);
  const currentStock = isStockTracked ? Number(selectedVariant?.stock_meter ?? product.stock_meter ?? 0) : null;
  const isOutOfStock = isStockTracked && (currentStock === null || currentStock <= 0);

  // Active gallery images: guarantee at least 1 image
  const galleryImages = images && images.length > 0
    ? images
    : [{ id: 'main', image_url: product.main_image_url || '/placeholder.jpg' }];

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    if (isStockTracked && currentStock !== null && meter > currentStock) {
      alert(`Mevcut stok (${currentStock}m) talep edilen metreden azdır.`);
      return;
    }

    addItem({
      productId: product.id,
      variantId: selectedVariant?.id,
      name: product.name,
      variantTitle: selectedVariant?.title,
      sku: selectedVariant?.sku || product.sku,
      image: selectedVariant?.image_url || (images.length > 0 ? images[0].image_url : product.main_image_url),
      unitPrice,
      meterQuantity: meter,
      maxStockMeter: currentStock ?? 1000,
    });
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    handleAddToCart();
    router.push('/checkout');
  };

  const handlePhotoUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploadingPhoto(true);
    setReviewErrorMessage(null);

    try {
      const uploaded: string[] = [];
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
          if (resData.url) uploaded.push(resData.url);
        }
      }
      setReviewImages((prev) => [...prev, ...uploaded]);
    } catch (e) {
      setReviewErrorMessage('Fotoğraf yüklenirken bir sorun oluştu.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewName.trim()) {
      setReviewErrorMessage('Lütfen adınızı ve soyadınızı giriniz.');
      return;
    }
    if (!reviewComment.trim()) {
      setReviewErrorMessage('Lütfen kumaş hakkındaki deneyiminizi yazınız.');
      return;
    }

    setIsSubmittingReview(true);
    setReviewErrorMessage(null);
    setReviewSuccessMessage(null);

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: product.id,
          customer_name: reviewName.trim(),
          rating: reviewRating,
          comment: reviewComment.trim(),
          images: reviewImages,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Yorum gönderilemedi.');

      setReviewSuccessMessage(data.message || 'Değerlendirmeniz alındı. Yönetici onayından sonra yayınlanacaktır.');
      setReviewName('');
      setReviewComment('');
      setReviewImages([]);
      setReviewRating(5);
      setShowReviewForm(false);
    } catch (err: any) {
      setReviewErrorMessage(err.message);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const whatsappMessage = encodeURIComponent(
    `Merhaba, bursakumasdunyasi.com üzerinden "${product.name}" (${selectedVariant ? selectedVariant.title : ''}) kumaşı hakkında bilgi almak istiyorum. Ürün Kodu: ${selectedVariant?.sku || product.sku}`
  );

  const specs = typeof product.technical_specs === 'string'
    ? JSON.parse(product.technical_specs || '{}')
    : product.technical_specs || {};

  return (
    <div className="space-y-12">
      {/* 1. TOP SECTION: GALLERY + BUYING BOX */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
        {/* Gallery (6 cols) */}
        <div className="lg:col-span-6">
          <FabricZoomGallery images={galleryImages} productName={product.name} />
        </div>

        {/* Product Details & Actions (6 cols) */}
        <div className="lg:col-span-6 space-y-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-blue-900 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                {category ? category.name : 'Bursa Dokuma Kumaş'}
              </span>

              {/* Custom Badges */}
              {product.badge_ids &&
                product.badge_ids.map((bId: string) => {
                  const BADGE_MAP: Record<string, { title: string; bg: string; text: string }> = {
                    'badge-cok-satan': { title: 'Çok Satan', bg: '#f59e0b', text: '#0f172a' },
                    'badge-yeni-sezon': { title: 'Yeni Sezon', bg: '#2563eb', text: '#ffffff' },
                    'badge-su-itici': { title: 'Su & Leke İtici', bg: '#0284c7', text: '#ffffff' },
                    'badge-pamuk': { title: '%100 Pamuk', bg: '#16a34a', text: '#ffffff' },
                    'badge-bursa-dokumasi': { title: 'Bursa Dokuması', bg: '#1e1b4b', text: '#facc15' },
                    'badge-cift-en': { title: '280 cm Çift En', bg: '#7c3aed', text: '#ffffff' },
                    'badge-firsat': { title: 'Fırsat Ürünü', bg: '#dc2626', text: '#ffffff' },
                    'badge-pet-friendly': { title: 'Pet-Friendly', bg: '#0d9488', text: '#ffffff' },
                  };
                  const b = BADGE_MAP[bId];
                  if (!b) return null;
                  return (
                    <span
                      key={bId}
                      className="text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1"
                      style={{ backgroundColor: b.bg, color: b.text }}
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>{b.title}</span>
                    </span>
                  );
                })}
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-2 leading-snug">
              {product.name}
            </h1>

            <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
              <span>SKU: <strong className="text-slate-700">{selectedVariant?.sku || product.sku}</strong></span>
              <span>•</span>
              <button 
                type="button" 
                onClick={scrollToReviews}
                className="flex items-center gap-1.5 text-amber-500 hover:underline cursor-pointer group"
                title="Müşteri değerlendirmelerine git"
              >
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="text-slate-700 font-bold group-hover:text-blue-900 transition">
                  ({reviewsList.length} Değerlendirme)
                </span>
              </button>
            </div>

            {/* Spot / Short Description Display */}
            {product.short_description && (
              <div className="mt-3.5 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-600 font-medium leading-relaxed">
                {product.short_description}
              </div>
            )}
          </div>

          {/* Price Box */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-500 font-medium">Metre Birim Fiyatı</div>
              
              {/* Dikim Rehberi Button */}
              <button
                type="button"
                onClick={() => setShowSewingGuideModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold transition shadow-xs group"
                title="Hangi kıyafet için kaç metre kumaş gerekir?"
              >
                <Scissors className="w-3.5 h-3.5 text-amber-700 group-hover:rotate-12 transition-transform" />
                <span>Dikim Rehberi</span>
              </button>
            </div>

            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl sm:text-3xl font-black text-blue-950">
                {formatCurrency(unitPrice)}
              </span>
              <span className="text-xs font-semibold text-slate-500">/ metre</span>

              {hasDiscount && (
                <>
                  <span className="text-sm text-slate-400 line-through ml-2">
                    {formatCurrency(originalPrice)}
                  </span>
                  <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
                    %{discountPercent} İNDİRİM
                  </span>
                </>
              )}
            </div>
            <div className="text-[11px] text-slate-500">
              {shippingSettings?.free_shipping_threshold === 0
                ? 'KDV Dahildir. Tüm siparişlerde kargo ücretsizdir.'
                : `KDV Dahildir. ${(shippingSettings?.free_shipping_threshold ?? 1000).toLocaleString('tr-TR')} TL üzeri siparişlerde kargo ücretsizdir.`}
            </div>
          </div>

          {/* Color / Variant Selector */}
          {variants.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                <span>Renk / Desen Seçeneği:</span>
                <span className="text-blue-900 font-semibold">{selectedVariant?.title}</span>
              </label>

              <div className="flex flex-wrap gap-2">
                {variants.map((v) => {
                  const isSelected = selectedVariant?.id === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariant(v)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center gap-2 transition ${
                        isSelected
                          ? 'border-blue-900 bg-blue-50/50 text-blue-950 ring-2 ring-blue-900/20 shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {v.color_code && (
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-xs"
                          style={{ backgroundColor: v.color_code }}
                        />
                      )}
                      <span>{v.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Precision Meter Selector */}
          <MeterSelector
            meter={meter}
            unitPrice={unitPrice}
            minMeter={product.min_order_meter || 1.0}
            stepMeter={product.meter_step || 0.5}
            maxMeter={product.max_order_meter || 50.0}
            stockMeter={currentStock}
            isTracked={isStockTracked}
            onChange={(m) => setMeter(m)}
          />

          {/* Out of Stock Notice */}
          {isOutOfStock && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-2.5 text-xs text-red-800 font-semibold">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <div>
                <div className="font-bold text-red-900">Bu kumaşın stoğu tükenmiştir</div>
                <div className="text-[11px] text-red-700">Yeni parti dokuma ve özel kesim için WhatsApp hattımızdan bilgi alabilirsiniz.</div>
              </div>
            </div>
          )}

          {/* Call to Actions */}
          <div className="space-y-2.5 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className={`w-full py-3.5 px-4 font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-md transition ${
                  isOutOfStock
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed border border-slate-300 shadow-none'
                    : 'bg-slate-900 hover:bg-slate-800 text-white transform active:scale-95'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{isOutOfStock ? 'Stokta Yok' : `Sepete Ekle (${meter}m)`}</span>
              </button>

              <button
                type="button"
                onClick={handleBuyNow}
                disabled={isOutOfStock}
                className={`w-full py-3.5 px-4 font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-md transition ${
                  isOutOfStock
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-200 shadow-none'
                    : 'bg-blue-900 hover:bg-blue-800 text-white transform active:scale-95'
                }`}
              >
                <Zap className={`w-4 h-4 ${isOutOfStock ? 'text-slate-400' : 'text-amber-300'}`} />
                <span>{isOutOfStock ? 'Tükendi' : 'Hemen Satın Al'}</span>
              </button>
            </div>

            {/* WhatsApp Direct Support */}
            <a
              href={`https://wa.me/905423939816?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>WhatsApp ile Bu Kumaş Hakkında Bilgi Al</span>
            </a>
          </div>

          {/* Trust Highlights */}
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-[11px] text-slate-600">
            <div className="flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-blue-600" />
              <span>Aynı Gün DHL Kargo (MNG Kargo)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Scissors className="w-4 h-4 text-blue-600" />
              <span>Hassas Metre Kesim</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>PayTR Güvenli Ödeme</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-blue-600" />
              <span>%100 Orijinal Dokuma</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. PRODUCT TABS (AÇIKLAMA & MÜŞTERİ DEĞERLENDİRMELERİ) */}
      <div id="product-reviews-section" className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm scroll-mt-24">
        {/* Tab Headers */}
        <div className="flex border-b border-slate-200 bg-slate-50/70 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('desc')}
            className={`py-4 px-6 text-xs sm:text-sm font-bold border-b-2 transition flex-shrink-0 ${
              activeTab === 'desc'
                ? 'border-blue-900 text-blue-950 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Ürün Açıklaması & Özellikler
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reviews')}
            className={`py-4 px-6 text-xs sm:text-sm font-bold border-b-2 transition flex-shrink-0 flex items-center gap-2 ${
              activeTab === 'reviews'
                ? 'border-blue-900 text-blue-950 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Müşteri Değerlendirmeleri</span>
            <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-blue-100 text-blue-900">
              {reviewsList.length}
            </span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 sm:p-8">
          {activeTab === 'desc' && (
            <div className="prose max-w-none text-slate-700 text-xs sm:text-sm space-y-4 whitespace-pre-line leading-relaxed">
              {product.description || product.short_description || 'Bu kumaş için detaylı açıklama hazırlanmaktadır.'}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-8 max-w-3xl">
              {/* Header with Add Review Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Müşteri Deneyimleri & Fotoğraflı Yorumlar</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Kumaşı satın alan müşterilerimizin gerçek fotoğraflı değerlendirmeleri.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowReviewForm(!showReviewForm)}
                  className="px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-2 justify-center"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>{showReviewForm ? 'Formu Kapat' : 'Yorum Yap & Fotoğraf Ekle'}</span>
                </button>
              </div>

              {/* Review Submission Form */}
              {showReviewForm && (
                <form
                  onSubmit={handleSubmitReview}
                  className="p-6 bg-white rounded-2xl border-2 border-blue-900/30 shadow-md space-y-4 animate-in fade-in duration-200"
                >
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Kumaşı Değerlendir
                  </h4>

                  {/* Rating Picker */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Puanınız *
                    </label>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setReviewHoverRating(star)}
                          onMouseLeave={() => setReviewHoverRating(0)}
                          onClick={() => setReviewRating(star)}
                          className="p-1 focus:outline-none transition transform hover:scale-110"
                        >
                          <Star
                            className={`w-6 h-6 ${
                              (reviewHoverRating || reviewRating) >= star
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-300'
                            }`}
                          />
                        </button>
                      ))}
                      <span className="ml-2 text-xs font-bold text-slate-700">
                        {reviewRating} / 5 Yıldız
                      </span>
                    </div>
                  </div>

                  {/* Name Input */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Adınız ve Soyadınız *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Örn: Ayşe Yılmaz"
                      value={reviewName}
                      onChange={(e) => setReviewName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 focus:bg-white rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-900"
                    />
                  </div>

                  {/* Comment Input */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Yorumunuz & Deneyiminiz *
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Kumaşın dokusu, rengi, dikiş kolaylığı veya koltuğunuzdaki duruşu hakkında deneyimlerinizi paylaşın..."
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 focus:bg-white rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-900"
                    />
                  </div>

                  {/* Photo Upload Input */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-800">
                      Fotoğraf Ekle (Kumaşın Evinizdeki / Koltuğunuzdaki Görseli - Opsiyonel)
                    </label>

                    <div className="flex flex-wrap items-center gap-3">
                      <label className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-bold text-xs rounded-xl cursor-pointer flex items-center gap-2 transition">
                        <Camera className="w-4 h-4 text-blue-900" />
                        <span>{isUploadingPhoto ? 'Yükleniyor...' : 'Bilgisayar / Telefondan Fotoğraf Seç'}</span>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          disabled={isUploadingPhoto}
                          onChange={(e) => handlePhotoUpload(e.target.files)}
                          className="hidden"
                        />
                      </label>

                      <span className="text-[11px] text-slate-400">
                        (Maks. 5 fotoğraf, JPG/PNG/WEBP)
                      </span>
                    </div>

                    {/* Uploaded Photos Preview List */}
                    {reviewImages.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {reviewImages.map((imgUrl, idx) => (
                          <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-300 group">
                            <img src={imgUrl} alt={`Yorum Foto ${idx + 1}`} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setReviewImages(reviewImages.filter((_, i) => i !== idx))}
                              className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5 opacity-90 hover:opacity-100 shadow"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Error & Success Messages */}
                  {reviewErrorMessage && (
                    <div className="p-3 bg-red-50 text-red-800 border border-red-200 rounded-xl text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      <span>{reviewErrorMessage}</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmittingReview || isUploadingPhoto}
                      className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      <span>{isSubmittingReview ? 'Gönderiliyor...' : 'Yorumu Gönder (Onaya İlet)'}</span>
                    </button>
                  </div>
                </form>
              )}

              {reviewSuccessMessage && (
                <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <span>{reviewSuccessMessage}</span>
                </div>
              )}

              {/* Reviews List */}
              {reviewsList.length === 0 ? (
                <div className="text-center p-8 border border-dashed border-slate-200 rounded-2xl text-slate-500 space-y-2">
                  <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-semibold">Bu kumaş için henüz yayınlanmış bir yorum bulunmamaktadır.</p>
                  <p className="text-[11px] text-slate-400">İlk fotoğraflı değerlendirmeyi yaparak diğer kumaş severlere rehberlik edin!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviewsList.map((r) => (
                    <div
                      key={r.id}
                      className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-black text-xs text-slate-900">{r.customer_name}</span>
                          {r.is_verified_purchase && (
                            <span className="ml-2 text-[10px] font-bold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-full">
                              ✓ Doğrulanmış Alıcı
                            </span>
                          )}
                        </div>
                        <div className="flex text-amber-400">
                          {[...Array(r.rating || 5)].map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                          ))}
                        </div>
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed">
                        &ldquo;{r.comment}&rdquo;
                      </p>

                      {/* Customer Attached Photos */}
                      {r.images && Array.isArray(r.images) && r.images.length > 0 && (
                        <div className="pt-2">
                          <div className="text-[11px] font-bold text-slate-500 mb-1.5 flex items-center gap-1">
                            <Camera className="w-3.5 h-3.5 text-blue-900" />
                            <span>Müşteri Fotoğrafları ({r.images.length})</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {r.images.map((photoUrl: string, pIdx: number) => (
                              <button
                                key={pIdx}
                                type="button"
                                onClick={() => setSelectedReviewPhoto(photoUrl)}
                                className="w-16 h-16 rounded-xl overflow-hidden border-2 border-slate-200 hover:border-blue-900 transition shadow-xs group relative"
                              >
                                <img
                                  src={photoUrl}
                                  alt={`Müşteri Foto ${pIdx + 1}`}
                                  className="w-full h-full object-cover group-hover:scale-105 transition"
                                />
                                <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                                  <Maximize2 className="w-4 h-4" />
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {r.created_at && (
                        <div className="text-[10px] text-slate-400 font-mono">
                          {new Date(r.created_at).toLocaleDateString('tr-TR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Review Photo Lightbox Modal */}
      {selectedReviewPhoto && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedReviewPhoto(null)}
        >
          <div className="relative max-w-2xl max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setSelectedReviewPhoto(null)}
              className="absolute -top-10 right-0 p-1.5 text-white bg-slate-800 hover:bg-slate-700 rounded-full shadow-lg"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={selectedReviewPhoto}
              alt="Müşteri Değerlendirme Fotoğrafı"
              className="max-h-[80vh] max-w-full rounded-2xl shadow-2xl object-contain"
            />
          </div>
        </div>
      )}

      {/* Dikim Rehberi Modal */}
      {showSewingGuideModal && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150 overflow-y-auto"
          onClick={() => setShowSewingGuideModal(false)}
        >
          <div 
            className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center">
                  <Scissors className="w-4 h-4 text-amber-700" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                    Bursa Kumaş Dünyası – Dikim Rehberi
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Hangi kıyafet için ne kadar kumaş gerekir? Doğru ölçü, mükemmel uyum.
                  </p>
                </div>
              </div>

              {/* Close Button on Top Right */}
              <button
                type="button"
                onClick={() => setShowSewingGuideModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition"
                aria-label="Kapat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body with Sewing Guide Image */}
            <div className="p-3 sm:p-5 overflow-y-auto bg-slate-100 flex items-center justify-center">
              <div className="rounded-2xl overflow-hidden shadow border border-slate-200 bg-white max-w-full">
                <img
                  src="/images/dikim-rehberi.jpg"
                  alt="Bursa Kumaş Dünyası Dikim Rehberi"
                  className="w-full h-auto object-contain max-h-[68vh] mx-auto select-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 flex-shrink-0">
              <span>
                💡 <strong>Not:</strong> Ölçüler 150 cm enindeki kumaşlar ve standart bedenler (38-42) baz alınarak hazırlanmıştır.
              </span>
              <button
                type="button"
                onClick={() => setShowSewingGuideModal(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition w-full sm:w-auto"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. RELATED PRODUCTS (BENZER KUMAŞLAR) */}
      {relatedProducts.length > 0 && (
        <section className="space-y-4 pt-6 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-blue-900 uppercase tracking-wider">
                İlginizi Çekebilecek Kumaşlar
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Benzer Kumaş Çeşitleri
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
