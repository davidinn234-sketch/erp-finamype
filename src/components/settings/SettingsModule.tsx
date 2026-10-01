import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  Settings,
  Building2,
  Download,
  Upload,
  RefreshCw,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Sliders,
  FileCode,
  HardDrive,
  Percent,
  Edit2,
  Trash2,
  Save,
  RotateCcw,
  Sparkles,
  BookOpen,
  Building,
  MapPin,
  Phone,
  User,
  Star,
  X,
  Users,
  Shield,
  Zap,
  GraduationCap,
  Target,
  Cloud,
  Database,
  Wifi,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { Company, FiscalConfig, AccountNode, Branch } from '../../types';
import { DEFAULT_FISCAL_CONFIG, formatCurrencyUSD } from '../../utils/salvadoranTax';
import {
  SALVADORAN_DEPARTMENTS,
  getMunicipalitiesForDepartment,
} from '../../utils/salvadoranGeography';
import { DeclarativeOnboardingWizard } from './DeclarativeOnboardingWizard';
import { UserRoleManagement } from './UserRoleManagement';
import { testFirebaseConnection } from '../../lib/firebase';
import { ErrorBoundary } from '../common/ErrorBoundary';

const SettingsModuleInner: React.FC = () => {
  const {
    companies,
    currentCompany,
    setCurrentCompanyId,
    createCompany,
    updateCompany,
    branches,
    createBranch,
    updateBranch,
    deleteBranch,
    fiscalConfig,
    updateFiscalConfig,
    chartOfAccounts,
    createAccountNode,
    updateAccountNode,
    deleteAccountNode,
    loadChartTemplate,
    exportDatabaseJSON,
    importDatabaseJSON,
    resetAllDataToSample,
  } = useERP();

  const [activeTab, setActiveTab] = useState<'onboarding' | 'cloud' | 'project_info' | 'users' | 'branches' | 'company' | 'fiscal' | 'catalog' | 'backup'>('onboarding');

  // Cloud Firestore Sync Diagnostics State
  const [isTestingCloud, setIsTestingCloud] = useState(false);
  const [cloudPingResult, setCloudPingResult] = useState<'success' | 'error' | null>(null);

  const handleTestCloud = async () => {
    setIsTestingCloud(true);
    setCloudPingResult(null);
    try {
      const ok = await testFirebaseConnection();
      setCloudPingResult(ok ? 'success' : 'error');
    } catch {
      setCloudPingResult('error');
    } finally {
      setIsTestingCloud(false);
    }
  };

  // New Company Modal State
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [newCompanyForm, setNewCompanyForm] = useState<Omit<Company, 'id'>>({
    name: '',
    tradeName: '',
    nrc: '',
    nit: '',
    giro: '',
    address: '',
    department: 'San Salvador',
    phone: '',
    email: '',
    isGranContribuyente: false,
    fiscalYear: 2026,
    currency: 'USD',
  });

  // Branch Modal State
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [branchForm, setBranchForm] = useState<{
    code: string;
    name: string;
    address: string;
    department: string;
    municipality: string;
    phone: string;
    managerName: string;
    isMain: boolean;
    isActive: boolean;
  }>({
    code: 'SUC-02',
    name: '',
    address: '',
    department: 'San Salvador',
    municipality: 'San Salvador Centro (San Salvador, Mejicanos, Ayutuxtepeque, Cuscatancingo, Ciudad Delgado)',
    phone: '+503 2200-0000',
    managerName: '',
    isMain: false,
    isActive: true,
  });

  // Fiscal Config Edit State
  const [editingFiscal, setEditingFiscal] = useState<FiscalConfig>({ ...fiscalConfig });

  // Account Node Form State
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountForm, setAccountForm] = useState<AccountNode>({
    code: '',
    name: '',
    level: 3,
    category: 'activo',
    isMovement: true,
    balance: 0,
    normalBalance: 'deudor',
    debitBalance: 0,
    creditBalance: 0,
    isSystem: false,
  });

  const handleOpenCreateBranch = () => {
    setEditingBranch(null);
    setBranchForm({
      code: `SUC-0${branches.length + 1}`,
      name: '',
      address: '',
      department: 'San Salvador',
      municipality: 'San Salvador Centro (San Salvador, Mejicanos, Ayutuxtepeque, Cuscatancingo, Ciudad Delgado)',
      phone: '+503 2200-0000',
      managerName: '',
      isMain: branches.length === 0,
      isActive: true,
    });
    setIsBranchModalOpen(true);
  };

  const handleOpenEditBranch = (b: Branch) => {
    setEditingBranch(b);
    const safeDept = typeof b.department === 'string' ? b.department : (b.department as any)?.name || 'San Salvador';
    setBranchForm({
      code: b.code,
      name: b.name,
      address: b.address,
      department: safeDept,
      municipality: b.municipality || getMunicipalitiesForDepartment(safeDept)[0] || '',
      phone: b.phone,
      managerName: b.managerName || '',
      isMain: b.isMain,
      isActive: b.isActive,
    });
    setIsBranchModalOpen(true);
  };

  const handleBranchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBranch) {
      updateBranch(editingBranch.id, branchForm);
    } else {
      createBranch(branchForm);
    }
    setIsBranchModalOpen(false);
  };

  const handleCreateCompany = (e: React.FormEvent) => {
    e.preventDefault();
    createCompany(newCompanyForm);
    setIsCompanyModalOpen(false);
  };

  const handleSaveFiscalConfig = () => {
    updateFiscalConfig(editingFiscal);
  };

  const handleResetFiscalDefaults = () => {
    setEditingFiscal({ ...DEFAULT_FISCAL_CONFIG });
    updateFiscalConfig({ ...DEFAULT_FISCAL_CONFIG });
  };

  const handleDownloadBackup = () => {
    const jsonStr = exportDatabaseJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FinaPyme_ERP_Backup_${currentCompany.name.replace(/\s+/g, '_')}_2026.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        if (event.target?.result) {
          importDatabaseJSON(event.target.result as string);
        }
      };
    }
  };

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    createAccountNode(accountForm);
    setIsAccountModalOpen(false);
    setAccountForm({
      code: '',
      name: '',
      level: 3,
      category: 'activo',
      isMovement: true,
      balance: 0,
      normalBalance: 'deudor',
      debitBalance: 0,
      creditBalance: 0,
      isSystem: false,
    });
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Personalización & Configuración del Sistema
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
              Control Total
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Personaliza sucursales, empresas, catálogo de cuentas, porcentajes legales (ISSS, AFP, Renta, IVA) y respaldos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenCreateBranch}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Sucursal</span>
          </button>

          <button
            onClick={() => setIsCompanyModalOpen(true)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Building2 className="w-4 h-4 text-indigo-500" />
            <span>Nueva Empresa</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto">
        {[
          { id: 'onboarding', label: 'Personalización & Régimen (Lean)', icon: Sparkles },
          { id: 'cloud', label: 'Estado de la Nube (Firestore SV)', icon: Cloud },
          { id: 'project_info', label: 'Proyecto FinaPyme (UES FMOcc)', icon: GraduationCap },
          { id: 'users', label: 'Usuarios & Roles (RBAC)', icon: Shield },
          { id: 'branches', label: 'Sucursales & Puntos de Venta', icon: Building },
          { id: 'company', label: 'Empresas & Razón Social', icon: Building2 },
          { id: 'fiscal', label: 'Parámetros Fiscales & Tasas', icon: Percent },
          { id: 'catalog', label: 'Catálogo de Cuentas (Personalizable)', icon: BookOpen },
          { id: 'backup', label: 'Copias de Seguridad & JSON', icon: HardDrive },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ---------------------------------------------------- */}
      {/* TAB: PERSONALIZACIÓN DECLARATIVA / ONBOARDING */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'onboarding' && (
        <DeclarativeOnboardingWizard />
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB: ESTADO DE LA NUBE & PERSISTENCIA (FIRESTORE) */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'cloud' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Hero Banner */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10 space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/30 border border-emerald-400/40 text-xs font-bold text-emerald-200">
                <Cloud className="w-4 h-4" />
                <span>Google Cloud Firestore • Sincronización en Tiempo Real</span>
              </div>
              <h3 className="text-2xl font-black tracking-tight text-white">
                Base de Datos y Almacenamiento en la Nube
              </h3>
              <p className="text-xs text-emerald-200 max-w-2xl leading-relaxed">
                Toda la información operativa de tu empresa (ventas, compras, inventario, cuentas, sucursales y asistencias con PIN) se almacena de forma persistente y segura en Google Cloud Firestore con réplica en tiempo real y soporte fuera de línea (offline).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Status Card */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <Database className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Detalles del Servidor en la Nube</h4>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <Wifi className="w-3 h-3 animate-pulse" />
                  Activo & Conectado
                </span>
              </div>

              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                  <span className="text-slate-400">Servicio de Nube:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">Google Cloud Firestore</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                  <span className="text-slate-400">ID de Base de Datos:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-[11px]">ai-studio-nexuserpsalvador-619c</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                  <span className="text-slate-400">Modo de Persistencia:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">Bidireccional Multi-Dispositivo</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                  <span className="text-slate-400">Respaldo Local (Offline):</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">Activo (IndexedDB / LocalStorage)</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleTestCloud}
                  disabled={isTestingCloud}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isTestingCloud ? 'animate-spin' : ''}`} />
                  <span>{isTestingCloud ? 'Verificando enlace en la nube...' : 'Comprobar Enlace de Conexión'}</span>
                </button>

                {cloudPingResult === 'success' && (
                  <div className="mt-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 flex items-center gap-2 text-xs font-semibold animate-in fade-in">
                    <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span>¡Conexión verificada exitosamente! Tu base de datos responde en tiempo real.</span>
                  </div>
                )}

                {cloudPingResult === 'error' && (
                  <div className="mt-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 flex items-center gap-2 text-xs font-semibold animate-in fade-in">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                    <span>Modo sin conexión temporal: los datos se conservan en tu navegador y se sincronizarán al reconectar.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Collections Synced Card */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm border-b border-slate-100 dark:border-slate-800 pb-3">
                <Sparkles className="w-5 h-5" />
                <h4>Módulos & Colecciones Sincronizadas</h4>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { name: 'Empresas & Razón Social', count: `${companies.length} regs` },
                  { name: 'Sucursales & Cajas', count: `${branches.length} regs` },
                  { name: 'Colaboradores & PINs', count: 'Planilla SV' },
                  { name: 'Registro de Asistencia', count: 'Tiempo Real' },
                  { name: 'Ventas & DTE Oficial', count: 'Nube Activa' },
                  { name: 'Kardex & Inventario', count: 'Costo Promedio' },
                  { name: 'Catálogo NIIF', count: 'Partida Doble' },
                  { name: 'Cuentas & Tesorería', count: 'Flujo Caja' },
                ].map((col, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate">{col.name}</span>
                    <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded shrink-0">{col.count}</span>
                  </div>
                ))}
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed pt-1">
                🔒 <strong>Seguridad Multi-Inquilino:</strong> Los datos de cada empresa se aíslan de forma estricta. Ninguna otra empresa puede ver ni modificar tus registros.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB: PROYECTO FINAPYME ERP & UES FMOCC (LEAN STARTUP) */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'project_info' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Hero Banner */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-900 via-blue-900 to-slate-900 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10 space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/30 border border-indigo-400/40 text-xs font-bold text-indigo-200">
                <GraduationCap className="w-4 h-4" />
                <span>Universidad de El Salvador • FMOcc • Desarrollo de Nuevos Productos</span>
              </div>
              <h3 className="text-2xl font-black tracking-tight text-white">
                FinaPyme ERP: Transformación Digital para MYPES
              </h3>
              <p className="text-xs text-indigo-200 max-w-2xl leading-relaxed">
                Actividad 1: Lean Startup y Desarrollo de Clientes. Diseñado específicamente para pequeños emprendimientos y MYPES salvadoreñas que necesitan tomar el control de su liquidez, inventario, ventas y obligaciones fiscales sin complicaciones contables.
              </p>
            </div>
          </div>

          {/* Grid: Problema vs Solución */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                <Target className="w-5 h-5" />
                <h4>Problema Identificado & Validación</h4>
              </div>
              <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
                <li>• <strong>Falta de control financiero:</strong> La mayoría lleva cuentas a mano o en Excel, provocando errores en costos y pérdida de margen.</li>
                <li>• <strong>Desconocimiento de la liquidez:</strong> No saber cuánto se gana ni la disponibilidad de efectivo real lleva a quiebras tempranas.</li>
                <li>• <strong>Complejidad fiscal:</strong> Dificultad para calcular IVA 13%, retenciones y prestaciones de ley laboral salvadoreña.</li>
              </ul>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                <Sparkles className="w-5 h-5" />
                <h4>Solución Digital & Diferenciador</h4>
              </div>
              <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
                <li>• <strong>Sencillo para no-contadores:</strong> Registro ágil de ventas, inventario (código de barras / cámara) y compras.</li>
                <li>• <strong>Dashboard centralizado:</strong> Conecta cuentas por cobrar, cuentas por pagar, nómina y rentabilidad en un solo panel.</li>
                <li>• <strong>Inteligencia Artificial Integrada:</strong> Copiloto FinaPyme AI para análisis financiero (superando las barreras de ODOO).</li>
                <li>• <strong>Tarifa Justa ($10 - $30/mes):</strong> Ajustada a la economía del emprendedor de El Salvador.</li>
              </ul>
            </div>
          </div>

          {/* Ficha Técnica del Equipo */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">Equipo Creador FinaPyme</h4>
              </div>
              <span className="text-xs font-medium text-slate-500">Docente: Máster Francisco Antonio López Román</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                'Elias David Marroquín Letona',
                'Celeste Marielos Posada González',
                'Allison Cecilia García Rivas',
                'Eduardo Alejandro González Franco',
                'Iliana Elizabeth Cisneros Pineda',
                'Karla Alejandra Arevalo Fiallos',
              ].map((nombre, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{nombre}</span>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-center">
              <p className="text-xs font-medium text-indigo-950 dark:text-indigo-200">
                Principio rector: <em>&ldquo;No existen hechos dentro del edificio; salgan y compruébenlos con los clientes.&rdquo;</em>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB: USUARIOS & ROLES (RBAC) */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'users' && (
        <UserRoleManagement />
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB: SUCURSALES & PUNTOS DE VENTA */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'branches' && (
        <div className="space-y-6">
          <div className="bg-indigo-50/60 dark:bg-indigo-950/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building className="w-4 h-4 text-indigo-600" />
                <span>Gestión Multi-Sucursal & Puntos de Venta (El Salvador)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Define todas las sedes, sucursales y bodegas de tu empresa en los 14 departamentos de El Salvador para reportes desagregados.
              </p>
            </div>
            <button
              onClick={handleOpenCreateBranch}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar Sucursal</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {branches.map((b) => (
              <div
                key={b.id}
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 font-bold flex items-center justify-center text-xs font-mono">
                        {b.code}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm leading-tight">
                          {b.name}
                        </h4>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {typeof b.department === 'string' ? b.department : (b.department as any)?.name || 'San Salvador'}
                        </span>
                      </div>
                    </div>
                    {b.isMain && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        Principal
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300 pt-3 border-t border-slate-100 dark:border-slate-800 mt-2">
                    <p className="flex items-center gap-1.5 text-[11px]">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{b.address || 'Sin dirección específica'}</span>
                    </p>
                    {b.municipality && (
                      <p className="text-[10px] text-slate-400 pl-4.5 truncate">
                        Distrito: {b.municipality}
                      </p>
                    )}
                    <p className="flex items-center gap-1.5 text-[11px]">
                      <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{b.phone}</span>
                    </p>
                    <p className="flex items-center gap-1.5 text-[11px]">
                      <User className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>Encargado: {b.managerName || 'No asignado'}</span>
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${b.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                    {b.isActive ? 'Operativa' : 'Inactiva'}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditBranch(b)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                      title="Editar Sucursal"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {!b.isMain && (
                      <button
                        onClick={() => {
                          if (confirm(`¿Eliminar la sucursal ${b.name}?`)) {
                            deleteBranch(b.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                        title="Eliminar Sucursal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB: PARÁMETROS FISCALES & TASAS */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'fiscal' && (
        <div className="space-y-6">
          <div className="bg-indigo-50/70 dark:bg-slate-900 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-600" />
                <span>Régimen Fiscal Personalizable (El Salvador)</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Si las leyes tributarias o porcentajes laborales cambian, actualízalos aquí sin tocar el código.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleResetFiscalDefaults}
                className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 hover:bg-slate-100 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurar Tasas Legales</span>
              </button>
              <button
                type="button"
                onClick={handleSaveFiscalConfig}
                className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Guardar Parámetros</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Impuestos Comerciales */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                1. Impuestos Comerciales & Tributarios (MH)
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Tasa de IVA General (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingFiscal.ivaRate * 100}
                    onChange={(e) =>
                      setEditingFiscal({ ...editingFiscal, ivaRate: Number(e.target.value) / 100 })
                    }
                    className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Por defecto: 13.00%</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Pago a Cuenta F-07 (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingFiscal.pagoCuentaRate * 100}
                    onChange={(e) =>
                      setEditingFiscal({ ...editingFiscal, pagoCuentaRate: Number(e.target.value) / 100 })
                    }
                    className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Régimen general: 1.75%</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Retención 1% IVA (Gran Contribuyente)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingFiscal.retencionIvaRate * 100}
                    onChange={(e) =>
                      setEditingFiscal({ ...editingFiscal, retencionIvaRate: Number(e.target.value) / 100 })
                    }
                    className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Percepción 1% IVA
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingFiscal.percepcionIvaRate * 100}
                    onChange={(e) =>
                      setEditingFiscal({ ...editingFiscal, percepcionIvaRate: Number(e.target.value) / 100 })
                    }
                    className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Seguridad Social & Prestaciones */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                2. Leyes Laborales, ISSS, AFP & Provisiones
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    ISSS Patronal (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingFiscal.isssPatronalRate * 100}
                    onChange={(e) =>
                      setEditingFiscal({ ...editingFiscal, isssPatronalRate: Number(e.target.value) / 100 })
                    }
                    className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Por defecto: 7.50%</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    ISSS Laboral (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingFiscal.isssLaboralRate * 100}
                    onChange={(e) =>
                      setEditingFiscal({ ...editingFiscal, isssLaboralRate: Number(e.target.value) / 100 })
                    }
                    className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Por defecto: 3.00%</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    AFP Patronal (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingFiscal.afpPatronalRate * 100}
                    onChange={(e) =>
                      setEditingFiscal({ ...editingFiscal, afpPatronalRate: Number(e.target.value) / 100 })
                    }
                    className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Por defecto: 8.75%</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    AFP Laboral (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingFiscal.afpLaboralRate * 100}
                    onChange={(e) =>
                      setEditingFiscal({ ...editingFiscal, afpLaboralRate: Number(e.target.value) / 100 })
                    }
                    className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Por defecto: 7.25%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB: CATÁLOGO DE CUENTAS */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'catalog' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <span>Estructura del Catálogo de Cuentas</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Adapta las cuentas contables a tu tamaño de negocio: Plantilla simplificada para Startups o NIIF Completo.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => loadChartTemplate('simplified')}
                className="px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Cargar Plantilla Startup (Simplificada)</span>
              </button>
              <button
                type="button"
                onClick={() => loadChartTemplate('niif_full')}
                className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <span>Cargar NIIF Completo</span>
              </button>
              <button
                type="button"
                onClick={() => setIsAccountModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Crear Cuenta Contable</span>
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Listado de Cuentas Contables ({chartOfAccounts.length} cuentas)
              </span>
            </div>

            <div className="max-h-[500px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {chartOfAccounts.map((account) => (
                <div
                  key={account.code}
                  className={`p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition ${
                    account.level === 1
                      ? 'bg-slate-100/60 dark:bg-slate-800/60 font-black text-slate-900 dark:text-white'
                      : account.level === 2
                      ? 'font-bold text-slate-800 dark:text-slate-200 pl-6'
                      : 'text-slate-600 dark:text-slate-300 pl-10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 w-20">
                      {account.code}
                    </span>
                    <span>{account.name}</span>
                    {account.isSystem && (
                      <span className="text-[9px] bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded-sm">
                        Sistema
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="uppercase text-[10px] text-slate-400 font-semibold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">
                      {account.category}
                    </span>
                    {!account.isSystem && (
                      <button
                        onClick={() => deleteAccountNode(account.code)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                        title="Eliminar Cuenta"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB: EMPRESAS & RAZÓN SOCIAL */}
      {activeTab === 'company' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {companies.map((comp) => (
              <div
                key={comp.id}
                className={`p-6 rounded-2xl border transition relative flex flex-col justify-between ${
                  comp.id === currentCompany.id
                    ? 'border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/20 shadow-md ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-sm">
                      {comp.name.substring(0, 2).toUpperCase()}
                    </div>
                    {comp.id === currentCompany.id ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-600 text-white">
                        Activa
                      </span>
                    ) : (
                      <button
                        onClick={() => setCurrentCompanyId(comp.id)}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition cursor-pointer"
                      >
                        Seleccionar
                      </button>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                    {comp.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">{comp.tradeName}</p>

                  <div className="mt-4 space-y-1 text-xs text-slate-600 dark:text-slate-400">
                    <p><span className="font-semibold">NIT:</span> {comp.nit}</p>
                    <p><span className="font-semibold">NRC:</span> {comp.nrc}</p>
                    <p><span className="font-semibold">Giro:</span> {comp.giro}</p>
                    <p>
                      <span className="font-semibold">Régimen:</span>{' '}
                      {comp.isGranContribuyente ? 'Gran Contribuyente' : 'Otros Contribuyentes'}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Año Fiscal: {comp.fiscalYear}</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                    USD ($)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB: COPIAS DE SEGURIDAD & JSON */}
      {activeTab === 'backup' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Exportar Respaldo Completo (JSON)
                </h3>
                <p className="text-xs text-slate-500">
                  Descarga todas tus ventas, compras, sucursales, clientes, empleados y cuentas en un archivo seguro.
                </p>
              </div>
            </div>
            <button
              onClick={handleDownloadBackup}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition cursor-pointer"
            >
              Descargar Archivo de Respaldo (.json)
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Restaurar Respaldo (JSON)
                </h3>
                <p className="text-xs text-slate-500">
                  Carga un archivo de respaldo previamente exportado para recuperar tu base de datos.
                </p>
              </div>
            </div>
            <label className="w-full py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold text-center block cursor-pointer hover:bg-slate-100">
              Seleccionar Archivo JSON
              <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: SUCURSAL NUEVA O EDITAR */}
      {/* ---------------------------------------------------- */}
      {isBranchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building className="w-5 h-5 text-indigo-600" />
                <span>{editingBranch ? 'Editar Sucursal' : 'Nueva Sucursal / Punto de Venta'}</span>
              </h3>
              <button onClick={() => setIsBranchModalOpen(false)} className="cursor-pointer">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleBranchSubmit} className="space-y-3.5">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Código:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="SUC-01"
                    value={branchForm.code}
                    onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-800 font-mono text-slate-900 dark:text-white font-bold"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nombre de la Sucursal:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Sucursal Escalón / Bodega Central"
                    value={branchForm.name}
                    onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Departamento (El Salvador):
                  </label>
                  <select
                    value={branchForm.department}
                    onChange={(e) => {
                      const newDept = e.target.value;
                      const munis = getMunicipalitiesForDepartment(newDept);
                      setBranchForm({
                        ...branchForm,
                        department: newDept,
                        municipality: munis[0] || '',
                      });
                    }}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {SALVADORAN_DEPARTMENTS.map((d) => (
                      <option key={d.code} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Municipio / Distrito:
                  </label>
                  <select
                    value={branchForm.municipality}
                    onChange={(e) => setBranchForm({ ...branchForm, municipality: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white truncate"
                  >
                    {getMunicipalitiesForDepartment(branchForm.department).map((m, idx) => (
                      <option key={idx} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Dirección Exacta:
                </label>
                <input
                  type="text"
                  placeholder="Calle, Edificio, Nivel o Local"
                  value={branchForm.address}
                  onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Teléfono de Contacto:
                  </label>
                  <input
                    type="text"
                    placeholder="+503 2200-0000"
                    value={branchForm.phone}
                    onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nombre del Encargado / Gerente:
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Lic. Carlos Hernández"
                    value={branchForm.managerName}
                    onChange={(e) => setBranchForm({ ...branchForm, managerName: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={branchForm.isMain}
                    onChange={(e) => setBranchForm({ ...branchForm, isMain: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    ¿Es la Sede / Sucursal Principal?
                  </span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBranchModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer shadow-md"
                >
                  {editingBranch ? 'Actualizar Sucursal' : 'Crear Sucursal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: REGISTRAR RAZÓN SOCIAL NUEVA */}
      {/* ---------------------------------------------------- */}
      {isCompanyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <span>Registrar Nueva Empresa / Razón Social</span>
              </h3>
              <button onClick={() => setIsCompanyModalOpen(false)} className="cursor-pointer">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateCompany} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Razón Social (Nombre Legal)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Inversiones El Volcán S.A. de C.V."
                  value={newCompanyForm.name}
                  onChange={(e) => setNewCompanyForm({ ...newCompanyForm, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre Comercial
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Volcán Coffee & Tech"
                  value={newCompanyForm.tradeName}
                  onChange={(e) => setNewCompanyForm({ ...newCompanyForm, tradeName: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    NIT
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="0614-010121-102-1"
                    value={newCompanyForm.nit}
                    onChange={(e) => setNewCompanyForm({ ...newCompanyForm, nit: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    NRC
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="298714-3"
                    value={newCompanyForm.nrc}
                    onChange={(e) => setNewCompanyForm({ ...newCompanyForm, nrc: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Giro Comercial
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Venta de Software y Consultoría"
                  value={newCompanyForm.giro}
                  onChange={(e) => setNewCompanyForm({ ...newCompanyForm, giro: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Departamento
                  </label>
                  <select
                    value={newCompanyForm.department}
                    onChange={(e) => setNewCompanyForm({ ...newCompanyForm, department: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {SALVADORAN_DEPARTMENTS.map((d) => (
                      <option key={d.code} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="isGranContribuyente"
                    checked={newCompanyForm.isGranContribuyente}
                    onChange={(e) =>
                      setNewCompanyForm({ ...newCompanyForm, isGranContribuyente: e.target.checked })
                    }
                    className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                  <label htmlFor="isGranContribuyente" className="font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                    ¿Es Gran Contribuyente?
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Dirección Fiscal
                </label>
                <input
                  type="text"
                  required
                  placeholder="Calle, Colonia, Nivel o Local"
                  value={newCompanyForm.address}
                  onChange={(e) => setNewCompanyForm({ ...newCompanyForm, address: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCompanyModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer shadow-md"
                >
                  Registrar Razón Social
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export const SettingsModule: React.FC = () => (
  <ErrorBoundary fallbackTitle="Configuración & Parámetros">
    <SettingsModuleInner />
  </ErrorBoundary>
);

