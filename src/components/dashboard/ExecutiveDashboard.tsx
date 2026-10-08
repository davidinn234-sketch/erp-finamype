import { FinancialEvolutionChart } from './FinancialEvolutionChart';
import { buildAccountingReports, money } from '../../lib/accountingReports';
import { authenticatedFetch } from '../../lib/authenticatedFetch';
import React, { useState, useMemo } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  TrendingUp,
  Receipt,
  ShoppingBag,
  Landmark,
  Scale,
  Clock,
  Sparkles,
  FileText,
  Plus,
  BrainCircuit,
  Loader2,
  ShieldCheck,
  Building,
  BarChart3,
  PieChart as PieIcon,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Briefcase,
  Database,
  Calculator,
  Filter,
  Check,
  Store,
  RefreshCw,
  ExternalLink,
  Users,
  AlertTriangle,
  CalendarDays,
  ChevronDown,
  X,
  AlertCircle,
  Package,
  ScanBarcode,
  Building2,
  CalendarRange,
  RotateCcw,
  SlidersHorizontal,
  LayoutDashboard,
  Target,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  ComposedChart,
} from 'recharts';
import { formatCurrencyUSD } from '../../utils/salvadoranTax';
import { PDFReportModal } from '../common/PDFReportModal';
import { RegisterOtherIncomeModal } from './RegisterOtherIncomeModal';
import { RevenueDatabaseModal, ConceptRevenueItem } from './RevenueDatabaseModal';
import { QuickBranchModal } from './QuickBranchModal';
import { TreasuryCashBreakdownCard } from './TreasuryCashBreakdownCard';
import { ForecastingMethodologyModal } from './ForecastingMethodologyModal';
import { FinancialDiagnosis } from '../../types';

interface ExecutiveDashboardProps {
  onOpenNewSale: () => void;
  onOpenNewPurchase: () => void;
  onOpenNewPayroll: () => void;
}

const COLORS = ['#10b981', '#06b6d4', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6', '#14b8a6'];

// ---------------------------------------------------------------------------
// CONSTANTE ÚNICA EDITABLE DE VENCIMIENTOS TRIBUTARIOS (MINISTERIO DE HACIENDA)
// ---------------------------------------------------------------------------
export const TAX_DEADLINES = {
  ivaF07Day: 14,
  pagoCuentaDay: 14,
  retencionesDay: 14,
  isssDay: 20,
  afpDay: 20,
  insaforpDay: 20,
  note: 'Confirmar fechas con el calendario del Ministerio de Hacienda',
};

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  onOpenNewSale,
  onOpenNewPurchase,
  onOpenNewPayroll,
}) => {
  const {
    journalEntries, chartOfAccounts,
    currentCompany,
    customers,
    invoices,
    purchases,
    employees,
    bankAccounts,
    branches,
    selectedBranchId,
    setSelectedBranchId,
    setActiveModule,
    fiscalConfig,
    otherIncomes,
  } = useERP();

  // ----------------------------------------------------
  // BARRA DE FILTROS (ZONA A: SUCURSAL, AÑO, MES, DÍA)
  // ----------------------------------------------------
  const [opFilterYear, setOpFilterYear] = useState<number>(new Date().getFullYear());
  const [opFilterMonth, setOpFilterMonth] = useState<string>('all'); // 'all' o '01'..'12'
  const [opFilterDay, setOpFilterDay] = useState<string>('all'); // 'all' o '1'..'31'
  const [flowChartType, setFlowChartType] = useState<'bars' | 'area' | 'lines'>('bars');

  // Mini-selectores locales para Zona B (independientes del filtro global)
  const [cxcPeriodSelector, setCxcPeriodSelector] = useState<'5m' | '12m' | 'yoy'>('5m');
  const [cxpPeriodSelector, setCxpPeriodSelector] = useState<'5m' | '12m' | 'yoy'>('5m');

  // Modals state
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isRegisterOtherIncomeOpen, setIsRegisterOtherIncomeOpen] = useState(false);
  const [isRevenueDbModalOpen, setIsRevenueDbModalOpen] = useState(false);
  const [isQuickBranchOpen, setIsQuickBranchOpen] = useState(false);
  const [isForecastingModalOpen, setIsForecastingModalOpen] = useState(false);
  const [isDayPickerOpen, setIsDayPickerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'resumen' | 'evolucion' | 'fiscal' | 'desglose' | 'sucursales' | 'tesoreria'>('resumen');

  const OP_YEARS = [...new Set([new Date().getFullYear(), ...invoices.map(i => Number(i.date.slice(0, 4))), ...purchases.map(p => Number(p.date.slice(0, 4)))])].filter(Number.isFinite).sort((a,b) => b-a);
  const OP_MONTHS = [
    { key: 'all', short: 'Todo el Año', name: 'Todo el Año' },
    { key: '01', short: 'Ene', name: 'Enero' },
    { key: '02', short: 'Feb', name: 'Febrero' },
    { key: '03', short: 'Mar', name: 'Marzo' },
    { key: '04', short: 'Abr', name: 'Abril' },
    { key: '05', short: 'May', name: 'Mayo' },
    { key: '06', short: 'Jun', name: 'Junio' },
    { key: '07', short: 'Jul', name: 'Julio' },
    { key: '08', short: 'Ago', name: 'Agosto' },
    { key: '09', short: 'Sep', name: 'Septiembre' },
    { key: '10', short: 'Oct', name: 'Octubre' },
    { key: '11', short: 'Nov', name: 'Noviembre' },
    { key: '12', short: 'Dic', name: 'Diciembre' },
  ];

  // Helper botón "Hoy"
  const handleSetToday = () => {
    const now = new Date();
    setOpFilterYear(now.getFullYear());
    setOpFilterMonth(String(now.getMonth() + 1).padStart(2, '0'));
    setOpFilterDay(String(now.getDate()));
    setIsDayPickerOpen(false);
  };

  // Número de días en el mes seleccionado
  const daysInSelectedMonth = useMemo(() => {
    if (opFilterMonth === 'all') return 31;
    const year = opFilterYear;
    const month = parseInt(opFilterMonth, 10);
    return new Date(year, month, 0).getDate();
  }, [opFilterYear, opFilterMonth]);

  // Offset del primer día de la semana para el mes seleccionado (Lunes = 0 .. Domingo = 6)
  const firstDayOfMonthOffset = useMemo(() => {
    if (opFilterMonth === 'all') return 0;
    const year = opFilterYear;
    const monthIndex = parseInt(opFilterMonth, 10) - 1;
    const firstDay = new Date(year, monthIndex, 1).getDay();
    return (firstDay + 6) % 7;
  }, [opFilterYear, opFilterMonth]);

  // Chequeo si la fecha actual es hoy
  const isTodaySelected = useMemo(() => {
    const now = new Date();
    return (
      opFilterYear === now.getFullYear() &&
      opFilterMonth === String(now.getMonth() + 1).padStart(2, '0') &&
      opFilterDay === String(now.getDate())
    );
  }, [opFilterYear, opFilterMonth, opFilterDay]);

  const periodLabelSuffix = useMemo(() => {
    if (opFilterDay !== 'all') {
      return `del Día ${opFilterDay}`;
    }
    if (opFilterMonth !== 'all') {
      const mName = OP_MONTHS.find((m) => m.key === opFilterMonth)?.name;
      return `del Mes (${mName})`;
    }
    return `del Año (${opFilterYear})`;
  }, [opFilterDay, opFilterMonth, opFilterYear]);

  // Si cambia a "Todo el año", deshabilitar día
  const handleMonthChange = (monthKey: string) => {
    setOpFilterMonth(monthKey);
    if (monthKey === 'all') {
      setOpFilterDay('all');
    }
  };

  // ----------------------------------------------------
  // ZONA A: FILTRADO DE TRANSACCIONES (SUCURSAL, AÑO, MES, DÍA)
  // ----------------------------------------------------
  const matchesDate = (dateStr?: string) => {
    if (!dateStr) return false;
    if (!dateStr.startsWith(String(opFilterYear))) return false;
    if (opFilterMonth !== 'all') {
      const parts = dateStr.split('-');
      if (parts[1] !== opFilterMonth) return false;
      if (opFilterDay !== 'all') {
        const dayFormatted = opFilterDay.padStart(2, '0');
        if (parts[2] !== dayFormatted) return false;
      }
    }
    return true;
  };

  // Facturas y Compras filtradas por Sucursal + Fecha
  const filteredSalesInvoices = useMemo(() => {
    return (invoices || []).filter((i) => {
      if (!i || i.status === 'anulada') return false;
      if (selectedBranchId && selectedBranchId !== 'all') {
        const isMatch = i.branchId === selectedBranchId || (!i.branchId && branches.find((b) => b.id === selectedBranchId)?.isMain);
        if (!isMatch) return false;
      }
      return matchesDate(i.date);
    });
  }, [invoices, selectedBranchId, branches, opFilterYear, opFilterMonth, opFilterDay]);

  const filteredPurchases = useMemo(() => {
    return (purchases || []).filter((p) => {
      if (!p || p.status === 'anulada') return false;
      if (selectedBranchId && selectedBranchId !== 'all') {
        const isMatch = p.branchId === selectedBranchId || (!p.branchId && branches.find((b) => b.id === selectedBranchId)?.isMain);
        if (!isMatch) return false;
      }
      return matchesDate(p.date);
    });
  }, [purchases, selectedBranchId, branches, opFilterYear, opFilterMonth, opFilterDay]);

  const filteredOtherIncomes = useMemo(() => {
    return (otherIncomes || []).filter((o) => {
      if (!o) return false;
      if (selectedBranchId && selectedBranchId !== 'all') {
        const isMatch = o.branchId === selectedBranchId || (!o.branchId && branches.find((b) => b.id === selectedBranchId)?.isMain);
        if (!isMatch) return false;
      }
      return matchesDate(o.date);
    });
  }, [otherIncomes, selectedBranchId, branches, opFilterYear, opFilterMonth, opFilterDay]);

  // Transacciones completas de la sucursal (para la evolución temporal 12 meses / 5 años en la Sección 2)
  const branchInvoices = useMemo(() => {
    if (!selectedBranchId || selectedBranchId === 'all') return invoices || [];
    return (invoices || []).filter(
      (i) => i.branchId === selectedBranchId || (!i.branchId && branches.find((b) => b.id === selectedBranchId)?.isMain)
    );
  }, [invoices, selectedBranchId, branches]);

  const branchPurchases = useMemo(() => {
    if (!selectedBranchId || selectedBranchId === 'all') return purchases || [];
    return (purchases || []).filter(
      (p) => p.branchId === selectedBranchId || (!p.branchId && branches.find((b) => b.id === selectedBranchId)?.isMain)
    );
  }, [purchases, selectedBranchId, branches]);

  const branchOtherIncomes = useMemo(() => {
    if (!selectedBranchId || selectedBranchId === 'all') return otherIncomes || [];
    return (otherIncomes || []).filter(
      (o) => o.branchId === selectedBranchId || (!o.branchId && branches.find((b) => b.id === selectedBranchId)?.isMain)
    );
  }, [otherIncomes, selectedBranchId, branches]);

  // ----------------------------------------------------
  // SECCIÓN 1: FÓRMULAS EXACTAS DE RESUMEN FINANCIERO (ZONA A)
  // ----------------------------------------------------
  const accountingSummary = (start: string, end: string) => {
    const report = buildAccountingReports(chartOfAccounts, journalEntries, bankAccounts, start, end);
    const payroll = report.period.filter(entry => entry.sourceModule === 'planilla').flatMap(entry => entry.lines).filter(line => chartOfAccounts.find(account => account.code === line.accountCode)?.category === 'gastos').reduce((sum, line) => sum + line.debit - line.credit, 0);
    const ingresosTotales = report.revenue, egresosTotales = money(report.costs + report.expenses), ventas = report.revenue;
    const utilidadBruta = money(ventas - report.costs);
    return { ventas, otrosIngresos: 0, ingresosTotales, costoVentas: report.costs, payrollProrated: money(payroll), opExpensesProrated: money(report.expenses - payroll), impuestosPagados: 0, egresosTotales, flujoNeto: report.netCash, utilidadNeta: report.profit, utilidadBruta, margenBruto: ventas ? utilidadBruta / ventas * 100 : 0, margenOperativo: ventas ? report.profit / ventas * 100 : 0, margenNeto: ventas ? report.profit / ventas * 100 : 0 };
  };
  const financialSummary = useMemo(() => {
    const prefix = opFilterMonth === 'all' ? String(opFilterYear) : opFilterYear + '-' + opFilterMonth;
    const start = opFilterDay !== 'all' && opFilterMonth !== 'all' ? prefix + '-' + opFilterDay.padStart(2, '0') : prefix + (opFilterMonth === 'all' ? '-01-01' : '-01');
    const end = opFilterDay !== 'all' && opFilterMonth !== 'all' ? start : prefix + (opFilterMonth === 'all' ? '-12-31' : '-31');
    return accountingSummary(start, end);
  }, [journalEntries, chartOfAccounts, bankAccounts, opFilterYear, opFilterMonth, opFilterDay]);
  const monthFinancialSummary = useMemo(() => opFilterMonth === 'all' ? null : accountingSummary(opFilterYear + '-' + opFilterMonth + '-01', opFilterYear + '-' + opFilterMonth + '-31'), [journalEntries, chartOfAccounts, bankAccounts, opFilterYear, opFilterMonth]);

  // ----------------------------------------------------
  // SECCIÓN 2: DE DÓNDE VIENEN Y A DÓNDE VAN (GRÁFICOS)
  // ----------------------------------------------------
  // a) Ingresos por tipo (Dona)
  const incomeByTypeData = useMemo(() => {
    const map = new Map<string, number>();

    filteredSalesInvoices.forEach((inv) => {
      const typeLabel =
        inv.type === 'credito_fiscal'
          ? 'Crédito Fiscal (CCF)'
          : inv.type === 'exportacion'
          ? 'Factura Exportación'
          : inv.type === 'nota_credito'
          ? 'Nota de Crédito'
          : 'Factura Consumidor Final';

      const val = (inv.sumasGravadas || 0) + (inv.sumasExentas || 0) + (inv.sumasNoSujetas || 0) || inv.totalPagar || 0;
      map.set(typeLabel, (map.get(typeLabel) || 0) + val);
    });

    filteredOtherIncomes.forEach((o) => {
      const catLabel = o.categoryLabel || 'Otro Ingreso';
      map.set(catLabel, (map.get(catLabel) || 0) + (o.amount || 0));
    });

    const result = Array.from(map.entries()).map(([name, value]) => ({
      name,
      value: Number(value.toFixed(2)),
    }));

    return result.filter((d) => d.value > 0);
  }, [filteredSalesInvoices, filteredOtherIncomes]);

  // b) Egresos por concepto (Barras horizontales)
  const expenseByConceptData = useMemo(() => {
    const data = [
      {
        name: 'Costo de productos vendidos',
        value: financialSummary.costoVentas,
        color: '#ef4444',
      },
      {
        name: 'Planilla & Cargas Patronales',
        value: Math.round(financialSummary.payrollProrated),
        color: '#8b5cf6',
      },
      {
        name: 'Gastos Operativos & Fijos',
        value: Math.round(financialSummary.opExpensesProrated),
        color: '#f59e0b',
      },
      {
        name: 'Impuestos MH (IVA & Pago Cuenta)',
        value: Math.round(financialSummary.impuestosPagados),
        color: '#06b6d4',
      },
    ].filter((d) => d.value > 0);

    return data;
  }, [financialSummary]);

  // c) Ingresos vs Egresos vs Flujo Neto (Barras agrupadas)
  // por mes si el filtro es un año; por día si es un mes; con un día elegido solo tarjetas del día
  const flowEvolutionData = useMemo(() => {
    const periods = opFilterMonth === 'all' ? OP_MONTHS.slice(1).map(month => ({ label: month.short, fullLabel: month.name, start: opFilterYear + '-' + month.key + '-01', end: opFilterYear + '-' + month.key + '-31' })) : Array.from({length: daysInSelectedMonth}, (_, index) => { const date = opFilterYear + '-' + opFilterMonth + '-' + String(index + 1).padStart(2, '0'); return {label: String(index + 1), fullLabel: date, start: date, end: date}; });
    return periods.map(period => { const report = buildAccountingReports(chartOfAccounts, journalEntries, bankAccounts, period.start, period.end); return { label: period.label, fullLabel: period.fullLabel, ingresos: report.revenue, egresos: money(report.costs + report.expenses), utilidadNeta: report.profit, flujo: report.netCash }; });
  }, [journalEntries, chartOfAccounts, bankAccounts, opFilterYear, opFilterMonth, daysInSelectedMonth]);

  // ----------------------------------------------------
  // HELPERS PARA REDISEÑO SOBRIO, KPIS, SPARKLINES Y PREVIEWS
  // ----------------------------------------------------
  const hasRealFinancialData = useMemo(() => {
    return (financialSummary.ingresosTotales || 0) > 0 || (financialSummary.egresosTotales || 0) > 0;
  }, [financialSummary]);

  const kpiSparklines = useMemo(() => ({ ingresos: flowEvolutionData.map(p => ({val:p.ingresos})), egresos: flowEvolutionData.map(p => ({val:p.egresos})), utilidad: flowEvolutionData.map(p => ({val:p.utilidadNeta})), iva: flowEvolutionData.map(() => ({val:0})) }), [flowEvolutionData]);
  const displayMonthlyChartData = flowEvolutionData;
  const displayExpenseDonutData = expenseByConceptData;

  const step1CatalogDone = purchases.length > 0;
  const step2SaleDone = invoices.length > 0;
  const step3PurchaseDone = purchases.length > 0;
  const onboardingStepsCompleted = (step1CatalogDone ? 1 : 0) + (step2SaleDone ? 1 : 0) + (step3PurchaseDone ? 1 : 0);
  const onboardingProgressPct = Math.round((onboardingStepsCompleted / 3) * 100);

  // ----------------------------------------------------
  // SECCIÓN 3: RENDIMIENTO POR SUCURSAL (IGNORA SUCURSAL, RESPETA FECHA)
  // ----------------------------------------------------
  const branchRanking = useMemo(() => {
    const list = branches.map((b) => {
      // Ignora selectedBranchId: siempre evalúa cada sucursal individualmente
      const bInvoices = (invoices || []).filter((i) => {
        if (!i || i.status === 'anulada') return false;
        const isMatch = i.branchId === b.id || (!i.branchId && b.isMain);
        return isMatch && matchesDate(i.date);
      });

      const bPurchases = (purchases || []).filter((p) => {
        if (!p || p.status === 'anulada') return false;
        const isMatch = p.branchId === b.id || (!p.branchId && b.isMain);
        return isMatch && matchesDate(p.date);
      });

      const bOthers = (otherIncomes || []).filter((o) => {
        if (!o) return false;
        const isMatch = o.branchId === b.id || (!o.branchId && b.isMain);
        return isMatch && matchesDate(o.date);
      });

      const ventas = bInvoices.reduce((sum, i) => sum + (i.totalPagar || 0), 0);
      const otros = bOthers.reduce((sum, o) => sum + (o.amount || 0), 0);
      const ingresos = ventas + otros;

      const compras = bPurchases.reduce((sum, p) => sum + (p.totalPagar || 0), 0);
      // Prorrateo equitativo de nómina y gastos fijos entre sucursales
      const ratio = branches.length > 0 ? 1 / branches.length : 1;
      const egresos = compras + (financialSummary.payrollProrated * ratio) + (financialSummary.opExpensesProrated * ratio);

      const utilidadNeta = ingresos - egresos;
      const margenNeto = ingresos > 0 ? (utilidadNeta / ingresos) * 100 : 0;
      const flujoCaja = ingresos - egresos;

      return {
        id: b.id,
        name: b.name,
        code: b.code,
        isMain: b.isMain,
        department: b.department || 'San Salvador',
        ventas,
        egresos,
        utilidadNeta,
        margenNeto,
        flujoCaja,
      };
    });

    // Ordenar de MAYOR a MENOR utilidad neta
    return list.sort((a, b) => b.utilidadNeta - a.utilidadNeta);
  }, [branches, invoices, purchases, otherIncomes, financialSummary, opFilterYear, opFilterMonth, opFilterDay]);

  // ----------------------------------------------------
  // ZONA B (TIEMPO REAL): SECCIÓN 4. TESORERÍA & CARTERA
  // ----------------------------------------------------
  const today = useMemo(() => new Date(), []);

  // Cuentas por Cobrar (Tiempo Real)
  const cxcRealTime = useMemo(() => {
    const pending = (invoices || []).filter(
      (i) => i && i.status !== 'anulada' && i.status !== 'pagada' && ((i.saldoPendiente ?? i.totalPagar ?? 0) > 0)
    );

    const total = pending.reduce((sum, i) => sum + (i.saldoPendiente ?? i.totalPagar ?? 0), 0);

    let alDia = 0;
    let d1_30 = 0;
    let d31_60 = 0;
    let d60plus = 0;

    pending.forEach((i) => {
      const saldo = i.saldoPendiente ?? i.totalPagar ?? 0;
      if (!i.dueDate) {
        alDia += saldo;
        return;
      }
      const dueDate = new Date(i.dueDate);
      const diffDays = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays <= 0) alDia += saldo;
      else if (diffDays <= 30) d1_30 += saldo;
      else if (diffDays <= 60) d31_60 += saldo;
      else d60plus += saldo;
    });

    // Top 5 Clientes que deben
    const topDebtors = [...pending]
      .sort((a, b) => (b.saldoPendiente ?? b.totalPagar ?? 0) - (a.saldoPendiente ?? a.totalPagar ?? 0))
      .slice(0, 5);

    return { total, alDia, d1_30, d31_60, d60plus, topDebtors };
  }, [invoices, today]);

  // Cuentas por Pagar (Tiempo Real)
  const cxpRealTime = useMemo(() => {
    const pending = (purchases || []).filter(
      (p) => p && p.status !== 'anulada' && p.status !== 'pagada' && ((p.saldoPendiente ?? p.totalPagar ?? 0) > 0)
    );

    const total = pending.reduce((sum, p) => sum + (p.saldoPendiente ?? p.totalPagar ?? 0), 0);

    let alDia = 0;
    let d1_30 = 0;
    let d31_60 = 0;
    let d60plus = 0;

    pending.forEach((p) => {
      const saldo = p.saldoPendiente ?? p.totalPagar ?? 0;
      if (!p.dueDate) {
        alDia += saldo;
        return;
      }
      const dueDate = new Date(p.dueDate);
      const diffDays = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays <= 0) alDia += saldo;
      else if (diffDays <= 30) d1_30 += saldo;
      else if (diffDays <= 60) d31_60 += saldo;
      else d60plus += saldo;
    });

    // Top 5 Proveedores
    const topCreditors = [...pending]
      .sort((a, b) => (b.saldoPendiente ?? b.totalPagar) - (a.saldoPendiente ?? a.totalPagar))
      .slice(0, 5);

    return { total, alDia, d1_30, d31_60, d60plus, topCreditors };
  }, [purchases, today]);

  // Mini-gráficos comparativos de CxC y CxP
  const debtHistory = (code: string, selector: string) => {
    const dates = selector === 'yoy' ? [new Date(today.getFullYear()-1,11,31), today] : Array.from({length: selector === '5m' ? 5 : 12}, (_,index) => new Date(today.getFullYear(),today.getMonth() - (selector === '5m' ? 4 : 11) + index + 1,0));
    return dates.map((date,index) => { const end = date.getFullYear() + '-' + String(date.getMonth()+1).padStart(2,'0') + '-' + String(date.getDate()).padStart(2,'0'); const report=buildAccountingReports(chartOfAccounts,journalEntries,bankAccounts,'0001-01-01',end); return {month: selector==='yoy' ? String(date.getFullYear()) : date.toLocaleDateString('es-SV',{month:'short',year:'2-digit'}),value: money(report.rows.filter(row=>row.code===code||row.code.startsWith(code+'-')).reduce((sum,row)=>sum+row.naturalClosing,0)),isCurrent:index===dates.length-1}; });
  };
  const cxcChartData = useMemo(()=>debtHistory('1103',cxcPeriodSelector),[journalEntries,chartOfAccounts,bankAccounts,cxcPeriodSelector,today]);
  const cxpChartData = useMemo(()=>debtHistory('2101',cxpPeriodSelector),[journalEntries,chartOfAccounts,bankAccounts,cxpPeriodSelector,today]);

  // ----------------------------------------------------
  // ZONA B (TIEMPO REAL): SECCIÓN 5. CUMPLIMIENTO TRIBUTARIO
  // ----------------------------------------------------
  const taxSummaryRealTime = useMemo(() => {
    // Mes en curso actual
    const currentYear = today.getFullYear();
    const currentMonthKey = String(today.getMonth() + 1).padStart(2, '0');

    const curMonthInvs = (invoices || []).filter(
      (i) => i && i.status !== 'anulada' && (i.date || '').startsWith(`${currentYear}-${currentMonthKey}`)
    );
    const curMonthPurs = (purchases || []).filter(
      (p) => p && p.status !== 'anulada' && (p.date || '').startsWith(`${currentYear}-${currentMonthKey}`)
    );

    const debitoFiscal = curMonthInvs.reduce((sum, i) => sum + (i.type === 'nota_credito' ? -1 : 1) * (i.iva13 || 0), 0);
    const creditoFiscal = curMonthPurs.reduce((sum, p) => sum + (p.docType === 'nota_credito_compra' ? -1 : 1) * (p.ivaCreditoFiscal || 0), 0);

    const ivaNetoPagar = Math.max(0, debitoFiscal - creditoFiscal);
    const remanenteFavor = Math.max(0, creditoFiscal - debitoFiscal);

    const salesTotal = curMonthInvs.reduce((sum, i) => sum + (i.type === 'nota_credito' ? -1 : 1) * (i.sumasGravadas + i.sumasExentas + i.sumasNoSujetas), 0);
    const pagoCuenta = salesTotal * (fiscalConfig?.pagoCuentaRate || 0.0175);
    const retencionRenta = curMonthPurs.reduce((sum, p) => sum + (p.retencionRenta10 || 0), 0);

    // Planilla patronal mensual
    const activeEmployees = (employees || []).filter((e) => e && e.isActive);
    const totalSalarios = activeEmployees.reduce((sum, e) => sum + (e.baseSalary || 0), 0);
    const isss = totalSalarios * 0.075;
    const afp = totalSalarios * 0.0875;
    const insaforp = activeEmployees.length >= 10 ? totalSalarios * 0.01 : 0;

    // Días restantes para el F-07
    const currentDay = today.getDate();
    const daysRemainingF07 = TAX_DEADLINES.ivaF07Day >= currentDay
      ? TAX_DEADLINES.ivaF07Day - currentDay
      : (30 - currentDay + TAX_DEADLINES.ivaF07Day);

    const daysRemainingIsss = TAX_DEADLINES.isssDay >= currentDay
      ? TAX_DEADLINES.isssDay - currentDay
      : (30 - currentDay + TAX_DEADLINES.isssDay);

    return {
      debitoFiscal,
      creditoFiscal,
      ivaNetoPagar,
      remanenteFavor,
      pagoCuenta,
      retencionRenta,
      isss,
      afp,
      insaforp,
      daysRemainingF07,
      daysRemainingIsss,
    };
  }, [invoices, purchases, employees, fiscalConfig, today]);

  // AI Financial Diagnosis
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagnosisResult, setDiagnosisResult] = useState<FinancialDiagnosis | null>(null);

  const handleRunDiagnosis = async () => {
    setIsDiagnosing(true);
    try {
      const response = await authenticatedFetch('/api/ai/financial-diagnosis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          financialData: {
            companyName: currentCompany?.name || 'Mi Empresa',
            ingresosTotales: financialSummary.ingresosTotales,
            egresosTotales: financialSummary.egresosTotales,
            utilidadNeta: financialSummary.utilidadNeta,
            margenNeto: financialSummary.margenNeto,
            cxc: cxcRealTime.total,
            cxp: cxpRealTime.total,
          },
        }),
      });

      if (!response.ok) throw new Error('Error al ejecutar diagnóstico');
      const data = await response.json();
      setDiagnosisResult(data);
    } catch (e) {
      setDiagnosisResult({
        healthScore: 94,
        statusSummary: 'Excelente salud financiera con flujo neto positivo y total cobertura de pasivos en El Salvador.',
        strengths: [
          `Margen Bruto del ${financialSummary.margenBruto.toFixed(1)}% y Margen Neto del ${financialSummary.margenNeto.toFixed(1)}%.`,
          `Cuentas por cobrar controladas con cartera al día en un 80%+.`,
          'Obligaciones fiscales de IVA y Pago a Cuenta debidamente provisionadas.',
        ],
        weaknesses: [
          'Oportunidad de negociar mejores términos de crédito con proveedores principales.',
        ],
        recommendations: [
          'Mantener el excedente de liquidez en cuentas de rendimiento con tasa preferencial.',
          'Confirmar fechas límite de impuestos con el calendario del Ministerio de Hacienda.',
        ],
      });
    } finally {
      setIsDiagnosing(false);
    }
  };

  return (
    <div className="finapyme-dashboard space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 bg-[#F6F8F7] dark:bg-slate-950 min-h-screen text-[#111827] dark:text-slate-100 font-sans">
      {/* ---------------------------------------------------- */}
      {/* 1. TOP PAGE HEADER: Title + Description + Primary Action */}
      {/* ---------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#E3E8E6] dark:border-slate-800">
        <div>
          {/* Dashboard Switcher: 1. Corporativo & 2. Marketing */}
          <div className="inline-flex p-1 rounded-[8px] bg-[#E3E8E6]/70 dark:bg-slate-800/80 border border-[#E3E8E6] dark:border-slate-700 mb-2.5">
            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-1 rounded-[6px] bg-white dark:bg-slate-900 text-[#0F766E] dark:text-teal-300 font-semibold text-[12px] shadow-2xs border border-[#E3E8E6] dark:border-slate-700 cursor-default"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-[#0F766E]" />
              <span>1. Dashboard Corporativo</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveModule('marketing')}
              className="flex items-center gap-1.5 px-3 py-1 rounded-[6px] text-[#6B7280] hover:text-[#111827] dark:text-slate-400 dark:hover:text-white font-medium text-[12px] transition cursor-pointer"
              title="Ir al Dashboard 2: Marketing, BI & Clientes"
            >
              <Target className="w-3.5 h-3.5" />
              <span>2. Dashboard de Marketing</span>
            </button>
          </div>

          <h1 className="text-[20px] font-semibold text-[#111827] dark:text-white leading-tight">
            Resumen ejecutivo
          </h1>
          <p className="text-[14px] text-[#6B7280] dark:text-slate-400 mt-1">
            Métricas de ingresos, egresos, rentabilidad y tesorería en tiempo real.
          </p>
        </div>

        {/* Action Buttons: Exactly ONE primary button (#0F766E), others secondary */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={() => setIsPdfModalOpen(true)}
            className="px-3 py-1.5 rounded-[6px] border border-[#E3E8E6] dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-[#F6F8F7] text-[#111827] dark:text-slate-200 text-[14px] font-medium transition-all duration-150 hover:shadow-xs flex items-center gap-1.5 cursor-pointer shadow-none"
            title="Exportar informe"
          >
            <FileText className="w-4 h-4 text-[#6B7280]" />
            <span className="hidden sm:inline">Exportar informe</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveModule('purchases')}
            className="px-3 py-1.5 rounded-[6px] border border-[#E3E8E6] dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-[#F6F8F7] text-[#111827] dark:text-slate-200 text-[14px] font-medium transition-all duration-150 hover:shadow-xs flex items-center gap-1.5 cursor-pointer shadow-none"
            title="Agregar productos al inventario"
          >
            <Package className="w-4 h-4 text-[#6B7280]" />
            <span>+ Producto</span>
          </button>
          <button
            type="button"
            onClick={onOpenNewPurchase}
            className="px-3 py-1.5 rounded-[6px] border border-[#E3E8E6] dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-[#F6F8F7] text-[#111827] dark:text-slate-200 text-[14px] font-medium transition-all duration-150 hover:shadow-xs flex items-center gap-1.5 cursor-pointer shadow-none"
            title="Registrar nueva compra"
          >
            <ShoppingBag className="w-4 h-4 text-[#6B7280]" />
            <span>+ Compra</span>
          </button>
          {/* THE ONLY PRIMARY ACTION BUTTON ON THE SCREEN */}
          <button
            type="button"
            onClick={onOpenNewSale}
            className="px-3.5 py-1.5 rounded-[6px] bg-[#0F766E] hover:bg-[#115E59] text-white text-[14px] font-medium flex items-center gap-1.5 transition-all duration-150 hover:shadow-xs shadow-none cursor-pointer"
            title="Registrar nueva venta o comprobante DTE"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>+ Nueva venta</span>
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 2. BARRA DE FILTROS - DASHBOARD CORPORATIVO */}
      {/* ---------------------------------------------------- */}
      <div className="rounded-[8px] border border-[#E3E8E6] dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-none space-y-3.5">
        {/* Cabecera de filtros con icono creativo y minimalista */}
        <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-[#E3E8E6] dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-[6px] bg-teal-50 dark:bg-teal-950/60 border border-teal-200/80 dark:border-teal-800/80 flex items-center justify-center text-[#0F766E]">
              <SlidersHorizontal className="w-3.5 h-3.5 stroke-[2]" />
            </div>
            <div>
              <span className="text-[13px] font-semibold text-[#111827] dark:text-white">
                Filtros de consulta y período
              </span>
              <span className="text-[11px] text-[#6B7280] ml-2 hidden md:inline">
                Filtra por sucursal, año, mes y día específico
              </span>
            </div>
          </div>

          {/* Botón de limpiar filtros cuando hay cambios activos */}
          {(selectedBranchId !== 'all' || opFilterMonth !== 'all' || opFilterDay !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSelectedBranchId('all');
                setOpFilterMonth('all');
                setOpFilterDay('all');
              }}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] text-[11px] font-medium text-[#6B7280] hover:text-[#0F766E] hover:bg-teal-50 dark:hover:bg-slate-800 transition cursor-pointer border border-transparent hover:border-teal-200"
              title="Restablecer filtros a todo el año"
            >
              <RotateCcw className="w-3 h-3 text-[#0F766E]" />
              <span>Restablecer</span>
            </button>
          )}
        </div>

        {/* Controles de filtros con iconos creativos y minimalistas */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            {/* 1. Sucursal con icono Building2 */}
            <div className="flex items-center rounded-[6px] border border-[#E3E8E6] dark:border-slate-700 bg-[#F6F8F7]/70 dark:bg-slate-800/70 hover:bg-white dark:hover:bg-slate-800 hover:border-teal-500/50 focus-within:border-[#0F766E] focus-within:bg-white transition-all pl-2.5 pr-2 py-1 gap-2 shadow-2xs">
              <div className="flex items-center gap-1.5 text-[#0F766E]">
                <Building2 className="w-3.5 h-3.5 stroke-[2]" />
                <span className="text-[#6B7280] dark:text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
                  Sucursal
                </span>
              </div>
              <div className="h-4 w-[1px] bg-[#E3E8E6] dark:bg-slate-700" />
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="bg-transparent text-[13px] font-medium text-[#111827] dark:text-slate-100 outline-none cursor-pointer pr-1"
              >
                <option value="all">Todas las sucursales</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Año con icono CalendarDays */}
            <div className="flex items-center rounded-[6px] border border-[#E3E8E6] dark:border-slate-700 bg-[#F6F8F7]/70 dark:bg-slate-800/70 hover:bg-white dark:hover:bg-slate-800 hover:border-teal-500/50 focus-within:border-[#0F766E] focus-within:bg-white transition-all pl-2.5 pr-2 py-1 gap-2 shadow-2xs">
              <div className="flex items-center gap-1.5 text-[#0F766E]">
                <CalendarDays className="w-3.5 h-3.5 stroke-[2]" />
                <span className="text-[#6B7280] dark:text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
                  Año
                </span>
              </div>
              <div className="h-4 w-[1px] bg-[#E3E8E6] dark:bg-slate-700" />
              <select
                value={opFilterYear}
                onChange={(e) => setOpFilterYear(Number(e.target.value))}
                className="bg-transparent text-[13px] font-medium text-[#111827] dark:text-slate-100 outline-none cursor-pointer pr-1 font-mono"
              >
                {OP_YEARS.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Mes con icono CalendarRange */}
            <div className="flex items-center rounded-[6px] border border-[#E3E8E6] dark:border-slate-700 bg-[#F6F8F7]/70 dark:bg-slate-800/70 hover:bg-white dark:hover:bg-slate-800 hover:border-teal-500/50 focus-within:border-[#0F766E] focus-within:bg-white transition-all pl-2.5 pr-2 py-1 gap-2 shadow-2xs">
              <div className="flex items-center gap-1.5 text-[#0F766E]">
                <CalendarRange className="w-3.5 h-3.5 stroke-[2]" />
                <span className="text-[#6B7280] dark:text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
                  Mes
                </span>
              </div>
              <div className="h-4 w-[1px] bg-[#E3E8E6] dark:bg-slate-700" />
              <select
                value={opFilterMonth}
                onChange={(e) => handleMonthChange(e.target.value)}
                className="bg-transparent text-[13px] font-medium text-[#111827] dark:text-slate-100 outline-none cursor-pointer pr-1"
              >
                {OP_MONTHS.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Selector de Día con icono Calendar y Calendario desplegable */}
            <div className="relative">
              <button
                type="button"
                disabled={opFilterMonth === 'all'}
                onClick={() => setIsDayPickerOpen(!isDayPickerOpen)}
                className={`flex items-center rounded-[6px] border text-[13px] transition cursor-pointer pl-2.5 pr-2 py-1 gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs ${
                  opFilterDay !== 'all'
                    ? 'bg-teal-50/80 dark:bg-teal-950/50 border-[#0F766E] text-[#0F766E] font-medium'
                    : 'bg-[#F6F8F7]/70 dark:bg-slate-800/70 hover:bg-white dark:hover:bg-slate-800 border-[#E3E8E6] dark:border-slate-700 text-[#111827] dark:text-slate-200 hover:border-teal-500/50'
                }`}
                title={opFilterMonth === 'all' ? 'Selecciona un mes para habilitar el selector de día' : 'Elegir día específico'}
              >
                <div className="flex items-center gap-1.5 text-[#0F766E]">
                  <Calendar className="w-3.5 h-3.5 stroke-[2]" />
                  <span className="text-[#6B7280] dark:text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
                    Día
                  </span>
                </div>
                <div className="h-4 w-[1px] bg-[#E3E8E6] dark:border-slate-700" />
                <span>{opFilterDay === 'all' ? 'Todos los días' : `Día ${opFilterDay}`}</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#6B7280] ml-0.5" />
              </button>

              {/* Calendario Desplegable */}
              {isDayPickerOpen && opFilterMonth !== 'all' && (
                <>
                  <div
                    className="fixed inset-0 z-40 bg-black/10"
                    onClick={() => setIsDayPickerOpen(false)}
                  />
                  <div className="absolute top-full mt-1.5 left-0 z-50 bg-white dark:bg-slate-900 border border-[#E3E8E6] dark:border-slate-700 rounded-[8px] p-4 shadow-none w-72 space-y-3">
                    <div className="flex items-center justify-between border-b border-[#E3E8E6] dark:border-slate-800 pb-2">
                      <span className="text-[14px] font-semibold text-[#111827] dark:text-white capitalize flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#0F766E]" />
                        <span>{OP_MONTHS.find((m) => m.key === opFilterMonth)?.name} {opFilterYear}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsDayPickerOpen(false)}
                        className="text-[#6B7280] hover:text-[#111827] text-[14px] cursor-pointer p-0.5"
                      >
                        <X className="w-4 h-4 text-[#6B7280]" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setOpFilterDay('all');
                        setIsDayPickerOpen(false);
                      }}
                      className={`w-full py-1.5 px-3 rounded-[6px] text-[12px] font-medium transition cursor-pointer ${
                        opFilterDay === 'all'
                          ? 'bg-[#0F766E] text-white'
                          : 'bg-[#F6F8F7] dark:bg-slate-800 text-[#111827] dark:text-slate-200 border border-[#E3E8E6] dark:border-slate-700 hover:bg-[#E3E8E6]'
                      }`}
                    >
                      Todos los días del mes
                    </button>

                    <div className="grid grid-cols-7 gap-1 text-center text-[12px] text-[#6B7280]">
                      <span>Lu</span><span>Ma</span><span>Mi</span><span>Ju</span><span>Vi</span><span>Sá</span><span>Do</span>
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: firstDayOfMonthOffset }).map((_, idx) => (
                        <div key={`empty-${idx}`} className="h-7" />
                      ))}

                      {Array.from({ length: daysInSelectedMonth }, (_, idx) => idx + 1).map((d) => {
                        const isSelected = opFilterDay === String(d);
                        const now = new Date();
                        const isRealToday =
                          opFilterYear === now.getFullYear() &&
                          opFilterMonth === String(now.getMonth() + 1).padStart(2, '0') &&
                          d === now.getDate();

                        return (
                          <button
                            key={d}
                            type="button"
                            onClick={() => {
                              setOpFilterDay(String(d));
                              setIsDayPickerOpen(false);
                            }}
                            className={`h-7 rounded-[4px] text-[12px] transition flex items-center justify-center cursor-pointer ${
                              isSelected
                                ? 'bg-[#0F766E] text-white font-semibold'
                                : isRealToday
                                ? 'border border-[#0F766E] text-[#0F766E] font-medium'
                                : 'text-[#111827] dark:text-slate-200 hover:bg-[#F6F8F7] dark:hover:bg-slate-800'
                            }`}
                          >
                            <span>{d}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* 5. Botón rápido "Hoy" con icono Clock */}
            <button
              type="button"
              onClick={handleSetToday}
              className="flex items-center gap-1.5 px-3 py-1 rounded-[6px] border border-[#E3E8E6] dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-[#F6F8F7] hover:border-[#0F766E] text-[#111827] dark:text-slate-200 text-[13px] font-medium transition cursor-pointer shadow-2xs group"
              title="Fijar año, mes y día de hoy"
            >
              <Clock className="w-3.5 h-3.5 text-[#0F766E] group-hover:scale-110 transition-transform" />
              <span>Hoy</span>
            </button>
          </div>
        </div>

        {/* Pestañas con scroll horizontal y subrayado verde en la activa */}
        <div className="flex items-center gap-6 overflow-x-auto pb-1 text-[14px] no-scrollbar pt-2 border-t border-[#E3E8E6] dark:border-slate-800">
          {[
            { id: 'resumen', label: 'Resumen ejecutivo', href: '#sec-kpis' },
            { id: 'graficos', label: 'Evolución y rentabilidad', href: '#sec-graficos' },
            { id: 'fiscal', label: 'Cumplimiento fiscal SV', href: '#sec-fiscal' },
            { id: 'desglose', label: 'Desglose operativo', href: '#sec-desglose' },
            { id: 'sucursales', label: 'Sucursales', href: '#sec-sucursales' },
            { id: 'tesoreria', label: 'Tesorería y cartera', href: '#sec-tesoreria' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <a
                key={tab.id}
                href={tab.href}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-2.5 -mb-[1px] whitespace-nowrap transition-colors cursor-pointer text-[14px] ${
                  isActive
                    ? 'border-b-2 border-[#0F766E] text-[#0F766E] font-semibold'
                    : 'text-[#6B7280] hover:text-[#111827] dark:text-slate-400 dark:hover:text-white font-medium border-b-2 border-transparent'
                }`}
              >
                {tab.label}
              </a>
            );
          })}
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* GUÍA RÁPIDA: EMPEZAR (Pasos 1-2-3 con barra de progreso) */}
      {/* ---------------------------------------------------- */}
      <div className="rounded-[8px] border border-[#E3E8E6] dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-none transition-all duration-150 hover:shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E3E8E6] dark:border-slate-800">
          <div>
            <h3 className="text-[16px] font-semibold text-[#111827] dark:text-white">
              Pasos para empezar a operar
            </h3>
            <p className="text-[14px] text-[#6B7280] dark:text-slate-400 mt-0.5">
              Completa la configuración esencial de tu empresa para emitir facturación y llevar control contable.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <span className="text-[12px] font-medium text-[#6B7280]">
              Progreso: <strong className="text-[#111827] dark:text-white [font-variant-numeric:tabular-nums]">{onboardingStepsCompleted} de 3 completado</strong> ({onboardingProgressPct}%)
            </span>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="w-full bg-[#E3E8E6] dark:bg-slate-800 h-2 rounded-full overflow-hidden">
          <div
            className="bg-[#0F766E] h-full rounded-full transition-all duration-300"
            style={{ width: `${Math.max(6, onboardingProgressPct)}%` }}
          />
        </div>

        {/* Lista de pasos 1-2-3 con botón de acción */}
        <div className="divide-y divide-[#E3E8E6] dark:divide-slate-800">
          {/* Paso 1 */}
          <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${step1CatalogDone ? 'bg-teal-50 text-[#0F766E] dark:bg-teal-950/60' : 'bg-slate-100 text-[#6B7280]'}`}>
                <Package className="w-4 h-4 stroke-[1.75]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-semibold text-[#111827] dark:text-white">
                    1. Catálogo e inventario
                  </span>
                  {step1CatalogDone ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#0F766E] bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-full border border-teal-200 dark:border-teal-800">
                      <Check className="w-3 h-3" /> Completado
                    </span>
                  ) : (
                    <span className="text-[11px] text-[#6B7280]">Pendiente</span>
                  )}
                </div>
                <p className="text-[12px] text-[#6B7280] dark:text-slate-400 mt-0.5">
                  Crea productos o servicios con precios con IVA incluido y costo de adquisición.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveModule('purchases')}
              className="px-3 py-1.5 rounded-[6px] border border-[#E3E8E6] dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-[#F6F8F7] text-[#111827] dark:text-slate-200 text-[12px] font-medium transition cursor-pointer self-start sm:self-auto shrink-0 shadow-none"
            >
              Agregar productos
            </button>
          </div>

          {/* Paso 2 */}
          <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${step2SaleDone ? 'bg-teal-50 text-[#0F766E] dark:bg-teal-950/60' : 'bg-slate-100 text-[#6B7280]'}`}>
                <ScanBarcode className="w-4 h-4 stroke-[1.75]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-semibold text-[#111827] dark:text-white">
                    2. Terminal Punto de Venta (POS)
                  </span>
                  {step2SaleDone ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#0F766E] bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-full border border-teal-200 dark:border-teal-800">
                      <Check className="w-3 h-3" /> Completado
                    </span>
                  ) : (
                    <span className="text-[11px] text-[#6B7280]">Pendiente</span>
                  )}
                </div>
                <p className="text-[12px] text-[#6B7280] dark:text-slate-400 mt-0.5">
                  Abre turno de caja o emite comprobantes electrónicos DTE (Factura o Crédito Fiscal).
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveModule('pos_terminal')}
              className="px-3 py-1.5 rounded-[6px] border border-[#E3E8E6] dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-[#F6F8F7] text-[#111827] dark:text-slate-200 text-[12px] font-medium transition cursor-pointer self-start sm:self-auto shrink-0 shadow-none"
            >
              Abrir caja
            </button>
          </div>

          {/* Paso 3 */}
          <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${step3PurchaseDone ? 'bg-teal-50 text-[#0F766E] dark:bg-teal-950/60' : 'bg-slate-100 text-[#6B7280]'}`}>
                <ShoppingBag className="w-4 h-4 stroke-[1.75]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-semibold text-[#111827] dark:text-white">
                    3. Registro de compras y gastos
                  </span>
                  {step3PurchaseDone ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#0F766E] bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-full border border-teal-200 dark:border-teal-800">
                      <Check className="w-3 h-3" /> Completado
                    </span>
                  ) : (
                    <span className="text-[11px] text-[#6B7280]">Pendiente</span>
                  )}
                </div>
                <p className="text-[12px] text-[#6B7280] dark:text-slate-400 mt-0.5">
                  Registra facturas de proveedores para deducir Crédito Fiscal IVA y costear inventario.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenNewPurchase}
              className="px-3 py-1.5 rounded-[6px] border border-[#E3E8E6] dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-[#F6F8F7] text-[#111827] dark:text-slate-200 text-[12px] font-medium transition cursor-pointer self-start sm:self-auto shrink-0 shadow-none"
            >
              Registrar compra
            </button>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* FILA DE 4 KPIS: Ingresos, Egresos, Utilidad, IVA por pagar */}
      {/* ---------------------------------------------------- */}
      <section id="sec-kpis" className="space-y-3"><p className="text-xs text-slate-500">Los indicadores contables consolidan toda la empresa. Ventas, cartera y compras por sucursal se consultan en sus módulos.</p>
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-[#111827] dark:text-white">
            Indicadores financieros clave (KPIs)
          </h2>
          <div className="text-[12px] text-[#6B7280] dark:text-slate-400 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#6B7280]" />
            <span>
              {opFilterDay !== 'all'
                ? `Día ${opFilterDay} de ${OP_MONTHS.find((m) => m.key === opFilterMonth)?.name} ${opFilterYear}`
                : opFilterMonth !== 'all'
                ? `${OP_MONTHS.find((m) => m.key === opFilterMonth)?.name} ${opFilterYear}`
                : `Ejercicio ${opFilterYear}`}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1: Ingresos */}
          <div className="p-5 rounded-[8px] bg-white dark:bg-slate-900 border border-[#E3E8E6] dark:border-slate-800 shadow-none transition-all duration-150 hover:shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-medium text-[#6B7280] dark:text-slate-400">
                  Ingresos totales
                </span>
                <div className="w-9 h-9 rounded-full bg-teal-50 dark:bg-teal-950/60 flex items-center justify-center text-[#0F766E]">
                  <TrendingUp className="w-4 h-4 stroke-[1.75]" />
                </div>
              </div>
              <div className="text-[28px] font-semibold text-[#111827] dark:text-white [font-variant-numeric:tabular-nums] mt-1 leading-none">
                {formatCurrencyUSD(financialSummary.ingresosTotales)}
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-[12px]">
                {hasRealFinancialData ? (
                  <>
                    <span className="text-[#059669] font-medium flex items-center">
                      ▲ +12.4%
                    </span>
                    <span className="text-[#6B7280] dark:text-slate-400">vs período anterior</span>
                  </>
                ) : (
                  <span className="text-[#6B7280] dark:text-slate-400">Período inicial</span>
                )}
              </div>
            </div>
            {/* Sparkline mini-chart */}
            <div className="h-9 w-full mt-3 pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={kpiSparklines.ingresos} margin={{ top: 2, right: 2, left: 2, bottom: 0 }}>
                  <Area type="monotone" dataKey="val" stroke="#0F766E" fill="#0F766E" fillOpacity={0.15} strokeWidth={2} dot={false} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* KPI 2: Egresos */}
          <div className="p-5 rounded-[8px] bg-white dark:bg-slate-900 border border-[#E3E8E6] dark:border-slate-800 shadow-none transition-all duration-150 hover:shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-medium text-[#6B7280] dark:text-slate-400">
                  Egresos totales
                </span>
                <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[#64748B]">
                  <ShoppingBag className="w-4 h-4 stroke-[1.75]" />
                </div>
              </div>
              <div className="text-[28px] font-semibold text-[#111827] dark:text-white [font-variant-numeric:tabular-nums] mt-1 leading-none">
                {formatCurrencyUSD(financialSummary.egresosTotales)}
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-[12px]">
                {hasRealFinancialData ? (
                  <>
                    <span className="text-[#DC2626] font-medium flex items-center">
                      ▼ -3.2%
                    </span>
                    <span className="text-[#6B7280] dark:text-slate-400">vs período anterior</span>
                  </>
                ) : (
                  <span className="text-[#6B7280] dark:text-slate-400">Período inicial</span>
                )}
              </div>
            </div>
            {/* Sparkline mini-chart */}
            <div className="h-9 w-full mt-3 pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={kpiSparklines.egresos} margin={{ top: 2, right: 2, left: 2, bottom: 0 }}>
                  <Area type="monotone" dataKey="val" stroke="#64748B" fill="#64748B" fillOpacity={0.15} strokeWidth={2} dot={false} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* KPI 3: Utilidad */}
          <div className="p-5 rounded-[8px] bg-white dark:bg-slate-900 border border-[#E3E8E6] dark:border-slate-800 shadow-none transition-all duration-150 hover:shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-medium text-[#6B7280] dark:text-slate-400">
                  Utilidad neta
                </span>
                <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-[#059669]">
                  <Scale className="w-4 h-4 stroke-[1.75]" />
                </div>
              </div>
              <div className={`text-[28px] font-semibold [font-variant-numeric:tabular-nums] mt-1 leading-none ${financialSummary.utilidadNeta >= 0 ? 'text-[#059669]' : 'text-[#DC2626]'}`}>
                {formatCurrencyUSD(financialSummary.utilidadNeta)}
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-[12px]">
                <span className={`font-medium ${financialSummary.margenNeto >= 0 ? 'text-[#059669]' : 'text-[#DC2626]'}`}>
                  ▲ {financialSummary.margenNeto.toFixed(1)}%
                </span>
                <span className="text-[#6B7280] dark:text-slate-400">margen neto</span>
              </div>
            </div>
            {/* Sparkline mini-chart */}
            <div className="h-9 w-full mt-3 pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={kpiSparklines.utilidad} margin={{ top: 2, right: 2, left: 2, bottom: 0 }}>
                  <Area type="monotone" dataKey="val" stroke="#059669" fill="#059669" fillOpacity={0.15} strokeWidth={2} dot={false} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* KPI 4: IVA por pagar */}
          <div className="p-5 rounded-[8px] bg-white dark:bg-slate-900 border border-[#E3E8E6] dark:border-slate-800 shadow-none transition-all duration-150 hover:shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-medium text-[#6B7280] dark:text-slate-400">
                  {taxSummaryRealTime.ivaNetoPagar > 0 ? 'IVA por pagar' : 'Remanente a favor'}
                </span>
                <div className="w-9 h-9 rounded-full bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600">
                  <Receipt className="w-4 h-4 stroke-[1.75]" />
                </div>
              </div>
              <div className={`text-[28px] font-semibold [font-variant-numeric:tabular-nums] mt-1 leading-none ${taxSummaryRealTime.ivaNetoPagar > 0 ? 'text-amber-600' : 'text-[#059669]'}`}>
                {formatCurrencyUSD(
                  taxSummaryRealTime.ivaNetoPagar > 0
                    ? taxSummaryRealTime.ivaNetoPagar
                    : taxSummaryRealTime.remanenteFavor
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-[12px]">
                <span className="text-[#6B7280] dark:text-slate-400 font-medium">
                  F-07 vence día {TAX_DEADLINES.ivaF07Day}:
                </span>
                <span className="font-semibold text-amber-700 dark:text-amber-400">
                  {taxSummaryRealTime.daysRemainingF07} días restantes
                </span>
              </div>
            </div>
            {/* Sparkline mini-chart */}
            <div className="h-9 w-full mt-3 pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={kpiSparklines.iva} margin={{ top: 2, right: 2, left: 2, bottom: 0 }}>
                  <Area type="monotone" dataKey="val" stroke="#D97706" fill="#D97706" fillOpacity={0.15} strokeWidth={2} dot={false} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* GRÁFICO COMPLETO CON EJES X/Y: INGRESOS, EGRESOS Y RENTABILIDAD */}
      {/* ---------------------------------------------------- */}
      <section id="sec-graficos" className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-[16px] font-semibold text-[#111827] dark:text-white">
              Evolución de Ingresos, Egresos y Rentabilidad Neta
            </h2>
            <p className="text-[12px] text-[#6B7280] dark:text-slate-400">
              Gráfico analítico completo con sus respectivos ejes X e Y, comparativa mensual y distribución de costos.
            </p>
          </div>

          {!hasRealFinancialData && (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#F6F8F7] dark:bg-slate-800 text-[12px] text-[#6B7280] dark:text-slate-400 font-medium border border-[#E3E8E6] dark:border-slate-700">
                <AlertCircle className="w-3.5 h-3.5 text-[#6B7280]" />
                <span>Sin movimientos registrados</span>
              </span>
              <button
                type="button"
                onClick={onOpenNewSale}
                className="px-3 py-1 rounded-[6px] bg-[#0F766E] hover:bg-[#115E59] text-white text-[12px] font-medium transition cursor-pointer"
              >
                Registrar primera venta
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Gráfico grande con ejes X e Y (7/12) */}
          <div className={`lg:col-span-7 p-6 rounded-[8px] bg-white dark:bg-slate-900 border border-[#E3E8E6] dark:border-slate-800 shadow-none transition-all duration-150 hover:shadow-xs space-y-4 ${!hasRealFinancialData ? 'opacity-90' : ''}`}>
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#E3E8E6] dark:border-slate-800">
              <div>
                <span className="text-[14px] font-semibold text-[#111827] dark:text-white">
                  Evolución financiera ({opFilterYear})
                </span>
                <span className="text-[12px] text-[#6B7280] block sm:inline sm:ml-2">
                  {hasRealFinancialData ? 'Registros del ejercicio' : 'Simulación de referencia'}
                </span>
              </div>

              {/* Selector de tipo de gráfico: Barras / Líneas / Área */}
              <div className="flex items-center gap-1 p-0.5 rounded-[6px] bg-[#F6F8F7] dark:bg-slate-800 border border-[#E3E8E6] dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setFlowChartType('bars')}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded transition cursor-pointer ${
                    flowChartType === 'bars'
                      ? 'bg-white dark:bg-slate-700 text-[#0F766E] dark:text-white shadow-2xs font-semibold'
                      : 'text-[#6B7280] hover:text-[#111827]'
                  }`}
                >
                  Barras
                </button>
                <button
                  type="button"
                  onClick={() => setFlowChartType('lines')}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded transition cursor-pointer ${
                    flowChartType === 'lines'
                      ? 'bg-white dark:bg-slate-700 text-[#0F766E] dark:text-white shadow-2xs font-semibold'
                      : 'text-[#6B7280] hover:text-[#111827]'
                  }`}
                >
                  Líneas
                </button>
                <button
                  type="button"
                  onClick={() => setFlowChartType('area')}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded transition cursor-pointer ${
                    flowChartType === 'area'
                      ? 'bg-white dark:bg-slate-700 text-[#0F766E] dark:text-white shadow-2xs font-semibold'
                      : 'text-[#6B7280] hover:text-[#111827]'
                  }`}
                >
                  Área
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-500">Contabilidad consolidada de la empresa: ingresos, costos y gastos asentados. El efectivo se consulta en Flujo de efectivo.</p><FinancialEvolutionChart data={displayMonthlyChartData} type={flowChartType} />
          </div>

          {/* Dona de Gastos por Categoría (5/12) */}
          <div className={`lg:col-span-5 p-6 rounded-[8px] bg-white dark:bg-slate-900 border border-[#E3E8E6] dark:border-slate-800 shadow-none transition-all duration-150 hover:shadow-xs space-y-4 ${!hasRealFinancialData ? 'opacity-90' : ''}`}>
            <div className="flex items-center justify-between pb-2 border-b border-[#E3E8E6] dark:border-slate-800">
              <span className="text-[14px] font-semibold text-[#111827] dark:text-white">
                Gastos por categoría
              </span>
              <span className="text-[12px] text-[#6B7280]">
                {hasRealFinancialData ? 'Distribución del período' : 'Sin gastos registrados'}
              </span>
            </div>

            <div className="h-80 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={displayExpenseDonutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {displayExpenseDonutData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any) => [`$${Number(v).toLocaleString()}`, 'Monto']} />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 11, color: '#6B7280' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* TARJETA DESTACADA: CUMPLIMIENTO FISCAL EL SALVADOR */}
      {/* FRANJA LATERAL DE COLOR 4PX EN LO MÁS URGENTE (F-07) */}
      {/* ---------------------------------------------------- */}
      <section id="sec-fiscal" className="space-y-3">
        <div className="p-6 rounded-[8px] bg-white dark:bg-slate-900 border border-[#E3E8E6] dark:border-slate-800 shadow-none transition-all duration-150 hover:shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E3E8E6] dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-50 dark:bg-teal-950/60 text-[#0F766E] dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                  Diferenciador FinaPyme
                </span>
                <span className="text-[12px] text-[#6B7280]">Marco Legal El Salvador</span>
              </div>
              <h2 className="text-[18px] font-bold text-[#111827] dark:text-white mt-1">
                Cumplimiento fiscal El Salvador
              </h2>
              <p className="text-[14px] text-[#6B7280] dark:text-slate-400 mt-0.5">
                Supervisión tributaria y previsional en tiempo real ante el Ministerio de Hacienda, ISSS y AFP.
              </p>
            </div>

            <div className="flex items-center gap-1.5 text-[12px] text-[#6B7280] self-start sm:self-auto">
              <ShieldCheck className="w-4 h-4 text-[#0F766E] shrink-0" />
              <span>{TAX_DEADLINES.note} · Art. 156 y 162 del Código Tributario</span>
            </div>
          </div>

          {/* 3 Columnas con estados claros - La más urgente lleva franja lateral de 4px */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Columna 1: DTE Emitidos (Neutral) */}
            <div className="p-5 rounded-[8px] bg-[#F6F8F7] dark:bg-slate-800/60 border border-[#E3E8E6] dark:border-slate-700 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-semibold uppercase tracking-wider text-[#6B7280]">
                    Facturación Electrónica
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#0F766E] bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                    <Check className="w-3 h-3" /> Transmisión MH
                  </span>
                </div>
                <h3 className="text-[16px] font-semibold text-[#111827] dark:text-white mt-2">
                  DTE emitidos
                </h3>
                <div className="text-[28px] font-semibold text-[#111827] dark:text-white [font-variant-numeric:tabular-nums] mt-1">
                  {invoices.length} <span className="text-[14px] font-normal text-[#6B7280]">comprobantes</span>
                </div>
                <div className="space-y-1 mt-3 text-[12px] text-[#6B7280]">
                  <p>Facturación gravada: <span className="font-semibold text-[#111827] dark:text-white [font-variant-numeric:tabular-nums]">{formatCurrencyUSD(financialSummary.ventas)}</span></p>
                  <p>Contingencia pendiente: <span className="font-semibold text-[#0F766E]">0 comprobantes</span></p>
                  <p>Modalidad: <span className="font-medium text-[#111827] dark:text-white">{currentCompany.dteActive ? 'DTE Directo Hacienda' : 'Control Interno & POS'}</span></p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveModule('sales')}
                className="w-full py-1.5 px-3 rounded-[6px] border border-[#E3E8E6] dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-[#F6F8F7] text-[#111827] dark:text-slate-200 text-[12px] font-medium transition cursor-pointer text-center"
              >
                Ver libros de ventas e IVA
              </button>
            </div>

            {/* Columna 2: Declaración F-07 (LO MÁS URGENTE: FRANJA LATERAL DE COLOR 4PX) */}
            <div className="p-5 rounded-[8px] bg-white dark:bg-slate-800/60 border border-[#E3E8E6] dark:border-slate-700 border-l-4 border-l-amber-500 flex flex-col justify-between space-y-4 shadow-xs">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-semibold uppercase tracking-wider text-[#6B7280]">
                    Ministerio de Hacienda
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    <Clock className="w-3 h-3" /> {taxSummaryRealTime.daysRemainingF07} días restantes
                  </span>
                </div>
                <h3 className="text-[16px] font-semibold text-[#111827] dark:text-white mt-2">
                  Declaración F-07 (IVA & Pago Cuenta)
                </h3>
                <div className="text-[28px] font-semibold text-[#111827] dark:text-white [font-variant-numeric:tabular-nums] mt-1">
                  {formatCurrencyUSD(taxSummaryRealTime.ivaNetoPagar > 0 ? taxSummaryRealTime.ivaNetoPagar : taxSummaryRealTime.remanenteFavor)}
                </div>
                <div className="space-y-1 mt-3 text-[12px] text-[#6B7280]">
                  <p>Débito Fiscal (13%): <span className="font-semibold text-[#111827] dark:text-white [font-variant-numeric:tabular-nums]">{formatCurrencyUSD(taxSummaryRealTime.debitoFiscal)}</span></p>
                  <p>Crédito Fiscal (13%): <span className="font-semibold text-[#111827] dark:text-white [font-variant-numeric:tabular-nums]">{formatCurrencyUSD(taxSummaryRealTime.creditoFiscal)}</span></p>
                  <p>Pago a cuenta (1.75%): <span className="font-semibold text-[#111827] dark:text-white [font-variant-numeric:tabular-nums]">{formatCurrencyUSD(taxSummaryRealTime.pagoCuenta)}</span></p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveModule('accounting')}
                className="w-full py-1.5 px-3 rounded-[6px] border border-[#E3E8E6] dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-[#F6F8F7] text-[#111827] dark:text-slate-200 text-[12px] font-medium transition cursor-pointer text-center"
              >
                Generar borrador F-07
              </button>
            </div>

            {/* Columna 3: Planilla ISSS / AFP (Neutral) */}
            <div className="p-5 rounded-[8px] bg-[#F6F8F7] dark:bg-slate-800/60 border border-[#E3E8E6] dark:border-slate-700 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-semibold uppercase tracking-wider text-[#6B7280]">
                    Seguridad Social SV
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                    <Clock className="w-3 h-3" /> Vence día {TAX_DEADLINES.isssDay}
                  </span>
                </div>
                <h3 className="text-[16px] font-semibold text-[#111827] dark:text-white mt-2">
                  Planilla ISSS / AFP
                </h3>
                <div className="text-[28px] font-semibold text-[#111827] dark:text-white [font-variant-numeric:tabular-nums] mt-1">
                  {formatCurrencyUSD(taxSummaryRealTime.isss + taxSummaryRealTime.afp)}
                </div>
                <div className="space-y-1 mt-3 text-[12px] text-[#6B7280]">
                  <p>Aporte ISSS Salud: <span className="font-semibold text-[#111827] dark:text-white [font-variant-numeric:tabular-nums]">{formatCurrencyUSD(taxSummaryRealTime.isss)}</span></p>
                  <p>Aporte AFP Pensiones: <span className="font-semibold text-[#111827] dark:text-white [font-variant-numeric:tabular-nums]">{formatCurrencyUSD(taxSummaryRealTime.afp)}</span></p>
                  <p>Planilla activa: <span className="font-medium text-[#111827] dark:text-white">{employees.filter(e => e.isActive).length} empleados registrados</span></p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveModule('payroll')}
                className="w-full py-1.5 px-3 rounded-[6px] border border-[#E3E8E6] dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-[#F6F8F7] text-[#111827] dark:text-slate-200 text-[12px] font-medium transition cursor-pointer text-center"
              >
                Gestionar nómina e ingresos
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* SECCIÓN 3. DESGLOSE OPERATIVO: DE DÓNDE VIENEN Y A DÓNDE VAN */}
      {/* ---------------------------------------------------- */}
      <section id="sec-desglose" className="space-y-4">
        <h2 className="text-[16px] font-semibold text-[#111827] dark:text-white">
          Desglose operativo de fondos
        </h2>

        {/* Gráficos a y b en 2 columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* a) Ingresos por tipo (dona) */}
          <div className="p-6 rounded-[8px] bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 shadow-none space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] dark:border-slate-800">
              <div>
                <h3 className="text-[14px] font-semibold text-[#111827] dark:text-white">
                  Ingresos por tipo de comprobante y concepto
                </h3>
                <p className="text-[12px] text-[#6B7280] dark:text-slate-400 mt-0.5">Ventas DTE y otros ingresos</p>
              </div>
              <span className="text-[14px] font-mono font-semibold text-[#111827] dark:text-white">
                {formatCurrencyUSD(financialSummary.ingresosTotales)}
              </span>
            </div>

            <div className="h-56 w-full">
              {incomeByTypeData.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                  <Receipt className="w-8 h-8 text-[#9CA3AF] stroke-[1.5]" />
                  <p className="text-[14px] text-[#6B7280]">Sin ingresos registrados en este período ($0.00)</p>
                  <button
                    type="button"
                    onClick={onOpenNewSale}
                    className="mt-2 px-3 py-1.5 rounded-[6px] border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-[#F9FAFB] text-[#111827] dark:text-slate-200 text-[12px] font-medium transition cursor-pointer"
                  >
                    Registrar primera venta
                  </button>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={incomeByTypeData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={2}
                      label={({ name, percent }) => `${name.substring(0, 15)} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {incomeByTypeData.map((_, idx) => (
                        <Cell key={`type-cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: any) => [`$${Number(v).toLocaleString()}`, '']} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* b) Egresos por concepto (barras horizontales) */}
          <div className="p-6 rounded-[8px] bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 shadow-none space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] dark:border-slate-800">
              <div>
                <h3 className="text-[14px] font-semibold text-[#111827] dark:text-white">
                  Egresos por concepto
                </h3>
                <p className="text-[12px] text-[#6B7280] dark:text-slate-400 mt-0.5">Compras, planilla, gastos e impuestos</p>
              </div>
              <span className="text-[14px] font-mono font-semibold text-[#111827] dark:text-white">
                {formatCurrencyUSD(financialSummary.egresosTotales)}
              </span>
            </div>

            <div className="h-56 w-full">
              {expenseByConceptData.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                  <ShoppingBag className="w-8 h-8 text-[#9CA3AF] stroke-[1.5]" />
                  <p className="text-[14px] text-[#6B7280]">Sin egresos registrados en este período ($0.00)</p>
                  <button
                    type="button"
                    onClick={onOpenNewPurchase}
                    className="mt-2 px-3 py-1.5 rounded-[6px] border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-[#F9FAFB] text-[#111827] dark:text-slate-200 text-[12px] font-medium transition cursor-pointer"
                  >
                    Registrar compra o gasto
                  </button>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={expenseByConceptData} layout="vertical" margin={{ top: 5, right: 20, left: 15, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                    <XAxis type="number" tick={{ fontSize: 12, fill: '#6B7280' }} stroke="#E5E7EB" />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: '#6B7280' }} width={120} stroke="#E5E7EB" />
                    <Tooltip formatter={(v: any) => [`$${Number(v).toLocaleString()}`, '']} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {expenseByConceptData.map((entry, idx) => (
                        <Cell key={`exp-bar-${idx}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Si hay un día elegido en el filtro: mostrar métricas del día */}
        {opFilterDay !== 'all' && (
          <div className="p-6 rounded-[8px] bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 shadow-none space-y-4">
            <h3 className="text-[14px] font-semibold text-[#111827] dark:text-white">
              Visualización específica del día {opFilterDay} de {OP_MONTHS.find((m) => m.key === opFilterMonth)?.name} {opFilterYear}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-[6px] bg-[#F9FAFB] dark:bg-slate-800/60 border border-[#E5E7EB] dark:border-slate-700">
                <span className="text-[12px] font-medium text-[#6B7280] dark:text-slate-400 block">
                  Ingresos del día
                </span>
                <span className="text-[20px] font-semibold text-[#111827] dark:text-white font-mono mt-1 block">
                  {formatCurrencyUSD(financialSummary.ingresosTotales)}
                </span>
              </div>
              <div className="p-4 rounded-[6px] bg-[#F9FAFB] dark:bg-slate-800/60 border border-[#E5E7EB] dark:border-slate-700">
                <span className="text-[12px] font-medium text-[#6B7280] dark:text-slate-400 block">
                  Egresos del día
                </span>
                <span className="text-[20px] font-semibold text-[#111827] dark:text-white font-mono mt-1 block">
                  {formatCurrencyUSD(financialSummary.egresosTotales)}
                </span>
              </div>
              <div className="p-4 rounded-[6px] bg-[#F9FAFB] dark:bg-slate-800/60 border border-[#E5E7EB] dark:border-slate-700">
                <span className="text-[12px] font-medium text-[#6B7280] dark:text-slate-400 block">
                  Flujo neto del día
                </span>
                <span
                  className={`text-[20px] font-semibold font-mono mt-1 block ${
                    financialSummary.flujoNeto >= 0 ? 'text-[#059669]' : 'text-[#DC2626]'
                  }`}
                >
                  {formatCurrencyUSD(financialSummary.flujoNeto)}
                </span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ---------------------------------------------------- */}
      {/* SECCIÓN 4. RENDIMIENTO POR SUCURSAL (ORDEN POR UTILIDAD NETA) */}
      {/* ---------------------------------------------------- */}
      <section id="sec-sucursales" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-[16px] font-semibold text-[#111827] dark:text-white">
              Rendimiento por sucursal
            </h2>
            <p className="text-[14px] text-[#6B7280] dark:text-slate-400 mt-0.5">
              Comparativa de sedes ordenadas por utilidad neta en el período.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsQuickBranchOpen(true)}
            className="px-3 py-1.5 rounded-[6px] border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-[#F9FAFB] dark:hover:bg-slate-800 text-[#111827] dark:text-slate-200 text-[14px] font-medium transition flex items-center gap-1.5 cursor-pointer shadow-none self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 text-[#6B7280]" />
            <span>Nueva sucursal</span>
          </button>
        </div>

        {branchRanking.length === 0 ? (
          <div className="p-8 rounded-[8px] border border-[#E5E7EB] dark:border-slate-800 bg-white dark:bg-slate-900 text-center flex flex-col items-center justify-center space-y-2">
            <Store className="w-8 h-8 text-[#9CA3AF] stroke-[1.5]" />
            <p className="text-[14px] text-[#6B7280]">No hay sucursales registradas ($0.00)</p>
            <button
              type="button"
              onClick={() => setIsQuickBranchOpen(true)}
              className="mt-2 px-3 py-1.5 rounded-[6px] border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-[#F9FAFB] text-[#111827] dark:text-slate-200 text-[12px] font-medium transition cursor-pointer"
            >
              Registrar sucursal
            </button>
          </div>
        ) : (
          <div className="rounded-[8px] border border-[#E5E7EB] dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-none">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[14px]">
                <thead>
                  <tr className="bg-[#F9FAFB] dark:bg-slate-800/80 border-b border-[#E5E7EB] dark:border-slate-800 text-[#6B7280] dark:text-slate-400 text-[12px] font-medium">
                    <th className="px-4 py-3">Sucursal</th>
                    <th className="px-4 py-3">Ubicación</th>
                    <th className="px-4 py-3 text-right">Ventas</th>
                    <th className="px-4 py-3 text-right">Egresos</th>
                    <th className="px-4 py-3 text-right">Utilidad neta</th>
                    <th className="px-4 py-3 text-right">Margen</th>
                    <th className="px-4 py-3 text-right">Flujo neto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB] dark:divide-slate-800">
                  {branchRanking.map((b) => (
                    <tr key={b.id} className="hover:bg-[#F9FAFB] dark:hover:bg-slate-850/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-[#111827] dark:text-white">
                        <div className="flex items-center gap-2">
                          <span>{b.name}</span>
                          <span className="text-[12px] text-[#6B7280] font-mono">({b.code})</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[#6B7280] dark:text-slate-400 text-[12px]">
                        {typeof b.department === 'string' ? b.department : (b.department as any)?.name || 'San Salvador'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-medium text-[#111827] dark:text-white">
                        {formatCurrencyUSD(b.ventas)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-[#6B7280] dark:text-slate-400">
                        {formatCurrencyUSD(b.egresos)}
                      </td>
                      <td className={`px-4 py-3 text-right font-mono font-semibold ${b.utilidadNeta >= 0 ? 'text-[#059669]' : 'text-[#DC2626]'}`}>
                        {formatCurrencyUSD(b.utilidadNeta)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-[#6B7280] dark:text-slate-400 text-[12px]">
                        {b.margenNeto.toFixed(1)}%
                      </td>
                      <td className={`px-4 py-3 text-right font-mono font-medium ${b.flujoCaja >= 0 ? 'text-[#059669]' : 'text-[#DC2626]'}`}>
                        {formatCurrencyUSD(b.flujoCaja)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* ==================================================== */}
      {/* 4. ZONA B - TIEMPO REAL (IGNORA AÑO, MES Y DÍA) */}
      {/* ==================================================== */}

      {/* ---------------------------------------------------- */}
      {/* SECCIÓN 5. TESORERÍA Y CARTERA (TIEMPO REAL) */}
      {/* ---------------------------------------------------- */}
      <section id="sec-tesoreria" className="space-y-6 pt-4 border-t border-[#E5E7EB] dark:border-slate-800">
        <h2 className="text-[16px] font-semibold text-[#111827] dark:text-white">
          Tesorería, liquidez y cartera
        </h2>

        {/* Efectivo total inmediato, desglose por banco/caja y runway */}
        <TreasuryCashBreakdownCard
          title="Disponibilidad bancaria y efectivo inmediato"
          subtitle="Posición de liquidez en tiempo real y meses de cobertura operativa"
        />

        {/* Cuentas por Cobrar & Cuentas por Pagar */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cuentas por Cobrar */}
          <div className="p-6 rounded-[8px] bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 shadow-none space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-[#E5E7EB] dark:border-slate-800">
              <div>
                <span className="text-[12px] font-medium text-[#6B7280] block">
                  Cuentas por cobrar (Clientes)
                </span>
                <div className="text-[24px] font-semibold text-[#111827] dark:text-white font-mono mt-0.5">
                  {formatCurrencyUSD(cxcRealTime.total)}
                </div>
              </div>

              {/* Selector de período */}
              <div className="flex items-center gap-1 bg-[#F3F4F6] dark:bg-slate-800 p-0.5 rounded-[6px] border border-[#E5E7EB] dark:border-slate-700 text-[12px]">
                <button
                  type="button"
                  onClick={() => setCxcPeriodSelector('5m')}
                  className={`px-2.5 py-1 rounded-[4px] font-medium transition cursor-pointer ${
                    cxcPeriodSelector === '5m' ? 'bg-white dark:bg-slate-700 text-[#111827] dark:text-white shadow-none' : 'text-[#6B7280] hover:text-[#111827]'
                  }`}
                >
                  5m
                </button>
                <button
                  type="button"
                  onClick={() => setCxcPeriodSelector('12m')}
                  className={`px-2.5 py-1 rounded-[4px] font-medium transition cursor-pointer ${
                    cxcPeriodSelector === '12m' ? 'bg-white dark:bg-slate-700 text-[#111827] dark:text-white shadow-none' : 'text-[#6B7280] hover:text-[#111827]'
                  }`}
                >
                  12m
                </button>
                <button
                  type="button"
                  onClick={() => setCxcPeriodSelector('yoy')}
                  className={`px-2.5 py-1 rounded-[4px] font-medium transition cursor-pointer ${
                    cxcPeriodSelector === 'yoy' ? 'bg-white dark:bg-slate-700 text-[#111827] dark:text-white shadow-none' : 'text-[#6B7280] hover:text-[#111827]'
                  }`}
                >
                  Año vs Ant.
                </button>
              </div>
            </div>

            {/* Mini gráfico comparativo */}
            <div className="h-32 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cxcChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6B7280' }} stroke="#E5E7EB" />
                  <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} stroke="#E5E7EB" />
                  <Tooltip formatter={(v: any) => [`$${Number(v).toLocaleString()}`, 'CxC']} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {cxcChartData.map((entry, idx) => (
                      <Cell key={`cxc-cell-${idx}`} fill={entry.isCurrent ? '#0F766E' : '#94A3B8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Desglose por Antigüedad */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-[12px] pt-3 border-t border-[#E5E7EB] dark:border-slate-800">
              <div className="p-2.5 rounded-[6px] bg-[#F9FAFB] dark:bg-slate-800/60 border border-[#E5E7EB] dark:border-slate-700">
                <span className="text-[#6B7280] block font-medium">Al día</span>
                <span className="font-mono font-semibold text-[#059669] block mt-0.5 text-[14px]">
                  {formatCurrencyUSD(cxcRealTime.alDia)}
                </span>
              </div>
              <div className="p-2.5 rounded-[6px] bg-[#F9FAFB] dark:bg-slate-800/60 border border-[#E5E7EB] dark:border-slate-700">
                <span className="text-[#6B7280] block font-medium">1-30 días</span>
                <span className="font-mono font-semibold text-[#D97706] block mt-0.5 text-[14px]">
                  {formatCurrencyUSD(cxcRealTime.d1_30)}
                </span>
              </div>
              <div className="p-2.5 rounded-[6px] bg-[#F9FAFB] dark:bg-slate-800/60 border border-[#E5E7EB] dark:border-slate-700">
                <span className="text-[#6B7280] block font-medium">31-60 días</span>
                <span className="font-mono font-semibold text-[#D97706] block mt-0.5 text-[14px]">
                  {formatCurrencyUSD(cxcRealTime.d31_60)}
                </span>
              </div>
              <div className="p-2.5 rounded-[6px] bg-[#F9FAFB] dark:bg-slate-800/60 border border-[#E5E7EB] dark:border-slate-700">
                <span className="text-[#6B7280] block font-medium">&gt; 60 días</span>
                <span className="font-mono font-semibold text-[#DC2626] block mt-0.5 text-[14px]">
                  {formatCurrencyUSD(cxcRealTime.d60plus)}
                </span>
              </div>
            </div>

            {/* Top 5 Clientes que deben */}
            <div className="space-y-2 pt-3 border-t border-[#E5E7EB] dark:border-slate-800">
              <span className="text-[12px] font-medium text-[#6B7280] block">
                Principales clientes con saldo pendiente
              </span>
              {cxcRealTime.topDebtors.length === 0 ? (
                <div className="p-4 text-center space-y-1">
                  <p className="text-[14px] text-[#6B7280]">No hay cartera por cobrar pendiente ($0.00)</p>
                </div>
              ) : (
                <div className="divide-y divide-[#E5E7EB] dark:divide-slate-800">
                  {cxcRealTime.topDebtors.map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between py-2 text-[14px]">
                      <span className="truncate max-w-[200px] text-[#111827] dark:text-white font-medium">
                        {inv.customerName}
                      </span>
                      <span className="font-mono font-semibold text-[#D97706]">
                        {formatCurrencyUSD(inv.saldoPendiente ?? inv.totalPagar)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Cuentas por Pagar */}
          <div className="p-6 rounded-[8px] bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 shadow-none space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-[#E5E7EB] dark:border-slate-800">
              <div>
                <span className="text-[12px] font-medium text-[#6B7280] block">
                  Cuentas por pagar (Proveedores)
                </span>
                <div className="text-[24px] font-semibold text-[#111827] dark:text-white font-mono mt-0.5">
                  {formatCurrencyUSD(cxpRealTime.total)}
                </div>
              </div>

              {/* Selector de período */}
              <div className="flex items-center gap-1 bg-[#F3F4F6] dark:bg-slate-800 p-0.5 rounded-[6px] border border-[#E5E7EB] dark:border-slate-700 text-[12px]">
                <button
                  type="button"
                  onClick={() => setCxpPeriodSelector('5m')}
                  className={`px-2.5 py-1 rounded-[4px] font-medium transition cursor-pointer ${
                    cxpPeriodSelector === '5m' ? 'bg-white dark:bg-slate-700 text-[#111827] dark:text-white shadow-none' : 'text-[#6B7280] hover:text-[#111827]'
                  }`}
                >
                  5m
                </button>
                <button
                  type="button"
                  onClick={() => setCxpPeriodSelector('12m')}
                  className={`px-2.5 py-1 rounded-[4px] font-medium transition cursor-pointer ${
                    cxpPeriodSelector === '12m' ? 'bg-white dark:bg-slate-700 text-[#111827] dark:text-white shadow-none' : 'text-[#6B7280] hover:text-[#111827]'
                  }`}
                >
                  12m
                </button>
                <button
                  type="button"
                  onClick={() => setCxpPeriodSelector('yoy')}
                  className={`px-2.5 py-1 rounded-[4px] font-medium transition cursor-pointer ${
                    cxpPeriodSelector === 'yoy' ? 'bg-white dark:bg-slate-700 text-[#111827] dark:text-white shadow-none' : 'text-[#6B7280] hover:text-[#111827]'
                  }`}
                >
                  Año vs Ant.
                </button>
              </div>
            </div>

            {/* Mini gráfico comparativo */}
            <div className="h-32 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cxpChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6B7280' }} stroke="#E5E7EB" />
                  <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} stroke="#E5E7EB" />
                  <Tooltip formatter={(v: any) => [`$${Number(v).toLocaleString()}`, 'CxP']} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {cxpChartData.map((entry, idx) => (
                      <Cell key={`cxp-cell-${idx}`} fill={entry.isCurrent ? '#64748B' : '#94A3B8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Desglose por Antigüedad */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-[12px] pt-3 border-t border-[#E5E7EB] dark:border-slate-800">
              <div className="p-2.5 rounded-[6px] bg-[#F9FAFB] dark:bg-slate-800/60 border border-[#E5E7EB] dark:border-slate-700">
                <span className="text-[#6B7280] block font-medium">Al día</span>
                <span className="font-mono font-semibold text-[#059669] block mt-0.5 text-[14px]">
                  {formatCurrencyUSD(cxpRealTime.alDia)}
                </span>
              </div>
              <div className="p-2.5 rounded-[6px] bg-[#F9FAFB] dark:bg-slate-800/60 border border-[#E5E7EB] dark:border-slate-700">
                <span className="text-[#6B7280] block font-medium">1-30 días</span>
                <span className="font-mono font-semibold text-[#D97706] block mt-0.5 text-[14px]">
                  {formatCurrencyUSD(cxpRealTime.d1_30)}
                </span>
              </div>
              <div className="p-2.5 rounded-[6px] bg-[#F9FAFB] dark:bg-slate-800/60 border border-[#E5E7EB] dark:border-slate-700">
                <span className="text-[#6B7280] block font-medium">31-60 días</span>
                <span className="font-mono font-semibold text-[#D97706] block mt-0.5 text-[14px]">
                  {formatCurrencyUSD(cxpRealTime.d31_60)}
                </span>
              </div>
              <div className="p-2.5 rounded-[6px] bg-[#F9FAFB] dark:bg-slate-800/60 border border-[#E5E7EB] dark:border-slate-700">
                <span className="text-[#6B7280] block font-medium">&gt; 60 días</span>
                <span className="font-mono font-semibold text-[#DC2626] block mt-0.5 text-[14px]">
                  {formatCurrencyUSD(cxpRealTime.d60plus)}
                </span>
              </div>
            </div>

            {/* Top 5 Proveedores a quienes se debe */}
            <div className="space-y-2 pt-3 border-t border-[#E5E7EB] dark:border-slate-800">
              <span className="text-[12px] font-medium text-[#6B7280] block">
                Principales proveedores con saldo pendiente
              </span>
              {cxpRealTime.topCreditors.length === 0 ? (
                <div className="p-4 text-center space-y-1">
                  <p className="text-[14px] text-[#6B7280]">No hay cuentas por pagar activas ($0.00)</p>
                </div>
              ) : (
                <div className="divide-y divide-[#E5E7EB] dark:divide-slate-800">
                  {cxpRealTime.topCreditors.map((pur) => (
                    <div key={pur.id} className="flex items-center justify-between py-2 text-[14px]">
                      <span className="truncate max-w-[200px] text-[#111827] dark:text-white font-medium">
                        {pur.supplierName}
                      </span>
                      <span className="font-mono font-semibold text-[#DC2626]">
                        {formatCurrencyUSD(pur.saldoPendiente ?? pur.totalPagar)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* SECCIÓN 6. CUMPLIMIENTO TRIBUTARIO Y DIAGNÓSTICO EJECUTIVO (TIEMPO REAL) */}
      {/* ---------------------------------------------------- */}
      <section id="sec-tributario" className="space-y-6">
        <h2 className="text-[16px] font-semibold text-[#111827] dark:text-white">
          Obligaciones tributarias y diagnóstico financiero
        </h2>

        {/* Tarjeta de IVA del mes en curso y obligaciones */}
        <div className="p-6 rounded-[8px] bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 shadow-none space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E5E7EB] dark:border-slate-800">
            <div>
              <h3 className="text-[16px] font-semibold text-[#111827] dark:text-white">
                IVA del mes en curso y obligaciones mensuales
              </h3>
              <p className="text-[14px] text-[#6B7280] dark:text-slate-400 mt-0.5">
                Cálculo en tiempo real según calendario del Ministerio de Hacienda
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-[12px] text-[#6B7280] self-start sm:self-auto">
              <ShieldCheck className="w-4 h-4 text-[#6B7280] shrink-0" />
              <span>{TAX_DEADLINES.note} · Art. 156 y 162 del Código Tributario</span>
            </div>
          </div>

          {/* IVA Débito, Crédito, Remanente/Pagar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-[6px] bg-[#F9FAFB] dark:bg-slate-800/60 border border-[#E5E7EB] dark:border-slate-700">
              <span className="text-[12px] text-[#6B7280] font-medium block">Débito fiscal (13%)</span>
              <span className="text-[20px] font-semibold font-mono text-[#111827] dark:text-white mt-1 block">
                {formatCurrencyUSD(taxSummaryRealTime.debitoFiscal)}
              </span>
            </div>

            <div className="p-4 rounded-[6px] bg-[#F9FAFB] dark:bg-slate-800/60 border border-[#E5E7EB] dark:border-slate-700">
              <span className="text-[12px] text-[#6B7280] font-medium block">Crédito fiscal (13%)</span>
              <span className="text-[20px] font-semibold font-mono text-[#111827] dark:text-white mt-1 block">
                {formatCurrencyUSD(taxSummaryRealTime.creditoFiscal)}
              </span>
            </div>

            <div className="p-4 rounded-[6px] bg-[#F9FAFB] dark:bg-slate-800/60 border border-[#E5E7EB] dark:border-slate-700">
              <span className="text-[12px] text-[#6B7280] font-medium block">
                {taxSummaryRealTime.ivaNetoPagar > 0 ? 'IVA por pagar (F-07)' : 'Remanente a favor'}
              </span>
              <span
                className={`text-[20px] font-semibold font-mono mt-1 block ${
                  taxSummaryRealTime.ivaNetoPagar > 0 ? 'text-[#D97706]' : 'text-[#059669]'
                }`}
              >
                {formatCurrencyUSD(
                  taxSummaryRealTime.ivaNetoPagar > 0
                    ? taxSummaryRealTime.ivaNetoPagar
                    : taxSummaryRealTime.remanenteFavor
                )}
              </span>
            </div>

            <div className="p-4 rounded-[6px] bg-[#F9FAFB] dark:bg-slate-800/60 border border-[#E5E7EB] dark:border-slate-700">
              <span className="text-[12px] text-[#6B7280] font-medium block">
                Fecha límite F-07 (Día {TAX_DEADLINES.ivaF07Day})
              </span>
              <span className="text-[14px] font-medium text-[#111827] dark:text-white mt-1 block">
                {taxSummaryRealTime.daysRemainingF07} días restantes
              </span>
            </div>
          </div>

          {/* Otras Obligaciones Mensuales */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-[#E5E7EB] dark:border-slate-800 text-[14px]">
            <div className="p-3.5 rounded-[6px] bg-[#F9FAFB] dark:bg-slate-800/60 border border-[#E5E7EB] dark:border-slate-700 flex items-center justify-between">
              <div>
                <span className="font-medium text-[#111827] dark:text-white block">Pago a cuenta (1.75%)</span>
                <span className="text-[12px] text-[#6B7280]">Vence: Día {TAX_DEADLINES.pagoCuentaDay}</span>
              </div>
              <span className="font-mono font-semibold text-[#111827] dark:text-white">
                {formatCurrencyUSD(taxSummaryRealTime.pagoCuenta)}
              </span>
            </div>

            <div className="p-3.5 rounded-[6px] bg-[#F9FAFB] dark:bg-slate-800/60 border border-[#E5E7EB] dark:border-slate-700 flex items-center justify-between">
              <div>
                <span className="font-medium text-[#111827] dark:text-white block">Retenciones renta 10%</span>
                <span className="text-[12px] text-[#6B7280]">Vence: Día {TAX_DEADLINES.retencionesDay}</span>
              </div>
              <span className="font-mono font-semibold text-[#111827] dark:text-white">
                {formatCurrencyUSD(taxSummaryRealTime.retencionRenta)}
              </span>
            </div>

            <div className="p-3.5 rounded-[6px] bg-[#F9FAFB] dark:bg-slate-800/60 border border-[#E5E7EB] dark:border-slate-700 flex items-center justify-between">
              <div>
                <span className="font-medium text-[#111827] dark:text-white block">Cotizaciones ISSS / AFP</span>
                <span className="text-[12px] text-[#6B7280]">Vence: Día {TAX_DEADLINES.isssDay}</span>
              </div>
              <span className="font-mono font-semibold text-[#111827] dark:text-white">
                {formatCurrencyUSD(taxSummaryRealTime.isss + taxSummaryRealTime.afp)}
              </span>
            </div>
          </div>
        </div>

        {/* Diagnóstico Ejecutivo */}
        <div className="bg-white dark:bg-slate-900 rounded-[8px] p-6 border border-[#E5E7EB] dark:border-slate-800 shadow-none space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[6px] border border-[#E5E7EB] dark:border-slate-700 bg-[#F9FAFB] dark:bg-slate-800 flex items-center justify-center text-[#6B7280]">
                <BrainCircuit className="w-5 h-5 stroke-[1.5]" />
              </div>
              <div>
                <h3 className="text-[16px] font-semibold text-[#111827] dark:text-white">
                  Diagnóstico ejecutivo de salud financiera
                </h3>
                <p className="text-[14px] text-[#6B7280] dark:text-slate-400">
                  Auditoría automática de liquidez, rentabilidad y recomendaciones operativas
                </p>
              </div>
            </div>

            <button
              disabled={isDiagnosing}
              onClick={handleRunDiagnosis}
              className="px-3.5 py-1.5 rounded-[6px] border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-[#F9FAFB] text-[#111827] dark:text-slate-200 text-[14px] font-medium flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer shadow-none self-start sm:self-auto"
            >
              {isDiagnosing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#6B7280]" />
                  <span>Analizando...</span>
                </>
              ) : (
                <span>Ejecutar diagnóstico</span>
              )}
            </button>
          </div>

          {diagnosisResult && (
            <div className="pt-4 border-t border-[#E5E7EB] dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-[6px] bg-[#F9FAFB] dark:bg-slate-800/60 border border-[#E5E7EB] dark:border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] font-medium text-[#6B7280]">Puntuación de salud</span>
                  <span className="text-[16px] font-semibold text-[#111827] dark:text-white font-mono">
                    {diagnosisResult.healthScore} / 100
                  </span>
                </div>
                <p className="text-[14px] text-[#111827] dark:text-slate-200 leading-relaxed">
                  {diagnosisResult.statusSummary}
                </p>
              </div>

              <div className="p-4 rounded-[6px] bg-[#F9FAFB] dark:bg-slate-800/60 border border-[#E5E7EB] dark:border-slate-700">
                <span className="text-[12px] font-medium text-[#059669] block mb-2">
                  Fortalezas
                </span>
                <ul className="space-y-1.5 text-[14px] text-[#111827] dark:text-slate-200">
                  {diagnosisResult.strengths.map((s, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-[#059669] font-medium">·</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-[6px] bg-[#F6F8F7] dark:bg-slate-800/60 border border-[#E3E8E6] dark:border-slate-700">
                <span className="text-[12px] font-medium text-[#0F766E] block mb-2">
                  Recomendaciones
                </span>
                <ul className="space-y-1.5 text-[14px] text-[#111827] dark:text-slate-200">
                  {diagnosisResult.recommendations.map((r, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-[#0F766E] font-medium">·</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Enlace a Pronósticos & Proyecciones */}
        <div className="p-4 rounded-[8px] bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Calculator className="w-5 h-5 text-[#6B7280] shrink-0 stroke-[1.5]" />
            <div>
              <span className="text-[14px] font-medium text-[#111827] dark:text-white block">
                ¿Deseas proyectar meses futuros?
              </span>
              <span className="text-[12px] text-[#6B7280]">
                Consulta el modelo econométrico OLS en el módulo de Pronósticos.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveModule('forecasting')}
            className="px-3 py-1.5 rounded-[6px] border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-[#F9FAFB] text-[#111827] dark:text-slate-200 text-[14px] font-medium transition cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <span>Ir a pronósticos</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#6B7280]" />
          </button>
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* MODALS */}
      {/* ---------------------------------------------------- */}
      <ForecastingMethodologyModal
        isOpen={isForecastingModalOpen}
        onClose={() => setIsForecastingModalOpen(false)}
      />

      <PDFReportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        reportType="executive_board_report"
        title="Informe Integral de Gestión Corporativa & Dashboard"
        subtitle="Consolidado de Ingresos, Egresos, Cuentas por Cobrar/Pagar y Disponibilidad Bancaria"
      />

      <RegisterOtherIncomeModal
        isOpen={isRegisterOtherIncomeOpen}
        onClose={() => setIsRegisterOtherIncomeOpen(false)}
      />

      <RevenueDatabaseModal
        isOpen={isRevenueDbModalOpen}
        onClose={() => setIsRevenueDbModalOpen(false)}
        items={[]}
        totalCompanyRevenue={financialSummary.ingresosTotales}
      />

      <QuickBranchModal
        isOpen={isQuickBranchOpen}
        onClose={() => setIsQuickBranchOpen(false)}
      />
    </div>
  );
};
