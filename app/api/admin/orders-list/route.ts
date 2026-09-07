import { NextResponse } from 'next/server';
import { dbRepo } from '@/lib/db/repo';

export async function GET() {
  const db = dbRepo.read();

  // If orders is empty, provide realistic sample orders
  if (!db.orders || db.orders.length === 0) {
    db.orders = [
      {
        id: 'ord-1',
        order_number: 'YP-260828-5218',
        customer_name: 'Yazar Perde Yöneticisi',
        customer_phone: '05555555555',
        customer_email: 'yazarperde@example.com',
        shipping_address: {
          addressLine: 'İhsaniye Mah. Sanayi Cad. No: 42 Nilüfer',
          district: 'Nilüfer',
          city: 'Bursa',
          postalCode: '16130'
        },
        subtotal: 1060.60,
        discount_total: 0.00,
        shipping_total: 0.00,
        tax_total: 176.77,
        grand_total: 1060.60,
        payment_method: 'havale',
        payment_status: 'paid',
        print_status: 'Yazdırıldı',
        status: 'Hazirlaniyor', // Üretimde
        created_at: new Date('2026-08-28T03:14:00').toISOString(),
        order_notes: 'Keten Düz Tül Perde (Ütü İstemez)'
      },
      {
        id: 'ord-2',
        order_number: 'BKD-260829-1044',
        customer_name: 'Ahmet Yılmaz',
        customer_phone: '05321112233',
        customer_email: 'ahmet.yilmaz@example.com',
        shipping_address: {
          addressLine: 'Bağdat Cad. No: 120 Kadıköy',
          district: 'Kadıköy',
          city: 'İstanbul',
          postalCode: '34710'
        },
        subtotal: 2950.00,
        discount_total: 295.00,
        shipping_total: 0.00,
        tax_total: 442.50,
        grand_total: 2655.00,
        payment_method: 'paytr',
        payment_status: 'paid',
        print_status: 'Yazdırıldı',
        status: 'Kargoya_Verildi',
        created_at: new Date('2026-08-29T14:22:00').toISOString(),
        order_notes: '10 metre Antrasit Kadife döşemelik'
      },
      {
        id: 'ord-3',
        order_number: 'BKD-260830-8841',
        customer_name: 'Zeynep Kaya Tasarım',
        customer_phone: '05448889900',
        customer_email: 'zeynep@example.com',
        shipping_address: {
          addressLine: 'Çankaya Mah. Atatürk Bulvarı No: 88',
          district: 'Çankaya',
          city: 'Ankara',
          postalCode: '06690'
        },
        subtotal: 1825.00,
        discount_total: 182.50,
        shipping_total: 0.00,
        tax_total: 273.75,
        grand_total: 1642.50,
        payment_method: 'paytr',
        payment_status: 'paid',
        print_status: 'Bekliyor',
        status: 'Hazirlaniyor',
        created_at: new Date('2026-08-30T10:05:00').toISOString(),
        order_notes: '5 metre Krem Buklet kumaş tek parça kesilsin'
      }
    ];

    db.order_items = [
      {
        id: 'it-1',
        order_id: 'ord-1',
        product_name: 'Keten Düz Tül Perde (Ütü İstemez)',
        variant_title: 'Ekru',
        meter_quantity: 6.0,
        total_price: 1060.60,
        product_image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80'
      },
      {
        id: 'it-2',
        order_id: 'ord-2',
        product_name: 'Royal Lüks İtalyan Dokuma Kadife Döşemelik Kumaş',
        variant_title: 'Antrasit Gri',
        meter_quantity: 10.0,
        total_price: 2950.00,
        product_image: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=800&q=80'
      },
      {
        id: 'it-3',
        order_id: 'ord-3',
        product_name: 'Tulum Dokulu İskandinav Buklet Döşemelik Kumaş',
        variant_title: 'Doğal Krem / Bej',
        meter_quantity: 5.0,
        total_price: 1825.00,
        product_image: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=800&q=80'
      }
    ];
    dbRepo.write(db);
  }

  return NextResponse.json({
    orders: db.orders || [],
    items: db.order_items || [],
  });
}
