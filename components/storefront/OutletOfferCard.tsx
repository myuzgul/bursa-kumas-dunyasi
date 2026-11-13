'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Clock, Scissors, Check, X, Sparkles, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/services/meterEngine';

export interface OutletSelection {
  reservationId: string;
  sessionId: string;
}

interface PublicOffer {
  id: string;
  title: string;
  description: string;
  note?: string;
  image_url: string;
  meter_length: number;
  offer_price: number;
  original_price: number | null;
  product_name?: string | null;
}

interface Props {
  cartSubtotal: number;
  enabled: boolean;
  onChange: (selection: OutletSelection | null) => void;
}

const SID_KEY = 'bkd_outlet_sid';

function getSessionId(): string {
  try {
    let sid = sessionStorage.getItem(SID_KEY);
    if (!sid) {
      sid = `s${Date.now().toString(36)}${Math.random().toString(36).substring(2, 12)}`;
      sessionStorage.setItem(SID_KEY, sid);
    }
    return sid;
  } catch {
    return `s${Date.now().toString(36)}${Math.random().toString(36).substring(2, 12)}`;
  }
}

/** Sipariş tamamlandıktan sonra çağrılır: bir sonraki siparişte yeni teklif gösterilebilir. */
export function resetOutletSession() {
  try {
    sessionStorage.removeItem(SID_KEY);
  } catch {
    // ignore
  }
}

function formatRemaining(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export const OutletOfferCard: React.FC<Props> = ({ cartSubtotal, enabled, onChange }) => {
  const [offer, setOffer] = useState<PublicOffer | null>(null);
  const [reservation, setReservation] = useState<{ id: string; status: string; expires_at: string } | null>(null);
  const [headline, setHeadline] = useState('Size Özel Outlet Fırsatı');
  const [subtext, setSubtext] = useState('');
  const [offset, setOffset] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);
  const sidRef = useRef<string>('');
  const requestedRef = useRef(false);

  const accepted = reservation?.status === 'accepted';
  const remainingMs = reservation ? new Date(reservation.expires_at).getTime() - (now + offset) : 0;

  const applyServerTime = (serverTime?: string) => {
    if (!serverTime) return;
    const t = new Date(serverTime).getTime();
    if (!isNaN(t)) setOffset(t - Date.now());
  };

  // Teklifi bir kez iste (sepet tutarı belli olduktan sonra)
  useEffect(() => {
    if (!enabled || requestedRef.current || cartSubtotal <= 0) return;
    requestedRef.current = true;
    sidRef.current = getSessionId();

    fetch('/api/outlet/offer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: sidRef.current, cartSubtotal }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data || !data.offer || !data.reservation) return;
        applyServerTime(data.server_time);
        setOffer(data.offer);
        setReservation(data.reservation);
        if (data.headline) setHeadline(data.headline);
        if (data.subtext) setSubtext(data.subtext);
        if (data.reservation.status === 'accepted') {
          onChange({ reservationId: data.reservation.id, sessionId: sidRef.current });
        }
      })
      .catch(() => {});
  }, [enabled, cartSubtotal, onChange]);

  // Geri sayım
  useEffect(() => {
    if (!reservation) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [reservation]);

  // Süre doldu (karar verilmeden) → kartı kapat
  useEffect(() => {
    if (reservation && !accepted && remainingMs <= 0) {
      setOffer(null);
      setReservation(null);
    }
  }, [remainingMs, reservation, accepted]);

  const respond = useCallback(
    async (action: 'accept' | 'decline') => {
      if (!reservation) return;
      setBusy(true);
      setMessage(null);
      try {
        const res = await fetch('/api/outlet/respond', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: sidRef.current, reservationId: reservation.id, action }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) {
          setMessage(data.message || 'İşlem yapılamadı.');
          setOffer(null);
          setReservation(null);
          onChange(null);
          return;
        }
        applyServerTime(data.server_time);
        if (action === 'accept') {
          setReservation(data.reservation);
          onChange({ reservationId: data.reservation.id, sessionId: sidRef.current });
        } else {
          setOffer(null);
          setReservation(null);
          onChange(null);
        }
      } catch {
        setMessage('Bağlantı hatası, lütfen tekrar deneyin.');
      } finally {
        setBusy(false);
      }
    },
    [reservation, onChange]
  );

  if (message && !offer) {
    return (
      <div className="p-3 bg-amber-50 text-amber-900 text-xs rounded-xl flex items-center gap-2 border border-amber-200">
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        <span>{message}</span>
      </div>
    );
  }

  if (!offer || !reservation) return null;

  const saving = offer.original_price ? Math.max(0, offer.original_price - offer.offer_price) : 0;
  const urgent = !accepted && remainingMs < 60 * 1000;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border-2 shadow-sm ${
        accepted ? 'border-emerald-300 bg-emerald-50/60' : 'border-amber-300 bg-gradient-to-br from-amber-50 to-white'
      }`}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-amber-200/70">
        <div className="flex items-center gap-2 text-xs font-black text-amber-900 uppercase tracking-wide">
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span>{accepted ? 'Outlet Parça Siparişinize Eklendi' : headline}</span>
        </div>
        {!accepted && (
          <div
            className={`flex items-center gap-1 text-xs font-black font-mono px-2 py-1 rounded-lg ${
              urgent ? 'bg-red-600 text-white animate-pulse' : 'bg-slate-900 text-amber-300'
            }`}
            aria-live="polite"
          >
            <Clock className="w-3.5 h-3.5" />
            {formatRemaining(remainingMs)}
          </div>
        )}
      </div>

      <div className="p-4 flex gap-4">
        <div className="w-24 h-28 sm:w-28 sm:h-32 rounded-xl overflow-hidden border border-amber-200 bg-white flex-shrink-0">
          {offer.image_url && !imgError ? (
            <img
              src={offer.image_url}
              alt={offer.title}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-amber-400">
              <Scissors className="w-8 h-8" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="text-sm font-black text-slate-900 leading-snug">{offer.title}</div>
          <div className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
            <Scissors className="w-3 h-3" />
            Tek parça • {offer.meter_length} metre
          </div>
          {offer.description && <p className="text-[11px] text-slate-600 line-clamp-2">{offer.description}</p>}
          {offer.note && <p className="text-[11px] text-slate-500 italic line-clamp-1">{offer.note}</p>}

          <div className="flex items-baseline gap-2 pt-0.5">
            <span className="text-lg font-black text-emerald-700">{formatCurrency(offer.offer_price)}</span>
            {offer.original_price && (
              <span className="text-xs text-slate-400 line-through">{formatCurrency(offer.original_price)}</span>
            )}
            {saving > 0 && (
              <span className="text-[10px] font-black text-white bg-red-600 px-1.5 py-0.5 rounded">
                {formatCurrency(saving)} kazanç
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 pb-4 space-y-2">
        {!accepted ? (
          <>
            {subtext && <p className="text-[11px] text-amber-800">{subtext}</p>}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => respond('decline')}
                className="py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <X className="w-4 h-4" />
                İstemiyorum
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => respond('accept')}
                className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                {busy ? 'Ekleniyor...' : 'Siparişime Ekle'}
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-emerald-800">
              Bu parça size ayrıldı. Lütfen siparişinizi tamamlayın.
            </span>
            <button
              type="button"
              disabled={busy}
              onClick={() => respond('decline')}
              className="text-[11px] font-bold text-red-600 hover:underline disabled:opacity-50"
            >
              Kaldır ✕
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
