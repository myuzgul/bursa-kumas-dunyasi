import React from 'react';
import { dbRepo } from '@/lib/db/repo';
import { ShieldAlert, Clock, User, Terminal } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function AdminAuditLogsPage() {
  const db = dbRepo.read();
  const logs = db.audit_logs || [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Sistem & Yönetici Audit Logları
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Fiyat güncellemeleri, sipariş durumu değişiklikleri ve toplu işlemlerin denetim kayıtları.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-5">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="p-3">Zaman</th>
                <th className="p-3">Yönetici</th>
                <th className="p-3">İşlem Türü</th>
                <th className="p-3">Detay</th>
                <th className="p-3">IP Adresi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {logs.map((log: any) => (
                <tr key={log.id} className="hover:bg-slate-50/70 transition">
                  <td className="p-3 text-slate-500">
                    {new Date(log.created_at).toLocaleString('tr-TR')}
                  </td>
                  <td className="p-3 font-sans font-bold text-slate-900">
                    {log.admin_email}
                  </td>
                  <td className="p-3">
                    <span className="bg-slate-100 text-blue-900 font-bold px-2 py-0.5 rounded">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3 font-sans text-slate-700">
                    {log.details}
                  </td>
                  <td className="p-3 text-slate-400">
                    {log.ip_address}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
