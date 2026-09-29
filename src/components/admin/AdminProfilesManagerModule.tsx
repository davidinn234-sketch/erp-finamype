import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { db } from '../../lib/firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { UserProfile, SystemArchetype, UserRole, Company, Branch } from '../../types';
import { DEFAULT_FISCAL_CONFIG } from '../../utils/salvadoranTax';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Cloud,
  CheckCircle2,
  Key,
  Mail,
  User,
  Phone,
  Store,
  Wallet,
  FileSpreadsheet,
  FileCheck2,
  ScanBarcode,
  Copy,
  Check,
  ExternalLink,
  Trash2,
  Edit3,
  Sliders,
  Sparkles,
  Lock,
  Eye,
  EyeOff,
  Building2,
  Search,
  Filter,
} from 'lucide-react';

const AVAILABLE_SERVICES = [
  { id: 'pos_terminal', name: 'Terminal POS & Código de Barras', description: 'Venta rápida con escáner de barras' },
  { id: 'inventory', name: 'Control de Inventario & Kárdex', description: 'Stock de productos, existencias y costos' },
  { id: 'sales_crm', name: 'CRM, Ventas & Clientes', description: 'Gestión de clientes y cuentas por cobrar' },
  { id: 'purchases', name: 'Compras & Proveedores', description: 'Registro de gastos, compras y cuentas por pagar' },
  { id: 'payroll', name: 'Planilla Legal SV (ISSS, AFP, Renta)', description: 'Cálculo de retenciones laborales de ley' },
  { id: 'treasury', name: 'Tesorería & Bancos de El Salvador', description: 'Cuentas bancarias y conciliación' },
  { id: 'accounting', name: 'Contabilidad NIIF & Catálogo', description: 'Partidas contables y estados financieros' },
  { id: 'iva_books', name: 'Libros de IVA Oficiales', description: 'Libro de Compras y Libro de Ventas' },
  { id: 'dte_hacienda', name: 'DTE Ministerio de Hacienda', description: 'Facturación electrónica, JSON y transmisión' },
  { id: 'forecasting', name: 'Pronósticos & Copiloto AI', description: 'Proyecciones de ventas y break-even' },
];

export const AdminProfilesManagerModule: React.FC = () => {
  const { users, createUser, deleteUser, updateUser, login, addNotification, currentUser, createCompany, createBranch } = useERP();

  // Form State for New User
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('123456');
  const [phone, setPhone] = useState('');
  const [selectedArchetype, setSelectedArchetype] = useState<SystemArchetype>('emprendedor_control_interno');
  const [selectedRole, setSelectedRole] = useState<UserRole>('gerente');
  const [selectedServices, setSelectedServices] = useState<string[]>([
    'pos_terminal',
    'inventory',
    'sales_crm',
    'purchases',
    'payroll',
    'treasury',
    'accounting',
    'iva_books',
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [archetypeFilter, setArchetypeFilter] = useState<string>('all');
  const [copiedUserId, setCopiedUserId] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Sync archetype changes to default services
  const handleArchetypeSelect = (arch: SystemArchetype) => {
    setSelectedArchetype(arch);
    if (arch === 'finanzas_personales') {
      setSelectedRole('gerente');
      setSelectedServices(['personal_finances']);
    } else if (arch === 'emprendedor_control_interno') {
      setSelectedRole('gerente');
      setSelectedServices(['pos_terminal', 'inventory', 'sales_crm', 'purchases', 'payroll', 'treasury', 'accounting', 'iva_books']);
    } else if (arch === 'negocio_transicion') {
      setSelectedRole('admin_maestro');
      setSelectedServices(['inventory', 'sales_crm', 'purchases', 'payroll', 'treasury', 'accounting', 'iva_books']);
    } else if (arch === 'empresa_consolidada_dte') {
      setSelectedRole('admin_maestro');
      setSelectedServices([
        'pos_terminal',
        'inventory',
        'sales_crm',
        'purchases',
        'payroll',
        'treasury',
        'accounting',
        'iva_books',
        'dte_hacienda',
        'forecasting',
      ]);
    }
  };

  const toggleService = (serviceId: string) => {
    if (selectedServices.includes(serviceId)) {
      setSelectedServices(selectedServices.filter((s) => s !== serviceId));
    } else {
      setSelectedServices([...selectedServices, serviceId]);
    }
  };

  const handleGeneratePassword = () => {
    const randomPass = Math.random().toString(36).slice(-6);
    setPassword(randomPass);
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      addNotification('error', 'Campos Incompletos', 'Por favor completa el nombre, correo y contraseña.');
      return;
    }

    setIsSaving(true);
    const userId = `usr_${Date.now()}`;
    const companyId = `comp_${Date.now()}`;

    // 1. Crear empresa independiente aislada para esta cuenta
    const newCompany: Company = {
      id: companyId,
      name: name.trim() ? `${name.trim()} - Empresa` : 'Mi Empresa',
      tradeName: name.trim() ? `${name.trim()} Negocios` : 'Mi Negocio',
      nit: '0614-010190-001-0',
      nrc: '000000-0',
      giro: selectedArchetype === 'finanzas_personales' ? 'Finanzas Personales y Control Doméstico' : 'Comercial y Servicios',
      address: 'San Salvador, El Salvador',
      department: 'San Salvador',
      municipality: 'San Salvador Centro',
      phone: phone.trim() || '+503 7000-0000',
      email: email.trim().toLowerCase(),
      isGranContribuyente: false,
      currency: 'USD',
      fiscalYear: 2026,
      fiscalConfig: { ...DEFAULT_FISCAL_CONFIG },
      systemArchetype: selectedArchetype,
      primaryAdminUserId: userId,
      createdAt: new Date().toISOString().split('T')[0],
    };

    // 2. Crear sucursal inicial propia (Casa Matriz) para la cuenta
    const initialBranch: Branch = {
      id: `branch_${Date.now()}`,
      companyId: companyId,
      code: 'SUC-01',
      name: 'Casa Matriz - Sede Central',
      address: newCompany.address,
      department: 'San Salvador',
      municipality: 'San Salvador Centro',
      phone: newCompany.phone,
      managerName: name.trim(),
      isMain: true,
      isActive: true,
    };

    // 3. Crear el perfil de usuario con isConfigured: false para que al entrar por primera vez llene el Gran Formulario
    const newProfile: UserProfile = {
      id: userId,
      companyId: companyId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: password.trim(),
      phone: phone.trim() || undefined,
      role: selectedArchetype === 'finanzas_personales' ? 'gerente' : selectedRole,
      systemArchetype: selectedArchetype,
      enabledServices: selectedServices,
      createdAt: new Date().toISOString().split('T')[0],
      isConfigured: false, // Disparará el Gran Formulario de Sucursales y Empresa en su primer inicio de sesión
      storedInCloud: true,
    };

    try {
      // Guardar en Firestore
      await setDoc(doc(db, 'companies', companyId), newCompany);
      await setDoc(doc(db, 'branches', initialBranch.id), initialBranch);
      await setDoc(doc(db, 'users', userId), newProfile);

      // Guardar en contexto local
      createCompany(newCompany);
      createBranch(initialBranch);
      createUser(newProfile);

      addNotification(
        'success',
        '¡Perfil y Empresa Creados en Firebase!',
        `La cuenta ${newProfile.name} está lista. Al iniciar sesión por primera vez, completará su formulario de sucursales.`
      );

      // Reset form
      setName('');
      setEmail('');
      setPhone('');
      setPassword('123456');
    } catch (err: any) {
      console.error('Firebase save error:', err);
      // Fallback local save
      createCompany(newCompany);
      createBranch(initialBranch);
      createUser(newProfile);
      addNotification('warning', 'Guardado Localmente', 'La cuenta y empresa se guardaron de inmediato en memoria.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyCredentials = (u: UserProfile) => {
    const serviceName =
      u.systemArchetype === 'finanzas_personales'
        ? 'Finanzas Personales (Portal Aislado)'
        : u.systemArchetype === 'emprendedor_control_interno'
        ? 'Modalidad Emprendedor (Control Interno & POS)'
        : u.systemArchetype === 'negocio_transicion'
        ? 'Empresa Formal sin DTE (Libros de IVA & Planilla)'
        : 'Empresa Formal con Facturación Electrónica DTE MH';

    const text = `👋 ¡Hola ${u.name}! Ya está creada tu cuenta en FINAMIPE SV:\n\n🌐 Plataforma: https://ais-dev-zt5ox4j3ww7wbwalmkdubu-128537300182.us-east1.run.app\n📧 Correo: ${u.email}\n🔑 Contraseña: ${u.password || 'admin'}\n📦 Servicio Activado: ${serviceName}\n\n¡Cualquier duda quedo a la orden!`;

    navigator.clipboard.writeText(text);
    setCopiedUserId(u.id);
    setTimeout(() => setCopiedUserId(null), 2500);
    addNotification('info', 'Credenciales Copiadas', 'Mensaje listo para enviar por WhatsApp o correo.');
  };

  const handleTestLogin = (u: UserProfile) => {
    login(u.email, u.password || 'admin');
  };

  const handleDeleteUser = async (u: UserProfile) => {
    if (u.id === currentUser.id || u.email === 'davidinn234@gmail.com') {
      addNotification('error', 'Acción Denegada', 'No puedes eliminar tu propia cuenta de Administrador Maestro.');
      return;
    }
    if (window.confirm(`¿Estás seguro de eliminar el perfil de ${u.name} (${u.email})?`)) {
      try {
        await deleteDoc(doc(db, 'users', u.id));
      } catch (e) {}
      deleteUser(u.id);
      addNotification('info', 'Usuario Eliminado', `El perfil de ${u.name} fue removido.`);
    }
  };

  // Filtered list
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesArchetype =
      archetypeFilter === 'all' || u.systemArchetype === archetypeFilter;
    return matchesSearch && matchesArchetype;
  });

  return (
    <div id="admin-profiles-manager" className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Panel de Super Administrador Maestro</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Gestión de Cuentas & Servicios en la Nube
            </h1>
            <p className="text-sm text-indigo-200/80 max-w-2xl leading-relaxed">
              Crea perfiles independientes para tus amigos y clientes seleccionando la modalidad exacta y los servicios que desees activar. Todos los accesos se sincronizan con Firebase Firestore.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700/80 text-xs">
              <Cloud className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-300">Firebase Firestore:</span>
              <span className="font-mono text-emerald-400 font-bold">Activo</span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              Admin: davidinn234@gmail.com
            </span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-indigo-800/40">
          <div className="bg-slate-900/60 rounded-xl p-3 border border-indigo-900/40">
            <span className="text-xs text-indigo-300/80 block">Total Usuarios</span>
            <span className="text-xl font-black text-white">{users.length}</span>
          </div>
          <div className="bg-slate-900/60 rounded-xl p-3 border border-indigo-900/40">
            <span className="text-xs text-emerald-300/80 block">Finanzas Personales</span>
            <span className="text-xl font-black text-emerald-400">
              {users.filter((u) => u.systemArchetype === 'finanzas_personales').length}
            </span>
          </div>
          <div className="bg-slate-900/60 rounded-xl p-3 border border-indigo-900/40">
            <span className="text-xs text-cyan-300/80 block">Emprendedores</span>
            <span className="text-xl font-black text-cyan-400">
              {users.filter((u) => u.systemArchetype === 'emprendedor_control_interno').length}
            </span>
          </div>
          <div className="bg-slate-900/60 rounded-xl p-3 border border-indigo-900/40">
            <span className="text-xs text-blue-300/80 block">Empresas Formales</span>
            <span className="text-xl font-black text-blue-400">
              {users.filter((u) => u.systemArchetype === 'empresa_consolidada_dte' || u.systemArchetype === 'negocio_transicion').length}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Account Creator Form + Accounts List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Creator Form (Left Column: 5 cols) */}
        <div className="lg:col-span-5">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm sticky top-6 space-y-6">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <UserPlus className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Crear Nuevo Perfil
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Configura el tipo de cuenta y los servicios incluidos
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateProfile} className="space-y-4">
              {/* Account Basic Info */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre del Titular o Empresa *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Juan Pérez o Pupusería Las Gemelas"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Correo Electrónico (Usuario para iniciar sesión) *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="amigo@correo.com"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Contraseña *
                    </label>
                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                    >
                      Generar
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                      <Key className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="text"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-8 pr-2 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    WhatsApp (Opcional)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+503 7000-0000"
                      className="w-full pl-8 pr-2 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Step 2: The 4 Core Service Archetypes */}
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Selecciona la Modalidad Principal:
                </label>

                <div className="space-y-2">
                  {/* 1. Finanzas Personales */}
                  <label
                    onClick={() => handleArchetypeSelect('finanzas_personales')}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedArchetype === 'finanzas_personales'
                        ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="mt-0.5 p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          Finanzas Personales
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                          Aislado
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Portal privado: Ingresos, gastos diarios, presupuesto y metas de ahorro. No incluye ventas ni impuestos empresariales.
                      </p>
                    </div>
                  </label>

                  {/* 2. Para Emprendedor */}
                  <label
                    onClick={() => handleArchetypeSelect('emprendedor_control_interno')}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedArchetype === 'emprendedor_control_interno'
                        ? 'border-cyan-500 bg-cyan-50/60 dark:bg-cyan-950/40 ring-2 ring-cyan-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="mt-0.5 p-1.5 rounded-lg bg-cyan-100 dark:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300">
                      <Store className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          Para Emprendedor
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-cyan-100 dark:bg-cyan-900/60 text-cyan-800 dark:text-cyan-300">
                          Control Interno
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        POS con lector de código de barras, inventario rápido y margen de utilidad. Sin tramitología tributaria.
                      </p>
                    </div>
                  </label>

                  {/* 3. Para Empresa Formal sin Facturación Electrónica */}
                  <label
                    onClick={() => handleArchetypeSelect('negocio_transicion')}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedArchetype === 'negocio_transicion'
                        ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/40 ring-2 ring-amber-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="mt-0.5 p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          Empresa Formal (Sin DTE)
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">
                          Físico / Libros
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Facturas físicas, Libros de IVA oficiales (Compras y Ventas CF/CCF), planilla de ley ISSS/AFP y contabilidad NIIF.
                      </p>
                    </div>
                  </label>

                  {/* 4. Para Empresa Formal con Facturación Electrónica */}
                  <label
                    onClick={() => handleArchetypeSelect('empresa_consolidada_dte')}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedArchetype === 'empresa_consolidada_dte'
                        ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="mt-0.5 p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                      <FileCheck2 className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          Empresa Formal (Con DTE MH)
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300">
                          Hacienda 100%
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Transmisión directa de DTEs a Hacienda (JSON firmado), sellos oficiales, IVA y suite contable-financiera completa.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Step 3: Granular Service Checkboxes */}
              {selectedArchetype !== 'finanzas_personales' && (
                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      Servicios Personalizados Específicos:
                    </label>
                    <span className="text-[10px] text-slate-500">
                      {selectedServices.length} activos
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
                    {AVAILABLE_SERVICES.map((svc) => {
                      const isChecked = selectedServices.includes(svc.id);
                      return (
                        <button
                          type="button"
                          key={svc.id}
                          onClick={() => toggleService(svc.id)}
                          className={`p-2 rounded-lg border text-left text-xs transition cursor-pointer flex items-center justify-between ${
                            isChecked
                              ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700 text-indigo-900 dark:text-indigo-200 font-semibold'
                              : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                          }`}
                        >
                          <span className="truncate pr-1 text-[11px]">{svc.name}</span>
                          <div
                            className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                              isChecked
                                ? 'bg-indigo-600 border-indigo-600 text-white'
                                : 'border-slate-400'
                            }`}
                          >
                            {isChecked && <Check className="w-2.5 h-2.5" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Cloud className="w-4 h-4" />
                    <span>Crear y Guardar Perfil en Firebase</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Existing Accounts & Cloud Directory (Right Column: 7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Directorio de Perfiles ({filteredUsers.length})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Administra los accesos y servicios otorgados a tus amigos y clientes
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o correo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg w-48 sm:w-56 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <select
                value={archetypeFilter}
                onChange={(e) => setArchetypeFilter(e.target.value)}
                className="text-xs py-1.5 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none"
              >
                <option value="all">Todas las Modalidades</option>
                <option value="finanzas_personales">Finanzas Personales</option>
                <option value="emprendedor_control_interno">Emprendedor</option>
                <option value="negocio_transicion">Empresa sin DTE</option>
                <option value="empresa_consolidada_dte">Empresa con DTE</option>
              </select>
            </div>
          </div>

          {/* User Cards List */}
          <div className="space-y-3">
            {filteredUsers.map((u) => {
              const isPersonal = u.systemArchetype === 'finanzas_personales';
              const isEmprendedor = u.systemArchetype === 'emprendedor_control_interno';
              const isEmpresaSinDte = u.systemArchetype === 'negocio_transicion';
              const isEmpresaDte = u.systemArchetype === 'empresa_consolidada_dte';
              const isDavid = u.email === 'davidinn234@gmail.com' || u.id === 'user_david';

              const archetypeLabel = isPersonal
                ? 'Finanzas Personales'
                : isEmprendedor
                ? 'Emprendedor (Control Interno)'
                : isEmpresaSinDte
                ? 'Empresa sin DTE (Físico)'
                : 'Empresa con DTE MH';

              const archetypeBadgeColor = isPersonal
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300'
                : isEmprendedor
                ? 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300 border-cyan-300'
                : isEmpresaSinDte
                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300'
                : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-300';

              const showPassword = showPasswords[u.id];

              return (
                <div
                  key={u.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3 transition-all hover:border-indigo-300 dark:hover:border-indigo-700"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isPersonal
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : isEmprendedor
                            ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300'
                            : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                        }`}
                      >
                        {isPersonal ? (
                          <Wallet className="w-5 h-5" />
                        ) : isEmprendedor ? (
                          <Store className="w-5 h-5" />
                        ) : (
                          <Building2 className="w-5 h-5" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                            {u.name}
                          </h3>
                          {isDavid && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30">
                              Propietario / Super Admin
                            </span>
                          )}
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${archetypeBadgeColor}`}
                          >
                            {archetypeLabel}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                          <span className="flex items-center gap-1 font-mono">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {u.email}
                          </span>

                          <span className="flex items-center gap-1 font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[11px]">
                            <Lock className="w-3 h-3 text-slate-400" />
                            {showPassword ? u.password || 'admin' : '••••••••'}
                            <button
                              type="button"
                              onClick={() =>
                                setShowPasswords({
                                  ...showPasswords,
                                  [u.id]: !showPassword,
                                })
                              }
                              className="ml-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                              title={showPassword ? 'Ocultar' : 'Ver contraseña'}
                            >
                              {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </button>
                          </span>

                          {u.phone && (
                            <span className="flex items-center gap-1 text-[11px]">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {u.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopyCredentials(u)}
                        title="Copiar mensaje de acceso para enviar a tu amigo por WhatsApp"
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs flex items-center gap-1 font-medium transition cursor-pointer"
                      >
                        {copiedUserId === u.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-emerald-600 font-bold text-[11px]">Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span className="text-[11px]">WhatsApp</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleTestLogin(u)}
                        title="Probar y abrir la sesión como este usuario"
                        className="px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Entrar</span>
                      </button>

                      {!isDavid && (
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(u)}
                          title="Eliminar usuario"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Active Services Tag Cloud */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">
                      Servicios Activos:
                    </span>
                    {isPersonal ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-medium">
                        Presupuesto, Gastos & Metas de Ahorro SV
                      </span>
                    ) : (
                      (u.enabledServices && u.enabledServices.length > 0
                        ? u.enabledServices
                        : ['pos_terminal', 'sales_crm', 'inventory']
                      ).map((svcId) => {
                        const foundSvc = AVAILABLE_SERVICES.find((s) => s.id === svcId);
                        return (
                          <span
                            key={svcId}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-medium"
                          >
                            {foundSvc ? foundSvc.name : svcId}
                          </span>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};