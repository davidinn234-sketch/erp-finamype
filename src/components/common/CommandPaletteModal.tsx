import React, { useState, useEffect } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  Search,
  Receipt,
  ShoppingBag,
  Users,
  Landmark,
  BookOpenCheck,
  Building2,
  TrendingUp,
  X,
  ArrowRight,
} from 'lucide-react';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenNewSale: () => void;
  onOpenNewPurchase: () => void;
  onOpenNewPayroll: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onOpenNewSale,
  onOpenNewPurchase,
  onOpenNewPayroll,
}) => {
  const { setActiveModule, invoices, purchases, customers, products, employees } = useERP();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // Toggle or open handled in parent
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const quickActions = [
    {
      id: 'act-sale',
      label: 'Emitir Documento Tributario (CCF / Factura / DTE)',
      category: 'Acción Rápida',
      icon: Receipt,
      action: () => {
        onClose();
        onOpenNewSale();
      },
    },
    {
      id: 'act-purchase',
      label: 'Registrar Factura / CCF de Compra con IVA Crédito Fiscal',
      category: 'Acción Rápida',
      icon: ShoppingBag,
      action: () => {
        onClose();
        onOpenNewPurchase();
      },
    },
    {
      id: 'act-payroll',
      label: 'Generar Planilla Legal (ISSS, AFP, Renta Hacienda SV)',
      category: 'Acción Rápida',
      icon: Users,
      action: () => {
        onClose();
        onOpenNewPayroll();
      },
    },
    {
      id: 'nav-dashboard',
      label: 'Ir a Dashboard Ejecutivo & Analítica BI',
      category: 'Navegación',
      icon: Landmark,
      action: () => {
        setActiveModule('dashboard');
        onClose();
      },
    },
    {
      id: 'nav-forecasting',
      label: 'Ir a Pronósticos & Proyecciones (Ventas, Flujo, Costos & OLS)',
      category: 'Navegación',
      icon: TrendingUp,
      action: () => {
        setActiveModule('forecasting');
        onClose();
      },
    },
    {
      id: 'nav-accounting',
      label: 'Ir a Contabilidad NIIF, Libro Diario & Libros IVA',
      category: 'Navegación',
      icon: BookOpenCheck,
      action: () => {
        setActiveModule('accounting');
        onClose();
      },
    },
    {
      id: 'nav-treasury',
      label: 'Ir a Tesorería, Bancos & Flujo de Caja Proyectado',
      category: 'Navegación',
      icon: Landmark,
      action: () => {
        setActiveModule('treasury');
        onClose();
      },
    },
  ];

  // Dynamic search results
  const filteredInvoices = invoices.filter(
    (i) =>
      i.correlativeNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.nrc && c.nrc.includes(searchTerm)) ||
      c.nit.includes(searchTerm)
  );

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-100">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-slate-800">
          <Search className="w-5 h-5 text-indigo-500 shrink-0" />
          <input
            type="text"
            placeholder="Buscar por correlativo, cliente, producto, empleado o acción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
            className="flex-1 bg-transparent border-none outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400 text-sm"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Body */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4 text-xs">
          {searchTerm.trim() === '' ? (
            <div>
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Acciones Frecuentes
              </div>
              <div className="space-y-1 mt-1">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.id}
                      onClick={action.action}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-xs">{action.label}</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Invoices */}
              {filteredInvoices.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Facturas & Documentos Tributarios ({filteredInvoices.length})
                  </div>
                  <div className="space-y-1 mt-1">
                    {filteredInvoices.slice(0, 4).map((inv) => (
                      <button
                        key={inv.id}
                        onClick={() => {
                          setActiveModule('sales');
                          onClose();
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition cursor-pointer"
                      >
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200">
                            {inv.correlativeNumber} - {inv.customerName}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            Total: ${inv.totalPagar.toFixed(2)} | Fecha: {inv.date}
                          </p>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-slate-100 dark:bg-slate-800 capitalize">
                          {inv.status}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Customers */}
              {filteredCustomers.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Clientes CRM ({filteredCustomers.length})
                  </div>
                  <div className="space-y-1 mt-1">
                    {filteredCustomers.slice(0, 4).map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setActiveModule('sales');
                          onClose();
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition cursor-pointer"
                      >
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{c.name}</p>
                          <p className="text-[10px] text-slate-400">
                            NIT: {c.nit} {c.nrc ? `| NRC: ${c.nrc}` : ''}
                          </p>
                        </div>
                        {c.isGranContribuyente && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                            Gran Contribuyente
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Products */}
              {filteredProducts.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Inventario & Productos ({filteredProducts.length})
                  </div>
                  <div className="space-y-1 mt-1">
                    {filteredProducts.slice(0, 4).map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setActiveModule('purchases');
                          onClose();
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition cursor-pointer"
                      >
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200">
                            [{p.code}] {p.name}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            Precio: ${p.salePrice.toFixed(2)} | Stock: {p.stock}
                          </p>
                        </div>
                        <span className="text-[10px] text-indigo-500 font-medium">Ver en Kardex</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Shortcut notes */}
        <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Navegar con teclado</span>
          <div className="flex gap-2">
            <span>[ESC] Cerrar</span>
          </div>
        </div>
      </div>
    </div>
  );
};
