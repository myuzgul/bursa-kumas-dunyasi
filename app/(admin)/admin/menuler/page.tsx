'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Plus, Edit, Trash2, ArrowUp, ArrowDown, 
  Layers, CheckCircle2, Sparkles, ExternalLink, 
  Folder, CornerDownRight, Tag, Eye, ChevronRight, X 
} from 'lucide-react';

export default function AdminHierarchicalMenusPage() {
  const [tree, setTree] = useState<any[]>([]);
  const [allMenus, setAllMenus] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<any | null>(null);
  const [menuType, setMenuType] = useState<'category' | 'custom'>('category');

  const [formData, setFormData] = useState({
    id: '',
    parent_id: '',
    category_id: '',
    title: '',
    url: '',
    type: 'header',
    display_order: 1,
    is_active: 1,
    is_highlight: 0,
    badge_text: '',
    target: '_self',
  });

  const fetchMenus = async () => {
    try {
      const res = await fetch('/api/admin/menus', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setTree(data.tree || []);
        setAllMenus(data.menus || []);
        setCategories(data.categories || []);
      }
    } catch (e) {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  const handleOpenAddParent = () => {
    setEditingMenu(null);
    setMenuType('category');
    const firstCat = categories[0];
    setFormData({
      id: '',
      parent_id: '',
      category_id: firstCat ? firstCat.id : '',
      title: firstCat ? firstCat.name : '',
      url: firstCat ? `/kategori/${firstCat.slug}` : '',
      type: 'header',
      display_order: tree.length + 1,
      is_active: 1,
      is_highlight: 0,
      badge_text: '',
      target: '_self',
    });
    setModalOpen(true);
  };

  const handleOpenAddChild = (parentId: string) => {
    const parent = tree.find((p) => p.id === parentId);
    setEditingMenu(null);
    setMenuType('category');
    const firstCat = categories[0];
    setFormData({
      id: '',
      parent_id: parentId,
      category_id: firstCat ? firstCat.id : '',
      title: firstCat ? firstCat.name : '',
      url: firstCat ? `/kategori/${firstCat.slug}` : '',
      type: 'header',
      display_order: (parent?.children?.length || 0) + 1,
      is_active: 1,
      is_highlight: 0,
      badge_text: '',
      target: '_self',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (menu: any) => {
    setEditingMenu(menu);
    setMenuType(menu.category_id ? 'category' : 'custom');
    setFormData({
      id: menu.id,
      parent_id: menu.parent_id || '',
      category_id: menu.category_id || '',
      title: menu.title,
      url: menu.url,
      type: menu.type || 'header',
      display_order: menu.display_order || 1,
      is_active: menu.is_active !== undefined ? (menu.is_active ? 1 : 0) : 1,
      is_highlight: menu.is_highlight || 0,
      badge_text: menu.badge_text || '',
      target: menu.target || '_self',
    });
    setModalOpen(true);
  };

  const handleSelectCategory = (catId: string) => {
    const cat = categories.find((c) => c.id === catId);
    if (cat) {
      setFormData((prev) => ({
        ...prev,
        category_id: cat.id,
        title: cat.name,
        url: `/kategori/${cat.slug}`,
      }));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let payload = { ...formData };
      if (menuType === 'category') {
        const selectedCat = categories.find((c) => c.id === formData.category_id);
        if (!selectedCat && categories.length > 0) {
          payload.category_id = categories[0].id;
          payload.title = formData.title || categories[0].name;
          payload.url = `/kategori/${categories[0].slug}`;
        } else if (selectedCat) {
          payload.title = formData.title || selectedCat.name;
          payload.url = `/kategori/${selectedCat.slug}`;
        }
      }
      const res = await fetch('/api/admin/menus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        fetchMenus();
        setModalOpen(false);
      }
    } catch (e) {
      // Ignore
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`"${title}" menü öğesini ve varsa alt menülerini silmek istediğinize emin misiniz?`)) return;
    try {
      const res = await fetch(`/api/admin/menus?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchMenus();
      }
    } catch (e) {
      // Ignore
    }
  };

  const handleMove = async (item: any, direction: 'up' | 'down', list: any[]) => {
    const idx = list.findIndex((m) => m.id === item.id);
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    const newOrder = list[targetIdx].display_order || targetIdx + 1;
    const oldOrder = item.display_order || idx + 1;

    // Swap orders
    await fetch('/api/admin/menus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...item, display_order: newOrder }),
    });

    await fetch('/api/admin/menus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...list[targetIdx], display_order: oldOrder }),
    });

    fetchMenus();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Menü & Mega Navigasyon Yönetimi
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Ana menü başlıklarını ve alt açılır (dropdown / mega menü) kategorilerini hiyerarşik olarak düzenleyin.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            target="_blank"
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
          >
            <Eye className="w-4 h-4 text-blue-900" />
            <span>Vitrinde İncele</span>
          </Link>

          <button
            onClick={handleOpenAddParent}
            className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Ana Menü Başlığı Ekle</span>
          </button>
        </div>
      </div>

      {/* Hierarchical Menu Tree Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-900" />
            <span>Hiyerarşik Navigasyon Yapısı</span>
          </h2>
          <span className="text-xs text-slate-400 font-medium">
            Toplam {tree.length} Ana Menü, {allMenus.filter((m) => m.parent_id).length} Alt Menü
          </span>
        </div>

        {tree.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            Henüz menü öğesi eklenmedi. Yukarıdaki butondan yeni ana menü oluşturabilirsiniz.
          </div>
        ) : (
          <div className="space-y-4">
            {tree.map((parent, pIdx) => (
              <div
                key={parent.id}
                className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs transition hover:border-slate-300"
              >
                {/* 1. Parent Menu Header Row */}
                <div className="bg-slate-50/80 p-3.5 sm:px-4 flex items-center justify-between gap-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-blue-900 text-white text-xs font-bold flex items-center justify-center shadow-xs">
                      {pIdx + 1}
                    </span>

                    <div>
                      <div className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                        <span>{parent.title}</span>

                        {parent.badge_text && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-200">
                            {parent.badge_text}
                          </span>
                        )}

                        {parent.is_highlight === 1 && (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            <span>Vurgulu</span>
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {parent.url}
                      </div>
                    </div>
                  </div>

                  {/* Actions for Parent */}
                  <div className="flex items-center gap-1.5">
                    {/* Add Sub-Menu Button */}
                    <button
                      onClick={() => handleOpenAddChild(parent.id)}
                      className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition flex items-center gap-1"
                      title="Bu Menünün Altına Yeni Kategori Ekle"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Alt Menü Ekle</span>
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => handleOpenEdit(parent)}
                      className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-blue-900 rounded-lg transition"
                      title="Düzenle"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>

                    {/* Move Up/Down */}
                    <button
                      onClick={() => handleMove(parent, 'up', tree)}
                      disabled={pIdx === 0}
                      className="p-1.5 bg-white hover:bg-slate-100 disabled:opacity-30 border border-slate-200 rounded-lg transition"
                      title="Yukarı Taşı"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMove(parent, 'down', tree)}
                      disabled={pIdx === tree.length - 1}
                      className="p-1.5 bg-white hover:bg-slate-100 disabled:opacity-30 border border-slate-200 rounded-lg transition"
                      title="Aşağı Taşı"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(parent.id, parent.title)}
                      className="p-1.5 bg-white hover:bg-red-50 text-red-600 border border-slate-200 rounded-lg transition"
                      title="Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 2. Sub-Items (Children under this parent) */}
                {parent.children && parent.children.length > 0 ? (
                  <div className="p-3 bg-white space-y-2 divide-y divide-slate-100">
                    {parent.children.map((child: any, cIdx: number) => (
                      <div
                        key={child.id}
                        className="pt-2 first:pt-0 flex items-center justify-between gap-3 pl-6 sm:pl-8 group"
                      >
                        <div className="flex items-center gap-2">
                          <CornerDownRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <div>
                            <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                              <span>{child.title}</span>
                              {child.badge_text && (
                                <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-200">
                                  {child.badge_text}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {child.url}
                            </div>
                          </div>
                        </div>

                        {/* Child Actions */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(child)}
                            className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition"
                            title="Düzenle"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleMove(child, 'up', parent.children)}
                            disabled={cIdx === 0}
                            className="p-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 rounded transition"
                            title="Yukarı Taşı"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleMove(child, 'down', parent.children)}
                            disabled={cIdx === parent.children.length - 1}
                            className="p-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 rounded transition"
                            title="Aşağı Taşı"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDelete(child.id, child.title)}
                            className="p-1 bg-slate-100 hover:bg-red-100 text-red-600 rounded transition"
                            title="Sil"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 pl-8 text-[11px] text-slate-400 italic">
                    Bu ana menü altına henüz alt kategori eklenmedi. &quot;Alt Menü Ekle&quot; butonuna basarak ekleyebilirsiniz.
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Menu Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 sm:p-7 space-y-4 animate-fadeIn">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  {editingMenu ? 'Menü Öğesini Düzenle' : formData.parent_id ? 'Yeni Alt Menü Ekle' : 'Yeni Ana Menü Ekle'}
                </h2>
                {formData.parent_id && (
                  <p className="text-[11px] font-bold text-blue-900 mt-0.5">
                    ↳ Üst Menü: {tree.find((p) => p.id === formData.parent_id)?.title || 'Seçili Menü'}
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

            {/* Mode Switcher Tabs */}
            <div className="flex p-1 bg-slate-100 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setMenuType('category');
                  if (!formData.category_id && categories.length > 0) {
                    handleSelectCategory(categories[0].id);
                  }
                }}
                className={`flex-1 py-2 rounded-lg transition ${
                  menuType === 'category'
                    ? 'bg-white text-blue-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Kategoriye Bağla (Otomatik)
              </button>
              <button
                type="button"
                onClick={() => setMenuType('custom')}
                className={`flex-1 py-2 rounded-lg transition ${
                  menuType === 'custom'
                    ? 'bg-white text-blue-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Özel Başlık / Harici Link
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              {/* Category Mode (Super Simple & Automatic!) */}
              {menuType === 'category' ? (
                <div className="space-y-3">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">
                      Kategori Seçin *
                    </label>
                    <select
                      value={formData.category_id}
                      onChange={(e) => handleSelectCategory(e.target.value)}
                      required
                      className="w-full bg-blue-50/60 border border-blue-200 rounded-xl px-3.5 py-2.5 font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-900 text-xs"
                    >
                      <option value="">-- Bir Kategori Seçin --</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {formData.category_id && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 font-medium">Menüde Görünecek İsim:</span>
                        <span className="font-bold text-slate-900">{formData.title}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 font-medium">Otomatik Bağlantı:</span>
                        <span className="font-mono text-blue-900 font-bold">{formData.url}</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Custom Link Mode */
                <div className="space-y-3">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">
                      Menü Başlığı *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Örn: Kumaş Rehberi & Blog"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">
                      Bağlantı Adresi (URL) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Örn: /blog veya /kurumsal/hakkimizda"
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-900"
                    />
                  </div>
                </div>
              )}

              {/* Optional Settings (Badge & Order) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Rozet / Etiket Metni (İsteğe Bağlı)
                  </label>
                  <input
                    type="text"
                    placeholder="Örn: Yeni, Popüler, İndirim"
                    value={formData.badge_text}
                    onChange={(e) => setFormData({ ...formData, badge_text: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Sıralama No
                  </label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 1 })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={formData.is_highlight === 1}
                    onChange={(e) => setFormData({ ...formData, is_highlight: e.target.checked ? 1 : 0 })}
                    className="rounded text-blue-900"
                  />
                  <span>Öne Çıkar (Amber Vurgusu)</span>
                </label>
              </div>

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
