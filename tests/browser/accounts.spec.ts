import { test, expect } from '@playwright/test';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

if (process.env.FIREBASE_AUTH_EMULATOR_HOST !== '127.0.0.1:9099' || process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8080') throw new Error('These tests run only against local Firebase emulators.');
const app = initializeApp({ projectId: 'demo-fina-pyme' }, 'browser-tests');
const auth = getAuth(app), database = getFirestore(app);
let aliceId: string;
const accessIds: Record<string, string> = {};
test.beforeAll(async () => {
  // A migrated/incomplete company must not crash the entire master directory.
  await database.doc('companies/incomplete-browser-company').set({ id: 'incomplete-browser-company', primaryAdminUserId: 'unknown' });
  for (const email of ['alice-browser@example.com', 'bob-browser@example.com']) {
    const identity = await auth.getUserByEmail(email).catch(() => auth.createUser({ email, password: 'testPassword123' }));
    await database.doc(`users/${identity.uid}`).set({ id: identity.uid, name: email.startsWith('alice') ? 'Alice Prueba' : 'Bob Prueba', email, role: 'gerente', systemArchetype: 'finanzas_personales', isConfigured: true });
    if (email.startsWith('alice')) aliceId = identity.uid;
  }
  await database.doc('personal_finances/private-alice').set({ id: 'private-alice', userId: aliceId, type: 'ingreso', amount: 123, category: 'Salario', concept: 'Ingreso privado de Alice', date: new Date().toISOString().slice(0, 10), paymentMethod: 'efectivo' });
  await database.doc(`personal_finance_meta/${aliceId}`).set({ userId: aliceId, personalBudgets: [{ id: 'budget-alice', category: 'Presupuesto privado de Alice', budgetedAmount: 25 }], personalSavingGoals: [] });
  for (const [name, role, companyId] of [['master-access', 'gerente', ''], ['manager-access', 'gerente', 'access-company'], ['worker-access', 'cajero', 'access-company'], ['outside-access', 'cajero', 'other-company']]) {
    const email = name === 'master-access' ? 'davidinn234@gmail.com' : `${name}@sin-buzon.sv`;
    const identity = await auth.getUserByEmail(email).catch(error => {
      if (error.code !== 'auth/user-not-found') throw error;
      return auth.createUser({ email, password: 'testPassword123' });
    });
    await auth.updateUser(identity.uid, { password: 'testPassword123' });
    accessIds[name] = identity.uid;
    await database.doc(`users/${identity.uid}`).set({ id: identity.uid, email, name, role, ...(companyId ? { companyId } : {}), isConfigured: true });
    if (name === 'master-access') await auth.setCustomUserClaims(identity.uid, { platformAdmin: true });
  }
  await database.doc('companies/access-company').set({ id: 'access-company', name: 'Empresa de accesos', tradeName: 'Empresa de accesos', primaryAdminUserId: accessIds['manager-access'], systemArchetype: 'emprendedor_control_interno', fiscalYear: new Date().getFullYear(), currency: 'USD' });
  for (const [name, permissions] of [['only-pos', ['pos_sales']], ['only-crm', ['sales_crm']], ['false-master', ['sales_crm']]] as const) {
    const identity = await auth.getUserByEmail(`${name}@sin-buzon.sv`).catch(() => auth.createUser({ email: `${name}@sin-buzon.sv`, password: 'testPassword123' }));
    await database.doc(`users/${identity.uid}`).set({ id: identity.uid, email: identity.email, name, role: 'cajero', companyId: 'access-company', permissions: [...permissions], systemArchetype: 'emprendedor_control_interno', isConfigured: true });
    if (name === 'false-master') await auth.setCustomUserClaims(identity.uid, { platformAdmin: true });
  }
  await auth.getUserByEmail('missing-profile@sin-buzon.sv').catch(() => auth.createUser({ email: 'missing-profile@sin-buzon.sv', password: 'testPassword123' }));
});
async function login(page: import('@playwright/test').Page, email: string) {
  await page.locator('#login-email-input').fill(email);
  await page.locator('#login-password-input').fill('testPassword123');
  await page.locator('#login-submit-btn').click();
  await expect(page.locator('#personal-portal-logout-btn')).toBeVisible();
}

test('logout and login on the same browser do not carry private data to another account', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await login(page, 'alice-browser@example.com');
  await page.getByRole('button', { name: 'Movimientos & Registro' }).click();
  await expect(page.getByText('Ingreso privado de Alice', { exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Movimientos & Registro' }).click();
  await expect(page.getByText('Ingreso privado de Alice', { exact: true })).toBeVisible();
  await page.locator('#personal-portal-logout-btn').click();
  await login(page, 'bob-browser@example.com');
  await page.getByRole('button', { name: 'Movimientos & Registro' }).click();
  await expect(page.getByText('Ingreso privado de Alice', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Presupuestos Mensuales' }).click();
  await expect(page.getByText('Presupuesto privado de Alice', { exact: true })).toHaveCount(0);
  await page.reload();
  await expect(page.locator('#personal-portal-logout-btn')).toBeVisible();
  await expect(page.getByText('Ingreso privado de Alice', { exact: true })).toHaveCount(0);
  const cached = await page.evaluate(() => localStorage.getItem('sivarflow_sv_erp_state_v3'));
  expect(cached).toBeNull();
  expect(errors).toEqual([]);
});
test('AI API rejects anonymous requests without fabricating an operation', async ({ request }) => {
  const response = await request.post('/api/ai/copilot', { data: { prompt: 'Registrar venta por $150' } });
  expect(response.status()).toBe(401);
  const data = await response.json();
  expect(data.actionType).toBeUndefined();
});

test('public personal registration creates a private empty account without storing passwords', async ({ page }) => {
  const email = `personal-${Date.now()}@sin-buzon.sv`;
  await page.goto('/');
  await page.getByRole('button', { name: 'Registrar Cuenta', exact: true }).click();
  await page.getByRole('button', { name: /^Finanzas Personales/ }).click();
  await page.locator('#register-name-input').fill('Nueva Persona');
  await page.locator('form input[type="email"]').fill(email);
  await page.locator('#register-password-input').fill('testPassword123');
  await page.getByRole('button', { name: 'Crear Mi Cuenta & Comenzar' }).click();
  await expect(page.locator('#personal-portal-logout-btn')).toBeVisible();
  const identity = await auth.getUserByEmail(email);
  const profile = (await database.doc(`users/${identity.uid}`).get()).data();
  expect(profile?.password).toBeUndefined();
  expect(profile?.companyId).toBeUndefined();
  expect((await database.collection('personal_finances').where('userId', '==', identity.uid).get()).size).toBe(0);
  await page.getByRole('button', { name: 'Movimientos & Registro' }).click();
  await expect(page.getByText('Ingreso privado de Alice', { exact: true })).toHaveCount(0);
});

test('public business registration creates a separate company and an empty cash account', async ({ page }) => {
  const email = `business-${Date.now()}@sin-buzon.sv`;
  await page.goto('/');
  await page.getByRole('button', { name: 'Registrar Cuenta', exact: true }).click();
  await page.locator('#register-business-input').fill('Negocio Prueba');
  await page.locator('#register-name-input').fill('Propietaria Prueba');
  await page.locator('form input[type="email"]').fill(email);
  await page.locator('#register-password-input').fill('testPassword123');
  await page.getByRole('button', { name: 'Crear Mi Cuenta & Comenzar' }).click();
  await expect(page.locator('#login-screen-wrapper')).toHaveCount(0);
  const identity = await auth.getUserByEmail(email);
  await expect.poll(async () => (await database.doc(`users/${identity.uid}`).get()).exists).toBe(true);
  const profile = (await database.doc(`users/${identity.uid}`).get()).data()!;
  expect(profile.password).toBeUndefined();
  expect(profile.role).toBe('gerente');
  expect(profile.registrationSource).toBe('self');
  expect(identity.customClaims?.platformAdmin).not.toBe(true);
  await expect(page.getByText('Portal de Administración Maestro', { exact: true })).toHaveCount(0);
  const company = (await database.doc(`companies/${profile.companyId}`).get()).data()!;
  expect(company.primaryAdminUserId).toBe(identity.uid);
  const cash = await database.collection('bank_accounts').where('companyId', '==', profile.companyId).get();
  expect(cash.size).toBe(1);
  expect(cash.docs[0].data().currentBalance).toBe(0);
  expect((await database.collection('products').where('companyId', '==', profile.companyId).get()).size).toBe(0);
  for (const name of ['invoices', 'purchases', 'payrolls', 'journal_entries']) expect((await database.collection(name).where('companyId', '==', profile.companyId).get()).size).toBe(0);
  await page.reload();
  await expect(page.locator('#nav-marketing')).toBeVisible();
  await page.locator('#nav-marketing').click();
  await expect(page.getByText('Sin registrar', { exact: true })).toHaveCount(3);
  await expect(page.getByText('$150.00', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Portal de Administración Maestro', { exact: true })).toHaveCount(0);
});

async function ownerLogin(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.locator('#login-email-input').fill('davidinn234@gmail.com');
  await page.locator('#login-password-input').fill('testPassword123');
  await page.locator('#login-submit-btn').click();
  await expect(page.getByText('Portal de Administración Maestro', { exact: true })).toBeVisible();
}

test('registering after owner logout cannot inherit the owner session or tenant', async ({ page }) => {
  await ownerLogin(page);
  await page.getByTitle('Cerrar Sesión', { exact: true }).click();
  await expect(page.locator('#login-email-input')).toBeVisible();
  const email = `after-owner-${Date.now()}@sin-buzon.sv`;
  await page.getByRole('button', { name: 'Registrar Cuenta', exact: true }).click();
  await page.locator('#register-business-input').fill('Empresa independiente');
  await page.locator('#register-name-input').fill('Gerente independiente');
  await page.locator('form input[type="email"]').fill(email);
  await page.locator('#register-password-input').fill('testPassword123');
  await page.getByRole('button', { name: 'Crear Mi Cuenta & Comenzar' }).click();
  await expect(page.locator('#nav-dashboard')).toBeVisible();
  await expect(page.getByText('Portal de Administración Maestro', { exact: true })).toHaveCount(0);
  const identity = await auth.getUserByEmail(email);
  expect(identity.customClaims?.platformAdmin).not.toBe(true);
  const profile = (await database.doc(`users/${identity.uid}`).get()).data()!;
  expect(profile.role).toBe('gerente');
  expect(profile.companyId).not.toBe('access-company');
  expect((await database.collection('invoices').where('companyId', '==', profile.companyId).get()).empty).toBe(true);
  await page.reload();
  await expect(page.locator('#nav-dashboard')).toBeVisible();
  await expect(page.getByText('Portal de Administración Maestro', { exact: true })).toHaveCount(0);
});

test('owner sees public registrations immediately and sees identities without granting a missing profile', async ({ page, browser }) => {
  await ownerLogin(page);
  await page.getByRole('button', { name: /^Usuarios \(/ }).click();
  await expect(page.getByRole('row').filter({ hasText: 'missing-profile@sin-buzon.sv' })).toContainText('Sin perfil');
  const context = await browser.newContext();
  const signup = await context.newPage();
  try {
    const email = `live-directory-${Date.now()}@sin-buzon.sv`;
    await signup.goto('/');
    await signup.getByRole('button', { name: 'Registrar Cuenta', exact: true }).click();
    await signup.getByRole('button', { name: /^Finanzas Personales/ }).click();
    await signup.locator('#register-name-input').fill('Registro visible');
    await signup.locator('form input[type="email"]').fill(email);
    await signup.locator('#register-password-input').fill('testPassword123');
    await signup.getByRole('button', { name: 'Crear Mi Cuenta & Comenzar' }).click();
    await expect(signup.locator('#personal-portal-logout-btn')).toBeVisible();
    await expect(page.getByRole('row').filter({ hasText: email })).toContainText('Registro público');
    await expect(page.getByText('Nueva cuenta registrada', { exact: true })).toBeVisible();
  } finally { await context.close(); }
});

for (const name of ['only-pos', 'only-crm', 'false-master']) test(`${name} only enters the assigned modules of its company`, async ({ page }) => {
  await page.goto('/');
  await page.locator('#login-email-input').fill(`${name}@sin-buzon.sv`);
  await page.locator('#login-password-input').fill('testPassword123');
  await page.locator('#login-submit-btn').click();
  await expect(page.getByRole('button', { name: name === 'only-pos' ? /Punto de Venta POS/ : /Ventas & Clientes/ })).toBeVisible();
  await expect(page.getByRole('button', { name: name === 'only-pos' ? /Ventas & Clientes/ : /Punto de Venta POS/ })).toHaveCount(0);
  for (const label of [/Dashboard Corporativo/, /Contabilidad NIIF/, /RRHH & Planilla/, /Gestión de Perfiles/]) await expect(page.getByRole('button', { name: label })).toHaveCount(0);
  await expect(page.getByText('Portal de Administración Maestro', { exact: true })).toHaveCount(0);
});

test('global Auth directory rejects company managers and forged owner claims', async ({ request }) => {
  expect((await request.get('/api/admin/users/directory')).status()).toBe(401);
  for (const email of ['manager-access@sin-buzon.sv', 'false-master@sin-buzon.sv']) {
    const token = await accessToken(request, email);
    expect((await request.get('/api/admin/users/directory', { headers: { Authorization: `Bearer ${token}` } })).status()).toBe(403);
  }
  const token = await accessToken(request, 'davidinn234@gmail.com');
  const response = await request.get('/api/admin/users/directory', { headers: { Authorization: `Bearer ${token}` } });
  expect(response.status()).toBe(200);
  const data = await response.json();
  expect(data.identities.some((identity: { email: string }) => identity.email === 'missing-profile@sin-buzon.sv')).toBe(true);
  for (const identity of data.identities) expect(Object.keys(identity).every(key => ['id', 'email', 'name', 'createdAt', 'disabled'].includes(key))).toBe(true);
});

test('owner creates an empty business while retaining the owner session', async ({ page }) => {
  await ownerLogin(page);
  await page.getByRole('button', { name: /Dar de Alta Nuevo Cliente/ }).click();
  const email = `owner-provision-${Date.now()}@sin-buzon.sv`;
  await page.getByPlaceholder(/Librería & Variedades/).fill('Empresa creada por David');
  await page.getByPlaceholder('Ej: Mauricio Quintanilla').fill('Gerente creado');
  await page.getByPlaceholder('cliente@gmail.com o empresa@sv').fill(email);
  await page.locator('form input[type="password"]').fill('testPassword123');
  await page.getByRole('button', { name: /Dar de Alta Empresa en CERO/ }).click();
  await expect.poll(async () => (await auth.getUserByEmail(email).catch(() => null))?.uid).toBeTruthy();
  await expect(page.getByText('Portal de Administración Maestro', { exact: true })).toBeVisible();
  const identity = await auth.getUserByEmail(email);
  await expect.poll(async () => (await database.doc(`users/${identity.uid}`).get()).exists).toBe(true);
  const profile = (await database.doc(`users/${identity.uid}`).get()).data()!;
  expect(profile.registrationSource).toBe('platform_admin');
  expect(profile.role).toBe('gerente');
  expect((await database.collection('invoices').where('companyId', '==', profile.companyId).get()).empty).toBe(true);
  await page.getByRole('button', { name: 'Cerrar confirmación de empresa', exact: true }).click();
  await page.getByRole('button', { name: /^Usuarios \(/ }).click();
  await expect(page.getByRole('row').filter({ hasText: email })).toContainText('Creado desde tu administración');
});

test('company manager creates an employee without leaving the company or inheriting employee permissions', async ({ page }) => {
  await page.goto('/');
  await page.locator('#login-email-input').fill('manager-access@sin-buzon.sv');
  await page.locator('#login-password-input').fill('testPassword123');
  await page.locator('#login-submit-btn').click();
  await page.locator('#nav-company_users').click();
  await page.getByRole('button', { name: /Crear Nuevo Perfil/ }).click();
  const email = `company-provision-${Date.now()}@sin-buzon.sv`;
  await page.getByPlaceholder('Ej: Sofía Hernández').fill('Empleado de la empresa');
  await page.getByPlaceholder('cajero@mitienda.sv').fill(email);
  await page.getByPlaceholder('Mínimo 6 caracteres').fill('testPassword123');
  await page.getByRole('button', { name: 'Crear Colaborador', exact: true }).click();
  await expect.poll(async () => (await auth.getUserByEmail(email).catch(() => null))?.uid).toBeTruthy();
  const identity = await auth.getUserByEmail(email);
  await expect.poll(async () => (await database.doc(`users/${identity.uid}`).get()).exists).toBe(true);
  const profile = (await database.doc(`users/${identity.uid}`).get()).data()!;
  expect(profile.registrationSource).toBe('company_admin');
  expect(profile.companyId).toBe('access-company');
  expect(profile.role).toBe('cajero');
  expect(profile.permissions).toEqual(['pos_sales']);
  expect(profile.password).toBeUndefined();
  await expect(page.locator('#nav-company_users')).toBeVisible();
  await expect(page.getByText('Portal de Administración Maestro', { exact: true })).toHaveCount(0);
});

async function accessToken(request: import('@playwright/test').APIRequestContext, email: string, password = 'testPassword123') {
  const response = await request.post('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo', { data: { email, password, returnSecureToken: true } });
  expect(response.status()).toBe(200);
  return (await response.json()).idToken as string;
}

test('password assignment rejects anonymous callers and users outside their company', async ({ request }) => {
  const url = `/api/admin/users/${accessIds['outside-access']}/password`;
  expect((await request.post(url, { data: { password: 'newPassword123' } })).status()).toBe(401);
  const token = await accessToken(request, 'manager-access@sin-buzon.sv');
  expect((await request.post(url, { headers: { Authorization: `Bearer ${token}` }, data: { password: 'newPassword123' } })).status()).toBe(403);
  const employeeToken = await accessToken(request, 'worker-access@sin-buzon.sv');
  expect((await request.post(`/api/admin/users/${accessIds['manager-access']}/password`, { headers: { Authorization: `Bearer ${employeeToken}` }, data: { password: 'newPassword123' } })).status()).toBe(403);
});

test('a company manager can assign an initial password without a mailbox or a profile password field', async ({ request }) => {
  const token = await accessToken(request, 'manager-access@sin-buzon.sv');
  const url = `/api/admin/users/${accessIds['worker-access']}/password`;
  expect((await request.post(url, { headers: { Authorization: `Bearer ${token}` }, data: { password: '123' } })).status()).toBe(400);
  expect((await request.post(url, { headers: { Authorization: `Bearer ${token}` }, data: { password: 'assignedPassword123' } })).status()).toBe(200);
  await accessToken(request, 'worker-access@sin-buzon.sv', 'assignedPassword123');
  expect((await database.doc(`users/${accessIds['worker-access']}`).get()).data()?.password).toBeUndefined();
});

test('the principal administrator assigns a password through the directory and the fictional address can sign in', async ({ page, request }) => {
  await page.goto('/');
  await page.locator('#login-email-input').fill('davidinn234@gmail.com');
  await page.locator('#login-password-input').fill('testPassword123');
  await page.locator('#login-submit-btn').click();
  await page.getByRole('button', { name: /^Usuarios \(/ }).click();
  const row = page.getByRole('row').filter({ hasText: 'outside-access@sin-buzon.sv' });
  await row.getByRole('button', { name: 'Asignar contraseña' }).click();
  await page.getByLabel('Nueva contraseña', { exact: true }).fill('deliveredPassword123');
  await page.getByRole('button', { name: 'Guardar contraseña', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Acceso listo', exact: true })).toBeVisible();
  await expect(page.getByRole('dialog').getByText(/deliveredPassword123/)).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: 'Cerrar', exact: true }).click();
  await expect(page.getByText(/deliveredPassword123/)).toHaveCount(0);
  await accessToken(request, 'outside-access@sin-buzon.sv', 'deliveredPassword123');
  expect((await database.doc(`users/${accessIds['outside-access']}`).get()).data()?.password).toBeUndefined();
});
