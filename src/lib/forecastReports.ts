import type { Invoice, Purchase } from '../types';
import { money } from './accountingReports';
const monthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
export function forecastHistory(invoices: Invoice[], purchases: Purchase[], now = new Date()) {
  return Array.from({ length: 12 }, (_, index) => {
    const month = monthKey(new Date(now.getFullYear(), now.getMonth() - 12 + index, 1));
    const sales = invoices.filter(doc => doc.status !== 'anulada' && doc.date.startsWith(month));
    const buys = purchases.filter(doc => doc.status !== 'anulada' && doc.date.startsWith(month));
    return { month, sales: money(sales.reduce((sum, doc) => sum + (doc.type === 'nota_credito' ? -1 : 1) * (doc.sumasGravadas + doc.sumasExentas + doc.sumasNoSujetas), 0)), purchases: money(buys.reduce((sum, doc) => sum + (doc.docType === 'nota_credito_compra' ? -1 : 1) * (doc.comprasGravadas + doc.comprasExentas + doc.comprasSujetoExcluido), 0)), recorded: sales.length + buys.length > 0 };
  });
}
export interface ForecastSettings { months: number; growth: number; purchaseRatio: number; collection: number; supplierPayment: number; expense: number; opening: number; manualSales?: number }
export function projectForecast(history: ReturnType<typeof forecastHistory>, settings: ForecastSettings, now = new Date()) {
  const count = history.filter(month => month.recorded).length;
  if (settings.manualSales === undefined && count < 3) return [];
  if (Object.values(settings).some(value => value !== undefined && !Number.isFinite(value))) throw new Error('Revisa los valores de la proyección.');
  if (!Number.isInteger(settings.months) || settings.months < 1 || settings.months > 24 || settings.growth < -100 || settings.growth > 100 || settings.collection < 0 || settings.collection > 100 || settings.supplierPayment < 0 || settings.supplierPayment > 100 || settings.purchaseRatio < 0 || settings.purchaseRatio > 1000 || settings.expense < 0 || (settings.manualSales ?? 0) < 0) throw new Error('Los importes y porcentajes no son válidos.');
  const latest = history.filter(month => month.recorded).at(0)?.month;
  const continuous = latest ? history.filter(month => month.month >= latest) : history;
  const recent = continuous.slice(-3);
  const baseline = settings.manualSales ?? Math.max(0, recent.reduce((sum, month) => sum + month.sales, 0) / Math.max(1, recent.length));
  let cash = money(settings.opening);
  return Array.from({ length: settings.months }, (_, index) => {
    const month = monthKey(new Date(now.getFullYear(), now.getMonth() + index + 1, 1));
    const sales = money(baseline * Math.pow(1 + settings.growth / 100, index + 1));
    const purchases = money(sales * settings.purchaseRatio / 100);
    const inflow = money(sales * settings.collection / 100), outflow = money(purchases * settings.supplierPayment / 100 + settings.expense);
    const net = money(inflow - outflow), opening = cash; cash = money(cash + net);
    return { month, sales, purchases, inflow, outflow, expense: settings.expense, net, opening, closing: cash };
  });
}
