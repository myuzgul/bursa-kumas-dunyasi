'use client';

import React, { useEffect, useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  KeyRound, 
  Smartphone, 
  Laptop, 
  LogOut, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  X 
} from 'lucide-react';
import { useAuth } from '@/components/storefront/UserContext';

export default function CustomerSecurityPage() {
  const { logout } = useAuth();

  // Password Change Form
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    new_password_confirm: '',
    logout_other_devices: true,
  });
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwError, setPwError] = useState('');

  // Active Sessions
  const [sessions, setSessions] = useState<any[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionMsg, setSessionMsg] = useState('');

  // Account Delete Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/user/sessions');
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
        setCurrentSessionId(data.current_session_id || null);
      }
    } catch (e) {
      // Ignore
    } finally {
      setSessionsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwLoading(true);
    setPwSuccess('');
    setPwError('');

    if (passwordData.new_password.length < 6) {
      setPwError('Yeni şifreniz en az 6 karakter olmalıdır.');
      setPwLoading(false);
      return;
    }

    if (passwordData.new_password !== passwordData.new_password_confirm) {
      setPwError('Yeni şifreler birbiriyle eşleşmiyor.');
      setPwLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwordData),
      });

      const data = await res.json();
      if (res.ok) {
        setPwSuccess(data.message || 'Şifreniz başarıyla güncellendi.');
        setPasswordData({
          current_password: '',
          new_password: '',
          new_password_confirm: '',
          logout_other_devices: true,
        });
        fetchSessions();
        setTimeout(() => setPwSuccess(''), 5000);
      } else {
        setPwError(data.error || 'Şifre güncellenemedi.');
      }
    } catch (err: any) {
      setPwError('Bağlantı hatası oluştu.');
    } finally {
      setPwLoading(false);
    }
  };

  const handleTerminateSession = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/user/sessions?session_id=${sessionId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        setSessionMsg('Cihaz oturumu sonlandırıldı.');
        setTimeout(() => setSessionMsg(''), 3000);
      }
    } catch (e) {}
  };

  const handleTerminateAllOtherSessions = async () => {
    try {
      const res = await fetch('/api/user/sessions?logout_all=true', {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchSessions();
        setSessionMsg('Diğer tüm cihaz oturumları sonlandırıldı.');
        setTimeout(() => setSessionMsg(''), 3000);
      }
    } catch (e) {}
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteLoading(true);
    setDeleteError('');

    try {
      const res = await fetch('/api/user/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: deletePassword,
          reason: deleteReason,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert('Hesabınız başarıyla silindi. Bursa Kumaş Dünyası ile geçirdiğiniz zaman için teşekkür ederiz.');
        await logout();
      } else {
        setDeleteError(data.error || 'Hesap silinemedi.');
      }
    } catch (err: any) {
      setDeleteError('Bağlantı hatası oluştu.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <h1 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          Hesap Güvenliği ve Cihaz Yönetimi
        </h1>
        <p className="text-xs text-slate-500">
          Şifrenizi yenileyebilir, hesabınıza bağlı cihazları yönetebilir ve güvenlik ayarlarınızı düzenleyebilirsiniz.
        </p>
      </div>

      {/* 1. Change Password Form */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
        <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-blue-900" />
          Şifre Değiştir
        </h2>

        {pwSuccess && (
          <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{pwSuccess}</span>
          </div>
        )}

        {pwError && (
          <div className="p-4 bg-red-50 text-red-700 rounded-2xl border border-red-200 text-xs font-semibold">
            {pwError}
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-4 text-xs max-w-lg">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Mevcut Şifreniz <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showCurrentPw ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={passwordData.current_password}
                onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-10 py-2.5 text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPw(!showCurrentPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
              >
                {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Yeni Şifre <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showNewPw ? 'text' : 'password'}
                  required
                  placeholder="En az 6 karakter"
                  value={passwordData.new_password}
                  onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-9 py-2.5 text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-900"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw(!showNewPw)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
                >
                  {showNewPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Yeni Şifre Tekrar <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                required
                placeholder="Şifreyi doğrulayın"
                value={passwordData.new_password_confirm}
                onChange={(e) => setPasswordData({ ...passwordData, new_password_confirm: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 pt-1">
            <input
              type="checkbox"
              checked={passwordData.logout_other_devices}
              onChange={(e) => setPasswordData({ ...passwordData, logout_other_devices: e.target.checked })}
              className="rounded text-blue-900 focus:ring-blue-900"
            />
            <span>Şifre değiştikten sonra diğer tüm cihazlardan çıkış yapılsın</span>
          </label>

          <div className="pt-2">
            <button
              type="submit"
              disabled={pwLoading}
              className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition"
            >
              {pwLoading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
            </button>
          </div>
        </form>
      </div>

      {/* 2. Active Devices & Sessions */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Laptop className="w-4 h-4 text-blue-900" />
              Aktif Oturum Açık Cihazlar
            </h2>
            <p className="text-xs text-slate-500">
              Hesabınıza giriş yapılmış olan tüm telefon, tablet ve bilgisayarlar
            </p>
          </div>

          {sessions.length > 1 && (
            <button
              onClick={handleTerminateAllOtherSessions}
              className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition"
            >
              Diğer Cihazlardan Çıkış Yap
            </button>
          )}
        </div>

        {sessionMsg && (
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold">
            {sessionMsg}
          </div>
        )}

        {sessionsLoading ? (
          <div className="py-6 text-center text-xs text-slate-400">Cihazlar listeleniyor...</div>
        ) : (
          <div className="divide-y divide-slate-100 space-y-3">
            {sessions.map((ses) => {
              const isCurrent = ses.id === currentSessionId;
              const isMobile = ses.device_name?.toLowerCase().includes('mobil') || ses.user_agent?.includes('Mobile');

              return (
                <div key={ses.id} className="pt-3 first:pt-0 flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600">
                      {isMobile ? <Smartphone className="w-5 h-5" /> : <Laptop className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{ses.device_name || 'Bilinmeyen Cihaz'}</span>
                        {isCurrent && (
                          <span className="px-2 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold rounded-full">
                            Bu Cihaz
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        IP: {ses.ip_address} • Son Etkinlik: {new Date(ses.last_active_at || ses.created_at).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  {!isCurrent && (
                    <button
                      onClick={() => handleTerminateSession(ses.id)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 font-bold text-[11px] rounded-xl transition"
                    >
                      Oturumu Kapat
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Account Deletion (Danger Zone) */}
      <div className="bg-rose-50/50 rounded-3xl border border-rose-200 p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-black text-rose-950 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              Hesabımı Sil (KVKK Unutulma Hakkı)
            </h3>
            <p className="text-xs text-rose-800 leading-relaxed max-w-xl">
              Hesabınızı sildiğinizde kişisel verileriniz anonimleştirilir. Yasal vergi mevzuatı gereği geçmiş faturalarınız ve sipariş kayıtlarınız mali denetim amaçlı saklanmaya devam eder.
            </p>
          </div>

          <button
            onClick={() => setDeleteModalOpen(true)}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex-shrink-0"
          >
            Hesabı Kalıcı Olarak Sil
          </button>
        </div>
      </div>

      {/* Account Deletion Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-rose-900 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Hesabınızı Silmek İstediğinize Emin misiniz?</span>
              </h3>
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDeleteAccount} className="space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Bu işlem geri alınamaz. Kayıtlı adresleriniz, kuponlarınız ve sepetiniz silinecektir. Devam etmek için şifrenizi giriniz.
              </p>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Şifreniz <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Ayrılma Sebebiniz (Opsiyonel)
                </label>
                <textarea
                  rows={2}
                  placeholder="Hizmetimizi geliştirmemize yardımcı olmak isterseniz yazabilirsiniz..."
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-medium focus:bg-white focus:outline-none resize-none"
                />
              </div>

              {deleteError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-xl border border-red-200 text-xs font-semibold">
                  {deleteError}
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={deleteLoading}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition"
                >
                  {deleteLoading ? 'Siliniyor...' : 'Evet, Hesabımı Sil'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
