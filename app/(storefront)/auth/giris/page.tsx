'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowRight, UserPlus, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/components/storefront/UserContext';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/hesabim';

  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    const res = await login(email, password, rememberMe);
    if (!res.success) {
      setErrorMsg(res.error || 'Giriş yapılamadı.');
      setIsLoading(false);
    } else {
      router.push(redirectUrl);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-blue-900 text-white rounded-2xl flex items-center justify-center font-black text-xl mx-auto shadow-md">
          BK
        </div>
        <h1 className="text-2xl font-black text-slate-900">
          Müşteri Girişi
        </h1>
        <p className="text-xs text-slate-500">
          Siparişlerinizi takip edin, favorilerinizi yönetin ve kuponlarınızı kullanın.
        </p>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5">
        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              E-Posta Adresi
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="ornek@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-bold text-slate-700">Şifre</label>
              <Link
                href="/auth/sifremi-unuttum"
                className="text-[11px] font-bold text-blue-900 hover:underline"
              >
                Şifremi Unuttum
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-10 py-2.5 text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
                aria-label="Şifreyi göster/gizle"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded text-blue-900 focus:ring-blue-900"
              />
              <span>Beni Hatırla (30 Gün)</span>
            </label>
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
            <span>{isLoading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 text-center space-y-3">
          <p className="text-xs text-slate-500">
            Henüz Bursa Kumaş Dünyası hesabınız yok mu?
          </p>
          <Link
            href={`/auth/kayit${redirectUrl ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}`}
            className="inline-flex items-center justify-center gap-2 w-full py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 font-bold text-xs rounded-xl transition"
          >
            <UserPlus className="w-4 h-4 text-blue-900" />
            <span>Yeni Hesap Oluştur (Hızlı Kayıt)</span>
          </Link>
        </div>
      </div>

      <div className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        <span>256-Bit SSL Şifreli Güvenli Müşteri Girişi</span>
      </div>
    </div>
  );
}
