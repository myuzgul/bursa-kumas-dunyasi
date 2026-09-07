import React from 'react';
import Link from 'next/link';
import { Award, ShieldCheck, Truck, Scissors, Users, MapPin } from 'lucide-react';

export const metadata = {
  title: 'Hakkımızda & Fabrikamız | Bursa Kumaş Dünyası',
  description: 'Bursa Kumaş Dünyası; Türkiye’nin tekstil başkenti Bursa’da geleneksel dokuma tecrübesini modern e-ticaret teknolojisiyle buluşturan tescilli kumaş markasıdır.',
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      <div className="text-center space-y-3">
        <span className="text-xs font-bold text-blue-900 bg-blue-50 px-3 py-1 rounded-full uppercase">
          Bursa Dokuma Geleneği
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900">
          Bursa Kumaş Dünyası Hakkında
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
          Yarım asırlık dokuma tecrübesiyle Türkiye&apos;nin dört bir yanına toptan ve perakende metre bazlı kumaş tedariği.
        </p>
      </div>

      <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-sm space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed">
        <p>
          <strong>Bursa Kumaş Dünyası (bursakumasdunyasi.com)</strong>, tekstil sanayisinin kalbi olan Bursa&apos;da kurulmuş olup; viskon, oduncu, keten, tensel, ayrobin, krep, modal ve müslin kumaşların doğrudan üreticiden son tüketiciye ve tasarımcılara güvenle ulaştırılmasını sağlar.
        </p>

        <h2 className="text-base font-bold text-slate-900 pt-2 border-b pb-2">
          Misyonumuz & Hizmet İlkelerimiz
        </h2>
        <ul className="space-y-2 list-disc pl-5">
          <li>
            <strong>Metre Bazlı Hassas Satış:</strong> Müşterilerimizi gereksiz kumaş fazlalığı maliyetinden kurtarmak için 0.5m adımlarla özel kesim hizmeti sunuyoruz.
          </li>
          <li>
            <strong>Yüksek Kalite Standartları:</strong> Ürünlerimizin tamamı aşınma (Martindale), sürtünme haslığı ve su iticilik testlerinden geçirilerek satışa sunulur.
          </li>
          <li>
            <strong>Hızlı & Güvenli Teslimat:</strong> Kesilen kumaşlar özel koruyucu rulo ambalajlara sarılarak DHL Kargo (MNG Kargo) güvencesiyle aynı gün sevk edilir.
          </li>
        </ul>

        <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100 flex items-center gap-3 mt-6">
          <MapPin className="w-6 h-6 text-blue-900 flex-shrink-0" />
          <div className="text-xs text-blue-950 font-medium">
            <strong>Merkez & Mağaza:</strong> Anadolu, 2. Kanarya Sk. no:14/A, 16350 Yıldırım/Bursa
          </div>
        </div>
      </div>
    </div>
  );
}
