import { test, expect, type Page } from '@playwright/test';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
if (process.env.FIREBASE_AUTH_EMULATOR_HOST !== '127.0.0.1:9099' || process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8080') throw new Error('Local emulators required.');
const app = initializeApp({ projectId: 'demo-fina-pyme' }, 'report-tests'), auth = getAuth(app), db = getFirestore(app);
const companyId = 'reports-company', now = new Date(), month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`, date = `${month}-02`;
test.beforeAll(async () => {
  const email = 'reports@sin-buzon.sv', identity = await auth.getUserByEmail(email).catch(() => auth.createUser({ email, password: 'testPassword123' }));
  await db.doc(`users/${identity.uid}`).set({ id: identity.uid, email, name: 'Gerente Reportes', role: 'gerente', companyId, isConfigured: true, systemArchetype: 'negocio_transicion' });
  await db.doc(`companies/${companyId}`).set({ id: companyId, name: 'Negocio Reportes', tradeName: 'Negocio Reportes', nit: '06141234561234', nrc: '1234567', regimeType: 'general_tributario', systemArchetype: 'negocio_transicion', currency: 'USD', isConfigured: true, primaryAdminUserId: identity.uid, fiscalYear: now.getFullYear(), phone: '', address: '', email, giro: '', department: '', isGranContribuyente: false });
  await db.doc('bank_accounts/reports-cash').set({ id: 'reports-cash', companyId, accountName: 'Caja', bankName: '', accountNumber: '', accountType: 'efectivo', accountingCode: '1101-01', initialBalance: 0, currentBalance: 113, currency: 'USD' });
  await db.doc('invoices/reports-sale').set({ id: 'reports-sale', companyId, type: 'factura_consumidor_final', correlativeNumber: '123', date, dueDate: date, customerId: 'report-customer', customerName: 'Cliente de prueba', customerNit: '', customerNrc: '', items: [], sumasGravadas: 100, sumasExentas: 0, sumasNoSujetas: 0, iva13: 13, ivaRetenido1: 0, ivaPercibido1: 0, totalPagar: 113, saldoPendiente: 0, status: 'pagada', paymentCondition: 'contado', accountingEntryId: 'reports-journal', createdAt: date, taxReporting: { documentClass: '1', resolution: '123456', series: 'A', operationType: '1', incomeType: '3' } });
  await db.doc('journal_entries/reports-journal').set({ id: 'reports-journal', companyId, entryNumber: 1, date, concept: 'Venta real de prueba', sourceModule: 'ventas', status: 'asentada', totalDebit: 113, totalCredit: 113, isBalanced: true, createdAt: date, lines: [{ accountCode: '1101-01', accountName: 'Caja', debit: 113, credit: 0, concept: '' }, { accountCode: '6101', accountName: 'Ventas', debit: 0, credit: 100, concept: '' }, { accountCode: '2107-01', accountName: 'IVA débito', debit: 0, credit: 13, concept: '' }] });
});
async function login(page: Page) {
  await page.goto('/'); await page.locator('#login-email-input').fill('reports@sin-buzon.sv'); await page.locator('#login-password-input').fill('testPassword123'); await page.locator('#login-submit-btn').click();
  await expect(page.getByRole('button', { name: /Contabilidad NIIF/ })).toBeVisible();
}
test('financial chart continues to show real bars after switching through every renderer', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message)); await login(page);
  const chart = page.getByTestId('financial-evolution'); await expect(chart).toBeVisible();
  await expect(chart.locator('.recharts-bar-rectangle path')).not.toHaveCount(0);
  for (const name of ['Líneas', 'Área', 'Barras', 'Área', 'Barras']) { await page.getByRole('button', { name, exact: true }).click(); await expect(chart.getByRole('application')).toBeVisible(); }
  const bars = chart.locator('.recharts-bar-rectangle path'); await expect(bars).not.toHaveCount(0); expect(await bars.first().getAttribute('d')).toBeTruthy(); expect(errors).toEqual([]);
});
test('accounting uses date filters, prints cash flow and downloads the actual consumer F07 file', async ({ page }) => {
  await login(page); await page.getByRole('button', { name: /Contabilidad NIIF/ }).click();
  await page.getByRole('button', { name: 'Libro diario', exact: true }).click(); await expect(page.getByRole('cell', { name: 'Venta real de prueba', exact: true }).first()).toBeVisible();
  await page.getByLabel('Desde', { exact: true }).fill(`${month}-03`); await expect(page.getByRole('cell', { name: 'Venta real de prueba', exact: true })).toHaveCount(0);
  await page.getByLabel('Desde', { exact: true }).fill(`${month}-01`); await page.getByRole('button', { name: 'Flujo de efectivo', exact: true }).click();
  const popupPromise = page.waitForEvent('popup'); await page.getByRole('button', { name: 'Imprimir flujo con detalle', exact: true }).click(); const popup = await popupPromise; await expect(popup.getByRole('heading', { name: 'Estado de flujo de efectivo' })).toBeVisible(); await expect(popup.getByText('Venta real de prueba', { exact: true })).toBeVisible(); await popup.close();
  await page.getByRole('button', { name: 'Libros de IVA', exact: true }).click(); await page.getByLabel('Libro de IVA', { exact: true }).selectOption('consumers');
  const downloadPromise = page.waitForEvent('download'); await page.getByRole('button', { name: 'CSV para Hacienda', exact: true }).click(); const download = await downloadPromise; expect(download.suggestedFilename()).toBe(`F07-A2-${month}.csv`);
  const stream = await download.createReadStream(); let csv = ''; for await (const chunk of stream!) csv += chunk.toString(); expect(csv.split(';')).toHaveLength(23); expect(csv.split(';')[13]).toBe('113.00');
  const reportPromise = page.waitForEvent('download'); await page.getByRole('button', { name: 'Resumen integral', exact: true }).click(); expect((await reportPromise).suggestedFilename()).toMatch(/^resumen-contable-.*\.html$/);
});
test('forecasting shows no fabricated history and allows an explicit downloadable scenario', async ({ page }) => {
  await login(page); await page.getByRole('button', { name: /Pronósticos & Proyecciones/ }).click();
  await expect(page.getByText('Todavía falta historial para pronosticar', { exact: true })).toBeVisible();
  await page.getByRole('checkbox').check(); await page.getByLabel('Ventas mensuales de partida sin IVA ($)', { exact: true }).fill('200');
  await page.getByLabel('Compras respecto a ventas (%)', { exact: true }).fill('50'); await page.getByLabel('Gastos mensuales pagados ($)', { exact: true }).fill('10');
  await expect(page.getByRole('heading', { name: 'Escenario manual', exact: true })).toBeVisible();
  const downloadPromise = page.waitForEvent('download'); await page.getByRole('button', { name: 'Excel (CSV)', exact: true }).click(); expect((await downloadPromise).suggestedFilename()).toMatch(/^proyeccion-.*\.csv$/);
});

test('header shortcuts open the sale and purchase forms from the dashboard', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await login(page);
  const search = await page.locator('#global-search-btn').boundingBox();
  const actions = await page.locator('.header-desktop-actions').boundingBox();
  expect(search!.x + search!.width).toBeLessThanOrEqual(actions!.x);
  await page.screenshot({ path: '.tools/previews/dashboard.png' });
  await page.locator('#quick-new-sale-btn').click();
  await expect(page.getByRole('heading', { name: /Nueva Venta|Emisión de Documento/ })).toBeVisible();
  await page.screenshot({ path: '.tools/previews/formulario-venta.png' });
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await page.locator('#nav-dashboard').click();
  await page.locator('#quick-new-purchase-btn').click();
  await expect(page.getByText('Registro de Compra / Gasto con Validación Fiscal SV', { exact: true })).toBeVisible();
});

test('desktop sidebar collapses persistently and the POS checkout fits a laptop at normal zoom', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await login(page);
  await page.locator('#desktop-sidebar-toggle').click();
  await expect(page.locator('#erp-sidebar')).toHaveClass(/sidebar-collapsed/);
  await page.reload();
  await expect(page.locator('#erp-sidebar')).toHaveClass(/sidebar-collapsed/);
  await page.locator('#nav-pos_terminal').click();
  await expect(page.locator('#pos-checkout-btn')).toBeVisible();
  const checkout = await page.locator('#pos-checkout-btn').boundingBox();
  expect(checkout!.y + checkout!.height).toBeLessThanOrEqual(768);
  const workspace = await page.getByTestId('pos-workspace').boundingBox();
  await page.screenshot({ path: '.tools/previews/pos-laptop.png' });
  expect(workspace!.width).toBeGreaterThan(1200);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1366);
  await page.locator('#desktop-sidebar-toggle').click();
  await expect(page.locator('#erp-sidebar')).not.toHaveClass(/sidebar-collapsed/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1366);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('#pos-checkout-btn')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test('assistant explains missing Gemini configuration instead of a generic server error', async ({ page }) => {
  await login(page);
  await page.locator('#floating-erp-assistant-btn').click();
  const input = page.getByPlaceholder(/^Escribe tu instrucción/);
  await input.fill('Hola');
  const request = page.waitForResponse(response => response.url().endsWith('/api/ai/copilot'));
  await input.press('Enter');
  const response = await request;
  expect(response.status()).toBe(503);
  expect((await response.json()).code).toBe('AI_NOT_CONFIGURED');
  await expect(page.getByText(/El asistente necesita una clave de Gemini configurada/)).toBeVisible();
});
