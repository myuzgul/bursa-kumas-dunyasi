import { NextResponse } from 'next/server';
import { dbRepo } from '@/lib/db/repo';
import { logAuditAction } from '@/lib/services/auditLogger';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const db = dbRepo.read();
  const searchId = String(params.id);
  const order = db.orders?.find((o: any) => String(o.id) === searchId || String(o.order_number) === searchId);

  if (!order) {
    return NextResponse.json({ message: 'Sipariş bulunamadı.' }, { status: 404 });
  }

  const items = db.order_items?.filter((i: any) => String(i.order_id) === String(order.id) || String(i.order_id) === String(order.order_number)) || [];
  const history = db.order_status_history?.filter((h: any) => String(h.order_id) === String(order.id) || String(h.order_id) === String(order.order_number)) || [];

  return NextResponse.json(
    {
      order,
      items,
      history,
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    }
  );
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const db = dbRepo.read();
    const searchId = String(params.id);
    const orderIdx = db.orders?.findIndex((o: any) => String(o.id) === searchId || String(o.order_number) === searchId);

    if (orderIdx === -1 || orderIdx === undefined) {
      return NextResponse.json({ message: 'Sipariş bulunamadı.' }, { status: 404 });
    }

    if (body.print_status !== undefined) {
      db.orders[orderIdx].print_status = body.print_status;
    }
    if (body.status !== undefined) {
      db.orders[orderIdx].status = body.status;
    }

    db.orders[orderIdx].updated_at = new Date().toISOString();
    dbRepo.write(db);

    logAuditAction({
      adminEmail: 'admin@bursakumasdunyasi.com',
      action: 'ORDER_UPDATE',
      details: `Sipariş #${db.orders[orderIdx].order_number} güncellendi: ${JSON.stringify(body)}`,
    });

    return NextResponse.json(
      { success: true, order: db.orders[orderIdx] },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Güncelleme başarısız.' }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const db = dbRepo.read();
    const searchId = String(params.id);
    const targetOrder = db.orders?.find((o: any) => String(o.id) === searchId || String(o.order_number) === searchId);

    if (!targetOrder) {
      return NextResponse.json({ message: 'Sipariş bulunamadı veya zaten silinmiş.' }, { status: 404 });
    }

    const targetId = String(targetOrder.id);
    const targetOrderNum = String(targetOrder.order_number);
    const idsToDelete = new Set([targetId, targetOrderNum]);

    db.orders = (db.orders || []).filter((o: any) => !idsToDelete.has(String(o.id)) && !idsToDelete.has(String(o.order_number)));
    db.order_items = (db.order_items || []).filter((i: any) => !idsToDelete.has(String(i.order_id)));
    db.order_status_history = (db.order_status_history || []).filter((h: any) => !idsToDelete.has(String(h.order_id)));
    
    if (db.payments) {
      db.payments = db.payments.filter((p: any) => !idsToDelete.has(String(p.order_id)));
    }
    if (db.shipping_logs) {
      db.shipping_logs = db.shipping_logs.filter((s: any) => !idsToDelete.has(String(s.order_id)));
    }
    if (db.invoice_logs) {
      db.invoice_logs = db.invoice_logs.filter((inv: any) => !idsToDelete.has(String(inv.order_id)));
    }

    dbRepo.write(db);

    logAuditAction({
      adminEmail: 'admin@bursakumasdunyasi.com',
      action: 'ORDER_DELETE',
      details: `Sipariş silindi: #${targetOrder.order_number} (${targetOrder.customer_name})`,
    });

    return NextResponse.json(
      { success: true, message: 'Sipariş silindi.', deletedId: targetId },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Silme işlemi başarısız.' }, { status: 400 });
  }
}
