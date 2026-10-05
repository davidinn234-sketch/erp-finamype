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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-[8px] max-w-5xl w-full border border-[#E5E7EB] dark:border-slate-800 shadow-none flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-[#E5E7EB] dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Package className="w-5 h-5 text-[#6B7280] stroke-[1.5]" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[16px] font-semibold text-[#111827] dark:text-white">
                  Base de datos de ingresos y catálogo
                </h3>
                <span className="text-[12px] text-[#6B7280] font-mono">
                  ({items.length} conceptos)
                </span>
              </div>
              <p className="text-[12px] text-[#6B7280] dark:text-slate-400 mt-0.5">
                Desglose de productos, servicios, remanentes y ventas extraordinarias
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 self-end sm:self-auto">
            <div className="text-right hidden sm:block">
              <span className="text-[12px] text-[#6B7280] block">Ingresos consolidados</span>
              <span className="text-[20px] font-semibold font-mono text-[#111827] dark:text-white">
                {formatCurrencyUSD(totalCompanyRevenue)}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-[6px] text-[#6B7280] hover:text-[#111827] dark:hover:text-white hover:bg-[#F9FAFB] transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="p-4 bg-[#F9FAFB] dark:bg-slate-800/60 border-b border-[#E5E7EB] dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex-1 min-w-[240px] relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#6B7280]" />
            <input
              type="text"
              placeholder="Buscar por nombre, código o categoría..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-[14px] rounded-[6px] border border-[#E3E8E6] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#111827] dark:text-white outline-none focus:border-[#0F766E]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-900 text-[12px]">
              <Filter className="w-3.5 h-3.5 text-[#6B7280]" />
              <span className="text-[#6B7280]">Tipo:</span>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="bg-transparent border-none text-[12px] font-medium text-[#111827] dark:text-white outline-none cursor-pointer"
              >
                <option value="all">Todos los tipos</option>
                <option value="producto">Productos</option>
                <option value="servicio">Servicios</option>
                <option value="remanente_hacienda">Remanentes MH</option>
                <option value="activo_fijo">Activo fijo</option>
                <option value="rendimiento">Rendimientos</option>
              </select>
            </div>

            <span className="text-[12px] text-[#6B7280]">
              {filteredItems.length} de {items.length} registros
            </span>
          </div>
        </div>

        {/* Database Table */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left text-[14px]">
            <thead className="bg-[#F9FAFB] dark:bg-slate-800 border-b border-[#E5E7EB] dark:border-slate-800 text-[#6B7280] dark:text-slate-400 text-[12px] font-medium sticky top-0 z-10">
              <tr>
                <th
                  onClick={() => toggleSort('name')}
                  className="p-3 cursor-pointer hover:text-[#111827]"
                >
                  <div className="flex items-center gap-1">
                    <span>Concepto / Producto</span>
                    <ArrowUpDown className="w-3 h-3 text-[#6B7280]" />
                  </div>
                </th>
                <th className="p-3">Categoría</th>
                <th
                  onClick={() => toggleSort('units')}
                  className="p-3 text-right cursor-pointer hover:text-[#111827]"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Unidades</span>
                    <ArrowUpDown className="w-3 h-3 text-[#6B7280]" />
                  </div>
                </th>
                <th className="p-3 text-right">Precio prom.</th>
                <th
                  onClick={() => toggleSort('revenue')}
                  className="p-3 text-right cursor-pointer hover:text-[#111827]"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Monto total ($)</span>
                    <ArrowUpDown className="w-3 h-3 text-[#6B7280]" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('percentage')}
                  className="p-3 text-right cursor-pointer hover:text-[#111827]"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>% Participación</span>
                    <ArrowUpDown className="w-3 h-3 text-[#6B7280]" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] dark:divide-slate-800 font-normal">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#6B7280]">
                    No se encontraron conceptos con los criterios de búsqueda ($0.00).
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => (
                  <tr
                    key={item.id || idx}
                    className="hover:bg-[#F9FAFB] dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[12px] text-[#6B7280]">
                          {item.code || '—'}
                        </span>
                        <span className="font-medium text-[#111827] dark:text-white">
                          {item.name}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 text-[12px] text-[#6B7280]">
                      {item.category}
                    </td>
                    <td className="p-3 text-right font-mono text-[#111827] dark:text-white">
                      {item.unitsSold > 0 ? item.unitsSold.toLocaleString() : '—'}
                    </td>
                    <td className="p-3 text-right font-mono text-[#6B7280]">
                      {item.averagePrice > 0 ? formatCurrencyUSD(item.averagePrice) : '—'}
                    </td>
                    <td className="p-3 text-right font-mono font-medium text-[#111827] dark:text-white">
                      {formatCurrencyUSD(item.totalRevenue)}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-[#E5E7EB] dark:bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-[#0F766E] rounded-full"
                            style={{ width: `${Math.min(100, Math.max(2, item.percentage))}%` }}
                          />
                        </div>
                        <span className="font-mono text-[12px] text-[#6B7280] w-12 text-right">
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
        <div className="p-4 bg-[#F9FAFB] dark:bg-slate-800/80 border-t border-[#E5E7EB] dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-[14px]">
          <div className="text-[#6B7280] text-[12px]">
            Mostrando {filteredItems.length} conceptos.
          </div>

          <div className="flex items-center gap-6">
            <div className="text-[12px]">
              <span className="text-[#6B7280]">Total unidades: </span>
              <span className="font-medium font-mono text-[#111827] dark:text-white">
                {totalFilteredUnits.toLocaleString()}
              </span>
            </div>
            <div className="text-[12px]">
              <span className="text-[#6B7280]">Subtotal filtrado: </span>
              <span className="font-semibold font-mono text-[#111827] dark:text-white">
                {formatCurrencyUSD(totalFilteredRevenue)}
              </span>
            </div>
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-[6px] border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-[#F9FAFB] text-[#111827] dark:text-slate-200 text-[14px] font-medium transition cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
