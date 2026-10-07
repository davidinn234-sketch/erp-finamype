import { useERP } from '../../context/ERPContext';
import { buildAccountingReports, money } from '../../lib/accountingReports';
import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Layers,
  BarChart3,
  LineChart as LineIcon,
  PieChart as PieIcon,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Download,
  Eye,
  CheckCircle2,
  Sparkles,
  Scale,
  RefreshCw,
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
import { formatCurrencyUSD } from '../../utils/salvadoranTax';
import { Invoice, Purchase, OtherIncome, Employee, FiscalConfig } from '../../types';

export type HistoricalMetricType = 'comparativa' | 'ventas' | 'egresos' | 'utilidad_neta' | 'flujo_neto';
export type TimeGranularity = 'meses' | 'anos';

export const MONTHS_CATALOG = [
  { key: 'all', name: 'Todos los Meses (Ene - Dic)', short: 'Todos' },
  { key: '01', name: '01 - Enero', short: 'Ene' },
  { key: '02', name: '02 - Febrero', short: 'Feb' },
  { key: '03', name: '03 - Marzo', short: 'Mar' },
  { key: '04', name: '04 - Abril', short: 'Abr' },
  { key: '05', name: '05 - Mayo', short: 'May' },
  { key: '06', name: '06 - Junio', short: 'Jun' },
  { key: '07', name: '07 - Julio', short: 'Jul' },
  { key: '08', name: '08 - Agosto', short: 'Ago' },
  { key: '09', name: '09 - Septiembre', short: 'Sep' },
  { key: '10', name: '10 - Octubre', short: 'Oct' },
  { key: '11', name: '11 - Noviembre', short: 'Nov' },
  { key: '12', name: '12 - Diciembre', short: 'Dic' },
];

export interface HistoricalFinancialAnalyticsProps {
  invoices: Invoice[];
  purchases: Purchase[];
  otherIncomes: OtherIncome[];
  employees: Employee[];
  fiscalConfig?: FiscalConfig;
  selectedBranchName?: string;
  selectedYear?: number;
  selectedMonth?: string;
  onSelectYear?: (year: number) => void;
  onSelectMonth?: (month: string) => void;
}

export interface PeriodData {
  periodKey: string;
  label: string;
  shortLabel: string;
  ventas: number;
  otrosIngresos: number;
  ingresosTotales: number;
  compras: number;
  nomina: number;
  gastosOperativos: number;
  impuestosMH: number;
  egresosTotales: number;
  utilidadBruta: number;
  utilidadOperativa: number;
  utilidadNeta: number; // Ganancia líquida final
  flujoNeto: number; // Flujo de caja neto: Ingresos - Egresos
  margenNetoPct: number;
  growthVentas?: number;
}

export const HistoricalFinancialAnalytics: React.FC<HistoricalFinancialAnalyticsProps> = ({
  invoices,
  purchases,
  otherIncomes,
  employees,
  fiscalConfig,
  selectedBranchName = 'Consolidado Global',
  selectedYear: propSelectedYear,
  selectedMonth: propSelectedMonth,
  onSelectYear,
  onSelectMonth,
}) => {
  const {journalEntries,chartOfAccounts,bankAccounts}=useERP();
  const availableYears=[...new Set([new Date().getFullYear(),...journalEntries.map(entry=>Number(entry.date.slice(0,4)))])].sort((a,b)=>b-a);

  // Internal state fallback if not controlled by parent
  const [internalGranularity, setInternalGranularity] = useState<TimeGranularity>('meses');
  const [internalYear, setInternalYear] = useState<number>(new Date().getFullYear());
  const [internalMonth, setInternalMonth] = useState<string>('all');

  const selectedMasterYear = propSelectedYear !== undefined ? propSelectedYear : internalYear;
  const selectedMasterMonth = propSelectedMonth !== undefined ? propSelectedMonth : internalMonth;
  const granularity = internalGranularity;

  const handleYearChange = (year: number) => {
    if (onSelectYear) onSelectYear(year);
    else setInternalYear(year);
  };

  const handleMonthChange = (month: string) => {
    if (onSelectMonth) onSelectMonth(month);
    else setInternalMonth(month);
  };

  const [activeMetric, setActiveMetric] = useState<HistoricalMetricType>('comparativa');
  const [chartType, setChartType] = useState<'bars' | 'lines' | 'area'>('bars');
  const [showTable, setShowTable] = useState(false);

  const periodData=(prefix:string,label:string,shortLabel:string):PeriodData=>{
    const start=prefix.length===4?prefix+'-01-01':prefix.length===7?prefix+'-01':prefix;
    const end=prefix.length===4?prefix+'-12-31':prefix.length===7?prefix+'-31':prefix;
    const report=buildAccountingReports(chartOfAccounts,journalEntries,bankAccounts,start,end);
    const payroll=report.period.filter(entry=>entry.sourceModule==='planilla').flatMap(entry=>entry.lines).filter(line=>chartOfAccounts.find(account=>account.code===line.accountCode)?.category==='gastos').reduce((sum,line)=>sum+line.debit-line.credit,0);
    return {periodKey:prefix,label,shortLabel,ventas:report.revenue,otrosIngresos:0,ingresosTotales:report.revenue,compras:report.costs,nomina:money(payroll),gastosOperativos:money(report.expenses-payroll),impuestosMH:0,egresosTotales:money(report.costs+report.expenses),utilidadBruta:money(report.revenue-report.costs),utilidadOperativa:report.profit,utilidadNeta:report.profit,flujoNeto:report.netCash,margenNetoPct:report.revenue?report.profit/report.revenue*100:0};
  };
  const generateMonthlyDataForYear=(year:number)=>Array.from({length:12},(_,index)=>{const date=new Date(year,index,1);return periodData(year+'-'+String(index+1).padStart(2,'0'),date.toLocaleDateString('es-SV',{month:'long'}),date.toLocaleDateString('es-SV',{month:'short'}));});
  const generateIntraMonthData=(year:number,month:string)=>Array.from({length:new Date(year,Number(month),0).getDate()},(_,index)=>periodData(year+'-'+month+'-'+String(index+1).padStart(2,'0'),'Día '+(index+1),String(index+1)));
  const annualHistoricalData=useMemo(()=>availableYears.slice().reverse().map(year=>periodData(String(year),'Año '+year,String(year))),[journalEntries,chartOfAccounts,bankAccounts]);

  // Current dataset selector
  const currentDataset: PeriodData[] = useMemo(() => {
    if (granularity === 'anos') {
      return annualHistoricalData;
    }
    if (selectedMasterMonth === 'all') {
      return generateMonthlyDataForYear(selectedMasterYear);
    }
    return generateIntraMonthData(selectedMasterYear, selectedMasterMonth);
  }, [granularity, selectedMasterYear, selectedMasterMonth, annualHistoricalData, journalEntries, chartOfAccounts, bankAccounts]);

  // Summary statistics for the current active metric
  const metricStats = useMemo(() => {
    const values = currentDataset.map((d) => {
      if (activeMetric === 'ventas') return d.ventas;
      if (activeMetric === 'egresos') return d.egresosTotales;
      if (activeMetric === 'utilidad_neta') return d.utilidadNeta;
      if (activeMetric === 'flujo_neto') return d.flujoNeto;
      return d.ventas;
    });

    const total = values.reduce((sum, v) => sum + v, 0);
    const avg = values.length > 0 ? Math.round(total / values.length) : 0;
    const maxVal = values.length > 0 ? Math.max(...values) : 0;
    const maxIndex = values.indexOf(maxVal);
    const maxLabel = currentDataset[maxIndex]?.shortLabel || '-';

    const first = values[0] || 0;
    const last = values[values.length - 1] || 0;
    const growthPct = first > 0 ? ((last - first) / first) * 100 : 0;

    return { total, avg, maxVal, maxLabel, growthPct };
  }, [currentDataset, activeMetric]);

  const metricConfig = {
    comparativa: {
      name: 'Evolución de 4 Variables (Integral)',
      color: '#0F766E',
      badge: 'Multivariable',
      desc: 'Correlación simultánea de Ventas, Egresos Totales, Utilidad Neta y Flujo Neto de Caja.',
    },
    ventas: {
      name: 'Ventas Facturadas (DTE & Consumidor)',
      color: '#0F766E',
      badge: 'Ingresos Operativos',
      desc: 'Ingresos netos por ventas gravadas, exentas y no sujetas emitidas.',
    },
    egresos: {
      name: 'Egresos Totales (Compras + Nómina + Gastos + MH)',
      color: '#64748B',
      badge: 'Desembolsos & Costos',
      desc: 'Suma de compras de mercadería, nómina patronal SV, gastos fijos y tributos.',
    },
    utilidad_neta: {
      name: 'Utilidad Neta Final (Rentabilidad)',
      color: '#059669',
      badge: 'Ganancia Líquida',
      desc: 'Resultado neto positivo después de cubrir todos los costos, nómina y obligaciones fiscales.',
    },
    flujo_neto: {
      name: 'Flujo Neto de Caja',
      color: '#0F766E',
      badge: 'Saldo de Caja',
      desc: 'Flujo de efectivo real resultante de Ingresos Totales menos Egresos Totales.',
    },
  }[activeMetric];

  const handleExportCSV = () => {
    const headers = [
      'Periodo,Ventas,Otros_Ingresos,Ingresos_Totales,Compras,Nomina,Gastos_Operativos,Impuestos_MH,Egresos_Totales,Utilidad_Bruta,Utilidad_Operativa,Utilidad_Neta,Flujo_Neto,Margen_Neto_Pct',
    ];
    const rows = currentDataset.map(
      (d) =>
        `"${d.label}",${d.ventas},${d.otrosIngresos},${d.ingresosTotales},${d.compras},${d.nomina},${d.gastosOperativos},${d.impuestosMH},${d.egresosTotales},${d.utilidadBruta},${d.utilidadOperativa},${d.utilidadNeta},${d.flujoNeto},${d.margenNetoPct}%`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `analitica_financiera_${granularity}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleChartDrilldown = (state: any) => {
    if (granularity === 'meses' && selectedMasterMonth === 'all' && state && state.activePayload && state.activePayload.length > 0) {
      const pKey = state.activePayload[0]?.payload?.periodKey;
      if (typeof pKey === 'string' && pKey.includes('-')) {
        const parts = pKey.split('-');
        if (parts[1]) handleMonthChange(parts[1]);
      }
    }
  };

  const selectedMonthInfo = MONTHS_CATALOG.find((m) => m.key === selectedMasterMonth);

  return (
    <div className="rounded-[8px] bg-white dark:bg-slate-900 border border-[#E3E8E6] dark:border-slate-800 p-6 shadow-none transition-all duration-150 hover:shadow-xs space-y-6 relative">
      {/* Top Header: Title, Scope & Temporal Granularity Toggle */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#E3E8E6] dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-50 dark:bg-teal-950/60 text-[#0F766E] dark:text-teal-300 border border-teal-200 dark:border-teal-800">
              {metricConfig.badge}
            </span>
            <span className="text-[12px] text-[#6B7280] font-medium">• {'Contabilidad consolidada de la empresa'}</span>
          </div>
          <h2 className="text-[16px] font-semibold text-[#111827] dark:text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#0F766E]" />
            <span>{metricConfig.name}</span>
          </h2>
          <p className="text-[12px] text-[#6B7280] mt-0.5">{metricConfig.desc}</p>
        </div>

        {/* Controls: Granularity [12 Meses | 5 Años] + Chart Visualizer [Barras | Líneas | Áreas] + Table toggle */}
        <div className="flex flex-wrap items-center gap-2">
          {/* BOTÓN CONMUTADOR DE MESES Y AÑOS */}
          <div className="flex items-center bg-[#F6F8F7] dark:bg-slate-800 p-0.5 rounded-[6px] border border-[#E3E8E6] dark:border-slate-700">
            <button
              onClick={() => setInternalGranularity('meses')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition flex items-center gap-1.5 cursor-pointer ${
                granularity === 'meses'
                  ? 'bg-white dark:bg-slate-700 text-[#0F766E] dark:text-teal-300 shadow-2xs font-semibold'
                  : 'text-[#6B7280] hover:text-[#111827] dark:hover:text-white'
              }`}
              title="Ver desglose mes a mes del año seleccionado"
            >
              <Calendar className="w-3 h-3" />
              <span>12 Meses ({selectedMasterYear})</span>
            </button>
            <button
              onClick={() => setInternalGranularity('anos')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition flex items-center gap-1.5 cursor-pointer ${
                granularity === 'anos'
                  ? 'bg-white dark:bg-slate-700 text-[#0F766E] dark:text-teal-300 shadow-2xs font-semibold'
                  : 'text-[#6B7280] hover:text-[#111827] dark:hover:text-white'
              }`}
              title="Ver años con registros"
            >
              <Layers className="w-3 h-3" />
              <span>Histórico 5 Años</span>
            </button>
          </div>

          {/* SELECTOR DE TIPO DE GRÁFICO */}
          <div className="flex items-center bg-[#F6F8F7] dark:bg-slate-800 p-0.5 rounded-[6px] border border-[#E3E8E6] dark:border-slate-700">
            <button
              onClick={() => setChartType('bars')}
              className={`p-1.5 rounded transition cursor-pointer ${
                chartType === 'bars'
                  ? 'bg-white dark:bg-slate-700 text-[#0F766E] dark:text-teal-300 shadow-2xs'
                  : 'text-[#6B7280] hover:text-[#111827] dark:hover:text-white'
              }`}
              title="Gráfico de Barras"
            >
              <BarChart3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setChartType('lines')}
              className={`p-1.5 rounded transition cursor-pointer ${
                chartType === 'lines'
                  ? 'bg-white dark:bg-slate-700 text-[#0F766E] dark:text-teal-300 shadow-2xs'
                  : 'text-[#6B7280] hover:text-[#111827] dark:hover:text-white'
              }`}
              title="Gráfico de Líneas"
            >
              <LineIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setChartType('area')}
              className={`p-1.5 rounded transition cursor-pointer ${
                chartType === 'area'
                  ? 'bg-white dark:bg-slate-700 text-[#0F766E] dark:text-teal-300 shadow-2xs'
                  : 'text-[#6B7280] hover:text-[#111827] dark:hover:text-white'
              }`}
              title="Gráfico de Áreas"
            >
              <PieIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* TOGGLE TABLA & EXPORT */}
          <button
            onClick={() => setShowTable(!showTable)}
            className={`px-2.5 py-1 rounded-[6px] text-[12px] font-medium border transition cursor-pointer flex items-center gap-1.5 ${
              showTable
                ? 'bg-teal-50 dark:bg-teal-950 border-teal-300 text-[#0F766E] dark:text-teal-300'
                : 'border-[#E3E8E6] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#111827] dark:text-slate-200 hover:bg-[#F6F8F7]'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{showTable ? 'Ocultar Tabla' : 'Ver Tabla'}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="p-1.5 rounded-[6px] border border-[#E3E8E6] dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-[#F6F8F7] text-[#6B7280] transition cursor-pointer"
            title="Exportar datos a CSV"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* METRIC SELECTION PILLS (LAS 4 VARIABLES) */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[12px] font-medium text-[#6B7280] mr-1">Variable del gráfico:</span>

        <button
          onClick={() => setActiveMetric('comparativa')}
          className={`px-2.5 py-1 rounded-[6px] text-[12px] font-medium transition flex items-center gap-1.5 cursor-pointer ${
            activeMetric === 'comparativa'
              ? 'bg-[#0F766E] text-white shadow-none font-semibold'
              : 'bg-[#F6F8F7] dark:bg-slate-800 border border-[#E3E8E6] dark:border-slate-700 text-[#111827] dark:text-slate-200 hover:bg-[#E3E8E6]'
          }`}
        >
          <Sparkles className="w-3 h-3" />
          <span>Comparativa Integral (4 Variables)</span>
        </button>

        <button
          onClick={() => setActiveMetric('ventas')}
          className={`px-2.5 py-1 rounded-[6px] text-[12px] font-medium transition flex items-center gap-1.5 cursor-pointer ${
            activeMetric === 'ventas'
              ? 'bg-[#0F766E] text-white shadow-none font-semibold'
              : 'bg-[#F6F8F7] dark:bg-slate-800 border border-[#E3E8E6] dark:border-slate-700 text-[#111827] dark:text-slate-200 hover:bg-[#E3E8E6]'
          }`}
        >
          <DollarSign className="w-3 h-3" />
          <span>Solo Ventas</span>
        </button>

        <button
          onClick={() => setActiveMetric('egresos')}
          className={`px-2.5 py-1 rounded-[6px] text-[12px] font-medium transition flex items-center gap-1.5 cursor-pointer ${
            activeMetric === 'egresos'
              ? 'bg-[#64748B] text-white shadow-none font-semibold'
              : 'bg-[#F6F8F7] dark:bg-slate-800 border border-[#E3E8E6] dark:border-slate-700 text-[#111827] dark:text-slate-200 hover:bg-[#E3E8E6]'
          }`}
        >
          <Scale className="w-3 h-3" />
          <span>Solo Egresos Totales</span>
        </button>

        <button
          onClick={() => setActiveMetric('utilidad_neta')}
          className={`px-2.5 py-1 rounded-[6px] text-[12px] font-medium transition flex items-center gap-1.5 cursor-pointer ${
            activeMetric === 'utilidad_neta'
              ? 'bg-[#059669] text-white shadow-none font-semibold'
              : 'bg-[#F6F8F7] dark:bg-slate-800 border border-[#E3E8E6] dark:border-slate-700 text-[#111827] dark:text-slate-200 hover:bg-[#E3E8E6]'
          }`}
        >
          <TrendingUp className="w-3 h-3" />
          <span>Solo Utilidad Neta</span>
        </button>

        <button
          onClick={() => setActiveMetric('flujo_neto')}
          className={`px-2.5 py-1 rounded-[6px] text-[12px] font-medium transition flex items-center gap-1.5 cursor-pointer ${
            activeMetric === 'flujo_neto'
              ? 'bg-[#0F766E] text-white shadow-none font-semibold'
              : 'bg-[#F6F8F7] dark:bg-slate-800 border border-[#E3E8E6] dark:border-slate-700 text-[#111827] dark:text-slate-200 hover:bg-[#E3E8E6]'
          }`}
        >
          <RefreshCw className="w-3 h-3" />
          <span>Solo Flujo Neto</span>
        </button>
      </div>

      {/* STATS SUMMARY BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-[6px] bg-[#F6F8F7] dark:bg-slate-800/50 border border-[#E3E8E6] dark:border-slate-800 text-[12px]">
        <div>
          <span className="text-[10px] text-[#6B7280] font-semibold uppercase tracking-wider block">
            Total en el Período ({granularity === 'meses' ? '12 Meses' : 'Años'})
          </span>
          <span className="font-mono font-semibold text-[#111827] dark:text-white [font-variant-numeric:tabular-nums] text-[15px]">
            {formatCurrencyUSD(metricStats.total)}
          </span>
        </div>

        <div>
          <span className="text-[10px] text-[#6B7280] font-semibold uppercase tracking-wider block">
            Promedio ({granularity === 'meses' ? 'Mensual' : 'Anual'})
          </span>
          <span className="font-mono font-semibold text-[#111827] dark:text-white [font-variant-numeric:tabular-nums] text-[15px]">
            {formatCurrencyUSD(metricStats.avg)}
          </span>
        </div>

        <div>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            Pico Máximo ({metricStats.maxLabel})
          </span>
          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
            {formatCurrencyUSD(metricStats.maxVal)}
          </span>
        </div>

        <div>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            Tendencia / Crecimiento
          </span>
          <span
            className={`font-mono font-bold text-sm flex items-center gap-1 ${
              metricStats.growthPct >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'
            }`}
          >
            {metricStats.growthPct >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {metricStats.growthPct > 0 ? `+${metricStats.growthPct.toFixed(1)}%` : `${metricStats.growthPct.toFixed(1)}%`}
          </span>
        </div>
      </div>

      {/* MAIN RECHARTS GRAPH */}
      <div className="h-80 w-full pt-2">
        <ResponsiveContainer key={chartType} width="100%" height="100%">
          {activeMetric === 'comparativa' ? (
            chartType === 'bars' ? (
              <BarChart
                data={currentDataset}
                margin={{ top: 10, right: 10, left: -10, bottom: granularity === 'meses' && selectedMasterMonth === 'all' ? 10 : 0 }}
                onClick={handleChartDrilldown}
                className={granularity === 'meses' && selectedMasterMonth === 'all' ? 'cursor-pointer' : ''}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="shortLabel"
                  tick={{ fontSize: 10 }}
                  interval={0}
                  angle={granularity === 'meses' && selectedMasterMonth === 'all' ? -25 : 0}
                  textAnchor={granularity === 'meses' && selectedMasterMonth === 'all' ? 'end' : 'middle'}
                  height={granularity === 'meses' && selectedMasterMonth === 'all' ? 45 : 30}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(v: any, name: any) => [`$${Number(v).toLocaleString()}`, name || 'Total']}
                  labelFormatter={(label: any) => {
                    if (granularity === 'meses') {
                      return selectedMasterMonth === 'all'
                        ? `Mes: ${label} (${selectedMasterYear})`
                        : `Desglose: ${label} • ${selectedMonthInfo?.name || ''} ${selectedMasterYear}`;
                    }
                    return `Año: ${label}`;
                  }}
                />
                <Legend verticalAlign="top" height={36} />
                <Bar isAnimationActive={false} dataKey="ventas" name="1. Ventas Facturadas" fill="#0F766E" radius={[4, 4, 0, 0]} />
                <Bar isAnimationActive={false} dataKey="egresosTotales" name="2. Egresos Totales" fill="#64748B" radius={[4, 4, 0, 0]} />
                <Bar isAnimationActive={false} dataKey="utilidadNeta" name="3. Utilidad Neta Final" fill="#059669" radius={[4, 4, 0, 0]} />
                <Bar isAnimationActive={false} dataKey="flujoNeto" name="4. Flujo Neto de Caja" fill="#0D9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : chartType === 'lines' ? (
              <LineChart
                data={currentDataset}
                margin={{ top: 10, right: 10, left: -10, bottom: granularity === 'meses' && selectedMasterMonth === 'all' ? 10 : 0 }}
                onClick={handleChartDrilldown}
                className={granularity === 'meses' && selectedMasterMonth === 'all' ? 'cursor-pointer' : ''}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E3E8E6" />
                <XAxis
                  dataKey="shortLabel"
                  tick={{ fontSize: 10 }}
                  interval={0}
                  angle={granularity === 'meses' && selectedMasterMonth === 'all' ? -25 : 0}
                  textAnchor={granularity === 'meses' && selectedMasterMonth === 'all' ? 'end' : 'middle'}
                  height={granularity === 'meses' && selectedMasterMonth === 'all' ? 45 : 30}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(v: any, name: any) => [`$${Number(v).toLocaleString()}`, name || 'Total']}
                  labelFormatter={(label: any) => {
                    if (granularity === 'meses') {
                      return selectedMasterMonth === 'all'
                        ? `Mes: ${label} (${selectedMasterYear})`
                        : `Desglose: ${label} • ${selectedMonthInfo?.name || ''} ${selectedMasterYear}`;
                    }
                    return `Año: ${label}`;
                  }}
                />
                <Legend verticalAlign="top" height={36} />
                <Line isAnimationActive={false} type="monotone" dataKey="ventas" name="1. Ventas Facturadas" stroke="#0F766E" strokeWidth={3} dot={{ r: 4 }} />
                <Line isAnimationActive={false} type="monotone" dataKey="egresosTotales" name="2. Egresos Totales" stroke="#64748B" strokeWidth={3} dot={{ r: 4 }} />
                <Line isAnimationActive={false} type="monotone" dataKey="utilidadNeta" name="3. Utilidad Neta Final" stroke="#059669" strokeWidth={3} dot={{ r: 4 }} />
                <Line
                  type="monotone"
                  dataKey="flujoNeto"
                  name="4. Flujo Neto de Caja"
                  stroke="#0D9488"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3 }}
                />
              </LineChart>
            ) : (
              <AreaChart
                data={currentDataset}
                margin={{ top: 10, right: 10, left: -10, bottom: granularity === 'meses' && selectedMasterMonth === 'all' ? 10 : 0 }}
                onClick={handleChartDrilldown}
                className={granularity === 'meses' && selectedMasterMonth === 'all' ? 'cursor-pointer' : ''}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E3E8E6" />
                <XAxis
                  dataKey="shortLabel"
                  tick={{ fontSize: 10 }}
                  interval={0}
                  angle={granularity === 'meses' && selectedMasterMonth === 'all' ? -25 : 0}
                  textAnchor={granularity === 'meses' && selectedMasterMonth === 'all' ? 'end' : 'middle'}
                  height={granularity === 'meses' && selectedMasterMonth === 'all' ? 45 : 30}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(v: any, name: any) => [`$${Number(v).toLocaleString()}`, name || 'Total']}
                  labelFormatter={(label: any) => {
                    if (granularity === 'meses') {
                      return selectedMasterMonth === 'all'
                        ? `Mes: ${label} (${selectedMasterYear})`
                        : `Desglose: ${label} • ${selectedMonthInfo?.name || ''} ${selectedMasterYear}`;
                    }
                    return `Año: ${label}`;
                  }}
                />
                <Legend verticalAlign="top" height={36} />
                <Area isAnimationActive={false} type="monotone" dataKey="ventas" name="Ventas" stroke="#0F766E" fill="#0F766E" fillOpacity={0.2} />
                <Area isAnimationActive={false} type="monotone" dataKey="egresosTotales" name="Egresos" stroke="#64748B" fill="#64748B" fillOpacity={0.15} />
                <Area isAnimationActive={false} type="monotone" dataKey="utilidadNeta" name="Utilidad Neta" stroke="#059669" fill="#059669" fillOpacity={0.25} />
                <Area isAnimationActive={false} type="monotone" dataKey="flujoNeto" name="Flujo Neto" stroke="#0D9488" fill="#0D9488" fillOpacity={0.15} />
              </AreaChart>
            )
          ) : chartType === 'bars' ? (
            <BarChart
              data={currentDataset}
              margin={{ top: 10, right: 10, left: -10, bottom: granularity === 'meses' && selectedMasterMonth === 'all' ? 10 : 0 }}
              onClick={handleChartDrilldown}
              className={granularity === 'meses' && selectedMasterMonth === 'all' ? 'cursor-pointer' : ''}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E3E8E6" />
              <XAxis
                dataKey="shortLabel"
                tick={{ fontSize: 10 }}
                interval={0}
                angle={granularity === 'meses' && selectedMasterMonth === 'all' ? -25 : 0}
                textAnchor={granularity === 'meses' && selectedMasterMonth === 'all' ? 'end' : 'middle'}
                height={granularity === 'meses' && selectedMasterMonth === 'all' ? 45 : 30}
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(v: any) => [`$${Number(v).toLocaleString()}`, metricConfig.name]}
                labelFormatter={(label: any) => {
                  if (granularity === 'meses') {
                    return selectedMasterMonth === 'all'
                      ? `Mes: ${label} (${selectedMasterYear})`
                      : `Desglose: ${label} • ${selectedMonthInfo?.name || ''} ${selectedMasterYear}`;
                  }
                  return `Año: ${label}`;
                }}
              />
              <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
              <Bar
                dataKey={
                  activeMetric === 'ventas'
                    ? 'ventas'
                    : activeMetric === 'egresos'
                    ? 'egresosTotales'
                    : activeMetric === 'utilidad_neta'
                    ? 'utilidadNeta'
                    : 'flujoNeto'
                }
                name={metricConfig.name}
                fill={metricConfig.color}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          ) : chartType === 'lines' ? (
            <LineChart
              data={currentDataset}
              margin={{ top: 10, right: 10, left: -10, bottom: granularity === 'meses' && selectedMasterMonth === 'all' ? 10 : 0 }}
              onClick={handleChartDrilldown}
              className={granularity === 'meses' && selectedMasterMonth === 'all' ? 'cursor-pointer' : ''}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E3E8E6" />
              <XAxis
                dataKey="shortLabel"
                tick={{ fontSize: 10 }}
                interval={0}
                angle={granularity === 'meses' && selectedMasterMonth === 'all' ? -25 : 0}
                textAnchor={granularity === 'meses' && selectedMasterMonth === 'all' ? 'end' : 'middle'}
                height={granularity === 'meses' && selectedMasterMonth === 'all' ? 45 : 30}
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(v: any) => [`$${Number(v).toLocaleString()}`, metricConfig.name]}
                labelFormatter={(label: any) => {
                  if (granularity === 'meses') {
                    return selectedMasterMonth === 'all'
                      ? `Mes: ${label} (${selectedMasterYear})`
                      : `Desglose: ${label} • ${selectedMonthInfo?.name || ''} ${selectedMasterYear}`;
                  }
                  return `Año: ${label}`;
                }}
              />
              <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
              <Line
                type="monotone"
                dataKey={
                  activeMetric === 'ventas'
                    ? 'ventas'
                    : activeMetric === 'egresos'
                    ? 'egresosTotales'
                    : activeMetric === 'utilidad_neta'
                    ? 'utilidadNeta'
                    : 'flujoNeto'
                }
                name={metricConfig.name}
                stroke={metricConfig.color}
                strokeWidth={3}
                dot={{ r: 5, fill: metricConfig.color }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          ) : (
            <AreaChart
              data={currentDataset}
              margin={{ top: 10, right: 10, left: -10, bottom: granularity === 'meses' && selectedMasterMonth === 'all' ? 10 : 0 }}
              onClick={handleChartDrilldown}
              className={granularity === 'meses' && selectedMasterMonth === 'all' ? 'cursor-pointer' : ''}
            >
              <defs>
                <linearGradient id="metricGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={metricConfig.color} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={metricConfig.color} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E3E8E6" />
              <XAxis
                dataKey="shortLabel"
                tick={{ fontSize: 10 }}
                interval={0}
                angle={granularity === 'meses' && selectedMasterMonth === 'all' ? -25 : 0}
                textAnchor={granularity === 'meses' && selectedMasterMonth === 'all' ? 'end' : 'middle'}
                height={granularity === 'meses' && selectedMasterMonth === 'all' ? 45 : 30}
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(v: any) => [`$${Number(v).toLocaleString()}`, metricConfig.name]}
                labelFormatter={(label: any) => {
                  if (granularity === 'meses') {
                    return selectedMasterMonth === 'all'
                      ? `Mes: ${label} (${selectedMasterYear})`
                      : `Desglose: ${label} • ${selectedMonthInfo?.name || ''} ${selectedMasterYear}`;
                  }
                  return `Año: ${label}`;
                }}
              />
              <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
              <Area
                type="monotone"
                dataKey={
                  activeMetric === 'ventas'
                    ? 'ventas'
                    : activeMetric === 'egresos'
                    ? 'egresosTotales'
                    : activeMetric === 'utilidad_neta'
                    ? 'utilidadNeta'
                    : 'flujoNeto'
                }
                name={metricConfig.name}
                stroke={metricConfig.color}
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#metricGradient)"
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Sub-chart navigation helper note */}
      {granularity === 'meses' && (
        <div className="flex items-center justify-between text-[12px] text-[#6B7280] bg-teal-50/50 dark:bg-slate-800/60 px-3.5 py-2.5 rounded-[6px] border border-teal-100 dark:border-slate-800">
          {selectedMasterMonth === 'all' ? (
            <span>
              💡 <strong>Interactivo:</strong> Haz clic en la barra de cualquier mes para ver su desglose semanal en {selectedMasterYear}.
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#0F766E] animate-pulse" />
              <span>
                Visualizando desglose de <strong>{selectedMonthInfo?.name} {selectedMasterYear}</strong> (Semanas 1-4 y cortes quincenales).
              </span>
            </span>
          )}

          {selectedMasterMonth !== 'all' && (
            <button
              onClick={() => handleMonthChange('all')}
              className="text-[#0F766E] dark:text-teal-300 font-semibold hover:underline cursor-pointer ml-2 shrink-0"
            >
              ⬅ Volver a los 12 Meses
            </button>
          )}
        </div>
      )}

      {/* DATA TABLE (TOGGLEABLE) */}
      {showTable && (
        <div className="pt-4 border-t border-[#E3E8E6] dark:border-slate-800 animate-fade-in space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-[13px] font-semibold text-[#111827] dark:text-slate-200">
              Desglose Numérico por {granularity === 'meses' ? 'Mes' : 'Año'} (Dólares USD)
            </h4>
            <span className="text-[11px] text-[#6B7280]">Total {currentDataset.length} períodos registrados</span>
          </div>

          <div className="overflow-x-auto rounded-[6px] border border-[#E3E8E6] dark:border-slate-800">
            <table className="w-full text-left text-[12px]">
              <thead className="bg-[#F6F8F7] dark:bg-slate-800 text-[#6B7280] dark:text-slate-300 uppercase text-[10px] font-semibold border-b border-[#E3E8E6] dark:border-slate-800">
                <tr>
                  <th className="p-3">Período</th>
                  <th className="p-3 text-right">Ventas</th>
                  <th className="p-3 text-right">Otros Ing.</th>
                  <th className="p-3 text-right font-semibold text-[#0F766E]">Ingresos Tot.</th>
                  <th className="p-3 text-right">Compras</th>
                  <th className="p-3 text-right">Planilla</th>
                  <th className="p-3 text-right">Gastos Op.</th>
                  <th className="p-3 text-right">Tributos MH</th>
                  <th className="p-3 text-right font-semibold text-[#64748B]">Egresos Tot.</th>
                  <th className="p-3 text-right font-semibold text-[#111827] dark:text-white">Utilidad Neta</th>
                  <th className="p-3 text-right font-semibold text-[#0D9488]">Flujo Neto</th>
                  <th className="p-3 text-right">Margen %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3E8E6] dark:divide-slate-800">
                {currentDataset.map((row) => (
                  <tr key={row.periodKey} className="hover:bg-[#F6F8F7]/60 dark:hover:bg-slate-800/40 transition">
                    <td className="p-3 font-semibold text-[#111827] dark:text-white">{row.label}</td>
                    <td className="p-3 text-right font-mono">{formatCurrencyUSD(row.ventas)}</td>
                    <td className="p-3 text-right font-mono text-[#6B7280]">{formatCurrencyUSD(row.otrosIngresos)}</td>
                    <td className="p-3 text-right font-mono font-semibold text-[#0F766E]">{formatCurrencyUSD(row.ingresosTotales)}</td>
                    <td className="p-3 text-right font-mono">{formatCurrencyUSD(row.compras)}</td>
                    <td className="p-3 text-right font-mono">{formatCurrencyUSD(row.nomina)}</td>
                    <td className="p-3 text-right font-mono">{formatCurrencyUSD(row.gastosOperativos)}</td>
                    <td className="p-3 text-right font-mono text-[#6B7280]">{formatCurrencyUSD(row.impuestosMH)}</td>
                    <td className="p-3 text-right font-mono font-semibold text-[#64748B]">{formatCurrencyUSD(row.egresosTotales)}</td>
                    <td
                      className={`p-3 text-right font-mono font-semibold ${
                        row.utilidadNeta >= 0 ? 'text-[#059669] dark:text-emerald-400' : 'text-rose-600'
                      }`}
                    >
                      {formatCurrencyUSD(row.utilidadNeta)}
                    </td>
                    <td
                      className={`p-3 text-right font-mono font-semibold ${
                        row.flujoNeto >= 0 ? 'text-[#0D9488]' : 'text-rose-600'
                      }`}
                    >
                      {formatCurrencyUSD(row.flujoNeto)}
                    </td>
                    <td className="p-3 text-right font-mono text-[#6B7280]">{row.margenNetoPct.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
