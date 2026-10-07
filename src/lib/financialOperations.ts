import { collection, doc, getDocs, query, where, runTransaction, type Firestore } from 'firebase/firestore';
import { db } from './firebase';
import { validatePayment } from './tenantPolicy';
import type { BankAccount, CustomerPayment, SupplierPayment, Invoice, Purchase, TreasuryMovement, Payroll } from '../types';
import { createBalancedJournalEntry, generateCustomerPaymentEntry, generateSupplierPaymentEntry } from '../utils/accountingEngine';

export async function recordPayment(
  companyId: string, input: Omit<CustomerPayment, 'id' | 'companyId'> | Omit<SupplierPayment, 'id' | 'companyId'>,
  direction: 'customer' | 'supplier', entryNumber: number, database: Firestore = db,
) {
  const customer = direction === 'customer';
  const payment = { ...input, id: `${customer ? 'cpay' : 'spay'}_${crypto.randomUUID()}`, companyId };
  const customerInput = input as Omit<CustomerPayment, 'id' | 'companyId'>;
  const supplierInput = input as Omit<SupplierPayment, 'id' | 'companyId'>;
  const documentId = customer ? customerInput.invoiceId : supplierInput.purchaseId;
  const accountId = customer ? customerInput.targetAccountId : supplierInput.sourceAccountId;
  const documentRef = doc(database, customer ? 'invoices' : 'purchases', documentId);
  const accountRef = doc(database, 'bank_accounts', accountId);
  await runTransaction(database, async transaction => {
    const [documentSnap, accountSnap] = await Promise.all([transaction.get(documentRef), transaction.get(accountRef)]);
    if (!documentSnap.exists() || !accountSnap.exists()) throw new Error('No se encontró el documento o la cuenta bancaria.');
    const document = documentSnap.data() as Invoice | Purchase;
    const account = accountSnap.data() as BankAccount;
    if (document.companyId !== companyId || account.companyId !== companyId) throw new Error('La operación pertenece a otra empresa.');
    if (document.status === 'anulada') throw new Error('No se puede abonar a un documento anulado.');
    const partyId = customer ? (document as Invoice).customerId : (document as Purchase).supplierId;
    if (partyId !== (customer ? customerInput.customerId : supplierInput.supplierId)) throw new Error('El cliente o proveedor no corresponde al documento.');
    validatePayment(input.amount, document.saldoPendiente, customer ? undefined : account.currentBalance);
    const outstanding = Number((document.saldoPendiente - input.amount).toFixed(2));
    const entry = customer
      ? generateCustomerPaymentEntry(payment as CustomerPayment, entryNumber, account.accountingCode, account.accountName)
      : generateSupplierPaymentEntry(payment as SupplierPayment, entryNumber, account.accountingCode, account.accountName);
    const movement: TreasuryMovement = {
      id: `tmov_${payment.id}`, companyId, bankAccountId: accountId, bankAccountName: account.accountName,
      date: input.date, type: customer ? 'abono_cxc' : 'pago_proveedor', amount: input.amount,
      referenceNumber: customer ? customerInput.receiptNumber : supplierInput.referenceNumber || payment.id,
      description: customer ? `Abono de ${customerInput.customerName}` : `Pago a ${supplierInput.supplierName}`,
      isReconciled: true, accountingEntryId: entry.id,
    };
    transaction.update(documentRef, { saldoPendiente: outstanding, status: outstanding === 0 ? 'pagada' : 'parcial' });
    transaction.update(accountRef, { currentBalance: Number((account.currentBalance + (customer ? input.amount : -input.amount)).toFixed(2)) });
    transaction.set(doc(database, customer ? 'customer_payments' : 'supplier_payments', payment.id), payment);
    transaction.set(doc(database, 'journal_entries', entry.id), entry);
    transaction.set(doc(database, 'treasury_movements', movement.id), movement);
  });
}

export async function moveFunds(companyId: string, fromId: string, toId: string, amount: number, reference: string, description: string, entryNumber: number, database: Firestore = db) {
  if (fromId === toId) throw new Error('Selecciona dos cuentas diferentes.');
  const id = crypto.randomUUID();
  await runTransaction(database, async transaction => {
    const fromRef = doc(database, 'bank_accounts', fromId), toRef = doc(database, 'bank_accounts', toId);
    const [fromSnapshot, toSnapshot] = await Promise.all([transaction.get(fromRef), transaction.get(toRef)]);
    if (!fromSnapshot.exists() || !toSnapshot.exists()) throw new Error('No se encontraron ambas cuentas.');
    const from = fromSnapshot.data() as BankAccount, to = toSnapshot.data() as BankAccount;
    if (from.companyId !== companyId || to.companyId !== companyId) throw new Error('Las cuentas deben pertenecer a esta empresa.');
    validatePayment(amount, from.currentBalance, from.currentBalance);
    const date = new Date().toISOString().split('T')[0];
    const entry = createBalancedJournalEntry({
      id: `entry_trf_${id}`, companyId, entryNumber, date, concept: description || 'Transferencia entre cuentas',
      sourceModule: 'tesoreria', referenceDoc: reference,
      lines: [
        { accountCode: to.accountingCode, accountName: to.accountName, debit: amount, credit: 0, concept: description },
        { accountCode: from.accountingCode, accountName: from.accountName, debit: 0, credit: amount, concept: description },
      ],
    });
    transaction.update(fromRef, { currentBalance: Number((from.currentBalance - amount).toFixed(2)) });
    transaction.update(toRef, { currentBalance: Number((to.currentBalance + amount).toFixed(2)) });
    transaction.set(doc(database, 'journal_entries', entry.id), entry);
    // Store both legs so each account's movement history reflects the transfer.
    for (const [account, suffix, signedAmount] of [[from, 'out', amount], [to, 'in', -amount]] as const) {
      const movement: TreasuryMovement = { id: `tmov_trf_${id}_${suffix}`, companyId, bankAccountId: account.id,
        bankAccountName: account.accountName, date, type: 'transferencia_interna', amount: signedAmount,
        referenceNumber: reference, description, isReconciled: true, accountingEntryId: entry.id };
      transaction.set(doc(database, 'treasury_movements', movement.id), movement);
    }
  });
}

export async function settlePayroll(companyId: string, payrollId: string, accountId: string, entryNumber: number, database: Firestore = db) {
  await runTransaction(database, async transaction => {
    const payrollRef = doc(database, 'payrolls', payrollId), bankRef = doc(database, 'bank_accounts', accountId);
    const [payrollSnapshot, bankSnapshot] = await Promise.all([transaction.get(payrollRef), transaction.get(bankRef)]);
    if (!payrollSnapshot.exists() || !bankSnapshot.exists()) throw new Error('No se encontró la planilla o la cuenta.');
    const payroll = payrollSnapshot.data() as Payroll, bank = bankSnapshot.data() as BankAccount;
    if (payroll.companyId !== companyId || bank.companyId !== companyId) throw new Error('La operación pertenece a otra empresa.');
    if (payroll.status !== 'aprobada') throw new Error('La planilla debe estar aprobada y no haber sido pagada.');
    validatePayment(payroll.totalLiquido, bank.currentBalance, bank.currentBalance);
    const date = new Date().toISOString().split('T')[0];
    const entry = createBalancedJournalEntry({ id: `entry_settle_${payrollId}`, companyId, entryNumber, date, concept: 'Pago de planilla', sourceModule: 'planilla', referenceDoc: payrollId, lines: [
      { accountCode: '2102-01', accountName: 'Sueldos netos por pagar', debit: payroll.totalLiquido, credit: 0, concept: 'Cancelación de sueldos pendientes' },
      { accountCode: bank.accountingCode, accountName: bank.accountName, debit: 0, credit: payroll.totalLiquido, concept: 'Salida por pago de planilla' },
    ] });
    transaction.update(payrollRef, { status: 'pagada', paymentDate: date });
    transaction.update(bankRef, { currentBalance: Number((bank.currentBalance - payroll.totalLiquido).toFixed(2)) });
    transaction.set(doc(database, 'journal_entries', entry.id), entry);
    transaction.set(doc(database, 'treasury_movements', `tmov_settle_${payrollId}`), { id: `tmov_settle_${payrollId}`, companyId, bankAccountId: bank.id, bankAccountName: bank.accountName, date, type: 'pago_planilla', amount: payroll.totalLiquido, referenceNumber: payrollId, description: 'Pago de planilla', isReconciled: true, accountingEntryId: entry.id });
  });
}

export async function reversePayment(companyId: string, paymentId: string, direction: 'customer' | 'supplier', database: Firestore = db) {
  const customer = direction === 'customer';
  const entryId = `${customer ? 'entry_cxc' : 'entry_cxp'}_${paymentId}`;
  const movements = await getDocs(query(collection(database, 'treasury_movements'), where('companyId', '==', companyId), where('accountingEntryId', '==', entryId)));
  await runTransaction(database, async transaction => {
    const paymentRef = doc(database, customer ? 'customer_payments' : 'supplier_payments', paymentId);
    const paymentSnapshot = await transaction.get(paymentRef);
    if (!paymentSnapshot.exists()) throw new Error('El abono ya fue revertido o no existe.');
    const payment = paymentSnapshot.data() as CustomerPayment & SupplierPayment;
    if (payment.companyId !== companyId) throw new Error('El abono pertenece a otra empresa.');
    const documentRef = doc(database, customer ? 'invoices' : 'purchases', customer ? payment.invoiceId : payment.purchaseId);
    const bankRef = doc(database, 'bank_accounts', customer ? payment.targetAccountId : payment.sourceAccountId);
    const [documentSnapshot, bankSnapshot] = await Promise.all([transaction.get(documentRef), transaction.get(bankRef)]);
    if (!documentSnapshot.exists() || !bankSnapshot.exists()) throw new Error('Falta el documento o la cuenta asociada al abono.');
    const document = documentSnapshot.data() as Invoice | Purchase, bank = bankSnapshot.data() as BankAccount;
    if (document.companyId !== companyId || bank.companyId !== companyId || document.status === 'anulada') throw new Error('No se puede revertir esta operación.');
    if (customer) validatePayment(payment.amount, bank.currentBalance, bank.currentBalance);
    const outstanding = Number((document.saldoPendiente + payment.amount).toFixed(2));
    transaction.update(documentRef, { saldoPendiente: outstanding, status: outstanding >= document.totalPagar ? (customer ? 'emitida' : 'registrada') : 'parcial' });
    transaction.update(bankRef, { currentBalance: Number((bank.currentBalance + (customer ? -payment.amount : payment.amount)).toFixed(2)) });
    transaction.delete(paymentRef);
    transaction.delete(doc(database, 'journal_entries', entryId));
    movements.docs.forEach(movement => transaction.delete(movement.ref));
  });
}
