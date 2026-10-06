import React, { useState, useEffect } from 'react';
import { ERPProvider, useERP } from './context/ERPContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { ToastContainer } from './components/common/ToastContainer';
import { CommandPaletteModal } from './components/common/CommandPaletteModal';
import { FloatingAICopilot } from './components/common/FloatingAICopilot';

import { LoginScreen } from './components/auth/LoginScreen';
import { ExhaustiveCustomizationModal } from './components/settings/ExhaustiveCustomizationModal';
import { PersonalFinancesModule } from './components/personal/PersonalFinancesModule';
import { POSTerminalModule } from './components/pos/POSTerminalModule';

import { ExecutiveDashboard } from './components/dashboard/ExecutiveDashboard';
import { MarketingDashboard } from './components/dashboard/MarketingDashboard';
import { ForecastingModule } from './components/forecasting/ForecastingModule';
import { SalesModule } from './components/sales/SalesModule';
import { PurchasesModule } from './components/purchases/PurchasesModule';
import { PayrollModule } from './components/payroll/PayrollModule';
import { TreasuryModule } from './components/treasury/TreasuryModule';
import { AccountingModule } from './components/accounting/AccountingModule';
import { SettingsModule } from './components/settings/SettingsModule';
import { AcademyModule } from './components/academy/AcademyModule';
import { MasterDatabaseModule } from './components/database/MasterDatabaseModule';
import { StandalonePersonalFinanceLayout } from './components/personal/StandalonePersonalFinanceLayout';
import { CloudUserManagerModal } from './components/admin/CloudUserManagerModal';
import { AdminProfilesManagerModule } from './components/admin/AdminProfilesManagerModule';
import { CompanyUsersManagerModule } from './components/admin/CompanyUsersManagerModule';
import { MasterAdminPortal } from './components/admin/MasterAdminPortal';
import { TabletAttendanceKioskModal } from './components/payroll/TabletAttendanceKioskModal';
import { Menu, Layers } from 'lucide-react';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { SecurityAndPrivacyBanner } from './components/common/SecurityAndPrivacyBanner';
import { FinaPymeTermsAndProjectModal } from './components/common/FinaPymeTermsAndProjectModal';

const MainLayout: React.FC = () => {
  const {
    activeModule,
    isDarkMode,
    isAuthenticated,
    currentUser,
    currentCompany,
    isSupportMode,
    exitSupportMode,
    isExhaustiveCustomizationOpen,
    setIsExhaustiveCustomizationOpen,
    isCloudUserManagerOpen,
    setIsCloudUserManagerOpen,
    logout,
  } = useERP();

  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Prevent background scrolling on mobile when sidebar is open without disabling touch gestures
  useEffect(() => {
    if (isSidebarOpenMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isSidebarOpenMobile]);

  // Quick Action Modal States
  const [isNewSaleModalOpen, setIsNewSaleModalOpen] = useState(false);
  const [isNewPurchaseModalOpen, setIsNewPurchaseModalOpen] = useState(false);
  const [isNewPayrollModalOpen, setIsNewPayrollModalOpen] = useState(false);
  const [isSecurityTermsOpen, setIsSecurityTermsOpen] = useState(false);
  const [securityModalTab, setSecurityModalTab] = useState<'manifesto' | 'terms' | 'security' | 'team'>('security');

  // If user is not authenticated, display login screen
  if (!isAuthenticated) {
    return (
      <>
        <LoginScreen />
        <ToastContainer />
      </>
    );
  }

  // If user is Master Admin and not currently inspecting a company in support mode:
  if (currentUser?.role === 'admin_maestro' && !isSupportMode) {
    return (
      <>
        <MasterAdminPortal />
        <ToastContainer />
      </>
    );
  }

  // If user account is strictly Finanzas Personales, render completely isolated standalone portal!
  if (currentUser?.systemArchetype === 'finanzas_personales') {
    return (
      <>
        <StandalonePersonalFinanceLayout />
        <ToastContainer />
      </>
    );
  }

  // If user account is a Dedicated Tablet Kiosk for Attendance:
  if (currentUser?.role === 'kiosko_asistencia') {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'dark' : ''} bg-slate-950 flex flex-col justify-between`}>
        <TabletAttendanceKioskModal
          isOpen={true}
          onClose={logout}
        />
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`}>
      {/* Support Mode Top Floating Notification Banner */}
      {isSupportMode && (
        <div className="sticky top-0 z-50 bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white px-4 py-2.5 flex items-center justify-between text-xs sm:text-sm font-medium shadow-lg border-b border-amber-500/40">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              <strong>MODO ASISTENCIA TÉCNICA MAESTRA:</strong> Estás explorando el entorno de{' '}
              <strong>{currentCompany.tradeName || currentCompany.name}</strong>. Todos los datos corresponden exclusivamente a este negocio.
            </span>
          </div>
          <button
            onClick={exitSupportMode}
            className="px-3.5 py-1.5 rounded-xl bg-white text-slate-900 font-bold text-xs hover:bg-slate-100 shadow transition flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <span>⬅ Volver al Panel Maestro de Administración</span>
          </button>
        </div>
      )}
      <div className="bg-[#F6F8F7] dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen flex flex-col font-sans transition-colors">
        <div className="flex flex-1 relative">
          {/* Main Navigation Sidebar */}
          <Sidebar
            isOpenMobile={isSidebarOpenMobile}
            onCloseMobile={() => setIsSidebarOpenMobile(false)}
          />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Sticky Header with Tenant Switcher & Quick Search */}
            <Header
              isSidebarOpenMobile={isSidebarOpenMobile}
              onOpenMobileMenu={() => setIsSidebarOpenMobile(true)}
              onToggleMobileMenu={() => setIsSidebarOpenMobile((prev) => !prev)}
              onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
              onOpenNewSaleModal={() => setIsNewSaleModalOpen(true)}
              onOpenNewPurchaseModal={() => setIsNewPurchaseModalOpen(true)}
              onOpenNewPayrollModal={() => setIsNewPayrollModalOpen(true)}
              onOpenSecurityModal={() => {
                setSecurityModalTab('security');
                setIsSecurityTermsOpen(true);
              }}
            />

            {/* Dynamic Active Module Render */}
            <main className="flex-1 pb-16">
              <ErrorBoundary key={activeModule} fallbackTitle="Error al cargar módulo de navegación">
                {activeModule === 'personal_finances' && <PersonalFinancesModule />}
                {activeModule === 'pos_terminal' && <POSTerminalModule />}

                {activeModule === 'dashboard' && (
                  <ExecutiveDashboard
                    onOpenNewSale={() => setIsNewSaleModalOpen(true)}
                    onOpenNewPurchase={() => setIsNewPurchaseModalOpen(true)}
                    onOpenNewPayroll={() => setIsNewPayrollModalOpen(true)}
                  />
                )}

                {activeModule === 'marketing' && <MarketingDashboard />}

                {activeModule === 'forecasting' && <ForecastingModule />}

                {activeModule === 'sales' && (
                  <SalesModule
                    isNewSaleModalOpen={isNewSaleModalOpen}
                    onCloseNewSaleModal={() => setIsNewSaleModalOpen(false)}
                    onOpenNewSaleModal={() => setIsNewSaleModalOpen(true)}
                  />
                )}

                {(activeModule === 'purchases' || activeModule === 'inventory') && (
                  <PurchasesModule
                    isNewPurchaseModalOpen={isNewPurchaseModalOpen}
                    onCloseNewPurchaseModal={() => setIsNewPurchaseModalOpen(false)}
                    onOpenNewPurchaseModal={() => setIsNewPurchaseModalOpen(true)}
                    initialTab={activeModule === 'inventory' ? 'inventory' : 'purchases'}
                  />
                )}

                {activeModule === 'payroll' && (
                  <PayrollModule
                    isNewPayrollModalOpen={isNewPayrollModalOpen}
                    onCloseNewPayrollModal={() => setIsNewPayrollModalOpen(false)}
                    onOpenNewPayrollModal={() => setIsNewPayrollModalOpen(true)}
                  />
                )}

                {activeModule === 'treasury' && <TreasuryModule />}

                {activeModule === 'accounting' && <AccountingModule />}

                {activeModule === 'academy' && <AcademyModule />}

                {activeModule === 'master_database' && <MasterDatabaseModule />}

                {activeModule === 'settings' && <SettingsModule />}
                {activeModule === 'company_users' && <CompanyUsersManagerModule />}
                {activeModule === 'admin_profiles' && <AdminProfilesManagerModule />}
              </ErrorBoundary>
            </main>
          </div>
        </div>

        {/* Global Floating Modals & Notifications */}
        <ToastContainer />
        <FloatingAICopilot />
        <CommandPaletteModal
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          onOpenNewSale={() => setIsNewSaleModalOpen(true)}
          onOpenNewPurchase={() => setIsNewPurchaseModalOpen(true)}
          onOpenNewPayroll={() => setIsNewPayrollModalOpen(true)}
        />

        {/* Extensive System Customization Modal */}
        <ExhaustiveCustomizationModal
          isOpen={isExhaustiveCustomizationOpen || !currentUser.isConfigured}
          onClose={() => setIsExhaustiveCustomizationOpen(false)}
        />

        {/* Firebase Cloud User Manager Modal for Admin */}
        <CloudUserManagerModal
          isOpen={isCloudUserManagerOpen}
          onClose={() => setIsCloudUserManagerOpen(false)}
        />

        {/* Global Cybersecurity, SSL 256-bit & IP Address Telemetry Notice Banner */}
        <SecurityAndPrivacyBanner
          onOpenSecurityModal={() => {
            setSecurityModalTab('security');
            setIsSecurityTermsOpen(true);
          }}
        />

        {/* Terms, Privacy, IP Logging & Cybersecurity Information Modal */}
        <FinaPymeTermsAndProjectModal
          isOpen={isSecurityTermsOpen}
          onClose={() => setIsSecurityTermsOpen(false)}
          defaultTab={securityModalTab}
        />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ERPProvider>
      <MainLayout />
    </ERPProvider>
  );
}
