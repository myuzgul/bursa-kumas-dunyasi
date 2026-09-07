'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit, Trash2, Image as ImageIcon, Upload, 
  CheckCircle2, AlertCircle, Eye, Sliders, Layers,
  CornerDownRight, X, Folder, Sparkles
} from 'lucide-react';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<any | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ text: string; success: boolean } | null>(null);

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    slug: '',
    parent_id: '',
    description: '',
    image_url: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=600&q=80',
    display_order: 1,
    is_active: 1,
    is_featured_home: 1,
    show_in_menu: 1,
    meta_title: '',
    meta_description: '',
  });

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/admin/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch (e) {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleOpenAdd = () => {
    setEditingCat(null);
    setFormData({
      id: '',
      name: '',
      slug: '',
      parent_id: '',
      description: '',
      image_url: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=600&q=80',
      display_order: categories.length + 1,
      is_active: 1,
      is_featured_home: 1,
      show_in_menu: 1,
      meta_title: '',
      meta_description: '',
    });
    setModalOpen(true);
  };

  const handleOpenAddSubCategory = (parentCat: any) => {
    setEditingCat(null);
    const subCount = categories.filter((c) => c.parent_id === parentCat.id).length;
    setFormData({
      id: '',
      name: '',
      slug: '',
      parent_id: parentCat.id,
      description: '',
      image_url: parentCat.image_url || 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=600&q=80',
      display_order: subCount + 1,
      is_active: 1,
      is_featured_home: 0,
      show_in_menu: 1,
      meta_title: '',
      meta_description: '',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (cat: any) => {
    setEditingCat(cat);
    setFormData({
      id: cat.id,
      name: cat.name,
      slug: cat.slug || slugify(cat.name),
      parent_id: cat.parent_id || '',
      description: cat.description || '',
      image_url: cat.image_url || '',
      display_order: cat.display_order || 1,
      is_active: cat.is_active !== undefined ? cat.is_active : 1,
      is_featured_home: cat.is_featured_home ? 1 : 0,
      show_in_menu: cat.show_in_menu !== undefined ? cat.show_in_menu : 1,
      meta_title: cat.meta_title || '',
      meta_description: cat.meta_description || '',
    });
    setModalOpen(true);
  };

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: slugify(name),
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: form,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setFormData((prev) => ({ ...prev, image_url: data.url }));
      }
    } catch (err) {
      // Ignore
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setMessage(null);
    try {
      const payload = {
        ...formData,
        slug: formData.slug || slugify(formData.name),
      };

      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setMessage({ text: 'Kategori başarıyla kaydedildi.', success: true });
        fetchCategories();
        setTimeout(() => setModalOpen(false), 600);
      }
    } catch (err: any) {
      setMessage({ text: err.message || 'Hata oluştu.', success: false });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`"${name}" kategorisini silmek istediğinize emin misiniz?`)) return;

    try {
      const res = await fetch(`/api/admin/categories?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchCategories();
      }
    } catch (e) {
      // Ignore
    }
  };

  // Organize categories into hierarchical parents and children
  const parentCategories = categories
    .filter((c) => !c.parent_id)
    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

  const getChildren = (parentId: string) => {
    return categories
      .filter((c) => c.parent_id === parentId)
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  };

  const selectedParent = formData.parent_id
    ? categories.find((c) => c.id === formData.parent_id)
    : null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Kategori & Alt Kategori Yönetimi
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kumaş kategorilerini ve alt kategorilerini oluşturun, sıralayın ve yönetin.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Ana Kategori Ekle</span>
        </button>
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="p-3.5 w-16">Görsel</th>
                <th className="p-3.5">Kategori Adı & Otomatik Link</th>
                <th className="p-3.5">Hiyerarşi</th>
                <th className="p-3.5 text-center">Sıra</th>
                <th className="p-3.5 text-center">Menüde Göster</th>
                <th className="p-3.5 text-center">Vitrinde Göster</th>
                <th className="p-3.5">Durum</th>
                <th className="p-3.5 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {parentCategories.map((parent: any) => {
                const children = getChildren(parent.id);

                return (
                  <React.Fragment key={parent.id}>
                    {/* PARENT CATEGORY ROW */}
                    <tr className="hover:bg-slate-50/80 transition bg-white font-medium">
                      <td className="p-3.5">
                        <img
                          src={parent.image_url}
                          alt={parent.name}
                          className="w-11 h-11 rounded-lg object-cover border border-slate-200"
                        />
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900 text-sm">{parent.name}</span>
                          {children.length > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-900 font-bold text-[10px] border border-blue-200">
                              {children.length} Alt Kategori
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          /kategori/{parent.slug}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="bg-slate-900 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-md">
                          Ana Kategori
                        </span>
                      </td>
                      <td className="p-3.5 text-center font-bold text-slate-700">
                        #{parent.display_order || 1}
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            parent.show_in_menu === 1
                              ? 'bg-blue-100 text-blue-900'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {parent.show_in_menu === 1 ? 'Menüde Aktif' : 'Gizli'}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            parent.is_featured_home === 1
                              ? 'bg-emerald-100 text-emerald-900'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {parent.is_featured_home === 1 ? 'Vitrinde' : 'Gizli'}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            parent.is_active === 1
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {parent.is_active === 1 ? 'Aktif' : 'Pasif'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Add Sub-Category Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenAddSubCategory(parent)}
                            className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 rounded-lg transition font-bold text-[11px] flex items-center gap-1 border border-blue-200"
                            title="Bu kategorinin altına alt kategori ekle"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Alt Kategori Ekle</span>
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => handleOpenEdit(parent)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition"
                            title="Düzenle"
                          >
                            <Edit className="w-4 h-4 text-blue-900" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(parent.id, parent.name)}
                            className="p-1.5 bg-slate-100 hover:bg-red-100 text-slate-800 hover:text-red-700 rounded-lg transition"
                            title="Sil"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* CHILDREN SUB-CATEGORIES ROWS */}
                    {children.map((child: any) => (
                      <tr key={child.id} className="hover:bg-blue-50/40 transition bg-slate-50/50">
                        <td className="p-3.5 pl-6">
                          <img
                            src={child.image_url}
                            alt={child.name}
                            className="w-9 h-9 rounded-lg object-cover border border-slate-200 ml-3"
                          />
                        </td>
                        <td className="p-3.5 pl-8">
                          <div className="flex items-center gap-1.5">
                            <CornerDownRight className="w-3.5 h-3.5 text-blue-900 flex-shrink-0" />
                            <span className="font-bold text-slate-900 text-xs">{child.name}</span>
                          </div>
                          <div className="text-[10.5px] text-slate-400 font-mono ml-5 mt-0.5">
                            /kategori/{child.slug}
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span className="bg-blue-50 text-blue-900 text-[10px] font-semibold px-2 py-0.5 rounded border border-blue-200">
                            ↳ {parent.name}
                          </span>
                        </td>
                        <td className="p-3.5 text-center font-bold text-slate-500 text-xs">
                          #{child.display_order || 1}
                        </td>
                        <td className="p-3.5 text-center">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              child.show_in_menu === 1
                                ? 'bg-blue-100 text-blue-900'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {child.show_in_menu === 1 ? 'Menüde Aktif' : 'Gizli'}
                          </span>
                        </td>
                        <td className="p-3.5 text-center">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              child.is_featured_home === 1
                                ? 'bg-emerald-100 text-emerald-900'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {child.is_featured_home === 1 ? 'Vitrinde' : 'Gizli'}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              child.is_active === 1
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {child.is_active === 1 ? 'Aktif' : 'Pasif'}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(child)}
                              className="p-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 rounded-lg transition"
                              title="Düzenle"
                            >
                              <Edit className="w-3.5 h-3.5 text-blue-900" />
                            </button>
                            <button
                              onClick={() => handleDelete(child.id, child.name)}
                              className="p-1.5 bg-white border border-slate-200 hover:bg-red-50 text-slate-800 hover:text-red-700 rounded-lg transition"
                              title="Sil"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}

              {parentCategories.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    Henüz kategori tanımlanmadı. &quot;Yeni Ana Kategori Ekle&quot; butonuna basarak ilk kategorinizi oluşturabilirsiniz.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Simplified Category Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-7 space-y-4 max-h-[90vh] overflow-y-auto animate-fadeIn">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  {editingCat
                    ? 'Kategoriyi Düzenle'
                    : selectedParent
                    ? 'Yeni Alt Kategori Ekle'
                    : 'Yeni Ana Kategori Ekle'}
                </h2>
                {selectedParent && (
                  <p className="text-[11px] font-bold text-blue-900 mt-0.5">
                    ↳ Üst Kategori: {selectedParent.name}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              {/* Category Name */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Kategori Adı *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Yerli Ayrobin Kumaşlar veya Viskon Kumaş"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 focus:bg-white rounded-xl px-3.5 py-2.5 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900 text-xs"
                />
              </div>

              {/* Parent Category Selection */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Kategori Konumu / Üst Kategori
                </label>
                <select
                  value={formData.parent_id}
                  onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 font-bold text-slate-800 focus:bg-white focus:outline-none text-xs"
                >
                  <option value="">📁 Ana Kategori (En Üst Seviye)</option>
                  {categories
                    .filter((c) => !editingCat || c.id !== editingCat.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        ↳ {c.name} Kategorisinin Altına Ekle
                      </option>
                    ))}
                </select>
              </div>

              {/* Automatic Link Preview Info */}
              {formData.name && (
                <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-medium">Otomatik Bağlantı:</span>
                  <span className="font-mono font-bold text-blue-950">
                    /kategori/{formData.slug || slugify(formData.name)}
                  </span>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Kategori Açıklaması (İsteğe Bağlı)
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  placeholder="Kategori hakkında kısa açıklama..."
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 focus:bg-white rounded-xl p-2.5 text-xs focus:outline-none"
                />
              </div>

              {/* Image Upload Area */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Kategori Fotoğrafı (İsteğe Bağlı)
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="/uploads/... veya https://..."
                    className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono text-[11px]"
                  />
                  <label className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl cursor-pointer flex items-center gap-1.5 flex-shrink-0 text-xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploading ? 'Yükleniyor...' : 'Fotoğraf Seç'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Display & Order Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={formData.show_in_menu === 1}
                    onChange={(e) => setFormData({ ...formData, show_in_menu: e.target.checked ? 1 : 0 })}
                    className="rounded text-blue-900"
                  />
                  <span>Menüde Göster</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={formData.is_featured_home === 1}
                    onChange={(e) => setFormData({ ...formData, is_featured_home: e.target.checked ? 1 : 0 })}
                    className="rounded text-blue-900"
                  />
                  <span>Vitrinde Göster (Maks 6)</span>
                </label>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sıralama No</label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 1 })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 font-bold text-xs"
                  />
                </div>
              </div>

              {message && (
                <div
                  className={`p-3 rounded-xl flex items-center gap-2 ${
                    message.success ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{message.text}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-bold transition shadow-md shadow-blue-900/20"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
