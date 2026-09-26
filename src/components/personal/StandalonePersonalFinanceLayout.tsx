import React from 'react';
import { useERP } from '../../context/ERPContext';
import { PersonalFinancesModule } from './PersonalFinancesModule';
import {
  Wallet,
  LogOut,
  Moon,
  Sun,
  ShieldCheck,
  Cloud,
  User,
  Sparkles,
  CheckCircle2,
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
        <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 py-3.5 transition-colors">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            {/* Logo and Distinct Personal Portal Brand */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white">
                    FINAMIPE SV <span className="text-emerald-600 dark:text-emerald-400">Finanzas Personales</span>
                  </h1>
                  <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                    Cuenta Personal Independiente
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Control de ingresos, gastos, ahorro y presupuestos en El Salvador (USD)
                </p>
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Cloud Badge */}
              <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                <Cloud className="w-3.5 h-3.5 text-emerald-500" />
                <span>Firebase Cloud</span>
              </div>

              {/* User Profile Pill */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-bold leading-tight text-slate-800 dark:text-slate-200">
                    {currentUser.name}
                  </p>
                  <p className="text-[10px] text-slate-400 leading-none">
                    {currentUser.email}
                  </p>
                </div>
              </div>

              {/* Dark Mode */}
              <button
                type="button"
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                title={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              >
                {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* Logout Button */}
              <button
                type="button"
                id="personal-portal-logout-btn"
                onClick={logout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-200 dark:border-rose-900/60 transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </header>

        {/* Standalone Personal Content */}
        <main className="flex-1 pb-16">
          <PersonalFinancesModule />
        </main>
      </div>
    </div>
  );
};
