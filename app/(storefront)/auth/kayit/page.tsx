'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Mail, User, Phone, Eye, EyeOff, ShieldCheck, ArrowRight, LogIn, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/components/storefront/UserContext';

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/hesabim';

  const { register } = useAuth();

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    password_confirm: '',
    kvkk_consent: false,
    marketing_consent: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!formData.kvkk_consent) {
      setErrorMsg('Lütfen KVKK Aydınlatma Metni ve Kullanıcı Sözleşmesini onaylayınız.');
      return;
    }

    if (formData.password.length < 6) {
      setErrorMsg('Şifreniz en az 6 karakter olmalıdır.');
      return;
    }

    if (formData.password !== formData.password_confirm) {
      setErrorMsg('Şifreler birbiriyle eşleşmiyor.');
      return;
    }

    setIsLoading(true);

    const res = await register(formData);
    if (!res.success) {
      setErrorMsg(res.error || 'Kayıt işlemi gerçekleştirilemedi.');
      setIsLoading(false);
    } else {
      setSuccessMsg('Hesabınız başarıyla oluşturuldu! Yönlendiriliyorsunuz...');
      setTimeout(() => {
        router.push(redirectUrl);
      }, 1000);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-12 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-blue-900 text-white rounded-2xl flex items-center justify-center font-black text-xl mx-auto shadow-md">
          BK
        </div>
        <h1 className="text-2xl font-black text-slate-900">
          Yeni Müşteri Hesabı Açın
        </h1>
        <p className="text-xs text-slate-500">
          Hızlı sipariş, kargo takibi, özel indirimler ve favori kumaşlarınızı kaydetmek için kayıt olun.
        </p>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5">
        <form onSubmit={handleRegister} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Adınız <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  name="first_name"
                  required
                  placeholder="Örn: Ahmet"
                  value={formData.first_name}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-900"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Soyadınız <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="last_name"
                required
                placeholder="Örn: Yılmaz"
                value={formData.last_name}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              E-Posta Adresi <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                name="email"
                required
                autoComplete="email"
                placeholder="ornek@domain.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Cep Telefonu <span className="text-slate-400 font-normal">(Sipariş/Kargo Bilgilendirmesi İçin)</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                name="phone"
                placeholder="05XXXXXXXXX"
                value={formData.phone}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Şifre <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  placeholder="En az 6 karakter"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-9 py-2.5 text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Şifre Tekrar <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPasswordConfirm ? 'text' : 'password'}
                  name="password_confirm"
                  required
                  placeholder="Şifreyi onaylayın"
                  value={formData.password_confirm}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-9 py-2.5 text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
                >
                  {showPasswordConfirm ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Consents */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            <label className="flex items-start gap-2.5 cursor-pointer text-[11px] text-slate-700 leading-tight">
              <input
                type="checkbox"
                name="kvkk_consent"
                required
                checked={formData.kvkk_consent}
                onChange={handleChange}
                className="mt-0.5 rounded text-blue-900 focus:ring-blue-900"
              />
              <span>
                <strong className="text-slate-900">KVKK Aydınlatma Metni</strong> ve{' '}
                <strong className="text-slate-900">Üyelik Sözleşmesi</strong> koşullarını okudum, anladım ve kabul ediyorum. <span className="text-red-500">*</span>
              </span>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer text-[11px] text-slate-600 leading-tight">
              <input
                type="checkbox"
                name="marketing_consent"
                checked={formData.marketing_consent}
                onChange={handleChange}
                className="mt-0.5 rounded text-blue-900 focus:ring-blue-900"
              />
              <span>
                Bursa Kumaş Dünyası kampanyaları, indirim kuponları ve yeni gelen kumaşlar hakkında SMS ve E-posta ile ticari elektronik ileti almayı kabul ediyorum. (İstediğiniz zaman iptal edebilirsiniz)
              </span>
            </label>
          </div>

          {errorMsg && (
            <div className="p-3.5 bg-red-50 text-red-700 rounded-xl border border-red-200 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || Boolean(successMsg)}
            className="w-full py-3 bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2"
          >
            <span>{isLoading ? 'Hesap Açılıyor...' : 'Hesabımı Oluştur'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 text-center space-y-3">
          <p className="text-xs text-slate-500">
            Zaten bir hesabınız var mı?
          </p>
          <Link
            href={`/auth/giris${redirectUrl ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}`}
            className="inline-flex items-center justify-center gap-2 w-full py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 font-bold text-xs rounded-xl transition"
          >
            <LogIn className="w-4 h-4 text-blue-900" />
            <span>Giriş Yap</span>
          </Link>
        </div>
      </div>

      <div className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        <span>Kişisel verileriniz 6698 Sayılı KVKK kapsamında en üst düzey güvenlik ile korunur.</span>
      </div>
    </div>
  );
}
