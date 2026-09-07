/**
 * Metre Bazlı Kumaş Satış ve Fiyatlandırma Motoru
 * Bursa Kumaş Dünyası (bursakumasdunyasi.com)
 */

export interface MeterCalculation {
  meter: number;
  unitPrice: number;
  subtotal: number;
  taxAmount: number;
  grandTotal: number;
  formattedSubtotal: string;
  formattedGrandTotal: string;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function validateMeterQuantity(
  meter: number,
  minMeter: number = 1.0,
  stepMeter: number = 0.5,
  maxMeter: number = 100.0
): { valid: boolean; normalizedMeter: number; message?: string } {
  if (isNaN(meter) || meter <= 0) {
    return { valid: false, normalizedMeter: minMeter, message: `Geçersiz metre miktarı.` };
  }

  // Round to nearest step
  const steps = Math.round(meter / stepMeter);
  let normalized = Math.max(minMeter, steps * stepMeter);
  normalized = Math.min(maxMeter, normalized);
  normalized = Number(normalized.toFixed(2));

  if (meter < minMeter) {
    return {
      valid: false,
      normalizedMeter: minMeter,
      message: `Minimum sipariş miktarı ${minMeter} metredir.`,
    };
  }

  if (meter > maxMeter) {
    return {
      valid: false,
      normalizedMeter: maxMeter,
      message: `Maksimum sipariş miktarı ${maxMeter} metredir.`,
    };
  }

  return { valid: true, normalizedMeter: normalized };
}

export function calculateMeterPrice(
  meter: number,
  unitPrice: number,
  taxRate: number = 20
): MeterCalculation {
  const subtotal = Number((meter * unitPrice).toFixed(2));
  const taxAmount = Number(((subtotal * taxRate) / (100 + taxRate)).toFixed(2));
  const grandTotal = subtotal;

  return {
    meter,
    unitPrice,
    subtotal,
    taxAmount,
    grandTotal,
    formattedSubtotal: formatCurrency(subtotal),
    formattedGrandTotal: formatCurrency(grandTotal),
  };
}
