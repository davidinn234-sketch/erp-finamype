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
    <div className="bg-white dark:bg-slate-900 p-6 rounded-[8px] border border-[#E5E7EB] dark:border-slate-800 shadow-none space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E7EB] dark:border-slate-800">
        <div>
          <h3 className="text-[16px] font-semibold text-[#111827] dark:text-white">
            {title}
          </h3>
          <p className="text-[14px] text-[#6B7280] dark:text-slate-400 mt-0.5">{subtitle}</p>
          <p className="text-[12px] text-[#6B7280] dark:text-slate-400 mt-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#059669]"></span>
            <span>Capacidad de cobertura estimada: <strong>{runwayMonths} meses</strong> de operación ({bankAccounts.length} cuentas y cajas registradas).</span>
          </p>
        </div>

        <div className="flex items-center gap-4 self-start sm:self-auto">
          <div className="text-right">
            <span className="text-[12px] text-[#6B7280] dark:text-slate-400 block font-medium">
              Efectivo total disponible
            </span>
            <span className="text-[24px] font-semibold font-mono text-[#111827] dark:text-white">
              {formatCurrencyUSD(totalLiquid)}
            </span>
          </div>
          <button
            type="button"
            onClick={handleNavigate}
            className="px-3 py-1.5 rounded-[6px] border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-[#F9FAFB] dark:hover:bg-slate-800 text-[#111827] dark:text-slate-200 text-[14px] font-medium transition flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <span>Ver tesorería</span>
            <ArrowUpRight className="w-4 h-4 text-[#6B7280]" />
          </button>
        </div>
      </div>

      {/* Individual Bank Accounts (Clean Table / Rows, No Nested Cards) */}
      <div className="divide-y divide-[#E5E7EB] dark:divide-slate-800">
        {bankAccounts.map((account) => {
          const balance = account.currentBalance || 0;
          const percentage = totalLiquid > 0 ? (balance / totalLiquid) * 100 : 0;

          return (
            <div
              key={account.id}
              className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="min-w-0 flex items-center gap-3">
                <Landmark className="w-4 h-4 text-[#6B7280] shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[14px] font-medium text-[#111827] dark:text-white truncate">
                      {account.accountName}
                    </p>
                    <span className="text-[12px] text-[#6B7280] dark:text-slate-400">
                      · {account.bankName}
                    </span>
                  </div>
                  <p className="text-[12px] text-[#6B7280] dark:text-slate-400 font-mono">
                    N° {account.accountNumber} · Código {account.accountingCode}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 sm:justify-end shrink-0">
                <div className="w-32 hidden md:block">
                  <div className="w-full h-1.5 bg-[#E5E7EB] dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0F766E] rounded-full"
                      style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
                    />
                  </div>
                </div>
                <div className="text-right min-w-[100px]">
                  <p className="text-[14px] font-semibold font-mono text-[#111827] dark:text-white">
                    {formatCurrencyUSD(balance)}
                  </p>
                  <p className="text-[12px] text-[#6B7280] font-mono">
                    {percentage.toFixed(1)}% del total
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
