'use client';

import React, { useEffect } from 'react';
import { trackStorefrontEvent } from '@/lib/analytics/dataTier';

interface OrderSuccessTrackerProps {
  orderNumber: string;
  order?: any;
  items?: any[];
}

export function OrderSuccessTracker({ orderNumber, order, items = [] }: OrderSuccessTrackerProps) {
  useEffect(() => {
    if (!orderNumber || typeof window === 'undefined') return;

    const storageKey = `bkd_tracked_purchase_${orderNumber}`;
    const alreadyTracked = sessionStorage.getItem(storageKey);

    if (!alreadyTracked) {
      const eventId = `bkd_purchase_${orderNumber}`;

      // 1. Content IDs (Product SKUs or IDs matching Meta Catalog Feed)
      const contentIds = items.length > 0
        ? items.map((it: any) => String(it.product_sku || it.sku || it.product_id || it.id || ''))
        : [orderNumber];

      // 2. Primary Category
      const contentCategory = (items.length > 0 && items[0]?.category_name)
        ? items[0].category_name
        : 'Döşemelik ve Perdelik Kumaş';

      // 3. Contents Array
      const contents = items.length > 0
        ? items.map((it: any) => ({
            id: String(it.product_sku || it.sku || it.product_id || it.id || ''),
            quantity: Number(it.meter_quantity || it.quantity || 1),
            item_price: Number(it.unit_price || it.price || 0),
            name: it.product_name || it.name || 'Kumaş',
            category: it.category_name || contentCategory,
          }))
        : [{ id: orderNumber, quantity: 1, item_price: Number(order?.grand_total || 0), name: 'Kumaş Siparişi' }];

      const totalValue = Number(order?.grand_total || order?.total_amount || 0);

      // 4. User Data for Advanced Matching & Meta CAPI
      const userData = order ? {
        email: order.customer_email || undefined,
        phone: order.customer_phone || undefined,
        firstName: order.customer_name ? order.customer_name.split(' ')[0] : undefined,
        lastName: order.customer_name ? order.customer_name.split(' ').slice(1).join(' ') : undefined,
      } : undefined;

      // 5. Dispatch Purchase Event (Both Meta Pixel & CAPI Deduplicated)
      trackStorefrontEvent(
        'Purchase',
        {
          order_id: orderNumber,
          value: totalValue,
          currency: 'TRY',
          content_type: 'product',
          content_name: items.length === 1 ? items[0].product_name : 'Kumaş Siparişi',
          content_category: contentCategory,
          content_ids: contentIds,
          contents: contents,
          num_items: items.length || 1,
        },
        userData,
        eventId
      );

      // Mark as tracked for this session to prevent duplicate fires on browser refresh
      sessionStorage.setItem(storageKey, 'true');
    }
  }, [orderNumber, order, items]);

  return null;
}
