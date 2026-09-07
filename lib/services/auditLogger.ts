import { dbRepo } from '../db/repo';

export function logAuditAction(params: {
  adminEmail: string;
  adminId?: string;
  action: string;
  details: string;
  ipAddress?: string;
}) {
  const db = dbRepo.read();
  const entry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    admin_id: params.adminId || null,
    admin_email: params.adminEmail,
    action: params.action,
    details: params.details,
    ip_address: params.ipAddress || '127.0.0.1',
    created_at: new Date().toISOString(),
  };

  db.audit_logs.unshift(entry);
  dbRepo.write(db);
}
