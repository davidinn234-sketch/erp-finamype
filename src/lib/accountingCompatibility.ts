import type { AccountNode, JournalEntry } from '../types';
// Read-only compatibility for automatic entries produced by the earlier prototype.
// Custom movement accounts with the expected category retain their own codes.
export function normalizeLegacyEntries(entries: JournalEntry[], accounts: AccountNode[]) {
  let corrected = 0;
  const normalized = entries.map(entry => ({ ...entry, lines: entry.lines.map(line => {
    let code: string | undefined, category: AccountNode['category'] = 'gastos';
    if (entry.sourceModule === 'ventas' && ['5101', '5102'].includes(line.accountCode)) { code = line.accountCode === '5101' ? '6101' : '6103'; category = 'ingresos'; }
    if (entry.sourceModule === 'compras' && line.accountCode === '4201-04') code = '5102-03';
    if (entry.sourceModule === 'planilla') code = ({ '4201-01': '5101-01', '4201-02': '5101-06', '4201-03': '5101-05' } as Record<string, string>)[line.accountCode];
    if (entry.sourceModule === 'tesoreria' && line.accountCode === '5201-01' && /otros ingresos/i.test(line.accountName)) { code = '6201'; category = 'ingresos'; }
    if (!code || accounts.some(account => account.code === line.accountCode && account.isMovement && account.category === category)) return line;
    const target = accounts.find(account => account.code === code && account.isMovement && account.category === category);
    if (!target) return line;
    corrected++; return { ...line, accountCode: target.code, accountName: target.name };
  }) }));
  return { entries: normalized, corrected };
}
