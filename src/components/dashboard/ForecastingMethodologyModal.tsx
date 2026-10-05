import React, { useState } from 'react';
import { X, Calculator } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-[8px] border border-[#E3E8E6] dark:border-slate-800 shadow-none p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-[#E3E8E6] dark:border-slate-800">
          <div className="flex items-center gap-3">
            <Calculator className="w-5 h-5 text-[#6B7280] stroke-[1.5]" />
            <div>
              <h3 className="text-[16px] font-semibold text-[#111827] dark:text-white">
                Metodología de proyecciones financieras
              </h3>
              <p className="text-[12px] text-[#6B7280] dark:text-slate-400">
                Modelos econométricos aplicados para ventas, costos y flujo de caja en El Salvador
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-[6px] text-[#6B7280] hover:text-[#111827] dark:hover:text-white hover:bg-[#F6F8F7] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Method Selector Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => setSelectedMethod('seasonal')}
            className={`p-3 rounded-[6px] border text-left transition cursor-pointer ${
              selectedMethod === 'seasonal'
                ? 'border-[#0F766E] bg-[#F6F8F7] dark:bg-slate-800 text-[#111827] dark:text-white font-medium'
                : 'border-[#E3E8E6] dark:border-slate-800 hover:bg-[#F6F8F7] text-[#6B7280] dark:text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[14px] font-medium block">1. MCO + Estacional</span>
              <span className="text-[12px] bg-[#0F766E] text-white px-1.5 py-0.5 rounded-[4px]">Recomendado</span>
            </div>
            <p className="text-[12px] text-[#6B7280] dark:text-slate-400 mt-1">
              Tendencia OLS corregida con el ciclo comercial salvadoreño.
            </p>
          </button>

          <button
            onClick={() => setSelectedMethod('ols')}
            className={`p-3 rounded-[6px] border text-left transition cursor-pointer ${
              selectedMethod === 'ols'
                ? 'border-[#0F766E] bg-[#F6F8F7] dark:bg-slate-800 text-[#111827] dark:text-white font-medium'
                : 'border-[#E3E8E6] dark:border-slate-800 hover:bg-[#F6F8F7] text-[#6B7280] dark:text-slate-300'
            }`}
          >
            <span className="text-[14px] font-medium block">2. Mínimos cuadrados (OLS)</span>
            <p className="text-[12px] text-[#6B7280] dark:text-slate-400 mt-1">
              Regresión lineal pura minimizando la suma del error al cuadrado.
            </p>
          </button>

          <button
            onClick={() => setSelectedMethod('logarithmic')}
            className={`p-3 rounded-[6px] border text-left transition cursor-pointer ${
              selectedMethod === 'logarithmic'
                ? 'border-[#0F766E] bg-[#F6F8F7] dark:bg-slate-800 text-[#111827] dark:text-white font-medium'
                : 'border-[#E3E8E6] dark:border-slate-800 hover:bg-[#F6F8F7] text-[#6B7280] dark:text-slate-300'
            }`}
          >
            <span className="text-[14px] font-medium block">3. Modelo logarítmico</span>
            <p className="text-[12px] text-[#6B7280] dark:text-slate-400 mt-1">
              Curva de rendimientos decrecientes y saturación de mercado.
            </p>
          </button>
        </div>

        {/* Detailed Explanation */}
        {selectedMethod === 'seasonal' && (
          <div className="space-y-4 text-[14px] text-[#111827] dark:text-slate-300">
            <div className="p-4 rounded-[6px] bg-[#F6F8F7] dark:bg-slate-800 border border-[#E3E8E6] dark:border-slate-700 space-y-2">
              <span className="text-[14px] font-medium text-[#111827] dark:text-white block">
                Comportamiento estacional en El Salvador
              </span>
              <p className="text-[14px] text-[#6B7280] dark:text-slate-300 leading-relaxed">
                El mercado salvadoreño presenta variaciones estacionales significativas debido a fechas clave como Día de las Madres en mayo, Fiestas Agostinas, Black Friday en noviembre y Aguinaldos / Navidad en diciembre.
              </p>
              <div className="font-mono text-[#111827] dark:text-white text-[12px] pt-1">
                ŷ(t) = Tendencia_OLS(t) × Factor_Estacional_SV(t)
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-[#111827] dark:text-white text-[14px]">
                Factores estacionales promedio por mes:
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {EL_SALVADOR_SEASONAL_FACTORS.map((f) => (
                  <div key={f.monthIndex} className="p-2.5 rounded-[6px] border border-[#E3E8E6] dark:border-slate-800 bg-[#F6F8F7] dark:bg-slate-800/40">
                    <div className="flex justify-between items-center text-[12px]">
                      <span className="font-medium text-[#111827] dark:text-white">{f.name}</span>
                      <span className="font-mono font-semibold text-[#111827] dark:text-white">
                        {f.factor.toFixed(2)}x
                      </span>
                    </div>
                    <span className="text-[12px] text-[#6B7280] block truncate mt-0.5">{f.description}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedMethod === 'ols' && (
          <div className="space-y-4 text-[14px] text-[#111827] dark:text-slate-300">
            <div className="p-4 rounded-[6px] bg-[#F6F8F7] dark:bg-slate-800 border border-[#E3E8E6] dark:border-slate-700 space-y-2 font-mono text-[12px]">
              <div className="font-sans font-medium text-[#111827] dark:text-white">Ecuación de regresión lineal (MCO):</div>
              <div className="p-2 bg-white dark:bg-slate-900 border border-[#E3E8E6] dark:border-slate-800 rounded-[4px]">ŷ = m · x + b</div>
              <div className="text-[#6B7280]">
                m (Pendiente) = [ n Σ(xy) - Σx Σy ] / [ n Σ(x²) - (Σx)² ]
              </div>
              <div className="text-[#6B7280]">
                b (Intersección) = ( Σy - m Σx ) / n
              </div>
            </div>
            <p className="text-[14px] text-[#6B7280] leading-relaxed">
              Minimiza la suma de los errores cuadráticos. Estándar contable para modelar tasas de crecimiento lineal sostenido.
            </p>
          </div>
        )}

        {selectedMethod === 'logarithmic' && (
          <div className="space-y-4 text-[14px] text-[#111827] dark:text-slate-300">
            <div className="p-4 rounded-[6px] bg-[#F6F8F7] dark:bg-slate-800 border border-[#E3E8E6] dark:border-slate-700 space-y-2 font-mono text-[12px]">
              <div className="font-sans font-medium text-[#111827] dark:text-white">Modelo de regresión logarítmica:</div>
              <div className="p-2 bg-white dark:bg-slate-900 border border-[#E3E8E6] dark:border-slate-800 rounded-[4px]">ŷ = a + b · ln(x)</div>
            </div>
            <p className="text-[14px] text-[#6B7280] leading-relaxed">
              Adecuado cuando una sucursal alcanza etapa de madurez o saturación de mercado en una zona geográfica específica.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-[#E3E8E6] dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-[6px] bg-[#0F766E] hover:bg-[#115E59] text-white text-[14px] font-medium transition cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
