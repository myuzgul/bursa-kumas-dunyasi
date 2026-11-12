/**
 * Sipariş kaydındaki ödeme yöntemi kodunu (bacs, cod, paytr_payment_gateway vb.)
 * sipariş fişinde gösterilecek okunur Türkçe etikete çevirir.
 */
export function getPaymentMethodLabel(method?: string | null): string {
  const key = String(method || '').trim().toLowerCase();

  if (!key) return 'Kredi Kartı';

  switch (key) {
    case 'bacs':
    case 'bank_transfer':
    case 'havale':
    case 'eft':
      return 'Havale/EFT';

    case 'paytr':
    case 'paytr_payment_gateway':
    case 'credit_card':
    case 'kredi_karti':
      return 'Kredi Kartı';

    case 'cod':
    case 'cash_on_delivery':
      return 'Kapıda Ödeme';

    case 'card_on_delivery':
      return 'Kapıda Ödeme (Kredi Kartı)';

    default:
      return String(method);
  }
}
