import React, { useRef, useState } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  Printer,
  Download,
  X,
  Building2,
  FileText,
  CheckCircle2,
  Calendar,
  Layers,
  ShieldCheck,
  DollarSign,
  Users,
  PenTool,
  Clock,
  Briefcase,
  TrendingUp,
} from 'lucide-react';
import { formatCurrencyUSD } from '../../utils/salvadoranTax';
import { Invoice, Purchase, Payroll, PayrollDetail } from '../../types';

export type ReportType =
  | 'executive_board_report'
  | 'income_statement'
  | 'balance_sheet'
  | 'real_cash_flow'
  | 'payroll_summary'
  | 'payroll_slip'
  | 'payroll_all_slips'
  | 'professional_services_book'
  | 'sales_ccf_book'
  | 'sales_cf_book'
  | 'purchases_book'
  | 'invoice_dte';

interface PDFReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: ReportType;
  title: string;
  subtitle?: string;
  data?: any;
}

export const PDFReportModal: React.FC<PDFReportModalProps> = ({
  isOpen,
  onClose,
  reportType,
  title,
  subtitle,
  data,
}) => {
  const {
    currentCompany,
    chartOfAccounts,
    invoices,
    purchases,
    payrolls,
    employees,
    bankAccounts,
    realCashFlowSummary,
    fiscalConfig,
    professionalServices,
  } = useERP();

  const printAreaRef = useRef<HTMLDivElement>(null);

  // Editable Signature State
  const [signer1Name, setSigner1Name] = useState('Lic. Carlos Henríquez');
  const [signer1Title, setSigner1Title] = useState('Representante Legal / CEO');

  const [signer2Name, setSigner2Name] = useState('Licda. Brenda Marroquín');
  const [signer2Title, setSigner2Title] = useState('Contador General (CPA #48291)');

  const [signer3Name, setSigner3Name] = useState('Ing. Rodrigo Melgar');
  const [signer3Title, setSigner3Title] = useState('Director de Finanzas / Auditor');

  const [showSignatureSettings, setShowSignatureSettings] = useState(false);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  // Computations for Financial Statements & Executive Dashboard Report
  const revenueAccounts = chartOfAccounts.filter((a) => a.category === 'ingresos');
  const totalRevenue = revenueAccounts.reduce((acc, a) => acc + (a.creditBalance - a.debitBalance), 0);

  const costAccounts = chartOfAccounts.filter((a) => a.category === 'costos');
  const totalCosts = costAccounts.reduce((acc, a) => acc + (a.debitBalance - a.creditBalance), 0);
  const grossProfit = totalRevenue - totalCosts;

  const expenseAccounts = chartOfAccounts.filter((a) => a.category === 'gastos');
  const totalExpenses = expenseAccounts.reduce((acc, a) => acc + (a.debitBalance - a.creditBalance), 0);
  const netIncome = grossProfit - totalExpenses;

  // Balance Sheet Computations
  const assetAccounts = chartOfAccounts.filter((a) => a.category === 'activo');
  const totalAssets = assetAccounts.reduce((acc, a) => acc + (a.debitBalance - a.creditBalance), 0);

  const liabilityAccounts = chartOfAccounts.filter((a) => a.category === 'pasivo');
  const totalLiabilities = liabilityAccounts.reduce((acc, a) => acc + (a.creditBalance - a.debitBalance), 0);

  const equityAccounts = chartOfAccounts.filter((a) => a.category === 'patrimonio');
  const totalEquity = equityAccounts.reduce((acc, a) => acc + (a.creditBalance - a.debitBalance), 0) + netIncome;

  // Dashboard Data for Executive Report
  const totalSales = invoices.reduce((acc, inv) => acc + inv.totalPagar, 0);
  const totalPurchasesAmount = purchases.reduce((acc, pur) => acc + pur.totalPagar, 0);

  const pendingCxcInvoices = invoices.filter(
    (inv) => inv.status !== 'anulada' && inv.saldoPendiente > 0
  );
  const totalCxcPendiente = pendingCxcInvoices.reduce((acc, inv) => acc + inv.saldoPendiente, 0);

  const pendingCxpPurchases = purchases.filter(
    (pur) => pur.status !== 'anulada' && pur.saldoPendiente > 0
  );
  const totalCxpPendiente = pendingCxpPurchases.reduce((acc, pur) => acc + pur.saldoPendiente, 0);

  const totalLiquidCash = bankAccounts.reduce((acc, b) => acc + b.currentBalance, 0);

  const latestPayroll = payrolls[0];
  const totalPayrollDevengado = latestPayroll ? latestPayroll.totalDevengado : employees.reduce((a, e) => a + e.baseSalary, 0);
  const totalPayrollPatronal = latestPayroll
    ? latestPayroll.totalIsssPatronal + latestPayroll.totalAfpPatronal + latestPayroll.totalInsaforpPatronal + latestPayroll.totalProvisiones
    : totalPayrollDevengado * 0.34;
  const totalPayrollCostoEmpresa = latestPayroll ? latestPayroll.costoTotalEmpresa : totalPayrollDevengado + totalPayrollPatronal;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Top Modal Controls */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                Reporte Ejecutivo para Análisis & Toma de Decisiones
              </h3>
              <p className="text-[11px] text-slate-500">{title}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSignatureSettings(!showSignatureSettings)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <PenTool className="w-3.5 h-3.5 text-indigo-500" />
              <span>Configurar Nombres de Firmas</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / Guardar en PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Signature Settings Drawer (Optional toggle) */}
        {showSignatureSettings && (
          <div className="p-4 bg-indigo-50/70 dark:bg-slate-800/90 border-b border-indigo-100 dark:border-slate-700 text-xs animate-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-indigo-950 dark:text-indigo-200">
                Personalizar Nombres y Cargos de Quienes Firman el Reporte:
              </span>
              <button
                onClick={() => setShowSignatureSettings(false)}
                className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
              >
                Listo
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">Firma 1 (Nombre):</label>
                <input
                  type="text"
                  value={signer1Name}
                  onChange={(e) => setSigner1Name(e.target.value)}
                  className="w-full p-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs font-medium"
                />
                <input
                  type="text"
                  value={signer1Title}
                  onChange={(e) => setSigner1Title(e.target.value)}
                  placeholder="Cargo..."
                  className="w-full p-1 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-[10px] text-slate-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">Firma 2 (Nombre):</label>
                <input
                  type="text"
                  value={signer2Name}
                  onChange={(e) => setSigner2Name(e.target.value)}
                  className="w-full p-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs font-medium"
                />
                <input
                  type="text"
                  value={signer2Title}
                  onChange={(e) => setSigner2Title(e.target.value)}
                  placeholder="Cargo..."
                  className="w-full p-1 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-[10px] text-slate-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">Firma 3 (Nombre):</label>
                <input
                  type="text"
                  value={signer3Name}
                  onChange={(e) => setSigner3Name(e.target.value)}
                  className="w-full p-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs font-medium"
                />
                <input
                  type="text"
                  value={signer3Title}
                  onChange={(e) => setSigner3Title(e.target.value)}
                  placeholder="Cargo..."
                  className="w-full p-1 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-[10px] text-slate-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Printable Report Container */}
        <div className="p-6 lg:p-8 overflow-y-auto flex-1 bg-white text-slate-900 font-sans" ref={printAreaRef}>
          {/* Header of the Official Document */}
          <div className="border-b-2 border-slate-800 pb-3 mb-4">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-lg font-black tracking-tight text-slate-900 uppercase">
                  {currentCompany.name}
                </h1>
                <p className="text-xs font-bold text-slate-700">
                  {currentCompany.tradeName}
                </p>
                <div className="text-[10px] text-slate-600 mt-0.5 space-y-0.5">
                  <p>
                    <span className="font-semibold">NIT:</span> {currentCompany.nit} |{' '}
                    <span className="font-semibold">NRC:</span> {currentCompany.nrc} |{' '}
                    <span className="font-semibold">Giro:</span> {currentCompany.giro}
                  </p>
                  <p>{currentCompany.address}, {currentCompany.department}, El Salvador</p>
                </div>
              </div>

              <div className="text-right">
                <div className="inline-block px-2 py-0.5 bg-slate-900 text-white rounded text-[10px] font-mono font-bold uppercase tracking-wider mb-1">
                  SIVARFLOW ERP • INFORME CORPORATIVO
                </div>
                <p className="text-[10px] text-slate-500 font-mono">
                  Fecha: {new Date().toLocaleDateString('es-SV', { dateStyle: 'long' })}
                </p>
                <p className="text-[10px] text-slate-500 font-mono">
                  Moneda: Dólares de los Estados Unidos (USD $)
                </p>
              </div>
            </div>

            <div className="mt-2 pt-2 border-t border-slate-200 text-center">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                {title}
              </h2>
              {subtitle && <p className="text-[11px] text-slate-600 italic mt-0.5">{subtitle}</p>}
            </div>
          </div>

          {/* DYNAMIC REPORT CONTENT ACCORDING TO TYPE */}

          {/* 0. TABLERO DE CONTROL EJECUTIVO COMPLETO (EXECUTIVE BOARD REPORT - 1 PÁGINA) */}
          {reportType === 'executive_board_report' && (
            <div className="space-y-4 text-xs">
              {/* Sección 1: Cuadro de Métricas Principales (KPIs) */}
              <div className="grid grid-cols-5 gap-2 p-2.5 bg-slate-100 border border-slate-300 rounded-xl">
                <div>
                  <span className="text-[9px] text-slate-500 uppercase font-bold block">Ventas Facturadas</span>
                  <span className="text-xs font-black text-slate-900 font-mono">
                    {formatCurrencyUSD(totalSales)}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 uppercase font-bold block">Compras & Gastos</span>
                  <span className="text-xs font-black text-slate-900 font-mono">
                    {formatCurrencyUSD(totalPurchasesAmount)}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-amber-700 uppercase font-bold block">Por Cobrar (CxC)</span>
                  <span className="text-xs font-black text-amber-800 font-mono">
                    {formatCurrencyUSD(totalCxcPendiente)}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-rose-700 uppercase font-bold block">Por Pagar (CxP)</span>
                  <span className="text-xs font-black text-rose-800 font-mono">
                    {formatCurrencyUSD(totalCxpPendiente)}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-indigo-700 uppercase font-bold block">Liquidez Inmediata</span>
                  <span className="text-xs font-black text-indigo-900 font-mono">
                    {formatCurrencyUSD(totalLiquidCash)}
                  </span>
                </div>
              </div>

              {/* Sección 2: Dos Columnas (CxC vs CxP) */}
              <div className="grid grid-cols-2 gap-4">
                {/* CxC - Cuentas por Cobrar */}
                <div className="border border-slate-300 rounded-xl p-2.5 space-y-1.5">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-1">
                    <span className="font-bold text-[11px] text-slate-900 uppercase">
                      Cuentas por Cobrar a Clientes (CxC)
                    </span>
                    <span className="font-mono font-bold text-amber-700 text-xs">
                      {formatCurrencyUSD(totalCxcPendiente)}
                    </span>
                  </div>
                  <table className="w-full text-[10px] text-left">
                    <thead className="text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="py-0.5">Cliente / Documento</th>
                        <th className="py-0.5 text-right">Vence</th>
                        <th className="py-0.5 text-right">Saldo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pendingCxcInvoices.map((inv) => (
                        <tr key={inv.id}>
                          <td className="py-1">
                            <span className="font-semibold block truncate max-w-[150px]">{inv.customerName}</span>
                            <span className="text-slate-400 font-mono text-[9px]">{inv.correlativeNumber}</span>
                          </td>
                          <td className="py-1 text-right font-mono text-slate-600">{inv.dueDate}</td>
                          <td className="py-1 text-right font-mono font-bold text-slate-900">
                            {formatCurrencyUSD(inv.saldoPendiente)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* CxP - Cuentas por Pagar */}
                <div className="border border-slate-300 rounded-xl p-2.5 space-y-1.5">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-1">
                    <span className="font-bold text-[11px] text-slate-900 uppercase">
                      Cuentas por Pagar a Proveedores (CxP)
                    </span>
                    <span className="font-mono font-bold text-rose-700 text-xs">
                      {formatCurrencyUSD(totalCxpPendiente)}
                    </span>
                  </div>
                  <table className="w-full text-[10px] text-left">
                    <thead className="text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="py-0.5">Proveedor / CCF</th>
                        <th className="py-0.5 text-right">Vence</th>
                        <th className="py-0.5 text-right">Saldo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pendingCxpPurchases.map((pur) => (
                        <tr key={pur.id}>
                          <td className="py-1">
                            <span className="font-semibold block truncate max-w-[150px]">{pur.supplierName}</span>
                            <span className="text-slate-400 font-mono text-[9px]">{pur.documentNumber}</span>
                          </td>
                          <td className="py-1 text-right font-mono text-slate-600">{pur.dueDate}</td>
                          <td className="py-1 text-right font-mono font-bold text-slate-900">
                            {formatCurrencyUSD(pur.saldoPendiente)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sección 3: Planilla & Costos Patronales del Empresario vs Bancos */}
              <div className="grid grid-cols-2 gap-4">
                {/* Planilla y Cargas Patronales */}
                <div className="border border-slate-300 rounded-xl p-2.5 space-y-1.5 bg-slate-50/50">
                  <span className="font-bold text-[11px] text-slate-900 uppercase block border-b border-slate-200 pb-1">
                    Planilla & Cargas Patronales (ISSS, AFP, INSAFORP)
                  </span>
                  <div className="space-y-1 text-[10px] text-slate-700">
                    <div className="flex justify-between">
                      <span>Sueldos Nominales Devengados ({employees.length} empleados):</span>
                      <span className="font-mono">{formatCurrencyUSD(totalPayrollDevengado)}</span>
                    </div>
                    <div className="flex justify-between text-rose-700">
                      <span>(+) Aportes Patronales (ISSS 7.5%, AFP 8.75%, INSAFORP 1%):</span>
                      <span className="font-mono font-semibold">
                        +{formatCurrencyUSD((latestPayroll?.totalIsssPatronal || 0) + (latestPayroll?.totalAfpPatronal || 0) + (latestPayroll?.totalInsaforpPatronal || 0))}
                      </span>
                    </div>
                    <div className="flex justify-between text-amber-700">
                      <span>(+) Provisiones de Ley (Aguinaldo + Vacación + Indem):</span>
                      <span className="font-mono font-semibold">
                        +{formatCurrencyUSD(latestPayroll?.totalProvisiones || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between font-black pt-1 border-t border-slate-200 text-slate-900 text-[11px]">
                      <span>COSTO TOTAL REAL PLANILLA EMPRESA:</span>
                      <span className="font-mono text-rose-700">{formatCurrencyUSD(totalPayrollCostoEmpresa)}</span>
                    </div>
                  </div>
                </div>

                {/* Posición de Cajas y Bancos */}
                <div className="border border-slate-300 rounded-xl p-2.5 space-y-1.5 bg-slate-50/50">
                  <span className="font-bold text-[11px] text-slate-900 uppercase block border-b border-slate-200 pb-1">
                    Disponibilidad Bancaria & Cajas
                  </span>
                  <div className="space-y-1 text-[10px] text-slate-700">
                    {bankAccounts.map((b) => (
                      <div key={b.id} className="flex justify-between">
                        <span className="truncate max-w-[170px]">{b.accountName}:</span>
                        <span className="font-mono font-semibold text-slate-900">{formatCurrencyUSD(b.currentBalance)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between font-black pt-1 border-t border-slate-200 text-slate-900 text-[11px]">
                      <span>TOTAL DISPONIBLE EN BANCOS:</span>
                      <span className="font-mono text-indigo-900">{formatCurrencyUSD(totalLiquidCash)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sección 4: Resumen de Flujo de Caja y Utilidad */}
              <div className="p-2 border border-slate-300 rounded-xl bg-slate-100 flex justify-between items-center text-[10px] font-mono">
                <div>
                  <span className="text-slate-500 font-sans block">Flujo Neto del Mes:</span>
                  <span className={`font-black text-xs ${realCashFlowSummary.netCashFlow >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {formatCurrencyUSD(realCashFlowSummary.netCashFlow)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-sans block">Utilidad Neta P&L:</span>
                  <span className={`font-black text-xs ${netIncome >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {formatCurrencyUSD(netIncome)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-sans block">Crédito Fiscal IVA Disponible:</span>
                  <span className="font-black text-xs text-slate-900">
                    {formatCurrencyUSD(totalPurchasesAmount * 0.13)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 1. ESTADO DE RESULTADOS (P&L) */}
          {reportType === 'income_statement' && (
            <div className="space-y-4 text-xs">
              <div className="space-y-2">
                <div className="flex justify-between py-1 border-b border-slate-300 font-bold bg-slate-100 px-2">
                  <span>1. INGRESOS DE ACTIVIDADES ORDINARIAS</span>
                  <span>{formatCurrencyUSD(totalRevenue)}</span>
                </div>
                {revenueAccounts.map((a) => (
                  <div key={a.code} className="flex justify-between pl-4 pr-2 text-slate-700">
                    <span>{a.code} - {a.name}</span>
                    <span>{formatCurrencyUSD(a.creditBalance - a.debitBalance)}</span>
                  </div>
                ))}

                <div className="flex justify-between py-1 border-b border-slate-300 font-bold bg-slate-100 px-2 mt-3">
                  <span>2. MENOS: COSTOS DE VENTA Y PRODUCCIÓN</span>
                  <span className="text-rose-700">({formatCurrencyUSD(totalCosts)})</span>
                </div>
                {costAccounts.map((a) => (
                  <div key={a.code} className="flex justify-between pl-4 pr-2 text-slate-700">
                    <span>{a.code} - {a.name}</span>
                    <span>{formatCurrencyUSD(a.debitBalance - a.creditBalance)}</span>
                  </div>
                ))}

                <div className="flex justify-between py-1.5 border-y-2 border-slate-800 font-extrabold bg-slate-50 px-2 mt-2">
                  <span>UTILIDAD BRUTA</span>
                  <span>{formatCurrencyUSD(grossProfit)}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-300 font-bold bg-slate-100 px-2 mt-3">
                  <span>3. MENOS: GASTOS DE OPERACIÓN Y ADMINISTRACIÓN</span>
                  <span className="text-rose-700">({formatCurrencyUSD(totalExpenses)})</span>
                </div>
                {expenseAccounts.map((a) => (
                  <div key={a.code} className="flex justify-between pl-4 pr-2 text-slate-700">
                    <span>{a.code} - {a.name}</span>
                    <span>{formatCurrencyUSD(a.debitBalance - a.creditBalance)}</span>
                  </div>
                ))}

                <div className="flex justify-between py-2 border-t-2 border-b-4 border-slate-900 font-black text-sm bg-slate-100 px-2 mt-4">
                  <span>UTILIDAD NETA DEL EJERCICIO</span>
                  <span className={netIncome >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                    {formatCurrencyUSD(netIncome)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 2. BALANCE GENERAL */}
          {reportType === 'balance_sheet' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              {/* ACTIVO */}
              <div className="space-y-3">
                <div className="flex justify-between py-1.5 border-b-2 border-slate-800 font-bold bg-slate-100 px-2">
                  <span>ACTIVO</span>
                  <span>{formatCurrencyUSD(totalAssets)}</span>
                </div>
                {assetAccounts.map((a) => (
                  <div key={a.code} className="flex justify-between px-2 text-slate-700">
                    <span className={a.level <= 2 ? 'font-bold text-slate-900' : 'pl-3'}>
                      {a.code} - {a.name}
                    </span>
                    <span>{formatCurrencyUSD(a.debitBalance - a.creditBalance)}</span>
                  </div>
                ))}
                <div className="flex justify-between py-1.5 border-t-2 border-slate-800 font-extrabold px-2 bg-slate-50">
                  <span>TOTAL ACTIVO</span>
                  <span>{formatCurrencyUSD(totalAssets)}</span>
                </div>
              </div>

              {/* PASIVO & PATRIMONIO */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between py-1.5 border-b-2 border-slate-800 font-bold bg-slate-100 px-2">
                    <span>PASIVO</span>
                    <span>{formatCurrencyUSD(totalLiabilities)}</span>
                  </div>
                  {liabilityAccounts.map((a) => (
                    <div key={a.code} className="flex justify-between px-2 text-slate-700">
                      <span className={a.level <= 2 ? 'font-bold text-slate-900' : 'pl-3'}>
                        {a.code} - {a.name}
                      </span>
                      <span>{formatCurrencyUSD(a.creditBalance - a.debitBalance)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-1 border-t border-slate-400 font-bold px-2">
                    <span>TOTAL PASIVO</span>
                    <span>{formatCurrencyUSD(totalLiabilities)}</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex justify-between py-1.5 border-b-2 border-slate-800 font-bold bg-slate-100 px-2">
                    <span>PATRIMONIO NETO</span>
                    <span>{formatCurrencyUSD(totalEquity)}</span>
                  </div>
                  {equityAccounts.map((a) => (
                    <div key={a.code} className="flex justify-between px-2 text-slate-700">
                      <span className="pl-3">{a.code} - {a.name}</span>
                      <span>{formatCurrencyUSD(a.creditBalance - a.debitBalance)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between px-2 text-slate-700 pl-3">
                    <span>Resultado del Ejercicio Actual</span>
                    <span>{formatCurrencyUSD(netIncome)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-t border-slate-400 font-bold px-2">
                    <span>TOTAL PATRIMONIO</span>
                    <span>{formatCurrencyUSD(totalEquity)}</span>
                  </div>
                </div>

                <div className="flex justify-between py-1.5 border-t-2 border-b-4 border-slate-900 font-extrabold px-2 bg-slate-100">
                  <span>TOTAL PASIVO + PATRIMONIO</span>
                  <span>{formatCurrencyUSD(totalLiabilities + totalEquity)}</span>
                </div>
              </div>
            </div>
          )}

          {/* 3. FLUJO DE EFECTIVO REAL */}
          {reportType === 'real_cash_flow' && (
            <div className="space-y-4 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-300 font-bold bg-slate-50 px-2">
                <span>SALDO INICIAL DE EFECTIVO Y BANCOS</span>
                <span className="font-mono">{formatCurrencyUSD(realCashFlowSummary.openingCash)}</span>
              </div>

              {/* ENTRADAS */}
              <div>
                <div className="font-bold text-slate-800 uppercase py-1 border-b border-slate-200 bg-slate-100 px-2">
                  (+) ENTRADAS REALES DE EFECTIVO
                </div>
                <div className="divide-y divide-slate-100 pl-4 pr-2">
                  <div className="flex justify-between py-1 text-slate-700">
                    <span>Ventas de Contado efectivamente cobradas</span>
                    <span>{formatCurrencyUSD(realCashFlowSummary.inflowsContadoSales)}</span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-700">
                    <span>Cobros de Cuentas por Cobrar (CxC a Clientes)</span>
                    <span>{formatCurrencyUSD(realCashFlowSummary.inflowsCxcCollections)}</span>
                  </div>
                </div>
                <div className="flex justify-between py-1 border-t border-slate-300 font-bold px-2 text-emerald-700 bg-emerald-50/50">
                  <span>TOTAL ENTRADAS</span>
                  <span>{formatCurrencyUSD(realCashFlowSummary.totalInflows)}</span>
                </div>
              </div>

              {/* SALIDAS */}
              <div>
                <div className="font-bold text-slate-800 uppercase py-1 border-b border-slate-200 bg-slate-100 px-2">
                  (-) SALIDAS REALES DE EFECTIVO
                </div>
                <div className="divide-y divide-slate-100 pl-4 pr-2">
                  <div className="flex justify-between py-1 text-slate-700">
                    <span>Compras al contado pagadas</span>
                    <span>{formatCurrencyUSD(realCashFlowSummary.outflowsContadoPurchases)}</span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-700">
                    <span>Pagos de Cuentas por Pagar (CxP a Proveedores)</span>
                    <span>{formatCurrencyUSD(realCashFlowSummary.outflowsCxpPayments)}</span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-700">
                    <span>Pago de Sueldos Líquidos a Colaboradores</span>
                    <span>{formatCurrencyUSD(realCashFlowSummary.outflowsPayrollNet)}</span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-700">
                    <span>Aportes Patronales Planilla (ISSS 7.5%, AFP 8.75%, INSAFORP 1%)</span>
                    <span>{formatCurrencyUSD(realCashFlowSummary.outflowsPayrollTaxesPatronal)}</span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-700">
                    <span>Obligaciones Tributarias Ministerio de Hacienda (IVA F-07 + Pago a Cuenta)</span>
                    <span>{formatCurrencyUSD(realCashFlowSummary.outflowsTaxesMH)}</span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-700">
                    <span>Gastos Operacionales & Servicios</span>
                    <span>{formatCurrencyUSD(realCashFlowSummary.outflowsOperating)}</span>
                  </div>
                </div>
                <div className="flex justify-between py-1 border-t border-slate-300 font-bold px-2 text-rose-700 bg-rose-50/50">
                  <span>TOTAL SALIDAS</span>
                  <span>{formatCurrencyUSD(realCashFlowSummary.totalOutflows)}</span>
                </div>
              </div>

              {/* CIERRE */}
              <div className="border-t-2 border-b-4 border-slate-900 py-2 px-2 bg-slate-100 space-y-1">
                <div className="flex justify-between font-bold">
                  <span>FLUJO NETO DEL PERÍODO</span>
                  <span className={realCashFlowSummary.netCashFlow >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                    {formatCurrencyUSD(realCashFlowSummary.netCashFlow)}
                  </span>
                </div>
                <div className="flex justify-between font-black text-sm">
                  <span>SALDO FINAL EN CAJAS Y BANCOS</span>
                  <span>{formatCurrencyUSD(realCashFlowSummary.closingCash)}</span>
                </div>
              </div>
            </div>
          )}

          {/* 4. BOLETA DE PAGO INDIVIDUAL */}
          {reportType === 'payroll_slip' && data && (
            <div className="space-y-4 text-xs border border-slate-300 rounded-xl p-4">
              <div className="grid grid-cols-2 gap-4 pb-3 border-b border-slate-200">
                <div>
                  <p className="font-bold text-sm text-slate-900">{data.employeeName}</p>
                  <p className="text-slate-600">Cargo: {data.position}</p>
                  <p className="text-slate-600">DUI: {data.dui}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-800">Recibo de Sueldo y Retenciones</p>
                  <p className="text-slate-500">Período Fiscal: Agosto 2026</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-bold text-slate-800 uppercase mb-1">Ingresos Devengados</h4>
                  <div className="space-y-1 text-slate-700">
                    <div className="flex justify-between">
                      <span>Sueldo Base Período:</span>
                      <span>{formatCurrencyUSD(data.baseSalary)}</span>
                    </div>
                    {data.overtimePay > 0 && (
                      <div className="flex justify-between">
                        <span>Horas Extras:</span>
                        <span>{formatCurrencyUSD(data.overtimePay)}</span>
                      </div>
                    )}
                    {data.bonuses > 0 && (
                      <div className="flex justify-between">
                        <span>Bonificaciones:</span>
                        <span>{formatCurrencyUSD(data.bonuses)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold pt-1 border-t border-slate-200">
                      <span>Total Devengado:</span>
                      <span>{formatCurrencyUSD(data.totalDevengado)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-800 uppercase mb-1">Descuentos de Ley</h4>
                  <div className="space-y-1 text-slate-700">
                    <div className="flex justify-between">
                      <span>ISSS Laboral ({fiscalConfig.isssLaboralRate * 100}%):</span>
                      <span>{formatCurrencyUSD(data.isssLaboral)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>AFP Laboral ({fiscalConfig.afpLaboralRate * 100}%):</span>
                      <span>{formatCurrencyUSD(data.afpLaboral)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Retención Renta (MH):</span>
                      <span>{formatCurrencyUSD(data.rentaRetencion)}</span>
                    </div>
                    <div className="flex justify-between font-bold pt-1 border-t border-slate-200 text-rose-700">
                      <span>Total Descuentos:</span>
                      <span>{formatCurrencyUSD(data.totalDeducciones)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center py-2 px-3 bg-indigo-50 border border-indigo-200 rounded-lg mt-4 font-bold text-sm text-indigo-950">
                <span>LÍQUIDO A PAGAR (NETO RECIBIDO):</span>
                <span className="text-base font-black font-mono">{formatCurrencyUSD(data.liquidoPagar)}</span>
              </div>

              <div className="pt-10 grid grid-cols-2 gap-12 text-center text-[10px] text-slate-500">
                <div className="border-t border-slate-400 pt-1">
                  Firma del Empleador / Representante Legal
                </div>
                <div className="border-t border-slate-400 pt-1">
                  Firma y Recibido Conforme del Colaborador
                </div>
              </div>
            </div>
          )}

          {/* 5. PLANILLA COMPLETA EN CUADRO / TABLA OFICIAL */}
          {reportType === 'payroll_summary' && (
            <div className="space-y-4 text-xs">
              {(() => {
                const payrollObj: Payroll | undefined = data || payrolls[0];
                if (!payrollObj) {
                  return (
                    <div className="p-8 text-center text-slate-500 border border-dashed rounded-xl">
                      No hay datos de planilla seleccionados para imprimir.
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                      <div>
                        <span className="font-bold text-slate-900 block">
                          PLANILLA OFICIAL DE SALARIOS - PERIODO {payrollObj.periodNumber} ({payrollObj.periodType?.toUpperCase() || 'QUINCENAL'})
                        </span>
                        <span className="text-slate-600">
                          Vigencia: {payrollObj.startDate} al {payrollObj.endDate} | Estado: {payrollObj.status?.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-500 block text-[10px]">Total Colaboradores</span>
                        <span className="font-black text-slate-900 text-sm">{payrollObj.details?.length || 0} Empleados</span>
                      </div>
                    </div>

                    <div className="overflow-x-auto border border-slate-300 rounded-xl">
                      <table className="w-full text-left text-[11px] font-mono">
                        <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[9px] border-b border-slate-300">
                          <tr>
                            <th className="p-2 font-sans">#</th>
                            <th className="p-2 font-sans">Colaborador / Cargo</th>
                            <th className="p-2 text-right">Sal. Base</th>
                            <th className="p-2 text-right">Extras/Bonos</th>
                            <th className="p-2 text-right font-bold text-slate-900">Total Dev.</th>
                            <th className="p-2 text-right text-indigo-700">ISSS (3%)</th>
                            <th className="p-2 text-right text-purple-700">AFP (7.25%)</th>
                            <th className="p-2 text-right text-amber-700">Renta MH</th>
                            <th className="p-2 text-right text-rose-700">Tot. Desc.</th>
                            <th className="p-2 text-right font-bold text-emerald-800 bg-emerald-50">Líquido Neto</th>
                            <th className="p-2 font-sans text-center">Firma / Conforme</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                          {payrollObj.details?.map((det, idx) => (
                            <tr key={det.employeeId || idx} className="hover:bg-slate-50">
                              <td className="p-2 text-slate-500">{idx + 1}</td>
                              <td className="p-2 font-sans">
                                <span className="font-bold text-slate-900 block">{det.employeeName}</span>
                                <span className="text-[10px] text-slate-500 block">{det.position} • DUI: {det.dui || 'N/A'}</span>
                              </td>
                              <td className="p-2 text-right text-slate-700">{formatCurrencyUSD(det.baseSalary)}</td>
                              <td className="p-2 text-right text-slate-700">
                                {formatCurrencyUSD((det.overtimePay || 0) + (det.bonuses || 0))}
                              </td>
                              <td className="p-2 text-right font-bold text-slate-900">{formatCurrencyUSD(det.totalDevengado)}</td>
                              <td className="p-2 text-right text-indigo-600">{formatCurrencyUSD(det.isssLaboral)}</td>
                              <td className="p-2 text-right text-purple-600">{formatCurrencyUSD(det.afpLaboral)}</td>
                              <td className="p-2 text-right text-amber-600">{formatCurrencyUSD(det.rentaRetencion)}</td>
                              <td className="p-2 text-right font-semibold text-rose-600">{formatCurrencyUSD(det.totalDeducciones)}</td>
                              <td className="p-2 text-right font-black text-emerald-700 bg-emerald-50/50">
                                {formatCurrencyUSD(det.liquidoPagar)}
                              </td>
                              <td className="p-2 text-center text-slate-300">
                                <div className="w-24 h-6 border-b border-slate-300 mx-auto" />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-slate-100 border-t-2 border-slate-400 font-bold text-[10px]">
                          <tr>
                            <td colSpan={2} className="p-2 uppercase font-sans text-slate-900">TOTALES GENERALES:</td>
                            <td className="p-2 text-right">
                              {formatCurrencyUSD(payrollObj.details?.reduce((s, d) => s + (d.baseSalary || 0), 0) || 0)}
                            </td>
                            <td className="p-2 text-right">
                              {formatCurrencyUSD(payrollObj.details?.reduce((s, d) => s + ((d.overtimePay || 0) + (d.bonuses || 0)), 0) || 0)}
                            </td>
                            <td className="p-2 text-right text-slate-900">{formatCurrencyUSD(payrollObj.totalDevengado)}</td>
                            <td className="p-2 text-right text-indigo-700">{formatCurrencyUSD(payrollObj.totalIsssLaboral)}</td>
                            <td className="p-2 text-right text-purple-700">{formatCurrencyUSD(payrollObj.totalAfpLaboral)}</td>
                            <td className="p-2 text-right text-amber-700">{formatCurrencyUSD(payrollObj.totalRentaRetenida)}</td>
                            <td className="p-2 text-right text-rose-700">
                              {formatCurrencyUSD(
                                (payrollObj.totalIsssLaboral || 0) +
                                (payrollObj.totalAfpLaboral || 0) +
                                (payrollObj.totalRentaRetenida || 0)
                              )}
                            </td>
                            <td className="p-2 text-right text-emerald-800 bg-emerald-100">
                              {formatCurrencyUSD(payrollObj.totalLiquido)}
                            </td>
                            <td className="p-2 text-center">-</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* Resumen Patronal al pie */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px]">
                      <div>
                        <span className="text-slate-500 block">ISSS Patronal (7.5%)</span>
                        <span className="font-bold text-slate-900 font-mono">{formatCurrencyUSD(payrollObj.totalIsssPatronal)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">AFP Patronal (8.75%)</span>
                        <span className="font-bold text-slate-900 font-mono">{formatCurrencyUSD(payrollObj.totalAfpPatronal)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">INSAFORP (1%)</span>
                        <span className="font-bold text-slate-900 font-mono">{formatCurrencyUSD(payrollObj.totalInsaforpPatronal)}</span>
                      </div>
                      <div className="bg-slate-900 text-white p-2 rounded-lg">
                        <span className="text-slate-300 block text-[9px] uppercase font-bold">Costo Real Empresa</span>
                        <span className="font-black text-amber-300 font-mono text-sm">{formatCurrencyUSD(payrollObj.costoTotalEmpresa)}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* 6. TODAS LAS BOLETAS DE PAGO EN UN SOLO DOCUMENTO / PDF UNIFICADO */}
          {reportType === 'payroll_all_slips' && (
            <div className="space-y-8 text-xs">
              {(() => {
                const payrollObj: Payroll | undefined = data || payrolls[0];
                if (!payrollObj || !payrollObj.details || payrollObj.details.length === 0) {
                  return (
                    <div className="p-8 text-center text-slate-500 border border-dashed rounded-xl">
                      No hay colaboradores en esta planilla para generar boletas de pago.
                    </div>
                  );
                }

                return (
                  <div className="space-y-6">
                    <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-950 flex justify-between items-center">
                      <div>
                        <span className="font-bold block">
                          COMPILACIÓN UNIFICADA DE BOLETAS DE PAGO ({payrollObj.details.length} COLABORADORES)
                        </span>
                        <span className="text-indigo-800 text-[11px]">
                          Período: {payrollObj.startDate} al {payrollObj.endDate} | {payrollObj.periodType?.toUpperCase()}
                        </span>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-indigo-600 text-white font-bold text-[10px]">
                        Listas para Impresión Oficial
                      </span>
                    </div>

                    {payrollObj.details.map((slip, index) => (
                      <div
                        key={slip.employeeId || index}
                        className="border-2 border-slate-300 rounded-xl p-5 bg-white space-y-4 shadow-2xs relative print:break-inside-avoid"
                      >
                        {/* Slip Header */}
                        <div className="grid grid-cols-2 gap-4 pb-3 border-b-2 border-slate-200">
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">
                              {currentCompany.name} • NIT: {currentCompany.nit || '0614-010190-101-1'}
                            </span>
                            <h4 className="font-extrabold text-base text-slate-900 mt-0.5">{slip.employeeName}</h4>
                            <p className="text-slate-600 text-[11px]">
                              Cargo: <strong className="text-slate-800">{slip.position}</strong> • DUI:{' '}
                              <strong className="text-slate-800">{slip.dui || 'N/A'}</strong>
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold text-[10px] uppercase">
                              Boleta #{index + 1} de {payrollObj.details.length}
                            </span>
                            <p className="font-bold text-slate-800 mt-1">Recibo de Sueldo y Retenciones de Ley</p>
                            <p className="text-slate-500 text-[10px]">
                              Período: {payrollObj.startDate} al {payrollObj.endDate}
                            </p>
                          </div>
                        </div>

                        {/* Breakdown Columns */}
                        <div className="grid grid-cols-2 gap-6 text-[11px]">
                          {/* Ingresos */}
                          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <h5 className="font-bold text-slate-800 uppercase text-[10px] mb-2 border-b border-slate-200 pb-1 flex items-center justify-between">
                              <span>(+) Ingresos Devengados</span>
                              <span className="text-emerald-700">Monto USD</span>
                            </h5>
                            <div className="space-y-1.5 font-mono">
                              <div className="flex justify-between text-slate-700">
                                <span>Salario Base del Período:</span>
                                <span>{formatCurrencyUSD(slip.baseSalary)}</span>
                              </div>
                              {slip.overtimePay > 0 && (
                                <div className="flex justify-between text-slate-700">
                                  <span>Horas Extras (Diurnas/Nocturnas):</span>
                                  <span className="text-emerald-700">+{formatCurrencyUSD(slip.overtimePay)}</span>
                                </div>
                              )}
                              {slip.bonuses > 0 && (
                                <div className="flex justify-between text-slate-700">
                                  <span>Bonificaciones / Extras:</span>
                                  <span className="text-emerald-700">+{formatCurrencyUSD(slip.bonuses)}</span>
                                </div>
                              )}
                              <div className="flex justify-between font-black pt-1.5 border-t border-slate-300 text-slate-900 text-xs">
                                <span>TOTAL DEVENGADO:</span>
                                <span>{formatCurrencyUSD(slip.totalDevengado)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Deducciones */}
                          <div className="p-3 bg-rose-50/50 rounded-lg border border-rose-100">
                            <h5 className="font-bold text-rose-900 uppercase text-[10px] mb-2 border-b border-rose-200 pb-1 flex items-center justify-between">
                              <span>(-) Descuentos de Ley SV</span>
                              <span className="text-rose-700">Monto USD</span>
                            </h5>
                            <div className="space-y-1.5 font-mono">
                              <div className="flex justify-between text-slate-700">
                                <span>ISSS Laboral ({fiscalConfig.isssLaboralRate * 100}%):</span>
                                <span className="text-indigo-700">-{formatCurrencyUSD(slip.isssLaboral)}</span>
                              </div>
                              <div className="flex justify-between text-slate-700">
                                <span>AFP Laboral ({fiscalConfig.afpLaboralRate * 100}%):</span>
                                <span className="text-purple-700">-{formatCurrencyUSD(slip.afpLaboral)}</span>
                              </div>
                              <div className="flex justify-between text-slate-700">
                                <span>Impuesto sobre la Renta MH:</span>
                                <span className="text-amber-700">-{formatCurrencyUSD(slip.rentaRetencion)}</span>
                              </div>
                              <div className="flex justify-between font-black pt-1.5 border-t border-rose-200 text-rose-800 text-xs">
                                <span>TOTAL RETENCIONES:</span>
                                <span>-{formatCurrencyUSD(slip.totalDeducciones)}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Liquid Banner */}
                        <div className="flex justify-between items-center py-2.5 px-4 bg-emerald-50 border border-emerald-300 rounded-xl font-bold text-emerald-950">
                          <div>
                            <span className="text-xs uppercase font-extrabold block">LÍQUIDO A PAGAR AL TRABAJADOR (NETO RECIBIDO):</span>
                            <span className="text-[10px] text-emerald-700 font-medium">Depositado / Entregado vía cuenta bancaria o cheque</span>
                          </div>
                          <span className="text-lg font-black font-mono text-emerald-800">{formatCurrencyUSD(slip.liquidoPagar)}</span>
                        </div>

                        {/* Signature lines */}
                        <div className="pt-6 grid grid-cols-2 gap-12 text-center text-[10px] text-slate-600">
                          <div>
                            <div className="h-8 border-b border-slate-400 mb-1" />
                            <p className="font-bold text-slate-800">Firma del Empleador / RRHH</p>
                            <p className="text-[9px] text-slate-500">{currentCompany.name}</p>
                          </div>
                          <div>
                            <div className="h-8 border-b border-slate-400 mb-1" />
                            <p className="font-bold text-slate-800">Firma y Recibido Conforme del Trabajador</p>
                            <p className="text-[9px] text-slate-500">{slip.employeeName} (DUI: {slip.dui || 'N/A'})</p>
                          </div>
                        </div>

                        {/* Dashed cut guide between slips */}
                        {index < payrollObj.details.length - 1 && (
                          <div className="pt-4 text-center">
                            <span className="text-[9px] text-slate-400 uppercase tracking-widest bg-white px-2 relative z-10 font-mono">
                              - - - - - - - - - - - - CORTE AQUÍ / RECIBO PARA ENTREGA - - - - - - - - - - - -
                            </span>
                            <div className="border-b border-dashed border-slate-300 -mt-2.5" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* 7. PLANILLA Y LIBRO DE SERVICIOS PROFESIONALES (RETENCIÓN 10% RENTA ART. 156) */}
          {reportType === 'professional_services_book' && (
            <div className="space-y-4 text-xs">
              {(() => {
                const list = Array.isArray(data) && data.length > 0 ? data : professionalServices;
                const totalGross = list.reduce((s, r) => s + (r.grossAmount || 0), 0);
                const totalRetention = list.reduce((s, r) => s + (r.retentionAmount || 0), 0);
                const totalNet = list.reduce((s, r) => s + (r.netAmount || 0), 0);

                return (
                  <div className="space-y-4">
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-950 flex justify-between items-center">
                      <div>
                        <span className="font-bold block">
                          LIBRO DE RETENCIONES DE IMPUESTO SOBRE LA RENTA - SERVICIOS PROFESIONALES
                        </span>
                        <span className="text-amber-800 text-[11px]">
                          Art. 156 del Código Tributario de El Salvador (Retención legal del 10% F-14 Ministerio de Hacienda)
                        </span>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-amber-600 text-white font-bold text-[10px]">
                        {list.length} Registros
                      </span>
                    </div>

                    <div className="overflow-x-auto border border-slate-300 rounded-xl">
                      <table className="w-full text-left text-[11px] font-mono">
                        <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[9px] border-b border-slate-300">
                          <tr>
                            <th className="p-2 font-sans">#</th>
                            <th className="p-2 font-sans">Fecha</th>
                            <th className="p-2 font-sans">Profesional / Proveedor</th>
                            <th className="p-2">DUI / NIT</th>
                            <th className="p-2 font-sans">Concepto del Servicio</th>
                            <th className="p-2">Doc / Factura</th>
                            <th className="p-2 text-right">Monto Bruto</th>
                            <th className="p-2 text-right text-amber-700 font-bold">Retención 10%</th>
                            <th className="p-2 text-right text-emerald-700 font-bold">Líquido Pagado</th>
                            <th className="p-2 font-sans text-center">Estado</th>
                            <th className="p-2 font-sans text-center">Firma Recibido</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                          {list.map((rec, idx) => (
                            <tr key={rec.id || idx} className="hover:bg-slate-50">
                              <td className="p-2 text-slate-500">{idx + 1}</td>
                              <td className="p-2 text-slate-700 whitespace-nowrap">{rec.date}</td>
                              <td className="p-2 font-sans font-bold text-slate-900">{rec.contractorName}</td>
                              <td className="p-2 text-slate-600">{rec.dui || rec.nit || 'N/A'}</td>
                              <td className="p-2 font-sans text-slate-700">{rec.serviceDescription}</td>
                              <td className="p-2 text-slate-600">{rec.invoiceNumber || 'S/N'}</td>
                              <td className="p-2 text-right text-slate-800">{formatCurrencyUSD(rec.grossAmount)}</td>
                              <td className="p-2 text-right font-semibold text-amber-700">-{formatCurrencyUSD(rec.retentionAmount)}</td>
                              <td className="p-2 text-right font-black text-emerald-700">{formatCurrencyUSD(rec.netAmount)}</td>
                              <td className="p-2 text-center font-sans">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                  rec.status === 'pagado'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {rec.status?.toUpperCase()}
                                </span>
                              </td>
                              <td className="p-2 text-center">
                                <div className="w-20 h-5 border-b border-slate-300 mx-auto" />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-slate-100 border-t-2 border-slate-400 font-bold text-[10px]">
                          <tr>
                            <td colSpan={6} className="p-2 uppercase font-sans text-slate-900">TOTALES DEL PERIODO:</td>
                            <td className="p-2 text-right text-slate-900">{formatCurrencyUSD(totalGross)}</td>
                            <td className="p-2 text-right text-amber-800">-{formatCurrencyUSD(totalRetention)}</td>
                            <td className="p-2 text-right text-emerald-800">{formatCurrencyUSD(totalNet)}</td>
                            <td colSpan={2} className="p-2 text-center font-sans text-[9px] text-slate-500">
                              Enterar Retención en F-14 MH
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Signatures Footer (One-Page Optimized) */}
          <div className="mt-8 pt-4 border-t border-slate-300 grid grid-cols-3 gap-4 text-center text-[10px] text-slate-700">
            <div>
              <div className="h-9 border-b border-slate-400 mb-1" />
              <p className="font-bold text-slate-900">{signer1Name || 'Representante Legal'}</p>
              <p className="text-[9px] text-slate-500">{signer1Title}</p>
            </div>
            <div>
              <div className="h-9 border-b border-slate-400 mb-1" />
              <p className="font-bold text-slate-900">{signer2Name || 'Contador General'}</p>
              <p className="text-[9px] text-slate-500">{signer2Title}</p>
            </div>
            <div>
              <div className="h-9 border-b border-slate-400 mb-1" />
              <p className="font-bold text-slate-900">{signer3Name || 'Auditor Externo'}</p>
              <p className="text-[9px] text-slate-500">{signer3Title}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

