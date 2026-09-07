import { NextResponse } from 'next/server';
import { getShippingSettings } from '@/lib/services/shippingSettings';

export async function GET() {
  try {
    const settings = getShippingSettings();
    return NextResponse.json({ settings });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
