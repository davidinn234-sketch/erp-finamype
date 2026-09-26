import React from 'react';
import { useERP } from '../../context/ERPContext';
import { Landmark, ArrowUpRight, ShieldCheck, Wallet, RefreshCw } from 'lucide-react';
import { formatCurrencyUSD } from '../../utils/salvadoranTax';

interface TreasuryCashBreakdownCardProps {
  onGoToTreasury?: () => void;
  title?: string;
  subtitle?: string;
}

export const TreasuryCashBreakdownCard: React.FC<TreasuryCashBreakdownCardProps> = ({
  onGoToTreasury,
  title = 'Disponibilidad de Efectivo & Cuentas Bancarias',
  subtitle = 'Distribución de liquidez en tiempo real en el sistema financiero salvadoreño',
}) => {
  const { bankAccounts, setActiveModule } = useERP();

  const totalLiquid = (bankAccounts || []).reduce((acc, b) => acc + (b.currentBalance || 0), 0);
  const monthlyBurnRate = 4800;
  const runwayMonths = monthlyBurnRate > 0 ? Number((totalLiquid / monthlyBurnRate).toFixed(1)) : 12;

  // Custom styling colors for typical Salvadoran banks
  const getBankColor = (bankName: string, index: number) => {
    const nameLower = bankName.toLowerCase();
    if (nameLower.includes('agrícola') || nameLower.includes('agricola')) {
      return {
        bg: 'bg-emerald-500',
        text: 'text-emerald-600 dark:text-emerald-400',
        badge: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      };
    }
    if (nameLower.includes('cuscatlán') || nameLower.includes('cuscatlan')) {
      return {
        bg: 'bg-amber-500',
        text: 'text-amber-600 dark:text-amber-400',
        badge: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      };
    }
    if (nameLower.includes('bac')) {
      return {
        bg: 'bg-rose-500',
        text: 'text-rose-600 dark:text-rose-400',
        badge: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
      };
    }
    if (nameLower.includes('caja') || nameLower.includes('chica') || nameLower.includes('efectivo')) {
      return {
        bg: 'bg-cyan-500',
        text: 'text-cyan-600 dark:text-cyan-400',
        badge: 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
      };
    }
    const fallbackColors = [
      { bg: 'bg-indigo-500', text: 'text-indigo-600 dark:text-indigo-400', badge: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800' },
      { bg: 'bg-purple-500', text: 'text-purple-600 dark:text-purple-400', badge: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800' },
      { bg: 'bg-teal-500', text: 'text-teal-600 dark:text-teal-400', badge: 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800' },
    ];
    return fallbackColors[index % fallbackColors.length];
  };

  const handleNavigate = () => {
    if (onGoToTreasury) {
      onGoToTreasury();
    } else {
      setActiveModule('treasury');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-950/80 text-cyan-600 dark:text-cyan-400">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{title}</span>
                <span className="text-xs bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Conciliado
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">
              Efectivo Total Inmediato
            </span>
            <span className="text-2xl sm:text-3xl font-black font-mono text-cyan-600 dark:text-cyan-400 tracking-tight">
              {formatCurrencyUSD(totalLiquid)}
            </span>
          </div>
          <button
            onClick={handleNavigate}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <span>Ver Tesorería</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Runway Banner */}
      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-slate-600 dark:text-slate-300">
            Capacidad de Cobertura (Runway): <strong>{runwayMonths} meses</strong> de operación con egresos fijos mensuales de $4,800.
          </span>
        </div>
        <span className="text-[11px] text-slate-400">
          {bankAccounts.length} cuentas bancarias y cajas activas
        </span>
      </div>

      {/* Individual Bank Accounts with Detailed Progress Bars */}
      <div className="space-y-4 pt-1">
        {bankAccounts.map((account, idx) => {
          const balance = account.currentBalance || 0;
          const percentage = totalLiquid > 0 ? (balance / totalLiquid) * 100 : 0;
          const styling = getBankColor(account.bankName || account.accountName, idx);

          return (
            <div
              key={account.id}
              className="p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition space-y-2.5"
            >
              {/* Account Title & Balance Row */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                    <Landmark className={`w-4 h-4 ${styling.text}`} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {account.accountName}
                      </h4>
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border ${styling.badge}`}>
                        {account.bankName}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 block">
                      N° {account.accountNumber} • Contable: {account.accountingCode}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-sm sm:text-base font-black font-mono text-slate-900 dark:text-white">
                    {formatCurrencyUSD(balance)}
                  </div>
                  <span className="text-[11px] font-bold text-slate-500 font-mono">
                    {percentage.toFixed(1)}% del efectivo
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${styling.bg} transition-all duration-500 rounded-full`}
                    style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
