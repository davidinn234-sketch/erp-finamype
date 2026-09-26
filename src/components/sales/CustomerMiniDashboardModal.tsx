import React, { useState, useMemo } from 'react';
import {
  Customer,
  CustomerNote,
  LeadStatus,
  CustomerStage,
  Invoice,
} from '../../types';
import { useERP } from '../../context/ERPContext';
import { formatCurrencyUSD } from '../../utils/salvadoranTax';
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Sparkles,
  Award,
  Package,
  FileText,
  CreditCard,
  Send,
  Building,
  Star,
  Receipt,
  ThumbsDown,
  ArrowUpRight,
} from 'lucide-react';

interface CustomerMiniDashboardModalProps {
  customer: Customer;
  onClose: () => void;
  onOpenNewSaleForCustomer?: (customer: Customer) => void;
}

export const CustomerMiniDashboardModal: React.FC<CustomerMiniDashboardModalProps> = ({
  customer,
  onClose,
  onOpenNewSaleForCustomer,
}) => {
  const { invoices, updateCustomer, addCustomerNote, currentUser } = useERP();

  // Active Tab inside Mini-Dashboard
  const [activeTab, setActiveTab] = useState<'analytics' | 'history' | 'products' | 'notes'>('analytics');

  // Lead Status & Reason State
  const [leadStatus, setLeadStatus] = useState<LeadStatus>(customer.leadStatus || 'contactado');
  const [stage, setStage] = useState<CustomerStage>(customer.stage || 'prospecto');
  const [lostReason, setLostReason] = useState<string>(customer.lostReason || '');
  const [isEditingStatus, setIsEditingStatus] = useState(false);

  // New Note State
  const [newNoteType, setNewNoteType] = useState<CustomerNote['type']>('whatsapp');
  const [newNoteContent, setNewNoteContent] = useState('');

  // Date Filtering State
  type DateFilterMode = 'all_time' | 'current_month' | 'last_12_months' | 'by_year_month';
  const [filterMode, setFilterMode] = useState<DateFilterMode>('all_time');
  const [filterYear, setFilterYear] = useState<number>(2026);
  const [filterMonth, setFilterMonth] = useState<number>(0); // 0 = Todo el año

  // Filter invoices for this customer
  const customerInvoices = useMemo(() => {
    return invoices
      .filter((inv) => inv.customerId === customer.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [invoices, customer.id]);

  // Lifetime Sales KPI (Ventas Totales en Toda su Vida)
  const lifetimeSalesTotal = useMemo(() => {
    return customerInvoices
      .filter((inv) => inv.status !== 'anulada')
      .reduce((sum, inv) => sum + (inv.totalPagar || inv.total || 0), 0);
  }, [customerInvoices]);

  const lifetimeValidCount = useMemo(() => {
    return customerInvoices.filter((inv) => inv.status !== 'anulada').length;
  }, [customerInvoices]);

  // Invoices filtered by active date filter
  const filteredCustomerInvoices = useMemo(() => {
    return customerInvoices.filter((inv) => {
      if (inv.status === 'anulada') return false;
      if (filterMode === 'all_time') return true;

      const parts = inv.date.split('-');
      const invYear = parseInt(parts[0], 10);
      const invMonth = parseInt(parts[1], 10);

      if (filterMode === 'current_month') {
        const now = new Date();
        return invYear === now.getFullYear() && invMonth === now.getMonth() + 1;
      }

      if (filterMode === 'last_12_months') {
        const now = new Date();
        const diffMonths = (now.getFullYear() - invYear) * 12 + (now.getMonth() + 1 - invMonth);
        return diffMonths >= 0 && diffMonths < 12;
      }

      if (filterMode === 'by_year_month') {
        if (filterMonth === 0) {
          return invYear === filterYear;
        }
        return invYear === filterYear && invMonth === filterMonth;
      }

      return true;
    });
  }, [customerInvoices, filterMode, filterYear, filterMonth]);

  const filteredSalesTotal = useMemo(() => {
    return filteredCustomerInvoices.reduce((sum, inv) => sum + (inv.totalPagar || inv.total || 0), 0);
  }, [filteredCustomerInvoices]);

  const filteredAvgTicket = useMemo(() => {
    return filteredCustomerInvoices.length > 0 ? filteredSalesTotal / filteredCustomerInvoices.length : 0;
  }, [filteredCustomerInvoices, filteredSalesTotal]);

  // Aggregate Metrics (Customer Mini-Dashboard KPIs)
  const metrics = useMemo(() => {
    const totalSpent = lifetimeSalesTotal;
    const validInvoicesCount = lifetimeValidCount;
    const avgTicket = validInvoicesCount > 0 ? totalSpent / validInvoicesCount : 0;

    const pendingBalance = customerInvoices
      .filter((inv) => inv.status === 'emitida' || inv.status === 'parcial')
      .reduce((sum, inv) => sum + ((inv.totalPagar || inv.total || 0) - (inv.paidAmount || 0)), 0);

    // Products frequency map
    const productFrequency: Record<string, { code: string; name: string; quantity: number; total: number }> = {};
    customerInvoices.forEach((inv) => {
      if (inv.status === 'anulada') return;
      inv.items.forEach((item) => {
        if (!productFrequency[item.productId]) {
          productFrequency[item.productId] = {
            code: item.productCode,
            name: item.description,
            quantity: 0,
            total: 0,
          };
        }
        productFrequency[item.productId].quantity += item.quantity;
        productFrequency[item.productId].total += item.total;
      });
    });

    const topProducts = Object.values(productFrequency).sort((a, b) => b.total - a.total);

    // Temporal Patterns: Days of the week & Months
    const daysCount: Record<string, number> = { Lun: 0, Mar: 0, Mié: 0, Jue: 0, Vie: 0, Sáb: 0, Dom: 0 };
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    
    customerInvoices.forEach((inv) => {
      if (inv.status === 'anulada') return;
      const d = new Date(inv.date);
      const dayName = dayNames[d.getDay()] || 'Lun';
      daysCount[dayName] = (daysCount[dayName] || 0) + 1;
    });

    let bestDay = 'Viernes';
    let maxDayCount = -1;
    Object.entries(daysCount).forEach(([d, count]) => {
      if (count > maxDayCount) {
        maxDayCount = count;
        bestDay = d;
      }
    });

    // Last Purchase Days Ago
    let daysSinceLastPurchase = 'Sin compras';
    if (customerInvoices.length > 0) {
      const lastDate = new Date(customerInvoices[0].date);
      const diffTime = Math.abs(new Date().getTime() - lastDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      daysSinceLastPurchase = diffDays === 1 ? 'Ayer' : `Hace ${diffDays} días`;
    }

    return {
      totalSpent,
      validInvoicesCount,
      avgTicket,
      pendingBalance,
      topProducts,
      bestDay,
      daysSinceLastPurchase,
      daysCount,
    };
  }, [customerInvoices, lifetimeSalesTotal, lifetimeValidCount]);

  const handleUpdateLeadStatus = (newStatus: LeadStatus) => {
    setLeadStatus(newStatus);
    const updates: Partial<Customer> = { leadStatus: newStatus };
    if (newStatus === 'ganado_cerrado') {
      updates.stage = 'frecuente';
      setStage('frecuente');
    } else if (newStatus === 'perdido') {
      updates.lostReason = lostReason;
    }
    updateCustomer(customer.id, updates);
    setIsEditingStatus(false);
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim()) return;

    addCustomerNote(customer.id, {
      type: newNoteType,
      content: newNoteContent.trim(),
      author: currentUser.name,
    });

    setNewNoteContent('');
  };

  // WhatsApp quick url
  const cleanPhone = (customer.phone || '').replace(/[^0-9]/g, '');
  const whatsappUrl = cleanPhone.length >= 8
    ? `https://wa.me/${cleanPhone.startsWith('503') ? cleanPhone : '503' + cleanPhone}?text=${encodeURIComponent(
        `Hola estimado/a ${customer.name}, le saludamos de FINAMIPE SV. ¿En qué podemos apoyarle hoy?`
      )}`
    : null;

  const getStatusBadge = (status: LeadStatus) => {
    switch (status) {
      case 'ganado_cerrado':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5" /> Vendido / Ganado
          </span>
        );
      case 'negociacion':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700">
            <TrendingUp className="w-3.5 h-3.5" /> En Negociación
          </span>
        );
      case 'cotizado':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-700">
            <FileText className="w-3.5 h-3.5" /> Cotización Enviada
          </span>
        );
      case 'contactado':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
            <MessageSquare className="w-3.5 h-3.5" /> Contactado
          </span>
        );
      case 'perdido':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-700">
            <ThumbsDown className="w-3.5 h-3.5" /> No Vendido / Perdido
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
            <Sparkles className="w-3.5 h-3.5" /> Lead Nuevo
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-4xl my-6 rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Modal Top Header with Banner */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-start justify-between relative">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-lg border border-indigo-400/30">
              {customer.name.charAt(0)}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white">{customer.name}</h2>
                {customer.isGranContribuyente && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40">
                    Gran Contribuyente
                  </span>
                )}
                {getStatusBadge(leadStatus)}
              </div>

              {customer.tradeName && customer.tradeName !== customer.name && (
                <p className="text-xs text-indigo-200 font-medium">{customer.tradeName}</p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
                {customer.nrc && <span>NRC: <strong className="text-white font-mono">{customer.nrc}</strong></span>}
                <span>NIT: <strong className="text-white font-mono">{customer.nit}</strong></span>
                {customer.phone && (
                  <span className="flex items-center gap-1 font-mono">
                    <Phone className="w-3 h-3 text-slate-400" />
                    {customer.phone}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>
            )}

            {onOpenNewSaleForCustomer && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenNewSaleForCustomer(customer);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold shadow-sm transition cursor-pointer"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Nueva Venta / DTE</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Lead Status Quick Selector Bar */}
        <div className="px-6 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-600 dark:text-slate-300">Fase del Lead:</span>
            <div className="flex items-center gap-1 overflow-x-auto">
              {(['nuevo', 'contactado', 'cotizado', 'negociacion', 'ganado_cerrado', 'perdido'] as LeadStatus[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => handleUpdateLeadStatus(st)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition capitalize cursor-pointer ${
                    leadStatus === st
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-750 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {leadStatus === 'perdido' && (
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Motivo de pérdida (ej: Precio, eligió competencia)..."
                value={lostReason}
                onChange={(e) => setLostReason(e.target.value)}
                onBlur={() => updateCustomer(customer.id, { lostReason })}
                className="p-1 px-2 text-xs rounded border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-300"
              />
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 bg-white dark:bg-slate-900 text-xs font-bold">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-3 px-4 border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'analytics'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Mini-Dashboard Gerencial</span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`py-3 px-4 border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'products'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Productos Favoritos ({metrics.topProducts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 px-4 border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'history'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Historial de Comprobantes ({customerInvoices.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('notes')}
            className={`py-3 px-4 border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'notes'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Bitácora & CRM ({customer.notesTimeline?.length || 0})</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs bg-slate-50/50 dark:bg-slate-900/50">
          {/* TAB 1: MINI DASHBOARD GERENCIAL */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {/* Date Filter Toolbar */}
              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-[11px] text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                    Filtro Temporal:
                  </span>
                  <div className="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setFilterMode('all_time')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                        filterMode === 'all_time'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Toda la Vida (Histórico)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterMode('current_month')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                        filterMode === 'current_month'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Mes Actual
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterMode('last_12_months')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                        filterMode === 'last_12_months'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Últimos 12 Meses
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterMode('by_year_month')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                        filterMode === 'by_year_month'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Por Año y Mes
                    </button>
                  </div>
                </div>

                {filterMode === 'by_year_month' && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <label className="text-[10px] font-bold text-slate-500">Año:</label>
                      <select
                        value={filterYear}
                        onChange={(e) => setFilterYear(parseInt(e.target.value, 10))}
                        className="p-1 px-2 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      >
                        {[2024, 2025, 2026, 2027].map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-1">
                      <label className="text-[10px] font-bold text-slate-500">Mes:</label>
                      <select
                        value={filterMonth}
                        onChange={(e) => setFilterMonth(parseInt(e.target.value, 10))}
                        className="p-1 px-2 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      >
                        <option value={0}>Todo el Año</option>
                        <option value={1}>Enero</option>
                        <option value={2}>Febrero</option>
                        <option value={3}>Marzo</option>
                        <option value={4}>Abril</option>
                        <option value={5}>Mayo</option>
                        <option value={6}>Junio</option>
                        <option value={7}>Julio</option>
                        <option value={8}>Agosto</option>
                        <option value={9}>Septiembre</option>
                        <option value={10}>Octubre</option>
                        <option value={11}>Noviembre</option>
                        <option value={12}>Diciembre</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Top 4 KPI Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {/* 1. VENTAS TOTALES EN TODA SU VIDA */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/80 to-purple-50/50 dark:from-slate-800 dark:to-indigo-950/40 border-2 border-indigo-200 dark:border-indigo-800 shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider block">
                      Ventas Toda su Vida (LTV)
                    </span>
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  </div>
                  <div className="flex items-baseline gap-1 mt-1.5">
                    <span className="text-xl sm:text-2xl font-black text-indigo-950 dark:text-white font-mono">
                      {formatCurrencyUSD(lifetimeSalesTotal)}
                    </span>
                  </div>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-300 font-semibold mt-1 block">
                    {lifetimeValidCount} compras históricas
                  </span>
                </div>

                {/* 2. VENTAS DEL PERÍODO FILTRADO */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {filterMode === 'all_time'
                      ? 'Ventas del Período'
                      : filterMode === 'current_month'
                      ? 'Ventas Mes Actual'
                      : filterMode === 'last_12_months'
                      ? 'Últimos 12 Meses'
                      : `Ventas ${filterMonth === 0 ? filterYear : `${filterMonth}/${filterYear}`}`}
                  </span>
                  <div className="flex items-baseline gap-1 mt-1.5">
                    <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
                      {formatCurrencyUSD(filteredSalesTotal)}
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">
                    {filteredCustomerInvoices.length} facturas en rango
                  </span>
                </div>

                {/* 3. TICKET PROMEDIO */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Ticket Promedio
                  </span>
                  <div className="flex items-baseline gap-1 mt-1.5">
                    <span className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-200 font-mono">
                      {formatCurrencyUSD(filteredAvgTicket)}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Por transacción
                  </span>
                </div>

                {/* 4. SALDO PENDIENTE */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Saldo Pendiente (CxC)
                  </span>
                  <div className="flex items-baseline gap-1 mt-1.5">
                    <span
                      className={`text-xl sm:text-2xl font-black font-mono ${
                        metrics.pendingBalance > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {formatCurrencyUSD(metrics.pendingBalance)}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Límite: {formatCurrencyUSD(customer.creditLimit || 0)}
                  </span>
                </div>
              </div>

              {/* Temporal Purchasing Patterns Analysis */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Patrón Temporal de Compras (Días de la Semana)</span>
                  </h4>
                  <p className="text-slate-500 text-[11px]">
                    Distribución de transacciones según el día habitual de visita o pedido de este cliente.
                  </p>

                  <div className="grid grid-cols-7 gap-1 pt-2 text-center">
                    {Object.entries(metrics.daysCount).map(([day, rawCount]) => {
                      const count = Number(rawCount) || 0;
                      const countsArray = Object.values(metrics.daysCount) as number[];
                      const maxCount = Math.max(...countsArray, 1);
                      const heightPercent = Math.round((count / maxCount) * 100);
                      const isTop = count > 0 && count === maxCount;

                      return (
                        <div key={day} className="flex flex-col items-center gap-1.5">
                          <div className="w-full bg-slate-100 dark:bg-slate-800 h-24 rounded-lg flex items-end justify-center p-1">
                            <div
                              style={{ height: `${Math.max(heightPercent, 10)}%` }}
                              className={`w-full rounded-md transition-all ${
                                isTop ? 'bg-indigo-600 dark:bg-indigo-500' : 'bg-slate-300 dark:bg-slate-600'
                              }`}
                            />
                          </div>
                          <span className={`text-[10px] font-bold ${isTop ? 'text-indigo-600 font-black' : 'text-slate-400'}`}>
                            {day}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span>Preferencias & Perfil de Compra</span>
                  </h4>

                  <div className="space-y-2.5 pt-1 text-xs">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                      <span className="text-slate-500">Canal de Adquisición:</span>
                      <span className="font-bold capitalize text-slate-800 dark:text-slate-200">
                        {customer.acquisitionChannel || 'Tienda física'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                      <span className="text-slate-500">Condición de Crédito:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {customer.paymentTermDays ? `${customer.paymentTermDays} días plazo` : 'Estricto Contado'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                      <span className="text-slate-500">Ubicación Geográfica:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-right">
                        {customer.department || 'San Salvador'}
                      </span>
                    </div>

                    {customer.preferences && customer.preferences.length > 0 && (
                      <div className="pt-2">
                        <span className="text-[11px] font-bold text-slate-400 block mb-1.5">
                          Preferencias Declaradas:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {customer.preferences.map((pref, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-[10px] font-medium border border-indigo-200 dark:border-indigo-800"
                            >
                              {pref}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRODUCTOS FAVORITOS */}
          {activeTab === 'products' && (
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Package className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Productos más Comprados por este Cliente</span>
                </h4>
                <span className="text-xs text-slate-400">
                  Ordenado por valor total facturado
                </span>
              </div>

              {metrics.topProducts.length === 0 ? (
                <div className="p-8 text-center text-slate-400 space-y-2">
                  <ShoppingBag className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
                  <p>Aún no registra compras de productos específicas.</p>
                </div>
              ) : (
                <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] uppercase font-bold text-slate-400">
                      <tr>
                        <th className="p-3">Código</th>
                        <th className="p-3">Descripción del Producto</th>
                        <th className="p-3 text-center">Unidades Compradas</th>
                        <th className="p-3 text-right">Total Acumulado ($)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {metrics.topProducts.map((prod, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="p-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            {prod.code}
                          </td>
                          <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                            {prod.name}
                          </td>
                          <td className="p-3 text-center font-bold font-mono">
                            {prod.quantity}
                          </td>
                          <td className="p-3 text-right font-black font-mono text-slate-900 dark:text-white">
                            {formatCurrencyUSD(prod.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: HISTORIAL DE COMPROBANTES / INVOICES */}
          {activeTab === 'history' && (
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Historial de Comprobantes Emitidos</span>
                </h4>
                <span className="text-xs text-slate-400">
                  {customerInvoices.length} documentos emitidos
                </span>
              </div>

              {customerInvoices.length === 0 ? (
                <div className="p-8 text-center text-slate-400 space-y-2">
                  <Receipt className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
                  <p>Este cliente aún no tiene facturas o tickets registrados.</p>
                </div>
              ) : (
                <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] uppercase font-bold text-slate-400">
                      <tr>
                        <th className="p-3">Fecha</th>
                        <th className="p-3">Número DTE / Control</th>
                        <th className="p-3">Tipo de Documento</th>
                        <th className="p-3">Condición</th>
                        <th className="p-3 text-right">Total ($)</th>
                        <th className="p-3 text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {customerInvoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="p-3 font-mono text-slate-600 dark:text-slate-300">{inv.date}</td>
                          <td className="p-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            {inv.dteNumber || inv.invoiceNumber}
                          </td>
                          <td className="p-3 capitalize text-slate-700 dark:text-slate-200">
                            {inv.type.replace('_', ' ')}
                          </td>
                          <td className="p-3 capitalize text-slate-500">
                            {inv.paymentCondition.replace('_', ' ')}
                          </td>
                          <td className="p-3 text-right font-black font-mono text-slate-900 dark:text-white">
                            {formatCurrencyUSD(inv.total)}
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                inv.status === 'pagada'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : inv.status === 'anulada'
                                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              }`}
                            >
                              {inv.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: BITÁCORA DE INTERACCIONES & CRM */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              {/* Quick Note Creation Form */}
              <form onSubmit={handleAddNote} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">
                    Registrar Nueva Interacción en Bitácora:
                  </span>
                  <select
                    value={newNoteType}
                    onChange={(e) => setNewNoteType(e.target.value as any)}
                    className="p-1 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
                  >
                    <option value="whatsapp">💬 WhatsApp</option>
                    <option value="llamada">📞 Llamada Telefónica</option>
                    <option value="reunion">🤝 Reunión Presencial / Virtual</option>
                    <option value="acuerdo">📝 Acuerdo Comercial</option>
                    <option value="reclamo">⚠️ Soporte / Reclamo</option>
                  </select>
                </div>

                <textarea
                  rows={2}
                  placeholder="Detalles de la conversación (ej: interesado en cotización de 10 unidades, solicita crédito a 30 días, etc.)..."
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                />

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition cursor-pointer"
                  >
                    <Send className="w-3 h-3" />
                    <span>Agregar a Bitácora</span>
                  </button>
                </div>
              </form>

              {/* Timeline Notes List */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white">
                  Línea de Tiempo de Interacciones
                </h4>

                {(!customer.notesTimeline || customer.notesTimeline.length === 0) ? (
                  <p className="text-slate-400 italic text-center py-6">
                    Aún no hay apuntes en la bitácora de este cliente.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {customer.notesTimeline.map((note) => (
                      <div
                        key={note.id}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold capitalize text-indigo-600 dark:text-indigo-400">
                            {note.type} • Registrado por: {note.author}
                          </span>
                          <span className="text-slate-400 font-mono">{note.date}</span>
                        </div>
                        <p className="text-slate-800 dark:text-slate-200 leading-relaxed">
                          {note.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
