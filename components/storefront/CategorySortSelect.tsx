'use client';

import React from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

interface CategorySortSelectProps {
  currentSort: string;
}

export const CategorySortSelect: React.FC<CategorySortSelectProps> = ({ currentSort }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if (val && val !== 'recommended') {
      params.set('sort', val);
    } else {
      params.delete('sort');
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-slate-500 font-medium text-xs">Sırala:</span>
      <select
        value={currentSort}
        onChange={handleSortChange}
        className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-900 cursor-pointer"
      >
        <option value="recommended">Önerilen Sıralama</option>
        <option value="price_asc">Fiyat: Düşükten Yükseğe</option>
        <option value="price_desc">Fiyat: Yüksekten Düşüğe</option>
        <option value="newest">En Yeni Eklenenler</option>
      </select>
    </div>
  );
};
