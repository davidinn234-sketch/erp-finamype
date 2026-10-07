import React, { useState, useEffect } from 'react';
import { useERP } from '../../context/ERPContext';
import { db, testFirebaseConnection } from '../../lib/firebase';
import { collection, doc, setDoc, getDocs } from 'firebase/firestore';
import { UserProfile, SystemArchetype, UserRole, Company, Branch } from '../../types';
import { DEFAULT_FISCAL_CONFIG } from '../../utils/salvadoranTax';
import { AccessCredentialsDialog } from './UserAccessControls';
import {
  Cloud,
  CheckCircle2,
  AlertCircle,
  UserPlus,
  Lock,
  Mail,
  User,
  Building2,
  Wallet,
  Store,
  Briefcase,
  Copy,
  Check,
  X,
  Sparkles,
  Shield,
  Phone,
  Layers,
  ArrowRight,
  Database,
  RefreshCw,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const CloudUserManagerModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const {
    users,
    createUser,
    login,
    setCurrentUserId,
    setActiveModule,
    addNotification,
    currentCompany,
    createCompanyWithAdmin,
    enterSupportMode,
  } = useERP();

  // Cloud status
  const [isCloudOnline, setIsCloudOnline] = useState<boolean | null>(null);
  const [isTestingCloud, setIsTestingCloud] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [accountType, setAccountType] = useState<'emprendedor' | 'consolidada' | 'finanzas_personales'>('emprendedor');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('123456');
  const [createdAccess, setCreatedAccess] = useState<{ name: string; email: string; password: string } | null>(null);
  const [phone, setPhone] = useState('');
  const [dui, setDui] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessGiro, setBusinessGiro] = useState('');
  const [businessRole, setBusinessRole] = useState<UserRole>('gerente');

  // Copy feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Check connection on modal open
  useEffect(() => {
    if (isOpen) {
      checkConnection();
    }
  }, [isOpen]);

  const checkConnection = async () => {
    setIsTestingCloud(true);
    const ok = await testFirebaseConnection();
    setIsCloudOnline(ok);
    setIsTestingCloud(false);
  };

  if (!isOpen) return null;

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      addNotification('error', 'Campos Incompletos', 'Por favor complete nombre y correo.');
      return;
    }

    setIsSaving(true);
    const userId = `usr_cloud_${Date.now()}`;
    let archetype: SystemArchetype = 'finanzas_personales';
    let role: UserRole = 'admin_maestro';

    if (accountType === 'finanzas_personales') {
      archetype = 'finanzas_personales';
      role = 'admin_maestro';
    } else if (accountType === 'emprendedor') {
      archetype = 'emprendedor_control_interno';
      role = businessRole;
    } else {
      archetype = 'empresa_consolidada_dte';
      role = businessRole;
    }

    const compId = `comp_${Date.now()}`;
    const cleanBizName = businessName.trim() || `${name.trim()} Negocios`;

    // 1. Crear empresa dedicada para la nueva cuenta
    const newComp: Company = {
      id: compId,
      name: cleanBizName,
      tradeName: cleanBizName,
      nit: '0614-010190-001-0',
      nrc: '000000-0',
      giro: businessGiro.trim() || (accountType === 'finanzas_personales' ? 'Finanzas Personales' : 'Comercial y Servicios'),
      address: 'San Salvador, El Salvador',
      department: 'San Salvador',
      municipality: 'San Salvador Centro',
      phone: phone.trim() || '+503 7000-0000',
      email: email.trim().toLowerCase(),
      isGranContribuyente: false,
      currency: 'USD',
      fiscalYear: 2026,
      fiscalConfig: { ...DEFAULT_FISCAL_CONFIG },
      systemArchetype: archetype,
      primaryAdminUserId: userId,
      createdAt: new Date().toISOString().split('T')[0],
    };

    // 2. Crear sucursal propia para la empresa
    const initialBranch: Branch = {
      id: `branch_${Date.now()}`,
      companyId: compId,
      code: 'SUC-01',
      name: 'Casa Matriz - Sede Central',
      address: newComp.address,
      department: 'San Salvador',
      municipality: 'San Salvador Centro',
      phone: newComp.phone,
      managerName: name.trim(),
      isMain: true,
      isActive: true,
    };

    const newUser: UserProfile = {
      id: userId,
      companyId: compId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role,
      systemArchetype: archetype,
      phone: phone.trim() || '+503 7000-0000',
      dui: dui.trim() || '00000000-0',
      jobTitle:
        accountType === 'finanzas_personales'
          ? 'Cuenta de Finanzas Personales'
          : businessRole === 'cajero'
          ? 'Cajero / Punto de Venta'
          : businessRole === 'contador'
          ? 'Contador General'
          : 'Director de Negocio',
      department: 'San Salvador',
      municipality: 'San Salvador',
      isConfigured: false, // Disparará el Gran Formulario de Sucursales en el primer login
      createdAt: new Date().toISOString().split('T')[0],
      storedInCloud: true,
    };

    try {
      if (accountType === 'finanzas_personales') {
        const { companyId, id, ...personal } = newUser;
        await createUser({ ...personal, role: 'gerente', isConfigured: true });
      } else {
        const { id, primaryAdminUserId, ...company } = newComp;
        await createCompanyWithAdmin(company, { name: name.trim(), email, password, phone });
      }
      setCreatedAccess({ name: name.trim(), email: email.trim().toLowerCase(), password });
      setName(''); setEmail(''); setPassword(''); setPhone(''); setDui(''); setBusinessName(''); setBusinessGiro('');
    } catch (error) {
      addNotification('error', 'No se creó la cuenta', error instanceof Error ? error.message : 'Comprueba la conexión.');
    } finally { setIsSaving(false); }
  };

  const copyCredentials = (u: UserProfile) => {
    const text = `¡Hola ${u.name}! Aquí tienes tu acceso para FINAMIPE SV:
🌐 Plataforma: ${window.location.origin}
📧 Usuario: ${u.email}
🔑 Contraseña: ${'Protegida por Firebase'}
📌 Tipo de Cuenta: ${
      u.systemArchetype === 'finanzas_personales'
        ? 'Finanzas Personales (Portal Independiente)'
        : u.systemArchetype === 'emprendedor_control_interno'
        ? 'Empresa Emprendedor (Control Interno & POS)'
        : 'Empresa Consolidada (DTE MH & Facturación)'
    }`;

    navigator.clipboard.writeText(text);
    setCopiedId(u.id);
    setTimeout(() => setCopiedId(null), 2500);
    addNotification('info', 'Copiado al Portapapeles', 'Datos de acceso listos para enviar por WhatsApp o Correo.');
  };

  const testLoginAsUser = (u: UserProfile) => {
    if (u.companyId) { enterSupportMode(u.companyId); onClose(); }
    else addNotification('info', 'Finanzas privadas', 'Las finanzas personales solo son accesibles por su propietario.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <AccessCredentialsDialog access={createdAccess} onClose={() => setCreatedAccess(null)} />
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-3xl w-full flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <Cloud className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  Gestión de Cuentas Cloud & Amigos
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 text-[10px] font-bold border border-emerald-400/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Firebase Firestore
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-0.5">
                Crea cuentas en la nube para tus amigos o clientes con perfiles predeterminados y separados.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Cloud Connectivity Status Bar */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-500" />
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Estado Base de Datos Cloud:
              </span>
              {isTestingCloud ? (
                <span className="text-slate-400 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin" /> Verificando...
                </span>
              ) : isCloudOnline ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Conectado a Firestore (alien-phoenix-4lcf1)
                </span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Aprovisionado y Listo
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={checkConnection}
              className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              Comprobar Ping
            </button>
          </div>

          {/* Form to Create New Account */}
          <form onSubmit={handleCreateAccount} className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-indigo-600" />
              Crear Nueva Cuenta Preconfigurada
            </h3>

            {/* Step 1: Type of Account Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                1. Selecciona el Tipo de Cuenta (Predeterminado & Aislado):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* Empresa Emprendedor */}
                <button
                  type="button"
                  onClick={() => setAccountType('emprendedor')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    accountType === 'emprendedor'
                      ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 shadow-sm ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="p-1.5 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300">
                        <Store className="w-4 h-4" />
                      </span>
                      {accountType === 'emprendedor' && (
                        <Check className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                    <p className="text-xs font-black text-slate-900 dark:text-white">
                      Negocio Emprendedor
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                      Comercio, tienda o servicios. Control interno, inventario con lector de barras y caja POS.
                    </p>
                  </div>
                  <span className="mt-2 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                    Control Interno POS
                  </span>
                </button>

                {/* Empresa Consolidada DTE */}
                <button
                  type="button"
                  onClick={() => setAccountType('consolidada')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    accountType === 'consolidada'
                      ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 shadow-sm ring-2 ring-indigo-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="p-1.5 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300">
                        <Building2 className="w-4 h-4" />
                      </span>
                      {accountType === 'consolidada' && (
                        <Check className="w-4 h-4 text-indigo-600" />
                      )}
                    </div>
                    <p className="text-xs font-black text-slate-900 dark:text-white">
                      Empresa Formal (DTE)
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                      PyME formal con IVA 13%, DTE ante Ministerio de Hacienda, CCF, retenciones y libros contables.
                    </p>
                  </div>
                  <span className="mt-2 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                    DTE MH Oficial
                  </span>
                </button>

                {/* Finanzas Personales (Aparte) */}
                <button
                  type="button"
                  onClick={() => setAccountType('finanzas_personales')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    accountType === 'finanzas_personales'
                      ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 shadow-sm ring-2 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="p-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300">
                        <Wallet className="w-4 h-4" />
                      </span>
                      {accountType === 'finanzas_personales' && (
                        <Check className="w-4 h-4 text-emerald-600" />
                      )}
                    </div>
                    <p className="text-xs font-black text-slate-900 dark:text-white">
                      Finanzas Personales
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                      Exclusivo individual. Control de gastos personales, ahorro y calculadora de salario neto SV.
                    </p>
                  </div>
                  <span className="mt-2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    Espacio Individual
                  </span>
                </button>
              </div>
            </div>

            {/* Step 2: User Details */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300 block">
                2. Datos de la Persona / Amigo:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Nombre Completo:
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Juan Antonio Pérez"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/30 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Correo Electrónico (Login):
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="amigo@correo.com"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/30 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Contraseña Inicial:
                  </label>
                  <input
                    type="text"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="123456"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-indigo-500/30 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Teléfono / WhatsApp:
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+503 7000-0000"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/30 outline-none"
                  />
                </div>

                {accountType !== 'finanzas_personales' && (
                  <>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                        Nombre del Negocio / Empresa:
                      </label>
                      <input
                        type="text"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="Ej. Tienda & Variedades Santa Tecla"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/30 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                        Rol asignado en el negocio:
                      </label>
                      <select
                        value={businessRole}
                        onChange={(e) => setBusinessRole(e.target.value as UserRole)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/30 outline-none"
                      >
                        <option value="gerente">Gerente de Operaciones</option>
                        <option value="cajero">Cajero (Punto de Venta POS)</option>
                        <option value="contador">Contador General</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Cloud className="w-4 h-4" />
              <span>
                {isSaving ? 'Guardando en Firebase Firestore...' : 'Guardar y Crear Cuenta en la Nube (Firebase)'}
              </span>
            </button>
          </form>

          {/* List of Registered Accounts */}
          <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                Cuentas Disponibles en la Plataforma ({users.length})
              </h4>
              <span className="text-[11px] text-slate-400">
                Listas para Iniciar Sesión
              </span>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {users.map((u) => {
                const isPersonal = u.systemArchetype === 'finanzas_personales';
                const isEmprendedor = u.systemArchetype === 'emprendedor_control_interno';

                return (
                  <div
                    key={u.id}
                    className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:border-slate-300 transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 ${
                          isPersonal
                            ? 'bg-emerald-600'
                            : isEmprendedor
                            ? 'bg-blue-600'
                            : 'bg-indigo-600'
                        }`}
                      >
                        {isPersonal ? (
                          <Wallet className="w-4 h-4" />
                        ) : isEmprendedor ? (
                          <Store className="w-4 h-4" />
                        ) : (
                          <Building2 className="w-4 h-4" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-900 dark:text-white">{u.name}</p>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-black ${
                              isPersonal
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : isEmprendedor
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                            }`}
                          >
                            {isPersonal
                              ? 'Finanzas Personales'
                              : isEmprendedor
                              ? 'Emprendedor'
                              : 'Empresa DTE'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono">
                          {u.email} • Clave: <span className="font-bold text-slate-600 dark:text-slate-300">{'Protegida por Firebase'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => copyCredentials(u)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 text-[11px] font-semibold transition flex items-center gap-1 cursor-pointer"
                        title="Copiar mensaje de acceso para enviar al amigo"
                      >
                        {copiedId === u.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-500" />
                            <span className="text-emerald-600">Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-slate-400" />
                            <span>Copiar Datos</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => testLoginAsUser(u)}
                        className="px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                        title="Iniciar sesión inmediatamente con esta cuenta para probarla"
                      >
                        <span>Probar</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs"
          >
            Cerrar Ventana
          </button>
        </div>
      </div>
    </div>
  );
};
