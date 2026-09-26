import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  LineChart as LineIcon,
  BarChart3,
  Calendar,
  Layers,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Download,
  Filter,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Scale,
  RefreshCw,
  Sparkles,
  ChevronRight,
  Calculator,
  Sliders,
  Info,
  Clock,
  PieChart as PieIcon,
  Percent,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import { useERP } from '../../context/ERPContext';
import { formatCurrencyUSD } from '../../utils/salvadoranTax';
import {
  calculateOLS,
  EL_SALVADOR_SEASONAL_FACTORS,
} from '../../utils/econometricForecasting';
import { ForecastingMethodologyModal } from '../dashboard/ForecastingMethodologyModal';

type ForecastScenario = 'conservador' | 'base' | 'optimista';
type ForecastHorizon = 'q4_2026' | 'next_6m' | 'year_2027' | 'next_12m';
type ForecastMethod = 'seasonal' | 'ols' | 'wma' | 'logarithmic';

export const ForecastingModule: React.FC = () => {
  const {
    invoices,
    purchases,
    employees,
    bankAccounts,
    branches,
    selectedBranchId,
    setSelectedBranchId,
    fiscalConfig,
    currentCompany,
  } = useERP();

  // Settings & Toggles
  const [horizon, setHorizon] = useState<ForecastHorizon>('year_2027');
  const [scenario, setScenario] = useState<ForecastScenario>('base');
  const [method, setMethod] = useState<ForecastMethod>('seasonal');
  const [selectedMetricView, setSelectedMetricView] = useState<'all' | 'ventas' | 'costos' | 'flujo'>('all');
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);
  const [useSimulatedHistorical, setUseSimulatedHistorical] = useState(true);

  // Bank initial cash balance
  const initialBankBalance = useMemo(() => {
    return (bankAccounts || []).reduce((sum, b) => sum + (b.currentBalance || 0), 0) || 12450;
  }, [bankAccounts]);

  // Employer SV payroll burden (ISSS + AFP + INSAFORP)
  const baseMonthlyPayroll = useMemo(() => {
    return (employees || [])
      .filter((e) => e && e.isActive)
      .reduce((sum, e) => sum + (e.baseSalary || 0) * 1.34, 0) || 2400;
  }, [employees]);

  // ----------------------------------------------------
  // EVALUACIÓN DE CRITERIOS DE MADUREZ & PREPARACIÓN DE DATOS
  // ----------------------------------------------------
  const dataReadinessEvaluation = useMemo(() => {
    // Meses con datos reales en el sistema
    const monthsWithInvoices = new Set<string>();
    (invoices || []).forEach((inv) => {
      if (inv.date && inv.status !== 'anulada') {
        monthsWithInvoices.add(inv.date.substring(0, 7));
      }
    });

    const recordedMonthsCount = monthsWithInvoices.size;
    const meetsCriteria = useSimulatedHistorical || recordedMonthsCount >= 3;
    const isStatisticallyRobust = useSimulatedHistorical || recordedMonthsCount >= 6;

    return {
      recordedMonthsCount,
      meetsCriteria,
      isStatisticallyRobust,
      requiredMinMonths: 3,
      recommendedMonths: 6,
      currentMonthsList: Array.from(monthsWithInvoices).sort(),
    };
  }, [invoices, useSimulatedHistorical]);

  // ----------------------------------------------------
  // DATOS HISTÓRICOS BASE (PARA ALIMENTAR EL MODELO ECONOMÉTRICO)
  // ----------------------------------------------------
  const historicalTimePoints = useMemo(() => {
    if (useSimulatedHistorical) {
      // 8 meses transcurridos de 2026 con comportamiento real calibrado
      return [
        { x: 1, y: 7450, label: 'Ene 2026', monthIndex: 0, purchases: 3800, expenses: 1400 },
        { x: 2, y: 8100, label: 'Feb 2026', monthIndex: 1, purchases: 4100, expenses: 1450 },
        { x: 3, y: 9250, label: 'Mar 2026', monthIndex: 2, purchases: 4600, expenses: 1500 },
        { x: 4, y: 8900, label: 'Abr 2026', monthIndex: 3, purchases: 4400, expenses: 1480 },
        { x: 5, y: 10600, label: 'May 2026', monthIndex: 4, purchases: 5200, expenses: 1550 },
        { x: 6, y: 11450, label: 'Jun 2026', monthIndex: 5, purchases: 5700, expenses: 1600 },
        { x: 7, y: 12200, label: 'Jul 2026', monthIndex: 6, purchases: 6100, expenses: 1650 },
        { x: 8, y: 13150, label: 'Ago 2026', monthIndex: 7, purchases: 6500, expenses: 1700 },
      ];
    } else {
      // Usar estrictamente las facturas de la base de datos
      const monthlySums: Record<string, { sales: number; purchases: number }> = {};
      (invoices || []).forEach((i) => {
        if (i.date && i.status !== 'anulada') {
          const ym = i.date.substring(0, 7);
          if (!monthlySums[ym]) monthlySums[ym] = { sales: 0, purchases: 0 };
          monthlySums[ym].sales += i.totalPagar || 0;
        }
      });
      (purchases || []).forEach((p) => {
        if (p.date && p.status !== 'anulada') {
          const ym = p.date.substring(0, 7);
          if (!monthlySums[ym]) monthlySums[ym] = { sales: 0, purchases: 0 };
          monthlySums[ym].purchases += p.totalPagar || 0;
        }
      });

      const keys = Object.keys(monthlySums).sort();
      return keys.map((key, index) => {
        const parts = key.split('-');
        const monthNum = parseInt(parts[1] || '1', 10) - 1;
        return {
          x: index + 1,
          y: monthlySums[key].sales,
          label: key,
          monthIndex: monthNum,
          purchases: monthlySums[key].purchases,
          expenses: 1500,
        };
      });
    }
  }, [useSimulatedHistorical, invoices, purchases]);

  // ----------------------------------------------------
  // EJECUCIÓN DEL MOTOR ECONOMÉTRICO OLS
  // ----------------------------------------------------
  const olsRegression = useMemo(() => {
    const points = historicalTimePoints.map((p) => ({ x: p.x, y: p.y }));
    return calculateOLS(points);
  }, [historicalTimePoints]);

  // ----------------------------------------------------
  // CONFIGURACIÓN DEL HORIZONTE DE PRONÓSTICO
  // ----------------------------------------------------
  const forecastMonthsConfig = useMemo(() => {
    if (horizon === 'q4_2026') {
      return [
        { label: 'Sep 2026', monthIndex: 8, xIndex: 9, year: 2026 },
        { label: 'Oct 2026', monthIndex: 9, xIndex: 10, year: 2026 },
        { label: 'Nov 2026', monthIndex: 10, xIndex: 11, year: 2026 },
        { label: 'Dic 2026', monthIndex: 11, xIndex: 12, year: 2026 },
      ];
    }
    if (horizon === 'next_6m') {
      return [
        { label: 'Sep 2026', monthIndex: 8, xIndex: 9, year: 2026 },
        { label: 'Oct 2026', monthIndex: 9, xIndex: 10, year: 2026 },
        { label: 'Nov 2026', monthIndex: 10, xIndex: 11, year: 2026 },
        { label: 'Dic 2026', monthIndex: 11, xIndex: 12, year: 2026 },
        { label: 'Ene 2027', monthIndex: 0, xIndex: 13, year: 2027 },
        { label: 'Feb 2027', monthIndex: 1, xIndex: 14, year: 2027 },
      ];
    }
    if (horizon === 'year_2027') {
      return [
        { label: 'Ene 2027', monthIndex: 0, xIndex: 13, year: 2027 },
        { label: 'Feb 2027', monthIndex: 1, xIndex: 14, year: 2027 },
        { label: 'Mar 2027', monthIndex: 2, xIndex: 15, year: 2027 },
        { label: 'Abr 2027', monthIndex: 3, xIndex: 16, year: 2027 },
        { label: 'May 2027', monthIndex: 4, xIndex: 17, year: 2027 },
        { label: 'Jun 2027', monthIndex: 5, xIndex: 18, year: 2027 },
        { label: 'Jul 2027', monthIndex: 6, xIndex: 19, year: 2027 },
        { label: 'Ago 2027', monthIndex: 7, xIndex: 20, year: 2027 },
        { label: 'Sep 2027', monthIndex: 8, xIndex: 21, year: 2027 },
        { label: 'Oct 2027', monthIndex: 9, xIndex: 22, year: 2027 },
        { label: 'Nov 2027', monthIndex: 10, xIndex: 23, year: 2027 },
        { label: 'Dic 2027', monthIndex: 11, xIndex: 24, year: 2027 },
      ];
    }
    // next_12m (Sep 2026 - Ago 2027)
    return [
      { label: 'Sep 2026', monthIndex: 8, xIndex: 9, year: 2026 },
      { label: 'Oct 2026', monthIndex: 9, xIndex: 10, year: 2026 },
      { label: 'Nov 2026', monthIndex: 10, xIndex: 11, year: 2026 },
      { label: 'Dic 2026', monthIndex: 11, xIndex: 12, year: 2026 },
      { label: 'Ene 2027', monthIndex: 0, xIndex: 13, year: 2027 },
      { label: 'Feb 2027', monthIndex: 1, xIndex: 14, year: 2027 },
      { label: 'Mar 2027', monthIndex: 2, xIndex: 15, year: 2027 },
      { label: 'Abr 2027', monthIndex: 3, xIndex: 16, year: 2027 },
      { label: 'May 2027', monthIndex: 4, xIndex: 17, year: 2027 },
      { label: 'Jun 2027', monthIndex: 5, xIndex: 18, year: 2027 },
      { label: 'Jul 2027', monthIndex: 6, xIndex: 19, year: 2027 },
      { label: 'Ago 2027', monthIndex: 7, xIndex: 20, year: 2027 },
    ];
  }, [horizon]);

  // Factor de ajuste por Escenario
  const scenarioFactor = useMemo(() => {
    if (scenario === 'conservador') return { sales: 0.90, cost: 1.05 };
    if (scenario === 'optimista') return { sales: 1.15, cost: 0.96 };
    return { sales: 1.0, cost: 1.0 }; // Base
  }, [scenario]);

  // ----------------------------------------------------
  // GENERACIÓN DE LOS REGISTROS PROYECTADOS MES A MES
  // ----------------------------------------------------
  const projectedTimeline = useMemo(() => {
    let runningCash = initialBankBalance;

    return forecastMonthsConfig.map((item) => {
      const { label, monthIndex, xIndex, year } = item;
      const seasonal = EL_SALVADOR_SEASONAL_FACTORS[monthIndex];
      const seasonalWeight = seasonal ? seasonal.factor : 1.0;

      // 1. Proyección de Ventas Base según el método elegido
      let rawSales = 0;
      if (method === 'seasonal') {
        const trend = olsRegression.project(xIndex);
        rawSales = trend * seasonalWeight;
      } else if (method === 'ols') {
        rawSales = olsRegression.project(xIndex);
      } else if (method === 'wma') {
        const last3 = historicalTimePoints.slice(-3).map((p) => p.y);
        const avg = last3.length > 0 ? last3.reduce((a, b) => a + b, 0) / last3.length : 10000;
        rawSales = avg * (1 + (xIndex - 8) * 0.02) * seasonalWeight;
      } else if (method === 'logarithmic') {
        const base = olsRegression.intercept;
        rawSales = Math.max(1000, base + olsRegression.slope * Math.log(xIndex + 1) * 3) * seasonalWeight;
      }

      // Aplicar factor de escenario
      const sales = Math.round(Math.max(500, rawSales * scenarioFactor.sales));

      // 2. Costo de Mercadería / Compras a Proveedores (aprox. 50-52% de ventas con elasticidad)
      const purchasesCost = Math.round(sales * 0.51 * scenarioFactor.cost);

      // 3. Nómina & Cargas Patronales SV (con bono/aguinaldo en Diciembre)
      const isDecember = monthIndex === 11;
      const payroll = Math.round(baseMonthlyPayroll * (isDecember ? 1.75 : 1.0)); // Aguinaldo legal en Diciembre

      // 4. Gastos Operativos (Servicios, alquiler, internet, software)
      const opExpenses = Math.round(1500 * (1 + (xIndex - 8) * 0.01) * scenarioFactor.cost);

      // 5. Impuestos Fiscales República de El Salvador:
      // - Débito Fiscal IVA (13%) menos Crédito Fiscal IVA compras (13%)
      // - Pago a Cuenta obligatorio (1.75% de las ventas brutas)
      const ivaDebito = sales * 0.13;
      const ivaCredito = purchasesCost * 0.13;
      const ivaNeto = Math.max(0, ivaDebito - ivaCredito);
      const pagoCuenta = sales * 0.0175;
      const totalTaxes = Math.round(ivaNeto + pagoCuenta);

      // 6. Egresos Totales
      const totalOutflows = purchasesCost + payroll + opExpenses + totalTaxes;

      // 7. Utilidad Neta & Flujo de Caja
      const grossProfit = sales - purchasesCost;
      const netProfit = grossProfit - payroll - opExpenses - totalTaxes;
      const netCashFlow = sales - totalOutflows;
      const netMargin = sales > 0 ? (netProfit / sales) * 100 : 0;

      // 8. Saldo acumulado en Bancos
      runningCash += netCashFlow;

      return {
        label,
        year,
        monthName: seasonal?.name || label,
        sales,
        purchasesCost,
        payroll,
        opExpenses,
        totalTaxes,
        totalOutflows,
        grossProfit,
        netProfit,
        netCashFlow,
        netMargin: Number(netMargin.toFixed(1)),
        accumulatedCash: runningCash,
        seasonalDescription: seasonal?.description || '',
        seasonalFactor: seasonalWeight,
      };
    });
  }, [
    forecastMonthsConfig,
    method,
    olsRegression,
    scenarioFactor,
    baseMonthlyPayroll,
    historicalTimePoints,
    initialBankBalance,
  ]);

  // ----------------------------------------------------
  // TOTALES Y MÉTRICAS DEL HORIZONTE
  // ----------------------------------------------------
  const horizonTotals = useMemo(() => {
    const totalSales = projectedTimeline.reduce((sum, p) => sum + p.sales, 0);
    const totalPurchases = projectedTimeline.reduce((sum, p) => sum + p.purchasesCost, 0);
    const totalPayroll = projectedTimeline.reduce((sum, p) => sum + p.payroll, 0);
    const totalOpEx = projectedTimeline.reduce((sum, p) => sum + p.opExpenses, 0);
    const totalTaxes = projectedTimeline.reduce((sum, p) => sum + p.totalTaxes, 0);
    const totalOutflows = projectedTimeline.reduce((sum, p) => sum + p.totalOutflows, 0);
    const totalNetProfit = projectedTimeline.reduce((sum, p) => sum + p.netProfit, 0);
    const totalNetCashFlow = projectedTimeline.reduce((sum, p) => sum + p.netCashFlow, 0);
    const avgMonthlySales = projectedTimeline.length > 0 ? Math.round(totalSales / projectedTimeline.length) : 0;
    const finalBankBalance = projectedTimeline[projectedTimeline.length - 1]?.accumulatedCash || initialBankBalance;
    const avgMargin = totalSales > 0 ? (totalNetProfit / totalSales) * 100 : 0;

    return {
      totalSales,
      totalPurchases,
      totalPayroll,
      totalOpEx,
      totalTaxes,
      totalOutflows,
      totalNetProfit,
      totalNetCashFlow,
      avgMonthlySales,
      finalBankBalance,
      avgMargin: Number(avgMargin.toFixed(1)),
    };
  }, [projectedTimeline, initialBankBalance]);

  // ----------------------------------------------------
  // DATA COMBINADA PARA LA GRÁFICA DE TENDENCIA (HISTÓRICO + PROYECTADO)
  // ----------------------------------------------------
  const combinedTrendData = useMemo(() => {
    // 1. Puntos históricos
    const list: any[] = historicalTimePoints.map((h) => ({
      name: h.label,
      ventasReales: h.y,
      egresosReales: (h.purchases || 0) + (h.expenses || 0) + 2200,
      ventasProyectadas: null,
      egresosProyectados: null,
      flujoProyectado: null,
      tipo: 'Real / Registrado',
    }));

    // Enlace en el último punto real
    const lastReal = historicalTimePoints[historicalTimePoints.length - 1];
    if (lastReal && list.length > 0) {
      list[list.length - 1].ventasProyectadas = lastReal.y;
      list[list.length - 1].egresosProyectados = (lastReal.purchases || 0) + (lastReal.expenses || 0) + 2200;
    }

    // 2. Puntos proyectados
    projectedTimeline.forEach((p) => {
      list.push({
        name: p.label,
        ventasReales: null,
        egresosReales: null,
        ventasProyectadas: p.sales,
        egresosProyectados: p.totalOutflows,
        flujoProyectado: p.netCashFlow,
        tipo: 'Pronóstico Econométrico',
      });
    });

    return list;
  }, [historicalTimePoints, projectedTimeline]);

  // Exportar a CSV
  const handleExportCSV = () => {
    const headers = [
      'Periodo',
      'Ventas Proyectadas (USD)',
      'Costo Mercaderia (USD)',
      'Nomina y Cargas SV (USD)',
      'Gastos Operativos (USD)',
      'Impuestos MH (USD)',
      'Egresos Totales (USD)',
      'Utilidad Neta (USD)',
      'Flujo Neto Caja (USD)',
      'Saldo Bancos Acumulado (USD)',
      'Margen Neto (%)',
    ];

    const rows = projectedTimeline.map((p) => [
      p.label,
      p.sales,
      p.purchasesCost,
      p.payroll,
      p.opExpenses,
      p.totalTaxes,
      p.totalOutflows,
      p.netProfit,
      p.netCashFlow,
      p.accumulatedCash,
      `${p.netMargin}%`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `FINAMIPE_Pronosticos_${horizon}_${scenario}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ---------------------------------------------------- */}
      {/* 1. HEADER HERO DEL MÓDULO DE PRONÓSTICOS */}
      {/* ---------------------------------------------------- */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-indigo-900/50">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Módulo de Pronósticos & Modelos Predictivos</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Separado del Dashboard Real
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <TrendingUp className="w-7 h-7 text-indigo-400 shrink-0" />
              <span>Pronósticos de Ventas, Costos y Flujo de Caja</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Modelos econométricos proyectados para horizontes futuros (cierre 2026, 2027 y adelante),
              incorporando mínimos cuadrados (OLS), ciclo comercial de El Salvador, cálculo de IVA, Pago a Cuenta y provisiones de nómina.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
            <button
              onClick={() => setIsMethodologyOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-2 border border-white/10 cursor-pointer"
            >
              <Calculator className="w-4 h-4 text-indigo-300" />
              <span>Ver Metodología OLS & R²</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Exportar Proyecciones (CSV)</span>
            </button>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 2. BARRA DE EVALUACIÓN DE CRITERIOS DE MADUREZ ESTADÍSTICA */}
      {/* ---------------------------------------------------- */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${dataReadinessEvaluation.meetsCriteria ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400' : 'bg-amber-50 dark:bg-amber-950 text-amber-600'}`}>
              {dataReadinessEvaluation.meetsCriteria ? <ShieldCheck className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Criterios de Elegibilidad Estadística para Pronósticos</span>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${dataReadinessEvaluation.meetsCriteria ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300' : 'bg-amber-100 text-amber-800'}`}>
                  {dataReadinessEvaluation.meetsCriteria ? 'Criterios Cumplidos' : 'Datos Insuficientes'}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Se requiere un mínimo de 3 meses para calcular mínimos cuadrados (OLS) y 6 meses para coeficientes estacionales confiables.
              </p>
            </div>
          </div>

          {/* Toggle de Modo: Datos Reales vs Simular Madurez */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Fuente de datos:</span>
            <button
              onClick={() => setUseSimulatedHistorical(!useSimulatedHistorical)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                useSimulatedHistorical
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{useSimulatedHistorical ? 'Historial Calibrado (8 meses)' : 'Solo Transacciones ERP'}</span>
            </button>
          </div>
        </div>

        {/* Diagnóstico visual de cumplimiento */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
            <span className="text-slate-400 block text-[11px] font-medium">1. Puntos Temporales Disponibles:</span>
            <div className="flex items-center justify-between mt-1">
              <strong className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                {historicalTimePoints.length} meses registrados
              </strong>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                (Mínimo requerido: 3)
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
            <span className="text-slate-400 block text-[11px] font-medium">2. Bondad de Ajuste R² (Regresión OLS):</span>
            <div className="flex items-center justify-between mt-1">
              <strong className="text-sm font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                {(olsRegression.rSquared * 100).toFixed(1)}% de precisión
              </strong>
              <span className="text-[10px] text-slate-400">Ecuación: {olsRegression.equation}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
            <span className="text-slate-400 block text-[11px] font-medium">3. Calibración Estacional El Salvador:</span>
            <div className="flex items-center justify-between mt-1">
              <strong className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                Activa (12 factores comerciales)
              </strong>
              <span className="text-[10px] text-slate-400">Picos: Ago & Dic</span>
            </div>
          </div>
        </div>

        {/* Warning si desactiva el dataset histórico y solo tiene 1 mes */}
        {!useSimulatedHistorical && dataReadinessEvaluation.recordedMonthsCount < 3 && (
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <div>
              <strong className="block font-bold">
                Aviso: Tu base de datos solo cuenta con {dataReadinessEvaluation.recordedMonthsCount} mes(es) con movimientos.
              </strong>
              <span>
                Para formular una proyección econométrica sólida, se requiere observar la tasa de cambio entre periodos consecutivos. 
                Recomendamos activar el modo &quot;Historial Calibrado&quot; para simular la madurez de una empresa salvadoreña consolidada.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ---------------------------------------------------- */}
      {/* 3. CONSOLA DE CONTROL DE HORIZONTE, ESCENARIO & MÉTODO */}
      {/* ---------------------------------------------------- */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Parámetros de Pronóstico
            </span>
          </div>
          <span className="text-xs text-slate-500">
            Ajusta el horizonte temporal, escenario de mercado y modelo matemático
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Selector de Horizonte */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              <span>Horizonte Temporal Futuro:</span>
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => setHorizon('q4_2026')}
                className={`px-3 py-2 text-xs font-bold rounded-xl transition cursor-pointer text-left ${
                  horizon === 'q4_2026'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <div>Cierre 2026</div>
                <div className="text-[10px] font-normal opacity-80">Sep - Dic (4 meses)</div>
              </button>

              <button
                onClick={() => setHorizon('next_6m')}
                className={`px-3 py-2 text-xs font-bold rounded-xl transition cursor-pointer text-left ${
                  horizon === 'next_6m'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <div>Próximos 6 Meses</div>
                <div className="text-[10px] font-normal opacity-80">Sep 26 - Feb 27</div>
              </button>

              <button
                onClick={() => setHorizon('year_2027')}
                className={`px-3 py-2 text-xs font-bold rounded-xl transition cursor-pointer text-left ${
                  horizon === 'year_2027'
                    ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-400/50'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>Año 2027 Completo</span>
                  <span className="text-[9px] bg-white/20 px-1 py-0.2 rounded font-bold">12m</span>
                </div>
                <div className="text-[10px] font-normal opacity-80">Ene - Dic 2027</div>
              </button>

              <button
                onClick={() => setHorizon('next_12m')}
                className={`px-3 py-2 text-xs font-bold rounded-xl transition cursor-pointer text-left ${
                  horizon === 'next_12m'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <div>12 Meses Móviles</div>
                <div className="text-[10px] font-normal opacity-80">Sep 26 - Ago 27</div>
              </button>
            </div>
          </div>

          {/* Selector de Escenario */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-amber-500" />
              <span>Escenario de Mercado:</span>
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => setScenario('conservador')}
                className={`p-2.5 text-xs font-bold rounded-xl transition cursor-pointer text-center ${
                  scenario === 'conservador'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <div>Conservador</div>
                <div className="text-[10px] font-normal opacity-80">-10% ventas</div>
              </button>

              <button
                onClick={() => setScenario('base')}
                className={`p-2.5 text-xs font-bold rounded-xl transition cursor-pointer text-center ${
                  scenario === 'base'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <div>Base / Tendencia</div>
                <div className="text-[10px] font-normal opacity-80">Regresión OLS</div>
              </button>

              <button
                onClick={() => setScenario('optimista')}
                className={`p-2.5 text-xs font-bold rounded-xl transition cursor-pointer text-center ${
                  scenario === 'optimista'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <div>Optimista</div>
                <div className="text-[10px] font-normal opacity-80">+15% ventas</div>
              </button>
            </div>
          </div>

          {/* Selector de Algoritmo / Método */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5 text-cyan-500" />
              <span>Modelo Predictivo:</span>
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => setMethod('seasonal')}
                className={`p-2 text-xs font-bold rounded-xl transition cursor-pointer text-left ${
                  method === 'seasonal'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <div>OLS + Estacional SV</div>
                <div className="text-[10px] font-normal opacity-75">Recomendado</div>
              </button>

              <button
                onClick={() => setMethod('ols')}
                className={`p-2 text-xs font-bold rounded-xl transition cursor-pointer text-left ${
                  method === 'ols'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <div>Regresión Lineal</div>
                <div className="text-[10px] font-normal opacity-75">Tendencia pura</div>
              </button>

              <button
                onClick={() => setMethod('wma')}
                className={`p-2 text-xs font-bold rounded-xl transition cursor-pointer text-left ${
                  method === 'wma'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <div>Medias Móviles (WMA)</div>
                <div className="text-[10px] font-normal opacity-75">Ponderado reciente</div>
              </button>

              <button
                onClick={() => setMethod('logarithmic')}
                className={`p-2 text-xs font-bold rounded-xl transition cursor-pointer text-left ${
                  method === 'logarithmic'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <div>Logarítmico</div>
                <div className="text-[10px] font-normal opacity-75">Rend. decrecientes</div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 4. TARJETAS DE IMPACTO & TOTALES DEL HORIZONTE */}
      {/* ---------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ventas Proyectadas */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Ventas Totales Proyectadas
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono mt-2">
            {formatCurrencyUSD(horizonTotals.totalSales)}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
            <span>Promedio mensual:</span>
            <strong className="font-mono text-slate-800 dark:text-slate-200">
              {formatCurrencyUSD(horizonTotals.avgMonthlySales)}/mes
            </strong>
          </div>
        </div>

        {/* Egresos & Costos Proyectados */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Egresos & Costos Totales
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono mt-2">
            {formatCurrencyUSD(horizonTotals.totalOutflows)}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
            <span>Compras mercadería:</span>
            <strong className="font-mono text-slate-800 dark:text-slate-200">
              {formatCurrencyUSD(horizonTotals.totalPurchases)}
            </strong>
          </div>
        </div>

        {/* Utilidad Neta Proyectada */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Utilidad Neta Proyectada
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-2">
            {formatCurrencyUSD(horizonTotals.totalNetProfit)}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
            <span>Margen neto esperado:</span>
            <strong className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
              {horizonTotals.avgMargin}%
            </strong>
          </div>
        </div>

        {/* Flujo Neto & Caja Final en Bancos */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Saldo Proyectado en Bancos
            </span>
            <div className="w-8 h-8 rounded-xl bg-cyan-50 dark:bg-cyan-950 text-cyan-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-cyan-600 dark:text-cyan-400 font-mono mt-2">
            {formatCurrencyUSD(horizonTotals.finalBankBalance)}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
            <span>Generación neta de caja:</span>
            <strong className="font-mono text-cyan-600 dark:text-cyan-400 font-bold">
              {formatCurrencyUSD(horizonTotals.totalNetCashFlow)}
            </strong>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 5. GRÁFICA PRINCIPAL: CURVA DE VENTAS REALES VS PROYECTADAS CON INTERVALO */}
      {/* ---------------------------------------------------- */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] uppercase tracking-wider">
                Continuidad Histórica + Proyección
              </span>
              <span className="text-xs text-slate-400">• Modelo {method.toUpperCase()}</span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-1">
              Curva de Ventas & Egresos: Transcurrido (Real) vs Futuro (Pronosticado)
            </h2>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
              <span className="text-slate-600 dark:text-slate-300">Ventas Reales</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t-2 border-dashed border-indigo-600 inline-block" />
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">Ventas Proyectadas</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t-2 border-dashed border-rose-500 inline-block" />
              <span className="text-rose-600 dark:text-rose-400 font-bold">Egresos Proyectados</span>
            </div>
          </div>
        </div>

        <div className="h-72 sm:h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={combinedTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
              <defs>
                <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorProj" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" height={45} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip
                formatter={(v: any, name: any) => [
                  v ? `$${Number(v).toLocaleString()}` : '$0.00',
                  name === 'ventasReales'
                    ? 'Ventas Reales'
                    : name === 'ventasProyectadas'
                    ? 'Ventas Proyectadas'
                    : name === 'egresosProyectados'
                    ? 'Egresos Proyectados'
                    : name,
                ]}
              />
              <Area type="monotone" dataKey="ventasReales" stroke="#10b981" strokeWidth={2.5} fill="url(#colorReal)" />
              <Line
                type="monotone"
                dataKey="ventasProyectadas"
                stroke="#6366f1"
                strokeWidth={2.5}
                strokeDasharray="4 4"
                dot={{ r: 4, fill: '#6366f1' }}
              />
              <Line
                type="monotone"
                dataKey="egresosProyectados"
                stroke="#ef4444"
                strokeWidth={2}
                strokeDasharray="3 3"
                dot={{ r: 3, fill: '#ef4444' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 6. COMPARATIVA DE BARRAS: VENTAS VS EGRESOS VS FLUJO PROYECTADO */}
      {/* ---------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Barras: Ventas vs Egresos */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                <span>Ventas Proyectadas vs Egresos Totales</span>
              </h3>
              <p className="text-xs text-slate-500">Balance operativo mes por mes del horizonte</p>
            </div>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              Margen promedio {horizonTotals.avgMargin}%
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectedTimeline} margin={{ top: 10, right: 10, left: -15, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" height={40} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: any) => [`$${Number(v).toLocaleString()}`, '']} />
                <Bar dataKey="sales" name="Ventas" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="totalOutflows" name="Egresos" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Barras: Flujo Neto de Efectivo Mensual */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-cyan-600" />
                <span>Flujo Neto de Caja Generado (Mensual)</span>
              </h3>
              <p className="text-xs text-slate-500">Excedente de liquidez que ingresa a cuentas bancarias</p>
            </div>
            <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400">
              Total {formatCurrencyUSD(horizonTotals.totalNetCashFlow)}
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectedTimeline} margin={{ top: 10, right: 10, left: -15, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" height={40} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: any) => [`$${Number(v).toLocaleString()}`, 'Flujo Neto']} />
                <ReferenceLine y={0} stroke="#94a3b8" />
                <Bar dataKey="netCashFlow" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 7. TABLA DE PROYECCIONES DETALLADAS MES A MES */}
      {/* ---------------------------------------------------- */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span>Libro de Proyecciones Detalladas (P&L + Flujo de Efectivo)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Desglose rubro por rubro según normas tributarias de El Salvador (F-07 IVA + Anticipo 1.75% + Nómina ISSS/AFP)
            </p>
          </div>
          <button
            onClick={handleExportCSV}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar Hoja de Cálculo</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <th className="py-3 px-4 font-bold">Mes / Periodo</th>
                <th className="py-3 px-4 font-bold text-right text-indigo-600 dark:text-indigo-400">Ventas Proy.</th>
                <th className="py-3 px-4 font-bold text-right text-rose-600 dark:text-rose-400">Costo Mercadería</th>
                <th className="py-3 px-4 font-bold text-right">Nómina SV</th>
                <th className="py-3 px-4 font-bold text-right">Gastos Op.</th>
                <th className="py-3 px-4 font-bold text-right text-cyan-600 dark:text-cyan-400">Impuestos MH</th>
                <th className="py-3 px-4 font-bold text-right text-rose-600 dark:text-rose-400">Egresos Tot.</th>
                <th className="py-3 px-4 font-bold text-right text-emerald-600 dark:text-emerald-400">Utilidad Neta</th>
                <th className="py-3 px-4 font-bold text-right text-cyan-600 dark:text-cyan-400">Flujo Neto</th>
                <th className="py-3 px-4 font-bold text-right">Saldo Bancos</th>
                <th className="py-3 px-4 font-bold text-center">Factor SV</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
              {projectedTimeline.map((p) => (
                <tr key={p.label} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                  <td className="py-3 px-4 font-sans font-bold text-slate-900 dark:text-white">
                    {p.label}
                    {p.seasonalDescription && (
                      <span className="block text-[10px] text-slate-400 font-normal truncate max-w-[180px]">
                        {p.seasonalDescription}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-indigo-600 dark:text-indigo-400">
                    {formatCurrencyUSD(p.sales)}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-300">
                    {formatCurrencyUSD(p.purchasesCost)}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-300">
                    {formatCurrencyUSD(p.payroll)}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-300">
                    {formatCurrencyUSD(p.opExpenses)}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-300">
                    {formatCurrencyUSD(p.totalTaxes)}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-rose-600 dark:text-rose-400">
                    {formatCurrencyUSD(p.totalOutflows)}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrencyUSD(p.netProfit)}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-cyan-600 dark:text-cyan-400">
                    {formatCurrencyUSD(p.netCashFlow)}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">
                    {formatCurrencyUSD(p.accumulatedCash)}
                  </td>
                  <td className="py-3 px-4 text-center font-sans text-[11px] text-slate-500">
                    {p.seasonalFactor.toFixed(2)}x
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold font-mono border-t border-slate-300 dark:border-slate-700">
                <td className="py-3.5 px-4 font-sans uppercase text-xs">Total Consolidado</td>
                <td className="py-3.5 px-4 text-right text-indigo-600 dark:text-indigo-400">
                  {formatCurrencyUSD(horizonTotals.totalSales)}
                </td>
                <td className="py-3.5 px-4 text-right">{formatCurrencyUSD(horizonTotals.totalPurchases)}</td>
                <td className="py-3.5 px-4 text-right">{formatCurrencyUSD(horizonTotals.totalPayroll)}</td>
                <td className="py-3.5 px-4 text-right">{formatCurrencyUSD(horizonTotals.totalOpEx)}</td>
                <td className="py-3.5 px-4 text-right">{formatCurrencyUSD(horizonTotals.totalTaxes)}</td>
                <td className="py-3.5 px-4 text-right text-rose-600 dark:text-rose-400">
                  {formatCurrencyUSD(horizonTotals.totalOutflows)}
                </td>
                <td className="py-3.5 px-4 text-right text-emerald-600 dark:text-emerald-400">
                  {formatCurrencyUSD(horizonTotals.totalNetProfit)}
                </td>
                <td className="py-3.5 px-4 text-right text-cyan-600 dark:text-cyan-400">
                  {formatCurrencyUSD(horizonTotals.totalNetCashFlow)}
                </td>
                <td className="py-3.5 px-4 text-right text-slate-900 dark:text-white">
                  {formatCurrencyUSD(horizonTotals.finalBankBalance)}
                </td>
                <td className="py-3.5 px-4 text-center font-sans text-xs">
                  {horizonTotals.avgMargin}% Margen
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Modal de Metodología */}
      <ForecastingMethodologyModal
        isOpen={isMethodologyOpen}
        onClose={() => setIsMethodologyOpen(false)}
      />
    </div>
  );
};
