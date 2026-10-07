import type { UserProfile } from '../types';

export const COMPANY_COLLECTIONS = [
  'branches', 'products', 'customers', 'invoices', 'customer_payments',
  'suppliers', 'purchases', 'supplier_payments', 'kardex_movements',
  'employees', 'payrolls', 'professional_services', 'candidate_folders', 'candidates',
  'attendance', 'leave_requests', 'bank_accounts', 'treasury_movements',
  'other_incomes', 'journal_entries', 'dynamic_widgets',
] as const;

export function canReadCompanyCollection(profile: UserProfile | null, name: string) {
  if (!profile) return false;
  if (profile.role === 'admin_maestro' || profile.role === 'gerente' || profile.role === 'contador') return true;
  if (profile.role === 'kiosko_asistencia') return ['attendance', 'branches', 'attendance_directory'].includes(name);
  return ['branches', 'products', 'customers', 'invoices', 'customer_payments', 'bank_accounts', 'treasury_movements', 'kardex_movements'].includes(name);
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
