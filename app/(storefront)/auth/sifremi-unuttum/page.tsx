'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowRight, ArrowLeft, CheckCircle2, ShieldCheck, KeyRound } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'İşlem gerçekleştirilemedi.');
      } else {
        setSubmitted(true);
      }
    } catch (err: any) {
      setErrorMsg('Bir bağlantı hatası oluştu. Lütfen tekrar deneyiniz.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-blue-900 text-white rounded-2xl flex items-center justify-center font-black text-xl mx-auto shadow-md">
          <KeyRound className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-black text-slate-900">
          Şifrenizi mi Unuttunuz?
        </h1>
        <p className="text-xs text-slate-500">
          Kayıtlı e-posta adresinizi girin, şifre yenileme bağlantısını size gönderelim.
        </p>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5">
        {submitted ? (
          <div className="space-y-4 text-center">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">
              Sıfırlama Bağlantısı Gönderildi
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Eğer <strong>{email}</strong> sistemimizde kayıtlı ise, şifre sıfırlama talimatları ve güvenli bağlantı e-posta adresinize iletildi.
            </p>
            <p className="text-[11px] text-slate-400">
              Lütfen spam / gereksiz kutunuzu da kontrol ediniz.
            </p>
            <div className="pt-4">
              <Link
                href="/auth/giris"
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 bg-blue-900 text-white font-bold text-xs rounded-xl hover:bg-blue-800 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Giriş Sayfasına Dön</span>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Kayıtlı E-Posta Adresiniz
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
              <span>{isLoading ? 'Gönderiliyor...' : 'Şifre Sıfırlama Bağlantısı Gönder'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="pt-2 text-center">
              <Link
                href="/auth/giris"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-900 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Giriş ekranına geri dön</span>
              </Link>
            </div>
          </form>
        )}
      </div>

      <div className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        <span>Güvenli Müşteri Kimlik Doğrulama Sistemi</span>
      </div>
    </div>
  );
}
