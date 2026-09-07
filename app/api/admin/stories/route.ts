import { NextRequest, NextResponse } from 'next/server';
import { getStories, createStory, updateStory, deleteStory } from '@/lib/services/stories';

export async function GET() {
  try {
    const stories = getStories();
    return NextResponse.json({ success: true, stories });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const created = createStory(body);
    return NextResponse.json({
      success: true,
      message: 'Hikaye başarıyla oluşturuldu.',
      story: created,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) {
      return NextResponse.json({ success: false, message: 'ID zorunludur.' }, { status: 400 });
    }
    const updated = updateStory(id, updates);
    return NextResponse.json({
      success: true,
      message: 'Hikaye başarıyla güncellendi.',
      story: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, message: 'ID zorunludur.' }, { status: 400 });
    }
    const success = deleteStory(id);
    if (!success) {
      return NextResponse.json({ success: false, message: 'Hikaye bulunamadı.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Hikaye başarıyla silindi.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
