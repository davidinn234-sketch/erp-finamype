import type { UserProfile } from '../types';
import { PLATFORM_OWNER_EMAIL, profilePermissions } from './accessPolicy';

export const COMPANY_COLLECTIONS = [
  'branches', 'products', 'customers', 'invoices', 'customer_payments',
  'suppliers', 'purchases', 'supplier_payments', 'kardex_movements',
  'employees', 'payrolls', 'professional_services', 'candidate_folders', 'candidates',
  'attendance', 'leave_requests', 'bank_accounts', 'treasury_movements',
  'other_incomes', 'journal_entries', 'dynamic_widgets',
] as const;

export function canReadCompanyCollection(profile: UserProfile | null, name: string) {
  if (!profile) return false;
  if (profile.role === 'admin_maestro') return profile.email.toLowerCase() === PLATFORM_OWNER_EMAIL;
  if (profile.role === 'gerente') return true;
  if (profile.role === 'kiosko_asistencia') return ['attendance', 'branches', 'attendance_directory'].includes(name);
  if (name === 'branches') return true;
  const permissions = profilePermissions(profile);
  const has = (...keys: string[]) => keys.some(key => permissions.includes(key));
  const sales = has('pos_sales', 'pos_terminal', 'sales_crm', 'sales', 'customer_view', 'cxc_management');
  const buying = has('purchases', 'purchases_scm', 'inventory_edit');
  const ledger = has('accounting', 'accounting_access', 'iva_books');
  const treasury = has('treasury', 'treasury_access');
  if (['products', 'kardex_movements'].includes(name)) return sales || buying || has('inventory', 'inventory_view');
  if (['customers', 'invoices', 'customer_payments'].includes(name)) return sales || ledger || has('dashboard', 'marketing', 'forecasting');
  if (['suppliers', 'purchases', 'supplier_payments'].includes(name)) return buying || ledger || has('dashboard', 'forecasting');
  if (['bank_accounts', 'treasury_movements'].includes(name)) return sales || treasury || ledger || has('dashboard', 'forecasting', 'payroll', 'payroll_access');
  if (name === 'journal_entries') return ledger || has('dashboard', 'forecasting');
  if (name === 'other_incomes') return treasury || ledger || has('dashboard');
  if (['employees', 'payrolls', 'professional_services', 'candidate_folders', 'candidates', 'attendance', 'leave_requests'].includes(name)) return has('payroll', 'payroll_access');
  if (name === 'dynamic_widgets') return has('dashboard', 'marketing');
  return false;
}

export function assertTenantRecords(records: unknown, companyId: string): asserts records is { id: string; companyId: string }[] {
  if (!Array.isArray(records) || records.some(record => !record || typeof record.id !== 'string' || record.companyId !== companyId)) {
    throw new Error('El respaldo contiene registros de otra empresa o registros sin empresa identificada.');
  }
}

export function validatePayment(amount: number, outstanding: number, accountBalance?: number) {
  if (!Number.isFinite(amount) || amount <= 0 || Math.round(amount * 100) !== amount * 100 && Math.abs(Math.round(amount * 100) - amount * 100) > 1e-7) {
    throw new Error('Ingresa un monto positivo con un máximo de dos decimales.');
  }
  if (!Number.isFinite(outstanding) || amount > outstanding + 1e-7) throw new Error('El abono no puede superar el saldo pendiente.');
  if (accountBalance !== undefined && (!Number.isFinite(accountBalance) || amount > accountBalance + 1e-7)) throw new Error('La cuenta no tiene fondos suficientes.');
}
