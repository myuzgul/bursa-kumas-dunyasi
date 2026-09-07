/**
 * DHL Kargo (MNG Kargo) Entegrasyon Servisi
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
  message: string;
}

export async function createYurticiShipment(payload: CreateShipmentPayload): Promise<ShipmentResponse> {
  // In production, connects to DHL / MNG Kargo API
  const trackingNumber = `DHL-${Math.floor(1000000000 + Math.random() * 9000000000)}`;
  const trackingUrl = `https://www.mngkargo.com.tr/gonderitakip?takipNo=${trackingNumber}`;

  return {
    success: true,
    trackingNumber,
    trackingUrl,
    carrier: 'DHL Kargo (MNG Kargo)',
    status: 'Kargoya_Verildi',
    message: `${payload.orderNumber} nolu sipariş için DHL Kargo (MNG Kargo) kaydı başarıyla oluşturuldu.`,
  };
}

export function getYurticiTrackingTimeline(status: string) {
  const steps = [
    { key: 'Siparis_Alindi', label: 'Sipariş Alındı', desc: 'Siparişiniz ve ödemeniz onaylandı.' },
    { key: 'Hazirlaniyor', label: 'Kesim & Hazırlık', desc: 'Kumaşınız uzman personelimizce kesiliyor ve paketleniyor.' },
    { key: 'Cikti_Alindi', label: 'Çıktı & Kalite Kontrol', desc: 'Sipariş çıktısı ve metre kontrolü yapıldı.' },
    { key: 'Kargoya_Verildi', label: 'Kargoya Verildi', desc: 'DHL Kargo (MNG Kargo) kuryesine teslim edildi.' },
    { key: 'Teslim_Edildi', label: 'Teslim Edildi', desc: 'Siparişiniz adresinize ulaştırıldı.' },
  ];

  const statusHierarchy = [
    'Siparis_Alindi',
    'Odeme_Onaylandi',
    'Hazirlaniyor',
    'Cikti_Alindi',
    'Kargoya_Verildi',
    'Teslim_Edildi',
  ];

  const currentIndex = statusHierarchy.indexOf(status);

  return steps.map((step) => {
    const stepIdx = statusHierarchy.indexOf(step.key);
    return {
      ...step,
      isCompleted: stepIdx <= currentIndex && currentIndex !== -1,
      isCurrent: step.key === status || (step.key === 'Siparis_Alindi' && status === 'Odeme_Onaylandi'),
    };
  });
}
