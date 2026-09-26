import React from 'react';
import { Payroll, Company } from '../../types';
import { formatCurrencyUSD } from '../../utils/salvadoranTax';
import { Printer, X, FileText, CheckCircle2 } from 'lucide-react';

interface PrintAllSlipsModalProps {
  isOpen: boolean;
  onClose: () => void;
  payroll: Payroll;
  company: Company;
}

export const PrintAllSlipsModal: React.FC<PrintAllSlipsModalProps> = ({
  isOpen,
  onClose,
  payroll,
  company,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/80 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-4xl my-4 rounded-2xl bg-white text-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Actions bar (hidden in print) */}
        <div className="p-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <div>
              <span className="font-bold text-sm text-slate-800">
                Impresión Masiva de Boletas de Pago ({payroll.details.length} Colaboradores)
              </span>
              <p className="text-[11px] text-slate-500">
                Todas las boletas en un solo documento listo para imprimir o guardar como PDF.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white text-xs font-bold shadow flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Todas las Boletas</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable stream of slips */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-8 text-xs font-sans print:p-0 print:m-0 print:overflow-visible print:space-y-12">
          {payroll.details.map((detail, index) => {
            const extraHoursSum =
              (detail.overtimePay || 0) +
              (detail.overtimeDiurnaAmount || 0) +
              (detail.overtimeNocturnaAmount || 0) +
              (detail.nightHoursAmount || 0);

            const otherDiscounts =
              (detail.tardinessDiscount || 0) +
              (detail.advancesOrLoansDiscount || 0) +
              (detail.otherDeductions || 0);

            return (
              <div
                key={detail.employeeId}
                className="border-2 border-slate-300 rounded-2xl p-5 sm:p-6 bg-white shadow-xs print:border-slate-400 print:shadow-none print:break-after-page space-y-4"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b-2 border-slate-900 gap-2">
                  <div>
                    <h3 className="font-black text-sm uppercase text-slate-900">
                      {company.tradeName || company.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-mono">
                      NIT: {company.nit || '0614-010190-101-1'} • Razón Social: {company.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-900 font-mono font-bold text-[10px] uppercase">
                      Boleta #{index + 1} de {payroll.details.length}
                    </span>
                    <p className="text-[11px] font-bold text-slate-700 mt-0.5">
                      Período: {payroll.startDate} al {payroll.endDate}
                    </p>
                  </div>
                </div>

                {/* Employee details bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Colaborador:</span>
                    <strong className="text-slate-900">{detail.employeeName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">DUI:</span>
                    <strong className="font-mono">{detail.dui}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Cargo:</span>
                    <span>{detail.position}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Frecuencia:</span>
                    <span className="uppercase font-bold text-indigo-700">{payroll.periodType}</span>
                  </div>
                </div>

                {/* Earnings vs Deductions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Left: Devengados */}
                  <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1.5">
                    <h4 className="font-bold text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1">
                      (+) Ingresos Devengados
                    </h4>
                    <div className="flex justify-between text-slate-700">
                      <span>Sueldo Base del Período:</span>
                      <span className="font-mono font-semibold">{formatCurrencyUSD(detail.baseSalary)}</span>
                    </div>
                    {extraHoursSum > 0 && (
                      <div className="flex justify-between text-slate-700">
                        <span>Horas Extras & Nocturnidad:</span>
                        <span className="font-mono font-semibold">{formatCurrencyUSD(extraHoursSum)}</span>
                      </div>
                    )}
                    {detail.bonuses > 0 && (
                      <div className="flex justify-between text-slate-700">
                        <span>Bonos / Comisiones:</span>
                        <span className="font-mono font-semibold">{formatCurrencyUSD(detail.bonuses)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-black text-slate-900 pt-1.5 border-t border-slate-200 text-xs">
                      <span>Total Devengado:</span>
                      <span className="font-mono">{formatCurrencyUSD(detail.totalDevengado)}</span>
                    </div>
                  </div>

                  {/* Right: Deducciones */}
                  <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1.5">
                    <h4 className="font-bold text-[10px] uppercase tracking-wider text-rose-500 border-b border-slate-100 pb-1">
                      (-) Descuentos de Ley & Otros
                    </h4>
                    <div className="flex justify-between text-slate-700">
                      <span>ISSS Laboral (3%):</span>
                      <span className="font-mono font-semibold text-indigo-600">-{formatCurrencyUSD(detail.isssLaboral)}</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>AFP Laboral (7.25%):</span>
                      <span className="font-mono font-semibold text-purple-600">-{formatCurrencyUSD(detail.afpLaboral)}</span>
                    </div>
                    {detail.rentaRetencion > 0 && (
                      <div className="flex justify-between text-slate-700">
                        <span>Retención Renta MH:</span>
                        <span className="font-mono font-semibold text-amber-600">-{formatCurrencyUSD(detail.rentaRetencion)}</span>
                      </div>
                    )}
                    {detail.tardinessDiscount && detail.tardinessDiscount > 0 ? (
                      <div className="flex justify-between text-slate-700">
                        <span>Llegadas Tardías / Sanción:</span>
                        <span className="font-mono font-semibold text-rose-600">-{formatCurrencyUSD(detail.tardinessDiscount)}</span>
                      </div>
                    ) : null}
                    {detail.advancesOrLoansDiscount && detail.advancesOrLoansDiscount > 0 ? (
                      <div className="flex justify-between text-slate-700">
                        <span>Anticipos o Préstamos:</span>
                        <span className="font-mono font-semibold text-rose-600">-{formatCurrencyUSD(detail.advancesOrLoansDiscount)}</span>
                      </div>
                    ) : null}
                    <div className="flex justify-between font-black text-rose-700 pt-1.5 border-t border-slate-200 text-xs">
                      <span>Total Descuentos:</span>
                      <span className="font-mono">-{formatCurrencyUSD(detail.totalDeducciones)}</span>
                    </div>
                  </div>
                </div>

                {/* Net Pay Total Banner */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 font-bold">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs">LÍQUIDO A PAGAR (NETO A RECIBIR):</span>
                  </div>
                  <span className="text-base font-black font-mono text-emerald-800">
                    {formatCurrencyUSD(detail.liquidoPagar)}
                  </span>
                </div>

                {/* Signature slip */}
                <div className="pt-4 grid grid-cols-2 gap-8 text-center text-[10px] text-slate-600 border-t border-dashed border-slate-300">
                  <div>
                    <div className="h-8 border-b border-slate-400 mb-1" />
                    <p className="font-bold text-slate-800">Firma del Empleador</p>
                    <p className="text-[9px] text-slate-400">{company.name}</p>
                  </div>
                  <div>
                    <div className="h-8 border-b border-slate-400 mb-1" />
                    <p className="font-bold text-slate-800">Firma y Recibido del Empleado</p>
                    <p className="text-[9px] text-slate-400">DUI: {detail.dui}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
