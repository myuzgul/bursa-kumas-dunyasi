'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  MessageSquare, Star, CheckCircle2, XCircle, Trash2, 
  ExternalLink, Camera, RefreshCw, AlertCircle, Maximize2, X
} from 'lucide-react';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; success: boolean } | null>(null);

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/reviews', { cache: 'no-store' });
      const data = await res.json();
      if (data && data.reviews) {
        setReviews(data.reviews);
      }
    } catch (e) {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleStatusUpdate = async (reviewId: string, newStatus: number) => {
    setActionLoadingId(reviewId);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: reviewId, is_approved: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'İşlem başarısız.');

      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, is_approved: newStatus } : r))
      );
      setMessage({
        text: newStatus === 1 ? 'Yorum onaylandı ve mağazada yayına alındı!' : 'Yorum durumu güncellendi.',
        success: true,
      });
    } catch (err: any) {
      setMessage({ text: err.message, success: false });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm('Bu değerlendirmeyi kalıcı olarak silmek istediğinizden emin misiniz?')) return;
    setActionLoadingId(reviewId);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/reviews?id=${reviewId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Silme işlemi başarısız.');

      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      setMessage({ text: 'Değerlendirme kalıcı olarak silindi.', success: true });
    } catch (err: any) {
      setMessage({ text: err.message, success: false });
    } finally {
      setActionLoadingId(null);
    }
  };

  const pendingCount = reviews.filter((r) => r.is_approved === 0).length;
  const approvedCount = reviews.filter((r) => r.is_approved === 1).length;
  const rejectedCount = reviews.filter((r) => r.is_approved === -1).length;

  const filteredReviews = reviews.filter((r) => {
    if (activeFilter === 'pending') return r.is_approved === 0;
    if (activeFilter === 'approved') return r.is_approved === 1;
    if (activeFilter === 'rejected') return r.is_approved === -1;
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-blue-900" />
            <span>Müşteri Değerlendirmeleri & Yorum Onay Paneli</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Müşterilerin kumaşlar hakkında yaptığı yorumları ve fotoğrafları inceleyip yayına alın.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchReviews}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Yenile</span>
        </button>
      </div>

      {message && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 ${
            message.success
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{message.text}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-2xl p-1.5 shadow-xs gap-1">
        <button
          type="button"
          onClick={() => setActiveFilter('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeFilter === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>Tümü</span>
          <span className="text-[10px] opacity-75 font-mono">({reviews.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('pending')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeFilter === 'pending'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'text-amber-700 hover:bg-amber-50'
          }`}
        >
          <span>Onay Bekleyenler</span>
          <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
            activeFilter === 'pending' ? 'bg-amber-700 text-white' : 'bg-amber-100 text-amber-900'
          }`}>
            {pendingCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('approved')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeFilter === 'approved'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-emerald-700 hover:bg-emerald-50'
          }`}
        >
          <span>Yayındakiler (Onaylı)</span>
          <span className="text-[10px] opacity-75 font-mono">({approvedCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('rejected')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeFilter === 'rejected'
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-red-700 hover:bg-red-50'
          }`}
        >
          <span>Reddedilenler</span>
          <span className="text-[10px] opacity-75 font-mono">({rejectedCount})</span>
        </button>
      </div>

      {/* Reviews List */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-500 font-bold text-sm flex items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-900" />
          <span>Yorumlar yükleniyor...</span>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-slate-200 bg-white rounded-3xl text-slate-400 space-y-2">
          <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="font-bold text-sm text-slate-700">Bu filtrede değerlendirme bulunamadı.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((rev) => {
            const isPending = rev.is_approved === 0;
            const isApproved = rev.is_approved === 1;
            const isRejected = rev.is_approved === -1;

            return (
              <div
                key={rev.id}
                className={`p-6 bg-white rounded-3xl border shadow-xs space-y-4 transition ${
                  isPending
                    ? 'border-amber-300 bg-amber-50/20 ring-1 ring-amber-200'
                    : isApproved
                    ? 'border-slate-200'
                    : 'border-red-200 bg-red-50/10'
                }`}
              >
                {/* Top Bar: Customer + Product + Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center flex-shrink-0">
                      {rev.customer_name?.charAt(0)?.toUpperCase() || 'M'}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900">
                          {rev.customer_name}
                        </span>
                        <div className="flex text-amber-400">
                          {[...Array(rev.rating || 5)].map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                          ))}
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-400 font-mono">
                        {rev.created_at ? new Date(rev.created_at).toLocaleString('tr-TR') : ''}
                      </div>
                    </div>
                  </div>

                  {/* Product Tag */}
                  <div className="flex items-center gap-2">
                    {rev.product_image && (
                      <img
                        src={rev.product_image}
                        alt={rev.product_name}
                        className="w-8 h-8 rounded-lg object-cover border"
                      />
                    )}
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-800 line-clamp-1 max-w-xs">
                        {rev.product_name}
                      </div>
                      {rev.product_slug && (
                        <Link
                          href={`/urun/${rev.product_slug}`}
                          target="_blank"
                          className="text-[10px] text-blue-900 hover:underline flex items-center gap-0.5 justify-end"
                        >
                          <span>Ürüne Git</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </Link>
                      )}
                    </div>

                    {/* Status Pill */}
                    <div className="ml-2">
                      {isPending && (
                        <span className="px-2.5 py-1 bg-amber-100 text-amber-900 text-[10px] font-black rounded-full border border-amber-300">
                          ⏳ Onay Bekliyor
                        </span>
                      )}
                      {isApproved && (
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 text-[10px] font-black rounded-full border border-emerald-300">
                          ✓ Yayında
                        </span>
                      )}
                      {isRejected && (
                        <span className="px-2.5 py-1 bg-red-100 text-red-900 text-[10px] font-black rounded-full border border-red-300">
                          ✕ Reddedildi
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Comment Text */}
                <div className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                  &ldquo;{rev.comment}&rdquo;
                </div>

                {/* Customer Attached Photos */}
                {rev.images && Array.isArray(rev.images) && rev.images.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-blue-900" />
                      <span>Müşterinin Eklediği Fotoğraflar ({rev.images.length}):</span>
                    </div>

                    <div className="flex flex-wrap gap-2.5">
                      {rev.images.map((imgUrl: string, idx: number) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedImage(imgUrl)}
                          className="w-20 h-20 rounded-xl overflow-hidden border-2 border-slate-200 hover:border-blue-900 transition shadow-xs relative group"
                        >
                          <img
                            src={imgUrl}
                            alt={`Foto ${idx + 1}`}
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

                {/* Bottom Actions */}
                <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs">
                  <div className="text-slate-400 font-mono text-[10px]">
                    ID: {rev.id}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Approve button */}
                    {!isApproved && (
                      <button
                        type="button"
                        disabled={actionLoadingId === rev.id}
                        onClick={() => handleStatusUpdate(rev.id, 1)}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Yayına Al (Onayla)</span>
                      </button>
                    )}

                    {/* Reject button */}
                    {!isRejected && (
                      <button
                        type="button"
                        disabled={actionLoadingId === rev.id}
                        onClick={() => handleStatusUpdate(rev.id, -1)}
                        className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                      >
                        <XCircle className="w-3.5 h-3.5 text-amber-600" />
                        <span>Reddet</span>
                      </button>
                    )}

                    {/* Delete button */}
                    <button
                      type="button"
                      disabled={actionLoadingId === rev.id}
                      onClick={() => handleDelete(rev.id)}
                      className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl transition flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Sil</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Image Preview Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-3xl max-h-[85vh]">
            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              className="absolute -top-10 right-0 p-1.5 text-white bg-slate-800 hover:bg-slate-700 rounded-full shadow-lg"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={selectedImage}
              alt="Müşteri Değerlendirme Fotoğrafı"
              className="max-h-[80vh] max-w-full rounded-2xl shadow-2xl object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
