import React, { useState, useEffect, useCallback } from 'react';
import { useERP } from '../../context/ERPContext';
import { Employee } from '../../types';
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
  Utensils,
  Coffee,
  LogOut,
  LogIn,
  Building,
  Sparkles,
  Lock,
  ArrowRight,
  RotateCcw,
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
  const [pinError, setPinError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
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
  const playChime = useCallback((success: boolean) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      if (success) {
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.12); // A5
        gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.35);
      } else {
        osc.frequency.setValueAtTime(320, audioCtx.currentTime); // Low E
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.3);
      }
    } catch (e) {
      // Audio not permitted or supported in some iframe contexts
    }
  }, []);

  const resetState = useCallback(() => {
    setPin('');
    setMatchedEmployee(null);
    setPinError(null);
    setIsShaking(false);
    setFeedback(null);
    setCountdown(null);
  }, []);

  // Check pin matches employee when it reaches 4 digits
  const checkPinCode = useCallback((inputPin: string) => {
    if (inputPin.length < 4) {
      setMatchedEmployee(null);
      setPinError(null);
      return;
    }

    const trimmed = inputPin.trim();
    // Match against active employees with exact PIN or Employee numeric ID/code
    const emp = employees.find(
      (e) =>
        e.isActive !== false &&
        ((e.pinCode && String(e.pinCode).trim() === trimmed) ||
          (e.code && e.code.replace(/\D/g, '') === trimmed) ||
          (e.dui && e.dui.replace(/\D/g, '').slice(-4) === trimmed))
    );

    if (emp) {
      setMatchedEmployee(emp);
      setPinError(null);
      playChime(true);
    } else {
      setMatchedEmployee(null);
      setPinError(`El PIN "${trimmed}" no está asignado a ningún colaborador activo. Verifica con Recursos Humanos.`);
      setIsShaking(true);
      playChime(false);
      setTimeout(() => {
        setIsShaking(false);
      }, 800);
      setTimeout(() => {
        setPin('');
        setPinError(null);
      }, 4000);
    }
  }, [employees, playChime]);

  const handleKeyPress = (num: string) => {
    if (feedback || matchedEmployee) return;
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      if (nextPin.length === 4) {
        checkPinCode(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    if (feedback || matchedEmployee) return;
    setPin((prev) => prev.slice(0, -1));
    setPinError(null);
  };

  const handleClear = () => {
    setPin('');
    setMatchedEmployee(null);
    setPinError(null);
  };

  // Keyboard navigation support for physical keyboards / tablet attachments
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        if (matchedEmployee) {
          resetState();
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, matchedEmployee, pin, feedback, onClose, resetState]);

  if (!isOpen) return null;

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
          message: `¡Bienvenido(a) a ${currentCompany.tradeName || currentCompany.name}, ${matchedEmployee.firstName}! Marcaje completado puntualmente.`,
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
        message: `Gracias por tu esfuerzo en esta jornada, ${matchedEmployee.firstName}. ¡Hasta pronto!`,
        details: `Hora de salida: ${result.timeStr} • Jornada finalizada`,
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
        setIsFullscreen(false);
      }
    }
  };

  const formattedTimeStr = currentTime.toLocaleTimeString('es-SV', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const formattedDateStr = currentTime.toLocaleDateString('es-SV', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/95 backdrop-blur-md animate-fade-in select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-[8px] w-full max-w-4xl max-h-[96vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Top Header / Kiosk Navigation */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[6px] bg-[#0F766E] flex items-center justify-center text-white shadow-xs">
              <Clock className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[15px] font-semibold text-white tracking-tight">
                  Terminal de Asistencia Kiosko Tablet
                </h2>
                <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-semibold bg-teal-950 text-teal-300 border border-teal-800/80">
                  {currentCompany.tradeName || currentCompany.name}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Marcaje biométrico digital por PIN de 4 dígitos • Tolerancia: {attendanceConfig.toleranceMinutes || 10} min
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2 rounded-[6px] border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              title="Pantalla Completa para Tablet"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-[6px] border border-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 text-[12px] font-medium transition flex items-center gap-1.5 cursor-pointer"
              title="Salir del Modo Kiosko"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Cerrar Kiosko</span>
            </button>
          </div>
        </div>

        {/* Center Live Clock & Date */}
        <div className="px-6 py-4 text-center border-b border-slate-800/60 bg-slate-900/90">
          <div className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white drop-shadow-sm [font-variant-numeric:tabular-nums]">
            {formattedTimeStr}
          </div>
          <p className="text-[12px] text-teal-400 font-medium uppercase tracking-wider mt-0.5 capitalize">
            {formattedDateStr}
          </p>
        </div>

        {/* Main Body */}
        <div className="flex-1 p-5 sm:p-8 overflow-y-auto flex flex-col items-center justify-center">
          {/* STATE 1: FEEDBACK POPUP / CELEBRATION */}
          {feedback ? (
            <div
              className={`w-full max-w-lg p-8 rounded-3xl border text-center space-y-5 animate-in zoom-in-95 duration-150 ${
                feedback.type === 'success'
                  ? 'bg-emerald-950/50 border-emerald-500/60 text-emerald-200'
                  : feedback.type === 'warning'
                  ? 'bg-amber-950/50 border-amber-500/60 text-amber-200'
                  : 'bg-rose-950/50 border-rose-500/60 text-rose-200'
              }`}
            >
              <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center bg-white/10 shadow-inner">
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 animate-bounce" />
                ) : feedback.type === 'warning' ? (
                  <AlertTriangle className="w-12 h-12 text-amber-400" />
                ) : (
                  <X className="w-12 h-12 text-rose-400" />
                )}
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl sm:text-3xl font-black text-white">{feedback.title}</h3>
                <p className="text-sm sm:text-base font-medium opacity-90 max-w-md mx-auto leading-relaxed">
                  {feedback.message}
                </p>
                {feedback.details && (
                  <p className="text-xs font-mono font-bold opacity-80 pt-2 border-t border-white/10 max-w-xs mx-auto">
                    {feedback.details}
                  </p>
                )}
              </div>

              {countdown !== null && (
                <div className="pt-2">
                  <span className="text-xs font-bold opacity-75 block mb-3">
                    Reiniciando terminal en <strong className="text-white font-mono text-sm">{countdown}s</strong> para el siguiente colaborador...
                  </span>
                  <button
                    onClick={resetState}
                    className="px-5 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition cursor-pointer flex items-center gap-2 mx-auto active:scale-95"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Siguiente Marcaje Ahora</span>
                  </button>
                </div>
              )}
            </div>
          ) : matchedEmployee ? (
            /* STATE 2: EMPLOYEE IDENTIFIED - PUNCH ACTION BUTTONS */
            <div className="w-full max-w-xl bg-slate-800/95 border border-slate-700/80 rounded-[8px] p-6 space-y-5 shadow-2xl animate-in fade-in duration-150">
              {/* Employee Banner */}
              <div className="flex items-center gap-4 border-b border-slate-700/80 pb-4">
                <div className="w-14 h-14 rounded-[6px] bg-[#0F766E] text-white font-semibold text-xl flex items-center justify-center shadow-xs">
                  {matchedEmployee.firstName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-[4px] bg-teal-950 text-teal-300 border border-teal-800">
                      {matchedEmployee.code}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium truncate">
                      {typeof matchedEmployee.department === 'string'
                        ? matchedEmployee.department
                        : (matchedEmployee.department as any)?.name || 'General'}
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-white truncate">
                    ¡Hola, {matchedEmployee.firstName} {matchedEmployee.lastName}!
                  </h3>
                  <p className="text-[12px] text-slate-300">{matchedEmployee.position}</p>
                </div>
              </div>

              {/* Schedule Info */}
              <div className="grid grid-cols-2 gap-3 text-[12px] bg-slate-900/90 p-3 rounded-[6px] border border-slate-700/60">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium uppercase">Hora Entrada Oficial:</span>
                  <span className="font-mono font-semibold text-teal-300">
                    {matchedEmployee.workSchedule?.startTime || attendanceConfig.defaultStartTime || '08:00 AM'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium uppercase">Tolerancia Permitida:</span>
                  <span className="font-mono font-semibold text-emerald-400">
                    {matchedEmployee.workSchedule?.toleranceMinutes || attendanceConfig.toleranceMinutes || 10} minutos
                  </span>
                </div>
              </div>

              {/* 4 Touch Action Buttons */}
              <div className="space-y-2.5">
                <span className="text-[12px] font-medium text-slate-300 block">
                  Selecciona la acción a registrar en tu marcaje:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleRecord('check_in')}
                    className="p-3.5 rounded-[6px] bg-[#059669] hover:bg-[#047857] active:scale-98 text-white font-semibold text-[13px] flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>MARCAR ENTRADA</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRecord('check_out')}
                    className="p-3.5 rounded-[6px] bg-rose-600 hover:bg-rose-700 active:scale-98 text-white font-semibold text-[13px] flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>MARCAR SALIDA</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRecord('lunch_start')}
                    className="p-3 rounded-[6px] bg-amber-600 hover:bg-amber-700 active:scale-98 text-white font-medium text-[12px] flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
                  >
                    <Utensils className="w-3.5 h-3.5" />
                    <span>Salida a Almuerzo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRecord('lunch_end')}
                    className="p-3 rounded-[6px] bg-teal-700 hover:bg-teal-800 active:scale-98 text-white font-medium text-[12px] flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
                  >
                    <Coffee className="w-3.5 h-3.5" />
                    <span>Retorno de Almuerzo</span>
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-700/60 text-[11px]">
                <button
                  type="button"
                  onClick={resetState}
                  className="text-slate-400 hover:text-white underline cursor-pointer"
                >
                  ← No soy yo / Cancelar
                </button>
                <span className="text-slate-400 font-mono">
                  Confirmación táctil de alta seguridad
                </span>
              </div>
            </div>
          ) : (
            /* STATE 3: CLEAN SECURE NUMERIC KEYPAD (NO PINS DISPLAYED TO PREVENT FRAUD) */
            <div className="w-full max-w-sm flex flex-col items-center space-y-4 animate-in fade-in">
              <div className="text-center space-y-1">
                <div className="w-10 h-10 rounded-[6px] bg-slate-800 text-teal-400 mx-auto flex items-center justify-center border border-slate-700 shadow-inner">
                  <Lock className="w-5 h-5 stroke-[1.75]" />
                </div>
                <h3 className="text-[16px] font-semibold text-white">Ingresa tu PIN Confidencial</h3>
                <p className="text-[12px] text-slate-400 max-w-xs">
                  Digita tus 4 dígitos asignados en el teclado numérico para registrar tu asistencia.
                </p>
              </div>

              {/* PIN Indicator Dots */}
              <div
                className={`bg-slate-950 p-3 rounded-[6px] border text-center flex items-center justify-center gap-4 h-14 w-full shadow-inner transition-all ${
                  isShaking
                    ? 'border-rose-500 bg-rose-950/30 animate-pulse'
                    : 'border-slate-800'
                }`}
              >
                {Array.from({ length: 4 }).map((_, i) => (
                  <span
                    key={i}
                    className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${
                      i < pin.length
                        ? 'bg-teal-400 scale-125 shadow-xs shadow-teal-400/50'
                        : 'bg-slate-800 border border-slate-700'
                    }`}
                  />
                ))}
              </div>

              {/* Error message under PIN */}
              {pinError && (
                <div className="p-2.5 rounded-[6px] bg-rose-950/60 border border-rose-800 text-rose-300 text-[11px] font-medium flex items-center gap-2 animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{pinError}</span>
                </div>
              )}

              {/* Numeric Touch Keypad Grid 3x4 */}
              <div className="grid grid-cols-3 gap-2.5 w-full">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handleKeyPress(digit)}
                    className="h-14 rounded-[6px] bg-slate-800 hover:bg-slate-750 active:bg-[#0F766E] active:text-white border border-slate-700/80 text-white font-mono font-semibold text-xl shadow-xs transition active:scale-95 flex items-center justify-center cursor-pointer select-none"
                  >
                    {digit}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={handleClear}
                  className="h-14 rounded-[6px] bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white font-medium text-[11px] uppercase shadow-xs transition active:scale-95 flex items-center justify-center cursor-pointer select-none"
                >
                  Borrar
                </button>

                <button
                  type="button"
                  onClick={() => handleKeyPress('0')}
                  className="h-14 rounded-[6px] bg-slate-800 hover:bg-slate-750 active:bg-[#0F766E] active:text-white border border-slate-700/80 text-white font-mono font-semibold text-xl shadow-xs transition active:scale-95 flex items-center justify-center cursor-pointer select-none"
                >
                  0
                </button>

                <button
                  type="button"
                  onClick={handleBackspace}
                  className="h-14 rounded-[6px] bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white font-medium shadow-xs transition active:scale-95 flex items-center justify-center cursor-pointer select-none"
                  title="Borrar último dígito"
                >
                  <Delete className="w-5 h-5" />
                </button>
              </div>

              {/* Security Guarantee Note */}
              <p className="text-[11px] text-slate-500 text-center flex items-center gap-1.5 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Marcaje seguro: cada colaborador debe digitar su propio PIN confidencial.</span>
              </p>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/70 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
          <span>
            Tolerancia oficial de entrada: <strong className="text-white font-mono">{attendanceConfig.toleranceMinutes || 10} minutos</strong>
          </span>
          <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Kiosko Conectado a la Nube (Sincronización en Tiempo Real)
          </span>
        </div>
      </div>
    </div>
  );
};
