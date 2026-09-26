import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  ArrowUpDown,
  Filter,
  DollarSign,
  Package,
  Layers,
  Sparkles,
  Download,
  Building,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { formatCurrencyUSD } from '../../utils/salvadoranTax';

export interface ConceptRevenueItem {
  id: string;
  code: string;
  name: string;
  category: string;
  type: 'producto' | 'servicio' | 'remanente_hacienda' | 'activo_fijo' | 'rendimiento' | 'otro';
  unitsSold: number;
  totalRevenue: number;
  percentage: number;
  averagePrice: number;
  transactionCount: number;
}

interface RevenueDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: ConceptRevenueItem[];
  totalCompanyRevenue: number;
}

export const RevenueDatabaseModal: React.FC<RevenueDatabaseModalProps> = ({
  isOpen,
  onClose,
  items,
  totalCompanyRevenue,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'revenue' | 'units' | 'name' | 'percentage'>('revenue');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        const matchesSearch =
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.category.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = selectedType === 'all' || item.type === selectedType;
        return matchesSearch && matchesType;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortBy === 'revenue') diff = b.totalRevenue - a.totalRevenue;
        else if (sortBy === 'units') diff = b.unitsSold - a.unitsSold;
        else if (sortBy === 'percentage') diff = b.percentage - a.percentage;
        else if (sortBy === 'name') diff = a.name.localeCompare(b.name);
        return sortOrder === 'desc' ? diff : -diff;
      });
  }, [items, searchQuery, selectedType, sortBy, sortOrder]);

  if (!isOpen) return null;

  const totalFilteredRevenue = filteredItems.reduce((acc, i) => acc + i.totalRevenue, 0);
  const totalFilteredUnits = filteredItems.reduce((acc, i) => acc + i.unitsSold, 0);

  const toggleSort = (column: 'revenue' | 'units' | 'name' | 'percentage') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-5xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">Base de Datos de Ingresos & Catálogo Completo</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold font-mono">
                  {items.length} Conceptos Registrados
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Desglose exhaustivo de productos, servicios, remanentes de Hacienda y ventas extraordinarias
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <div className="text-right hidden sm:block">
              <span className="text-[11px] text-slate-400 block">Total de Ingresos Consolidado</span>
              <span className="text-xl font-black font-mono text-emerald-400">
                {formatCurrencyUSD(totalCompanyRevenue)}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex-1 min-w-[240px] relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre de producto, SKU o concepto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500">Tipo:</span>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
              >
                <option value="all">Todos los Tipos</option>
                <option value="producto">Productos Comerciales</option>
                <option value="servicio">Servicios & Licencias</option>
                <option value="remanente_hacienda">Remanentes Hacienda MH</option>
                <option value="activo_fijo">Venta Activos Fijos</option>
                <option value="rendimiento">Rendimientos Financieros</option>
              </select>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-200 dark:border-indigo-800">
              {filteredItems.length} de {items.length} mostrados
            </div>
          </div>
        </div>

        {/* Database Table */}
        <div className="flex-1 overflow-y-auto p-4">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase text-[10px] font-bold sticky top-0 z-10">
              <tr>
                <th
                  onClick={() => toggleSort('name')}
                  className="p-3 rounded-l-xl cursor-pointer hover:text-indigo-600"
                >
                  <div className="flex items-center gap-1">
                    <span>Concepto / Producto</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-3">Categoría / Tipo</th>
                <th
                  onClick={() => toggleSort('units')}
                  className="p-3 text-right cursor-pointer hover:text-indigo-600"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Unidades</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-3 text-right">Precio Prom.</th>
                <th
                  onClick={() => toggleSort('revenue')}
                  className="p-3 text-right cursor-pointer hover:text-indigo-600"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Monto Total ($)</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('percentage')}
                  className="p-3 text-right rounded-r-xl cursor-pointer hover:text-indigo-600"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>% Participación</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No se encontraron conceptos o productos con los criterios de búsqueda.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => (
                  <tr
                    key={item.id || idx}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition group"
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-bold text-slate-600 dark:text-slate-400">
                          {item.code || 'N/A'}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition">
                          {item.name}
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.type === 'remanente_hacienda'
                            ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300'
                            : item.type === 'activo_fijo'
                            ? 'bg-cyan-100 dark:bg-cyan-900/50 text-cyan-800 dark:text-cyan-300'
                            : item.type === 'rendimiento'
                            ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300'
                            : item.type === 'servicio'
                            ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300'
                            : 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-300'
                        }`}
                      >
                        {item.category}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                      {item.unitsSold > 0 ? item.unitsSold.toLocaleString() : '—'}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-500">
                      {item.averagePrice > 0 ? formatCurrencyUSD(item.averagePrice) : '—'}
                    </td>
                    <td className="p-3 text-right font-mono font-black text-slate-900 dark:text-white text-sm">
                      {formatCurrencyUSD(item.totalRevenue)}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-indigo-600 rounded-full"
                            style={{ width: `${Math.min(100, Math.max(2, item.percentage))}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 w-12 text-right">
                          {item.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-slate-500">
            Mostrando <span className="font-bold text-slate-900 dark:text-white">{filteredItems.length}</span> conceptos filtrados.
          </div>

          <div className="flex items-center gap-6">
            <div>
              <span className="text-slate-400">Total Unidades: </span>
              <span className="font-bold font-mono text-slate-900 dark:text-white">
                {totalFilteredUnits.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-slate-400">Subtotal Filtrado: </span>
              <span className="font-black font-mono text-emerald-600 dark:text-emerald-400 text-sm">
                {formatCurrencyUSD(totalFilteredRevenue)}
              </span>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
