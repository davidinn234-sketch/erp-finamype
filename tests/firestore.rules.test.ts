import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertFails, assertSucceeds, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { collection, doc, getDoc, getDocs, query, where, documentId, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
let env: RulesTestEnvironment;
before(async () => {
  env = await initializeTestEnvironment({ projectId: 'demo-erp-security', firestore: { rules: readFileSync('firestore.rules', 'utf8') } });
  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    for (const user of [
      { id: 'manager-a', role: 'gerente', companyId: 'a' },
      { id: 'cashier-a', role: 'cajero', companyId: 'a' },
      { id: 'manager-b', role: 'gerente', companyId: 'b' },
      { id: 'owner', role: 'admin_maestro' },
      { id: 'disabled-a', role: 'gerente', companyId: 'a', disabled: true },
    ]) await setDoc(doc(db, 'users', user.id), { ...user, name: user.id, email: `${user.id}@example.test` });
    for (const id of ['a', 'b']) {
      await setDoc(doc(db, 'companies', id), { id });
      await setDoc(doc(db, 'invoices', id), { id, companyId: id });
    }
    await setDoc(doc(db, 'personal_finances', 'private-a'), { id: 'private-a', userId: 'manager-a', amount: 1 });
    await setDoc(doc(db, 'personal_finance_meta', 'manager-a'), { personalBudgets: [] });
  });
});
after(async () => { await env?.cleanup(); });

test('anonymous clients cannot read or write any ERP document, including nested/global paths', async () => {
  const db = env.unauthenticatedContext().firestore();
  for (const path of ['users/manager-a', 'invoices/a', 'companies/a/nested/secret', 'system_state/data', 'test/connection']) {
    await assertFails(getDoc(doc(db, path)));
    await assertFails(setDoc(doc(db, path), { value: 1 }));
  }
});
test('a Firebase account without a provisioned ERP profile has no access', async () => {
  const db = env.authenticatedContext('stranger').firestore();
  await assertFails(getDoc(doc(db, 'invoices', 'a')));
  await assertFails(setDoc(doc(db, 'users', 'stranger'), { role: 'admin_maestro' }));
});
test('same-company reads and correctly scoped queries succeed; cross-tenant reads/writes fail', async () => {
  const db = env.authenticatedContext('manager-a').firestore();
  await assertSucceeds(getDoc(doc(db, 'invoices', 'a')));
  await assertSucceeds(getDocs(query(collection(db, 'invoices'), where('companyId', '==', 'a'))));
  await assertSucceeds(getDocs(query(collection(db, 'companies'), where(documentId(), '==', 'a'))));
  await assertSucceeds(getDoc(doc(db, 'company_settings', 'a')));
  await assertFails(getDoc(doc(db, 'company_settings', 'b')));
  await assertFails(getDocs(collection(db, 'invoices')));
  await assertFails(getDoc(doc(db, 'invoices', 'b')));
  await assertFails(setDoc(doc(db, 'invoices', 'foreign'), { id: 'foreign', companyId: 'b' }));
  await assertFails(updateDoc(doc(db, 'invoices', 'a'), { companyId: 'b' }));
  await assertFails(deleteDoc(doc(db, 'invoices', 'b')));
});
test('roles and company membership cannot be changed by browser profile writes', async () => {
  const db = env.authenticatedContext('manager-a').firestore();
  await assertSucceeds(updateDoc(doc(db, 'users', 'manager-a'), { name: 'New name' }));
  for (const change of [{ role: 'admin_maestro' }, { companyId: 'b' }, { password: 'plaintext' }]) {
    await assertFails(updateDoc(doc(db, 'users', 'manager-a'), change));
  }
  await assertFails(setDoc(doc(db, 'users', 'new-admin'), { id: 'new-admin', role: 'admin_maestro' }));
});
test('cashiers may write sales but cannot alter payroll or other profiles', async () => {
  const db = env.authenticatedContext('cashier-a').firestore();
  await assertSucceeds(setDoc(doc(db, 'invoices', 'cash-sale'), { id: 'cash-sale', companyId: 'a' }));
  await assertFails(setDoc(doc(db, 'payrolls', 'fake'), { id: 'fake', companyId: 'a' }));
  await assertFails(getDoc(doc(db, 'users', 'manager-a')));
  await assertSucceeds(getDocs(query(collection(db, 'users'), where('id', '==', 'cashier-a'))));
});
test('personal records and budgets remain private even from company managers and master admin', async () => {
  for (const uid of ['cashier-a', 'manager-b', 'owner']) {
    const db = env.authenticatedContext(uid).firestore();
    await assertFails(getDoc(doc(db, 'personal_finances', 'private-a')));
    await assertFails(getDoc(doc(db, 'personal_finance_meta', 'manager-a')));
  }
  const db = env.authenticatedContext('manager-a').firestore();
  await assertSucceeds(getDocs(query(collection(db, 'personal_finances'), where('userId', '==', 'manager-a'))));
  await assertFails(updateDoc(doc(db, 'personal_finances', 'private-a'), { userId: 'manager-b' }));
  await assertFails(getDoc(doc(db, 'personal_finance_meta', 'data')));
});
test('disabled profiles cannot access business data; master can list companies', async () => {
  await assertFails(getDoc(doc(env.authenticatedContext('disabled-a').firestore(), 'invoices', 'a')));
  await assertSucceeds(getDocs(collection(env.authenticatedContext('owner').firestore(), 'companies')));
});

test('API rejects unauthenticated requests and never returns invented results on provider failure', async () => {
  process.env.NODE_ENV = 'test';
  process.env.FIREBASE_PROJECT_ID = 'demo-erp-security';
  process.env.FIREBASE_DATABASE_ID = '(default)';
  delete process.env.GEMINI_API_KEY;
  delete process.env.ALLOW_SELF_REGISTRATION;
  const { app } = await import('../server');
  const { adminServices } = await import('../server/firebaseAdmin');
  const { auth, db } = adminServices();
  const uid = 'api-manager';
  await auth.createUser({ uid, email: 'api@example.test', password: 'test-only-123456' });
  await db.doc(`users/${uid}`).set({ id: uid, role: 'gerente', companyId: 'a', name: 'API Manager', email: 'api@example.test' });
  const login = await fetch(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'api@example.test', password: 'test-only-123456', returnSecureToken: true }) });
  const { idToken } = await login.json() as any;
  assert.ok(idToken);
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const address = server.address() as { port: number };
  const request = (path: string, body: unknown, token?: string, method = 'POST') => fetch(`http://127.0.0.1:${address.port}${path}`, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body) });
  try {
    for (const path of ['/api/ai/chat', '/api/ai/copilot', '/api/ai/dynamic-chart', '/api/ai/financial-diagnosis', '/api/accounts']) {
      assert.equal((await request(path, { prompt: 'ventas mensuales' })).status, 401);
      assert.equal((await request(path, {}, 'forged')).status, 401);
    }
    assert.equal((await request('/api/register', {})).status, 403);
    assert.equal((await request('/api/ai/dynamic-chart', { prompt: {} }, idToken)).status, 400);
    for (const path of ['/api/ai/copilot', '/api/ai/dynamic-chart']) {
      const response = await request(path, { prompt: 'ventas mensuales' }, idToken);
      assert.equal(response.status, 503);
      const result = await response.json() as any;
      assert.equal(typeof result.error, 'string');
      assert.equal(result.data, undefined);
      assert.equal(result.saleData, undefined);
    }
    assert.equal((await request('/api/accounts', { user: { role: 'admin_maestro', companyId: 'a' } }, idToken)).status, 403);
    assert.equal((await request('/api/accounts', { user: { role: 'cajero', companyId: 'b' } }, idToken)).status, 403);
    const response = await request('/api/accounts', { user: { name: 'New cashier', email: 'new@example.test', password: 'test-only-123456', role: 'cajero', companyId: 'a' } }, idToken);
    assert.equal(response.status, 201);
    const result = await response.json() as any;
    assert.equal(result.user.password, undefined);
    const saved = (await db.doc(`users/${result.user.id}`).get()).data()!;
    assert.equal(saved.password, undefined);
    assert.equal((await auth.getUser(result.user.id)).email, 'new@example.test');
    assert.equal((await request(`/api/accounts/${result.user.id}`, { role: 'admin_maestro' }, idToken, 'PATCH')).status, 403);
    let limited: Response | undefined;
    for (let i = 0; i < 25; i++) {
      limited = await request('/api/ai/chat', { message: '' }, idToken);
      if (limited.status === 429) break;
    }
    assert.equal(limited?.status, 429);
    assert.ok(limited?.headers.get('Retry-After'));
    await db.doc(`users/${uid}`).delete();
    assert.equal((await request('/api/ai/chat', { message: 'hola' }, idToken)).status, 403);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});
