import React from 'react';
import Link from 'next/link';
import { Scissors, ArrowLeft, Search, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 text-center">
      <div className="max-w-md mx-auto space-y-6">
        <div className="w-20 h-20 bg-blue-50 text-blue-900 rounded-full flex items-center justify-center mx-auto border-4 border-blue-100 shadow-md">
          <Scissors className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-black text-blue-900 tracking-widest uppercase">
            HATA 404
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Aradığınız Kumaşı Bulamadık
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Ulaşmaya çalıştığınız kumaş sayfası taşınmış, yayından kaldırılmış veya bağlantı adresi değişmiş olabilir.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="px-5 py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Anasayfaya Dön</span>
          </Link>

          <Link
            href="/kategori/tum-kumaslar"
            className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            <span>Ürünlere Göz At</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
