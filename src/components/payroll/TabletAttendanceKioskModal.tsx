import React, { useState, useEffect } from 'react';
import { useERP } from '../../context/ERPContext';
import { Employee, AttendanceRecord } from '../../types';
import {
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  X,
  Maximize2,
  Minimize2,
  Delete,
  UserCheck,
  ArrowRight,
  Coffee,
  Utensils,
  LogOut,
  LogIn,
  Building,
  Sparkles,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const TabletAttendanceKioskModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const {
    employees,
    currentCompany,
    attendanceRecords,
    recordAttendanceCheck,
    attendanceConfig,
  } = useERP();

  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [pin, setPin] = useState<string>('');
  const [matchedEmployee, setMatchedEmployee] = useState<Employee | null>(null);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'warning' | 'error';
    title: string;
    message: string;
    details?: string;
  } | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Live Clock (1 second interval)
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-reset timer when feedback is shown
  useEffect(() => {
    if (feedback) {
      setCountdown(4);
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(interval);
            resetState();
            return null;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [feedback]);

  // Audio tone feedback using Web Audio API
  const playChime = (success: boolean) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      if (success) {
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.12); // A5
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.35);
      } else {
        osc.frequency.setValueAtTime(320, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.3);
      }
    } catch (e) {
      // Audio not permitted or supported
    }
  };

  // Check pin matches employee
  useEffect(() => {
    if (pin.length >= 4) {
      const emp = employees.find(
        (e) =>
          (e.pinCode && e.pinCode === pin) ||
          e.code.replace(/\D/g, '') === pin ||
          e.dui.replace(/\D/g, '').slice(-4) === pin
      );
      if (emp) {
        setMatchedEmployee(emp);
      } else if (pin.length >= 6) {
        setFeedback({
          type: 'error',
          title: 'PIN No Reconocido',
          message: 'No existe ningún empleado registrado con este código PIN. Consulta con Recursos Humanos.',
        });
        playChime(false);
      }
    } else {
      setMatchedEmployee(null);
    }
  }, [pin, employees]);

  if (!isOpen) return null;

  const handleKeyPress = (num: string) => {
    if (feedback) return;
    if (pin.length < 8) {
      setPin((prev) => prev + num);
    }
  };

  const handleBackspace = () => {
    if (feedback) return;
    setPin((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPin('');
    setMatchedEmployee(null);
  };

  const resetState = () => {
    setPin('');
    setMatchedEmployee(null);
    setFeedback(null);
    setCountdown(null);
  };

  const handleRecord = (actionType: 'check_in' | 'lunch_start' | 'lunch_end' | 'check_out') => {
    if (!matchedEmployee) return;

    const result = recordAttendanceCheck(matchedEmployee.id, actionType, 'pin_tablet');
    playChime(result.status !== 'error');

    if (result.status === 'error') {
      setFeedback({
        type: 'error',
        title: 'Aviso de Marcaje',
        message: result.message,
      });
      return;
    }

    if (actionType === 'check_in') {
      if (result.record?.status === 'tardanza') {
        setFeedback({
          type: 'warning',
          title: `¡Entrada Registrada (Tardanza)!`,
          message: `Hola ${matchedEmployee.firstName}, tu entrada se registró con ${result.record.minutesLate} min de retraso sobre la tolerancia de ${result.record.toleranceApplied} min.`,
          details: `Hora marcada: ${result.timeStr} • Horario programado: ${result.record.scheduledStartTime}`,
        });
      } else {
        setFeedback({
          type: 'success',
          title: `¡Entrada Registrada a Tiempo!`,
          message: `¡Bienvenido(a) a ${currentCompany.tradeName || currentCompany.name}, ${matchedEmployee.firstName}! Marcaje completado con 100% de puntualidad.`,
          details: `Hora marcada: ${result.timeStr} • Tolerancia: ${result.record?.toleranceApplied || 10} min`,
        });
      }
    } else if (actionType === 'lunch_start') {
      setFeedback({
        type: 'success',
        title: `Salida a Almuerzo`,
        message: `Buen provecho, ${matchedEmployee.firstName}. Que disfrutes tu tiempo de almuerzo.`,
        details: `Hora de salida: ${result.timeStr} • Tiempo estimado: 60 minutos`,
      });
    } else if (actionType === 'lunch_end') {
      setFeedback({
        type: 'success',
        title: `Retorno de Almuerzo`,
        message: `Bienvenido(a) de nuevo a tus actividades, ${matchedEmployee.firstName}.`,
        details: `Hora de retorno: ${result.timeStr}`,
      });
    } else if (actionType === 'check_out') {
      setFeedback({
        type: 'success',
        title: `¡Salida Laboral Registrada!`,
        message: `Gracias por tu esfuerzo en esta jornada, ${matchedEmployee.firstName}. ¡Hasta mañana!`,
        details: `Hora de salida: ${result.timeStr} • Buen descanso`,
      });
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  const formattedDateStr = currentTime.toLocaleDateString('es-SV', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formattedTimeStr = currentTime.toLocaleTimeString('es-SV', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/95 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-4xl h-[94vh] max-h-[850px] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col justify-between overflow-hidden relative">
        {/* Top Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-white text-base tracking-tight">
                  {currentCompany.tradeName || currentCompany.name}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  Terminal Tablet Kiosko
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Control de Asistencia Digital & Registro de Horarios con PIN
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              title="Pantalla Completa para Tablet"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl border border-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              title="Salir del Modo Kiosko"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Cerrar Terminal</span>
            </button>
          </div>
        </div>

        {/* Center Live Display: Clock & Date */}
        <div className="px-6 py-3 text-center border-b border-slate-800/60 bg-gradient-to-b from-slate-900 to-slate-950/60">
          <div className="text-4xl sm:text-5xl lg:text-6xl font-black font-mono tracking-tight text-white drop-shadow-md">
            {formattedTimeStr}
          </div>
          <p className="text-xs sm:text-sm text-cyan-400 font-bold uppercase tracking-wider mt-1 capitalize">
            {formattedDateStr}
          </p>
        </div>

        {/* Main Body */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-10">
          {/* Left Column: Feedback Card OR Identified Employee Action Card */}
          <div className="w-full lg:w-1/2 flex flex-col justify-center">
            {feedback ? (
              <div
                className={`p-6 sm:p-8 rounded-3xl border text-center space-y-4 animate-in zoom-in-95 duration-150 ${
                  feedback.type === 'success'
                    ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                    : feedback.type === 'warning'
                    ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                    : 'bg-rose-950/40 border-rose-500/50 text-rose-200'
                }`}
              >
                <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center bg-white/10 shadow-inner">
                  {feedback.type === 'success' ? (
                    <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                  ) : feedback.type === 'warning' ? (
                    <AlertTriangle className="w-10 h-10 text-amber-400" />
                  ) : (
                    <X className="w-10 h-10 text-rose-400" />
                  )}
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-xl sm:text-2xl font-black">{feedback.title}</h3>
                  <p className="text-sm font-medium opacity-90 max-w-sm mx-auto">
                    {feedback.message}
                  </p>
                  {feedback.details && (
                    <p className="text-xs font-mono font-bold opacity-80 pt-1">
                      {feedback.details}
                    </p>
                  )}
                </div>

                {countdown !== null && (
                  <div className="pt-2">
                    <span className="text-[11px] font-bold opacity-75 block">
                      Reiniciando pantalla en {countdown}s para el siguiente colaborador...
                    </span>
                    <button
                      onClick={resetState}
                      className="mt-3 px-4 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition cursor-pointer"
                    >
                      Listo / Siguiente Marcaje Ahora
                    </button>
                  </div>
                )}
              </div>
            ) : matchedEmployee ? (
              <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-6 sm:p-7 space-y-5 shadow-xl animate-in fade-in duration-150">
                {/* Employee Info Header */}
                <div className="flex items-center gap-4 border-b border-slate-700/60 pb-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white font-black text-xl flex items-center justify-center shadow-lg">
                    {matchedEmployee.firstName.charAt(0)}
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold text-cyan-400 block uppercase tracking-wider">
                      {matchedEmployee.code} • {matchedEmployee.department}
                    </span>
                    <h3 className="text-lg font-black text-white">
                      {matchedEmployee.firstName} {matchedEmployee.lastName}
                    </h3>
                    <p className="text-xs text-slate-300 font-medium">{matchedEmployee.position}</p>
                  </div>
                </div>

                {/* Scheduled Times info */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-900/60 p-3 rounded-2xl border border-slate-700/50">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">HORARIO ENTRADA:</span>
                    <span className="font-mono font-black text-cyan-300">
                      {matchedEmployee.workSchedule?.startTime || attendanceConfig.defaultStartTime || '08:00 AM'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">TOLERANCIA PERMITIDA:</span>
                    <span className="font-mono font-black text-emerald-400">
                      {matchedEmployee.workSchedule?.toleranceMinutes || attendanceConfig.toleranceMinutes || 10} min
                    </span>
                  </div>
                </div>

                {/* 4 Action Buttons for Marcaje */}
                <div className="space-y-2.5">
                  <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
                    Selecciona tu Marcaje de Hoy:
                  </span>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      onClick={() => handleRecord('check_in')}
                      className="p-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40 cursor-pointer transition"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>MARCAR ENTRADA</span>
                    </button>

                    <button
                      onClick={() => handleRecord('check_out')}
                      className="p-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-900/40 cursor-pointer transition"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>MARCAR SALIDA</span>
                    </button>

                    <button
                      onClick={() => handleRecord('lunch_start')}
                      className="p-3 rounded-xl bg-amber-600/90 hover:bg-amber-600 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow cursor-pointer transition"
                    >
                      <Utensils className="w-3.5 h-3.5" />
                      <span>Salida a Almuerzo</span>
                    </button>

                    <button
                      onClick={() => handleRecord('lunch_end')}
                      className="p-3 rounded-xl bg-indigo-600/90 hover:bg-indigo-600 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow cursor-pointer transition"
                    >
                      <Coffee className="w-3.5 h-3.5" />
                      <span>Retorno Almuerzo</span>
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={handleClear}
                    className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                  >
                    Cancelar / No soy yo
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-3 p-6 bg-slate-800/40 rounded-3xl border border-slate-800">
                <div className="w-14 h-14 rounded-2xl bg-slate-800 text-cyan-400 mx-auto flex items-center justify-center border border-slate-700 shadow-inner">
                  <UserCheck className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Ingresa tu Código PIN</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                    Usa el teclado táctil de la derecha para digitar tu PIN personal de 4 dígitos asignado por la empresa.
                  </p>
                </div>

                {/* Helpful PIN list hint for demo convenience */}
                <div className="text-left bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800/90 text-[11px] text-slate-400 space-y-1 font-mono">
                  <span className="font-bold text-slate-300 font-sans block text-[10px] uppercase">
                    PINs rápidos de colaboradores:
                  </span>
                  <div className="flex flex-wrap gap-2 pt-0.5">
                    {employees.slice(0, 4).map((e, idx) => (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => setPin(e.pinCode || `100${idx + 1}`)}
                        className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[10px] font-bold border border-slate-700 transition cursor-pointer"
                      >
                        {e.firstName}: {e.pinCode || `100${idx + 1}`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Numeric Touch Keypad */}
          <div className="w-full lg:w-1/2 max-w-xs space-y-4">
            {/* PIN Display Field */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center flex items-center justify-center gap-3 h-14 shadow-inner">
              {pin ? (
                Array.from({ length: Math.max(pin.length, 4) }).map((_, i) => (
                  <span
                    key={i}
                    className={`w-3.5 h-3.5 rounded-full transition-all ${
                      i < pin.length
                        ? 'bg-cyan-400 scale-110 shadow-sm shadow-cyan-400'
                        : 'bg-slate-800 border border-slate-700'
                    }`}
                  />
                ))
              ) : (
                <span className="text-xs text-slate-500 font-medium">Digita tu PIN aquí</span>
              )}
            </div>

            {/* Keypad Buttons Grid 3x4 */}
            <div className="grid grid-cols-3 gap-2.5">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleKeyPress(digit)}
                  className="h-16 rounded-2xl bg-slate-800 hover:bg-slate-750 active:bg-cyan-600 active:text-white border border-slate-700/80 text-white font-mono font-bold text-2xl shadow-md transition active:scale-95 flex items-center justify-center cursor-pointer select-none"
                >
                  {digit}
                </button>
              ))}

              <button
                type="button"
                onClick={handleClear}
                className="h-16 rounded-2xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white font-bold text-xs uppercase shadow transition active:scale-95 flex items-center justify-center cursor-pointer select-none"
              >
                Borrar
              </button>

              <button
                type="button"
                onClick={() => handleKeyPress('0')}
                className="h-16 rounded-2xl bg-slate-800 hover:bg-slate-750 active:bg-cyan-600 active:text-white border border-slate-700/80 text-white font-mono font-bold text-2xl shadow-md transition active:scale-95 flex items-center justify-center cursor-pointer select-none"
              >
                0
              </button>

              <button
                type="button"
                onClick={handleBackspace}
                className="h-16 rounded-2xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white font-bold shadow transition active:scale-95 flex items-center justify-center cursor-pointer select-none"
                title="Borrar último dígito"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/60 text-center text-[11px] text-slate-500">
          <span>
            FinaPyme.SV Kiosk • Tolerancia oficial de la empresa: <strong>{attendanceConfig.toleranceMinutes || 10} minutos</strong> • Registros sincronizados en tiempo real
          </span>
        </div>
      </div>
    </div>
  );
};
