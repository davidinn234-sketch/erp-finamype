import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { OtherIncomeCategory } from '../../types';
import {
  DollarSign,
  X,
  Building,
  Landmark,
  FileText,
  Calendar,
  Layers,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { formatCurrencyUSD } from '../../utils/salvadoranTax';

interface RegisterOtherIncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORY_OPTIONS: { value: OtherIncomeCategory; label: string; description: string }[] = [
  {
    value: 'remanente_hacienda',
    label: 'Devolución de Remanente Tributario (Hacienda / MH)',
    description: 'Devolución de remanente a favor IVA, exceso Pago a Cuenta o saldo tributario resuelto por DGC.',
  },
  {
    value: 'venta_activo_fijo',
    label: 'Venta de Activo Fijo / Capital',
    description: 'Venta de maquinaria, vehículos, servidores, mobiliario de oficina o equipo de computación.',
  },
  {
    value: 'rendimiento_financiero',
    label: 'Rendimientos Financieros & Intereses',
    description: 'Intereses generados en cuentas de ahorro a plazo, inversiones o fondos bancarios.',
  },
  {
    value: 'devolucion_seguro',
    label: 'Indemnización o Devolución de Seguro',
    description: 'Liquidaciones de pólizas de seguros, siniestros o reembolsos contractuales.',
  },
  {
    value: 'subsidio_gubernamental',
    label: 'Subsidio o Incentivo Estatal',
    description: 'Apoyos gubernamentales o fondos no reembolsables para innovación y tecnología.',
  },
  {
    value: 'otros_ingresos_no_operacionales',
    label: 'Otros Ingresos Extraordinarios',
    description: 'Cualquier otro ingreso no derivado de la venta directa habitual de productos/servicios.',
  },
];

export const RegisterOtherIncomeModal: React.FC<RegisterOtherIncomeModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { bankAccounts, branches, createOtherIncome, currentCompany } = useERP();

  const [category, setCategory] = useState<OtherIncomeCategory>('remanente_hacienda');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [targetAccountId, setTargetAccountId] = useState(bankAccounts[0]?.id || '');
  const [branchId, setBranchId] = useState(branches[0]?.id || '');
  const [paymentMethod, setPaymentMethod] = useState<'transferencia' | 'cheque' | 'efectivo' | 'deposito'>('transferencia');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0 || !description.trim()) return;

    const selectedCat = CATEGORY_OPTIONS.find((c) => c.value === category);
    const selectedBranch = branches.find((b) => b.id === branchId);
    const selectedAccount = bankAccounts.find((a) => a.id === targetAccountId);

    createOtherIncome({
      branchId,
      branchName: selectedBranch?.name || 'Casa Matriz',
      date,
      category,
      categoryLabel: selectedCat?.label || 'Otro Ingreso',
      description: description.trim(),
      amount: Number(amount),
      paymentMethod,
      targetAccountId,
      targetAccountName: selectedAccount?.accountName || 'Caja / Banco',
      referenceNumber: referenceNumber.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    onClose();
    // Reset
    setDescription('');
    setAmount('');
    setReferenceNumber('');
    setNotes('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-indigo-700 via-indigo-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-base font-bold">Registrar Otro Ingreso Extraordinario</h3>
              <p className="text-xs text-indigo-200">
                Remanentes de Hacienda, Venta de Activo Fijo, Rendimientos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:bg-white/20 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Tipo / Concepto de Ingreso <span className="text-rose-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as OtherIncomeCategory)}
              className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            >
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              {CATEGORY_OPTIONS.find((c) => c.value === category)?.description}
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Descripción Detallada <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Devolución de remanente IVA 2025 resuelto por MH..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Monto Recibido ($ USD) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full pl-7 text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Fecha de Acreditación <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Target Bank Account & Branch */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Cuenta Bancaria / Destino <span className="text-rose-500">*</span>
              </label>
              <select
                value={targetAccountId}
                onChange={(e) => setTargetAccountId(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              >
                {bankAccounts.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.accountName} ({formatCurrencyUSD(b.currentBalance)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Sucursal / Centro de Costos
              </label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Payment Method & Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Forma de Pago
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value="transferencia">Transferencia Bancaria / SPEI</option>
                <option value="cheque">Cheque</option>
                <option value="deposito">Depósito en Ventanilla</option>
                <option value="efectivo">Efectivo en Caja</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                N° de Referencia / Comprobante
              </label>
              <input
                type="text"
                placeholder="Ej. MH-REF-2026-001"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Automatic Accounting Note */}
          <div className="p-3 bg-indigo-50/80 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900/50 flex items-start gap-2 text-xs text-indigo-900 dark:text-indigo-200">
            <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Automatización Contable & Tesorería:</span>
              <p className="text-[11px] text-indigo-700 dark:text-indigo-300 mt-0.5">
                Al guardar, se generará la partida contable de ingresos no operacionales, se incrementará el saldo bancario y se reflejará de inmediato en los gráficos ejecutivos.
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition cursor-pointer"
            >
              Guardar Ingreso
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
