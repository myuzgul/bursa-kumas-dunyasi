import { NextRequest, NextResponse } from 'next/server';
import { getPaymentSettings, updatePaymentSettings } from '@/lib/services/paymentSettings';

export async function GET() {
  try {
    const settings = getPaymentSettings();
    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const updated = updatePaymentSettings(body);
    return NextResponse.json({
      success: true,
      message: 'Ödeme ayarları başarıyla güncellendi.',
      settings: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
