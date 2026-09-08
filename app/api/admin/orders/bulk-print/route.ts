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
        if (!order.status || order.status === 'Siparis_Alindi' || order.status === 'Odeme_Onaylandi') {
          order.status = 'Hazirlaniyor'; // 2. Adım: Kesimde
        }
        if (!order.carrier) {
          order.carrier = 'DHL Kargo';
        }
        if (!order.tracking_number) {
          const cleanNum = (order.order_number || order.id || '2026').replace(/[^a-zA-Z0-9]/g, '');
          order.tracking_number = `DHL${cleanNum}TR`;
          order.tracking_url = `https://www.mngkargo.com.tr/gonderitakip?takipNo=${order.tracking_number}`;
        }
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
