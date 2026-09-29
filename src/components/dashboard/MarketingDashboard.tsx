import React, { useState, useMemo } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  Target,
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

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#6366f1', '#3b82f6', '#14b8a6'];

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
  } = useERP();

  // ----------------------------------------------------
  // FILTROS PRINCIPALES AUTÓNOMOS DEL DASHBOARD DE MARKETING
  // ----------------------------------------------------
  const [mktBranchId, setMktBranchId] = useState<string>('all');
  const [mktPeriodType, setMktPeriodType] = useState<'todo' | 'ano' | 'mes' | 'dia'>('todo');
  const [mktYear, setMktYear] = useState<number>(2026);
  const [mktMonth, setMktMonth] = useState<string>('09');
  const [mktDay, setMktDay] = useState<string>('28');
  const [mktChannel, setMktChannel] = useState<string>('all');
  const [mktCustomerType, setMktCustomerType] = useState<string>('all');
  const [vipSearchQuery, setVipSearchQuery] = useState<string>('');
  const [isChartBuilderOpen, setIsChartBuilderOpen] = useState(false);
  const [showRoiCalculator, setShowRoiCalculator] = useState(false);

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

  // Helper date checker for main marketing dashboard
  const matchesMktDate = (dateStr?: string) => {
    if (!dateStr) return false;
    if (mktPeriodType === 'todo') return true;
    if (mktPeriodType === 'ano') return dateStr.startsWith(String(mktYear));
    if (mktPeriodType === 'mes') return dateStr.startsWith(`${mktYear}-${mktMonth}`);
    if (mktPeriodType === 'dia') return dateStr === `${mktYear}-${mktMonth}-${mktDay.padStart(2, '0')}`;
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
  }, [invoices, mktBranchId, branches, mktPeriodType, mktYear, mktMonth, mktDay, mktChannel, mktCustomerType, customers]);

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

  // ----------------------------------------------------
  // 2. DESGLOSE POR CANALES DE MARKETING Y RETORNO (ROAS)
  // ----------------------------------------------------
  const channelsData = useMemo(() => {
    const rawChannels = [
      { id: 'meta_ads', name: 'Meta Ads (FB/IG)', baseSpend: 280, share: 0.35, color: '#8b5cf6' },
      { id: 'google_ads', name: 'Google Ads (Search/Maps)', baseSpend: 190, share: 0.24, color: '#3b82f6' },
      { id: 'whatsapp', name: 'WhatsApp Business Directo', baseSpend: 60, share: 0.20, color: '#10b981' },
      { id: 'tiktok', name: 'TikTok Ads & Viral', baseSpend: 90, share: 0.11, color: '#ec4899' },
      { id: 'referidos', name: 'Referidos / Boca a Boca', baseSpend: 30, share: 0.07, color: '#f59e0b' },
      { id: 'tienda_fisica', name: 'Orgánico / Tienda Física', baseSpend: 20, share: 0.03, color: '#06b6d4' },
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
      let segmentBadge = 'bg-amber-100 text-amber-800 border-amber-300';
      if (stats.total >= 1000 || stats.count >= 6) {
        segmentLabel = 'Oro VIP';
        segmentBadge = 'bg-purple-100 text-purple-800 border-purple-300';
      } else if (stats.total >= 400 || stats.count >= 3) {
        segmentLabel = 'Plata';
        segmentBadge = 'bg-slate-100 text-slate-800 border-slate-300';
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
      { name: 'Activos (<30d)', value: activos, color: '#10b981', action: 'Programa de Fidelización' },
      { name: 'En Riesgo (31-60d)', value: enRiesgo, color: '#f59e0b', action: 'Cupón de Reactivación WhatsApp' },
      { name: 'Inactivos (61-90d)', value: inactivos, color: '#f97316', action: 'Campaña con Oferta Especial' },
      { name: 'Perdidos (>90d)', value: perdidos, color: '#ef4444', action: 'Encuesta de Satisfacción / Retoma' },
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
    <div className="space-y-6 max-w-7xl mx-auto p-4 lg:p-6 pb-20">
      {/* ==================================================== */}
      {/* 1. CABECERA EJECUTIVA DE MARKETING & COMERCIAL */}
      {/* ==================================================== */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden">
        {/* Decoración de fondo */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-40 -bottom-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-800/80 border border-purple-600/60 text-purple-200 text-xs font-bold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-purple-300" />
              <span>{currentCompany?.tradeName || currentCompany?.name} • Inteligencia Comercial & Marketing</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <span>Dashboard de Marketing & Análisis Histórico</span>
            </h1>
            <p className="text-purple-200/90 text-xs sm:text-sm mt-1.5 max-w-3xl leading-relaxed">
              Monitorea canales de captación, CAC, LTV, ROAS publicitario, retención de clientes, hábitos de compra y la relación entre las 4 variables financieras con controles autónomos.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setShowRoiCalculator(!showRoiCalculator)}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-95 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition cursor-pointer"
            >
              <Calculator className="w-4 h-4 text-purple-200" />
              <span>{showRoiCalculator ? 'Ocultar Simulador' : 'Simulador de Campañas ROI'}</span>
            </button>

            <button
              onClick={() => setIsChartBuilderOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-bold flex items-center gap-2 border border-white/20 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Añadir Gráfico</span>
            </button>
          </div>
        </div>

        {/* ==================================================== */}
        {/* BARRA DE FILTROS AUTÓNOMOS DEL DASHBOARD DE MARKETING */}
        {/* ==================================================== */}
        <div className="mt-6 pt-5 border-t border-purple-700/50">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-purple-500/30 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Sucursal */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-xs">
                <Building className="w-4 h-4 text-purple-300" />
                <span className="font-bold text-purple-200 text-[11px]">Sucursal:</span>
                <select
                  value={mktBranchId}
                  onChange={(e) => setMktBranchId(e.target.value)}
                  className="bg-transparent border-none text-xs font-bold outline-none text-white cursor-pointer"
                >
                  <option value="all" className="text-slate-900">🏢 Todas las Sucursales</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id} className="text-slate-900">
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Período */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-xs">
                <Calendar className="w-4 h-4 text-purple-300" />
                <span className="font-bold text-purple-200 text-[11px]">Alcance:</span>
                <select
                  value={mktPeriodType}
                  onChange={(e) => setMktPeriodType(e.target.value as any)}
                  className="bg-transparent border-none text-xs font-bold outline-none text-white cursor-pointer"
                >
                  <option value="todo" className="text-slate-900">Todo el Histórico</option>
                  <option value="ano" className="text-slate-900">Por Año</option>
                  <option value="mes" className="text-slate-900">Por Mes</option>
                  <option value="dia" className="text-slate-900">Por Día Específico</option>
                </select>
              </div>

              {/* Año */}
              {mktPeriodType !== 'todo' && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-xs">
                  <span className="font-bold text-purple-200 text-[11px]">Año:</span>
                  <select
                    value={mktYear}
                    onChange={(e) => setMktYear(Number(e.target.value))}
                    className="bg-transparent border-none text-xs font-bold outline-none text-white cursor-pointer"
                  >
                    {MKT_YEARS.map((yr) => (
                      <option key={yr} value={yr} className="text-slate-900">
                        {yr}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Mes */}
              {(mktPeriodType === 'mes' || mktPeriodType === 'dia') && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-xs">
                  <span className="font-bold text-purple-200 text-[11px]">Mes:</span>
                  <select
                    value={mktMonth}
                    onChange={(e) => setMktMonth(e.target.value)}
                    className="bg-transparent border-none text-xs font-bold outline-none text-white cursor-pointer"
                  >
                    {MKT_MONTHS.map((m) => (
                      <option key={m.key} value={m.key} className="text-slate-900">
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Día */}
              {mktPeriodType === 'dia' && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-xs">
                  <span className="font-bold text-purple-200 text-[11px]">Día:</span>
                  <select
                    value={mktDay}
                    onChange={(e) => setMktDay(e.target.value)}
                    className="bg-transparent border-none text-xs font-bold outline-none text-white cursor-pointer"
                  >
                    {Array.from({ length: 31 }, (_, idx) => String(idx + 1)).map((d) => (
                      <option key={d} value={d} className="text-slate-900">
                        Día {d}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Canal de Captación */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-xs">
                <Megaphone className="w-4 h-4 text-purple-300" />
                <span className="font-bold text-purple-200 text-[11px]">Canal:</span>
                <select
                  value={mktChannel}
                  onChange={(e) => setMktChannel(e.target.value)}
                  className="bg-transparent border-none text-xs font-bold outline-none text-white cursor-pointer"
                >
                  <option value="all" className="text-slate-900">📣 Todos los Canales</option>
                  <option value="meta_ads" className="text-slate-900">Meta Ads (FB/IG)</option>
                  <option value="google_ads" className="text-slate-900">Google Ads</option>
                  <option value="whatsapp" className="text-slate-900">WhatsApp Business</option>
                  <option value="tiktok" className="text-slate-900">TikTok</option>
                  <option value="referidos" className="text-slate-900">Referidos</option>
                  <option value="tienda_fisica" className="text-slate-900">Tienda Física</option>
                </select>
              </div>
            </div>

            <div className="text-xs font-bold text-purple-200 bg-purple-950/60 px-3.5 py-1.5 rounded-xl border border-purple-500/40">
              Ventas Filtradas: <span className="font-mono text-sm text-white font-black">{formatCurrencyUSD(marketingKPIs.totalVentas)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* SIMULADOR DE ROI DE CAMPAÑAS (COLAPSABLE) */}
      {/* ==================================================== */}
      {showRoiCalculator && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-purple-200 dark:border-purple-800 shadow-md animate-in fade-in slide-in-from-top-4 duration-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-purple-600" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Simulador de Inversión en Publicidad & ROI Comercial
              </h3>
            </div>
            <span className="text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 px-2.5 py-1 rounded-lg">
              Previsión Predictiva
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500">Presupuesto en Pauta ($ USD):</label>
              <input
                type="number"
                value={simBudget}
                onChange={(e) => setSimBudget(Math.max(10, Number(e.target.value)))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500">Costo por Lead estimado ($ CPL):</label>
              <input
                type="number"
                step="0.1"
                value={simCpl}
                onChange={(e) => setSimCpl(Math.max(0.1, Number(e.target.value)))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500">Tasa de Conversión a Venta (%):</label>
              <input
                type="number"
                value={simConvRate}
                onChange={(e) => setSimConvRate(Math.max(1, Number(e.target.value)))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500">Margen Bruto de Producto (%):</label>
              <input
                type="number"
                value={simMarginPct}
                onChange={(e) => setSimMarginPct(Math.max(5, Number(e.target.value)))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold"
              />
            </div>
          </div>

          {/* Resultados de la Simulación */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
            <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800">
              <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 block">Leads Generados</span>
              <span className="text-xl font-black text-slate-900 dark:text-white font-mono mt-0.5 block">{simulationResults.expectedLeads}</span>
            </div>
            <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800">
              <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 block">Clientes Ganados</span>
              <span className="text-xl font-black text-slate-900 dark:text-white font-mono mt-0.5 block">{simulationResults.expectedNewCustomers}</span>
            </div>
            <div className="p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800">
              <span className="text-[10px] font-bold text-sky-700 dark:text-sky-300 block">Ventas Brutas Estimadas</span>
              <span className="text-xl font-black text-slate-900 dark:text-white font-mono mt-0.5 block">{formatCurrencyUSD(simulationResults.projectedSales)}</span>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 block">Ganancia Líquida Neta</span>
              <span className="text-xl font-black text-emerald-700 dark:text-emerald-400 font-mono mt-0.5 block">{formatCurrencyUSD(simulationResults.netProfit)}</span>
            </div>
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 block">ROAS Estimado</span>
              <span className="text-xl font-black text-amber-700 dark:text-amber-400 font-mono mt-0.5 block">{simulationResults.projectedRoas.toFixed(2)}x</span>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 2. MATRIZ DE KPIS COMERCIALES Y DE MARKETING */}
      {/* ==================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* Ventas Totales */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ventas Mkt</span>
          <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-mono mt-0.5 block truncate">
            {formatCurrencyUSD(marketingKPIs.totalVentas)}
          </span>
          <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">
            {marketingKPIs.totalTransacciones} tickets
          </span>
        </div>

        {/* Ticket Promedio */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ticket Medio</span>
          <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-mono mt-0.5 block truncate">
            {formatCurrencyUSD(marketingKPIs.ticketPromedio)}
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Por transacción</span>
        </div>

        {/* Clientes Activos */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Clientes Activos</span>
          <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-mono mt-0.5 block">
            {marketingKPIs.uniqueCustomers}
          </span>
          <span className="text-[10px] text-purple-600 font-bold block mt-0.5">Compraron en período</span>
        </div>

        {/* Tasa Recurrencia */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Recurrencia</span>
          <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-mono mt-0.5 block">
            {marketingKPIs.tasaRecurrencia.toFixed(1)}%
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Clientes frecuentes</span>
        </div>

        {/* Inversión en Pauta */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Gasto Pauta</span>
          <span className="text-lg sm:text-xl font-black text-purple-600 dark:text-purple-400 font-mono mt-0.5 block truncate">
            {formatCurrencyUSD(marketingKPIs.inversionPublicitaria)}
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Inversión mensual</span>
        </div>

        {/* CAC */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">CAC Estimado</span>
          <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-mono mt-0.5 block truncate">
            {formatCurrencyUSD(marketingKPIs.cac)}
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Costo por cliente</span>
        </div>

        {/* LTV */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">LTV Promedio</span>
          <span className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 block truncate">
            {formatCurrencyUSD(marketingKPIs.ltvPromedio)}
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Valor de vida</span>
        </div>

        {/* ROAS Global */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ROAS Global</span>
          <span className="text-lg sm:text-xl font-black text-indigo-600 dark:text-indigo-400 font-mono mt-0.5 block truncate">
            {marketingKPIs.roas.toFixed(1)}x
          </span>
          <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">Retorno de pauta</span>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 3. SECCIÓN REQUERIDA: GRÁFICO AUTÓNOMO DE LAS 4 VARIABLES FINANCIERAS */}
      {/* CON SU PROPIO FILTRO INDEPENDIENTE (SUCURSAL, TIEMPO, MÉTRICAS Y TABLA) */}
      {/* ==================================================== */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-purple-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 text-[10px] font-black uppercase mb-1">
              Filtro Autónomo e Independiente
            </div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <span>Evolución Financiera Multivariable (Ventas, Egresos, Utilidad Neta & Flujo)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Analiza cómo el esfuerzo comercial se traduce en ingresos, absorción de egresos, ganancia líquida real y flujo libre para reinversión.
            </p>
          </div>

          {/* Selector de Sucursal exclusivo de este gráfico */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
            <Building className="w-4 h-4 text-purple-600 shrink-0" />
            <span className="font-bold text-slate-500 text-[11px]">Sucursal del Gráfico:</span>
            <select
              value={chartBranchId}
              onChange={(e) => setChartBranchId(e.target.value)}
              className="bg-transparent border-none text-xs font-bold outline-none text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              <option value="all">🏢 Consolidado (Todas las Sucursales)</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Componente Autónomo de las 4 Variables con sus propios botones de Año, Mes, Modo Barras/Líneas/Áreas, Tabla y CSV */}
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
      {/* 4. CANALES DE CAPTACIÓN & RENDIMIENTO DE PAUTA (ROAS) */}
      {/* ==================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Gráfico Comparativo de Canales */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Share2 className="w-5 h-5 text-purple-600" />
                <span>Rendimiento por Canal de Marketing</span>
              </h3>
              <p className="text-xs text-slate-500">
                Inversión en pauta publicitaria vs Ingresos por ventas generadas ($ USD)
              </p>
            </div>
            <span className="text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 px-2.5 py-1 rounded-xl">
              Canales Comerciales
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelsData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(val: any, name: any) => [
                    `$${Number(val).toLocaleString()}`,
                    name === 'sales' ? 'Ventas Generadas' : 'Inversión Publicitaria',
                  ]}
                />
                <Legend
                  formatter={(value) => (value === 'sales' ? 'Ventas Generadas ($)' : 'Inversión en Pauta ($)')}
                />
                <Bar dataKey="sales" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                <Bar dataKey="spend" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tabla Detallada de Canales con ROAS */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-600" />
                <span>Eficacia & ROAS por Canal</span>
              </h3>
              <span className="text-[11px] font-bold text-slate-400">Retorno Pauta</span>
            </div>

            <div className="space-y-2.5 overflow-y-auto max-h-72 pr-1">
              {channelsData.map((c) => (
                <div
                  key={c.id}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">{c.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {c.leads} leads • {c.orders} ventas
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-black text-slate-900 dark:text-white font-mono block">
                      {formatCurrencyUSD(c.sales)}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.2 rounded">
                      ROAS {c.roas}x
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Meta Ads y WhatsApp concentran el 55% de la captación.</span>
            <span className="font-bold text-purple-700">Recomendado</span>
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 5. TOP 10 CLIENTES VIP & SEGMENTACIÓN COMERCIAL */}
      {/* ==================================================== */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <span>Top 10 Clientes VIP (Mayor Facturación & Fidelidad)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Ranking de clientes que mayor rentabilidad y frecuencia aportan a la empresa
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={vipSearchQuery}
                onChange={(e) => setVipSearchQuery(e.target.value)}
                placeholder="Buscar cliente VIP..."
                className="pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none w-48 focus:w-60 transition-all font-medium"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
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
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {top10Customers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No se encontraron clientes con compras en el filtro activo.
                  </td>
                </tr>
              ) : (
                top10Customers.map((c, idx) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3 font-mono font-bold text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-900 dark:text-white block">{c.name}</span>
                      <span className="text-[10px] text-slate-400">ID: {c.id.slice(0, 8)}...</span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          c.isCorp
                            ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200'
                            : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200'
                        }`}
                      >
                        {c.isCorp ? 'Empresa B2B' : 'Persona'}
                      </span>
                    </td>
                    <td className="py-3 px-3 capitalize text-slate-600 dark:text-slate-400">{c.channel}</td>
                    <td className="py-3 px-3 text-right font-mono font-black text-slate-900 dark:text-white">
                      {formatCurrencyUSD(c.total)}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-purple-700 dark:text-purple-300 font-mono">
                      {c.count} pedidos
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                      {formatCurrencyUSD(c.avgTicket)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="font-mono text-slate-600 dark:text-slate-400 block">{c.lastDate || 'N/D'}</span>
                      <span className="text-[10px] text-slate-400">hace {c.daysSinceLast} días</span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${c.segmentBadge}`}>
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
      {/* 6. PRODUCTOS ESTRELLA (MARGEN) & HÁBITOS DE COMPRA SEMANALES */}
      {/* ==================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Productos por Margen Comercial */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-600" />
                <span>Top Productos con Mayor Margen Comercial</span>
              </h3>
              <p className="text-xs text-slate-500">
                Productos más rentables para priorizar en pautas publicitarias
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 px-2 py-1 rounded-lg">
              Mayor Rentabilidad
            </span>
          </div>

          <div className="space-y-3">
            {top10ProductsMargin.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">No hay ventas registradas en el período.</div>
            ) : (
              top10ProductsMargin.map((p, idx) => (
                <div
                  key={p.id}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-slate-400 w-5">{idx + 1}</span>
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">{p.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {p.qty} unidades vendidas • Ventas: {formatCurrencyUSD(p.sales)}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-black text-emerald-600 dark:text-emerald-400 font-mono block">
                      +{formatCurrencyUSD(p.totalMarginDollar)}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.2 rounded">
                      {p.marginPct}% margen
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Ventas por Día de la Semana */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                <span>Hábitos de Compra: Ventas por Día</span>
              </h3>
              <p className="text-xs text-slate-500">
                Distribución de facturación de Lunes a Domingo para programar campañas
              </p>
            </div>
            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950 px-2 py-1 rounded-lg">
              Semanal
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesByDayOfWeek} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: any) => [`$${Number(v).toLocaleString()}`, 'Ventas Totales']} />
                <Bar dataKey="sales" fill="#6366f1" radius={[6, 6, 0, 0]}>
                  {salesByDayOfWeek.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.sales === Math.max(...salesByDayOfWeek.map((d) => d.sales)) ? '#8b5cf6' : '#94a3b8'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-300">
            💡 <strong>Estrategia Comercial:</strong> El día más fuerte de venta es el{' '}
            <strong>
              {salesByDayOfWeek.reduce((max, d) => (d.sales > max.sales ? d : max), salesByDayOfWeek[0]).name}
            </strong>. Se recomienda pautar 24 horas antes para calentar audiencia.
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 7. RETENCIÓN & SEMÁFORO DE CHURN + SEGMENTACIÓN CRM */}
      {/* ==================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Semáforo de Retención / Churn */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-500" />
                <span>Semáforo de Retención & Riesgo de Inactividad</span>
              </h3>
              <p className="text-xs text-slate-500">
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

            <div className="space-y-2.5">
              {churnAnalysis.map((item) => (
                <div key={item.name} className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span>{item.name}</span>
                    </span>
                    <span className="font-mono font-black text-slate-900 dark:text-white">{item.value}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-1">Acción: {item.action}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dynamic CRM Widgets */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                <span>Segmentación Demográfica & CRM</span>
              </h3>
              <p className="text-xs text-slate-500">
                Distribución de clientes por perfil empresarial y género
              </p>
            </div>
            <button
              onClick={() => setIsChartBuilderOpen(true)}
              className="p-1.5 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 hover:bg-purple-100 transition cursor-pointer"
              title="Añadir nuevo widget demográfico"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            {(dynamicWidgets || []).slice(0, 2).map((widget) => (
              <div key={widget.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">{widget.title}</h4>
                  <button
                    onClick={() => deleteDynamicWidget(widget.id)}
                    className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="h-40 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={widget.data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                      <YAxis tick={{ fontSize: 9 }} />
                      <Tooltip formatter={(v: any) => [`$${Number(v).toLocaleString()}`, 'Total']} />
                      <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                        {(widget.data || []).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
