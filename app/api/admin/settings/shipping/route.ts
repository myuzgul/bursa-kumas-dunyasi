import { NextRequest, NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db/repo';
import { DEFAULT_SHIPPING_SETTINGS } from '@/lib/services/shippingSettings';

export async function GET() {
  try {
    const db = readDb();
    const settings = db.shipping_settings || DEFAULT_SHIPPING_SETTINGS;
    return NextResponse.json({ settings });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      free_shipping_threshold, 
      shipping_cost, 
      carrier_name, 
      announcement_text, 
      is_active 
    } = body;

    const db = readDb();
    const current = db.shipping_settings || { ...DEFAULT_SHIPPING_SETTINGS };

    const parsedThreshold = free_shipping_threshold !== undefined
      ? Math.max(0, Number(free_shipping_threshold))
      : current.free_shipping_threshold;

    const parsedCost = shipping_cost !== undefined
      ? Math.max(0, Number(shipping_cost))
      : current.shipping_cost;

    const updatedSettings = {
      ...current,
      free_shipping_threshold: parsedThreshold,
      shipping_cost: parsedCost,
      carrier_name: carrier_name?.trim() || current.carrier_name || 'DHL Kargo (MNG Kargo)',
      announcement_text: announcement_text !== undefined ? announcement_text.trim() : current.announcement_text,
      is_active: is_active !== undefined ? Number(is_active) : current.is_active,
      updated_at: new Date().toISOString(),
    };

    db.shipping_settings = updatedSettings;
    writeDb(db);

    return NextResponse.json({
      success: true,
      message: 'Kargo ve ücretsiz teslimat ayarları başarıyla kaydedildi.',
      settings: updatedSettings,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return PUT(req);
}
