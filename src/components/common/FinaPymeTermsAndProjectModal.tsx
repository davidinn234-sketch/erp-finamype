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
  Lock,
  Globe,
  Server,
  AlertTriangle,
} from 'lucide-react';

interface FinaPymeTermsAndProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'manifesto' | 'terms' | 'security' | 'team';
}

export const FinaPymeTermsAndProjectModal: React.FC<FinaPymeTermsAndProjectModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'manifesto',
}) => {
  const [activeTab, setActiveTab] = useState<'manifesto' | 'terms' | 'security' | 'team'>(defaultTab);

  React.useEffect(() => {
    if (isOpen && defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [isOpen, defaultTab]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-3xl rounded-[8px] bg-white dark:bg-slate-900 border border-[#E3E8E6] dark:border-slate-800 shadow-xl overflow-hidden flex flex-col max-h-[92vh] text-slate-800 dark:text-slate-100">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E3E8E6] dark:border-slate-800 bg-[#F6F8F7] dark:bg-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[6px] bg-[#0F766E] flex items-center justify-center text-white shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[17px] font-semibold text-[#111827] dark:text-white tracking-tight">
                  FinaPyme<span className="text-[#0F766E] dark:text-teal-400">.SV</span>
                </h2>
                <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-semibold bg-teal-50 dark:bg-teal-950/60 text-[#0F766E] dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                  ERP & Finanzas MYPES
                </span>
              </div>
              <p className="text-[12px] text-[#6B7280] dark:text-slate-400">
                Universidad de El Salvador (FMOcc) • Desarrollo de Nuevos Productos
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-[6px] text-[#6B7280] hover:text-[#111827] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#E3E8E6] dark:border-slate-800 px-4 pt-2 bg-[#F6F8F7]/50 dark:bg-slate-900/50 gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('manifesto')}
            className={`pb-2.5 pt-2 px-3 text-[12px] font-medium flex items-center gap-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'manifesto'
                ? 'border-[#0F766E] text-[#0F766E] dark:text-teal-400 dark:border-teal-400 font-semibold'
                : 'border-transparent text-[#6B7280] hover:text-[#111827] dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Objetivos & Metodología Lean</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('terms')}
            className={`pb-2.5 pt-2 px-3 text-[12px] font-medium flex items-center gap-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'terms'
                ? 'border-[#0F766E] text-[#0F766E] dark:text-teal-400 dark:border-teal-400 font-semibold'
                : 'border-transparent text-[#6B7280] hover:text-[#111827] dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Términos y Condiciones</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`pb-2.5 pt-2 px-3 text-[12px] font-medium flex items-center gap-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'security'
                ? 'border-[#0F766E] text-[#0F766E] dark:text-teal-400 dark:border-teal-400 font-semibold'
                : 'border-transparent text-[#6B7280] hover:text-[#111827] dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Ciberseguridad, Privacidad & Registro IP</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('team')}
            className={`pb-2.5 pt-2 px-3 text-[12px] font-medium flex items-center gap-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'team'
                ? 'border-[#0F766E] text-[#0F766E] dark:text-teal-400 dark:border-teal-400 font-semibold'
                : 'border-transparent text-[#6B7280] hover:text-[#111827] dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Equipo FinaPyme & Docencia</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm flex-1">
          {/* TAB 1: MANIFIESTO Y OBJETIVOS */}
          {activeTab === 'manifesto' && (
            <div className="space-y-6">
              {/* Banner Propósito */}
              <div className="p-4 rounded-[6px] bg-teal-50/80 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 space-y-2">
                <div className="flex items-center gap-2 text-[#0F766E] dark:text-teal-300 font-semibold text-[11px] uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Principio Orientador del Proyecto</span>
                </div>
                <blockquote className="text-[13px] font-semibold italic text-[#111827] dark:text-slate-200 border-l-2 border-[#0F766E] pl-3">
                  &ldquo;No existen hechos dentro del edificio; salgan y compruébenlos con los clientes.&rdquo;
                </blockquote>
                <p className="text-[12px] text-[#6B7280] dark:text-slate-400">
                  Transformamos una necesidad real de los emprendedores salvadoreños en una propuesta ágil, basada en hipótesis comprobables y validada directamente en el mercado local.
                </p>
              </div>

              {/* El Problema Identificado */}
              <div className="space-y-2.5">
                <h3 className="font-semibold text-[#111827] dark:text-white flex items-center gap-2 text-[14px]">
                  <Target className="w-4 h-4 text-rose-500" />
                  <span>1. El Problema Real Identificado (Etapa 1 y 2)</span>
                </h3>
                <div className="p-4 rounded-[6px] bg-[#F6F8F7] dark:bg-slate-800/60 border border-[#E3E8E6] dark:border-slate-700 text-[12px] leading-relaxed space-y-2">
                  <p>
                    <strong>Falta de control y organización financiera en los pequeños emprendimientos y MYPES:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-[#6B7280] dark:text-slate-400">
                    <li>La mayoría lleva sus cuentas en papel o Excel manual, facilitando errores en cálculos de costos, precios e inventarios.</li>
                    <li>Desconocimiento de la <strong>liquidez real</strong> y la <strong>rentabilidad neta</strong> del negocio, lo que provoca insolvencia y quiebra temprana.</li>
                    <li>Dificultad para cumplir oportunamente con obligaciones tributarias y laborales en El Salvador (IVA 13%, DTE, ISSS, AFP, Renta).</li>
                  </ul>
                </div>
              </div>

              {/* La Solución Digital FinaPyme */}
              <div className="space-y-2.5">
                <h3 className="font-semibold text-[#111827] dark:text-white flex items-center gap-2 text-[14px]">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  <span>2. La Solución Digital FinaPyme ERP</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-[6px] bg-[#F6F8F7] dark:bg-slate-800/60 border border-[#E3E8E6] dark:border-slate-700 space-y-1.5">
                    <h4 className="font-semibold text-[13px] text-[#111827] dark:text-white flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#0F766E]" />
                      Diseñado para No Contadores
                    </h4>
                    <p className="text-[12px] text-[#6B7280] dark:text-slate-400">
                      Cualquier persona puede registrar compras, ventas, nóminas e inventario sin tecnicismos contables enredados.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-[6px] bg-[#F6F8F7] dark:bg-slate-800/60 border border-[#E3E8E6] dark:border-slate-700 space-y-1.5">
                    <h4 className="font-semibold text-[13px] text-[#111827] dark:text-white flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-[#0F766E]" />
                      Dashboard Integrado de Liquidez
                    </h4>
                    <p className="text-[12px] text-[#6B7280] dark:text-slate-400">
                      Conecta ventas, inventarios, planilla, cuentas por cobrar y por pagar en gráficos claros de rentabilidad en tiempo real.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-[6px] bg-[#F6F8F7] dark:bg-slate-800/60 border border-[#E3E8E6] dark:border-slate-700 space-y-1.5">
                    <h4 className="font-semibold text-[13px] text-[#111827] dark:text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#0F766E]" />
                      Inteligencia Artificial Integrada
                    </h4>
                    <p className="text-[12px] text-[#6B7280] dark:text-slate-400">
                      Copiloto con IA para análisis de alertas financieras y consejos estratégicos automáticos.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-[6px] bg-[#F6F8F7] dark:bg-slate-800/60 border border-[#E3E8E6] dark:border-slate-700 space-y-1.5">
                    <h4 className="font-semibold text-[13px] text-[#111827] dark:text-white flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-[#0F766E]" />
                      Tarifa Accesible ($10 - $30/mes)
                    </h4>
                    <p className="text-[12px] text-[#6B7280] dark:text-slate-400">
                      Alineado con el poder adquisitivo de los micro y pequeños emprendedores salvadoreños.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TÉRMINOS Y CONDICIONES */}
          {activeTab === 'terms' && (
            <div className="space-y-4 text-[12px] leading-relaxed text-[#6B7280] dark:text-slate-300">
              <div className="p-3.5 rounded-[6px] bg-[#F6F8F7] dark:bg-slate-800 border border-[#E3E8E6] dark:border-slate-700">
                <span className="font-semibold text-[#111827] dark:text-white">Última actualización:</span> Octubre de 2026 • Versión FinaPyme MVP 1.0 (El Salvador)
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-[#111827] dark:text-white text-[13px]">1. Naturaleza y Propósito del Servicio</h4>
                <p>
                  FinaPyme ERP es un software de gestión financiera y operativa diseñado primordialmente para asistir a emprendedores, pequeños negocios y Micro/Pequeñas Empresas (MYPES) en la República de El Salvador en el registro sistemático de sus transacciones comerciales, inventarios, planillas laborales y proyecciones de liquidez.
                </p>

                <h4 className="font-semibold text-[#111827] dark:text-white text-[13px]">2. Privacidad y Seguridad de los Datos Financieros</h4>
                <p>
                  Toda la información registrada (ventas, compras, catálogo de clientes, empleados y saldos en caja) pertenece exclusivamente al titular de la cuenta o empresa registrada. FinaPyme aplica protocolos de encriptación en tránsito y bases de datos seguras en la nube (Google Cloud / Firebase). Los datos no son comercializados ni compartidos con terceros con fines publicitarios.
                </p>

                <h4 className="font-semibold text-[#111827] dark:text-white text-[13px]">3. Responsabilidad Tributaria y Legal</h4>
                <p>
                  El sistema incorpora las normativas vigentes en El Salvador (tasas de IVA 13%, retenciones de 1%, cotizaciones ISSS, AFP y tablas del Ministerio de Hacienda). No obstante, los cálculos emitidos sirven de herramienta auxiliar y de control gerencial; la veracidad de los datos ingresados y el cumplimiento fiscal final ante la DGII / Ministerio de Hacienda es responsabilidad exclusiva del usuario y su asesor contable.
                </p>

                <h4 className="font-semibold text-[#111827] dark:text-white text-[13px]">4. Modelo de Suscripción y Compromiso de Precio Justo</h4>
                <p>
                  De acuerdo con el estudio de viabilidad de Lean Startup del proyecto, FinaPyme mantiene una política de precios accesibles calculados entre <strong>$10.00 y $30.00 USD mensuales</strong> según el volumen de operaciones, garantizando que el costo de la tecnología nunca sea una barrera para la formalización del pequeño negocio.
                </p>

                <h4 className="font-semibold text-[#111827] dark:text-white text-[13px]">5. Uso del Asistente de Inteligencia Artificial (FinaPyme AI)</h4>
                <p>
                  Las sugerencias financieras, predicciones de quiebre de stock y análisis predictivos son generados mediante algoritmos de inteligencia artificial para apoyar la toma de decisiones empresariales. El usuario reconoce que estas proyecciones tienen carácter consultivo y deben contrastarse con la realidad de su entorno comercial.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: CIBERSEGURIDAD, PRIVACIDAD & REGISTRO IP */}
          {activeTab === 'security' && (
            <div className="space-y-4 text-[12px] leading-relaxed text-[#6B7280] dark:text-slate-300">
              {/* Notice Banner */}
              <div className="p-4 rounded-[6px] bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 space-y-2">
                <div className="flex items-center gap-2 text-[#0F766E] dark:text-teal-300 font-semibold text-[11px] uppercase tracking-wide">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Declaración de Ciberseguridad, Privacidad y Prevención de Ciberataques</span>
                </div>
                <p className="text-[12px] text-[#111827] dark:text-slate-200 font-medium">
                  Esta plataforma implementa salvaguardas tecnológicas y cláusulas de protección legal para blindar los datos empresariales, mitigar riesgos de intrusión y proteger a la entidad emisora ante eventuales litigios o reclamos de terceros.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-[#111827] dark:text-white text-[13px] flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-[#0F766E]" />
                  <span>1. Registro de Dirección IP, Logs de Sesión y Telemetría de Seguridad</span>
                </h4>
                <div className="p-3.5 rounded-[6px] bg-[#F6F8F7] dark:bg-slate-800/60 border border-[#E3E8E6] dark:border-slate-700 space-y-2">
                  <p>
                    <strong>Aviso Expreso de Recolección de Datos Técnicos:</strong> Al acceder y utilizar FinaPyme ERP, el usuario reconoce y consiente que el sistema recopila automáticamente metadatos de conexión técnica, incluyendo de forma no limitativa:
                  </p>
                  <ul className="list-disc list-inside space-y-0.5 ml-2">
                    <li><strong>Dirección IP (Internet Protocol)</strong> pública asignada al ordenador o dispositivo del usuario.</li>
                    <li>Agente de usuario (User-Agent): navegador web, versión y sistema operativo utilizado.</li>
                    <li>Marcas de tiempo exactas (Timestamp UTC y hora de El Salvador) de inicio de sesión, cierre y operaciones críticas.</li>
                    <li>Huella criptográfica de sesión y eventos de auditoría (logs de transacciones y cambios contables).</li>
                  </ul>
                  <div className="p-3 rounded-[6px] bg-teal-50/60 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 text-[11px] text-[#111827] dark:text-slate-200 space-y-1">
                    <p className="font-semibold text-[#0F766E] dark:text-teal-300">
                      💡 ¿Por qué es indispensable registrar la dirección IP y cómo protege a tu empresa?
                    </p>
                    <p className="text-[#6B7280] dark:text-slate-300">
                      La dirección IP funciona como una <strong>matrícula digital de seguridad</strong>. Al registrarla, el sistema bloquea automáticamente robots e intrusos que intenten descifrar contraseñas por fuerza bruta, detecta intentos de ingreso desde países sospechosos y genera una prueba fehaciente de quién realizó cada venta o movimiento contable, protegiendo a la empresa ante disputas laborales, fraudes internos o auditorías tributarias del Ministerio de Hacienda.
                    </p>
                  </div>
                  <p className="pt-1 text-[11px] text-[#6B7280]">
                    <strong>Garantía de Confidencialidad:</strong> Dichos datos se procesan con fines exclusivos de ciberseguridad defensiva y nunca son comercializados, vendidos ni compartidos con fines publicitarios.
                  </p>
                </div>

                <h4 className="font-semibold text-[#111827] dark:text-white text-[13px] flex items-center gap-2">
                  <Server className="w-3.5 h-3.5 text-[#0F766E]" />
                  <span>2. Arquitectura de Cifrado y Blindaje Tecnológico Anti-Hackeo</span>
                </h4>
                <div className="p-3.5 rounded-[6px] bg-[#F6F8F7] dark:bg-slate-800/60 border border-[#E3E8E6] dark:border-slate-700 space-y-1.5">
                  <p>
                    FinaPyme ERP opera bajo estándares de ingeniería de software defensiva:
                  </p>
                  <ul className="list-disc list-inside space-y-0.5 ml-2">
                    <li><strong>Cifrado en Tránsito (TLS 1.3 / HTTPS):</strong> Toda comunicación entre el navegador del usuario y los servidores en la nube está encriptada de punto a punto con certificados SSL/TLS modernos.</li>
                    <li><strong>Cifrado en Reposo:</strong> Los registros almacenados en Google Cloud Platform y Firebase Firestore cuentan con cifrado AES de 256 bits a nivel de almacenamiento.</li>
                    <li><strong>Control de Acceso Basado en Roles (RBAC):</strong> Cada usuario dispone de permisos estrictamente segregados (Administrador Maestro, Contador, Gerente, Cajero, Vendedor), impidiendo que perfiles operativos accedan a parametrizaciones sensibles.</li>
                    <li><strong>Aislamiento Multi-Inquilino (Multi-Tenant Isolation):</strong> Las bases de datos segregan los registros por ID de Empresa de manera hermética, garantizando que ninguna organización pueda consultar la información de otra.</li>
                  </ul>
                </div>

                <h4 className="font-semibold text-[#111827] dark:text-white text-[13px] flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  <span>3. Limitación de Responsabilidad y Protección Legal de los Desarrolladores</span>
                </h4>
                <div className="p-3.5 rounded-[6px] bg-[#F6F8F7] dark:bg-slate-800/60 border border-[#E3E8E6] dark:border-slate-700 space-y-1.5">
                  <p>
                    <strong>Exoneración frente a Controversias Legales o Reclamaciones:</strong>
                  </p>
                  <p>
                    El software se suministra &ldquo;tal cual&rdquo; (as-is). Los creadores y desarrolladores de FinaPyme no asumen responsabilidad civil, penal, mercantil o tributaria derivada de:
                  </p>
                  <ul className="list-disc list-inside space-y-0.5 ml-2">
                    <li>Falta de resguardo o revelación involuntaria de contraseñas por parte del propio usuario o colaboradores.</li>
                    <li>Información tributaria, contable o financiera errónea o adulterada ingresada de forma manual por el usuario.</li>
                    <li>Interrupciones de conectividad o fallas en el proveedor de internet local de la empresa.</li>
                    <li>Uso de dispositivos infectados por malware ajenos a la infraestructura de FinaPyme.</li>
                  </ul>
                  <p className="pt-1 text-[11px] text-[#6B7280]">
                    Al utilizar esta aplicación, el usuario acepta de manera voluntaria, expresa e irrevocable estas condiciones conforme al marco de la Ley de Comercio Electrónico de El Salvador y tratados afines.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: EQUIPO Y ACADÉMICO */}
          {activeTab === 'team' && (
            <div className="space-y-5">
              <div className="p-4 rounded-[6px] bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900 space-y-2">
                <div className="flex items-center gap-2 text-[#0F766E] dark:text-teal-200 font-semibold text-[11px] uppercase tracking-wide">
                  <GraduationCap className="w-4 h-4" />
                  <span>Marco Académico e Institucional</span>
                </div>
                <div className="text-[12px] text-[#111827] dark:text-slate-300 space-y-1">
                  <p><strong>Institución:</strong> Universidad de El Salvador (UES) — Facultad Multidisciplinaria de Occidente (FMOcc)</p>
                  <p><strong>Asignatura:</strong> Desarrollo de Nuevos Productos</p>
                  <p><strong>Docente a cargo:</strong> Máster Francisco Antonio López Román</p>
                  <p><strong>Actividad:</strong> Actividad 1 Lean Startup y Desarrollo de Clientes (Emprendimiento Digital)</p>
                  <p><strong>Fecha de Presentación:</strong> 11 de septiembre de 2026</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-[#111827] dark:text-white text-[14px] mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#0F766E]" />
                  <span>Equipo Fundador FinaPyme</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[12px]">
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
                      className="p-3 rounded-[6px] bg-[#F6F8F7] dark:bg-slate-800/60 border border-[#E3E8E6] dark:border-slate-700/80 flex items-center gap-3"
                    >
                      <div className="w-7 h-7 rounded-[4px] bg-teal-50 dark:bg-teal-950/60 text-[#0F766E] font-semibold flex items-center justify-center shrink-0 text-xs border border-teal-200 dark:border-teal-800">
                        {member.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-[#111827] dark:text-white truncate">{member.name}</p>
                        <p className="text-[11px] text-[#6B7280] dark:text-slate-400">{member.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E3E8E6] dark:border-slate-800 bg-[#F6F8F7] dark:bg-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-[#6B7280] dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-[#059669]" />
            <span>Respaldado legalmente con Metodología Lean Startup (UES FMOcc)</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-[6px] bg-[#0F766E] hover:bg-[#115E59] text-white font-medium text-[13px] transition cursor-pointer shadow-none"
          >
            Entendido y Aceptar
          </button>
        </div>
      </div>
    </div>
  );
};
