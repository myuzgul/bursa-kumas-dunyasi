import { NextRequest, NextResponse } from 'next/server';
import { generatePayTRToken, getPayTRConfig } from '@/lib/services/paytr';

export async function POST(request: NextRequest) {
  try {
    const config = getPayTRConfig();
    if (!config.isActive) {
      return NextResponse.json(
        { success: false, message: 'PayTR ile ödeme yöntemi şu an devre dışıdır.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { orderNumber, email, paymentAmountTL, userName, userAddress, userPhone, basket } = body;

    if (!orderNumber || !email || !paymentAmountTL || !userName) {
      return NextResponse.json(
        { success: false, message: 'Eksik ödeme parametreleri.' },
        { status: 400 }
      );
    }

    // Determine client IP
    const forwardedFor = request.headers.get('x-forwarded-for');
    const userIp = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';

    const result = generatePayTRToken({
      orderNumber,
      email,
      paymentAmountTL: Number(paymentAmountTL),
      userName,
      userAddress: userAddress || 'Adres belirtilmedi',
      userPhone: userPhone || '05555555555',
      userIp,
      basket: basket || [['Kumaş Siparişi', String(paymentAmountTL), 1]],
    });

    return NextResponse.json({
      success: true,
      token: result.token,
      iframeUrl: result.iframeUrl,
      isTest: config.isTest,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
