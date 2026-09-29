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

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-4 sm:p-6 rounded-3xl bg-gradient-to-r from-cyan-900 via-indigo-950 to-slate-900 text-white shadow-lg relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-800/60 border border-cyan-600/40 text-cyan-200 text-xs font-bold mb-2.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Control de Asistencia Digital & Horarios • FinaPyme.SV</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>Registro de Asistencia, Kiosko Tablet & Puntualidad</span>
            </h2>
            <p className="text-cyan-200/90 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Registra entradas y salidas con PIN en terminal tablet. Configura la tolerancia (ej: {attendanceConfig.toleranceMinutes || 10} min), gestiona permisos médicos y revisa el impacto en la boleta de pago.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onOpenKiosk}
              className="px-4 py-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 cursor-pointer transition"
            >
              <Tablet className="w-4 h-4" />
              <span>📱 Abrir Kiosko Tablet PIN</span>
            </button>

            <button
              onClick={() => setIsConfigModalOpen(true)}
              className="px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition"
            >
              <Sliders className="w-4 h-4 text-cyan-300" />
              <span>Horarios & Tolerancia</span>
            </button>

            <button
              onClick={() => setIsNewLeaveModalOpen(true)}
              className="px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition"
            >
              <PlusCircle className="w-4 h-4 text-emerald-300" />
              <span>Solicitar Permiso</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Puntualidad Global
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <h4 className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
            {punctualityRate}%
          </h4>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            {onTimeCount} de {presentCount} a tiempo
          </span>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Marcajes de Hoy
            </span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <h4 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">
            {presentCount} / {totalEmployeesCount}
          </h4>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            Colaboradores registrados
          </span>
        </div>

        <div className="p-4 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
              Tardanzas Registradas
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <h4 className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 font-mono">
            {lateCount}
          </h4>
          <span className="text-[10px] text-amber-600 mt-0.5 block">
            Superaron {attendanceConfig.toleranceMinutes || 10} min tolerancia
          </span>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Permisos & Incapacidades
            </span>
            <CheckCircle2 className="w-4 h-4 text-cyan-500" />
          </div>
          <h4 className="text-xl sm:text-2xl font-black text-cyan-600 dark:text-cyan-400 mt-1 font-mono">
            {leaveCount}
          </h4>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            Justificados legalmente
          </span>
        </div>
      </div>

      {/* Sub-navigation Toggles */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setSubSection('attendance')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
            subSection === 'attendance'
              ? 'bg-cyan-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Marcajes Diarios & Puntualidad ({dayRecords.length})</span>
        </button>

        <button
          onClick={() => setSubSection('leaves')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
            subSection === 'leaves'
              ? 'bg-cyan-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Permisos & Licencias Laborales ({leaveRequests.length})</span>
        </button>
      </div>

      {/* SECTION 1: ATTENDANCE RECORDS TABLE */}
      {subSection === 'attendance' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-cyan-600" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Fecha:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar colaborador..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 w-48"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold bg-slate-50 dark:bg-slate-800"
              >
                <option value="all">Todos los Estados</option>
                <option value="a_tiempo">🟢 A Tiempo</option>
                <option value="tardanza">🟡 Con Tardanza</option>
                <option value="leave">🔵 Con Permiso</option>
                <option value="falta">🔴 Sin Marcaje / Falta</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsManualMarkModalOpen(true)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                + Marcaje Manual Supervisor
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3 font-sans">Colaborador / PIN Tablet</th>
                    <th className="p-3 text-center">Horario Programado</th>
                    <th className="p-3 text-center">Entrada Marcada</th>
                    <th className="p-3 text-center">Almuerzo</th>
                    <th className="p-3 text-center">Salida Marcada</th>
                    <th className="p-3 text-center">Estado Cumplimiento</th>
                    <th className="p-3 text-right">Retraso / Tolerancia</th>
                    <th className="p-3 text-right font-sans">Puntualidad</th>
                    <th className="p-3 text-center font-sans">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredDayRecords.map(({ emp, record, leave }, idx) => {
                    const schedStart =
                      emp.workSchedule?.startTime || attendanceConfig.defaultStartTime || '08:00 AM';
                    const schedEnd =
                      emp.workSchedule?.endTime || attendanceConfig.defaultEndTime || '05:00 PM';
                    const pinDisplay = emp.pinCode || `100${idx + 1}`;

                    return (
                      <tr key={emp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                        <td className="p-3 font-sans">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-cyan-600/10 text-cyan-700 dark:text-cyan-300 font-black text-xs flex items-center justify-center shrink-0">
                              {emp.firstName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">
                                {emp.firstName} {emp.lastName}
                              </p>
                              <p className="text-[10px] text-slate-400 font-mono">
                                {emp.position} • PIN Tablet: <strong className="text-cyan-600">{pinDisplay}</strong>
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="p-3 text-center text-slate-600 dark:text-slate-400">
                          <span>{schedStart} - {schedEnd}</span>
                        </td>

                        <td className="p-3 text-center">
                          {record?.checkInTime ? (
                            <span className="font-bold text-slate-900 dark:text-white">
                              {record.checkInTime}
                            </span>
                          ) : leave ? (
                            <span className="text-[10px] text-cyan-600 font-bold uppercase">Permiso Legal</span>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">No ha marcado</span>
                          )}
                        </td>

                        <td className="p-3 text-center text-slate-600 dark:text-slate-400">
                          {record?.lunchStartTime ? (
                            <span>{record.lunchStartTime} - {record.lunchEndTime || 'En curso'}</span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        <td className="p-3 text-center">
                          {record?.checkOutTime ? (
                            <span className="font-bold text-slate-900 dark:text-white">
                              {record.checkOutTime}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        <td className="p-3 text-center">
                          {leave ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 border border-cyan-300">
                              🔵 {leave.type.replace(/_/g, ' ').toUpperCase()}
                            </span>
                          ) : record?.status === 'a_tiempo' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
                              🟢 A TIEMPO
                            </span>
                          ) : record?.status === 'tardanza' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300">
                              🟡 TARDANZA (+{record.minutesLate}m)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                              ⚪ PENDIENTE
                            </span>
                          )}
                        </td>

                        <td className="p-3 text-right">
                          {record?.status === 'tardanza' ? (
                            <span className="text-amber-600 font-bold">
                              +{record.minutesLate} min (Tol: {record.toleranceApplied}m)
                            </span>
                          ) : (
                            <span className="text-emerald-600 font-bold">0 min retraso</span>
                          )}
                        </td>

                        <td className="p-3 text-right">
                          <span className={`font-bold ${record?.status === 'tardanza' ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {record?.status === 'tardanza' ? '85%' : '100%'}
                          </span>
                        </td>

                        <td className="p-3 text-center">
                          <button
                            onClick={() => {
                              setManualEmpId(emp.id);
                              setIsManualMarkModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-cyan-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                            title="Ajustar o registrar marcaje"
                          >
                            <Sliders className="w-3.5 h-3.5" />
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

      {/* SECTION 2: LEAVE REQUESTS */}
      {subSection === 'leaves' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Historial de Permisos, Incapacidades Médicas & Vacaciones
            </h3>
            <button
              onClick={() => setIsNewLeaveModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Registrar Permiso o Incapacidad</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3 font-sans">Colaborador</th>
                  <th className="p-3">Tipo de Permiso</th>
                  <th className="p-3">Fechas (Desde - Hasta)</th>
                  <th className="p-3">Motivo / Justificación</th>
                  <th className="p-3 text-center">Estado</th>
                  <th className="p-3 text-center font-sans">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {leaveRequests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 font-sans">
                      No hay solicitudes de permiso registradas.
                    </td>
                  </tr>
                ) : (
                  leaveRequests.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-3 font-sans font-bold text-slate-900 dark:text-white">
                        {l.employeeName}
                      </td>
                      <td className="p-3 capitalize text-slate-700 dark:text-slate-300 font-semibold">
                        {l.type.replace(/_/g, ' ')}
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">
                        {l.startDate} al {l.endDate} ({l.daysCount} días)
                      </td>
                      <td className="p-3 max-w-xs text-slate-600 dark:text-slate-400 truncate">
                        {l.reason}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            l.status === 'aprobado'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : l.status === 'rechazado'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {l.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {l.status === 'pendiente' && (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => updateLeaveRequestStatus(l.id, 'aprobado')}
                              className="px-2 py-1 rounded bg-emerald-600 text-white font-bold text-[10px]"
                            >
                              Aprobar
                            </button>
                            <button
                              onClick={() => updateLeaveRequestStatus(l.id, 'rechazado')}
                              className="px-2 py-1 rounded bg-rose-600 text-white font-bold text-[10px]"
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
