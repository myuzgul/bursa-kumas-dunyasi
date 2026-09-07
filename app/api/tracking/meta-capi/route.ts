import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { readDb } from '@/lib/db/repo';

function hashSha256(value?: string): string | undefined {
  if (!value || typeof value !== 'string') return undefined;
  const clean = value.trim().toLowerCase();
  if (!clean) return undefined;
  return crypto.createHash('sha256').update(clean).digest('hex');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { event_name, event_id, event_source_url, user_data = {}, custom_data = {} } = body;

    if (!event_name || !event_id) {
      return NextResponse.json({ success: false, message: 'Missing event_name or event_id' }, { status: 400 });
    }

    const db = readDb();
    const settings = db.tracking_settings || {};

    const pixelId = settings.meta_pixel_id;
    const capiToken = settings.meta_capi_token;
    const testCode = settings.meta_test_code;
    const isActive = settings.is_active !== 0;

    if (!isActive || !pixelId || !capiToken) {
      return NextResponse.json({
        success: true,
        skipped: true,
        message: 'Meta CAPI is inactive or missing credentials in settings.',
      });
    }

    // Extract Client Headers
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || '127.0.0.1';
    const clientUserAgent = req.headers.get('user-agent') || '';

    // Prepare hashed user data according to Meta CAPI specification
    const payloadUserData: Record<string, any> = {
      client_ip_address: clientIp,
      client_user_agent: clientUserAgent,
    };

    if (user_data.email) payloadUserData.em = [hashSha256(user_data.email)];
    if (user_data.phone) {
      // Normalize phone: remove non-digits
      const rawPhone = String(user_data.phone).replace(/\D/g, '');
      const cleanPhone = rawPhone.startsWith('90') ? rawPhone : (rawPhone.startsWith('0') ? `9${rawPhone}` : `90${rawPhone}`);
      payloadUserData.ph = [hashSha256(cleanPhone)];
    }
    if (user_data.firstName) payloadUserData.fn = [hashSha256(user_data.firstName)];
    if (user_data.lastName) payloadUserData.ln = [hashSha256(user_data.lastName)];
    if (user_data.city) payloadUserData.ct = [hashSha256(user_data.city)];
    if (user_data.zipCode) payloadUserData.zp = [hashSha256(user_data.zipCode)];
    if (user_data.country) payloadUserData.country = [hashSha256(user_data.country || 'tr')];

    const currentUnixTime = Math.floor(Date.now() / 1000);

    const eventPayload = {
      data: [
        {
          event_name,
          event_time: currentUnixTime,
          event_id,
          event_source_url: event_source_url || 'https://bursakumasdunyasi.com',
          action_source: 'website',
          user_data: payloadUserData,
          custom_data: {
            currency: custom_data.currency || 'TRY',
            value: typeof custom_data.value === 'number' ? custom_data.value : undefined,
            content_name: custom_data.content_name,
            content_category: custom_data.content_category,
            content_ids: custom_data.content_ids,
            contents: custom_data.contents,
            content_type: custom_data.content_type || 'product',
            num_items: custom_data.num_items,
            order_id: custom_data.order_id,
          },
        },
      ],
      ...(testCode ? { test_event_code: testCode } : {}),
    };

    // Forward to Meta Graph API
    const metaApiUrl = `https://graph.facebook.com/v18.0/${pixelId}/events?access_token=${capiToken}`;
    
    // We send the request with timeout protection
    const metaResponse = await fetch(metaApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventPayload),
    });

    const metaResult = await metaResponse.json();

    return NextResponse.json({
      success: metaResponse.ok,
      event_id,
      meta_response: metaResult,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
