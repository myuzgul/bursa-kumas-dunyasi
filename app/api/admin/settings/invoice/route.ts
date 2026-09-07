import { NextResponse } from 'next/server';
import { getInvoiceSettings, saveInvoiceSettings, testParkBulutConnection } from '@/lib/services/invoice';

export async function GET() {
  try {
    const settings = getInvoiceSettings();
    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Fatura ayarları alınamadı.' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const action = body.action;

    if (action === 'test_connection') {
      const result = await testParkBulutConnection(body.settings);
      return NextResponse.json(result);
    }

    const updated = saveInvoiceSettings(body);
    return NextResponse.json({
      success: true,
      message: 'Park Bulut fatura entegrasyon ayarları başarıyla kaydedildi.',
      settings: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Ayarlar kaydedilirken bir hata oluştu.' },
      { status: 500 }
    );
  }
}
