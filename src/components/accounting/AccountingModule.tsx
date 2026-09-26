import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  BookOpenCheck,
  FileSpreadsheet,
  Layers,
  Scale,
  DollarSign,
  Download,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Eye,
  Plus,
  X,
  Printer,
} from 'lucide-react';
import { JournalEntry, AccountNode } from '../../types';
import { formatCurrencyUSD } from '../../utils/salvadoranTax';

export const AccountingModule: React.FC = () => {
  const {
    chartOfAccounts,
    journalEntries,
    invoices,
    purchases,
    currentCompany,
    createManualJournalEntry,
  } = useERP();

  const [activeTab, setActiveTab] = useState<
    'journal' | 'trial_balance' | 'income_statement' | 'balance_sheet' | 'vat_books' | 'chart'
  >('journal');

  const [vatBookType, setVatBookType] = useState<'ventas_ccf' | 'ventas_cf' | 'compras' | 'f07_summary'>('ventas_ccf');
  const [searchTerm, setSearchTerm] = useState('');
  const [isManualEntryModalOpen, setIsManualEntryModalOpen] = useState(false);

  // Manual Entry Form State
  const [entryDate, setEntryDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [entryConcept, setEntryConcept] = useState<string>('');
  const [entryLines, setEntryLines] = useState<
    Array<{
      accountCode: string;
      accountName: string;
      debit: number;
      credit: number;
      concept: string;
    }>
  >([
    {
      accountCode: chartOfAccounts[0]?.code || '1101-01',
      accountName: chartOfAccounts[0]?.name || 'Caja General',
      debit: 100,
      credit: 0,
      concept: 'Registro débito',
    },
    {
      accountCode: chartOfAccounts[1]?.code || '1101-02-01',
      accountName: chartOfAccounts[1]?.name || 'Banco Agrícola',
      debit: 0,
      credit: 100,
      concept: 'Registro crédito',
    },
  ]);

  const totalManualDebit = entryLines.reduce((acc, l) => acc + l.debit, 0);
  const totalManualCredit = entryLines.reduce((acc, l) => acc + l.credit, 0);
  const isManualBalanced = Math.abs(totalManualDebit - totalManualCredit) < 0.005;

  const handleAddLine = () => {
    const acc = chartOfAccounts[0];
    setEntryLines([
      ...entryLines,
      {
        accountCode: acc?.code || '1101-01',
        accountName: acc?.name || 'Caja General',
        debit: 0,
        credit: 0,
        concept: 'Línea de ajuste',
      },
    ]);
  };

  const handleAccountChange = (index: number, code: string) => {
    const acc = chartOfAccounts.find((a) => a.code === code);
    if (!acc) return;
    setEntryLines((prev) =>
      prev.map((l, i) =>
        i === index ? { ...l, accountCode: acc.code, accountName: acc.name } : l
      )
    );
  };

  const handleDebitChange = (index: number, val: number) => {
    setEntryLines((prev) =>
      prev.map((l, i) => (i === index ? { ...l, debit: Math.max(0, val), credit: 0 } : l))
    );
  };

  const handleCreditChange = (index: number, val: number) => {
    setEntryLines((prev) =>
      prev.map((l, i) => (i === index ? { ...l, credit: Math.max(0, val), debit: 0 } : l))
    );
  };

  const handleRemoveLine = (index: number) => {
    if (entryLines.length > 2) {
      setEntryLines((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmitManualEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isManualBalanced) {
      alert('La partida está descuadrada. La suma de débitos debe ser igual a créditos.');
      return;
    }

    createManualJournalEntry({
      date: entryDate,
      concept: entryConcept,
      sourceModule: 'manual',
      referenceDoc: `AJU-${Date.now().toString().slice(-4)}`,
      status: 'asentada',
      lines: entryLines.map((l) => ({
        ...l,
      })),
    });

    setIsManualEntryModalOpen(false);
    setEntryConcept('');
  };

  // Calculate Trial Balance Balances
  const accountBalances = chartOfAccounts.map((acc) => {
    let debitSum = 0;
    let creditSum = 0;

    journalEntries.forEach((entry) => {
      entry.lines.forEach((line) => {
        if (line.accountCode.startsWith(acc.code)) {
          debitSum += line.debit;
          creditSum += line.credit;
        }
      });
    });

    const isDebitNature = acc.category === 'activo' || acc.category === 'costos' || acc.category === 'gastos';
    const finalBalance = isDebitNature ? debitSum - creditSum : creditSum - debitSum;

    return {
      ...acc,
      debitSum,
      creditSum,
      finalBalance,
    };
  });

  // Calculate Income Statement (P&L)
  const incomeAccounts = accountBalances.filter((a) => a.category === 'ingresos' && a.isMovement);
  const costAccounts = accountBalances.filter((a) => a.category === 'costos' && a.isMovement);
  const expenseAccounts = accountBalances.filter((a) => a.category === 'gastos' && a.isMovement);

  const totalIngresos = incomeAccounts.reduce((acc, a) => acc + a.finalBalance, 0);
  const totalCostos = costAccounts.reduce((acc, a) => acc + a.finalBalance, 0);
  const utilidadBruta = totalIngresos - totalCostos;
  const totalGastos = expenseAccounts.reduce((acc, a) => acc + a.finalBalance, 0);
  const utilidadNetaOperativa = utilidadBruta - totalGastos;

  // Calculate Balance Sheet
  const activeAssets = accountBalances.filter((a) => a.category === 'activo' && a.isMovement);
  const activeLiabilities = accountBalances.filter((a) => a.category === 'pasivo' && a.isMovement);
  const activeEquity = accountBalances.filter((a) => a.category === 'patrimonio' && a.isMovement);

  const totalActivo = activeAssets.reduce((acc, a) => acc + a.finalBalance, 0);
  const totalPasivo = activeLiabilities.reduce((acc, a) => acc + a.finalBalance, 0);
  const totalPatrimonio = activeEquity.reduce((acc, a) => acc + a.finalBalance, 0) + utilidadNetaOperativa;

  // F-07 VAT Totals
  const ventasCCF = invoices.filter((i) => i.type === 'credito_fiscal' && i.status !== 'anulada');
  const ventasCF = invoices.filter((i) => i.type === 'factura_consumidor_final' && i.status !== 'anulada');
  const totalDebitoFiscal = ventasCCF.reduce((acc, i) => acc + i.iva13, 0);
  const totalCreditoFiscal = purchases.reduce((acc, p) => acc + p.ivaCreditoFiscal, 0);
  const saldoIvaPeriodo = totalDebitoFiscal - totalCreditoFiscal;

  const exportToCSV = (filename: string, rows: string[][]) => {
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Contabilidad NIIF & Libros Tributarios IVA (MH)
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
              Partida Doble Automática
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Libro Diario General, Balance de Comprobación, Libros de IVA (F-07) y Estados Financieros clasificados.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsManualEntryModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Partida Manual / Ajuste</span>
          </button>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('journal')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
            activeTab === 'journal' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Libro Diario ({journalEntries.length})
        </button>
        <button
          onClick={() => setActiveTab('vat_books')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
            activeTab === 'vat_books' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Libros IVA & F-07 MH
        </button>
        <button
          onClick={() => setActiveTab('trial_balance')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
            activeTab === 'trial_balance' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Balance de Comprobación
        </button>
        <button
          onClick={() => setActiveTab('income_statement')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
            activeTab === 'income_statement' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Estado de Resultados (P&L)
        </button>
        <button
          onClick={() => setActiveTab('balance_sheet')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
            activeTab === 'balance_sheet' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Balance General NIIF
        </button>
        <button
          onClick={() => setActiveTab('chart')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
            activeTab === 'chart' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Catálogo NIIF ({chartOfAccounts.length})
        </button>
      </div>

      {/* Tab 1: Libro Diario General */}
      {activeTab === 'journal' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-500 font-medium">
              Mostrando {journalEntries.length} partidas contables en orden cronológico inverso
            </span>
            <button
              onClick={() => {
                const rows = [
                  ['N° Partida', 'Fecha', 'Módulo Origen', 'Concepto', 'Cuenta', 'Nombre Cuenta', 'Debe ($)', 'Haber ($)'],
                ];
                journalEntries.forEach((entry) => {
                  entry.lines.forEach((l) => {
                    rows.push([
                      entry.entryNumber.toString(),
                      entry.date,
                      entry.sourceModule,
                      `"${entry.concept}"`,
                      l.accountCode,
                      `"${l.accountName}"`,
                      l.debit.toFixed(2),
                      l.credit.toFixed(2),
                    ]);
                  });
                });
                exportToCSV(`Libro_Diario_${currentCompany.name}`, rows);
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Libro Diario CSV</span>
            </button>
          </div>

          <div className="space-y-4">
            {journalEntries.map((entry) => (
              <div
                key={entry.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden"
              >
                {/* Entry Header */}
                <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-indigo-600 text-white font-bold font-mono">
                      Partida N° {entry.entryNumber}
                    </span>
                    <span className="text-slate-500 font-mono">{entry.date}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-slate-200 dark:bg-slate-700 uppercase font-semibold">
                      {entry.sourceModule}
                    </span>
                  </div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-md">
                    {entry.concept}
                  </span>
                </div>

                {/* Entry Lines */}
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-100/60 dark:bg-slate-800/40 text-[10px] uppercase font-bold text-slate-500">
                    <tr>
                      <th className="p-2.5 w-32">Código</th>
                      <th className="p-2.5 font-sans">Cuenta Contable</th>
                      <th className="p-2.5 text-right w-32">Debe ($)</th>
                      <th className="p-2.5 text-right w-32">Haber ($)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {entry.lines.map((l, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="p-2.5 text-indigo-600 dark:text-indigo-400 font-semibold">
                          {l.accountCode}
                        </td>
                        <td className="p-2.5 font-sans text-slate-800 dark:text-slate-200">
                          {l.accountName}
                        </td>
                        <td className="p-2.5 text-right text-slate-900 dark:text-white font-bold">
                          {l.debit > 0 ? formatCurrencyUSD(l.debit) : formatCurrencyUSD(0)}
                        </td>
                        <td className="p-2.5 text-right text-slate-900 dark:text-white font-bold">
                          {l.credit > 0 ? formatCurrencyUSD(l.credit) : formatCurrencyUSD(0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50/80 dark:bg-slate-800/60 font-black border-t border-slate-200 dark:border-slate-800">
                    <tr>
                      <td colSpan={2} className="p-2.5 text-right font-sans uppercase text-[10px] text-slate-500">
                        Sumas Iguales:
                      </td>
                      <td className="p-2.5 text-right text-indigo-600 dark:text-indigo-400">
                        {formatCurrencyUSD(entry.totalDebit)}
                      </td>
                      <td className="p-2.5 text-right text-indigo-600 dark:text-indigo-400">
                        {formatCurrencyUSD(entry.totalCredit)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Libros Oficiales IVA (MH) */}
      {activeTab === 'vat_books' && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            <button
              onClick={() => setVatBookType('ventas_ccf')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                vatBookType === 'ventas_ccf' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Libro Ventas Contribuyentes (CCF)
            </button>
            <button
              onClick={() => setVatBookType('ventas_cf')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                vatBookType === 'ventas_cf' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Libro Ventas Consumidor Final
            </button>
            <button
              onClick={() => setVatBookType('compras')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                vatBookType === 'compras' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Libro de Compras
            </button>
            <button
              onClick={() => setVatBookType('f07_summary')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                vatBookType === 'f07_summary' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Resumen Declaración F-07 IVA
            </button>
          </div>

          {/* Sub-tab: Ventas CCF */}
          {vatBookType === 'ventas_ccf' && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Libro de Ventas a Contribuyentes (Crédito Fiscal) - Art. 141 Código Tributario SV
                </h3>
                <button
                  onClick={() => {
                    const rows = [
                      ['N° Emisión', 'Fecha', 'N° Comprobante', 'NRC', 'NIT', 'Cliente', 'Gravadas Locales', 'Débito Fiscal (13%)', 'IVA Retenido (1%)', 'Venta Total'],
                    ];
                    ventasCCF.forEach((v, idx) => {
                      rows.push([
                        (idx + 1).toString(),
                        v.date,
                        v.correlativeNumber,
                        v.customerNrc || '',
                        v.customerNit,
                        `"${v.customerName}"`,
                        v.sumasGravadas.toFixed(2),
                        v.iva13.toFixed(2),
                        v.ivaRetenido1.toFixed(2),
                        v.totalPagar.toFixed(2),
                      ]);
                    });
                    exportToCSV(`Libro_Ventas_CCF_${currentCompany.name}`, rows);
                  }}
                  className="px-3 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3 h-3" /> Exportar CSV
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] uppercase font-bold text-slate-500">
                    <tr>
                      <th className="p-3">N°</th>
                      <th className="p-3">Fecha</th>
                      <th className="p-3">N° CCF</th>
                      <th className="p-3">NRC</th>
                      <th className="p-3 font-sans">Cliente Receptor</th>
                      <th className="p-3 text-right">Gravadas ($)</th>
                      <th className="p-3 text-right">Débito 13% ($)</th>
                      <th className="p-3 text-right">Ret. 1% ($)</th>
                      <th className="p-3 text-right">Total ($)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {ventasCCF.map((v, idx) => (
                      <tr key={v.id}>
                        <td className="p-3">{idx + 1}</td>
                        <td className="p-3">{v.date}</td>
                        <td className="p-3 font-bold text-indigo-600">{v.correlativeNumber}</td>
                        <td className="p-3">{v.customerNrc || 'N/A'}</td>
                        <td className="p-3 font-sans font-medium text-slate-800 dark:text-slate-200">
                          {v.customerName}
                        </td>
                        <td className="p-3 text-right">{formatCurrencyUSD(v.sumasGravadas)}</td>
                        <td className="p-3 text-right text-indigo-600 font-bold">{formatCurrencyUSD(v.iva13)}</td>
                        <td className="p-3 text-right text-amber-600">{formatCurrencyUSD(v.ivaRetenido1)}</td>
                        <td className="p-3 text-right font-black">{formatCurrencyUSD(v.totalPagar)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sub-tab: Libro Compras */}
          {vatBookType === 'compras' && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Libro de Compras - Art. 141 Código Tributario SV
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] uppercase font-bold text-slate-500">
                    <tr>
                      <th className="p-3">N°</th>
                      <th className="p-3">Fecha</th>
                      <th className="p-3">N° Doc</th>
                      <th className="p-3">NRC</th>
                      <th className="p-3 font-sans">Proveedor</th>
                      <th className="p-3 text-right">Gravadas Locales</th>
                      <th className="p-3 text-right">Crédito Fiscal 13%</th>
                      <th className="p-3 text-right">Ret. Renta 10%</th>
                      <th className="p-3 text-right">Total Facturado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {purchases.map((p, idx) => (
                      <tr key={p.id}>
                        <td className="p-3">{idx + 1}</td>
                        <td className="p-3">{p.date}</td>
                        <td className="p-3 font-bold text-blue-600">{p.documentNumber}</td>
                        <td className="p-3">{p.supplierNrc || 'N/A'}</td>
                        <td className="p-3 font-sans font-medium text-slate-800 dark:text-slate-200">
                          {p.supplierName}
                        </td>
                        <td className="p-3 text-right">{formatCurrencyUSD(p.comprasGravadas + p.comprasSujetoExcluido)}</td>
                        <td className="p-3 text-right text-emerald-600 font-bold">{formatCurrencyUSD(p.ivaCreditoFiscal)}</td>
                        <td className="p-3 text-right text-purple-600">{formatCurrencyUSD(p.retencionRenta10)}</td>
                        <td className="p-3 text-right font-black">{formatCurrencyUSD(p.totalPagar)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sub-tab: Resumen F-07 IVA */}
          {vatBookType === 'f07_summary' && (
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Resumen para Declaración Jurada de IVA (Formulario F-07 MH)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Ministerio de Hacienda de El Salvador | Período Fiscal 2026
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                  Cálculo Oficial
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/70 dark:bg-indigo-950/40">
                  <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                    Total Débito Fiscal (IVA en Ventas)
                  </span>
                  <h4 className="text-xl font-black text-indigo-700 dark:text-indigo-300 mt-1 font-mono">
                    {formatCurrencyUSD(totalDebitoFiscal)}
                  </h4>
                </div>

                <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/70 dark:bg-emerald-950/40">
                  <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                    Total Crédito Fiscal (IVA en Compras)
                  </span>
                  <h4 className="text-xl font-black text-emerald-700 dark:text-emerald-300 mt-1 font-mono">
                    {formatCurrencyUSD(totalCreditoFiscal)}
                  </h4>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Resultado Neto IVA del Período
                  </span>
                  <h4
                    className={`text-xl font-black mt-1 font-mono ${
                      saldoIvaPeriodo >= 0 ? 'text-rose-600' : 'text-emerald-600'
                    }`}
                  >
                    {saldoIvaPeriodo >= 0
                      ? `Impuesto a Pagar: ${formatCurrencyUSD(saldoIvaPeriodo)}`
                      : `Remanente Crédito: ${formatCurrencyUSD(Math.abs(saldoIvaPeriodo))}`}
                  </h4>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Balance de Comprobación */}
      {activeTab === 'trial_balance' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Balance de Comprobación de Sumas y Saldos (NIIF para PYMES)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] uppercase font-bold text-slate-500">
                <tr>
                  <th className="p-3">Código</th>
                  <th className="p-3 font-sans">Cuenta Contable</th>
                  <th className="p-3 text-right">Sumas Debe ($)</th>
                  <th className="p-3 text-right">Sumas Haber ($)</th>
                  <th className="p-3 text-right">Saldo Deudor ($)</th>
                  <th className="p-3 text-right">Saldo Acreedor ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {accountBalances
                  .filter((a) => a.debitSum > 0 || a.creditSum > 0)
                  .map((a) => {
                    const isDebitNature = a.category === 'activo' || a.category === 'costos' || a.category === 'gastos';
                    const deudor = isDebitNature && a.finalBalance > 0 ? a.finalBalance : 0;
                    const acreedor = !isDebitNature && a.finalBalance > 0 ? a.finalBalance : 0;

                    return (
                      <tr key={a.code} className="hover:bg-slate-50/50">
                        <td className="p-3 font-bold text-indigo-600">{a.code}</td>
                        <td className="p-3 font-sans text-slate-800 dark:text-slate-200">{a.name}</td>
                        <td className="p-3 text-right">{formatCurrencyUSD(a.debitSum)}</td>
                        <td className="p-3 text-right">{formatCurrencyUSD(a.creditSum)}</td>
                        <td className="p-3 text-right font-bold text-slate-900 dark:text-white">
                          {deudor > 0 ? formatCurrencyUSD(deudor) : formatCurrencyUSD(0)}
                        </td>
                        <td className="p-3 text-right font-bold text-slate-900 dark:text-white">
                          {acreedor > 0 ? formatCurrencyUSD(acreedor) : formatCurrencyUSD(0)}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Estado de Resultados (P&L) */}
      {activeTab === 'income_statement' && (
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4 max-w-3xl mx-auto">
          <div className="text-center pb-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              {currentCompany.tradeName || currentCompany.name}
            </h2>
            <p className="text-xs font-bold text-indigo-600">ESTADO DE RESULTADOS INTEGRAL (P&L)</p>
            <p className="text-[11px] text-slate-400">Expresado en Dólares de los Estados Unidos (USD)</p>
          </div>

          <div className="space-y-3 text-xs font-mono">
            <div className="flex justify-between font-bold text-slate-900 dark:text-white">
              <span className="font-sans">INGRESOS DE ACTIVIDADES ORDINARIAS (VENTAS):</span>
              <span>{formatCurrencyUSD(totalIngresos)}</span>
            </div>

            <div className="flex justify-between text-rose-600 pl-4">
              <span className="font-sans">(-) COSTO DE VENTAS (MERCADERÍAS):</span>
              <span>-{formatCurrencyUSD(totalCostos)}</span>
            </div>

            <div className="flex justify-between font-black text-sm text-indigo-600 pt-2 border-t">
              <span className="font-sans">(=) UTILIDAD BRUTA:</span>
              <span>{formatCurrencyUSD(utilidadBruta)}</span>
            </div>

            <div className="flex justify-between text-rose-600 pl-4 pt-2">
              <span className="font-sans">(-) GASTOS DE ADMINISTRACIÓN & OPERACIÓN:</span>
              <span>-{formatCurrencyUSD(totalGastos)}</span>
            </div>

            <div className="flex justify-between font-black text-base text-emerald-600 pt-3 border-t-2 border-slate-900 dark:border-slate-100">
              <span className="font-sans">(=) UTILIDAD NETA DEL EJERCICIO:</span>
              <span>{formatCurrencyUSD(utilidadNetaOperativa)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Balance General NIIF */}
      {activeTab === 'balance_sheet' && (
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4 max-w-3xl mx-auto">
          <div className="text-center pb-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              {currentCompany.tradeName || currentCompany.name}
            </h2>
            <p className="text-xs font-bold text-indigo-600">ESTADO DE SITUACIÓN FINANCIERA (BALANCE GENERAL)</p>
            <p className="text-[11px] text-slate-400">NIIF para PYMES • Al período actual</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-mono">
            {/* Activos */}
            <div className="space-y-3">
              <h4 className="font-black text-sm text-indigo-900 dark:text-indigo-300 font-sans border-b pb-1">
                ACTIVO TOTAL
              </h4>
              {activeAssets.map((a) => (
                <div key={a.code} className="flex justify-between text-slate-700 dark:text-slate-300">
                  <span className="font-sans">{a.name}:</span>
                  <span>{formatCurrencyUSD(a.finalBalance)}</span>
                </div>
              ))}
              <div className="flex justify-between font-black text-indigo-600 pt-2 border-t">
                <span className="font-sans">TOTAL ACTIVO:</span>
                <span>{formatCurrencyUSD(totalActivo)}</span>
              </div>
            </div>

            {/* Pasivo y Patrimonio */}
            <div className="space-y-3">
              <h4 className="font-black text-sm text-slate-900 dark:text-slate-200 font-sans border-b pb-1">
                PASIVO Y PATRIMONIO
              </h4>
              {activeLiabilities.map((a) => (
                <div key={a.code} className="flex justify-between text-slate-700 dark:text-slate-300">
                  <span className="font-sans">{a.name}:</span>
                  <span>{formatCurrencyUSD(a.finalBalance)}</span>
                </div>
              ))}
              <div className="flex justify-between text-slate-700 dark:text-slate-300 pt-2 border-t">
                <span className="font-sans">Capital Social / Patrimonio:</span>
                <span>{formatCurrencyUSD(totalPatrimonio - utilidadNetaOperativa)}</span>
              </div>
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span className="font-sans">Utilidad Neta del Ejercicio:</span>
                <span>+{formatCurrencyUSD(utilidadNetaOperativa)}</span>
              </div>
              <div className="flex justify-between font-black text-slate-900 dark:text-white pt-2 border-t">
                <span className="font-sans">TOTAL PASIVO + PATRIMONIO:</span>
                <span>{formatCurrencyUSD(totalPasivo + totalPatrimonio)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Catálogo NIIF */}
      {activeTab === 'chart' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] uppercase font-bold text-slate-500">
              <tr>
                <th className="p-3">Código</th>
                <th className="p-3 font-sans">Nombre de la Cuenta</th>
                <th className="p-3">Categoría</th>
                <th className="p-3">Nivel</th>
                <th className="p-3 text-center">Tipo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {chartOfAccounts.map((a) => (
                <tr key={a.code} className={a.level === 1 ? 'font-bold bg-slate-50/50 dark:bg-slate-800/30' : ''}>
                  <td className="p-3 text-indigo-600">{a.code}</td>
                  <td className="p-3 font-sans" style={{ paddingLeft: `${a.level * 16}px` }}>
                    {a.name}
                  </td>
                  <td className="p-3 capitalize">{a.category}</td>
                  <td className="p-3">Nivel {a.level}</td>
                  <td className="p-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] ${
                        a.isMovement
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {a.isMovement ? 'Detalle' : 'Mayor'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL: Nueva Partida Manual */}
      {isManualEntryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-3xl my-8 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpenCheck className="w-5 h-5 text-indigo-600" />
                <span>Crear Partida Contable Manual (Libro Diario)</span>
              </h3>
              <button onClick={() => setIsManualEntryModalOpen(false)} className="cursor-pointer">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmitManualEntry} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Fecha:</label>
                  <input
                    type="date"
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Concepto / Glosa:</label>
                  <input
                    type="text"
                    placeholder="Ej: Registro de amortización o ajuste contable de fin de mes"
                    value={entryConcept}
                    onChange={(e) => setEntryConcept(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    required
                  />
                </div>
              </div>

              {/* Lines table */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800 dark:text-slate-200">Cuentas y Montos:</span>
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="text-indigo-600 font-bold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Agregar Línea
                  </button>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] text-slate-500 uppercase font-bold">
                      <tr>
                        <th className="p-2">Cuenta Contable</th>
                        <th className="p-2 text-right w-28">Debe ($)</th>
                        <th className="p-2 text-right w-28">Haber ($)</th>
                        <th className="p-2 w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                      {entryLines.map((line, idx) => (
                        <tr key={idx}>
                          <td className="p-2">
                            <select
                              value={line.accountCode}
                              onChange={(e) => handleAccountChange(idx, e.target.value)}
                              className="w-full p-1.5 rounded border border-slate-200 dark:border-slate-700 bg-transparent text-slate-800 dark:text-slate-200 font-sans"
                            >
                              {chartOfAccounts
                                .filter((a) => a.isMovement)
                                .map((a) => (
                                  <option key={a.code} value={a.code}>
                                    {a.code} - {a.name}
                                  </option>
                                ))}
                            </select>
                          </td>
                          <td className="p-2 text-right">
                            <input
                              type="number"
                              step="0.01"
                              value={line.debit || ''}
                              onChange={(e) => handleDebitChange(idx, parseFloat(e.target.value) || 0)}
                              className="w-24 p-1.5 rounded border border-slate-200 dark:border-slate-700 text-right bg-transparent text-slate-800 dark:text-slate-200"
                            />
                          </td>
                          <td className="p-2 text-right">
                            <input
                              type="number"
                              step="0.01"
                              value={line.credit || ''}
                              onChange={(e) => handleCreditChange(idx, parseFloat(e.target.value) || 0)}
                              className="w-24 p-1.5 rounded border border-slate-200 dark:border-slate-700 text-right bg-transparent text-slate-800 dark:text-slate-200"
                            />
                          </td>
                          <td className="p-2 text-center">
                            {entryLines.length > 2 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveLine(idx)}
                                className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 dark:bg-slate-800 font-bold border-t">
                      <tr>
                        <td className="p-2 text-right font-sans uppercase text-[10px]">Totales:</td>
                        <td className="p-2 text-right text-indigo-600">{formatCurrencyUSD(totalManualDebit)}</td>
                        <td className="p-2 text-right text-indigo-600">{formatCurrencyUSD(totalManualCredit)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {!isManualBalanced && (
                <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>
                    La partida está descuadrada por {formatCurrencyUSD(Math.abs(totalManualDebit - totalManualCredit))}. El Debe debe ser igual al Haber.
                  </span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsManualEntryModalOpen(false)} className="px-4 py-2 rounded-xl border">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!isManualBalanced}
                  className={`px-5 py-2 rounded-xl text-white font-bold ${
                    isManualBalanced ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-400 cursor-not-allowed'
                  }`}
                >
                  Asentar Partida en Diario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
