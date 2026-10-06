import React, { useState, useMemo } from 'react';
import { useERP } from '../../context/ERPContext';
import { AttendanceRecord, EmployeeLeaveRequest, Employee } from '../../types';
import { formatCurrencyUSD } from '../../utils/salvadoranTax';
import {
  Clock,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Users,
  Search,
  PlusCircle,
  FileText,
  Sliders,
  Tablet,
  Check,
  X,
  Coffee,
  Building,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Percent,
  Lock,
  Edit3,
  Key,
  Eye,
  EyeOff,
  Download,
} from 'lucide-react';

interface Props {
  onOpenKiosk: () => void;
}

export const AttendanceAndSchedulesTab: React.FC<Props> = ({ onOpenKiosk }) => {
  const {
    employees,
    attendanceRecords,
    leaveRequests,
    attendanceConfig,
    updateAttendanceConfig,
    recordAttendanceCheck,
    createLeaveRequest,
    updateLeaveRequestStatus,
    currentCompany,
    addNotification,
    updateEmployee,
  } = useERP();

  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [subSection, setSubSection] = useState<'attendance' | 'leaves' | 'schedules'>('attendance');

  // Modals
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isNewLeaveModalOpen, setIsNewLeaveModalOpen] = useState(false);
  const [isManualMarkModalOpen, setIsManualMarkModalOpen] = useState(false);
  const [isEditPinModalOpen, setIsEditPinModalOpen] = useState(false);
  const [editingPinEmp, setEditingPinEmp] = useState<Employee | null>(null);
  const [revealedPins, setRevealedPins] = useState<Record<string, boolean>>({});

  // Form states for PIN & Schedule editing
  const [pinFormVal, setPinFormVal] = useState<string>('');
  const [scheduleStartVal, setScheduleStartVal] = useState<string>('08:00');
  const [scheduleEndVal, setScheduleEndVal] = useState<string>('17:00');
  const [scheduleLunchStartVal, setScheduleLunchStartVal] = useState<string>('12:00');
  const [scheduleLunchEndVal, setScheduleLunchEndVal] = useState<string>('13:00');
  const [scheduleToleranceVal, setScheduleToleranceVal] = useState<number>(10);

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

  // Helper to detect if a PIN is already assigned to another employee
  const getDuplicatePinEmployee = (pinToCheck?: string, currentEmpId?: string): Employee | undefined => {
    if (!pinToCheck || pinToCheck.trim().length < 4) return undefined;
    const cleanPin = pinToCheck.trim();
    return employees.find(
      (e) => (!currentEmpId || e.id !== currentEmpId) && e.pinCode?.trim() === cleanPin
    );
  };

  const handleOpenEditPinSchedule = (emp: Employee) => {
    setEditingPinEmp(emp);
    setPinFormVal(emp.pinCode || generateUniquePin(employees, emp.id));
    setScheduleStartVal(emp.workSchedule?.startTime || attendanceConfig.defaultStartTime || '08:00');
    setScheduleEndVal(emp.workSchedule?.endTime || attendanceConfig.defaultEndTime || '17:00');
    setScheduleLunchStartVal(emp.workSchedule?.lunchStartTime || attendanceConfig.defaultLunchStart || '12:00');
    setScheduleLunchEndVal(emp.workSchedule?.lunchEndTime || attendanceConfig.defaultLunchEnd || '13:00');
    setScheduleToleranceVal(emp.workSchedule?.toleranceMinutes || attendanceConfig.toleranceMinutes || 10);
    setIsEditPinModalOpen(true);
  };

  const handleSavePinSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPinEmp) return;

    const dup = getDuplicatePinEmployee(pinFormVal, editingPinEmp.id);
    if (dup) {
      addNotification(
        'error',
        'PIN Duplicado',
        `El PIN ${pinFormVal} ya pertenece a ${dup.firstName} ${dup.lastName}. Elige un PIN único.`
      );
      return;
    }

    updateEmployee(editingPinEmp.id, {
      pinCode: pinFormVal.trim(),
      workSchedule: {
        startTime: scheduleStartVal,
        endTime: scheduleEndVal,
        lunchStartTime: scheduleLunchStartVal,
        lunchEndTime: scheduleLunchEndVal,
        workDays: editingPinEmp.workSchedule?.workDays || [1, 2, 3, 4, 5, 6],
        toleranceMinutes: scheduleToleranceVal,
      },
    });

    setIsEditPinModalOpen(false);
    setEditingPinEmp(null);
    addNotification(
      'success',
      'Horario y PIN Actualizados',
      `Se guardó el PIN ${pinFormVal} y horario para ${editingPinEmp.firstName}.`
    );
  };

  // Leave Form
  const [leaveEmployeeId, setLeaveEmployeeId] = useState(employees[0]?.id || '');
  const [leaveType, setLeaveType] = useState<EmployeeLeaveRequest['type']>('permiso_con_goce');
  const [leaveStartDate, setLeaveStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [leaveEndDate, setLeaveEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [leaveReason, setLeaveReason] = useState('');

  // Config Form
  const [configStartTime, setConfigStartTime] = useState(attendanceConfig.defaultStartTime || '08:00');
  const [configEndTime, setConfigEndTime] = useState(attendanceConfig.defaultEndTime || '17:00');
  const [configLunchStart, setConfigLunchStart] = useState(attendanceConfig.defaultLunchStart || '12:00');
  const [configLunchEnd, setConfigLunchEnd] = useState(attendanceConfig.defaultLunchEnd || '13:00');
  const [configTolerance, setConfigTolerance] = useState(attendanceConfig.toleranceMinutes || 10);

  // Manual Check-in Form
  const [manualEmpId, setManualEmpId] = useState(employees[0]?.id || '');
  const [manualTime, setManualTime] = useState('08:00');
  const [manualType, setManualType] = useState<'check_in' | 'check_out' | 'lunch_start' | 'lunch_end'>('check_in');

  // Calculate day attendance rows (merging registered records with active employees)
  const dayRecords = useMemo(() => {
    return employees.map((emp) => {
      const existing = attendanceRecords.find(
        (r) => r.employeeId === emp.id && r.date === selectedDate
      );
      const leave = leaveRequests.find(
        (l) =>
          l.employeeId === emp.id &&
          l.status === 'aprobado' &&
          selectedDate >= l.startDate &&
          selectedDate <= l.endDate
      );

      if (existing) {
        return { emp, record: existing, leave };
      }

      // Default mock status if no check-in recorded yet for selected date
      return {
        emp,
        record: null,
        leave,
      };
    });
  }, [employees, attendanceRecords, leaveRequests, selectedDate]);

  const filteredDayRecords = useMemo(() => {
    return dayRecords.filter(({ emp, record, leave }) => {
      if (statusFilter !== 'all') {
        if (statusFilter === 'leave' && !leave) return false;
        if (statusFilter === 'a_tiempo' && record?.status !== 'a_tiempo') return false;
        if (statusFilter === 'tardanza' && record?.status !== 'tardanza') return false;
        if (statusFilter === 'falta' && (record !== null || leave)) return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          emp.firstName.toLowerCase().includes(q) ||
          emp.lastName.toLowerCase().includes(q) ||
          emp.code.toLowerCase().includes(q) ||
          emp.position.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [dayRecords, statusFilter, searchTerm]);

  // Statistics
  const totalEmployeesCount = employees.length;
  const presentCount = dayRecords.filter((d) => d.record !== null).length;
  const onTimeCount = dayRecords.filter((d) => d.record?.status === 'a_tiempo').length;
  const lateCount = dayRecords.filter((d) => d.record?.status === 'tardanza').length;
  const leaveCount = dayRecords.filter((d) => d.leave).length;
  const punctualityRate = presentCount > 0 ? Math.round((onTimeCount / presentCount) * 100) : 100;

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updateAttendanceConfig({
      defaultStartTime: configStartTime,
      defaultEndTime: configEndTime,
      defaultLunchStart: configLunchStart,
      defaultLunchEnd: configLunchEnd,
      toleranceMinutes: Number(configTolerance),
    });
    setIsConfigModalOpen(false);
    addNotification(
      'success',
      'Horarios & Tolerancia Actualizados',
      `Tolerancia establecida en ${configTolerance} minutos para la empresa.`
    );
  };

  const handleCreateLeave = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((e) => e.id === leaveEmployeeId);
    if (!emp) return;

    createLeaveRequest({
      employeeId: emp.id,
      employeeName: `${emp.firstName} ${emp.lastName}`,
      type: leaveType,
      startDate: leaveStartDate,
      endDate: leaveEndDate,
      daysCount: 1,
      reason: leaveReason || 'Permiso laboral registrado',
      status: 'aprobado',
    });

    setIsNewLeaveModalOpen(false);
    setLeaveReason('');
    addNotification('success', 'Permiso Aprobado', `Permiso registrado para ${emp.firstName}.`);
  };

  const handleManualCheck = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((e) => e.id === manualEmpId);
    if (!emp) return;

    recordAttendanceCheck(emp.id, manualType, 'manual_admin', manualTime, selectedDate);
    setIsManualMarkModalOpen(false);
    addNotification('success', 'Marcaje Manual Exitoso', `Se registró la hora ${manualTime} para ${emp.firstName}.`);
  };

  const handleSimulateDayAttendance = () => {
    let count = 0;
    employees.forEach((emp, index) => {
      // 80% on time, 20% late to test metrics accurately
      const isLate = index % 4 === 3;
      const checkInHour = isLate ? '08:24' : index % 2 === 0 ? '07:53' : '07:58';
      recordAttendanceCheck(emp.id, 'check_in', 'manual_admin', checkInHour, selectedDate);
      recordAttendanceCheck(emp.id, 'lunch_start', 'manual_admin', '12:05', selectedDate);
      recordAttendanceCheck(emp.id, 'lunch_end', 'manual_admin', '13:04', selectedDate);
      recordAttendanceCheck(emp.id, 'check_out', 'manual_admin', '17:08', selectedDate);
      count++;
    });
    addNotification(
      'success',
      'Marcajes de Prueba Generados',
      `Se registraron marcajes completos de prueba (entrada, almuerzo, salida) para ${count} colaboradores en la fecha ${selectedDate}.`
    );
  };

  const handleExportAttendanceCSV = () => {
    if (dayRecords.length === 0) return;
    const headers = [
      'Codigo',
      'Colaborador',
      'Cargo',
      'Horario',
      'Entrada',
      'Almuerzo_Inicio',
      'Almuerzo_Fin',
      'Salida',
      'Estado',
      'Minutos_Tardanza',
      'Tolerancia_Min',
    ];
    const rows = dayRecords.map(({ emp, record, leave }) => {
      const statusStr = leave ? `Permiso (${leave.type})` : record?.status || 'Sin Marcaje';
      return [
        emp.code,
        `"${emp.firstName} ${emp.lastName}"`,
        `"${emp.position}"`,
        `"${emp.workSchedule?.startTime || '08:00'} - ${emp.workSchedule?.endTime || '17:00'}"`,
        record?.checkInTime || '-',
        record?.lunchStartTime || '-',
        record?.lunchEndTime || '-',
        record?.checkOutTime || '-',
        statusStr,
        record?.minutesLate || 0,
        record?.toleranceApplied || attendanceConfig.toleranceMinutes || 10,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `reporte_asistencia_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner / Urgency Card */}
      <div className="p-5 rounded-[8px] bg-white dark:bg-slate-900 border border-[#E3E8E6] dark:border-slate-800 border-l-4 border-l-[#0F766E] shadow-none flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-150 hover:shadow-xs">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-teal-50 dark:bg-teal-950/60 flex items-center justify-center text-[#0F766E] shrink-0 mt-0.5">
            <Clock className="w-4 h-4 stroke-[1.75]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-semibold text-[#111827] dark:text-white">
                Control de asistencia digital & terminal kiosko tablet
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#0F766E] bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-full border border-teal-200 dark:border-teal-800">
                Tolerancia: {attendanceConfig.toleranceMinutes || 10} min
              </span>
            </div>
            <p className="text-[13px] text-[#6B7280] dark:text-slate-400 mt-0.5">
              Marcajes biométricos por PIN de 4 dígitos para colaboradores. Control automático de puntualidad, justificaciones con goce/sin goce y liquidación en boleta de pago.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={onOpenKiosk}
            className="px-3.5 py-1.5 rounded-[6px] bg-[#0F766E] hover:bg-[#115E59] text-white text-[13px] font-medium flex items-center gap-1.5 transition cursor-pointer shadow-none"
            title="Abrir terminal checador táctil para tablet con PIN"
          >
            <Tablet className="w-4 h-4 text-white" />
            <span>📱 Abrir Kiosko Tablet PIN</span>
          </button>

          <button
            type="button"
            onClick={() => setIsConfigModalOpen(true)}
            className="px-3 py-1.5 rounded-[6px] border border-[#E3E8E6] dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-[#F6F8F7] text-[#111827] dark:text-slate-200 text-[13px] font-medium transition cursor-pointer flex items-center gap-1.5 shadow-none"
          >
            <Sliders className="w-3.5 h-3.5 text-[#6B7280]" />
            <span>Horarios & Tolerancia</span>
          </button>

          <button
            type="button"
            onClick={() => setIsNewLeaveModalOpen(true)}
            className="px-3 py-1.5 rounded-[6px] border border-[#E3E8E6] dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-[#F6F8F7] text-[#111827] dark:text-slate-200 text-[13px] font-medium transition cursor-pointer flex items-center gap-1.5 shadow-none"
          >
            <PlusCircle className="w-3.5 h-3.5 text-[#0F766E]" />
            <span>Solicitar Permiso</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Bar (4 Unified Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Puntualidad Global */}
        <div className="p-5 rounded-[8px] bg-white dark:bg-slate-900 border border-[#E3E8E6] dark:border-slate-800 shadow-none transition-all duration-150 hover:shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-[#6B7280] dark:text-slate-400">
                Puntualidad global
              </span>
              <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-[#059669] flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 stroke-[1.75]" />
              </div>
            </div>
            <div className="text-[28px] font-semibold text-[#059669] [font-variant-numeric:tabular-nums] mt-1 leading-none">
              {punctualityRate}%
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-[12px] text-[#6B7280] dark:text-slate-400">
              <span>{onTimeCount} de {presentCount} colaboradores a tiempo</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Marcajes Registrados Hoy */}
        <div className="p-5 rounded-[8px] bg-white dark:bg-slate-900 border border-[#E3E8E6] dark:border-slate-800 shadow-none transition-all duration-150 hover:shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-[#6B7280] dark:text-slate-400">
                Asistencia hoy
              </span>
              <div className="w-9 h-9 rounded-full bg-teal-50 dark:bg-teal-950/60 text-[#0F766E] flex items-center justify-center">
                <Users className="w-4 h-4 stroke-[1.75]" />
              </div>
            </div>
            <div className="text-[28px] font-semibold text-[#111827] dark:text-white [font-variant-numeric:tabular-nums] mt-1 leading-none">
              {presentCount} / {totalEmployeesCount}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-[12px] text-[#6B7280] dark:text-slate-400">
              <span>Colaboradores con entrada registrada</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Tardanzas */}
        <div className="p-5 rounded-[8px] bg-white dark:bg-slate-900 border border-[#E3E8E6] dark:border-slate-800 shadow-none transition-all duration-150 hover:shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-[#6B7280] dark:text-slate-400">
                Tardanzas registradas
              </span>
              <div className="w-9 h-9 rounded-full bg-amber-50 dark:bg-amber-950/60 text-[#D97706] flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 stroke-[1.75]" />
              </div>
            </div>
            <div className="text-[28px] font-semibold text-[#D97706] [font-variant-numeric:tabular-nums] mt-1 leading-none">
              {lateCount}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-[12px] text-[#6B7280] dark:text-slate-400">
              <span>Superaron {attendanceConfig.toleranceMinutes || 10} min de tolerancia</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Permisos & Licencias */}
        <div className="p-5 rounded-[8px] bg-white dark:bg-slate-900 border border-[#E3E8E6] dark:border-slate-800 shadow-none transition-all duration-150 hover:shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-[#6B7280] dark:text-slate-400">
                Permisos & licencias
              </span>
              <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-[#64748B] flex items-center justify-center">
                <FileText className="w-4 h-4 stroke-[1.75]" />
              </div>
            </div>
            <div className="text-[28px] font-semibold text-[#111827] dark:text-white [font-variant-numeric:tabular-nums] mt-1 leading-none">
              {leaveCount}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-[12px] text-[#6B7280] dark:text-slate-400">
              <span>Incapacidades y justificaciones laborales</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-navigation Toggles */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-[#E3E8E6] dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setSubSection('attendance')}
          className={`px-3 py-1.5 rounded-[6px] text-[12px] transition cursor-pointer flex items-center gap-1.5 ${
            subSection === 'attendance'
              ? 'bg-[#0F766E] text-white font-semibold shadow-2xs'
              : 'text-[#6B7280] dark:text-slate-400 hover:bg-[#F6F8F7] dark:hover:bg-slate-800 hover:text-[#111827]'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Marcajes Diarios & Puntualidad ({dayRecords.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubSection('leaves')}
          className={`px-3 py-1.5 rounded-[6px] text-[12px] transition cursor-pointer flex items-center gap-1.5 ${
            subSection === 'leaves'
              ? 'bg-[#0F766E] text-white font-semibold shadow-2xs'
              : 'text-[#6B7280] dark:text-slate-400 hover:bg-[#F6F8F7] dark:hover:bg-slate-800 hover:text-[#111827]'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Permisos & Licencias Laborales ({leaveRequests.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubSection('schedules')}
          className={`px-3 py-1.5 rounded-[6px] text-[12px] transition cursor-pointer flex items-center gap-1.5 ${
            subSection === 'schedules'
              ? 'bg-[#0F766E] text-white font-semibold shadow-2xs'
              : 'text-[#6B7280] dark:text-slate-400 hover:bg-[#F6F8F7] dark:hover:bg-slate-800 hover:text-[#111827]'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Horarios & PINs Kiosko ({employees.length})</span>
        </button>
      </div>

      {/* SECTION 1: ATTENDANCE RECORDS TABLE */}
      {subSection === 'attendance' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-[8px] border border-[#E3E8E6] dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-none">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-[6px] border border-[#E3E8E6] dark:border-slate-700 bg-[#F6F8F7] dark:bg-slate-800 px-2.5 py-1">
                <Calendar className="w-3.5 h-3.5 text-[#0F766E]" />
                <span className="text-[11px] font-semibold text-[#6B7280]">Fecha:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent text-[12px] font-mono font-semibold text-[#111827] dark:text-white outline-none cursor-pointer"
                />
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar colaborador..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1 text-[12px] rounded-[6px] border border-[#E3E8E6] dark:border-slate-700 bg-[#F6F8F7] dark:bg-slate-800 text-[#111827] dark:text-white w-48 outline-none focus:border-[#0F766E]"
                />
              </div>

              <div className="flex items-center gap-1.5 rounded-[6px] border border-[#E3E8E6] dark:border-slate-700 bg-[#F6F8F7] dark:bg-slate-800 px-2.5 py-1">
                <Sliders className="w-3.5 h-3.5 text-[#6B7280]" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent text-[12px] font-medium text-[#111827] dark:text-white outline-none cursor-pointer"
                >
                  <option value="all">Todos los Estados</option>
                  <option value="a_tiempo">🟢 A Tiempo</option>
                  <option value="tardanza">🟡 Con Tardanza</option>
                  <option value="leave">🔵 Con Permiso</option>
                  <option value="falta">🔴 Sin Marcaje / Falta</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleSimulateDayAttendance}
                className="px-2.5 py-1.5 rounded-[6px] bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-[12px] font-medium text-[#0F766E] dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900 transition cursor-pointer flex items-center gap-1.5"
                title="Completar asistencias de la jornada laboral de hoy"
              >
                <Clock className="w-3.5 h-3.5 text-[#0F766E]" />
                <span>Autocompletar Jornada Hoy</span>
              </button>

              <button
                type="button"
                onClick={handleExportAttendanceCSV}
                className="px-2.5 py-1.5 rounded-[6px] border border-[#E3E8E6] dark:border-slate-700 bg-white dark:bg-slate-900 text-[12px] font-medium text-[#111827] dark:text-slate-200 hover:bg-[#F6F8F7] dark:hover:bg-slate-800 transition cursor-pointer flex items-center gap-1.5"
                title="Descargar reporte oficial de asistencia en CSV"
              >
                <Download className="w-3.5 h-3.5 text-[#6B7280]" />
                <span>Exportar CSV</span>
              </button>

              <button
                type="button"
                onClick={() => setIsManualMarkModalOpen(true)}
                className="px-3 py-1.5 rounded-[6px] border border-[#E3E8E6] dark:border-slate-700 text-[12px] font-medium text-[#111827] dark:text-slate-200 hover:bg-[#F6F8F7] dark:hover:bg-slate-800 transition cursor-pointer"
              >
                + Marcaje Manual Supervisor
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-slate-900 rounded-[8px] border border-[#E3E8E6] dark:border-slate-800 shadow-none overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[12px]">
                <thead className="bg-[#F6F8F7] dark:bg-slate-800/80 text-[#6B7280] uppercase text-[10px] font-semibold border-b border-[#E3E8E6] dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Colaborador / PIN Tablet</th>
                    <th className="py-2.5 px-3 text-center">Horario Programado</th>
                    <th className="py-2.5 px-3 text-center">Entrada Marcada</th>
                    <th className="py-2.5 px-3 text-center">Almuerzo</th>
                    <th className="py-2.5 px-3 text-center">Salida Marcada</th>
                    <th className="py-2.5 px-3 text-center">Estado Cumplimiento</th>
                    <th className="py-2.5 px-3 text-right">Retraso / Tolerancia</th>
                    <th className="py-2.5 px-3 text-right">Puntualidad</th>
                    <th className="py-2.5 px-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E3E8E6] dark:divide-slate-800 font-mono">
                  {filteredDayRecords.map(({ emp, record, leave }, idx) => {
                    const schedStart =
                      emp.workSchedule?.startTime || attendanceConfig.defaultStartTime || '08:00 AM';
                    const schedEnd =
                      emp.workSchedule?.endTime || attendanceConfig.defaultEndTime || '05:00 PM';
                    return (
                      <tr key={emp.id} className="hover:bg-[#F6F8F7]/60 dark:hover:bg-slate-800/50 transition">
                        <td className="py-2.5 px-3 font-sans">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-[4px] bg-teal-50 dark:bg-teal-950/60 text-[#0F766E] font-semibold text-[11px] flex items-center justify-center shrink-0 border border-teal-200 dark:border-teal-800">
                              {emp.firstName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold text-[#111827] dark:text-white leading-tight">
                                {emp.firstName} {emp.lastName}
                              </p>
                              <p className="text-[10px] text-[#6B7280] font-mono">
                                {emp.position} • PIN Kiosko: <span className="text-[#0F766E] font-semibold">✓ Confidencial</span>
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-2.5 px-3 text-center text-[#6B7280] dark:text-slate-400">
                          <span>{schedStart} - {schedEnd}</span>
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          {record?.checkInTime ? (
                            <span className="font-semibold text-[#111827] dark:text-white">
                              {record.checkInTime}
                            </span>
                          ) : leave ? (
                            <span className="text-[10px] text-[#0F766E] font-semibold uppercase">Permiso Legal</span>
                          ) : (
                            <span className="text-[10px] text-[#6B7280] italic">No ha marcado</span>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-center text-[#6B7280] dark:text-slate-400">
                          {record?.lunchStartTime ? (
                            <span>{record.lunchStartTime} - {record.lunchEndTime || 'En curso'}</span>
                          ) : (
                            <span className="text-[#6B7280]">-</span>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          {record?.checkOutTime ? (
                            <span className="font-semibold text-[#111827] dark:text-white">
                              {record.checkOutTime}
                            </span>
                          ) : (
                            <span className="text-[#6B7280]">-</span>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-center font-sans">
                          {leave ? (
                            <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              🔵 {leave.type.replace(/_/g, ' ').toUpperCase()}
                            </span>
                          ) : record?.status === 'a_tiempo' ? (
                            <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-semibold bg-teal-50 text-[#0F766E] dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                              🟢 A TIEMPO
                            </span>
                          ) : record?.status === 'tardanza' ? (
                            <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                              🟡 TARDANZA (+{record.minutesLate}m)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-semibold bg-[#F6F8F7] text-[#6B7280] dark:bg-slate-800 dark:text-slate-400">
                              ⚪ PENDIENTE
                            </span>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-right">
                          {record?.status === 'tardanza' ? (
                            <span className="text-amber-600 font-semibold">
                              +{record.minutesLate} min (Tol: {record.toleranceApplied}m)
                            </span>
                          ) : (
                            <span className="text-[#059669] font-semibold">0 min retraso</span>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-right">
                          <span className={`font-semibold ${record?.status === 'tardanza' ? 'text-amber-600' : 'text-[#059669]'}`}>
                            {record?.status === 'tardanza' ? '85%' : '100%'}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {!record?.checkInTime && (
                              <button
                                type="button"
                                onClick={() => {
                                  recordAttendanceCheck(emp.id, 'check_in', 'manual_admin', '07:55', selectedDate);
                                  addNotification('success', 'Entrada Registrada', `${emp.firstName} marcada a tiempo (07:55 AM).`);
                                }}
                                className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition cursor-pointer"
                                title="Marcar entrada puntual rápida para prueba"
                              >
                                +Entrada
                              </button>
                            )}
                            {record?.checkInTime && !record?.checkOutTime && (
                              <button
                                type="button"
                                onClick={() => {
                                  recordAttendanceCheck(emp.id, 'check_out', 'manual_admin', '17:00', selectedDate);
                                  addNotification('success', 'Salida Registrada', `${emp.firstName} marcada salida laboral (05:00 PM).`);
                                }}
                                className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition cursor-pointer"
                                title="Marcar salida de jornada rápida"
                              >
                                +Salida
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setManualEmpId(emp.id);
                                setIsManualMarkModalOpen(true);
                              }}
                              className="p-1 text-[#6B7280] hover:text-[#0F766E] rounded hover:bg-[#F6F8F7] dark:hover:bg-slate-800 transition cursor-pointer"
                              title="Ajustar o registrar marcaje detallado"
                            >
                              <Sliders className="w-3.5 h-3.5" />
                            </button>
                          </div>
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

      {/* SECTION 2: LEAVE REQUESTS */}
      {subSection === 'leaves' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[14px] font-semibold text-[#111827] dark:text-white">
              Historial de permisos, incapacidades médicas & vacaciones
            </h3>
            <button
              type="button"
              onClick={() => setIsNewLeaveModalOpen(true)}
              className="px-3.5 py-1.5 rounded-[6px] bg-[#0F766E] hover:bg-[#115E59] text-white font-medium text-[13px] flex items-center gap-1.5 cursor-pointer shadow-none"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Registrar Permiso o Incapacidad</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-[8px] border border-[#E3E8E6] dark:border-slate-800 shadow-none overflow-hidden">
            <table className="w-full text-left text-[12px] font-mono">
              <thead className="bg-[#F6F8F7] dark:bg-slate-800 text-[#6B7280] uppercase text-[10px] font-semibold border-b border-[#E3E8E6] dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3 font-sans">Colaborador</th>
                  <th className="py-2.5 px-3">Tipo de Permiso</th>
                  <th className="py-2.5 px-3">Fechas (Desde - Hasta)</th>
                  <th className="py-2.5 px-3">Motivo / Justificación</th>
                  <th className="py-2.5 px-3 text-center">Estado</th>
                  <th className="py-2.5 px-3 text-center font-sans">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3E8E6] dark:divide-slate-800">
                {leaveRequests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-[#6B7280] font-sans">
                      No hay solicitudes de permiso registradas.
                    </td>
                  </tr>
                ) : (
                  leaveRequests.map((l) => (
                    <tr key={l.id} className="hover:bg-[#F6F8F7]/60 dark:hover:bg-slate-800/50 transition">
                      <td className="py-2.5 px-3 font-sans font-semibold text-[#111827] dark:text-white">
                        {l.employeeName}
                      </td>
                      <td className="py-2.5 px-3 capitalize text-[#111827] dark:text-slate-300 font-medium">
                        {l.type.replace(/_/g, ' ')}
                      </td>
                      <td className="py-2.5 px-3 text-[#6B7280] dark:text-slate-400">
                        {l.startDate} al {l.endDate} ({l.daysCount} días)
                      </td>
                      <td className="py-2.5 px-3 max-w-xs text-[#6B7280] dark:text-slate-400 truncate">
                        {l.reason}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-[4px] text-[10px] font-semibold border ${
                            l.status === 'aprobado'
                              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200'
                              : l.status === 'rechazado'
                              ? 'bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-200'
                              : 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200'
                          }`}
                        >
                          {l.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {l.status === 'pendiente' && (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => updateLeaveRequestStatus(l.id, 'aprobado')}
                              className="px-2 py-1 rounded-[4px] bg-[#0F766E] text-white font-medium text-[10px]"
                            >
                              Aprobar
                            </button>
                            <button
                              type="button"
                              onClick={() => updateLeaveRequestStatus(l.id, 'rechazado')}
                              className="px-2 py-1 rounded-[4px] bg-rose-600 text-white font-medium text-[10px]"
                            >
                              Rechazar
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 3: WORK SCHEDULES & CONFIDENTIAL KIOSK PINS */}
      {subSection === 'schedules' && (
        <div className="space-y-4">
          <div className="p-4 rounded-[8px] bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-none">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[6px] bg-[#0F766E] text-white flex items-center justify-center font-semibold">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-[13px] font-semibold text-[#111827] dark:text-white">
                  Asignación confidencial de PINs & horarios por colaborador
                </h4>
                <p className="text-[11px] text-[#6B7280]">
                  Cada colaborador tiene un PIN único e intransferible. La tablet checadora no muestra los PINs públicamente para evitar fraudes entre compañeros.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenKiosk}
              className="px-3.5 py-1.5 rounded-[6px] bg-[#0F766E] hover:bg-[#115E59] text-white font-medium text-[12px] flex items-center gap-1.5 cursor-pointer transition whitespace-nowrap self-start sm:self-auto shadow-none"
            >
              <Tablet className="w-3.5 h-3.5" />
              <span>Abrir Tablet Kiosko</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-[8px] border border-[#E3E8E6] dark:border-slate-800 shadow-none overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[12px] font-mono">
                <thead className="bg-[#F6F8F7] dark:bg-slate-800 text-[#6B7280] uppercase text-[10px] font-semibold border-b border-[#E3E8E6] dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3 font-sans">Colaborador</th>
                    <th className="py-2.5 px-3 font-sans">Cargo / Departamento</th>
                    <th className="py-2.5 px-3 text-center">PIN Confidencial</th>
                    <th className="py-2.5 px-3">Horario Entrada / Salida</th>
                    <th className="py-2.5 px-3">Hora de Almuerzo</th>
                    <th className="py-2.5 px-3 text-center">Tolerancia</th>
                    <th className="py-2.5 px-3 text-center font-sans">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E3E8E6] dark:divide-slate-800">
                  {employees.map((emp) => {
                    const sched = emp.workSchedule;
                    const startTime = sched?.startTime || attendanceConfig.defaultStartTime || '08:00';
                    const endTime = sched?.endTime || attendanceConfig.defaultEndTime || '17:00';
                    const lunchStart = sched?.lunchStartTime || attendanceConfig.defaultLunchStart || '12:00';
                    const lunchEnd = sched?.lunchEndTime || attendanceConfig.defaultLunchEnd || '13:00';
                    const tolerance = sched?.toleranceMinutes || attendanceConfig.toleranceMinutes || 10;

                    return (
                      <tr key={emp.id} className="hover:bg-[#F6F8F7]/60 dark:hover:bg-slate-800/50 transition">
                        <td className="py-2.5 px-3 font-sans">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-[4px] bg-teal-50 dark:bg-teal-950/60 text-[#0F766E] font-semibold text-[11px] flex items-center justify-center shrink-0 border border-teal-200 dark:border-teal-800">
                              {emp.firstName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold text-[#111827] dark:text-white leading-tight">
                                {emp.firstName} {emp.lastName}
                              </p>
                              <span className="text-[10px] text-[#6B7280] font-mono">
                                {emp.code}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-2.5 px-3 font-sans text-[#111827] dark:text-slate-300">
                          <p className="font-medium">{emp.position}</p>
                          <span className="text-[10px] text-[#6B7280]">
                            {typeof emp.department === 'string'
                              ? emp.department
                              : (emp.department as any)?.name || 'General'}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] bg-[#F6F8F7] dark:bg-slate-800 text-[#111827] dark:text-slate-200 font-semibold border border-[#E3E8E6] dark:border-slate-700">
                            <Lock className="w-3 h-3 text-[#0F766E]" />
                            <span className="font-mono text-[11px] tracking-wider">
                              {revealedPins[emp.id] ? (emp.pinCode || 'Sin PIN') : '••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setRevealedPins((prev) => ({
                                  ...prev,
                                  [emp.id]: !prev[emp.id],
                                }))
                              }
                              className="ml-1 text-[#6B7280] hover:text-[#111827] dark:hover:text-slate-200 p-0.5 rounded cursor-pointer"
                              title={revealedPins[emp.id] ? 'Ocultar PIN' : 'Ver PIN Confidencial'}
                            >
                              {revealedPins[emp.id] ? (
                                <EyeOff className="w-3 h-3" />
                              ) : (
                                <Eye className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </td>

                        <td className="py-2.5 px-3 text-[#111827] dark:text-slate-300">
                          <span className="font-semibold text-[#0F766E]">{startTime}</span> a <span className="font-medium text-[#6B7280] dark:text-slate-400">{endTime}</span>
                        </td>

                        <td className="py-2.5 px-3 text-[#6B7280] dark:text-slate-400">
                          {lunchStart} - {lunchEnd}
                        </td>

                        <td className="py-2.5 px-3 text-center font-semibold text-[#059669]">
                          +{tolerance} min
                        </td>

                        <td className="py-2.5 px-3 text-center font-sans">
                          <button
                            type="button"
                            onClick={() => handleOpenEditPinSchedule(emp)}
                            className="px-2.5 py-1 rounded-[6px] bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-100 text-[#0F766E] dark:text-teal-300 font-medium text-[11px] flex items-center gap-1.5 transition cursor-pointer mx-auto border border-teal-200 dark:border-teal-800"
                          >
                            <Key className="w-3 h-3" />
                            <span>Gestionar PIN</span>
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

      {/* MODAL 0: Editar PIN Personal y Horario de Colaborador */}
      {isEditPinModalOpen && editingPinEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl p-6 sm:p-7 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-600 text-white flex items-center justify-center">
                  <Lock className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    Asignar PIN & Horario Individual
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {editingPinEmp.code} • {editingPinEmp.firstName} {editingPinEmp.lastName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditPinModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePinSchedule} className="space-y-4">
              {/* PIN Field */}
              <div className="p-3.5 rounded-2xl bg-cyan-50/70 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
                    PIN Confidencial de 4 Dígitos: *
                  </label>
                  <button
                    type="button"
                    onClick={() => setPinFormVal(generateUniquePin(employees, editingPinEmp.id))}
                    className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    Generar PIN Único
                  </button>
                </div>
                <input
                  type="text"
                  maxLength={4}
                  required
                  placeholder="Ej: 1045"
                  value={pinFormVal}
                  onChange={(e) => setPinFormVal(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-black text-lg tracking-widest text-center text-cyan-600 dark:text-cyan-400"
                />
                <p className="text-[10px] text-slate-500">
                  Este código solo lo conocerá el colaborador para marcar en la tablet checadora.
                </p>
                {pinFormVal && getDuplicatePinEmployee(pinFormVal, editingPinEmp.id) && (
                  <div className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5 pt-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      ⚠️ Este PIN ya pertenece a {getDuplicatePinEmployee(pinFormVal, editingPinEmp.id)?.firstName}. Elige uno diferente.
                    </span>
                  </div>
                )}
              </div>

              {/* Schedule Hours */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Hora de Entrada:
                  </label>
                  <input
                    type="time"
                    value={scheduleStartVal}
                    onChange={(e) => setScheduleStartVal(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 font-mono font-bold text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Hora de Salida:
                  </label>
                  <input
                    type="time"
                    value={scheduleEndVal}
                    onChange={(e) => setScheduleEndVal(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 font-mono font-bold text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Inicio Almuerzo:
                  </label>
                  <input
                    type="time"
                    value={scheduleLunchStartVal}
                    onChange={(e) => setScheduleLunchStartVal(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Fin Almuerzo:
                  </label>
                  <input
                    type="time"
                    value={scheduleLunchEndVal}
                    onChange={(e) => setScheduleLunchEndVal(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Minutos de Tolerancia para Llegada Tarde:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={scheduleToleranceVal}
                    onChange={(e) => setScheduleToleranceVal(parseInt(e.target.value) || 0)}
                    className="w-28 p-2 rounded-xl border border-slate-200 dark:border-slate-700 font-mono font-bold text-xs"
                  />
                  <span className="text-[11px] text-slate-500 font-medium">minutos</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditPinModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={Boolean(pinFormVal && getDuplicatePinEmployee(pinFormVal, editingPinEmp.id))}
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white font-bold cursor-pointer shadow-sm"
                >
                  Guardar PIN y Horario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 1: Configurar Horarios & Intervalo de Tolerancia */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl p-6 sm:p-7 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-600 text-white flex items-center justify-center">
                  <Sliders className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  Horarios Laborales & Tolerancia
                </h3>
              </div>
              <button onClick={() => setIsConfigModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-3.5">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Intervalo de Tolerancia de Entrada (Minutos): *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="60"
                    required
                    value={configTolerance}
                    onChange={(e) => setConfigTolerance(parseInt(e.target.value) || 0)}
                    className="w-32 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-mono font-bold text-base text-cyan-600 dark:text-cyan-400 bg-slate-50 dark:bg-slate-800"
                  />
                  <span className="text-xs text-slate-500 font-medium">
                    minutos permitidos después de la hora oficial sin penalización.
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Hora de Entrada:
                  </label>
                  <input
                    type="time"
                    value={configStartTime}
                    onChange={(e) => setConfigStartTime(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 font-mono font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Hora de Salida:
                  </label>
                  <input
                    type="time"
                    value={configEndTime}
                    onChange={(e) => setConfigEndTime(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 font-mono font-bold text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Inicio Almuerzo:
                  </label>
                  <input
                    type="time"
                    value={configLunchStart}
                    onChange={(e) => setConfigLunchStart(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 font-mono font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Fin Almuerzo:
                  </label>
                  <input
                    type="time"
                    value={configLunchEnd}
                    onChange={(e) => setConfigLunchEnd(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 font-mono font-bold text-xs"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsConfigModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold shadow"
                >
                  Guardar Parámetros
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Solicitar Permiso / Incapacidad */}
      {isNewLeaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl p-6 sm:p-7 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Registrar Permiso o Incapacidad ISSS
              </h3>
              <button onClick={() => setIsNewLeaveModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLeave} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Colaborador: *
                </label>
                <select
                  value={leaveEmployeeId}
                  onChange={(e) => setLeaveEmployeeId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.firstName} {e.lastName} ({e.position})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tipo de Justificación: *
                </label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value as EmployeeLeaveRequest['type'])}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
                >
                  <option value="permiso_con_goce">Permiso con Goce de Sueldo (Art. 29 C.T.)</option>
                  <option value="permiso_sin_goce">Permiso sin Goce de Sueldo</option>
                  <option value="incapacidad_isss">Incapacidad Médica ISSS</option>
                  <option value="vacacion_anual">Vacación Anual Remunerada</option>
                  <option value="duelo_calamidad">Duelo / Calamidad Doméstica</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Desde:</label>
                  <input
                    type="date"
                    required
                    value={leaveStartDate}
                    onChange={(e) => setLeaveStartDate(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Hasta:</label>
                  <input
                    type="date"
                    required
                    value={leaveEndDate}
                    onChange={(e) => setLeaveEndDate(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Motivo o Constancia:
                </label>
                <textarea
                  rows={2}
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder="Detalles del permiso o referencia médica..."
                  className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewLeaveModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold shadow"
                >
                  Aprobar Permiso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Marcaje Manual Supervisor */}
      {isManualMarkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Marcaje Manual de Asistencia
              </h3>
              <button onClick={() => setIsManualMarkModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleManualCheck} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Colaborador:
                </label>
                <select
                  value={manualEmpId}
                  onChange={(e) => setManualEmpId(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.firstName} {e.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tipo de Marcaje:
                </label>
                <select
                  value={manualType}
                  onChange={(e) => setManualType(e.target.value as any)}
                  className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
                >
                  <option value="check_in">🟢 Entrada</option>
                  <option value="lunch_start">🥪 Salida Almuerzo</option>
                  <option value="lunch_end">☕ Retorno Almuerzo</option>
                  <option value="check_out">🔴 Salida Laboral</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Hora:
                </label>
                <input
                  type="time"
                  required
                  value={manualTime}
                  onChange={(e) => setManualTime(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 font-mono font-bold"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsManualMarkModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl border text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-cyan-600 text-white text-xs font-bold shadow"
                >
                  Guardar Marcaje
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
