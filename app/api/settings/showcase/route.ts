import { NextResponse } from 'next/server';
import { getShowcaseData } from '@/lib/services/showcaseSettings';

export async function GET() {
  try {
    const data = getShowcaseData();
    return NextResponse.json({ success: true, ...data });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
