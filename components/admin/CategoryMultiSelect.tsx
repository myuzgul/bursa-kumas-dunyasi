'use client';

import React, { useState, useMemo } from 'react';
import { Check, Search, Plus, X, Star, Layers } from 'lucide-react';
import Link from 'next/link';

interface CategoryItem {
  id: string;
  name: string;
  slug?: string;
  parent_id?: string | null;
}

interface CategoryMultiSelectProps {
  categories: CategoryItem[];
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
  label?: string;
  required?: boolean;
}

export const CategoryMultiSelect: React.FC<CategoryMultiSelectProps> = ({
  categories,
  selectedIds,
  onChange,
  label = 'Kategoriler (Çoklu Seçim)',
  required = true,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter categories by search
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase().trim();
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, searchQuery]);

  // Selected Category Objects
  const selectedCategories = useMemo(() => {
    return selectedIds
      .map((id) => categories.find((c) => c.id === id))
      .filter(Boolean) as CategoryItem[];
  }, [categories, selectedIds]);

  const toggleCategory = (id: string) => {
    if (selectedIds.includes(id)) {
      if (selectedIds.length === 1 && required) {
        alert('En az 1 kategori seçili olmalıdır.');
        return;
      }
      onChange(selectedIds.filter((item) => item !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const setAsPrimary = (id: string) => {
    if (selectedIds[0] === id) return;
    const remaining = selectedIds.filter((item) => item !== id);
    onChange([id, ...remaining]);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-blue-900" />
          <span>{label} {required && <span className="text-red-500">*</span>}</span>
        </label>
        <span className="text-[11px] font-semibold text-slate-500">
          {selectedIds.length} Kategori Seçildi
        </span>
      </div>

      {/* Selected Category Chips */}
      {selectedCategories.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-xl">
          {selectedCategories.map((cat, index) => {
            const isPrimary = index === 0;
            return (
              <div
                key={cat.id}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition shadow-xs ${
                  isPrimary
                    ? 'bg-blue-900 text-white border border-blue-900'
                    : 'bg-white text-slate-800 border border-slate-300 hover:border-blue-300'
                }`}
              >
                {isPrimary ? (
                  <span className="flex items-center gap-1 text-[10px] text-amber-300 font-extrabold mr-0.5">
                    <Star className="w-3 h-3 fill-amber-300" />
                    Ana Kategori:
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAsPrimary(cat.id)}
                    className="text-[10px] text-slate-400 hover:text-blue-900 font-normal underline mr-0.5"
                    title="Bu kategoriyi ana/birincil kategori yap"
                  >
                    Ana Yap
                  </button>
                )}
                <span>{cat.name}</span>
                <button
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  className={`p-0.5 rounded-full hover:bg-black/10 transition ${
                    isPrimary ? 'text-white/80 hover:text-white' : 'text-slate-400 hover:text-red-600'
                  }`}
                  title="Kategoriyi kaldır"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Search & Category Grid Selector */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
        {/* Search input */}
        <div className="relative border-b border-slate-100 bg-slate-50/50 p-2">
          <input
            type="text"
            placeholder="Kategorilerde ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-900"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-4.5 top-1/2 -translate-y-1/2" />
        </div>

        {/* Categories List */}
        <div className="max-h-60 overflow-y-auto p-2 divide-y divide-slate-100">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-4 text-xs text-slate-400">
              Kategori bulunamadı.
            </div>
          ) : (
            filteredCategories.map((c) => {
              const isSelected = selectedIds.includes(c.id);
              const isPrimary = selectedIds[0] === c.id;
              const isChild = !!c.parent_id;

              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleCategory(c.id)}
                  className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs font-semibold transition border ${
                    isChild ? 'pl-6 bg-slate-50/50' : 'bg-white'
                  } ${
                    isSelected
                      ? isPrimary
                        ? 'bg-blue-50/90 border-blue-300 text-blue-950 font-bold'
                        : 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-bold'
                      : 'border-transparent hover:bg-slate-100/70 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition border ${
                        isSelected
                          ? isPrimary
                            ? 'bg-blue-900 border-blue-900 text-white'
                            : 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="truncate">
                      {isChild ? `↳ ${c.name}` : c.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {isChild && (
                      <span className="text-[9px] text-slate-400 font-normal">
                        Alt Kategori
                      </span>
                    )}
                    {isPrimary && (
                      <span className="text-[9px] font-black uppercase bg-blue-900 text-amber-300 px-1.5 py-0.2 rounded">
                        Birincil
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>* İlk seçtiğiniz kategori ana/birincil kategori olarak kabul edilir.</span>
          <Link
            href="/admin/kategoriler"
            target="_blank"
            className="text-blue-900 font-bold hover:underline flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            <span>Yeni Kategori Ekle</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
