import React from 'react';
import { Payroll, Company } from '../../types';
import { formatCurrencyUSD } from '../../utils/salvadoranTax';
import { Printer, X, Building2, CheckCircle2 } from 'lucide-react';

interface PrintFullPayrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  payroll: Payroll;
  company: Company;
}

export const PrintFullPayrollModal: React.FC<PrintFullPayrollModalProps> = ({
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
      <div className="w-full max-w-5xl my-4 rounded-2xl bg-white text-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Actions bar (hidden in print) */}
        <div className="p-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-slate-800">
              Vista Previa: Planilla General de Sueldos y Salarios
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700">
              Formato Legal SV
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold shadow flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Planilla Completa</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Content */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-xs font-sans print:p-0 print:m-0 print:overflow-visible">
          {/* Company & Document Header */}
          <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-black uppercase tracking-tight text-slate-900">
                {company.tradeName || company.name}
              </h2>
              <p className="text-slate-600 text-xs">
                Razón Social: <span className="font-bold">{company.name}</span>
              </p>
              <p className="text-slate-600 text-xs font-mono">
                NIT: {company.nit || '0614-010190-101-1'} • NRC: {company.nrc || '123456-7'} • Giro: {company.economicActivity || 'Servicios y Comercio'}
              </p>
            </div>

            <div className="text-right sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0">
              <span className="px-2.5 py-1 rounded bg-slate-900 text-white text-[11px] font-mono font-bold uppercase tracking-wider block sm:inline-block">
                PLANILLA DE SUELDOS & SALARIOS
              </span>
              <p className="font-mono text-xs text-slate-700 mt-1">
                Período: <strong className="uppercase">{payroll.periodType} {payroll.periodNumber} ({payroll.year})</strong>
              </p>
              <p className="text-[11px] text-slate-500 font-mono">
                Del {payroll.startDate} al {payroll.endDate}
              </p>
            </div>
          </div>

          {/* Full Grid Table */}
          <div className="overflow-x-auto border border-slate-300 rounded-lg">
            <table className="w-full text-left text-[11px] font-mono border-collapse">
              <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 text-[10px] uppercase">
                <tr>
                  <th className="p-2 border-r border-slate-200">#</th>
                  <th className="p-2 border-r border-slate-200 font-sans">Colaborador / DUI</th>
                  <th className="p-2 border-r border-slate-200 text-right">Sueldo Base</th>
                  <th className="p-2 border-r border-slate-200 text-right">H. Extra / Noct.</th>
                  <th className="p-2 border-r border-slate-200 text-right">Bonos</th>
                  <th className="p-2 border-r border-slate-200 text-right font-black bg-slate-200/60">Total Deveng.</th>
                  <th className="p-2 border-r border-slate-200 text-right text-indigo-700">ISSS (3%)</th>
                  <th className="p-2 border-r border-slate-200 text-right text-purple-700">AFP (7.25%)</th>
                  <th className="p-2 border-r border-slate-200 text-right text-amber-700">Renta MH</th>
                  <th className="p-2 border-r border-slate-200 text-right text-rose-700">Otros Desc.</th>
                  <th className="p-2 border-r border-slate-200 text-right font-black bg-emerald-100 text-emerald-900">Líquido a Pagar</th>
                  <th className="p-2 text-center font-sans print:w-32">Firma del Empleado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {payroll.details.map((d, index) => {
                  const extraHoursSum = (d.overtimePay || 0) + (d.overtimeDiurnaAmount || 0) + (d.overtimeNocturnaAmount || 0) + (d.nightHoursAmount || 0);
                  const otherDiscounts = (d.tardinessDiscount || 0) + (d.advancesOrLoansDiscount || 0) + (d.otherDeductions || 0);

                  return (
                    <tr key={d.employeeId} className="hover:bg-slate-50">
                      <td className="p-2 border-r border-slate-200 text-slate-400 text-center">{index + 1}</td>
                      <td className="p-2 border-r border-slate-200 font-sans">
                        <p className="font-bold text-slate-900">{d.employeeName}</p>
                        <p className="text-[10px] text-slate-500 font-mono">DUI: {d.dui} • {d.position}</p>
                      </td>
                      <td className="p-2 border-r border-slate-200 text-right font-semibold">
                        {formatCurrencyUSD(d.baseSalary)}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-right text-slate-600">
                        {extraHoursSum > 0 ? formatCurrencyUSD(extraHoursSum) : '-'}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-right text-slate-600">
                        {d.bonuses > 0 ? formatCurrencyUSD(d.bonuses) : '-'}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-right font-black bg-slate-50">
                        {formatCurrencyUSD(d.totalDevengado)}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-right text-indigo-700 font-medium">
                        {formatCurrencyUSD(d.isssLaboral)}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-right text-purple-700 font-medium">
                        {formatCurrencyUSD(d.afpLaboral)}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-right text-amber-700 font-medium">
                        {d.rentaRetencion > 0 ? formatCurrencyUSD(d.rentaRetencion) : '-'}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-right text-rose-700 font-medium">
                        {otherDiscounts > 0 ? formatCurrencyUSD(otherDiscounts) : '-'}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-right font-black bg-emerald-50 text-emerald-800 text-xs">
                        {formatCurrencyUSD(d.liquidoPagar)}
                      </td>
                      <td className="p-2 text-center text-[9px] text-slate-400 border-b print:border-b-slate-400">
                        <span className="print:hidden">Conforme</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-400 text-[11px]">
                <tr>
                  <td colSpan={2} className="p-2 text-right font-sans uppercase">TOTALES GENERALES:</td>
                  <td className="p-2 text-right font-mono font-black">{formatCurrencyUSD(payroll.details.reduce((s, d) => s + d.baseSalary, 0))}</td>
                  <td className="p-2 text-right font-mono">
                    {formatCurrencyUSD(payroll.details.reduce((s, d) => s + (d.overtimePay || 0) + (d.overtimeDiurnaAmount || 0) + (d.overtimeNocturnaAmount || 0) + (d.nightHoursAmount || 0), 0))}
                  </td>
                  <td className="p-2 text-right font-mono">{formatCurrencyUSD(payroll.details.reduce((s, d) => s + (d.bonuses || 0), 0))}</td>
                  <td className="p-2 text-right font-mono font-black bg-slate-200">{formatCurrencyUSD(payroll.totalDevengado)}</td>
                  <td className="p-2 text-right font-mono text-indigo-800">{formatCurrencyUSD(payroll.totalIsssLaboral)}</td>
                  <td className="p-2 text-right font-mono text-purple-800">{formatCurrencyUSD(payroll.totalAfpLaboral)}</td>
                  <td className="p-2 text-right font-mono text-amber-800">{formatCurrencyUSD(payroll.totalRentaRetenida)}</td>
                  <td className="p-2 text-right font-mono text-rose-800">
                    {formatCurrencyUSD(payroll.details.reduce((s, d) => s + (d.tardinessDiscount || 0) + (d.advancesOrLoansDiscount || 0) + (d.otherDeductions || 0), 0))}
                  </td>
                  <td className="p-2 text-right font-mono font-black bg-emerald-200 text-emerald-950 text-xs">
                    {formatCurrencyUSD(payroll.totalLiquido)}
                  </td>
                  <td className="p-2"></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Institutional Obligations Summary Box */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl border border-slate-300 bg-slate-50 text-xs">
            <div>
              <p className="font-bold text-slate-800 text-[11px] uppercase">1. Instituto Salvadoreño del Seguro Social (ISSS)</p>
              <div className="mt-1 space-y-0.5 text-slate-600 font-mono text-[11px]">
                <div className="flex justify-between"><span>Retención Laboral (3%):</span><span>{formatCurrencyUSD(payroll.totalIsssLaboral)}</span></div>
                <div className="flex justify-between"><span>Aporte Patronal (7.5%):</span><span>{formatCurrencyUSD(payroll.totalIsssPatronal)}</span></div>
                <div className="flex justify-between font-bold border-t border-slate-300 pt-0.5 text-slate-900">
                  <span>Total a Pagar ISSS:</span><span>{formatCurrencyUSD(payroll.totalIsssLaboral + payroll.totalIsssPatronal)}</span>
                </div>
              </div>
            </div>

            <div>
              <p className="font-bold text-slate-800 text-[11px] uppercase">2. Administradoras de Fondos de Pensiones (AFP)</p>
              <div className="mt-1 space-y-0.5 text-slate-600 font-mono text-[11px]">
                <div className="flex justify-between"><span>Retención Laboral (7.25%):</span><span>{formatCurrencyUSD(payroll.totalAfpLaboral)}</span></div>
                <div className="flex justify-between"><span>Aporte Patronal (8.75%):</span><span>{formatCurrencyUSD(payroll.totalAfpPatronal)}</span></div>
                <div className="flex justify-between font-bold border-t border-slate-300 pt-0.5 text-slate-900">
                  <span>Total a Pagar AFPs:</span><span>{formatCurrencyUSD(payroll.totalAfpLaboral + payroll.totalAfpPatronal)}</span>
                </div>
              </div>
            </div>

            <div>
              <p className="font-bold text-slate-800 text-[11px] uppercase">3. Ministerio de Hacienda (MH El Salvador)</p>
              <div className="mt-1 space-y-0.5 text-slate-600 font-mono text-[11px]">
                <div className="flex justify-between"><span>Retención Renta Sueldos (F-14):</span><span>{formatCurrencyUSD(payroll.totalRentaRetenida)}</span></div>
                <div className="flex justify-between"><span>Aporte INSAFORP (1%):</span><span>{formatCurrencyUSD(payroll.totalInsaforpPatronal)}</span></div>
                <div className="flex justify-between font-bold border-t border-slate-300 pt-0.5 text-slate-900">
                  <span>Costo Total Empresa:</span><span>{formatCurrencyUSD(payroll.costoTotalEmpresa)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Legal Signatures */}
          <div className="pt-8 grid grid-cols-3 gap-8 text-center text-[10px] text-slate-700">
            <div>
              <div className="h-10 border-b border-slate-400 mb-1" />
              <p className="font-bold text-slate-900">Elaborado por: Encargado de RRHH</p>
              <p className="text-slate-500">Gestión del Talento Humano</p>
            </div>
            <div>
              <div className="h-10 border-b border-slate-400 mb-1" />
              <p className="font-bold text-slate-900">Revisado por: Contador General</p>
              <p className="text-slate-500">Control Contable & Fiscal SV</p>
            </div>
            <div>
              <div className="h-10 border-b border-slate-400 mb-1" />
              <p className="font-bold text-slate-900">Aprobado por: Representante Legal</p>
              <p className="text-slate-500">Dirección General / Gerencia</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
