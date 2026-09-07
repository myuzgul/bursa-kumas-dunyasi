'use client';

import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  ArrowRight,
  X
} from 'lucide-react';
import { useAuth } from '@/components/storefront/UserContext';

export default function CustomerProfilePage() {
  const { user, refreshUser } = useAuth();

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    marketing_consent: false,
  });

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Email Change Modal State
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [emailChangeLoading, setEmailChangeLoading] = useState(false);
  const [emailChangeError, setEmailChangeError] = useState('');
  const [emailChangeSuccess, setEmailChangeSuccess] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        marketing_consent: Boolean(user.marketing_consent),
      });
    }
  }, [user]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message || 'Profil bilgileriniz başarıyla güncellendi.');
        await refreshUser();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(data.error || 'Profil güncellenemedi.');
      }
    } catch (err: any) {
      setErrorMsg('Bir bağlantı hatası oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChangeRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailChangeLoading(true);
    setEmailChangeError('');
    setEmailChangeSuccess('');

    try {
      const res = await fetch('/api/user/change-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          new_email: newEmail,
          current_password: currentPassword,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setEmailChangeSuccess(data.message || 'Onay bağlantısı yeni e-posta adresinize gönderildi.');
        setNewEmail('');
        setCurrentPassword('');
      } else {
        setEmailChangeError(data.error || 'E-posta değiştirme talebi oluşturulamadı.');
      }
    } catch (err: any) {
      setEmailChangeError('Bağlantı hatası oluştu.');
    } finally {
      setEmailChangeLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <h1 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
          <User className="w-5 h-5 text-blue-900" />
          Kişisel Profil Bilgilerim
        </h1>
        <p className="text-xs text-slate-500">
          Hesap bilgilerinizi, iletişim tercihlerinizi ve kayıtlı bilgilerinizi buradan güncelleyebilirsiniz.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 text-red-700 rounded-2xl border border-red-200 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Profile Form */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <form onSubmit={handleProfileSubmit} className="space-y-5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Adınız <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Soyadınız <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Cep Telefonu Numaranız
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                placeholder="05XXXXXXXXX"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Kargo takip SMS bildirimleri ve sipariş güncellemeleri için kullanılır.
            </p>
          </div>

          {/* Marketing Consent */}
          <div className="pt-2 border-t border-slate-100">
            <label className="flex items-start gap-2.5 cursor-pointer text-slate-700 leading-tight">
              <input
                type="checkbox"
                checked={formData.marketing_consent}
                onChange={(e) => setFormData({ ...formData, marketing_consent: e.target.checked })}
                className="mt-0.5 rounded text-blue-900 focus:ring-blue-900"
              />
              <span>
                Bursa Kumaş Dünyası kampanyaları, indirim kuponları ve yeni kumaş koleksiyonları hakkında ticari elektronik ileti (SMS / E-Posta) almayı kabul ediyorum.
              </span>
            </label>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition"
            >
              {loading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
            </button>
          </div>
        </form>
      </div>

      {/* Email Change Section */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-900" />
              E-Posta Adresi
            </h3>
            <p className="text-xs text-slate-600">
              Mevcut e-posta adresiniz: <strong className="text-slate-900">{user?.email}</strong>
            </p>
          </div>

          <button
            onClick={() => {
              setEmailModalOpen(true);
              setEmailChangeError('');
              setEmailChangeSuccess('');
            }}
            className="px-4 py-2 bg-slate-100 hover:bg-blue-900 hover:text-white text-slate-800 font-bold text-xs rounded-xl border border-slate-200 transition"
          >
            E-Posta Değiştir
          </button>
        </div>
      </div>

      {/* Change Email Modal */}
      {emailModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-900" />
                <span>E-Posta Adresinizi Değiştirin</span>
              </h3>
              <button
                onClick={() => setEmailModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {emailChangeSuccess ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 text-xs space-y-2">
                <p className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Doğrulama E-Postası Gönderildi
                </p>
                <p>{emailChangeSuccess}</p>
                <p className="text-[11px] text-slate-500">
                  Yeni adresinize gelen linke tıkladıktan sonra e-posta adresiniz güncellenecektir.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setEmailModalOpen(false)}
                    className="w-full py-2 bg-emerald-700 text-white font-bold rounded-xl text-xs"
                  >
                    Tamam
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleEmailChangeRequest} className="space-y-4 text-xs">
                <p className="text-slate-500 text-[11px]">
                  Güvenliğiniz için yeni e-posta adresinize bir onay bağlantısı iletilecektir.
                </p>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Yeni E-Posta Adresi
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="yeni.eposta@domain.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Mevcut Hesap Şifreniz
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-900"
                    />
                  </div>
                </div>

                {emailChangeError && (
                  <div className="p-3 bg-red-50 text-red-700 rounded-xl border border-red-200 text-xs font-semibold">
                    {emailChangeError}
                  </div>
                )}

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEmailModalOpen(false)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="submit"
                    disabled={emailChangeLoading}
                    className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition"
                  >
                    {emailChangeLoading ? 'Gönderiliyor...' : 'Doğrulama İsteği Gönder'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
