import { NextResponse } from 'next/server';
import { runWooCommerceSync } from '@/lib/services/wcSync';

export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const logs: string[] = [];

    const result = await runWooCommerceSync({
      syncCategories: body.syncCategories ?? true,
      syncProducts: body.syncProducts ?? true,
      syncOrders: body.syncOrders ?? true,
      orderLimit: body.orderLimit ? Number(body.orderLimit) : 100,
      ck: body.ck,
      cs: body.cs,
      url: body.url,
    }, (msg: string) => {
      logs.push(`[${new Date().toLocaleTimeString('tr-TR')}] ${msg}`);
    });

    return NextResponse.json({
      success: true,
      result,
      logs,
    });
  } catch (error: any) {
    console.error('WooCommerce sync error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Senkronizasyon sırasında hata oluştu.'
    }, { status: 500 });
  }
}