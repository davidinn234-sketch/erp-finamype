import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  Building2,
  ArrowRight,
  Wallet,
  Store,
  FileSpreadsheet,
  FileCheck2,
  Sparkles,
  CloudCheck,
  FileText,
} from 'lucide-react';
import { FinaPymeTermsAndProjectModal } from '../common/FinaPymeTermsAndProjectModal';

export const LoginScreen: React.FC = () => {
  const { login } = useERP();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
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
        setError(result.error || 'Credenciales inválidas.');
      }
    } catch (err) {
      setIsLoading(false);
      setError('Error al conectar con la base de datos.');
    }
  };

  const servicesList = [
    {
      id: 'personal',
      title: 'Finanzas Personales',
      badge: 'Portal Independiente',
      badgeColor: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
      icon: Wallet,
      iconColor: 'text-emerald-400',
      description:
        'Espacio 100% privado para finanzas individuales y familiares: control de ingresos, gastos diarios, presupuestos por categoría y metas de ahorro en El Salvador.',
    },
    {
      id: 'emprendedor',
      title: 'Para Emprendedor',
      badge: 'Control Interno',
      badgeColor: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
      icon: Store,
      iconColor: 'text-cyan-400',
      description:
        'Punto de venta (POS) ágil con lector de código de barras, control de inventario de stock, ventas rápidas y cálculo de margen de ganancia sin carga tributaria obligatoria.',
    },
    {
      id: 'empresa_sin_dte',
      title: 'Para Empresa Formal (Sin Facturación Electrónica)',
      badge: 'Tributario Tradicional',
      badgeColor: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
      icon: FileSpreadsheet,
      iconColor: 'text-amber-400',
      description:
        'Control contable y fiscal con facturación física: Libros de IVA (Compras y Ventas CF/CCF), retenciones y percepciones 1%, Planilla Legal SV (ISSS, AFP, Renta) y Kárdex.',
    },
    {
      id: 'empresa_con_dte',
      title: 'Para Empresa Formal (Con Facturación Electrónica)',
      badge: 'DTE Ministerio de Hacienda',
      badgeColor: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400',
      icon: FileCheck2,
      iconColor: 'text-indigo-400',
      description:
        'Emisión y transmisión directa de DTEs a Hacienda (Factura, Crédito Fiscal, Sujeto Excluido), sellos de recepción, firma JSON digital y contabilidad NIIF automatizada.',
    },
  ];

  return (
    <div
      id="login-screen-wrapper"
      className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-between items-center p-4 sm:p-6 lg:p-8 relative overflow-x-hidden"
    >
      {/* Subtle ambient lighting */}
      <div className="absolute -top-40 -right-40 w-[30rem] h-[30rem] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-[30rem] h-[30rem] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between py-2 z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="font-black text-lg tracking-tight text-white">
              FinaPyme<span className="text-indigo-400">.SV</span>
            </span>
            <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Cloud ERP para MYPES
            </span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Servidores Seguros & Base de Datos Firebase</span>
        </div>
      </header>

      {/* Center Section: Main Login Form Card */}
      <main className="w-full max-w-md my-auto py-8 z-10 space-y-6">
        <div
          id="login-card"
          className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-5"
        >
          <div className="text-center space-y-1.5 pb-2 border-b border-slate-800/80">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Iniciar Sesión
            </h1>
            <p className="text-xs text-slate-400">
              Ingresa tus credenciales para acceder a tu entorno autorizado
            </p>
          </div>

          {error && (
            <div
              id="login-error-alert"
              className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-fadeIn"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
              <div className="flex-1">
                <span className="font-semibold block mb-0.5">Acceso no completado</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
                  placeholder="davidinn234@gmail.com o tu correo"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Contraseña
                </label>
                <span className="text-[11px] text-slate-400">Clave: admin</span>
              </div>
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
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Ingresar a la Plataforma</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Clean hint for Master Admin */}
          <div className="pt-2 text-center text-xs text-slate-400">
            <span>¿Eres Administrador Maestro? Accede con </span>
            <span className="font-semibold text-indigo-300">davidinn234@gmail.com</span>
            <span> y tu contraseña para gestionar cuentas de tus clientes y amigos.</span>
          </div>
        </div>
      </main>

      {/* Description of Services Offered (Clean Catalog) */}
      <section className="w-full max-w-5xl mx-auto py-6 z-10 border-t border-slate-800/80">
        <div className="text-center mb-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            Nuestros 4 Servicios & Modalidades Especializadas
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cada cuenta se crea con su perfil predeterminado y protegido según la necesidad exacta del usuario
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {servicesList.map((svc) => {
            const Icon = svc.icon;
            return (
              <div
                key={svc.id}
                className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-lg bg-slate-800/80 ${svc.iconColor}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${svc.badgeColor}`}>
                      {svc.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {svc.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
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
          FinaPyme ERP • República de El Salvador • Desarrollado con Metodología Lean Startup (UES FMOcc)
        </div>
        <button
          type="button"
          onClick={() => setIsTermsOpen(true)}
          className="text-indigo-400 hover:text-indigo-300 underline font-semibold flex items-center gap-1 cursor-pointer"
        >
          <FileText className="w-3 h-3" />
          <span>Términos, Condiciones & Proyecto UES</span>
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
