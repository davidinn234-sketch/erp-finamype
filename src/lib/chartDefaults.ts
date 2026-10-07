import type { AccountNode } from '../types';
import { FULL_NIIF_CHART_OF_ACCOUNTS } from '../utils/catalogData';

export function emptyChart(template: AccountNode[]): AccountNode[] {
  const accounts = template.map(account => ({ ...account, debitBalance: 0, creditBalance: 0, balance: 0 }));
  for (const account of payrollAccounts) if (!accounts.some(existing => existing.code === account.code)) accounts.push(account);
  return ensureEngineAccounts(accounts);
}
export function ensureEngineAccounts(accounts: AccountNode[]): AccountNode[] {
  const required = new Set(['1101-01', '1103-01', '1105-01', '1107-01', '1108', '2101-01', '2107-01', '2107-02', '2108-01', '2108-02', '2108-03', '2108-04', '2108-05', '2109-01', '2109-02', '2109-03', '2110-01', '2110-02', '2110-03', '4101', '5101-01', '5101-02', '5101-03', '5101-04', '5101-05', '5102-03', '6101', '6103', '6201']);
  const combined = [...accounts];
  for (const account of [...FULL_NIIF_CHART_OF_ACCOUNTS.filter(account => required.has(account.code)), ...payrollAccounts]) if (!combined.some(existing => existing.code === account.code)) combined.push({ ...account, debitBalance: 0, creditBalance: 0, balance: 0, isSystem: true });
  return combined.sort((a, b) => a.code.localeCompare(b.code));
}
export const payrollAccounts: AccountNode[] = [
  { code: '5101-06', name: 'Aportes patronales agrupados de partidas anteriores', category: 'gastos', level: 3, parentCode: '51', isMovement: true, debitBalance: 0, creditBalance: 0, balance: 0, isSystem: true },
  { code: '2102', name: 'Obligaciones de planilla', category: 'pasivo', level: 2, parentCode: '2', isMovement: false, debitBalance: 0, creditBalance: 0, balance: 0, isSystem: true },
  { code: '2102-01', name: 'Sueldos netos por pagar', category: 'pasivo', level: 3, parentCode: '2102', isMovement: true, debitBalance: 0, creditBalance: 0, balance: 0, isSystem: true },
  { code: '2102-02', name: 'Otras deducciones de planilla por pagar', category: 'pasivo', level: 3, parentCode: '2102', isMovement: true, debitBalance: 0, creditBalance: 0, balance: 0, isSystem: true },
];
