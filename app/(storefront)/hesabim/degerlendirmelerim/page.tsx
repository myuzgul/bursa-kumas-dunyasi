'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Star, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  Image as ImageIcon, 
  X, 
  Plus, 
  Sparkles 
} from 'lucide-react';
import { useAuth } from '@/components/storefront/UserContext';

export default function CustomerReviewsPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [eligibleProducts, setEligibleProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Review modal state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imagesList, setImagesList] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchReviews = async () => {
    try {
      const res = await fetch('/api/user/reviews');
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
        setEligibleProducts(data.eligible_to_review || []);
      }
    } catch (e) {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const openReviewModal = (product: any) => {
    setSelectedProduct(product);
    setRating(5);
    setComment('');
    setImageUrl('');
    setImagesList([]);
    setErrorMsg('');
    setReviewModalOpen(true);
  };

  const handleAddImage = () => {
    if (imageUrl.trim()) {
      setImagesList((prev) => [...prev, imageUrl.trim()]);
      setImageUrl('');
    }
  };

  const handleRemoveImage = (idx: number) => {
    setImagesList((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: selectedProduct.id,
          customer_name: user?.full_name || `${user?.first_name} ${user?.last_name}`,
          rating,
          comment,
          images: imagesList,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setReviewModalOpen(false);
        setSuccessMsg('Değerlendirmeniz alındı! Yönetici onayının ardından yayına alınacaktır.');
        setTimeout(() => setSuccessMsg(''), 4000);
        fetchReviews();
      } else {
        setErrorMsg(data.error || 'Değerlendirme kaydedilemedi.');
      }
    } catch (err: any) {
      setErrorMsg('Bağlantı hatası oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <h1 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
          Kumaş Değerlendirmelerim
        </h1>
        <p className="text-xs text-slate-500">
          Satın aldığınız kumaşlar hakkındaki deneyimlerinizi paylaşın, diğer müşterilere rehberlik edin.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Eligible Products to Review */}
      {eligibleProducts.length > 0 && (
        <div className="bg-gradient-to-br from-amber-50/70 to-orange-50/50 rounded-3xl border border-amber-200 p-6 space-y-4">
          <div>
            <h2 className="text-sm font-black text-amber-950 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              Değerlendirme Bekleyen Satın Alımlarınız ({eligibleProducts.length})
            </h2>
            <p className="text-xs text-amber-800">
              Satın aldığınız bu kumaşların dokusunu ve kalitesini puanlayın.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {eligibleProducts.map((p) => (
              <div
                key={p.id}
                className="bg-white p-3.5 rounded-2xl border border-amber-200 shadow-xs flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={p.image || '/placeholder.png'}
                    alt={p.name}
                    className="w-12 h-12 object-cover rounded-xl border border-slate-200 flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate">{p.name}</p>
                    <p className="text-[11px] text-slate-400">SKU: {p.sku}</p>
                  </div>
                </div>

                <button
                  onClick={() => openReviewModal(p)}
                  className="px-3.5 py-1.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex-shrink-0"
                >
                  Değerlendir
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submitted Reviews List */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-black text-slate-900">
          Geçmiş Değerlendirmeleriniz ({reviews.length})
        </h2>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">Yükleniyor...</div>
        ) : reviews.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Henüz bir ürün değerlendirmesi yapmadınız.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 space-y-4">
            {reviews.map((rev) => (
              <div key={rev.id} className="pt-4 first:pt-0 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    {rev.product_image && (
                      <img
                        src={rev.product_image}
                        alt={rev.product_name}
                        className="w-10 h-10 object-cover rounded-xl border border-slate-200"
                      />
                    )}
                    <div>
                      {rev.product_slug ? (
                        <Link
                          href={`/urun/${rev.product_slug}`}
                          className="font-bold text-xs text-slate-900 hover:text-blue-900 transition"
                        >
                          {rev.product_name}
                        </Link>
                      ) : (
                        <span className="font-bold text-xs text-slate-900">{rev.product_name}</span>
                      )}
                      <div className="flex items-center gap-1 mt-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < rev.rating
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    {rev.is_approved === 1 ? (
                      <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Yayında
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-extrabold rounded-full flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Onay Bekliyor
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  {rev.comment}
                </p>

                {rev.images && rev.images.length > 0 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {rev.images.map((img: string, idx: number) => (
                      <img
                        key={idx}
                        src={img}
                        alt="Yorum görseli"
                        className="w-14 h-14 object-cover rounded-xl border border-slate-200"
                      />
                    ))}
                  </div>
                )}

                <p className="text-[10px] text-slate-400">
                  {new Date(rev.created_at).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Write Review Modal */}
      {reviewModalOpen && selectedProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-5 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <img
                  src={selectedProduct.image || '/placeholder.png'}
                  alt={selectedProduct.name}
                  className="w-10 h-10 object-cover rounded-xl border border-slate-200"
                />
                <div>
                  <h3 className="font-black text-slate-900 text-xs line-clamp-1">{selectedProduct.name}</h3>
                  <p className="text-[10px] text-slate-400">Ürün Değerlendirmesi</p>
                </div>
              </div>
              <button
                onClick={() => setReviewModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4 text-xs">
              {/* Star Rating Selector */}
              <div>
                <label className="block font-bold text-slate-700 mb-2">
                  Puanınız <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-110 transition"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= rating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-200'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-slate-700 ml-2">
                    {rating === 5 && 'Mükemmel (5/5)'}
                    {rating === 4 && 'Çok İyi (4/5)'}
                    {rating === 3 && 'İyi (3/5)'}
                    {rating === 2 && 'Orta (2/5)'}
                    {rating === 1 && 'Yetersiz (1/5)'}
                  </span>
                </div>
              </div>

              {/* Comment Body */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Yorumunuz ve Kumaş Deneyiminiz <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Kumaşın dokusu, rengi, dikiş kalitesi ve duruşu hakkında deneyimlerinizi paylaşınız..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-900 resize-none"
                />
              </div>

              {/* Photo Upload / URL */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Fotoğraf Ekle (Opsiyonel)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    placeholder="https://... görsel bağlantısı"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:bg-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddImage}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl"
                  >
                    Ekle
                  </button>
                </div>

                {imagesList.length > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    {imagesList.map((img, idx) => (
                      <div key={idx} className="relative w-12 h-12 rounded-xl overflow-hidden border border-slate-200">
                        <img src={img} alt="eklenen" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 text-red-700 rounded-xl border border-red-200 text-xs font-semibold">
                  {errorMsg}
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition"
                >
                  {submitting ? 'Gönderiliyor...' : 'Değerlendirmeyi Gönder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
