import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  Building2,
  User,
  Moon,
  Sun,
  Search,
  Plus,
  Receipt,
  ShoppingBag,
  Users,
  ShieldAlert,
  ShieldCheck,
  ChevronDown,
  Sparkles,
  Zap,
  Store,
  Sliders,
  LogOut,
  Wallet,
  ScanBarcode,
  Cloud,
} from 'lucide-react';

interface HeaderProps {
  onOpenCommandPalette: () => void;
  onOpenNewSaleModal: () => void;
  onOpenNewPurchaseModal: () => void;
  onOpenNewPayrollModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCommandPalette,
  onOpenNewSaleModal,
  onOpenNewPurchaseModal,
  onOpenNewPayrollModal,
}) => {
  const {
    companies,
    currentCompany,
    setCurrentCompanyId,
    users,
    currentUser,
    setCurrentUserId,
    isDarkMode,
    setIsDarkMode,
    toggleDteMode,
    logout,
    setIsExhaustiveCustomizationOpen,
    setIsCloudUserManagerOpen,
    setActiveModule,
    isSupportMode,
    exitSupportMode,
  } = useERP();

  const [showCompanyMenu, setShowCompanyMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 lg:px-6 py-3 transition-colors">
      {/* Left side: Company Selector & Quick Search */}
      <div className="flex items-center gap-3">
        {/* Company Dropdown Switcher */}
        <div className="relative">
          <button
            id="company-selector-btn"
            onClick={() => {
              setShowCompanyMenu(!showCompanyMenu);
              setShowUserMenu(false);
            }}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 transition text-left cursor-pointer"
          >
            <div className="w-8 h-8 rounded-md bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              {currentCompany.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[180px]">
                  {currentCompany.tradeName || currentCompany.name}
                </span>
                {currentCompany.isGranContribuyente && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 rounded border border-amber-300 dark:border-amber-700">
                    Gran Contribuyente
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                NRC: {currentCompany.nrc} | NIT: {currentCompany.nit}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />
          </button>

          {showCompanyMenu && (
            <div className="absolute left-0 mt-2 w-72 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Empresas & Despachos (Multi-Tenant)
              </div>
              {companies.map((c) => (
                <button
                  key={c.id}
                  id={`select-company-${c.id}`}
                  onClick={() => {
                    setCurrentCompanyId(c.id);
                    setShowCompanyMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 transition ${
                    c.id === currentCompany.id ? 'bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-medium' : 'text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate text-sm">{c.tradeName || c.name}</span>
                  </div>
                  {c.id === currentCompany.id && (
                    <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400"></span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Global Quick Search / Command Palette Bar */}
        <button
          id="global-search-btn"
          onClick={onOpenCommandPalette}
          className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-400 text-xs transition cursor-pointer"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Buscar facturas, clientes, cuentas o atajos...</span>
          <kbd className="ml-3 px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-mono">
            ⌘K / Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Right side: Quick Action Buttons, Role Switcher, Dark Mode */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Fixed Preconfigured Account Archetype Badge (Locked per user requirement) */}
        <div
          id="header-fixed-archetype-badge"
          title="Modalidad predeterminada del negocio (Fijada para garantizar consistencia contable y fiscal)"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold ${
            currentCompany.dteActive
              ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
              : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
          }`}
        >
          <Building2 className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden xl:inline">Empresa:</span>
          <span className="font-bold">
            {currentCompany.dteActive ? 'Consolidada (DTE MH)' : 'Emprendedor (Control Interno)'}
          </span>
          <span className="text-[10px] px-1 py-0.5 rounded bg-white/70 dark:bg-black/40 font-mono text-slate-500 font-normal">
            Fijo
          </span>
        </div>

        {/* Master Admin Portal Access & Return Button */}
        {currentUser.role === 'admin_maestro' && (
          <button
            id="header-cloud-accounts-btn"
            type="button"
            onClick={exitSupportMode}
            title="Volver al Portal de Administración Maestro FINAMIPE SV"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Panel Maestro Admin</span>
            <span className="sm:hidden">Maestro</span>
          </button>
        )}

        {/* Quick Transaction Action buttons */}
        <div className="hidden lg:flex items-center gap-1.5">
          <button
            id="header-open-pos-terminal-btn"
            type="button"
            onClick={() => setActiveModule('pos_terminal')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-semibold shadow-sm transition cursor-pointer"
            title="Abrir Terminal de Ventas POS (Lector de Código de Barras)"
          >
            <ScanBarcode className="w-3.5 h-3.5" />
            <span>Caja POS</span>
          </button>

          <button
            id="quick-new-sale-btn"
            onClick={onOpenNewSaleModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-semibold shadow-sm transition cursor-pointer"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>{currentCompany.dteActive ? 'Emitir DTE' : 'Nueva Venta'}</span>
          </button>

          <button
            id="quick-new-purchase-btn"
            onClick={onOpenNewPurchaseModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-semibold shadow-sm transition cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Reg. Compra</span>
          </button>

          <button
            id="quick-new-payroll-btn"
            onClick={onOpenNewPayrollModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 active:scale-95 text-white text-xs font-semibold shadow-sm transition cursor-pointer"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Planilla SV</span>
          </button>
        </div>

        {/* Dark / Light Toggle */}
        <button
          id="theme-toggle-btn"
          onClick={() => setIsDarkMode((prev) => !prev)}
          className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          title="Alternar Modo Oscuro / Claro"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* User Role Switcher */}
        <div className="relative">
          <button
            id="user-profile-menu-btn"
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowCompanyMenu(false);
            }}
            className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 transition cursor-pointer"
          >
            <div className="w-7 h-7 rounded-full bg-slate-700 text-white flex items-center justify-center text-xs font-bold">
              {currentUser.name.charAt(0)}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[130px]">
                {currentUser.name}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">
                {currentUser.role.replace('_', ' ')}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl py-2 z-50">
              <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Simulador de Roles (Permisos)
              </div>
              {users.map((u) => (
                <button
                  key={u.id}
                  id={`select-user-${u.id}`}
                  onClick={() => {
                    setCurrentUserId(u.id);
                    setShowUserMenu(false);
                    if (u.role === 'cajero') {
                      setActiveModule('pos_terminal');
                    } else if (u.systemArchetype === 'finanzas_personales') {
                      setActiveModule('personal_finances');
                    }
                  }}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 transition ${
                    u.id === currentUser.id ? 'bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-medium' : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div>
                    <p className="text-xs font-semibold">{u.name}</p>
                    <p className="text-[11px] text-slate-500 capitalize">{u.role.replace('_', ' ')}</p>
                  </div>
                  {u.id === currentUser.id && (
                    <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400"></span>
                  )}
                </button>
              ))}

              <div className="my-1.5 border-t border-slate-100 dark:border-slate-800" />

              <button
                type="button"
                id="header-open-form-from-menu"
                onClick={() => {
                  setShowUserMenu(false);
                  setIsExhaustiveCustomizationOpen(true);
                }}
                className="w-full text-left px-3 py-2 text-xs text-blue-600 dark:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer font-medium"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Personalizar Sistema (Gran Formulario)</span>
              </button>

              <button
                type="button"
                id="header-logout-btn"
                onClick={() => {
                  setShowUserMenu(false);
                  logout();
                }}
                className="w-full text-left px-3 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2 cursor-pointer font-medium"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
