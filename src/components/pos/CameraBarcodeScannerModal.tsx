import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, CameraOff, X, Zap, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

interface CameraBarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (decodedText: string) => void;
  title?: string;
  description?: string;
  continuous?: boolean; // if true, stays open after each scan (e.g. for rapid supermarket POS scanning)
}

export const CameraBarcodeScannerModal: React.FC<CameraBarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
  title = 'Escanear Código de Barras con Cámara',
  description = 'Apunte la cámara trasera de su teléfono o tableta hacia el código de barras del producto.',
  continuous = false,
}) => {
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isStarting, setIsStarting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [scanCount, setScanCount] = useState(0);
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const containerId = 'pos-camera-barcode-reader';
  const lastScannedRef = useRef<string | null>(null);
  const lastScanTimeRef = useRef<number>(0);

  // Beep synthesizer on successful barcode detect
  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1760, ctx.currentTime); // A6 crisp supermarket beep
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {
      // Audio autoplay policy fallback
    }
  };

  // Vibration feedback for mobile phones
  const triggerVibrate = () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(80);
      } catch {
        // ignore
      }
    }
  };

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setLastScannedCode(null);
      setErrorMessage(null);
      return;
    }

    let mounted = true;

    const initScanner = async () => {
      setIsStarting(true);
      setErrorMessage(null);

      try {
        // Enumerate video devices
        const devices = await Html5Qrcode.getCameras();
        if (!mounted) return;

        if (!devices || devices.length === 0) {
          setErrorMessage('No se encontró ninguna cámara conectada en este dispositivo.');
          setIsStarting(false);
          return;
        }

        setCameras(devices);

        // Prefer back/rear camera ("environment")
        const backCamera = devices.find(
          (d) =>
            d.label.toLowerCase().includes('back') ||
            d.label.toLowerCase().includes('trasera') ||
            d.label.toLowerCase().includes('posterior') ||
            d.label.toLowerCase().includes('environment')
        );
        const defaultCamId = backCamera ? backCamera.id : devices[devices.length - 1].id;
        setSelectedCameraId(defaultCamId);

        await startScanningWithCamera(defaultCamId);
      } catch (err: unknown) {
        if (!mounted) return;
        console.error('Error starting camera barcode scanner:', err);
        const errorMsg = err instanceof Error ? err.message : String(err);
        if (errorMsg.includes('NotAllowedError') || errorMsg.includes('Permission')) {
          setErrorMessage('Permiso de cámara denegado. Por favor permita el acceso a la cámara en el navegador.');
        } else {
          setErrorMessage(`Error al activar la cámara: ${errorMsg}`);
        }
        setIsStarting(false);
      }
    };

    // Small delay to ensure modal DOM container is mounted
    const timer = setTimeout(initScanner, 150);

    return () => {
      mounted = false;
      clearTimeout(timer);
      stopCamera();
    };
  }, [isOpen]);

  const startScanningWithCamera = async (cameraId: string) => {
    try {
      if (html5QrCodeRef.current) {
        await stopCamera();
      }

      const qrCode = new Html5Qrcode(containerId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.ITF,
          Html5QrcodeSupportedFormats.QR_CODE,
        ],
        verbose: false,
      });

      html5QrCodeRef.current = qrCode;

      const config = {
        fps: 15,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          // Optimized rectangular bounding box for 1D barcodes (EAN-13, UPC)
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const width = Math.floor(minEdge * 0.85);
          const height = Math.floor(width * 0.55);
          return { width, height };
        },
        aspectRatio: 1.333333,
      };

      await qrCode.start(
        cameraId,
        config,
        (decodedText) => {
          const now = Date.now();
          // Debounce same barcode within 1.8 seconds to avoid double-charging
          if (lastScannedRef.current === decodedText && now - lastScanTimeRef.current < 1800) {
            return;
          }

          lastScannedRef.current = decodedText;
          lastScanTimeRef.current = now;
          setLastScannedCode(decodedText);
          setScanCount((prev) => prev + 1);

          playBeep();
          triggerVibrate();

          onScan(decodedText);

          if (!continuous) {
            // Single-scan mode: close automatically
            setTimeout(() => {
              onClose();
            }, 600);
          }
        },
        () => {
          // Frame error (no barcode in frame) - ignore to keep scanning smoothly
        }
      );

      setIsScanning(true);
      setIsStarting(false);

      // Check if torch/flashlight is supported
      try {
        const capabilities = qrCode.getRunningTrackCapabilities();
        if (capabilities && 'torch' in capabilities) {
          setHasTorch(true);
        }
      } catch {
        setHasTorch(false);
      }
    } catch (err) {
      console.error('Failed to start scanner with camera ID:', err);
      setIsScanning(false);
      setIsStarting(false);
      setErrorMessage('No se pudo iniciar el escaneo de video en este lente.');
    }
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      }
      html5QrCodeRef.current = null;
    }
    setIsScanning(false);
    setIsStarting(false);
  };

  const handleSwitchCamera = async (newCamId: string) => {
    setSelectedCameraId(newCamId);
    await startScanningWithCamera(newCamId);
  };

  const toggleTorch = async () => {
    if (!html5QrCodeRef.current || !hasTorch) return;
    try {
      const nextState = !torchOn;
      await html5QrCodeRef.current.applyVideoConstraints({
        advanced: [{ torch: nextState } as unknown as MediaTrackConstraintSet],
      });
      setTorchOn(nextState);
    } catch (err) {
      console.warn('Torch toggle failed:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md rounded-3xl border border-indigo-500/40 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[95vh] text-white">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                <span>{title}</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  MVP Teléfono / Tablet
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 line-clamp-1">{description}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Cerrar escáner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder / Video Container */}
        <div className="relative bg-black flex-1 min-h-[290px] sm:min-h-[340px] flex items-center justify-center overflow-hidden">
          {/* HTML5 QR Container */}
          <div id={containerId} className="w-full h-full object-cover" />

          {/* Animated Laser Viewfinder Overlay */}
          {isScanning && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {/* Target Focus Box */}
              <div className="w-[82%] max-w-[310px] h-[160px] border-2 border-emerald-400 rounded-2xl relative shadow-[0_0_20px_rgba(52,211,153,0.3)] bg-emerald-400/5">
                {/* Corner Accents */}
                <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />

                {/* Animated scanning red line */}
                <div className="absolute inset-x-2 h-[2px] bg-red-500 shadow-[0_0_12px_#ef4444] animate-pulse top-1/2 -translate-y-1/2" />

                <div className="absolute -bottom-7 inset-x-0 text-center">
                  <span className="text-[11px] font-bold tracking-wide uppercase px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-sm text-emerald-300 border border-emerald-500/40">
                    Alinee el código de barras aquí
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {isStarting && (
            <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center space-y-3">
              <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-bold text-slate-200">Activando cámara del dispositivo...</p>
              <p className="text-[11px] text-slate-400 max-w-xs">
                Si el navegador solicita permisos, por favor seleccione <strong>&quot;Permitir&quot;</strong>.
              </p>
            </div>
          )}

          {/* Error View */}
          {errorMessage && (
            <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-950/80 border border-rose-800 text-rose-400 flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-rose-300">{errorMessage}</p>
              <button
                type="button"
                onClick={() => {
                  if (selectedCameraId) {
                    startScanningWithCamera(selectedCameraId);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reintentar conexión</span>
              </button>
            </div>
          )}
        </div>

        {/* Controls Bar (Camera Selector, Torch, Status) */}
        <div className="p-3.5 bg-slate-900 border-t border-slate-800 space-y-2.5">
          {/* Last scan banner feedback */}
          {lastScannedCode && (
            <div className="p-2 rounded-xl bg-emerald-950/70 border border-emerald-600/60 text-emerald-300 flex items-center justify-between text-xs animate-fadeIn">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <span className="font-bold">¡Código Leído!:</span>{' '}
                  <span className="font-mono font-black text-white">{lastScannedCode}</span>
                </div>
              </div>
              {continuous && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-800 text-emerald-100">
                  #{scanCount}
                </span>
              )}
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            {/* Camera switch dropdown if multiple cameras exist */}
            {cameras.length > 1 ? (
              <div className="flex-1">
                <select
                  value={selectedCameraId}
                  onChange={(e) => handleSwitchCamera(e.target.value)}
                  className="w-full text-[11px] font-bold px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  {cameras.map((cam) => (
                    <option key={cam.id} value={cam.id}>
                      📷 {cam.label || `Lente ${cam.id.slice(0, 5)}`}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Lector activo en alta definición (15 FPS)</span>
              </div>
            )}

            {/* Torch toggle if hardware supports */}
            {hasTorch && (
              <button
                type="button"
                onClick={toggleTorch}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  torchOn
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/30'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                }`}
                title="Encender o apagar luz flash"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{torchOn ? 'Luz ON' : 'Flash'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition cursor-pointer"
            >
              {continuous ? 'Terminar' : 'Cerrar'}
            </button>
          </div>

          <div className="text-center pt-1 border-t border-slate-800/60">
            <p className="text-[10px] text-slate-500">
              Compatible con EAN-13 (El Salvador), UPC-A, Code-128, Code-39 y QR desde cualquier móvil o cámara web.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
