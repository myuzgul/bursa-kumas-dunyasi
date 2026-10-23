import { NextResponse } from 'next/server';
import { dbRepo } from '@/lib/db/repo';
import { logAuditAction } from '@/lib/services/auditLogger';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const ids: string[] = Array.isArray(body?.ids) ? body.ids : [];

    if (ids.length === 0) {
      return NextResponse.json({ message: 'Silinecek sipariş seçilmedi.' }, { status: 400 });
    }

    const db = dbRepo.read();
    const requestedIdsSet = new Set(ids.map((id) => String(id)));

    // Find all matching orders
    const matchedOrders = (db.orders || []).filter(
      (o: any) => requestedIdsSet.has(String(o.id)) || requestedIdsSet.has(String(o.order_number))
    );

    if (matchedOrders.length === 0) {
      return NextResponse.json({ message: 'Seçilen siparişler sistemde bulunamadı.' }, { status: 404 });
    }

    // Collect all order IDs and order numbers to be removed
    const allIdsToDelete = new Set<string>();
    const deletedOrderNumbers: string[] = [];

    matchedOrders.forEach((o: any) => {
      if (o.id) allIdsToDelete.add(String(o.id));
      if (o.order_number) {
        allIdsToDelete.add(String(o.order_number));
        deletedOrderNumbers.push(String(o.order_number));
      }
    });

    // Also include any raw IDs from the request that might only be IDs
    ids.forEach((id) => allIdsToDelete.add(String(id)));

    // Remove from orders
    const beforeCount = (db.orders || []).length;
    db.orders = (db.orders || []).filter(
      (o: any) => !allIdsToDelete.has(String(o.id)) && !allIdsToDelete.has(String(o.order_number))
    );
    const deletedCount = beforeCount - db.orders.length;

    // Remove from child collections
    db.order_items = (db.order_items || []).filter((i: any) => !allIdsToDelete.has(String(i.order_id)));
    db.order_status_history = (db.order_status_history || []).filter((h: any) => !allIdsToDelete.has(String(h.order_id)));

    if (db.payments) {
      db.payments = db.payments.filter((p: any) => !allIdsToDelete.has(String(p.order_id)));
    }
    if (db.shipping_logs) {
      db.shipping_logs = db.shipping_logs.filter((s: any) => !allIdsToDelete.has(String(s.order_id)));
    }
    if (db.invoice_logs) {
      db.invoice_logs = db.invoice_logs.filter((inv: any) => !allIdsToDelete.has(String(inv.order_id)));
    }

    dbRepo.write(db);

    logAuditAction({
      adminEmail: 'admin@bursakumasdunyasi.com',
      action: 'ORDER_BULK_DELETE',
      details: `${deletedCount} adet sipariş toplu silindi: #${deletedOrderNumbers.slice(0, 10).join(', ')}${
        deletedOrderNumbers.length > 10 ? '...' : ''
      }`,
    });

    return NextResponse.json(
      {
        success: true,
        count: deletedCount,
        message: `${deletedCount} adet sipariş başarıyla silindi.`,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (err: any) {
    console.error('Bulk delete order error:', err);
    return NextResponse.json({ message: err.message || 'Toplu silme işlemi başarısız.' }, { status: 400 });
  }
}
