import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  Building2,
  ArrowRight,
  Wallet,
  Store,
  FileSpreadsheet,
  FileCheck2,
  Shield,
  User,
  Phone,
  CheckCircle2,
} from 'lucide-react';
import { FinaPymeTermsAndProjectModal } from '../common/FinaPymeTermsAndProjectModal';

export const LoginScreen: React.FC = () => {
  const { login, createCompanyWithAdmin, registerPersonalAccount, resetPassword, authError } = useERP();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  // Registration form state
  const [regAccountType, setRegAccountType] = useState<
    'emprendedor' | 'empresa_sin_dte' | 'empresa_dte' | 'finanzas_personales'
  >('emprendedor');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regBusinessName, setRegBusinessName] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError('Por favor ingrese su correo electrónico.');
      return;
    }
    if (!password) {
      setError('Por favor ingrese su contraseña.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(email, password);
      setIsLoading(false);
      if (!result.success) {
        setError(result.error || 'Credenciales no válidas.');
      }
    } catch {
      setIsLoading(false);
      setError('Inconveniente temporal al conectar con la base de datos.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!regName.trim() || !regEmail.trim() || !regPassword.trim()) {
      setError('Por favor complete su nombre, correo y contraseña.');
      return;
    }

    setIsLoading(true);
    try {
      if (regAccountType === 'finanzas_personales') {
        // Create isolated personal finance profile
        await registerPersonalAccount({
          name: regName.trim(),
          email: regEmail.trim().toLowerCase(),
          password: regPassword,
          phone: regPhone.trim() || undefined,
          role: 'gerente',
          systemArchetype: 'finanzas_personales',
          isConfigured: true,
          createdAt: new Date().toISOString().split('T')[0],
          storedInCloud: true,
        });

      } else {
        // Business account (Emprendedor or Empresa DTE)
        const businessTitle = regBusinessName.trim() || `Negocio de ${regName.trim()}`;
        const isDte = regAccountType === 'empresa_dte';
        const isContributor = isDte || regAccountType === 'empresa_sin_dte';

        await createCompanyWithAdmin(
          {
            name: businessTitle,
            tradeName: businessTitle,
            nit: '',
            nrc: '',
            giro: 'Comercio al por menor y servicios generales',
            economicActivity: 'Comercio al por menor y servicios generales',
            economicActivityCode: '47110',
            address: 'San Salvador, El Salvador',
            department: 'San Salvador',
            municipality: 'San Salvador Centro',
            phone: regPhone.trim() || '+503 7000-0000',
            email: regEmail.trim().toLowerCase(),
            isGranContribuyente: false,
            currency: 'USD',
            fiscalYear: new Date().getFullYear(),
            regimeType: isContributor ? 'general_tributario' : 'emprendedor_control_interno',
            systemArchetype: isDte ? 'empresa_consolidada_dte' : isContributor ? 'negocio_transicion' : 'emprendedor_control_interno',
            dteActive: isDte,
            dteEnvironment: 'pruebas',
            inventoryMethod: 'costo_promedio',
            taxesConfig: {
              declaIva: isContributor,
              declaPagoCuenta: isContributor,
              declaImpuestosMunicipales: true,
              municipalRateOrFee: 15.0,
              alcaldiaName: 'Alcaldía Municipal de San Salvador Centro',
            },
          },
          {
            name: regName.trim(),
            email: regEmail.trim().toLowerCase(),
            password: regPassword,
            phone: regPhone.trim(),
          }
        );

      }
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      setError(error instanceof Error ? error.message : 'No se pudo crear la cuenta.');
    }
  };

  const servicesList = [
    {
      id: 'personal',
      title: 'Finanzas Personales',
      tag: 'Espacio Individual',
      icon: Wallet,
      description:
        'Control de ingresos, gastos diarios, presupuestos mensuales y metas de ahorro con regla 50/30/20 y calculadora salarial de El Salvador.',
    },
    {
      id: 'emprendedor',
      title: 'Emprendedor & Comercio',
      tag: 'Control Interno & POS',
      icon: Store,
      description:
        'Terminal de cobro con lector de código de barras, control de inventario de stock, ventas ágiles y márgenes reales sin complejidad tributaria.',
    },
    {
      id: 'empresa_sin_dte',
      title: 'Empresa Tradicional',
      tag: 'Libros de IVA Físicos',
      icon: FileSpreadsheet,
      description:
        'Gestión contable formal con facturación impresa: Libros de IVA (Compras y Ventas CCF), planilla con descuentos ISSS/AFP y control de compras.',
    },
    {
      id: 'empresa_con_dte',
      title: 'Empresa con DTE',
      tag: 'Ministerio de Hacienda',
      icon: FileCheck2,
      description:
        'Emisión y transmisión de Documentos Tributarios Electrónicos (Factura y Crédito Fiscal), sellos de recepción, firma JSON y contabilidad NIIF.',
    },
  ];

  return (
    <div
      id="login-screen-wrapper"
      className="min-h-screen w-full bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col justify-between items-center p-4 sm:p-6 lg:p-8 relative selection:bg-teal-600 selection:text-white font-sans"
    >
      {/* Subtle geometric grid backdrop - calm and natural, no neon blobs */}
      <div className="absolute inset-0 bg-[radial-gradient(#E2E8F0_1px,transparent_1px)] dark:bg-[radial-gradient(#1E293B_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none opacity-60" />

      {/* Top Header */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between py-3.5 z-10 border-b border-[#E2E8F0] dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[8px] bg-[#0F766E] text-white flex items-center justify-center font-bold shadow-xs">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-base tracking-tight text-slate-900 dark:text-white">
                FinaPyme<span className="text-[#0F766E] dark:text-teal-400">.SV</span>
              </span>
              <span className="text-xs text-slate-500 hidden sm:inline">
                · Sistema Operativo & Financiero
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              El Salvador · Multitenant Seguro
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
          <Shield className="w-3.5 h-3.5 text-[#0F766E] dark:text-teal-400" />
          <span className="hidden sm:inline">Persistencia Segura en Firebase</span>
        </div>
      </header>

      {/* Center Section: Main Login or Register Card */}
      <main className="w-full max-w-md my-auto py-8 z-10">
        <div
          id="login-card"
          className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-[12px] p-6 sm:p-8 shadow-[0_4px_25px_-5px_rgba(15,23,42,0.06),0_1px_3px_rgba(15,23,42,0.04)] space-y-5"
        >
          {/* Segmented Mode Selector */}
          <div className="flex items-center p-1 bg-[#F1F5F9] dark:bg-slate-800/80 border border-[#E2E8F0] dark:border-slate-700/80 rounded-[8px]">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setError(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-[6px] transition-all cursor-pointer ${
                authMode === 'login'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setError(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-[6px] transition-all cursor-pointer ${
                authMode === 'register'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Registrar Cuenta
            </button>
          </div>

          <div className="text-left space-y-1">
            <h1 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
              {authMode === 'login' ? 'Acceder a tu Entorno' : 'Crear Nueva Cuenta'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {authMode === 'login'
                ? 'Ingresa tus credenciales autorizadas para continuar'
                : 'Configura tu negocio o finanzas personales con datos iniciales en cero'}
            </p>
          </div>

          {(error || authError) && (
            <div
              id="login-error-alert"
              className="p-3 rounded-[8px] bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2 animate-in fade-in"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
              <span>{error || authError}</span>
            </div>
          )}

          {authMode === 'login' ? (
            /* LOGIN FORM */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="login-email-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nombre@correo.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-[#F8FAFC] dark:bg-slate-950 border border-[#CBD5E1] dark:border-slate-700 rounded-[8px] text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="login-password-input"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 bg-[#F8FAFC] dark:bg-slate-950 border border-[#CBD5E1] dark:border-slate-700 rounded-[8px] text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] transition-all"
                    required
                  />
                  <button
                    type="button"
                    id="toggle-password-visibility-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                    title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                id="login-submit-btn"
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-[#0F766E] hover:bg-[#115E59] active:bg-[#134E4A] text-white font-semibold text-sm rounded-[8px] shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Ingresar</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
              <button type="button" className="w-full text-xs text-teal-700 dark:text-teal-400 py-2" onClick={async () => {
                if (!email.trim()) { setError('Escribe tu correo para restablecer la contraseña.'); return; }
                try { await resetPassword(email); setError('Si el correo tiene una cuenta, recibirás instrucciones para restablecer tu contraseña.'); }
                catch (error) { setError(error instanceof Error ? error.message : 'No se pudo enviar el correo.'); }
              }}>Restablecer contraseña</button>
              <p className="text-xs text-center text-slate-500">Si tu usuario no tiene un buzón de correo, pide al administrador que te asigne una nueva contraseña.</p>
            </form>
          ) : (
            /* REGISTRATION FORM */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <p className="text-xs text-slate-500">Puedes usar una dirección con formato de correo como usuario, aunque no tenga buzón. Con un correo real también podrás recuperar tu contraseña por email.</p>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Modalidad de Cuenta
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { id: 'emprendedor', label: 'Negocio Emprendedor', desc: 'Control Interno & POS' },
                    { id: 'empresa_sin_dte', label: 'Empresa sin DTE', desc: 'Control contable e impuestos' },
                    { id: 'empresa_dte', label: 'Negocio Empresa DTE', desc: 'Demostración, sin transmisión' },
                    { id: 'finanzas_personales', label: 'Finanzas Personales', desc: 'Solo Gastos Individuales' },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setRegAccountType(mode.id as any)}
                      className={`p-2.5 rounded-[8px] text-left border transition-all cursor-pointer ${
                        regAccountType === mode.id
                          ? 'border-[#0F766E] bg-teal-50 dark:bg-teal-950/40 text-slate-900 dark:text-white shadow-xs'
                          : 'border-[#E2E8F0] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-950/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      <p className="text-xs font-semibold leading-tight">{mode.label}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{mode.desc}</p>
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                  {regAccountType === 'finanzas_personales'
                    ? '★ Modo individual: Control exclusivo de gastos, presupuesto mensual y metas de ahorro personales.'
                    : '★ Modo empresarial: Gestión comercial con inventario, ventas y facturación.'}
                </p>
              </div>

              {regAccountType !== 'finanzas_personales' && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Nombre Comercial del Negocio
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                      <Store className="w-4 h-4" />
                    </div>
                    <input
                      id="register-business-input"
                      type="text"
                      value={regBusinessName}
                      onChange={(e) => setRegBusinessName(e.target.value)}
                      placeholder="Ej: Tienda San José, Pupusería El Centro"
                      className="w-full pl-9 pr-3 py-2 bg-[#F8FAFC] dark:bg-slate-950 border border-[#CBD5E1] dark:border-slate-700 rounded-[8px] text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Tu Nombre Completo
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="register-name-input"
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Ej: Carlos Hernández"
                    className="w-full pl-9 pr-3 py-2 bg-[#F8FAFC] dark:bg-slate-950 border border-[#CBD5E1] dark:border-slate-700 rounded-[8px] text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                      <Mail className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="correo@ejemplo.com"
                      className="w-full pl-8 pr-2.5 py-2 bg-[#F8FAFC] dark:bg-slate-950 border border-[#CBD5E1] dark:border-slate-700 rounded-[8px] text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                      <Phone className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+503 7000-0000"
                      className="w-full pl-8 pr-2.5 py-2 bg-[#F8FAFC] dark:bg-slate-950 border border-[#CBD5E1] dark:border-slate-700 rounded-[8px] text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Contraseña de Acceso
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="register-password-input"
                    type="password"
                    value={regPassword}
                    minLength={6}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full pl-9 pr-3 py-2 bg-[#F8FAFC] dark:bg-slate-950 border border-[#CBD5E1] dark:border-slate-700 rounded-[8px] text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-[#0F766E] hover:bg-[#115E59] active:bg-[#134E4A] text-white font-semibold text-xs rounded-[8px] shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Crear Mi Cuenta & Comenzar</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </main>

      {/* Description of Services Offered (Clean Editorial Cards in Minimalist Style) */}
      <section className="w-full max-w-5xl mx-auto py-5 z-10 border-t border-[#E2E8F0] dark:border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Modalidades del Sistema
          </h2>
          <span className="text-[11px] text-slate-500">
            Ambientes segregados por empresa y usuario
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {servicesList.map((svc) => {
            const Icon = svc.icon;
            return (
              <div
                key={svc.id}
                className="p-4 rounded-[8px] bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 shadow-none hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-[6px] bg-teal-50 dark:bg-teal-950/60 text-[#0F766E] dark:text-teal-400 flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      {svc.tag}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xs font-semibold text-slate-900 dark:text-white">
                      {svc.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {svc.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full max-w-5xl mx-auto pt-3 pb-2 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500 z-10 border-t border-[#E2E8F0] dark:border-slate-800">
        <div>
          FinaPyme ERP · República de El Salvador · UES FMOcc
        </div>
        <button
          type="button"
          onClick={() => setIsTermsOpen(true)}
          className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition underline cursor-pointer"
        >
          Términos de Servicio & Alcance
        </button>
      </footer>

      {/* Terms & Project Objectives Modal */}
      <FinaPymeTermsAndProjectModal
        isOpen={isTermsOpen}
        onClose={() => setIsTermsOpen(false)}
      />
    </div>
  );
};
