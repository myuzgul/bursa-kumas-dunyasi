'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/components/storefront/CartContext';
import { formatCurrency } from '@/lib/services/meterEngine';
import { 
  ShieldCheck, Lock, CreditCard, Truck, Landmark, Banknote,
  CheckCircle2, AlertCircle, ShoppingBag, ArrowLeft, Copy, Check, Info
} from 'lucide-react';

interface BankAccount {
  id: string;
  bank_name: string;
  account_holder: string;
  iban: string;
  branch_code?: string;
  account_number?: string;
  is_active: number;
}

interface PublicPaymentSettings {
  paytr?: {
    is_active: number;
    title: string;
    description: string;
    test_mode: number;
    max_installment: number;
  };
  bank_transfer?: {
    is_active: number;
    title: string;
    description: string;
    discount_percentage: number;
    accounts: BankAccount[];
  };
  cash_on_delivery?: {
    is_active: number;
    title: string;
    description: string;
    additional_fee: number;
  };
  card_on_delivery?: {
    is_active: number;
    title: string;
    description: string;
    additional_fee: number;
  };
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, couponCode, clearCart } = useCart();

  const [fullName, setFullName] = useState('Ahmet Yılmaz');
  const [email, setEmail] = useState('ahmet.yilmaz@example.com');
  const [phone, setPhone] = useState('0532 111 22 33');
  const [city, setCity] = useState('Bursa');
  const [district, setDistrict] = useState('Nilüfer');
  const [addressLine, setAddressLine] = useState('İhsaniye Mah. Barbaros Cad. No:14 D:6');
  const [postalCode, setPostalCode] = useState('16130');
  const [isCorporate, setIsCorporate] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [taxOffice, setTaxOffice] = useState('');
  const [orderNotes, setOrderNotes] = useState('Lütfen kumaşı tek parça halinde kesiniz.');

  // Payment settings and selection
  const [paymentSettings, setPaymentSettings] = useState<PublicPaymentSettings | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'paytr' | 'bank_transfer' | 'cash_on_delivery' | 'card_on_delivery'>('paytr');
  const [copiedIban, setCopiedIban] = useState<string | null>(null);

  // Mock Card Info for PayTR simulation
  const [cardNumber, setCardNumber] = useState('4543 **** **** 2026');
  const [cardHolder, setCardHolder] = useState('AHMET YILMAZ');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('321');
  const [selectedInstallment, setSelectedInstallment] = useState('1');

  const [agreeTerms, setAgreeTerms] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOrderCompleted, setIsOrderCompleted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [couponDiscount, setCouponDiscount] = useState<number>(0);

  // Fetch Payment Settings
  useEffect(() => {
    fetch('/api/settings/payment')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.settings) {
          setPaymentSettings(data.settings);
          // Default selection fallback if primary is not active
          if (data.settings.paytr?.is_active) {
            setSelectedPaymentMethod('paytr');
          } else if (data.settings.bank_transfer?.is_active) {
            setSelectedPaymentMethod('bank_transfer');
          } else if (data.settings.cash_on_delivery?.is_active) {
            setSelectedPaymentMethod('cash_on_delivery');
          } else if (data.settings.card_on_delivery?.is_active) {
            setSelectedPaymentMethod('card_on_delivery');
          }
        }
      })
      .catch(() => {});
  }, []);

  // Validate coupon dynamically
  useEffect(() => {
    if (couponCode && subtotal > 0) {
      fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode, subtotal }),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.valid) {
            setCouponDiscount(data.coupon.discount_amount || 0);
          } else {
            setCouponDiscount(0);
          }
        })
        .catch(() => {});
    } else {
      setCouponDiscount(0);
    }
  }, [couponCode, subtotal]);

  const [shippingSettings, setShippingSettings] = useState<{ free_shipping_threshold: number; shipping_cost: number; carrier_name?: string } | null>(null);

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

  // Discount & Fee calculations
  const freeThreshold = shippingSettings ? Number(shippingSettings.free_shipping_threshold) : 1000;
  const standardCost = shippingSettings ? Number(shippingSettings.shipping_cost) : 79.90;
  const isAlwaysFree = freeThreshold === 0;

  const baseDiscount = couponDiscount;
  const discountedSubtotal = Math.max(0, subtotal - baseDiscount);

  // Dynamic Payment adjustments
  let havaleDiscount = 0;
  let paymentFee = 0;

  if (selectedPaymentMethod === 'bank_transfer' && paymentSettings?.bank_transfer?.is_active) {
    const rate = Number(paymentSettings.bank_transfer.discount_percentage) || 0;
    if (rate > 0) {
      havaleDiscount = Number(((discountedSubtotal * rate) / 100).toFixed(2));
    }
  } else if (selectedPaymentMethod === 'cash_on_delivery' && paymentSettings?.cash_on_delivery?.is_active) {
    paymentFee = Number(paymentSettings.cash_on_delivery.additional_fee) || 0;
  } else if (selectedPaymentMethod === 'card_on_delivery' && paymentSettings?.card_on_delivery?.is_active) {
    paymentFee = Number(paymentSettings.card_on_delivery.additional_fee) || 0;
  }

  const shippingFee = (isAlwaysFree || subtotal >= freeThreshold || items.length === 0) ? 0 : standardCost;
  const grandTotal = Math.max(0, discountedSubtotal - havaleDiscount + shippingFee + paymentFee);

  const copyIban = (iban: string) => {
    navigator.clipboard.writeText(iban.replace(/\s+/g, ''));
    setCopiedIban(iban);
    setTimeout(() => setCopiedIban(null), 2500);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerms) {
      setErrorMessage('Lütfen Mesafeli Satış Sözleşmesi ve Ön Bilgilendirme Formunu onaylayınız.');
      return;
    }
    if (items.length === 0) {
      setErrorMessage('Sepetiniz boş.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: {
            fullName,
            email,
            phone,
            city,
            district,
            addressLine,
            postalCode,
            isCorporate,
            companyName: isCorporate ? companyName : undefined,
            taxNumber: taxNumber || undefined,
            taxOffice: isCorporate ? taxOffice : undefined,
            orderNotes,
          },
          items: items.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            meterQuantity: i.meterQuantity,
          })),
          couponCode,
          paymentMethod: selectedPaymentMethod,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Sipariş oluşturulamadı.');
      }

      setIsOrderCompleted(true);
      clearCart();
      router.push(`/siparis-basarili?order=${data.order.order_number}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Bir hata oluştu.');
      setIsSubmitting(false);
      setIsOrderCompleted(false);
    }
  };

  if (isOrderCompleted) {
    return (
      <div className="max-w-md mx-auto px-4 py-28 text-center space-y-4">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-200 animate-pulse">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-black text-slate-900">Siparişiniz Alındı!</h2>
          <p className="text-xs text-slate-500">
            Sipariş detay sayfasına aktarılıyorsunuz, lütfen bekleyiniz...
          </p>
        </div>
        <div className="w-6 h-6 border-2 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto mt-4" />
      </div>
    );
  }

  if (items.length === 0 && !isSubmitting) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Sepetinizde Kumaş Bulunmamaktadır</h1>
        <p className="text-xs text-slate-500">
          Ödeme adımına geçebilmek için lütfen koleksiyonumuzdan kumaş seçiniz.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-blue-900 text-white font-bold text-xs rounded-xl shadow"
        >
          Kumaşları Keşfet
        </Link>
      </div>
    );
  }

  const isPaytrActive = paymentSettings?.paytr?.is_active === 1;
  const isBankActive = paymentSettings?.bank_transfer?.is_active === 1;
  const isCodActive = paymentSettings?.cash_on_delivery?.is_active === 1;
  const isCardCodActive = paymentSettings?.card_on_delivery?.is_active === 1;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Checkout Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Alışverişe Devam Et</span>
        </Link>

        <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>256-Bit SSL Güvenli Ödeme Sayfası</span>
        </div>
      </div>

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: Customer & Address & Payment (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Müşteri & İletişim Bilgileri */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-900 text-white text-xs flex items-center justify-center">
                1
              </span>
              <span>Müşteri & İletişim Bilgileri</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Adınız ve Soyadınız *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cep Telefonu (SMS Bildirimi İçin) *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-800"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  E-Posta Adresi (Sipariş & Fatura Gönderimi) *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-800"
                />
              </div>
            </div>
          </div>

          {/* 2. Teslimat Adresi */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-900 text-white text-xs flex items-center justify-center">
                2
              </span>
              <span>Teslimat Adresi</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  İl *
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  İlçe *
                </label>
                <input
                  type="text"
                  required
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-800"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Açık Adres (Mahalle, Cadde, Sokak, No, Daire) *
                </label>
                <textarea
                  rows={2}
                  required
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-800"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kumaş Kesim ve Sipariş Notunuz (İsteğe Bağlı)
                </label>
                <input
                  type="text"
                  placeholder="Örn: Kumaşı 2 parça halinde değil tek parça 10 metre kesiniz..."
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* 3. Fatura Seçimi */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-900 text-white text-xs flex items-center justify-center">
                  3
                </span>
                <span>Fatura Türü</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                  <input
                    type="radio"
                    name="corp"
                    checked={!isCorporate}
                    onChange={() => setIsCorporate(false)}
                  />
                  <span>Bireysel</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                  <input
                    type="radio"
                    name="corp"
                    checked={isCorporate}
                    onChange={() => setIsCorporate(true)}
                  />
                  <span>Kurumsal</span>
                </label>
              </div>
            </h2>

            {!isCorporate ? (
              <div className="pt-2 text-xs">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  T.C. Kimlik Numarası (İsteğe Bağlı)
                </label>
                <input
                  type="text"
                  maxLength={11}
                  placeholder="TCKN giriniz veya boş bırakınız (Varsayılan: E-Arşiv)"
                  value={taxNumber}
                  onChange={(e) => setTaxNumber(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Bireysel E-Arşiv faturanız T.C. Maliye Bakanlığı standartlarında düzenlenir ve e-posta adresinize gönderilir.
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Firma Resmi Unvanı *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: ABC Tekstil Sanayi ve Ticaret Ltd. Şti."
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Vergi Kimlik Numarası (VKN) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    placeholder="10 Haneli Vergi No"
                    value={taxNumber}
                    onChange={(e) => setTaxNumber(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Vergi Dairesi *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Osmangazi V.D."
                    value={taxOffice}
                    onChange={(e) => setTaxOffice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 4. Ödeme Yöntemi Seçimi */}
          <div className="bg-white p-6 rounded-2xl border border-blue-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-900 text-white text-xs flex items-center justify-center">
                  4
                </span>
                <span>Ödeme Yöntemini Seçiniz</span>
              </div>
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            </h2>

            {/* Payment Selector Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: PayTR Kredi Kartı */}
              {isPaytrActive && (
                <label
                  onClick={() => setSelectedPaymentMethod('paytr')}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex items-start gap-3 ${
                    selectedPaymentMethod === 'paytr'
                      ? 'border-blue-900 bg-blue-50/50'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_choice"
                    checked={selectedPaymentMethod === 'paytr'}
                    onChange={() => setSelectedPaymentMethod('paytr')}
                    className="mt-0.5 text-blue-900"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-xs text-slate-900 flex items-center justify-between">
                      <span>{paymentSettings?.paytr?.title || 'Kredi / Banka Kartı'}</span>
                      <CreditCard className="w-4 h-4 text-blue-800" />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      256-Bit SSL ile tek çekim veya taksitle güvenli ödeme.
                    </p>
                  </div>
                </label>
              )}

              {/* Option 2: Havale / EFT */}
              {isBankActive && (
                <label
                  onClick={() => setSelectedPaymentMethod('bank_transfer')}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex items-start gap-3 ${
                    selectedPaymentMethod === 'bank_transfer'
                      ? 'border-emerald-700 bg-emerald-50/50'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_choice"
                    checked={selectedPaymentMethod === 'bank_transfer'}
                    onChange={() => setSelectedPaymentMethod('bank_transfer')}
                    className="mt-0.5 text-emerald-700"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-xs text-slate-900 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span>{paymentSettings?.bank_transfer?.title || 'Havale / EFT'}</span>
                        {paymentSettings?.bank_transfer?.discount_percentage ? (
                          <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded">
                            %{paymentSettings.bank_transfer.discount_percentage} İndirim
                          </span>
                        ) : null}
                      </span>
                      <Landmark className="w-4 h-4 text-emerald-700" />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Banka hesabına havale/EFT ile anında indirimli ödeyin.
                    </p>
                  </div>
                </label>
              )}

              {/* Option 3: Kapıda Nakit Ödeme */}
              {isCodActive && (
                <label
                  onClick={() => setSelectedPaymentMethod('cash_on_delivery')}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex items-start gap-3 ${
                    selectedPaymentMethod === 'cash_on_delivery'
                      ? 'border-amber-600 bg-amber-50/50'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_choice"
                    checked={selectedPaymentMethod === 'cash_on_delivery'}
                    onChange={() => setSelectedPaymentMethod('cash_on_delivery')}
                    className="mt-0.5 text-amber-600"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-xs text-slate-900 flex items-center justify-between">
                      <span>{paymentSettings?.cash_on_delivery?.title || 'Kapıda Nakit Ödeme'}</span>
                      <Banknote className="w-4 h-4 text-amber-600" />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Kargo tesliminde nakit ödeme (+{paymentSettings?.cash_on_delivery?.additional_fee || 100} TL)
                    </p>
                  </div>
                </label>
              )}

              {/* Option 4: Kapıda Kredi Kartı Tek Çekim */}
              {isCardCodActive && (
                <label
                  onClick={() => setSelectedPaymentMethod('card_on_delivery')}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex items-start gap-3 ${
                    selectedPaymentMethod === 'card_on_delivery'
                      ? 'border-purple-600 bg-purple-50/50'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_choice"
                    checked={selectedPaymentMethod === 'card_on_delivery'}
                    onChange={() => setSelectedPaymentMethod('card_on_delivery')}
                    className="mt-0.5 text-purple-600"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-xs text-slate-900 flex items-center justify-between">
                      <span>{paymentSettings?.card_on_delivery?.title || 'Kapıda Kredi Kartı (Tek Çekim)'}</span>
                      <Truck className="w-4 h-4 text-purple-600" />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Kuryenin POS cihazıyla tek çekim (+{paymentSettings?.card_on_delivery?.additional_fee || 100} TL)
                    </p>
                  </div>
                </label>
              )}
            </div>

            {/* Dynamic Content based on selected payment method */}
            {selectedPaymentMethod === 'paytr' && (
              <div className="mt-4 p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-900" />
                  <span>Kredi / Banka Kartı Bilgileri</span>
                </div>

                <div className="space-y-3 bg-white p-3 rounded-lg border border-slate-200">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Kart Üzerindeki İsim
                    </label>
                    <input
                      type="text"
                      required
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs uppercase focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Kart Numarası
                    </label>
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-800"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Son Kullanma (Ay/Yıl)
                      </label>
                      <input
                        type="text"
                        required
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        CVV / Güvenlik Kodu
                      </label>
                      <input
                        type="password"
                        maxLength={4}
                        required
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-800"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedPaymentMethod === 'bank_transfer' && (
              <div className="mt-4 p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-emerald-950 flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-emerald-700" />
                    <span>Havale Yapılacak Banka Hesaplarımız</span>
                  </div>
                  {havaleDiscount > 0 && (
                    <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      Kazancınız: -{formatCurrency(havaleDiscount)}
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-600">
                  Lütfen siparişinizi verdikten sonra aşağıdaki hesaplardan birine havale/EFT yapınız. Açıklama kısmına sipariş kodunuzu yazmayı unutmayınız.
                </p>

                <div className="space-y-2 pt-1">
                  {(paymentSettings?.bank_transfer?.accounts || []).map((acc) => (
                    <div
                      key={acc.id}
                      className="p-3 bg-white rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-900">{acc.bank_name}</div>
                        <div className="text-[11px] text-slate-600">{acc.account_holder}</div>
                        <div className="text-xs font-mono font-bold text-blue-900 mt-0.5">{acc.iban}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyIban(acc.iban)}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-md transition"
                      >
                        {copiedIban === acc.iban ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>{copiedIban === acc.iban ? 'IBAN Kopyalandı' : 'IBAN Kopyala'}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedPaymentMethod === 'cash_on_delivery' && (
              <div className="mt-4 p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-2 text-xs">
                <div className="font-bold text-amber-950 flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-amber-700" />
                  <span>Kapıda Nakit Ödeme Koşulları</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Siparişiniz adresinize ulaştığında kargo görevlisine nakit olarak toplam{' '}
                  <strong className="text-slate-900 font-bold">{formatCurrency(grandTotal)}</strong> ödeme yaparak kumaşınızı teslim alabilirsiniz.
                  Kapıda tahsilat hizmet bedeli olarak faturanıza{' '}
                  <strong className="text-amber-900">+{formatCurrency(paymentSettings?.cash_on_delivery?.additional_fee || 100)}</strong> eklenmiştir.
                </p>
              </div>
            )}

            {selectedPaymentMethod === 'card_on_delivery' && (
              <div className="mt-4 p-4 rounded-xl border border-purple-200 bg-purple-50/40 space-y-2 text-xs">
                <div className="font-bold text-purple-950 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-purple-700" />
                  <span>Kapıda Kredi Kartı Tek Çekim Koşulları</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Kargo kuryesi adrese geldiğinde mobil POS cihazı ile banka veya kredi kartınızdan tek çekim olarak{' '}
                  <strong className="text-slate-900 font-bold">{formatCurrency(grandTotal)}</strong> tahsilat yapacaktır.
                  Kapıda mobil POS hizmet bedeli olarak siparişinize{' '}
                  <strong className="text-purple-900">+{formatCurrency(paymentSettings?.card_on_delivery?.additional_fee || 100)}</strong> eklenmiştir.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Order Summary & Confirmation (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 sticky top-24">
            <h3 className="font-bold text-sm text-slate-900 pb-3 border-b border-slate-100 flex items-center justify-between">
              <span>Sipariş Özeti ({items.length} Ürün)</span>
              <span className="text-xs text-blue-900 font-bold">
                {items.reduce((acc, i) => acc + i.meterQuantity, 0)} Metre
              </span>
            </h3>

            {/* Items list */}
            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 pr-1">
              {items.map((item) => (
                <div key={`${item.productId}-${item.variantId}`} className="py-2.5 flex items-center gap-3">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-12 h-12 rounded-lg object-cover border flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate">
                      {item.name}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {item.variantTitle && `${item.variantTitle} • `}
                      <strong>{item.meterQuantity}m</strong> × {formatCurrency(item.unitPrice)}
                    </div>
                  </div>
                  <div className="text-xs font-bold text-blue-950">
                    {formatCurrency(item.unitPrice * item.meterQuantity)}
                  </div>
                </div>
              ))}
            </div>

            {/* Price Calculations */}
            <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
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

              {havaleDiscount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded">
                  <span>Havale / EFT İndirimi (%{paymentSettings?.bank_transfer?.discount_percentage})</span>
                  <span>-{formatCurrency(havaleDiscount)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600">
                <span>{shippingSettings?.carrier_name || 'DHL Kargo (MNG Kargo)'}</span>
                <span>
                  {shippingFee === 0 ? (
                    <span className="text-emerald-600 font-bold">ÜCRETSİZ</span>
                  ) : (
                    formatCurrency(shippingFee)
                  )}
                </span>
              </div>

              {paymentFee > 0 && (
                <div className="flex justify-between text-amber-800 font-medium bg-amber-50 px-2 py-1 rounded">
                  <span>Kapıda Ödeme Hizmet Bedeli</span>
                  <span>+{formatCurrency(paymentFee)}</span>
                </div>
              )}

              <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                <span>KDV Tutarı (%10 Dahil)</span>
                <span>{formatCurrency((Math.max(0, discountedSubtotal - havaleDiscount) * 10) / 110)}</span>
              </div>

              <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                <span>Ödenecek Toplam</span>
                <span className="text-blue-900">{formatCurrency(grandTotal)}</span>
              </div>
            </div>

            {/* Terms checkbox */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <label className="flex items-start gap-2 cursor-pointer text-[11px] text-slate-600 leading-snug">
                <input
                  type="checkbox"
                  required
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 rounded text-blue-900"
                />
                <span>
                  <Link href="/kurumsal/mesafeli-satis-sozlesmesi" target="_blank" className="text-blue-900 underline font-semibold">
                    Mesafeli Satış Sözleşmesi
                  </Link>
                  &apos;ni ve Ön Bilgilendirme Koşullarını okudum, onaylıyorum.
                </span>
              </label>
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2 border border-red-200">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-blue-900 hover:bg-blue-800 disabled:bg-slate-400 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-900/15 flex items-center justify-center gap-2 transition transform active:scale-95"
            >
              <Lock className="w-4 h-4" />
              <span>{isSubmitting ? 'İşleminiz Yapılıyor...' : `Siparişi Onayla & Tamamla (${formatCurrency(grandTotal)})`}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
