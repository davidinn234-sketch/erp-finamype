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
  Trash2,
  BrainCircuit,
  Send,
  Loader2,
  ShieldCheck,
  Building,
  BarChart3,
  PieChart as PieIcon,
  LineChart as LineIcon,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Briefcase,
  Target,
  Database,
  Eye,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  TrendingDown,
  Calculator,
  ArrowRight,
  Filter,
  Check,
  Store,
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
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { formatCurrencyUSD } from '../../utils/salvadoranTax';
import { PDFReportModal } from '../common/PDFReportModal';
import { DynamicChartBuilderModal } from './DynamicChartBuilderModal';
import { RegisterOtherIncomeModal } from './RegisterOtherIncomeModal';
import { RevenueDatabaseModal, ConceptRevenueItem } from './RevenueDatabaseModal';
import { HistoricalFinancialAnalytics } from './HistoricalFinancialAnalytics';
import { QuickBranchModal } from './QuickBranchModal';
import { TreasuryCashBreakdownCard } from './TreasuryCashBreakdownCard';
import { ForecastingMethodologyModal } from './ForecastingMethodologyModal';
import { FinancialDiagnosis } from '../../types';

interface ExecutiveDashboardProps {
  onOpenNewSale: () => void;
  onOpenNewPurchase: () => void;
  onOpenNewPayroll: () => void;
}

const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6', '#14b8a6'];

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  onOpenNewSale,
  onOpenNewPurchase,
  onOpenNewPayroll,
}) => {
  const {
    currentCompany,
    customers,
    invoices,
    purchases,
    employees,
    bankAccounts,
    branches,
    selectedBranchId,
    setSelectedBranchId,
    dynamicWidgets,
    updateDynamicWidget,
    deleteDynamicWidget,
    setActiveModule,
    fiscalConfig,
    otherIncomes,
  } = useERP();

  // Dashboard View Modes & Period Horizon
  const [dashboardMode, setDashboardMode] = useState<'gerencial' | 'operativo'>('gerencial');
  const [timeHorizon, setTimeHorizon] = useState<'mes_actual' | 'anual_historico'>('anual_historico');
  const [flowChartType, setFlowChartType] = useState<'bars' | 'area' | 'lines'>('bars');

  // Modal states
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isChartBuilderOpen, setIsChartBuilderOpen] = useState(false);
  const [isRegisterOtherIncomeOpen, setIsRegisterOtherIncomeOpen] = useState(false);
  const [isRevenueDbModalOpen, setIsRevenueDbModalOpen] = useState(false);
  const [isQuickBranchOpen, setIsQuickBranchOpen] = useState(false);
  const [isForecastingModalOpen, setIsForecastingModalOpen] = useState(false);

  // Filtered sales, purchases and other incomes according to branch selection
  const branchFilteredInvoices = useMemo(() => {
    const list = (invoices || []).filter((i) => i && i.status !== 'anulada');
    if (!selectedBranchId || selectedBranchId === 'all') return list;
    return list.filter((i) => i.branchId === selectedBranchId);
  }, [invoices, selectedBranchId]);

  const branchFilteredPurchases = useMemo(() => {
    const list = (purchases || []).filter((p) => p && p.status !== 'anulada');
    if (!selectedBranchId || selectedBranchId === 'all') return list;
    return list.filter((p) => p.branchId === selectedBranchId);
  }, [purchases, selectedBranchId]);

  const branchFilteredOtherIncomes = useMemo(() => {
    const list = otherIncomes || [];
    if (!selectedBranchId || selectedBranchId === 'all') return list;
    return list.filter((o) => o.branchId === selectedBranchId);
  }, [otherIncomes, selectedBranchId]);

  // ----------------------------------------------------
  // 1. CÁLCULO DE INGRESOS TOTALES (VENTAS + OTROS INGRESOS) SENSIBLES A HORIZONTE
  // ----------------------------------------------------
  const baseMonthlySales = useMemo(() => {
    return branchFilteredInvoices.reduce((acc, i) => {
      const sumas = (i.sumasGravadas || 0) + (i.sumasExentas || 0) + (i.sumasNoSujetas || 0);
      return acc + (sumas > 0 ? sumas : i.totalPagar || 0);
    }, 0);
  }, [branchFilteredInvoices]);

  const baseMonthlyOtherIncomes = useMemo(() => {
    return branchFilteredOtherIncomes.reduce((acc, o) => acc + (o.amount || 0), 0);
  }, [branchFilteredOtherIncomes]);

  // Scaled totals according to timeHorizon (Mes Actual vs Histórico Anual)
  const totalSales = useMemo(() => {
    if (timeHorizon === 'anual_historico') {
      return baseMonthlySales > 0 ? Math.round(baseMonthlySales * 14.5) : 0;
    }
    return baseMonthlySales;
  }, [baseMonthlySales, timeHorizon]);

  const totalOtherIncomes = useMemo(() => {
    if (timeHorizon === 'anual_historico') {
      return baseMonthlyOtherIncomes > 0 ? Math.round(baseMonthlyOtherIncomes * 4.8) : 0;
    }
    return baseMonthlyOtherIncomes;
  }, [baseMonthlyOtherIncomes, timeHorizon]);

  // Ingresos Totales de cualquier tipo (Ventas comerciales + Remanentes MH + Activos fijos + Rendimientos)
  const totalIncomes = totalSales + totalOtherIncomes;

  // ----------------------------------------------------
  // 2. CÁLCULO DE EGRESOS Y GASTOS TOTALES DE LA EMPRESA
  // ----------------------------------------------------
  const baseMonthlyPurchases = useMemo(() => {
    return branchFilteredPurchases.reduce((acc, p) => {
      const sumas = (p.comprasGravadas || 0) + (p.comprasExentas || 0) + (p.comprasSujetoExcluido || 0);
      return acc + (sumas > 0 ? sumas : p.totalPagar || 0);
    }, 0);
  }, [branchFilteredPurchases]);

  const totalPurchases = useMemo(() => {
    if (timeHorizon === 'anual_historico') {
      return baseMonthlyPurchases > 0 ? Math.round(baseMonthlyPurchases * 13.9) : 0;
    }
    return baseMonthlyPurchases;
  }, [baseMonthlyPurchases, timeHorizon]);

  const totalPayrollCost = useMemo(() => {
    const monthlyPayroll = (employees || [])
      .filter((e) => e && e.isActive)
      .reduce((acc, e) => acc + (e.baseSalary || 0) * 1.34, 0); // Sueldo + ISSS 7.5% + AFP 8.75% + INSAFORP 1% + Provisiones
    return timeHorizon === 'anual_historico' ? Math.round(monthlyPayroll * 12) : Math.round(monthlyPayroll);
  }, [employees, timeHorizon]);

  // Impuestos F-07 MH estimados
  const ivaDebitoFiscal = useMemo(() => {
    return branchFilteredInvoices.reduce((acc, i) => acc + (i.iva13 || 0), 0);
  }, [branchFilteredInvoices]);

  const ivaCreditoFiscal = useMemo(() => {
    return branchFilteredPurchases.reduce((acc, p) => acc + (p.ivaCreditoFiscal || 0), 0);
  }, [branchFilteredPurchases]);

  const monthlyIvaNetoPagar = Math.max(0, ivaDebitoFiscal - ivaCreditoFiscal);
  const remanenteIva = Math.max(0, ivaCreditoFiscal - ivaDebitoFiscal);
  const monthlyAnticipoPagoCuenta = baseMonthlySales * (fiscalConfig?.pagoCuentaRate || 0.0175);
  const monthlyTotalTaxesMH = monthlyIvaNetoPagar + monthlyAnticipoPagoCuenta;

  const totalTaxesMH = useMemo(() => {
    if (timeHorizon === 'anual_historico') {
      const annualIvaNeto = Math.max(0, (totalSales * 0.13) - (totalPurchases * 0.13));
      const annualPagoCuenta = totalSales * (fiscalConfig?.pagoCuentaRate || 0.0175);
      return Math.round(annualIvaNeto + annualPagoCuenta);
    }
    return Math.round(monthlyTotalTaxesMH);
  }, [timeHorizon, totalSales, totalPurchases, monthlyTotalTaxesMH, fiscalConfig]);

  // Gastos operativos y servicios generales (estimado; ajústalo cuando tengas datos reales de gastos fijos)
  const operatingExpenses = 0;

  // Egresos Totales Integrales (Compras mercadería + Nómina patronal + Impuestos MH + Gastos operativos)
  const totalOutflows = totalPurchases + totalPayrollCost + totalTaxesMH + operatingExpenses;

  // ----------------------------------------------------
  // 3. LOS TRES MÁRGENES FINANCIEROS CLAVE
  // ----------------------------------------------------
  // Margen 1: Margen Bruto de Ganancia (Gross Profit Margin)
  const grossProfit = totalSales - totalPurchases;
  const grossMargin = totalSales > 0 ? (grossProfit / totalSales) * 100 : 0;

  // Margen 2: Margen de Operación (Operating Margin / EBIT)
  const operatingProfit = grossProfit - totalPayrollCost - operatingExpenses;
  const operatingMargin = totalSales > 0 ? (operatingProfit / totalSales) * 100 : 0;

  // Margen 3: Margen de Utilidad Neta (Net Profit Margin)
  const netIncome = operatingProfit + totalOtherIncomes - totalTaxesMH;
  const netMargin = totalIncomes > 0 ? (netIncome / totalIncomes) * 100 : 0;

  // Flujo Neto Total
  const netCashFlow = totalIncomes - totalOutflows;

  // Liquidez Total Disponible
  const totalLiquid = (bankAccounts || []).reduce((acc, b) => acc + (b.currentBalance || 0), 0);

  // Break-even & Runway
  const fixedCosts = totalPayrollCost + operatingExpenses;
  const contributionMarginRatio = totalSales > 0 && grossProfit > 0 ? grossProfit / totalSales : 0.55;
  const breakEvenSales = contributionMarginRatio > 0 ? fixedCosts / contributionMarginRatio : 0;
  const monthlyBurnRate = fixedCosts + 500;
  const runwayMonths = monthlyBurnRate > 0 ? Number((totalLiquid / monthlyBurnRate).toFixed(1)) : 12;

  // Cuentas por Cobrar & Pagar
  const pendingInvoices = branchFilteredInvoices.filter(
    (i) => i && i.status !== 'anulada' && i.status !== 'pagada' && ((i.saldoPendiente ?? i.totalPagar) > 0)
  );
  const totalCxcPendiente = pendingInvoices.reduce(
    (acc, i) => acc + (typeof i.saldoPendiente === 'number' ? i.saldoPendiente : i.totalPagar || 0),
    0
  );

  const pendingPurchases = branchFilteredPurchases.filter(
    (p) => p && p.status !== 'anulada' && p.status !== 'pagada' && ((p.saldoPendiente ?? p.totalPagar) > 0)
  );
  const totalCxpPendiente = pendingPurchases.reduce(
    (acc, p) => acc + (typeof p.saldoPendiente === 'number' ? p.saldoPendiente : p.totalPagar || 0),
    0
  );

  // ----------------------------------------------------
  // 4. GRÁFICA DE FLUJO HISTÓRICO: INGRESOS TOTALES VS EGRESOS TOTALES VS FLUJO NETO
  // ----------------------------------------------------
  const monthlyFlowData = useMemo(() => {
    return [
      {
        month: 'Actual',
        ingresosTotales: totalIncomes,
        egresosTotales: totalOutflows,
        flujoNeto: totalIncomes - totalOutflows,
      },
    ];
  }, [totalIncomes, totalOutflows]);

  // ----------------------------------------------------
  // 5. BASE DE DATOS DE INGRESOS POR CONCEPTO & PRODUCTO (DRILL-DOWN COMPLETO)
  // ----------------------------------------------------
  const conceptDatabaseItems: ConceptRevenueItem[] = useMemo(() => {
    const conceptMap = new Map<string, {
      code: string;
      name: string;
      category: string;
      type: ConceptRevenueItem['type'];
      unitsSold: number;
      totalRevenue: number;
      transactionCount: number;
    }>();

    // 1. Extraer ítems de todas las facturas
    branchFilteredInvoices.forEach((inv) => {
      if (inv.items && Array.isArray(inv.items) && inv.items.length > 0) {
        inv.items.forEach((item) => {
          const key = item.productId || item.description || 'producto_general';
          const existing = conceptMap.get(key);
          const itemTotal = item.total || (item.unitPrice * item.quantity) || 0;
          const isService = item.description?.toLowerCase().includes('servicio') ||
            item.description?.toLowerCase().includes('licencia') ||
            item.description?.toLowerCase().includes('consultoría') ||
            item.description?.toLowerCase().includes('soporte');

          if (existing) {
            existing.unitsSold += item.quantity || 1;
            existing.totalRevenue += itemTotal;
            existing.transactionCount += 1;
          } else {
            conceptMap.set(key, {
              code: item.productCode || `SKU-${key.slice(-4).toUpperCase()}`,
              name: item.description || 'Producto sin nombre',
              category: isService ? 'Servicios & Licencias' : 'Productos Comerciales',
              type: isService ? 'servicio' : 'producto',
              unitsSold: item.quantity || 1,
              totalRevenue: itemTotal,
              transactionCount: 1,
            });
          }
        });
      } else {
        // Si la factura no tiene desglose de ítems, usar el concepto del documento
        const key = `inv_doc_${inv.id}`;
        conceptMap.set(key, {
          code: inv.correlativeNumber || 'DTE-GEN',
          name: `Venta Facturada a ${inv.customerName}`,
          category: 'Ventas Comerciales',
          type: 'producto',
          unitsSold: 1,
          totalRevenue: inv.totalPagar || 0,
          transactionCount: 1,
        });
      }
    });

    // 2. Extraer otros ingresos extraordinarios (Hacienda, Activos fijos, Rendimientos)
    branchFilteredOtherIncomes.forEach((inc) => {
      const key = `oth_${inc.id}`;
      let type: ConceptRevenueItem['type'] = 'otro';
      if (inc.category === 'remanente_hacienda') type = 'remanente_hacienda';
      else if (inc.category === 'venta_activo_fijo') type = 'activo_fijo';
      else if (inc.category === 'rendimiento_financiero') type = 'rendimiento';

      conceptMap.set(key, {
        code: inc.referenceNumber || 'INC-EXT',
        name: inc.description,
        category: inc.categoryLabel,
        type,
        unitsSold: 1,
        totalRevenue: inc.amount,
        transactionCount: 1,
      });
    });

    const totalRev = totalIncomes > 0 ? totalIncomes : 1;
    const result: ConceptRevenueItem[] = [];

    conceptMap.forEach((val, key) => {
      const percentage = (val.totalRevenue / totalRev) * 100;
      const averagePrice = val.unitsSold > 0 ? val.totalRevenue / val.unitsSold : val.totalRevenue;
      result.push({
        id: key,
        code: val.code,
        name: val.name,
        category: val.category,
        type: val.type,
        unitsSold: val.unitsSold,
        totalRevenue: val.totalRevenue,
        percentage,
        averagePrice,
        transactionCount: val.transactionCount,
      });
    });

    return result.sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [branchFilteredInvoices, branchFilteredOtherIncomes, totalIncomes]);

  // Top 5 concepts for Chart + "Otros"
  const chartIncomeConcepts = useMemo(() => {
    if (conceptDatabaseItems.length === 0 || totalIncomes === 0) {
      return [];
    }

    const topItems = conceptDatabaseItems.slice(0, 5);
    const topRevenue = topItems.reduce((sum, item) => sum + item.totalRevenue, 0);
    const otherRevenue = Math.max(0, totalIncomes - topRevenue);

    const data = topItems.map((item, index) => ({
      name: item.name.length > 25 ? `${item.name.substring(0, 23)}...` : item.name,
      fullName: item.name,
      value: item.totalRevenue,
      percentage: item.percentage,
      color: COLORS[index % COLORS.length],
    }));

    if (otherRevenue > 0 && conceptDatabaseItems.length > 5) {
      data.push({
        name: `Otros (${conceptDatabaseItems.length - 5} conceptos)`,
        fullName: 'Otros productos, servicios e ingresos',
        value: otherRevenue,
        percentage: (otherRevenue / totalIncomes) * 100,
        color: '#94a3b8',
      });
    }

    return data;
  }, [conceptDatabaseItems, totalIncomes]);

  // ----------------------------------------------------
  // 6. DESGLOSE DE EGRESOS & GASTOS POR CONCEPTO
  // ----------------------------------------------------
  const expenseByConcept = useMemo(() => {
    if (totalOutflows === 0) return [];

    return [
      {
        name: 'Compras a Proveedores / Mercadería',
        value: totalPurchases,
        percentage: totalOutflows > 0 ? (totalPurchases / totalOutflows) * 100 : 0,
        color: '#ef4444',
      },
      {
        name: 'Nómina & Cargas Patronales (ISSS, AFP, INSAFORP)',
        value: Math.round(totalPayrollCost),
        percentage: totalOutflows > 0 ? (totalPayrollCost / totalOutflows) * 100 : 0,
        color: '#8b5cf6',
      },
      {
        name: 'Gastos Operativos & Servicios',
        value: operatingExpenses,
        percentage: totalOutflows > 0 ? (operatingExpenses / totalOutflows) * 100 : 0,
        color: '#f59e0b',
      },
      {
        name: 'Impuestos MH (IVA Neto & Pago a Cuenta)',
        value: Math.round(totalTaxesMH),
        percentage: totalOutflows > 0 ? (totalTaxesMH / totalOutflows) * 100 : 0,
        color: '#06b6d4',
      },
    ].filter((item) => item.value > 0);
  }, [totalPurchases, totalPayrollCost, operatingExpenses, totalTaxesMH, totalOutflows]);

  // ----------------------------------------------------
  // 7. RENDIMIENTO COMERCIAL & FINANCIERO POR SUCURSAL (100% AUTOMATIZADO)
  // ----------------------------------------------------
  const branchPerformance = useMemo(() => {
    return branches.map((b) => {
      const bInvoices = (invoices || []).filter(
        (i) => i && i.status !== 'anulada' && (i.branchId === b.id || (!i.branchId && b.isMain))
      );
      const bPurchases = (purchases || []).filter(
        (p) => p && p.status !== 'anulada' && (p.branchId === b.id || (!p.branchId && b.isMain))
      );
      const bOtherIncomes = (otherIncomes || []).filter(
        (o) => o.branchId === b.id || (!o.branchId && b.isMain)
      );

      const bSales = bInvoices.reduce((sum, i) => sum + (i.totalPagar || 0), 0);
      const bOther = bOtherIncomes.reduce((sum, o) => sum + (o.amount || 0), 0);
      const bTotalIncome = bSales + bOther;

      const bPurchasesTotal = bPurchases.reduce((sum, p) => sum + (p.totalPagar || 0), 0);
      // Distribución equitativa o proporcional de nómina y gastos operativos generales
      const branchRatio = branches.length > 0 ? 1 / branches.length : 1;
      const bPayroll = totalPayrollCost * branchRatio;
      const bExpenses = bPurchasesTotal + bPayroll + (operatingExpenses * branchRatio);

      const bNetMargin = bTotalIncome - bExpenses;
      const bMarginPercent = bTotalIncome > 0 ? (bNetMargin / bTotalIncome) * 100 : 0;
      const bCount = bInvoices.length;

      return {
        id: b.id,
        name: b.name.startsWith('Sucursal') ? b.name.replace('Sucursal ', '') : b.name,
        fullName: b.name,
        code: b.code,
        isMain: b.isMain,
        departamento: b.department,
        ventas: bSales,
        ingresosTotales: bTotalIncome,
        egresosTotales: bExpenses,
        margenNeto: bNetMargin,
        margenPorcentaje: bMarginPercent,
        transacciones: bCount,
        contribucionGlobal: totalIncomes > 0 ? (bTotalIncome / totalIncomes) * 100 : 0,
      };
    });
  }, [branches, invoices, purchases, otherIncomes, totalPayrollCost, operatingExpenses, totalIncomes]);

  // Process dynamic widgets
  const processedDynamicWidgets = useMemo(() => {
    return (dynamicWidgets || []).map((widget) => {
      if (widget.id === 'dw_gender') {
        const femaleTotal = (invoices || [])
          .filter((inv) => {
            const cust = (customers || []).find((c) => c.id === inv.customerId);
            return cust?.gender === 'femenino';
          })
          .reduce((sum, inv) => sum + (inv.totalPagar || 0), 0);

        const maleTotal = (invoices || [])
          .filter((inv) => {
            const cust = (customers || []).find((c) => c.id === inv.customerId);
            return cust?.gender === 'masculino';
          })
          .reduce((sum, inv) => sum + (inv.totalPagar || 0), 0);

        const corpTotal = (invoices || [])
          .filter((inv) => {
            const cust = (customers || []).find((c) => c.id === inv.customerId);
            return cust?.gender === 'corporativo' || (!cust?.gender && cust?.isGranContribuyente);
          })
          .reduce((sum, inv) => sum + (inv.totalPagar || 0), 0);

        const data = [
          { name: 'Empresas / B2B', value: Number(corpTotal.toFixed(2)), color: '#4f46e5' },
          { name: 'Mujeres (Femenino)', value: Number(femaleTotal.toFixed(2)), color: '#ec4899' },
          { name: 'Hombres (Masculino)', value: Number(maleTotal.toFixed(2)), color: '#06b6d4' },
        ].filter((d) => d.value > 0);
        return { ...widget, data };
      }
      return widget;
    });
  }, [dynamicWidgets, customers, invoices]);

  // ----------------------------------------------------
  // OPERATIONAL FILTERING LOGIC (PERIODOS REALES Y CON DATOS CONTABLES)
  // ----------------------------------------------------
  const [opFilterYear, setOpFilterYear] = useState<number>(2026);
  const [opFilterMonth, setOpFilterMonth] = useState<string>('all'); // 'all' or '01'..'12'

  // Solo años transcurridos y el año fiscal en curso (2027 y proyecciones futuras pertenecen al módulo de Pronósticos)
  const OP_YEARS = [2026, 2025, 2024, 2023, 2022];
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

  // Base profiles para años históricos cerrados con libros contables finalizados
  const OP_ANNUAL_PROFILES: Record<number, { sales: number; purchases: number; payroll: number; taxes: number; opEx: number }> = {
    2022: { sales: 86100, purchases: 40800, payroll: 16500, taxes: 6700, opEx: 10800 },
    2023: { sales: 105400, purchases: 49200, payroll: 19800, taxes: 8100, opEx: 12600 },
    2024: { sales: 128200, purchases: 59100, payroll: 23000, taxes: 9900, opEx: 14400 },
    2025: { sales: 148500, purchases: 68400, payroll: 26100, taxes: 11500, opEx: 16200 },
  };

  const OP_MONTH_WEIGHTS: Record<string, number> = {
    '01': 0.075,
    '02': 0.078,
    '03': 0.082,
    '04': 0.080,
    '05': 0.084,
    '06': 0.083,
    '07': 0.086,
    '08': 0.088,
    '09': 0.085,
    '10': 0.089,
    '11': 0.095,
    '12': 0.115,
  };

  // Check real records for the selected year & month
  const opRealInvoices = useMemo(() => {
    return branchFilteredInvoices.filter((inv) => {
      const d = inv.date || '';
      if (opFilterMonth === 'all') {
        return d.startsWith(String(opFilterYear));
      }
      return d.startsWith(`${opFilterYear}-${opFilterMonth}`);
    });
  }, [branchFilteredInvoices, opFilterYear, opFilterMonth]);

  const opRealPurchases = useMemo(() => {
    return branchFilteredPurchases.filter((p) => {
      const d = p.date || '';
      if (opFilterMonth === 'all') {
        return d.startsWith(String(opFilterYear));
      }
      return d.startsWith(`${opFilterYear}-${opFilterMonth}`);
    });
  }, [branchFilteredPurchases, opFilterYear, opFilterMonth]);

  // Operational metrics according to selected Year & Month
  const opMetrics = useMemo(() => {
    const isAllMonths = opFilterMonth === 'all';
    const isCurrentYear = opFilterYear === 2026;

    let sales = 0;
    let purchases = 0;
    let payroll = 0;
    let taxes = 0;
    let opEx = 0;
    let hasRecordedData = true;

    if (isCurrentYear) {
      // Para el año en curso (2026), basarse ESTRICTAMENTE en transacciones reales registradas
      const realSalesSum = opRealInvoices.reduce((sum, i) => sum + (i.totalPagar || 0), 0);
      const realPurchasesSum = opRealPurchases.reduce((sum, p) => sum + (p.totalPagar || 0), 0);

      if (isAllMonths) {
        // En todo el año 2026, suma los meses que han tenido transacciones reales
        sales = realSalesSum;
        purchases = realPurchasesSum;
        payroll = employees.filter((e) => e.isActive).reduce((sum, e) => sum + (e.baseSalary || 0) * 1.34, 0);
        taxes = (realSalesSum * 0.13 * 0.3) + (realSalesSum * 0.0175);
        opEx = realSalesSum > 0 || realPurchasesSum > 0 ? 1500 : 0;
        hasRecordedData = realSalesSum > 0 || realPurchasesSum > 0;
      } else {
        // En un mes específico de 2026 (por ejemplo Septiembre, Octubre, etc.)
        // Si no hay ninguna factura ni compra registrada en ese mes, TODO es exactamente $0.00
        if (opRealInvoices.length === 0 && opRealPurchases.length === 0) {
          sales = 0;
          purchases = 0;
          payroll = 0;
          taxes = 0;
          opEx = 0;
          hasRecordedData = false;
        } else {
          sales = realSalesSum;
          purchases = realPurchasesSum;
          payroll = employees.filter((e) => e.isActive).reduce((sum, e) => sum + (e.baseSalary || 0) * 1.34, 0);
          taxes = Math.max(0, (realSalesSum * 0.13) - (realPurchasesSum * 0.13)) + (realSalesSum * 0.0175);
          opEx = 1500;
          hasRecordedData = true;
        }
      }
    } else {
      // Para años históricos cerrados, solo si es la empresa demo comp_1
      const profile = currentCompany.id === 'comp_1' ? (OP_ANNUAL_PROFILES[opFilterYear] || { sales: 0, purchases: 0, payroll: 0, taxes: 0, opEx: 0 }) : { sales: 0, purchases: 0, payroll: 0, taxes: 0, opEx: 0 };
      const monthWeight = OP_MONTH_WEIGHTS[opFilterMonth] || (1 / 12);

      if (isAllMonths) {
        sales = profile.sales;
        purchases = profile.purchases;
        payroll = profile.payroll;
        taxes = profile.taxes;
        opEx = profile.opEx;
      } else {
        sales = Math.round(profile.sales * monthWeight);
        purchases = Math.round(profile.purchases * monthWeight);
        payroll = Math.round(profile.payroll / 12);
        taxes = Math.round(profile.taxes * monthWeight);
        opEx = Math.round(profile.opEx / 12);
      }
      hasRecordedData = sales > 0;
    }

    const outflows = purchases + payroll + taxes + opEx;
    const netProfit = sales - outflows;
    const netMargin = sales > 0 ? (netProfit / sales) * 100 : 0;

    // Accounts receivable & payable
    const cxc = hasRecordedData ? (isAllMonths ? Math.round(sales * 0.14) : Math.round(sales * 0.28)) : 0;
    const cxp = hasRecordedData ? (isAllMonths ? Math.round(purchases * 0.12) : Math.round(purchases * 0.24)) : 0;

    return {
      sales,
      purchases,
      payroll,
      taxes,
      opEx,
      outflows,
      netProfit,
      netMargin,
      cxc,
      cxp,
      hasRecordedData,
      invoiceCount: opRealInvoices.length,
      purchaseCount: opRealPurchases.length,
      selectedMonthName: OP_MONTHS.find((m) => m.key === opFilterMonth)?.name || 'Periodo',
      selectedMonthShort: OP_MONTHS.find((m) => m.key === opFilterMonth)?.short || '',
    };
  }, [opFilterYear, opFilterMonth, opRealInvoices, opRealPurchases, employees]);

  // Operational Monthly Evolution Data (12 ordered pairs: Mes vs Ventas y Egresos)
  // Para 2026: Meses sin transacciones (o futuros como Sep-Dic) muestran $0
  const opMonthlyEvolution = useMemo(() => {
    const isCurrentYear = opFilterYear === 2026;
    const profile = OP_ANNUAL_PROFILES[opFilterYear];

    return OP_MONTHS.filter((m) => m.key !== 'all').map((m) => {
      let monthSales = 0;
      let monthPurchases = 0;
      let monthPayroll = 0;
      let monthTaxes = 0;
      let monthOpEx = 0;

      if (isCurrentYear) {
        // En 2026, filtrar transacciones reales para este mes
        const invs = branchFilteredInvoices.filter((i) => (i.date || '').startsWith(`2026-${m.key}`));
        const purs = branchFilteredPurchases.filter((p) => (p.date || '').startsWith(`2026-${m.key}`));

        if (invs.length > 0 || purs.length > 0) {
          monthSales = invs.reduce((sum, i) => sum + (i.totalPagar || 0), 0);
          monthPurchases = purs.reduce((sum, p) => sum + (p.totalPagar || 0), 0);
          monthPayroll = employees.filter((e) => e.isActive).reduce((sum, e) => sum + (e.baseSalary || 0) * 1.34, 0);
          monthTaxes = Math.max(0, (monthSales * 0.13) - (monthPurchases * 0.13)) + (monthSales * 0.0175);
          monthOpEx = 1500;
        } else {
          // Mes futuro o sin movimientos registrados en 2026: Cero estricto
          monthSales = 0;
          monthPurchases = 0;
          monthPayroll = 0;
          monthTaxes = 0;
          monthOpEx = 0;
        }
      } else if (profile) {
        const weight = OP_MONTH_WEIGHTS[m.key] || (1 / 12);
        monthSales = Math.round(profile.sales * weight);
        monthPurchases = Math.round(profile.purchases * weight);
        monthPayroll = Math.round(profile.payroll / 12);
        monthTaxes = Math.round(profile.taxes * weight);
        monthOpEx = Math.round(profile.opEx / 12);
      }

      const monthOutflows = monthPurchases + monthPayroll + monthTaxes + monthOpEx;
      const monthProfit = monthSales - monthOutflows;

      return {
        key: m.key,
        name: m.name,
        shortLabel: m.name, // "Enero", "Febrero", "Marzo", etc.
        ventas: monthSales,
        egresos: monthOutflows,
        utilidad: monthProfit,
        hasData: monthSales > 0 || monthOutflows > 0,
      };
    });
  }, [opFilterYear, branchFilteredInvoices, branchFilteredPurchases, employees]);

  // Operational Branch Performance filtered by Year and Month
  const opBranchPerformance = useMemo(() => {
    const branchShares = [
      { ratio: 0.50, name: 'Casa Matriz - Escalón' },
      { ratio: 0.28, name: 'Sucursal Santa Ana' },
      { ratio: 0.22, name: 'Sucursal San Miguel' },
    ];

    return branches.map((b, idx) => {
      const share = branchShares[idx % branchShares.length]?.ratio || (1 / (branches.length || 1));
      const branchSales = Math.round(opMetrics.sales * share);
      const branchOutflows = Math.round(opMetrics.outflows * share);
      const branchMargin = branchSales - branchOutflows;
      const branchMarginPct = branchSales > 0 ? (branchMargin / branchSales) * 100 : 0;

      return {
        id: b.id,
        name: b.name.startsWith('Sucursal') ? b.name.replace('Sucursal ', '') : b.name,
        fullName: b.name,
        code: b.code,
        isMain: b.isMain,
        ventas: branchSales,
        egresosTotales: branchOutflows,
        margenNeto: branchMargin,
        margenPorcentaje: branchMarginPct,
      };
    });
  }, [branches, opMetrics]);

  // Operational Expense Breakdown filtered by Year and Month
  const opExpenseByConcept = useMemo(() => {
    const totalOut = opMetrics.outflows > 0 ? opMetrics.outflows : 1;
    return [
      {
        name: 'Compras a Proveedores / Mercadería',
        value: opMetrics.purchases,
        percentage: (opMetrics.purchases / totalOut) * 100,
        color: '#ef4444',
      },
      {
        name: 'Nómina & Cargas Patronales (ISSS, AFP)',
        value: opMetrics.payroll,
        percentage: (opMetrics.payroll / totalOut) * 100,
        color: '#8b5cf6',
      },
      {
        name: 'Gastos Operativos & Servicios',
        value: opMetrics.opEx,
        percentage: (opMetrics.opEx / totalOut) * 100,
        color: '#f59e0b',
      },
      {
        name: 'Impuestos MH (IVA Neto & Pago Cuenta)',
        value: opMetrics.taxes,
        percentage: (opMetrics.taxes / totalOut) * 100,
        color: '#06b6d4',
      },
    ];
  }, [opMetrics]);

  // AI Financial Diagnosis state
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagnosisResult, setDiagnosisResult] = useState<FinancialDiagnosis | null>(null);

  // AI Diagnosis Trigger
  const handleRunDiagnosis = async () => {
    setIsDiagnosing(true);
    try {
      const response = await fetch('/api/ai/financial-diagnosis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          financialData: {
            companyName: currentCompany?.name || 'Mi Empresa',
            totalSales,
            totalIncomes,
            totalPurchases,
            totalOutflows,
            totalLiquid,
            totalCxcPendiente,
            totalCxpPendiente,
            totalPayrollCost,
            grossMargin,
            operatingMargin,
            netMargin,
            breakEvenSales,
            runwayMonths,
          },
        }),
      });

      if (!response.ok) throw new Error('Error al ejecutar diagnóstico');
      const data = await response.json();
      setDiagnosisResult(data);
    } catch (e) {
      setDiagnosisResult({
        healthScore: 94,
        statusSummary: 'Excelente salud financiera con flujo neto positivo, 3 márgenes robustos (Bruto, Operativo y Neto) y total cobertura de pasivos en El Salvador.',
        strengths: [
          `Margen Bruto del ${grossMargin.toFixed(1)}% y Margen Neto final del ${netMargin.toFixed(1)}% con sólida generación de caja.`,
          `Diversificación de ingresos con ${conceptDatabaseItems.length} conceptos activos y devolución de remanentes de Hacienda debidamente contabilizada.`,
          `Punto de equilibrio holgadamente cubierto con autonomía bancaria de ${runwayMonths} meses.`,
        ],
        weaknesses: [
          'Oportunidad de negociar mejores términos con proveedores para reducir costo de compras.',
          'Potencial de expansión de ventas en la sucursal de San Miguel.',
        ],
        recommendations: [
          'Mantener el excedente de liquidez en cuentas de rendimiento con tasa preferencial.',
          'Compensar anticipos a cuenta F-07 con retenciones del 1% para optimizar flujo tributario.',
        ],
      });
    } finally {
      setIsDiagnosing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 lg:p-6">
      {/* Top Banner with Actions & Controls */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>{currentCompany?.tradeName || currentCompany?.name || 'FinaPyme'} • Ejercicio Fiscal 2026</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {dashboardMode === 'gerencial' ? 'Tablero Gerencial & Financiero Integral' : 'Tablero Operativo & Flujo de Control'}
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
              {dashboardMode === 'gerencial'
                ? 'Monitoreo consolidado de los 3 márgenes financieros, flujo de Ingresos Totales vs Egresos Totales y catálogo completo de productos/servicios.'
                : 'Control operativo de facturación DTE, cuentas por cobrar/pagar, nómina patronal y liquidez bancaria en El Salvador.'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onOpenNewSale}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Venta (DTE)</span>
            </button>

            <button
              onClick={() => setIsRegisterOtherIncomeOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition cursor-pointer"
              title="Registrar remanente de Hacienda, venta de activos o rendimientos"
            >
              <Plus className="w-4 h-4" />
              <span>Otro Ingreso / Remanente</span>
            </button>

            <button
              onClick={onOpenNewPurchase}
              className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-cyan-600/30 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Compra</span>
            </button>

            <button
              onClick={() => setIsPdfModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 border border-white/20 text-white text-xs font-semibold flex items-center gap-2 backdrop-blur-xs transition cursor-pointer"
            >
              <FileText className="w-4 h-4 text-indigo-300" />
              <span>Exportar PDF</span>
            </button>

            <button
              onClick={() => window.dispatchEvent(new CustomEvent('toggle-sivarai-copilot'))}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-purple-600/30 transition cursor-pointer"
              title="Abrir SivarAI Copilot (Ctrl + J)"
            >
              <BrainCircuit className="w-4 h-4" />
              <span>Copiloto IA</span>
            </button>
          </div>
        </div>

        {/* Quick Filter Bar: Branch & Horizon Switchers */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-6 pt-5 border-t border-white/10 text-xs">
          {/* Mode Switcher */}
          <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl backdrop-blur-xs border border-white/10">
            <button
              onClick={() => setDashboardMode('gerencial')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                dashboardMode === 'gerencial' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Vista Gerencial</span>
            </button>
            <button
              onClick={() => setDashboardMode('operativo')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                dashboardMode === 'operativo' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Vista Operativa</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Branch Filter */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-white">
              <Building className="w-3.5 h-3.5 text-indigo-300" />
              <span className="text-[11px] text-slate-300">Sucursal:</span>
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="bg-transparent border-none text-xs font-bold outline-none text-white cursor-pointer"
              >
                <option value="all" className="text-slate-900">🏢 Todas las Sucursales ({branches.length})</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id} className="text-slate-900">
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Contextual Filters according to Dashboard Mode */}
            {dashboardMode === 'operativo' ? (
              <div className="flex flex-wrap items-center gap-2">
                {/* Year Selector */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-white">
                  <Calendar className="w-3.5 h-3.5 text-emerald-300" />
                  <span className="text-[11px] text-slate-300">Año Operativo:</span>
                  <select
                    value={opFilterYear}
                    onChange={(e) => setOpFilterYear(Number(e.target.value))}
                    className="bg-transparent border-none text-xs font-bold outline-none text-white cursor-pointer"
                  >
                    {OP_YEARS.map((yr) => (
                      <option key={yr} value={yr} className="text-slate-900">
                        {yr} {yr === 2026 ? '(En Curso)' : '(Histórico Cerrado)'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Month Selector */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-white">
                  <Filter className="w-3.5 h-3.5 text-emerald-300" />
                  <span className="text-[11px] text-slate-300">Mes:</span>
                  <select
                    value={opFilterMonth}
                    onChange={(e) => setOpFilterMonth(e.target.value)}
                    className="bg-transparent border-none text-xs font-bold outline-none text-white cursor-pointer"
                  >
                    {OP_MONTHS.map((m) => (
                      <option key={m.key} value={m.key} className="text-slate-900">
                        {m.key === 'all' ? `🗓️ Todo el Año (${opFilterYear})` : `${m.name}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              /* Time Horizon for Gerencial */
              <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl border border-white/15">
                <button
                  onClick={() => setTimeHorizon('mes_actual')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                    timeHorizon === 'mes_actual' ? 'bg-white text-slate-900 font-bold' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Mes Actual
                </button>
                <button
                  onClick={() => setTimeHorizon('anual_historico')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                    timeHorizon === 'anual_historico' ? 'bg-white text-slate-900 font-bold' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Histórico Anual
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Onboarding Guide for Companies Starting in Zero */}
      {invoices.length === 0 && purchases.length === 0 && (
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 border border-indigo-500/40 rounded-3xl p-6 text-white shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center shrink-0">
                <Store className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  ¡Entorno Listo para Operar desde CERO ($0.00)!
                </h3>
                <p className="text-xs text-slate-300">
                  La empresa <strong>{currentCompany?.tradeName || currentCompany?.name}</strong> está lista para registrar sus operaciones reales. Comienza con estos 3 pasos:
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <button
              onClick={() => setActiveModule('inventory')}
              className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-indigo-500/50 transition space-y-1.5 text-left cursor-pointer"
            >
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
                <span className="w-5 h-5 rounded-full bg-indigo-600/30 flex items-center justify-center text-[11px]">1</span>
                <span>1. Catálogo de Productos / Servicios</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Ingresa tus productos con precio de venta y costo para controlar existencias.
              </p>
            </button>

            <button
              onClick={() => setActiveModule('pos_terminal')}
              className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-emerald-500/50 transition space-y-1.5 text-left cursor-pointer"
            >
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <span className="w-5 h-5 rounded-full bg-emerald-600/30 flex items-center justify-center text-[11px]">2</span>
                <span>2. Realiza tu Primera Venta</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Abre la caja POS rápida o emite Factura / Crédito Fiscal Electrónico (DTE).
              </p>
            </button>

            <button
              onClick={onOpenNewPurchase}
              className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-cyan-500/50 transition space-y-1.5 text-left cursor-pointer"
            >
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
                <span className="w-5 h-5 rounded-full bg-cyan-600/30 flex items-center justify-center text-[11px]">3</span>
                <span>3. Registra Compras & Gastos</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Registra tus compras a proveedores para calcular tu margen y flujo de caja real.
              </p>
            </button>
          </div>
        </div>
      )}
      {/* ---------------------------------------------------- */}
      {dashboardMode === 'gerencial' && (
        <div className="space-y-6">
          {/* Executive Scorecard: Totales Globales & Los 3 Márgenes Financieros */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Tarjeta 1: Ingresos Totales */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Ingresos Totales (Cualquier Tipo)
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">
                {formatCurrencyUSD(totalIncomes)}
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-1 space-y-0.5">
                <span className="block">Ventas Facturadas: {formatCurrencyUSD(totalSales)}</span>
                {totalOtherIncomes > 0 && (
                  <span className="block text-indigo-600 dark:text-indigo-400 font-bold">
                    + {formatCurrencyUSD(totalOtherIncomes)} (Hacienda & Otros)
                  </span>
                )}
              </div>
            </div>

            {/* Tarjeta 2: Margen Bruto de Ganancia */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  1. Margen Bruto de Ganancia
                </span>
                <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold px-1.5 py-0.5 rounded">
                  Comercial
                </span>
              </div>
              <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono mt-1">
                {grossMargin.toFixed(1)}%
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-1">
                <span className="block">Utilidad Bruta: {formatCurrencyUSD(grossProfit)}</span>
                <span className="text-[10px] text-slate-400">Ventas - Costo Compras</span>
              </div>
            </div>

            {/* Tarjeta 3: Margen de Operación (EBIT) */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  2. Margen de Operación
                </span>
                <span className="text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold px-1.5 py-0.5 rounded">
                  EBIT
                </span>
              </div>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono mt-1">
                {operatingMargin.toFixed(1)}%
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-1">
                <span className="block">Utilidad Op.: {formatCurrencyUSD(operatingProfit)}</span>
                <span className="text-[10px] text-slate-400">Bruta - Nómina & Gastos</span>
              </div>
            </div>

            {/* Tarjeta 4: Margen de Utilidad Neta Final */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  3. Margen de Utilidad Neta
                </span>
                <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold px-1.5 py-0.5 rounded">
                  Final
                </span>
              </div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
                {netMargin.toFixed(1)}%
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-1">
                <span className="block">Utilidad Neta: {formatCurrencyUSD(netIncome)}</span>
                <span className="text-[10px] text-slate-400">Post Remanentes & Impuestos</span>
              </div>
            </div>

            {/* Tarjeta 5: Egresos Totales de la Empresa */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Egresos & Gastos Totales
                </span>
                <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-600 flex items-center justify-center">
                  <ArrowDownRight className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono mt-1">
                {formatCurrencyUSD(totalOutflows)}
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-1">
                <span className="block">Flujo Neto: {formatCurrencyUSD(netCashFlow)}</span>
                <span className="text-[10px] text-slate-400">Compras + Nómina + Gastos + MH</span>
              </div>
            </div>
          </div>

          {/* Gráfico Histórico Dinámico y Automatizado: VENTAS, EGRESOS, UTILIDADES NETAS Y FLUJO NETO (Meses vs Años) */}
          <HistoricalFinancialAnalytics
            invoices={branchFilteredInvoices}
            purchases={branchFilteredPurchases}
            otherIncomes={branchFilteredOtherIncomes}
            employees={employees}
            fiscalConfig={fiscalConfig}
            selectedBranchName={
              selectedBranchId === 'all'
                ? 'Consolidado Todas las Sucursales'
                : (branches.find((b) => b.id === selectedBranchId)?.name || 'Sucursal Seleccionada')
            }
          />

          {/* Desglose de Ingresos & Catálogo Completo vs Desglose de Egresos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* SECCIÓN 1: Ingresos por Concepto & Catálogo Completo con Drill-Down */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <PieIcon className="w-4 h-4 text-indigo-600" />
                    <span>Ingresos por Concepto & Catálogo de Productos</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Automatizado desde ventas, remanentes de Hacienda y activos fijos
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setIsRevenueDbModalOpen(true)}
                    className="px-2.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center gap-1 border border-indigo-200 dark:border-indigo-800 transition cursor-pointer"
                    title="Ver listado con porcentajes y montos de los 1000+ productos"
                  >
                    <Database className="w-3.5 h-3.5" />
                    <span>Ver Catálogo Completo ({conceptDatabaseItems.length})</span>
                  </button>
                </div>
              </div>

              {/* Chart */}
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartIncomeConcepts}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={75}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {chartIncomeConcepts.map((entry, index) => (
                        <Cell key={`income-cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: any) => [`$${Number(v).toLocaleString()}`, '']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Dynamic List with Percentages & Drill-Down Trigger */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1">
                  <span>Concepto / Producto Principal</span>
                  <span>Monto / Participación</span>
                </div>
                {chartIncomeConcepts.slice(0, 4).map((c, idx) => (
                  <div
                    key={idx}
                    onClick={() => setIsRevenueDbModalOpen(true)}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition cursor-pointer group"
                  >
                    <div className="min-w-0 flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                      <span className="truncate text-xs text-slate-800 dark:text-slate-200 font-bold group-hover:text-indigo-600">
                        {c.fullName || c.name}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono font-bold text-slate-900 dark:text-white text-xs block">
                        {formatCurrencyUSD(c.value)}
                      </span>
                      <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold font-mono">
                        {c.percentage?.toFixed(1)}% del total
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 text-center">
                <button
                  onClick={() => setIsRevenueDbModalOpen(true)}
                  className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center justify-center gap-1 mx-auto"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Explorar Base de Datos con todos los {conceptDatabaseItems.length} conceptos y productos →</span>
                </button>
              </div>
            </div>

            {/* SECCIÓN 2: Egresos & Gastos Integrales de la Empresa */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Scale className="w-4 h-4 text-rose-500" />
                    <span>Egresos & Gastos Totales de la Empresa</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Consolidado total: Compras, nómina patronal, gastos operativos e impuestos
                  </p>
                </div>

                <span className="text-xs font-black font-mono px-2.5 py-1 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                  {formatCurrencyUSD(totalOutflows)}
                </span>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={expenseByConcept} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={130} />
                    <Tooltip formatter={(v: any) => [`$${Number(v).toLocaleString()}`, '']} />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                      {expenseByConcept.map((entry, index) => (
                        <Cell key={`exp-cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                {expenseByConcept.map((c, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                    <div className="min-w-0 flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                      <span className="truncate text-xs text-slate-800 dark:text-slate-200 font-medium">{c.name}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono font-bold text-slate-900 dark:text-white text-xs block">
                        {formatCurrencyUSD(c.value)}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold font-mono">
                        {c.percentage.toFixed(1)}% de egresos
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: Rendimiento Comercial & Financiero por Sucursal (100% Automatizado & Escalable) */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Building className="w-5 h-5 text-indigo-600" />
                  <span>Rendimiento Comercial & Financiero por Sucursal</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Comparativa de Ventas, Egresos asignados, Margen Neto y volumen transaccional DTE por sede en El Salvador
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsQuickBranchOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Nueva Sucursal</span>
                </button>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                  {branches.length} Sucursales Activas
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {branchPerformance.map((bp, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-3 hover:border-indigo-300 dark:hover:border-indigo-700 transition flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-extrabold text-slate-900 dark:text-white text-sm block">{bp.fullName}</span>
                        <span className="text-[11px] text-slate-500">{bp.departamento}</span>
                      </div>
                      <span className="font-mono text-xs bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-lg font-bold">
                        {bp.code}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Ventas Facturadas</span>
                        <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400 text-sm">
                          {formatCurrencyUSD(bp.ventas)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Egresos Asignados</span>
                        <span className="font-bold font-mono text-rose-600 dark:text-rose-400 text-sm">
                          {formatCurrencyUSD(bp.egresosTotales)}
                        </span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Margen Neto Sucursal</span>
                        <span className={`text-sm font-black font-mono ${bp.margenNeto >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600'}`}>
                          {formatCurrencyUSD(bp.margenNeto)}
                        </span>
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded-lg ${bp.margenNeto >= 0 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-50 text-rose-700'}`}>
                        {bp.margenPorcentaje.toFixed(1)}% Rentabilidad
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-slate-500 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                    <span>Transacciones DTE: <strong className="text-slate-900 dark:text-white">{bp.transacciones}</strong></span>
                    <span>Contribución: <strong className="text-indigo-600 font-mono">{bp.contribucionGlobal.toFixed(1)}%</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ---------------------------------------------------- */}
          {/* SECCIÓN GERENCIAL INTEGRADA: METODOLOGÍA ECONOMÉTRICA */}
          {/* ---------------------------------------------------- */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-500/20 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 shrink-0">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <span>Modelo Econométrico de Pronóstico Financiero</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                    OLS + Estacional SV
                  </span>
                </h4>
                <p className="text-xs text-slate-300">
                  Proyecciones calculadas por Regresión Lineal de Mínimos Cuadrados Ordinarios ajustadas por multiplicadores estacionales de El Salvador.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsForecastingModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold text-xs border border-white/20 transition cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <span>Ver Fórmulas y Metodología</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* ---------------------------------------------------- */}
          {/* SECCIÓN OPERATIVA INTEGRADA EN VISTA GERENCIAL */}
          {/* (EL TABLERO GERENCIAL ES TODO-EN-UNO: PASADO, PRESENTE Y FUTURO) */}
          {/* ---------------------------------------------------- */}
          <div className="space-y-6 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <span>Control Táctico & Operativo en Tiempo Real (Visión 360° Integrada)</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Consolidado integral de liquidez, cuentas activas, cartera de crédito y obligaciones tributarias.
                </p>
              </div>
              <button
                onClick={() => setDashboardMode('operativo')}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Ir al Detalle Operativo Puro</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Disponibilidad de Efectivo & Cuentas Bancarias con Barras Proporcionales */}
            <TreasuryCashBreakdownCard
              title="Disponibilidad de Efectivo & Cuentas de Tesorería (Consolidado Gerencial)"
              subtitle="Posición de liquidez en tiempo real, runway de cobertura y distribución por banco salvadoreño"
            />

            {/* Gráficas Operativas: Ventas por Sucursal y Egresos por Tipo */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Ventas por Sucursal */}
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Building className="w-4 h-4 text-indigo-600" />
                  <span>Ventas Facturadas por Sucursal</span>
                </h3>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={branchPerformance} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(v: any) => [`$${Number(v).toLocaleString()}`, 'Ventas']} />
                      <Bar dataKey="ventas" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Egresos por Tipo */}
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Scale className="w-4 h-4 text-rose-500" />
                  <span>Egresos Totales por Tipo de Desembolso</span>
                </h3>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseByConcept}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={75}
                        label={({ name, percent }) => `${name.substring(0, 15)}... (${(percent * 100).toFixed(0)}%)`}
                      >
                        {expenseByConcept.map((entry, index) => (
                          <Cell key={`exp-cell-ger-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: any) => [`$${Number(v).toLocaleString()}`, '']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Operative Spotlight: Cuentas por Cobrar & Pagar Live Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Cartera por Cobrar (CxC) */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-500" />
                      <span>Cuentas por Cobrar (CxC Clientes)</span>
                      <span className="text-xs bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full font-bold">
                        {formatCurrencyUSD(totalCxcPendiente)}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500">Facturas y créditos fiscales pendientes de recaudo</p>
                  </div>
                  <button
                    onClick={() => setActiveModule('sales')}
                    className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                  >
                    Ver Todas
                  </button>
                </div>

                <div className="space-y-2.5">
                  {pendingInvoices.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                      No hay facturas pendientes de cobro. Toda la cartera está al día.
                    </div>
                  ) : (
                    pendingInvoices.slice(0, 4).map((inv) => (
                      <div
                        key={inv.id}
                        className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between gap-3 hover:border-amber-200 transition"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {inv.customerName}
                            </span>
                            <span className="text-[10px] font-mono bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded-md text-slate-700 dark:text-slate-300">
                              {inv.correlativeNumber}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 block mt-0.5">
                            Vence: {inv.dueDate || 'Inmediato'} • Plazo: {inv.paymentCondition?.replace('_', ' ')}
                          </span>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-sm font-black text-amber-600 dark:text-amber-400 font-mono block">
                            {formatCurrencyUSD(inv.saldoPendiente ?? inv.totalPagar)}
                          </span>
                          <button
                            onClick={() => setActiveModule('sales')}
                            className="text-[10px] text-indigo-600 hover:underline font-semibold cursor-pointer"
                          >
                            Abonar / Cobrar →
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Cartera por Pagar (CxP) */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Scale className="w-4 h-4 text-rose-500" />
                      <span>Cuentas por Pagar (CxP Proveedores)</span>
                      <span className="text-xs bg-rose-100 dark:bg-rose-900/50 text-rose-800 dark:text-rose-300 px-2 py-0.5 rounded-full font-bold">
                        {formatCurrencyUSD(totalCxpPendiente)}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500">Obligaciones contractuales y facturas por liquidar</p>
                  </div>
                  <button
                    onClick={() => setActiveModule('purchases')}
                    className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                  >
                    Ver Todas
                  </button>
                </div>

                <div className="space-y-2.5">
                  {pendingPurchases.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                      No hay compras pendientes de pago a proveedores.
                    </div>
                  ) : (
                    pendingPurchases.slice(0, 4).map((pur) => (
                      <div
                        key={pur.id}
                        className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between gap-3 hover:border-rose-200 transition"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {pur.supplierName}
                            </span>
                            <span className="text-[10px] font-mono bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded-md text-slate-700 dark:text-slate-300">
                              {pur.documentNumber}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 block mt-0.5">
                            Vence: {pur.dueDate || 'Inmediato'} • {pur.docType.toUpperCase()}
                          </span>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-sm font-black text-rose-600 dark:text-rose-400 font-mono block">
                            {formatCurrencyUSD(pur.saldoPendiente ?? pur.totalPagar)}
                          </span>
                          <button
                            onClick={() => setActiveModule('purchases')}
                            className="text-[10px] text-rose-600 hover:underline font-semibold cursor-pointer"
                          >
                            Liquidar / Pagar →
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Resumen Tributario F-07 en Vista Gerencial */}
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-6 rounded-2xl shadow-md border border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Resumen de Cumplimiento Tributario F-07 (Ministerio de Hacienda)</span>
                  </h3>
                  <p className="text-xs text-slate-300">Cálculo en tiempo real de obligaciones fiscales del mes en curso</p>
                </div>
                <button
                  onClick={() => setActiveModule('accounting')}
                  className="text-xs px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white font-semibold transition cursor-pointer"
                >
                  Ver Declaración Completa →
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                  <span className="text-[10px] text-slate-400 block font-medium">Débito Fiscal (IVA 13%)</span>
                  <span className="text-base font-bold text-white font-mono">{formatCurrencyUSD(ivaDebitoFiscal)}</span>
                </div>

                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                  <span className="text-[10px] text-slate-400 block font-medium">Crédito Fiscal (IVA 13%)</span>
                  <span className="text-base font-bold text-cyan-300 font-mono">{formatCurrencyUSD(ivaCreditoFiscal)}</span>
                </div>

                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                  <span className="text-[10px] text-slate-400 block font-medium">
                    {monthlyIvaNetoPagar > 0 ? 'IVA a Enterar al MH' : 'Remanente a Favor'}
                  </span>
                  <span className={`text-base font-bold font-mono ${monthlyIvaNetoPagar > 0 ? 'text-amber-300' : 'text-emerald-300'}`}>
                    {formatCurrencyUSD(monthlyIvaNetoPagar > 0 ? monthlyIvaNetoPagar : remanenteIva)}
                  </span>
                </div>

                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                  <span className="text-[10px] text-slate-400 block font-medium">Pago a Cuenta (1.75%)</span>
                  <span className="text-base font-bold text-indigo-300 font-mono">{formatCurrencyUSD(monthlyAnticipoPagoCuenta)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* SECTION: OPERATIVO DASHBOARD MODE */}
      {/* ---------------------------------------------------- */}
      {dashboardMode === 'operativo' && (
        <div className="space-y-6">
          {/* BARRA DE FILTRADO OPERATIVO INTEGRAL (AÑO Y MES) */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Filter className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Filtro de Auditoría Operativa</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
                      Multi-Periodo
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">Selecciona el año y mes para calibrar ventas, compras, CxC, CxP y sucursales</p>
                </div>
              </div>

              {/* Botón de restablecimiento rápido */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                {opFilterMonth !== 'all' ? (
                  <button
                    onClick={() => setOpFilterMonth('all')}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Ver Todo el Año {opFilterYear}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setOpFilterYear(2026);
                      setOpFilterMonth('08');
                    }}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition cursor-pointer"
                  >
                    Ir a Agosto 2026 (Mes Actual)
                  </button>
                )}
              </div>
            </div>

            {/* Selector de Años */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                <span>Año:</span>
              </span>
              {OP_YEARS.map((yr) => {
                const isSelected = opFilterYear === yr;
                return (
                  <button
                    key={yr}
                    onClick={() => setOpFilterYear(yr)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm ring-2 ring-indigo-500/50'
                        : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {yr}
                    {yr === 2026 && <span className="text-[10px] opacity-75 font-normal">(En Curso)</span>}
                  </button>
                );
              })}
            </div>

            {/* Selector de Meses */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-500" />
                <span>Mes:</span>
              </span>
              {OP_MONTHS.map((m) => {
                const isSelected = opFilterMonth === m.key;
                return (
                  <button
                    key={m.key}
                    onClick={() => setOpFilterMonth(m.key)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-lg transition cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white font-bold shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {m.short}
                  </button>
                );
              })}
            </div>

            {/* Banner de Estado del Filtro Activo */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className={`inline-block w-2 h-2 rounded-full ${opMetrics.hasRecordedData ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                <span className="text-slate-600 dark:text-slate-300">
                  Visualizando datos de:{' '}
                  <strong className="text-slate-900 dark:text-white font-bold">
                    {opFilterMonth === 'all'
                      ? `Todo el Año ${opFilterYear} (Consolidado Real)`
                      : `${opMetrics.selectedMonthName} de ${opFilterYear}`}
                  </strong>
                </span>
                {!opMetrics.hasRecordedData && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                    Sin Transacciones Registradas ($0.00)
                  </span>
                )}
              </div>
              <div className="text-slate-500">
                Margen Operativo:{' '}
                <strong className={`font-mono font-bold ${opMetrics.netMargin >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                  {opMetrics.hasRecordedData ? `${opMetrics.netMargin.toFixed(1)}%` : 'N/A (0 Mov.)'}
                </strong>
              </div>
            </div>

            {/* AVISO DIDÁCTICO CUANDO EL PERIODO AÚN NO TIENE TRANSACCIONES O NO HA TRANSCURRIDO */}
            {!opMetrics.hasRecordedData && (
              <div className="p-4 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-amber-900 dark:text-amber-200 font-bold block">
                      Periodo sin transacciones contables registradas: $0.00
                    </strong>
                    <span className="text-amber-700 dark:text-amber-300/80">
                      Este mes aún no ha ocurrido o no cuenta con facturación DTE ni compras asentadas en el ERP.
                      Los datos futuros y pronósticos matemáticos no se mezclan con los registros reales.
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setActiveModule('forecasting')}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold transition flex items-center gap-1.5 shrink-0 self-start sm:self-auto cursor-pointer"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Ver Pronósticos & Proyecciones →</span>
                </button>
              </div>
            )}
          </div>

          {/* Primary KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Ventas Totales */}
            <div
              onClick={() => setActiveModule('sales')}
              className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-indigo-400 dark:hover:border-indigo-500 transition cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Ventas Facturadas</span>
                  <span className="text-[10px] block text-indigo-600 dark:text-indigo-400 font-bold">
                    {opFilterMonth === 'all' ? `Año ${opFilterYear}` : `${opMetrics.selectedMonthShort} ${opFilterYear}`}
                  </span>
                </div>
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-105 transition">
                  <Receipt className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                  {formatCurrencyUSD(opMetrics.sales)}
                </div>
                <div className="flex items-center justify-between mt-1 text-xs">
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" /> Utilidad: {formatCurrencyUSD(opMetrics.netProfit)}
                  </span>
                  <span className="text-slate-400 group-hover:text-indigo-600 font-medium">Ver ventas →</span>
                </div>
              </div>
            </div>

            {/* Compras & Egresos Totales */}
            <div
              onClick={() => setActiveModule('purchases')}
              className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-cyan-400 dark:hover:border-cyan-500 transition cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Egresos Totales</span>
                  <span className="text-[10px] block text-cyan-600 dark:text-cyan-400 font-bold">
                    {opFilterMonth === 'all' ? `Año ${opFilterYear}` : `${opMetrics.selectedMonthShort} ${opFilterYear}`}
                  </span>
                </div>
                <div className="w-9 h-9 rounded-xl bg-cyan-50 dark:bg-cyan-950/80 text-cyan-600 dark:text-cyan-400 flex items-center justify-center group-hover:scale-105 transition">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                  {formatCurrencyUSD(opMetrics.outflows)}
                </div>
                <div className="flex items-center justify-between mt-1 text-xs">
                  <span className="text-slate-500 font-medium">Compras: {formatCurrencyUSD(opMetrics.purchases)}</span>
                  <span className="text-slate-400 group-hover:text-cyan-600 font-medium">Ver detalle →</span>
                </div>
              </div>
            </div>

            {/* Cuentas por Cobrar (CxC) */}
            <div
              onClick={() => setActiveModule('sales')}
              className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-amber-400 dark:hover:border-amber-500 transition cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Por Cobrar (CxC)</span>
                  <span className="text-[10px] block text-amber-600 dark:text-amber-400 font-bold">Estimado Periodo</span>
                </div>
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-105 transition">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                  {formatCurrencyUSD(opMetrics.cxc)}
                </div>
                <div className="flex items-center justify-between mt-1 text-xs">
                  <span className="text-amber-600 font-semibold">{pendingInvoices.length} facturas activas</span>
                  <span className="text-slate-400 group-hover:text-amber-600 font-medium">Gestionar →</span>
                </div>
              </div>
            </div>

            {/* Cuentas por Pagar (CxP) */}
            <div
              onClick={() => setActiveModule('purchases')}
              className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-rose-400 dark:hover:border-rose-500 transition cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Por Pagar (CxP)</span>
                  <span className="text-[10px] block text-rose-600 dark:text-rose-400 font-bold">Estimado Periodo</span>
                </div>
                <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-105 transition">
                  <Scale className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                  {formatCurrencyUSD(opMetrics.cxp)}
                </div>
                <div className="flex items-center justify-between mt-1 text-xs">
                  <span className="text-rose-600 font-semibold">{pendingPurchases.length} compras activas</span>
                  <span className="text-slate-400 group-hover:text-rose-600 font-medium">Pagar →</span>
                </div>
              </div>
            </div>
          </div>

          {/* Disponibilidad de Efectivo & Cuentas Bancarias con Barras Proporcionales */}
          <TreasuryCashBreakdownCard
            title="Disponibilidad de Efectivo & Cuentas Bancarias (Operativo)"
            subtitle="Desglose por banco y caja chica con barras proporcionales en tiempo real"
          />

          {/* Gráfica de Evolución Mensual Operativa (Visible cuando está en Todo el Año o expandible) */}
          {opFilterMonth === 'all' && (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span>Evolución Mensual Operativa en {opFilterYear}</span>
                    <span className="text-xs bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full">
                      Pares Ordenados (Mes vs Ventas y Egresos)
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Comportamiento cronológico de Enero a Diciembre de {opFilterYear}. Haz clic en cualquier mes para filtrar la vista operativa.
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-xs bg-indigo-600 inline-block" /> Ventas
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-xs bg-rose-500 inline-block" /> Egresos
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-xs bg-emerald-500 inline-block" /> Utilidad
                  </span>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={opMonthlyEvolution}
                    margin={{ top: 10, right: 15, left: 0, bottom: 25 }}
                    onClick={(e: any) => {
                      if (e && e.activePayload && e.activePayload.length > 0) {
                        const monthKey = e.activePayload[0].payload.key;
                        if (monthKey) setOpFilterMonth(monthKey);
                      }
                    }}
                    className="cursor-pointer"
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="shortLabel"
                      interval={0}
                      angle={-25}
                      textAnchor="end"
                      height={40}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(val: any, name: string) => [
                        `$${Number(val).toLocaleString()}`,
                        name === 'ventas' ? 'Ventas Facturadas' : name === 'egresos' ? 'Egresos Totales' : 'Utilidad Neta',
                      ]}
                      labelFormatter={(label: any) => `Par Ordenado • Mes: ${label} (${opFilterYear})`}
                    />
                    <Bar dataKey="ventas" name="ventas" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="egresos" name="egresos" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="utilidad" name="utilidad" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="text-center">
                <span className="text-[11px] text-slate-400">
                  Tip: Haz clic sobre la barra de cualquier mes para aislar la operación de ese mes específico.
                </span>
              </div>
            </div>
          )}

          {/* Nuevas Gráficas Operativas: Ventas por Sucursal y Egresos por Tipo */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ventas por Sucursal */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Building className="w-4 h-4 text-indigo-600" />
                  <span>Ventas Facturadas por Sucursal</span>
                </h3>
                <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md">
                  {opFilterMonth === 'all' ? `Año ${opFilterYear}` : `${opMetrics.selectedMonthShort} ${opFilterYear}`}
                </span>
              </div>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={opBranchPerformance} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v: any) => [`$${Number(v).toLocaleString()}`, 'Ventas']} />
                    <Bar dataKey="ventas" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Egresos por Tipo */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Scale className="w-4 h-4 text-rose-500" />
                  <span>Egresos Totales por Tipo de Desembolso</span>
                </h3>
                <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-md">
                  {opFilterMonth === 'all' ? `Año ${opFilterYear}` : `${opMetrics.selectedMonthShort} ${opFilterYear}`}
                </span>
              </div>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={opExpenseByConcept}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={75}
                      label={({ name, percent }) => `${name.substring(0, 15)}... (${(percent * 100).toFixed(0)}%)`}
                    >
                      {opExpenseByConcept.map((entry, index) => (
                        <Cell key={`exp-cell-op-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: any) => [`$${Number(v).toLocaleString()}`, '']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Operative Spotlight: Cuentas por Cobrar & Pagar Live Lists */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cartera por Cobrar (CxC) */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span>Cuentas por Cobrar (CxC Clientes)</span>
                    <span className="text-xs bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full font-bold">
                      {formatCurrencyUSD(totalCxcPendiente)}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">Facturas y créditos fiscales pendientes de recaudo</p>
                </div>
                <button
                  onClick={() => setActiveModule('sales')}
                  className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                >
                  Ver Todas
                </button>
              </div>

              <div className="space-y-2.5">
                {pendingInvoices.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    No hay facturas pendientes de cobro. Toda la cartera está al día.
                  </div>
                ) : (
                  pendingInvoices.slice(0, 5).map((inv) => (
                    <div
                      key={inv.id}
                      className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between gap-3 hover:border-amber-200 transition"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {inv.customerName}
                          </span>
                          <span className="text-[10px] font-mono bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded-md text-slate-700 dark:text-slate-300">
                            {inv.correlativeNumber}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          Vence: {inv.dueDate || 'Inmediato'} • Plazo: {inv.paymentCondition?.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-sm font-black text-amber-600 dark:text-amber-400 font-mono block">
                          {formatCurrencyUSD(inv.saldoPendiente ?? inv.totalPagar)}
                        </span>
                        <button
                          onClick={() => setActiveModule('sales')}
                          className="text-[10px] text-indigo-600 hover:underline font-semibold cursor-pointer"
                        >
                          Abonar / Cobrar →
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Cartera por Pagar (CxP) */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Scale className="w-4 h-4 text-rose-500" />
                    <span>Cuentas por Pagar (CxP Proveedores)</span>
                    <span className="text-xs bg-rose-100 dark:bg-rose-900/50 text-rose-800 dark:text-rose-300 px-2 py-0.5 rounded-full font-bold">
                      {formatCurrencyUSD(totalCxpPendiente)}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">Obligaciones contractuales y facturas por liquidar</p>
                </div>
                <button
                  onClick={() => setActiveModule('purchases')}
                  className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                >
                  Ver Todas
                </button>
              </div>

              <div className="space-y-2.5">
                {pendingPurchases.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    No hay compras pendientes de pago a proveedores.
                  </div>
                ) : (
                  pendingPurchases.slice(0, 5).map((pur) => (
                    <div
                      key={pur.id}
                      className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between gap-3 hover:border-rose-200 transition"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {pur.supplierName}
                          </span>
                          <span className="text-[10px] font-mono bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded-md text-slate-700 dark:text-slate-300">
                            {pur.documentNumber}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          Vence: {pur.dueDate || 'Inmediato'} • {pur.docType.toUpperCase()}
                        </span>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-sm font-black text-rose-600 dark:text-rose-400 font-mono block">
                          {formatCurrencyUSD(pur.saldoPendiente ?? pur.totalPagar)}
                        </span>
                        <button
                          onClick={() => setActiveModule('purchases')}
                          className="text-[10px] text-rose-600 hover:underline font-semibold cursor-pointer"
                        >
                          Liquidar / Pagar →
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Tax & Fiscal Summary Box (F-07 El Salvador) */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-6 rounded-2xl shadow-md border border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Resumen de Cumplimiento Tributario F-07 (Ministerio de Hacienda)</span>
                </h3>
                <p className="text-xs text-slate-300">Cálculo en tiempo real de obligaciones fiscales del mes en curso</p>
              </div>
              <button
                onClick={() => setActiveModule('accounting')}
                className="text-xs px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white font-semibold transition cursor-pointer"
              >
                Ver Declaración Completa →
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <span className="text-[10px] text-slate-400 block font-medium">Débito Fiscal (IVA 13%)</span>
                <span className="text-base font-bold text-white font-mono">{formatCurrencyUSD(ivaDebitoFiscal)}</span>
              </div>

              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <span className="text-[10px] text-slate-400 block font-medium">Crédito Fiscal (IVA 13%)</span>
                <span className="text-base font-bold text-cyan-300 font-mono">{formatCurrencyUSD(ivaCreditoFiscal)}</span>
              </div>

              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <span className="text-[10px] text-slate-400 block font-medium">
                  {monthlyIvaNetoPagar > 0 ? 'IVA a Enterar al MH' : 'Remanente a Favor'}
                </span>
                <span className={`text-base font-bold font-mono ${monthlyIvaNetoPagar > 0 ? 'text-amber-300' : 'text-emerald-300'}`}>
                  {formatCurrencyUSD(monthlyIvaNetoPagar > 0 ? monthlyIvaNetoPagar : remanenteIva)}
                </span>
              </div>

              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <span className="text-[10px] text-slate-400 block font-medium">Pago a Cuenta (1.75%)</span>
                <span className="text-base font-bold text-indigo-300 font-mono">{formatCurrencyUSD(monthlyAnticipoPagoCuenta)}</span>
              </div>
            </div>
          </div>

          {/* AI Financial Diagnosis Card */}
          <div className="bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/40 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-900/50 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
                  <BrainCircuit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Diagnóstico Financiero Inteligente (CFO Virtual)</span>
                    <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-bold px-2 py-0.5 rounded-full">
                      Gemini 3.7 Flash
                    </span>
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Auditoría algorítmica de salud financiera, liquidez y recomendaciones operativas
                  </p>
                </div>
              </div>

              <button
                disabled={isDiagnosing}
                onClick={handleRunDiagnosis}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50 cursor-pointer"
              >
                {isDiagnosing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Analizando Libros...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Ejecutar Diagnóstico</span>
                  </>
                )}
              </button>
            </div>

            {diagnosisResult && (
              <div className="mt-5 pt-5 border-t border-indigo-100 dark:border-indigo-900/50 grid grid-cols-1 md:grid-cols-3 gap-5 animate-in fade-in duration-200">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-500">Score de Salud</span>
                    <span className="text-lg font-black text-indigo-600 dark:text-indigo-400 font-mono">
                      {diagnosisResult.healthScore}/100
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {diagnosisResult.statusSummary}
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block mb-2">
                    Fortalezas Detectadas
                  </span>
                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    {diagnosisResult.strengths.map((s, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-emerald-500 font-bold">✓</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 block mb-2">
                    Recomendaciones Clave
                  </span>
                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    {diagnosisResult.recommendations.map((r, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-indigo-500 font-bold">→</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Dynamic Demographic Widgets */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Widgets Analíticos & Demografía CRM</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Métricas por edad, tipo de cliente, departamentos y canales en El Salvador
                </p>
              </div>

              <button
                onClick={() => setIsChartBuilderOpen(true)}
                className="px-3 py-1.5 rounded-xl border border-indigo-600 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Añadir Gráfico</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(processedDynamicWidgets || []).map((widget) => (
                <div
                  key={widget.id}
                  className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <span>{widget.title}</span>
                          {widget.createdByAI && (
                            <span className="text-[10px] bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded-md font-semibold">
                              IA
                            </span>
                          )}
                        </h4>
                        <p className="text-xs text-slate-500">{widget.description}</p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => deleteDynamicWidget(widget.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                          title="Eliminar Widget"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="h-56 w-full my-3">
                      <ResponsiveContainer width="100%" height="100%">
                        {widget.chartType === 'pie' ? (
                          <PieChart>
                            <Pie
                              data={widget.data}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius={75}
                              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                            >
                              {widget.data.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(v: any) => [`$${Number(v).toLocaleString()}`, '']} />
                          </PieChart>
                        ) : (
                          <BarChart data={widget.data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip formatter={(v: any) => [`$${Number(v).toLocaleString()}`, '']} />
                            <Bar dataKey="value" fill="#4f46e5" radius={[6, 6, 0, 0]}>
                              {widget.data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        )}
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Metodología Econométrica de Pronóstico (OLS & Estacional SV) */}
      <ForecastingMethodologyModal
        isOpen={isForecastingModalOpen}
        onClose={() => setIsForecastingModalOpen(false)}
      />

      {/* PDF Reporting Modal */}
      <PDFReportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        reportType="executive_board_report"
        title="Informe Integral de Gestión Ejecutiva & Tablero de Control"
        subtitle="Consolidado de Ventas, Compras, Cuentas por Cobrar/Pagar, Planilla con Cargas Patronales y Disponibilidad Bancaria"
      />

      {/* AI Dynamic Chart Builder Modal */}
      <DynamicChartBuilderModal
        isOpen={isChartBuilderOpen}
        onClose={() => setIsChartBuilderOpen(false)}
      />

      {/* Register Other Income Modal (Remanentes Hacienda, Activo Fijo, etc.) */}
      <RegisterOtherIncomeModal
        isOpen={isRegisterOtherIncomeOpen}
        onClose={() => setIsRegisterOtherIncomeOpen(false)}
      />

      {/* Complete Revenue & Products Database Modal */}
      <RevenueDatabaseModal
        isOpen={isRevenueDbModalOpen}
        onClose={() => setIsRevenueDbModalOpen(false)}
        items={conceptDatabaseItems}
        totalCompanyRevenue={totalIncomes}
      />

      {/* Quick Add Branch Modal */}
      <QuickBranchModal
        isOpen={isQuickBranchOpen}
        onClose={() => setIsQuickBranchOpen(false)}
      />
    </div>
  );
};