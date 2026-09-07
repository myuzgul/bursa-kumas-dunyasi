import { NextResponse } from 'next/server';
import { dbRepo } from '@/lib/db/repo';
import { getInvoiceSettings } from '@/lib/services/invoice';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const db = dbRepo.read();
  const order = db.orders?.find((o: any) => o.id === params.id || o.order_number === params.id);

  if (!order) {
    return new Response('Sipariş bulunamadı.', { status: 404 });
  }

  const items = db.order_items?.filter((i: any) => i.order_id === order.id) || [];
  const settings = getInvoiceSettings();

  const billing = typeof order.billing_address === 'string'
    ? JSON.parse(order.billing_address)
    : (order.billing_address || order.shipping_address);

  const isCorporate = Boolean(billing?.isCorporate || billing?.companyName);
  const invoiceNumber = order.invoice_number || `EAF2026${Math.floor(100000000 + Math.random() * 900000000)}`;
  const invoiceUuid = order.invoice_uuid || `uuid-${Date.now()}`;
  const invoiceDate = order.invoice_created_at
    ? new Date(order.invoice_created_at).toLocaleDateString('tr-TR')
    : new Date(order.created_at).toLocaleDateString('tr-TR');

  const html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>E-Arşiv / E-Fatura - ${invoiceNumber}</title>
  <style>
    * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
    body { background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b; }
    .invoice-card { max-width: 800px; margin: 0 auto; background: #fff; padding: 40px; border: 1px solid #cbd5e1; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 24px; }
    .company-title { font-size: 18px; font-weight: 800; color: #0f172a; }
    .company-sub { font-size: 11px; color: #64748b; margin-top: 4px; line-height: 1.4; }
    .badge { display: inline-block; background: #0f172a; color: #fff; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 4px; letter-spacing: 0.5px; }
    .meta-box { text-align: right; }
    .meta-line { font-size: 12px; margin-top: 4px; color: #334155; }
    .meta-line strong { color: #0f172a; }
    .parties-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
    .party-box { background: #f8fafc; padding: 14px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 12px; line-height: 1.5; }
    .party-header { font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 12px; }
    th { background: #0f172a; color: #fff; font-weight: 700; padding: 8px 10px; text-align: left; }
    th.num, td.num { text-align: right; }
    th.center, td.center { text-align: center; }
    td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; color: #1e293b; }
    tr:nth-child(even) td { background: #f8fafc; }
    .totals-container { display: flex; justify-content: flex-end; margin-bottom: 24px; }
    .totals-table { width: 280px; font-size: 12px; }
    .totals-table tr td { padding: 4px 8px; }
    .totals-table tr.grand td { font-size: 14px; font-weight: 800; border-top: 2px solid #0f172a; color: #0f172a; }
    .footer { border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 11px; color: #64748b; text-align: center; line-height: 1.4; }
    .action-bar { max-width: 800px; margin: 0 auto 16px auto; display: flex; justify-content: space-between; align-items: center; }
    .btn { background: #0f172a; color: #fff; border: none; padding: 8px 16px; font-size: 12px; font-weight: 600; border-radius: 6px; cursor: pointer; }
    .btn:hover { background: #1e293b; }
    @media print {
      body { background: #fff; padding: 0; }
      .invoice-card { border: none; box-shadow: none; padding: 0; }
      .action-bar { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="action-bar">
    <div style="font-size: 13px; font-weight: 600; color: #475569;">
      Park Bulut E-Arşiv / E-Fatura Görüntüleyici
    </div>
    <button class="btn" onclick="window.print()">Faturayı Yazdır / PDF Kaydet</button>
  </div>

  <div class="invoice-card">
    <div class="header">
      <div>
        <div class="company-title">${settings.sender_title}</div>
        <div class="company-sub">
          VKN/TCKN: <strong>${settings.sender_tax_number}</strong> • V.D.: ${settings.sender_tax_office}<br>
          ${settings.sender_address}<br>
          Tel: ${settings.sender_phone} • E-Posta: ${settings.sender_email}
        </div>
      </div>
      <div class="meta-box">
        <span class="badge">${isCorporate ? 'E-FATURA (TİCARİ)' : 'E-ARŞİV FATURA'}</span>
        <div class="meta-line" style="margin-top: 8px;">Fatura No: <strong>${invoiceNumber}</strong></div>
        <div class="meta-line">Fatura Tarihi: <strong>${invoiceDate}</strong></div>
        <div class="meta-line">Sipariş No: <strong>#${order.order_number}</strong></div>
        <div class="meta-line" style="font-size: 10px; color: #94a3b8; font-family: monospace;">UUID: ${invoiceUuid}</div>
      </div>
    </div>

    <div class="parties-grid">
      <div class="party-box">
        <div class="party-header">SAYIN / MÜŞTERİ BİLGİLERİ</div>
        <strong>${isCorporate ? (billing?.companyName || order.customer_name) : (billing?.fullName || order.customer_name)}</strong><br>
        ${billing?.taxNumber ? `VKN/TCKN: <strong>${billing.taxNumber}</strong><br>` : 'TCKN: 11111111111 (Bireysel E-Arşiv)<br>'}
        ${billing?.taxOffice ? `Vergi Dairesi: ${billing.taxOffice}<br>` : ''}
        Tel: ${billing?.phone || order.customer_phone}<br>
        E-Posta: ${order.customer_email}
      </div>
      <div class="party-box">
        <div class="party-header">FATURA VE TESLİMAT ADRESİ</div>
        ${billing?.addressLine || (typeof order.shipping_address === 'string' ? order.shipping_address : order.shipping_address?.addressLine)}<br>
        ${billing?.district || ''} / ${billing?.city || ''} ${billing?.postalCode ? `(${billing.postalCode})` : ''}<br>
        <strong>Türkiye</strong>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 35px;" class="center">#</th>
          <th>Mal / Hizmet Açıklaması</th>
          <th style="width: 70px;" class="center">Miktar</th>
          <th style="width: 50px;" class="center">Birim</th>
          <th style="width: 90px;" class="num">Birim Fiyat</th>
          <th style="width: 50px;" class="center">KDV %</th>
          <th style="width: 100px;" class="num">Mal Hizmet Tutarı</th>
        </tr>
      </thead>
      <tbody>
        ${items.map((it: any, idx: number) => {
          const unitPriceWithoutVat = (it.unit_price / 1.10);
          const lineTotalWithoutVat = unitPriceWithoutVat * it.meter_quantity;
          return `
            <tr>
              <td class="center">${idx + 1}</td>
              <td>
                <strong>${it.product_name}</strong>
                ${it.variant_title ? `<br><span style="font-size:10px; color:#64748b;">${it.variant_title}</span>` : ''}
              </td>
              <td class="center font-bold">${it.meter_quantity}</td>
              <td class="center">Metre</td>
              <td class="num">₺${unitPriceWithoutVat.toFixed(2)}</td>
              <td class="center">%10</td>
              <td class="num">₺${lineTotalWithoutVat.toFixed(2)}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>

    <div class="totals-container">
      <table class="totals-table">
        <tr>
          <td>Matrah (KDV Hariç):</td>
          <td class="num">₺${(order.subtotal / 1.10).toFixed(2)}</td>
        </tr>
        ${order.discount_total > 0 ? `
        <tr style="color: #16a34a;">
          <td>İskonto / İndirim:</td>
          <td class="num">-₺${order.discount_total.toFixed(2)}</td>
        </tr>
        ` : ''}
        ${order.shipping_total > 0 ? `
        <tr>
          <td>Kargo Bedeli:</td>
          <td class="num">₺${order.shipping_total.toFixed(2)}</td>
        </tr>
        ` : ''}
        <tr>
          <td>Hesaplanan KDV (%10):</td>
          <td class="num">₺${order.tax_total.toFixed(2)}</td>
        </tr>
        <tr class="grand">
          <td>ÖDENECEK TUTAR:</td>
          <td class="num">₺${order.grand_total.toFixed(2)}</td>
        </tr>
      </table>
    </div>

    <div class="footer">
      <div>Bu fatura Park Bulut E-Dönüşüm altyapısı ve 433 Sıra No'lu VUK Genel Tebliği uyarınca elektronik ortamda düzenlenmiştir.</div>
      <div style="margin-top: 4px;">GİB Portalı üzerinden E-Arşiv / E-Fatura sorgulaması yapılabilir.</div>
    </div>
  </div>
</body>
</html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}
