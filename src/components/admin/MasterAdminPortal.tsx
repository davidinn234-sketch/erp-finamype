import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { Company, SystemArchetype, UserProfile } from '../../types';
import { AssignPasswordButton } from './UserAccessControls';
import {
  ShieldCheck,
  Building2,
  Users,
  PlusCircle,
  Search,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  ExternalLink,
  MessageSquare,
  Copy,
  Check,
  Trash2,
  RotateCcw,
  PauseCircle,
  PlayCircle,
  Key,
  Lock,
  Eye,
  EyeOff,
  Store,
  FileSpreadsheet,
  FileCheck2,
  Wallet,
  Briefcase,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  X,
  FileText,
  CloudCheck,
} from 'lucide-react';

const DEPARTAMENTOS_SV = [
  'Ahuachapán',
  'Cabañas',
  'Chalatenango',
  'Cuscatlán',
  'La Libertad',
  'La Paz',
  'La Unión',
  'Morazán',
  'San Miguel',
  'San Salvador',
  'San Vicente',
  'Santa Ana',
  'Sonsonate',
  'Usulután',
];

export const MasterAdminPortal: React.FC = () => {
  const {
    companies,
    users,
    currentUser,
    logout,
    enterSupportMode,
    createCompanyWithAdmin,
    deleteCompany,
    resetCompanyDataToZero,
    clearAllDemoData,
    updateCompany,
    deleteUser,
    updateUser,
    addNotification,
  } = useERP();

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'empresas' | 'nuevo' | 'usuarios'>('empresas');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [archetypeFilter, setArchetypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Create Form State
  const [formArchetype, setFormArchetype] = useState<SystemArchetype>('emprendedor_control_interno');
  const [formTradeName, setFormTradeName] = useState('');
  const [formLegalName, setFormLegalName] = useState('');
  const [formNit, setFormNit] = useState('');
  const [formNrc, setFormNrc] = useState('');
  const [formGiro, setFormGiro] = useState('');
  const [formDepartment, setFormDepartment] = useState('San Salvador');
  const [formMunicipality, setFormMunicipality] = useState('San Salvador Centro');
  const [formAddress, setFormAddress] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  
  // Subscription Plan
  const [formPlan, setFormPlan] = useState<'emprendedor' | 'pyme_dte' | 'personal' | 'corporativo' | 'personalizado'>('emprendedor');
  const [formStatus, setFormStatus] = useState<'activo' | 'prueba'>('activo');
  const [formPrice, setFormPrice] = useState<number>(14.99);
  const [formNotes, setFormNotes] = useState('');

  // Admin user credentials
  const [formAdminName, setFormAdminName] = useState('');
  const [formAdminEmail, setFormAdminEmail] = useState('');
  const [formAdminPassword, setFormAdminPassword] = useState('admin123');
  const [formAdminPhone, setFormAdminPhone] = useState('');

  // Submitting
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Success Modal
  const [createdModalData, setCreatedModalData] = useState<{
    company: Company;
    user: UserProfile;
    initialPassword: string;
  } | null>(null);

  // Delete Confirmation Modal
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Reset to Zero Confirmation Modal
  const [companyToReset, setCompanyToReset] = useState<Company | null>(null);

  // Copied state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Update plan price when archetype or plan changes
  const handleArchetypeSelect = (arch: SystemArchetype) => {
    setFormArchetype(arch);
    if (arch === 'emprendedor_control_interno') {
      setFormPlan('emprendedor');
      setFormPrice(14.99);
      if (!formGiro) setFormGiro('Comercio al por menor y ventas directas');
    } else if (arch === 'empresa_consolidada_dte') {
      setFormPlan('pyme_dte');
      setFormPrice(29.99);
      if (!formGiro) setFormGiro('Comercio formal y distribución con Facturación Electrónica MH');
    } else if (arch === 'negocio_transicion') {
      setFormPlan('emprendedor');
      setFormPrice(19.99);
      if (!formGiro) setFormGiro('Servicios y comercio régimen general tradicional');
    } else if (arch === 'finanzas_personales') {
      setFormPlan('personal');
      setFormPrice(4.99);
      if (!formGiro) setFormGiro('Control de ingresos y gastos personales / familiares');
    }
  };

  const handleGeneratePassword = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
    let p = '';
    for (let i = 0; i < 6; i++) {
      p += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormAdminPassword(p);
  };

  const handleCreateCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTradeName.trim()) {
      addNotification('error', 'Falta Nombre Comercial', 'Por favor ingresa el nombre comercial del negocio.');
      return;
    }
    if (!formAdminName.trim() || !formAdminEmail.trim() || !formAdminPassword.trim()) {
      addNotification('error', 'Faltan Credenciales', 'Completa el nombre, correo y contraseña del administrador.');
      return;
    }

    setIsSubmitting(true);
    try {
      const renewal = new Date();
      renewal.setMonth(renewal.getMonth() + 1);

      const res = await createCompanyWithAdmin(
        {
          name: formLegalName.trim() || formTradeName.trim(),
          tradeName: formTradeName.trim(),
          nit: formNit.trim() || '0614-010190-101-1',
          nrc: formNrc.trim() || '000000-0',
          giro: formGiro.trim() || 'Comercio General',
          department: formDepartment,
          municipality: formMunicipality,
          address: formAddress.trim() || 'San Salvador, El Salvador',
          phone: formPhone.trim() || formAdminPhone.trim() || '+503 7000-0000',
          email: formEmail.trim() || formAdminEmail.trim(),
          isGranContribuyente: false,
          currency: 'USD',
          fiscalYear: new Date().getFullYear(),
          systemArchetype: formArchetype,
          regimeType: formArchetype === 'empresa_consolidada_dte' || formArchetype === 'negocio_transicion' ? 'general_tributario' : 'emprendedor_control_interno',
          dteActive: formArchetype === 'empresa_consolidada_dte',
          subscriptionPlan: formPlan,
          subscriptionStatus: formStatus,
          subscriptionPrice: formPrice,
          subscriptionRenewalDate: renewal.toISOString().split('T')[0],
          contactPerson: formAdminName.trim(),
          contactPhone: formAdminPhone.trim(),
          notes: formNotes.trim(),
        },
        {
          name: formAdminName.trim(),
          email: formAdminEmail.trim(),
          password: formAdminPassword.trim(),
          phone: formAdminPhone.trim(),
        }
      );

      // Open success modal with copyable WhatsApp message
      setCreatedModalData({ ...res, initialPassword: formAdminPassword.trim() });

      // Reset form
      setFormTradeName('');
      setFormLegalName('');
      setFormNit('');
      setFormNrc('');
      setFormGiro('');
      setFormAddress('');
      setFormPhone('');
      setFormEmail('');
      setFormAdminName('');
      setFormAdminEmail('');
      setFormAdminPassword('admin123');
      setFormAdminPhone('');
      setFormNotes('');
      setActiveTab('empresas');
    } catch (err) {
      console.error(err);
      addNotification('error', 'No se creó la empresa', err instanceof Error ? err.message : 'Comprueba la conexión e inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getWhatsAppMessage = (comp: Company, user?: UserProfile) => {
    const adminUser = user || users.find((u) => u.companyId === comp.id || u.email === comp.email);
    const serviceName =
      comp.systemArchetype === 'finanzas_personales'
        ? 'Finanzas Personales (Portal Aislado)'
        : comp.systemArchetype === 'emprendedor_control_interno'
        ? 'Modalidad Emprendedor (Punto de Venta & Caja Rápida)'
        : comp.systemArchetype === 'negocio_transicion'
        ? 'Empresa Formal Régimen Tradicional'
        : 'Empresa Pyme con Facturación Electrónica DTE MH';

    return `👋 ¡Hola ${adminUser?.name || comp.contactPerson || comp.name}!
Te damos la bienvenida a *FINAMIPE SV* (El Salvador).

Ya hemos habilitado la cuenta de tu empresa *${comp.tradeName || comp.name}*:

🌐 *Plataforma:* ${window.location.origin}
📧 *Correo de Acceso:* ${adminUser?.email || comp.email}
🔑 *Contraseña:* ${createdModalData?.user.id === adminUser?.id ? createdModalData.initialPassword : 'La contraseña que te entregó el administrador. Si la olvidaste, solicita una nueva.'}
📦 *Plan Activado:* ${serviceName} ($${comp.subscriptionPrice || 14.99}/mes)

✨ Tu cuenta empieza completamente desde CERO ($0.00) lista para que ingreses tus productos y comiences a registrar tus ventas diarias.

¡Cualquier consulta quedamos totalmente a tu orden!`;
  };

  const handleCopyCredentials = (comp: Company, user?: UserProfile) => {
    const text = getWhatsAppMessage(comp, user);
    navigator.clipboard.writeText(text);
    setCopiedId(comp.id);
    setTimeout(() => setCopiedId(null), 2500);
    addNotification('info', 'Mensaje Copiado', 'Texto formal preparado para compartir por WhatsApp.');
  };

  const handleSendWhatsApp = (comp: Company, user?: UserProfile) => {
    const phone = comp.contactPhone || comp.phone;
    const cleanPhone = phone ? phone.replace(/[^0-9]/g, '') : '';
    const text = encodeURIComponent(getWhatsAppMessage(comp, user));
    const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  const handleToggleStatus = (comp: Company) => {
    const newStatus = comp.subscriptionStatus === 'activo' ? 'suspendido' : 'activo';
    updateCompany(comp.id, { subscriptionStatus: newStatus });
    addNotification(
      newStatus === 'activo' ? 'success' : 'warning',
      newStatus === 'activo' ? 'Cuenta Activada' : 'Cuenta Suspendida',
      `La empresa ${comp.tradeName || comp.name} ahora está en estado ${newStatus.toUpperCase()}.`
    );
  };

  const handleConfirmDeleteCompany = () => {
    if (!companyToDelete) return;
    deleteCompany(companyToDelete.id);
    setCompanyToDelete(null);
    setDeleteConfirmText('');
  };

  const handleConfirmResetCompany = () => {
    if (!companyToReset) return;
    resetCompanyDataToZero(companyToReset.id);
    setCompanyToReset(null);
  };

  // Filter companies
  const filteredCompanies = companies.filter((c) => {
    const matchesSearch =
      (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.tradeName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.nit && c.nit.includes(searchQuery)) ||
      (c.contactPerson && c.contactPerson.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesArchetype = archetypeFilter === 'all' || c.systemArchetype === archetypeFilter;
    const matchesStatus = statusFilter === 'all' || c.subscriptionStatus === statusFilter;

    return matchesSearch && matchesArchetype && matchesStatus;
  });

  // KPI calculations
  const totalCompaniesCount = companies.length;
  const activeCount = companies.filter((c) => c.subscriptionStatus === 'activo').length;
  const trialCount = companies.filter((c) => c.subscriptionStatus === 'prueba').length;
  const suspendedCount = companies.filter((c) => c.subscriptionStatus === 'suspendido').length;
  const estimatedMrr = companies.reduce((acc, c) => acc + (c.subscriptionPrice || 0), 0);

  return (
    <div id="master-admin-portal" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900/95 border-b border-slate-800 backdrop-blur-md px-4 sm:px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg tracking-tight text-white">
                FINAMIPE<span className="text-indigo-400">.SV</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Portal de Administración Maestro
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Gestión Centralizada de Clientes, Cuentas y Licencias SaaS El Salvador
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs">
            <CloudCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-300">Base de Datos:</span>
            <span className="font-mono text-emerald-400 font-bold">Firebase Conectado</span>
          </div>

          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-white">{currentUser.name}</div>
              <div className="text-[11px] text-slate-400">{currentUser.email}</div>
            </div>
            <button
              onClick={logout}
              title="Cerrar Sesión"
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* KPI Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
            <span className="text-xs font-medium text-slate-400">Empresas Clientes</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl sm:text-3xl font-black text-white">{totalCompaniesCount}</span>
              <span className="text-xs text-indigo-400 font-semibold">Registradas</span>
            </div>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
            <span className="text-xs font-medium text-slate-400">Licencias Activas</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl sm:text-3xl font-black text-emerald-400">{activeCount}</span>
              <span className="text-xs text-emerald-400 font-semibold">Al día</span>
            </div>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
            <span className="text-xs font-medium text-slate-400">En Prueba Gratuita</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl sm:text-3xl font-black text-amber-400">{trialCount}</span>
              <span className="text-xs text-amber-400 font-semibold">15 días</span>
            </div>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
            <span className="text-xs font-medium text-slate-400">Cuentas Suspendidas</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl sm:text-3xl font-black text-rose-400">{suspendedCount}</span>
              <span className="text-xs text-rose-400 font-semibold">Pausadas</span>
            </div>
          </div>
          <div className="col-span-2 sm:col-span-1 bg-gradient-to-br from-indigo-950/80 to-slate-900 border border-indigo-800/40 rounded-2xl p-4 flex flex-col justify-between">
            <span className="text-xs font-medium text-indigo-300">Ingresos Estimados</span>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-2xl sm:text-3xl font-black text-cyan-400">
                ${estimatedMrr.toFixed(2)}
              </span>
              <span className="text-[11px] text-cyan-300">/mes</span>
            </div>
          </div>
        </div>

        {/* Action Tabs & Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('empresas')}
              className={`px-4 py-2.5 rounded-xl font-bold text-sm transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'empresas'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Directorio de Clientes ({companies.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('nuevo')}
              className={`px-4 py-2.5 rounded-xl font-bold text-sm transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'nuevo'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              <span>Dar de Alta Nueva Empresa</span>
            </button>
            <button
              onClick={() => setActiveTab('usuarios')}
              className={`px-4 py-2.5 rounded-xl font-bold text-sm transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'usuarios'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Usuarios ({users.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (window.confirm('¿Deseas depurar los datos de prueba y dejar únicamente tus clientes reales?')) {
                  clearAllDemoData();
                }
              }}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-400 hover:text-slate-200 transition cursor-pointer flex items-center gap-1.5"
              title="Elimina registros de prueba como Cybertech Solutions para operar en limpio"
            >
              <Trash2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Depurar Datos Demo</span>
            </button>
          </div>
        </div>

        {/* TAB 1: LISTADO DE EMPRESAS CLIENTES */}
        {activeTab === 'empresas' && (
          <div className="space-y-4">
            {/* Search and Filters Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por nombre comercial, razón social, NIT, correo o contacto..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={archetypeFilter}
                  onChange={(e) => setArchetypeFilter(e.target.value)}
                  className="px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">Todas las Modalidades</option>
                  <option value="emprendedor_control_interno">Emprendedor (POS & Control)</option>
                  <option value="empresa_consolidada_dte">Pyme con DTE (MH)</option>
                  <option value="negocio_transicion">Empresa Tradicional</option>
                  <option value="finanzas_personales">Finanzas Personales</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">Todos los Estados</option>
                  <option value="activo">Activas</option>
                  <option value="prueba">En Prueba</option>
                  <option value="suspendido">Suspendidas</option>
                </select>
              </div>
            </div>

            {/* List of Companies */}
            {filteredCompanies.length === 0 ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
                <Building2 className="w-12 h-12 text-slate-600 mx-auto" />
                <h3 className="text-base font-bold text-white">No se encontraron empresas clientes</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Aún no hay clientes que coincidan con la búsqueda. Puedes registrar un nuevo negocio cliente con el botón "Dar de Alta Nueva Empresa".
                </p>
                <button
                  onClick={() => setActiveTab('nuevo')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-2 cursor-pointer mt-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Dar de Alta Nuevo Cliente</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredCompanies.map((comp) => {
                  const adminUser = users.find(
                    (u) => u.companyId === comp.id || (comp.email && u.email.toLowerCase() === comp.email.toLowerCase())
                  );

                  const isEmprendedor = comp.systemArchetype === 'emprendedor_control_interno';
                  const isDte = comp.systemArchetype === 'empresa_consolidada_dte';
                  const isPersonal = comp.systemArchetype === 'finanzas_personales';

                  return (
                    <div
                      key={comp.id}
                      className="bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 transition flex flex-col justify-between space-y-4 shadow-xl relative overflow-hidden"
                    >
                      {/* Top Badges */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-700 to-slate-800 border border-indigo-600/30 flex items-center justify-center text-white font-black text-lg shadow-md shrink-0">
                            {(comp.tradeName || comp.name || 'Empresa').substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-base font-black text-white leading-tight">
                                {comp.tradeName || comp.name}
                              </h3>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  comp.subscriptionStatus === 'activo'
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                    : comp.subscriptionStatus === 'prueba'
                                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                    : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                                }`}
                              >
                                {comp.subscriptionStatus?.toUpperCase() || 'ACTIVO'}
                              </span>
                            </div>
                            <span className="text-xs text-slate-400 block mt-0.5">
                              {comp.name !== comp.tradeName ? comp.name : comp.giro || 'Comercio General'}
                            </span>
                          </div>
                        </div>

                        {/* Plan Tag */}
                        <div className="text-right shrink-0">
                          <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-mono text-xs font-bold block">
                            ${comp.subscriptionPrice || 14.99}/mes
                          </span>
                          <span className="text-[10px] text-slate-500 block mt-1">
                            {isDte ? 'Plan Pyme DTE MH' : isPersonal ? 'Plan Personal' : 'Plan Emprendedor POS'}
                          </span>
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950/60 rounded-xl p-3 border border-slate-800/80">
                        <div>
                          <span className="text-slate-500 block text-[10px] uppercase font-bold">Identificación Fiscal</span>
                          <span className="font-mono text-slate-300">NIT: {comp.nit || 'No registrado'}</span>
                          {comp.nrc && comp.nrc !== '000000-0' && (
                            <span className="font-mono text-slate-400 block text-[11px]">NRC: {comp.nrc}</span>
                          )}
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px] uppercase font-bold">Ubicación</span>
                          <span className="text-slate-300 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-indigo-400 shrink-0" />
                            <span className="truncate">
                              {typeof comp.department === 'string' ? comp.department : (comp.department as any)?.name || 'San Salvador'}
                            </span>
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px] uppercase font-bold">Administrador del Negocio</span>
                          <span className="text-slate-200 font-medium truncate block">
                            {adminUser?.name || comp.contactPerson || 'Titular asignado'}
                          </span>
                          <span className="text-slate-400 text-[11px] truncate block">
                            {adminUser?.email || comp.email}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px] uppercase font-bold">Contacto / WhatsApp</span>
                          <span className="text-slate-300 font-mono">
                            {comp.contactPhone || comp.phone || 'No registrado'}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                        {/* Primary: Enter this company as Admin in Support Mode */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => enterSupportMode(comp.id)}
                            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
                            title="Ingresa a ver y configurar el sistema de esta empresa en modo asistencia técnica"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Ingresar a la Empresa</span>
                          </button>
                          
                          <button
                            onClick={() => handleSendWhatsApp(comp, adminUser)}
                            className="p-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                            title="Enviar credenciales de acceso por WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">WhatsApp</span>
                          </button>

                          <button
                            onClick={() => handleCopyCredentials(comp, adminUser)}
                            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition cursor-pointer"
                            title="Copiar texto formal de credenciales"
                          >
                            {copiedId === comp.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>

                        {/* Secondary: Maintenance Actions */}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleToggleStatus(comp)}
                            className={`p-1.5 rounded-lg border text-xs font-medium transition cursor-pointer ${
                              comp.subscriptionStatus === 'activo'
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                            }`}
                            title={comp.subscriptionStatus === 'activo' ? 'Suspender acceso a la empresa' : 'Reactivar acceso a la empresa'}
                          >
                            {comp.subscriptionStatus === 'activo' ? <PauseCircle className="w-3.5 h-3.5" /> : <PlayCircle className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            onClick={() => setCompanyToReset(comp)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-500/20 hover:text-amber-300 text-slate-400 transition cursor-pointer"
                            title="Reiniciar datos de esta empresa a CERO ($0.00)"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              setCompanyToDelete(comp);
                              setDeleteConfirmText('');
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 transition cursor-pointer"
                            title="Dar de baja y eliminar empresa permanentemente"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: GRAN FORMULARIO FORMAL PARA ALTA DE EMPRESAS */}
        {activeTab === 'nuevo' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-8 shadow-2xl backdrop-blur-md">
            <div className="border-b border-slate-800 pb-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Alta Formal de Nuevo Cliente</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Formulario de Registro y Aprovisionamiento FINAMIPE SV
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
                Al registrar la empresa, se creará su cuenta aislada con sus datos iniciales completamente en <strong>CERO ($0.00)</strong>, lista para empezar a operar.
              </p>
            </div>

            <form onSubmit={handleCreateCompanySubmit} className="space-y-8">
              {/* PASO 1: Modalidad / Arquetipo */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">1</span>
                  <label className="text-sm font-bold text-white uppercase tracking-wider">
                    Selecciona el Tipo de Solución para el Cliente
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Opción 1: Emprendedor POS */}
                  <div
                    onClick={() => handleArchetypeSelect('emprendedor_control_interno')}
                    className={`p-4 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                      formArchetype === 'emprendedor_control_interno'
                        ? 'bg-cyan-950/40 border-cyan-500 ring-2 ring-cyan-500/30 text-white'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Store className="w-6 h-6 text-cyan-400" />
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                          Recomendado
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-white">Emprendedor & POS</h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Control interno, lector de código de barras, inventario rápido y margen de ganancia sin carga tributaria obligatoria.
                      </p>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-800/80 text-xs font-mono font-bold text-cyan-400">
                      $14.99 / mes
                    </div>
                  </div>

                  {/* Opción 2: Pyme con Facturación Electrónica DTE */}
                  <div
                    onClick={() => handleArchetypeSelect('empresa_consolidada_dte')}
                    className={`p-4 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                      formArchetype === 'empresa_consolidada_dte'
                        ? 'bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/30 text-white'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <FileCheck2 className="w-6 h-6 text-indigo-400" />
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                          DTE MH
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-white">Pyme con Facturación DTE</h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Emisión directa a Hacienda (Facturas, Crédito Fiscal, Sujeto Excluido), IVA 13%, Retenciones y Libros de IVA.
                      </p>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-800/80 text-xs font-mono font-bold text-indigo-400">
                      $29.99 / mes
                    </div>
                  </div>

                  {/* Opción 3: Empresa Régimen Tradicional */}
                  <div
                    onClick={() => handleArchetypeSelect('negocio_transicion')}
                    className={`p-4 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                      formArchetype === 'negocio_transicion'
                        ? 'bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/30 text-white'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <FileSpreadsheet className="w-6 h-6 text-amber-400" />
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
                          Físico
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-white">Empresa Tradicional</h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Facturación física en papel, libros de compras/ventas de IVA, retención 1% y planilla legal ISSS/AFP.
                      </p>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-800/80 text-xs font-mono font-bold text-amber-400">
                      $19.99 / mes
                    </div>
                  </div>

                  {/* Opción 4: Finanzas Personales */}
                  <div
                    onClick={() => handleArchetypeSelect('finanzas_personales')}
                    className={`p-4 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                      formArchetype === 'finanzas_personales'
                        ? 'bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/30 text-white'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Wallet className="w-6 h-6 text-emerald-400" />
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                          Personal
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-white">Finanzas Personales</h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Portal independiente para el control de gastos del hogar, presupuestos mensuales y metas de ahorro.
                      </p>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-800/80 text-xs font-mono font-bold text-emerald-400">
                      $4.99 / mes
                    </div>
                  </div>
                </div>
              </div>

              {/* PASO 2: Datos de la Empresa */}
              <div className="space-y-4 pt-4 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">2</span>
                  <label className="text-sm font-bold text-white uppercase tracking-wider">
                    Datos del Negocio o Empresa
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Nombre Comercial del Negocio *
                    </label>
                    <input
                      type="text"
                      required
                      value={formTradeName}
                      onChange={(e) => setFormTradeName(e.target.value)}
                      placeholder="Ej: Librería & Variedades El Triunfo"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Razón Social / Nombre Legal
                    </label>
                    <input
                      type="text"
                      value={formLegalName}
                      onChange={(e) => setFormLegalName(e.target.value)}
                      placeholder="Ej: Rosa María Morales de Pérez"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Giro / Actividad Económica
                    </label>
                    <input
                      type="text"
                      value={formGiro}
                      onChange={(e) => setFormGiro(e.target.value)}
                      placeholder="Ej: Venta de artículos de librería y oficina"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      NIT o DUI del Titular
                    </label>
                    <input
                      type="text"
                      value={formNit}
                      onChange={(e) => setFormNit(e.target.value)}
                      placeholder="0614-010190-101-1 o 01234567-9"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      NRC (si es contribuyente IVA)
                    </label>
                    <input
                      type="text"
                      value={formNrc}
                      onChange={(e) => setFormNrc(e.target.value)}
                      placeholder="Ej: 298714-3 (opcional si es emprendedor)"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Departamento de El Salvador
                    </label>
                    <select
                      value={formDepartment}
                      onChange={(e) => setFormDepartment(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {DEPARTAMENTOS_SV.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Municipio / Distrito
                    </label>
                    <input
                      type="text"
                      value={formMunicipality}
                      onChange={(e) => setFormMunicipality(e.target.value)}
                      placeholder="Ej: San Salvador Centro / Santa Ana"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Dirección del Establecimiento
                    </label>
                    <input
                      type="text"
                      value={formAddress}
                      onChange={(e) => setFormAddress(e.target.value)}
                      placeholder="Ej: Calle Principal #12, Barrio El Calvario"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Teléfono Comercial
                    </label>
                    <input
                      type="text"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="+503 2244-8800"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* PASO 3: Plan y Suscripción */}
              <div className="space-y-4 pt-4 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">3</span>
                  <label className="text-sm font-bold text-white uppercase tracking-wider">
                    Plan de Suscripción & Facturación FINAMIPE SV
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Plan Asignado
                    </label>
                    <select
                      value={formPlan}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        setFormPlan(val);
                        if (val === 'emprendedor') setFormPrice(14.99);
                        else if (val === 'pyme_dte') setFormPrice(29.99);
                        else if (val === 'personal') setFormPrice(4.99);
                        else if (val === 'corporativo') setFormPrice(49.99);
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="emprendedor">Plan Emprendedor POS ($14.99/mes)</option>
                      <option value="pyme_dte">Plan Pyme Pro DTE MH ($29.99/mes)</option>
                      <option value="personal">Plan Finanzas Personales ($4.99/mes)</option>
                      <option value="corporativo">Plan Corporativo ($49.99/mes)</option>
                      <option value="personalizado">Plan Personalizado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Precio Cobrado al Cliente ($ USD)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formPrice}
                      onChange={(e) => setFormPrice(parseFloat(e.target.value) || 0)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Estado Inicial de la Suscripción
                    </label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="activo">Activo (Facturación Regular)</option>
                      <option value="prueba">En Prueba Gratuita (15 días)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* PASO 4: Credenciales del Administrador del Negocio */}
              <div className="space-y-4 pt-4 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">4</span>
                  <label className="text-sm font-bold text-white uppercase tracking-wider">
                    Credenciales de Acceso para el Administrador del Negocio
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Nombre del Dueño o Encargado *
                    </label>
                    <input
                      type="text"
                      required
                      value={formAdminName}
                      onChange={(e) => setFormAdminName(e.target.value)}
                      placeholder="Ej: Mauricio Quintanilla"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Correo Electrónico (Login) *
                    </label>
                    <input
                      type="email"
                      required
                      value={formAdminEmail}
                      onChange={(e) => setFormAdminEmail(e.target.value)}
                      placeholder="cliente@gmail.com o empresa@sv"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-300">
                        Contraseña Asignada *
                      </label>
                      <button
                        type="button"
                        onClick={handleGeneratePassword}
                        className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold cursor-pointer"
                      >
                        Generar Aleatoria
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={formAdminPassword}
                        onChange={(e) => setFormAdminPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-950/80 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-200"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Teléfono / WhatsApp para Enviar Accesos
                    </label>
                    <input
                      type="text"
                      value={formAdminPhone}
                      onChange={(e) => setFormAdminPhone(e.target.value)}
                      placeholder="+503 7111-2233"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Botón de Envío */}
              <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-slate-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    La cuenta comenzará desde <strong>CERO ($0.00)</strong> sin datos ficticios de Cybertech Solutions.
                  </span>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setActiveTab('empresas')}
                    className="flex-1 sm:flex-none px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <PlusCircle className="w-4 h-4" />
                        <span>✨ Dar de Alta Empresa en CERO ($0.00)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: GESTIÓN DE USUARIOS Y ACCESOS */}
        {activeTab === 'usuarios' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Directorio de Todos los Usuarios Registrados</h3>
                <p className="text-xs text-slate-400">
                  Visualiza las cuentas asociadas a empresas y accesos directos
                </p>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="px-4 py-3">Usuario / Nombre</th>
                      <th className="px-4 py-3">Correo de Acceso</th>
                      <th className="px-4 py-3">Empresa Asignada</th>
                      <th className="px-4 py-3">Rol / Modalidad</th>
                      <th className="px-4 py-3">Contraseña</th>
                      <th className="px-4 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {[...users].sort((a, b) => (Date.parse(b.createdAt || '') || 0) - (Date.parse(a.createdAt || '') || 0)).map((u) => {
                      const comp = companies.find((c) => c.id === u.companyId);
                      const isSuper = u.id === currentUser.id;

                      return (
                        <tr key={u.id} className="hover:bg-slate-800/40 transition">
                          <td className="px-4 py-3 font-medium text-white flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-indigo-600/30 text-indigo-300 font-bold flex items-center justify-center shrink-0">
                              {(u.name || u.email || 'Usuario').charAt(0)}
                            </div>
                            <div>
                              <span>{u.name}</span>
                              <div className="text-[10px] text-slate-400 mt-1">{u.accessStatus === 'missing_profile' ? 'Sin perfil · acceso no habilitado' : u.registrationSource === 'self' ? 'Registro público' : u.registrationSource === 'company_admin' ? 'Creado por su empresa' : u.registrationSource === 'platform_admin' ? 'Creado desde tu administración' : 'Cuenta existente'}{u.createdAt ? ` · ${new Date(u.createdAt).toLocaleDateString('es-SV')}` : ''}</div>
                              {isSuper && (
                                <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                  SUPER ADMIN
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-300 font-mono">{u.email}</td>
                          <td className="px-4 py-3 text-slate-300">
                            {comp ? comp.tradeName || comp.name : isSuper ? 'Plataforma Maestro' : 'Sin empresa fija'}
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                              {u.systemArchetype || u.role}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-400">
                            {u.accessStatus === 'missing_profile' ? 'Falta asociar un perfil' : <AssignPasswordButton user={u} />}
                          </td>
                          <td className="px-4 py-3 text-right space-x-1">
                            {!isSuper && u.accessStatus !== 'missing_profile' && (
                              <button
                                onClick={() => {
                                  if (window.confirm(`¿Eliminar la cuenta del usuario ${u.name}?`)) {
                                    deleteUser(u.id);
                                  }
                                }}
                                className="p-1 rounded-lg hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition"
                                title="Eliminar usuario"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL: ALTA EXITOSA CON MENSAJE DE WHATSAPP */}
      {createdModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-indigo-500/40 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-white">
                ¡Empresa Registrada en CERO!
              </h3>
              <p className="text-xs text-slate-300">
                La empresa <strong>{createdModalData.company.tradeName}</strong> y su usuario administrador ya están listos en Firebase y en la plataforma.
              </p>
            </div>

            {/* Credenciales Generadas */}
            <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Negocio:</span>
                <span className="text-white font-bold">{createdModalData.company.tradeName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Correo (Login):</span>
                <span className="text-cyan-400">{createdModalData.user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Contraseña:</span>
                <span className="text-emerald-400 font-bold">{createdModalData.initialPassword}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Modalidad:</span>
                <span className="text-indigo-400">{createdModalData.company.systemArchetype}</span>
              </div>
            </div>

            {/* Botones de Envío */}
            <div className="space-y-2 pt-2">
              <button
                onClick={() => handleSendWhatsApp(createdModalData.company, createdModalData.user)}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Enviar Credenciales por WhatsApp al Cliente</span>
              </button>

              <button
                onClick={() => handleCopyCredentials(createdModalData.company, createdModalData.user)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar Mensaje Formal al Portapapeles</span>
              </button>

              <button
                onClick={() => {
                  const compId = createdModalData.company.id;
                  setCreatedModalData(null);
                  enterSupportMode(compId);
                }}
                className="w-full py-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Ingresar de Inmediato a la Empresa (Modo Asistencia)</span>
              </button>
            </div>

            <button
              onClick={() => setCreatedModalData(null)}
              aria-label="Cerrar confirmación de empresa"
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAR ELIMINACIÓN DE EMPRESA */}
      {companyToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-rose-500/40 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-7 h-7 shrink-0" />
              <div>
                <h3 className="text-base font-bold text-white">¿Dar de Baja Definitiva?</h3>
                <span className="text-xs text-rose-300">Esta acción no se puede deshacer</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Estás a punto de eliminar permanentemente la empresa{' '}
              <strong className="text-white">{companyToDelete.tradeName || companyToDelete.name}</strong> y todas sus cuentas de usuario asociadas porque ya no continuarán con el servicio.
            </p>

            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 block">
                Escribe <strong className="text-rose-400">ELIMINAR</strong> para confirmar:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="ELIMINAR"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCompanyToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleteConfirmText !== 'ELIMINAR'}
                onClick={handleConfirmDeleteCompany}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white text-xs font-bold transition cursor-pointer"
              >
                Eliminar Permanentemente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAR REINICIO A CERO */}
      {companyToReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-400">
              <RotateCcw className="w-7 h-7 shrink-0" />
              <div>
                <h3 className="text-base font-bold text-white">¿Reiniciar Datos a Cero?</h3>
                <span className="text-xs text-amber-300">Vaciar todas las operaciones de prueba</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Se eliminarán todas las ventas, compras, productos y registros de{' '}
              <strong className="text-white">{companyToReset.tradeName || companyToReset.name}</strong> para que empiece completamente en <strong>$0.00</strong>. La cuenta y sus credenciales se mantendrán activas.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCompanyToReset(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmResetCompany}
                className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition cursor-pointer"
              >
                Reiniciar a CERO ($0.00)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
