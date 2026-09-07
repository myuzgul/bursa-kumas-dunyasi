import { dbRepo } from '../db/repo';

export interface DashboardStats {
  todaySales: number;
  yesterdaySales: number;
  thisWeekSales: number;
  thisMonthSales: number;
  thisYearSales: number;
  totalOrdersCount: number;
  pendingOrdersCount: number;
  preparingOrdersCount: number;
  shippedOrdersCount: number;
  completedOrdersCount: number;
  totalMetersSold: number;
  averageOrderValue: number;
}

export interface FabricSalesReportItem {
  productId: string;
  sku: string;
  name: string;
  categoryName: string;
  totalMetersSold: number;
  orderCount: number;
  averageUnitPrice: number;
  totalRevenue: number;
  mainImage: string;
}

export function getDashboardStats(): DashboardStats {
  const db = dbRepo.read();
  const orders = db.orders || [];
  const orderItems = db.order_items || [];

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 24 * 3600 * 1000;
  const weekStart = todayStart - 7 * 24 * 3600 * 1000;
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const yearStart = new Date(now.getFullYear(), 0, 1).getTime();

  let todaySales = 0;
  let yesterdaySales = 0;
  let thisWeekSales = 0;
  let thisMonthSales = 0;
  let thisYearSales = 0;
  let totalRevenue = 0;

  let pendingCount = 0;
  let preparingCount = 0;
  let shippedCount = 0;
  let completedCount = 0;

  for (const o of orders) {
    if (o.payment_status === 'paid' || o.payment_status === 'success') {
      const oTime = new Date(o.created_at).getTime();
      const amount = Number(o.grand_total || 0);

      totalRevenue += amount;
      if (oTime >= todayStart) todaySales += amount;
      if (oTime >= yesterdayStart && oTime < todayStart) yesterdaySales += amount;
      if (oTime >= weekStart) thisWeekSales += amount;
      if (oTime >= monthStart) thisMonthSales += amount;
      if (oTime >= yearStart) thisYearSales += amount;
    }

    if (o.status === 'Siparis_Alindi' || o.status === 'Odeme_Onaylandi') pendingCount++;
    if (o.status === 'Hazirlaniyor' || o.status === 'Cikti_Alindi') preparingCount++;
    if (o.status === 'Kargoya_Verildi') shippedCount++;
    if (o.status === 'Teslim_Edildi') completedCount++;
  }

  let totalMeters = 0;
  for (const item of orderItems) {
    totalMeters += Number(item.meter_quantity || 0);
  }

  const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

  return {
    todaySales: Number(todaySales.toFixed(2)),
    yesterdaySales: Number(yesterdaySales.toFixed(2)),
    thisWeekSales: Number(thisWeekSales.toFixed(2)),
    thisMonthSales: Number(thisMonthSales.toFixed(2)),
    thisYearSales: Number(thisYearSales.toFixed(2)),
    totalOrdersCount: orders.length,
    pendingOrdersCount: pendingCount,
    preparingOrdersCount: preparingCount,
    shippedOrdersCount: shippedCount,
    completedOrdersCount: completedCount,
    totalMetersSold: Number(totalMeters.toFixed(2)),
    averageOrderValue: Number(averageOrderValue.toFixed(2)),
  };
}

export function getFabricSalesReport(startDate?: string, endDate?: string): FabricSalesReportItem[] {
  const db = dbRepo.read();
  const products = db.products || [];
  const categories = db.categories || [];
  const orderItems = db.order_items || [];
  const orders = db.orders || [];

  // Filter valid paid orders in date range
  const validOrderIds = new Set<string>();
  for (const o of orders) {
    if (o.payment_status === 'paid' || o.payment_status === 'success') {
      const oDate = new Date(o.created_at).getTime();
      let matches = true;
      if (startDate && oDate < new Date(startDate).getTime()) matches = false;
      if (endDate && oDate > new Date(endDate).getTime() + 24 * 3600 * 1000) matches = false;
      if (matches) validOrderIds.add(o.id);
    }
  }

  const productMap: Record<string, FabricSalesReportItem> = {};

  for (const p of products) {
    const cat = categories.find((c: any) => c.id === p.category_id);
    productMap[p.id] = {
      productId: p.id,
      sku: p.sku,
      name: p.name,
      categoryName: cat ? cat.name : 'Genel',
      totalMetersSold: 0,
      orderCount: 0,
      averageUnitPrice: p.discount_price || p.base_price,
      totalRevenue: 0,
      mainImage: p.main_image_url,
    };
  }

  for (const item of orderItems) {
    if (validOrderIds.has(item.order_id) && productMap[item.product_id]) {
      const entry = productMap[item.product_id];
      entry.totalMetersSold += Number(item.meter_quantity || 0);
      entry.orderCount += 1;
      entry.totalRevenue += Number(item.total_price || 0);
    }
  }

  return Object.values(productMap)
    .map((item) => ({
      ...item,
      totalMetersSold: Number(item.totalMetersSold.toFixed(2)),
      totalRevenue: Number(item.totalRevenue.toFixed(2)),
    }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue);
}
