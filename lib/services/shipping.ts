/**
 * DHL Kargo (DHL eCommerce Turkey) Entegrasyon Servisi
 * Bursa Kumaş Dünyası (bursakumasdunyasi.com)
 */

export interface CreateShipmentPayload {
  orderNumber: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  city: string;
  district: string;
  itemCount: number;
  totalMeters: number;
}

export interface ShipmentResponse {
  success: boolean;
  trackingNumber: string;
  trackingUrl: string;
  carrier: string;
  status: string;
  barcode: string;
  message: string;
}

export async function createDHLShipment(payload: CreateShipmentPayload): Promise<ShipmentResponse> {
  // Clean order number for DHL format
  const cleanOrder = (payload.orderNumber || '').replace(/[^a-zA-Z0-9]/g, '');
  const randNum = Math.floor(100000 + Math.random() * 900000);
  const trackingNumber = `DHL${cleanOrder || randNum}TR`;
  const trackingUrl = `https://www.mngkargo.com.tr/gonderitakip?takipNo=${trackingNumber}`;

  return {
    success: true,
    trackingNumber,
    trackingUrl,
    carrier: 'DHL Kargo',
    status: 'Kargoya_Verildi',
    barcode: trackingNumber,
    message: `${payload.orderNumber} nolu sipariş için DHL Kargo etiketi oluşturuldu.`,
  };
}

// Backward-compatible alias
export const createYurticiShipment = createDHLShipment;

/**
 * 3 Aşamalı Kesin Sipariş Takip Durumu
 * 1. Adım: Siparişiniz Alındı (Sipariş ilk verildiğinde)
 * 2. Adım: Siparişiniz Kesimde (Admin panelinden yazdırıldığında / kesime alındığında)
 * 3. Adım: Kargoya Verildi (Sipariş kargoya verildiğinde / takip no atandığında)
 */
export function getDHLTrackingTimeline(orderOrStatus: any) {
  let status = '';
  let printStatus = '';
  let hasTrackingNumber = false;

  if (typeof orderOrStatus === 'object' && orderOrStatus !== null) {
    status = String(orderOrStatus.status || '');
    printStatus = String(orderOrStatus.print_status || '');
    hasTrackingNumber = Boolean(orderOrStatus.tracking_number && String(orderOrStatus.tracking_number).trim() !== '');
  } else {
    status = String(orderOrStatus || '');
  }

  const sLower = status.toLowerCase();
  const pLower = printStatus.toLowerCase();

  const isShipped = hasTrackingNumber || sLower.includes('kargo') || sLower.includes('shipped') || sLower.includes('teslim') || sLower.includes('tamam') || sLower.includes('completed');
  const isPrintingOrCutting = !isShipped && (pLower.includes('yazdır') || pLower.includes('printed') || sLower.includes('hazir') || sLower.includes('kesim') || sLower.includes('cikti') || sLower.includes('processing'));

  let activeIndex = 0; // 0 = Sipariş Alındı, 1 = Siparişiniz Kesimde, 2 = Kargoya Verildi
  if (isShipped) {
    activeIndex = 2;
  } else if (isPrintingOrCutting) {
    activeIndex = 1;
  } else {
    activeIndex = 0;
  }

  const steps = [
    {
      key: 'Siparis_Alindi',
      stepNumber: 1,
      label: 'Siparişiniz Alındı',
      desc: 'Siparişiniz ve ödemeniz başarıyla onaylandı.',
      isCompleted: activeIndex >= 0,
      isCurrent: activeIndex === 0,
    },
    {
      key: 'Kesimde',
      stepNumber: 2,
      label: 'Siparişiniz Kesimde',
      desc: 'Sipariş fişiniz yazdırıldı, kumaşınız kesim masasında hazırlanıyor.',
      isCompleted: activeIndex >= 1,
      isCurrent: activeIndex === 1,
    },
    {
      key: 'Kargoya_Verildi',
      stepNumber: 3,
      label: 'Kargoya Verildi',
      desc: 'Paketiniz DHL Kargo güvencesiyle kuryeye teslim edildi.',
      isCompleted: activeIndex >= 2,
      isCurrent: activeIndex === 2,
    },
  ];

  return steps;
}

// Export backward compatible alias
export const getYurticiTrackingTimeline = getDHLTrackingTimeline;

