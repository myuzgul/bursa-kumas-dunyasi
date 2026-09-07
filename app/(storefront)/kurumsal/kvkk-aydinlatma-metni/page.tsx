import React from 'react';

export const metadata = {
  title: 'KVKK Aydınlatma Metni | Bursa Kumaş Dünyası',
};

export default function KvkkPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
      <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
        Kişisel Verilerin Korunması ve İşlenmesi Aydınlatma Metni (KVKK)
      </h1>

      <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-sm space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
        <p>
          Bursa Kumaş Dünyası (&ldquo;Şirket&rdquo;) olarak 6698 sayılı Kişisel Verilerin Korunması Kanunu (&ldquo;KVKK&rdquo;) uyarınca, müşterilerimizin kişisel verilerinin gizliliği ve güvenliğine en üst düzeyde önem veriyoruz.
        </p>

        <h2 className="text-sm font-bold text-slate-900 pt-2 border-b pb-1">
          1. Veri Sorumlusu
        </h2>
        <p>
          Kişisel verileriniz veri sorumlusu sıfatıyla Bursa Kumaş Dünyası tarafından işlenmektedir.
        </p>

        <h2 className="text-sm font-bold text-slate-900 pt-2 border-b pb-1">
          2. Kişisel Verilerin İşlenme Amaçları
        </h2>
        <p>
          Kumaş siparişlerinizin alınması, metre kesim işlemlerinin gerçekleştirilmesi, DHL Kargo (MNG Kargo) ile adrese teslimatın sağlanması, Park Bulut sistemi üzerinden e-arşiv ve e-fatura düzenlenmesi, PayTR aracılığıyla tahsilat yapılması ve yasal yükümlülüklerin yerine getirilmesi amacıyla işlenmektedir.
        </p>

        <h2 className="text-sm font-bold text-slate-900 pt-2 border-b pb-1">
          3. İlgili Kişinin Hakları
        </h2>
        <p>
          KVKK&apos;nın 11. maddesi uyarınca dilediğiniz zaman şirketimize başvurarak verilerinizin silinmesini, düzeltilmesini veya işlenme amacını talep edebilirsiniz.
        </p>
      </div>
    </div>
  );
}
