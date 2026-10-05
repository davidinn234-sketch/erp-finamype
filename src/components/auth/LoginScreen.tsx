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
  const { login, createCompanyWithAdmin, createUser } = useERP();
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
    'emprendedor' | 'empresa_dte' | 'finanzas_personales'
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
        createUser({
          name: regName.trim(),
          email: regEmail.trim().toLowerCase(),
          password: regPassword.trim(),
          phone: regPhone.trim() || undefined,
          role: 'gerente',
          systemArchetype: 'finanzas_personales',
          isConfigured: true,
          createdAt: new Date().toISOString().split('T')[0],
          storedInCloud: true,
        });

        // Automatically log in
        await login(regEmail.trim().toLowerCase(), regPassword.trim());
      } else {
        // Business account (Emprendedor or Empresa DTE)
        const businessTitle = regBusinessName.trim() || `Negocio de ${regName.trim()}`;
        const isDte = regAccountType === 'empresa_dte';

        await createCompanyWithAdmin(
          {
            name: businessTitle,
            tradeName: businessTitle,
            nit: '0614-010190-101-1',
            nrc: isDte ? '280192-3' : '',
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
            regimeType: isDte ? 'general_tributario' : 'emprendedor_control_interno',
            systemArchetype: isDte ? 'empresa_consolidada_dte' : 'emprendedor_control_interno',
            dteActive: isDte,
            dteEnvironment: 'pruebas',
            inventoryMethod: 'costo_promedio',
            taxesConfig: {
              declaIva: isDte,
              declaPagoCuenta: isDte,
              declaImpuestosMunicipales: true,
              municipalRateOrFee: 15.0,
              alcaldiaName: 'Alcaldía Municipal de San Salvador Centro',
            },
          },
          {
            name: regName.trim(),
            email: regEmail.trim().toLowerCase(),
            password: regPassword.trim(),
            phone: regPhone.trim(),
          }
        );

        // Automatically log in
        await login(regEmail.trim().toLowerCase(), regPassword.trim());
      }
      setIsLoading(false);
    } catch {
      setIsLoading(false);
      setError('Error al crear la cuenta. Por favor intente nuevamente.');
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
      className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-between items-center p-4 sm:p-6 lg:p-8 relative selection:bg-indigo-500 selection:text-white"
    >
      {/* Subtle ambient lighting */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between py-3 z-10 border-b border-slate-900">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 text-indigo-400 flex items-center justify-center font-bold shadow-xs">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-white">
                FinaPyme<span className="text-indigo-400">.SV</span>
              </span>
              <span className="text-xs text-slate-500 hidden sm:inline">
                · Sistema Operativo & Financiero
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              El Salvador · Multitenant Seguro
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Persistencia Segura en Firebase</span>
        </div>
      </header>

      {/* Center Section: Main Login or Register Card */}
      <main className="w-full max-w-md my-auto py-8 z-10">
        <div
          id="login-card"
          className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-5"
        >
          {/* Segmented Mode Selector */}
          <div className="flex items-center p-1 bg-slate-950/80 border border-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setError(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                authMode === 'login'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
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
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                authMode === 'register'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Registrar Cuenta
            </button>
          </div>

          <div className="text-left space-y-1">
            <h1 className="text-lg font-bold tracking-tight text-white">
              {authMode === 'login' ? 'Acceder a tu Entorno' : 'Crear Nueva Cuenta'}
            </h1>
            <p className="text-xs text-slate-400">
              {authMode === 'login'
                ? 'Ingresa tus credenciales autorizadas para continuar'
                : 'Configura tu negocio o finanzas personales con datos iniciales en cero'}
            </p>
          </div>

          {error && (
            <div
              id="login-error-alert"
              className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2 animate-in fade-in"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {authMode === 'login' ? (
            /* LOGIN FORM */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="login-email-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nombre@correo.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="login-password-input"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    required
                  />
                  <button
                    type="button"
                    id="toggle-password-visibility-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
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
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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
            </form>
          ) : (
            /* REGISTRATION FORM */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Modalidad de Cuenta
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'emprendedor', label: 'Negocio Emprendedor', desc: 'Control Interno & POS' },
                    { id: 'empresa_dte', label: 'Negocio Empresa DTE', desc: 'Facturación Hacienda' },
                    { id: 'finanzas_personales', label: 'Finanzas Personales', desc: 'Solo Gastos Individuales' },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setRegAccountType(mode.id as any)}
                      className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                        regAccountType === mode.id
                          ? 'border-indigo-500 bg-indigo-500/10 text-white shadow-xs'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <p className="text-xs font-bold leading-tight">{mode.label}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{mode.desc}</p>
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                  {regAccountType === 'finanzas_personales'
                    ? '★ Modo individual: Control exclusivo de gastos, presupuesto mensual y metas de ahorro personales (sin módulos de empresa).'
                    : '★ Modo empresarial: Gestión comercial con inventario, ventas y facturación (las finanzas personales no se mezclarán con tu empresa).'}
                </p>
              </div>

              {regAccountType !== 'finanzas_personales' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Nombre Comercial del Negocio
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Store className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={regBusinessName}
                      onChange={(e) => setRegBusinessName(e.target.value)}
                      placeholder="Ej: Tienda San José, Pupusería El Centro"
                      className="w-full pl-9 pr-3 py-2 bg-slate-950/70 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Tu Nombre Completo
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Ej: Carlos Hernández"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950/70 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Mail className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="correo@ejemplo.com"
                      className="w-full pl-8 pr-2.5 py-2 bg-slate-950/70 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Phone className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+503 7000-0000"
                      className="w-full pl-8 pr-2.5 py-2 bg-slate-950/70 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Contraseña de Acceso
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950/70 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
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

      {/* Description of Services Offered (Clean Editorial Typography - No Candy Pills) */}
      <section className="w-full max-w-5xl mx-auto py-5 z-10 border-t border-slate-900">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
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
                className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-indigo-400" />
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {svc.tag}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-white">
                      {svc.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
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
      <footer className="w-full max-w-5xl mx-auto pt-3 pb-2 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500 z-10 border-t border-slate-900">
        <div>
          FinaPyme ERP · República de El Salvador · UES FMOcc
        </div>
        <button
          type="button"
          onClick={() => setIsTermsOpen(true)}
          className="text-slate-400 hover:text-slate-200 transition underline cursor-pointer"
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
