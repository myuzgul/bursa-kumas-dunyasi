'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Eye, EyeOff, ShieldCheck, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!token) {
    return (
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm text-center space-y-4">
        <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-slate-900 text-sm">
          Geçersiz veya Eksik Bağlantı
        </h3>
        <p className="text-xs text-slate-600">
          Şifre sıfırlama bağlantısı bulunamadı veya parametre eksik. Lütfen yeni bir şifre sıfırlama talebi oluşturunuz.
        </p>
        <div className="pt-2">
          <Link
            href="/auth/sifremi-unuttum"
            className="inline-flex items-center justify-center gap-2 w-full py-2.5 bg-blue-900 text-white font-bold text-xs rounded-xl hover:bg-blue-800 transition"
          >
            Yeni Bağlantı Talep Et
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (password.length < 6) {
      setErrorMsg('Yeni şifreniz en az 6 karakter olmalıdır.');
      return;
    }

    if (password !== passwordConfirm) {
      setErrorMsg('Şifreler birbiriyle eşleşmiyor.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          new_password: password,
          new_password_confirm: passwordConfirm,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Şifre güncellenemedi.');
      } else {
        setSuccessMsg(data.message || 'Şifreniz başarıyla güncellendi! Giriş sayfasına yönlendiriliyorsunuz...');
        setTimeout(() => {
          router.push('/auth/giris');
        }, 2000);
      }
    } catch (err: any) {
      setErrorMsg('Bir bağlantı hatası oluştu. Lütfen tekrar deneyiniz.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5">
      {successMsg ? (
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">
            Şifreniz Güncellendi
          </h3>
          <p className="text-xs text-emerald-700 font-medium">
            {successMsg}
          </p>
          <div className="pt-2">
            <Link
              href="/auth/giris"
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 bg-blue-900 text-white font-bold text-xs rounded-xl hover:bg-blue-800 transition"
            >
              <span>Hemen Giriş Yap</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Yeni Şifre
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="En az 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-10 py-2.5 text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Yeni Şifre Tekrar
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPasswordConfirm ? 'text' : 'password'}
                required
                placeholder="Şifreyi doğrulayın"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-10 py-2.5 text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
              <button
                type="button"
                onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
              >
                {showPasswordConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3.5 bg-red-50 text-red-700 rounded-xl border border-red-200 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2"
          >
            <span>{isLoading ? 'Kaydediliyor...' : 'Şifreyi Güncelle ve Kaydet'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="max-w-md mx-auto px-4 py-16 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-blue-900 text-white rounded-2xl flex items-center justify-center font-black text-xl mx-auto shadow-md">
          BK
        </div>
        <h1 className="text-2xl font-black text-slate-900">
          Yeni Şifre Belirleyin
        </h1>
        <p className="text-xs text-slate-500">
          Hesabınız için güçlü ve güvenli yeni bir şifre oluşturun.
        </p>
      </div>

      <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Yükleniyor...</div>}>
        <ResetPasswordForm />
      </Suspense>

      <div className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        <span>Güvenli Şifre Yenileme</span>
      </div>
    </div>
  );
}
