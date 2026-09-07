import { NextResponse } from 'next/server';
import { getPublicPaymentSettings } from '@/lib/services/paymentSettings';

export async function GET() {
  try {
    const settings = getPublicPaymentSettings();
    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
