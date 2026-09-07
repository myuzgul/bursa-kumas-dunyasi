import { NextRequest, NextResponse } from 'next/server';
import { verifyPayTRCallback } from '@/lib/services/paytr';
import { dbRepo } from '@/lib/db/repo';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const merchant_oid = formData.get('merchant_oid') as string;
    const status = formData.get('status') as string;
    const total_amount = formData.get('total_amount') as string;
    const hash = formData.get('hash') as string;
    const failed_reason_msg = (formData.get('failed_reason_msg') as string) || '';

    if (!merchant_oid || !status || !total_amount || !hash) {
      return new Response('PAYTR notification failed: missing parameters', { status: 400 });
    }

    const isValid = verifyPayTRCallback({
      merchant_oid,
      status,
      total_amount,
      hash,
    });

    if (!isValid) {
      console.error(`PayTR HMAC Verification failed for order ${merchant_oid}`);
      return new Response('PAYTR notification failed: bad hash', { status: 400 });
    }

    const db = dbRepo.read();
    const order = db.orders.find((o: any) => o.order_number === merchant_oid);

    if (order) {
      if (status === 'success') {
        order.payment_status = 'paid';
        order.payment_method = 'paytr';
        order.updated_at = new Date().toISOString();

        db.order_status_history.unshift({
          id: `hist-${Date.now()}`,
          order_id: order.id,
          old_status: order.status,
          new_status: order.status,
          changed_by: 'PayTR Webhook',
          notes: `PayTR ile ödeme başarıyla tamamlandı. Tutar: ${(Number(total_amount) / 100).toFixed(2)} TL`,
          created_at: new Date().toISOString(),
        });
      } else {
        order.payment_status = 'failed';
        order.updated_at = new Date().toISOString();

        db.order_status_history.unshift({
          id: `hist-${Date.now()}`,
          order_id: order.id,
          old_status: order.status,
          new_status: order.status,
          changed_by: 'PayTR Webhook',
          notes: `PayTR ödemesi başarısız: ${failed_reason_msg}`,
          created_at: new Date().toISOString(),
        });
      }

      dbRepo.write(db);
    }

    // PayTR requires plain 'OK' response
    return new Response('OK', { status: 200 });
  } catch (error: any) {
    console.error('PayTR callback error:', error);
    return new Response('PAYTR notification failed: server error', { status: 500 });
  }
}
