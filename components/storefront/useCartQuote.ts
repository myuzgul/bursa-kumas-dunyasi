'use client';

import { useEffect, useRef, useState } from 'react';
import type { CartItem } from './CartContext';

export interface CartQuote {
  productSubtotal: number;
  subtotal: number;
  outlet: {
    id: string;
    reservation_id: string;
    expires_at: string;
    title: string;
    meter_length: number;
    offer_price: number;
    original_price: number | null;
    image_url: string;
  } | null;
  outletError: string | null;
  cartDiscount: { id: string; label: string; amount: number } | null;
  coupon: {
    code: string;
    title: string;
    discount_type: string;
    discount_value: number;
    amount: number;
    free_shipping: boolean;
  } | null;
  couponError: string | null;
  couponMessage: string | null;
  totalDiscount: number;
  hint: { rule_id: string; label: string; remaining_amount: number; remaining_meters: number; message: string } | null;
  notices: string[];
  shippingTotal: number;
  shippingIsFree: boolean;
  shippingThreshold: number;
  remainingForFreeShipping: number;
  carrierName: string;
  paymentFee: number;
  paymentDiscount: number;
  taxTotal: number;
  grandTotal: number;
}

export interface QuoteOptions {
  couponCode?: string;
  paymentMethod?: string;
  email?: string;
  phone?: string;
  outlet?: { reservationId: string; sessionId: string } | null;
  enabled?: boolean;
  debounceMs?: number;
}

export async function fetchCartQuote(items: CartItem[], opts: QuoteOptions = {}): Promise<CartQuote | null> {
  try {
    const res = await fetch('/api/cart/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          meterQuantity: i.meterQuantity,
        })),
        couponCode: opts.couponCode || undefined,
        paymentMethod: opts.paymentMethod || undefined,
        email: opts.email || undefined,
        phone: opts.phone || undefined,
        outlet: opts.outlet || undefined,
      }),
    });
    if (!res.ok) return null;
    return (await res.json()) as CartQuote;
  } catch {
    return null;
  }
}

/**
 * Sepet tutarlarını sunucudan (tek doğruluk kaynağı) alır.
 * İstek başarısız olursa son geçerli teklif korunur; ekranlar yerel hesaplamaya geri döner.
 */
export function useCartQuote(items: CartItem[], opts: QuoteOptions = {}) {
  const [quote, setQuote] = useState<CartQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const reqId = useRef(0);

  const enabled = opts.enabled !== false;
  const key = JSON.stringify({
    i: items.map((i) => [i.productId, i.variantId || '', i.meterQuantity]),
    c: opts.couponCode || '',
    p: opts.paymentMethod || '',
    e: opts.email || '',
    ph: opts.phone || '',
    o: opts.outlet?.reservationId || '',
  });

  useEffect(() => {
    if (!enabled || items.length === 0) {
      if (items.length === 0) setQuote(null);
      setLoading(false);
      return;
    }
    const id = ++reqId.current;
    setLoading(true);
    const t = setTimeout(async () => {
      const q = await fetchCartQuote(items, opts);
      if (id !== reqId.current) return;
      if (q) setQuote(q);
      setLoading(false);
    }, opts.debounceMs ?? 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled]);

  const refresh = async () => {
    const id = ++reqId.current;
    const q = await fetchCartQuote(items, opts);
    if (id === reqId.current && q) setQuote(q);
    return q;
  };

  return { quote, loading, refresh };
}
