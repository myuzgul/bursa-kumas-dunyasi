import { dbRepo } from '../db/repo';
import { computePromotions, recordPromotionUsage, releasePromotionUsage } from './promotions';
import { computeOrderTotals } from './cartQuote';
import { resolveAcceptedOutlet, buildOutletOrderLine, commitOutletSale, releaseOutletSale } from './outlet';
import { sendEmailNotification, sendSmsNotification } from './notifications';
import { createYurticiShipment } from './shipping';
import { createParkBulutInvoice } from './invoice';

export interface CheckoutCustomerData {
  fullName: string;
  email: string;
  phone: string;
  addressTitle?: string;
  city: string;
  district: string;
  addressLine: string;
  postalCode?: string;
  isCorporate?: boolean;
  companyName?: string;
  taxNumber?: string;
  taxOffice?: string;
  orderNotes?: string;
}

export interface CheckoutItem {
  productId: string;
  variantId?: string;
  meterQuantity: number;
}

export interface CreateOrderParams {
  customer: CheckoutCustomerData;
  items: CheckoutItem[];
  couponCode?: string;
  paymentMethod?: string;
  userId?: string;
  /** Kupon/kampanya müşteri kontrolleri için sunucuda (oturum çerezinden) belirlenen üye kimliği */
  promoUserId?: string | null;
  /** Ödeme sayfasında kabul edilen outlet fırsatı */
  outlet?: { reservationId?: string; sessionId?: string } | null;
}

function checkoutError(message: string, code: string): Error {
  const err: any = new Error(message);
  err.code = code;
  return err;
}

export function isCancelledOrderStatus(status: any): boolean {
  const s = String(status || '');
  return s.startsWith('Iptal') || s.startsWith('Iade');
}

export function generateOrderNumber(): string {
  const db = dbRepo.read();
  const BASE_START_NUMBER = 12354;
  
  if (!db.orders || db.orders.length === 0) {
    return BASE_START_NUMBER.toString();
  }

  // Find the highest numeric 5-digit order number
  let maxOrderNum = BASE_START_NUMBER - 1;

  for (const order of db.orders) {
    if (order.order_number) {
      const trimmed = String(order.order_number).replace(/[^0-9]/g, '');
      const num = parseInt(trimmed, 10);
      if (!isNaN(num) && num >= BASE_START_NUMBER && num < 999999) {
        if (num > maxOrderNum) {
          maxOrderNum = num;
        }
      }
    }
  }

  return (maxOrderNum + 1).toString();
}

export async function processCheckoutOrder(params: CreateOrderParams) {
  const db = dbRepo.read();

  if (!params.items || params.items.length === 0) {
    throw new Error('Sepetinizde ürün bulunmamaktadır.');
  }

  // 1. Verify products & stock server-side
  let calculatedSubtotal = 0;
  const orderItemsData: any[] = [];

  for (const item of params.items) {
    const product = db.products.find((p: any) => p.id === item.productId && p.is_active === 1);
    if (!product) {
      throw new Error(`Ürün bulunamadı veya satışta değil: ${item.productId}`);
    }

    let unitPrice = product.discount_price || product.base_price;
    let variantTitle = '';
    let productSku = product.sku;
    let productImage = product.main_image_url;

    if (item.variantId) {
      const variant = db.product_variants.find(
        (v: any) => v.id === item.variantId && v.product_id === product.id && v.is_active === 1
      );
      if (variant) {
        unitPrice = variant.discount_price || variant.price;
        variantTitle = variant.title;
        productSku = variant.sku;
        if (variant.image_url) productImage = variant.image_url;

        // Stock check (only if variant tracks stock)
        const isVariantStockTracked = variant.track_stock === 1 || (variant.stock_meter !== null && variant.stock_meter !== undefined && variant.track_stock !== 0);
        if (isVariantStockTracked) {
          if (Number(variant.stock_meter || 0) <= 0) {
            throw new Error(`${product.name} (${variant.title}) tükendi / stokta kalmadı.`);
          }
          if (Number(variant.stock_meter || 0) < item.meterQuantity) {
            throw new Error(
              `${product.name} (${variant.title}) için talep edilen ${item.meterQuantity}m stokta yok. Mevcut stok: ${variant.stock_meter}m.`
            );
          }
        }
      }
    } else {
      // Stock check (only if product tracks stock)
      const isProductStockTracked = product.track_stock === 1 || (product.stock_meter !== null && product.stock_meter !== undefined && product.track_stock !== 0);
      if (isProductStockTracked) {
        if (Number(product.stock_meter || 0) <= 0) {
          throw new Error(`${product.name} tükendi / stokta kalmadı.`);
        }
        if (Number(product.stock_meter || 0) < item.meterQuantity) {
          throw new Error(
            `${product.name} için talep edilen ${item.meterQuantity}m stokta yok. Mevcut stok: ${product.stock_meter}m.`
          );
        }
      }
    }

    const itemTotal = Number((unitPrice * item.meterQuantity).toFixed(2));
    calculatedSubtotal += itemTotal;

    orderItemsData.push({
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      product_id: product.id,
      variant_id: item.variantId || null,
      product_name: product.name,
      variant_title: variantTitle,
      product_sku: productSku,
      product_image: productImage,
      meter_quantity: item.meterQuantity,
      unit_price: unitPrice,
      total_price: itemTotal,
    });
  }

  // 2. Outlet fırsatı (ödeme sayfasında kabul edildiyse) – son kontrol
  let outletOffer: any = null;
  let outletReservation: any = null;
  if (params.outlet && params.outlet.reservationId) {
    const resolved = resolveAcceptedOutlet(db, params.outlet);
    if (!resolved.offer) {
      throw checkoutError(
        resolved.error || 'Outlet fırsatı artık geçerli değil.',
        'OUTLET_UNAVAILABLE'
      );
    }
    outletOffer = resolved.offer;
    outletReservation = resolved.reservation;
    const outletLine = buildOutletOrderLine(db, outletOffer);
    orderItemsData.push(outletLine);
    calculatedSubtotal = Number((calculatedSubtotal + outletLine.total_price).toFixed(2));
  }

  // 3. Sunucu tarafında indirim (Sepette İndirim + Kupon) ve ödeme ayarlamaları
  const promoCustomer = {
    userId: params.promoUserId || params.userId || null,
    email: params.customer.email,
    phone: params.customer.phone,
  };
  const promotions = computePromotions(
    db,
    orderItemsData.map((oi: any) => ({
      product_id: oi.product_id,
      variant_id: oi.variant_id,
      meter_quantity: oi.meter_quantity,
      unit_price: oi.unit_price,
      total_price: oi.total_price,
      is_outlet: oi.is_outlet ? 1 : 0,
    })),
    { couponCode: params.couponCode, customer: promoCustomer }
  );

  if (params.couponCode && String(params.couponCode).trim() && promotions.couponError) {
    throw checkoutError(`Kupon uygulanamadı: ${promotions.couponError}`, 'COUPON_INVALID');
  }

  const finalDiscountTotal = promotions.totalDiscount;
  const paymentMethod = params.paymentMethod || 'paytr';
  const totals = computeOrderTotals({
    subtotal: calculatedSubtotal,
    totalDiscount: finalDiscountTotal,
    freeShipping: promotions.freeShipping,
    paymentMethod,
    hasItems: orderItemsData.length > 0,
  });
  const shippingTotal = totals.shippingTotal;
  const paymentFee = totals.paymentFee;
  const paymentDiscount = totals.paymentDiscount;
  const taxTotal = totals.taxTotal;
  const grandTotal = totals.grandTotal;

  const orderNumber = generateOrderNumber();
  const orderId = `ord-${Date.now()}`;

  const addressSnapshot = {
    fullName: params.customer.fullName,
    phone: params.customer.phone,
    city: params.customer.city,
    district: params.customer.district,
    addressLine: params.customer.addressLine,
    postalCode: params.customer.postalCode || '',
    isCorporate: params.customer.isCorporate || false,
    companyName: params.customer.companyName || '',
    taxNumber: params.customer.taxNumber || '',
    taxOffice: params.customer.taxOffice || '',
  };

  const newOrder = {
    id: orderId,
    order_number: orderNumber,
    user_id: params.userId || null,
    is_guest: params.userId ? 0 : 1,
    customer_name: params.customer.fullName,
    customer_email: params.customer.email,
    customer_phone: params.customer.phone,
    shipping_address: addressSnapshot,
    billing_address: addressSnapshot,
    subtotal: calculatedSubtotal,
    discount_total: finalDiscountTotal,
    payment_discount: paymentDiscount,
    payment_fee: paymentFee,
    coupon_code: promotions.coupon ? promotions.coupon.code : null,
    coupon_id: promotions.coupon ? promotions.coupon.id : null,
    coupon_discount_total: promotions.couponDiscount,
    free_shipping_coupon: promotions.freeShipping ? 1 : 0,
    cart_discount_total: promotions.cartDiscount,
    cart_discount_rule_id: promotions.cartRule ? promotions.cartRule.id : null,
    cart_discount_label: promotions.cartRule ? promotions.cartRule.label : null,
    outlet_offer_id: outletOffer ? outletOffer.id : null,
    outlet_total: outletOffer ? outletOffer.offer_price : 0,
    shipping_total: shippingTotal,
    tax_total: taxTotal,
    grand_total: grandTotal,
    status: 'Siparis_Alindi',
    payment_status: paymentMethod === 'paytr' ? 'paid' : 'pending',
    payment_method: paymentMethod,
    order_notes: params.customer.orderNotes || '',
    carrier_name: 'DHL Kargo (MNG Kargo)',
    tracking_number: '',
    tracking_url: '',
    invoice_status: 'pending',
    invoice_number: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // 3. Atomic stock deduction and DB persistence
  db.orders.unshift(newOrder);

  for (const oi of orderItemsData) {
    oi.order_id = orderId;
    db.order_items.push(oi);

    // Outlet parçaları ayrı stoktur; bağlı ürünün metre stoğundan düşülmez
    if (oi.is_outlet) continue;

    // Deduct stock safely if tracked
    const prod = db.products.find((p: any) => p.id === oi.product_id);
    if (prod) {
      const isProductStockTracked = prod.track_stock === 1 || (prod.stock_meter !== null && prod.stock_meter !== undefined && prod.track_stock !== 0);
      if (isProductStockTracked) {
        const oldStock = Number(prod.stock_meter || 0);
        const newStock = Math.max(0, Number((oldStock - oi.meter_quantity).toFixed(2)));
        prod.stock_meter = newStock;

        if (!db.stock_history) db.stock_history = [];
        db.stock_history.push({
          id: `stk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          product_id: prod.id,
          order_id: orderId,
          old_stock: oldStock,
          change_meter: -oi.meter_quantity,
          new_stock: newStock,
          reason: `Sipariş Satışı #${orderNumber}`,
          created_at: new Date().toISOString(),
        });
      }
    }

    if (oi.variant_id) {
      const vari = db.product_variants.find((v: any) => v.id === oi.variant_id);
      if (vari) {
        const isVariantStockTracked = vari.track_stock === 1 || (vari.stock_meter !== null && vari.stock_meter !== undefined && vari.track_stock !== 0);
        if (isVariantStockTracked) {
          vari.stock_meter = Math.max(0, Number(((vari.stock_meter || 0) - oi.meter_quantity).toFixed(2)));
        }
      }
    }
  }

  // Kupon / kampanya kullanım kayıtları
  recordPromotionUsage(db, promotions, newOrder, promoCustomer);

  // Outlet parçasını satıldı olarak işaretle
  if (outletOffer && outletReservation) {
    commitOutletSale(db, outletOffer, outletReservation, newOrder);
  }

  // Add initial status log
  db.order_status_history.unshift({
    id: `hist-${Date.now()}`,
    order_id: orderId,
    old_status: null,
    new_status: 'Siparis_Alindi',
    changed_by: 'Sistem (Otomatik)',
    notes: `Sipariş oluşturuldu. Toplam: ${grandTotal} TL`,
    created_at: new Date().toISOString(),
  });

  // Save DB
  dbRepo.write(db);

  // Send notifications
  sendEmailNotification({
    recipientEmail: params.customer.email,
    subject: `Bursa Kumaş Dünyası – Siparişiniz Alındı (#${orderNumber})`,
    templateType: 'ORDER_CONFIRMATION',
    bodyText: `Sayın ${params.customer.fullName}, #${orderNumber} numaralı kumaş siparişiniz başarıyla alınmıştır. En kısa sürede kesilerek kargoya verilecektir.`,
  });

  return {
    success: true,
    order: newOrder,
    items: orderItemsData,
  };
}

export async function updateOrderStatus(orderId: string, newStatus: string, adminName: string, notes?: string) {
  const db = dbRepo.read();
  const order = db.orders.find((o: any) => o.id === orderId);
  if (!order) {
    throw new Error('Sipariş bulunamadı.');
  }

  const oldStatus = order.status;
  order.status = newStatus;
  order.updated_at = new Date().toISOString();

  // İptal / iade: kupon-kampanya kullanımını ve outlet parçasını serbest bırak
  if (isCancelledOrderStatus(newStatus) && !isCancelledOrderStatus(oldStatus)) {
    releasePromotionUsage(db, order);
    releaseOutletSale(db, order);
  }

  // If status changed to Kargoya_Verildi, create shipping record if not exists
  if (newStatus === 'Kargoya_Verildi' && !order.tracking_number) {
    const shipment = await createYurticiShipment({
      orderNumber: order.order_number,
      recipientName: order.customer_name,
      recipientPhone: order.customer_phone,
      recipientAddress: typeof order.shipping_address === 'string' ? order.shipping_address : order.shipping_address.addressLine,
      city: typeof order.shipping_address === 'object' ? order.shipping_address.city : 'Bursa',
      district: typeof order.shipping_address === 'object' ? order.shipping_address.district : '',
      itemCount: 1,
      totalMeters: 5,
    });
    order.tracking_number = shipment.trackingNumber;
    order.tracking_url = shipment.trackingUrl;
    order.carrier_name = shipment.carrier;

    // Send SMS
    sendSmsNotification({
      phoneNumber: order.customer_phone,
      messageContent: `Bursa Kumaş Dünyası: #${order.order_number} nolu kumaş siparişiniz DHL Kargo (MNG Kargo) (${shipment.trackingNumber}) ile sevk edilmiştir.`,
    });
  }

  // If status changed to Hazirlaniyor / Cikti_Alindi / Fatura
  if (newStatus === 'Cikti_Alindi' && order.invoice_status !== 'created') {
    const invoice = await createParkBulutInvoice({
      orderNumber: order.order_number,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      customerPhone: order.customer_phone,
      isCorporate: false,
      address: typeof order.shipping_address === 'object' ? order.shipping_address.addressLine : order.shipping_address,
      subtotal: order.subtotal,
      taxTotal: order.tax_total,
      grandTotal: order.grand_total,
      items: [],
    });
    order.invoice_status = invoice.status;
    order.invoice_number = invoice.invoiceNumber;
  }

  db.order_status_history.unshift({
    id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    order_id: orderId,
    old_status: oldStatus,
    new_status: newStatus,
    changed_by: adminName || 'Yönetici',
    notes: notes || `Sipariş durumu ${newStatus} olarak güncellendi.`,
    created_at: new Date().toISOString(),
  });

  dbRepo.write(db);
  return order;
}
