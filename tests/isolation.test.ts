import { after, before, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertFails, assertSucceeds, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { collection, doc, getDoc, getDocs, query, setDoc, updateDoc, where, writeBatch, type Firestore } from 'firebase/firestore';
import { recordPayment, moveFunds, settlePayroll, reversePayment } from '../src/lib/financialOperations';
import { generatePayrollAccountingEntry } from '../src/utils/accountingEngine';
import { SAMPLE_PAYROLLS } from '../src/utils/sampleData';
import { validatePayment, assertTenantRecords } from '../src/lib/tenantPolicy';
import { canAccessModule, isPlatformOwner } from '../src/lib/accessPolicy';

let environment: RulesTestEnvironment;
before(async () => { environment = await initializeTestEnvironment({ projectId: 'demo-fina-pyme', firestore: { host: '127.0.0.1', port: 8080, rules: readFileSync('firestore.rules', 'utf8') } }); });
after(async () => { await environment?.cleanup(); });
beforeEach(async () => {
  await environment.clearFirestore();
  await environment.withSecurityRulesDisabled(async context => {
    const db = context.firestore() as unknown as Firestore;
    for (const [id, companyId, role] of [['alice', 'a', 'gerente'], ['bob', 'b', 'gerente'], ['cashier', 'a', 'cajero'], ['master', '', 'gerente']]) {
      await setDoc(doc(db, 'users', id), { id, email: `${id}@example.com`, name: id, companyId, role });
    }
    for (const companyId of ['a', 'b']) {
      await setDoc(doc(db, 'companies', companyId), { id: companyId, primaryAdminUserId: companyId === 'a' ? 'alice' : 'bob' });
      await setDoc(doc(db, 'products', companyId), { id: companyId, companyId, stock: 10 });
      await setDoc(doc(db, 'employees', companyId), { id: companyId, companyId, baseSalary: 500 });
    }
    await setDoc(doc(db, 'personal_finances', 'alice-tx'), { id: 'alice-tx', userId: 'alice', amount: 10 });
    await setDoc(doc(db, 'personal_finance_meta', 'alice'), { userId: 'alice', personalBudgets: [], personalSavingGoals: [] });
    await setDoc(doc(db, 'invoices', 'inv-a'), { id: 'inv-a', companyId: 'a', customerId: 'customer-a', saldoPendiente: 100, status: 'emitida' });
    await setDoc(doc(db, 'purchases', 'pur-a'), { id: 'pur-a', companyId: 'a', supplierId: 'supplier-a', saldoPendiente: 100, status: 'emitida' });
    for (const [id, companyId, balance] of [['bank-a', 'a', 100], ['bank-a2', 'a', 0], ['bank-b', 'b', 100]] as const) {
      await setDoc(doc(db, 'bank_accounts', id), { id, companyId, currentBalance: balance, accountName: id, accountingCode: '1101-01' });
    }
  });
});
const alice = () => environment.authenticatedContext('alice', { email: 'alice@example.com' }).firestore() as unknown as Firestore;
const payment = (amount: number) => ({ amount, invoiceId: 'inv-a', customerId: 'customer-a', customerName: 'Cliente A', invoiceNumber: '01', targetAccountId: 'bank-a', receiptNumber: 'R1', date: '2026-10-07', paymentMethod: 'efectivo' as const });

test('anonymous clients cannot read or write data', async () => {
  const db = environment.unauthenticatedContext().firestore() as unknown as Firestore;
  await assertFails(getDoc(doc(db, 'products', 'a')));
  await assertFails(setDoc(doc(db, 'system_state', 'global'), { companies: [] }));
});
test('company queries require the tenant constraint; foreign records are inaccessible', async () => {
  const db = alice();
  await assertSucceeds(getDocs(query(collection(db, 'products'), where('companyId', '==', 'a'))));
  await assertFails(getDocs(collection(db, 'products')));
  await assertFails(getDoc(doc(db, 'products', 'b')));
  await assertFails(updateDoc(doc(db, 'products', 'a'), { companyId: 'b' }));
  await assertFails(setDoc(doc(db, 'products', 'foreign'), { id: 'foreign', companyId: 'b' }));
});
test('personal transactions and metadata are private even from the platform administrator', async () => {
  await assertSucceeds(getDocs(query(collection(alice(), 'personal_finances'), where('userId', '==', 'alice'))));
  for (const context of [environment.authenticatedContext('bob'), environment.authenticatedContext('master', { platformAdmin: true, email: 'davidinn234@gmail.com' })]) {
    const db = context.firestore() as unknown as Firestore;
    await assertFails(getDoc(doc(db, 'personal_finances', 'alice-tx')));
    await assertFails(getDoc(doc(db, 'personal_finance_meta', 'alice')));
    await assertFails(setDoc(doc(db, 'personal_finance_meta', 'alice'), { userId: 'alice' }));
  }
});
test('roles, identity and company cannot be self-escalated', async () => {
  await assertFails(updateDoc(doc(alice(), 'users', 'alice'), { role: 'admin_maestro' }));
  await assertFails(updateDoc(doc(alice(), 'users', 'alice'), { companyId: 'b' }));
  await assertFails(updateDoc(doc(alice(), 'users', 'alice'), { password: 'plaintext' }));
  const cashier = environment.authenticatedContext('cashier').firestore() as unknown as Firestore;
  await assertFails(getDoc(doc(cashier, 'employees', 'a')));
  await assertFails(setDoc(doc(cashier, 'users', 'new-user'), { id: 'new-user', name: 'Nuevo', email: 'new@example.com', companyId: 'a', role: 'gerente' }));
});

test('only the designated email with its server claim can administer the platform', async () => {
  const owner = environment.authenticatedContext('master', { email: 'davidinn234@gmail.com', platformAdmin: true }).firestore() as unknown as Firestore;
  await assertSucceeds(getDocs(collection(owner, 'users')));
  for (const claims of [{ email: 'someone@example.com', platformAdmin: true }, { email: 'davidinn234@gmail.com' }]) {
    const outsider = environment.authenticatedContext('outsider', claims).firestore() as unknown as Firestore;
    await assertFails(getDocs(collection(outsider, 'users')));
    await assertFails(getDocs(collection(outsider, 'companies')));
  }
  assert.equal(isPlatformOwner('someone@example.com', { platformAdmin: true }), false);
  assert.equal(isPlatformOwner('davidinn234@gmail.com', {}), false);
});

test('employee module permissions restrict both navigation and stored company data', async () => {
  await environment.withSecurityRulesDisabled(async context => {
    const db = context.firestore() as unknown as Firestore;
    await setDoc(doc(db, 'users', 'limited'), { id: 'limited', email: 'limited@example.com', name: 'CRM', role: 'cajero', companyId: 'a', permissions: ['sales_crm'] });
  });
  const db = environment.authenticatedContext('limited').firestore() as unknown as Firestore;
  await assertSucceeds(getDoc(doc(db, 'invoices', 'inv-a')));
  await assertFails(getDoc(doc(db, 'employees', 'a')));
  await assertFails(getDoc(doc(db, 'purchases', 'pur-a')));
  await assertFails(getDoc(doc(db, 'invoices', 'inv-b')));
  await assertFails(setDoc(doc(db, 'payrolls', 'forbidden'), { id: 'forbidden', companyId: 'a' }));
  const profile = { id: 'limited', name: 'CRM', email: 'limited@example.com', role: 'cajero' as const, companyId: 'a', permissions: ['sales_crm'] };
  assert.equal(canAccessModule(profile, 'sales'), true);
  for (const module of ['pos_terminal', 'dashboard', 'payroll', 'settings', 'company_users', 'admin_profiles']) assert.equal(canAccessModule(profile, module), false);
});
test('public company signup atomically creates its own profile, company and branch', async () => {
  const db = environment.authenticatedContext('new-owner', { email: 'new@example.com' }).firestore() as unknown as Firestore;
  const batch = writeBatch(db);
  batch.set(doc(db, 'users', 'new-owner'), { id: 'new-owner', name: 'Nuevo', email: 'new@example.com', role: 'gerente', companyId: 'new-company' });
  batch.set(doc(db, 'companies', 'new-company'), { id: 'new-company', primaryAdminUserId: 'new-owner' });
  batch.set(doc(db, 'branches', 'new-branch'), { id: 'new-branch', companyId: 'new-company' });
  await assertSucceeds(batch.commit());
  await assertSucceeds(getDoc(doc(db, 'companies', 'new-company')));
  await assertFails(setDoc(doc(db, 'users', 'someone-else'), { id: 'someone-else', name: 'Otro', email: 'else@example.com', role: 'gerente', companyId: 'b' }));
});

test('platform owner can atomically provision another manager and its new empty company', async () => {
  const db = environment.authenticatedContext('master', { email: 'davidinn234@gmail.com', platformAdmin: true }).firestore() as unknown as Firestore;
  const batch = writeBatch(db);
  batch.set(doc(db, 'companies', 'provisioned'), { id: 'provisioned', primaryAdminUserId: 'new-manager' });
  batch.set(doc(db, 'users', 'new-manager'), { id: 'new-manager', name: 'Gerente', email: 'manager@example.com', role: 'gerente', companyId: 'provisioned' });
  batch.set(doc(db, 'branches', 'provisioned'), { id: 'provisioned', companyId: 'provisioned' });
  batch.set(doc(db, 'bank_accounts', 'provisioned'), { id: 'provisioned', companyId: 'provisioned', accountType: 'caja_general', initialBalance: 0, currentBalance: 0 });
  await assertSucceeds(batch.commit());
  assert.equal((await getDoc(doc(db, 'bank_accounts', 'provisioned'))).data()?.currentBalance, 0);
});
test('parallel customer payments cannot overpay; bank, debt and entries agree', async () => {
  const db = alice();
  const results = await Promise.allSettled([recordPayment('a', payment(70), 'customer', 1, db), recordPayment('a', payment(70), 'customer', 2, db)]);
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
  assert.equal((await getDoc(doc(db, 'invoices', 'inv-a'))).data()?.saldoPendiente, 30);
  assert.equal((await getDoc(doc(db, 'bank_accounts', 'bank-a'))).data()?.currentBalance, 170);
  for (const name of ['customer_payments', 'journal_entries', 'treasury_movements']) assert.equal((await getDocs(query(collection(db, name), where('companyId', '==', 'a')))).size, 1);
});
test('invalid payment leaves all financial documents unchanged', async () => {
  const db = alice();
  for (const amount of [-5, NaN, 101, 0, 1.001]) await assert.rejects(recordPayment('a', payment(amount), 'customer', 1, db));
  await assert.rejects(recordPayment('a', { ...payment(10), targetAccountId: 'bank-b' }, 'customer', 1, db));
  assert.equal((await getDoc(doc(db, 'invoices', 'inv-a'))).data()?.saldoPendiente, 100);
  assert.equal((await getDoc(doc(db, 'bank_accounts', 'bank-a'))).data()?.currentBalance, 100);
});
test('supplier partial payments update debt, bank and accounting together', async () => {
  const db = alice();
  await recordPayment('a', { amount: 40, purchaseId: 'pur-a', supplierId: 'supplier-a', supplierName: 'Proveedor', purchaseNumber: 'P1', sourceAccountId: 'bank-a', referenceNumber: 'AB1', date: '2026-10-07', paymentMethod: 'transferencia' }, 'supplier', 1, db);
  assert.equal((await getDoc(doc(db, 'purchases', 'pur-a'))).data()?.saldoPendiente, 60);
  assert.equal((await getDoc(doc(db, 'bank_accounts', 'bank-a'))).data()?.currentBalance, 60);
});
test('transfers conserve cash and reject duplicate, foreign or insufficient accounts', async () => {
  const db = alice();
  await moveFunds('a', 'bank-a', 'bank-a2', 40, 'TR1', 'Depósito', 1, db);
  assert.equal((await getDoc(doc(db, 'bank_accounts', 'bank-a'))).data()?.currentBalance, 60);
  assert.equal((await getDoc(doc(db, 'bank_accounts', 'bank-a2'))).data()?.currentBalance, 40);
  await assert.rejects(moveFunds('a', 'bank-a', 'bank-a', 10, '', '', 2, db));
  await assert.rejects(moveFunds('a', 'bank-a', 'bank-a2', 61, '', '', 2, db));
  await assert.rejects(moveFunds('a', 'bank-a', 'bank-b', 10, '', '', 2, db));
});
test('backup import rejects missing or foreign ownership and validates amounts', () => {
  assert.throws(() => assertTenantRecords([{ id: 'foreign', companyId: 'b' }], 'a'));
  assert.throws(() => assertTenantRecords([{ id: 'ownerless' }], 'a'));
  assert.doesNotThrow(() => assertTenantRecords([{ id: 'own', companyId: 'a' }], 'a'));
  assert.throws(() => validatePayment(Infinity, 100));
});

test('reversing a payment restores both debt and bank; it cannot be reversed twice', async () => {
  const db = alice();
  await recordPayment('a', payment(30), 'customer', 1, db);
  const payments = await getDocs(query(collection(db, 'customer_payments'), where('companyId', '==', 'a')));
  const id = payments.docs[0].id;
  await reversePayment('a', id, 'customer', db);
  assert.equal((await getDoc(doc(db, 'invoices', 'inv-a'))).data()?.saldoPendiente, 100);
  assert.equal((await getDoc(doc(db, 'bank_accounts', 'bank-a'))).data()?.currentBalance, 100);
  await assert.rejects(reversePayment('a', id, 'customer', db));
  assert.equal((await getDocs(query(collection(db, 'treasury_movements'), where('companyId', '==', 'a')))).size, 0);
});

test('payroll accrual creates a salary payable rather than paying an arbitrary bank', () => {
  const payroll = SAMPLE_PAYROLLS[0];
  const entry = generatePayrollAccountingEntry(payroll, 1);
  assert.equal(entry.lines.some(line => line.accountCode.startsWith('1101')), false);
  assert.equal(entry.lines.find(line => line.accountCode === '2102-01')?.credit, payroll.totalLiquido);
  assert.equal(entry.lines.find(line => line.accountCode === '2110-01')?.credit, Number(payroll.details.filter(detail => detail.isIncluded !== false).reduce((sum, detail) => sum + detail.provisionAguinaldo, 0).toFixed(2)));
});

test('payroll settlement affects the bank once even with concurrent payment attempts', async () => {
  const db = alice();
  await setDoc(doc(db, 'payrolls', 'pay-a'), { id: 'pay-a', companyId: 'a', status: 'aprobada', totalLiquido: 50 });
  const results = await Promise.allSettled([settlePayroll('a', 'pay-a', 'bank-a', 1, db), settlePayroll('a', 'pay-a', 'bank-a', 2, db)]);
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
  assert.equal((await getDoc(doc(db, 'bank_accounts', 'bank-a'))).data()?.currentBalance, 50);
  assert.equal((await getDoc(doc(db, 'payrolls', 'pay-a'))).data()?.status, 'pagada');
});
