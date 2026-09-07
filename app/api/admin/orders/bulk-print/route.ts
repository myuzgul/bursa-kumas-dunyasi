import { NextResponse } from 'next/server';
import { dbRepo } from '@/lib/db/repo';
import { logAuditAction } from '@/lib/services/auditLogger';

export async function POST(req: Request) {
  try {
    const { orderIds } = await req.json();
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ message: 'Sipariş ID listesi gereklidir.' }, { status: 400 });
    }

    const db = dbRepo.read();
    let updatedCount = 0;

    for (const id of orderIds) {
      const order = db.orders?.find((o: any) => o.id === id || o.order_number === id);
      if (order) {
        order.print_status = 'Yazdırıldı';
        updatedCount++;
      }
    }

    dbRepo.write(db);

    logAuditAction({
      adminEmail: 'admin@bursakumasdunyasi.com',
      action: 'BULK_PRINT_ORDERS',
      details: `${updatedCount} adet sipariş toplu olarak yazdırıldı ve 'Yazdırıldı' olarak işaretlendi.`,
    });

    return NextResponse.json({
      success: true,
      updatedCount,
      message: `${updatedCount} adet sipariş 'Yazdırıldı' olarak güncellendi.`,
    });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Toplu yazdırma güncellenemedi.' }, { status: 400 });
  }
}
