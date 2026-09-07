'use client';

// Unified Analytics & Meta Pixel / CAPI Deduplication Data Layer

export interface TrackingUserData {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  zipCode?: string;
  country?: string;
}

export interface TrackingEventData {
  content_name?: string;
  content_category?: string;
  content_ids?: string[];
  contents?: Array<{ id: string; quantity: number; item_price?: number; name?: string }>;
  content_type?: string;
  value?: number;
  currency?: string;
  num_items?: number;
  order_id?: string;
  search_string?: string;
  status?: string;
  [key: string]: any;
}

// Generate unique event ID for Pixel & CAPI Deduplication
export function generateEventId(prefix: string = 'bkd'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `${prefix}_${timestamp}_${random}`;
}

// Unified client-side tracker
export async function trackStorefrontEvent(
  eventName: 'PageView' | 'ViewContent' | 'AddToCart' | 'InitiateCheckout' | 'Purchase' | 'Search' | 'Contact',
  eventData: TrackingEventData = {},
  userData?: TrackingUserData,
  customEventId?: string
) {
  if (typeof window === 'undefined') return;

  const eventId = customEventId || generateEventId(eventName.toLowerCase());
  const currentUrl = window.location.href;

  // 1. Push to Google Data Layer (GTM / GA4)
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: eventName,
    eventId,
    ecommerce: {
      currency: eventData.currency || 'TRY',
      value: eventData.value,
      items: eventData.contents?.map((c) => ({
        item_id: c.id,
        item_name: c.name || c.id,
        price: c.item_price,
        quantity: c.quantity,
      })),
    },
    ...eventData,
  });

  // 2. Client-side Meta Pixel with EventID for deduplication
  if (typeof (window as any).fbq === 'function') {
    try {
      (window as any).fbq('track', eventName, eventData, { eventID: eventId });
    } catch (e) {
      console.warn('Meta Pixel dispatch error:', e);
    }
  }

  // 3. Client-side GA4 / Google Ads gtag
  if (typeof (window as any).gtag === 'function') {
    try {
      (window as any).gtag('event', eventName, {
        ...eventData,
        event_id: eventId,
      });
    } catch (e) {
      console.warn('Google gtag dispatch error:', e);
    }
  }

  // 4. Server-side Meta Conversions API (CAPI) Relay
  try {
    fetch('/api/tracking/meta-capi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_name: eventName,
        event_id: eventId,
        event_source_url: currentUrl,
        user_data: userData || {},
        custom_data: {
          currency: eventData.currency || 'TRY',
          value: eventData.value,
          ...eventData,
        },
      }),
    }).catch(() => {
      // Non-blocking background relay
    });
  } catch (err) {
    // Non-blocking
  }

  return eventId;
}

// Type definitions for window global objects
declare global {
  interface Window {
    dataLayer: any[];
    fbq: any;
    gtag: any;
  }
}
