import React, { useState } from 'react';
import {
  X,
  FileText,
  Target,
  Users,
  Lightbulb,
  ShieldCheck,
  TrendingUp,
  DollarSign,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  Building2,
} from 'lucide-react';

interface FinaPymeTermsAndProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FinaPymeTermsAndProjectModal: React.FC<FinaPymeTermsAndProjectModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'manifesto' | 'terms' | 'team'>('manifesto');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-3xl rounded-3xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-800 dark:text-slate-100">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-indigo-50/70 via-blue-50/50 to-white dark:from-slate-900 dark:via-indigo-950/40 dark:to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  FinaPyme<span className="text-indigo-600 dark:text-indigo-400">.SV</span>
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  ERP & Finanzas MYPES
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Universidad de El Salvador (FMOcc) • Desarrollo de Nuevos Productos
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-5 pt-2 bg-slate-50/60 dark:bg-slate-900/50 gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('manifesto')}
            className={`pb-2.5 pt-2 px-3 text-xs font-bold flex items-center gap-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'manifesto'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>Objetivos & Metodología Lean Startup</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('terms')}
            className={`pb-2.5 pt-2 px-3 text-xs font-bold flex items-center gap-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'terms'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Términos y Condiciones del Servicio</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('team')}
            className={`pb-2.5 pt-2 px-3 text-xs font-bold flex items-center gap-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'team'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Equipo FinaPyme & Docencia</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm flex-1">
          {/* TAB 1: MANIFIESTO Y OBJETIVOS */}
          {activeTab === 'manifesto' && (
            <div className="space-y-6">
              {/* Banner Propósito */}
              <div className="p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-2">
                <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 font-bold text-xs uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Principio Orientador del Proyecto</span>
                </div>
                <blockquote className="text-sm font-semibold italic text-slate-800 dark:text-slate-200 border-l-3 border-indigo-500 pl-3">
                  &ldquo;No existen hechos dentro del edificio; salgan y compruébenlos con los clientes.&rdquo;
                </blockquote>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Transformamos una necesidad real de los emprendedores salvadoreños en una propuesta ágil, basada en hipótesis comprobables y validada directamente en el mercado local.
                </p>
              </div>

              {/* El Problema Identificado */}
              <div className="space-y-2.5">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                  <Target className="w-4 h-4 text-rose-500" />
                  <span>1. El Problema Real Identificado (Etapa 1 y 2)</span>
                </h3>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs leading-relaxed space-y-2">
                  <p>
                    <strong>Falta de control y organización financiera en los pequeños emprendimientos y MYPES:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400">
                    <li>La mayoría lleva sus cuentas en papel o Excel manual, facilitando errores en cálculos de costos, precios e inventarios.</li>
                    <li>Desconocimiento de la <strong>liquidez real</strong> y la <strong>rentabilidad neta</strong> del negocio, lo que provoca insolvencia y quiebra temprana.</li>
                    <li>Dificultad para cumplir oportunamente con obligaciones tributarias y laborales en El Salvador (IVA 13%, DTE, ISSS, AFP, Renta).</li>
                  </ul>
                </div>
              </div>

              {/* La Solución Digital FinaPyme */}
              <div className="space-y-2.5">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  <span>2. La Solución Digital FinaPyme ERP</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-1.5">
                    <h4 className="font-bold text-xs text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Diseñado para No Contadores
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Cualquier persona puede registrar compras, ventas, nóminas e inventario sin tecnicismos contables enredados.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 space-y-1.5">
                    <h4 className="font-bold text-xs text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5" />
                      Dashboard Integrado de Liquidez
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Conecta ventas, inventarios, planilla, cuentas por cobrar y por pagar en gráficos claros de rentabilidad en tiempo real.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 space-y-1.5">
                    <h4 className="font-bold text-xs text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Inteligencia Artificial Integrada
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Diferenciador frente a Odoo: Copiloto con IA (Gemini) para análisis de alertas financieras y consejos estratégicos automáticos.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-cyan-50/60 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800 space-y-1.5">
                    <h4 className="font-bold text-xs text-cyan-900 dark:text-cyan-300 flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5" />
                      Tarifa Accesible ($10 - $30/mes)
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Alineado con el poder adquisitivo de los micro y pequeños emprendedores salvadoreños y escalable a empresas medianas.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TÉRMINOS Y CONDICIONES */}
          {activeTab === 'terms' && (
            <div className="space-y-4 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-900 dark:text-white">Última actualización:</span> Septiembre de 2026 • Versión FinaPyme MVP 1.0 (El Salvador)
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">1. Naturaleza y Propósito del Servicio</h4>
                <p>
                  FinaPyme ERP es un software de gestión financiera y operativa diseñado primordialmente para asistir a emprendedores, pequeños negocios y Micro/Pequeñas Empresas (MYPES) en la República de El Salvador en el registro sistemático de sus transacciones comerciales, inventarios, planillas laborales y proyecciones de liquidez.
                </p>

                <h4 className="font-bold text-slate-900 dark:text-white text-sm">2. Privacidad y Seguridad de los Datos Financieros</h4>
                <p>
                  Toda la información registrada (ventas, compras, catálogo de clientes, empleados y saldos en caja) pertenece exclusivamente al titular de la cuenta o empresa registrada. FinaPyme aplica protocolos de encriptación en tránsito y bases de datos seguras en la nube (Google Cloud / Firebase). Los datos no son comercializados ni compartidos con terceros con fines publicitarios.
                </p>

                <h4 className="font-bold text-slate-900 dark:text-white text-sm">3. Responsabilidad Tributaria y Legal</h4>
                <p>
                  El sistema incorpora las normativas vigentes en El Salvador (tasas de IVA 13%, retenciones de 1%, cotizaciones ISSS, AFP y tablas del Ministerio de Hacienda). No obstante, los cálculos emitidos sirven de herramienta auxiliar y de control gerencial; la veracidad de los datos ingresados y el cumplimiento fiscal final ante la DGII / Ministerio de Hacienda es responsabilidad exclusiva del usuario y su asesor contable.
                </p>

                <h4 className="font-bold text-slate-900 dark:text-white text-sm">4. Modelo de Suscripción y Compromiso de Precio Justo</h4>
                <p>
                  De acuerdo con el estudio de viabilidad de Lean Startup del proyecto, FinaPyme mantiene una política de precios accesibles calculados entre <strong>$10.00 y $30.00 USD mensuales</strong> según el volumen de operaciones, garantizando que el costo de la tecnología nunca sea una barrera para la formalización del pequeño negocio.
                </p>

                <h4 className="font-bold text-slate-900 dark:text-white text-sm">5. Uso del Asistente de Inteligencia Artificial (FinaPyme AI)</h4>
                <p>
                  Las sugerencias financieras, predicciones de quiebre de stock y análisis predictivos son generados mediante algoritmos de inteligencia artificial para apoyar la toma de decisiones empresariales. El usuario reconoce que estas proyecciones tienen carácter consultivo y deben contrastarse con la realidad de su entorno comercial.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: EQUIPO Y ACADÉMICO */}
          {activeTab === 'team' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 space-y-2">
                <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200 font-bold text-xs uppercase tracking-wide">
                  <GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Marco Académico e Institucional</span>
                </div>
                <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
                  <p><strong>Institución:</strong> Universidad de El Salvador (UES) — Facultad Multidisciplinaria de Occidente (FMOcc)</p>
                  <p><strong>Asignatura:</strong> Desarrollo de Nuevos Productos</p>
                  <p><strong>Docente a cargo:</strong> Máster Francisco Antonio López Román</p>
                  <p><strong>Actividad:</strong> Actividad 1 Lean Startup y Desarrollo de Clientes (Emprendimiento Digital)</p>
                  <p><strong>Fecha de Presentación:</strong> 11 de septiembre de 2026</p>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span>Equipo Fundador FinaPyme</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  {[
                    { name: 'Elias David Marroquín Letona', role: 'Líder de Iniciativa & Desarrollo de Negocio' },
                    { name: 'Celeste Marielos Posada González', role: 'Investigación de Mercado & Clientes' },
                    { name: 'Allison Cecilia García Rivas', role: 'Validación de Hipótesis & Canales' },
                    { name: 'Eduardo Alejandro González Franco', role: 'Estructura Operativa & Procesos' },
                    { name: 'Iliana Elizabeth Cisneros Pineda', role: 'Diseño Funcional & Experiencia' },
                    { name: 'Karla Alejandra Arevalo Fiallos', role: 'Análisis Financiero & Propuesta de Valor' },
                  ].map((member, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center gap-3"
                    >
                      <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center shrink-0 text-xs">
                        {member.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 dark:text-white truncate">{member.name}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{member.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Proyecto validado con Metodología Lean Startup (UES FMOcc)</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition cursor-pointer shadow-md shadow-indigo-600/20"
          >
            Entendido y Aceptar
          </button>
        </div>
      </div>
    </div>
  );
};
