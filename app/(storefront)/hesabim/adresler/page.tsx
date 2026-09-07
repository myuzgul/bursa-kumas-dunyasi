'use client';

import React, { useEffect, useState } from 'react';
import { 
  MapPin, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  X, 
  Building2, 
  Phone, 
  User, 
  AlertCircle 
} from 'lucide-react';

interface Address {
  id: string;
  title: string;
  first_name: string;
  last_name: string;
  phone: string;
  city: string;
  district: string;
  neighborhood?: string;
  full_address: string;
  postal_code?: string;
  is_default_shipping: number | boolean;
  is_default_billing: number | boolean;
}

const TURKEY_CITIES = [
  'Bursa', 'İstanbul', 'Ankara', 'İzmir', 'Antalya', 'Adana', 'Konya', 'Gaziantep', 'Kocaeli', 'Eskişehir',
  'Mersin', 'Kayseri', 'Samsun', 'Balıkesir', 'Denizli', 'Trabzon', 'Manisa', 'Aydın', 'Muğla', 'Tekirdağ',
  'Sakarya', 'Diyarbakır', 'Şanlıurfa', 'Hatay', 'Malatya', 'Erzurum', 'Kahramanmaraş', 'Van', 'Çanakkale'
];

export default function CustomerAddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAddr, setEditingAddr] = useState<Address | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    title: 'Ev Adresim',
    first_name: '',
    last_name: '',
    phone: '',
    city: 'Bursa',
    district: '',
    neighborhood: '',
    full_address: '',
    postal_code: '',
    is_default_shipping: false,
    is_default_billing: false,
  });

  const fetchAddresses = async () => {
    try {
      const res = await fetch('/api/user/addresses');
      if (res.ok) {
        const data = await res.json();
        setAddresses(data.addresses || []);
      }
    } catch (e) {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const openAddModal = () => {
    setEditingAddr(null);
    setFormData({
      title: 'Ev Adresim',
      first_name: '',
      last_name: '',
      phone: '',
      city: 'Bursa',
      district: '',
      neighborhood: '',
      full_address: '',
      postal_code: '',
      is_default_shipping: addresses.length === 0,
      is_default_billing: addresses.length === 0,
    });
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (addr: Address) => {
    setEditingAddr(addr);
    setFormData({
      title: addr.title,
      first_name: addr.first_name,
      last_name: addr.last_name,
      phone: addr.phone,
      city: addr.city,
      district: addr.district,
      neighborhood: addr.neighborhood || '',
      full_address: addr.full_address,
      postal_code: addr.postal_code || '',
      is_default_shipping: Boolean(addr.is_default_shipping),
      is_default_billing: Boolean(addr.is_default_billing),
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    try {
      const url = '/api/user/addresses';
      const method = editingAddr ? 'PUT' : 'POST';
      const body = editingAddr ? { ...formData, id: editingAddr.id } : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'İşlem gerçekleştirilemedi.');
      } else {
        setModalOpen(false);
        setSuccessMsg(editingAddr ? 'Adres başarıyla güncellendi.' : 'Yeni adres eklendi.');
        setTimeout(() => setSuccessMsg(''), 3000);
        fetchAddresses();
      }
    } catch (err: any) {
      setFormError('Bir bağlantı hatası oluştu.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu adresi silmek istediğinize emin misiniz?')) return;
    try {
      const res = await fetch(`/api/user/addresses?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setAddresses((prev) => prev.filter((a) => a.id !== id));
        setSuccessMsg('Adres silindi.');
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (e) {
      // Ignore
    }
  };

  const handleMakeDefaultShipping = async (addr: Address) => {
    try {
      const res = await fetch('/api/user/addresses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: addr.id, is_default_shipping: true }),
      });
      if (res.ok) {
        fetchAddresses();
      }
    } catch (e) {}
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-900" />
            Kayıtlı Teslimat ve Fatura Adreslerim
          </h1>
          <p className="text-xs text-slate-500">
            Siparişlerinizde hızlı seçim yapmak için teslimat ve fatura adreslerinizi yönetin
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Adres Ekle</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Address Grid */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-xs text-slate-400">
          Adresler yükleniyor...
        </div>
      ) : addresses.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
          <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
            <MapPin className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900">Henüz Kayıtlı Adresiniz Yok</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Sipariş verirken tekrar adres yazmamak için teslimat adresinizi hemen kaydedebilirsiniz.
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-900 text-white font-bold text-xs rounded-xl hover:bg-blue-800 transition"
          >
            <Plus className="w-4 h-4" />
            <span>İlk Adresimi Ekle</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`bg-white rounded-3xl border p-5 shadow-sm space-y-4 flex flex-col justify-between transition ${
                addr.is_default_shipping ? 'border-blue-900 ring-1 ring-blue-900/20' : 'border-slate-200'
              }`}
            >
              <div className="space-y-3">
                {/* Header & Badges */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <span className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-slate-400" />
                      {addr.title}
                    </span>
                    <p className="text-xs font-bold text-slate-700">
                      {addr.first_name} {addr.last_name}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    {Boolean(addr.is_default_shipping) && (
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-900 border border-blue-200 text-[10px] font-extrabold rounded-full">
                        Varsayılan Teslimat
                      </span>
                    )}
                    {Boolean(addr.is_default_billing) && (
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-900 border border-indigo-200 text-[10px] font-extrabold rounded-full">
                        Varsayılan Fatura
                      </span>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <p className="leading-relaxed">{addr.full_address}</p>
                  {addr.neighborhood && <p className="text-slate-500 font-medium">Mahalle: {addr.neighborhood}</p>}
                  <p className="font-bold text-slate-800">
                    {addr.district} / {addr.city} {addr.postal_code ? `(${addr.postal_code})` : ''}
                  </p>
                  <p className="text-slate-500 font-medium flex items-center gap-1 pt-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{addr.phone}</span>
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                {!addr.is_default_shipping && (
                  <button
                    onClick={() => handleMakeDefaultShipping(addr)}
                    className="text-[11px] font-bold text-blue-900 hover:underline"
                  >
                    Varsayılan Yap
                  </button>
                )}
                {addr.is_default_shipping ? <div /> : null}

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(addr)}
                    className="p-2 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-xl transition"
                    title="Düzenle"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(addr.id)}
                    className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition"
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

      {/* Add / Edit Address Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-5 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-900" />
                <span>{editingAddr ? 'Adresi Düzenle' : 'Yeni Adres Ekle'}</span>
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Adres Başlığı <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Evim, Atölye, Ofis"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Alıcı Adı <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ad"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Alıcı Soyadı <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Soyad"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Cep Telefonu (Kargo Teslimi İçin) <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="05XXXXXXXXX"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Şehir / İl <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-900"
                  >
                    {TURKEY_CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    İlçe <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Osmangazi, Nilüfer"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Mahalle / Semt
                </label>
                <input
                  type="text"
                  placeholder="Örn: Demirtaşpaşa Mah."
                  value={formData.neighborhood}
                  onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Açık Adres (Cadde, Sokak, Bina No, Daire) <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Kargonun sorunsuz ulaşabilmesi için detaylı açık adresinizi yazınız..."
                  value={formData.full_address}
                  onChange={(e) => setFormData({ ...formData, full_address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-900 resize-none"
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
                  <input
                    type="checkbox"
                    checked={formData.is_default_shipping}
                    onChange={(e) => setFormData({ ...formData, is_default_shipping: e.target.checked })}
                    className="rounded text-blue-900 focus:ring-blue-900"
                  />
                  <span>Varsayılan teslimat adresi olarak ayarla</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
                  <input
                    type="checkbox"
                    checked={formData.is_default_billing}
                    onChange={(e) => setFormData({ ...formData, is_default_billing: e.target.checked })}
                    className="rounded text-blue-900 focus:ring-blue-900"
                  />
                  <span>Varsayılan fatura adresi olarak ayarla</span>
                </label>
              </div>

              {formError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-xl border border-red-200 text-xs font-semibold">
                  {formError}
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition"
                >
                  {formLoading ? 'Kaydediliyor...' : editingAddr ? 'Güncelle' : 'Adresi Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
