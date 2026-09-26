import React, { useState } from 'react';
import { X, TrendingUp, Calculator, LineChart, Sparkles, CheckCircle2, HelpCircle } from 'lucide-react';
import { EL_SALVADOR_SEASONAL_FACTORS } from '../../utils/econometricForecasting';

interface ForecastingMethodologyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ForecastingMethodologyModal: React.FC<ForecastingMethodologyModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'ols' | 'seasonal' | 'logarithmic'>('seasonal');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Metodología de Proyecciones Financieras
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Modelos econométricos aplicados para ventas, costos y flujo de caja en FINAMIPE SV
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Method Selector Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            onClick={() => setSelectedMethod('seasonal')}
            className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
              selectedMethod === 'seasonal'
                ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold block">1. Mínimos Cuadrados + Estacional</span>
              <span className="text-[9px] bg-indigo-600 text-white px-1.5 py-0.5 rounded font-bold">Recomendado</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Tendencia OLS corregida con el ciclo comercial de El Salvador.
            </p>
          </button>

          <button
            onClick={() => setSelectedMethod('ols')}
            className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
              selectedMethod === 'ols'
                ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
            }`}
          >
            <span className="text-xs font-bold block">2. Mínimos Cuadrados (OLS)</span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Regresión lineal pura minimizando la suma del error al cuadrado.
            </p>
          </button>

          <button
            onClick={() => setSelectedMethod('logarithmic')}
            className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
              selectedMethod === 'logarithmic'
                ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
            }`}
          >
            <span className="text-xs font-bold block">3. Modelo Logarítmico</span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Curva de rendimientos decrecientes y saturación de mercado.
            </p>
          </button>
        </div>

        {/* Detailed Explanation */}
        {selectedMethod === 'seasonal' && (
          <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300">
            <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3">
              <div className="flex items-center gap-2 text-indigo-400 font-bold">
                <Sparkles className="w-4 h-4" />
                <span>¿Por qué es el método superior para empresas en El Salvador?</span>
              </div>
              <p className="leading-relaxed text-slate-300">
                En el mercado salvadoreño, una simple línea recta (año base o regresión plana) distorsiona los resultados porque ignora los picos estacionales críticos (Día de las Madres en mayo, Fiestas Agostinas de San Salvador, Black Friday en noviembre y Aguinaldos/Navidad en diciembre).
              </p>
              <div className="font-mono text-emerald-300 bg-white/5 p-3 rounded-xl border border-white/10 text-[11px]">
                ŷ(t) = Tendencia_OLS(t) × Factor_Estacional_SV(t)
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                Índices Estacionales Promedio en El Salvador (Multiplicadores de Demanda):
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {EL_SALVADOR_SEASONAL_FACTORS.map((f) => (
                  <div key={f.monthIndex} className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30">
                    <div className="flex justify-between items-center font-bold">
                      <span>{f.name}</span>
                      <span className={`font-mono ${f.factor >= 1.2 ? 'text-emerald-600 dark:text-emerald-400' : f.factor <= 0.8 ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'}`}>
                        {f.factor.toFixed(2)}x
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 block truncate mt-0.5">{f.description}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedMethod === 'ols' && (
          <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300">
            <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2 font-mono text-[11px]">
              <div className="text-indigo-400 font-sans font-bold">Ecuación de Regresión por Mínimos Cuadrados Ordinarios (MCO):</div>
              <div className="p-2 bg-white/5 rounded-lg">ŷ = m · x + b</div>
              <div className="text-slate-300 text-[10px]">
                m (Pendiente) = [ n Σ(xy) - Σx Σy ] / [ n Σ(x²) - (Σx)² ]
              </div>
              <div className="text-slate-300 text-[10px]">
                b (Intersección) = ( Σy - m Σx ) / n
              </div>
            </div>
            <p className="leading-relaxed">
              <strong>Ventajas:</strong> Minimiza matemáticamente la suma de los errores cuadráticos (SSE = Σ(y - ŷ)²). Es el estándar adoptado en auditorías financieras para modelar tasas de crecimiento sostenido a mediano plazo cuando no hay estacionalidad extrema.
            </p>
          </div>
        )}

        {selectedMethod === 'logarithmic' && (
          <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300">
            <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2 font-mono text-[11px]">
              <div className="text-indigo-400 font-sans font-bold">Modelo de Regresión Logarítmica:</div>
              <div className="p-2 bg-white/5 rounded-lg">ŷ = a + b · ln(x)</div>
            </div>
            <p className="leading-relaxed">
              <strong>¿Cuándo usarlo?</strong> Cuando un negocio o sucursal alcanza la etapa de madurez o saturación de mercado en una zona geográfica específica. Proyecta un crecimiento rápido inicial que progresivamente se desacelera hacia una asíntota estable.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
