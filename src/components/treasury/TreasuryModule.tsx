import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  Landmark,
  Plus,
  ArrowRightLeft,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertCircle,
  Clock,
  X,
  CreditCard,
  Building,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { BankAccount, TreasuryMovement, AccountType } from '../../types';
import { formatCurrencyUSD } from '../../utils/salvadoranTax';

export const TreasuryModule: React.FC = () => {
  const {
    bankAccounts,
    treasuryMovements,
    cashFlowProjections,
    createBankAccount,
    transferFunds,
    reconcileMovement,
  } = useERP();

  const [activeTab, setActiveTab] = useState<'accounts' | 'movements' | 'cashflow'>('cashflow');
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isNewAccountModalOpen, setIsNewAccountModalOpen] = useState(false);

  // Transfer Form State
  const [sourceAccId, setSourceAccId] = useState<string>(bankAccounts[0]?.id || '');
  const [targetAccId, setTargetAccId] = useState<string>(bankAccounts[1]?.id || '');
  const [transferAmount, setTransferAmount] = useState<number>(500);
  const [transferDescription, setTransferDescription] = useState<string>('Transferencia entre cuentas propias');
  const [transferRef, setTransferRef] = useState<string>('');

  // New Account Form
  const [newAccForm, setNewAccForm] = useState<{
    bankName: string;
    accountNumber: string;
    accountType: AccountType;
    accountName: string;
    initialBalance: number;
    accountingCode: string;
  }>({
    bankName: 'Banco Agrícola',
    accountNumber: '',
    accountType: 'banco_corriente',
    accountName: '',
    initialBalance: 1000,
    accountingCode: '1101-02-01',
  });

  const totalLiquidity = bankAccounts.reduce((acc, b) => acc + b.currentBalance, 0);

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sourceAccId === targetAccId) {
      alert('La cuenta origen y destino deben ser distintas.');
      return;
    }

    transferFunds(
      sourceAccId,
      targetAccId,
      transferAmount,
      transferRef || `TRF-${Date.now().toString().slice(-5)}`,
      transferDescription
    );

    setIsTransferModalOpen(false);
  };

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    createBankAccount({
      ...newAccForm,
      currency: 'USD',
    });
    setIsNewAccountModalOpen(false);
  };

  // Cash flow chart data
  const chartData = cashFlowProjections.map((p) => ({
    period: p.periodLabel,
    Ingresos: p.totalInflows,
    Egresos: p.totalOutflows,
    SaldoFinal: p.closingBalance,
  }));

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Tesorería, Bancos & Flujo de Caja
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300">
              Cash Flow 90 Días
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Control de cuentas bancarias salvadoreñas, transferencias internas y proyección de liquidez a 30, 60 y 90 días.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsNewAccountModalOpen(true)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-cyan-500" />
            <span>Nueva Cuenta / Caja</span>
          </button>
          <button
            onClick={() => setIsTransferModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 active:scale-95 text-white text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Transferencia entre Cuentas</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('cashflow')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
            activeTab === 'cashflow'
              ? 'bg-cyan-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Proyección Flujo de Caja (30/60/90d)
        </button>
        <button
          onClick={() => setActiveTab('accounts')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
            activeTab === 'accounts'
              ? 'bg-cyan-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Cuentas & Cajas ({bankAccounts.length})
        </button>
        <button
          onClick={() => setActiveTab('movements')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
            activeTab === 'movements'
              ? 'bg-cyan-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Libro de Bancos ({treasuryMovements.length})
        </button>
      </div>

      {/* Tab 1: Proyección de Flujo de Caja a 90 Días */}
      {activeTab === 'cashflow' && (
        <div className="space-y-6">
          {/* Top Liquidity Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl border border-cyan-200 dark:border-cyan-900 bg-cyan-50/70 dark:bg-cyan-950/40">
              <span className="text-xs font-semibold text-cyan-800 dark:text-cyan-300">
                Liquidez Actual Inmediata
              </span>
              <h3 className="text-2xl font-black text-cyan-950 dark:text-cyan-100 mt-1">
                {formatCurrencyUSD(totalLiquidity)}
              </h3>
              <p className="text-[11px] text-cyan-700 dark:text-cyan-400 mt-1">
                Suma consolidada en {bankAccounts.length} cuentas disponibles
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/70 dark:bg-emerald-950/40">
              <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                Proyección Flujo a 30 Días
              </span>
              <h3 className="text-2xl font-black text-emerald-950 dark:text-emerald-100 mt-1">
                {formatCurrencyUSD(cashFlowProjections[0]?.closingBalance || 0)}
              </h3>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1">
                Posición neta tras cobros y compromisos inmediatos
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/70 dark:bg-indigo-950/40">
              <span className="text-xs font-semibold text-indigo-800 dark:text-indigo-300">
                Proyección Flujo a 90 Días
              </span>
              <h3 className="text-2xl font-black text-indigo-950 dark:text-indigo-100 mt-1">
                {formatCurrencyUSD(cashFlowProjections[2]?.closingBalance || 0)}
              </h3>
              <p className="text-[11px] text-indigo-700 dark:text-indigo-400 mt-1">
                Horizonte trimestral con crecimiento sostenido
              </p>
            </div>
          </div>

          {/* Recharts Bar Chart */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              Comparativa de Entradas vs. Salidas & Saldo Proyectado (USD)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Integración de cuentas por cobrar, pagos a proveedores, planillas con ISSS/AFP y tributos fiscales
            </p>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="period" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `$${val}`} />
                  <Tooltip
                    formatter={(val: number) => [`$${val.toFixed(2)}`, '']}
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  />
                  <Legend />
                  <Bar dataKey="Ingresos" fill="#10b981" name="Cobros & Ingresos Proyectados" />
                  <Bar dataKey="Egresos" fill="#f43f5e" name="Pagos & Planilla Proyectada" />
                  <Bar dataKey="SaldoFinal" fill="#06b6d4" name="Saldo de Caja Final" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Breakdown cards for each period */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {cashFlowProjections.map((p, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3 text-xs"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">{p.periodLabel}</h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                    Posición Segura
                  </span>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 font-mono">
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span className="font-sans">Saldo Inicial:</span>
                    <span>{formatCurrencyUSD(p.openingBalance)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span className="font-sans">(+) Entradas (CxC):</span>
                    <span>+{formatCurrencyUSD(p.totalInflows)}</span>
                  </div>
                  <div className="flex justify-between text-rose-600 font-semibold">
                    <span className="font-sans">(-) Salidas & Nómina:</span>
                    <span>-{formatCurrencyUSD(p.totalOutflows)}</span>
                  </div>
                  <div className="flex justify-between text-slate-900 dark:text-white font-black text-sm pt-2 border-t font-sans">
                    <span>Saldo Final:</span>
                    <span className="font-mono text-cyan-600 dark:text-cyan-400">
                      {formatCurrencyUSD(p.closingBalance)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Bank Accounts */}
      {activeTab === 'accounts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bankAccounts.map((b) => (
            <div
              key={b.id}
              className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600">
                    <Landmark className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">{b.accountName}</h3>
                    <p className="text-xs text-slate-500">{b.bankName}</p>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 capitalize font-medium">
                  {b.accountType.replace('_', ' ')}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>N° Cuenta:</span>
                  <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                    {b.accountNumber}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Cuenta Contable:</span>
                  <span className="font-mono text-indigo-600">{b.accountingCode}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">Saldo Disponible:</span>
                  <span className="text-lg font-black font-mono text-slate-900 dark:text-white">
                    {formatCurrencyUSD(b.currentBalance)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Treasury Movements */}
      {activeTab === 'movements' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3.5">Fecha / Ref</th>
                  <th className="p-3.5">Cuenta Bancaria</th>
                  <th className="p-3.5">Descripción / Concepto</th>
                  <th className="p-3.5">Tipo Movimiento</th>
                  <th className="p-3.5 text-center">Conciliado</th>
                  <th className="p-3.5 text-right">Monto Transacción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {treasuryMovements.map((m) => {
                  const acc = bankAccounts.find((b) => b.id === m.bankAccountId);
                  const isIngreso =
                    m.type === 'ingreso_venta' || m.type === 'abono_cxc' || m.type === 'otro_ingreso';

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                      <td className="p-3.5 font-mono">
                        <p className="font-medium text-slate-900 dark:text-white">{m.date}</p>
                        <p className="text-[10px] text-slate-400">{m.referenceNumber || 'N/A'}</p>
                      </td>
                      <td className="p-3.5 font-semibold text-slate-800 dark:text-slate-200">
                        {acc?.accountName || m.bankAccountName || 'Caja General'}
                      </td>
                      <td className="p-3.5">
                        <p className="text-slate-800 dark:text-slate-200 font-medium">{m.description}</p>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 capitalize">
                          {m.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        {m.isReconciled ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" /> Sí
                          </span>
                        ) : (
                          <button
                            onClick={() => reconcileMovement(m.id)}
                            className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-600 hover:bg-amber-100 cursor-pointer"
                          >
                            Conciliar
                          </button>
                        )}
                      </td>
                      <td
                        className={`p-3.5 text-right font-mono font-black ${
                          isIngreso ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {isIngreso ? '+' : '-'}
                        {formatCurrencyUSD(m.amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: Transferencia entre Cuentas */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <ArrowRightLeft className="w-4 h-4 text-cyan-500" />
                <span>Transferencia de Fondos Interna</span>
              </h3>
              <button onClick={() => setIsTransferModalOpen(false)} className="cursor-pointer">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleTransferSubmit} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Cuenta Origen (Sale dinero):
                </label>
                <select
                  value={sourceAccId}
                  onChange={(e) => setSourceAccId(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  {bankAccounts.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.accountName} (Disponible: ${b.currentBalance.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Cuenta Destino (Ingresa dinero):
                </label>
                <select
                  value={targetAccId}
                  onChange={(e) => setTargetAccId(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  {bankAccounts.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.accountName} (Disponible: ${b.currentBalance.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Monto a Transferir ($ USD):
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold font-mono text-sm"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Motivo / Concepto:
                </label>
                <input
                  type="text"
                  value={transferDescription}
                  onChange={(e) => setTransferDescription(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsTransferModalOpen(false)} className="px-3 py-1.5 rounded-lg border">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-1.5 rounded-lg bg-cyan-600 text-white font-bold">
                  Ejecutar Transferencia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Nueva Cuenta Bancaria */}
      {isNewAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Registrar Cuenta Bancaria o Caja
              </h3>
              <button onClick={() => setIsNewAccountModalOpen(false)} className="cursor-pointer">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Institución Financiera:
                </label>
                <select
                  value={newAccForm.bankName}
                  onChange={(e) => setNewAccForm({ ...newAccForm, bankName: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="Banco Agrícola">Banco Agrícola</option>
                  <option value="BAC Credomatic">BAC Credomatic</option>
                  <option value="Banco Cuscatlán">Banco Cuscatlán</option>
                  <option value="Banco Davivienda">Banco Davivienda</option>
                  <option value="Caja General">Caja General</option>
                  <option value="Caja Chica">Caja Chica</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Nombre Identificador:
                </label>
                <input
                  type="text"
                  placeholder="Ej: BAC Dólares Operativa"
                  value={newAccForm.accountName}
                  onChange={(e) => setNewAccForm({ ...newAccForm, accountName: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    N° de Cuenta:
                  </label>
                  <input
                    type="text"
                    placeholder="012-345678-9"
                    value={newAccForm.accountNumber}
                    onChange={(e) => setNewAccForm({ ...newAccForm, accountNumber: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Saldo Inicial ($):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newAccForm.initialBalance}
                    onChange={(e) => setNewAccForm({ ...newAccForm, initialBalance: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsNewAccountModalOpen(false)} className="px-3 py-1.5 rounded-lg border">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-1.5 rounded-lg bg-cyan-600 text-white font-bold">
                  Guardar Cuenta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
