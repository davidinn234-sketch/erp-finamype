import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildAccountingReports, csvText, reportHtml } from '../src/lib/accountingReports';
import { prepareVatExport, haciendaCsv } from '../src/lib/vatExports';
import { forecastHistory, projectForecast } from '../src/lib/forecastReports';
import { emptyChart } from '../src/lib/chartDefaults';
import { marketingChannels, marketingSaleAmount } from '../src/lib/marketingReports';
import { DEFAULT_CHART_OF_ACCOUNTS } from '../src/utils/catalogData';
import { generateSaleAccountingEntry, generatePurchaseAccountingEntry, generatePayrollAccountingEntry } from '../src/utils/accountingEngine';
import { SAMPLE_PAYROLLS } from '../src/utils/sampleData';
import type { AccountNode, Invoice, JournalEntry, Purchase } from '../src/types';
const account = (code: string, category: AccountNode['category'], opening = 0): AccountNode => ({ code, name: code, category, level: 3, isMovement: true, debitBalance: opening > 0 ? opening : 0, creditBalance: opening < 0 ? -opening : 0, balance: opening });
const accounts = [account('1101-01', 'activo', 100), account('1101-02', 'activo'), account('1103-01', 'activo'), account('1201', 'activo'), account('2201', 'pasivo'), account('2102', 'pasivo'), account('2103', 'pasivo'), account('3101', 'patrimonio', -100), account('4101', 'ingresos'), account('5101', 'gastos')];
const entry = (id: string, date: string, debit: string, credit: string, value: number): JournalEntry => ({ id, companyId: 'test', entryNumber: Number(id) || 1, date, concept: id, lines: [{ accountCode: debit, accountName: debit, debit: value, credit: 0, concept: '' }, { accountCode: credit, accountName: credit, debit: 0, credit: value, concept: '' }], totalDebit: value, totalCredit: value, isBalanced: true, sourceModule: 'manual', status: 'asentada', createdAt: '' });
test('marketing starts at zero and attributes only recorded sales without inventing advertising costs', () => {
  const empty = marketingChannels([], []);
  assert.equal(empty.reduce((sum, channel) => sum + channel.sales + channel.spend + channel.orders, 0), 0);
  const sale = { id: 'sale', customerId: 'known', status: 'pagada', type: 'factura_consumidor_final', sumasGravadas: 100, totalPagar: 113 } as Invoice;
  const credit = { ...sale, id: 'credit', type: 'nota_credito', sumasGravadas: 20 } as Invoice;
  const channels = marketingChannels([sale, credit, { ...sale, id: 'void', status: 'anulada' }, { ...sale, id: 'unknown', customerId: 'unknown' }], [{ id: 'known', acquisitionChannel: 'whatsapp' } as import('../src/types').Customer]);
  assert.equal(channels.find(channel => channel.id === 'whatsapp')?.sales, 80);
  assert.equal(channels.find(channel => channel.id === 'sin_canal')?.sales, 100);
  assert.equal(channels.reduce((sum, channel) => sum + channel.orders, 0), 2);
  assert.ok(channels.every(channel => channel.spend === 0 && channel.roas === 0 && channel.leads === 0));
  assert.equal(marketingSaleAmount(credit), -20);
});
test('credit sales, collections, unpaid payroll and internal transfers have distinct effects', () => {
  const entries = [entry('1', '2026-09-15', '1103-01', '4101', 100), entry('2', '2026-10-01', '1101-01', '1103-01', 40), entry('3', '2026-10-02', '1101-02', '1101-01', 20), entry('4', '2026-10-03', '5101', '2102', 30), entry('5', '2026-10-04', '1101-02', '2201', 100), entry('6', '2026-10-05', '1201', '1101-02', 50), entry('7', '2026-10-06', '1101-01', '4101', 100), { ...entry('8', '2026-10-07', '1101-01', '4101', 999), status: 'borrador' as const }];
  const report = buildAccountingReports(accounts, entries, [], '2026-10-01', '2026-10-31');
  assert.equal(report.revenue, 100); assert.equal(report.profit, 70); assert.equal(report.openingCash, 100); assert.equal(report.closingCash, 290);
  assert.deepEqual(report.cashTotals, { operacion: 140, inversion: -50, financiacion: 100, revisar: 0 });
  assert.equal(report.cashMovements.length, 4); assert.equal(report.rows.find(row => row.code === '1103-01')?.naturalClosing, 60); assert.equal(report.balanceDifference, 0);
});
test('movement codes are matched exactly and incomplete entries are flagged', () => {
  const report = buildAccountingReports([...accounts, account('1101', 'activo')], [entry('1', '2026-10-01', '1101-01', 'unknown', 1.01)], [], '2026-10-01', '2026-10-31');
  assert.equal(report.rows.find(row => row.code === '1101')?.debit, 0);
  assert.equal(report.rows.find(row => row.code === '1101-01')?.debit, 1.01); assert.ok(report.issues.some(issue => issue.includes('unknown')));
});
const invoice = (overrides: Partial<Invoice> = {}): Invoice => ({ id: 'sale', companyId: 'test', type: 'credito_fiscal', correlativeNumber: '123', date: '2026-10-02', customerId: 'customer', customerName: 'Cliente', customerNit: '06141234561234', customerNrc: '', sumasGravadas: 100, sumasExentas: 0, sumasNoSujetas: 0, iva13: 13, ivaRetenido1: 1, ivaPercibido1: 0, totalPagar: 112, saldoPendiente: 112, status: 'pendiente', taxReporting: { documentClass: '1', resolution: '123456', series: 'A', operationType: '1', incomeType: '3' }, ...overrides } as Invoice);
const purchase = (overrides: Partial<Purchase> = {}): Purchase => ({ id: 'buy', companyId: 'test', docType: 'ccf_compra', documentNumber: '123', date: '2026-10-02', supplierId: 'supplier', supplierName: 'Proveedor', supplierNit: '06141234561234', supplierNrc: '', comprasGravadas: 100, comprasExentas: 0, comprasSujetoExcluido: 0, ivaCreditoFiscal: 13, totalPagar: 112, saldoPendiente: 112, status: 'pendiente', taxReporting: { documentClass: '1', operationType: '1', classification: '1', sector: '2', costType: '5' }, ...overrides } as Purchase);
test('F07 contributor file has 20 fields, no header, net base and gross before retention', () => {
  const result = prepareVatExport('contributors', [invoice(), invoice({ id: 'void', status: 'anulada' })], [], '2026-10');
  assert.deepEqual(result.issues, []); assert.equal(result.rows.length, 1); assert.equal(result.rows[0].length, 20); assert.equal(result.rows[0][11], '100.00'); assert.equal(result.rows[0][12], '13.00'); assert.equal(result.rows[0][15], '113.00');
  const csv = haciendaCsv(result); assert.ok(csv.startsWith('02/10/2026;1;03;')); assert.ok(!csv.startsWith('\uFEFF')); assert.equal(csv.split(';').length, 20);
});
test('consumer file has 23 fields and taxable consumer sales include VAT', () => {
  const result = prepareVatExport('consumers', [invoice({ type: 'factura_consumidor_final' })], [], '2026-10');
  assert.deepEqual(result.issues, []); assert.equal(result.rows[0].length, 23); assert.equal(result.rows[0][13], '113.00'); assert.equal(result.rows[0][22], '2');
});
test('DTE consumer documents group daily; fake and missing reception seals block export', () => {
  const metadata = { documentClass: '4' as const, receiptSeal: 'A'.repeat(40), operationType: '1', incomeType: '3' };
  const first = invoice({ type: 'factura_consumidor_final', controlNumber: 'DTE-01-12345678-000000000000001', dteCode: '00000000-0000-0000-0000-000000000001', taxReporting: metadata });
  const last = invoice({ ...first, id: 'last', correlativeNumber: '124', controlNumber: 'DTE-01-12345678-000000000000002', dteCode: '00000000-0000-0000-0000-000000000002' });
  const result = prepareVatExport('consumers', [first, last], [], '2026-10'); assert.deepEqual(result.issues, []); assert.equal(result.rows.length, 1); assert.equal(result.rows[0][13], '226.00'); assert.equal(result.rows[0][7], first.dteCode); assert.equal(result.rows[0][8], last.dteCode);
  const missing = prepareVatExport('consumers', [invoice({ ...first, taxReporting: { ...metadata, receiptSeal: '' } })], [], '2026-10'); assert.throws(() => haciendaCsv(missing));
});
test('purchases export 21 columns and reject incompatible classifications and unsupported annexes', () => {
  const result = prepareVatExport('purchases', [], [purchase()], '2026-10'); assert.deepEqual(result.issues, []); assert.equal(result.rows[0].length, 21); assert.equal(result.rows[0][14], '113.00');
  assert.throws(() => haciendaCsv(prepareVatExport('purchases', [], [purchase({ docType: 'factura_sujeto_excluido' })], '2026-10')));
  assert.throws(() => haciendaCsv(prepareVatExport('purchases', [], [purchase({ taxReporting: { ...purchase().taxReporting, classification: '2' } })], '2026-10')));
});
test('bad dates, delimiters and duplicate fiscal numbers prevent ready-to-file downloads', () => {
  for (const docs of [[invoice({ date: '2026-10-32' })], [invoice({ customerName: 'Cliente;alterado' })], [invoice(), invoice({ id: 'duplicate' })]]) assert.throws(() => haciendaCsv(prepareVatExport('contributors', docs, [], '2026-10')));
});
test('downloaded spreadsheet and printable reports escape executable customer content', () => {
  assert.equal(csvText([['=cmd()', -3, 'A,"B']]), '\uFEFF"\'=cmd()","-3","A,""B"');
  const html = reportHtml('<script>empresa</script>', 'NIT', '2026', [{ title: 'Reporte', headers: ['Cuenta'], rows: [['<img src=x onerror=alert(1)>']] }]); assert.ok(!html.includes('<script>')); assert.ok(html.includes('&lt;img'));
});
test('forecasts require real history, count zero months and preserve cash arithmetic', () => {
  const now = new Date(2026, 9, 7), history = forecastHistory([invoice({ date: '2026-06-01', sumasGravadas: 100 }), invoice({ id: 'jul', date: '2026-07-01', sumasGravadas: 200 }), invoice({ id: 'aug', date: '2026-08-01', sumasGravadas: 400 })], [], now);
  const settings = { months: 3, growth: 0, purchaseRatio: 50, collection: 50, supplierPayment: 100, expense: 10, opening: 100 };
  assert.deepEqual(projectForecast(forecastHistory([], [], now), settings, now), []);
  const rows = projectForecast(history, settings, now); assert.equal(rows[0].month, '2026-11'); assert.equal(rows[0].sales, 200); assert.equal(rows[0].net, -10); assert.equal(rows[2].closing, 70);
  assert.equal(projectForecast([], { ...settings, manualSales: 0 }, now)[0].sales, 0);
  assert.throws(() => projectForecast(history, { ...settings, growth: Infinity }, now));
});
test('automatic sales, service purchases and payroll use the actual catalog categories', () => {
  const chart = emptyChart(DEFAULT_CHART_OF_ACCOUNTS);
  const sale = generateSaleAccountingEntry(invoice({ items: [], paymentCondition: 'credito_30' }), 1);
  const service = generatePurchaseAccountingEntry(purchase({ isServicesPurchase: true, retencionRenta10: 0, retencionIva1: 1, percepcionIva1: 0 }), 2);
  const payroll = generatePayrollAccountingEntry(SAMPLE_PAYROLLS[0], 3);
  for (const entry of [sale, service, payroll]) for (const line of entry.lines) assert.ok(chart.some(account => account.isMovement && account.code === line.accountCode), `Missing ${line.accountCode}`);
  const report = buildAccountingReports(chart, [sale, service], [], '2026-10-01', '2026-10-31'); assert.equal(report.revenue, 100); assert.equal(report.expenses, 100); assert.equal(report.profit, 0);
  const legacy = { ...sale, lines: sale.lines.map(line => line.accountCode === '6101' ? { ...line, accountCode: '5101' } : line) };
  assert.equal(buildAccountingReports(chart, [legacy], [], '2026-10-01', '2026-10-31').revenue, 100); assert.equal(legacy.lines.find(line => line.accountCode === '5101')?.credit, 100);
});
test('closing entries do not erase the reported profit or duplicate it in equity', () => {
  const sale = entry('1', '2026-10-01', '1101-01', '4101', 50);
  const close = { ...entry('2', '2026-10-31', '4101', '3101', 50), sourceModule: 'cierre' as const };
  const report = buildAccountingReports(accounts, [sale, close], [], '2026-10-01', '2026-10-31');
  assert.equal(report.profit, 50); assert.equal(report.cumulativeProfit, 0); assert.equal(report.equity, 150); assert.equal(report.balanceDifference, 0);
});
