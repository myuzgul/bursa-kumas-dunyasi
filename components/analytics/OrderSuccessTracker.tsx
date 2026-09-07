'use client';

import React, { useEffect } from 'react';
import { trackStorefrontEvent } from '@/lib/analytics/dataTier';

interface OrderSuccessTrackerProps {
  orderNumber: string;
  totalAmount?: number;
}

export function OrderSuccessTracker({ orderNumber, totalAmount = 750 }: OrderSuccessTrackerProps) {
  useEffect(() => {
    if (!orderNumber || typeof window === 'undefined') return;

    const storageKey = `bkd_tracked_order_${orderNumber}`;
    const alreadyTracked = sessionStorage.getItem(storageKey);

    if (!alreadyTracked) {
      const eventId = `bkd_purchase_${orderNumber}`;

      trackStorefrontEvent(
        'Purchase',
        {
          order_id: orderNumber,
          value: totalAmount,
          currency: 'TRY',
          content_name: 'Kumaş Siparişi',
          num_items: 1,
        },
        undefined,
        eventId
      );

      // Mark as tracked for this browser session to prevent duplicate fires on F5 / refresh
      sessionStorage.setItem(storageKey, 'true');
    }
  }, [orderNumber, totalAmount]);

  return null;
}
