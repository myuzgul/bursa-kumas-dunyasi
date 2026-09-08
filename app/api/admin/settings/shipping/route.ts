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
      is_active,
      dhl_integration_active,
      dhl_test_mode,
      dhl_customer_code,
      dhl_api_key,
      dhl_api_secret,
      dhl_branch_code,
      dhl_sender_name,
      dhl_sender_phone,
      dhl_sender_address,
      dhl_auto_generate_label,
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
      carrier_name: carrier_name?.trim() || current.carrier_name || 'DHL Kargo',
      announcement_text: announcement_text !== undefined ? announcement_text.trim() : current.announcement_text,
      is_active: is_active !== undefined ? Number(is_active) : current.is_active,
      dhl_integration_active: dhl_integration_active !== undefined ? Number(dhl_integration_active) : (current.dhl_integration_active ?? 1),
      dhl_test_mode: dhl_test_mode !== undefined ? Number(dhl_test_mode) : (current.dhl_test_mode ?? 0),
      dhl_customer_code: dhl_customer_code !== undefined ? String(dhl_customer_code).trim() : (current.dhl_customer_code || ''),
      dhl_api_key: dhl_api_key !== undefined ? String(dhl_api_key).trim() : (current.dhl_api_key || ''),
      dhl_api_secret: dhl_api_secret !== undefined ? String(dhl_api_secret).trim() : (current.dhl_api_secret || ''),
      dhl_branch_code: dhl_branch_code !== undefined ? String(dhl_branch_code).trim() : (current.dhl_branch_code || ''),
      dhl_sender_name: dhl_sender_name !== undefined ? String(dhl_sender_name).trim() : (current.dhl_sender_name || 'Bursa Kumaş Dünyası'),
      dhl_sender_phone: dhl_sender_phone !== undefined ? String(dhl_sender_phone).trim() : (current.dhl_sender_phone || '0 (542) 393 98 16'),
      dhl_sender_address: dhl_sender_address !== undefined ? String(dhl_sender_address).trim() : (current.dhl_sender_address || 'Kazım Karabekir Mah. Yıldırım / BURSA'),
      dhl_auto_generate_label: dhl_auto_generate_label !== undefined ? Number(dhl_auto_generate_label) : (current.dhl_auto_generate_label ?? 1),
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
