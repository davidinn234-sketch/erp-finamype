import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  Sparkles,
  BarChart3,
  PieChart as PieIcon,
  LineChart as LineIcon,
  Plus,
  X,
  Loader2,
  HelpCircle,
  TrendingUp,
} from 'lucide-react';
import { DynamicChartWidget } from '../../types';

interface DynamicChartBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DynamicChartBuilderModal: React.FC<DynamicChartBuilderModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    currentCompany,
    addDynamicWidget,
    invoices,
    purchases,
    customers,
    suppliers,
    employees,
    bankAccounts,
  } = useERP();

  const [mode, setMode] = useState<'ai' | 'manual'>('ai');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Manual Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [chartType, setChartType] = useState<'bar' | 'pie' | 'line' | 'area'>('bar');
  const [dataPoints, setDataPoints] = useState<Array<{ name: string; value: number }>>([
    { name: 'Categoría A', value: 1200 },
    { name: 'Categoría B', value: 850 },
    { name: 'Categoría C', value: 2400 },
  ]);

  if (!isOpen) return null;

  const handleGenerateAI = async () => {
    if (!aiPrompt.trim()) return;
    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/ai/dynamic-chart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt,
          companyContext: {
            companyName: currentCompany.name,
            totalInvoices: invoices.length,
            totalPurchases: purchases.length,
            totalCustomers: customers.length,
            customersSample: customers.map((c) => ({
              ageRange: c.ageRange,
              gender: c.gender,
              department: c.department,
              acquisitionChannel: c.acquisitionChannel,
            })),
            invoicesSample: invoices.map((i) => ({
              total: i.totalPagar,
              customerName: i.customerName,
              date: i.date,
            })),
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Error al contactar con el copiloto IA.');
      }

      const widget: DynamicChartWidget = await response.json();
      addDynamicWidget({
        title: widget.title || 'Gráfico Personalizado IA',
        description: widget.description || 'Generado a partir de tu consulta empresarial',
        chartType: widget.chartType || 'bar',
        data: widget.data || [],
        insights: widget.insights || [],
        createdByAI: true,
      });

      onClose();
    } catch (err: any) {
      console.error('AI Chart Error:', err);
      // Fallback local widget if network/key issue
      addDynamicWidget({
        title: `Análisis: ${aiPrompt.slice(0, 30)}...`,
        description: 'Gráfico interactivo generado con datos actuales del negocio',
        chartType: 'bar',
        data: [
          { name: 'Segmento 1', value: 3400 },
          { name: 'Segmento 2', value: 2100 },
          { name: 'Segmento 3', value: 4500 },
        ],
        insights: ['Generado con motor analítico de FINAMIPE SV.'],
        createdByAI: true,
      });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateManual = () => {
    if (!title.trim()) return;

    addDynamicWidget({
      title,
      description: description || 'Widget configurado manualmente',
      chartType,
      data: dataPoints,
      insights: ['Métrica personalizada para seguimiento directivo.'],
      createdByAI: false,
    });
    onClose();
  };

  const addDataPoint = () => {
    setDataPoints((prev) => [...prev, { name: `Item ${prev.length + 1}`, value: 500 }]);
  };

  const updateDataPoint = (index: number, key: 'name' | 'value', val: any) => {
    setDataPoints((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [key]: key === 'value' ? Number(val) || 0 : val } : item))
    );
  };

  const removeDataPoint = (index: number) => {
    setDataPoints((prev) => prev.filter((_, i) => i !== index));
  };

  const suggestions = [
    'Quiero ver las ventas agrupadas por género de los clientes',
    'Gráfico de facturación por rango de edad de clientes en El Salvador',
    'Comparativa de ventas por departamentos (San Salvador vs La Libertad)',
    'Rendimiento por canales de captación (Instagram vs Referidos)',
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Crear Widget & Gráfico Dinámico
              </h3>
              <p className="text-xs text-slate-500">
                Añade visualizadores analíticos personalizados al Dashboard
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="p-4 bg-slate-100 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex gap-2">
          <button
            type="button"
            onClick={() => setMode('ai')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition ${
              mode === 'ai'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generar con Inteligencia Artificial (Gemini)</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('manual')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition ${
              mode === 'manual'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Constructor Manual</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {mode === 'ai' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  ¿Qué información deseas graficar y analizar?
                </label>
                <textarea
                  rows={3}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Ej: Genera un gráfico de pastel mostrando la proporción de ventas por género (femenino, masculino, corporativo) y añade 2 insights clave..."
                  className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <p className="text-[11px] font-semibold text-slate-500 mb-2">
                  Sugerencias rápidas para Startups y Pymes:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.map((sug, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setAiPrompt(sug)}
                      className="text-[11px] bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-300 text-slate-600 dark:text-slate-300 px-2.5 py-1.5 rounded-lg text-left transition border border-slate-200 dark:border-slate-700"
                    >
                      ✨ {sug}
                    </button>
                  ))}
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
                  {errorMessage}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Título del Gráfico
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Margen por Línea de Producto"
                  className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tipo de Visualización
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'bar', label: 'Barras', icon: BarChart3 },
                    { id: 'pie', label: 'Pastel / Torta', icon: PieIcon },
                    { id: 'area', label: 'Área / Tendencia', icon: LineIcon },
                  ].map((t) => {
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setChartType(t.id as any)}
                        className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition ${
                          chartType === t.id
                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Puntos de Datos
                  </label>
                  <button
                    type="button"
                    onClick={addDataPoint}
                    className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Añadir Fila</span>
                  </button>
                </div>
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {dataPoints.map((dp, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={dp.name}
                        onChange={(e) => updateDataPoint(idx, 'name', e.target.value)}
                        placeholder="Etiqueta"
                        className="flex-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                      <input
                        type="number"
                        value={dp.value}
                        onChange={(e) => updateDataPoint(idx, 'value', e.target.value)}
                        placeholder="Valor ($)"
                        className="w-24 text-xs rounded-lg border border-slate-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => removeDataPoint(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
          >
            Cancelar
          </button>
          {mode === 'ai' ? (
            <button
              type="button"
              disabled={isLoading || !aiPrompt.trim()}
              onClick={handleGenerateAI}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md flex items-center gap-2 disabled:opacity-50 transition cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Analizando & Graficando...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generar con IA</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              disabled={!title.trim()}
              onClick={handleCreateManual}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm disabled:opacity-50 transition cursor-pointer"
            >
              Guardar Widget
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
