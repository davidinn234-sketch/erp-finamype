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
  Plus,
  Trash2,
  Clock,
  ShoppingBag,
  Award,
  AlertCircle,
  HelpCircle,
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
} from 'recharts';
import { formatCurrencyUSD } from '../../utils/salvadoranTax';
import { DynamicChartBuilderModal } from './DynamicChartBuilderModal';

const COLORS = ['#10b981', '#06b6d4', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6', '#14b8a6'];

export const MarketingDashboard: React.FC = () => {
  const {
    currentCompany,
    customers,
    invoices,
    products,
    branches,
    dynamicWidgets,
    deleteDynamicWidget,
  } = useERP();

  // Filtro propio e independiente del Dashboard Corporativo
  const [mktBranchId, setMktBranchId] = useState<string>('all');
  const [mktPeriodType, setMktPeriodType] = useState<'todo' | 'ano' | 'rango'>('todo');
  const [mktYear, setMktYear] = useState<number>(2026);
  const [isChartBuilderOpen, setIsChartBuilderOpen] = useState(false);

  // Invoices filtered by marketing filter
  const filteredInvoices = useMemo(() => {
    let list = (invoices || []).filter((i) => i && i.status !== 'anulada');
    if (mktBranchId !== 'all') {
      list = list.filter((i) => i.branchId === mktBranchId || (!i.branchId && branches.find((b) => b.id === mktBranchId)?.isMain));
    }
    if (mktPeriodType === 'ano') {
      list = list.filter((i) => (i.date || '').startsWith(String(mktYear)));
    }
    return list;
  }, [invoices, mktBranchId, mktPeriodType, mktYear, branches]);

  // Demographic & AI Dynamic Widgets
  const processedDynamicWidgets = useMemo(() => {
    return (dynamicWidgets || []).map((widget) => {
      if (widget.metricKey === 'customers_gender') {
        const femaleTotal = (filteredInvoices || [])
          .filter((inv) => (customers || []).find((c) => c.id === inv.customerId)?.gender === 'femenino')
          .reduce((sum, inv) => sum + (inv.totalPagar || 0), 0);

        const maleTotal = (filteredInvoices || [])
          .filter((inv) => (customers || []).find((c) => c.id === inv.customerId)?.gender === 'masculino')
          .reduce((sum, inv) => sum + (inv.totalPagar || 0), 0);

        const corpTotal = (filteredInvoices || [])
          .filter((inv) => {
            const cust = (customers || []).find((c) => c.id === inv.customerId);
            return cust?.gender === 'corporativo' || (!cust?.gender && cust?.isGranContribuyente);
          })
          .reduce((sum, inv) => sum + (inv.totalPagar || 0), 0);

        const data = [
          { name: 'Empresas / B2B', value: Number(corpTotal.toFixed(2)), color: '#2f855f' },
          { name: 'Mujeres (Femenino)', value: Number(femaleTotal.toFixed(2)), color: '#ec4899' },
          { name: 'Hombres (Masculino)', value: Number(maleTotal.toFixed(2)), color: '#06b6d4' },
        ].filter((d) => d.value > 0);
        return { ...widget, data };
      }
      return widget;
    });
  }, [dynamicWidgets, customers, filteredInvoices]);

  // Total metrics
  const totalSalesMkt = useMemo(() => {
    return filteredInvoices.reduce((acc, i) => acc + (i.totalPagar || 0), 0);
  }, [filteredInvoices]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 lg:p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50/90 via-indigo-50/40 to-white dark:from-slate-900 dark:via-slate-900 dark:to-purple-950/20 rounded-3xl p-6 sm:p-8 border border-purple-200/70 dark:border-slate-800 shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/80 border border-purple-300 dark:border-purple-800 text-purple-800 dark:text-purple-300 text-xs font-bold mb-2">
              <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-purple-700 text-white uppercase">
                HISTÓRICO
              </span>
              <span>{currentCompany?.tradeName || currentCompany?.name} • Inteligencia Comercial & Marketing</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Dashboard de Marketing & Análisis Histórico
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl">
              Segmentación de clientes, canales de captación, ticket promedio, recurrencia y comportamiento histórico de ventas.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsChartBuilderOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Añadir Gráfico</span>
            </button>
          </div>
        </div>

        {/* Filtro Propio e Independiente */}
        <div className="mt-6 pt-5 border-t border-purple-200/60 dark:border-slate-800">
          <div className="bg-white/80 dark:bg-slate-800/80 rounded-2xl p-4 border border-purple-200/70 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4 shadow-2xs">
            <div className="flex flex-wrap items-center gap-3">
              {/* Sucursal */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs">
                <Building className="w-4 h-4 text-purple-600" />
                <span className="font-bold text-slate-500 text-[11px]">Sucursal:</span>
                <select
                  value={mktBranchId}
                  onChange={(e) => setMktBranchId(e.target.value)}
                  className="bg-transparent border-none text-xs font-bold outline-none text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  <option value="all">🏢 Todas las Sucursales</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Período */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs">
                <Calendar className="w-4 h-4 text-purple-600" />
                <span className="font-bold text-slate-500 text-[11px]">Período:</span>
                <select
                  value={mktPeriodType}
                  onChange={(e) => setMktPeriodType(e.target.value as any)}
                  className="bg-transparent border-none text-xs font-bold outline-none text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  <option value="todo">Todo el Histórico (Desde el inicio)</option>
                  <option value="ano">Filtrar por Año</option>
                </select>
              </div>

              {mktPeriodType === 'ano' && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs">
                  <span className="font-bold text-slate-500 text-[11px]">Año:</span>
                  <select
                    value={mktYear}
                    onChange={(e) => setMktYear(Number(e.target.value))}
                    className="bg-transparent border-none text-xs font-bold outline-none text-slate-800 dark:text-slate-200 cursor-pointer"
                  >
                    {[2026, 2025, 2024, 2023, 2022].map((yr) => (
                      <option key={yr} value={yr}>
                        {yr}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="text-xs font-bold text-purple-900 dark:text-purple-300">
              Ventas en este filtro: <span className="font-mono text-sm">{formatCurrencyUSD(totalSalesMkt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Fase 2 Indicator Banner */}
      <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-purple-900 dark:text-purple-200 font-medium">
          <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
          <span>
            <strong>Módulo de Marketing (Fase 2):</strong> Se activará con los 9 gráficos históricos completos (Top 10 clientes, Top 10 productos por margen, ticket promedio, recurrencia, ventas por día y clientes inactivos) al confirmar la Fase 1 del Dashboard Corporativo.
          </span>
        </div>
      </div>

      {/* Demographic Widgets */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              <span>Segmentación & Demografía de Clientes (CRM)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Distribución de ventas por género, tipo de cliente (B2B vs personas naturales) y segmentos
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(processedDynamicWidgets || []).map((widget) => (
            <div
              key={widget.id}
              className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-purple-100 dark:border-slate-800 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{widget.title}</span>
                    </h4>
                    <p className="text-xs text-slate-500">{widget.description}</p>
                  </div>

                  <button
                    onClick={() => deleteDynamicWidget(widget.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                    title="Eliminar Widget"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
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
                        <Bar dataKey="value" fill="#8b5cf6" radius={[6, 6, 0, 0]}>
                          {widget.data.map((_, index) => (
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

      <DynamicChartBuilderModal
        isOpen={isChartBuilderOpen}
        onClose={() => setIsChartBuilderOpen(false)}
      />
    </div>
  );
};
