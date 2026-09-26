import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  LayoutDashboard,
  TrendingUp,
  Receipt,
  ShoppingBag,
  Users,
  Landmark,
  BookOpenCheck,
  Settings,
  BookOpen,
  Layers,
  Sparkles,
  Wallet,
  Sliders,
  ScanBarcode,
  Cloud,
  FileText,
} from 'lucide-react';
import { FinaPymeTermsAndProjectModal } from './FinaPymeTermsAndProjectModal';

interface SidebarProps {
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpenMobile, onCloseMobile }) => {
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const {
    activeModule,
    setActiveModule,
    currentCompany,
    userRole,
    setIsExhaustiveCustomizationOpen,
    setIsCloudUserManagerOpen,
  } = useERP();

  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard Ejecutivo',
      subtitle: 'BI, Métricas, AI & Break-Even',
      icon: LayoutDashboard,
      roles: ['admin_maestro', 'contador', 'gerente', 'cajero'],
    },
    {
      id: 'admin_profiles',
      label: 'Gestor de Perfiles & Servicios',
      subtitle: 'Crear cuentas para amigos',
      icon: Cloud,
      roles: ['admin_maestro'],
      badge: 'Admin',
    },
    {
      id: 'forecasting',
      label: 'Pronósticos & Proyecciones',
      subtitle: 'Ventas, Flujo, Costos & OLS',
      icon: TrendingUp,
      roles: ['admin_maestro', 'contador', 'gerente'],
      badge: 'Predictivo',
    },
    {
      id: 'sales',
      label: 'Ventas & Clientes (CRM)',
      subtitle: 'DTE, CCF, Segmentación & CxC',
      icon: Receipt,
      roles: ['admin_maestro', 'contador', 'gerente', 'cajero'],
      badge: 'DTE SV',
    },
    {
      id: 'pos_terminal',
      label: 'Punto de Venta POS',
      subtitle: 'Lector Código Barras & Caja',
      icon: ScanBarcode,
      roles: ['admin_maestro', 'contador', 'gerente', 'cajero'],
      badge: 'Escáner',
    },
    {
      id: 'purchases',
      label: 'Compras & Proveedores (SCM)',
      subtitle: 'Kardex, Sujetos Excluidos & CxP',
      icon: ShoppingBag,
      roles: ['admin_maestro', 'contador', 'gerente'],
    },
    {
      id: 'payroll',
      label: 'RRHH & Planilla SV',
      subtitle: 'ISSS, AFP, Renta MH & Provisiones',
      icon: Users,
      roles: ['admin_maestro', 'contador', 'gerente'],
      badge: 'Legal',
    },
    {
      id: 'treasury',
      label: 'Tesorería & Bancos',
      subtitle: 'Cajas, Flujo Real & Proyecciones',
      icon: Landmark,
      roles: ['admin_maestro', 'contador', 'gerente'],
    },
    {
      id: 'accounting',
      label: 'Contabilidad NIIF & IVA',
      subtitle: 'Partida Doble, F-07 & Balances',
      icon: BookOpenCheck,
      roles: ['admin_maestro', 'contador'],
    },
    {
      id: 'academy',
      label: 'Academia & Manuales',
      subtitle: 'Guías Paso a Paso & Ley SV',
      icon: BookOpen,
      roles: ['admin_maestro', 'contador', 'gerente', 'cajero'],
      badge: 'Guías',
    },
    {
      id: 'settings',
      label: 'Configuración & Personalización',
      subtitle: 'Catálogo, Tasas Fiscales & JSON',
      icon: Settings,
      roles: ['admin_maestro', 'contador'],
    },
  ];

  const filteredNavItems = navigationItems.filter((item) => item.roles.includes(userRole));

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 lg:w-68 flex flex-col justify-between border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-transform duration-200 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Logo & App Header */}
        <div>
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-md">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black tracking-tight text-slate-900 dark:text-white text-base">
                  FinaPyme<span className="text-indigo-600 dark:text-indigo-400">.SV</span>
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                  ERP
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                Gestión Financiera para MYPES
              </p>
            </div>
          </div>

          {/* Navigation Menu Links */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-220px)]">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Módulos Operativos
            </div>

            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeModule === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-${item.id}`}
                  onClick={() => {
                    setActiveModule(item.id);
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white font-medium shadow-sm shadow-indigo-200 dark:shadow-none'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate leading-tight">{item.label}</p>
                      <p
                        className={`text-[10px] truncate ${
                          isActive ? 'text-indigo-100' : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        {item.subtitle}
                      </p>
                    </div>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Customization & Tenant Info Card */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              id="sidebar-open-customization-btn"
              onClick={() => {
                setIsExhaustiveCustomizationOpen(true);
                onCloseMobile();
              }}
              className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-all text-[11px] font-semibold cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Ajustes</span>
            </button>

            <button
              type="button"
              id="sidebar-open-terms-btn"
              onClick={() => setIsTermsModalOpen(true)}
              className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-all text-[11px] font-semibold cursor-pointer"
              title="Ver Objetivos de Proyecto, Lean Startup y Términos FinaPyme"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Proyecto UES</span>
            </button>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">
                {currentCompany.tradeName || currentCompany.name}
              </span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 space-y-0.5">
              <p>NRC: <span className="font-mono">{currentCompany.nrc}</span></p>
              <p>NIT: <span className="font-mono">{currentCompany.nit}</span></p>
              <p>Régimen: <span className="font-medium">{currentCompany.isGranContribuyente ? 'Gran Contribuyente' : 'Mediano / Startup'}</span></p>
            </div>
          </div>
        </div>
      </aside>

      {/* FinaPyme Terms, Lean Startup & Project Objectives Modal */}
      <FinaPymeTermsAndProjectModal
        isOpen={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
      />
    </>
  );
};
