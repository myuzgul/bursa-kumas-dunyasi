import React from 'react';

export const metadata = {
  title: 'İade, Değişim ve Metre Kesim Koşulları | Bursa Kumaş Dünyası',
};

export default function ReturnPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
      <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
        İade, Değişim ve Metre Kesim Şartları
      </h1>

      <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-sm space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
        <h2 className="text-sm font-bold text-slate-900 border-b pb-1">
          1. Metre Bazlı Özel Kesim Kumaşlarda İade Şartları
        </h2>
        <p>
          6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği&apos;nin 15. maddesinin (b) bendi uyarınca: <strong>&ldquo;Tüketicinin istekleri veya kişisel ihtiyaçları doğrultusunda hazırlanan mallara ilişkin sözleşmelerde cayma hakkı kullanılamaz.&rdquo;</strong>
        </p>
        <p>
          Rulodan müşterinin talebine özel olarak kesilen (örn: 3.5 metre, 7.5 metre vb.) kumaşlarda, kumaşta dokuma veya renk hatası (ayıplı mal) bulunmadığı sürece keyfi iade veya cayma hakkı bulunmamaktadır.
        </p>

        <h2 className="text-sm font-bold text-slate-900 pt-2 border-b pb-1">
          2. Ayıplı Mal & Hasarlı Kumaş Durumunda İade
        </h2>
        <p>
          Teslim edilen kumaşta dokuma hatası, defo, yırtık veya sipariş edilen renkten farklı bir gönderim olması halinde; kargo teslim tarihinden itibaren 14 gün içerisinde müşteri hizmetlerimizle iletişime geçerek <strong>ücretsiz kargo ile birebir değişim veya tam ücret iadesi</strong> talep edebilirsiniz.
        </p>
      </div>
    </div>
  );
}
