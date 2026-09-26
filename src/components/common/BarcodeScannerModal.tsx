import React, { useState, useEffect, useRef } from 'react';
import { Product } from '../../types';
import { useERP } from '../../context/ERPContext';
import { formatCurrencyUSD } from '../../utils/salvadoranTax';
import {
  ScanBarcode,
  Camera,
  X,
  CheckCircle2,
  AlertCircle,
  Volume2,
  Zap,
  Package,
  Plus,
  Search,
} from 'lucide-react';

interface BarcodeScannerModalProps {
  onClose: () => void;
  onProductScanned: (product: Product) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  onClose,
  onProductScanned,
}) => {
  const { products } = useERP();

  const [barcodeInput, setBarcodeInput] = useState('');
  const [lastScannedProduct, setLastScannedProduct] = useState<Product | null>(null);
  const [scanMessage, setScanMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>({
    text: 'Listo para recibir lectura de pistola USB / Bluetooth o teclado.',
    type: 'info',
  });
  const [useCamera, setUseCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Audio Confirmation Beep
  const playBeep = (success = true) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(success ? 1200 : 250, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + (success ? 0.12 : 0.25));

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + (success ? 0.12 : 0.25));
    } catch (e) {
      // Audio context might be restricted before user gesture
    }
  };

  // Keep input focused so physical barcode guns directly type into it
  useEffect(() => {
    if (!useCamera && inputRef.current) {
      inputRef.current.focus();
    }
  }, [useCamera]);

  const processBarcode = (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) return;

    // Search product by barcode or code (case-insensitive)
    const found = products.find(
      (p) =>
        (p.barcode && p.barcode.toLowerCase() === trimmed.toLowerCase()) ||
        p.code.toLowerCase() === trimmed.toLowerCase()
    );

    if (found) {
      playBeep(true);
      setLastScannedProduct(found);
      setScanMessage({
        text: `✓ Reconocido: [${found.code}] ${found.name}`,
        type: 'success',
      });
      onProductScanned(found);
    } else {
      playBeep(false);
      setScanMessage({
        text: `Código "${trimmed}" no encontrado en el catálogo.`,
        type: 'error',
      });
    }

    setBarcodeInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      processBarcode(barcodeInput);
    }
  };

  // Camera Handler
  useEffect(() => {
    if (!useCamera) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      return;
    }

    let intervalId: any = null;

    const startCamera = async () => {
      try {
        setCameraError(null);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }

        // Check if BarcodeDetector API is natively supported
        if ('BarcodeDetector' in window) {
          const detector = new (window as any).BarcodeDetector({
            formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'qr_code', 'upc_a', 'upc_e'],
          });

          intervalId = setInterval(async () => {
            if (videoRef.current && videoRef.current.readyState === 4) {
              try {
                const barcodes = await detector.detect(videoRef.current);
                if (barcodes.length > 0) {
                  const detectedValue = barcodes[0].rawValue;
                  processBarcode(detectedValue);
                }
              } catch (err) {}
            }
          }, 400);
        }
      } catch (err: any) {
        setCameraError('No se pudo acceder a la cámara. Verifica los permisos de tu navegador.');
      }
    };

    startCamera();

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [useCamera]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/60 border border-indigo-400/30">
              <ScanBarcode className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Escáner de Código de Barras</h3>
              <p className="text-xs text-indigo-200">
                Pistola lectora USB / Bluetooth o cámara del dispositivo
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5 text-xs">
          {/* Toggle Mode: Gun vs Camera */}
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
            <button
              type="button"
              onClick={() => setUseCamera(false)}
              className={`flex-1 py-2 rounded-lg font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                !useCamera
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>Pistola Lectora / Entrada Rápida</span>
            </button>

            <button
              type="button"
              onClick={() => setUseCamera(true)}
              className={`flex-1 py-2 rounded-lg font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                useCamera
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>Cámara del Dispositivo</span>
            </button>
          </div>

          {!useCamera ? (
            /* Barcode Gun Mode */
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border-2 border-dashed border-indigo-300 dark:border-indigo-800 text-center space-y-3">
                <ScanBarcode className="w-12 h-12 text-indigo-600 dark:text-indigo-400 mx-auto animate-pulse" />
                <div>
                  <p className="font-bold text-sm text-slate-900 dark:text-white">
                    Apunta la pistola al código de barras
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    El escáner enviará el código automáticamente y emitirá un pitido de confirmación.
                  </p>
                </div>

                <div className="flex items-center gap-2 max-w-sm mx-auto">
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Escanea o escribe código (ej: 7411001001234)..."
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full p-2.5 rounded-xl border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold text-center text-sm shadow-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => processBarcode(barcodeInput)}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer"
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Camera Mode */
            <div className="space-y-3">
              <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center border border-slate-700">
                <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                {/* Visual scan line animation */}
                <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-0.5 bg-rose-500 shadow-[0_0_8px_#f43f5e] animate-bounce" />
                <div className="absolute bottom-2 inset-x-0 text-center bg-black/60 py-1 text-[11px] text-white">
                  Centra el código de barras en el visor
                </div>
              </div>

              {cameraError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{cameraError}</span>
                </div>
              )}
            </div>
          )}

          {/* Feedback Banner */}
          {scanMessage && (
            <div
              className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs transition ${
                scanMessage.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                  : scanMessage.type === 'error'
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {scanMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
              {scanMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
              {scanMessage.type === 'info' && <Volume2 className="w-4 h-4 text-indigo-600 shrink-0" />}
              <span className="font-semibold">{scanMessage.text}</span>
            </div>
          )}

          {/* Last Scanned Product Details Card */}
          {lastScannedProduct && (
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">
                    {lastScannedProduct.name}
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Código: {lastScannedProduct.code} | Barras: {lastScannedProduct.barcode || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-base font-black text-slate-900 dark:text-white font-mono block">
                  {formatCurrencyUSD(lastScannedProduct.salePrice)}
                </span>
                <span className="text-[10px] text-emerald-600 font-bold">
                  Stock: {lastScannedProduct.stock} {lastScannedProduct.unit}
                </span>
              </div>
            </div>
          )}

          {/* Quick Barcode Testing Hints */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1 text-[11px] text-slate-500">
            <span className="font-bold text-slate-700 dark:text-slate-300 block">
              Códigos de Prueba Disponibles:
            </span>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {products
                .filter((p) => p.barcode)
                .slice(0, 4)
                .map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => processBarcode(p.barcode!)}
                    className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-mono text-[10px] hover:bg-indigo-100 dark:hover:bg-indigo-900/60 cursor-pointer"
                  >
                    {p.name.substring(0, 18)}... [{p.barcode}]
                  </button>
                ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs cursor-pointer"
          >
            Listo / Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
