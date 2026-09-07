'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Plus, Trash2, Edit3, Save, X, 
  Upload, Eye, EyeOff, CheckCircle2, AlertCircle, 
  ArrowUpDown, RefreshCw, Play, Layers 
} from 'lucide-react';
import type { Story, StorySlide } from '@/lib/services/stories';

export default function AdminStoriesPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Edit / Create Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStory, setEditingStory] = useState<Partial<Story> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/stories');
      const data = await res.json();
      if (data.success) {
        setStories(data.stories || []);
      }
    } catch (err) {
      console.error('Failed to load stories:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenNew = () => {
    setEditingStory({
      title: '',
      cover_image: '',
      order_index: stories.length + 1,
      is_active: 1,
      slides: [
        {
          id: `slide-${Date.now()}-1`,
          image_url: '',
          title: '',
          subtitle: '',
          button_text: 'Hemen İncele',
          button_link: '/',
          duration: 5,
        },
      ],
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (story: Story) => {
    setEditingStory(JSON.parse(JSON.stringify(story)));
    setModalOpen(true);
  };

  const handleToggleActive = async (story: Story) => {
    const newActive = story.is_active === 1 ? 0 : 1;
    // Optimistic update
    setStories((prev) =>
      prev.map((s) => (s.id === story.id ? { ...s, is_active: newActive } : s))
    );

    try {
      const res = await fetch('/api/admin/stories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: story.id, is_active: newActive }),
      });
      const data = await res.json();
      if (!data.success) {
        // Revert
        setStories((prev) =>
          prev.map((s) => (s.id === story.id ? { ...s, is_active: story.is_active } : s))
        );
      }
    } catch (err) {
      // Revert
      setStories((prev) =>
        prev.map((s) => (s.id === story.id ? { ...s, is_active: story.is_active } : s))
      );
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`"${title}" hikayesini silmek istediğinize emin misiniz?`)) return;

    try {
      const res = await fetch(`/api/admin/stories?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', message: 'Hikaye başarıyla silindi.' });
        fetchStories();
      } else {
        alert(data.message || 'Silinemedi.');
      }
    } catch (err) {
      alert('Silme sırasında hata oluştu.');
    }
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStory || !editingStory.title) {
      alert('Lütfen hikaye başlığını giriniz.');
      return;
    }

    if (!editingStory.slides || editingStory.slides.length === 0) {
      alert('Hikayede en az 1 görsel/slayt bulunmalıdır.');
      return;
    }

    setIsSaving(true);
    try {
      const isNew = !editingStory.id;
      const url = '/api/admin/stories';
      const method = isNew ? 'POST' : 'PUT';

      // Ensure cover_image is set if empty
      const payload = {
        ...editingStory,
        cover_image: editingStory.cover_image || editingStory.slides[0]?.image_url,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', message: data.message });
        setModalOpen(false);
        setEditingStory(null);
        fetchStories();
      } else {
        alert(data.message || 'Kayıt sırasında hata oluştu.');
      }
    } catch (err: any) {
      alert(err.message || 'Bağlantı hatası.');
    } finally {
      setIsSaving(false);
    }
  };

  // Image Upload helper
  const handleUploadCover = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', files[0]);
      const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url && editingStory) {
        setEditingStory({ ...editingStory, cover_image: data.url });
      }
    } catch (e) {
      alert('Yükleme hatası.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadSlide = async (index: number, files: FileList | null) => {
    if (!files || files.length === 0 || !editingStory) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', files[0]);
      const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url) {
        const slidesCopy = [...(editingStory.slides || [])];
        slidesCopy[index] = { ...slidesCopy[index], image_url: data.url };
        setEditingStory({ ...editingStory, slides: slidesCopy });
      }
    } catch (e) {
      alert('Yükleme hatası.');
    } finally {
      setIsUploading(false);
    }
  };

  const addSlide = () => {
    if (!editingStory) return;
    const newSlide: StorySlide = {
      id: `slide-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      image_url: '',
      title: '',
      subtitle: '',
      button_text: 'Hemen İncele',
      button_link: '/',
      duration: 5,
    };
    setEditingStory({
      ...editingStory,
      slides: [...(editingStory.slides || []), newSlide],
    });
  };

  const removeSlide = (idx: number) => {
    if (!editingStory) return;
    const slidesCopy = [...(editingStory.slides || [])];
    slidesCopy.splice(idx, 1);
    setEditingStory({ ...editingStory, slides: slidesCopy });
  };

  const updateSlide = (idx: number, field: keyof StorySlide, val: any) => {
    if (!editingStory) return;
    const slidesCopy = [...(editingStory.slides || [])];
    slidesCopy[idx] = { ...slidesCopy[idx], [field]: val };
    setEditingStory({ ...editingStory, slides: slidesCopy });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-purple-600" />
            <span>Ana Sayfa Hikaye & Story Yönetimi</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Instagram & WhatsApp tarzı hikaye balonlarını, slaytları ve yönlendirme butonlarını yönetin.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenNew}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow transition"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Hikaye Ekle</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-xs font-semibold ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Stories Grid / List */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-600" />
          <span className="text-xs">Hikayeler yükleniyor...</span>
        </div>
      ) : stories.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 space-y-3">
          <Sparkles className="w-10 h-10 mx-auto text-slate-300" />
          <p className="text-sm font-bold text-slate-700">Henüz tanımlı hikaye bulunmuyor.</p>
          <button
            type="button"
            onClick={handleOpenNew}
            className="px-4 py-2 bg-purple-600 text-white text-xs font-bold rounded-xl shadow"
          >
            İlk Hikayeyi Ekle
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {stories.map((story) => (
            <div
              key={story.id}
              className={`bg-white rounded-2xl border transition overflow-hidden shadow-sm flex flex-col justify-between ${
                story.is_active === 1 ? 'border-slate-200' : 'border-slate-200 opacity-60 bg-slate-50'
              }`}
            >
              {/* Card Top */}
              <div className="p-4 flex flex-col items-center text-center space-y-3">
                {/* Story Avatar Ring */}
                <div className="p-[2.5px] rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 shadow-sm">
                  <div className="p-0.5 bg-white rounded-full">
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-100">
                      <img
                        src={story.cover_image || '/placeholder.jpg'}
                        alt={story.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-xs line-clamp-1">{story.title}</h3>
                  <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                    Sıra: #{story.order_index} • {story.slides?.length || 0} Slayt
                  </div>
                </div>
              </div>

              {/* Card Bottom Actions */}
              <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleToggleActive(story)}
                  className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-md transition ${
                    story.is_active === 1
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {story.is_active === 1 ? (
                    <>
                      <Eye className="w-3 h-3 text-emerald-700" />
                      <span>Aktif</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3 h-3 text-slate-500" />
                      <span>Pasif</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(story)}
                    className="p-1.5 text-blue-700 hover:bg-blue-50 rounded-lg transition"
                    title="Düzenle"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(story.id, story.title)}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {modalOpen && editingStory && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {editingStory.id ? 'Hikayeyi Düzenle' : 'Yeni Hikaye Ekle'}
                  </h3>
                  <p className="text-[11px] text-slate-500">Kapak ve slayt içeriklerini yapılandırın</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-800 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveModal} className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Basic Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Hikaye Başlığı *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Yeni Sezon Kadifeler"
                    value={editingStory.title || ''}
                    onChange={(e) => setEditingStory({ ...editingStory, title: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Sıra No
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editingStory.order_index || 1}
                    onChange={(e) =>
                      setEditingStory({ ...editingStory, order_index: parseInt(e.target.value) || 1 })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-600"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kapak Görseli URL
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="https://..."
                      value={editingStory.cover_image || ''}
                      onChange={(e) => setEditingStory({ ...editingStory, cover_image: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-600"
                    />
                    <label className="px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 flex-shrink-0">
                      <Upload className="w-3.5 h-3.5 text-slate-700" />
                      <span>{isUploading ? 'Yükleniyor...' : 'Yükle'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isUploading}
                        onChange={(e) => handleUploadCover(e.target.files)}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Slides Management */}
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Hikaye Slaytları ({editingStory.slides?.length || 0})
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Hikayeye tıklandığında sırayla oynatılacak görseller ve butonlar.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={addSlide}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-xl text-xs font-bold transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Slayt Ekle</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {(editingStory.slides || []).map((slide, sIdx) => (
                    <div
                      key={slide.id || sIdx}
                      className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                        <span className="text-xs font-bold text-slate-800">
                          {sIdx + 1}. Slayt
                        </span>
                        <button
                          type="button"
                          onClick={() => removeSlide(sIdx)}
                          className="text-rose-500 hover:text-rose-700 p-1"
                          title="Slaytı Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Slayt Görsel URL *
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              required
                              placeholder="https://..."
                              value={slide.image_url}
                              onChange={(e) => updateSlide(sIdx, 'image_url', e.target.value)}
                              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono"
                            />
                            <label className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1 flex-shrink-0">
                              <Upload className="w-3.5 h-3.5" />
                              <span>Seç</span>
                              <input
                                type="file"
                                accept="image/*"
                                disabled={isUploading}
                                onChange={(e) => handleUploadSlide(sIdx, e.target.files)}
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Slayt Başlığı (Opsiyonel)
                          </label>
                          <input
                            type="text"
                            placeholder="Örn: 2026 Jakarlı Kadife"
                            value={slide.title || ''}
                            onChange={(e) => updateSlide(sIdx, 'title', e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Slayt Alt Metni (Opsiyonel)
                          </label>
                          <input
                            type="text"
                            placeholder="Örn: Leke tutmaz İtalyan dokuma"
                            value={slide.subtitle || ''}
                            onChange={(e) => updateSlide(sIdx, 'subtitle', e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Buton Yazısı
                          </label>
                          <input
                            type="text"
                            placeholder="Örn: Koleksiyonu İncele"
                            value={slide.button_text || ''}
                            onChange={(e) => updateSlide(sIdx, 'button_text', e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Buton Yönlendirme Linki
                          </label>
                          <input
                            type="text"
                            placeholder="Örn: /kategori/kadife-dosemelik-kumas"
                            value={slide.button_link || ''}
                            onChange={(e) => updateSlide(sIdx, 'button_link', e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono text-blue-900"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                >
                  İptal
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow transition disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{isSaving ? 'Kaydediliyor...' : 'Hikayeyi Kaydet'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
