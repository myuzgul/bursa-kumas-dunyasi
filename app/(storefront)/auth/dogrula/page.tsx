'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, XCircle, Loader2, ArrowRight, ShieldCheck, Mail } from 'lucide-react';
import { useAuth } from '@/components/storefront/UserContext';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { refreshUser, isAuthenticated } = useAuth();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Doğrulama bağlantısı geçersiz veya eksik.');
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();
        if (res.ok) {
          setStatus('success');
          setMessage(data.message || 'E-posta adresiniz başarıyla doğrulandı.');
          refreshUser();
        } else {
          setStatus('error');
          setMessage(data.error || 'Doğrulama işlemi başarısız oldu.');
        }
      } catch (err: any) {
        setStatus('error');
        setMessage('Bağlantı hatası oluştu. Lütfen daha sonra tekrar deneyiniz.');
      }
    };

    verify();
  }, [token, refreshUser]);

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm text-center space-y-5">
      {status === 'loading' && (
        <div className="py-8 space-y-3">
          <Loader2 className="w-10 h-10 text-blue-900 animate-spin mx-auto" />
          <h2 className="text-base font-bold text-slate-800">
            E-Posta Adresiniz Doğrulanıyor...
          </h2>
          <p className="text-xs text-slate-500">
            Lütfen birkaç saniye bekleyiniz.
          </p>
        </div>
      )}

      {status === 'success' && (
        <div className="py-4 space-y-4">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-black text-slate-900">
            Tebrikler! Hesabınız Doğrulandı
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
            {message}
          </p>
          <div className="pt-2">
            <Link
              href={isAuthenticated ? '/hesabim' : '/auth/giris'}
              className="inline-flex items-center justify-center gap-2 w-full py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md transition"
            >
              <span>{isAuthenticated ? 'Hesabıma Git' : 'Giriş Yap'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="py-4 space-y-4">
          <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <XCircle className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-black text-slate-900">
            Doğrulama Başarısız
          </h2>
          <p className="text-xs text-red-600 font-medium max-w-sm mx-auto">
            {message}
          </p>
          <div className="pt-2 space-y-2">
            <Link
              href="/auth/giris"
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition"
            >
              <span>Giriş Sayfasına Git</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="max-w-md mx-auto px-4 py-16 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-blue-900 text-white rounded-2xl flex items-center justify-center font-black text-xl mx-auto shadow-md">
          <Mail className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-black text-slate-900">
          E-Posta Doğrulama
        </h1>
      </div>

      <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Yükleniyor...</div>}>
        <VerifyEmailContent />
      </Suspense>

      <div className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        <span>Bursa Kumaş Dünyası Güvenlik Doğrulama Servisi</span>
      </div>
    </div>
  );
}
