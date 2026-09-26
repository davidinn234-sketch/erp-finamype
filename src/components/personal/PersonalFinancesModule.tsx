import React, { useState, useMemo } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PlusCircle,
  PiggyBank,
  PieChart,
  Calendar,
  CreditCard,
  CheckCircle2,
  Trash2,
  Sliders,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Sparkles,
  ShoppingBag,
  Home,
  Car,
  HeartPulse,
  Coffee,
  Search,
} from 'lucide-react';

export const PersonalFinancesModule: React.FC = () => {
  const {
    currentUser,
    personalTransactions,
    personalBudgets,
    personalSavingGoals,
    addPersonalTransaction,
    deletePersonalTransaction,
    depositToSavingGoal,
    addPersonalSavingGoal,
    setIsExhaustiveCustomizationOpen,
  } = useERP();

  // Form states
  const [txType, setTxType] = useState<'ingreso' | 'gasto'>('gasto');
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>('Supermercado / Comida');
  const [concept, setConcept] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'debito' | 'credito' | 'transferencia' | 'chivo_wallet'>('debito');
  const [notes, setNotes] = useState<string>('');

  // Filter & Search
  const [filterType, setFilterType] = useState<'todos' | 'ingreso' | 'gasto'>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Deposit to goal modal / inline
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState<string>('');

  // New goal form
  const [showNewGoalModal, setShowNewGoalModal] = useState<boolean>(false);
  const [newGoalTitle, setNewGoalTitle] = useState<string>('');
  const [newGoalTarget, setNewGoalTarget] = useState<string>('');
  const [newGoalCategory, setNewGoalCategory] = useState<string>('Seguridad Financiera');

  // Categories preset
  const incomeCategories = [
    'Salario / Sueldo',
    'Honorarios / Freelance',
    'Rendimientos / Inversiones',
    'Venta Ocasional',
    'Remesas Familiares',
    'Otros Ingresos',
  ];

  const expenseCategories = [
    'Supermercado / Comida',
    'Vivienda y Servicios',
    'Transporte y Gasolina',
    'Salud y Farmacia',
    'Entretenimiento y Ocio',
    'Educación y Cursos',
    'Pago de Deudas / Tarjetas',
    'Ropa y Personal',
    'Otros Gastos',
  ];

  // Calculations
  const metrics = useMemo(() => {
    let totalIngresos = 0;
    let totalGastos = 0;

    personalTransactions.forEach((tx) => {
      if (tx.type === 'ingreso') {
        totalIngresos += tx.amount;
      } else {
        totalGastos += tx.amount;
      }
    });

    const balanceNeto = totalIngresos - totalGastos;
    const tasaAhorro = totalIngresos > 0 ? ((balanceNeto / totalIngresos) * 100) : 0;

    return {
      totalIngresos,
      totalGastos,
      balanceNeto,
      tasaAhorro: Math.max(0, tasaAhorro),
    };
  }, [personalTransactions]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return personalTransactions.filter((tx) => {
      if (filterType !== 'todos' && tx.type !== filterType) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          tx.concept.toLowerCase().includes(q) ||
          tx.category.toLowerCase().includes(q) ||
          tx.paymentMethod.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [personalTransactions, filterType, searchQuery]);

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;
    if (!concept.trim()) return;

    addPersonalTransaction({
      type: txType,
      amount: numAmount,
      category,
      concept,
      date,
      paymentMethod,
      notes: notes.trim() || undefined,
    });

    // Reset form
    setAmount('');
    setConcept('');
    setNotes('');
  };

  const handleDepositToGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoalId) return;
    const num = parseFloat(depositAmount);
    if (isNaN(num) || num <= 0) return;

    depositToSavingGoal(selectedGoalId, num);
    setSelectedGoalId(null);
    setDepositAmount('');
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(newGoalTarget);
    if (isNaN(target) || target <= 0) return;
    if (!newGoalTitle.trim()) return;

    addPersonalSavingGoal({
      title: newGoalTitle.trim(),
      targetAmount: target,
      currentAmount: 0,
      category: newGoalCategory,
    });

    setShowNewGoalModal(false);
    setNewGoalTitle('');
    setNewGoalTarget('');
  };

  return (
    <div id="personal-finances-module" className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-emerald-950/50 via-slate-900 to-slate-900 border border-emerald-800/30">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-1">
              <Wallet className="w-3.5 h-3.5" />
              Finanzas Personales
            </span>
            <span className="text-xs text-slate-400">• El Salvador (USD $)</span>
          </div>
          <h1 className="text-2xl font-bold text-white">
            Control de Ingresos y Egresos Personales
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Usuario activo: <strong className="text-white">{currentUser.name}</strong> • DUI: {currentUser.dui || 'No registrado'}
          </p>
        </div>

        <button
          type="button"
          id="open-customization-from-personal"
          onClick={() => setIsExhaustiveCustomizationOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium flex items-center gap-2 transition-all cursor-pointer shadow-sm w-fit"
        >
          <Sliders className="w-4 h-4 text-emerald-400" />
          <span>Personalizar Perfil y Requisitos</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Ingresos */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>Ingresos Registrados</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            ${metrics.totalIngresos.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" />
            Salarios, honorarios y rentas
          </span>
        </div>

        {/* Total Gastos */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>Total Gastos / Egresos</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            ${metrics.totalGastos.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-rose-500 font-medium flex items-center gap-1">
            <ArrowDownRight className="w-3 h-3" />
            Consumos y pagos del mes
          </span>
        </div>

        {/* Balance Neto */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>Balance Disponible</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-bold ${metrics.balanceNeto >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600'}`}>
            ${metrics.balanceNeto.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Fondo restante disponible
          </span>
        </div>

        {/* Tasa de Ahorro */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>Tasa de Ahorro</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {metrics.tasaAhorro.toFixed(1)}%
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Meta recomendada: 20%
          </span>
        </div>
      </div>

      {/* Main Grid: Add Form + Metas / Presupuesto */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Formulario para Agregar Movimiento */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-emerald-500" />
              Nuevo Movimiento
            </h2>
            <div className="flex p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => {
                  setTxType('gasto');
                  setCategory('Supermercado / Comida');
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  txType === 'gasto'
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Gasto
              </button>
              <button
                type="button"
                onClick={() => {
                  setTxType('ingreso');
                  setCategory('Salario / Sueldo');
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  txType === 'ingreso'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Ingreso
              </button>
            </div>
          </div>

          <form onSubmit={handleAddTransaction} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Monto ($ USD) *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 text-sm">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-7 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Categoría *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
              >
                {(txType === 'ingreso' ? incomeCategories : expenseCategories).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Concepto / Detalle *
              </label>
              <input
                type="text"
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                placeholder="Ej: Pago de gasolina, Alquiler, Salario..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Fecha
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Medio de Pago
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                >
                  <option value="debito">Tarjeta Débito</option>
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia 365</option>
                  <option value="credito">Tarjeta Crédito</option>
                  <option value="chivo_wallet">Chivo Wallet / BTC</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Notas / Referencia (Opcional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej: Aprobación BAC 4920, Selectos"
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              id="submit-personal-tx-btn"
              className={`w-full py-2.5 px-4 text-white text-xs font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                txType === 'ingreso'
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                  : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>{txType === 'ingreso' ? 'Registrar Ingreso' : 'Registrar Gasto'}</span>
            </button>
          </form>
        </div>

        {/* Right Column: Metas de Ahorro & Presupuestos */}
        <div className="lg:col-span-2 space-y-6">
          {/* Metas de Ahorro */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-500" />
                  Metas de Ahorro y Fondos Especiales
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Aparta fondos para contingencias, viajes y metas patrimoniales
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowNewGoalModal(true)}
                className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Nueva Meta</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {personalSavingGoals.map((goal) => {
                const percent = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
                return (
                  <div
                    key={goal.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2.5"
                  >
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-xs text-slate-900 dark:text-white line-clamp-1">
                        {goal.title}
                      </h3>
                      <span className="text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded font-medium">
                        {percent}%
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span>${goal.currentAmount.toFixed(2)}</span>
                      <span>Meta: ${goal.targetAmount.toFixed(2)}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedGoalId(goal.id)}
                      className="w-full py-1.5 px-2 bg-white dark:bg-slate-900 hover:bg-blue-50 border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 rounded-lg text-[11px] font-medium transition-all cursor-pointer"
                    >
                      + Abonar Ahorro
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Presupuesto de Gastos por Categoría */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-purple-500" />
              Control de Presupuesto Mensual por Categoría
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {personalBudgets.map((budget) => {
                // calculate spent in this category
                const spent = personalTransactions
                  .filter((t) => t.type === 'gasto' && t.category === budget.category)
                  .reduce((acc, t) => acc + t.amount, 0);

                const pct = Math.min(100, Math.round((spent / budget.budgetedAmount) * 100));
                const isOverBudget = spent > budget.budgetedAmount;

                return (
                  <div
                    key={budget.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {budget.category}
                      </span>
                      <span className={`font-mono text-[11px] font-medium ${isOverBudget ? 'text-rose-500' : 'text-slate-500 dark:text-slate-400'}`}>
                        ${spent.toFixed(2)} / ${budget.budgetedAmount.toFixed(2)}
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isOverBudget ? 'bg-rose-500' : pct > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Historial Detallado de Movimientos */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Historial de Ingresos y Egresos
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Registros detallados de tu flujo de efectivo personal
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por concepto o categoría..."
                className="pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white w-48 sm:w-60"
              />
            </div>

            <div className="flex p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setFilterType('todos')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  filterType === 'todos' ? 'bg-white dark:bg-slate-700 font-semibold shadow-xs' : 'text-slate-500'
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setFilterType('ingreso')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  filterType === 'ingreso' ? 'bg-white dark:bg-slate-700 font-semibold shadow-xs text-emerald-600' : 'text-slate-500'
                }`}
              >
                Ingresos
              </button>
              <button
                type="button"
                onClick={() => setFilterType('gasto')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  filterType === 'gasto' ? 'bg-white dark:bg-slate-700 font-semibold shadow-xs text-rose-500' : 'text-slate-500'
                }`}
              >
                Gastos
              </button>
            </div>
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs">
            No hay movimientos registrados para este filtro.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-medium">
                  <th className="py-2.5 px-3">Fecha</th>
                  <th className="py-2.5 px-3">Tipo</th>
                  <th className="py-2.5 px-3">Categoría</th>
                  <th className="py-2.5 px-3">Concepto</th>
                  <th className="py-2.5 px-3">Método</th>
                  <th className="py-2.5 px-3 text-right">Monto</th>
                  <th className="py-2.5 px-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {tx.date}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {tx.type === 'ingreso' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <ArrowUpRight className="w-3 h-3" />
                          Ingreso
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                          <ArrowDownRight className="w-3 h-3" />
                          Gasto
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-slate-200">
                      {tx.category}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                      <div>{tx.concept}</div>
                      {tx.notes && <div className="text-[10px] text-slate-400">{tx.notes}</div>}
                    </td>
                    <td className="py-2.5 px-3 capitalize text-slate-500 dark:text-slate-400">
                      {tx.paymentMethod.replace('_', ' ')}
                    </td>
                    <td className={`py-2.5 px-3 text-right font-semibold font-mono text-sm whitespace-nowrap ${
                      tx.type === 'ingreso' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {tx.type === 'ingreso' ? '+' : '-'}${tx.amount.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => deletePersonalTransaction(tx.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Eliminar movimiento"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Abonar a Meta de Ahorro */}
      {selectedGoalId && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Abonar a Meta de Ahorro
            </h3>
            <form onSubmit={handleDepositToGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Monto a Abonar ($ USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="Ej: 50.00"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedGoalId(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm cursor-pointer"
                >
                  Confirmar Abono
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Crear Nueva Meta */}
      {showNewGoalModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Crear Nueva Meta de Ahorro
            </h3>
            <form onSubmit={handleCreateGoal} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Título de la Meta *
                </label>
                <input
                  type="text"
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  placeholder="Ej: Viaje a Roatán, Prima de Casa..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Monto Objetivo ($ USD) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={newGoalTarget}
                  onChange={(e) => setNewGoalTarget(e.target.value)}
                  placeholder="Ej: 1000.00"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Categoría
                </label>
                <select
                  value={newGoalCategory}
                  onChange={(e) => setNewGoalCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                >
                  <option value="Seguridad Financiera">Seguridad Financiera</option>
                  <option value="Recreación">Recreación y Vacaciones</option>
                  <option value="Patrimonio">Patrimonio / Vivienda / Auto</option>
                  <option value="Educación">Educación / Certificaciones</option>
                  <option value="Inversión">Inversión y Negocios</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewGoalModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm cursor-pointer"
                >
                  Guardar Meta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
