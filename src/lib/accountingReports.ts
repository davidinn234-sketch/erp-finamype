import type { AccountNode, BankAccount, JournalEntry } from '../types';
import { normalizeLegacyEntries } from './accountingCompatibility';

export const cents = (value: number) => Math.round((Number.isFinite(value) ? value : 0) * 100);
export const money = (value: number) => cents(value) / 100;
export const inPeriod = (date: string, start: string, end: string) => date >= start && date <= end;
export type CashActivity = 'operacion' | 'inversion' | 'financiacion' | 'revisar';

export function buildAccountingReports(accounts: AccountNode[], entries: JournalEntry[], banks: BankAccount[], start: string, end: string) {
  if (start > end) throw new Error('La fecha inicial debe ser anterior a la final.');
  const compatibility = normalizeLegacyEntries(entries, accounts);
  const posted = compatibility.entries.filter(entry => entry.status === 'asentada' && entry.date <= end);
  const period = posted.filter(entry => entry.date >= start).sort((a, b) => a.date.localeCompare(b.date) || a.entryNumber - b.entryNumber);
  const rows = accounts.filter(account => account.isMovement).map(account => {
    const openingSeed = cents(account.debitBalance) - cents(account.creditBalance);
    let opening = openingSeed, debit = 0, credit = 0, resultMovement = 0;
    for (const entry of posted) for (const line of entry.lines) if (line.accountCode === account.code) {
      if (entry.date < start) opening += cents(line.debit) - cents(line.credit);
      else { debit += cents(line.debit); credit += cents(line.credit); if (entry.sourceModule !== 'cierre') resultMovement += cents(line.debit) - cents(line.credit); }
    }
    const sign = ['activo', 'costos', 'gastos'].includes(account.category) ? 1 : -1;
    return { ...account, opening: opening / 100, debit: debit / 100, credit: credit / 100, closing: (opening + debit - credit) / 100, naturalClosing: sign * (opening + debit - credit) / 100, periodBalance: sign * resultMovement / 100 };
  });
  const sum = (category: AccountNode['category'], field: 'naturalClosing' | 'periodBalance') => money(rows.filter(row => row.category === category).reduce((total, row) => total + row[field], 0));
  const revenue = sum('ingresos', 'periodBalance'), costs = sum('costos', 'periodBalance'), expenses = sum('gastos', 'periodBalance');
  const profit = money(revenue - costs - expenses);
  const cumulativeProfit = money(sum('ingresos', 'naturalClosing') - sum('costos', 'naturalClosing') - sum('gastos', 'naturalClosing'));
  const assets = sum('activo', 'naturalClosing'), liabilities = sum('pasivo', 'naturalClosing');
  const equity = money(sum('patrimonio', 'naturalClosing') + cumulativeProfit);
  const known = new Set(rows.map(row => row.code));
  const issues: string[] = [];
  if (compatibility.corrected) issues.push('Se interpretaron códigos antiguos de partidas automáticas usando el catálogo actual. Los documentos originales se conservan.');
  const entryNumbers = new Set<number>();
  for (const entry of posted) {
    if (!Number.isInteger(entry.entryNumber) || entry.entryNumber <= 0 || entryNumbers.has(entry.entryNumber)) issues.push(`Partida ${entry.entryNumber}: revisa el correlativo repetido o inválido.`);
    entryNumbers.add(entry.entryNumber);
    const debit = entry.lines.reduce((sum, line) => sum + cents(line.debit), 0);
    const credit = entry.lines.reduce((sum, line) => sum + cents(line.credit), 0);
    if (debit !== credit) issues.push(`Partida ${entry.entryNumber}: cargos y abonos no coinciden.`);
    for (const line of entry.lines) {
      if (!known.has(line.accountCode)) issues.push(`Partida ${entry.entryNumber}: la cuenta ${line.accountCode} falta en el catálogo de movimiento.`);
      if (![line.debit, line.credit].every(value => Number.isFinite(value) && value >= 0) || (line.debit > 0 && line.credit > 0)) issues.push(`Partida ${entry.entryNumber}: importe no válido.`);
    }
  }
  const isCash = (code: string) => code === '1101' || code.startsWith('1101-') || banks.some(bank => bank.accountingCode === code);
  const cashRows = rows.filter(row => isCash(row.code));
  const openingCash = money(cashRows.reduce((sum, row) => sum + row.opening, 0));
  const closingCash = money(cashRows.reduce((sum, row) => sum + row.closing, 0));
  const cashMovements = period.flatMap(entry => {
    const delta = entry.lines.filter(line => isCash(line.accountCode)).reduce((sum, line) => sum + cents(line.debit) - cents(line.credit), 0);
    if (delta === 0) return []; // Transfers between cash accounts never generate external cash flow.
    const counterpart = entry.lines.filter(line => !isCash(line.accountCode) && (line.debit || line.credit));
    const activities = new Set(counterpart.map(line => {
      if (line.accountCode.startsWith('12')) return 'inversion';
      if (line.accountCode.startsWith('3') || line.accountCode.startsWith('22') || /pr[eé]stamo|financiamiento/.test(line.accountName.toLowerCase())) return 'financiacion';
      return known.has(line.accountCode) ? 'operacion' : 'revisar';
    }));
    const activity = entry.cashFlowActivity || (activities.size === 1 ? [...activities][0] : 'revisar');
    return [{ id: entry.id, date: entry.date, concept: entry.concept, reference: entry.referenceDoc || String(entry.entryNumber), amount: delta / 100, activity: activity as CashActivity }];
  });
  const cashTotals = Object.fromEntries(['operacion', 'inversion', 'financiacion', 'revisar'].map(activity => [activity, money(cashMovements.filter(row => row.activity === activity).reduce((sum, row) => sum + row.amount, 0))])) as Record<CashActivity, number>;
  return { rows, period, revenue, costs, expenses, profit, cumulativeProfit, assets, liabilities, equity, balanceDifference: money(assets - liabilities - equity), issues: [...new Set(issues)], openingCash, closingCash, cashMovements, cashTotals, netCash: money(closingCash - openingCash) };
}

export type CsvCell = string | number;
export function csvText(rows: CsvCell[][]): string {
  return '\uFEFF' + rows.map(row => row.map(value => {
    let text = String(value ?? '');
    if (typeof value === 'string' && /^\s*[=+@-]/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
  }).join(',')).join('\r\n');
}
export function downloadText(filename: string, content: string, mime = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const link = document.createElement('a'); link.href = url; link.download = filename.replace(/[<>:"/\\|?*]/g, '_'); link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const escapeHtml = (value: CsvCell) => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!));
export interface ReportSection { title: string; headers: string[]; rows: CsvCell[][]; note?: string }
export function reportHtml(company: string, identifier: string, period: string, sections: ReportSection[]) {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${escapeHtml(company)} · Reporte contable</title><style>body{font:12px Arial;color:#172b29;margin:24px}h1{font-size:22px}h2{font-size:16px;margin-top:28px}table{border-collapse:collapse;width:100%;margin:12px 0}th,td{padding:7px;border-bottom:1px solid #ddd;text-align:left}th{background:#eff5f3}thead{display:table-header-group}tr{break-inside:avoid}.note{color:#555}@page{size:A4 landscape;margin:12mm}@media print{button{display:none}}</style></head><body><h1>${escapeHtml(company)}</h1><p>${escapeHtml(identifier)} · ${escapeHtml(period)} · USD</p><button onclick="window.print()">Imprimir / guardar como PDF</button>${sections.map(section => `<h2>${escapeHtml(section.title)}</h2>${section.note ? `<p class="note">${escapeHtml(section.note)}</p>` : ''}<table><thead><tr>${section.headers.map(header => `<th>${escapeHtml(header)}</th>`).join('')}</tr></thead><tbody>${section.rows.length ? section.rows.map(row => `<tr>${row.map(cell => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('') : '<tr><td>Sin movimientos en el período.</td></tr>'}</tbody></table>`).join('')}<p class="note">Preparado con registros de Fina Pyme. Revisar partidas y datos fiscales antes de presentar declaraciones. No constituye envío a Hacienda.</p></body></html>`;
}
export function printReport(html: string) {
  const report = window.open('', '_blank');
  if (!report) throw new Error('Permite abrir ventanas para imprimir este reporte.');
  report.document.write(html); report.document.close(); report.focus();
}
