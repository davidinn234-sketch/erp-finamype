import React, { useState } from 'react';
import { Payroll, PayrollDetail, Employee, FiscalConfig } from '../../types';
import { calculateEmployeePayroll, formatCurrencyUSD } from '../../utils/salvadoranTax';
import {
  X,
  Save,
  Calculator,
  UserCheck,
  UserX,
  PlusCircle,
  HelpCircle,
  Clock,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';

interface PayrollTableEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  payroll: Payroll;
  allEmployees: Employee[];
  fiscalConfig: FiscalConfig;
  onSave: (updatedPayroll: Payroll) => void;
}

export const PayrollTableEditorModal: React.FC<PayrollTableEditorModalProps> = ({
  isOpen,
  onClose,
  payroll,
  allEmployees,
  fiscalConfig,
  onSave,
}) => {
  if (!isOpen) return null;

  // Initialize editable details combining existing payroll details + any active employees not yet in payroll
  const [editableRows, setEditableRows] = useState<
    (PayrollDetail & {
      isIncluded: boolean;
      overtimeDiurnaHours: number;
      overtimeNocturnaHours: number;
      nightHours: number;
      hourlyRate: number;
    })[]
  >(() => {
    return allEmployees.map((emp) => {
      const existing = payroll.details.find((d) => d.employeeId === emp.id);
      const baseSalaryPeriod = payroll.periodType === 'quincenal' ? emp.baseSalary / 2 : emp.baseSalary;
      const hourlyRate = baseSalaryPeriod / (payroll.periodType === 'quincenal' ? 120 : 240);

      if (existing) {
        return {
          ...existing,
          isIncluded: existing.isIncluded !== undefined ? existing.isIncluded : true,
          overtimeDiurnaHours: existing.overtimeDiurnaHours || 0,
          overtimeNocturnaHours: existing.overtimeNocturnaHours || 0,
          nightHours: existing.nightHours || 0,
          hourlyRate,
        };
      }

      // New employee not in payroll
      const calc = calculateEmployeePayroll({
        baseSalary: baseSalaryPeriod,
        period: payroll.periodType,
        isCompanyOver10Employees: allEmployees.length >= fiscalConfig.insaforpMinEmployees,
        config: fiscalConfig,
      });

      return {
        employeeId: emp.id,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        dui: emp.dui,
        position: emp.position,
        baseSalary: baseSalaryPeriod,
        overtimePay: 0,
        bonuses: 0,
        otherIncome: 0,
        totalDevengado: calc.totalDevengado,
        overtimeDiurnaHours: 0,
        overtimeDiurnaAmount: 0,
        overtimeNocturnaHours: 0,
        overtimeNocturnaAmount: 0,
        nightHours: 0,
        nightHoursAmount: 0,
        tardinessDiscount: 0,
        advancesOrLoansDiscount: 0,
        isIncluded: true,
        isssLaboral: calc.isssLaboral,
        afpLaboral: calc.afpLaboral,
        baseImponibleRenta: calc.baseImponibleRenta,
        rentaRetencion: calc.rentaRetencion,
        otherDeductions: 0,
        totalDeducciones: calc.totalDeducciones,
        liquidoPagar: calc.liquidoPagar,
        isssPatronal: calc.isssPatronal,
        afpPatronal: calc.afpPatronal,
        insaforpPatronal: calc.insaforpPatronal,
        provisionAguinaldo: calc.provisionAguinaldo,
        provisionVacacion: calc.provisionVacacion,
        provisionIndemnizacion: calc.provisionIndemnizacion,
        hourlyRate,
      };
    });
  });

  const recalculateRow = (
    row: typeof editableRows[0],
    fieldUpdates: Partial<typeof editableRows[0]>
  ): typeof editableRows[0] => {
    const updated = { ...row, ...fieldUpdates };

    // Hourly rate estimation
    const hoursInPeriod = payroll.periodType === 'quincenal' ? 120 : 240;
    const baseHourRate = updated.baseSalary / hoursInPeriod;

    // Código de Trabajo El Salvador:
    // Horas Extra Diurnas: recargo del 100% (valor = baseHourRate * 2 * hours)
    const otDiurnaAmt = Number((updated.overtimeDiurnaHours * baseHourRate * 2).toFixed(2));
    // Horas Extra Nocturnas: recargo del 125% (valor = baseHourRate * 2.25 * hours)
    const otNocturnaAmt = Number((updated.overtimeNocturnaHours * baseHourRate * 2.25).toFixed(2));
    // Nocturnidad ordinaria: recargo del 25% (valor = baseHourRate * 0.25 * hours)
    const nightAmt = Number((updated.nightHours * baseHourRate * 0.25).toFixed(2));

    const totalOvertime = Number((otDiurnaAmt + otNocturnaAmt + nightAmt).toFixed(2));
    const bonuses = Number(updated.bonuses) || 0;
    const tardiness = Number(updated.tardinessDiscount) || 0;
    const advances = Number(updated.advancesOrLoansDiscount) || 0;

    const calc = calculateEmployeePayroll({
      baseSalary: updated.baseSalary,
      overtimePay: totalOvertime,
      bonuses: bonuses,
      period: payroll.periodType,
      isCompanyOver10Employees: allEmployees.length >= fiscalConfig.insaforpMinEmployees,
      config: fiscalConfig,
    });

    const otherDeductions = Number((tardiness + advances).toFixed(2));
    const totalDeducciones = Number((calc.totalDeducciones + otherDeductions).toFixed(2));
    const liquidoPagar = Math.max(0, Number((calc.totalDevengado - totalDeducciones).toFixed(2)));

    return {
      ...updated,
      overtimePay: totalOvertime,
      overtimeDiurnaAmount: otDiurnaAmt,
      overtimeNocturnaAmount: otNocturnaAmt,
      nightHoursAmount: nightAmt,
      totalDevengado: calc.totalDevengado,
      isssLaboral: calc.isssLaboral,
      afpLaboral: calc.afpLaboral,
      baseImponibleRenta: calc.baseImponibleRenta,
      rentaRetencion: calc.rentaRetencion,
      otherDeductions,
      totalDeducciones,
      liquidoPagar,
      isssPatronal: calc.isssPatronal,
      afpPatronal: calc.afpPatronal,
      insaforpPatronal: calc.insaforpPatronal,
      provisionAguinaldo: calc.provisionAguinaldo,
      provisionVacacion: calc.provisionVacacion,
      provisionIndemnizacion: calc.provisionIndemnizacion,
    };
  };

  const handleFieldChange = (
    employeeId: string,
    field: keyof typeof editableRows[0],
    value: number | boolean
  ) => {
    setEditableRows((prev) =>
      prev.map((r) => {
        if (r.employeeId === employeeId) {
          return recalculateRow(r, { [field]: value });
        }
        return r;
      })
    );
  };

  const handleSaveAll = () => {
    const includedRows = editableRows.filter((r) => r.isIncluded);
    if (includedRows.length === 0) {
      alert('Debes incluir al menos 1 colaborador en la planilla.');
      return;
    }

    const totalDevengado = Number(includedRows.reduce((s, r) => s + r.totalDevengado, 0).toFixed(2));
    const totalIsssLaboral = Number(includedRows.reduce((s, r) => s + r.isssLaboral, 0).toFixed(2));
    const totalAfpLaboral = Number(includedRows.reduce((s, r) => s + r.afpLaboral, 0).toFixed(2));
    const totalRentaRetenida = Number(includedRows.reduce((s, r) => s + r.rentaRetencion, 0).toFixed(2));
    const totalLiquido = Number(includedRows.reduce((s, r) => s + r.liquidoPagar, 0).toFixed(2));

    const totalIsssPatronal = Number(includedRows.reduce((s, r) => s + r.isssPatronal, 0).toFixed(2));
    const totalAfpPatronal = Number(includedRows.reduce((s, r) => s + r.afpPatronal, 0).toFixed(2));
    const totalInsaforpPatronal = Number(includedRows.reduce((s, r) => s + r.insaforpPatronal, 0).toFixed(2));
    const totalProvisiones = Number(
      includedRows.reduce((s, r) => s + r.provisionAguinaldo + r.provisionVacacion + r.provisionIndemnizacion, 0).toFixed(2)
    );
    const costoTotalEmpresa = Number(
      (totalDevengado + totalIsssPatronal + totalAfpPatronal + totalInsaforpPatronal + totalProvisiones).toFixed(2)
    );

    const updatedPayroll: Payroll = {
      ...payroll,
      details: includedRows,
      totalDevengado,
      totalIsssLaboral,
      totalAfpLaboral,
      totalRentaRetenida,
      totalLiquido,
      totalIsssPatronal,
      totalAfpPatronal,
      totalInsaforpPatronal,
      totalProvisiones,
      costoTotalEmpresa,
    };

    onSave(updatedPayroll);
    onClose();
  };

  const includedCount = editableRows.filter((r) => r.isIncluded).length;
  const currentTotalLiquido = editableRows
    .filter((r) => r.isIncluded)
    .reduce((s, r) => s + r.liquidoPagar, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-7xl my-4 rounded-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xl overflow-hidden flex flex-col max-h-[95vh] border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/80 border border-purple-400/40 flex items-center justify-center font-bold">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black">
                Gran Tabla Automatizada de Planilla (Período {payroll.periodNumber} - {payroll.periodType.toUpperCase()})
              </h2>
              <p className="text-xs text-purple-200">
                Ajuste interactivo de horas extras, nocturnidad, bonos y descuentos con cálculo en tiempo real según Código de Trabajo SV.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <span className="text-[10px] text-purple-200 font-bold uppercase block">Líquido Total Proyectado</span>
              <span className="font-mono font-black text-lg text-emerald-400">{formatCurrencyUSD(currentTotalLiquido)}</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Info Helper Strip */}
        <div className="p-3 bg-purple-50 dark:bg-purple-950/40 border-b border-purple-200 dark:border-purple-900/50 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-purple-900 dark:text-purple-300">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>
              <strong>{includedCount} de {editableRows.length}</strong> colaboradores activos incluidos en esta corrida. Haz clic en el interruptor de cada fila para incluir o retirar a alguien fácilmente.
            </span>
          </div>
          <span className="text-[11px] font-mono text-purple-700 dark:text-purple-400 font-semibold">
            H. Extra Diurna: +100% | H. Extra Nocturna: +125% | Nocturnidad: +25%
          </span>
        </div>

        {/* Automated Table */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 text-xs">
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left font-mono border-collapse">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px] border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
                <tr>
                  <th className="p-2.5 text-center">Incluir</th>
                  <th className="p-2.5 font-sans">Colaborador / Puesto</th>
                  <th className="p-2.5 text-right">Salario Base ($)</th>
                  <th className="p-2.5 text-center">H. Extra Diurna (hrs)</th>
                  <th className="p-2.5 text-center">H. Extra Noct. (hrs)</th>
                  <th className="p-2.5 text-center">Nocturnidad (hrs)</th>
                  <th className="p-2.5 text-right">Bonos / Comis. ($)</th>
                  <th className="p-2.5 text-right bg-purple-50/60 dark:bg-purple-950/30 text-purple-900 dark:text-purple-300 font-black">
                    Total Devengado
                  </th>
                  <th className="p-2.5 text-right text-indigo-600">ISSS (3%)</th>
                  <th className="p-2.5 text-right text-purple-600">AFP (7.25%)</th>
                  <th className="p-2.5 text-right text-amber-600">Renta MH</th>
                  <th className="p-2.5 text-right text-rose-600">Tardanza/Faltas ($)</th>
                  <th className="p-2.5 text-right text-rose-600">Anticipos ($)</th>
                  <th className="p-2.5 text-right bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-black">
                    Líquido a Pagar
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px]">
                {editableRows.map((row) => (
                  <tr
                    key={row.employeeId}
                    className={`transition ${
                      !row.isIncluded
                        ? 'opacity-40 bg-slate-50 dark:bg-slate-900/40'
                        : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    {/* Toggle Included */}
                    <td className="p-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleFieldChange(row.employeeId, 'isIncluded', !row.isIncluded)}
                        className={`p-1.5 rounded-lg font-bold text-xs transition cursor-pointer ${
                          row.isIncluded
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                            : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                        }`}
                        title={row.isIncluded ? 'Incluido (Clic para excluir)' : 'Excluido (Clic para incluir)'}
                      >
                        {row.isIncluded ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                      </button>
                    </td>

                    {/* Employee Name */}
                    <td className="p-2.5 font-sans">
                      <p className="font-bold text-slate-900 dark:text-white">{row.employeeName}</p>
                      <p className="text-[10px] text-slate-400">{row.position} • DUI: {row.dui}</p>
                    </td>

                    {/* Base Salary Input */}
                    <td className="p-2 text-right">
                      <input
                        type="number"
                        step="10"
                        min="0"
                        disabled={!row.isIncluded}
                        value={row.baseSalary}
                        onChange={(e) =>
                          handleFieldChange(row.employeeId, 'baseSalary', parseFloat(e.target.value) || 0)
                        }
                        className="w-20 p-1 text-right text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                      />
                    </td>

                    {/* Overtime Diurna Hours */}
                    <td className="p-2 text-center">
                      <input
                        type="number"
                        step="1"
                        min="0"
                        disabled={!row.isIncluded}
                        value={row.overtimeDiurnaHours}
                        onChange={(e) =>
                          handleFieldChange(row.employeeId, 'overtimeDiurnaHours', parseFloat(e.target.value) || 0)
                        }
                        className="w-14 p-1 text-center text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                      />
                      {row.overtimeDiurnaAmount ? row.overtimeDiurnaAmount > 0 && (
                        <span className="block text-[9px] text-emerald-600">+{formatCurrencyUSD(row.overtimeDiurnaAmount)}</span>
                      ) : null}
                    </td>

                    {/* Overtime Nocturna Hours */}
                    <td className="p-2 text-center">
                      <input
                        type="number"
                        step="1"
                        min="0"
                        disabled={!row.isIncluded}
                        value={row.overtimeNocturnaHours}
                        onChange={(e) =>
                          handleFieldChange(row.employeeId, 'overtimeNocturnaHours', parseFloat(e.target.value) || 0)
                        }
                        className="w-14 p-1 text-center text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                      />
                      {row.overtimeNocturnaAmount ? row.overtimeNocturnaAmount > 0 && (
                        <span className="block text-[9px] text-emerald-600">+{formatCurrencyUSD(row.overtimeNocturnaAmount)}</span>
                      ) : null}
                    </td>

                    {/* Nocturnidad Ordinaria Hours */}
                    <td className="p-2 text-center">
                      <input
                        type="number"
                        step="1"
                        min="0"
                        disabled={!row.isIncluded}
                        value={row.nightHours}
                        onChange={(e) =>
                          handleFieldChange(row.employeeId, 'nightHours', parseFloat(e.target.value) || 0)
                        }
                        className="w-14 p-1 text-center text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                      />
                      {row.nightHoursAmount ? row.nightHoursAmount > 0 && (
                        <span className="block text-[9px] text-emerald-600">+{formatCurrencyUSD(row.nightHoursAmount)}</span>
                      ) : null}
                    </td>

                    {/* Bonificaciones */}
                    <td className="p-2 text-right">
                      <input
                        type="number"
                        step="10"
                        min="0"
                        disabled={!row.isIncluded}
                        value={row.bonuses}
                        onChange={(e) =>
                          handleFieldChange(row.employeeId, 'bonuses', parseFloat(e.target.value) || 0)
                        }
                        className="w-18 p-1 text-right text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                      />
                    </td>

                    {/* Total Devengado (Auto) */}
                    <td className="p-2.5 text-right font-black bg-purple-50/50 dark:bg-purple-950/20 text-purple-900 dark:text-purple-300">
                      {row.isIncluded ? formatCurrencyUSD(row.totalDevengado) : '-'}
                    </td>

                    {/* ISSS */}
                    <td className="p-2.5 text-right text-indigo-600">
                      {row.isIncluded ? `-${formatCurrencyUSD(row.isssLaboral)}` : '-'}
                    </td>

                    {/* AFP */}
                    <td className="p-2.5 text-right text-purple-600">
                      {row.isIncluded ? `-${formatCurrencyUSD(row.afpLaboral)}` : '-'}
                    </td>

                    {/* Renta MH */}
                    <td className="p-2.5 text-right text-amber-600">
                      {row.isIncluded ? (row.rentaRetencion > 0 ? `-${formatCurrencyUSD(row.rentaRetencion)}` : '$0.00') : '-'}
                    </td>

                    {/* Tardanzas / Faltas */}
                    <td className="p-2 text-right">
                      <input
                        type="number"
                        step="5"
                        min="0"
                        disabled={!row.isIncluded}
                        value={row.tardinessDiscount || 0}
                        onChange={(e) =>
                          handleFieldChange(row.employeeId, 'tardinessDiscount', parseFloat(e.target.value) || 0)
                        }
                        className="w-16 p-1 text-right text-xs rounded border border-rose-200 dark:border-rose-900 bg-white dark:bg-slate-800 font-mono text-rose-600"
                      />
                    </td>

                    {/* Anticipos / Préstamos */}
                    <td className="p-2 text-right">
                      <input
                        type="number"
                        step="10"
                        min="0"
                        disabled={!row.isIncluded}
                        value={row.advancesOrLoansDiscount || 0}
                        onChange={(e) =>
                          handleFieldChange(row.employeeId, 'advancesOrLoansDiscount', parseFloat(e.target.value) || 0)
                        }
                        className="w-16 p-1 text-right text-xs rounded border border-rose-200 dark:border-rose-900 bg-white dark:bg-slate-800 font-mono text-rose-600"
                      />
                    </td>

                    {/* Líquido a Pagar (Auto) */}
                    <td className="p-2.5 text-right font-black bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-xs">
                      {row.isIncluded ? formatCurrencyUSD(row.liquidoPagar) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-4 text-xs">
            <span className="text-slate-500 font-semibold">
              Total Devengado: <strong className="text-slate-900 dark:text-white font-mono">{formatCurrencyUSD(editableRows.filter(r => r.isIncluded).reduce((s, r) => s + r.totalDevengado, 0))}</strong>
            </span>
            <span className="text-slate-500 font-semibold">
              Total Descuentos: <strong className="text-rose-600 font-mono">-{formatCurrencyUSD(editableRows.filter(r => r.isIncluded).reduce((s, r) => s + r.totalDeducciones, 0))}</strong>
            </span>
            <span className="text-emerald-700 dark:text-emerald-400 font-bold text-sm">
              Líquido Neto: <strong className="font-mono">{formatCurrencyUSD(currentTotalLiquido)}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white text-xs font-bold shadow flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Planilla Ajustada</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
