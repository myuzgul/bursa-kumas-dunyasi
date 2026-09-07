import { NextRequest, NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db/repo';

export async function GET() {
  try {
    const db = readDb();
    const settings = db.tracking_settings || {
      meta_pixel_id: '',
      meta_capi_token: '',
      meta_test_code: '',
      ga4_measurement_id: '',
      gtm_id: '',
      google_ads_conversion_id: '',
      google_ads_conversion_label: '',
      is_active: 1,
    };
    return NextResponse.json({ settings });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const db = readDb();
    
    db.tracking_settings = {
      meta_pixel_id: body.meta_pixel_id?.trim() || '',
      meta_capi_token: body.meta_capi_token?.trim() || '',
      meta_test_code: body.meta_test_code?.trim() || '',
      ga4_measurement_id: body.ga4_measurement_id?.trim() || '',
      gtm_id: body.gtm_id?.trim() || '',
      google_ads_conversion_id: body.google_ads_conversion_id?.trim() || '',
      google_ads_conversion_label: body.google_ads_conversion_label?.trim() || '',
      is_active: body.is_active ? 1 : 0,
    };

    writeDb(db);

    return NextResponse.json({ success: true, settings: db.tracking_settings });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
