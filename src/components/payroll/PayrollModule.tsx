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
  Tablet,
  Edit3,
  Lock,
  Sparkles,
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
import { AttendanceAndSchedulesTab } from './AttendanceAndSchedulesTab';
import { TabletAttendanceKioskModal } from './TabletAttendanceKioskModal';
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
    addNotification,
    attendanceRecords,
    attendanceConfig,
  } = useERP();

  const [activeTab, setActiveTab] = useState<'payrolls' | 'services' | 'employees' | 'recruitment' | 'attendance' | 'calculator'>('payrolls');
  const [isKioskModalOpen, setIsKioskModalOpen] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [payrollTableViewMode, setPayrollTableViewMode] = useState<'all' | 'employer' | 'employee'>('all');
  const [isNewEmployeeModalOpen, setIsNewEmployeeModalOpen] = useState(false);
  const [isEditEmployeeModalOpen, setIsEditEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [selectedPayrollId, setSelectedPayrollId] = useState<string | null>(payrolls[0]?.id || null);
  const [selectedAttendanceEmployeeId, setSelectedAttendanceEmployeeId] = useState<string | null>(null);

  // Helper to compute attendance stats for a specific employee and payroll
  const getEmployeePayrollAttendance = (empId: string, currentPay: Payroll | null) => {
    if (!currentPay) return { punchCount: 0, lateCount: 0, lateMins: 0, records: [] };

    // 1. First look for exact date range
    let records = (attendanceRecords || []).filter((r) => {
      if (r.employeeId !== empId) return false;
      return r.date >= currentPay.startDate && r.date <= currentPay.endDate;
    });

    // 2. If no exact match (e.g. sample historical payroll or current punches), include recent records for this employee
    if (records.length === 0) {
      records = (attendanceRecords || []).filter((r) => r.employeeId === empId);
    }

    const lateRecords = records.filter(
      (r) => r.status === 'tardanza' || (r.minutesLate && r.minutesLate > (r.toleranceApplied || attendanceConfig?.toleranceMinutes || 10))
    );

    const punchCount = records.filter((r) => r.checkInTime).length;
    const lateCount = lateRecords.length;
    const lateMins = lateRecords.reduce((acc, r) => acc + (r.minutesLate || 0), 0);

    return { punchCount, lateCount, lateMins, records };
  };

  // Helper to generate a collision-free 4-digit PIN
  const generateUniquePin = (existingList: Employee[], currentEmpId?: string): string => {
    const usedPins = new Set(
      existingList
        .filter((e) => !currentEmpId || e.id !== currentEmpId)
        .map((e) => e.pinCode?.trim())
        .filter(Boolean)
    );
    for (let i = 0; i < 2000; i++) {
      const candidate = Math.floor(1000 + Math.random() * 9000).toString();
      if (!usedPins.has(candidate)) return candidate;
    }
    return '9999';
  };

  // Helper to detect if a PIN is already assigned to another active employee
  const getDuplicatePinEmployee = (pinToCheck?: string, currentEmpId?: string): Employee | undefined => {
    if (!pinToCheck || pinToCheck.trim().length < 4) return undefined;
    const cleanPin = pinToCheck.trim();
    return employees.find(
      (e) => (!currentEmpId || e.id !== currentEmpId) && e.pinCode?.trim() === cleanPin
    );
  };

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
    pinCode: '',
  });

  const handleOpenNewEmployee = () => {
    setNewEmployee({
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
      pinCode: generateUniquePin(employees),
    });
    setIsNewEmployeeModalOpen(true);
  };

  const handleOpenEditEmployee = (emp: Employee) => {
    setEditingEmployee({
      ...emp,
      pinCode: emp.pinCode || generateUniquePin(employees, emp.id),
    });
    setIsEditEmployeeModalOpen(true);
  };

  const handleSaveEditedEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;

    const dup = getDuplicatePinEmployee(editingEmployee.pinCode, editingEmployee.id);
    if (dup) {
      addNotification(
        'error',
        'PIN Duplicado',
        `El PIN ${editingEmployee.pinCode} ya pertenece a ${dup.firstName} ${dup.lastName}. Elige un PIN único.`
      );
      return;
    }

    updateEmployee(editingEmployee.id, editingEmployee);
    setIsEditEmployeeModalOpen(false);
    setEditingEmployee(null);
    addNotification('success', 'Colaborador Actualizado', `Datos y PIN de ${editingEmployee.firstName} guardados correctamente.`);
  };

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
    if (!newEmployee.firstName.trim() || !newEmployee.lastName.trim()) return;

    const dup = getDuplicatePinEmployee(newEmployee.pinCode);
    if (dup) {
      addNotification(
        'error',
        'PIN Duplicado',
        `El PIN ${newEmployee.pinCode} ya pertenece a ${dup.firstName} ${dup.lastName}. Genera un PIN único para evitar fraudes en la tablet.`
      );
      return;
    }

    createEmployee(newEmployee);
    setIsNewEmployeeModalOpen(false);
    addNotification('success', 'Colaborador Contratado', `Se registró a ${newEmployee.firstName} ${newEmployee.lastName} con PIN de marcaje ${newEmployee.pinCode || 'asignado'}.`);
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
      pinCode: generateUniquePin(employees),
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
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E3E8E6] dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[20px] font-semibold text-[#111827] dark:text-white leading-tight">
              Recursos Humanos & Planilla Legal (El Salvador)
            </h1>
            <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-semibold bg-teal-50 dark:bg-teal-950/60 text-[#0F766E] dark:text-teal-300 border border-teal-200 dark:border-teal-800">
              ISSS • AFP • INSAFORP • Renta MH
            </span>
          </div>
          <p className="text-[13px] text-[#6B7280] dark:text-slate-400 mt-1">
            Liquidación quincenal y mensual, desglose de retenciones al empleado y costos patronales que asume el empresario.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsKioskModalOpen(true)}
            className="px-3 py-1.5 rounded-[6px] border border-[#E3E8E6] dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-[#F6F8F7] text-[#111827] dark:text-slate-200 text-[13px] font-medium transition cursor-pointer flex items-center gap-1.5"
            title="Abrir terminal checador táctil para tablet con PIN"
          >
            <Tablet className="w-3.5 h-3.5 text-[#0F766E]" />
            <span>📱 Tablet Kiosko PIN</span>
          </button>
          <button
            type="button"
            onClick={handleOpenNewEmployee}
            className="px-3 py-1.5 rounded-[6px] border border-[#E3E8E6] dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-[#F6F8F7] text-[#111827] dark:text-slate-200 text-[13px] font-medium transition cursor-pointer flex items-center gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5 text-[#6B7280]" />
            <span>Nuevo Colaborador</span>
          </button>
          {/* THE ONLY PRIMARY ACTION BUTTON ON SCREEN */}
          <button
            type="button"
            onClick={onOpenNewPayrollModal}
            className="px-3.5 py-1.5 rounded-[6px] bg-[#0F766E] hover:bg-[#115E59] text-white text-[13px] font-medium flex items-center gap-1.5 transition cursor-pointer shadow-none"
          >
            <FileCheck2 className="w-4 h-4 text-white" />
            <span>+ Generar Planilla</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-[#E3E8E6] dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('payrolls')}
          className={`px-3 py-1.5 rounded-[6px] text-[12px] transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'payrolls'
              ? 'bg-[#0F766E] text-white font-semibold shadow-2xs'
              : 'text-[#6B7280] dark:text-slate-400 hover:bg-[#F6F8F7] dark:hover:bg-slate-800 hover:text-[#111827]'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Planilla de Salarios ({payrolls.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('attendance')}
          className={`px-3 py-1.5 rounded-[6px] text-[12px] transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'attendance'
              ? 'bg-[#0F766E] text-white font-semibold shadow-2xs'
              : 'text-[#6B7280] dark:text-slate-400 hover:bg-[#F6F8F7] dark:hover:bg-slate-800 hover:text-[#111827]'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Asistencia, Tablet PIN & Horarios</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('services')}
          className={`px-3 py-1.5 rounded-[6px] text-[12px] transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'services'
              ? 'bg-[#0F766E] text-white font-semibold shadow-2xs'
              : 'text-[#6B7280] dark:text-slate-400 hover:bg-[#F6F8F7] dark:hover:bg-slate-800 hover:text-[#111827]'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>Servicios Profesionales (10% Renta)</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('recruitment')}
          className={`px-3 py-1.5 rounded-[6px] text-[12px] transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'recruitment'
              ? 'bg-[#0F766E] text-white font-semibold shadow-2xs'
              : 'text-[#6B7280] dark:text-slate-400 hover:bg-[#F6F8F7] dark:hover:bg-slate-800 hover:text-[#111827]'
          }`}
        >
          <FolderOpen className="w-3.5 h-3.5" />
          <span>Bolsa de Empleo & CVs</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('employees')}
          className={`px-3 py-1.5 rounded-[6px] text-[12px] transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'employees'
              ? 'bg-[#0F766E] text-white font-semibold shadow-2xs'
              : 'text-[#6B7280] dark:text-slate-400 hover:bg-[#F6F8F7] dark:hover:bg-slate-800 hover:text-[#111827]'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Base de Empleados ({employees.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('calculator')}
          className={`px-3 py-1.5 rounded-[6px] text-[12px] transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'calculator'
              ? 'bg-[#0F766E] text-white font-semibold shadow-2xs'
              : 'text-[#6B7280] dark:text-slate-400 hover:bg-[#F6F8F7] dark:hover:bg-slate-800 hover:text-[#111827]'
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
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3.5 rounded-[8px] bg-white dark:bg-slate-900 border border-[#E3E8E6] dark:border-slate-800 shadow-none">
            <div className="flex items-center gap-2 flex-wrap">
              <label className="text-[12px] font-semibold text-[#111827] dark:text-slate-300">Planilla Activa:</label>
              <select
                value={currentSelectedPayroll.id}
                onChange={(e) => setSelectedPayrollId(e.target.value)}
                className="p-1.5 rounded-[6px] border border-[#E3E8E6] dark:border-slate-700 text-[12px] font-medium bg-white dark:bg-slate-800 text-[#111827] dark:text-white outline-none cursor-pointer"
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
                type="button"
                onClick={() => setIsEditorModalOpen(true)}
                className="px-3 py-1.5 rounded-[6px] border border-[#E3E8E6] dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-[#F6F8F7] text-[#111827] dark:text-slate-200 text-[12px] font-medium flex items-center gap-1.5 cursor-pointer shadow-none"
                title="Agregar o ajustar horas extras, nocturnidad, bonos y descuentos"
              >
                <Sliders className="w-3.5 h-3.5 text-[#0F766E]" />
                <span>Ajustar Horas Extras / Bonos</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPrintFullPayrollOpen(true)}
                className="px-3 py-1.5 rounded-[6px] border border-[#E3E8E6] dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-[#F6F8F7] text-[#111827] dark:text-slate-200 text-[12px] font-medium flex items-center gap-1.5 cursor-pointer shadow-none"
                title="Imprimir la planilla completa en formato tabla oficial"
              >
                <Printer className="w-3.5 h-3.5 text-[#6B7280]" />
                <span>Imprimir Planilla</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPrintAllSlipsOpen(true)}
                className="px-3 py-1.5 rounded-[6px] border border-[#E3E8E6] dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-[#F6F8F7] text-[#111827] dark:text-slate-200 text-[12px] font-medium flex items-center gap-1.5 cursor-pointer shadow-none"
                title="Imprimir todas las boletas de pago de los empleados en un solo PDF"
              >
                <FileText className="w-3.5 h-3.5 text-[#6B7280]" />
                <span>Imprimir Boletas</span>
              </button>

              {currentSelectedPayroll.status !== 'pagada' && (
                <button
                  type="button"
                  onClick={() => payPayroll(currentSelectedPayroll.id, bankAccounts[0]?.id || '')}
                  className="px-3.5 py-1.5 rounded-[6px] bg-[#059669] hover:bg-[#047857] text-white text-[12px] font-semibold flex items-center gap-1.5 cursor-pointer shadow-none"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  <span>Pagar y Dispersar</span>
                </button>
              )}
              <span
                className={`px-2 py-0.5 rounded-[4px] text-[10px] font-semibold uppercase tracking-wider ${
                  currentSelectedPayroll.status === 'pagada'
                    ? 'bg-emerald-50 text-[#059669] dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                }`}
              >
                {currentSelectedPayroll.status}
              </span>

              {payrolls.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`¿Estás seguro de eliminar esta planilla (Período ${currentSelectedPayroll.periodNumber})?`)) {
                      deletePayroll(currentSelectedPayroll.id);
                    }
                  }}
                  className="p-1.5 rounded-[6px] border border-[#E3E8E6] dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:border-rose-200 text-[#6B7280] hover:text-rose-600 transition cursor-pointer"
                  title="Eliminar esta planilla"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* KPI Row 1: Lo que Devengan y se Retiene a Empleados */}
          <div>
            <span className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider block mb-2">
              1. Liquidación y Retenciones al Trabajador
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-4 rounded-[8px] border border-[#E3E8E6] dark:border-slate-800 bg-white dark:bg-slate-900 shadow-none">
                <span className="text-[11px] text-[#6B7280] font-medium block">Total Devengado (Nominal)</span>
                <h4 className="text-[20px] font-semibold text-[#111827] dark:text-white mt-1 [font-variant-numeric:tabular-nums]">
                  {formatCurrencyUSD(currentSelectedPayroll.totalDevengado)}
                </h4>
              </div>

              <div className="p-4 rounded-[8px] border border-[#E3E8E6] dark:border-slate-800 bg-white dark:bg-slate-900 shadow-none">
                <span className="text-[11px] text-[#0F766E] font-medium block">
                  (-) ISSS Laboral ({fiscalConfig.isssLaboralRate * 100}%)
                </span>
                <h4 className="text-[20px] font-semibold text-[#0F766E] dark:text-teal-400 mt-1 [font-variant-numeric:tabular-nums]">
                  {formatCurrencyUSD(currentSelectedPayroll.totalIsssLaboral)}
                </h4>
              </div>

              <div className="p-4 rounded-[8px] border border-[#E3E8E6] dark:border-slate-800 bg-white dark:bg-slate-900 shadow-none">
                <span className="text-[11px] text-[#0F766E] font-medium block">
                  (-) AFP Laboral ({fiscalConfig.afpLaboralRate * 100}%)
                </span>
                <h4 className="text-[20px] font-semibold text-[#0F766E] dark:text-teal-400 mt-1 [font-variant-numeric:tabular-nums]">
                  {formatCurrencyUSD(currentSelectedPayroll.totalAfpLaboral)}
                </h4>
              </div>

              <div className="p-4 rounded-[8px] border border-[#E3E8E6] dark:border-slate-800 bg-white dark:bg-slate-900 shadow-none">
                <span className="text-[11px] text-amber-700 dark:text-amber-400 font-medium block">(-) Renta MH Retenida</span>
                <h4 className="text-[20px] font-semibold text-amber-700 dark:text-amber-400 mt-1 [font-variant-numeric:tabular-nums]">
                  {formatCurrencyUSD(currentSelectedPayroll.totalRentaRetenida)}
                </h4>
              </div>

              <div className="p-4 rounded-[8px] border border-teal-200 dark:border-teal-900/60 bg-teal-50/40 dark:bg-teal-950/30 shadow-none">
                <span className="text-[11px] text-[#059669] dark:text-emerald-300 font-semibold block">
                  (=) Líquido Pagado a Personal
                </span>
                <h4 className="text-[20px] font-semibold text-[#059669] mt-1 [font-variant-numeric:tabular-nums]">
                  {formatCurrencyUSD(currentSelectedPayroll.totalLiquido)}
                </h4>
              </div>
            </div>
          </div>

          {/* KPI Row 2: COSTOS PATRONALES QUE PAGA EL EMPRESARIO */}
          <div className="p-4 rounded-[8px] bg-white dark:bg-slate-900 border border-[#E3E8E6] dark:border-slate-800 shadow-none space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E3E8E6] dark:border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-[4px] bg-teal-50 dark:bg-teal-950 text-[#0F766E] flex items-center justify-center font-bold text-xs border border-teal-200 dark:border-teal-800">
                  <Briefcase className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-[12px] font-semibold text-[#111827] dark:text-white">
                  2. Costos y Carga Patronal que Paga el Empleador (Fuera del Sueldo)
                </h3>
              </div>
              <span className="text-[11px] font-medium text-[#6B7280]">
                Aportes Patronales + Provisiones Legales
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-3 rounded-[6px] bg-[#F6F8F7] dark:bg-slate-800 border border-[#E3E8E6] dark:border-slate-700">
                <span className="text-[10px] text-[#6B7280] font-medium block">
                  ISSS Patronal ({fiscalConfig.isssPatronalRate * 100}%)
                </span>
                <h5 className="text-[15px] font-semibold text-[#111827] dark:text-white mt-0.5 [font-variant-numeric:tabular-nums]">
                  +{formatCurrencyUSD(currentSelectedPayroll.totalIsssPatronal)}
                </h5>
              </div>

              <div className="p-3 rounded-[6px] bg-[#F6F8F7] dark:bg-slate-800 border border-[#E3E8E6] dark:border-slate-700">
                <span className="text-[10px] text-[#6B7280] font-medium block">
                  AFP Patronal ({fiscalConfig.afpPatronalRate * 100}%)
                </span>
                <h5 className="text-[15px] font-semibold text-[#111827] dark:text-white mt-0.5 [font-variant-numeric:tabular-nums]">
                  +{formatCurrencyUSD(currentSelectedPayroll.totalAfpPatronal)}
                </h5>
              </div>

              <div className="p-3 rounded-[6px] bg-[#F6F8F7] dark:bg-slate-800 border border-[#E3E8E6] dark:border-slate-700">
                <span className="text-[10px] text-[#6B7280] font-medium block">
                  INSAFORP ({fiscalConfig.insaforpPatronalRate * 100}%)
                </span>
                <h5 className="text-[15px] font-semibold text-[#111827] dark:text-white mt-0.5 [font-variant-numeric:tabular-nums]">
                  +{formatCurrencyUSD(currentSelectedPayroll.totalInsaforpPatronal)}
                </h5>
              </div>

              <div className="p-3 rounded-[6px] bg-[#F6F8F7] dark:bg-slate-800 border border-[#E3E8E6] dark:border-slate-700">
                <span className="text-[10px] text-[#6B7280] font-medium block">
                  Provisiones (Aguinaldo/Vac)
                </span>
                <h5 className="text-[15px] font-semibold text-amber-700 dark:text-amber-400 mt-0.5 [font-variant-numeric:tabular-nums]">
                  +{formatCurrencyUSD(currentSelectedPayroll.totalProvisiones)}
                </h5>
              </div>

              <div className="p-3 rounded-[6px] bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800">
                <span className="text-[10px] text-rose-700 dark:text-rose-300 font-semibold block">
                  Carga Patronal Total
                </span>
                <h5 className="text-[15px] font-semibold text-rose-700 dark:text-rose-300 mt-0.5 [font-variant-numeric:tabular-nums]">
                  +
                  {formatCurrencyUSD(
                    currentSelectedPayroll.totalIsssPatronal +
                      currentSelectedPayroll.totalAfpPatronal +
                      currentSelectedPayroll.totalInsaforpPatronal +
                      currentSelectedPayroll.totalProvisiones
                  )}
                </h5>
              </div>

              <div className="p-3 rounded-[6px] bg-[#111827] text-white border border-slate-800 shadow-none">
                <span className="text-[10px] text-teal-300 font-semibold block">
                  COSTO REAL EMPRESA TOTAL
                </span>
                <h5 className="text-[15px] font-semibold text-white mt-0.5 [font-variant-numeric:tabular-nums]">
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
          <div className="rounded-[8px] border border-[#E3E8E6] dark:border-slate-800 bg-white dark:bg-slate-900 shadow-none overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#F6F8F7] dark:bg-slate-800/80 text-[#6B7280] dark:text-slate-400 uppercase text-[10px] font-bold border-b border-[#E3E8E6] dark:border-slate-800">
                  <tr>
                    <th className="p-3 font-sans">Colaborador / Cargo</th>
                    <th className="p-3 text-center font-sans">Asistencia & Tardanzas</th>
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
                        <td className="p-3 text-center font-sans">
                          {(() => {
                            const { punchCount, lateCount, lateMins } = getEmployeePayrollAttendance(d.employeeId, currentSelectedPayroll);
                            if (lateCount > 0) {
                              return (
                                <button
                                  type="button"
                                  onClick={() => setSelectedAttendanceEmployeeId(d.employeeId)}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/80 text-[11px] font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/60 transition cursor-pointer"
                                  title="Ver registro de marcaciones y tardanzas del colaborador en la quincena"
                                >
                                  <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                                  <span>⚠️ {lateCount} tardanza{lateCount > 1 ? 's' : ''} ({lateMins} min)</span>
                                </button>
                              );
                            }
                            if (punchCount > 0) {
                              return (
                                <button
                                  type="button"
                                  onClick={() => setSelectedAttendanceEmployeeId(d.employeeId)}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/80 text-[11px] font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition cursor-pointer"
                                  title="Ver marcaciones de asistencia"
                                >
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                  <span>✓ {punchCount} d. puntual</span>
                                </button>
                              );
                            }
                            return (
                              <button
                                type="button"
                                onClick={() => setSelectedAttendanceEmployeeId(d.employeeId)}
                                className="text-[10px] text-slate-400 hover:text-[#0F766E] font-mono underline cursor-pointer"
                                title="Ver historial de marcaciones"
                              >
                                Ver marcas
                              </button>
                            );
                          })()}
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

      {/* Tab: Servicios Profesionales (Art. 156 Código Tributario SV - Retención 10%) */}
      {activeTab === 'services' && <ProfessionalServicesTab />}

      {/* Tab: Bolsa de Empleo & CVs con Carga Masiva Drag & Drop */}
      {activeTab === 'recruitment' && <CandidateRecruitmentTab />}

      {/* Tab: Asistencia, Tablet Kiosko PIN & Horarios */}
      {activeTab === 'attendance' && (
        <AttendanceAndSchedulesTab onOpenKiosk={() => setIsKioskModalOpen(true)} />
      )}

      {/* Tab 2: Colaboradores & Costo Real Empresa */}
      {activeTab === 'employees' && (
        <div className="space-y-4">
          <div className="p-4 rounded-[8px] bg-white dark:bg-slate-900 border border-[#E3E8E6] dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[6px] bg-[#0F766E] text-white flex items-center justify-center font-bold">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#111827] dark:text-white">
                  Expediente de Colaboradores & Costo Real de Contratación
                </h4>
                <p className="text-[11px] text-[#6B7280]">
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
              className="w-full pl-9 pr-3 py-2 rounded-[6px] border border-[#E3E8E6] dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-[#111827] dark:text-white outline-none"
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
                  className="p-4 rounded-[8px] border border-[#E3E8E6] dark:border-slate-800 bg-white dark:bg-slate-900 shadow-none space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-[#0F766E]">{e.code}</span>
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

                  <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-[#E3E8E6] dark:border-slate-800 font-mono">
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
                  <div className="p-3 rounded-[6px] bg-[#F6F8F7] dark:bg-slate-800/80 border border-[#E3E8E6] dark:border-slate-700/60 space-y-1.5 text-xs">
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
                    <div className="flex justify-between items-center pt-1 border-t border-[#E3E8E6] dark:border-slate-700 font-bold">
                      <span className="text-rose-700 dark:text-rose-300">Costo Real Mensual Empresa:</span>
                      <span className="font-black text-rose-600 dark:text-rose-400 font-mono text-sm">
                        {formatCurrencyUSD(totalCost)}
                      </span>
                    </div>
                  </div>

                  {/* Kiosk PIN and Edit Button Footer */}
                  <div className="pt-2 border-t border-[#E3E8E6] dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[11px] font-mono">
                      <Lock className="w-3.5 h-3.5 text-[#0F766E]" />
                      <span className="text-slate-500 font-sans">PIN Tablet:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-[4px] border border-[#E3E8E6] dark:border-slate-700">
                        {e.pinCode || 'Sin PIN'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenEditEmployee(e)}
                      className="px-2.5 py-1 rounded-[6px] bg-[#0F766E]/10 hover:bg-[#0F766E]/20 text-[#0F766E] dark:text-teal-400 font-medium text-xs flex items-center gap-1 transition cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Editar & PIN</span>
                    </button>
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
          <div className="p-5 rounded-[8px] border border-[#E3E8E6] dark:border-slate-800 bg-white dark:bg-slate-900 shadow-none space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Calculator className="w-5 h-5 text-[#0F766E]" />
              <span>Simulador de Descuentos & Costo Patronal</span>
            </h3>
            <p className="text-xs text-[#6B7280]">
              Calcula simultáneamente lo que recibe el empleado y el desembolso total que asume la empresa.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Periodicidad:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCalcPeriod('quincenal')}
                    className={`p-2 rounded-[6px] font-semibold transition cursor-pointer ${
                      calcPeriod === 'quincenal' ? 'bg-[#0F766E] text-white' : 'border border-[#E3E8E6] dark:border-slate-700'
                    }`}
                  >
                    Quincenal
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalcPeriod('mensual')}
                    className={`p-2 rounded-[6px] font-semibold transition cursor-pointer ${
                      calcPeriod === 'mensual' ? 'bg-[#0F766E] text-white' : 'border border-[#E3E8E6] dark:border-slate-700'
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
                  className="w-full p-2.5 rounded-[6px] border border-[#E3E8E6] dark:border-slate-700 bg-[#F6F8F7] dark:bg-slate-800 text-base font-bold font-mono text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Horas Extras / Bonos ($):</label>
                <input
                  type="number"
                  step="5"
                  value={calcOvertime}
                  onChange={(e) => setCalcOvertime(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 rounded-[6px] border border-[#E3E8E6] dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                />
              </div>
            </div>
          </div>

          {/* Results Breakdown */}
          <div className="p-5 rounded-[8px] border border-teal-200 dark:border-teal-900/60 bg-teal-50/40 dark:bg-teal-950/20 shadow-none space-y-4 text-xs font-mono">
            <h4 className="font-bold text-sm text-[#0F766E] dark:text-teal-300 uppercase tracking-wider font-sans">
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
          <div className="w-full max-w-md rounded-[8px] border border-[#E3E8E6] dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl p-6 space-y-4 text-xs">
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
          <div className="w-full max-w-lg my-8 rounded-[8px] border border-[#E3E8E6] dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl p-6 space-y-4 text-xs">
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
                  <label className="block font-semibold mb-1">Departamento Interno:</label>
                  <input
                    type="text"
                    placeholder="Ej: Operaciones, Ventas, Caja..."
                    value={newEmployee.department}
                    onChange={(e) => setNewEmployee({ ...newEmployee, department: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    required
                  />
                </div>
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

              {/* PIN Confidencial de Asistencia en Tablet */}
              <div className="p-3.5 rounded-xl bg-cyan-50/70 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    <span className="font-bold text-slate-900 dark:text-white text-xs">
                      PIN Personal de Marcaje (Tablet Kiosko) *
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setNewEmployee({
                        ...newEmployee,
                        pinCode: generateUniquePin(employees),
                      })
                    }
                    className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    Generar PIN Único
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    maxLength={4}
                    placeholder="Ej: 1045"
                    value={newEmployee.pinCode || ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setNewEmployee({ ...newEmployee, pinCode: val });
                    }}
                    className="w-32 p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-center font-mono font-black text-sm tracking-widest text-cyan-600 dark:text-cyan-400"
                    required
                  />
                  <p className="text-[11px] text-slate-500">
                    Código secreto de 4 dígitos para que el trabajador fiche su Entrada, Salida y Almuerzo en la tablet.
                  </p>
                </div>
                {newEmployee.pinCode && getDuplicatePinEmployee(newEmployee.pinCode) && (
                  <div className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5 pt-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      ⚠️ Este PIN ya pertenece a{' '}
                      <strong>{getDuplicatePinEmployee(newEmployee.pinCode)?.firstName} {getDuplicatePinEmployee(newEmployee.pinCode)?.lastName}</strong> ({getDuplicatePinEmployee(newEmployee.pinCode)?.code}). Asigna otro PIN para evitar fraudes.
                    </span>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setIsNewEmployeeModalOpen(false)} className="px-3 py-1.5 rounded-lg border cursor-pointer">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={Boolean(newEmployee.pinCode && getDuplicatePinEmployee(newEmployee.pinCode))}
                  className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold cursor-pointer"
                >
                  Guardar y Contratar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Editar Colaborador & PIN */}
      {isEditEmployeeModalOpen && editingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
          <div className="w-full max-w-lg my-8 rounded-[8px] border border-[#E3E8E6] dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-indigo-600" />
                  <span>Editar Colaborador & Asignar PIN</span>
                </h3>
                <p className="text-[11px] text-slate-500 font-mono">
                  {editingEmployee.code} • {editingEmployee.firstName} {editingEmployee.lastName}
                </p>
              </div>
              <button onClick={() => setIsEditEmployeeModalOpen(false)} className="cursor-pointer text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedEmployee} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Nombres:</label>
                  <input
                    type="text"
                    value={editingEmployee.firstName}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, firstName: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Apellidos:</label>
                  <input
                    type="text"
                    value={editingEmployee.lastName}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, lastName: e.target.value })}
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
                    value={editingEmployee.position}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, position: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Departamento:</label>
                  <input
                    type="text"
                    value={editingEmployee.department}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, department: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Salario Nominal ($ USD):</label>
                  <input
                    type="number"
                    step="50"
                    value={editingEmployee.baseSalary}
                    onChange={(e) =>
                      setEditingEmployee({ ...editingEmployee, baseSalary: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Estado:</label>
                  <select
                    value={editingEmployee.isActive ? 'active' : 'inactive'}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, isActive: e.target.value === 'active' })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  >
                    <option value="active">🟢 Activo</option>
                    <option value="inactive">🔴 Inactivo</option>
                  </select>
                </div>
              </div>

              {/* PIN Confidencial de Asistencia en Tablet */}
              <div className="p-3.5 rounded-xl bg-cyan-50/70 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    <span className="font-bold text-slate-900 dark:text-white text-xs">
                      PIN Personal de Marcaje (Tablet Kiosko) *
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setEditingEmployee({
                        ...editingEmployee,
                        pinCode: generateUniquePin(employees, editingEmployee.id),
                      })
                    }
                    className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    Generar PIN Único
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    maxLength={4}
                    placeholder="Ej: 1045"
                    value={editingEmployee.pinCode || ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setEditingEmployee({ ...editingEmployee, pinCode: val });
                    }}
                    className="w-32 p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-center font-mono font-black text-sm tracking-widest text-cyan-600 dark:text-cyan-400"
                    required
                  />
                  <p className="text-[11px] text-slate-500">
                    PIN confidencial que el colaborador digitará en la tablet checadora para registrar su entrada o salida.
                  </p>
                </div>
                {editingEmployee.pinCode && getDuplicatePinEmployee(editingEmployee.pinCode, editingEmployee.id) && (
                  <div className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5 pt-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      ⚠️ Este PIN ya pertenece a{' '}
                      <strong>{getDuplicatePinEmployee(editingEmployee.pinCode, editingEmployee.id)?.firstName} {getDuplicatePinEmployee(editingEmployee.pinCode, editingEmployee.id)?.lastName}</strong> ({getDuplicatePinEmployee(editingEmployee.pinCode, editingEmployee.id)?.code}). Asigna otro PIN exclusivo.
                    </span>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsEditEmployeeModalOpen(false)} className="px-3 py-1.5 rounded-lg border cursor-pointer">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={Boolean(editingEmployee.pinCode && getDuplicatePinEmployee(editingEmployee.pinCode, editingEmployee.id))}
                  className="px-4 py-1.5 rounded-lg bg-[#0F766E] hover:bg-[#115E59] disabled:opacity-50 text-white font-bold cursor-pointer"
                >
                  Guardar Cambios y PIN
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

      {/* Terminal Tablet Kiosko de Asistencia con PIN */}
      <TabletAttendanceKioskModal
        isOpen={isKioskModalOpen}
        onClose={() => setIsKioskModalOpen(false)}
      />

      {/* MODAL: Dashboard de Asistencia y Marcación por Colaborador */}
      {selectedAttendanceEmployeeId && currentSelectedPayroll && (() => {
        const selectedEmp = employees.find((e) => e.id === selectedAttendanceEmployeeId) ||
          currentSelectedPayroll.details.find((d) => d.employeeId === selectedAttendanceEmployeeId);
        const { punchCount, lateCount, lateMins, records } = getEmployeePayrollAttendance(selectedAttendanceEmployeeId, currentSelectedPayroll);
        const tolerance = attendanceConfig?.toleranceMinutes || 10;
        const employeeDisplayName = (selectedEmp as any)?.firstName
          ? `${(selectedEmp as any).firstName} ${(selectedEmp as any).lastName}`
          : (selectedEmp as any)?.employeeName || 'Colaborador';

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
            <div className="w-full max-w-2xl my-8 rounded-[8px] border border-[#E3E8E6] dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl p-5 sm:p-6 space-y-4 text-xs">
              <div className="flex items-start justify-between border-b pb-3 border-[#E3E8E6] dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-[6px] bg-[#0F766E] flex items-center justify-center text-white">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#111827] dark:text-white">
                      Dashboard de Asistencia en Planilla
                    </h3>
                    <p className="text-[11px] text-[#6B7280]">
                      Colaborador: <strong className="text-slate-800 dark:text-slate-200">{employeeDisplayName}</strong> • Período: {currentSelectedPayroll.startDate} al {currentSelectedPayroll.endDate}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedAttendanceEmployeeId(null)}
                  className="p-1 rounded-[6px] text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-[6px] bg-[#F6F8F7] dark:bg-slate-800 border border-[#E3E8E6] dark:border-slate-700">
                  <span className="text-[10px] text-[#6B7280] font-medium block">Días Marcados</span>
                  <span className="text-base font-bold text-[#111827] dark:text-white font-mono mt-0.5 block">{punchCount}</span>
                </div>
                <div className={`p-3 rounded-[6px] border ${lateCount > 0 ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800' : 'bg-[#F6F8F7] dark:bg-slate-800 border-[#E3E8E6] dark:border-slate-700'}`}>
                  <span className={`text-[10px] font-medium block ${lateCount > 0 ? 'text-amber-800 dark:text-amber-300' : 'text-[#6B7280]'}`}>Tardanzas en Quincena</span>
                  <span className={`text-base font-bold font-mono mt-0.5 block ${lateCount > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-[#111827] dark:text-white'}`}>{lateCount} días</span>
                </div>
                <div className="p-3 rounded-[6px] bg-[#F6F8F7] dark:bg-slate-800 border border-[#E3E8E6] dark:border-slate-700">
                  <span className="text-[10px] text-[#6B7280] font-medium block">Minutos Excedidos</span>
                  <span className="text-base font-bold text-[#111827] dark:text-white font-mono mt-0.5 block">{lateMins} min</span>
                </div>
                <div className="p-3 rounded-[6px] bg-[#F6F8F7] dark:bg-slate-800 border border-[#E3E8E6] dark:border-slate-700">
                  <span className="text-[10px] text-[#6B7280] font-medium block">Tolerancia de Ley</span>
                  <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 block">{tolerance} min</span>
                </div>
              </div>

              {/* Policy Explanation Box */}
              <div className="p-3 rounded-[6px] bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-[11px] text-[#0F766E] dark:text-teal-300 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <ShieldCheck className="w-4 h-4 text-[#0F766E] shrink-0" />
                  <span>Política Empresarial: Notificación y Aviso de Tardanzas</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300">
                  El sistema registra los marcajes biométricos por PIN y contabiliza las llegadas posteriores a los <strong>{tolerance} minutos de tolerancia</strong>. En el modo estándar de la empresa, esto funciona como <strong>aviso informativo de puntualidad</strong> para evaluar la disciplina laboral y no realiza descuentos arbitrarios salvo que el reglamento interno lo estipule.
                </p>
              </div>

              {/* Table of Punches in this Period */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-[#111827] dark:text-white">
                  Detalle de Marcaciones Registradas en el Kiosko Tablet:
                </h4>
                {records.length === 0 ? (
                  <div className="p-4 rounded-[6px] border border-dashed border-[#E3E8E6] text-center text-[#6B7280]">
                    No se registran marcajes biométricos en este rango de fechas para este colaborador.
                  </div>
                ) : (
                  <div className="rounded-[6px] border border-[#E3E8E6] dark:border-slate-800 overflow-hidden max-h-56 overflow-y-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-[#F6F8F7] dark:bg-slate-800 text-[#6B7280] dark:text-slate-400 text-[10px] uppercase font-bold border-b border-[#E3E8E6] dark:border-slate-700 sticky top-0">
                        <tr>
                          <th className="p-2.5 font-sans">Fecha</th>
                          <th className="p-2.5 text-center">Entrada Marcada</th>
                          <th className="p-2.5 text-center">Horario Base</th>
                          <th className="p-2.5 text-center">Almuerzo</th>
                          <th className="p-2.5 text-center">Salida</th>
                          <th className="p-2.5 text-right font-sans">Condición</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {records.map((r) => {
                          const isLate = r.status === 'tardanza' || (r.minutesLate && r.minutesLate > (r.toleranceApplied || tolerance));
                          return (
                            <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-850">
                              <td className="p-2.5 font-sans font-medium text-slate-900 dark:text-white">
                                {r.date}
                              </td>
                              <td className="p-2.5 text-center font-bold text-slate-800 dark:text-slate-200">
                                {r.checkInTime || '-'}
                              </td>
                              <td className="p-2.5 text-center text-slate-500">
                                {r.scheduledStartTime || '08:00'}
                              </td>
                              <td className="p-2.5 text-center text-slate-500 text-[11px]">
                                {r.lunchStartTime && r.lunchEndTime ? `${r.lunchStartTime.slice(0,5)} - ${r.lunchEndTime.slice(0,5)}` : '-'}
                              </td>
                              <td className="p-2.5 text-center text-slate-500">
                                {r.checkOutTime || '-'}
                              </td>
                              <td className="p-2.5 text-right font-sans">
                                {isLate ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                                    ⚠️ Tardanza (+{r.minutesLate || 5} min)
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                                    ✓ Puntual
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedAttendanceEmployeeId(null)}
                  className="px-4 py-1.5 rounded-[6px] bg-[#0F766E] hover:bg-[#115E59] text-white font-medium text-xs cursor-pointer"
                >
                  Cerrar Detalle
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};