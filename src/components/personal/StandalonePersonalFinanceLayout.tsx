import React from 'react';
import { useERP } from '../../context/ERPContext';
import { PersonalFinancesModule } from './PersonalFinancesModule';
import {
  Wallet,
  LogOut,
  Moon,
  Sun,
  Shield,
} from 'lucide-react';

export const StandalonePersonalFinanceLayout: React.FC = () => {
  const {
    currentUser,
    logout,
    isDarkMode,
    setIsDarkMode,
  } = useERP();

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`}>
      <div className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen flex flex-col font-sans transition-colors">
        {/* Dedicated Independent Personal Finance Header */}
        <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 py-3 transition-colors">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            {/* Logo and Clean Brand */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 text-emerald-500 flex items-center justify-center shadow-xs">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm sm:text-base font-bold tracking-tight text-slate-900 dark:text-white">
                    FinaPyme <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Personal</span>
                  </h1>
                  <span className="text-xs text-slate-400 hidden sm:inline">
                    · El Salvador (USD)
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Control patrimonial, presupuestos y metas individuales
                </p>
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400">
                <Shield className="w-3.5 h-3.5 text-emerald-500" />
                <span>Nube Segura</span>
              </div>

              {/* User Profile */}
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
                <div className="w-5 h-5 rounded-full bg-slate-700 text-white flex items-center justify-center text-[10px] font-bold">
                  {currentUser.name.charAt(0)}
                </div>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 hidden sm:inline">
                  {currentUser.name}
                </span>
              </div>

              {/* Dark Mode */}
              <button
                type="button"
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                title={isDarkMode ? 'Modo claro' : 'Modo oscuro'}
              >
                {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
              </button>

              {/* Logout Button */}
              <button
                type="button"
                id="personal-portal-logout-btn"
                onClick={logout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </div>
        </header>

        {/* Standalone Personal Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          <PersonalFinancesModule />
        </main>
      </div>
    </div>
  );
};
