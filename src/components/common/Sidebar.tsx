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
  Target,
  Database,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { FinaPymeTermsAndProjectModal } from './FinaPymeTermsAndProjectModal';
import { canAccessModule } from '../../lib/accessPolicy';

interface SidebarProps {
  isCollapsed?: boolean;
  onToggleCollapsed?: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpenMobile, onCloseMobile, isCollapsed, onToggleCollapsed }) => {
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const {
    activeModule,
    setActiveModule,
    currentCompany,
    userRole,
    currentUser,
    setIsExhaustiveCustomizationOpen,
    setIsCloudUserManagerOpen,
  } = useERP();

  // Prevent background scrolling when mobile sidebar is open
  React.useEffect(() => {
    if (isOpenMobile) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpenMobile]);

  // Close drawer on Escape key press
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpenMobile) {
        onCloseMobile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpenMobile, onCloseMobile]);

  const handleSelectModule = (moduleId: string) => {
    setActiveModule(moduleId);
    onCloseMobile();
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const erpOperationalItems = [
    {
      id: 'dashboard',
      label: 'Dashboard Corporativo',
      subtitle: 'Operativo, Flujo, Tesorería & DTE',
      icon: LayoutDashboard,
      roles: ['admin_maestro', 'contador', 'gerente', 'cajero', 'vendedor'],
    },
    {
      id: 'marketing',
      label: 'Dashboard de Marketing',
      subtitle: 'Análisis Histórico, Clientes & BI',
      icon: Target,
      roles: ['admin_maestro', 'contador', 'gerente', 'cajero', 'vendedor'],
      badge: 'Histórico',
    },
    {
      id: 'pos_terminal',
      label: 'Punto de Venta POS',
      subtitle: 'Lector Código Barras & Caja',
      icon: ScanBarcode,
      roles: ['admin_maestro', 'contador', 'gerente', 'cajero', 'vendedor'],
      badge: 'Escáner',
    },
    {
      id: 'sales',
      label: 'Ventas & Clientes (CRM)',
      subtitle: 'DTE, CCF, Segmentación & CxC',
      icon: Receipt,
      roles: ['admin_maestro', 'contador', 'gerente', 'cajero', 'vendedor'],
      badge: 'DTE SV',
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
      subtitle: 'Asistencia PIN, ISSS, AFP & MH',
      icon: Users,
      roles: ['admin_maestro', 'contador', 'gerente'],
      badge: 'Asistencia',
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
      roles: ['admin_maestro', 'contador', 'gerente'],
      badge: 'NIIF SV',
    },
    {
      id: 'forecasting',
      label: 'Pronósticos & Proyecciones',
      subtitle: 'Ventas, Compras y Escenarios de Efectivo',
      icon: TrendingUp,
      roles: ['admin_maestro', 'contador', 'gerente'],
      badge: 'Predictivo',
    },
    {
      id: 'academy',
      label: 'Academia & Manuales',
      subtitle: 'Guías Paso a Paso & Ley SV',
      icon: BookOpen,
      roles: ['admin_maestro', 'contador', 'gerente', 'cajero', 'vendedor'],
      badge: 'Guías',
    },
    {
      id: 'master_database',
      label: 'Base de Datos General',
      subtitle: 'Auditoría, Registros & Ctrl+Z',
      icon: Database,
      roles: ['admin_maestro', 'contador', 'gerente'],
      badge: 'Nube BD',
    },
  ];

  const systemConfigItems = [
    {
      id: 'settings',
      label: 'Configuración & Empresa',
      subtitle: 'Personalización Lean, Tasas & Sucursales',
      icon: Settings,
      roles: ['admin_maestro', 'contador', 'gerente'],
    },
    {
      id: 'company_users',
      label: 'Gestor de Perfiles & Cajeros',
      subtitle: 'Crear colaboradores, roles & accesos',
      icon: Users,
      roles: ['admin_maestro', 'gerente'],
      badge: 'Cuentas',
    },
    {
      id: 'admin_profiles',
      label: 'Portal SaaS Global',
      subtitle: 'Empresas, Planes & Auditoría',
      icon: Cloud,
      roles: ['admin_maestro'],
      badge: 'Admin',
    },
  ];

  const navigationItems = [...erpOperationalItems, ...systemConfigItems];

  const isCompanyOwnerOrManager =
    currentUser?.role === 'admin_maestro' ||
    currentUser?.role === 'gerente';

  const filteredNavItems = navigationItems.filter(item => canAccessModule(currentUser, item.id));

  const filteredErpItems = filteredNavItems.filter((i) =>
    erpOperationalItems.some((e) => e.id === i.id)
  );

  const filteredSystemItems = filteredNavItems.filter((i) =>
    systemConfigItems.some((s) => s.id === i.id)
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/60 z-[95] lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Main Sidebar */}
      <aside
        id="erp-sidebar"
        className={`${isCollapsed ? 'sidebar-collapsed' : ''} fixed inset-y-0 left-0 z-[100] w-72 max-w-[85vw] lg:w-68 lg:sticky lg:top-0 lg:h-screen flex flex-col justify-between border-r border-[#0b3b36] bg-[#0F4C45] text-white transition-[width,transform] duration-200 ease-in-out ${
          isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Header & Navigation Links */}
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="sidebar-top p-4 border-b border-[#0b3b36] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-300"></span>
              <span className="font-semibold text-xs text-teal-100 uppercase tracking-wider">
                Módulos del Sistema
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button type="button" onClick={onToggleCollapsed} aria-label={isCollapsed ? 'Expandir menú lateral' : 'Contraer menú lateral'} className="hidden lg:flex p-1.5 rounded hover:bg-white/10">
                {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
              </button>
              <span className="text-[10px] text-teal-200 font-medium px-1.5 py-0.5 rounded bg-teal-900/60 border border-teal-700/50">
                ERP SV
              </span>
              {/* Mobile Close Button */}
              <button
                type="button"
                onClick={onCloseMobile}
                className="lg:hidden p-1 rounded-[6px] text-teal-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
                title="Cerrar menú"
                aria-label="Cerrar menú"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Navigation Menu Links */}
          <nav
            className="p-3 space-y-1 overflow-y-auto flex-1 min-h-0 select-none"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-teal-300/80">
              Módulos Operativos
            </div>

            {filteredErpItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeModule === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-${item.id}`}
                  aria-label={item.label}
                  title={isCollapsed ? item.label : undefined}
                  onClick={() => handleSelectModule(item.id)}
                  className={`w-full flex items-center justify-between p-2 rounded-[6px] text-left transition-colors cursor-pointer select-none ${
                    isActive
                      ? 'bg-white/15 text-white font-semibold border-l-2 border-white'
                      : 'text-teal-100/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-white' : 'text-teal-300'
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate leading-tight">{item.label}</p>
                      <p
                        className={`text-[10px] truncate ${
                          isActive ? 'text-teal-100' : 'text-teal-200/60'
                        }`}
                      >
                        {item.subtitle}
                      </p>
                    </div>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[9px] font-medium px-1.5 py-0.5 rounded transition-colors ${
                        isActive
                          ? 'bg-[#0F766E] text-white'
                          : 'bg-teal-900/70 text-teal-200 border border-teal-700/40'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Bottom Config & System Section */}
            {filteredSystemItems.length > 0 && (
              <div className="pt-3">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-teal-300/80 border-t border-[#0b3b36] flex items-center justify-between">
                  <span>Configuración & Cuentas</span>
                  <Settings className="w-3.5 h-3.5 text-teal-300" />
                </div>

                <div className="space-y-1 mt-1">
                  {filteredSystemItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeModule === item.id;
                    return (
                      <button
                        key={item.id}
                        id={`nav-${item.id}`}
                  aria-label={item.label}
                  title={isCollapsed ? item.label : undefined}
                        onClick={() => handleSelectModule(item.id)}
                        className={`w-full flex items-center justify-between p-2 rounded-[6px] text-left transition-colors cursor-pointer select-none ${
                          isActive
                            ? 'bg-white/15 text-white font-semibold border-l-2 border-white'
                            : 'text-teal-100/80 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon
                            className={`w-4 h-4 shrink-0 ${
                              isActive ? 'text-white' : 'text-teal-300'
                            }`}
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold truncate leading-tight">{item.label}</p>
                            <p
                              className={`text-[10px] truncate ${
                                isActive ? 'text-teal-100' : 'text-teal-200/60'
                              }`}
                            >
                              {item.subtitle}
                            </p>
                          </div>
                        </div>
                        {item.badge && (
                          <span
                            className={`text-[9px] font-medium px-1.5 py-0.5 rounded transition-colors ${
                              isActive
                                ? 'bg-[#0F766E] text-white'
                                : 'bg-teal-900/70 text-teal-200 border border-teal-700/40'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </nav>
        </div>

        {/* Bottom Customization & Tenant Info Card */}
        <div className="p-3 border-t border-[#0b3b36] space-y-2 shrink-0">
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              id="sidebar-open-customization-btn"
              onClick={() => {
                setIsExhaustiveCustomizationOpen(true);
                onCloseMobile();
              }}
              className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-[6px] bg-teal-900/60 border border-teal-700/60 text-white hover:bg-teal-900 transition-all text-[11px] font-semibold cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 text-teal-300" />
              <span>Ajustes</span>
            </button>

            <button
              type="button"
              id="sidebar-open-terms-btn"
              onClick={() => {
                onCloseMobile();
                setIsTermsModalOpen(true);
              }}
              className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-[6px] bg-teal-900/60 border border-teal-700/60 text-white hover:bg-teal-900 transition-all text-[11px] font-semibold cursor-pointer"
              title="Ver Objetivos de Proyecto, Lean Startup y Términos FinaPyme"
            >
              <FileText className="w-3.5 h-3.5 text-teal-300" />
              <span>Proyecto UES</span>
            </button>
          </div>

          <div className="p-2.5 rounded-[6px] bg-[#0b3b36] border border-teal-900/80 text-white">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-white truncate">
                {currentCompany.tradeName || currentCompany.name}
              </span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <div className="text-[10px] text-teal-200/90 space-y-0.5">
              <p>NRC: <span className="font-mono text-white">{currentCompany.nrc || '-'}</span></p>
              <p>NIT: <span className="font-mono text-white">{currentCompany.nit || '-'}</span></p>
              <p>Régimen: <span className="font-medium text-white">{currentCompany.isGranContribuyente ? 'Gran Contribuyente' : 'Mediano / Startup'}</span></p>
              <div className="pt-1.5 border-t border-teal-900/80 flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-400">
                  <Cloud className="w-3 h-3" />
                  Nube Conectada (Firestore SV)
                </span>
                <span className="text-[9px] text-teal-200 font-mono">En Línea</span>
              </div>
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
