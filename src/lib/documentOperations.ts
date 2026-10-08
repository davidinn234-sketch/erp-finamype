import { doc, runTransaction, type Firestore } from 'firebase/firestore';
import { db } from './firebase';
import type { BankAccount, Customer, Invoice, JournalEntry, KardexMovement, Product, Purchase, TreasuryMovement } from '../types';
import { generatePurchaseAccountingEntry, generateSaleAccountingEntry } from '../utils/accountingEngine';

const money = (value: number) => Number(value.toFixed(2));
const units = (value: number) => Number(value.toFixed(6));

function validateDocument(document: Invoice | Purchase) {
  if (!document.companyId || !document.items.length || document.items.length > 100) throw new Error('Agrega entre uno y cien productos o servicios al documento.');
  if (!Number.isFinite(document.totalPagar) || document.totalPagar < 0) throw new Error('El total del documento no es válido.');
  for (const item of document.items) {
    if (!Number.isFinite(item.quantity) || item.quantity <= 0 || !Number.isFinite(item.total) || item.total < 0) throw new Error('Cada producto debe tener cantidad positiva y un importe válido.');
    const price = 'unitPrice' in item ? item.unitPrice : item.unitCost;
    if (!Number.isFinite(price) || price < 0) throw new Error('El precio o costo debe ser un número válido.');
  }
}

function validateEntry(entry: JournalEntry) {
  if (!entry.isBalanced || entry.lines.some(line => !Number.isFinite(line.debit) || !Number.isFinite(line.credit) || line.debit < 0 || line.credit < 0)) throw new Error('El documento no coincide con sus totales contables. Revisa los importes antes de guardarlo.');
}

// Read current balances and stock before writing any document. Firestore commits
// the sale/purchase, inventory and accounting together, or rejects them all.
export async function persistInvoice(invoice: Invoice, entryNumber: number, accountId?: string, customer?: Customer, existingCustomer = false, database: Firestore = db): Promise<Invoice> {
  validateDocument(invoice);
  const cash = invoice.paymentCondition === 'contado';
  if (cash && !accountId) throw new Error('Crea o selecciona una cuenta de caja o banco para recibir esta venta.');
  return runTransaction(database, async transaction => {
    const productIds = [...new Set(invoice.items.map(item => item.productId).filter(Boolean))];
    const snapshots = await Promise.all(productIds.map(id => transaction.get(doc(database, 'products', id))));
    const stock = new Map<string, Product>();
    snapshots.forEach((snapshot, index) => {
      if (!snapshot.exists() || snapshot.data().companyId !== invoice.companyId) throw new Error('Un producto ya no está disponible en esta empresa.');
      stock.set(productIds[index], snapshot.data() as Product);
    });
    const bankRef = cash ? doc(database, 'bank_accounts', accountId!) : null;
    const bankSnapshot = bankRef ? await transaction.get(bankRef) : null;
    const bank = bankSnapshot?.data() as BankAccount | undefined;
    if (cash && (!bank || bank.companyId !== invoice.companyId || !Number.isFinite(bank.currentBalance))) throw new Error('La cuenta seleccionada no está disponible para esta empresa.');
    const customerRef = customer ? doc(database, 'customers', customer.id) : null;
    const customerSnapshot = customerRef && existingCustomer ? await transaction.get(customerRef) : null;
    if (existingCustomer && (!customerSnapshot?.exists() || customerSnapshot.data().companyId !== invoice.companyId)) throw new Error('El cliente ya no está disponible en esta empresa.');
    if (customer && customer.companyId !== invoice.companyId) throw new Error('El cliente pertenece a otra empresa.');
    const saved: Invoice = { ...invoice, items: invoice.items.map(item => ({ ...item, unitCost: stock.get(item.productId)?.isService ? 0 : stock.get(item.productId)?.currentCost ?? item.unitCost })) };
    const movements: KardexMovement[] = [];
    for (const item of saved.items) {
      const product = stock.get(item.productId);
      if (!product || product.isService) continue;
      if (!Number.isFinite(product.stock) || product.stock < item.quantity) throw new Error(`Inventario insuficiente para ${product.name}. Disponible: ${product.stock}.`);
      const nextStock = units(product.stock - item.quantity);
      const next = { ...product, stock: nextStock };
      stock.set(product.id, next);
      movements.push({ id: `kdx_sale_${saved.id}_${item.id}`, companyId: saved.companyId, productId: product.id, productName: product.name, date: saved.date, type: 'salida_venta', referenceDoc: saved.correlativeNumber, quantity: item.quantity, unitCost: product.currentCost, totalCost: money(item.quantity * product.currentCost), balanceQuantity: nextStock, balanceUnitCost: product.currentCost, balanceTotalCost: money(nextStock * product.currentCost), notes: `Venta a ${saved.customerName}` });
    }
    const entry = generateSaleAccountingEntry(saved, entryNumber);
    if (bank) entry.lines[0] = { ...entry.lines[0], accountCode: bank.accountingCode, accountName: bank.accountName };
    validateEntry(entry);
    saved.accountingEntryId = entry.id;
    if (bank && bankRef) {
      transaction.update(bankRef, { currentBalance: money(bank.currentBalance + saved.totalPagar) });
      const movement: TreasuryMovement = { id: `tmov_sale_${saved.id}`, companyId: saved.companyId, branchId: saved.branchId, branchName: saved.branchName, bankAccountId: bank.id, bankAccountName: bank.accountName, date: saved.date, type: 'ingreso_venta', amount: saved.totalPagar, referenceNumber: saved.correlativeNumber, description: `Venta contado #${saved.correlativeNumber}`, isReconciled: true, accountingEntryId: entry.id };
      transaction.set(doc(database, 'treasury_movements', movement.id), movement);
    }
    if (customer && customerRef) {
      const current = customerSnapshot?.data() as Customer | undefined;
      const nextCustomer = current ? { ...current, stage: current.stage === 'prospecto' || current.stage === 'cotizacion' ? 'frecuente' : current.stage, notesTimeline: [...(customer.notesTimeline?.slice(0, 1) || []), ...(current.notesTimeline || [])] } : customer;
      transaction.set(customerRef, nextCustomer);
    }
    for (const product of stock.values()) if (!product.isService) transaction.update(doc(database, 'products', product.id), { stock: product.stock });
    for (const movement of movements) transaction.set(doc(database, 'kardex_movements', movement.id), movement);
    transaction.set(doc(database, 'invoices', saved.id), saved);
    transaction.set(doc(database, 'journal_entries', entry.id), entry);
    return saved;
  });
}

export async function persistPurchase(purchase: Purchase, entryNumber: number, database: Firestore = db): Promise<Purchase> {
  validateDocument(purchase);
  return runTransaction(database, async transaction => {
    const productIds = [...new Set(purchase.items.map(item => item.productId).filter(Boolean))];
    const snapshots = await Promise.all(productIds.map(id => transaction.get(doc(database, 'products', id))));
    const stock = new Map<string, Product>();
    snapshots.forEach((snapshot, index) => {
      if (!snapshot.exists() || snapshot.data().companyId !== purchase.companyId) throw new Error('Un producto ya no está disponible en esta empresa.');
      stock.set(productIds[index], snapshot.data() as Product);
    });
    const movements: KardexMovement[] = [];
    for (const item of purchase.items) {
      const product = stock.get(item.productId);
      if (!product || product.isService) continue;
      if (!Number.isFinite(product.stock) || product.stock < 0 || !Number.isFinite(product.currentCost) || product.currentCost < 0) throw new Error(`Revisa el inventario y costo de ${product.name}.`);
      const nextStock = units(product.stock + item.quantity);
      const nextCost = (product.stock * product.currentCost + item.quantity * item.unitCost) / nextStock;
      stock.set(product.id, { ...product, stock: nextStock, currentCost: nextCost });
      movements.push({ id: `kdx_purchase_${purchase.id}_${item.id}`, companyId: purchase.companyId, productId: product.id, productName: product.name, date: purchase.date, type: 'entrada_compra', referenceDoc: purchase.documentNumber, quantity: item.quantity, unitCost: item.unitCost, totalCost: money(item.quantity * item.unitCost), balanceQuantity: nextStock, balanceUnitCost: money(nextCost), balanceTotalCost: money(nextStock * nextCost), notes: `Compra a ${purchase.supplierName}` });
    }
    const entry = generatePurchaseAccountingEntry(purchase, entryNumber);
    validateEntry(entry);
    const saved = { ...purchase, accountingEntryId: entry.id };
    for (const product of stock.values()) if (!product.isService) transaction.update(doc(database, 'products', product.id), { stock: product.stock, currentCost: money(product.currentCost) });
    for (const movement of movements) transaction.set(doc(database, 'kardex_movements', movement.id), movement);
    transaction.set(doc(database, 'purchases', saved.id), saved);
    transaction.set(doc(database, 'journal_entries', entry.id), entry);
    return saved;
  });
}
