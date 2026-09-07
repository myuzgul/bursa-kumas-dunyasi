import { NextResponse } from 'next/server';
import { getActiveStories } from '@/lib/services/stories';

export async function GET() {
  try {
    const stories = getActiveStories();
    return NextResponse.json({ success: true, stories });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
