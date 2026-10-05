import React, { useState, useMemo } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  Target,
  LayoutDashboard,
  Building2,
  CalendarDays,
  CalendarRange,
  SlidersHorizontal,
  RotateCcw,
  Receipt,
  Sparkles,
  Calendar,
  Building,
  Filter,
  Users,
  PieChart as PieIcon,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  Clock,
  ShoppingBag,
  Award,
  AlertCircle,
  HelpCircle,
  DollarSign,
  Megaphone,
  Share2,
  Send,
  Smartphone,
  Globe,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Calculator,
  Percent,
  Layers,
  FileText,
  ChevronDown,
  Zap,
  Repeat,
  ShieldAlert,
  MessageCircle,
  UserCheck,
  UserX,
  Compass,
  X,
  Check,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area,
} from 'recharts';
import { formatCurrencyUSD } from '../../utils/salvadoranTax';
import { DynamicChartBuilderModal } from './DynamicChartBuilderModal';
import { HistoricalFinancialAnalytics } from './HistoricalFinancialAnalytics';
import { Invoice, Customer, Product, Branch } from '../../types';

const COLORS = ['#0F766E', '#0F4C45', '#115E59', '#64748B', '#059669', '#334155', '#0D9488', '#475569'];

export const MarketingDashboard: React.FC = () => {
  const {
    currentCompany,
    customers,
    invoices,
    purchases,
    otherIncomes,
    products,
    branches,
    employees,
    fiscalConfig,
    dynamicWidgets,
    deleteDynamicWidget,
    setActiveModule,
  } = useERP();

  // ----------------------------------------------------
  // FILTROS PRINCIPALES AUTÓNOMOS DEL DASHBOARD DE MARKETING
  // ----------------------------------------------------
  const [mktBranchId, setMktBranchId] = useState<string>('all');
  const [mktYear, setMktYear] = useState<number>(2026);
  const [mktMonth, setMktMonth] = useState<string>('all');
  const [mktDay, setMktDay] = useState<string>('all');
  const [mktChannel, setMktChannel] = useState<string>('all');
  const [mktCustomerType, setMktCustomerType] = useState<string>('all');
  const [vipSearchQuery, setVipSearchQuery] = useState<string>('');
  const [isChartBuilderOpen, setIsChartBuilderOpen] = useState(false);
  const [showRoiCalculator, setShowRoiCalculator] = useState(false);
  const [activeTab, setActiveTab] = useState<'kpis' | 'canales' | 'multivariable' | 'vip' | 'productos' | 'retencion'>('kpis');
  const [channelChartType, setChannelChartType] = useState<'bars' | 'lines' | 'area'>('bars');
  const [isDayPickerOpen, setIsDayPickerOpen] = useState(false);

  // ----------------------------------------------------
  // FILTRO AUTÓNOMO E INDEPENDIENTE PARA EL GRÁFICO DE LAS 4 VARIABLES
  // ----------------------------------------------------
  const [chartBranchId, setChartBranchId] = useState<string>('all');

  // Estado para el Simulador Interactivo de Campañas de Marketing
  const [simBudget, setSimBudget] = useState<number>(600);
  const [simCpl, setSimCpl] = useState<number>(2.5); // Costo por lead $2.50
  const [simConvRate, setSimConvRate] = useState<number>(12); // 12% conversión
  const [simMarginPct, setSimMarginPct] = useState<number>(35); // 35% margen bruto

  const MKT_YEARS = [2026, 2025, 2024, 2023, 2022];
  const MKT_MONTHS = [
    { key: 'all', short: 'Todos', name: 'Todos los meses' },
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

  // Cálculo de días en el mes seleccionado
  const daysInSelectedMonth = useMemo(() => {
    if (mktMonth === 'all') return 31;
    const year = mktYear;
    const month = parseInt(mktMonth, 10);
    return new Date(year, month, 0).getDate();
  }, [mktYear, mktMonth]);

  // Offset del primer día de la semana (Lunes = 0 .. Domingo = 6)
  const firstDayOfMonthOffset = useMemo(() => {
    if (mktMonth === 'all') return 0;
    const year = mktYear;
    const monthIndex = parseInt(mktMonth, 10) - 1;
    const firstDay = new Date(year, monthIndex, 1).getDay();
    return (firstDay + 6) % 7;
  }, [mktYear, mktMonth]);

  // Botón rápido para fijar fecha a Hoy
  const handleSetToday = () => {
    const now = new Date();
    setMktYear(now.getFullYear());
    setMktMonth(String(now.getMonth() + 1).padStart(2, '0'));
    setMktDay(String(now.getDate()));
    setIsDayPickerOpen(false);
  };

  // Helper date checker for main marketing dashboard
  const matchesMktDate = (dateStr?: string) => {
    if (!dateStr) return false;
    if (mktYear) {
      if (!dateStr.startsWith(String(mktYear))) return false;
    }
    if (mktMonth !== 'all') {
      const expectedPrefix = `${mktYear}-${mktMonth}`;
      if (!dateStr.startsWith(expectedPrefix)) return false;
    }
    if (mktDay !== 'all') {
      const expectedDay = `${mktYear}-${mktMonth}-${mktDay.padStart(2, '0')}`;
      if (dateStr !== expectedDay) return false;
    }
    return true;
  };

  // Facturas filtradas por los filtros autónomos de marketing
  const filteredInvoices = useMemo(() => {
    let list = (invoices || []).filter((i) => i && i.status !== 'anulada');

    // Filtro por sucursal
    if (mktBranchId !== 'all') {
      list = list.filter(
        (i) => i.branchId === mktBranchId || (!i.branchId && branches.find((b) => b.id === mktBranchId)?.isMain)
      );
    }

    // Filtro por fecha
    list = list.filter((i) => matchesMktDate(i.date));

    // Filtro por canal de captación del cliente
    if (mktChannel !== 'all') {
      list = list.filter((i) => {
        const cust = (customers || []).find((c) => c.id === i.customerId);
        if (mktChannel === 'whatsapp') return cust?.acquisitionChannel === 'whatsapp';
        if (mktChannel === 'meta_ads') return cust?.acquisitionChannel === 'instagram' || cust?.acquisitionChannel === 'facebook';
        if (mktChannel === 'google_ads') return cust?.acquisitionChannel === 'web';
        if (mktChannel === 'referidos') return cust?.acquisitionChannel === 'referido';
        if (mktChannel === 'tienda_fisica') return cust?.acquisitionChannel === 'tienda_fisica';
        return true;
      });
    }

    // Filtro por tipo de cliente
    if (mktCustomerType !== 'all') {
      list = list.filter((i) => {
        const cust = (customers || []).find((c) => c.id === i.customerId);
        if (mktCustomerType === 'b2b') return cust?.gender === 'corporativo' || cust?.isGranContribuyente || i.type === 'credito_fiscal';
        if (mktCustomerType === 'b2c') return cust?.gender !== 'corporativo' && !cust?.isGranContribuyente && i.type !== 'credito_fiscal';
        if (mktCustomerType === 'frecuentes') return (cust?.rating || 0) >= 4;
        return true;
      });
    }

    return list;
  }, [invoices, mktBranchId, branches, mktYear, mktMonth, mktDay, mktChannel, mktCustomerType, customers]);

  // Transacciones preparadas con filtro autónomo para el Gráfico de las 4 Variables
  const chartFilteredInvoices = useMemo(() => {
    if (chartBranchId === 'all') return invoices || [];
    return (invoices || []).filter(
      (i) => i && i.status !== 'anulada' && (i.branchId === chartBranchId || (!i.branchId && branches.find((b) => b.id === chartBranchId)?.isMain))
    );
  }, [invoices, chartBranchId, branches]);

  const chartFilteredPurchases = useMemo(() => {
    if (chartBranchId === 'all') return purchases || [];
    return (purchases || []).filter(
      (p) => p && p.status !== 'anulada' && (p.branchId === chartBranchId || (!p.branchId && branches.find((b) => b.id === chartBranchId)?.isMain))
    );
  }, [purchases, chartBranchId, branches]);

  const chartFilteredOtherIncomes = useMemo(() => {
    if (chartBranchId === 'all') return otherIncomes || [];
    return (otherIncomes || []).filter(
      (o) => o && (o.branchId === chartBranchId || (!o.branchId && branches.find((b) => b.id === chartBranchId)?.isMain))
    );
  }, [otherIncomes, chartBranchId, branches]);

  // ----------------------------------------------------
  // 1. MÉTRICAS CLAVE DE RENDIMIENTO COMERCIAL & MARKETING (KPIS)
  // ----------------------------------------------------
  const marketingKPIs = useMemo(() => {
    const totalVentas = filteredInvoices.reduce((sum, inv) => {
      const sumas = (inv.sumasGravadas || 0) + (inv.sumasExentas || 0) + (inv.sumasNoSujetas || 0);
      return sum + (sumas > 0 ? sumas : inv.totalPagar || 0);
    }, 0);

    const totalTransacciones = filteredInvoices.length;
    const ticketPromedio = totalTransacciones > 0 ? totalVentas / totalTransacciones : 0;

    // Conteo de clientes únicos y recurrencia
    const customerOrderCounts: { [key: string]: number } = {};
    filteredInvoices.forEach((inv) => {
      if (inv.customerId) {
        customerOrderCounts[inv.customerId] = (customerOrderCounts[inv.customerId] || 0) + 1;
      }
    });

    const uniqueCustomers = Object.keys(customerOrderCounts).length;
    const recurringCustomers = Object.values(customerOrderCounts).filter((count) => count > 1).length;
    const tasaRecurrencia = uniqueCustomers > 0 ? (recurringCustomers / uniqueCustomers) * 100 : 0;

    // Estimación de inversión publicitaria y captación
    // Base publicitaria proporcional al volumen de ventas (~5% del ingreso)
    const inversionPublicitaria = Math.round(Math.max(150, totalVentas * 0.052));
    const nuevosClientes = Math.max(1, uniqueCustomers - recurringCustomers);
    const cac = nuevosClientes > 0 ? inversionPublicitaria / nuevosClientes : 0;

    // LTV (Customer Lifetime Value) promedio histórico
    const totalAllInvoices = (invoices || []).reduce((sum, i) => sum + (i.totalPagar || 0), 0);
    const allCustomersCount = Math.max(1, (customers || []).length);
    const ltvPromedio = totalAllInvoices / allCustomersCount;
    const ratioLtvCac = cac > 0 ? ltvPromedio / cac : 0;

    // ROAS (Return On Ad Spend)
    const ventasPauta = totalVentas * 0.78; // 78% atribuible a canales comerciales
    const roas = inversionPublicitaria > 0 ? (ventasPauta / inversionPublicitaria) : 0;

    return {
      totalVentas,
      totalTransacciones,
      ticketPromedio,
      uniqueCustomers,
      recurringCustomers,
      tasaRecurrencia,
      inversionPublicitaria,
      nuevosClientes,
      cac,
      ltvPromedio,
      ratioLtvCac,
      roas,
    };
  }, [filteredInvoices, invoices, customers]);

  // Sparklines para las 8 tarjetas de KPIs de marketing
  const mktSparklines = useMemo(() => {
    const base = [
      { m: 'Ene', v: 4200, t: 38, c: 24, r: 18, p: 210, cac: 9.8, ltv: 320, roas: 3.8 },
      { m: 'Feb', v: 4600, t: 41, c: 26, r: 20, p: 230, cac: 9.5, ltv: 330, roas: 3.9 },
      { m: 'Mar', v: 5100, t: 44, c: 29, r: 22, p: 250, cac: 9.2, ltv: 345, roas: 4.1 },
      { m: 'Abr', v: 5400, t: 45, c: 31, r: 23, p: 270, cac: 9.0, ltv: 350, roas: 4.0 },
      { m: 'May', v: 6200, t: 48, c: 35, r: 25, p: 310, cac: 8.8, ltv: 365, roas: 4.3 },
      { m: 'Jun', v: 5900, t: 47, c: 33, r: 24, p: 290, cac: 8.9, ltv: 360, roas: 4.2 },
      { m: 'Jul', v: 6400, t: 49, c: 37, r: 26, p: 320, cac: 8.6, ltv: 375, roas: 4.4 },
      { m: 'Ago', v: 6800, t: 50, c: 39, r: 28, p: 340, cac: 8.4, ltv: 385, roas: 4.5 },
      {
        m: 'Sep',
        v: marketingKPIs.totalVentas || 7100,
        t: Math.round(marketingKPIs.ticketPromedio || 52),
        c: marketingKPIs.uniqueCustomers || 42,
        r: Math.round(marketingKPIs.tasaRecurrencia || 30),
        p: marketingKPIs.inversionPublicitaria || 360,
        cac: Number((marketingKPIs.cac || 8.2).toFixed(1)),
        ltv: Math.round(marketingKPIs.ltvPromedio || 395),
        roas: Number((marketingKPIs.roas || 4.6).toFixed(1)),
      },
    ];
    return {
      ventas: base.map((b) => ({ val: b.v })),
      ticket: base.map((b) => ({ val: b.t })),
      clientes: base.map((b) => ({ val: b.c })),
      recurrencia: base.map((b) => ({ val: b.r })),
      inversion: base.map((b) => ({ val: b.p })),
      cac: base.map((b) => ({ val: b.cac })),
      ltv: base.map((b) => ({ val: b.ltv })),
      roas: base.map((b) => ({ val: b.roas })),
    };
  }, [marketingKPIs]);

  // ----------------------------------------------------
  // 2. DESGLOSE POR CANALES DE MARKETING Y RETORNO (ROAS)
  // ----------------------------------------------------
  const channelsData = useMemo(() => {
    const rawChannels = [
      { id: 'meta_ads', name: 'Meta Ads (FB/IG)', baseSpend: 280, share: 0.35, color: '#0F766E' },
      { id: 'google_ads', name: 'Google Ads (Search/Maps)', baseSpend: 190, share: 0.24, color: '#115E59' },
      { id: 'whatsapp', name: 'WhatsApp Business Directo', baseSpend: 60, share: 0.20, color: '#059669' },
      { id: 'tiktok', name: 'TikTok Ads & Viral', baseSpend: 90, share: 0.11, color: '#334155' },
      { id: 'referidos', name: 'Referidos / Boca a Boca', baseSpend: 30, share: 0.07, color: '#0D9488' },
      { id: 'tienda_fisica', name: 'Orgánico / Tienda Física', baseSpend: 20, share: 0.03, color: '#64748B' },
    ];

    const totalV = Math.max(1000, marketingKPIs.totalVentas);

    return rawChannels.map((c) => {
      const sales = Math.round(totalV * c.share);
      const spend = c.baseSpend;
      const roas = spend > 0 ? Number((sales / spend).toFixed(2)) : 0;
      const leads = Math.round(spend / 2.2);
      const orders = Math.max(1, Math.round(sales / (marketingKPIs.ticketPromedio || 45)));

      return {
        ...c,
        sales,
        spend,
        roas,
        leads,
        orders,
      };
    });
  }, [marketingKPIs]);

  // ----------------------------------------------------
  // 3. TOP 10 CLIENTES VIP (SEGMENTACIÓN & VALOR COMERCIAL)
  // ----------------------------------------------------
  const top10Customers = useMemo(() => {
    const customerMap = new Map<string, { total: number; count: number; lastDate: string }>();

    filteredInvoices.forEach((inv) => {
      if (!inv.customerId) return;
      const current = customerMap.get(inv.customerId) || { total: 0, count: 0, lastDate: inv.date || '' };
      const val = (inv.sumasGravadas || 0) + (inv.sumasExentas || 0) + (inv.sumasNoSujetas || 0) || inv.totalPagar || 0;
      customerMap.set(inv.customerId, {
        total: current.total + val,
        count: current.count + 1,
        lastDate: inv.date && inv.date > current.lastDate ? inv.date : current.lastDate,
      });
    });

    const list = Array.from(customerMap.entries()).map(([cId, stats]) => {
      const cust = (customers || []).find((c) => c.id === cId);
      const name = cust?.tradeName || cust?.name || 'Cliente sin nombre';
      const isCorp = cust?.gender === 'corporativo' || cust?.isGranContribuyente;
      const channel = cust?.acquisitionChannel || 'whatsapp';
      const avgTicket = stats.count > 0 ? stats.total / stats.count : 0;

      // Calcular días desde última compra
      const now = new Date(2026, 8, 28); // Sep 28, 2026
      let daysSinceLast = 15;
      if (stats.lastDate) {
        const pDate = new Date(stats.lastDate);
        const diffMs = now.getTime() - pDate.getTime();
        daysSinceLast = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      }

      let segmentLabel = 'Bronce';
      let segmentBadge = 'bg-[#F6F8F7] dark:bg-slate-800 text-[#6B7280] border-[#E3E8E6] dark:border-slate-700';
      if (stats.total >= 1000 || stats.count >= 6) {
        segmentLabel = 'Oro VIP';
        segmentBadge = 'bg-teal-50 dark:bg-teal-950/60 text-[#0F766E] border-teal-200 dark:border-teal-800';
      } else if (stats.total >= 400 || stats.count >= 3) {
        segmentLabel = 'Plata';
        segmentBadge = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
      }

      return {
        id: cId,
        name,
        isCorp,
        channel,
        total: Number(stats.total.toFixed(2)),
        count: stats.count,
        avgTicket: Number(avgTicket.toFixed(2)),
        lastDate: stats.lastDate,
        daysSinceLast,
        segmentLabel,
        segmentBadge,
      };
    });

    list.sort((a, b) => b.total - a.total);

    if (vipSearchQuery.trim()) {
      return list.filter((c) => c.name.toLowerCase().includes(vipSearchQuery.toLowerCase()));
    }

    return list.slice(0, 10);
  }, [filteredInvoices, customers, vipSearchQuery]);

  // ----------------------------------------------------
  // 4. TOP 10 PRODUCTOS CON MAYOR MARGEN COMERCIAL
  // ----------------------------------------------------
  const top10ProductsMargin = useMemo(() => {
    const prodMap = new Map<string, { qty: number; sales: number }>();

    filteredInvoices.forEach((inv) => {
      (inv.items || []).forEach((item) => {
        if (!item.productId) return;
        const current = prodMap.get(item.productId) || { qty: 0, sales: 0 };
        prodMap.set(item.productId, {
          qty: current.qty + (item.quantity || 1),
          sales: current.sales + (item.total || item.unitPrice * (item.quantity || 1)),
        });
      });
    });

    const list = Array.from(prodMap.entries()).map(([pId, stats]) => {
      const prod = (products || []).find((p) => p.id === pId);
      const name = prod?.name || 'Producto General';
      const cost = prod?.currentCost || (prod?.salePrice ? prod.salePrice * 0.55 : 12);
      const price = prod?.salePrice || (stats.qty > 0 ? stats.sales / stats.qty : 25);
      const marginDollar = price - cost;
      const marginPct = price > 0 ? (marginDollar / price) * 100 : 0;
      const totalMarginDollar = stats.qty * marginDollar;

      return {
        id: pId,
        name,
        qty: stats.qty,
        sales: Number(stats.sales.toFixed(2)),
        marginPct: Number(marginPct.toFixed(1)),
        totalMarginDollar: Number(totalMarginDollar.toFixed(2)),
      };
    });

    list.sort((a, b) => b.totalMarginDollar - a.totalMarginDollar);
    return list.slice(0, 8);
  }, [filteredInvoices, products]);

  // ----------------------------------------------------
  // 5. CICLO DE VIDA DEL CLIENTE & SEMÁFORO DE RETENCIÓN (CHURN RISK)
  // ----------------------------------------------------
  const churnAnalysis = useMemo(() => {
    let activos = 0;
    let enRiesgo = 0;
    let inactivos = 0;
    let perdidos = 0;

    (customers || []).forEach((cust) => {
      const custInvs = (invoices || []).filter((i) => i.customerId === cust.id && i.status !== 'anulada');
      if (custInvs.length === 0) {
        perdidos++;
        return;
      }

      // Ordenar por fecha descendente
      const dates = custInvs.map((i) => i.date).filter(Boolean).sort().reverse();
      const lastDateStr = dates[0] || '2026-06-01';
      const pDate = new Date(lastDateStr);
      const now = new Date(2026, 8, 28);
      const diffDays = Math.max(0, Math.floor((now.getTime() - pDate.getTime()) / (1000 * 60 * 60 * 24)));

      if (diffDays <= 30) activos++;
      else if (diffDays <= 60) enRiesgo++;
      else if (diffDays <= 90) inactivos++;
      else perdidos++;
    });

    return [
      { name: 'Activos (<30d)', value: activos, color: '#0F766E', action: 'Programa de Fidelización' },
      { name: 'En Riesgo (31-60d)', value: enRiesgo, color: '#D97706', action: 'Cupón de Reactivación WhatsApp' },
      { name: 'Inactivos (61-90d)', value: inactivos, color: '#EA580C', action: 'Campaña con Oferta Especial' },
      { name: 'Perdidos (>90d)', value: perdidos, color: '#DC2626', action: 'Encuesta de Satisfacción / Retoma' },
    ].filter((d) => d.value > 0);
  }, [customers, invoices]);

  // ----------------------------------------------------
  // 6. VENTAS POR DÍA DE LA SEMANA (HÁBITOS DE COMPRA)
  // ----------------------------------------------------
  const salesByDayOfWeek = useMemo(() => {
    const daysMap = [
      { day: 'Lun', name: 'Lunes', sales: 0, count: 0 },
      { day: 'Mar', name: 'Martes', sales: 0, count: 0 },
      { day: 'Mié', name: 'Miércoles', sales: 0, count: 0 },
      { day: 'Jue', name: 'Jueves', sales: 0, count: 0 },
      { day: 'Vie', name: 'Viernes', sales: 0, count: 0 },
      { day: 'Sáb', name: 'Sábado', sales: 0, count: 0 },
      { day: 'Dom', name: 'Domingo', sales: 0, count: 0 },
    ];

    filteredInvoices.forEach((inv) => {
      if (!inv.date) return;
      const d = new Date(`${inv.date}T12:00:00`);
      const dayIndex = (d.getDay() + 6) % 7; // Lunes = 0 .. Domingo = 6
      const val = (inv.sumasGravadas || 0) + (inv.sumasExentas || 0) + (inv.sumasNoSujetas || 0) || inv.totalPagar || 0;
      daysMap[dayIndex].sales += val;
      daysMap[dayIndex].count += 1;
    });

    return daysMap.map((d) => ({
      ...d,
      sales: Math.round(d.sales),
    }));
  }, [filteredInvoices]);

  // ----------------------------------------------------
  // 7. SIMULADOR DE ROI DE CAMPAÑA CALCULADO
  // ----------------------------------------------------
  const simulationResults = useMemo(() => {
    const expectedLeads = simCpl > 0 ? Math.floor(simBudget / simCpl) : 0;
    const expectedNewCustomers = Math.floor(expectedLeads * (simConvRate / 100));
    const projectedSales = expectedNewCustomers * (marketingKPIs.ticketPromedio || 48);
    const grossProfit = projectedSales * (simMarginPct / 100);
    const netProfit = grossProfit - simBudget;
    const projectedRoas = simBudget > 0 ? (projectedSales / simBudget) : 0;

    return {
      expectedLeads,
      expectedNewCustomers,
      projectedSales,
      grossProfit,
      netProfit,
      projectedRoas,
    };
  }, [simBudget, simCpl, simConvRate, simMarginPct, marketingKPIs.ticketPromedio]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 bg-[#F6F8F7] dark:bg-slate-950 min-h-screen text-[#111827] dark:text-slate-100 font-sans pb-20">
      {/* ==================================================== */}
      {/* 1. TOP PAGE HEADER: Switcher + Title + Primary Action */}
      {/* ==================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#E3E8E6] dark:border-slate-800">
        <div>
          {/* Dashboard Switcher: 1. Corporativo & 2. Marketing */}
          <div className="inline-flex p-1 rounded-[8px] bg-[#E3E8E6]/70 dark:bg-slate-800/80 border border-[#E3E8E6] dark:border-slate-700 mb-2.5">
            <button
              type="button"
              onClick={() => setActiveModule('dashboard')}
              className="flex items-center gap-1.5 px-3 py-1 rounded-[6px] text-[#6B7280] hover:text-[#111827] dark:text-slate-400 dark:hover:text-white font-medium text-[12px] transition cursor-pointer"
              title="Volver al Dashboard 1: Corporativo & Operativo"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>1. Dashboard Corporativo</span>
            </button>
            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-1 rounded-[6px] bg-white dark:bg-slate-900 text-[#0F766E] dark:text-teal-300 font-semibold text-[12px] shadow-2xs border border-[#E3E8E6] dark:border-slate-700 cursor-default"
            >
              <Target className="w-3.5 h-3.5 text-[#0F766E]" />
              <span>2. Dashboard de Marketing</span>
            </button>
          </div>

          <h1 className="text-[20px] font-semibold text-[#111827] dark:text-white leading-tight">
            Dashboard de marketing & inteligencia comercial
          </h1>
          <p className="text-[14px] text-[#6B7280] dark:text-slate-400 mt-1">
            Análisis de captación, CAC, LTV, retención de clientes y retorno publicitario (ROAS).
          </p>
        </div>

        {/* Action Buttons: Exactly ONE primary button (#0F766E), others secondary */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={() => setShowRoiCalculator(!showRoiCalculator)}
            className="px-3 py-1.5 rounded-[6px] border border-[#E3E8E6] dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-[#F6F8F7] text-[#111827] dark:text-slate-200 text-[14px] font-medium transition-all duration-150 hover:shadow-xs flex items-center gap-1.5 cursor-pointer shadow-none"
            title="Simulador interactivo de ROI en publicidad"
          >
            <Calculator className="w-4 h-4 text-[#6B7280]" />
            <span>{showRoiCalculator ? 'Ocultar simulador' : 'Simulador ROI'}</span>
          </button>

          {/* THE ONLY PRIMARY ACTION BUTTON ON THE SCREEN */}
          <button
            type="button"
            onClick={() => setIsChartBuilderOpen(true)}
            className="px-3.5 py-1.5 rounded-[6px] bg-[#0F766E] hover:bg-[#115E59] text-white text-[14px] font-medium flex items-center gap-1.5 transition-all duration-150 hover:shadow-xs shadow-none cursor-pointer"
            title="Crear un nuevo gráfico personalizado para este dashboard"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>+ Añadir gráfico</span>
          </button>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 2. BARRA DE FILTROS AUTÓNOMOS DEL DASHBOARD DE MARKETING */}
      {/* ==================================================== */}
      <div className="rounded-[8px] border border-[#E3E8E6] dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-none space-y-3.5">
        <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-[#E3E8E6] dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-[6px] bg-teal-50 dark:bg-teal-950/60 border border-teal-200/80 dark:border-teal-800/80 flex items-center justify-center text-[#0F766E]">
              <SlidersHorizontal className="w-3.5 h-3.5 stroke-[2]" />
            </div>
            <div>
              <span className="text-[13px] font-semibold text-[#111827] dark:text-white">
                Filtros de marketing y canales
              </span>
              <span className="text-[11px] text-[#6B7280] ml-2 hidden md:inline">
                Filtra por sucursal, año, mes, día específico y canal de captación
              </span>
            </div>
          </div>

          {(mktBranchId !== 'all' || mktMonth !== 'all' || mktDay !== 'all' || mktChannel !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setMktBranchId('all');
                setMktMonth('all');
                setMktDay('all');
                setMktChannel('all');
              }}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] text-[11px] font-medium text-[#6B7280] hover:text-[#0F766E] hover:bg-teal-50 dark:hover:bg-slate-800 transition cursor-pointer border border-transparent hover:border-teal-200"
              title="Restablecer filtros a todo el histórico"
            >
              <RotateCcw className="w-3 h-3 text-[#0F766E]" />
              <span>Restablecer</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            {/* 1. Sucursal */}
            <div className="flex items-center rounded-[6px] border border-[#E3E8E6] dark:border-slate-700 bg-[#F6F8F7]/70 dark:bg-slate-800/70 hover:bg-white dark:hover:bg-slate-800 hover:border-teal-500/50 focus-within:border-[#0F766E] focus-within:bg-white transition-all pl-2.5 pr-2 py-1 gap-2 shadow-2xs">
              <div className="flex items-center gap-1.5 text-[#0F766E]">
                <Building2 className="w-3.5 h-3.5 stroke-[2]" />
                <span className="text-[#6B7280] dark:text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
                  Sucursal
                </span>
              </div>
              <div className="h-4 w-[1px] bg-[#E3E8E6] dark:bg-slate-700" />
              <select
                value={mktBranchId}
                onChange={(e) => setMktBranchId(e.target.value)}
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

            {/* 2. Año */}
            <div className="flex items-center rounded-[6px] border border-[#E3E8E6] dark:border-slate-700 bg-[#F6F8F7]/70 dark:bg-slate-800/70 hover:bg-white dark:hover:bg-slate-800 hover:border-teal-500/50 focus-within:border-[#0F766E] focus-within:bg-white transition-all pl-2.5 pr-2 py-1 gap-2 shadow-2xs">
              <div className="flex items-center gap-1.5 text-[#0F766E]">
                <CalendarDays className="w-3.5 h-3.5 stroke-[2]" />
                <span className="text-[#6B7280] dark:text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
                  Año
                </span>
              </div>
              <div className="h-4 w-[1px] bg-[#E3E8E6] dark:bg-slate-700" />
              <select
                value={mktYear}
                onChange={(e) => setMktYear(Number(e.target.value))}
                className="bg-transparent text-[13px] font-medium text-[#111827] dark:text-slate-100 outline-none cursor-pointer pr-1 font-mono"
              >
                {MKT_YEARS.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Mes */}
            <div className="flex items-center rounded-[6px] border border-[#E3E8E6] dark:border-slate-700 bg-[#F6F8F7]/70 dark:bg-slate-800/70 hover:bg-white dark:hover:bg-slate-800 hover:border-teal-500/50 focus-within:border-[#0F766E] focus-within:bg-white transition-all pl-2.5 pr-2 py-1 gap-2 shadow-2xs">
              <div className="flex items-center gap-1.5 text-[#0F766E]">
                <CalendarRange className="w-3.5 h-3.5 stroke-[2]" />
                <span className="text-[#6B7280] dark:text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
                  Mes
                </span>
              </div>
              <div className="h-4 w-[1px] bg-[#E3E8E6] dark:bg-slate-700" />
              <select
                value={mktMonth}
                onChange={(e) => setMktMonth(e.target.value)}
                className="bg-transparent text-[13px] font-medium text-[#111827] dark:text-slate-100 outline-none cursor-pointer pr-1"
              >
                {MKT_MONTHS.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Selector de Día con popover interactivo */}
            <div className="relative">
              <button
                type="button"
                disabled={mktMonth === 'all'}
                onClick={() => setIsDayPickerOpen(!isDayPickerOpen)}
                className={`flex items-center rounded-[6px] border text-[13px] transition cursor-pointer pl-2.5 pr-2 py-1 gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs ${
                  mktDay !== 'all'
                    ? 'bg-teal-50/80 dark:bg-teal-950/50 border-[#0F766E] text-[#0F766E] font-medium'
                    : 'bg-[#F6F8F7]/70 dark:bg-slate-800/70 hover:bg-white dark:hover:bg-slate-800 border-[#E3E8E6] dark:border-slate-700 text-[#111827] dark:text-slate-200 hover:border-teal-500/50'
                }`}
                title={mktMonth === 'all' ? 'Selecciona un mes para habilitar el selector de día' : 'Elegir día específico'}
              >
                <div className="flex items-center gap-1.5 text-[#0F766E]">
                  <Calendar className="w-3.5 h-3.5 stroke-[2]" />
                  <span className="text-[#6B7280] dark:text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
                    Día
                  </span>
                </div>
                <div className="h-4 w-[1px] bg-[#E3E8E6] dark:border-slate-700" />
                <span>{mktDay === 'all' ? 'Todos los días' : `Día ${mktDay}`}</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#6B7280] ml-0.5" />
              </button>

              {/* Calendario Desplegable */}
              {isDayPickerOpen && mktMonth !== 'all' && (
                <>
                  <div
                    className="fixed inset-0 z-40 bg-black/10"
                    onClick={() => setIsDayPickerOpen(false)}
                  />
                  <div className="absolute top-full mt-1.5 left-0 z-50 bg-white dark:bg-slate-900 border border-[#E3E8E6] dark:border-slate-700 rounded-[8px] p-4 shadow-none w-72 space-y-3">
                    <div className="flex items-center justify-between border-b border-[#E3E8E6] dark:border-slate-800 pb-2">
                      <span className="text-[14px] font-semibold text-[#111827] dark:text-white capitalize flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#0F766E]" />
                        <span>{MKT_MONTHS.find((m) => m.key === mktMonth)?.name} {mktYear}</span>
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
                        setMktDay('all');
                        setIsDayPickerOpen(false);
                      }}
                      className={`w-full py-1.5 px-3 rounded-[6px] text-[12px] font-medium transition cursor-pointer ${
                        mktDay === 'all'
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
                        const isSelected = mktDay === String(d);
                        const now = new Date();
                        const isRealToday =
                          mktYear === now.getFullYear() &&
                          mktMonth === String(now.getMonth() + 1).padStart(2, '0') &&
                          d === now.getDate();

                        return (
                          <button
                            key={d}
                            type="button"
                            onClick={() => {
                              setMktDay(String(d));
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

            {/* 6. Canal de Captación */}
            <div className="flex items-center rounded-[6px] border border-[#E3E8E6] dark:border-slate-700 bg-[#F6F8F7]/70 dark:bg-slate-800/70 hover:bg-white dark:hover:bg-slate-800 hover:border-teal-500/50 focus-within:border-[#0F766E] focus-within:bg-white transition-all pl-2.5 pr-2 py-1 gap-2 shadow-2xs">
              <div className="flex items-center gap-1.5 text-[#0F766E]">
                <Megaphone className="w-3.5 h-3.5 stroke-[2]" />
                <span className="text-[#6B7280] dark:text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
                  Canal
                </span>
              </div>
              <div className="h-4 w-[1px] bg-[#E3E8E6] dark:bg-slate-700" />
              <select
                value={mktChannel}
                onChange={(e) => setMktChannel(e.target.value)}
                className="bg-transparent text-[13px] font-medium text-[#111827] dark:text-slate-100 outline-none cursor-pointer pr-1"
              >
                <option value="all">Todos los canales</option>
                <option value="meta_ads">Meta Ads (FB/IG)</option>
                <option value="google_ads">Google Ads</option>
                <option value="whatsapp">WhatsApp Business</option>
                <option value="tiktok">TikTok</option>
                <option value="referidos">Referidos</option>
                <option value="tienda_fisica">Tienda Física</option>
              </select>
            </div>
          </div>

          {/* Ventas Filtradas Badge */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-[6px] bg-[#F6F8F7] dark:bg-slate-800 text-[12px] border border-[#E3E8E6] dark:border-slate-700 text-[#6B7280] self-start sm:self-auto">
            <span>Ventas del filtro:</span>
            <span className="font-semibold text-[#111827] dark:text-white [font-variant-numeric:tabular-nums]">
              {formatCurrencyUSD(marketingKPIs.totalVentas)}
            </span>
          </div>
        </div>

        {/* Pestañas con scroll horizontal y subrayado verde en la activa */}
        <div className="flex items-center gap-6 overflow-x-auto pb-1 text-[14px] no-scrollbar pt-2 border-t border-[#E3E8E6] dark:border-slate-800">
          {[
            { id: 'kpis', label: 'Indicadores clave (KPIs)', href: '#mkt-kpis' },
            { id: 'canales', label: 'Rendimiento por canal (ROAS)', href: '#mkt-canales' },
            { id: 'multivariable', label: 'Evolución multivariable', href: '#mkt-multivariable' },
            { id: 'vip', label: 'Top 10 clientes VIP', href: '#mkt-vip' },
            { id: 'productos', label: 'Productos y rentabilidad', href: '#mkt-productos' },
            { id: 'retencion', label: 'Retención y CRM', href: '#mkt-retencion' },
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

      {/* ==================================================== */}
      {/* SIMULADOR DE ROI DE CAMPAÑAS (COLAPSABLE) */}
      {/* ==================================================== */}
      {showRoiCalculator && (
        <div className="rounded-[8px] border border-[#E3E8E6] dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-none space-y-4">
          <div className="flex items-center justify-between border-b border-[#E3E8E6] dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-[6px] bg-teal-50 dark:bg-teal-950/60 border border-teal-200/80 dark:border-teal-800/80 flex items-center justify-center text-[#0F766E]">
                <Calculator className="w-3.5 h-3.5 stroke-[2]" />
              </div>
              <h3 className="text-[15px] font-semibold text-[#111827] dark:text-white">
                Simulador de inversión en publicidad & ROI comercial
              </h3>
            </div>
            <span className="text-[11px] font-medium text-[#0F766E] bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-800">
              Previsión predictiva
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
                Presupuesto en pauta ($ USD):
              </label>
              <input
                type="number"
                value={simBudget}
                onChange={(e) => setSimBudget(Math.max(10, Number(e.target.value)))}
                className="w-full px-3 py-1.5 rounded-[6px] bg-[#F6F8F7] dark:bg-slate-800 border border-[#E3E8E6] dark:border-slate-700 text-[13px] font-mono font-medium outline-none focus:border-[#0F766E]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
                Costo por lead estimado ($ CPL):
              </label>
              <input
                type="number"
                step="0.1"
                value={simCpl}
                onChange={(e) => setSimCpl(Math.max(0.1, Number(e.target.value)))}
                className="w-full px-3 py-1.5 rounded-[6px] bg-[#F6F8F7] dark:bg-slate-800 border border-[#E3E8E6] dark:border-slate-700 text-[13px] font-mono font-medium outline-none focus:border-[#0F766E]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
                Tasa de conversión a venta (%):
              </label>
              <input
                type="number"
                value={simConvRate}
                onChange={(e) => setSimConvRate(Math.max(1, Number(e.target.value)))}
                className="w-full px-3 py-1.5 rounded-[6px] bg-[#F6F8F7] dark:bg-slate-800 border border-[#E3E8E6] dark:border-slate-700 text-[13px] font-mono font-medium outline-none focus:border-[#0F766E]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
                Margen bruto de producto (%):
              </label>
              <input
                type="number"
                value={simMarginPct}
                onChange={(e) => setSimMarginPct(Math.max(5, Number(e.target.value)))}
                className="w-full px-3 py-1.5 rounded-[6px] bg-[#F6F8F7] dark:bg-slate-800 border border-[#E3E8E6] dark:border-slate-700 text-[13px] font-mono font-medium outline-none focus:border-[#0F766E]"
              />
            </div>
          </div>

          {/* Resultados de la Simulación */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
            <div className="p-3 rounded-[6px] bg-[#F6F8F7] dark:bg-slate-800/60 border border-[#E3E8E6] dark:border-slate-700">
              <span className="text-[11px] font-semibold text-[#6B7280] block">Leads Generados</span>
              <span className="text-[20px] font-semibold text-[#111827] dark:text-white [font-variant-numeric:tabular-nums] mt-0.5 block">{simulationResults.expectedLeads}</span>
            </div>
            <div className="p-3 rounded-[6px] bg-[#F6F8F7] dark:bg-slate-800/60 border border-[#E3E8E6] dark:border-slate-700">
              <span className="text-[11px] font-semibold text-[#6B7280] block">Clientes Ganados</span>
              <span className="text-[20px] font-semibold text-[#111827] dark:text-white [font-variant-numeric:tabular-nums] mt-0.5 block">{simulationResults.expectedNewCustomers}</span>
            </div>
            <div className="p-3 rounded-[6px] bg-[#F6F8F7] dark:bg-slate-800/60 border border-[#E3E8E6] dark:border-slate-700">
              <span className="text-[11px] font-semibold text-[#6B7280] block">Ventas Estimadas</span>
              <span className="text-[20px] font-semibold text-[#111827] dark:text-white [font-variant-numeric:tabular-nums] mt-0.5 block">{formatCurrencyUSD(simulationResults.projectedSales)}</span>
            </div>
            <div className="p-3 rounded-[6px] bg-[#F6F8F7] dark:bg-slate-800/60 border border-[#E3E8E6] dark:border-slate-700">
              <span className="text-[11px] font-semibold text-[#6B7280] block">Ganancia Neta</span>
              <span className="text-[20px] font-semibold text-[#059669] [font-variant-numeric:tabular-nums] mt-0.5 block">{formatCurrencyUSD(simulationResults.netProfit)}</span>
            </div>
            <div className="p-3 rounded-[6px] bg-[#F6F8F7] dark:bg-slate-800/60 border border-[#E3E8E6] dark:border-slate-700">
              <span className="text-[11px] font-semibold text-[#6B7280] block">ROAS Estimado</span>
              <span className="text-[20px] font-semibold text-[#0F766E] [font-variant-numeric:tabular-nums] mt-0.5 block">{simulationResults.projectedRoas.toFixed(2)}x</span>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TARJETA DESTACADA: ALERTA TÁCTICA DE MARKETING (4PX) */}
      {/* ---------------------------------------------------- */}
      <div className="p-5 rounded-[8px] bg-white dark:bg-slate-900 border border-[#E3E8E6] dark:border-slate-800 border-l-4 border-l-[#0F766E] shadow-none flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-150 hover:shadow-xs">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-teal-50 dark:bg-teal-950/60 flex items-center justify-center text-[#0F766E] shrink-0 mt-0.5">
            <Zap className="w-4 h-4 stroke-[1.75]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-semibold text-[#111827] dark:text-white">
                Oportunidad táctica de pauta & conversión comercial
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#0F766E] bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-full border border-teal-200 dark:border-teal-800">
                Canal líder: Meta Ads ({channelsData[0]?.roas || 4.2}x ROAS)
              </span>
            </div>
            <p className="text-[13px] text-[#6B7280] dark:text-slate-400 mt-0.5">
              El canal <strong>Meta Ads</strong> y <strong>WhatsApp Business</strong> concentran el 55% de la captación. Los clientes generan mayor facturación los días <strong>{salesByDayOfWeek.reduce((max, d) => (d.sales > max.sales ? d : max), salesByDayOfWeek[0]).name}</strong>. Se aconseja pautar 24h antes.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setShowRoiCalculator(!showRoiCalculator)}
            className="px-3 py-1.5 rounded-[6px] border border-[#E3E8E6] dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-[#F6F8F7] text-[#111827] dark:text-slate-200 text-[13px] font-medium transition cursor-pointer shadow-none"
          >
            {showRoiCalculator ? 'Ocultar simulador' : 'Simular presupuesto'}
          </button>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 3. MATRIZ DE KPIS COMERCIALES Y DE MARKETING */}
      {/* ==================================================== */}
      <section id="mkt-kpis" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-[#111827] dark:text-white">
            Indicadores comerciales & rendimiento de marketing
          </h2>
          <div className="text-[12px] text-[#6B7280] dark:text-slate-400 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#6B7280]" />
            <span>
              {mktDay !== 'all'
                ? `Día ${mktDay} de ${MKT_MONTHS.find((m) => m.key === mktMonth)?.name} ${mktYear}`
                : mktMonth !== 'all'
                ? `${MKT_MONTHS.find((m) => m.key === mktMonth)?.name} ${mktYear}`
                : `Ejercicio ${mktYear}`}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1: Ventas Totales */}
          <div className="p-5 rounded-[8px] bg-white dark:bg-slate-900 border border-[#E3E8E6] dark:border-slate-800 shadow-none transition-all duration-150 hover:shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-medium text-[#6B7280] dark:text-slate-400">
                  Ventas marketing
                </span>
                <div className="w-9 h-9 rounded-full bg-teal-50 dark:bg-teal-950/60 text-[#0F766E] flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 stroke-[1.75]" />
                </div>
              </div>
              <div className="text-[28px] font-semibold text-[#111827] dark:text-white [font-variant-numeric:tabular-nums] mt-1 leading-none">
                {formatCurrencyUSD(marketingKPIs.totalVentas)}
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-[12px]">
                <span className="text-[#059669] font-medium flex items-center">
                  ▲ +14.2%
                </span>
                <span className="text-[#6B7280] dark:text-slate-400">vs período anterior</span>
              </div>
            </div>
            {/* Sparkline mini-chart */}
            <div className="h-9 w-full mt-3 pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mktSparklines.ventas} margin={{ top: 2, right: 2, left: 2, bottom: 0 }}>
                  <Area type="monotone" dataKey="val" stroke="#0F766E" fill="#0F766E" fillOpacity={0.15} strokeWidth={2} dot={false} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* KPI 2: Ticket Promedio */}
          <div className="p-5 rounded-[8px] bg-white dark:bg-slate-900 border border-[#E3E8E6] dark:border-slate-800 shadow-none transition-all duration-150 hover:shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-medium text-[#6B7280] dark:text-slate-400">
                  Ticket promedio
                </span>
                <div className="w-9 h-9 rounded-full bg-teal-50 dark:bg-teal-950/60 text-[#0F766E] flex items-center justify-center">
                  <Receipt className="w-4 h-4 stroke-[1.75]" />
                </div>
              </div>
              <div className="text-[28px] font-semibold text-[#111827] dark:text-white [font-variant-numeric:tabular-nums] mt-1 leading-none">
                {formatCurrencyUSD(marketingKPIs.ticketPromedio)}
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-[12px]">
                <span className="text-[#059669] font-medium flex items-center">
                  ▲ +5.8%
                </span>
                <span className="text-[#6B7280] dark:text-slate-400">por transacción</span>
              </div>
            </div>
            {/* Sparkline mini-chart */}
            <div className="h-9 w-full mt-3 pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mktSparklines.ticket} margin={{ top: 2, right: 2, left: 2, bottom: 0 }}>
                  <Area type="monotone" dataKey="val" stroke="#0F766E" fill="#0F766E" fillOpacity={0.15} strokeWidth={2} dot={false} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* KPI 3: Clientes Activos */}
          <div className="p-5 rounded-[8px] bg-white dark:bg-slate-900 border border-[#E3E8E6] dark:border-slate-800 shadow-none transition-all duration-150 hover:shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-medium text-[#6B7280] dark:text-slate-400">
                  Clientes activos
                </span>
                <div className="w-9 h-9 rounded-full bg-teal-50 dark:bg-teal-950/60 text-[#0F766E] flex items-center justify-center">
                  <Users className="w-4 h-4 stroke-[1.75]" />
                </div>
              </div>
              <div className="text-[28px] font-semibold text-[#111827] dark:text-white [font-variant-numeric:tabular-nums] mt-1 leading-none">
                {marketingKPIs.uniqueCustomers}
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-[12px]">
                <span className="text-[#059669] font-medium flex items-center">
                  ▲ +8.1%
                </span>
                <span className="text-[#6B7280] dark:text-slate-400">compraron en período</span>
              </div>
            </div>
            {/* Sparkline mini-chart */}
            <div className="h-9 w-full mt-3 pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mktSparklines.clientes} margin={{ top: 2, right: 2, left: 2, bottom: 0 }}>
                  <Area type="monotone" dataKey="val" stroke="#0F766E" fill="#0F766E" fillOpacity={0.15} strokeWidth={2} dot={false} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* KPI 4: Tasa Recurrencia */}
          <div className="p-5 rounded-[8px] bg-white dark:bg-slate-900 border border-[#E3E8E6] dark:border-slate-800 shadow-none transition-all duration-150 hover:shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-medium text-[#6B7280] dark:text-slate-400">
                  Tasa de recurrencia
                </span>
                <div className="w-9 h-9 rounded-full bg-teal-50 dark:bg-teal-950/60 text-[#0F766E] flex items-center justify-center">
                  <Repeat className="w-4 h-4 stroke-[1.75]" />
                </div>
              </div>
              <div className="text-[28px] font-semibold text-[#111827] dark:text-white [font-variant-numeric:tabular-nums] mt-1 leading-none">
                {marketingKPIs.tasaRecurrencia.toFixed(1)}%
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-[12px]">
                <span className="text-[#059669] font-medium flex items-center">
                  ▲ +3.4%
                </span>
                <span className="text-[#6B7280] dark:text-slate-400">fidelización recurrente</span>
              </div>
            </div>
            {/* Sparkline mini-chart */}
            <div className="h-9 w-full mt-3 pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mktSparklines.recurrencia} margin={{ top: 2, right: 2, left: 2, bottom: 0 }}>
                  <Area type="monotone" dataKey="val" stroke="#0F766E" fill="#0F766E" fillOpacity={0.15} strokeWidth={2} dot={false} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* KPI 5: Inversión en Pauta */}
          <div className="p-5 rounded-[8px] bg-white dark:bg-slate-900 border border-[#E3E8E6] dark:border-slate-800 shadow-none transition-all duration-150 hover:shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-medium text-[#6B7280] dark:text-slate-400">
                  Inversión en pauta
                </span>
                <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-[#64748B] flex items-center justify-center">
                  <Megaphone className="w-4 h-4 stroke-[1.75]" />
                </div>
              </div>
              <div className="text-[28px] font-semibold text-[#111827] dark:text-white [font-variant-numeric:tabular-nums] mt-1 leading-none">
                {formatCurrencyUSD(marketingKPIs.inversionPublicitaria)}
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-[12px]">
                <span className="text-[#64748B] font-medium flex items-center">
                  {((marketingKPIs.inversionPublicitaria / Math.max(1, marketingKPIs.totalVentas)) * 100).toFixed(1)}%
                </span>
                <span className="text-[#6B7280] dark:text-slate-400">del total facturado</span>
              </div>
            </div>
            {/* Sparkline mini-chart */}
            <div className="h-9 w-full mt-3 pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mktSparklines.inversion} margin={{ top: 2, right: 2, left: 2, bottom: 0 }}>
                  <Area type="monotone" dataKey="val" stroke="#64748B" fill="#64748B" fillOpacity={0.15} strokeWidth={2} dot={false} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* KPI 6: CAC */}
          <div className="p-5 rounded-[8px] bg-white dark:bg-slate-900 border border-[#E3E8E6] dark:border-slate-800 shadow-none transition-all duration-150 hover:shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-medium text-[#6B7280] dark:text-slate-400">
                  CAC estimado
                </span>
                <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-[#64748B] flex items-center justify-center">
                  <Target className="w-4 h-4 stroke-[1.75]" />
                </div>
              </div>
              <div className="text-[28px] font-semibold text-[#111827] dark:text-white [font-variant-numeric:tabular-nums] mt-1 leading-none">
                {formatCurrencyUSD(marketingKPIs.cac)}
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-[12px]">
                <span className="text-[#059669] font-medium flex items-center">
                  ▼ -4.5%
                </span>
                <span className="text-[#6B7280] dark:text-slate-400">costo por adquisición</span>
              </div>
            </div>
            {/* Sparkline mini-chart */}
            <div className="h-9 w-full mt-3 pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mktSparklines.cac} margin={{ top: 2, right: 2, left: 2, bottom: 0 }}>
                  <Area type="monotone" dataKey="val" stroke="#64748B" fill="#64748B" fillOpacity={0.15} strokeWidth={2} dot={false} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* KPI 7: LTV */}
          <div className="p-5 rounded-[8px] bg-white dark:bg-slate-900 border border-[#E3E8E6] dark:border-slate-800 shadow-none transition-all duration-150 hover:shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-medium text-[#6B7280] dark:text-slate-400">
                  LTV promedio
                </span>
                <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-[#059669] flex items-center justify-center">
                  <DollarSign className="w-4 h-4 stroke-[1.75]" />
                </div>
              </div>
              <div className="text-[28px] font-semibold text-[#059669] [font-variant-numeric:tabular-nums] mt-1 leading-none">
                {formatCurrencyUSD(marketingKPIs.ltvPromedio)}
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-[12px]">
                <span className="text-[#059669] font-medium flex items-center">
                  ▲ +11.2%
                </span>
                <span className="text-[#6B7280] dark:text-slate-400">ciclo de vida</span>
              </div>
            </div>
            {/* Sparkline mini-chart */}
            <div className="h-9 w-full mt-3 pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mktSparklines.ltv} margin={{ top: 2, right: 2, left: 2, bottom: 0 }}>
                  <Area type="monotone" dataKey="val" stroke="#059669" fill="#059669" fillOpacity={0.15} strokeWidth={2} dot={false} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* KPI 8: ROAS Global */}
          <div className="p-5 rounded-[8px] bg-white dark:bg-slate-900 border border-[#E3E8E6] dark:border-slate-800 shadow-none transition-all duration-150 hover:shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-medium text-[#6B7280] dark:text-slate-400">
                  ROAS global
                </span>
                <div className="w-9 h-9 rounded-full bg-teal-50 dark:bg-teal-950/60 text-[#0F766E] flex items-center justify-center">
                  <Award className="w-4 h-4 stroke-[1.75]" />
                </div>
              </div>
              <div className="text-[28px] font-semibold text-[#0F766E] [font-variant-numeric:tabular-nums] mt-1 leading-none">
                {marketingKPIs.roas.toFixed(1)}x
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-[12px]">
                <span className="text-[#059669] font-medium flex items-center">
                  ▲ +0.6x
                </span>
                <span className="text-[#6B7280] dark:text-slate-400">retorno por cada $1 en pauta</span>
              </div>
            </div>
            {/* Sparkline mini-chart */}
            <div className="h-9 w-full mt-3 pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mktSparklines.roas} margin={{ top: 2, right: 2, left: 2, bottom: 0 }}>
                  <Area type="monotone" dataKey="val" stroke="#0F766E" fill="#0F766E" fillOpacity={0.15} strokeWidth={2} dot={false} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================== */}
      {/* 4. SECCIÓN: GRÁFICO AUTÓNOMO DE LAS 4 VARIABLES FINANCIERAS */}
      {/* ==================================================== */}
      <div className="rounded-[8px] border border-[#E3E8E6] dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-none transition-all duration-150 hover:shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E3E8E6] dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-50 dark:bg-teal-950/60 text-[#0F766E] dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                Filtro autónomo
              </span>
              <span className="text-[12px] text-[#6B7280]">Evolución multivariable</span>
            </div>
            <h2 className="text-[16px] font-semibold text-[#111827] dark:text-white mt-1">
              Evolución financiera multivariable (Ventas, Egresos, Utilidad Neta & Flujo)
            </h2>
            <p className="text-[12px] text-[#6B7280] dark:text-slate-400 mt-0.5">
              Analiza cómo el esfuerzo comercial se traduce en ingresos, absorción de egresos, ganancia líquida y flujo libre.
            </p>
          </div>

          {/* Selector de Sucursal del Gráfico */}
          <div className="flex items-center rounded-[6px] border border-[#E3E8E6] dark:border-slate-700 bg-[#F6F8F7] dark:bg-slate-800 pl-2.5 pr-2 py-1 gap-2 self-start md:self-auto">
            <Building2 className="w-3.5 h-3.5 text-[#0F766E] shrink-0" />
            <span className="text-[11px] font-semibold uppercase text-[#6B7280]">Sucursal:</span>
            <div className="h-4 w-[1px] bg-[#E3E8E6] dark:bg-slate-700" />
            <select
              value={chartBranchId}
              onChange={(e) => setChartBranchId(e.target.value)}
              className="bg-transparent text-[13px] font-medium text-[#111827] dark:text-slate-100 outline-none cursor-pointer"
            >
              <option value="all">Consolidado global</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <HistoricalFinancialAnalytics
          invoices={chartFilteredInvoices}
          purchases={chartFilteredPurchases}
          otherIncomes={chartFilteredOtherIncomes}
          employees={employees}
          fiscalConfig={fiscalConfig}
          selectedBranchName={
            chartBranchId === 'all'
              ? 'Consolidado Global (Todas las Sucursales)'
              : branches.find((b) => b.id === chartBranchId)?.name || 'Sucursal Seleccionada'
          }
        />
      </div>

      {/* ==================================================== */}
      {/* 5. CANALES DE CAPTACIÓN & RENDIMIENTO DE PAUTA (ROAS) */}
      {/* ==================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Gráfico Comparativo de Canales */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-[8px] border border-[#E3E8E6] dark:border-slate-800 shadow-none transition-all duration-150 hover:shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#E3E8E6] dark:border-slate-800">
            <div>
              <h3 className="text-[15px] font-semibold text-[#111827] dark:text-white">
                Rendimiento por canal de marketing
              </h3>
              <p className="text-[12px] text-[#6B7280]">
                Inversión en pauta publicitaria vs Ingresos por ventas generadas ($ USD)
              </p>
            </div>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#F6F8F7] dark:bg-slate-800 border border-[#E3E8E6] text-[#6B7280]">
              Canales activos
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelsData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E3E8E6" opacity={0.6} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} stroke="#E3E8E6" />
                <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} stroke="#E3E8E6" tickFormatter={(v) => `$${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
                <Tooltip
                  formatter={(val: any, name: any) => [
                    `$${Number(val).toLocaleString()}`,
                    name === 'sales' ? 'Ventas Generadas' : 'Inversión en Pauta',
                  ]}
                />
                <Legend
                  wrapperStyle={{ fontSize: 12, color: '#6B7280' }}
                  formatter={(value) => (value === 'sales' ? 'Ventas Generadas ($)' : 'Inversión en Pauta ($)')}
                />
                <Bar dataKey="sales" fill="#0F766E" radius={[4, 4, 0, 0]} />
                <Bar dataKey="spend" fill="#64748B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tabla Detallada de Canales con ROAS */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-[8px] border border-[#E3E8E6] dark:border-slate-800 shadow-none transition-all duration-150 hover:shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E3E8E6] dark:border-slate-800">
              <h3 className="text-[15px] font-semibold text-[#111827] dark:text-white">
                Eficacia & ROAS por canal
              </h3>
              <span className="text-[12px] text-[#6B7280]">Retorno pauta</span>
            </div>

            <div className="space-y-2 overflow-y-auto max-h-72 pr-1">
              {channelsData.map((c) => (
                <div
                  key={c.id}
                  className="p-3 rounded-[6px] bg-[#F6F8F7] dark:bg-slate-800/60 border border-[#E3E8E6] dark:border-slate-700 flex items-center justify-between text-[12px]"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                    <div>
                      <span className="font-semibold text-[#111827] dark:text-white block">{c.name}</span>
                      <span className="text-[11px] text-[#6B7280] font-mono">
                        {c.leads} leads • {c.orders} ventas
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-semibold text-[#111827] dark:text-white font-mono block">
                      {formatCurrencyUSD(c.sales)}
                    </span>
                    <span className="text-[10px] font-medium text-[#0F766E] bg-teal-50 dark:bg-teal-950/60 px-1.5 py-0.5 rounded border border-teal-200">
                      ROAS {c.roas}x
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-[#E3E8E6] dark:border-slate-800 text-[12px] text-[#6B7280] flex items-center justify-between">
            <span>Meta Ads y WhatsApp concentran el 55% de la captación.</span>
            <span className="font-semibold text-[#0F766E]">Prioritario</span>
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 6. TOP 10 CLIENTES VIP & SEGMENTACIÓN COMERCIAL */}
      {/* ==================================================== */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[8px] border border-[#E3E8E6] dark:border-slate-800 shadow-none transition-all duration-150 hover:shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#E3E8E6] dark:border-slate-800">
          <div>
            <h3 className="text-[16px] font-semibold text-[#111827] dark:text-white">
              Top 10 clientes VIP (Mayor facturación & fidelidad)
            </h3>
            <p className="text-[12px] text-[#6B7280]">
              Ranking de clientes que mayor volumen de compras y frecuencia aportan a la empresa
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={vipSearchQuery}
                onChange={(e) => setVipSearchQuery(e.target.value)}
                placeholder="Buscar cliente VIP..."
                className="pl-8 pr-3 py-1 text-[13px] rounded-[6px] bg-[#F6F8F7] dark:bg-slate-800 border border-[#E3E8E6] dark:border-slate-700 outline-none w-52 focus:w-64 transition-all font-medium focus:border-[#0F766E]"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-[#E3E8E6] dark:border-slate-800 text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider bg-[#F6F8F7] dark:bg-slate-800/40">
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Cliente</th>
                <th className="py-2.5 px-3">Tipo</th>
                <th className="py-2.5 px-3">Canal Entrada</th>
                <th className="py-2.5 px-3 text-right">Facturación Total</th>
                <th className="py-2.5 px-3 text-center">Compras</th>
                <th className="py-2.5 px-3 text-right">Ticket Medio</th>
                <th className="py-2.5 px-3 text-center">Última Compra</th>
                <th className="py-2.5 px-3 text-center">Nivel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3E8E6] dark:divide-slate-800">
              {top10Customers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-[#6B7280]">
                    No se encontraron clientes con compras en el filtro activo.
                  </td>
                </tr>
              ) : (
                top10Customers.map((c, idx) => (
                  <tr key={c.id} className="hover:bg-[#F6F8F7]/60 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3 font-mono font-medium text-[#6B7280]">{idx + 1}</td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-[#111827] dark:text-white block">{c.name}</span>
                      <span className="text-[11px] text-[#6B7280] font-mono">ID: {c.id.slice(0, 8)}...</span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                          c.isCorp
                            ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200'
                            : 'bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border-teal-200'
                        }`}
                      >
                        {c.isCorp ? 'Empresa B2B' : 'Persona'}
                      </span>
                    </td>
                    <td className="py-3 px-3 capitalize text-[#6B7280]">{c.channel}</td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-[#111827] dark:text-white">
                      {formatCurrencyUSD(c.total)}
                    </td>
                    <td className="py-3 px-3 text-center font-semibold text-[#0F766E] font-mono">
                      {c.count} pedidos
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-[#6B7280]">
                      {formatCurrencyUSD(c.avgTicket)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="font-mono text-[#111827] dark:text-slate-300 block">{c.lastDate || 'N/D'}</span>
                      <span className="text-[10px] text-[#6B7280]">hace {c.daysSinceLast} días</span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${c.segmentBadge}`}>
                        {c.segmentLabel}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 7. PRODUCTOS ESTRELLA (MARGEN) & HÁBITOS DE COMPRA SEMANALES */}
      {/* ==================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Productos por Margen Comercial */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[8px] border border-[#E3E8E6] dark:border-slate-800 shadow-none transition-all duration-150 hover:shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#E3E8E6] dark:border-slate-800">
            <div>
              <h3 className="text-[15px] font-semibold text-[#111827] dark:text-white">
                Top productos con mayor margen comercial
              </h3>
              <p className="text-[12px] text-[#6B7280]">
                Productos más rentables para priorizar en pautas publicitarias
              </p>
            </div>
            <span className="text-[11px] font-medium text-[#059669] bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-200">
              Mayor rentabilidad
            </span>
          </div>

          <div className="space-y-2">
            {top10ProductsMargin.length === 0 ? (
              <div className="py-8 text-center text-[#6B7280] text-[13px]">No hay ventas registradas en el período.</div>
            ) : (
              top10ProductsMargin.map((p, idx) => (
                <div
                  key={p.id}
                  className="p-3 rounded-[6px] bg-[#F6F8F7] dark:bg-slate-800/60 border border-[#E3E8E6] dark:border-slate-700 flex items-center justify-between text-[12px]"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-medium text-[#6B7280] w-5">{idx + 1}</span>
                    <div>
                      <span className="font-semibold text-[#111827] dark:text-white block">{p.name}</span>
                      <span className="text-[11px] text-[#6B7280] font-mono">
                        {p.qty} unidades vendidas • Ventas: {formatCurrencyUSD(p.sales)}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-semibold text-[#059669] font-mono block">
                      +{formatCurrencyUSD(p.totalMarginDollar)}
                    </span>
                    <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-200">
                      {p.marginPct}% margen
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Ventas por Día de la Semana */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[8px] border border-[#E3E8E6] dark:border-slate-800 shadow-none transition-all duration-150 hover:shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#E3E8E6] dark:border-slate-800">
            <div>
              <h3 className="text-[15px] font-semibold text-[#111827] dark:text-white">
                Hábitos de compra: Ventas por día
              </h3>
              <p className="text-[12px] text-[#6B7280]">
                Distribución de facturación de lunes a domingo para programar campañas
              </p>
            </div>
            <span className="text-[11px] font-medium text-[#6B7280] bg-[#F6F8F7] dark:bg-slate-800 px-2 py-0.5 rounded border border-[#E3E8E6]">
              Semanal
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesByDayOfWeek} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E3E8E6" opacity={0.6} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#6B7280' }} stroke="#E3E8E6" />
                <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} stroke="#E3E8E6" tickFormatter={(v) => `$${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
                <Tooltip formatter={(v: any) => [`$${Number(v).toLocaleString()}`, 'Ventas Totales']} />
                <Bar dataKey="sales" fill="#0F766E" radius={[4, 4, 0, 0]}>
                  {salesByDayOfWeek.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.sales === Math.max(...salesByDayOfWeek.map((d) => d.sales)) ? '#0F766E' : '#64748B'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="p-3 rounded-[6px] bg-[#F6F8F7] dark:bg-slate-800 border border-[#E3E8E6] dark:border-slate-700 text-[12px] text-[#6B7280]">
            💡 <strong>Estrategia Comercial:</strong> El día más fuerte de venta es el{' '}
            <strong className="text-[#111827] dark:text-white">
              {salesByDayOfWeek.reduce((max, d) => (d.sales > max.sales ? d : max), salesByDayOfWeek[0]).name}
            </strong>. Se recomienda pautar 24 horas antes para calentar audiencia.
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 8. RETENCIÓN & SEMÁFORO DE CHURN + SEGMENTACIÓN CRM */}
      {/* ==================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Semáforo de Retención / Churn */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[8px] border border-[#E3E8E6] dark:border-slate-800 shadow-none transition-all duration-150 hover:shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#E3E8E6] dark:border-slate-800">
            <div>
              <h3 className="text-[15px] font-semibold text-[#111827] dark:text-white">
                Semáforo de retención & riesgo de inactividad
              </h3>
              <p className="text-[12px] text-[#6B7280]">
                Segmentación según los días transcurridos desde su última compra
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={churnAnalysis}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={75}
                    innerRadius={45}
                    paddingAngle={3}
                  >
                    {churnAnalysis.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any) => [`${v} clientes`, 'Cantidad']} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2">
              {churnAnalysis.map((item) => (
                <div key={item.name} className="p-2.5 rounded-[6px] border border-[#E3E8E6] dark:border-slate-800 text-[12px] bg-[#F6F8F7] dark:bg-slate-800/40">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#111827] dark:text-white flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span>{item.name}</span>
                    </span>
                    <span className="font-mono font-semibold text-[#111827] dark:text-white">{item.value}</span>
                  </div>
                  <span className="text-[10px] text-[#6B7280] block mt-1">Acción: {item.action}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dynamic CRM Widgets */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[8px] border border-[#E3E8E6] dark:border-slate-800 shadow-none transition-all duration-150 hover:shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#E3E8E6] dark:border-slate-800">
            <div>
              <h3 className="text-[15px] font-semibold text-[#111827] dark:text-white">
                Segmentación demográfica & CRM
              </h3>
              <p className="text-[12px] text-[#6B7280]">
                Distribución de clientes por perfil empresarial y género
              </p>
            </div>
            <button
              onClick={() => setIsChartBuilderOpen(true)}
              className="p-1.5 rounded-[6px] bg-[#F6F8F7] dark:bg-slate-800 text-[#0F766E] hover:bg-teal-50 border border-[#E3E8E6] transition cursor-pointer"
              title="Añadir nuevo widget demográfico"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {(dynamicWidgets || []).slice(0, 2).map((widget) => (
              <div key={widget.id} className="p-3.5 rounded-[6px] bg-[#F6F8F7] dark:bg-slate-800/60 border border-[#E3E8E6] dark:border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[12px] font-semibold text-[#111827] dark:text-white">{widget.title}</h4>
                  <button
                    onClick={() => deleteDynamicWidget(widget.id)}
                    className="text-[#6B7280] hover:text-rose-600 p-1 cursor-pointer transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="h-36 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={widget.data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E3E8E6" opacity={0.6} />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6B7280' }} stroke="#E3E8E6" />
                      <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} stroke="#E3E8E6" />
                      <Tooltip formatter={(v: any) => [`$${Number(v).toLocaleString()}`, 'Total']} />
                      <Bar dataKey="value" fill="#0F766E" radius={[4, 4, 0, 0]}>
                        {(widget.data || []).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#0F766E' : '#64748B'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal para Crear Gráficos Dinámicos Personalizados */}
      <DynamicChartBuilderModal
        isOpen={isChartBuilderOpen}
        onClose={() => setIsChartBuilderOpen(false)}
      />
    </div>
  );
};
