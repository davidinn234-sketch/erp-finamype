import React, { useState, useEffect } from 'react';
import { useERP } from '../../context/ERPContext';
import { SystemArchetype, Branch } from '../../types';
import {
  Settings,
  Building2,
  User,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Layers,
  Sparkles,
  Wallet,
  Store,
  Briefcase,
  Building,
  Save,
  X,
  HelpCircle,
  AlertTriangle,
  Plus,
  Trash2,
  MapPin,
  Phone,
  Star,
  Check,
} from 'lucide-react';

const SALVADORAN_DEPARTMENTS = [
  'San Salvador',
  'La Libertad',
  'Santa Ana',
  'San Miguel',
  'Sonsonate',
  'Usulután',
  'Ahuachapán',
  'La Paz',
  'Chalatenango',
  'Cuscatlán',
  'Morazán',
  'San Vicente',
  'Cabañas',
  'La Unión',
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialArchetype?: SystemArchetype;
}

export const ExhaustiveCustomizationModal: React.FC<Props> = ({
  isOpen,
  onClose,
  initialArchetype,
}) => {
  const {
    currentUser,
    currentCompany,
    branches,
    saveExhaustiveCustomization,
  } = useERP();

  // Active section tab
  const [activeTab, setActiveTab] = useState<'archetype' | 'personal' | 'business' | 'branches' | 'operations' | 'tax' | 'dte'>('archetype');

  // Section 1: System Archetype
  const [chosenArchetype, setChosenArchetype] = useState<SystemArchetype>(
    initialArchetype || currentUser.systemArchetype || currentCompany.systemArchetype || 'empresa_consolidada_dte'
  );

  // Section 2: Personal Identification
  const [userName, setUserName] = useState(currentUser.name || '');
  const [userDui, setUserDui] = useState(currentUser.dui || '');
  const [userNit, setUserNit] = useState(currentUser.nit || '');
  const [userPhone, setUserPhone] = useState(currentUser.phone || '');
  const [userEmail, setUserEmail] = useState(currentUser.email || '');
  const [userJobTitle, setUserJobTitle] = useState(currentUser.jobTitle || '');
  const [userAddress, setUserAddress] = useState(currentUser.address || '');
  const [userDepartment, setUserDepartment] = useState(currentUser.department || 'San Salvador');
  const [userMunicipality, setUserMunicipality] = useState(currentUser.municipality || 'San Salvador');

  // Section 3: Business Information
  const [companyName, setCompanyName] = useState(currentCompany.name || '');
  const [companyTradeName, setCompanyTradeName] = useState(currentCompany.tradeName || '');
  const [companyNit, setCompanyNit] = useState(currentCompany.nit || '');
  const [companyNrc, setCompanyNrc] = useState(currentCompany.nrc || '');
  const [companyGiro, setCompanyGiro] = useState(currentCompany.giro || '');
  const [companyCiiu, setCompanyCiiu] = useState(currentCompany.economicActivityCode || '47110');
  const [companyAddress, setCompanyAddress] = useState(currentCompany.address || '');
  const [companyPhone, setCompanyPhone] = useState(currentCompany.phone || '');
  const [companyEmail, setCompanyEmail] = useState(currentCompany.email || '');
  const [companyFiscalYear, setCompanyFiscalYear] = useState<number>(currentCompany.fiscalYear || 2026);
  const [isGranContribuyente, setIsGranContribuyente] = useState<boolean>(currentCompany.isGranContribuyente || false);

  // Section 4: Sucursales (Puntos de Venta)
  const [userBranches, setUserBranches] = useState<Array<{
    id: string;
    code: string;
    name: string;
    address: string;
    department: string;
    municipality: string;
    phone: string;
    managerName: string;
    isMain: boolean;
  }>>([]);

  // Section 5: Tax Configuration
  const [declaIva, setDeclaIva] = useState(currentCompany.taxesConfig?.declaIva ?? true);
  const [declaPagoCuenta, setDeclaPagoCuenta] = useState(currentCompany.taxesConfig?.declaPagoCuenta ?? true);
  const [declaImpuestosMunicipales, setDeclaImpuestosMunicipales] = useState(currentCompany.taxesConfig?.declaImpuestosMunicipales ?? true);
  const [municipalRateOrFee, setMunicipalRateOrFee] = useState<number>(currentCompany.taxesConfig?.municipalRateOrFee || 25.0);
  const [alcaldiaName, setAlcaldiaName] = useState(currentCompany.taxesConfig?.alcaldiaName || 'Alcaldía Municipal de San Salvador Centro');
  const [isRetencionAgent, setIsRetencionAgent] = useState(currentCompany.taxesConfig?.isRetencionAgent ?? false);
  const [retainsIncomeTax10, setRetainsIncomeTax10] = useState(currentCompany.taxesConfig?.retainsIncomeTax10 ?? true);

  // Section 6: Electronic Billing DTE MH Parameters
  const [dteEnvironment, setDteEnvironment] = useState<'pruebas' | 'produccion'>(currentCompany.dteEnvironment || 'pruebas');
  const [dtePrivateKey, setDtePrivateKey] = useState(currentCompany.dtePrivateKey || 'MH-RSA-KEY-2026-X992-SECURE');
  const [dteApiPassword, setDteApiPassword] = useState(currentCompany.dteApiPassword || '••••••••••••');
  const [dteEstablishmentCode, setDteEstablishmentCode] = useState(currentCompany.dteEstablishmentCode || '0001');
  const [dtePointOfSaleCode, setDtePointOfSaleCode] = useState(currentCompany.dtePointOfSaleCode || 'P01');

  // Section 7: Operations & Inventory
  const [hasEmployees, setHasEmployees] = useState(currentCompany.hasEmployees ?? true);
  const [inventoryValuation, setInventoryValuation] = useState<'promedio_ponderado' | 'peps'>(
    currentCompany.inventoryMethod === 'peps' ? 'peps' : 'promedio_ponderado'
  );

  useEffect(() => {
    if (isOpen) {
      setChosenArchetype(currentUser.systemArchetype || currentCompany.systemArchetype || 'empresa_consolidada_dte');
      setUserName(currentUser.name || '');
      setUserDui(currentUser.dui || '');
      setUserNit(currentUser.nit || '');
      setUserPhone(currentUser.phone || '');
      setUserEmail(currentUser.email || '');
      setUserJobTitle(currentUser.jobTitle || '');
      setUserAddress(currentUser.address || '');
      setUserDepartment(currentUser.department || 'San Salvador');
      setUserMunicipality(currentUser.municipality || 'San Salvador');

      setCompanyName(currentCompany.name || '');
      setCompanyTradeName(currentCompany.tradeName || '');
      setCompanyNit(currentCompany.nit || '');
      setCompanyNrc(currentCompany.nrc || '');
      setCompanyGiro(currentCompany.giro || '');
      setCompanyCiiu(currentCompany.economicActivityCode || '47110');
      setCompanyAddress(currentCompany.address || '');
      setCompanyPhone(currentCompany.phone || '');
      setCompanyEmail(currentCompany.email || '');
      setInventoryValuation(currentCompany.inventoryMethod === 'peps' ? 'peps' : 'promedio_ponderado');

      const existingBranches = branches.filter((b) => b.companyId === currentCompany.id);
      if (existingBranches.length > 0) {
        setUserBranches(existingBranches.map((b) => ({
          id: b.id,
          code: b.code || 'SUC-01',
          name: b.name,
          address: b.address || currentCompany.address || '',
          department: b.department || currentCompany.department || 'San Salvador',
          municipality: b.municipality || currentCompany.municipality || 'San Salvador Centro',
          phone: b.phone || currentCompany.phone || '',
          managerName: b.managerName || currentUser.name || '',
          isMain: b.isMain,
        })));
      } else {
        setUserBranches([
          {
            id: `branch_${Date.now()}`,
            code: 'SUC-01',
            name: `${currentCompany.tradeName || currentCompany.name || 'Mi Negocio'} - Casa Matriz`,
            address: currentCompany.address || 'San Salvador, El Salvador',
            department: currentCompany.department || 'San Salvador',
            municipality: currentCompany.municipality || 'San Salvador Centro',
            phone: currentCompany.phone || '+503 7000-0000',
            managerName: currentUser.name || '',
            isMain: true,
          }
        ]);
      }
    }
  }, [isOpen, currentUser, currentCompany, branches]);

  // Adjust default presets when changing archetype
  const handleArchetypeChange = (arch: SystemArchetype) => {
    setChosenArchetype(arch);
    if (arch === 'finanzas_personales') {
      setDeclaIva(false);
      setDeclaPagoCuenta(false);
      setDeclaImpuestosMunicipales(false);
      setHasEmployees(false);
    } else if (arch === 'emprendedor_control_interno') {
      setDeclaIva(false);
      setDeclaPagoCuenta(false);
      setDeclaImpuestosMunicipales(true);
      setHasEmployees(false);
    } else {
      setDeclaIva(true);
      setDeclaPagoCuenta(true);
      setDeclaImpuestosMunicipales(true);
      setHasEmployees(true);
    }
  };

  const handleAddBranch = () => {
    const nextNum = userBranches.length + 1;
    setUserBranches((prev) => [
      ...prev,
      {
        id: `branch_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        code: `SUC-0${nextNum}`,
        name: `Sucursal ${nextNum}`,
        address: companyAddress || 'San Salvador, El Salvador',
        department: userDepartment || 'San Salvador',
        municipality: userMunicipality || 'San Salvador Centro',
        phone: companyPhone || '+503 7000-0000',
        managerName: '',
        isMain: prev.length === 0,
      }
    ]);
  };

  const handleSetPresetBranches = (count: number) => {
    const baseName = companyTradeName || companyName || 'Mi Empresa';
    if (count === 1) {
      setUserBranches([
        {
          id: userBranches[0]?.id || `branch_${Date.now()}`,
          code: 'SUC-01',
          name: `${baseName} - Casa Matriz`,
          address: companyAddress || 'San Salvador, El Salvador',
          department: userDepartment || 'San Salvador',
          municipality: userMunicipality || 'San Salvador Centro',
          phone: companyPhone || '+503 7000-0000',
          managerName: userName || '',
          isMain: true,
        }
      ]);
    } else if (count === 2) {
      setUserBranches([
        {
          id: userBranches[0]?.id || `branch_${Date.now()}_1`,
          code: 'SUC-01',
          name: `${baseName} - Casa Matriz Central`,
          address: companyAddress || 'San Salvador, El Salvador',
          department: userDepartment || 'San Salvador',
          municipality: userMunicipality || 'San Salvador Centro',
          phone: companyPhone || '+503 7000-0000',
          managerName: userName || '',
          isMain: true,
        },
        {
          id: userBranches[1]?.id || `branch_${Date.now()}_2`,
          code: 'SUC-02',
          name: 'Sucursal Escalón',
          address: 'Paseo General Escalón, San Salvador',
          department: 'San Salvador',
          municipality: 'San Salvador Centro',
          phone: companyPhone || '+503 7000-0000',
          managerName: '',
          isMain: false,
        }
      ]);
    } else if (count === 3) {
      setUserBranches([
        {
          id: userBranches[0]?.id || `branch_${Date.now()}_1`,
          code: 'SUC-01',
          name: `${baseName} - Casa Matriz Central`,
          address: companyAddress || 'San Salvador, El Salvador',
          department: userDepartment || 'San Salvador',
          municipality: userMunicipality || 'San Salvador Centro',
          phone: companyPhone || '+503 7000-0000',
          managerName: userName || '',
          isMain: true,
        },
        {
          id: userBranches[1]?.id || `branch_${Date.now()}_2`,
          code: 'SUC-02',
          name: 'Sucursal Escalón',
          address: 'Paseo General Escalón, San Salvador',
          department: 'San Salvador',
          municipality: 'San Salvador Centro',
          phone: companyPhone || '+503 7000-0000',
          managerName: '',
          isMain: false,
        },
        {
          id: userBranches[2]?.id || `branch_${Date.now()}_3`,
          code: 'SUC-03',
          name: 'Sucursal Santa Tecla',
          address: 'Centro Comercial Las Ramblas, Santa Tecla',
          department: 'La Libertad',
          municipality: 'La Libertad Centro',
          phone: companyPhone || '+503 7000-0000',
          managerName: '',
          isMain: false,
        }
      ]);
    }
  };

  const handleRemoveBranch = (id: string) => {
    if (userBranches.length <= 1) return;
    setUserBranches((prev) => {
      const remaining = prev.filter((b) => b.id !== id);
      if (remaining.length > 0 && !remaining.some((b) => b.isMain)) {
        remaining[0].isMain = true;
      }
      return remaining;
    });
  };

  const handleSetMainBranch = (id: string) => {
    setUserBranches((prev) =>
      prev.map((b) => ({ ...b, isMain: b.id === id }))
    );
  };

  const handleUpdateBranch = (
    id: string,
    field: 'name' | 'address' | 'phone' | 'code' | 'department' | 'municipality' | 'managerName',
    val: string
  ) => {
    setUserBranches((prev) =>
      prev.map((b) => (b.id === id ? { ...b, [field]: val } : b))
    );
  };

  const handleSave = () => {
    const mappedBranches: Branch[] = userBranches.map((b) => ({
      id: b.id,
      companyId: currentCompany.id,
      code: b.code || 'SUC-01',
      name: b.name.trim() || 'Sucursal',
      address: b.address.trim() || companyAddress || 'San Salvador',
      department: b.department || userDepartment || 'San Salvador',
      municipality: b.municipality || userMunicipality || 'San Salvador Centro',
      phone: b.phone.trim() || companyPhone || '+503 7000-0000',
      managerName: b.managerName ? b.managerName.trim() : undefined,
      isMain: b.isMain,
      isActive: true,
    }));

    saveExhaustiveCustomization({
      chosenArchetype,
      userUpdates: {
        name: userName,
        dui: userDui,
        nit: userNit,
        phone: userPhone,
        email: userEmail,
        jobTitle: userJobTitle,
        address: userAddress,
        department: userDepartment,
        municipality: userMunicipality,
      },
      companyUpdates: {
        name: companyName,
        tradeName: companyTradeName,
        nit: companyNit,
        nrc: companyNrc,
        giro: companyGiro,
        economicActivityCode: companyCiiu,
        address: companyAddress,
        phone: companyPhone,
        email: companyEmail,
        fiscalYear: companyFiscalYear,
        isGranContribuyente,
        inventoryMethod: inventoryValuation === 'peps' ? 'peps' : 'costo_promedio',
        dteEnvironment,
        dtePrivateKey,
        dteApiPassword,
        dteEstablishmentCode,
        dtePointOfSaleCode,
        hasEmployees,
        taxesConfig: {
          declaIva,
          declaPagoCuenta,
          declaImpuestosMunicipales,
          municipalRateOrFee,
          alcaldiaName,
          isRetencionAgent,
          retainsIncomeTax10,
        },
      },
      branchesUpdates: mappedBranches,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      id="exhaustive-customization-overlay"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn"
    >
      <div
        id="exhaustive-customization-modal"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Personalización Exhaustiva del Sistema FinaPyme
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Formulario integral de configuración fiscal, perfil tributario y modo operativo
              </p>
            </div>
          </div>
          <button
            type="button"
            id="close-customization-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex items-center overflow-x-auto border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-950/40 px-4 pt-2 gap-1 scrollbar-none text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('archetype')}
            className={`px-3 py-2 rounded-t-lg transition-all flex items-center gap-1.5 border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'archetype'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>1. Arquetipo de Sistema</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('personal')}
            className={`px-3 py-2 rounded-t-lg transition-all flex items-center gap-1.5 border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'personal'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>2. Datos del Titular</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('business')}
            className={`px-3 py-2 rounded-t-lg transition-all flex items-center gap-1.5 border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'business'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>3. Datos de la Empresa / Negocio</span>
          </button>

          <button
            type="button"
            id="tab-branches-btn"
            onClick={() => setActiveTab('branches')}
            className={`px-3 py-2 rounded-t-lg transition-all flex items-center gap-1.5 border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'branches'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>4. Sucursales & Puntos de Venta</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
              {userBranches.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tax')}
            className={`px-3 py-2 rounded-t-lg transition-all flex items-center gap-1.5 border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'tax'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>5. Régimen Tributario</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('dte')}
            className={`px-3 py-2 rounded-t-lg transition-all flex items-center gap-1.5 border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'dte'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>6. Facturación DTE (Hacienda)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('operations')}
            className={`px-3 py-2 rounded-t-lg transition-all flex items-center gap-1.5 border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'operations'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>7. Operativa & Personal</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: ARQUETIPO DE SISTEMA */}
          {activeTab === 'archetype' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 rounded-xl text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2.5">
                <HelpCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  Selecciona la modalidad operativa que mejor se ajusta a tu realidad actual. Podrás cambiar o ascender de arquetipo en cualquier momento según crezca tu negocio.
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Emprendedor / Control Interno */}
                <div
                  onClick={() => handleArchetypeChange('emprendedor_control_interno')}
                  className={`p-5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    chosenArchetype === 'emprendedor_control_interno'
                      ? 'border-amber-500 bg-amber-500/5 shadow-md shadow-amber-500/10'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                        <Store className="w-5 h-5" />
                      </div>
                      {chosenArchetype === 'emprendedor_control_interno' && (
                        <CheckCircle2 className="w-5 h-5 text-amber-500" />
                      )}
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                      Emprendedor (Control Interno)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Para pequeños negocios, tiendas y servicios que operan con tickets y recibos internos sin emisión de comprobantes ante Hacienda.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                    ✓ Punto de Venta • Control de Inventario • Tasas Alcaldía
                  </div>
                </div>

                {/* 2. Negocio en Transición */}
                <div
                  onClick={() => handleArchetypeChange('negocio_transicion')}
                  className={`p-5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    chosenArchetype === 'negocio_transicion'
                      ? 'border-indigo-500 bg-indigo-500/5 shadow-md shadow-indigo-500/10'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                        <Briefcase className="w-5 h-5" />
                      </div>
                      {chosenArchetype === 'negocio_transicion' && (
                        <CheckCircle2 className="w-5 h-5 text-indigo-500" />
                      )}
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                      Negocio en Transición DTE
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Emite comprobantes fiscales tradicionales mientras realiza pruebas de firma electrónica y homologación con el Ministerio de Hacienda.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                    ✓ Facturación Híbrida • Pruebas MH • IVA y F-07
                  </div>
                </div>

                {/* 3. Empresa Consolidada DTE MH */}
                <div
                  onClick={() => handleArchetypeChange('empresa_consolidada_dte')}
                  className={`p-5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    chosenArchetype === 'empresa_consolidada_dte'
                      ? 'border-blue-600 bg-blue-500/5 shadow-md shadow-blue-500/10'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                        <Building className="w-5 h-5" />
                      </div>
                      {chosenArchetype === 'empresa_consolidada_dte' && (
                        <CheckCircle2 className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                      Empresa Consolidada (DTE MH Activo)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Cumplimiento total con la Dirección General de Impuestos Internos (DGII). Transmisión JSON en tiempo real con firma electrónica ministerial.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                    ✓ Factura Electrónica • Crédito Fiscal • Sello de Recepción MH
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DATOS DEL TITULAR */}
          {activeTab === 'personal' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Información Exhaustiva del Titular / Usuario Principal
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Nombre Completo del Titular *
                  </label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Ej: Lic. Carlos Henríquez"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Documento Único de Identidad (DUI) *
                  </label>
                  <input
                    type="text"
                    value={userDui}
                    onChange={(e) => setUserDui(e.target.value)}
                    placeholder="00000000-0"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    NIT Personal (Homologado con DUI o formato anterior)
                  </label>
                  <input
                    type="text"
                    value={userNit}
                    onChange={(e) => setUserNit(e.target.value)}
                    placeholder="0614-000000-000-0"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Cargo / Ocupación o Profesión
                  </label>
                  <input
                    type="text"
                    value={userJobTitle}
                    onChange={(e) => setUserJobTitle(e.target.value)}
                    placeholder="Ej: Gerente General / Profesional Independiente"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Teléfono Celular / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={userPhone}
                    onChange={(e) => setUserPhone(e.target.value)}
                    placeholder="+503 7000-0000"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Correo Electrónico de Notificaciones
                  </label>
                  <input
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Departamento de Residencia
                  </label>
                  <select
                    value={userDepartment}
                    onChange={(e) => setUserDepartment(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="San Salvador">San Salvador</option>
                    <option value="La Libertad">La Libertad</option>
                    <option value="Santa Ana">Santa Ana</option>
                    <option value="San Miguel">San Miguel</option>
                    <option value="Sonsonate">Sonsonate</option>
                    <option value="Usulután">Usulután</option>
                    <option value="Ahuachapán">Ahuachapán</option>
                    <option value="La Paz">La Paz</option>
                    <option value="Chalatenango">Chalatenango</option>
                    <option value="Cuscatlán">Cuscatlán</option>
                    <option value="Morazán">Morazán</option>
                    <option value="San Vicente">San Vicente</option>
                    <option value="Cabañas">Cabañas</option>
                    <option value="La Unión">La Unión</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Municipio / Distrito
                  </label>
                  <input
                    type="text"
                    value={userMunicipality}
                    onChange={(e) => setUserMunicipality(e.target.value)}
                    placeholder="Ej: San Salvador Centro, Santa Tecla"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Dirección Domiciliar Exacta
                  </label>
                  <input
                    type="text"
                    value={userAddress}
                    onChange={(e) => setUserAddress(e.target.value)}
                    placeholder="Colonia, Calle o Avenida, Polígono o Pasaje, Número de Casa"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DATOS DE LA EMPRESA / NEGOCIO */}
          {activeTab === 'business' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Identificación de la Empresa o Establecimiento Comercial
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Razón Social Oficial (o Nombre Completo si es Persona Natural)
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Ej: SivarTech Solutions S.A. de C.V."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Nombre Comercial (Rótulo / Marca)
                  </label>
                  <input
                    type="text"
                    value={companyTradeName}
                    onChange={(e) => setCompanyTradeName(e.target.value)}
                    placeholder="Ej: SivarTech Store"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    NIT de la Empresa (si aplica)
                  </label>
                  <input
                    type="text"
                    value={companyNit}
                    onChange={(e) => setCompanyNit(e.target.value)}
                    placeholder="0614-010121-102-1"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Número de Registro de Contribuyente (NRC)
                  </label>
                  <input
                    type="text"
                    value={companyNrc}
                    onChange={(e) => setCompanyNrc(e.target.value)}
                    placeholder="298714-3"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Giro Comercial / Actividad Económica
                  </label>
                  <input
                    type="text"
                    value={companyGiro}
                    onChange={(e) => setCompanyGiro(e.target.value)}
                    placeholder="Venta de tecnología, software y consultoría"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Código de Actividad Económica (CIIU MH)
                  </label>
                  <input
                    type="text"
                    value={companyCiiu}
                    onChange={(e) => setCompanyCiiu(e.target.value)}
                    placeholder="Ej: 47110, 62010"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Dirección Comercial / Casa Matriz
                  </label>
                  <input
                    type="text"
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                    placeholder="Calle o Avenida, Edificio o Local, San Salvador"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Año Fiscal Vigente
                  </label>
                  <input
                    type="number"
                    value={companyFiscalYear}
                    onChange={(e) => setCompanyFiscalYear(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center gap-3 pt-6">
                  <input
                    id="gran-contribuyente-checkbox"
                    type="checkbox"
                    checked={isGranContribuyente}
                    onChange={(e) => setIsGranContribuyente(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 dark:border-slate-700"
                  />
                  <label
                    htmlFor="gran-contribuyente-checkbox"
                    className="text-xs font-medium text-slate-800 dark:text-slate-200 cursor-pointer"
                  >
                    Clasificado como Gran Contribuyente por Ministerio de Hacienda
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SUCURSALES & PUNTOS DE VENTA */}
          {activeTab === 'branches' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-900/50 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Establecimientos, Sucursales y Puntos de Venta
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Personaliza las sucursales de tu empresa. Estas sedes estarán vinculadas a tu Terminal POS, Facturas DTE, Compras y Planilla Laboral.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  id="add-custom-branch-btn"
                  onClick={handleAddBranch}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-sm cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Agregar Sucursal</span>
                </button>
              </div>

              {/* Quick Presets */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Plantillas Rápidas:
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSetPresetBranches(1)}
                    className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium transition cursor-pointer"
                  >
                    1 Sede (Casa Matriz)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetPresetBranches(2)}
                    className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium transition cursor-pointer"
                  >
                    2 Sedes (Matriz + 1 Sucursal)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetPresetBranches(3)}
                    className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium transition cursor-pointer"
                  >
                    3 Sedes (Matriz + 2 Sucursales)
                  </button>
                </div>
              </div>

              {/* Branches List */}
              <div className="space-y-4">
                {userBranches.map((branch, index) => (
                  <div
                    key={branch.id}
                    className={`p-4 rounded-xl border transition-all ${
                      branch.isMain
                        ? 'border-blue-400 dark:border-blue-700 bg-blue-50/20 dark:bg-blue-950/20 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                    }`}
                  >
                    {/* Branch Card Header */}
                    <div className="flex flex-wrap items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center">
                          {index + 1}
                        </span>
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {branch.name || `Sucursal ${index + 1}`}
                        </span>
                        <span className="px-2 py-0.5 rounded font-mono text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          {branch.code || `SUC-0${index + 1}`}
                        </span>
                        {branch.isMain && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 text-[10px] font-bold">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                            Casa Matriz / Sede Principal
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {!branch.isMain && (
                          <button
                            type="button"
                            onClick={() => handleSetMainBranch(branch.id)}
                            className="text-xs px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                          >
                            Hacer Casa Matriz
                          </button>
                        )}
                        {userBranches.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveBranch(branch.id)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                            title="Eliminar esta sucursal"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Branch Fields Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                      <div>
                        <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Nombre del Establecimiento / Sucursal:
                        </label>
                        <input
                          type="text"
                          value={branch.name}
                          onChange={(e) => handleUpdateBranch(branch.id, 'name', e.target.value)}
                          placeholder="ej: Casa Matriz - Escalón"
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
                          required
                        />
                      </div>

                      <div>
                        <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Código de Establecimiento:
                        </label>
                        <input
                          type="text"
                          value={branch.code}
                          onChange={(e) => handleUpdateBranch(branch.id, 'code', e.target.value)}
                          placeholder="ej: SUC-01"
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                          required
                        />
                      </div>

                      <div>
                        <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Teléfono de la Sucursal:
                        </label>
                        <input
                          type="text"
                          value={branch.phone}
                          onChange={(e) => handleUpdateBranch(branch.id, 'phone', e.target.value)}
                          placeholder="+503 2244-8800"
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Dirección Física Completa:
                        </label>
                        <input
                          type="text"
                          value={branch.address}
                          onChange={(e) => handleUpdateBranch(branch.id, 'address', e.target.value)}
                          placeholder="Calle, Edificio o Local, Referencia geográfica"
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                          required
                        />
                      </div>

                      <div>
                        <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Departamento (El Salvador):
                        </label>
                        <select
                          value={branch.department}
                          onChange={(e) => handleUpdateBranch(branch.id, 'department', e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                        >
                          {SALVADORAN_DEPARTMENTS.map((dept) => (
                            <option key={dept} value={dept}>
                              {dept}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Municipio:
                        </label>
                        <input
                          type="text"
                          value={branch.municipality}
                          onChange={(e) => handleUpdateBranch(branch.id, 'municipality', e.target.value)}
                          placeholder="ej: San Salvador Centro, Santa Tecla"
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Encargado / Responsable de Sucursal:
                        </label>
                        <input
                          type="text"
                          value={branch.managerName}
                          onChange={(e) => handleUpdateBranch(branch.id, 'managerName', e.target.value)}
                          placeholder="Nombre del Administrador de la Sede"
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-blue-500 shrink-0" />
                <span>
                  Al guardar, estas sucursales se sincronizarán directamente en Firebase Firestore y se activarán como opciones seleccionables en la <strong>Terminal POS de Venta</strong>, <strong>Facturación DTE</strong>, <strong>Compras a Proveedores</strong> y <strong>Nómina de Empleados</strong>.
                </span>
              </div>
            </div>
          )}

          {/* TAB 5: RÉGIMEN TRIBUTARIO */}
          {activeTab === 'tax' && (
            <div className="space-y-5">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Parámetros Impositivos y Declaraciones Periódicas
              </h3>

              <div className="space-y-3">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-start gap-3">
                  <input
                    id="iva-toggle"
                    type="checkbox"
                    checked={declaIva}
                    onChange={(e) => setDeclaIva(e.target.checked)}
                    className="w-4 h-4 text-blue-600 mt-1 rounded border-slate-300 dark:border-slate-700"
                  />
                  <div>
                    <label htmlFor="iva-toggle" className="font-semibold text-xs text-slate-900 dark:text-white block cursor-pointer">
                      Declaración Mensual de IVA 13% (Formulario F-07)
                    </label>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Calcula débito y crédito fiscal, genera libro de compras y ventas de contribuyentes y consumidores finales.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-start gap-3">
                  <input
                    id="pago-cuenta-toggle"
                    type="checkbox"
                    checked={declaPagoCuenta}
                    onChange={(e) => setDeclaPagoCuenta(e.target.checked)}
                    className="w-4 h-4 text-blue-600 mt-1 rounded border-slate-300 dark:border-slate-700"
                  />
                  <div>
                    <label htmlFor="pago-cuenta-toggle" className="font-semibold text-xs text-slate-900 dark:text-white block cursor-pointer">
                      Anticipo a Cuenta de Impuesto sobre la Renta (1.75%)
                    </label>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Aplica retención mensual de 1.75% sobre ingresos brutos de operaciones gravadas.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-start gap-3">
                  <input
                    id="retencion-10-toggle"
                    type="checkbox"
                    checked={retainsIncomeTax10}
                    onChange={(e) => setRetainsIncomeTax10(e.target.checked)}
                    className="w-4 h-4 text-blue-600 mt-1 rounded border-slate-300 dark:border-slate-700"
                  />
                  <div>
                    <label htmlFor="retencion-10-toggle" className="font-semibold text-xs text-slate-900 dark:text-white block cursor-pointer">
                      Retención del 10% de Renta en Servicios Profesionales / Técnicos
                    </label>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Aplica retención de 10% sobre recibos de honorarios de personas naturales no domiciliadas en planilla.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-start gap-3">
                  <input
                    id="retencion-agente-toggle"
                    type="checkbox"
                    checked={isRetencionAgent}
                    onChange={(e) => setIsRetencionAgent(e.target.checked)}
                    className="w-4 h-4 text-blue-600 mt-1 rounded border-slate-300 dark:border-slate-700"
                  />
                  <div>
                    <label htmlFor="retencion-agente-toggle" className="font-semibold text-xs text-slate-900 dark:text-white block cursor-pointer">
                      Agente de Retención de IVA 1%
                    </label>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Retiene el 1% de IVA a proveedores en compras mayores a $100.00 netos.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    id="tasas-municipales-toggle"
                    type="checkbox"
                    checked={declaImpuestosMunicipales}
                    onChange={(e) => setDeclaImpuestosMunicipales(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 dark:border-slate-700"
                  />
                  <label htmlFor="tasas-municipales-toggle" className="font-semibold text-xs text-slate-900 dark:text-white cursor-pointer">
                    Tasas e Impuestos Municipales (Alcaldía)
                  </label>
                </div>

                {declaImpuestosMunicipales && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Nombre de la Alcaldía Municipal
                      </label>
                      <input
                        type="text"
                        value={alcaldiaName}
                        onChange={(e) => setAlcaldiaName(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Cuota Fija Mensual Estimada ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={municipalRateOrFee}
                        onChange={(e) => setMunicipalRateOrFee(Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: FACTURACIÓN DTE HACIENDA */}
          {activeTab === 'dte' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Credenciales & Entorno de Facturación Electrónica DTE MH
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Parámetros para la firma electrónica y recepción de sellos ministeriales
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  chosenArchetype === 'empresa_consolidada_dte'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}>
                  {chosenArchetype === 'empresa_consolidada_dte' ? 'DTE Activo' : 'DTE Opcional'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Ambiente del Ministerio de Hacienda
                  </label>
                  <select
                    value={dteEnvironment}
                    onChange={(e) => setDteEnvironment(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                  >
                    <option value="pruebas">Ambiente de Pruebas / Homologación</option>
                    <option value="produccion">Ambiente Oficial de Producción MH</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Código de Establecimiento MH (ej: 0001)
                  </label>
                  <input
                    type="text"
                    value={dteEstablishmentCode}
                    onChange={(e) => setDteEstablishmentCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Código de Punto de Venta MH (ej: P01)
                  </label>
                  <input
                    type="text"
                    value={dtePointOfSaleCode}
                    onChange={(e) => setDtePointOfSaleCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Contraseña API / Token DTE
                  </label>
                  <input
                    type="password"
                    value={dteApiPassword}
                    onChange={(e) => setDteApiPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Identificador de Clave Privada / Certificado de Firma Digital
                  </label>
                  <input
                    type="text"
                    value={dtePrivateKey}
                    onChange={(e) => setDtePrivateKey(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white font-mono text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: OPERATIVA & PERSONAL */}
          {activeTab === 'operations' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Estructura Operativa & Recursos Humanos
              </h3>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-start gap-3">
                <input
                  id="has-employees-toggle"
                  type="checkbox"
                  checked={hasEmployees}
                  onChange={(e) => setHasEmployees(e.target.checked)}
                  className="w-4 h-4 text-blue-600 mt-1 rounded border-slate-300 dark:border-slate-700"
                />
                <div>
                  <label htmlFor="has-employees-toggle" className="font-semibold text-xs text-slate-900 dark:text-white block cursor-pointer">
                    El Negocio Cuenta con Empleados / Planilla Laboral
                  </label>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Habilita el módulo de Recursos Humanos, cálculo de retención ISSS (3%), AFP Crecer/Confía (7.25%), e Impuesto sobre la Renta quincenal o mensual.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Método de Valuación de Inventario (Kardex)
                </label>
                <select
                  value={inventoryValuation}
                  onChange={(e) => setInventoryValuation(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                >
                  <option value="promedio_ponderado">Costo Promedio Ponderado (Estándar NIIF)</option>
                  <option value="peps">Primeras Entradas, Primeras Salidas (PEPS / FIFO)</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>Configuración persistida automáticamente en tu sesión</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              id="save-exhaustive-customization-btn"
              onClick={handleSave}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Guardar y Aplicar Personalización</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};