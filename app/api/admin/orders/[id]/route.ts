import { NextResponse } from 'next/server';
import { dbRepo } from '@/lib/db/repo';
import { logAuditAction } from '@/lib/services/auditLogger';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const db = dbRepo.read();
  const order = db.orders?.find((o: any) => o.id === params.id || o.order_number === params.id);

  if (!order) {
    return NextResponse.json({ message: 'Sipariş bulunamadı.' }, { status: 404 });
  }

  const items = db.order_items?.filter((i: any) => i.order_id === order.id) || [];
  const history = db.order_status_history?.filter((h: any) => h.order_id === order.id) || [];

  return NextResponse.json({
    order,
    items,
    history,
  });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const db = dbRepo.read();
    const orderIdx = db.orders?.findIndex((o: any) => o.id === params.id || o.order_number === params.id);

    if (orderIdx === -1 || orderIdx === undefined) {
      return NextResponse.json({ message: 'Sipariş bulunamadı.' }, { status: 404 });
    }

    if (body.print_status) {
      db.orders[orderIdx].print_status = body.print_status;
    }
    if (body.status) {
      db.orders[orderIdx].status = body.status;
    }

    dbRepo.write(db);

    logAuditAction({
      adminEmail: 'admin@bursakumasdunyasi.com',
      action: 'ORDER_UPDATE',
      details: `Sipariş #${db.orders[orderIdx].order_number} güncellendi: ${JSON.stringify(body)}`,
    });

    return NextResponse.json({ success: true, order: db.orders[orderIdx] });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Güncelleme başarısız.' }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const db = dbRepo.read();
    const targetOrder = db.orders?.find((o: any) => o.id === params.id || o.order_number === params.id);

    if (!targetOrder) {
      return NextResponse.json({ message: 'Sipariş bulunamadı.' }, { status: 404 });
    }

    db.orders = db.orders.filter((o: any) => o.id !== targetOrder.id);
    db.order_items = (db.order_items || []).filter((i: any) => i.order_id !== targetOrder.id);
    db.order_status_history = (db.order_status_history || []).filter((h: any) => h.order_id !== targetOrder.id);

    dbRepo.write(db);

    logAuditAction({
      adminEmail: 'admin@bursakumasdunyasi.com',
      action: 'ORDER_DELETE',
      details: `Sipariş silindi: #${targetOrder.order_number} (${targetOrder.customer_name})`,
    });

    return NextResponse.json({ success: true, message: 'Sipariş silindi.' });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Silme işlemi başarısız.' }, { status: 400 });
  }
}
