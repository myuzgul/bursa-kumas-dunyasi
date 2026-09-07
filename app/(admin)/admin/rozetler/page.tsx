'use client';

import React, { useState, useEffect } from 'react';
import { 
  Award, Plus, Trash2, Edit3, Sparkles, Star, ShieldCheck, 
  Flame, Heart, Scissors, Zap, CheckCircle2, Eye, Sliders, ArrowUpDown
} from 'lucide-react';

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Sparkles: Sparkles,
  Star: Star,
  ShieldCheck: ShieldCheck,
  Flame: Flame,
  Heart: Heart,
  Scissors: Scissors,
  Zap: Zap,
  Award: Award,
  CheckCircle2: CheckCircle2,
};

const COLOR_PRESETS = [
  { name: 'Amber (Altın/Çok Satan)', bg: '#f59e0b', text: '#0f172a' },
  { name: 'Mavi (Yeni Sezon)', bg: '#2563eb', text: '#ffffff' },
  { name: 'Kırmızı (Fırsat/İndirim)', bg: '#dc2626', text: '#ffffff' },
  { name: 'Zümrüt Yeşili (Pamuk/Doğal)', bg: '#16a34a', text: '#ffffff' },
  { name: 'Gök Mavisi (Su İtici)', bg: '#0284c7', text: '#ffffff' },
  { name: 'Mor (280 cm Çift En)', bg: '#7c3aed', text: '#ffffff' },
  { name: 'Lacivert (Bursa Dokuması)', bg: '#1e1b4b', text: '#facc15' },
  { name: 'Teal (Pet-Friendly)', bg: '#0d9488', text: '#ffffff' },
  { name: 'Koyu Grafit (Premium)', bg: '#0f172a', text: '#ffffff' },
  { name: 'Pembe / Gül (Romantik)', bg: '#e11d48', text: '#ffffff' },
];

export default function AdminBadgesPage() {
  const [badges, setBadges] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBadge, setEditingBadge] = useState<any | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    bg_color: '#2563eb',
    text_color: '#ffffff',
    icon_name: 'Sparkles',
    position: 'image_top_left',
    display_order: 1,
    is_active: 1,
  });

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; success: boolean } | null>(null);

  const fetchBadges = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/admin/badges', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setBadges(data.badges || []);
      }
    } catch (e) {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBadges();
  }, []);

  const openNewModal = () => {
    setEditingBadge(null);
    setFormData({
      title: '',
      bg_color: '#2563eb',
      text_color: '#ffffff',
      icon_name: 'Sparkles',
      position: 'image_top_left',
      display_order: badges.length + 1,
      is_active: 1,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (badge: any) => {
    setEditingBadge(badge);
    setFormData({
      title: badge.title || '',
      bg_color: badge.bg_color || '#2563eb',
      text_color: badge.text_color || '#ffffff',
      icon_name: badge.icon_name || 'Sparkles',
      position: badge.position || 'image_top_left',
      display_order: badge.display_order || 1,
      is_active: badge.is_active !== undefined ? badge.is_active : 1,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setSaving(true);
    setFeedback(null);

    try {
      const url = '/api/admin/badges';
      const method = editingBadge ? 'PUT' : 'POST';
      const payload = editingBadge ? { ...formData, id: editingBadge.id } : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Kayıt başarısız.');

      setIsModalOpen(false);
      setFeedback({
        text: editingBadge ? 'Rozet güncellendi!' : 'Yeni rozet başarıyla oluşturuldu!',
        success: true,
      });
      fetchBadges();
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback({ text: err.message, success: false });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`"${title}" rozetini silmek istediğinize emin misiniz?`)) return;

    try {
      const res = await fetch(`/api/admin/badges?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setBadges((prev) => prev.filter((b) => b.id !== id));
        setFeedback({ text: 'Rozet silindi.', success: true });
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch (e) {
      alert('Silinemedi.');
    }
  };

  const handleToggleActive = async (badge: any) => {
    const nextStatus = badge.is_active === 1 ? 0 : 1;
    setBadges((prev) =>
      prev.map((b) => (b.id === badge.id ? { ...b, is_active: nextStatus } : b))
    );

    try {
      await fetch('/api/admin/badges', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: badge.id, is_active: nextStatus }),
      });
    } catch (e) {
      fetchBadges();
    }
  };

  const addPreset = async (preset: { title: string; bg: string; text: string; icon: string }) => {
    try {
      const res = await fetch('/api/admin/badges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: preset.title,
          bg_color: preset.bg,
          text_color: preset.text,
          icon_name: preset.icon,
          position: 'image_top_left',
          display_order: badges.length + 1,
          is_active: 1,
        }),
      });
      if (res.ok) {
        fetchBadges();
        setFeedback({ text: `"${preset.title}" rozeti eklendi!`, success: true });
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch (e) {}
  };

  const SelectedIconComponent = ICON_MAP[formData.icon_name] || Sparkles;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Award className="w-7 h-7 text-amber-500" />
            <span>Ürün Rozetleri & Etiket Yönetimi</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kumaş kartlarında ve ürün detayında gösterilen dikkat çekici rozetleri oluşturun, renklerini ve ikonlarını özelleştirin.
          </p>
        </div>

        <button
          onClick={openNewModal}
          className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Rozet Tanımla</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn ${
            feedback.success
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-red-50 text-red-900 border border-red-200'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{feedback.text}</span>
        </div>
      )}

      {/* 2. STATS & QUICK PRESETS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Toplam Rozet</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{badges.length}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Aktif Rozetler</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {badges.filter((b) => b.is_active === 1).length}
          </div>
        </div>

        <div className="md:col-span-2 bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-4 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="text-xs font-bold text-blue-200">Hızlı Şablonlar (Tek Tıkla Ekle)</div>
          <div className="flex flex-wrap gap-2 mt-2">
            <button
              onClick={() =>
                addPreset({ title: '%100 İpek Dokuma', bg: '#7c3aed', text: '#ffffff', icon: 'Award' })
              }
              className="text-[10px] font-bold bg-white/15 hover:bg-white/25 px-2.5 py-1 rounded-lg border border-white/20 transition"
            >
              + %100 İpek Dokuma
            </button>
            <button
              onClick={() =>
                addPreset({ title: 'Aşınmaz Koltukluk', bg: '#0f172a', text: '#facc15', icon: 'ShieldCheck' })
              }
              className="text-[10px] font-bold bg-white/15 hover:bg-white/25 px-2.5 py-1 rounded-lg border border-white/20 transition"
            >
              + Aşınmaz Koltukluk
            </button>
            <button
              onClick={() =>
                addPreset({ title: 'Lazer Hassas Kesim', bg: '#dc2626', text: '#ffffff', icon: 'Scissors' })
              }
              className="text-[10px] font-bold bg-white/15 hover:bg-white/25 px-2.5 py-1 rounded-lg border border-white/20 transition"
            >
              + Lazer Hassas Kesim
            </button>
          </div>
        </div>
      </div>

      {/* 3. ROZETLER TABLOSU */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-4 h-4 text-blue-900" />
            <span>Tanımlı Kumaş Rozetleri ({badges.length})</span>
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="p-3.5 text-center w-12">Sıra</th>
                <th className="p-3.5">Rozet Canlı Görünümü</th>
                <th className="p-3.5">Başlık & Kod</th>
                <th className="p-3.5">Renk Değerleri</th>
                <th className="p-3.5">İkon</th>
                <th className="p-3.5 text-center">Durum</th>
                <th className="p-3.5 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    Rozetler yükleniyor...
                  </td>
                </tr>
              ) : badges.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    Henüz rozet eklenmedi. Yukarıdaki butona tıklayarak ilk rozetinizi oluşturun.
                  </td>
                </tr>
              ) : (
                badges.map((badge) => {
                  const IconComp = ICON_MAP[badge.icon_name] || Sparkles;
                  return (
                    <tr key={badge.id} className="hover:bg-slate-50/60 transition">
                      <td className="p-3.5 text-center font-mono font-bold text-slate-400">
                        #{badge.display_order || 1}
                      </td>

                      {/* Live Badge Preview Chip */}
                      <td className="p-3.5">
                        <span
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black shadow-xs tracking-tight"
                          style={{
                            backgroundColor: badge.bg_color || '#2563eb',
                            color: badge.text_color || '#ffffff',
                          }}
                        >
                          <IconComp className="w-3.5 h-3.5" />
                          <span>{badge.title}</span>
                        </span>
                      </td>

                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{badge.title}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{badge.slug}</div>
                      </td>

                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-4 h-4 rounded-full border border-slate-300 shadow-xs"
                            style={{ backgroundColor: badge.bg_color }}
                          />
                          <span className="font-mono text-[11px] text-slate-600">
                            {badge.bg_color}
                          </span>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <IconComp className="w-4 h-4 text-blue-900" />
                          <span>{badge.icon_name || 'Sparkles'}</span>
                        </div>
                      </td>

                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(badge)}
                          className={`px-3 py-1 rounded-full text-[10px] font-black transition ${
                            badge.is_active === 1
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                          }`}
                        >
                          {badge.is_active === 1 ? 'Aktif' : 'Pasif'}
                        </button>
                      </td>

                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(badge)}
                            className="p-1.5 hover:bg-blue-50 text-blue-900 rounded-lg transition"
                            title="Düzenle"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDelete(badge.id, badge.title)}
                            className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition"
                            title="Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. MODAL: YENİ / DÜZENLE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-scaleIn">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                <span>{editingBadge ? 'Rozeti Düzenle' : 'Yeni Ürün Rozeti Oluştur'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5">
              {/* LIVE PREVIEW BOX */}
              <div className="p-4 bg-slate-100 rounded-2xl border border-slate-200 text-center space-y-2">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Canlı Rozet Önizlemesi
                </div>
                <div className="py-2 flex items-center justify-center">
                  <span
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs sm:text-sm font-black shadow-md tracking-tight transition-all duration-200 scale-105"
                    style={{
                      backgroundColor: formData.bg_color,
                      color: formData.text_color,
                    }}
                  >
                    <SelectedIconComponent className="w-4 h-4" />
                    <span>{formData.title.trim() || 'Rozet Başlığı'}</span>
                  </span>
                </div>
              </div>

              {/* Title Input */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Rozet Başlığı *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Örn: %100 Pamuk, Çok Satan, Su & Leke İtici..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 focus:bg-white rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-900"
                />
              </div>

              {/* Preset Color Swatches */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Hazır Renk Paleti Seçimi
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {COLOR_PRESETS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, bg_color: p.bg, text_color: p.text })
                      }
                      className="p-1.5 rounded-xl border flex items-center gap-1.5 text-left text-[10px] font-bold hover:scale-102 transition"
                      style={{
                        borderColor: formData.bg_color === p.bg ? '#000' : '#e2e8f0',
                        backgroundColor: formData.bg_color === p.bg ? '#f8fafc' : '#ffffff',
                      }}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: p.bg }}
                      />
                      <span className="truncate">{p.name.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Color Pickers */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Arka Plan Rengi
                  </label>
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-xl p-1.5">
                    <input
                      type="color"
                      value={formData.bg_color}
                      onChange={(e) => setFormData({ ...formData, bg_color: e.target.value })}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                    />
                    <input
                      type="text"
                      value={formData.bg_color}
                      onChange={(e) => setFormData({ ...formData, bg_color: e.target.value })}
                      className="w-full bg-transparent text-xs font-mono font-bold outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Metin Rengi
                  </label>
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-xl p-1.5">
                    <input
                      type="color"
                      value={formData.text_color}
                      onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                    />
                    <input
                      type="text"
                      value={formData.text_color}
                      onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
                      className="w-full bg-transparent text-xs font-mono font-bold outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Icon Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Rozet İkonu
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {Object.keys(ICON_MAP).map((iconKey) => {
                    const Icon = ICON_MAP[iconKey];
                    const isSelected = formData.icon_name === iconKey;
                    return (
                      <button
                        key={iconKey}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon_name: iconKey })}
                        className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition ${
                          isSelected
                            ? 'border-blue-900 bg-blue-50 text-blue-950 font-bold ring-2 ring-blue-900/20'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-[9px] truncate">{iconKey}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Order & Active Toggle */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Görüntülenme Sırası
                  </label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) =>
                      setFormData({ ...formData, display_order: Number(e.target.value) })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer text-xs font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={formData.is_active === 1}
                      onChange={(e) =>
                        setFormData({ ...formData, is_active: e.target.checked ? 1 : 0 })
                      }
                      className="rounded text-blue-900"
                    />
                    <span>Rozet Aktif</span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow transition"
                >
                  {saving ? 'Kaydediliyor...' : editingBadge ? 'Güncelle' : 'Rozeti Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
