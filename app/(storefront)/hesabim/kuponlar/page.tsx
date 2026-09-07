'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Ticket, 
  Copy, 
  Check, 
  Sparkles, 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

export default function CustomerCouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const res = await fetch('/api/user/coupons');
        if (res.ok) {
          const data = await res.json();
          setCoupons(data.coupons || []);
        }
      } catch (e) {
        // Ignore
      } finally {
        setLoading(false);
      }
    };

    fetchCoupons();
  }, []);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
            <Ticket className="w-5 h-5 text-amber-500" />
            İndirim Kuponlarım ({coupons.filter((c) => c.is_available).length} Aktif)
          </h1>
          <p className="text-xs text-slate-500">
            Hesabınıza tanımlı özel indirim kuponları ve sepet fırsat kodları
          </p>
        </div>

        <Link
          href="/katalog"
          className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs transition"
        >
          Kuponu Kullan
        </Link>
      </div>

      {/* Coupons List */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-xs text-slate-400">
          Kuponlar yükleniyor...
        </div>
      ) : coupons.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
          <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto">
            <Ticket className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900">Aktif Kupon Bulunamadı</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Şu anda tanımlı bir kuponunuz bulunmuyor. Yeni kampanyalarımızdan haberdar olmak için bildirimlerinizi açık tutun.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {coupons.map((coupon) => (
            <div
              key={coupon.id}
              className={`bg-white rounded-3xl border p-5 shadow-sm space-y-4 flex flex-col justify-between transition ${
                coupon.is_available ? 'border-amber-200 ring-1 ring-amber-400/20' : 'border-slate-200 opacity-60'
              }`}
            >
              <div className="space-y-3">
                {/* Header Badge & Discount Amount */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                      {coupon.discount_type === 'percent' ? `%${coupon.discount_value}` : `${coupon.discount_value} TL`}
                      <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg">İNDİRİM</span>
                    </span>
                    <p className="text-xs font-bold text-slate-700">
                      {coupon.description}
                    </p>
                  </div>

                  <div>
                    {coupon.is_available ? (
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Kullanılabilir
                      </span>
                    ) : coupon.is_used ? (
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold rounded-full">
                        Kullanıldı
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold rounded-full">
                        Süresi Doldu
                      </span>
                    )}
                  </div>
                </div>

                {/* Conditions */}
                <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  {coupon.min_basket_amount > 0 ? (
                    <p className="font-semibold text-slate-800">
                      Minimum Sepet Tutarı: <strong>{coupon.min_basket_amount} TL</strong>
                    </p>
                  ) : (
                    <p className="font-medium text-slate-700">Alt sepet limiti yoktur.</p>
                  )}

                  {coupon.expires_at ? (
                    <p className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Son Geçerlilik: {new Date(coupon.expires_at).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-500">Süresiz kupon</p>
                  )}
                </div>
              </div>

              {/* Copy Coupon Code Bar */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
                <div className="bg-slate-100 px-3.5 py-2 rounded-xl border border-dashed border-slate-300 font-mono font-black text-xs text-slate-900 tracking-wider select-all">
                  {coupon.code}
                </div>

                {coupon.is_available && (
                  <button
                    onClick={() => handleCopy(coupon.code)}
                    className="px-3.5 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
                  >
                    {copiedCode === coupon.code ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Kopyalandı!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Kodu Kopyala</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
