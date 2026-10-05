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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-[8px] max-w-lg w-full border border-[#E5E7EB] dark:border-slate-800 shadow-none overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[#E5E7EB] dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DollarSign className="w-5 h-5 text-[#6B7280] stroke-[1.5]" />
            <div>
              <h3 className="text-[16px] font-semibold text-[#111827] dark:text-white">
                Registrar otro ingreso extraordinario
              </h3>
              <p className="text-[12px] text-[#6B7280] dark:text-slate-400">
                Remanentes tributarios, venta de activo fijo o rendimientos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-[6px] text-[#6B7280] hover:text-[#111827] dark:hover:text-white hover:bg-[#F9FAFB] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Category */}
          <div>
            <label className="block text-[12px] font-medium text-[#111827] dark:text-slate-300 mb-1">
              Tipo / Concepto de ingreso *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as OtherIncomeCategory)}
              className="w-full text-[14px] rounded-[6px] border border-[#E3E8E6] dark:border-slate-700 bg-white dark:bg-slate-800 p-2 font-medium text-[#111827] dark:text-white outline-none focus:border-[#0F766E]"
            >
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
            <p className="text-[12px] text-[#6B7280] mt-1">
              {CATEGORY_OPTIONS.find((c) => c.value === category)?.description}
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[12px] font-medium text-[#111827] dark:text-slate-300 mb-1">
              Descripción detallada *
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Devolución de remanente IVA resuelto por MH..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-[14px] rounded-[6px] border border-[#E3E8E6] dark:border-slate-700 bg-white dark:bg-slate-800 p-2 font-medium text-[#111827] dark:text-white outline-none focus:border-[#0F766E]"
            />
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-medium text-[#111827] dark:text-slate-300 mb-1">
                Monto recibido ($ USD) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-[14px] text-[#6B7280]">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full pl-7 text-[14px] font-mono font-medium rounded-[6px] border border-[#E3E8E6] dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-[#111827] dark:text-white outline-none focus:border-[#0F766E]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#111827] dark:text-slate-300 mb-1">
                Fecha de acreditación *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-[14px] rounded-[6px] border border-[#E3E8E6] dark:border-slate-700 bg-white dark:bg-slate-800 p-2 font-medium text-[#111827] dark:text-white outline-none focus:border-[#0F766E]"
              />
            </div>
          </div>

          {/* Target Bank Account & Branch */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-medium text-[#111827] dark:text-slate-300 mb-1">
                Cuenta bancaria / Destino *
              </label>
              <select
                value={targetAccountId}
                onChange={(e) => setTargetAccountId(e.target.value)}
                className="w-full text-[14px] rounded-[6px] border border-[#E3E8E6] dark:border-slate-700 bg-white dark:bg-slate-800 p-2 font-medium text-[#111827] dark:text-white outline-none focus:border-[#0F766E]"
              >
                {bankAccounts.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.accountName} ({formatCurrencyUSD(b.currentBalance)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#111827] dark:text-slate-300 mb-1">
                Sucursal
              </label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full text-[14px] rounded-[6px] border border-[#E3E8E6] dark:border-slate-700 bg-white dark:bg-slate-800 p-2 font-medium text-[#111827] dark:text-white outline-none focus:border-[#0F766E]"
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
              <label className="block text-[12px] font-medium text-[#111827] dark:text-slate-300 mb-1">
                Forma de pago
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full text-[14px] rounded-[6px] border border-[#E3E8E6] dark:border-slate-700 bg-white dark:bg-slate-800 p-2 font-medium text-[#111827] dark:text-white outline-none focus:border-[#0F766E]"
              >
                <option value="transferencia">Transferencia bancaria</option>
                <option value="cheque">Cheque</option>
                <option value="deposito">Depósito en ventanilla</option>
                <option value="efectivo">Efectivo en caja</option>
              </select>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#111827] dark:text-slate-300 mb-1">
                N° de referencia / Comprobante
              </label>
              <input
                type="text"
                placeholder="Ej. REF-2026-001"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="w-full text-[14px] rounded-[6px] border border-[#E3E8E6] dark:border-slate-700 bg-white dark:bg-slate-800 p-2 font-medium text-[#111827] dark:text-white outline-none focus:border-[#0F766E]"
              />
            </div>
          </div>

          {/* Automatic Accounting Note */}
          <div className="flex items-center gap-2 text-[12px] text-[#6B7280]">
            <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
            <span>Se registrará automáticamente en contabilidad y en la disponibilidad de tesorería.</span>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E3E8E6] dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-[6px] border border-[#E3E8E6] dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-[#F9FAFB] text-[#111827] dark:text-slate-200 text-[14px] font-medium transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-[6px] bg-[#0F766E] hover:bg-[#115E59] text-white text-[14px] font-medium transition cursor-pointer shadow-none"
            >
              Guardar ingreso
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
