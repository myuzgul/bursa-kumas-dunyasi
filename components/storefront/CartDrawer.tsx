'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, ShieldCheck, Truck, Tag } from 'lucide-react';
import { useCart } from './CartContext';
import { formatCurrency } from '@/lib/services/meterEngine';

export const CartDrawer: React.FC = () => {
  const { items, isOpen, closeCart, removeItem, updateMeter, subtotal, totalMeters, couponCode, setCouponCode } = useCart();
  const [couponInput, setCouponInput] = useState(couponCode);
  const [couponStatus, setCouponStatus] = useState<{ message: string; success: boolean } | null>(null);
  const [dynamicCouponDiscount, setDynamicCouponDiscount] = useState<number>(0);
  const [isApplying, setIsApplying] = useState(false);
  const [shippingSettings, setShippingSettings] = useState<{ free_shipping_threshold: number; shipping_cost: number } | null>(null);

  // Fetch shipping settings
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

  // Validate coupon dynamically
  const validateCoupon = async (code: string) => {
    if (!code || !code.trim()) {
      setDynamicCouponDiscount(0);
      return;
    }
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim(), subtotal }),
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setDynamicCouponDiscount(data.coupon.discount_amount || 0);
        setCouponStatus({ success: true, message: data.message });
      } else {
        setDynamicCouponDiscount(0);
        setCouponStatus({ success: false, message: data.message || 'Geçersiz kupon kodu.' });
      }
    } catch (e) {
      // fallback
    }
  };

  useEffect(() => {
    if (couponCode && subtotal > 0) {
      validateCoupon(couponCode);
    } else if (!couponCode) {
      setDynamicCouponDiscount(0);
      setCouponStatus(null);
    }
  }, [couponCode, subtotal]);

  if (!isOpen) return null;

  const freeThreshold = shippingSettings ? Number(shippingSettings.free_shipping_threshold) : 1000;
  const standardCost = shippingSettings ? Number(shippingSettings.shipping_cost) : 79.90;
  const isAlwaysFree = freeThreshold === 0;

  const remainingForFreeShipping = isAlwaysFree ? 0 : Math.max(0, freeThreshold - subtotal);
  const freeShippingProgress = isAlwaysFree
    ? 100
    : Math.min(100, freeThreshold > 0 ? (subtotal / freeThreshold) * 100 : 100);

  const couponDiscount = dynamicCouponDiscount;
  const totalDiscount = couponDiscount;
  const shippingFee = (isAlwaysFree || subtotal >= freeThreshold || items.length === 0) ? 0 : standardCost;
  const grandTotal = Math.max(0, subtotal - totalDiscount + shippingFee);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      setCouponCode('');
      setDynamicCouponDiscount(0);
      setCouponStatus(null);
      return;
    }

    setIsApplying(true);
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotal }),
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setCouponCode(code);
        setDynamicCouponDiscount(data.coupon.discount_amount || 0);
        setCouponStatus({ success: true, message: data.message });
      } else {
        setCouponStatus({ success: false, message: data.message || 'Geçersiz kupon kodu.' });
      }
    } catch (e) {
      setCouponStatus({ success: false, message: 'Kupon uygulanamadı.' });
    } finally {
      setIsApplying(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode('');
    setCouponInput('');
    setDynamicCouponDiscount(0);
    setCouponStatus(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={closeCart}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-blue-400" />
              <h2 className="text-base font-bold">Kumaş Sepetiniz</h2>
              <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                {items.length} Ürün / {totalMeters} m
              </span>
            </div>
            <button
              onClick={closeCart}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              aria-label="Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Bar */}
          <div className="bg-blue-50 border-b border-blue-100 p-3">
            <div className="flex items-center justify-between text-xs font-semibold text-blue-950 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-blue-600" />
                {remainingForFreeShipping === 0
                  ? 'Tebrikler! Kargonuz Ücretsiz!'
                  : `Ücretsiz kargoya ${formatCurrency(remainingForFreeShipping)} kaldı`}
              </span>
              <span>{Math.round(freeShippingProgress)}%</span>
            </div>
            <div className="w-full h-1.5 bg-blue-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                style={{ width: `${freeShippingProgress}%` }}
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100">
            {items.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="text-base font-semibold text-slate-800 mb-1">Sepetiniz Boş</h3>
                <p className="text-xs text-slate-500 mb-6">
                  Viskon, keten, tensel, ayrobin ve seçkin kumaş koleksiyonumuza göz atın.
                </p>
                <button
                  onClick={closeCart}
                  className="inline-flex items-center justify-center px-5 py-2.5 bg-blue-900 text-white text-sm font-semibold rounded-lg hover:bg-blue-800 transition shadow-sm"
                >
                  Kumaşları Keşfet
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div key={`${item.productId}-${item.variantId}`} className="py-3.5 flex gap-3">
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                        {item.name}
                      </h4>
                      <button
                        onClick={() => removeItem(item.productId, item.variantId)}
                        className="text-slate-400 hover:text-red-600 p-0.5 transition"
                        title="Ürünü kaldır"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {item.variantTitle && (
                      <div className="text-[11px] text-slate-500 font-medium">
                        Renk / Varyant: <span className="text-slate-700">{item.variantTitle}</span>
                      </div>
                    )}

                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Birim Fiyat: <span className="font-semibold text-slate-700">{formatCurrency(item.unitPrice)} / m</span>
                    </div>

                    {/* Meter Adjustment in Drawer */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="inline-flex items-center border border-slate-200 rounded-md bg-slate-50">
                        <button
                          type="button"
                          onClick={() => updateMeter(item.productId, Math.max(1, item.meterQuantity - 0.5), item.variantId)}
                          disabled={item.meterQuantity <= 1}
                          className="p-1 text-slate-600 hover:text-slate-900 disabled:opacity-30"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-bold text-slate-900">
                          {item.meterQuantity} m
                        </span>
                        <button
                          type="button"
                          onClick={() => updateMeter(item.productId, item.meterQuantity + 0.5, item.variantId)}
                          className="p-1 text-slate-600 hover:text-slate-900"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-sm font-extrabold text-blue-950">
                        {formatCurrency(item.unitPrice * item.meterQuantity)}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout Summary */}
          {items.length > 0 && (
            <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
              {/* Coupon Form */}
              {couponCode ? (
                <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-emerald-600" />
                    <div>
                      <span className="font-bold text-emerald-900">{couponCode}</span>
                      <span className="text-emerald-700 text-[11px] ml-1">uygulandı</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="text-[11px] font-bold text-red-600 hover:underline"
                  >
                    Kaldır ✕
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="İndirim Kuponu (örn: BURSA10)"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs uppercase font-medium focus:ring-1 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isApplying}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition disabled:opacity-50"
                  >
                    {isApplying ? '...' : 'Uygula'}
                  </button>
                </form>
              )}

              {couponStatus && !couponCode && (
                <div className={`text-[11px] font-medium ${couponStatus.success ? 'text-emerald-700' : 'text-red-600'}`}>
                  {couponStatus.message}
                </div>
              )}

              {/* Price Breakdown */}
              <div className="space-y-1.5 text-xs pt-1">
                <div className="flex justify-between text-slate-600">
                  <span>Ara Toplam (KDV Dahil)</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(subtotal)}</span>
                </div>

                {couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Kupon İndirimi ({couponCode})</span>
                    <span>-{formatCurrency(couponDiscount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600">
                  <span>Kargo Ücreti</span>
                  <span>{shippingFee === 0 ? <span className="text-emerald-600 font-bold">ÜCRETSİZ</span> : formatCurrency(shippingFee)}</span>
                </div>

                <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                  <span>KDV Tutarı (%10 Dahil)</span>
                  <span>{formatCurrency(((subtotal - totalDiscount) * 10) / 110)}</span>
                </div>

                <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Genel Toplam</span>
                  <span className="text-blue-900">{formatCurrency(grandTotal)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="w-full py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-900/10 transition"
                >
                  <span>Güvenli Ödemeye Geç</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 pt-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>256-Bit SSL & PayTR ile %100 Güvenli Alışveriş</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
