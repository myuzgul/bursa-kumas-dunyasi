import { dbRepo } from '../db/repo';

export interface EmailParams {
  recipientEmail: string;
  subject: string;
  templateType: 'ORDER_CONFIRMATION' | 'ORDER_SHIPPED' | 'ORDER_CANCELLED' | 'ADMIN_ALERT';
  bodyText: string;
}

export interface SmsParams {
  phoneNumber: string;
  messageContent: string;
  provider?: string;
}

export async function sendEmailNotification(params: EmailParams): Promise<boolean> {
  // In production, uses SMTP / Resend / Sendgrid
  // Logs to database for auditability
  const db = dbRepo.read();
  const newLog = {
    id: `em-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    recipient_email: params.recipientEmail,
    subject: params.subject,
    template_type: params.templateType,
    status: 'sent',
    error_message: null,
    created_at: new Date().toISOString(),
  };

  db.email_logs.unshift(newLog);
  dbRepo.write(db);
  return true;
}

export async function sendSmsNotification(params: SmsParams): Promise<boolean> {
  // In production, communicates with Netgsm / İletimerkezi
  const db = dbRepo.read();
  const newLog = {
    id: `sms-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    phone_number: params.phoneNumber,
    message_content: params.messageContent,
    provider: params.provider || 'Netgsm',
    status: 'sent',
    created_at: new Date().toISOString(),
  };

  db.sms_logs.unshift(newLog);
  dbRepo.write(db);
  return true;
}
