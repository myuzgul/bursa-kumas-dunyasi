'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Bell, 
  CheckCheck, 
  Package, 
  ShieldCheck, 
  Ticket, 
  Info, 
  ArrowRight 
} from 'lucide-react';
import { useAuth } from '@/components/storefront/UserContext';

export default function CustomerNotificationsPage() {
  const { refreshUser } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/user/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
      }
    } catch (e) {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch('/api/user/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mark_all: true }),
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
        setUnreadCount(0);
        refreshUser();
      }
    } catch (e) {
      // Ignore
    }
  };

  const handleMarkSingleRead = async (id: string) => {
    try {
      await fetch('/api/user/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_id: id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      refreshUser();
    } catch (e) {}
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <Package className="w-4 h-4 text-blue-900" />;
      case 'security':
        return <ShieldCheck className="w-4 h-4 text-rose-600" />;
      case 'coupon':
        return <Ticket className="w-4 h-4 text-amber-600" />;
      default:
        return <Info className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-900" />
            Bildirimler {unreadCount > 0 && `(${unreadCount} Okunmamış)`}
          </h1>
          <p className="text-xs text-slate-500">
            Sipariş durumu, kargo hareketleri ve hesap güvenlik bildirimleriniz
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
          >
            <CheckCheck className="w-4 h-4 text-emerald-600" />
            <span>Tümünü Okundu İşaretle</span>
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">Bildirimler yükleniyor...</div>
        ) : notifications.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <Bell className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">Hiç Bildiriminiz Yok</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Siparişlerinizle veya hesabınızla ilgili güncellemeler olduğunda burada listelenecektir.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 space-y-3">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => notif.is_read === 0 && handleMarkSingleRead(notif.id)}
                className={`pt-3 first:pt-0 p-3 rounded-2xl transition flex items-start justify-between gap-4 ${
                  notif.is_read === 0 ? 'bg-blue-50/50' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
                    {getNotifIcon(notif.type)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-xs text-slate-900">{notif.title}</p>
                      {notif.is_read === 0 && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{notif.message}</p>
                    <p className="text-[10px] text-slate-400">
                      {new Date(notif.created_at).toLocaleDateString('tr-TR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>

                {notif.action_url && (
                  <Link
                    href={notif.action_url}
                    className="p-2 text-slate-400 hover:text-blue-900 rounded-xl hover:bg-white transition flex-shrink-0"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
