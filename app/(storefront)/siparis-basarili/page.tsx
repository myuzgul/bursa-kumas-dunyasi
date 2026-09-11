import React from 'react';
import Link from 'next/link';
import { CheckCircle2, Truck, Package, ArrowRight, Phone, Landmark, Banknote, CreditCard, ShieldCheck } from 'lucide-react';
import { OrderSuccessTracker } from '@/components/analytics/OrderSuccessTracker';
import { dbRepo } from '@/lib/db/repo';
import { getPaymentSettings } from '@/lib/services/paymentSettings';
import { formatCurrency } from '@/lib/services/meterEngine';

interface OrderSuccessPageProps {
  searchParams: { order?: string };
}

export default function OrderSuccessPage({ searchParams }: OrderSuccessPageProps) {
  const orderNumber = searchParams.order || '12354';
  
  const db = dbRepo.read();
  const order = db.orders?.find((o: any) => o.order_number === orderNumber || o.id === orderNumber);
  const rawItems = order ? (db.order_items?.filter((i: any) => i.order_id === order.id) || []) : [];
  const categories = db.categories || [];
  const products = db.products || [];

  const items = rawItems.map((it: any) => {
    const prod = products.find((p: any) => p.id === it.product_id);
    const cat = prod ? categories.find((c: any) => c.id === prod.category_id) : null;
    return {
      ...it,
      category_name: cat ? cat.name : 'Döşemelik ve Perdelik Kumaş',
    };
  });

  const paymentSettings = getPaymentSettings();

  const paymentMethod = order?.payment_method || 'paytr';
  const isHavale = paymentMethod === 'bank_transfer';
  const isCod = paymentMethod === 'cash_on_delivery';
  const isCardCod = paymentMethod === 'card_on_delivery';

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-6">
      <OrderSuccessTracker orderNumber={orderNumber} order={order} items={items} />
      
      <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border-4 border-emerald-100 shadow-lg">
        <CheckCircle2 className="w-10 h-10" />
      </div>

      <div className="space-y-2">
        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          {isHavale ? 'Siparişiniz Alındı (Havale Bekleniyor)' : (isCod || isCardCod ? 'Siparişiniz Alındı (Kapıda Ödeme)' : 'Ödeme Başarıyla Alındı')}
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
          Kumaş Siparişiniz Başarıyla Oluşturuldu!
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
          Sipariş detaylarınız ve faturanız e-posta adresinize iletilmiştir. Kumaşınız kesim masasına alınmış olup en kısa sürede DHL Kargo (MNG Kargo)&apos;ya teslim edilecektir.
        </p>
      </div>

      {/* Order Info Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-md mx-auto space-y-4 text-left">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs">
          <span className="text-slate-500 font-medium">Sipariş Numarası:</span>
          <span className="font-extrabold text-blue-900 text-sm font-mono">{orderNumber}</span>
        </div>

        {order && (
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs">
            <span className="text-slate-500 font-medium">Toplam Tutar:</span>
            <span className="font-extrabold text-slate-900 text-sm">{formatCurrency(order.grand_total)}</span>
          </div>
        )}

        <div className="flex items-center gap-3 text-xs text-slate-600">
          <Truck className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <span>Kargo Firması: <strong>DHL Kargo (MNG Kargo)</strong> (Takip no SMS ile gönderilecektir)</span>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-600">
          <Package className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>Kesim Durumu: <strong>Hazırlanıyor</strong></span>
        </div>

        {isCod && (
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
            <Banknote className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong>Kapıda Nakit Ödeme:</strong> Lütfen teslimat sırasında kargo görevlisine nakit olarak <strong>{order ? formatCurrency(order.grand_total) : ''}</strong> ödeyiniz.
            </div>
          </div>
        )}

        {isCardCod && (
          <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-xs text-purple-900 flex items-start gap-2">
            <Truck className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong>Kapıda Kredi Kartı Tek Çekim:</strong> Kargo kuryesinin mobil POS cihazından kartınızla tek çekim ödeme yapabilirsiniz.
            </div>
          </div>
        )}
      </div>

      {/* Havale / EFT Bank Accounts Details */}
      {isHavale && (
        <div className="bg-emerald-50/70 border border-emerald-200 p-6 rounded-2xl max-w-xl mx-auto text-left space-y-4">
          <div className="flex items-center gap-2 text-emerald-950 font-bold text-sm">
            <Landmark className="w-5 h-5 text-emerald-700" />
            <span>Havale / EFT İçin Banka Hesaplarımız</span>
          </div>
          <p className="text-xs text-slate-700">
            Lütfen <strong>{order ? formatCurrency(order.grand_total) : ''}</strong> tutarındaki ödemenizi aşağıdaki banka hesaplarımızdan birine gönderiniz. Açıklama kısmına <strong>{orderNumber}</strong> yazmayı unutmayınız.
          </p>

          <div className="space-y-2">
            {(paymentSettings.bank_transfer.accounts || []).filter((a) => a.is_active === 1).map((acc) => (
              <div key={acc.id} className="p-3 bg-white rounded-xl border border-emerald-100 text-xs space-y-1">
                <div className="font-bold text-slate-900">{acc.bank_name}</div>
                <div className="text-slate-600">{acc.account_holder}</div>
                <div className="font-mono font-bold text-blue-900 select-all">{acc.iban}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Link
          href={`/siparis-takip?order=${orderNumber}`}
          className="px-6 py-3.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2"
        >
          <span>Siparişimi Canlı Takip Et</span>
          <ArrowRight className="w-4 h-4" />
        </Link>

        <Link
          href="/"
          className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl transition"
        >
          Alışverişe Devam Et
        </Link>
      </div>

      <div className="pt-6 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-center gap-2">
        <Phone className="w-4 h-4 text-slate-400" />
        <span>Sorularınız için Müşteri Hizmetleri: <a href="tel:05423939816" className="font-bold text-slate-700 hover:text-blue-900 transition">0 (542) 393 98 16</a></span>
      </div>
    </div>
  );
}
