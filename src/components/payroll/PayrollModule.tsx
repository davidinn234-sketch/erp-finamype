import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  Users,
  UserPlus,
  FileCheck2,
  DollarSign,
  Calculator,
  Calendar,
  ShieldAlert,
  Percent,
  CheckCircle2,
  Clock,
  Download,
  AlertTriangle,
  X,
  CreditCard,
  Building,
  Printer,
  ShieldCheck,
  TrendingUp,
  FileText,
  Briefcase,
  Layers,
  HelpCircle,
  FolderOpen,
  Sliders,
  Trash2,
  Search,
} from 'lucide-react';
import { Employee, Payroll, ContractType, PayrollPeriod, PayrollDetail } from '../../types';
import {
  formatCurrencyUSD,
  calculateEmployeePayroll,
  ISSS_LABORAL_RATE,
  AFP_LABORAL_RATE,
} from '../../utils/salvadoranTax';
import { PDFReportModal } from '../common/PDFReportModal';
import { ProfessionalServicesTab } from './ProfessionalServicesTab';
import { CandidateRecruitmentTab } from './CandidateRecruitmentTab';
import { PayrollTableEditorModal } from './PayrollTableEditorModal';
import { PrintFullPayrollModal } from './PrintFullPayrollModal';
import { PrintAllSlipsModal } from './PrintAllSlipsModal';

interface PayrollModuleProps {
  isNewPayrollModalOpen: boolean;
  onCloseNewPayrollModal: () => void;
  onOpenNewPayrollModal: () => void;
}

export const PayrollModule: React.FC<PayrollModuleProps> = ({
  isNewPayrollModalOpen,
  onCloseNewPayrollModal,
  onOpenNewPayrollModal,
}) => {
  const {
    employees,
    payrolls,
    bankAccounts,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    generatePayrollForPeriod,
    saveCustomPayroll,
    deletePayroll,
    payPayroll,
    fiscalConfig,
    currentCompany,
  } = useERP();

  const [activeTab, setActiveTab] = useState<'payrolls' | 'services' | 'employees' | 'recruitment' | 'calculator'>('payrolls');
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [payrollTableViewMode, setPayrollTableViewMode] = useState<'all' | 'employer' | 'employee'>('all');
  const [isNewEmployeeModalOpen, setIsNewEmployeeModalOpen] = useState(false);
  const [selectedPayrollId, setSelectedPayrollId] = useState<string | null>(payrolls[0]?.id || null);

  // Modals for Editing and Printing
  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
  const [isPrintFullPayrollOpen, setIsPrintFullPayrollOpen] = useState(false);
  const [isPrintAllSlipsOpen, setIsPrintAllSlipsOpen] = useState(false);

  // PDF Preview State for single slip
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [selectedSlipDetail, setSelectedSlipDetail] = useState<PayrollDetail | null>(null);

  // Quick Calculator State
  const [calcSalary, setCalcSalary] = useState<number>(800.0);
  const [calcOvertime, setCalcOvertime] = useState<number>(0.0);
  const [calcBonuses, setCalcBonuses] = useState<number>(0.0);
  const [calcPeriod, setCalcPeriod] = useState<PayrollPeriod>('mensual');

  // Generator State
  const [genPeriodType, setGenPeriodType] = useState<PayrollPeriod>('quincenal');
  const [genQuincenaNumber, setGenQuincenaNumber] = useState<1 | 2>(1);
  const [genMonth, setGenMonth] = useState<number>(new Date().getMonth() + 1);
  const [genYear, setGenYear] = useState<number>(2026);

  // New Employee Form State
  const [newEmployee, setNewEmployee] = useState<Omit<Employee, 'id' | 'companyId'>>({
    code: `EMP-${(employees.length + 1).toString().padStart(3, '0')}`,
    firstName: '',
    lastName: '',
    dui: '',
    nit: '',
    isssNumber: '',
    afpNumber: '',
    afpName: 'Crecer',
    position: '',
    department: 'Operaciones',
    baseSalary: 600,
    contractType: 'permanente',
    hireDate: new Date().toISOString().split('T')[0],
    bankName: 'Banco Agrícola',
    bankAccountNumber: '',
    isActive: true,
  });

  const calcResult = calculateEmployeePayroll({
    baseSalary: calcSalary,
    overtimePay: calcOvertime,
    bonuses: calcBonuses,
    period: calcPeriod,
    isCompanyOver10Employees: true,
    config: fiscalConfig,
  });

  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    createEmployee(newEmployee);
    setIsNewEmployeeModalOpen(false);
    setNewEmployee({
      code: `EMP-${(employees.length + 2).toString().padStart(3, '0')}`,
      firstName: '',
      lastName: '',
      dui: '',
      nit: '',
      isssNumber: '',
      afpNumber: '',
      afpName: 'Crecer',
      position: '',
      department: 'Operaciones',
      baseSalary: 600,
      contractType: 'permanente',
      hireDate: new Date().toISOString().split('T')[0],
      bankName: 'Banco Agrícola',
      bankAccountNumber: '',
      isActive: true,
    });
  };

  const handleGeneratePayroll = (e: React.FormEvent) => {
    e.preventDefault();
    const created = generatePayrollForPeriod(
      genPeriodType,
      genMonth,
      genYear,
      undefined,
      genPeriodType === 'quincenal' ? genQuincenaNumber : 1
    );
    setSelectedPayrollId(created.id);
    onCloseNewPayrollModal();
  };

  const currentSelectedPayroll = payrolls.find((p) => p.id === selectedPayrollId) || payrolls[0];

  const handleOpenSlipModal = (detail: PayrollDetail) => {
    setSelectedSlipDetail(detail);
    setIsPdfModalOpen(true);
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Recursos Humanos & Planilla Legal (El Salvador)
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
              ISSS • AFP • INSAFORP • Renta MH
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Liquidación quincenal y mensual, desglose de retenciones al empleado y costos patronales que asume el empresario.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsNewEmployeeModalOpen(true)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-purple-500" />
            <span>Nuevo Colaborador</span>
          </button>
          <button
            onClick={onOpenNewPayrollModal}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <FileCheck2 className="w-4 h-4" />
            <span>Generar Planilla Quincenal / Mensual</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('payrolls')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'payrolls'
              ? 'bg-purple-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Planilla de Salarios ({payrolls.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('services')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'services'
              ? 'bg-purple-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>Servicios Profesionales (10% Renta)</span>
        </button>
        <button
          onClick={() => setActiveTab('employees')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'employees'
              ? 'bg-purple-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Base de Empleados ({employees.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('recruitment')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'recruitment'
              ? 'bg-purple-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FolderOpen className="w-3.5 h-3.5" />
          <span>Bolsa de Empleo & CVs</span>
        </button>
        <button
          onClick={() => setActiveTab('calculator')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'calculator'
              ? 'bg-purple-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>Calculadora & Costo Patronal</span>
        </button>
      </div>

      {/* Tab 1: Historial de Planillas */}
      {activeTab === 'payrolls' && currentSelectedPayroll && (
        <div className="space-y-6">
          {/* Action Bar & Selector */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Planilla Activa:</label>
              <select
                value={currentSelectedPayroll.id}
                onChange={(e) => setSelectedPayrollId(e.target.value)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                {payrolls.map((p) => {
                  const quincenaLabel = p.periodType === 'quincenal' 
                    ? (p.periodNumber === 2 ? '2ª Quincena (16 al fin de mes)' : '1ª Quincena (01 al 15)')
                    : 'Mensual Completo';
                  return (
                    <option key={p.id} value={p.id}>
                      {quincenaLabel} • {p.startDate} al {p.endDate} [{p.status.toUpperCase()}]
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setIsEditorModalOpen(true)}
                className="px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-xs font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Agregar o ajustar horas extras, nocturnidad, bonos y descuentos"
              >
                <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                <span>Ajustar Horas Extras / Bonos / Desc</span>
              </button>

              <button
                onClick={() => setIsPrintFullPayrollOpen(true)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer"
                title="Imprimir la planilla completa en formato tabla oficial"
              >
                <Printer className="w-3.5 h-3.5 text-indigo-500" />
                <span>Imprimir Planilla Completa</span>
              </button>

              <button
                onClick={() => setIsPrintAllSlipsOpen(true)}
                className="px-3 py-1.5 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 text-xs font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5 cursor-pointer"
                title="Imprimir todas las boletas de pago de los empleados en un solo PDF"
              >
                <FileText className="w-3.5 h-3.5 text-purple-600" />
                <span>Imprimir Boletas de Todos</span>
              </button>

              {currentSelectedPayroll.status !== 'pagada' && (
                <button
                  onClick={() => payPayroll(currentSelectedPayroll.id, bankAccounts[0]?.id || '')}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Pagar y Dispersar</span>
                </button>
              )}
              <span
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  currentSelectedPayroll.status === 'pagada'
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                    : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                }`}
              >
                {currentSelectedPayroll.status}
              </span>

              {payrolls.length > 1 && (
                <button
                  onClick={() => {
                    if (window.confirm(`¿Estás seguro de eliminar esta planilla (Período ${currentSelectedPayroll.periodNumber})?`)) {
                      deletePayroll(currentSelectedPayroll.id);
                    }
                  }}
                  className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:border-rose-200 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                  title="Eliminar esta planilla"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* KPI Row 1: Lo que Devengan y se Retiene a Empleados */}
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
              1. Liquidación y Retenciones al Trabajador
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                <span className="text-[11px] text-slate-500 font-semibold block">Total Devengado (Nominal)</span>
                <h4 className="text-lg font-black text-slate-900 dark:text-white mt-0.5 font-mono">
                  {formatCurrencyUSD(currentSelectedPayroll.totalDevengado)}
                </h4>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                <span className="text-[11px] text-indigo-600 font-semibold block">
                  (-) ISSS Laboral ({fiscalConfig.isssLaboralRate * 100}%)
                </span>
                <h4 className="text-lg font-black text-indigo-600 dark:text-indigo-400 mt-0.5 font-mono">
                  {formatCurrencyUSD(currentSelectedPayroll.totalIsssLaboral)}
                </h4>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                <span className="text-[11px] text-purple-600 font-semibold block">
                  (-) AFP Laboral ({fiscalConfig.afpLaboralRate * 100}%)
                </span>
                <h4 className="text-lg font-black text-purple-600 dark:text-purple-400 mt-0.5 font-mono">
                  {formatCurrencyUSD(currentSelectedPayroll.totalAfpLaboral)}
                </h4>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                <span className="text-[11px] text-amber-600 font-semibold block">(-) Renta MH Retenida</span>
                <h4 className="text-lg font-black text-amber-600 dark:text-amber-400 mt-0.5 font-mono">
                  {formatCurrencyUSD(currentSelectedPayroll.totalRentaRetenida)}
                </h4>
              </div>

              <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/30 shadow-xs">
                <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-bold block">
                  (=) Líquido Pagado a Personal
                </span>
                <h4 className="text-lg font-black text-emerald-600 mt-0.5 font-mono">
                  {formatCurrencyUSD(currentSelectedPayroll.totalLiquido)}
                </h4>
              </div>
            </div>
          </div>

          {/* KPI Row 2: COSTOS PATRONALES QUE PAGA EL EMPRESARIO */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-50/80 via-white to-amber-50/60 dark:from-slate-900 dark:via-slate-900 dark:to-rose-950/20 border border-rose-200 dark:border-rose-900/50 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-100 dark:border-rose-900/30 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold text-xs">
                  <Briefcase className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-xs font-black uppercase tracking-wider text-rose-900 dark:text-rose-200">
                  2. Costos y Carga Patronal que Paga el Empresario (Fuera del Sueldo)
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-300">
                Aportes Patronales + Provisiones Legales
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-rose-100 dark:border-slate-700">
                <span className="text-[10px] text-slate-500 font-semibold block">
                  ISSS Patronal ({fiscalConfig.isssPatronalRate * 100}%)
                </span>
                <h5 className="text-base font-black text-rose-600 mt-0.5 font-mono">
                  +{formatCurrencyUSD(currentSelectedPayroll.totalIsssPatronal)}
                </h5>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-rose-100 dark:border-slate-700">
                <span className="text-[10px] text-slate-500 font-semibold block">
                  AFP Patronal ({fiscalConfig.afpPatronalRate * 100}%)
                </span>
                <h5 className="text-base font-black text-rose-600 mt-0.5 font-mono">
                  +{formatCurrencyUSD(currentSelectedPayroll.totalAfpPatronal)}
                </h5>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-rose-100 dark:border-slate-700">
                <span className="text-[10px] text-slate-500 font-semibold block">
                  INSAFORP ({fiscalConfig.insaforpPatronalRate * 100}%)
                </span>
                <h5 className="text-base font-black text-rose-600 mt-0.5 font-mono">
                  +{formatCurrencyUSD(currentSelectedPayroll.totalInsaforpPatronal)}
                </h5>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-rose-100 dark:border-slate-700">
                <span className="text-[10px] text-slate-500 font-semibold block">
                  Provisiones (Aguinaldo/Vac)
                </span>
                <h5 className="text-base font-black text-amber-600 mt-0.5 font-mono">
                  +{formatCurrencyUSD(currentSelectedPayroll.totalProvisiones)}
                </h5>
              </div>

              <div className="p-3 rounded-xl bg-rose-100/70 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800">
                <span className="text-[10px] text-rose-900 dark:text-rose-200 font-bold block">
                  Carga Patronal Total
                </span>
                <h5 className="text-base font-black text-rose-700 dark:text-rose-300 mt-0.5 font-mono">
                  +
                  {formatCurrencyUSD(
                    currentSelectedPayroll.totalIsssPatronal +
                      currentSelectedPayroll.totalAfpPatronal +
                      currentSelectedPayroll.totalInsaforpPatronal +
                      currentSelectedPayroll.totalProvisiones
                  )}
                </h5>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 text-white border border-slate-800 shadow-sm">
                <span className="text-[10px] text-rose-300 font-bold block">
                  COSTO REAL EMPRESA TOTAL
                </span>
                <h5 className="text-base font-black text-white mt-0.5 font-mono">
                  {formatCurrencyUSD(currentSelectedPayroll.costoTotalEmpresa)}
                </h5>
              </div>
            </div>
          </div>

          {/* Table View Mode Switcher */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                onClick={() => setPayrollTableViewMode('all')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                  payrollTableViewMode === 'all'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Vista Consolidada 360°
              </button>
              <button
                onClick={() => setPayrollTableViewMode('employer')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                  payrollTableViewMode === 'employer'
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Solo Costos Patronales (Empresario)
              </button>
              <button
                onClick={() => setPayrollTableViewMode('employee')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                  payrollTableViewMode === 'employee'
                    ? 'bg-purple-600 text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Solo Descuentos Laborales (Empleado)
              </button>
            </div>

            <span className="text-xs text-slate-500 font-medium">
              {currentSelectedPayroll.details.length} colaboradores procesados
            </span>
          </div>

          {/* Payroll Detailed Table */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3 font-sans">Colaborador / Cargo</th>
                    <th className="p-3 text-right">Salario Nominal</th>
                    {payrollTableViewMode !== 'employer' && (
                      <>
                        <th className="p-3 text-right text-indigo-600">ISSS (3%)</th>
                        <th className="p-3 text-right text-purple-600">AFP (7.25%)</th>
                        <th className="p-3 text-right text-amber-600">Renta MH</th>
                        <th className="p-3 text-right text-emerald-600 font-bold">Líquido a Pagar</th>
                      </>
                    )}
                    {payrollTableViewMode !== 'employee' && (
                      <>
                        <th className="p-3 text-right text-rose-600">ISSS Patronal (7.5%)</th>
                        <th className="p-3 text-right text-rose-600">AFP Patronal (8.75%)</th>
                        <th className="p-3 text-right text-rose-600">INSAFORP (1%)</th>
                        <th className="p-3 text-right text-amber-600">Provisiones</th>
                      </>
                    )}
                    <th className="p-3 text-right text-rose-700 font-bold bg-rose-50/50 dark:bg-rose-950/30">
                      Costo Total Empresa
                    </th>
                    <th className="p-3 text-center font-sans">Boleta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {currentSelectedPayroll.details.map((d) => {
                    const totalCostEmp =
                      d.totalDevengado +
                      d.isssPatronal +
                      d.afpPatronal +
                      d.insaforpPatronal +
                      d.provisionAguinaldo +
                      d.provisionVacacion +
                      d.provisionIndemnizacion;

                    return (
                      <tr key={d.employeeId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                        <td className="p-3 font-sans">
                          <p className="font-bold text-slate-900 dark:text-white">{d.employeeName}</p>
                          <p className="text-[10px] text-slate-400">
                            {d.position} • DUI: {d.dui}
                          </p>
                        </td>
                        <td className="p-3 text-right text-slate-700 dark:text-slate-300 font-bold">
                          {formatCurrencyUSD(d.baseSalary)}
                        </td>

                        {payrollTableViewMode !== 'employer' && (
                          <>
                            <td className="p-3 text-right text-indigo-600">
                              -{formatCurrencyUSD(d.isssLaboral)}
                            </td>
                            <td className="p-3 text-right text-purple-600">
                              -{formatCurrencyUSD(d.afpLaboral)}
                            </td>
                            <td className="p-3 text-right text-amber-600">
                              -{formatCurrencyUSD(d.rentaRetencion)}
                            </td>
                            <td className="p-3 text-right font-black text-emerald-600 text-sm">
                              {formatCurrencyUSD(d.liquidoPagar)}
                            </td>
                          </>
                        )}

                        {payrollTableViewMode !== 'employee' && (
                          <>
                            <td className="p-3 text-right text-rose-600 font-semibold">
                              +{formatCurrencyUSD(d.isssPatronal)}
                            </td>
                            <td className="p-3 text-right text-rose-600 font-semibold">
                              +{formatCurrencyUSD(d.afpPatronal)}
                            </td>
                            <td className="p-3 text-right text-rose-600 font-semibold">
                              +{formatCurrencyUSD(d.insaforpPatronal)}
                            </td>
                            <td className="p-3 text-right text-amber-600 font-semibold">
                              +{formatCurrencyUSD(d.provisionAguinaldo + d.provisionVacacion + d.provisionIndemnizacion)}
                            </td>
                          </>
                        )}

                        <td className="p-3 text-right text-rose-700 dark:text-rose-300 font-black text-sm bg-rose-50/30 dark:bg-rose-950/20">
                          {formatCurrencyUSD(totalCostEmp)}
                        </td>

                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleOpenSlipModal(d)}
                            title="Imprimir Boleta Individual"
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Colaboradores & Costo Real Empresa */}
      {activeTab === 'employees' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Expediente de Colaboradores & Costo Real de Contratación
                </h4>
                <p className="text-[11px] text-slate-500">
                  Cada salario nominal genera un costo adicional de ~34% por ISSS Patronal (7.5%), AFP Patronal (8.75%), INSAFORP (1%) y provisiones.
                </p>
              </div>
            </div>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={employeeSearch}
              onChange={(e) => setEmployeeSearch(e.target.value)}
              placeholder="Buscar colaborador por nombre, cargo, DUI o departamento..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {employees
              .filter((e) => [e.firstName, e.lastName, e.position, e.dui, e.department, e.code].join(' ').toLowerCase().includes(employeeSearch.trim().toLowerCase()))
              .map((e) => {
              const patronalIsss = Math.min(e.baseSalary * fiscalConfig.isssPatronalRate, fiscalConfig.isssMaxPatronalMensual);
              const patronalAfp = e.baseSalary * fiscalConfig.afpPatronalRate;
              const patronalInsaforp = e.baseSalary * fiscalConfig.insaforpPatronalRate;
              const provs = e.baseSalary * (fiscalConfig.provisionAguinaldoRate + fiscalConfig.provisionVacacionRate + fiscalConfig.provisionIndemnizacionRate);
              const totalCost = e.baseSalary + patronalIsss + patronalAfp + patronalInsaforp + provs;

              return (
                <div
                  key={e.id}
                  className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-purple-600">{e.code}</span>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                        {e.firstName} {e.lastName}
                      </h3>
                      <p className="text-xs text-slate-500">{e.position}</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        e.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {e.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800 font-mono">
                    <p>
                      <span className="font-sans text-slate-400">DUI:</span> {e.dui}
                    </p>
                    <p>
                      <span className="font-sans text-slate-400">ISSS:</span> {e.isssNumber} |{' '}
                      <span className="font-sans text-slate-400">AFP:</span> {e.afpName} ({e.afpNumber})
                    </p>
                    <p>
                      <span className="font-sans text-slate-400">Banco:</span> {e.bankName} - {e.bankAccountNumber}
                    </p>
                  </div>

                  {/* Employer Cost Breakdown for this employee */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60 space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Salario Nominal:</span>
                      <span className="font-bold text-slate-900 dark:text-white font-mono">
                        {formatCurrencyUSD(e.baseSalary)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-rose-600">
                      <span>(+) Aportes Patronales (ISSS + AFP + INSAFORP):</span>
                      <span className="font-mono">+{formatCurrencyUSD(patronalIsss + patronalAfp + patronalInsaforp)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-amber-600">
                      <span>(+) Provisiones (Aguinaldo + Vacación + Indem):</span>
                      <span className="font-mono">+{formatCurrencyUSD(provs)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t border-slate-200 dark:border-slate-700 font-bold">
                      <span className="text-rose-700 dark:text-rose-300">Costo Real Mensual Empresa:</span>
                      <span className="font-black text-rose-600 dark:text-rose-400 font-mono text-sm">
                        {formatCurrencyUSD(totalCost)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Quick Calculator & Costo Patronal */}
      {activeTab === 'calculator' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Inputs */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Calculator className="w-5 h-5 text-purple-600" />
              <span>Simulador de Descuentos & Costo Patronal</span>
            </h3>
            <p className="text-xs text-slate-500">
              Calcula simultáneamente lo que recibe el empleado y el desembolso total que asume la empresa.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Periodicidad:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCalcPeriod('quincenal')}
                    className={`p-2 rounded-lg font-bold transition cursor-pointer ${
                      calcPeriod === 'quincenal' ? 'bg-purple-600 text-white' : 'border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Quincenal
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalcPeriod('mensual')}
                    className={`p-2 rounded-lg font-bold transition cursor-pointer ${
                      calcPeriod === 'mensual' ? 'bg-purple-600 text-white' : 'border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Mensual
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Salario Nominal ($ USD):</label>
                <input
                  type="number"
                  step="10"
                  value={calcSalary}
                  onChange={(e) => setCalcSalary(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-base font-black font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Horas Extras / Bonos ($):</label>
                <input
                  type="number"
                  step="5"
                  value={calcOvertime}
                  onChange={(e) => setCalcOvertime(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Results Breakdown */}
          <div className="p-6 rounded-2xl border border-purple-200 dark:border-purple-900 bg-purple-50/40 dark:bg-purple-950/20 shadow-sm space-y-4 text-xs font-mono">
            <h4 className="font-black text-sm text-purple-950 dark:text-purple-200 uppercase tracking-wider font-sans">
              Desglose Tributario, Laboral & Patronal
            </h4>

            {/* Parte 1: Empleado */}
            <div className="space-y-2 border-b border-purple-200 dark:border-purple-900 pb-3">
              <span className="text-[10px] font-bold text-slate-400 font-sans block uppercase">
                A. Retenciones al Colaborador
              </span>
              <div className="flex justify-between font-bold text-slate-800 dark:text-slate-200 font-sans">
                <span>Total Devengado:</span>
                <span>{formatCurrencyUSD(calcResult.totalDevengado)}</span>
              </div>
              <div className="flex justify-between text-indigo-600">
                <span>(-) ISSS Laboral ({fiscalConfig.isssLaboralRate * 100}% máx $30):</span>
                <span>-{formatCurrencyUSD(calcResult.isssLaboral)}</span>
              </div>
              <div className="flex justify-between text-purple-600">
                <span>(-) AFP Laboral ({fiscalConfig.afpLaboralRate * 100}%):</span>
                <span>-{formatCurrencyUSD(calcResult.afpLaboral)}</span>
              </div>
              <div className="flex justify-between text-amber-600">
                <span>(-) Renta Ministerio Hacienda:</span>
                <span>-{formatCurrencyUSD(calcResult.rentaRetencion)}</span>
              </div>
              <div className="flex justify-between items-center pt-1 font-sans border-t border-purple-200 dark:border-purple-800 font-bold">
                <span className="text-slate-900 dark:text-white">Líquido a Recibir Trabajador:</span>
                <span className="text-lg font-black text-emerald-600 font-mono">
                  {formatCurrencyUSD(calcResult.liquidoPagar)}
                </span>
              </div>
            </div>

            {/* Parte 2: Costos Patronales Empresario */}
            <div className="pt-2 space-y-1.5 text-slate-600 dark:text-slate-400 text-[11px]">
              <span className="text-[10px] font-bold text-rose-600 font-sans block uppercase">
                B. Aportes Patronales Adicionales (Pagados por el Empresario)
              </span>
              <p className="flex justify-between text-rose-700 dark:text-rose-300">
                <span>• ISSS Patronal ({fiscalConfig.isssPatronalRate * 100}%):</span>
                <span className="font-mono">+{formatCurrencyUSD(calcResult.isssPatronal)}</span>
              </p>
              <p className="flex justify-between text-rose-700 dark:text-rose-300">
                <span>• AFP Patronal ({fiscalConfig.afpPatronalRate * 100}%):</span>
                <span className="font-mono">+{formatCurrencyUSD(calcResult.afpPatronal)}</span>
              </p>
              <p className="flex justify-between text-rose-700 dark:text-rose-300">
                <span>• INSAFORP ({fiscalConfig.insaforpPatronalRate * 100}%):</span>
                <span className="font-mono">+{formatCurrencyUSD(calcResult.insaforpPatronal)}</span>
              </p>
              <p className="flex justify-between text-amber-700 dark:text-amber-300">
                <span>• Provisiones de Ley (Aguinaldo + Vacación + Indem):</span>
                <span className="font-mono">
                  +{formatCurrencyUSD(calcResult.provisionAguinaldo + calcResult.provisionVacacion + calcResult.provisionIndemnizacion)}
                </span>
              </p>
              <div className="flex justify-between items-center font-black text-rose-600 pt-2 border-t border-purple-200 dark:border-purple-900 font-sans text-xs">
                <span>COSTO TOTAL REAL EMPRESA:</span>
                <span className="font-mono text-base font-black">{formatCurrencyUSD(calcResult.costoEmpresaTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Generar Planilla */}
      {isNewPayrollModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Generar Planilla Automatizada
              </h3>
              <button onClick={onCloseNewPayrollModal} className="cursor-pointer">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleGeneratePayroll} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Tipo de Período:</label>
                <select
                  value={genPeriodType}
                  onChange={(e) => setGenPeriodType(e.target.value as PayrollPeriod)}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                >
                  <option value="quincenal">Quincenal (El Salvador)</option>
                  <option value="mensual">Mensual Completo</option>
                </select>
              </div>

              {genPeriodType === 'quincenal' && (
                <div>
                  <label className="block font-semibold mb-1.5 text-purple-700 dark:text-purple-300">
                    Selecciona la Quincena Específica:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setGenQuincenaNumber(1)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center cursor-pointer ${
                        genQuincenaNumber === 1
                          ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span>1ª Quincena</span>
                      <span className="text-[10px] opacity-80 font-normal">Días 01 al 15</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setGenQuincenaNumber(2)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center cursor-pointer ${
                        genQuincenaNumber === 2
                          ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span>2ª Quincena</span>
                      <span className="text-[10px] opacity-80 font-normal">Días 16 al fin de mes</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Mes:</label>
                  <select
                    value={genMonth}
                    onChange={(e) => setGenMonth(parseInt(e.target.value))}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    {[
                      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
                    ].map((m, idx) => (
                      <option key={idx} value={idx + 1}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Año:</label>
                  <input
                    type="number"
                    value={genYear}
                    onChange={(e) => setGenYear(parseInt(e.target.value))}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 space-y-1">
                <p className="font-bold">Colaboradores a procesar: {employees.filter((e) => e.isActive).length}</p>
                <p className="text-[11px]">
                  El sistema calculará automáticamente retenciones laborales, aportes patronales (ISSS, AFP, INSAFORP, Provisiones) y generará el asiento contable balanceado.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={onCloseNewPayrollModal} className="px-3 py-1.5 rounded-lg border">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-1.5 rounded-lg bg-purple-600 text-white font-bold cursor-pointer">
                  Generar y Asentar Planilla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Nuevo Colaborador */}
      {isNewEmployeeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg my-8 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Registrar Nuevo Colaborador
              </h3>
              <button onClick={() => setIsNewEmployeeModalOpen(false)} className="cursor-pointer">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Nombres:</label>
                  <input
                    type="text"
                    value={newEmployee.firstName}
                    onChange={(e) => setNewEmployee({ ...newEmployee, firstName: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Apellidos:</label>
                  <input
                    type="text"
                    value={newEmployee.lastName}
                    onChange={(e) => setNewEmployee({ ...newEmployee, lastName: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">DUI:</label>
                  <input
                    type="text"
                    placeholder="01234567-8"
                    value={newEmployee.dui}
                    onChange={(e) => setNewEmployee({ ...newEmployee, dui: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">NIT:</label>
                  <input
                    type="text"
                    placeholder="0614-010190-101-0"
                    value={newEmployee.nit}
                    onChange={(e) => setNewEmployee({ ...newEmployee, nit: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1">AFP:</label>
                  <select
                    value={newEmployee.afpName}
                    onChange={(e) =>
                      setNewEmployee({
                        ...newEmployee,
                        afpName: e.target.value as 'Crecer' | 'Confía' | 'IPSFA' | 'UPISSS',
                      })
                    }
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="Crecer">Crecer</option>
                    <option value="Confía">Confía</option>
                    <option value="IPSFA">IPSFA</option>
                    <option value="UPISSS">UPISSS</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block font-semibold mb-1">NUP AFP:</label>
                  <input
                    type="text"
                    value={newEmployee.afpNumber}
                    onChange={(e) => setNewEmployee({ ...newEmployee, afpNumber: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Cargo / Puesto:</label>
                  <input
                    type="text"
                    value={newEmployee.position}
                    onChange={(e) => setNewEmployee({ ...newEmployee, position: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Salario Nominal ($ USD):</label>
                  <input
                    type="number"
                    step="50"
                    value={newEmployee.baseSalary}
                    onChange={(e) =>
                      setNewEmployee({ ...newEmployee, baseSalary: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setIsNewEmployeeModalOpen(false)} className="px-3 py-1.5 rounded-lg border cursor-pointer">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-1.5 rounded-lg bg-purple-600 text-white font-bold cursor-pointer">
                  Guardar Colaborador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PDF Modal for Individual Employee Slip */}
      {selectedSlipDetail && (
        <PDFReportModal
          isOpen={isPdfModalOpen}
          onClose={() => setIsPdfModalOpen(false)}
          reportType="payroll_slip"
          title={`Boleta de Pago - ${selectedSlipDetail.employeeName}`}
          subtitle={`Período: ${currentSelectedPayroll?.startDate} al ${currentSelectedPayroll?.endDate}`}
          data={selectedSlipDetail}
        />
      )}

      {/* Editor Modal for Overtime, Night hours, Bonuses & Deductions */}
      {currentSelectedPayroll && isEditorModalOpen && (
        <PayrollTableEditorModal
          isOpen={isEditorModalOpen}
          onClose={() => setIsEditorModalOpen(false)}
          payroll={currentSelectedPayroll}
          allEmployees={employees}
          fiscalConfig={fiscalConfig}
          onSave={(updated) => {
            saveCustomPayroll(updated);
            setIsEditorModalOpen(false);
          }}
        />
      )}

      {/* Print Full Payroll Table Modal */}
      {currentSelectedPayroll && isPrintFullPayrollOpen && (
        <PrintFullPayrollModal
          isOpen={isPrintFullPayrollOpen}
          onClose={() => setIsPrintFullPayrollOpen(false)}
          payroll={currentSelectedPayroll}
          company={currentCompany}
        />
      )}

      {/* Print All Employee Slips in One Unified Document Modal */}
      {currentSelectedPayroll && isPrintAllSlipsOpen && (
        <PrintAllSlipsModal
          isOpen={isPrintAllSlipsOpen}
          onClose={() => setIsPrintAllSlipsOpen(false)}
          payroll={currentSelectedPayroll}
          company={currentCompany}
        />
      )}
    </div>
  );
};