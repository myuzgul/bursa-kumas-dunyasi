'use client';

import React from 'react';

interface DHLPrintLabelProps {
  order: any;
  shippingAddress: any;
  totalMeters?: number;
}

/**
 * Generates an SVG pseudo Code-128 barcode pattern from a string
 */
function generateBarcodeLines(code: string) {
  const safeStr = (code || 'DHL2026').toUpperCase();
  const patterns: number[] = [];
  
  for (let i = 0; i < safeStr.length; i++) {
    const charCode = safeStr.charCodeAt(i);
    // Simple deterministically spaced bars
    patterns.push((charCode % 3) + 1);
    patterns.push(1);
    patterns.push((charCode % 2) + 1);
    patterns.push(1);
  }

  let currentX = 10;
  const rects: { x: number; width: number }[] = [];
  
  patterns.forEach((width, idx) => {
    if (idx % 2 === 0) {
      rects.push({ x: currentX, width: width * 1.6 });
    }
    currentX += width * 1.6;
  });

  return { rects, totalWidth: currentX + 10 };
}

export const DHLPrintLabel: React.FC<DHLPrintLabelProps> = ({
  order,
  shippingAddress,
  totalMeters = 0,
}) => {
  const cleanOrderNum = (order.order_number || order.id || '2026').replace(/[^a-zA-Z0-9]/g, '');
  const trackingNumber = order.tracking_number || `DHL${cleanOrderNum}TR`;
  const { rects, totalWidth } = generateBarcodeLines(trackingNumber);

  return (
    <div className="border-2 border-slate-900 rounded-xl p-3 bg-white text-slate-950 flex flex-col justify-between w-full max-w-[340px] text-[10px] leading-tight font-sans shadow-xs">
      {/* DHL Header */}
      <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
        <div className="flex items-center gap-1.5">
          <div className="bg-[#FFCC00] text-[#D40511] font-black px-2 py-0.5 rounded text-xs tracking-wider border border-[#D40511]/30">
            DHL
          </div>
          <span className="font-extrabold text-xs text-slate-900">eCommerce</span>
        </div>
        <div className="text-right">
          <span className="text-[9px] font-bold bg-slate-900 text-white px-1.5 py-0.5 rounded">
            KARGO ETİKETİ
          </span>
        </div>
      </div>

      {/* Barcode Section */}
      <div className="py-1.5 text-center flex flex-col items-center">
        <svg
          viewBox={`0 0 ${totalWidth} 40`}
          className="w-full h-9 max-w-[260px]"
          preserveAspectRatio="none"
        >
          {rects.map((r, i) => (
            <rect
              key={i}
              x={r.x}
              y={0}
              width={r.width}
              height={40}
              fill="#000000"
            />
          ))}
        </svg>
        <span className="font-mono font-black text-xs tracking-widest text-slate-900 mt-0.5">
          {trackingNumber}
        </span>
      </div>

      {/* Consignee (Alıcı) & Shipper (Gönderici) info */}
      <div className="grid grid-cols-1 divide-y divide-slate-200 border-t border-slate-800 pt-1.5 gap-1.5">
        <div>
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-500 text-[9px] uppercase">ALICI (MÜŞTERİ):</span>
            <span className="font-bold text-blue-900 font-mono text-[9px]">#{order.order_number}</span>
          </div>
          <div className="font-black text-xs text-slate-900 truncate">
            {order.customer_name}
          </div>
          <div className="text-[10px] text-slate-700 font-medium">
            Tel: <strong>{order.customer_phone}</strong>
          </div>
          <div className="text-[10px] text-slate-800 font-medium line-clamp-2 mt-0.5">
            {shippingAddress?.addressLine || 'Adres bilgisi'}
          </div>
          <div className="font-black text-[11px] text-slate-950 uppercase mt-0.5">
            {shippingAddress?.district} / {shippingAddress?.city} {shippingAddress?.postalCode ? `(${shippingAddress.postalCode})` : ''}
          </div>
        </div>

        <div className="pt-1 flex items-center justify-between text-[9px] text-slate-500 font-medium">
          <div>
            <strong>Gönderici:</strong> Bursa Kumaş Dünyası (Yıldırım / BURSA)
          </div>
          {totalMeters > 0 && (
            <div className="bg-slate-100 font-bold text-slate-900 px-1.5 py-0.5 rounded border border-slate-300">
              {totalMeters} m
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
