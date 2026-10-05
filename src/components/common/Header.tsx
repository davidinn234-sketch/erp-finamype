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
  Database,
  Layers,
  Check,
  Package,
  Menu,
} from 'lucide-react';

interface HeaderProps {
  onOpenMobileMenu?: () => void;
  onOpenCommandPalette: () => void;
  onOpenNewSaleModal: () => void;
  onOpenNewPurchaseModal: () => void;
  onOpenNewPayrollModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMobileMenu,
  onOpenCommandPalette,
  onOpenNewSaleModal,
  onOpenNewPurchaseModal,
  onOpenNewPayrollModal,
}) => {
  const {
    companies,
    currentCompany,
    setCurrentCompanyId,
    branches,
    selectedBranchId,
    setSelectedBranchId,
    currentUser,
    isDarkMode,
    setIsDarkMode,
    logout,
    setIsExhaustiveCustomizationOpen,
    setActiveModule,
  } = useERP();

  const [showCompanyMenu, setShowCompanyMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const activeBranchName =
    selectedBranchId === 'all' || !selectedBranchId
      ? 'Todas las sucursales'
      : branches.find((b) => b.id === selectedBranchId)?.name || 'Sucursal Principal';

  return (
    <header className="sticky top-0 z-[90] flex items-center justify-between border-b border-[#0b3b36] bg-[#0F4C45] text-white px-3 sm:px-4 lg:px-6 py-2.5 transition-colors shadow-xs">
      {/* ==================================================== */}
      {/* MOBILE HEADER: Una sola barra limpia (Menú, Empresa/Sucursal, Avatar) */}
      {/* Sin cajas con borde dentro de la barra */}
      {/* ==================================================== */}
      <div className="flex lg:hidden items-center justify-between w-full">
        {/* Hamburger Menu Icon (Sin caja con borde) */}
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="p-1.5 text-white/90 hover:text-white transition cursor-pointer"
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Nombre de la empresa con la sucursal debajo en texto pequeño (Sin caja con borde) */}
        <button
          type="button"
          onClick={() => {
            setShowCompanyMenu(!showCompanyMenu);
            setShowUserMenu(false);
          }}
          className="flex flex-col items-center text-center px-2 cursor-pointer max-w-[200px] truncate"
          title="Cambiar empresa o sucursal"
        >
          <div className="flex items-center gap-1">
            <span className="text-sm font-semibold text-white truncate leading-tight">
              {currentCompany.tradeName || currentCompany.name}
            </span>
            <ChevronDown className="w-3 h-3 text-teal-300 shrink-0" />
          </div>
          <span className="text-[11px] text-teal-200/90 truncate leading-tight">
            {activeBranchName}
          </span>
        </button>

        {/* Avatar en móvil (Sin caja con borde alrededor) */}
        <button
          type="button"
          onClick={() => {
            setShowUserMenu(!showUserMenu);
            setShowCompanyMenu(false);
          }}
          className="w-8 h-8 rounded-full bg-[#0F766E] hover:bg-[#115E59] text-white flex items-center justify-center text-xs font-bold cursor-pointer transition shrink-0"
          aria-label="Menú de usuario"
        >
          {(currentUser?.name || 'U').charAt(0)}
        </button>
      </div>

      {/* ==================================================== */}
      {/* DESKTOP HEADER (hidden en móvil, flex en lg) */}
      {/* ==================================================== */}
      <div className="hidden lg:flex items-center gap-4 min-w-0">
        {/* Single Main Logo */}
        <div className="flex items-center gap-2 pr-3 border-r border-[#0b3b36] shrink-0">
          <div className="w-8 h-8 rounded-[6px] bg-[#0F766E] flex items-center justify-center text-white shadow-xs">
            <Layers className="w-4 h-4" />
          </div>
          <span className="font-bold text-[15px] text-white tracking-tight">
            FinaPyme<span className="text-teal-300">.SV</span>
          </span>
        </div>

        {/* Company & Active Branch Selector */}
        <div className="relative">
          <button
            id="company-branch-selector-btn"
            onClick={() => {
              setShowCompanyMenu(!showCompanyMenu);
              setShowUserMenu(false);
            }}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-[6px] border border-teal-700/60 bg-teal-900/40 hover:bg-teal-900/70 text-left transition cursor-pointer"
            title="Cambiar empresa o sucursal activa"
          >
            <Store className="w-4 h-4 text-teal-300 shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-white truncate max-w-[160px]">
                  {currentCompany.tradeName || currentCompany.name}
                </span>
                {currentCompany.isGranContribuyente && (
                  <span className="px-1 py-0.2 rounded text-[9px] font-semibold bg-amber-400/20 text-amber-200 border border-amber-400/30">
                    Gran Contribuyente
                  </span>
                )}
              </div>
              <p className="text-[11px] text-teal-200/90 truncate">
                Sucursal: <span className="text-white font-medium">{activeBranchName}</span>
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-teal-300 shrink-0 ml-0.5" />
          </button>
        </div>

        {/* Global Quick Search Bar */}
        <button
          id="global-search-btn"
          onClick={onOpenCommandPalette}
          className="flex items-center gap-2 px-3 py-1.5 rounded-[6px] border border-teal-700/60 bg-teal-950/40 hover:bg-teal-950/70 text-teal-200/80 text-xs transition cursor-pointer"
        >
          <Search className="w-3.5 h-3.5 text-teal-300" />
          <span>Buscar facturas, clientes o atajos...</span>
          <kbd className="ml-2 px-1.5 py-0.5 rounded bg-teal-900/80 text-teal-200 text-[10px] font-mono">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Dropdown de Empresa y Sucursal (Común a Desktop y Móvil) */}
      {showCompanyMenu && (
        <>
          <div
            className="fixed inset-0 z-[95]"
            onClick={() => setShowCompanyMenu(false)}
          />
          <div className="absolute left-4 top-12 lg:left-36 mt-2 w-76 sm:w-80 rounded-[8px] border border-[#E3E8E6] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#111827] dark:text-slate-100 shadow-lg py-2 z-[100] animate-in fade-in zoom-in-95 duration-100">
            {/* Branch selector section */}
            <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#6B7280] dark:text-slate-400 border-b border-[#E3E8E6] dark:border-slate-800 flex items-center justify-between">
              <span>Sucursal de Operación</span>
              <Store className="w-3.5 h-3.5 text-[#0F766E]" />
            </div>
            <div className="py-1 border-b border-[#E3E8E6] dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setSelectedBranchId('all');
                  setShowCompanyMenu(false);
                }}
                className={`w-full text-left px-3 py-2 flex items-center justify-between text-xs transition cursor-pointer ${
                  selectedBranchId === 'all' || !selectedBranchId
                    ? 'bg-teal-50 dark:bg-teal-950/40 text-[#0F766E] font-semibold'
                    : 'text-[#111827] dark:text-slate-200 hover:bg-[#F6F8F7] dark:hover:bg-slate-800'
                }`}
              >
                <span>Todas las sucursales (Consolidado)</span>
                {(selectedBranchId === 'all' || !selectedBranchId) && (
                  <Check className="w-3.5 h-3.5 text-[#0F766E]" />
                )}
              </button>
              {branches.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    setSelectedBranchId(b.id);
                    setShowCompanyMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between text-xs transition cursor-pointer ${
                    selectedBranchId === b.id
                      ? 'bg-teal-50 dark:bg-teal-950/40 text-[#0F766E] font-semibold'
                      : 'text-[#111827] dark:text-slate-200 hover:bg-[#F6F8F7] dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="truncate">{b.name}</span>
                    {b.isMain && (
                      <span className="px-1 py-0.2 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-[#6B7280]">
                        Principal
                      </span>
                    )}
                  </div>
                  {selectedBranchId === b.id && (
                    <Check className="w-3.5 h-3.5 text-[#0F766E]" />
                  )}
                </button>
              ))}
            </div>

            {/* Company switch section for admin maestro */}
            {currentUser?.role === 'admin_maestro' && companies.length > 1 && (
              <>
                <div className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-[#6B7280] dark:text-slate-400">
                  Cambiar Empresa (Multi-Tenant)
                </div>
                {companies.map((c) => (
                  <button
                    key={c.id}
                    id={`select-company-${c.id}`}
                    onClick={() => {
                      setCurrentCompanyId(c.id);
                      setShowCompanyMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between text-xs transition cursor-pointer ${
                      c.id === currentCompany.id
                        ? 'bg-teal-50 dark:bg-teal-950/40 text-[#0F766E] font-semibold'
                        : 'text-[#111827] dark:text-slate-200 hover:bg-[#F6F8F7] dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Building2 className="w-3.5 h-3.5 text-[#6B7280] shrink-0" />
                      <span className="truncate">{c.tradeName || c.name}</span>
                    </div>
                    {c.id === currentCompany.id && (
                      <Check className="w-3.5 h-3.5 text-[#0F766E]" />
                    )}
                  </button>
                ))}
              </>
            )}
          </div>
        </>
      )}

      {/* Desktop Right Side Actions */}
      <div className="hidden lg:flex items-center gap-2 sm:gap-2.5">
        {/* Quick Transaction Action buttons: EXACTLY ONE PRIMARY (#0F766E) */}
        <div className="flex items-center gap-2">
          {/* THE ONLY PRIMARY ACTION BUTTON */}
          <button
            id="quick-new-sale-btn"
            onClick={onOpenNewSaleModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold shadow-none transition cursor-pointer"
            title="Emitir comprobante de venta o DTE"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Nueva venta</span>
          </button>

          <button
            id="quick-new-purchase-btn"
            onClick={onOpenNewPurchaseModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-teal-700/60 bg-teal-900/40 hover:bg-teal-900/70 text-teal-100 hover:text-white text-xs font-medium transition cursor-pointer"
            title="Registrar nueva compra a proveedores"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-teal-300" />
            <span>+ Compra</span>
          </button>

          <button
            id="quick-new-product-btn"
            onClick={() => setActiveModule('purchases')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-teal-700/60 bg-teal-900/40 hover:bg-teal-900/70 text-teal-100 hover:text-white text-xs font-medium transition cursor-pointer"
            title="Gestionar catálogo e inventario de productos"
          >
            <Package className="w-3.5 h-3.5 text-teal-300" />
            <span>+ Producto</span>
          </button>

          <button
            id="header-open-pos-terminal-btn"
            type="button"
            onClick={() => setActiveModule('pos_terminal')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-teal-700/60 bg-teal-900/40 hover:bg-teal-900/70 text-teal-100 hover:text-white text-xs font-medium transition cursor-pointer"
            title="Abrir Terminal de Ventas POS"
          >
            <ScanBarcode className="w-3.5 h-3.5 text-teal-300" />
            <span>Caja POS</span>
          </button>
        </div>

        {/* User Role Switcher Button */}
        <div className="relative">
          <button
            id="user-profile-menu-btn"
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowCompanyMenu(false);
            }}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-[6px] border border-teal-700/60 bg-teal-900/40 hover:bg-teal-900/70 text-white transition cursor-pointer"
          >
            <div className="w-6 h-6 rounded-full bg-[#0F766E] text-white flex items-center justify-center text-[11px] font-bold">
              {(currentUser?.name || 'U').charAt(0)}
            </div>
            <div className="text-left">
              <p className="text-xs font-semibold text-white truncate max-w-[120px]">
                {currentUser?.name || 'Usuario'}
              </p>
              <p className="text-[10px] text-teal-200 capitalize">
                {(currentUser?.role || 'admin_maestro').replace('_', ' ')}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-teal-300" />
          </button>
        </div>
      </div>

      {/* ==================================================== */}
      {/* MENÚ DEL AVATAR (Modo Oscuro y otras opciones dentro) */}
      {/* ==================================================== */}
      {showUserMenu && (
        <>
          {/* Click-outside backdrop */}
          <div
            className="fixed inset-0 z-[95]"
            onClick={() => setShowUserMenu(false)}
          />
          <div className="absolute right-4 top-12 mt-2 w-72 rounded-[8px] border border-[#E3E8E6] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#111827] dark:text-slate-100 shadow-lg py-2 z-[100] animate-in fade-in zoom-in-95 duration-100">
            <div className="px-4 py-2.5 border-b border-[#E3E8E6] dark:border-slate-800">
              <p className="text-xs font-bold text-[#111827] dark:text-white truncate">{currentUser?.name || 'Usuario'}</p>
              <p className="text-[11px] text-[#6B7280] dark:text-slate-400 truncate">{currentUser?.email || ''}</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-teal-50 dark:bg-teal-950/60 text-[#0F766E] dark:text-teal-400 capitalize border border-teal-200 dark:border-teal-800/40">
                  {(currentUser?.role || 'admin_maestro').replace('_', ' ')}
                </span>
                <span className="text-[10px] text-[#6B7280] truncate">
                  {currentCompany.tradeName || currentCompany.name}
                </span>
              </div>
            </div>

            {/* MODO OSCURO DENTRO DEL MENÚ DEL AVATAR */}
            <div className="px-2 py-1 border-b border-[#E3E8E6] dark:border-slate-800">
              <button
                type="button"
                id="avatar-menu-theme-toggle"
                onClick={() => setIsDarkMode((prev) => !prev)}
                className="w-full px-3 py-2 text-xs text-[#111827] dark:text-slate-200 hover:bg-[#F6F8F7] dark:hover:bg-slate-800 rounded-[6px] flex items-center justify-between cursor-pointer transition"
              >
                <div className="flex items-center gap-2">
                  {isDarkMode ? (
                    <Sun className="w-4 h-4 text-amber-500" />
                  ) : (
                    <Moon className="w-4 h-4 text-[#0F766E]" />
                  )}
                  <span className="font-medium">Modo Oscuro</span>
                </div>
                <span className="text-[11px] font-semibold text-[#6B7280]">
                  {isDarkMode ? 'Activado' : 'Desactivado'}
                </span>
              </button>
            </div>

            {currentUser?.role === 'admin_maestro' && (
              <button
                type="button"
                id="header-admin-portal-link"
                onClick={() => {
                  setShowUserMenu(false);
                  setActiveModule('admin_profiles');
                }}
                className="w-full text-left px-4 py-2 text-xs text-[#0F766E] hover:bg-teal-50 dark:hover:bg-teal-950/40 flex items-center gap-2 cursor-pointer font-semibold transition"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Panel Maestro Admin (Cuentas)</span>
              </button>
            )}

            <button
              type="button"
              id="header-master-database-link"
              onClick={() => {
                setShowUserMenu(false);
                setActiveModule('master_database');
              }}
              className="w-full text-left px-4 py-2 text-xs text-[#111827] dark:text-slate-200 hover:bg-[#F6F8F7] dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer font-medium transition"
            >
              <Database className="w-4 h-4 text-emerald-500" />
              <span>Base de Datos General & Ctrl+Z</span>
            </button>

            <button
              type="button"
              id="header-open-form-from-menu"
              onClick={() => {
                setShowUserMenu(false);
                setIsExhaustiveCustomizationOpen(true);
              }}
              className="w-full text-left px-4 py-2 text-xs text-[#111827] dark:text-slate-200 hover:bg-[#F6F8F7] dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer font-medium transition"
            >
              <Sliders className="w-4 h-4 text-teal-600" />
              <span>Personalizar Sistema (Ajustes)</span>
            </button>

            <div className="my-1.5 border-t border-[#E3E8E6] dark:border-slate-800" />

            <button
              type="button"
              id="header-logout-btn"
              onClick={() => {
                setShowUserMenu(false);
                logout();
              }}
              className="w-full text-left px-4 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-between cursor-pointer font-semibold transition"
            >
              <div className="flex items-center gap-2">
                <LogOut className="w-4 h-4 text-rose-500" />
                <span>Cerrar Sesión</span>
              </div>
              <span className="text-[10px] text-[#6B7280] font-normal">Salir</span>
            </button>
          </div>
        </>
      )}
    </header>
  );
};
