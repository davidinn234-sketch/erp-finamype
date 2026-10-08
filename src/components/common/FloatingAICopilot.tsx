import { authenticatedFetch } from '../../lib/authenticatedFetch';
import React, { useState, useRef, useEffect } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  Sparkles,
  Bot,
  X,
  Send,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  ShoppingBag,
  UserPlus,
  BarChart3,
  TrendingUp,
  DollarSign,
  Landmark,
  Layers,
  ArrowRight,
  ShieldAlert,
  ChevronDown,
  Maximize2,
  Minimize2,
  HelpCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  actionType?: 'REGISTER_SALE' | 'REGISTER_PURCHASE' | 'REGISTER_CUSTOMER' | 'CREATE_CHART' | 'BUSINESS_CONSULTANT' | 'QUERY_ANSWER';
  saleData?: any;
  purchaseData?: any;
  customerData?: any;
  chartData?: any;
  consultantData?: any;
  queryData?: any;
  executed?: boolean;
}

const PIE_COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

export const FloatingAICopilot: React.FC = () => {
  const {
    currentCompany,
    bankAccounts,
    invoices,
    purchases,
    customers,
    products,
    suppliers,
    branches,
    createInvoice,
    createPurchase,
    createCustomer,
    addDynamicWidget,
    addNotification,
    setActiveModule,
  } = useERP();

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Consolidated financial calculations for context
  const totalLiquid = (bankAccounts || []).reduce((acc, b) => acc + (b.currentBalance || 0), 0);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'assistant',
      text: `¡Hola! Soy **FinaPyme AI**, tu Copiloto Financiero, Operativo y Estratégico en FinaPyme ERP.
Puedo ayudarte a preparar operaciones y analizar los registros de tu empresa:
• **Preparar ventas, gastos o facturas** para que los revises antes de guardarlos.
• **Preparar los datos de un nuevo cliente** para tu cartera CRM.
• **Evaluar inversiones estratégicas** (como compras al por mayor con descuento y su impacto en tu liquidez).
• **Generar gráficos y reportes interactivos** a la medida.
• **Responder preguntas de negocio** (ej: *"¿cuánto vendimos en efectivo este mes?"*).

¿En qué operación o decisión gerencial te asisto hoy?`,
      timestamp: 'Ahora',
    },
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Keyboard shortcut Ctrl+J or Cmd+J to toggle Copilot, plus custom event listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    const handleCustomToggle = () => {
      setIsOpen((prev) => !prev);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('toggle-sivarai-copilot', handleCustomToggle);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('toggle-sivarai-copilot', handleCustomToggle);
    };
  }, []);

  const handleSendMessage = async (promptText?: string) => {
    const query = (promptText || inputValue).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const companyContext = {
        companyName: currentCompany?.name || 'Mi Empresa SV',
        totalLiquid,
        bankAccounts: bankAccounts.map((b) => ({
          name: b.accountName,
          bank: b.bankName,
          balance: b.currentBalance,
        })),
        recentInvoicesCount: invoices.length,
        recentPurchasesCount: purchases.length,
        customersCount: customers.length,
      };

      const res = await authenticatedFetch('/api/ai/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: query, companyContext }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'No se pudo conectar con el asistente. Inténtalo de nuevo.');
      if (!data?.replyText || !data?.actionType) throw new Error('El asistente recibió una respuesta incompleta. Inténtalo de nuevo.');

      let executed = false;

      if (['REGISTER_SALE', 'REGISTER_PURCHASE', 'REGISTER_CUSTOMER'].includes(data.actionType)) {
        data.replyText = 'Esta es una propuesta del asistente. Revisa el cliente, los productos y los montos en el módulo correspondiente antes de registrar la operación.\n\n' + data.replyText;
      }

      const assistantMsg: ChatMessage = {
        id: `ast-${Date.now()}`,
        sender: 'assistant',
        text: data.replyText || 'He procesado tu solicitud.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionType: data.actionType,
        saleData: data.saleData,
        purchaseData: data.purchaseData,
        customerData: data.customerData,
        chartData: data.chartData,
        consultantData: data.consultantData,
        queryData: data.queryData,
        executed,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error: any) {
      console.error('Copilot request error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: error.message || 'No se pudo conectar con el asistente. Comprueba tu conexión e inténtalo de nuevo.',
          timestamp: 'Ahora',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveChartAsWidget = (chartData: any) => {
    if (!chartData) return;
    addDynamicWidget({
      title: chartData.title || 'Gráfico Personalizado IA',
      description: chartData.description || 'Generado por SivarAI Copilot',
      chartType: chartData.chartType || 'bar',
      data: chartData.data || [],
      insights: chartData.insights || [],
    });
    addNotification('success', 'Widget Guardado', 'El gráfico ha sido anclado a tus tableros.');
  };

  const QUICK_PROMPTS = [
    { label: 'Venta $150 a Carlos Flores', prompt: 'Registrar una venta de $150 al contado a Carlos Flores con factura 01' },
    { label: 'Gasto $85 en papelería', prompt: 'Registrar gasto de $85 en suministros de papelería pagado con caja chica' },
    { label: 'Meter nuevo cliente', prompt: 'Crear cliente: Ferretería El Progreso, NIT 0614-120590-101-2, San Salvador, correo compras@elprogreso.com' },
    { label: 'Consultoría: Invertir en materia prima', prompt: 'Me ofrecen comprar $9,500 de materia prima al por mayor con 25% de descuento. ¿Crees que es saludable para mi empresa según mi liquidez actual?' },
    { label: '¿Cuánto vendimos en efectivo?', prompt: '¿Cuánto hemos vendido en efectivo este mes?' },
    { label: 'Gráfico por departamento', prompt: 'Crear un gráfico de ventas por departamento de El Salvador' },
  ];

  return (
    <>
      {/* ---------------------------------------------------- */}
      {/* FLOATING TRIGGER BUTTON (Circular 48px - Only Icon) */}
      {/* ---------------------------------------------------- */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            id="floating-erp-assistant-btn"
            onClick={() => setIsOpen(true)}
            className="w-12 h-12 rounded-full bg-[#0F766E] hover:bg-[#115E59] active:scale-95 text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-150 cursor-pointer border border-teal-600/30"
            title="Asistente ERP (Ctrl + J)"
            aria-label="Abrir Asistente ERP"
          >
            <Bot className="w-6 h-6 text-white" />
          </button>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* EXPANDED COPILOT PANEL MODAL / DRAWER */}
      {/* ---------------------------------------------------- */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-200 flex flex-col bg-white dark:bg-slate-900 border border-[#E3E8E6] dark:border-slate-800 shadow-2xl overflow-hidden ${
            isExpanded
              ? 'inset-4 sm:inset-10 rounded-2xl'
              : 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-2rem)] sm:w-[460px] h-[640px] max-h-[90vh] rounded-2xl'
          }`}
        >
          {/* Header */}
          <div className="p-4 bg-[#0F4C45] text-white flex items-center justify-between border-b border-[#0b3b36] shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-900/60 text-teal-200 flex items-center justify-center font-bold border border-teal-700/50">
                <Bot className="w-5 h-5 text-teal-200" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-white">Asistente ERP</h3>
                </div>
                <p className="text-[11px] text-teal-200/90">
                  {currentCompany?.tradeName || currentCompany?.name || 'FinaPyme SV'} · Saldo Líquido: <strong className="text-white font-mono">${totalLiquid.toLocaleString()}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-400">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition"
                title={isExpanded ? 'Restaurar tamaño' : 'Maximizar'}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition"
                title="Cerrar (Ctrl + J)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Prompts Bar */}
          <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 overflow-x-auto flex gap-1.5 text-xs shrink-0 no-scrollbar">
            {QUICK_PROMPTS.map((qp, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(qp.prompt)}
                disabled={isLoading}
                className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 text-slate-700 dark:text-slate-200 text-[11px] font-medium transition cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 shadow-2xs shrink-0"
              >
                {qp.label}
              </button>
            ))}
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'assistant' && (
                  <div className="w-7 h-7 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 shadow-2xs space-y-2.5 ${
                    m.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-xs border border-slate-200/60 dark:border-slate-700/60'
                  }`}
                >
                  <div className="whitespace-pre-wrap leading-relaxed font-sans">{m.text}</div>

                  {/* RENDERED CARDS FOR ACTIONS */}

                  {/* 1. SALE REGISTERED CARD */}
                  {m.actionType === 'REGISTER_SALE' && m.saleData && (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-2 text-slate-800 dark:text-slate-200">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Operación de Venta Grabada
                        </span>
                        <span className="font-mono font-black text-emerald-700 dark:text-emerald-400 text-sm">
                          ${(m.saleData.total || 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400">
                        <div>Cliente: <strong>{m.saleData.customerName}</strong></div>
                        <div>Condición: <strong className="capitalize">{m.saleData.paymentCondition?.replace('_', ' ')}</strong></div>
                      </div>
                      <button
                        onClick={() => {
                          setActiveModule('sales');
                          setIsOpen(false);
                        }}
                        className="w-full py-1 text-center font-bold text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/50 hover:bg-emerald-200 rounded-lg transition"
                      >
                        Ver en Módulo de Facturación →
                      </button>
                    </div>
                  )}

                  {/* 2. PURCHASE / EXPENSE REGISTERED CARD */}
                  {m.actionType === 'REGISTER_PURCHASE' && m.purchaseData && (
                    <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl space-y-2 text-slate-800 dark:text-slate-200">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[11px] text-rose-800 dark:text-rose-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Gasto / Compra Asentado
                        </span>
                        <span className="font-mono font-black text-rose-700 dark:text-rose-400 text-sm">
                          -${(m.purchaseData.total || 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400">
                        <div>Proveedor: <strong>{m.purchaseData.supplierName}</strong></div>
                        <div>Categoría: <strong>{m.purchaseData.category}</strong></div>
                      </div>
                      <button
                        onClick={() => {
                          setActiveModule('purchases');
                          setIsOpen(false);
                        }}
                        className="w-full py-1 text-center font-bold text-[10px] text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-900/50 hover:bg-rose-200 rounded-lg transition"
                      >
                        Ver en Módulo de Compras →
                      </button>
                    </div>
                  )}

                  {/* 3. CUSTOMER REGISTERED CARD */}
                  {m.actionType === 'REGISTER_CUSTOMER' && m.customerData && (
                    <div className="p-3 bg-cyan-50 dark:bg-cyan-950/50 border border-cyan-200 dark:border-cyan-800 rounded-xl space-y-2 text-slate-800 dark:text-slate-200">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[11px] text-cyan-800 dark:text-cyan-300 flex items-center gap-1">
                          <UserPlus className="w-3.5 h-3.5" /> Nuevo Cliente en Base de Datos
                        </span>
                        <span className="text-[10px] font-mono bg-cyan-200 dark:bg-cyan-800 px-1.5 py-0.5 rounded text-cyan-900 dark:text-cyan-200">
                          {m.customerData.customerType === 'contribuyente' ? 'Crédito Fiscal CCF' : 'Consumidor Final'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400">
                        <div className="font-bold text-slate-900 dark:text-white">{m.customerData.name}</div>
                        <div>NIT: <span className="font-mono">{m.customerData.nit}</span> • Tel: {m.customerData.phone}</div>
                        <div>Ubicación: {m.customerData.municipality}, {typeof m.customerData.department === 'string' ? m.customerData.department : (m.customerData.department as any)?.name || 'San Salvador'}</div>
                      </div>
                      <button
                        onClick={() => {
                          setActiveModule('sales');
                          setIsOpen(false);
                        }}
                        className="w-full py-1 text-center font-bold text-[10px] text-cyan-700 dark:text-cyan-300 bg-cyan-100 dark:bg-cyan-900/50 hover:bg-cyan-200 rounded-lg transition"
                      >
                        Ver en Directorio de Clientes →
                      </button>
                    </div>
                  )}

                  {/* 4. BUSINESS CONSULTANT STRATEGIC SCORECARD */}
                  {m.actionType === 'BUSINESS_CONSULTANT' && m.consultantData && (
                    <div className="p-4 bg-slate-900 text-white rounded-2xl border border-indigo-500/30 space-y-3 shadow-md">
                      <div className="flex items-center justify-between pb-2 border-b border-white/10">
                        <div>
                          <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 block">
                            Evaluación de Decisión Financiera
                          </span>
                          <span className="font-bold text-sm text-white">
                            {m.consultantData.verdict}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-slate-400 block">Viabilidad</span>
                          <span className="text-lg font-black text-emerald-400 font-mono">
                            {m.consultantData.feasibilityScore}/100
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2 text-[11px] text-slate-300">
                        <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                          <strong className="text-cyan-300 block mb-0.5">Impacto en Liquidez & Runway:</strong>
                          {m.consultantData.liquidityImpact}
                        </div>
                        <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                          <strong className="text-amber-300 block mb-0.5">Capital de Trabajo & Margen:</strong>
                          {m.consultantData.workingCapitalAnalysis}
                        </div>
                      </div>

                      {m.consultantData.actionableSteps && (
                        <div className="pt-2 border-t border-white/10 space-y-1 text-[11px]">
                          <span className="font-bold text-slate-200 block text-[10px] uppercase">
                            Recomendaciones de Negociación:
                          </span>
                          {m.consultantData.actionableSteps.map((step: string, sIdx: number) => (
                            <div key={sIdx} className="flex items-start gap-1.5 text-slate-300">
                              <span className="text-indigo-400 shrink-0 mt-0.5">•</span>
                              <span>{step}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 5. DYNAMIC CHART CARD */}
                  {m.actionType === 'CREATE_CHART' && m.chartData && (
                    <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2 shadow-xs">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-xs text-slate-900 dark:text-white">{m.chartData.title}</h4>
                          <p className="text-[10px] text-slate-500">{m.chartData.description}</p>
                        </div>
                        <button
                          onClick={() => handleSaveChartAsWidget(m.chartData)}
                          className="px-2 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <BarChart3 className="w-3 h-3" />
                          <span>Anclar al Tablero</span>
                        </button>
                      </div>

                      <div className="h-44 w-full pt-1">
                        <ResponsiveContainer width="100%" height="100%">
                          {m.chartData.chartType === 'area' ? (
                            <AreaChart data={m.chartData.data}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                              <YAxis tick={{ fontSize: 10 }} />
                              <Tooltip formatter={(v: any) => [`$${Number(v).toLocaleString()}`, 'Valor']} />
                              <Area type="monotone" dataKey="value" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.25} />
                            </AreaChart>
                          ) : m.chartData.chartType === 'pie' ? (
                            <PieChart>
                              <Pie
                                data={m.chartData.data}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={60}
                              >
                                {(m.chartData.data || []).map((_: any, index: number) => (
                                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(v: any) => [`$${Number(v).toLocaleString()}`, '']} />
                            </PieChart>
                          ) : (
                            <BarChart data={m.chartData.data}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                              <YAxis tick={{ fontSize: 10 }} />
                              <Tooltip formatter={(v: any) => [`$${Number(v).toLocaleString()}`, 'Monto']} />
                              <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          )}
                        </ResponsiveContainer>
                      </div>

                      {m.chartData.insights && (
                        <div className="space-y-1 text-[10px] text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                          {m.chartData.insights.map((ins: string, iIdx: number) => (
                            <div key={iIdx} className="flex items-start gap-1">
                              <span className="text-indigo-500 font-bold">•</span>
                              <span>{ins}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div
                    className={`text-[9px] mt-1 ${
                      m.sender === 'user' ? 'text-indigo-200 text-right' : 'text-slate-400'
                    }`}
                  >
                    {m.timestamp}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2.5 items-center text-slate-500 dark:text-slate-400 text-xs italic p-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                <span>SivarAI está analizando los registros y ejecutando la acción...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Escribe tu instrucción (ej: Registrar venta de $200 a María López)..."
                disabled={isLoading}
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#E3E8E6] dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:outline-hidden focus:ring-2 focus:ring-[#0F766E] transition"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="p-2.5 bg-[#0F766E] text-white rounded-xl hover:bg-[#115E59] disabled:opacity-50 transition cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <div className="flex items-center justify-between mt-2 text-[10px] text-slate-400 px-1">
              <span>Asistente Operativo FinaPyme</span>
              <span>Enter para enviar</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
