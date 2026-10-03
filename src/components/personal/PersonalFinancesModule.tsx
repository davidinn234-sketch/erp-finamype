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
  Trash2,
  Sliders,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Search,
  Download,
  Calculator,
  Receipt,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Edit2,
  X,
} from 'lucide-react';
import { PersonalTransaction, PersonalSavingGoal, PersonalBudgetCategory } from '../../types';

export const PersonalFinancesModule: React.FC = () => {
  const {
    currentUser,
    personalTransactions,
    personalBudgets,
    personalSavingGoals,
    addPersonalTransaction,
    deletePersonalTransaction,
    updatePersonalBudget,
    depositToSavingGoal,
    addPersonalSavingGoal,
    setIsExhaustiveCustomizationOpen,
  } = useERP();

  // Active view tab inside Personal Finances
  const [activeTab, setActiveTab] = useState<
    'resumen' | 'movimientos' | 'presupuestos' | 'metas' | 'calculadora'
  >('resumen');

  // Month filter for analysis
  const [selectedMonth, setSelectedMonth] = useState<string>('all'); // 'all' or 'YYYY-MM'

  // New Transaction Form state
  const [txType, setTxType] = useState<'ingreso' | 'gasto'>('gasto');
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>('Supermercado & Alimentación');
  const [concept, setConcept] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<
    'efectivo' | 'debito' | 'credito' | 'transferencia' | 'chivo_wallet'
  >('debito');
  const [notes, setNotes] = useState<string>('');

  // Search & Filter in Movimientos tab
  const [filterType, setFilterType] = useState<'todos' | 'ingreso' | 'gasto'>('todos');
  const [filterCategory, setFilterCategory] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Deposit to Goal modal
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState<string>('');

  // New Goal modal
  const [showNewGoalModal, setShowNewGoalModal] = useState<boolean>(false);
  const [newGoalTitle, setNewGoalTitle] = useState<string>('');
  const [newGoalTarget, setNewGoalTarget] = useState<string>('');
  const [newGoalCategory, setNewGoalCategory] = useState<string>('Fondo de Emergencia');
  const [newGoalDate, setNewGoalDate] = useState<string>('');

  // Edit Budget modal
  const [editingBudget, setEditingBudget] = useState<{ id: string; category: string; amount: number } | null>(null);
  const [editBudgetAmount, setEditBudgetAmount] = useState<string>('');

  // Salvadoran Salary Calculator state
  const [calcSalary, setCalcSalary] = useState<string>('800.00');

  // Categories preset
  const incomeCategories = [
    'Salario & Sueldo Formal',
    'Honorarios & Servicios Profesionales',
    'Ventas & Comercio Propio',
    'Rendimientos & Inversiones',
    'Remesas Familiares',
    'Otros Ingresos',
  ];

  const expenseCategories = [
    'Supermercado & Alimentación',
    'Vivienda, Alquiler & Servicios',
    'Transporte, Combustible & Mantenimiento',
    'Salud, Medicina & Seguros',
    'Educación, Libros & Cursos',
    'Entretenimiento & Restaurantes',
    'Pago de Deudas & Tarjetas',
    'Cuidado Personal & Ropa',
    'Otros Gastos',
  ];

  // Available months extracted from transactions
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    personalTransactions.forEach((t) => {
      if (t.date && t.date.length >= 7) {
        set.add(t.date.substring(0, 7));
      }
    });
    // Ensure current month is present
    const currentMonth = new Date().toISOString().substring(0, 7);
    set.add(currentMonth);
    return Array.from(set).sort().reverse();
  }, [personalTransactions]);

  // Filtered transactions by month selection
  const monthFilteredTransactions = useMemo(() => {
    if (selectedMonth === 'all') return personalTransactions;
    return personalTransactions.filter((t) => (t.date || '').startsWith(selectedMonth));
  }, [personalTransactions, selectedMonth]);

  // Overall Financial Metrics
  const metrics = useMemo(() => {
    let totalIngresos = 0;
    let totalGastos = 0;

    monthFilteredTransactions.forEach((tx) => {
      if (tx.type === 'ingreso') {
        totalIngresos += tx.amount;
      } else {
        totalGastos += tx.amount;
      }
    });

    const balanceNeto = totalIngresos - totalGastos;
    const tasaAhorro = totalIngresos > 0 ? (balanceNeto / totalIngresos) * 100 : 0;

    // Rule 50/30/20 breakdown
    // Needs: Supermercado, Vivienda, Transporte, Salud, Educación
    // Wants: Entretenimiento, Cuidado Personal
    // Savings/Debt: Pago de Deudas, Ahorro
    let necesidades = 0;
    let deseos = 0;
    let ahorrosDeudas = 0;

    monthFilteredTransactions.forEach((tx) => {
      if (tx.type === 'gasto') {
        const cat = tx.category.toLowerCase();
        if (
          cat.includes('supermercado') ||
          cat.includes('vivienda') ||
          cat.includes('transporte') ||
          cat.includes('salud') ||
          cat.includes('educación')
        ) {
          necesidades += tx.amount;
        } else if (cat.includes('deuda') || cat.includes('ahorro')) {
          ahorrosDeudas += tx.amount;
        } else {
          deseos += tx.amount;
        }
      }
    });

    // Add remaining net savings to savings bucket if positive
    if (balanceNeto > 0) {
      ahorrosDeudas += balanceNeto;
    }

    const totalBase5020 = totalIngresos > 0 ? totalIngresos : totalGastos;
    const pctNecesidades = totalBase5020 > 0 ? Math.round((necesidades / totalBase5020) * 100) : 0;
    const pctDeseos = totalBase5020 > 0 ? Math.round((deseos / totalBase5020) * 100) : 0;
    const pctAhorros = totalBase5020 > 0 ? Math.round((ahorrosDeudas / totalBase5020) * 100) : 0;

    return {
      totalIngresos,
      totalGastos,
      balanceNeto,
      tasaAhorro: Math.max(0, tasaAhorro),
      necesidades,
      deseos,
      ahorrosDeudas,
      pctNecesidades,
      pctDeseos,
      pctAhorros,
    };
  }, [monthFilteredTransactions]);

  // Expenses grouped by Category
  const categoryExpenses = useMemo(() => {
    const map = new Map<string, number>();
    monthFilteredTransactions.forEach((tx) => {
      if (tx.type === 'gasto') {
        map.set(tx.category, (map.get(tx.category) || 0) + tx.amount);
      }
    });

    const list = Array.from(map.entries()).map(([name, total]) => ({
      name,
      total,
      percentage: metrics.totalGastos > 0 ? Math.round((total / metrics.totalGastos) * 100) : 0,
    }));

    return list.sort((a, b) => b.total - a.total);
  }, [monthFilteredTransactions, metrics.totalGastos]);

  // Filtered transactions for Movimientos view
  const visibleTransactions = useMemo(() => {
    return monthFilteredTransactions.filter((tx) => {
      if (filterType !== 'todos' && tx.type !== filterType) return false;
      if (filterCategory !== 'todos' && tx.category !== filterCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          tx.concept.toLowerCase().includes(q) ||
          tx.category.toLowerCase().includes(q) ||
          tx.paymentMethod.toLowerCase().includes(q) ||
          (tx.notes && tx.notes.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [monthFilteredTransactions, filterType, filterCategory, searchQuery]);

  // Salvadoran Payroll Net Salary Calculation (Ley de El Salvador)
  const salaryCalcResult = useMemo(() => {
    const nominal = parseFloat(calcSalary) || 0;
    if (nominal <= 0) {
      return { nominal: 0, isss: 0, afp: 0, gravable: 0, renta: 0, liquidoMensual: 0, liquidoQuincenal: 0 };
    }

    // ISSS: 3% con tope salarial de $1,000 (máximo $30.00)
    const isss = Math.min(30.0, Number((nominal * 0.03).toFixed(2)));

    // AFP: 7.25% sin tope
    const afp = Number((nominal * 0.0725).toFixed(2));

    // Base gravable de Renta
    const gravable = Number((nominal - isss - afp).toFixed(2));

    // Tabla mensual de Retención del Impuesto Sobre la Renta (Ministerio de Hacienda El Salvador)
    let renta = 0;
    if (gravable <= 472.0) {
      renta = 0;
    } else if (gravable <= 895.24) {
      renta = Number(((gravable - 472.0) * 0.1 + 17.67).toFixed(2));
    } else if (gravable <= 2038.1) {
      renta = Number(((gravable - 895.24) * 0.2 + 60.0).toFixed(2));
    } else {
      renta = Number(((gravable - 2038.1) * 0.3 + 288.57).toFixed(2));
    }

    const liquidoMensual = Number((nominal - isss - afp - renta).toFixed(2));
    const liquidoQuincenal = Number((liquidoMensual / 2).toFixed(2));

    return {
      nominal,
      isss,
      afp,
      gravable,
      renta,
      liquidoMensual,
      liquidoQuincenal,
    };
  }, [calcSalary]);

  // Handlers
  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;
    if (!concept.trim()) return;

    addPersonalTransaction({
      type: txType,
      amount: numAmount,
      category,
      concept: concept.trim(),
      date,
      paymentMethod,
      notes: notes.trim() || undefined,
    });

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
      targetDate: newGoalDate || undefined,
    });

    setShowNewGoalModal(false);
    setNewGoalTitle('');
    setNewGoalTarget('');
    setNewGoalDate('');
  };

  const handleSaveBudgetAmount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBudget) return;
    const val = parseFloat(editBudgetAmount);
    if (isNaN(val) || val < 0) return;

    updatePersonalBudget(editingBudget.id, val);
    setEditingBudget(null);
  };

  const handleAddSalaryToTransactions = (frequency: 'quincenal' | 'mensual') => {
    const val = frequency === 'quincenal' ? salaryCalcResult.liquidoQuincenal : salaryCalcResult.liquidoMensual;
    if (val <= 0) return;

    addPersonalTransaction({
      type: 'ingreso',
      amount: val,
      category: 'Salario & Sueldo Formal',
      concept: `Pago de Salario Neto (${frequency === 'quincenal' ? 'Quincena' : 'Mes'})`,
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'transferencia',
      notes: `Bruto: $${salaryCalcResult.nominal.toFixed(2)} - ISSS: $${salaryCalcResult.isss.toFixed(2)} - AFP: $${salaryCalcResult.afp.toFixed(2)} - Renta: $${salaryCalcResult.renta.toFixed(2)}`,
    });
  };

  const handleExportCSV = () => {
    if (personalTransactions.length === 0) return;
    const headers = ['Fecha', 'Tipo', 'Categoría', 'Concepto', 'Monto_USD', 'Medio_Pago', 'Notas'];
    const rows = personalTransactions.map((t) => [
      t.date,
      t.type,
      `"${t.category.replace(/"/g, '""')}"`,
      `"${t.concept.replace(/"/g, '""')}"`,
      t.amount.toFixed(2),
      t.paymentMethod,
      `"${(t.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `finanzas_personales_${currentUser.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="personal-finances-module" className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* Top Header: Clean, Quiet & Uncluttered */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>Finanzas Personales</span>
            <span aria-hidden="true">·</span>
            <span>El Salvador (USD)</span>
            <span aria-hidden="true">·</span>
            <span>{currentUser.name}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
            Gestión Financiera Personal
          </h1>
        </div>

        {/* Global Month Filter & Personalize Button */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
            >
              <option value="all">Todo el Histórico</option>
              {availableMonths.map((m) => {
                const [year, month] = m.split('-');
                const dateObj = new Date(parseInt(year), parseInt(month) - 1, 1);
                const monthName = dateObj.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
                return (
                  <option key={m} value={m}>
                    {monthName.charAt(0).toUpperCase() + monthName.slice(1)}
                  </option>
                );
              })}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setIsExhaustiveCustomizationOpen(true)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
            title="Configurar perfil y preferencias"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Preferencias</span>
          </button>
        </div>
      </div>

      {/* Primary Navigation Tabs (Segmented Controls) */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl overflow-x-auto">
        {[
          { id: 'resumen', label: 'Resumen & Diagnóstico', icon: PieChart },
          { id: 'movimientos', label: 'Movimientos & Registro', icon: Receipt },
          { id: 'presupuestos', label: 'Presupuestos Mensuales', icon: Sliders },
          { id: 'metas', label: 'Metas de Ahorro', icon: Target },
          { id: 'calculadora', label: 'Calculadora Salario SV', icon: Calculator },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                isActive
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: RESUMEN & DIAGNÓSTICO (50/30/20 & KPIS) */}
      {activeTab === 'resumen' && (
        <div className="space-y-6">
          {/* Main Financial KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Balance Disponible */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Balance Neto Disponible
              </span>
              <p className={`text-2xl font-bold tracking-tight ${metrics.balanceNeto >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-600'}`}>
                ${metrics.balanceNeto.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-slate-500">
                {metrics.balanceNeto >= 0 ? 'Superávit líquido de flujo' : 'Déficit temporal en el período'}
              </p>
            </div>

            {/* Total Ingresos */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
                <span>Ingresos Registrados</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                ${metrics.totalIngresos.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-slate-500">
                Sueldos, honorarios y rentas
              </p>
            </div>

            {/* Total Gastos */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
                <span>Gastos & Consumos</span>
                <TrendingDown className="w-4 h-4 text-rose-500" />
              </div>
              <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                ${metrics.totalGastos.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-slate-500">
                Pagos diarios y necesidades
              </p>
            </div>

            {/* Tasa de Ahorro */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
                <span>Tasa de Ahorro</span>
                <PiggyBank className="w-4 h-4 text-indigo-500" />
              </div>
              <p className="text-2xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400">
                {metrics.tasaAhorro.toFixed(1)}%
              </p>
              <p className="text-[11px] text-slate-500">
                Estándar financiero: ≥ 20%
              </p>
            </div>
          </div>

          {/* Golden Rule 50/30/20 Analysis */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Diagnóstico por Regla 50 / 30 / 20
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Distribución recomendada para salud patrimonial y cobertura de imprevistos
                </p>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {selectedMonth === 'all' ? 'Histórico General' : selectedMonth}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 50% Necesidades */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Necesidades Básicas (50%)
                  </span>
                  <span className="font-mono font-bold text-slate-600 dark:text-slate-300">
                    {metrics.pctNecesidades}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      metrics.pctNecesidades <= 50 ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${Math.min(100, metrics.pctNecesidades)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>${metrics.necesidades.toFixed(2)}</span>
                  <span>Objetivo: 50%</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                  Comida, vivienda, transporte, salud y servicios esenciales.
                </p>
              </div>

              {/* 30% Deseos */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Gustos & Estilo de Vida (30%)
                  </span>
                  <span className="font-mono font-bold text-slate-600 dark:text-slate-300">
                    {metrics.pctDeseos}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      metrics.pctDeseos <= 30 ? 'bg-indigo-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, metrics.pctDeseos)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>${metrics.deseos.toFixed(2)}</span>
                  <span>Objetivo: 30%</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                  Restaurantes, entretenimiento, ropa, ocio y compras discrecionales.
                </p>
              </div>

              {/* 20% Ahorro & Deuda */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Ahorro, Inversión & Deuda (20%)
                  </span>
                  <span className="font-mono font-bold text-slate-600 dark:text-slate-300">
                    {metrics.pctAhorros}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      metrics.pctAhorros >= 20 ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${Math.min(100, metrics.pctAhorros)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>${metrics.ahorrosDeudas.toFixed(2)}</span>
                  <span>Objetivo: 20%</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                  Fondo de emergencia, aportes a metas y abonos extraordinarios a capital.
                </p>
              </div>
            </div>
          </div>

          {/* Category Breakdown & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Gastos por Categoría */}
            <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Distribución de Egresos por Rubro
              </h3>

              {categoryExpenses.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">
                  No hay gastos registrados en el período seleccionado.
                </p>
              ) : (
                <div className="space-y-3">
                  {categoryExpenses.map((cat) => (
                    <div key={cat.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-700 dark:text-slate-300 font-medium">
                          {cat.name}
                        </span>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-slate-900 dark:text-white font-bold">
                            ${cat.total.toFixed(2)}
                          </span>
                          <span className="text-slate-400 text-[11px]">
                            ({cat.percentage}%)
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all"
                          style={{ width: `${cat.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Summary of Goals */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Metas de Ahorro
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('metas')}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  Ver todas
                </button>
              </div>

              {personalSavingGoals.length === 0 ? (
                <div className="text-center py-6 space-y-2">
                  <p className="text-xs text-slate-400">Aún no has configurado metas de ahorro.</p>
                  <button
                    type="button"
                    onClick={() => setShowNewGoalModal(true)}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold cursor-pointer"
                  >
                    Crear primera meta
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {personalSavingGoals.slice(0, 3).map((goal) => {
                    const pct = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
                    return (
                      <div
                        key={goal.id}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800 space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {goal.title}
                          </span>
                          <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                            {pct}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                          <span>${goal.currentAmount.toFixed(2)}</span>
                          <span>Meta: ${goal.targetAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MOVIMIENTOS & REGISTRO */}
      {activeTab === 'movimientos' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form to add transaction */}
          <div className="lg:col-span-1 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 h-fit">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Registrar Movimiento
              </h3>

              <div className="flex p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setTxType('gasto');
                    setCategory('Supermercado & Alimentación');
                  }}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                    txType === 'gasto'
                      ? 'bg-rose-500 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Gasto
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTxType('ingreso');
                    setCategory('Salario & Sueldo Formal');
                  }}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                    txType === 'ingreso'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
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
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 text-sm font-semibold">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
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
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none"
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
                  placeholder="Ej: Combustible Texaco, Compra Súper Selectos"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none"
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
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Medio de Pago
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  >
                    <option value="debito">Tarjeta Débito</option>
                    <option value="transferencia">Transferencia 365</option>
                    <option value="efectivo">Efectivo</option>
                    <option value="credito">Tarjeta Crédito</option>
                    <option value="chivo_wallet">Chivo Wallet / BTC</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Notas adicionales
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Referencia de factura o ticket"
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                className={`w-full py-2.5 px-4 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer ${
                  txType === 'ingreso'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                <span>{txType === 'ingreso' ? 'Guardar Ingreso' : 'Guardar Gasto'}</span>
              </button>
            </form>
          </div>

          {/* Transactions List */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Historial de Transacciones
                </h3>
                <p className="text-xs text-slate-500">
                  {visibleTransactions.length} registros en la vista actual
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs text-slate-700 dark:text-slate-200 font-medium flex items-center gap-1.5 cursor-pointer"
                  title="Descargar en formato Excel / CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exportar CSV</span>
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar concepto o nota..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                >
                  <option value="todos">Todos los Tipos</option>
                  <option value="ingreso">Solo Ingresos</option>
                  <option value="gasto">Solo Gastos</option>
                </select>
              </div>

              <div>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                >
                  <option value="todos">Todas las Categorías</option>
                  {[...incomeCategories, ...expenseCategories].map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-medium">
                    <th className="py-2.5 px-3">Fecha</th>
                    <th className="py-2.5 px-3">Concepto & Categoría</th>
                    <th className="py-2.5 px-3">Medio</th>
                    <th className="py-2.5 px-3 text-right">Monto</th>
                    <th className="py-2.5 px-2 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {visibleTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                      <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap">
                        {tx.date}
                      </td>
                      <td className="py-2.5 px-3">
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {tx.concept}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {tx.category} {tx.notes && `· ${tx.notes}`}
                        </p>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 capitalize whitespace-nowrap">
                        {tx.paymentMethod.replace('_', ' ')}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold whitespace-nowrap">
                        <span className={tx.type === 'ingreso' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}>
                          {tx.type === 'ingreso' ? '+' : '-'}${tx.amount.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => deletePersonalTransaction(tx.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-500 transition cursor-pointer"
                          title="Eliminar movimiento"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {visibleTransactions.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-xs text-slate-400">
                        No se encontraron transacciones con los filtros actuales.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PRESUPUESTOS MENSUALES */}
      {activeTab === 'presupuestos' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Presupuestos Máximos por Categoría
              </h3>
              <p className="text-xs text-slate-500">
                Límites mensuales para evitar fugas de capital y mantener control de gastos
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {personalBudgets.map((budget) => {
              const spent = monthFilteredTransactions
                .filter((t) => t.type === 'gasto' && t.category === budget.category)
                .reduce((acc, t) => acc + t.amount, 0);

              const pct = budget.budgetedAmount > 0 ? Math.min(100, Math.round((spent / budget.budgetedAmount) * 100)) : 0;
              const isOver = spent > budget.budgetedAmount;

              return (
                <div
                  key={budget.id}
                  className="p-4 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 space-y-2.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {budget.category}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingBudget({ id: budget.id, category: budget.category, amount: budget.budgetedAmount });
                        setEditBudgetAmount(String(budget.budgetedAmount));
                      }}
                      className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Modificar</span>
                    </button>
                  </div>

                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isOver ? 'bg-rose-500' : pct > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span className={isOver ? 'text-rose-600 font-bold' : ''}>
                      Gastado: ${spent.toFixed(2)}
                    </span>
                    <span>Límite: ${budget.budgetedAmount.toFixed(2)}</span>
                  </div>

                  {isOver && (
                    <p className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>Límite mensual excedido por ${(spent - budget.budgetedAmount).toFixed(2)}</span>
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: METAS DE AHORRO */}
      {activeTab === 'metas' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Metas & Fondos Patrimoniales
              </h3>
              <p className="text-xs text-slate-500">
                Ahorro intencional para emergencias, educación, viajes o compras importantes
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowNewGoalModal(true)}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Nueva Meta</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {personalSavingGoals.map((goal) => {
              const pct = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
              const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

              return (
                <div
                  key={goal.id}
                  className="p-5 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                          {goal.title}
                        </h4>
                        <span className="text-[11px] text-slate-500">
                          {goal.category} {goal.targetDate && `· Meta: ${goal.targetDate}`}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                        {pct}%
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>

                    <div className="flex justify-between text-xs font-mono">
                      <span className="font-bold text-slate-900 dark:text-white">
                        ${goal.currentAmount.toFixed(2)}
                      </span>
                      <span className="text-slate-500">
                        Objetivo: ${goal.targetAmount.toFixed(2)}
                      </span>
                    </div>

                    {remaining > 0 ? (
                      <p className="text-[11px] text-slate-400 font-medium">
                        Faltan ${remaining.toFixed(2)} para completar el 100%
                      </p>
                    ) : (
                      <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>¡Meta completada con éxito!</span>
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedGoalId(goal.id)}
                    className="w-full py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-indigo-600 dark:text-indigo-400 transition cursor-pointer"
                  >
                    + Abonar Fondos a Esta Meta
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: CALCULADORA SALARIAL LEGAL EL SALVADOR */}
      {activeTab === 'calculadora' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Calculadora de Salario Neto SV
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Cálculo conforme a la Ley de ISSS, Ley del SAP (AFP) y Código Tributario de El Salvador
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Sueldo Nominal Bruto Mensual ($ USD)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 text-sm font-semibold">
                  $
                </span>
                <input
                  type="number"
                  step="10.00"
                  min="0"
                  value={calcSalary}
                  onChange={(e) => setCalcSalary(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-base font-bold text-slate-900 dark:text-white outline-none"
                />
              </div>
            </div>

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <span className="text-[11px] text-slate-400 font-medium">Sueldos de Referencia en SV:</span>
              <div className="flex flex-wrap gap-1.5">
                {['365.00', '500.00', '800.00', '1200.00', '1800.00', '2500.00'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setCalcSalary(preset)}
                    className="px-2.5 py-1 rounded-md text-[11px] font-mono border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    ${preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                Registrar automáticamente:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleAddSalaryToTransactions('quincenal')}
                  className="py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition cursor-pointer text-center"
                >
                  + Quincena (${salaryCalcResult.liquidoQuincenal.toFixed(2)})
                </button>
                <button
                  type="button"
                  onClick={() => handleAddSalaryToTransactions('mensual')}
                  className="py-2 px-3 rounded-lg bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition cursor-pointer text-center"
                >
                  + Mes (${salaryCalcResult.liquidoMensual.toFixed(2)})
                </button>
              </div>
            </div>
          </div>

          {/* Breakdown Card */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Desglose de Deducciones de Ley SV
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800 space-y-2">
                <span className="text-xs text-slate-500 font-medium">Sueldo Neto Mensual a Recibir</span>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  ${salaryCalcResult.liquidoMensual.toFixed(2)}
                </p>
                <p className="text-[11px] text-slate-400">
                  Total depositado en cuenta bancaria al mes
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800 space-y-2">
                <span className="text-xs text-slate-500 font-medium">Pago Quincenal Estimado (Día 15 y 30)</span>
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                  ${salaryCalcResult.liquidoQuincenal.toFixed(2)}
                </p>
                <p className="text-[11px] text-slate-400">
                  Líquido aproximado por cada quincena
                </p>
              </div>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
              <div className="bg-slate-50 dark:bg-slate-800/80 px-4 py-2.5 font-bold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 flex justify-between">
                <span>Rubro de Deducción</span>
                <span>Monto Retenido</span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                <div className="px-4 py-2.5 flex justify-between">
                  <span className="font-sans text-slate-700 dark:text-slate-300">
                    Sueldo Bruto Nominal
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    ${salaryCalcResult.nominal.toFixed(2)}
                  </span>
                </div>
                <div className="px-4 py-2.5 flex justify-between text-rose-600 dark:text-rose-400">
                  <span className="font-sans">
                    ISSS Trabajador (3.0% · Tope $30.00)
                  </span>
                  <span>-${salaryCalcResult.isss.toFixed(2)}</span>
                </div>
                <div className="px-4 py-2.5 flex justify-between text-rose-600 dark:text-rose-400">
                  <span className="font-sans">
                    AFP Trabajador (7.25%)
                  </span>
                  <span>-${salaryCalcResult.afp.toFixed(2)}</span>
                </div>
                <div className="px-4 py-2.5 flex justify-between text-slate-500 bg-slate-50/50 dark:bg-slate-850">
                  <span className="font-sans font-semibold">
                    Base Neta Imponible de Renta
                  </span>
                  <span className="font-semibold">${salaryCalcResult.gravable.toFixed(2)}</span>
                </div>
                <div className="px-4 py-2.5 flex justify-between text-rose-600 dark:text-rose-400">
                  <span className="font-sans">
                    Retención Impuesto Sobre la Renta (MH)
                  </span>
                  <span>-${salaryCalcResult.renta.toFixed(2)}</span>
                </div>
                <div className="px-4 py-3 flex justify-between font-bold text-sm bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300">
                  <span className="font-sans">Líquido Efectivo</span>
                  <span>${salaryCalcResult.liquidoMensual.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ABONAR A META DE AHORRO */}
      {selectedGoalId && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Abonar Fondos a la Meta
              </h3>
              <button
                type="button"
                onClick={() => setSelectedGoalId(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

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
                  placeholder="50.00"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedGoalId(null)}
                  className="px-3 py-2 rounded-lg text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer"
                >
                  Confirmar Abono
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NUEVA META DE AHORRO */}
      {showNewGoalModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Crear Nueva Meta de Ahorro
              </h3>
              <button
                type="button"
                onClick={() => setShowNewGoalModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nombre de la Meta *
                </label>
                <input
                  type="text"
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  placeholder="Ej: Fondo de Emergencia 3 meses, Prima de Carro"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Monto Objetivo ($ USD) *
                </label>
                <input
                  type="number"
                  step="1.00"
                  min="1"
                  value={newGoalTarget}
                  onChange={(e) => setNewGoalTarget(e.target.value)}
                  placeholder="1500.00"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Categoría
                  </label>
                  <select
                    value={newGoalCategory}
                    onChange={(e) => setNewGoalCategory(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  >
                    <option value="Fondo de Emergencia">Fondo de Emergencia</option>
                    <option value="Patrimonio & Vivienda">Patrimonio & Vivienda</option>
                    <option value="Vehículo">Vehículo</option>
                    <option value="Educación">Educación</option>
                    <option value="Viajes & Vacaciones">Viajes & Vacaciones</option>
                    <option value="Otros">Otros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Fecha Límite Deseada
                  </label>
                  <input
                    type="date"
                    value={newGoalDate}
                    onChange={(e) => setNewGoalDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewGoalModal(false)}
                  className="px-3 py-2 rounded-lg text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer"
                >
                  Crear Meta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR PRESUPUESTO */}
      {editingBudget && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Ajustar Presupuesto Mensual
              </h3>
              <button
                type="button"
                onClick={() => setEditingBudget(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Rubro: <strong className="text-slate-800 dark:text-slate-200">{editingBudget.category}</strong>
            </p>

            <form onSubmit={handleSaveBudgetAmount} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nuevo Límite Máximo ($ USD)
                </label>
                <input
                  type="number"
                  step="5.00"
                  min="0"
                  value={editBudgetAmount}
                  onChange={(e) => setEditBudgetAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingBudget(null)}
                  className="px-3 py-2 rounded-lg text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer"
                >
                  Guardar Límite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
