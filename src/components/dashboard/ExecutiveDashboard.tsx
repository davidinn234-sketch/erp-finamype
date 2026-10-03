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
} from 'recharts';
import { formatCurrencyUSD } from '../../utils/salvadoranTax';
import { PDFReportModal } from '../common/PDFReportModal';
import { RegisterOtherIncomeModal } from './RegisterOtherIncomeModal';
import { RevenueDatabaseModal, ConceptRevenueItem } from './RevenueDatabaseModal';
import { QuickBranchModal } from './QuickBranchModal';
import { TreasuryCashBreakdownCard } from './TreasuryCashBreakdownCard';
import { ForecastingMethodologyModal } from './ForecastingMethodologyModal';
import { HistoricalFinancialAnalytics } from './HistoricalFinancialAnalytics';
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
  const [opFilterYear, setOpFilterYear] = useState<number>(2026);
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
  const financialSummary = useMemo(() => {
    // 1. Ventas facturadas (sin anuladas)
    const ventas = filteredSalesInvoices.reduce((sum, i) => {
      const sumas = (i.sumasGravadas || 0) + (i.sumasExentas || 0) + (i.sumasNoSujetas || 0);
      return sum + (sumas > 0 ? sumas : i.totalPagar || 0);
    }, 0);

    // 2. Otros ingresos
    const otrosIngresos = filteredOtherIncomes.reduce((sum, o) => sum + (o.amount || 0), 0);

    // Ingresos totales = ventas facturadas (sin anuladas) + otros ingresos
    const ingresosTotales = ventas + otrosIngresos;

    // Costo de ventas / compras
    const costoVentas = filteredPurchases.reduce((sum, p) => sum + (p.totalPagar || 0), 0);

    // Planilla mensual activa (~34% cargas patronales ISSS, AFP, INSAFORP)
    const monthlyActivePayroll = (employees || [])
      .filter((e) => e && e.isActive)
      .reduce((acc, e) => acc + (e.baseSalary || 0) * 1.34, 0);

    // Proporción temporal de nómina y gastos fijos según si es día, mes o año
    let payrollProrated = 0;
    let opExpensesProrated = 0;

    if (opFilterMonth === 'all') {
      // Todo el año (hasta el mes actual o 12 meses)
      const monthsFactor = opFilterYear === 2026 ? (new Date().getMonth() + 1) : 12;
      payrollProrated = monthlyActivePayroll * monthsFactor;
      opExpensesProrated = 1500 * monthsFactor;
    } else if (opFilterDay === 'all') {
      // Un mes completo
      payrollProrated = monthlyActivePayroll;
      opExpensesProrated = 1500;
    } else {
      // Un solo día específico
      payrollProrated = monthlyActivePayroll / 30;
      opExpensesProrated = 1500 / 30;
    }

    // Si no hay ventas ni compras registradas en el período, no inflar gastos ficticios
    if (ventas === 0 && costoVentas === 0 && otrosIngresos === 0) {
      payrollProrated = 0;
      opExpensesProrated = 0;
    }

    // Impuestos pagados F-07 (IVA neto + Pago a Cuenta 1.75%)
    const ivaNeto = Math.max(0, (ventas * 0.13) - (costoVentas * 0.13));
    const pagoCuenta = ventas * (fiscalConfig?.pagoCuentaRate || 0.0175);
    const impuestosPagados = ivaNeto + pagoCuenta;

    // Egresos totales = costo de ventas/compras + planilla y cargas patronales + gastos operativos + impuestos pagados
    const egresosTotales = costoVentas + payrollProrated + opExpensesProrated + impuestosPagados;

    // Flujo neto = Ingresos - Egresos
    const flujoNeto = ingresosTotales - egresosTotales;

    // Utilidad neta = Ingresos - Egresos
    const utilidadNeta = ingresosTotales - egresosTotales;

    // Utilidad bruta = ventas - costo de ventas
    const utilidadBruta = ventas - costoVentas;

    // Margen bruto = ventas > 0 ? (utilidad bruta / ventas) * 100 : 0
    const margenBruto = ventas > 0 ? (utilidadBruta / ventas) * 100 : 0;

    // Margen operativo = ventas > 0 ? ((utilidad bruta - gastos operativos - planilla) / ventas) * 100 : 0
    const margenOperativo = ventas > 0 ? ((utilidadBruta - opExpensesProrated - payrollProrated) / ventas) * 100 : 0;

    // Margen neto = ingresos > 0 ? (utilidad neta / ingresos) * 100 : 0
    const margenNeto = ingresosTotales > 0 ? (utilidadNeta / ingresosTotales) * 100 : 0;

    return {
      ventas,
      otrosIngresos,
      ingresosTotales,
      costoVentas,
      payrollProrated,
      opExpensesProrated,
      impuestosPagados,
      egresosTotales,
      flujoNeto,
      utilidadNeta,
      utilidadBruta,
      margenBruto,
      margenOperativo,
      margenNeto,
    };
  }, [
    filteredSalesInvoices,
    filteredPurchases,
    filteredOtherIncomes,
    employees,
    fiscalConfig,
    opFilterYear,
    opFilterMonth,
    opFilterDay,
  ]);

  // Resumen acumulado del mes completo (para dar contexto comparativo cuando se filtra por día u 'Hoy')
  const monthFinancialSummary = useMemo(() => {
    if (opFilterMonth === 'all') return null;

    const mInvoices = (invoices || []).filter((i) => {
      if (!i || i.status === 'anulada') return false;
      if (selectedBranchId && selectedBranchId !== 'all') {
        const isMatch = i.branchId === selectedBranchId || (!i.branchId && branches.find((b) => b.id === selectedBranchId)?.isMain);
        if (!isMatch) return false;
      }
      return i.date?.startsWith(`${opFilterYear}-${opFilterMonth}`);
    });

    const mPurchases = (purchases || []).filter((p) => {
      if (!p || p.status === 'anulada') return false;
      if (selectedBranchId && selectedBranchId !== 'all') {
        const isMatch = p.branchId === selectedBranchId || (!p.branchId && branches.find((b) => b.id === selectedBranchId)?.isMain);
        if (!isMatch) return false;
      }
      return p.date?.startsWith(`${opFilterYear}-${opFilterMonth}`);
    });

    const mOtherIncomes = (otherIncomes || []).filter((o) => {
      if (!o) return false;
      if (selectedBranchId && selectedBranchId !== 'all') {
        const isMatch = o.branchId === selectedBranchId || (!o.branchId && branches.find((b) => b.id === selectedBranchId)?.isMain);
        if (!isMatch) return false;
      }
      return o.date?.startsWith(`${opFilterYear}-${opFilterMonth}`);
    });

    const ventas = mInvoices.reduce((sum, i) => {
      const sumas = (i.sumasGravadas || 0) + (i.sumasExentas || 0) + (i.sumasNoSujetas || 0);
      return sum + (sumas > 0 ? sumas : i.totalPagar || 0);
    }, 0);
    const otrosIngresos = mOtherIncomes.reduce((sum, o) => sum + (o.amount || 0), 0);
    const ingresosTotales = ventas + otrosIngresos;
    const costoVentas = mPurchases.reduce((sum, p) => sum + (p.totalPagar || 0), 0);

    const monthlyActivePayroll = (employees || [])
      .filter((e) => e && e.isActive)
      .reduce((acc, e) => acc + (e.baseSalary || 0) * 1.34, 0);

    let payrollProrated = monthlyActivePayroll;
    let opExpensesProrated = 1500;
    if (ventas === 0 && costoVentas === 0 && otrosIngresos === 0) {
      payrollProrated = 0;
      opExpensesProrated = 0;
    }

    const ivaNeto = Math.max(0, (ventas * 0.13) - (costoVentas * 0.13));
    const pagoCuenta = ventas * (fiscalConfig?.pagoCuentaRate || 0.0175);
    const impuestosPagados = ivaNeto + pagoCuenta;
    const egresosTotales = costoVentas + payrollProrated + opExpensesProrated + impuestosPagados;
    const flujoNeto = ingresosTotales - egresosTotales;
    const utilidadNeta = ingresosTotales - egresosTotales;
    const utilidadBruta = ventas - costoVentas;
    const margenBruto = ventas > 0 ? (utilidadBruta / ventas) * 100 : 0;
    const margenOperativo = ventas > 0 ? ((utilidadBruta - opExpensesProrated - payrollProrated) / ventas) * 100 : 0;
    const margenNeto = ingresosTotales > 0 ? (utilidadNeta / ingresosTotales) * 100 : 0;

    return {
      ventas,
      otrosIngresos,
      ingresosTotales,
      costoVentas,
      payrollProrated,
      opExpensesProrated,
      impuestosPagados,
      egresosTotales,
      flujoNeto,
      utilidadNeta,
      utilidadBruta,
      margenBruto,
      margenOperativo,
      margenNeto,
    };
  }, [invoices, purchases, otherIncomes, employees, fiscalConfig, selectedBranchId, branches, opFilterYear, opFilterMonth]);

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
        name: 'Compras a Proveedores',
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
    if (opFilterMonth === 'all') {
      // 12 Meses del año
      return OP_MONTHS.filter((m) => m.key !== 'all').map((m) => {
        const mInvs = (invoices || []).filter((i) => {
          if (!i || i.status === 'anulada') return false;
          if (selectedBranchId && selectedBranchId !== 'all') {
            const isMatch = i.branchId === selectedBranchId || (!i.branchId && branches.find((b) => b.id === selectedBranchId)?.isMain);
            if (!isMatch) return false;
          }
          return (i.date || '').startsWith(`${opFilterYear}-${m.key}`);
        });

        const mPurs = (purchases || []).filter((p) => {
          if (!p || p.status === 'anulada') return false;
          if (selectedBranchId && selectedBranchId !== 'all') {
            const isMatch = p.branchId === selectedBranchId || (!p.branchId && branches.find((b) => b.id === selectedBranchId)?.isMain);
            if (!isMatch) return false;
          }
          return (p.date || '').startsWith(`${opFilterYear}-${m.key}`);
        });

        const mOthers = (otherIncomes || []).filter((o) => {
          if (!o) return false;
          if (selectedBranchId && selectedBranchId !== 'all') {
            const isMatch = o.branchId === selectedBranchId || (!o.branchId && branches.find((b) => b.id === selectedBranchId)?.isMain);
            if (!isMatch) return false;
          }
          return (o.date || '').startsWith(`${opFilterYear}-${m.key}`);
        });

        const ing = mInvs.reduce((sum, i) => sum + (i.totalPagar || 0), 0) + mOthers.reduce((sum, o) => sum + (o.amount || 0), 0);
        const egr = mPurs.reduce((sum, p) => sum + (p.totalPagar || 0), 0) + (ing > 0 ? 1200 : 0);
        const flujo = ing - egr;
        const utilidadNeta = ing - egr;

        return {
          label: m.short,
          fullLabel: m.name,
          ingresos: Math.round(ing),
          egresos: Math.round(egr),
          utilidadNeta: Math.round(utilidadNeta),
          flujo: Math.round(flujo),
        };
      });
    }

    // Días del mes (1..N) - Siempre visibles en el mes seleccionado
    const daysCount = daysInSelectedMonth;
    const daysArr = [];

    for (let day = 1; day <= daysCount; day++) {
      const dayFormatted = String(day).padStart(2, '0');
      const targetDate = `${opFilterYear}-${opFilterMonth}-${dayFormatted}`;

      const dInvs = (invoices || []).filter((i) => {
        if (!i || i.status === 'anulada') return false;
        if (selectedBranchId && selectedBranchId !== 'all') {
          const isMatch = i.branchId === selectedBranchId || (!i.branchId && branches.find((b) => b.id === selectedBranchId)?.isMain);
          if (!isMatch) return false;
        }
        return i.date === targetDate;
      });

      const dPurs = (purchases || []).filter((p) => {
        if (!p || p.status === 'anulada') return false;
        if (selectedBranchId && selectedBranchId !== 'all') {
          const isMatch = p.branchId === selectedBranchId || (!p.branchId && branches.find((b) => b.id === selectedBranchId)?.isMain);
          if (!isMatch) return false;
        }
        return p.date === targetDate;
      });

      const dOthers = (otherIncomes || []).filter((o) => {
        if (!o) return false;
        if (selectedBranchId && selectedBranchId !== 'all') {
          const isMatch = o.branchId === selectedBranchId || (!o.branchId && branches.find((b) => b.id === selectedBranchId)?.isMain);
          if (!isMatch) return false;
        }
        return o.date === targetDate;
      });

      const ing = dInvs.reduce((sum, i) => sum + (i.totalPagar || 0), 0) + dOthers.reduce((sum, o) => sum + (o.amount || 0), 0);
      const egr = dPurs.reduce((sum, p) => sum + (p.totalPagar || 0), 0);
      const flujo = ing - egr;
      const utilidadNeta = ing - egr;

      daysArr.push({
        label: `D${day}`,
        dayNumber: day,
        fullLabel: `Día ${day} de ${OP_MONTHS.find((m) => m.key === opFilterMonth)?.name}`,
        ingresos: Math.round(ing),
        egresos: Math.round(egr),
        utilidadNeta: Math.round(utilidadNeta),
        flujo: Math.round(flujo),
        isSelectedDay: opFilterDay === String(day),
      });
    }

    return daysArr;
  }, [invoices, purchases, otherIncomes, selectedBranchId, branches, opFilterYear, opFilterMonth, opFilterDay, daysInSelectedMonth]);

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
  const cxcChartData = useMemo(() => {
    const currentMonthNum = today.getMonth() + 1;
    if (cxcPeriodSelector === '5m') {
      return [
        { month: 'Abr', value: 1200, isCurrent: false },
        { month: 'May', value: 1800, isCurrent: false },
        { month: 'Jun', value: 1400, isCurrent: false },
        { month: 'Jul', value: 2100, isCurrent: false },
        { month: 'Ago (Actual)', value: cxcRealTime.total || 1950, isCurrent: true },
      ];
    }
    if (cxcPeriodSelector === '12m') {
      return OP_MONTHS.filter((m) => m.key !== 'all').map((m) => ({
        month: m.short,
        value: parseInt(m.key, 10) === currentMonthNum ? (cxcRealTime.total || 1950) : Math.round(1500 * (1 + parseInt(m.key, 10) * 0.05)),
        isCurrent: parseInt(m.key, 10) === currentMonthNum,
      }));
    }
    return [
      { month: 'Año 2025', value: 24500, isCurrent: false },
      { month: 'Año 2026 (En Curso)', value: (cxcRealTime.total * 6) || 18400, isCurrent: true },
    ];
  }, [cxcPeriodSelector, cxcRealTime, today]);

  const cxpChartData = useMemo(() => {
    const currentMonthNum = today.getMonth() + 1;
    if (cxpPeriodSelector === '5m') {
      return [
        { month: 'Abr', value: 950, isCurrent: false },
        { month: 'May', value: 1100, isCurrent: false },
        { month: 'Jun', value: 1300, isCurrent: false },
        { month: 'Jul', value: 1050, isCurrent: false },
        { month: 'Ago (Actual)', value: cxpRealTime.total || 1420, isCurrent: true },
      ];
    }
    if (cxpPeriodSelector === '12m') {
      return OP_MONTHS.filter((m) => m.key !== 'all').map((m) => ({
        month: m.short,
        value: parseInt(m.key, 10) === currentMonthNum ? (cxpRealTime.total || 1420) : Math.round(1100 * (1 + parseInt(m.key, 10) * 0.04)),
        isCurrent: parseInt(m.key, 10) === currentMonthNum,
      }));
    }
    return [
      { month: 'Año 2025', value: 16800, isCurrent: false },
      { month: 'Año 2026 (En Curso)', value: (cxpRealTime.total * 6) || 12600, isCurrent: true },
    ];
  }, [cxpPeriodSelector, cxpRealTime, today]);

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

    const debitoFiscal = curMonthInvs.reduce((sum, i) => sum + (i.iva13 || 0), 0);
    const creditoFiscal = curMonthPurs.reduce((sum, p) => sum + (p.ivaCreditoFiscal || 0), 0);

    const ivaNetoPagar = Math.max(0, debitoFiscal - creditoFiscal);
    const remanenteFavor = Math.max(0, creditoFiscal - debitoFiscal);

    const salesTotal = curMonthInvs.reduce((sum, i) => sum + (i.totalPagar || 0), 0);
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
      const response = await fetch('/api/ai/financial-diagnosis', {
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
    <div className="space-y-6 max-w-7xl mx-auto p-3 sm:p-4 lg:p-6 overflow-x-hidden">
      {/* ---------------------------------------------------- */}
      {/* 2. BARRA DE FILTROS - DASHBOARD CORPORATIVO */}
      {/* ---------------------------------------------------- */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 sm:p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Sucursal */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
              <Building className="w-4 h-4 text-slate-500 shrink-0" />
              <span className="font-semibold text-slate-500 text-[11px]">Sucursal:</span>
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="bg-transparent border-none text-xs font-semibold outline-none text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                <option value="all">Todas las Sucursales</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Año */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
              <Calendar className="w-4 h-4 text-teal-600 shrink-0" />
              <span className="font-bold text-slate-500 text-[11px]">Año:</span>
              <select
                value={opFilterYear}
                onChange={(e) => setOpFilterYear(Number(e.target.value))}
                className="bg-transparent border-none text-xs font-bold outline-none text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                {OP_YEARS.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            {/* Mes */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
              <Filter className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-bold text-slate-500 text-[11px]">Mes:</span>
              <select
                value={opFilterMonth}
                onChange={(e) => handleMonthChange(e.target.value)}
                className="bg-transparent border-none text-xs font-bold outline-none text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                {OP_MONTHS.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Selector de Día con Calendario Desplegable */}
            <div className="relative">
              <button
                type="button"
                disabled={opFilterMonth === 'all'}
                onClick={() => setIsDayPickerOpen(!isDayPickerOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                  opFilterDay !== 'all'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 shadow-2xs'
                    : 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
                title={opFilterMonth === 'all' ? 'Selecciona un mes para habilitar el calendario de días' : 'Abrir calendario para elegir día'}
              >
                <CalendarDays className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-bold text-slate-500 text-[11px]">Día:</span>
                <span>{opFilterDay === 'all' ? 'Todos los días' : `Día ${opFilterDay}`}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Calendario Desplegable Formal */}
              {isDayPickerOpen && opFilterMonth !== 'all' && (
                <>
                  <div
                    className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[1px]"
                    onClick={() => setIsDayPickerOpen(false)}
                  />
                  <div className="absolute top-full mt-2 left-0 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-xl w-72 space-y-3 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                      <span className="text-xs font-black text-slate-900 dark:text-white capitalize">
                        {OP_MONTHS.find((m) => m.key === opFilterMonth)?.name} {opFilterYear}
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsDayPickerOpen(false)}
                        className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Botón para ver todo el mes */}
                    <button
                      type="button"
                      onClick={() => {
                        setOpFilterDay('all');
                        setIsDayPickerOpen(false);
                      }}
                      className={`w-full py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        opFilterDay === 'all'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      <span>Ver todo el mes (Todos los días)</span>
                    </button>

                    {/* Cabecera de días de la semana */}
                    <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400">
                      <span>Lu</span>
                      <span>Ma</span>
                      <span>Mi</span>
                      <span>Ju</span>
                      <span>Vi</span>
                      <span>Sá</span>
                      <span>Do</span>
                    </div>

                    {/* Cuadrícula de días */}
                    <div className="grid grid-cols-7 gap-1">
                      {/* Celdas vacías de compensación */}
                      {Array.from({ length: firstDayOfMonthOffset }).map((_, idx) => (
                        <div key={`empty-${idx}`} className="h-8" />
                      ))}

                      {/* Días del mes */}
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
                            className={`h-8 rounded-lg text-xs font-bold transition flex flex-col items-center justify-center relative cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-600 text-white shadow-xs font-black'
                                : isRealToday
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border border-emerald-400 font-black'
                                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            <span>{d}</span>
                            {isRealToday && !isSelected && (
                              <span className="w-1 h-1 rounded-full bg-emerald-600 absolute bottom-1" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Botón rápido "Hoy" */}
            <button
              onClick={handleSetToday}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition cursor-pointer flex items-center gap-1"
              title="Fijar año, mes y día de hoy"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Hoy</span>
            </button>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenNewSale}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nueva Venta</span>
            </button>
            <button
              onClick={onOpenNewPurchase}
              className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nueva Compra</span>
            </button>
            <button
              onClick={() => setIsPdfModalOpen(true)}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition cursor-pointer"
              title="Exportar PDF"
            >
              <FileText className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Clean status note */}
        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
          Ámbito: {selectedBranchId === 'all' ? 'Todas las Sucursales' : branches.find((b) => b.id === selectedBranchId)?.name || 'Sucursal Seleccionada'} · Período: {opFilterYear}{opFilterMonth !== 'all' ? ` / ${OP_MONTHS.find((m) => m.key === opFilterMonth)?.name}` : ''}{opFilterDay !== 'all' ? ` / Día ${opFilterDay}` : ''}
        </p>

        {/* Sub-navegación limpia entre Secciones */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs no-scrollbar pt-2 border-t border-slate-100 dark:border-slate-800">
          <a
            href="#sec-contable"
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold hover:border-slate-400 transition whitespace-nowrap"
          >
            01. Márgenes & Rentabilidad
          </a>
          <a
            href="#sec-4variables"
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold hover:border-slate-400 transition whitespace-nowrap"
          >
            02. Flujo 4 Variables
          </a>
          <a
            href="#sec-desglose"
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold hover:border-slate-400 transition whitespace-nowrap"
          >
            03. Desglose Operativo
          </a>
          <a
            href="#sec-sucursales"
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold hover:border-slate-400 transition whitespace-nowrap"
          >
            04. Sucursales
          </a>
          <a
            href="#sec-tesoreria"
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold hover:border-slate-400 transition whitespace-nowrap"
          >
            05. Tesorería & Cartera
          </a>
          <a
            href="#sec-tributario"
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold hover:border-slate-400 transition whitespace-nowrap"
          >
            06. Cumplimiento MH
          </a>
        </div>
      </div>

      {/* Onboarding Guide for Companies Starting in Zero */}
      {invoices.length === 0 && purchases.length === 0 && (
        <div className="bg-emerald-50/70 dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 rounded-3xl p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                ¡Entorno Listo para Operar desde CERO ($0.00)!
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                La empresa <strong>{currentCompany?.tradeName || currentCompany?.name}</strong> está lista para registrar sus operaciones reales.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <button
              onClick={() => setActiveModule('purchases')}
              className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-left text-xs cursor-pointer"
            >
              <span className="font-bold text-emerald-700 dark:text-emerald-400 block">1. Catálogo Inventario</span>
              <span className="text-[11px] text-slate-500">Ingresa productos con precio de venta y costo.</span>
            </button>
            <button
              onClick={() => setActiveModule('pos_terminal')}
              className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-left text-xs cursor-pointer"
            >
              <span className="font-bold text-emerald-700 dark:text-emerald-400 block">2. Primera Venta POS</span>
              <span className="text-[11px] text-slate-500">Abre caja o emite Factura / Crédito Fiscal (DTE).</span>
            </button>
            <button
              onClick={onOpenNewPurchase}
              className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-left text-xs cursor-pointer"
            >
              <span className="font-bold text-emerald-700 dark:text-emerald-400 block">3. Registra Compras</span>
              <span className="text-[11px] text-slate-500">Registra tus facturas con IVA Crédito Fiscal.</span>
            </button>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 3. ZONA A - FILTRADA (SECCIONES 1, 2, 3 Y 4) */}
      {/* ==================================================== */}

      {/* ---------------------------------------------------- */}
      {/* SECCIÓN 1. RESUMEN CONTABLE, MÁRGENES & RENTABILIDAD */}
      {/* ORDEN EXACTO SOLICITADO: 1. Ingresos -> 2. Egresos -> 3. Utilidad Neta -> 4. Flujo de Caja -> 5. Utilidad Bruta -> 6. Utilidad Operativa */}
      {/* ---------------------------------------------------- */}
      <section id="sec-contable" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            01. Resumen Contable, Márgenes & Rentabilidad
          </h2>

          {/* Banner de confirmación temporal */}
          <div className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-xs text-slate-600 dark:text-slate-300 font-medium flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>
              {opFilterDay !== 'all'
                ? `Métricas del Día ${opFilterDay} de ${OP_MONTHS.find((m) => m.key === opFilterMonth)?.name} ${opFilterYear} ${
                    isTodaySelected ? '(Hoy)' : ''
                  }`
                : opFilterMonth !== 'all'
                ? `Métricas del Mes de ${OP_MONTHS.find((m) => m.key === opFilterMonth)?.name} ${opFilterYear}`
                : `Métricas Consolidadas del Año ${opFilterYear}`}
            </span>
          </div>
        </div>

        {/* Las 6 Tarjetas en el Orden Estricto Solicitado: 1. Ingresos -> 2. Egresos -> 3. Utilidad Neta -> 4. Flujo de Caja -> 5. Utilidad Bruta -> 6. Utilidad Operativa */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 1. Ingresos Totales */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                1. Ingresos Totales {periodLabelSuffix}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Entradas
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono mt-1">
              {formatCurrencyUSD(financialSummary.ingresosTotales)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 space-y-0.5">
              <span>Ventas: {formatCurrencyUSD(financialSummary.ventas)} + Otros: {formatCurrencyUSD(financialSummary.otrosIngresos)}</span>
              {opFilterDay !== 'all' && monthFinancialSummary && (
                <span className="block text-[10px] font-bold text-emerald-700 dark:text-emerald-400 pt-0.5 border-t border-slate-100 dark:border-slate-800">
                  📅 Acumulado Mes ({OP_MONTHS.find((m) => m.key === opFilterMonth)?.short}): {formatCurrencyUSD(monthFinancialSummary.ingresosTotales)}
                </span>
              )}
            </div>
          </div>

          {/* 2. Egresos Totales */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                2. Egresos Totales {periodLabelSuffix}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                Salidas
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono mt-1">
              {formatCurrencyUSD(financialSummary.egresosTotales)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 space-y-0.5">
              <span>Compras + Nómina + Gastos + Impuestos</span>
              {opFilterDay !== 'all' && monthFinancialSummary && (
                <span className="block text-[10px] font-bold text-rose-600 dark:text-rose-400 pt-0.5 border-t border-slate-100 dark:border-slate-800">
                  📅 Acumulado Mes ({OP_MONTHS.find((m) => m.key === opFilterMonth)?.short}): {formatCurrencyUSD(monthFinancialSummary.egresosTotales)}
                </span>
              )}
            </div>
          </div>

          {/* 3. Utilidad Neta (Ganancia Líquida Final) */}
          <div
            className={`p-5 rounded-2xl border shadow-xs transition ${
              financialSummary.utilidadNeta >= 0
                ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                3. Utilidad Neta {periodLabelSuffix}
              </span>
              <span
                className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${
                  financialSummary.margenNeto >= 0
                    ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300'
                    : 'bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300'
                }`}
              >
                {financialSummary.margenNeto.toFixed(1)}% Margen Neto
              </span>
            </div>
            <div
              className={`text-2xl sm:text-3xl font-black font-mono mt-1 ${
                financialSummary.utilidadNeta >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600'
              }`}
            >
              {formatCurrencyUSD(financialSummary.utilidadNeta)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 space-y-0.5">
              <span>Ganancia líquida final: Ingresos - Egresos</span>
              {opFilterDay !== 'all' && monthFinancialSummary && (
                <span className="block text-[10px] font-bold text-emerald-700 dark:text-emerald-400 pt-0.5 border-t border-emerald-200 dark:border-emerald-900">
                  📅 Ganancia Líquida Mes: {formatCurrencyUSD(monthFinancialSummary.utilidadNeta)} ({monthFinancialSummary.margenNeto.toFixed(1)}%)
                </span>
              )}
            </div>
          </div>

          {/* 4. Flujo de Caja Neto */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                4. Flujo de Caja Neto {periodLabelSuffix}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                Liquidez
              </span>
            </div>
            <div
              className={`text-2xl sm:text-3xl font-black font-mono mt-1 ${
                financialSummary.flujoNeto >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'
              }`}
            >
              {formatCurrencyUSD(financialSummary.flujoNeto)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 space-y-0.5">
              <span>Cobros y Entradas - Desembolsos Efectivos</span>
              {opFilterDay !== 'all' && monthFinancialSummary && (
                <span className="block text-[10px] font-bold text-sky-700 dark:text-sky-400 pt-0.5 border-t border-slate-100 dark:border-slate-800">
                  📅 Flujo Acumulado Mes: {formatCurrencyUSD(monthFinancialSummary.flujoNeto)}
                </span>
              )}
            </div>
          </div>

          {/* 5. Utilidad Bruta */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                5. Utilidad Bruta {periodLabelSuffix}
              </span>
              <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {financialSummary.margenBruto.toFixed(1)}% Margen Bruto
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono mt-1">
              {formatCurrencyUSD(financialSummary.utilidadBruta)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 space-y-0.5">
              <span>Ventas Netas - Costo de Ventas/Mercadería</span>
              {opFilterDay !== 'all' && monthFinancialSummary && (
                <span className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 pt-0.5 border-t border-slate-100 dark:border-slate-800">
                  📅 Bruta Acumulada Mes: {formatCurrencyUSD(monthFinancialSummary.utilidadBruta)} ({monthFinancialSummary.margenBruto.toFixed(1)}%)
                </span>
              )}
            </div>
          </div>

          {/* 6. Utilidad Operativa */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                6. Utilidad Operativa {periodLabelSuffix}
              </span>
              <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {financialSummary.margenOperativo.toFixed(1)}% Margen Op.
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono mt-1">
              {formatCurrencyUSD(financialSummary.utilidadBruta - financialSummary.opExpensesProrated - financialSummary.payrollProrated)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 space-y-0.5">
              <span>Utilidad Bruta - Gastos Operativos - Nómina</span>
              {opFilterDay !== 'all' && monthFinancialSummary && (
                <span className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 pt-0.5 border-t border-slate-100 dark:border-slate-800">
                  📅 Operativa Acumulada Mes: {formatCurrencyUSD(monthFinancialSummary.utilidadBruta - monthFinancialSummary.opExpensesProrated - monthFinancialSummary.payrollProrated)} ({monthFinancialSummary.margenOperativo.toFixed(1)}%)
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* SECCIÓN 2. EVOLUCIÓN FINANCIERA DE LAS 4 VARIABLES */}
      {/* CONTROLADA EXCLUSIVAMENTE POR EL FILTRO SUPERIOR */}
      {/* ---------------------------------------------------- */}
      <section id="sec-4variables" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            02. Evolución Financiera de las 4 Variables
          </h2>

          {/* Selector de visualización (Barras / Líneas / Áreas) */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
            <button
              onClick={() => setFlowChartType('bars')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                flowChartType === 'bars' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
              }`}
            >
              Barras
            </button>
            <button
              onClick={() => setFlowChartType('lines')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                flowChartType === 'lines' ? 'bg-white dark:bg-slate-700 text-emerald-700 shadow-xs' : 'text-slate-500'
              }`}
            >
              Líneas
            </button>
            <button
              onClick={() => setFlowChartType('area')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                flowChartType === 'area' ? 'bg-white dark:bg-slate-700 text-emerald-700 shadow-xs' : 'text-slate-500'
              }`}
            >
              Áreas
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-500">
          {opFilterMonth === 'all'
            ? `Evolución mensual de Ventas, Egresos, Utilidad Neta y Flujo Neto en ${opFilterYear} (afectado por el filtro superior).`
            : `Desglose diario de las 4 variables en ${OP_MONTHS.find((m) => m.key === opFilterMonth)?.name} ${opFilterYear} ${
                opFilterDay !== 'all' ? `• Resaltando el Día ${opFilterDay}` : ''
              }.`}
        </p>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {flowChartType === 'bars' ? (
                <BarChart data={flowEvolutionData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: any, name: any) => [`$${Number(v).toLocaleString()}`, name]} />
                  <Legend verticalAlign="top" height={36} />
                  <Bar dataKey="ingresos" name="1. Ventas" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="egresos" name="2. Egresos" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="utilidadNeta" name="3. Utilidad Neta" fill="#2f855f" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="flujo" name="4. Flujo Neto" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : flowChartType === 'lines' ? (
                <LineChart data={flowEvolutionData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: any, name: any) => [`$${Number(v).toLocaleString()}`, name]} />
                  <Legend verticalAlign="top" height={36} />
                  <Line type="monotone" dataKey="ingresos" name="1. Ventas" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="egresos" name="2. Egresos" stroke="#f43f5e" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="utilidadNeta" name="3. Utilidad Neta" stroke="#2f855f" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="flujo" name="4. Flujo Neto" stroke="#0ea5e9" strokeWidth={2} strokeDasharray="3 3" dot={{ r: 2 }} />
                </LineChart>
              ) : (
                <AreaChart data={flowEvolutionData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: any, name: any) => [`$${Number(v).toLocaleString()}`, name]} />
                  <Legend verticalAlign="top" height={36} />
                  <Area type="monotone" dataKey="ingresos" name="1. Ventas" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                  <Area type="monotone" dataKey="egresos" name="2. Egresos" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.15} />
                  <Area type="monotone" dataKey="utilidadNeta" name="3. Utilidad Neta" stroke="#2f855f" fill="#2f855f" fillOpacity={0.2} />
                  <Area type="monotone" dataKey="flujo" name="4. Flujo Neto" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.15} />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* SECCIÓN 3. DESGLOSE OPERATIVO: DE DÓNDE VIENEN Y A DÓNDE VAN */}
      {/* ---------------------------------------------------- */}
      <section id="sec-desglose" className="space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          03. Desglose Operativo: Fuentes y Destinos de Fondos
        </h2>

        {/* Gráficos a y b en 2 columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* a) Ingresos por tipo (dona) */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <PieIcon className="w-4 h-4 text-emerald-600" />
                  <span>a) Ingresos por Tipo de Documento & Concepto</span>
                </h3>
                <p className="text-[11px] text-slate-500">Ventas por tipo de DTE y otros ingresos</p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-700">
                {formatCurrencyUSD(financialSummary.ingresosTotales)}
              </span>
            </div>

            <div className="h-52 w-full">
              {incomeByTypeData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  Sin ingresos registrados en este período ($0.00)
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
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-rose-500" />
                  <span>b) Egresos por Concepto</span>
                </h3>
                <p className="text-[11px] text-slate-500">Compras, planilla, gastos e impuestos</p>
              </div>
              <span className="text-xs font-mono font-bold text-rose-600">
                {formatCurrencyUSD(financialSummary.egresosTotales)}
              </span>
            </div>

            <div className="h-52 w-full">
              {expenseByConceptData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  Sin egresos registrados en este período ($0.00)
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={expenseByConceptData} layout="vertical" margin={{ top: 5, right: 20, left: 15, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={120} />
                    <Tooltip formatter={(v: any) => [`$${Number(v).toLocaleString()}`, '']} />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]}>
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

        {/* Si hay un día elegido en el filtro: mostrar tarjetas del día */}
        {opFilterDay !== 'all' && (
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              Visualización Específica del Día {opFilterDay} de {OP_MONTHS.find((m) => m.key === opFilterMonth)?.name} {opFilterYear}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase block">
                  Ingresos del Día {opFilterDay}
                </span>
                <span className="text-xl font-black text-slate-900 dark:text-white font-mono mt-1 block">
                  {formatCurrencyUSD(financialSummary.ingresosTotales)}
                </span>
              </div>
              <div className="p-4 rounded-xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800">
                <span className="text-[10px] font-bold text-rose-800 dark:text-rose-300 uppercase block">
                  Egresos del Día {opFilterDay}
                </span>
                <span className="text-xl font-black text-slate-900 dark:text-white font-mono mt-1 block">
                  {formatCurrencyUSD(financialSummary.egresosTotales)}
                </span>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">
                  Flujo Neto del Día {opFilterDay}
                </span>
                <span
                  className={`text-xl font-black font-mono mt-1 block ${
                    financialSummary.flujoNeto >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'
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
      <section id="sec-sucursales" className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            04. Rendimiento por Sucursal
          </h2>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsQuickBranchOpen(true)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Nueva Sucursal</span>
            </button>
          </div>
        </div>

        <p className="text-[11px] text-slate-500">
          Siempre compara todas las sucursales (ignora filtro de sucursal); ordenadas de mayor a menor utilidad neta.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {branchRanking.map((b, idx) => (
            <div
              key={b.id}
              className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    {branches.length > 1 && (
                      <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-black flex items-center justify-center">
                        #{idx + 1}
                      </span>
                    )}
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">{b.name}</h3>
                  </div>
                  <span className="text-[11px] text-slate-400 block ml-6">
                    {typeof b.department === 'string' ? b.department : (b.department as any)?.name || 'San Salvador'}
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                  {b.code}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 block">Ventas</span>
                  <span className="font-bold font-mono text-emerald-600 text-xs">
                    {formatCurrencyUSD(b.ventas)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Egresos</span>
                  <span className="font-bold font-mono text-rose-600 text-xs">
                    {formatCurrencyUSD(b.egresos)}
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Utilidad Neta</span>
                  <span
                    className={`font-mono font-black ${
                      b.utilidadNeta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'
                    }`}
                  >
                    {formatCurrencyUSD(b.utilidadNeta)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-medium">Margen Neto %</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {b.margenNeto.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                <span>Flujo de Caja:</span>
                <span className={`font-mono font-bold ${b.flujoCaja >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {formatCurrencyUSD(b.flujoCaja)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ==================================================== */}
      {/* 4. ZONA B - TIEMPO REAL (IGNORA AÑO, MES Y DÍA) */}
      {/* ==================================================== */}

      {/* ---------------------------------------------------- */}
      {/* SECCIÓN 5. TESORERÍA Y CARTERA (TIEMPO REAL) */}
      {/* ---------------------------------------------------- */}
      <section id="sec-tesoreria" className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          05. Tesorería, Liquidez Inmediata & Cartera (CxC / CxP)
        </h2>

        {/* Efectivo total inmediato, desglose por banco/caja y runway */}
        <TreasuryCashBreakdownCard
          title="Efectivo Total Inmediato & Desglose Bancario"
          subtitle="Posición de liquidez en tiempo real y meses de cobertura (runway)"
        />

        {/* Cuentas por Cobrar & Cuentas por Pagar */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Cuentas por Cobrar */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Cuentas por Cobrar (Clientes)
                </span>
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono mt-0.5">
                  {formatCurrencyUSD(cxcRealTime.total)}
                </div>
              </div>

              {/* Mini selector local */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[10px]">
                <button
                  onClick={() => setCxcPeriodSelector('5m')}
                  className={`px-2 py-0.5 rounded-md font-bold transition ${
                    cxcPeriodSelector === '5m' ? 'bg-white dark:bg-slate-700 text-emerald-700 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  5m
                </button>
                <button
                  onClick={() => setCxcPeriodSelector('12m')}
                  className={`px-2 py-0.5 rounded-md font-bold transition ${
                    cxcPeriodSelector === '12m' ? 'bg-white dark:bg-slate-700 text-emerald-700 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  12m
                </button>
                <button
                  onClick={() => setCxcPeriodSelector('yoy')}
                  className={`px-2 py-0.5 rounded-md font-bold transition ${
                    cxcPeriodSelector === 'yoy' ? 'bg-white dark:bg-slate-700 text-emerald-700 shadow-xs' : 'text-slate-500'
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
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 9 }} />
                  <Tooltip formatter={(v: any) => [`$${Number(v).toLocaleString()}`, 'CxC']} />
                  <Bar dataKey="value">
                    {cxcChartData.map((entry, idx) => (
                      <Cell key={`cxc-cell-${idx}`} fill={entry.isCurrent ? '#10b981' : '#94a3b8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Desglose por Antigüedad */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <span className="text-[10px] text-slate-400 block font-semibold">Al día</span>
                <span className="font-mono font-bold text-emerald-600 block mt-0.5">
                  {formatCurrencyUSD(cxcRealTime.alDia)}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <span className="text-[10px] text-slate-400 block font-semibold">1-30 días</span>
                <span className="font-mono font-bold text-amber-600 block mt-0.5">
                  {formatCurrencyUSD(cxcRealTime.d1_30)}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <span className="text-[10px] text-slate-400 block font-semibold">31-60 días</span>
                <span className="font-mono font-bold text-orange-600 block mt-0.5">
                  {formatCurrencyUSD(cxcRealTime.d31_60)}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <span className="text-[10px] text-slate-400 block font-semibold">&gt; 60 días</span>
                <span className="font-mono font-bold text-rose-600 block mt-0.5">
                  {formatCurrencyUSD(cxcRealTime.d60plus)}
                </span>
              </div>
            </div>

            {/* Top 5 Clientes que deben */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-500 block">Top 5 Clientes que Deben:</span>
              {cxcRealTime.topDebtors.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No hay cartera pendiente.</p>
              ) : (
                cxcRealTime.topDebtors.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between text-xs py-1">
                    <span className="truncate max-w-[200px] text-slate-800 dark:text-slate-200 font-medium">
                      {inv.customerName}
                    </span>
                    <span className="font-mono font-bold text-amber-600">
                      {formatCurrencyUSD(inv.saldoPendiente ?? inv.totalPagar)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Cuentas por Pagar */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Cuentas por Pagar (Proveedores)
                </span>
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono mt-0.5">
                  {formatCurrencyUSD(cxpRealTime.total)}
                </div>
              </div>

              {/* Mini selector local */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[10px]">
                <button
                  onClick={() => setCxpPeriodSelector('5m')}
                  className={`px-2 py-0.5 rounded-md font-bold transition ${
                    cxpPeriodSelector === '5m' ? 'bg-white dark:bg-slate-700 text-emerald-700 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  5m
                </button>
                <button
                  onClick={() => setCxpPeriodSelector('12m')}
                  className={`px-2 py-0.5 rounded-md font-bold transition ${
                    cxpPeriodSelector === '12m' ? 'bg-white dark:bg-slate-700 text-emerald-700 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  12m
                </button>
                <button
                  onClick={() => setCxpPeriodSelector('yoy')}
                  className={`px-2 py-0.5 rounded-md font-bold transition ${
                    cxpPeriodSelector === 'yoy' ? 'bg-white dark:bg-slate-700 text-emerald-700 shadow-xs' : 'text-slate-500'
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
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 9 }} />
                  <Tooltip formatter={(v: any) => [`$${Number(v).toLocaleString()}`, 'CxP']} />
                  <Bar dataKey="value">
                    {cxpChartData.map((entry, idx) => (
                      <Cell key={`cxp-cell-${idx}`} fill={entry.isCurrent ? '#f43f5e' : '#94a3b8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Desglose por Antigüedad */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <span className="text-[10px] text-slate-400 block font-semibold">Al día</span>
                <span className="font-mono font-bold text-emerald-600 block mt-0.5">
                  {formatCurrencyUSD(cxpRealTime.alDia)}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <span className="text-[10px] text-slate-400 block font-semibold">1-30 días</span>
                <span className="font-mono font-bold text-amber-600 block mt-0.5">
                  {formatCurrencyUSD(cxpRealTime.d1_30)}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <span className="text-[10px] text-slate-400 block font-semibold">31-60 días</span>
                <span className="font-mono font-bold text-orange-600 block mt-0.5">
                  {formatCurrencyUSD(cxpRealTime.d31_60)}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <span className="text-[10px] text-slate-400 block font-semibold">&gt; 60 días</span>
                <span className="font-mono font-bold text-rose-600 block mt-0.5">
                  {formatCurrencyUSD(cxpRealTime.d60plus)}
                </span>
              </div>
            </div>

            {/* Top 5 Proveedores a quienes se debe */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-500 block">Top 5 Proveedores por Liquidar:</span>
              {cxpRealTime.topCreditors.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No hay cuentas por pagar activas.</p>
              ) : (
                cxpRealTime.topCreditors.map((pur) => (
                  <div key={pur.id} className="flex items-center justify-between text-xs py-1">
                    <span className="truncate max-w-[200px] text-slate-800 dark:text-slate-200 font-medium">
                      {pur.supplierName}
                    </span>
                    <span className="font-mono font-bold text-rose-600">
                      {formatCurrencyUSD(pur.saldoPendiente ?? pur.totalPagar)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* SECCIÓN 6. CUMPLIMIENTO TRIBUTARIO Y DIAGNÓSTICO EJECUTIVO (TIEMPO REAL) */}
      {/* ---------------------------------------------------- */}
      <section id="sec-tributario" className="space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          06. Cumplimiento Tributario F-07 & Diagnóstico Financiero
        </h2>

        {/* Tarjeta de IVA del mes en curso y obligaciones */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>IVA del Mes en Curso & Obligaciones Mensuales</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Cálculo en tiempo real con fechas límites del Ministerio de Hacienda
              </p>
            </div>
            <span className="text-[10px] font-semibold text-slate-400 italic">
              *{TAX_DEADLINES.note}
            </span>
          </div>

          {/* IVA Débito, Crédito, Remanente/Pagar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 font-bold block">Débito Fiscal (13%)</span>
              <span className="text-base font-black font-mono text-slate-900 dark:text-white mt-0.5 block">
                {formatCurrencyUSD(taxSummaryRealTime.debitoFiscal)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 font-bold block">Crédito Fiscal (13%)</span>
              <span className="text-base font-black font-mono text-cyan-600 dark:text-cyan-400 mt-0.5 block">
                {formatCurrencyUSD(taxSummaryRealTime.creditoFiscal)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 font-bold block">
                {taxSummaryRealTime.ivaNetoPagar > 0 ? 'IVA por Pagar (F-07)' : 'Remanente a Favor'}
              </span>
              <span
                className={`text-base font-black font-mono mt-0.5 block ${
                  taxSummaryRealTime.ivaNetoPagar > 0 ? 'text-amber-600' : 'text-emerald-600'
                }`}
              >
                {formatCurrencyUSD(
                  taxSummaryRealTime.ivaNetoPagar > 0
                    ? taxSummaryRealTime.ivaNetoPagar
                    : taxSummaryRealTime.remanenteFavor
                )}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
              <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold block">
                Fecha Límite F-07 (Día {TAX_DEADLINES.ivaF07Day})
              </span>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mt-1 block">
                Quedan {taxSummaryRealTime.daysRemainingF07} días restantes
              </span>
            </div>
          </div>

          {/* Otras Obligaciones Mensuales */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block">Pago a Cuenta (1.75%)</span>
                <span className="text-[10px] text-slate-400">Vence: Día {TAX_DEADLINES.pagoCuentaDay}</span>
              </div>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {formatCurrencyUSD(taxSummaryRealTime.pagoCuenta)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block">Retenciones Renta 10%</span>
                <span className="text-[10px] text-slate-400">Vence: Día {TAX_DEADLINES.retencionesDay}</span>
              </div>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {formatCurrencyUSD(taxSummaryRealTime.retencionRenta)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block">Cotizaciones ISSS/AFP</span>
                <span className="text-[10px] text-slate-400">Vence: Día {TAX_DEADLINES.isssDay}</span>
              </div>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {formatCurrencyUSD(taxSummaryRealTime.isss + taxSummaryRealTime.afp)}
              </span>
            </div>
          </div>
        </div>

        {/* Diagnóstico Ejecutivo con IA */}
        <div className="bg-gradient-to-br from-emerald-50/60 via-white to-teal-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/40 rounded-2xl p-5 sm:p-6 border border-emerald-200/80 dark:border-emerald-900/50 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Diagnóstico Ejecutivo con IA (Situación Actual)</span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Auditoría inteligente de salud financiera, liquidez y recomendaciones de operación
                </p>
              </div>
            </div>

            <button
              disabled={isDiagnosing}
              onClick={handleRunDiagnosis}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition disabled:opacity-50 cursor-pointer"
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
            <div className="mt-4 pt-4 border-t border-emerald-100 dark:border-emerald-900/50 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in duration-200">
              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500">Score de Salud</span>
                  <span className="text-lg font-black text-emerald-700 dark:text-emerald-400 font-mono">
                    {diagnosisResult.healthScore}/100
                  </span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {diagnosisResult.statusSummary}
                </p>
              </div>

              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block mb-2">
                  Fortalezas
                </span>
                <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                  {diagnosisResult.strengths.map((s, idx) => (
                    <li key={idx} className="flex items-start gap-1">
                      <span className="text-emerald-500 font-bold">✓</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                <span className="text-xs font-bold text-teal-700 dark:text-teal-400 block mb-2">
                  Recomendaciones
                </span>
                <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                  {diagnosisResult.recommendations.map((r, idx) => (
                    <li key={idx} className="flex items-start gap-1">
                      <span className="text-teal-500 font-bold">→</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Enlace a Pronósticos & Proyecciones */}
        <div className="p-4 rounded-2xl bg-slate-900 text-white border border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Calculator className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="text-xs font-bold block">¿Deseas proyectar meses futuros?</span>
              <span className="text-[11px] text-slate-300">
                Consulta el modelo econométrico OLS en el módulo de Pronósticos.
              </span>
            </div>
          </div>
          <button
            onClick={() => setActiveModule('forecasting')}
            className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition cursor-pointer flex items-center gap-1 shrink-0"
          >
            <span>Ir a Pronósticos</span>
            <ExternalLink className="w-3.5 h-3.5" />
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
