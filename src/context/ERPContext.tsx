import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  Company,
  Branch,
  UserProfile,
  Product,
  Customer,
  Supplier,
  Employee,
  BankAccount,
  Invoice,
  Purchase,
  Payroll,
  JournalEntry,
  KardexMovement,
  TreasuryMovement,
  AccountNode,
  CustomerPayment,
  SupplierPayment,
  CashFlowProjectionItem,
  RealCashFlowPeriod,
  UserRole,
  FiscalConfig,
  CustomerNote,
  SupplierNote,
  EmployeeEvaluation,
  DisciplinaryAction,
  DynamicChartWidget,
  OtherIncome,
  PersonalTransaction,
  PersonalBudgetCategory,
  PersonalSavingGoal,
  SystemArchetype,
  ProfessionalServiceRecord,
  CandidateFolder,
  CandidateApplicant,
} from '../types';
import {
  SAMPLE_COMPANIES,
  SAMPLE_BRANCHES,
  SAMPLE_USERS,
  SAMPLE_PRODUCTS,
  SAMPLE_CUSTOMERS,
  SAMPLE_SUPPLIERS,
  SAMPLE_EMPLOYEES,
  SAMPLE_BANK_ACCOUNTS,
  SAMPLE_INVOICES,
  SAMPLE_PURCHASES,
  SAMPLE_PAYROLLS,
  SAMPLE_KARDEX_MOVEMENTS,
  SAMPLE_JOURNAL_ENTRIES,
  INITIAL_DYNAMIC_WIDGETS,
  SAMPLE_OTHER_INCOMES,
  SAMPLE_PROFESSIONAL_SERVICES,
  SAMPLE_CANDIDATE_FOLDERS,
  SAMPLE_CANDIDATE_APPLICANTS,
} from '../utils/sampleData';
import {
  DEFAULT_CHART_OF_ACCOUNTS,
  SIMPLIFIED_STARTUP_CHART_OF_ACCOUNTS,
  FULL_NIIF_CHART_OF_ACCOUNTS,
} from '../utils/catalogData';
import {
  generateSaleAccountingEntry,
  generatePurchaseAccountingEntry,
  generatePayrollAccountingEntry,
  generateCustomerPaymentEntry,
  generateSupplierPaymentEntry,
  createBalancedJournalEntry,
} from '../utils/accountingEngine';
import {
  DEFAULT_FISCAL_CONFIG,
  calculateEmployeePayroll,
  calculateSaleTaxes,
  calculatePurchaseTaxes,
  formatCurrencyUSD,
} from '../utils/salvadoranTax';
import { db, testFirebaseConnection } from '../lib/firebase';
import { doc, setDoc, getDoc, getDocs, collection, deleteDoc, onSnapshot } from 'firebase/firestore';

interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
}

interface ERPContextType {
  // Multitenancy & Auth & Sucursales
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  
  companies: Company[];
  currentCompany: Company;
  setCurrentCompanyId: (id: string) => void;
  createCompany: (company: Omit<Company, 'id'>) => void;
  updateCompany: (id: string, updates: Partial<Company>) => void;
  createCompanyWithAdmin: (
    companyData: Omit<Company, 'id'>,
    adminData: { name: string; email: string; password?: string; phone?: string }
  ) => Promise<{ company: Company; user: UserProfile }>;
  deleteCompany: (companyId: string) => void;
  resetCompanyDataToZero: (companyId: string) => void;
  clearAllDemoData: () => void;
  isSupportMode: boolean;
  enterSupportMode: (companyId: string) => void;
  exitSupportMode: () => void;
  
  branches: Branch[];
  selectedBranchId: string;
  setSelectedBranchId: (id: string) => void;
  createBranch: (branch: Omit<Branch, 'id' | 'companyId'>) => void;
  updateBranch: (id: string, updates: Partial<Branch>) => void;
  deleteBranch: (id: string) => void;
  
  users: UserProfile[];
  currentUser: UserProfile;
  setCurrentUserId: (id: string) => void;
  userRole: UserRole;
  createUser: (user: Omit<UserProfile, 'id'>) => void;
  updateUser: (id: string, updates: Partial<UserProfile>) => void;
  deleteUser: (id: string) => void;

  // Personal Finances Module
  personalTransactions: PersonalTransaction[];
  personalBudgets: PersonalBudgetCategory[];
  personalSavingGoals: PersonalSavingGoal[];
  addPersonalTransaction: (tx: Omit<PersonalTransaction, 'id' | 'userId'>) => void;
  deletePersonalTransaction: (id: string) => void;
  updatePersonalBudget: (id: string, newAmount: number) => void;
  depositToSavingGoal: (id: string, amount: number) => void;
  addPersonalSavingGoal: (goal: Omit<PersonalSavingGoal, 'id'>) => void;

  // Exhaustive Customization & Setup
  isExhaustiveCustomizationOpen: boolean;
  setIsExhaustiveCustomizationOpen: (open: boolean) => void;
  isCloudUserManagerOpen: boolean;
  setIsCloudUserManagerOpen: (open: boolean) => void;
  saveExhaustiveCustomization: (data: {
    userUpdates: Partial<UserProfile>;
    companyUpdates: Partial<Company>;
    chosenArchetype: SystemArchetype;
    branchesUpdates?: Branch[];
  }) => void;
  
  // Customization & Lean Regime Management
  toggleDteMode: () => void;
  updateRegimeConfig: (config: {
    regimeType: 'emprendedor_control_interno' | 'general_tributario';
    dteActive: boolean;
    taxesConfig?: {
      declaIva: boolean;
      declaPagoCuenta: boolean;
      declaImpuestosMunicipales: boolean;
      municipalRateOrFee?: number;
      alcaldiaName?: string;
    };
  }) => void;
  
  // Theme & UI
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean | ((prev: boolean) => boolean)) => void;
  activeModule: string;
  setActiveModule: (module: string) => void;
  
  // Dynamic Fiscal Parameters (100% personalizable)
  fiscalConfig: FiscalConfig;
  updateFiscalConfig: (updates: Partial<FiscalConfig>) => void;
  
  // Módulo 1: CRM & Ventas & CxC
  products: Product[];
  customers: Customer[];
  invoices: Invoice[];
  customerPayments: CustomerPayment[];
  createInvoice: (invoice: Omit<Invoice, 'id' | 'companyId' | 'createdAt'>) => Invoice;
  updateInvoice: (id: string, updates: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  cancelInvoice: (id: string) => void;
  registerCustomerPayment: (payment: Omit<CustomerPayment, 'id' | 'companyId'>) => void;
  deleteCustomerPayment: (id: string) => void;
  createCustomer: (customer: Omit<Customer, 'id'>) => Customer;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  addCustomerNote: (customerId: string, note: Omit<CustomerNote, 'id' | 'date'>) => void;
  createProduct: (product: Omit<Product, 'id' | 'companyId'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  
  // Módulo 2: CRM Proveedores & Compras & SCM
  suppliers: Supplier[];
  purchases: Purchase[];
  supplierPayments: SupplierPayment[];
  kardexMovements: KardexMovement[];
  createPurchase: (purchase: Omit<Purchase, 'id' | 'companyId' | 'createdAt'>) => Purchase;
  updatePurchase: (id: string, updates: Partial<Purchase>) => void;
  deletePurchase: (id: string) => void;
  registerSupplierPayment: (payment: Omit<SupplierPayment, 'id' | 'companyId'>) => void;
  deleteSupplierPayment: (id: string) => void;
  createSupplier: (supplier: Omit<Supplier, 'id'>) => void;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  addSupplierNote: (supplierId: string, note: Omit<SupplierNote, 'id' | 'date'>) => void;
  
  // Módulo 3: RRHH 360° & Planilla Legal SV
  employees: Employee[];
  payrolls: Payroll[];
  createEmployee: (employee: Omit<Employee, 'id' | 'companyId'>) => void;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  addEmployeeEvaluation: (employeeId: string, evalData: Omit<EmployeeEvaluation, 'id' | 'date'>) => void;
  addDisciplinaryAction: (employeeId: string, action: Omit<DisciplinaryAction, 'id' | 'date'>) => void;
  generatePayrollForPeriod: (periodType: 'quincenal' | 'mensual', month: number, year: number, branchId?: string) => Payroll;
  saveCustomPayroll: (payroll: Payroll) => void;
  deletePayroll: (id: string) => void;
  payPayroll: (payrollId: string, bankAccountId: string) => void;

  // Servicios Profesionales (Art. 156 Código Tributario SV - 10% Retención Renta)
  professionalServices: ProfessionalServiceRecord[];
  createProfessionalService: (service: Omit<ProfessionalServiceRecord, 'id' | 'companyId' | 'createdAt'>) => ProfessionalServiceRecord;
  updateProfessionalService: (id: string, updates: Partial<ProfessionalServiceRecord>) => void;
  deleteProfessionalService: (id: string) => void;

  // Bolsa de Trabajo & Base de Currículum Vitae (CV)
  candidateFolders: CandidateFolder[];
  candidateApplicants: CandidateApplicant[];
  createCandidateFolder: (folder: Omit<CandidateFolder, 'id' | 'companyId' | 'createdAt'>) => CandidateFolder;
  deleteCandidateFolder: (id: string) => void;
  createCandidateApplicant: (applicant: Omit<CandidateApplicant, 'id' | 'companyId' | 'createdAt'>) => CandidateApplicant;
  updateCandidateApplicant: (id: string, updates: Partial<CandidateApplicant>) => void;
  deleteCandidateApplicant: (id: string) => void;
  hireCandidateAsEmployee: (applicantId: string, baseSalary?: number, position?: string) => void;
  
  // Módulo 4: Tesorería, Bancos & Flujo de Caja Real / Proyectado
  bankAccounts: BankAccount[];
  treasuryMovements: TreasuryMovement[];
  otherIncomes: OtherIncome[];
  createOtherIncome: (income: Omit<OtherIncome, 'id' | 'companyId' | 'createdAt'>) => OtherIncome;
  deleteOtherIncome: (id: string) => void;
  createBankAccount: (account: Omit<BankAccount, 'id' | 'companyId' | 'currentBalance'>) => void;
  transferFunds: (fromAccountId: string, toAccountId: string, amount: number, reference: string, description: string) => void;
  reconcileMovement: (movementId: string) => void;
  cashFlowProjections: CashFlowProjectionItem[];
  realCashFlowSummary: RealCashFlowPeriod;
  
  // Módulo 5: Motor Contable & Catálogo de Cuentas Personalizable
  chartOfAccounts: AccountNode[];
  createAccountNode: (node: AccountNode) => void;
  updateAccountNode: (code: string, updates: Partial<AccountNode>) => void;
  deleteAccountNode: (code: string) => void;
  loadChartTemplate: (templateType: 'simplified' | 'niif_full') => void;
  journalEntries: JournalEntry[];
  createManualJournalEntry: (entry: Omit<JournalEntry, 'id' | 'companyId' | 'createdAt' | 'entryNumber' | 'totalDebit' | 'totalCredit' | 'isBalanced'>) => JournalEntry;
  
  // Módulo 6: AI Dynamic Widgets & Copilot
  dynamicWidgets: DynamicChartWidget[];
  addDynamicWidget: (widget: Omit<DynamicChartWidget, 'id' | 'createdAt'>) => void;
  updateDynamicWidget: (id: string, updates: Partial<DynamicChartWidget>) => void;
  deleteDynamicWidget: (id: string) => void;
  
  // Notifications & Data management
  notifications: ToastNotification[];
  addNotification: (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) => void;
  removeNotification: (id: string) => void;
  resetAllDataToSample: () => void;
  exportDatabaseJSON: () => string;
  importDatabaseJSON: (jsonStr: string) => boolean;
}


// ---------- Sincronización con la nube (Firestore) ----------
// Comparación estable (ignora el orden de las llaves y los undefined) para no
// re-escribir datos que ya son idénticos en la nube.
const stableStringify = (v: any): string => {
  if (v === undefined) return '';
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return '[' + v.map((x) => stableStringify(x) || 'null').join(',') + ']';
  return '{' + Object.keys(v).sort().filter((k) => v[k] !== undefined).map((k) => JSON.stringify(k) + ':' + stableStringify(v[k])).join(',') + '}';
};

// Aplica cambios por documento (agregado / modificado / ELIMINADO) sobre una lista local.
const applyDocChanges = <T extends { id: string }>(prev: T[], upserts: T[], removed: Set<string>): T[] => {
  const next = removed.size ? prev.filter((x) => !removed.has(x.id)) : [...prev];
  upserts.forEach((u) => {
    const i = next.findIndex((x) => x.id === u.id);
    if (i >= 0) next[i] = { ...next[i], ...u };
    else next.push(u);
  });
  return next;
};

// Espejo bidireccional lista local <-> colección de Firestore, para datos que se
// modifican en muchos lugares (kardex, tesorería, otros ingresos) sin tocar cada función.
function useCloudMirror<T extends { id: string }>(
  name: string,
  items: T[],
  setItems: React.Dispatch<React.SetStateAction<T[]>>,
  skipIds: Set<string>,
  onError: (e: any) => void
) {
  const known = React.useRef<Map<string, string>>(new Map());
  const [hydrated, setHydrated] = React.useState(false);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, name),
      (snap) => {
        const upserts: T[] = [];
        const removed = new Set<string>();
        snap.docChanges().forEach((ch) => {
          const data = ch.doc.data() as T;
          if (ch.type === 'removed') {
            removed.add(ch.doc.id);
            known.current.delete(ch.doc.id);
          } else if (data && data.id) {
            upserts.push(data);
            known.current.set(data.id, stableStringify(data));
          }
        });
        if (upserts.length || removed.size) setItems((prev) => applyDocChanges(prev, upserts, removed));
        setHydrated(true);
      },
      (err) => {
        console.warn(`Sync ${name}:`, err);
        onError(err);
      }
    );
    return unsub;
  }, [name]);

  useEffect(() => {
    if (!hydrated) return;
    const current = new Set(items.map((i) => i.id));
    items.forEach((it) => {
      if (skipIds.has(it.id)) return;
      const sig = stableStringify(it);
      if (known.current.get(it.id) !== sig) {
        known.current.set(it.id, sig);
        setDoc(doc(db, name, it.id), it as any).catch(onError);
      }
    });
    Array.from(known.current.keys()).forEach((id) => {
      if (!current.has(id)) {
        known.current.delete(id);
        deleteDoc(doc(db, name, id)).catch(onError);
      }
    });
  }, [items, hydrated]);
}


const STORAGE_KEY = 'sivarflow_sv_erp_state_v3';
const LEGACY_STORAGE_KEY = 'sivarflow_sv_erp_state_v2';
const ANCIENT_STORAGE_KEY = 'contatech_sv_erp_state_v1';

const ERPContext = createContext<ERPContextType | undefined>(undefined);

export const ERPProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Multitenancy & Auth State
  const [companies, setCompanies] = useState<Company[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY) || localStorage.getItem(ANCIENT_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.companies && Array.isArray(parsed.companies)) return parsed.companies;
      } catch (e) {
        console.error('Error restoring companies from storage:', e);
      }
    }
    return SAMPLE_COMPANIES;
  });

  const [currentCompanyId, setCurrentCompanyId] = useState<string>(() => companies[0]?.id || 'comp_1');

  const [rawBranches, setRawBranches] = useState<Branch[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.branches && Array.isArray(parsed.branches)) return parsed.branches;
      } catch (e) {}
    }
    return SAMPLE_BRANCHES;
  });

  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');

  const [users, setUsers] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.users && Array.isArray(parsed.users)) {
          // Only guarantee the master admin account exists (safety net so the
          // owner is never locked out). Other demo/sample users are NOT
          // force-reinjected once the real user has removed them.
          const merged: UserProfile[] = [...parsed.users];
          const masterAdmin = SAMPLE_USERS.find((su) => su.id === 'user_david');
          if (masterAdmin) {
            const idx = merged.findIndex(
              (u) => u.id === masterAdmin.id || u.email.toLowerCase() === masterAdmin.email.toLowerCase()
            );
            if (idx === -1) merged.push(masterAdmin);
          }
          return merged;
        }
      } catch (e) {}
    }
    return SAMPLE_USERS;
  });

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    try {
      const savedAuth = localStorage.getItem('sivarflow_auth_user');
      if (savedAuth && users.some((u) => u.id === savedAuth)) {
        return savedAuth;
      }
    } catch (e) {}
    return SAMPLE_USERS[0].id;
  });

  // Auth Login State (Protected App Gate)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const savedAuth = localStorage.getItem('sivarflow_auth_user');
      return !!savedAuth;
    } catch (e) {
      return false;
    }
  });

  // Personal Finances State
  const [personalTransactions, setPersonalTransactions] = useState<PersonalTransaction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.personalTransactions && Array.isArray(parsed.personalTransactions)) {
          return parsed.personalTransactions;
        }
      } catch (e) {}
    }
    return [];
  });

  const [personalBudgets, setPersonalBudgets] = useState<PersonalBudgetCategory[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.personalBudgets && Array.isArray(parsed.personalBudgets)) {
          return parsed.personalBudgets;
        }
      } catch (e) {}
    }
    return [];
  });

  const [personalSavingGoals, setPersonalSavingGoals] = useState<PersonalSavingGoal[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.personalSavingGoals && Array.isArray(parsed.personalSavingGoals)) {
          return parsed.personalSavingGoals;
        }
      } catch (e) {}
    }
    return [];
  });

  const [isExhaustiveCustomizationOpen, setIsExhaustiveCustomizationOpen] = useState<boolean>(false);
  const [isCloudUserManagerOpen, setIsCloudUserManagerOpen] = useState<boolean>(false);

  // Theme & Navigation
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('sivarflow_theme');
    if (saved) return saved === 'dark';
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    try {
      localStorage.setItem('sivarflow_theme', isDarkMode ? 'dark' : 'light');
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {}
  }, [isDarkMode]);

  const [activeModule, setActiveModule] = useState<string>('dashboard');

  // Módulo 1: CRM & Ventas
  const [rawProducts, setRawProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.products && Array.isArray(parsed.products)) return parsed.products;
      } catch (e) {}
    }
    return SAMPLE_PRODUCTS;
  });

  const [rawCustomers, setRawCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.customers && Array.isArray(parsed.customers)) return parsed.customers;
      } catch (e) {}
    }
    return SAMPLE_CUSTOMERS;
  });

  const [rawInvoices, setRawInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.invoices && Array.isArray(parsed.invoices)) {
          return parsed.invoices.map((inv: any) => ({
            ...inv,
            saldoPendiente:
              typeof inv.saldoPendiente === 'number' && !isNaN(inv.saldoPendiente)
                ? inv.saldoPendiente
                : inv.status === 'pagada'
                ? 0
                : typeof inv.totalPagar === 'number' && !isNaN(inv.totalPagar)
                ? inv.totalPagar
                : 0,
            totalPagar:
              typeof inv.totalPagar === 'number' && !isNaN(inv.totalPagar)
                ? inv.totalPagar
                : typeof inv.saldoPendiente === 'number' && !isNaN(inv.saldoPendiente)
                ? inv.saldoPendiente
                : 0,
          }));
        }
      } catch (e) {}
    }
    return SAMPLE_INVOICES;
  });

  const [customerPayments, setCustomerPayments] = useState<CustomerPayment[]>([]);

  // Módulo 2: CRM Proveedores & Compras
  const [rawSuppliers, setRawSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.suppliers && Array.isArray(parsed.suppliers)) return parsed.suppliers;
      } catch (e) {}
    }
    return SAMPLE_SUPPLIERS;
  });

  const [rawPurchases, setRawPurchases] = useState<Purchase[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.purchases && Array.isArray(parsed.purchases)) {
          return parsed.purchases.map((pur: any) => ({
            ...pur,
            saldoPendiente:
              typeof pur.saldoPendiente === 'number' && !isNaN(pur.saldoPendiente)
                ? pur.saldoPendiente
                : pur.status === 'pagada'
                ? 0
                : typeof pur.totalPagar === 'number' && !isNaN(pur.totalPagar)
                ? pur.totalPagar
                : 0,
            totalPagar:
              typeof pur.totalPagar === 'number' && !isNaN(pur.totalPagar)
                ? pur.totalPagar
                : typeof pur.saldoPendiente === 'number' && !isNaN(pur.saldoPendiente)
                ? pur.saldoPendiente
                : 0,
          }));
        }
      } catch (e) {}
    }
    return SAMPLE_PURCHASES;
  });

  const [supplierPayments, setSupplierPayments] = useState<SupplierPayment[]>([]);

  const [rawKardexMovements, setRawKardexMovements] = useState<KardexMovement[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.kardexMovements && Array.isArray(parsed.kardexMovements)) return parsed.kardexMovements;
      } catch (e) {}
    }
    return SAMPLE_KARDEX_MOVEMENTS;
  });

  // Módulo 3: RRHH & Planilla
  const [rawEmployees, setRawEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.employees && Array.isArray(parsed.employees)) return parsed.employees;
      } catch (e) {}
    }
    return SAMPLE_EMPLOYEES;
  });

  const [rawPayrolls, setRawPayrolls] = useState<Payroll[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.payrolls && Array.isArray(parsed.payrolls)) return parsed.payrolls;
      } catch (e) {}
    }
    return SAMPLE_PAYROLLS;
  });

  // Servicios Profesionales (Art. 156 Código Tributario SV)
  const [rawProfessionalServices, setRawProfessionalServices] = useState<ProfessionalServiceRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.professionalServices && Array.isArray(parsed.professionalServices)) return parsed.professionalServices;
      } catch (e) {}
    }
    return SAMPLE_PROFESSIONAL_SERVICES;
  });

  // Bolsa de Trabajo & Base de Currículum Vitae (CV)
  const [rawCandidateFolders, setRawCandidateFolders] = useState<CandidateFolder[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.candidateFolders && Array.isArray(parsed.candidateFolders)) return parsed.candidateFolders;
      } catch (e) {}
    }
    return SAMPLE_CANDIDATE_FOLDERS;
  });

  const [rawCandidateApplicants, setRawCandidateApplicants] = useState<CandidateApplicant[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.candidateApplicants && Array.isArray(parsed.candidateApplicants)) return parsed.candidateApplicants;
      } catch (e) {}
    }
    return SAMPLE_CANDIDATE_APPLICANTS;
  });

  // Módulo 4: Tesorería & Bancos
  const [rawBankAccounts, setRawBankAccounts] = useState<BankAccount[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.bankAccounts && Array.isArray(parsed.bankAccounts)) return parsed.bankAccounts;
      } catch (e) {}
    }
    return SAMPLE_BANK_ACCOUNTS;
  });

  const [rawTreasuryMovements, setRawTreasuryMovements] = useState<TreasuryMovement[]>([]);

  const [rawOtherIncomes, setRawOtherIncomes] = useState<OtherIncome[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.otherIncomes && Array.isArray(parsed.otherIncomes)) {
          return parsed.otherIncomes;
        }
      } catch (e) {}
    }
    return SAMPLE_OTHER_INCOMES;
  });

  // Módulo 5: Motor Contable
  const [chartOfAccounts, setChartOfAccounts] = useState<AccountNode[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.chartOfAccounts && Array.isArray(parsed.chartOfAccounts)) return parsed.chartOfAccounts;
      } catch (e) {}
    }
    return DEFAULT_CHART_OF_ACCOUNTS;
  });

  const [rawJournalEntries, setRawJournalEntries] = useState<JournalEntry[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.journalEntries && Array.isArray(parsed.journalEntries)) {
          return parsed.journalEntries;
        }
      } catch (e) {}
    }
    return SAMPLE_JOURNAL_ENTRIES;
  });

  // Módulo 6: AI Dynamic Widgets
  const [dynamicWidgets, setDynamicWidgets] = useState<DynamicChartWidget[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.dynamicWidgets && Array.isArray(parsed.dynamicWidgets)) return parsed.dynamicWidgets;
      } catch (e) {}
    }
    return INITIAL_DYNAMIC_WIDGETS;
  });

  // Notifications
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);

  // Selected current Company & User
  const currentCompany = useMemo(() => {
    return companies.find((c) => c.id === currentCompanyId) || companies[0] || SAMPLE_COMPANIES[0];
  }, [companies, currentCompanyId]);

  const currentUser = useMemo(() => {
    return users.find((u) => u.id === currentUserId) || users[0];
  }, [users, currentUserId]);

  const userRole = currentUser.role;

  // Support Mode & Multi-Tenancy Isolation
  const [isSupportMode, setIsSupportMode] = useState<boolean>(false);

  // Filter collections per currentCompany so new companies start at ZERO ($0.00)
  const branches = useMemo(
    () => rawBranches.filter((b) => b.companyId === currentCompany.id),
    [rawBranches, currentCompany.id]
  );
  const setBranches = setRawBranches;

  const products = useMemo(
    () => rawProducts.filter((p) => p.companyId === currentCompany.id),
    [rawProducts, currentCompany.id]
  );
  const customers = useMemo(
    () => rawCustomers.filter((c) => c.companyId === currentCompany.id),
    [rawCustomers, currentCompany.id]
  );
  const invoices = useMemo(
    () => rawInvoices.filter((i) => i.companyId === currentCompany.id),
    [rawInvoices, currentCompany.id]
  );
  const suppliers = useMemo(
    () => rawSuppliers.filter((s) => s.companyId === currentCompany.id),
    [rawSuppliers, currentCompany.id]
  );
  const purchases = useMemo(
    () => rawPurchases.filter((p) => p.companyId === currentCompany.id),
    [rawPurchases, currentCompany.id]
  );
  const kardexMovements = useMemo(
    () => rawKardexMovements.filter((k) => k.companyId === currentCompany.id),
    [rawKardexMovements, currentCompany.id]
  );
  const employees = useMemo(
    () => rawEmployees.filter((e) => e.companyId === currentCompany.id),
    [rawEmployees, currentCompany.id]
  );
  const payrolls = useMemo(
    () => rawPayrolls.filter((p) => p.companyId === currentCompany.id),
    [rawPayrolls, currentCompany.id]
  );
  const bankAccounts = useMemo(
    () => rawBankAccounts.filter((b) => b.companyId === currentCompany.id),
    [rawBankAccounts, currentCompany.id]
  );
  const treasuryMovements = useMemo(
    () => rawTreasuryMovements.filter((t) => t.companyId === currentCompany.id),
    [rawTreasuryMovements, currentCompany.id]
  );
  const otherIncomes = useMemo(
    () => rawOtherIncomes.filter((o) => o.companyId === currentCompany.id),
    [rawOtherIncomes, currentCompany.id]
  );
  const journalEntries = useMemo(
    () => rawJournalEntries.filter((j) => j.companyId === currentCompany.id),
    [rawJournalEntries, currentCompany.id]
  );
  const professionalServices = useMemo(
    () => rawProfessionalServices.filter((s) => s.companyId === currentCompany.id),
    [rawProfessionalServices, currentCompany.id]
  );
  const candidateFolders = useMemo(
    () => rawCandidateFolders.filter((f) => f.companyId === currentCompany.id),
    [rawCandidateFolders, currentCompany.id]
  );
  const candidateApplicants = useMemo(
    () => rawCandidateApplicants.filter((a) => a.companyId === currentCompany.id),
    [rawCandidateApplicants, currentCompany.id]
  );

  // Setters forward to raw arrays
  const setProducts = setRawProducts;
  const setCustomers = setRawCustomers;
  const setInvoices = setRawInvoices;
  const setSuppliers = setRawSuppliers;
  const setPurchases = setRawPurchases;
  const setKardexMovements = setRawKardexMovements;
  const setEmployees = setRawEmployees;
  const setPayrolls = setRawPayrolls;
  const setBankAccounts = setRawBankAccounts;
  const setTreasuryMovements = setRawTreasuryMovements;
  const setOtherIncomes = setRawOtherIncomes;
  const setJournalEntries = setRawJournalEntries;

  const enterSupportMode = (companyId: string) => {
    setCurrentCompanyId(companyId);
    setIsSupportMode(true);
    setActiveModule('pos_terminal');
    const target = companies.find((c) => c.id === companyId);
    addNotification(
      'info',
      'Modo Asistencia Activado',
      `Explorando el entorno de ${target?.tradeName || target?.name || 'la empresa'}.`
    );
  };

  const exitSupportMode = () => {
    setIsSupportMode(false);
    addNotification('info', 'Panel Maestro', 'Has retornado al Centro de Administración Maestro.');
  };

  const resetCompanyDataToZero = (companyId: string) => {
    setRawInvoices((prev) => prev.filter((i) => i.companyId !== companyId));
    setRawPurchases((prev) => prev.filter((p) => p.companyId !== companyId));
    setRawProducts((prev) => prev.filter((p) => p.companyId !== companyId));
    setRawCustomers((prev) => prev.filter((c) => c.companyId !== companyId));
    setRawSuppliers((prev) => prev.filter((s) => s.companyId !== companyId));
    setRawEmployees((prev) => prev.filter((e) => e.companyId !== companyId));
    setRawPayrolls((prev) => prev.filter((p) => p.companyId !== companyId));
    setRawProfessionalServices((prev) => prev.filter((s) => s.companyId !== companyId));
    setRawCandidateFolders((prev) => prev.filter((f) => f.companyId !== companyId));
    setRawCandidateApplicants((prev) => prev.filter((a) => a.companyId !== companyId));
    setRawBankAccounts((prev) => prev.filter((b) => b.companyId !== companyId));
    setRawJournalEntries((prev) => prev.filter((j) => j.companyId !== companyId));
    setRawTreasuryMovements((prev) => prev.filter((t) => t.companyId !== companyId));
    setRawKardexMovements((prev) => prev.filter((k) => k.companyId !== companyId));
    setRawOtherIncomes((prev) => prev.filter((o) => o.companyId !== companyId));
    addNotification('success', 'Datos en CERO', 'Todas las operaciones de la empresa han sido vaciadas a $0.00.');
  };

  const deleteCompany = async (companyId: string) => {
    setCompanies((prev) => prev.filter((c) => c.id !== companyId));
    setUsers((prev) => prev.filter((u) => u.companyId !== companyId));
    resetCompanyDataToZero(companyId);
    try {
      await deleteDoc(doc(db, 'companies', companyId));
      addNotification('info', 'Empresa Eliminada', 'La empresa y sus cuentas fueron removidas permanentemente.');
    } catch (e) {
      console.error('No se pudo eliminar la empresa en la nube:', e);
      addNotification('error', 'Error al Eliminar', 'Se quitó localmente pero no se pudo borrar en la nube. Puede reaparecer al recargar — revisa tu conexión e inténtalo de nuevo.');
    }
  };

  const clearAllDemoData = () => {
    setCompanies((prev) => prev.filter((c) => c.id !== 'comp_1' && c.id !== 'comp_2'));
    resetCompanyDataToZero('comp_1');
    resetCompanyDataToZero('comp_2');
    addNotification('success', 'Datos Demo Depurados', 'Se eliminaron las empresas de prueba.');
  };

  const createCompanyWithAdmin = async (
    companyData: Omit<Company, 'id'>,
    adminData: { name: string; email: string; password?: string; phone?: string }
  ): Promise<{ company: Company; user: UserProfile }> => {
    const compId = `comp_${Date.now()}`;
    const newComp: Company = {
      ...companyData,
      id: compId,
      fiscalConfig: { ...DEFAULT_FISCAL_CONFIG },
      subscriptionPlan: companyData.subscriptionPlan || 'emprendedor',
      subscriptionStatus: companyData.subscriptionStatus || 'activo',
      subscriptionPrice: companyData.subscriptionPrice || 14.99,
      createdAt: new Date().toISOString().split('T')[0],
    };

    const userId = `usr_${Date.now()}`;
    const newUser: UserProfile = {
      id: userId,
      companyId: compId,
      name: adminData.name.trim(),
      email: adminData.email.trim().toLowerCase(),
      password: adminData.password || 'admin123',
      phone: adminData.phone || undefined,
      role: 'gerente',
      systemArchetype: newComp.systemArchetype || 'emprendedor_control_interno',
      isConfigured: false, // Permite que en el primer inicio de sesión se abra el Gran Formulario de Sucursales
      createdAt: new Date().toISOString().split('T')[0],
      storedInCloud: true,
    };
    newComp.primaryAdminUserId = userId;

    // Crear sucursal inicial aislada para la nueva empresa
    const initialBranch: Branch = {
      id: `branch_${Date.now()}`,
      companyId: compId,
      code: 'SUC-01',
      name: 'Casa Matriz - Sede Central',
      address: newComp.address || 'San Salvador, El Salvador',
      department: newComp.department || 'San Salvador',
      municipality: newComp.municipality || 'San Salvador Centro',
      phone: newComp.phone || adminData.phone || '+503 7000-0000',
      managerName: adminData.name.trim(),
      isMain: true,
      isActive: true,
    };

    setCompanies((prev) => [...prev, newComp]);
    setUsers((prev) => [...prev, newUser]);
    setBranches((prev) => [...prev, initialBranch]);

    try {
      await setDoc(doc(db, 'companies', compId), newComp);
      await setDoc(doc(db, 'users', userId), newUser);
      await setDoc(doc(db, 'branches', initialBranch.id), initialBranch);
    } catch (e) {
      console.warn('Firestore write note:', e);
    }

    addNotification('success', 'Empresa Registrada', `"${newComp.tradeName || newComp.name}" creada en cero.`);
    return { company: newComp, user: newUser };
  };

  // Fiscal Config for Current Company
  const fiscalConfig: FiscalConfig = useMemo(() => {
    return currentCompany.fiscalConfig || DEFAULT_FISCAL_CONFIG;
  }, [currentCompany]);

  const updateFiscalConfig = (updates: Partial<FiscalConfig>) => {
    const updatedConfig: FiscalConfig = {
      ...fiscalConfig,
      ...updates,
    };
    updateCompany(currentCompany.id, { fiscalConfig: updatedConfig });
    addNotification('success', 'Parámetros Fiscales Actualizados', 'Las nuevas tasas legales se aplicarán a todas las transacciones.');
  };

  // Notification Helpers
  const addNotification = (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setNotifications((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      removeNotification(id);
    }, 4500);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Avisa en pantalla cuando algo NO se pudo guardar en la nube (antes fallaba en silencio).
  const lastCloudErrorRef = React.useRef(0);
  const reportCloudError = (err: any) => {
    console.warn('Firestore:', err);
    const now = Date.now();
    if (now - lastCloudErrorRef.current > 8000) {
      lastCloudErrorRef.current = now;
      const code = err?.code ? ` (${err.code})` : '';
      addNotification('error', 'No se guardó en la nube', `Revisa tu conexión o las reglas de Firebase${code}. El dato quedó solo en este dispositivo.`);
    }
  };

  // Datos que antes solo vivían en el dispositivo (o en un "bloque" general que se pisaba):
  useCloudMirror<KardexMovement>('kardex_movements', rawKardexMovements, setRawKardexMovements, new Set(SAMPLE_KARDEX_MOVEMENTS.map((k) => k.id)), reportCloudError);
  useCloudMirror<TreasuryMovement>('treasury_movements', rawTreasuryMovements, setRawTreasuryMovements, new Set<string>(), reportCloudError);
  useCloudMirror<OtherIncome>('other_incomes', rawOtherIncomes, setRawOtherIncomes, new Set(SAMPLE_OTHER_INCOMES.map((o) => o.id)), reportCloudError);

  // Sync to LocalStorage
  useEffect(() => {
    const appState = {
      companies,
      branches: rawBranches,
      users,
      products: rawProducts,
      customers: rawCustomers,
      invoices: rawInvoices,
      customerPayments,
      suppliers: rawSuppliers,
      purchases: rawPurchases,
      supplierPayments,
      kardexMovements: rawKardexMovements,
      employees: rawEmployees,
      payrolls: rawPayrolls,
      bankAccounts: rawBankAccounts,
      treasuryMovements: rawTreasuryMovements,
      otherIncomes: rawOtherIncomes,
      chartOfAccounts,
      journalEntries: rawJournalEntries,
      dynamicWidgets,
      personalTransactions,
      personalBudgets,
      personalSavingGoals,
      professionalServices: rawProfessionalServices,
      candidateFolders: rawCandidateFolders,
      candidateApplicants: rawCandidateApplicants,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
    } catch (err) {
      console.error('Failed to persist ERP state in localStorage:', err);
    }
  }, [
    companies,
    rawBranches,
    users,
    rawProducts,
    rawCustomers,
    rawInvoices,
    customerPayments,
    rawSuppliers,
    rawPurchases,
    supplierPayments,
    rawKardexMovements,
    rawEmployees,
    rawPayrolls,
    rawProfessionalServices,
    rawCandidateFolders,
    rawCandidateApplicants,
    rawBankAccounts,
    rawTreasuryMovements,
    rawOtherIncomes,
    chartOfAccounts,
    rawJournalEntries,
    dynamicWidgets,
    personalTransactions,
    personalBudgets,
    personalSavingGoals,
  ]);

  // (El antiguo bloque único 'system_state' se eliminó: se pisaba entre dispositivos y empresas.)

  // Company management
  const createCompany = (companyData: Omit<Company, 'id'>) => {
    const newComp: Company = {
      ...companyData,
      id: `comp_${Date.now()}`,
      fiscalConfig: { ...DEFAULT_FISCAL_CONFIG },
      regimeType: companyData.regimeType || 'emprendedor_control_interno',
      dteActive: companyData.dteActive ?? false,
    };
    setCompanies((prev) => [...prev, newComp]);
    setCurrentCompanyId(newComp.id);
    try {
      setDoc(doc(db, 'companies', newComp.id), newComp).catch(reportCloudError);
    } catch (e) {}
    addNotification('success', 'Razón Social Creada', `Empresa "${newComp.name}" registrada con éxito.`);
  };

  const updateCompany = (id: string, updates: Partial<Company>) => {
    setCompanies((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
    try {
      setDoc(doc(db, 'companies', id), updates, { merge: true }).catch(reportCloudError);
    } catch (e) {}
  };

  // Initial load from Firebase Firestore & Real-time cross-device sync
  useEffect(() => {
    async function loadCloudData() {
      // 0. Verify connection to Firestore in mi-erp-nube
      testFirebaseConnection().catch(() => {});

      try {
        // 2. Query individual collections to ensure 100% cloud accuracy
        const [
          companiesSnap,
          usersSnap,
          prodSnap,
          custSnap,
          invSnap,
          purSnap,
          suppSnap,
          branchSnap,
          cPaySnap,
          sPaySnap,
          bankSnap,
          empSnap,
          paySnap,
          profSnap,
          foldSnap,
          candSnap,
          persSnap,
        ] = await Promise.all([
          getDocs(collection(db, 'companies')).catch(() => null),
          getDocs(collection(db, 'users')).catch(() => null),
          getDocs(collection(db, 'products')).catch(() => null),
          getDocs(collection(db, 'customers')).catch(() => null),
          getDocs(collection(db, 'invoices')).catch(() => null),
          getDocs(collection(db, 'purchases')).catch(() => null),
          getDocs(collection(db, 'suppliers')).catch(() => null),
          getDocs(collection(db, 'branches')).catch(() => null),
          getDocs(collection(db, 'customer_payments')).catch(() => null),
          getDocs(collection(db, 'supplier_payments')).catch(() => null),
          getDocs(collection(db, 'bank_accounts')).catch(() => null),
          getDocs(collection(db, 'employees')).catch(() => null),
          getDocs(collection(db, 'payrolls')).catch(() => null),
          getDocs(collection(db, 'professional_services')).catch(() => null),
          getDocs(collection(db, 'candidate_folders')).catch(() => null),
          getDocs(collection(db, 'candidates')).catch(() => null),
          getDocs(collection(db, 'personal_finances')).catch(() => null),
        ]);

        // Firestore es la fuente de verdad para companies una vez que ya tiene datos:
        // se REEMPLAZA el estado local en vez de "solo agregar", para que una empresa
        // borrada en la nube no reaparezca. Si la colección está vacía (proyecto nuevo
        // sin datos aún subidos), se respeta el estado local/demo en vez de vaciarlo.
        if (companiesSnap && !companiesSnap.empty) {
          const cloudComps: Company[] = [];
          companiesSnap.forEach((d) => { const item = d.data() as Company; if (item.id && item.name) cloudComps.push(item); });
          setCompanies(cloudComps);
        }

        // Mismo criterio para users: la nube manda, así un usuario eliminado no vuelve.
        if (usersSnap && !usersSnap.empty) {
          const cloudUsers: UserProfile[] = [];
          usersSnap.forEach((d) => { const item = d.data() as UserProfile; if (item.id && item.email) cloudUsers.push(item); });
          setUsers(cloudUsers);
        }

        if (prodSnap && !prodSnap.empty) {
          const cloudProds: Product[] = [];
          prodSnap.forEach((d) => { const item = d.data() as Product; if (item.id) cloudProds.push(item); });
          if (cloudProds.length > 0) {
            setRawProducts((prev) => {
              const merged = [...prev];
              cloudProds.forEach((cp) => {
                const idx = merged.findIndex((p) => p.id === cp.id);
                if (idx >= 0) merged[idx] = { ...merged[idx], ...cp };
                else merged.push(cp);
              });
              return merged;
            });
          }
        }

        if (custSnap && !custSnap.empty) {
          const cloudCust: Customer[] = [];
          custSnap.forEach((d) => { const item = d.data() as Customer; if (item.id) cloudCust.push(item); });
          if (cloudCust.length > 0) {
            setRawCustomers((prev) => {
              const merged = [...prev];
              cloudCust.forEach((cc) => {
                const idx = merged.findIndex((c) => c.id === cc.id);
                if (idx >= 0) merged[idx] = { ...merged[idx], ...cc };
                else merged.push(cc);
              });
              return merged;
            });
          }
        }

        if (invSnap && !invSnap.empty) {
          const cloudInvs: Invoice[] = [];
          invSnap.forEach((d) => { const item = d.data() as Invoice; if (item.id) cloudInvs.push(item); });
          if (cloudInvs.length > 0) {
            setRawInvoices((prev) => {
              const merged = [...prev];
              cloudInvs.forEach((ci) => {
                const idx = merged.findIndex((i) => i.id === ci.id);
                if (idx >= 0) merged[idx] = { ...merged[idx], ...ci };
                else merged.push(ci);
              });
              return merged;
            });
          }
        }

        if (purSnap && !purSnap.empty) {
          const cloudPurs: Purchase[] = [];
          purSnap.forEach((d) => { const item = d.data() as Purchase; if (item.id) cloudPurs.push(item); });
          if (cloudPurs.length > 0) {
            setRawPurchases((prev) => {
              const merged = [...prev];
              cloudPurs.forEach((cp) => {
                const idx = merged.findIndex((p) => p.id === cp.id);
                if (idx >= 0) merged[idx] = { ...merged[idx], ...cp };
                else merged.push(cp);
              });
              return merged;
            });
          }
        }

        if (suppSnap && !suppSnap.empty) {
          const cloudSupp: Supplier[] = [];
          suppSnap.forEach((d) => { const item = d.data() as Supplier; if (item.id) cloudSupp.push(item); });
          if (cloudSupp.length > 0) {
            setRawSuppliers((prev) => {
              const merged = [...prev];
              cloudSupp.forEach((cs) => {
                const idx = merged.findIndex((s) => s.id === cs.id);
                if (idx >= 0) merged[idx] = { ...merged[idx], ...cs };
                else merged.push(cs);
              });
              return merged;
            });
          }
        }

        if (branchSnap && !branchSnap.empty) {
          const cloudBranches: Branch[] = [];
          branchSnap.forEach((d) => { const item = d.data() as Branch; if (item.id) cloudBranches.push(item); });
          if (cloudBranches.length > 0) {
            setRawBranches((prev) => {
              const merged = [...prev];
              cloudBranches.forEach((cb) => {
                const idx = merged.findIndex((b) => b.id === cb.id);
                if (idx >= 0) merged[idx] = { ...merged[idx], ...cb };
                else merged.push(cb);
              });
              return merged;
            });
          }
        }

        if (cPaySnap && !cPaySnap.empty) {
          const cloudCPays: CustomerPayment[] = [];
          cPaySnap.forEach((d) => { const item = d.data() as CustomerPayment; if (item.id) cloudCPays.push(item); });
          if (cloudCPays.length > 0) {
            setCustomerPayments((prev) => {
              const merged = [...prev];
              cloudCPays.forEach((cp) => {
                const idx = merged.findIndex((p) => p.id === cp.id);
                if (idx >= 0) merged[idx] = { ...merged[idx], ...cp };
                else merged.push(cp);
              });
              return merged;
            });
          }
        }

        if (sPaySnap && !sPaySnap.empty) {
          const cloudSPays: SupplierPayment[] = [];
          sPaySnap.forEach((d) => { const item = d.data() as SupplierPayment; if (item.id) cloudSPays.push(item); });
          if (cloudSPays.length > 0) {
            setSupplierPayments((prev) => {
              const merged = [...prev];
              cloudSPays.forEach((sp) => {
                const idx = merged.findIndex((p) => p.id === sp.id);
                if (idx >= 0) merged[idx] = { ...merged[idx], ...sp };
                else merged.push(sp);
              });
              return merged;
            });
          }
        }

        if (bankSnap && !bankSnap.empty) {
          const cloudBanks: BankAccount[] = [];
          bankSnap.forEach((d) => { const item = d.data() as BankAccount; if (item.id) cloudBanks.push(item); });
          if (cloudBanks.length > 0) {
            setRawBankAccounts((prev) => {
              const merged = [...prev];
              cloudBanks.forEach((cb) => {
                const idx = merged.findIndex((b) => b.id === cb.id);
                if (idx >= 0) merged[idx] = { ...merged[idx], ...cb };
                else merged.push(cb);
              });
              return merged;
            });
          }
        }

        if (empSnap && !empSnap.empty) {
          const cloudEmps: Employee[] = [];
          empSnap.forEach((d) => { const item = d.data() as Employee; if (item.id) cloudEmps.push(item); });
          if (cloudEmps.length > 0) {
            setRawEmployees((prev) => {
              const merged = [...prev];
              cloudEmps.forEach((ce) => {
                const idx = merged.findIndex((e) => e.id === ce.id);
                if (idx >= 0) merged[idx] = { ...merged[idx], ...ce };
                else merged.push(ce);
              });
              return merged;
            });
          }
        }

        if (paySnap && !paySnap.empty) {
          const cloudPays: Payroll[] = [];
          paySnap.forEach((d) => { const item = d.data() as Payroll; if (item.id) cloudPays.push(item); });
          if (cloudPays.length > 0) {
            setRawPayrolls((prev) => {
              const merged = [...prev];
              cloudPays.forEach((cp) => {
                const idx = merged.findIndex((p) => p.id === cp.id);
                if (idx >= 0) merged[idx] = { ...merged[idx], ...cp };
                else merged.push(cp);
              });
              return merged;
            });
          }
        }

        if (profSnap && !profSnap.empty) {
          const cloudProf: ProfessionalServiceRecord[] = [];
          profSnap.forEach((d) => { const item = d.data() as ProfessionalServiceRecord; if (item.id) cloudProf.push(item); });
          if (cloudProf.length > 0) {
            setRawProfessionalServices((prev) => {
              const merged = [...prev];
              cloudProf.forEach((cp) => {
                const idx = merged.findIndex((p) => p.id === cp.id);
                if (idx >= 0) merged[idx] = { ...merged[idx], ...cp };
                else merged.push(cp);
              });
              return merged;
            });
          }
        }

        if (foldSnap && !foldSnap.empty) {
          const cloudFolds: CandidateFolder[] = [];
          foldSnap.forEach((d) => { const item = d.data() as CandidateFolder; if (item.id) cloudFolds.push(item); });
          if (cloudFolds.length > 0) {
            setRawCandidateFolders((prev) => {
              const merged = [...prev];
              cloudFolds.forEach((cf) => {
                const idx = merged.findIndex((f) => f.id === cf.id);
                if (idx >= 0) merged[idx] = { ...merged[idx], ...cf };
                else merged.push(cf);
              });
              return merged;
            });
          }
        }

        if (candSnap && !candSnap.empty) {
          const cloudCands: CandidateApplicant[] = [];
          candSnap.forEach((d) => { const item = d.data() as CandidateApplicant; if (item.id) cloudCands.push(item); });
          if (cloudCands.length > 0) {
            setRawCandidateApplicants((prev) => {
              const merged = [...prev];
              cloudCands.forEach((ca) => {
                const idx = merged.findIndex((a) => a.id === ca.id);
                if (idx >= 0) merged[idx] = { ...merged[idx], ...ca };
                else merged.push(ca);
              });
              return merged;
            });
          }
        }

        if (persSnap && !persSnap.empty) {
          const cloudPers: PersonalTransaction[] = [];
          persSnap.forEach((d) => { const item = d.data() as PersonalTransaction; if (item.id) cloudPers.push(item); });
          if (cloudPers.length > 0) {
            setPersonalTransactions((prev) => {
              const merged = [...prev];
              cloudPers.forEach((pt) => {
                const idx = merged.findIndex((p) => p.id === pt.id);
                if (idx >= 0) merged[idx] = { ...merged[idx], ...pt };
                else merged.push(pt);
              });
              return merged;
            });
          }
        }
      } catch (e) {
        console.warn('Firestore initial sync note:', e);
      }
    }
    loadCloudData();

    // Realtime listeners for immediate cross-device sync
    // Firestore es la fuente de verdad en tiempo real: se reemplaza el estado local
    // completo con lo que hay en la nube (en vez de solo agregar/actualizar), para
    // que una empresa o usuario eliminado no vuelva a aparecer al refrescar.
    const unsubCompanies = onSnapshot(
      collection(db, 'companies'),
      (snap) => {
        const liveComps: Company[] = [];
        snap.forEach((d) => {
          const data = d.data() as Company;
          if (data.id && data.name) liveComps.push(data);
        });
        setCompanies(liveComps);
      },
      (err) => console.warn('Live companies sync note:', err)
    );

    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snap) => {
        const liveUsers: UserProfile[] = [];
        snap.forEach((d) => {
          const data = d.data() as UserProfile;
          if (data.id && data.email) liveUsers.push(data);
        });
        setUsers(liveUsers);
      },
      (err) => console.warn('Live users sync note:', err)
    );

    // Sincronización en tiempo real POR DOCUMENTO: lo nuevo/modificado se aplica y lo
    // ELIMINADO en cualquier dispositivo también se elimina aquí (antes solo se agregaba).
    const syncCol = <T extends { id: string }>(name: string, setter: React.Dispatch<React.SetStateAction<T[]>>) =>
      onSnapshot(
        collection(db, name),
        (snap) => {
          const upserts: T[] = [];
          const removed = new Set<string>();
          snap.docChanges().forEach((ch) => {
            if (ch.type === 'removed') removed.add(ch.doc.id);
            else {
              const data = ch.doc.data() as T;
              if (data && data.id) upserts.push(data);
            }
          });
          if (upserts.length || removed.size) setter((prev) => applyDocChanges(prev, upserts, removed));
        },
        (err) => {
          console.warn(`Sync ${name}:`, err);
          reportCloudError(err);
        }
      );

    const unsubCollections = [
      syncCol<Product>('products', setRawProducts),
      syncCol<Customer>('customers', setRawCustomers),
      syncCol<Invoice>('invoices', setRawInvoices),
      syncCol<Supplier>('suppliers', setRawSuppliers),
      syncCol<Purchase>('purchases', setRawPurchases),
      syncCol<CustomerPayment>('customer_payments', setCustomerPayments),
      syncCol<SupplierPayment>('supplier_payments', setSupplierPayments),
      syncCol<BankAccount>('bank_accounts', setRawBankAccounts),
      syncCol<Employee>('employees', setRawEmployees),
      syncCol<Payroll>('payrolls', setRawPayrolls),
      syncCol<ProfessionalServiceRecord>('professional_services', setRawProfessionalServices),
      syncCol<CandidateFolder>('candidate_folders', setRawCandidateFolders),
      syncCol<CandidateApplicant>('candidates', setRawCandidateApplicants),
      syncCol<Branch>('branches', setRawBranches),
    ];

    // Finanzas Personales — Transacciones: fuente de verdad en tiempo real.
    // Antes dependía del snapshot general (system_state) con retraso, lo que
    // causaba que al refrescar rápido se restauraran transacciones ya borradas.
    const unsubPersonalTransactions = onSnapshot(
      collection(db, 'personal_finances'),
      (snap) => {
        const liveTx: PersonalTransaction[] = [];
        snap.forEach((d) => {
          const data = d.data() as PersonalTransaction;
          if (data.id) liveTx.push(data);
        });
        setPersonalTransactions(liveTx);
      },
      (err) => console.warn('Live personal transactions sync note:', err)
    );

    // Finanzas Personales — Presupuestos y Metas de Ahorro: documento propio,
    // ya que antes nunca se guardaban en Firestore (solo quedaban en memoria/localStorage).
    const unsubPersonalMeta = onSnapshot(
      doc(db, 'personal_finance_meta', 'data'),
      (snap) => {
        if (snap.exists()) {
          const d = snap.data() as any;
          setPersonalBudgets(Array.isArray(d.personalBudgets) ? d.personalBudgets : []);
          setPersonalSavingGoals(Array.isArray(d.personalSavingGoals) ? d.personalSavingGoals : []);
        } else {
          setPersonalBudgets([]);
          setPersonalSavingGoals([]);
        }
      },
      (err) => console.warn('Live personal budgets/goals sync note:', err)
    );

    return () => {
      unsubCompanies();
      unsubUsers();
      unsubCollections.forEach((u) => u());
      unsubPersonalTransactions();
      unsubPersonalMeta();
    };
  }, []);

  // Guardado rápido y dedicado de Presupuestos y Metas de Ahorro (0.5s), ya que
  // antes solo vivían en memoria local y nunca llegaban a Firestore.
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        await setDoc(
          doc(db, 'personal_finance_meta', 'data'),
          { personalBudgets, personalSavingGoals, updatedAt: new Date().toISOString() },
          { merge: false }
        );
      } catch (err) {
        console.debug('Autosave de presupuestos/metas personales:', err);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [personalBudgets, personalSavingGoals]);

  // User & Access Management (Admin vs Cajero / Roles)
  const createUser = (newUserData: Omit<UserProfile, 'id'> & { id?: string }) => {
    const newUser: UserProfile = {
      ...newUserData,
      id: newUserData.id || `usr_${Date.now()}`,
      createdAt: newUserData.createdAt || new Date().toISOString().split('T')[0],
    };
    setUsers((prev) => {
      const idx = prev.findIndex((u) => u.id === newUser.id || u.email.toLowerCase() === newUser.email.toLowerCase());
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = newUser;
        return copy;
      }
      return [...prev, newUser];
    });

    // Cloud Firestore Sync
    try {
      setDoc(doc(db, 'users', newUser.id), {
        ...newUser,
        storedInCloud: true,
      }).catch((e) => console.warn('Firestore user save warning:', e));
    } catch (e) {
      console.warn('Firestore write:', e);
    }

    addNotification(
      'success',
      'Acceso Creado Exitosamente',
      `Se ha creado el usuario ${newUser.name} con perfil ${newUser.systemArchetype}.`
    );
  };

  const updateUser = (id: string, updates: Partial<UserProfile>) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updates } : u)));
    try {
      setDoc(doc(db, 'users', id), updates, { merge: true }).catch(reportCloudError);
    } catch (e) {}
    addNotification('success', 'Usuario Actualizado', 'Los accesos y datos fueron actualizados correctamente.');
  };

  const deleteUser = async (id: string) => {
    if (users.length <= 1) {
      addNotification('error', 'Acción Denegada', 'No puedes eliminar el único usuario del sistema.');
      return;
    }
    setUsers((prev) => prev.filter((u) => u.id !== id));
    if (currentUserId === id) {
      const fallback = users.find((u) => u.id !== id);
      if (fallback) setCurrentUserId(fallback.id);
    }
    try {
      await deleteDoc(doc(db, 'users', id));
      addNotification('info', 'Acceso Revocado', 'El usuario ha sido eliminado del sistema.');
    } catch (e) {
      console.error('No se pudo eliminar el usuario en la nube:', e);
      addNotification('error', 'Error al Eliminar', 'Se quitó localmente pero no se pudo borrar en la nube. Puede reaparecer al recargar — revisa tu conexión e inténtalo de nuevo.');
    }
  };

  // Authentication: Login & Logout
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const trimmedEmail = email.trim().toLowerCase();

    // 1. Direct Master Admin access for David (Super Admin Maestro)
    if (trimmedEmail === 'davidinn234@gmail.com' || trimmedEmail === 'david') {
      let davidUser = users.find(
        (u) => u.email.toLowerCase() === 'davidinn234@gmail.com' || u.id === 'user_david'
      );
      if (!davidUser) {
        // First-ever login for this account: the password typed here becomes
        // the permanent password (defaults to 'admin' only if left blank).
        davidUser = {
          id: 'user_david',
          name: 'David (Super Admin)',
          email: 'davidinn234@gmail.com',
          password: password || 'admin',
          role: 'admin_maestro',
          systemArchetype: 'empresa_consolidada_dte',
          isConfigured: true,
          jobTitle: 'Super Administrador / Propietario Plataforma',
          createdAt: new Date().toISOString().split('T')[0],
          enabledServices: [
            'finanzas_personales',
            'emprendedor_pos',
            'empresa_sin_dte',
            'empresa_con_dte',
          ],
        };
        setUsers((prev) => [davidUser!, ...prev]);
      } else {
        const expectedMasterPassword = davidUser.password || 'admin';
        if (password !== expectedMasterPassword) {
          return { success: false, error: 'Contraseña incorrecta. Por favor intente nuevamente.' };
        }
      }

      setCurrentUserId(davidUser.id);
      setIsAuthenticated(true);
      setIsSupportMode(false);
      try {
        localStorage.setItem('sivarflow_auth_user', davidUser.id);
      } catch (e) {}

      // Save user & login log in Cloud Firestore
      try {
        setDoc(doc(db, 'users', davidUser.id), { ...davidUser, storedInCloud: true, lastLoginAt: new Date().toISOString() }, { merge: true }).catch(reportCloudError);
        setDoc(doc(db, 'logins', `login_${Date.now()}`), {
          userId: davidUser.id,
          userName: davidUser.name,
          userEmail: davidUser.email,
          role: davidUser.role,
          loginAt: new Date().toISOString(),
          status: 'success'
        }).catch(reportCloudError);
      } catch (e) {}

      setActiveModule('admin_profiles');
      addNotification(
        'success',
        '¡Bienvenido, David!',
        'Has ingresado al Portal de Administración Maestro de FINAMIPE SV.'
      );
      return { success: true };
    }

    // 2. Standard user check
    let foundUser = users.find((u) => u.email.toLowerCase() === trimmedEmail);
    if (!foundUser || !foundUser.password) {
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        usersSnap.forEach((d) => {
          const uData = d.data() as UserProfile;
          if (uData.email && uData.email.toLowerCase() === trimmedEmail) {
            foundUser = uData;
          }
        });
        if (foundUser) {
          setUsers((prev) => {
            const idx = prev.findIndex((u) => u.id === foundUser!.id || u.email.toLowerCase() === trimmedEmail);
            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = foundUser!;
              return copy;
            }
            return [...prev, foundUser!];
          });
        }
      } catch (e) {
        console.warn('Firestore fallback user query on login:', e);
      }
    }

    if (!foundUser) {
      return { success: false, error: 'No se encontró ninguna cuenta asociada a este correo electrónico.' };
    }
    const expectedPassword = foundUser.password;
    if (!expectedPassword || password !== expectedPassword) {
      return { success: false, error: 'Contraseña incorrecta. Por favor intente nuevamente.' };
    }

    // If the user belongs to a specific company, switch company context immediately!
    if (foundUser.companyId) {
      const compExists = companies.some((c) => c.id === foundUser!.companyId);
      if (!compExists) {
        try {
          const compDoc = await getDoc(doc(db, 'companies', foundUser.companyId));
          if (compDoc.exists()) {
            const cloudComp = compDoc.data() as Company;
            setCompanies((prev) => [...prev, cloudComp]);
            setCurrentCompanyId(cloudComp.id);
          }
        } catch (e) {
          console.warn('Firestore fallback company fetch on login:', e);
        }
      } else {
        setCurrentCompanyId(foundUser.companyId);
      }
    }

    setCurrentUserId(foundUser.id);
    setIsAuthenticated(true);
    setIsSupportMode(false);
    try {
      localStorage.setItem('sivarflow_auth_user', foundUser.id);
    } catch (e) {}

    // Save user last login & log event in Cloud Firestore
    try {
      setDoc(doc(db, 'users', foundUser.id), { lastLoginAt: new Date().toISOString() }, { merge: true }).catch(reportCloudError);
      setDoc(doc(db, 'logins', `login_${Date.now()}`), {
        userId: foundUser.id,
        userName: foundUser.name,
        userEmail: foundUser.email,
        role: foundUser.role,
        loginAt: new Date().toISOString(),
        status: 'success'
      }).catch(reportCloudError);
    } catch (e) {}

    // Adapt module view according to archetype or role
    if (foundUser.systemArchetype === 'finanzas_personales') {
      setActiveModule('personal_finances');
    } else if (foundUser.role === 'cajero') {
      setActiveModule('pos_terminal');
    } else if (foundUser.role === 'admin_maestro') {
      setActiveModule('admin_profiles');
    } else {
      setActiveModule('dashboard');
    }

    addNotification('success', `¡Bienvenido(a), ${foundUser.name}!`, `Sesión iniciada como ${foundUser.role.replace('_', ' ').toUpperCase()}.`);
    return { success: true };
  };

  const logout = () => {
    setIsAuthenticated(false);
    try {
      localStorage.removeItem('sivarflow_auth_user');
    } catch (e) {}
    addNotification('info', 'Sesión Finalizada', 'Has cerrado tu sesión de forma segura.');
  };

  // Personal Finances Methods
  const addPersonalTransaction = (txData: Omit<PersonalTransaction, 'id' | 'userId'>) => {
    const newTx: PersonalTransaction = {
      ...txData,
      id: `pt_${Date.now()}`,
      userId: currentUser.id,
    };
    setPersonalTransactions((prev) => [newTx, ...prev]);

    // Cloud Firestore Sync for Personal Finances
    try {
      setDoc(doc(db, 'personal_finances', newTx.id), {
        ...newTx,
        storedInCloud: true,
      }).catch((e) => console.warn('Sync personal tx to Firestore:', e));
    } catch (e) {
      console.warn('Firestore write:', e);
    }

    addNotification(
      'success',
      txData.type === 'ingreso' ? 'Ingreso Registrado' : 'Gasto Registrado',
      `$${txData.amount.toFixed(2)} en "${txData.category}" - ${txData.concept}`
    );
  };

  const deletePersonalTransaction = (id: string) => {
    setPersonalTransactions((prev) => prev.filter((t) => t.id !== id));
    try {
      deleteDoc(doc(db, 'personal_finances', id)).catch(reportCloudError);
    } catch (e) {}
    addNotification('info', 'Movimiento Eliminado', 'El registro de finanzas personales fue removido.');
  };

  const updatePersonalBudget = (id: string, newAmount: number) => {
    setPersonalBudgets((prev) =>
      prev.map((b) => (b.id === id ? { ...b, budgetedAmount: Math.max(0, newAmount) } : b))
    );
    addNotification('success', 'Presupuesto Actualizado', 'El límite mensual fue reconfigurado.');
  };

  const depositToSavingGoal = (id: string, amount: number) => {
    setPersonalSavingGoals((prev) =>
      prev.map((g) => {
        if (g.id !== id) return g;
        const newTotal = g.currentAmount + amount;
        return { ...g, currentAmount: newTotal };
      })
    );
    addNotification('success', 'Abono a Meta de Ahorro', `Se sumaron $${amount.toFixed(2)} a tu meta.`);
  };

  const addPersonalSavingGoal = (goalData: Omit<PersonalSavingGoal, 'id'>) => {
    const newGoal: PersonalSavingGoal = {
      ...goalData,
      id: `pg_${Date.now()}`,
    };
    setPersonalSavingGoals((prev) => [...prev, newGoal]);
    addNotification('success', 'Nueva Meta de Ahorro', `"${newGoal.title}" creada con objetivo de $${newGoal.targetAmount.toFixed(2)}.`);
  };

  // Exhaustive Customization & Full Setup
  const saveExhaustiveCustomization = (data: {
    userUpdates: Partial<UserProfile>;
    companyUpdates: Partial<Company>;
    chosenArchetype: SystemArchetype;
    branchesUpdates?: Branch[];
  }) => {
    const { userUpdates, companyUpdates, chosenArchetype, branchesUpdates } = data;

    // 1. Update current user
    updateUser(currentUser.id, {
      ...userUpdates,
      systemArchetype: chosenArchetype,
      isConfigured: true,
    });

    // 2. Update company
    const dteActive = chosenArchetype === 'empresa_consolidada_dte' ? true : false;
    const regimeType = chosenArchetype === 'empresa_consolidada_dte' ? 'general_tributario' : 'emprendedor_control_interno';

    updateCompany(currentCompany.id, {
      ...companyUpdates,
      systemArchetype: chosenArchetype,
      dteActive,
      regimeType,
    });

    // 3. Update branches if provided
    if (branchesUpdates && Array.isArray(branchesUpdates)) {
      // Sucursales que existían para esta empresa (p. ej. la "Casa Matriz" automática
      // creada al registrar la cuenta) y que el usuario NO conservó en el formulario:
      // hay que borrarlas también de Firestore, si no, reaparecen al recargar.
      const keptIds = new Set(branchesUpdates.map((b) => b.id));
      const staleBranches = branches.filter((b) => b.companyId === currentCompany.id && !keptIds.has(b.id));

      setBranches((prev) => {
        const others = prev.filter((b) => b.companyId !== currentCompany.id);
        return [...others, ...branchesUpdates];
      });
      branchesUpdates.forEach((b) => {
        try {
          setDoc(doc(db, 'branches', b.id), b).catch(reportCloudError);
        } catch (e) {}
      });
      staleBranches.forEach((b) => {
        try {
          deleteDoc(doc(db, 'branches', b.id)).catch(reportCloudError);
        } catch (e) {}
      });
    }

    // 4. Set visual default module
    if (chosenArchetype === 'finanzas_personales') {
      setActiveModule('personal_finances');
    } else {
      setActiveModule('dashboard');
    }

    setIsExhaustiveCustomizationOpen(false);
    addNotification(
      'success',
      '¡Sistema Personalizado con Éxito!',
      `Tu perfil se ha configurado bajo la modalidad "${
        chosenArchetype === 'finanzas_personales'
          ? 'Finanzas Personales'
          : chosenArchetype === 'emprendedor_control_interno'
          ? 'Emprendedor / Control Interno'
          : chosenArchetype === 'negocio_transicion'
          ? 'Negocio en Transición DTE'
          : 'Empresa Consolidada DTE MH'
      }".`
    );
  };

  // Customization & Lean Regime Management
  const toggleDteMode = () => {
    const nextActive = !currentCompany.dteActive;
    updateCompany(currentCompany.id, {
      dteActive: nextActive,
      regimeType: nextActive ? 'general_tributario' : 'emprendedor_control_interno',
    });
    addNotification(
      'info',
      nextActive ? '⚡ Modo Facturación Electrónica DTE Activo' : '🏪 Modo Control Interno (Emprendedor) Activo',
      nextActive
        ? 'El sistema emitirá comprobantes oficiales con validación y firma del Ministerio de Hacienda.'
        : 'Modo simplificado activo: ventas con tickets, notas internas y control ágil sin requisitos de Hacienda.'
    );
  };

  const updateRegimeConfig = (config: {
    regimeType: 'emprendedor_control_interno' | 'general_tributario';
    dteActive: boolean;
    taxesConfig?: {
      declaIva: boolean;
      declaPagoCuenta: boolean;
      declaImpuestosMunicipales: boolean;
      municipalRateOrFee?: number;
      alcaldiaName?: string;
    };
  }) => {
    updateCompany(currentCompany.id, {
      regimeType: config.regimeType,
      dteActive: config.dteActive,
      taxesConfig: config.taxesConfig,
    });
    addNotification('success', 'Configuración de Negocio Guardada', 'El perfil tributario y operativo ha sido actualizado.');
  };

  // Branch management (Multi-sucursales)
  const createBranch = (branchData: Omit<Branch, 'id' | 'companyId'>) => {
    const newBranch: Branch = {
      ...branchData,
      id: `branch_${Date.now()}`,
      companyId: currentCompany.id,
    };
    setBranches((prev) => [...prev, newBranch]);
    try {
      setDoc(doc(db, 'branches', newBranch.id), newBranch).catch(reportCloudError);
    } catch (e) {}
    addNotification('success', 'Sucursal Registrada', `"${newBranch.name}" añadida a ${currentCompany.name}.`);
  };

  const updateBranch = (id: string, updates: Partial<Branch>) => {
    setBranches((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updates } : b))
    );
    try {
      setDoc(doc(db, 'branches', id), updates, { merge: true }).catch(reportCloudError);
    } catch (e) {}
    addNotification('info', 'Sucursal Actualizada', 'Datos de la sucursal guardados.');
  };

  const deleteBranch = (id: string) => {
    setBranches((prev) => prev.filter((b) => b.id !== id));
    if (selectedBranchId === id) setSelectedBranchId('all');
    try {
      deleteDoc(doc(db, 'branches', id)).catch(reportCloudError);
    } catch (e) {}
    addNotification('warning', 'Sucursal Eliminada', 'La sucursal ha sido removida.');
  };

  // ----------------------------------------------------
  // MÓDULO 1: CRM & VENTAS & CXC
  // ----------------------------------------------------
  const createCustomer = (customerData: Omit<Customer, 'id'>): Customer => {
    const newCustomer: Customer = {
      ...customerData,
      id: `cust_${Date.now()}`,
      companyId: currentCompany.id, // sin esto el filtro por empresa lo ocultaba al instante
      rating: customerData.rating || 5,
      stage: customerData.stage || 'prospecto',
      notesTimeline: customerData.notesTimeline || [],
    };
    setCustomers((prev) => [...prev, newCustomer]);
    try {
      setDoc(doc(db, 'customers', newCustomer.id), newCustomer).catch(reportCloudError);
    } catch (e) {}
    addNotification('success', 'Cliente Registrado', `"${newCustomer.name}" añadido al CRM y sincronizado en la nube.`);
    return newCustomer;
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
    try {
      setDoc(doc(db, 'customers', id), updates, { merge: true }).catch(reportCloudError);
    } catch (e) {}
    addNotification('info', 'Cliente Actualizado', 'Información del cliente sincronizada en la nube.');
  };

  const deleteCustomer = (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    try {
      deleteDoc(doc(db, 'customers', id)).catch(reportCloudError);
    } catch (e) {}
    addNotification('warning', 'Cliente Eliminado', 'El registro del cliente ha sido removido del CRM.');
  };

  const addCustomerNote = (customerId: string, noteData: Omit<CustomerNote, 'id' | 'date'>) => {
    const newNote: CustomerNote = {
      ...noteData,
      id: `cn_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
    };
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === customerId) {
          const notes = c.notesTimeline ? [newNote, ...c.notesTimeline] : [newNote];
          const updated = { ...c, notesTimeline: notes };
          try {
            setDoc(doc(db, 'customers', customerId), { notesTimeline: notes }, { merge: true }).catch(reportCloudError);
          } catch (e) {}
          return updated;
        }
        return c;
      })
    );
    addNotification('success', 'Bitácora CRM Guardada', 'Nota de seguimiento añadida al historial del cliente.');
  };

  const createProduct = (productData: Omit<Product, 'id' | 'companyId'>) => {
    const newProd: Product = {
      ...productData,
      id: `prod_${Date.now()}`,
      companyId: currentCompany.id,
    };
    setProducts((prev) => [...prev, newProd]);
    try {
      setDoc(doc(db, 'products', newProd.id), newProd).catch(reportCloudError);
    } catch (e) {}
    addNotification('success', 'Producto Creado', `"${newProd.name}" registrado en inventario y guardado en la nube.`);
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
    try {
      setDoc(doc(db, 'products', id), updates, { merge: true }).catch(reportCloudError);
    } catch (e) {}
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    try {
      deleteDoc(doc(db, 'products', id)).catch(reportCloudError);
    } catch (e) {}
    addNotification('warning', 'Producto Eliminado', 'El producto ha sido removido del catálogo.');
  };

  const createInvoice = (invoiceData: Omit<Invoice, 'id' | 'companyId' | 'createdAt'>): Invoice => {
    const invoiceId = `inv_${Date.now()}`;
    const nextEntryNumber = journalEntries.length + 1;

    // Asignar sucursal activa si no está definida
    let finalBranchId = invoiceData.branchId;
    let finalBranchName = invoiceData.branchName;
    if (!finalBranchId && selectedBranchId !== 'all') {
      const activeBranch = branches.find((b) => b.id === selectedBranchId);
      if (activeBranch) {
        finalBranchId = activeBranch.id;
        finalBranchName = activeBranch.name;
      }
    } else if (!finalBranchId && branches.length > 0) {
      finalBranchId = branches[0].id;
      finalBranchName = branches[0].name;
    }

    const newInvoice: Invoice = {
      ...invoiceData,
      branchId: finalBranchId,
      branchName: finalBranchName,
      id: invoiceId,
      companyId: currentCompany.id,
      createdAt: new Date().toISOString(),
    };

    // Auto-registro o actualización en CRM
    const existingCust = customers.find(
      (c) =>
        (c.id && c.id === newInvoice.customerId) ||
        (newInvoice.customerNit && c.nit === newInvoice.customerNit && c.nit.length > 5) ||
        (newInvoice.customerName && c.name.toLowerCase().trim() === newInvoice.customerName.toLowerCase().trim())
    );

    if (!existingCust && newInvoice.customerName && newInvoice.customerName.trim().length > 0) {
      const autoCust: Customer = {
        id: newInvoice.customerId && newInvoice.customerId.startsWith('cust_') ? newInvoice.customerId : `cust_${Date.now()}`,
        name: newInvoice.customerName,
        tradeName: newInvoice.customerName,
        nit: newInvoice.customerNit || '0614-000000-000-0',
        nrc: newInvoice.customerNrc || '',
        address: 'Registrado automáticamente desde Venta / Facturación',
        phone: '',
        email: '',
        isGranContribuyente: newInvoice.customerIsGranContribuyente || false,
        creditLimit: 1500,
        paymentTermDays: newInvoice.paymentCondition === 'contado' ? 0 : 30,
        stage: 'frecuente',
        rating: 5,
        acquisitionChannel: 'tienda_fisica',
        department: currentCompany.department || 'San Salvador',
        municipality: currentCompany.municipality || 'San Salvador Centro',
        notesTimeline: [
          {
            id: `cn_${Date.now()}`,
            date: newInvoice.date,
            type: 'acuerdo',
            content: `Cliente registrado automáticamente con la venta #${newInvoice.correlativeNumber} ($${newInvoice.totalPagar.toFixed(2)}).`,
            author: currentUser.name,
          },
        ],
      };
      setCustomers((prev) => [autoCust, ...prev]);
      newInvoice.customerId = autoCust.id;
    } else if (existingCust) {
      setCustomers((prev) =>
        prev.map((c) => {
          if (c.id === existingCust.id) {
            const nextStage = c.stage === 'prospecto' || c.stage === 'cotizacion' ? 'frecuente' : c.stage;
            const newNote: CustomerNote = {
              id: `cn_${Date.now()}`,
              date: newInvoice.date,
              type: 'acuerdo',
              content: `Venta registrada: ${newInvoice.type.toUpperCase()} #${newInvoice.correlativeNumber} por $${newInvoice.totalPagar.toFixed(2)}.`,
              author: currentUser.name,
            };
            return {
              ...c,
              stage: nextStage,
              notesTimeline: c.notesTimeline ? [newNote, ...c.notesTimeline] : [newNote],
            };
          }
          return c;
        })
      );
    }

    // 1. Asiento Contable Automático
    const entry = generateSaleAccountingEntry(newInvoice, nextEntryNumber);
    newInvoice.accountingEntryId = entry.id;

    // 2. Si es al contado, afectar bancos/caja
    if (newInvoice.paymentCondition === 'contado') {
      const defaultBank = bankAccounts[0];
      if (defaultBank) {
        setBankAccounts((prev) =>
          prev.map((b) =>
            b.id === defaultBank.id
              ? { ...b, currentBalance: Number((b.currentBalance + newInvoice.totalPagar).toFixed(2)) }
              : b
          )
        );

        // Movimiento de tesorería
        const tMovement: TreasuryMovement = {
          id: `tmov_${Date.now()}`,
          companyId: currentCompany.id,
          branchId: newInvoice.branchId,
          branchName: newInvoice.branchName,
          bankAccountId: defaultBank.id,
          bankAccountName: defaultBank.accountName,
          date: newInvoice.date,
          type: 'ingreso_venta',
          amount: newInvoice.totalPagar,
          referenceNumber: newInvoice.correlativeNumber,
          description: `Venta Contado ${newInvoice.type.toUpperCase()} #${newInvoice.correlativeNumber}`,
          isReconciled: true,
          accountingEntryId: entry.id,
        };
        setTreasuryMovements((prev) => [tMovement, ...prev]);
      }
    }

    // 3. Kardex y Rebaja de Inventario
    const kMovements: KardexMovement[] = [];
    newInvoice.items.forEach((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (product && !product.isService) {
        const newStock = Math.max(0, product.stock - item.quantity);
        setProducts((prev) =>
          prev.map((p) => (p.id === product.id ? { ...p, stock: newStock } : p))
        );
        try {
          setDoc(doc(db, 'products', product.id), { stock: newStock }, { merge: true }).catch(reportCloudError);
        } catch (e) {}

        kMovements.push({
          id: `kdx_${Date.now()}_${item.id}`,
          companyId: currentCompany.id,
          productId: product.id,
          productName: product.name,
          date: newInvoice.date,
          type: 'salida_venta',
          referenceDoc: newInvoice.correlativeNumber,
          quantity: item.quantity,
          unitCost: product.currentCost,
          totalCost: Number((item.quantity * product.currentCost).toFixed(2)),
          balanceQuantity: newStock,
          balanceUnitCost: product.currentCost,
          balanceTotalCost: Number((newStock * product.currentCost).toFixed(2)),
          notes: `Venta a ${newInvoice.customerName}`,
        });
      }
    });

    setInvoices((prev) => [newInvoice, ...prev]);
    setJournalEntries((prev) => [entry, ...prev]);
    if (kMovements.length > 0) {
      setKardexMovements((prev) => [...kMovements, ...prev]);
    }

    try {
      setDoc(doc(db, 'invoices', newInvoice.id), newInvoice).catch(reportCloudError);
    } catch (e) {}

    addNotification(
      'success',
      'Factura Emitida & Asentada',
      `${newInvoice.type.toUpperCase()} #${newInvoice.correlativeNumber} por ${newInvoice.totalPagar.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} registrada en CRM y Nube.`
    );

    return newInvoice;
  };

  const updateInvoice = (id: string, updates: Partial<Invoice>) => {
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, ...updates } : inv))
    );
    try {
      setDoc(doc(db, 'invoices', id), updates, { merge: true }).catch(reportCloudError);
    } catch (e) {}
    addNotification('info', 'Venta Modificada', 'Registro de venta actualizado correctamente.');
  };

  const deleteInvoice = (invoiceId: string) => {
    const inv = invoices.find((i) => i.id === invoiceId);
    if (!inv) return;

    // 1. Restaurar stock
    inv.items.forEach((item) => {
      const prod = products.find((p) => p.id === item.productId);
      if (prod && !prod.isService) {
        setProducts((prev) =>
          prev.map((p) => (p.id === prod.id ? { ...p, stock: p.stock + item.quantity } : p))
        );
        try {
          setDoc(doc(db, 'products', prod.id), { stock: prod.stock + item.quantity }, { merge: true }).catch(reportCloudError);
        } catch (e) {}
      }
    });

    // 2. Limpiar kardex
    setKardexMovements((prev) => prev.filter((k) => k.referenceDoc !== inv.correlativeNumber));

    // 3. Limpiar asiento contable
    if (inv.accountingEntryId) {
      setJournalEntries((prev) => prev.filter((j) => j.id !== inv.accountingEntryId));
    }

    // 4. Limpiar tesorería
    setTreasuryMovements((prev) => prev.filter((t) => t.referenceNumber !== inv.correlativeNumber));

    // 5. Limpiar pagos asociados
    setCustomerPayments((prev) => prev.filter((cp) => cp.invoiceId !== invoiceId));

    // 6. Eliminar la factura
    setInvoices((prev) => prev.filter((i) => i.id !== invoiceId));
    try {
      deleteDoc(doc(db, 'invoices', invoiceId)).catch(reportCloudError);
    } catch (e) {}

    addNotification('warning', 'Venta Eliminada', `Documento #${inv.correlativeNumber} y sus asientos/kardex han sido revertidos.`);
  };

  const deleteCustomerPayment = (paymentId: string) => {
    const p = customerPayments.find((cp) => cp.id === paymentId);
    if (!p) return;

    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id === p.invoiceId) {
          const restoredSaldo = Number((inv.saldoPendiente + p.amount).toFixed(2));
          const restoredStatus = restoredSaldo >= inv.totalPagar ? 'emitida' : 'parcial';
          try {
            setDoc(doc(db, 'invoices', p.invoiceId), { saldoPendiente: restoredSaldo, status: restoredStatus }, { merge: true }).catch(reportCloudError);
          } catch (e) {}
          return {
            ...inv,
            saldoPendiente: restoredSaldo,
            status: restoredStatus,
          };
        }
        return inv;
      })
    );

    setCustomerPayments((prev) => prev.filter((cp) => cp.id !== paymentId));
    try {
      deleteDoc(doc(db, 'customer_payments', paymentId)).catch(reportCloudError);
    } catch (e) {}
    addNotification('info', 'Pago Revertido', `Abono de $${p.amount.toFixed(2)} eliminado y saldo de factura restaurado.`);
  };

  const registerCustomerPayment = (paymentData: Omit<CustomerPayment, 'id' | 'companyId'>) => {
    const paymentId = `cpay_${Date.now()}`;
    const newPayment: CustomerPayment = {
      ...paymentData,
      id: paymentId,
      companyId: currentCompany.id,
    };

    // 1. Actualizar saldo de la factura
    const targetInv = invoices.find((i) => i.id === paymentData.invoiceId);
    const newSaldo = targetInv ? Math.max(0, Number((targetInv.saldoPendiente - paymentData.amount).toFixed(2))) : 0;
    const newStatus = newSaldo <= 0.01 ? 'pagada' : 'parcial';

    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id === paymentData.invoiceId) {
          return { ...inv, saldoPendiente: newSaldo, status: newStatus };
        }
        return inv;
      })
    );

    // 2. Incrementar saldo en cuenta bancaria/caja seleccionada
    const targetAccount = bankAccounts.find((b) => b.id === paymentData.targetAccountId);
    if (targetAccount) {
      setBankAccounts((prev) =>
        prev.map((b) =>
          b.id === targetAccount.id
            ? { ...b, currentBalance: Number((b.currentBalance + paymentData.amount).toFixed(2)) }
            : b
        )
      );
    }

    // 3. Registrar partida contable de cobro CxC
    const entry = generateCustomerPaymentEntry(
      newPayment,
      journalEntries.length + 1,
      targetAccount?.accountingCode || '1101-01',
      targetAccount?.accountName || 'Caja General'
    );

    // 4. Registrar movimiento de tesorería
    const tMovement: TreasuryMovement = {
      id: `tmov_${Date.now()}`,
      companyId: currentCompany.id,
      bankAccountId: paymentData.targetAccountId,
      bankAccountName: targetAccount?.accountName || 'Banco / Caja',
      date: paymentData.date,
      type: 'abono_cxc',
      amount: paymentData.amount,
      referenceNumber: paymentData.receiptNumber,
      description: `Abono de Cliente ${paymentData.customerName} - Doc: ${paymentData.invoiceNumber}`,
      isReconciled: true,
      accountingEntryId: entry.id,
    };

    setCustomerPayments((prev) => [newPayment, ...prev]);
    setJournalEntries((prev) => [entry, ...prev]);
    setTreasuryMovements((prev) => [tMovement, ...prev]);

    try {
      setDoc(doc(db, 'customer_payments', newPayment.id), newPayment).catch(reportCloudError);
      setDoc(doc(db, 'invoices', paymentData.invoiceId), { saldoPendiente: newSaldo, status: newStatus }, { merge: true }).catch(reportCloudError);
    } catch (e) {}

    addNotification(
      'success',
      'Cobro Registrado',
      `Recibo #${paymentData.receiptNumber} por $${paymentData.amount.toFixed(2)} registrado e ingresado a tesorería.`
    );
  };

  const cancelInvoice = (id: string) => {
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, status: 'anulada', saldoPendiente: 0 } : inv))
    );
    try {
      setDoc(doc(db, 'invoices', id), { status: 'anulada', saldoPendiente: 0 }, { merge: true }).catch(reportCloudError);
    } catch (e) {}
    addNotification('warning', 'Factura Anulada', 'El documento DTE ha sido marcado como anulado.');
  };

  // ----------------------------------------------------
  // MÓDULO 2: CRM PROVEEDORES & COMPRAS & SCM
  // ----------------------------------------------------
  const createSupplier = (supplierData: Omit<Supplier, 'id'>) => {
    const newSupp: Supplier = {
      ...supplierData,
      id: `supp_${Date.now()}`,
      companyId: currentCompany.id, // sin esto el proveedor "no se guardaba" (el filtro por empresa lo ocultaba)
      rating: supplierData.rating || 5,
      qualityScore: supplierData.qualityScore || 5,
      timelinessScore: supplierData.timelinessScore || 5,
      pricingScore: supplierData.pricingScore || 5,
      notesTimeline: supplierData.notesTimeline || [],
    };
    setSuppliers((prev) => [...prev, newSupp]);
    try {
      setDoc(doc(db, 'suppliers', newSupp.id), newSupp).catch(reportCloudError);
    } catch (e) {}
    addNotification('success', 'Proveedor Registrado', `"${newSupp.name}" añadido al catálogo.`);
  };

  const updateSupplier = (id: string, updates: Partial<Supplier>) => {
    setSuppliers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
    try {
      setDoc(doc(db, 'suppliers', id), updates, { merge: true }).catch(reportCloudError);
    } catch (e) {}
    addNotification('info', 'Proveedor Actualizado', 'Información del proveedor sincronizada.');
  };

  const addSupplierNote = (supplierId: string, noteData: Omit<SupplierNote, 'id' | 'date'>) => {
    const newNote: SupplierNote = {
      ...noteData,
      id: `sn_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
    };
    setSuppliers((prev) =>
      prev.map((s) => {
        if (s.id === supplierId) {
          const notes = s.notesTimeline ? [newNote, ...s.notesTimeline] : [newNote];
          return { ...s, notesTimeline: notes };
        }
        return s;
      })
    );
    addNotification('success', 'Bitácora Proveedor Guardada', 'Nota de negociación registrada.');
  };

  const createPurchase = (purchaseData: Omit<Purchase, 'id' | 'companyId' | 'createdAt'>): Purchase => {
    const purchaseId = `pur_${Date.now()}`;
    const nextEntryNumber = journalEntries.length + 1;

    // Asignar sucursal activa si no está definida
    let finalBranchId = purchaseData.branchId;
    let finalBranchName = purchaseData.branchName;
    if (!finalBranchId && selectedBranchId !== 'all') {
      const activeBranch = branches.find((b) => b.id === selectedBranchId);
      if (activeBranch) {
        finalBranchId = activeBranch.id;
        finalBranchName = activeBranch.name;
      }
    } else if (!finalBranchId && branches.length > 0) {
      finalBranchId = branches[0].id;
      finalBranchName = branches[0].name;
    }

    const newPurchase: Purchase = {
      ...purchaseData,
      branchId: finalBranchId,
      branchName: finalBranchName,
      id: purchaseId,
      companyId: currentCompany.id,
      createdAt: new Date().toISOString(),
    };

    // 1. Asiento Contable Automático
    const entry = generatePurchaseAccountingEntry(newPurchase, nextEntryNumber);
    newPurchase.accountingEntryId = entry.id;

    // 2. Kardex e incremento de inventario
    const kMovements: KardexMovement[] = [];
    newPurchase.items.forEach((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (product && !product.isService) {
        const newStock = product.stock + item.quantity;
        const newTotalCost = Number((product.stock * product.currentCost + item.quantity * item.unitCost).toFixed(2));
        const newWeightedAverageCost = Number((newTotalCost / newStock).toFixed(2));

        setProducts((prev) =>
          prev.map((p) =>
            p.id === product.id
              ? { ...p, stock: newStock, currentCost: newWeightedAverageCost }
              : p
          )
        );
        try {
          setDoc(doc(db, 'products', product.id), { stock: newStock, currentCost: newWeightedAverageCost }, { merge: true }).catch(reportCloudError);
        } catch (e) {}

        kMovements.push({
          id: `kdx_${Date.now()}_${item.id}`,
          companyId: currentCompany.id,
          productId: product.id,
          productName: product.name,
          date: newPurchase.date,
          type: 'entrada_compra',
          referenceDoc: newPurchase.documentNumber,
          quantity: item.quantity,
          unitCost: item.unitCost,
          totalCost: Number((item.quantity * item.unitCost).toFixed(2)),
          balanceQuantity: newStock,
          balanceUnitCost: newWeightedAverageCost,
          balanceTotalCost: newTotalCost,
          notes: `Compra a ${newPurchase.supplierName}`,
        });
      }
    });

    setPurchases((prev) => [newPurchase, ...prev]);
    setJournalEntries((prev) => [entry, ...prev]);
    if (kMovements.length > 0) {
      setKardexMovements((prev) => [...kMovements, ...prev]);
    }

    try {
      setDoc(doc(db, 'purchases', newPurchase.id), newPurchase).catch(reportCloudError);
    } catch (e) {}

    addNotification(
      'success',
      'Compra Registrada',
      `Documento ${newPurchase.docType.toUpperCase()} #${newPurchase.documentNumber} por $${newPurchase.totalPagar.toFixed(2)} registrado en Kardex e IVA Compras.`
    );

    return newPurchase;
  };

  const registerSupplierPayment = (paymentData: Omit<SupplierPayment, 'id' | 'companyId'>) => {
    const paymentId = `spay_${Date.now()}`;
    const newPayment: SupplierPayment = {
      ...paymentData,
      id: paymentId,
      companyId: currentCompany.id,
    };

    // 1. Reducir saldo de la compra
    const targetPur = purchases.find((p) => p.id === paymentData.purchaseId);
    const newSaldo = targetPur ? Math.max(0, Number((targetPur.saldoPendiente - paymentData.amount).toFixed(2))) : 0;
    const newStatus = newSaldo <= 0.01 ? 'pagada' : 'parcial';

    setPurchases((prev) =>
      prev.map((pur) => {
        if (pur.id === paymentData.purchaseId) {
          return { ...pur, saldoPendiente: newSaldo, status: newStatus };
        }
        return pur;
      })
    );

    // 2. Descontar saldo de la cuenta de banco origen
    const sourceAccount = bankAccounts.find((b) => b.id === paymentData.sourceAccountId);
    if (sourceAccount) {
      setBankAccounts((prev) =>
        prev.map((b) =>
          b.id === sourceAccount.id
            ? { ...b, currentBalance: Number((b.currentBalance - paymentData.amount).toFixed(2)) }
            : b
        )
      );
    }

    // 3. Registrar partida contable de pago CxP
    const entry = generateSupplierPaymentEntry(
      newPayment,
      journalEntries.length + 1,
      sourceAccount?.accountingCode || '1101-03',
      sourceAccount?.accountName || 'Banco Agrícola'
    );

    // 4. Registrar movimiento de tesorería
    const tMovement: TreasuryMovement = {
      id: `tmov_${Date.now()}`,
      companyId: currentCompany.id,
      bankAccountId: paymentData.sourceAccountId,
      bankAccountName: sourceAccount?.accountName || 'Banco Origen',
      date: paymentData.date,
      type: 'pago_proveedor',
      amount: paymentData.amount,
      referenceNumber: paymentData.referenceNumber || `CHK-${Date.now().toString().slice(-4)}`,
      description: `Pago a Proveedor ${paymentData.supplierName} - Factura: ${paymentData.purchaseNumber}`,
      isReconciled: true,
      accountingEntryId: entry.id,
    };

    setSupplierPayments((prev) => [newPayment, ...prev]);
    setJournalEntries((prev) => [entry, ...prev]);
    setTreasuryMovements((prev) => [tMovement, ...prev]);

    try {
      setDoc(doc(db, 'supplier_payments', newPayment.id), newPayment).catch(reportCloudError);
      setDoc(doc(db, 'purchases', paymentData.purchaseId), { saldoPendiente: newSaldo, status: newStatus }, { merge: true }).catch(reportCloudError);
    } catch (e) {}

    addNotification(
      'success',
      'Pago a Proveedor Realizado',
      `Desembolso de $${paymentData.amount.toFixed(2)} registrado en CxP y Bancos.`
    );
  };

  const updatePurchase = (id: string, updates: Partial<Purchase>) => {
    setPurchases((prev) =>
      prev.map((pur) => (pur.id === id ? { ...pur, ...updates } : pur))
    );
    try {
      setDoc(doc(db, 'purchases', id), updates, { merge: true }).catch(reportCloudError);
    } catch (e) {}
    addNotification('info', 'Compra Modificada', 'Registro de compra/gasto actualizado.');
  };

  const deletePurchase = (purchaseId: string) => {
    const pur = purchases.find((p) => p.id === purchaseId);
    if (!pur) return;

    // 1. Revertir inventario
    pur.items.forEach((item) => {
      const prod = products.find((p) => p.id === item.productId);
      if (prod && !prod.isService) {
        setProducts((prev) =>
          prev.map((p) => (p.id === prod.id ? { ...p, stock: Math.max(0, p.stock - item.quantity) } : p))
        );
        try {
          setDoc(doc(db, 'products', prod.id), { stock: Math.max(0, prod.stock - item.quantity) }, { merge: true }).catch(reportCloudError);
        } catch (e) {}
      }
    });

    // 2. Limpiar kardex
    setKardexMovements((prev) => prev.filter((k) => k.referenceDoc !== pur.documentNumber));

    // 3. Limpiar asiento
    if (pur.accountingEntryId) {
      setJournalEntries((prev) => prev.filter((j) => j.id !== pur.accountingEntryId));
    }

    // 4. Limpiar tesorería si fue al contado
    setTreasuryMovements((prev) => prev.filter((t) => t.referenceNumber !== pur.documentNumber));

    // 5. Limpiar pagos
    setSupplierPayments((prev) => prev.filter((sp) => sp.purchaseId !== purchaseId));

    // 6. Eliminar compra
    setPurchases((prev) => prev.filter((p) => p.id !== purchaseId));
    try {
      deleteDoc(doc(db, 'purchases', purchaseId)).catch(reportCloudError);
    } catch (e) {}

    addNotification('warning', 'Compra Eliminada', `Documento #${pur.documentNumber} y sus efectos contables han sido revertidos.`);
  };

  const deleteSupplierPayment = (paymentId: string) => {
    const p = supplierPayments.find((sp) => sp.id === paymentId);
    if (!p) return;

    setPurchases((prev) =>
      prev.map((pur) => {
        if (pur.id === p.purchaseId) {
          const restoredSaldo = Number((pur.saldoPendiente + p.amount).toFixed(2));
          const restoredStatus = restoredSaldo >= pur.totalPagar ? 'emitida' : 'parcial';
          try {
            setDoc(doc(db, 'purchases', p.purchaseId), { saldoPendiente: restoredSaldo, status: restoredStatus }, { merge: true }).catch(reportCloudError);
          } catch (e) {}
          return {
            ...pur,
            saldoPendiente: restoredSaldo,
            status: restoredStatus,
          };
        }
        return pur;
      })
    );

    setSupplierPayments((prev) => prev.filter((sp) => sp.id !== paymentId));
    try {
      deleteDoc(doc(db, 'supplier_payments', paymentId)).catch(reportCloudError);
    } catch (e) {}
    addNotification('info', 'Pago a Proveedor Revertido', `Abono de $${p.amount.toFixed(2)} eliminado y saldo de deuda restaurado.`);
  };

  const deleteSupplier = (id: string) => {
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
    try {
      deleteDoc(doc(db, 'suppliers', id)).catch(reportCloudError);
    } catch (e) {}
    addNotification('warning', 'Proveedor Eliminado', 'El proveedor ha sido removido del catálogo.');
  };

  // ----------------------------------------------------
  // MÓDULO 3: RRHH 360° & PLANILLA LEGAL EL SALVADOR
  // ----------------------------------------------------
  const createEmployee = (employeeData: Omit<Employee, 'id' | 'companyId'>) => {
    let finalBranchId = employeeData.branchId;
    let finalBranchName = employeeData.branchName;
    if (!finalBranchId && selectedBranchId !== 'all') {
      const activeBranch = branches.find((b) => b.id === selectedBranchId);
      if (activeBranch) {
        finalBranchId = activeBranch.id;
        finalBranchName = activeBranch.name;
      }
    } else if (!finalBranchId && branches.length > 0) {
      finalBranchId = branches[0].id;
      finalBranchName = branches[0].name;
    }

    const newEmp: Employee = {
      ...employeeData,
      branchId: finalBranchId,
      branchName: finalBranchName,
      id: `emp_${Date.now()}`,
      companyId: currentCompany.id,
      rating: 5,
      evaluations: [],
      disciplinaryActions: [],
    };
    setEmployees((prev) => [...prev, newEmp]);
    try {
      setDoc(doc(db, 'employees', newEmp.id), newEmp).catch(reportCloudError);
    } catch (e) {}
    addNotification('success', 'Colaborador Registrado', `"${newEmp.firstName} ${newEmp.lastName}" ingresado al sistema de RRHH.`);
  };

  const updateEmployee = (id: string, updates: Partial<Employee>) => {
    setEmployees((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
    );
    try {
      setDoc(doc(db, 'employees', id), updates, { merge: true }).catch(reportCloudError);
    } catch (e) {}
    addNotification('info', 'Empleado Actualizado', 'Ficha de colaborador modificada con éxito.');
  };

  const deleteEmployee = (id: string) => {
    setEmployees((prev) => prev.filter((e) => e.id !== id));
    try {
      deleteDoc(doc(db, 'employees', id)).catch(reportCloudError);
    } catch (e) {}
    addNotification('warning', 'Colaborador Retirado', 'El colaborador ha sido removido del directorio.');
  };

  const addEmployeeEvaluation = (employeeId: string, evalData: Omit<EmployeeEvaluation, 'id' | 'date'>) => {
    const newEval: EmployeeEvaluation = {
      ...evalData,
      id: `eval_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
    };
    setEmployees((prev) =>
      prev.map((e) => {
        if (e.id === employeeId) {
          const evals = e.evaluations ? [newEval, ...e.evaluations] : [newEval];
          // Recalcular rating promedio
          const avg = Number((evals.reduce((acc, v) => acc + v.score, 0) / evals.length).toFixed(1));
          const updated = { ...e, rating: avg, evaluations: evals };
          try {
            setDoc(doc(db, 'employees', e.id), { rating: avg, evaluations: evals }, { merge: true }).catch(reportCloudError);
          } catch (err) {}
          return updated;
        }
        return e;
      })
    );
    addNotification('success', 'Evaluación de Desempeño Registrada', 'Calificación 360° guardada.');
  };

  const addDisciplinaryAction = (employeeId: string, actionData: Omit<DisciplinaryAction, 'id' | 'date'>) => {
    const newAction: DisciplinaryAction = {
      ...actionData,
      id: `disc_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
    };
    setEmployees((prev) =>
      prev.map((e) => {
        if (e.id === employeeId) {
          const actions = e.disciplinaryActions ? [newAction, ...e.disciplinaryActions] : [newAction];
          const updated = { ...e, disciplinaryActions: actions };
          try {
            setDoc(doc(db, 'employees', e.id), { disciplinaryActions: actions }, { merge: true }).catch(reportCloudError);
          } catch (err) {}
          return updated;
        }
        return e;
      })
    );
    addNotification('warning', 'Amonestación / Registro Disciplinario', 'Acción legal registrada en el expediente.');
  };

  const generatePayrollForPeriod = (
    periodType: 'quincenal' | 'mensual',
    month: number,
    year: number,
    branchId?: string
  ): Payroll => {
    let targetEmployees = employees.filter((e) => e.isActive);
    let targetBranchName: string | undefined;

    if (branchId && branchId !== 'all') {
      const bObj = branches.find((b) => b.id === branchId);
      if (bObj) {
        targetBranchName = bObj.name;
        targetEmployees = targetEmployees.filter((e) => e.branchId === branchId);
      }
    } else if (selectedBranchId !== 'all') {
      const bObj = branches.find((b) => b.id === selectedBranchId);
      if (bObj) {
        targetBranchName = bObj.name;
      }
    }

    const periodNumber = periodType === 'quincenal' ? 1 : 1;
    const isCompanyOver10 = targetEmployees.length >= fiscalConfig.insaforpMinEmployees;

    const details = targetEmployees.map((emp) => {
      const baseSalaryPeriod = periodType === 'quincenal' ? emp.baseSalary / 2 : emp.baseSalary;
      const calc = calculateEmployeePayroll({
        baseSalary: baseSalaryPeriod,
        period: periodType,
        isCompanyOver10Employees: isCompanyOver10,
        config: fiscalConfig,
      });

      return {
        employeeId: emp.id,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        dui: emp.dui,
        position: emp.position,
        baseSalary: baseSalaryPeriod,
        overtimePay: 0,
        bonuses: 0,
        otherIncome: 0,
        totalDevengado: calc.totalDevengado,
        overtimeDiurnaHours: 0,
        overtimeDiurnaAmount: 0,
        overtimeNocturnaHours: 0,
        overtimeNocturnaAmount: 0,
        nightHours: 0,
        nightHoursAmount: 0,
        tardinessDiscount: 0,
        advancesOrLoansDiscount: 0,
        isIncluded: true,
        isssLaboral: calc.isssLaboral,
        afpLaboral: calc.afpLaboral,
        baseImponibleRenta: calc.baseImponibleRenta,
        rentaRetencion: calc.rentaRetencion,
        otherDeductions: 0,
        totalDeducciones: calc.totalDeducciones,
        liquidoPagar: calc.liquidoPagar,
        isssPatronal: calc.isssPatronal,
        afpPatronal: calc.afpPatronal,
        insaforpPatronal: calc.insaforpPatronal,
        provisionAguinaldo: calc.provisionAguinaldo,
        provisionVacacion: calc.provisionVacacion,
        provisionIndemnizacion: calc.provisionIndemnizacion,
      };
    });

    const totalDevengado = Number(details.reduce((acc, d) => acc + d.totalDevengado, 0).toFixed(2));
    const totalIsssLaboral = Number(details.reduce((acc, d) => acc + d.isssLaboral, 0).toFixed(2));
    const totalAfpLaboral = Number(details.reduce((acc, d) => acc + d.afpLaboral, 0).toFixed(2));
    const totalRentaRetenida = Number(details.reduce((acc, d) => acc + d.rentaRetencion, 0).toFixed(2));
    const totalLiquido = Number(details.reduce((acc, d) => acc + d.liquidoPagar, 0).toFixed(2));

    const totalIsssPatronal = Number(details.reduce((acc, d) => acc + d.isssPatronal, 0).toFixed(2));
    const totalAfpPatronal = Number(details.reduce((acc, d) => acc + d.afpPatronal, 0).toFixed(2));
    const totalInsaforpPatronal = Number(details.reduce((acc, d) => acc + d.insaforpPatronal, 0).toFixed(2));
    const totalProvisiones = Number(
      details.reduce((acc, d) => acc + d.provisionAguinaldo + d.provisionVacacion + d.provisionIndemnizacion, 0).toFixed(2)
    );
    const costoTotalEmpresa = Number((totalDevengado + totalIsssPatronal + totalAfpPatronal + totalInsaforpPatronal + totalProvisiones).toFixed(2));

    const newPayroll: Payroll = {
      id: `pay_${Date.now()}`,
      companyId: currentCompany.id,
      branchId: branchId && branchId !== 'all' ? branchId : undefined,
      branchName: targetBranchName,
      periodNumber,
      periodType,
      year,
      month,
      startDate: `${year}-${month.toString().padStart(2, '0')}-01`,
      endDate: `${year}-${month.toString().padStart(2, '0')}-${periodType === 'quincenal' ? '15' : '30'}`,
      paymentDate: new Date().toISOString().split('T')[0],
      status: 'aprobada',
      details,
      totalDevengado,
      totalIsssLaboral,
      totalAfpLaboral,
      totalRentaRetenida,
      totalLiquido,
      totalIsssPatronal,
      totalAfpPatronal,
      totalInsaforpPatronal,
      totalProvisiones,
      costoTotalEmpresa,
      createdAt: new Date().toISOString(),
    };

    // Generar partida contable automática de devengo de planilla
    const entry = generatePayrollAccountingEntry(newPayroll, journalEntries.length + 1);
    newPayroll.accountingEntryId = entry.id;

    setPayrolls((prev) => [newPayroll, ...prev]);
    setJournalEntries((prev) => [entry, ...prev]);

    try {
      setDoc(doc(db, 'payrolls', newPayroll.id), newPayroll).catch(reportCloudError);
    } catch (e) {}

    addNotification(
      'success',
      'Planilla Legal SV Generada',
      `Planilla ${periodType.toUpperCase()} de ${details.length} colaboradores procesada con retenciones ISSS, AFP y Renta calculadas.`
    );

    return newPayroll;
  };

  const saveCustomPayroll = (payroll: Payroll) => {
    setPayrolls((prev) => {
      const idx = prev.findIndex((p) => p.id === payroll.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = payroll;
        return copy;
      }
      return [payroll, ...prev];
    });
    try {
      setDoc(doc(db, 'payrolls', payroll.id), payroll).catch(reportCloudError);
    } catch (e) {}
    addNotification('success', 'Planilla Actualizada', `Cambios en la planilla ${payroll.periodType.toUpperCase()} guardados.`);
  };

  const deletePayroll = (id: string) => {
    setPayrolls((prev) => prev.filter((p) => p.id !== id));
    try {
      deleteDoc(doc(db, 'payrolls', id)).catch(reportCloudError);
    } catch (e) {}
    addNotification('warning', 'Planilla Eliminada', 'El registro de planilla fue removido del historial.');
  };

  const payPayroll = (payrollId: string, bankAccountId: string) => {
    const payroll = payrolls.find((p) => p.id === payrollId);
    if (!payroll) return;

    // 1. Marcar planilla como pagada
    setPayrolls((prev) =>
      prev.map((p) => (p.id === payrollId ? { ...p, status: 'pagada' } : p))
    );
    try {
      setDoc(doc(db, 'payrolls', payrollId), { status: 'pagada' }, { merge: true }).catch(reportCloudError);
    } catch (e) {}

    // 2. Descontar fondos del banco
    const bank = bankAccounts.find((b) => b.id === bankAccountId);
    if (bank) {
      setBankAccounts((prev) =>
        prev.map((b) =>
          b.id === bank.id
            ? { ...b, currentBalance: Number((b.currentBalance - payroll.totalLiquido).toFixed(2)) }
            : b
        )
      );

      // 3. Movimiento de tesorería
      const tMovement: TreasuryMovement = {
        id: `tmov_${Date.now()}`,
        companyId: currentCompany.id,
        bankAccountId: bank.id,
        bankAccountName: bank.accountName,
        date: new Date().toISOString().split('T')[0],
        type: 'pago_planilla',
        amount: payroll.totalLiquido,
        referenceNumber: `PLA-${payroll.year}-${payroll.month}`,
        description: `Dispersión Electrónica de Sueldos Netos Planilla ${payroll.periodType.toUpperCase()}`,
        isReconciled: true,
      };
      setTreasuryMovements((prev) => [tMovement, ...prev]);
    }

    addNotification(
      'success',
      'Planilla Pagada & Dispersada',
      `Se dispersaron $${payroll.totalLiquido.toFixed(2)} a las cuentas de los colaboradores.`
    );
  };

  // ----------------------------------------------------
  // SERVICIOS PROFESIONALES (Art. 156 Código Tributario SV - 10% Retención)
  // ----------------------------------------------------
  const createProfessionalService = (
    serviceData: Omit<ProfessionalServiceRecord, 'id' | 'companyId' | 'createdAt'>
  ): ProfessionalServiceRecord => {
    const gross = Number(serviceData.grossAmount) || 0;
    const rate = 0.10;
    const retention = Number((gross * rate).toFixed(2));
    const net = Number((gross - retention).toFixed(2));

    const newRecord: ProfessionalServiceRecord = {
      ...serviceData,
      id: `prof_${Date.now()}`,
      companyId: currentCompany.id,
      grossAmount: gross,
      retentionRate: rate,
      retentionAmount: retention,
      netAmount: net,
      status: serviceData.status || 'pendiente',
      createdAt: new Date().toISOString(),
    };

    setRawProfessionalServices((prev) => [newRecord, ...prev]);
    try {
      setDoc(doc(db, 'professional_services', newRecord.id), newRecord).catch(reportCloudError);
    } catch (e) {}

    addNotification(
      'success',
      'Servicio Profesional Registrado',
      `Honorarios de ${newRecord.providerName} agregados con 10% de retención ISR (${formatCurrencyUSD(retention)}).`
    );
    return newRecord;
  };

  const updateProfessionalService = (id: string, updates: Partial<ProfessionalServiceRecord>) => {
    setRawProfessionalServices((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const updated = { ...s, ...updates };
          if (updates.grossAmount !== undefined) {
            const gross = Number(updates.grossAmount) || 0;
            const rate = updated.retentionRate || 0.10;
            updated.grossAmount = gross;
            updated.retentionAmount = Number((gross * rate).toFixed(2));
            updated.netAmount = Number((gross - updated.retentionAmount).toFixed(2));
          }
          try {
            setDoc(doc(db, 'professional_services', id), updated, { merge: true }).catch(reportCloudError);
          } catch (e) {}
          return updated;
        }
        return s;
      })
    );
    addNotification('info', 'Servicio Actualizado', 'El registro de honorarios fue actualizado.');
  };

  const deleteProfessionalService = (id: string) => {
    setRawProfessionalServices((prev) => prev.filter((s) => s.id !== id));
    try {
      deleteDoc(doc(db, 'professional_services', id)).catch(reportCloudError);
    } catch (e) {}
    addNotification('warning', 'Servicio Eliminado', 'El registro de servicios profesionales fue removido.');
  };

  // ----------------------------------------------------
  // BOLSA DE TRABAJO & BASE DE CURRÍCULUM VITAE (CV)
  // ----------------------------------------------------
  const createCandidateFolder = (folderData: Omit<CandidateFolder, 'id' | 'companyId' | 'createdAt'>): CandidateFolder => {
    const newFolder: CandidateFolder = {
      ...folderData,
      id: `cf_${Date.now()}`,
      companyId: currentCompany.id,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setRawCandidateFolders((prev) => [...prev, newFolder]);
    try {
      setDoc(doc(db, 'candidate_folders', newFolder.id), newFolder).catch(reportCloudError);
    } catch (e) {}
    addNotification('success', 'Carpeta Creada', `Vacante / Carpeta "${newFolder.name}" habilitada.`);
    return newFolder;
  };

  const deleteCandidateFolder = (id: string) => {
    setRawCandidateFolders((prev) => prev.filter((f) => f.id !== id));
    setRawCandidateApplicants((prev) => prev.filter((a) => a.folderId !== id));
    try {
      deleteDoc(doc(db, 'candidate_folders', id)).catch(reportCloudError);
    } catch (e) {}
    addNotification('info', 'Carpeta Eliminada', 'La carpeta de selección y sus candidatos fueron removidos.');
  };

  const createCandidateApplicant = (applicantData: Omit<CandidateApplicant, 'id' | 'companyId' | 'createdAt'>): CandidateApplicant => {
    const newApp: CandidateApplicant = {
      ...applicantData,
      id: `cand_${Date.now()}`,
      companyId: currentCompany.id,
      createdAt: new Date().toISOString(),
    };
    setRawCandidateApplicants((prev) => [newApp, ...prev]);
    try {
      setDoc(doc(db, 'candidates', newApp.id), newApp).catch(reportCloudError);
    } catch (e) {}
    addNotification('success', 'Candidato Registrado', `"${newApp.fullName}" agregado a la vacante ${newApp.folderName}.`);
    return newApp;
  };

  const updateCandidateApplicant = (id: string, updates: Partial<CandidateApplicant>) => {
    setRawCandidateApplicants((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updates } : a))
    );
    try {
      setDoc(doc(db, 'candidates', id), updates, { merge: true }).catch(reportCloudError);
    } catch (e) {}
    addNotification('info', 'Candidato Actualizado', 'Estado y datos de postulación guardados.');
  };

  const deleteCandidateApplicant = (id: string) => {
    setRawCandidateApplicants((prev) => prev.filter((a) => a.id !== id));
    try {
      deleteDoc(doc(db, 'candidates', id)).catch(reportCloudError);
    } catch (e) {}
    addNotification('warning', 'Postulante Eliminado', 'El candidato fue retirado del proceso.');
  };

  const hireCandidateAsEmployee = (applicantId: string, baseSalary?: number, position?: string) => {
    const applicant = rawCandidateApplicants.find((a) => a.id === applicantId);
    if (!applicant) return;

    // Create Employee record
    const [firstName, ...lastParts] = applicant.fullName.split(' ');
    const lastName = lastParts.join(' ') || 'General';

    const newEmp: Employee = {
      id: `emp_${Date.now()}`,
      companyId: currentCompany.id,
      code: `EMP-${(employees.length + 1).toString().padStart(3, '0')}`,
      firstName,
      lastName,
      dui: '00000000-0',
      nit: '0000-000000-000-0',
      isssNumber: '',
      afpNumber: '',
      afpName: 'Crecer',
      position: position || applicant.folderName || 'Colaborador',
      department: 'Operaciones',
      baseSalary: baseSalary || applicant.expectedSalary || 500.0,
      contractType: 'permanente',
      hireDate: new Date().toISOString().split('T')[0],
      bankName: 'Banco Agrícola',
      bankAccountNumber: '',
      isActive: true,
      rating: applicant.rating || 5,
      evaluations: [],
      disciplinaryActions: [],
    };

    setEmployees((prev) => [...prev, newEmp]);
    try {
      setDoc(doc(db, 'employees', newEmp.id), newEmp).catch(reportCloudError);
    } catch (e) {}

    // Mark applicant as seleccionado
    updateCandidateApplicant(applicantId, { status: 'seleccionado' });

    addNotification(
      'success',
      '¡Candidato Contratado!',
      `"${applicant.fullName}" ha sido incorporado a la base de colaboradores con éxito.`
    );
  };

  // ----------------------------------------------------
  // MÓDULO 4: TESORERÍA, BANCOS & FLUJO DE CAJA REAL
  // ----------------------------------------------------
  const createBankAccount = (accountData: Omit<BankAccount, 'id' | 'companyId' | 'currentBalance'>) => {
    const newAcc: BankAccount = {
      ...accountData,
      id: `bank_${Date.now()}`,
      companyId: currentCompany.id,
      currentBalance: accountData.initialBalance,
    };
    setBankAccounts((prev) => [...prev, newAcc]);
    try {
      setDoc(doc(db, 'bank_accounts', newAcc.id), newAcc).catch(reportCloudError);
    } catch (e) {}
    addNotification('success', 'Cuenta Bancaria Registrada', `"${newAcc.accountName}" añadida a tesorería.`);
  };

  const transferFunds = (
    fromAccountId: string,
    toAccountId: string,
    amount: number,
    reference: string,
    description: string
  ) => {
    const fromAcc = bankAccounts.find((b) => b.id === fromAccountId);
    const toAcc = bankAccounts.find((b) => b.id === toAccountId);
    if (!fromAcc || !toAcc) return;

    // Actualizar saldos
    setBankAccounts((prev) =>
      prev.map((b) => {
        if (b.id === fromAccountId) {
          return { ...b, currentBalance: Number((b.currentBalance - amount).toFixed(2)) };
        }
        if (b.id === toAccountId) {
          return { ...b, currentBalance: Number((b.currentBalance + amount).toFixed(2)) };
        }
        return b;
      })
    );

    // Asiento contable
    const entry = createBalancedJournalEntry({
      id: `entry_trf_${Date.now()}`,
      companyId: currentCompany.id,
      entryNumber: journalEntries.length + 1,
      date: new Date().toISOString().split('T')[0],
      concept: `Transferencia interna de fondos: ${fromAcc.accountName} a ${toAcc.accountName}`,
      sourceModule: 'tesoreria',
      referenceDoc: reference,
      lines: [
        {
          accountCode: toAcc.accountingCode,
          accountName: toAcc.accountName,
          debit: amount,
          credit: 0,
          concept: `Ingreso por transferencia desde ${fromAcc.accountName}`,
        },
        {
          accountCode: fromAcc.accountingCode,
          accountName: fromAcc.accountName,
          debit: 0,
          credit: amount,
          concept: `Salida por transferencia hacia ${toAcc.accountName}`,
        },
      ],
    });

    // Movimiento de tesorería
    const tMov: TreasuryMovement = {
      id: `tmov_${Date.now()}`,
      companyId: currentCompany.id,
      bankAccountId: fromAccountId,
      bankAccountName: fromAcc.accountName,
      date: new Date().toISOString().split('T')[0],
      type: 'transferencia_interna',
      amount,
      referenceNumber: reference,
      description: `${description} (${fromAcc.accountName} ➔ ${toAcc.accountName})`,
      isReconciled: true,
      accountingEntryId: entry.id,
    };

    setJournalEntries((prev) => [entry, ...prev]);
    setTreasuryMovements((prev) => [tMov, ...prev]);

    addNotification(
      'success',
      'Transferencia Ejecutada',
      `Traslado de $${amount.toFixed(2)} completado con partida contable automática.`
    );
  };

  const reconcileMovement = (movementId: string) => {
    setTreasuryMovements((prev) =>
      prev.map((m) =>
        m.id === movementId
          ? { ...m, isReconciled: true, reconciliationDate: new Date().toISOString().split('T')[0] }
          : m
      )
    );
    addNotification('info', 'Movimiento Conciliado', 'El movimiento bancario ha sido verificado con el estado de cuenta.');
  };

  const createOtherIncome = (incomeData: Omit<OtherIncome, 'id' | 'companyId' | 'createdAt'>): OtherIncome => {
    const incomeId = `inc_oth_${Date.now()}`;
    const newIncome: OtherIncome = {
      ...incomeData,
      id: incomeId,
      companyId: currentCompany.id,
      createdAt: new Date().toISOString(),
    };

    // 1. Acreditar a la cuenta bancaria o caja
    const targetAccount = bankAccounts.find((b) => b.id === newIncome.targetAccountId);
    if (targetAccount) {
      setBankAccounts((prev) =>
        prev.map((b) =>
          b.id === targetAccount.id
            ? { ...b, currentBalance: Number((b.currentBalance + newIncome.amount).toFixed(2)) }
            : b
        )
      );
    }

    // 2. Generar partida contable automática
    const entry = createBalancedJournalEntry({
      id: `entry_inc_${Date.now()}`,
      companyId: currentCompany.id,
      entryNumber: journalEntries.length + 1,
      date: newIncome.date,
      concept: `Ingreso extraordinario / no operacional: ${newIncome.categoryLabel} - ${newIncome.description}`,
      sourceModule: 'tesoreria',
      referenceDoc: newIncome.referenceNumber || `ING-${Date.now().toString().slice(-4)}`,
      lines: [
        {
          accountCode: targetAccount?.accountingCode || '1101-01',
          accountName: targetAccount?.accountName || 'Caja / Banco',
          debit: newIncome.amount,
          credit: 0,
          concept: `Ingreso a ${targetAccount?.accountName || 'Banco'} por ${newIncome.categoryLabel}`,
        },
        {
          accountCode: '5201-01',
          accountName: 'Otros Ingresos No Operacionales / Remanentes y Ganancias Extraordinarias',
          debit: 0,
          credit: newIncome.amount,
          concept: newIncome.description,
        },
      ],
    });
    newIncome.accountingEntryId = entry.id;

    // 3. Movimiento de tesorería
    const tMovement: TreasuryMovement = {
      id: `tmov_${Date.now()}`,
      companyId: currentCompany.id,
      bankAccountId: newIncome.targetAccountId,
      bankAccountName: targetAccount?.accountName || 'Banco / Caja',
      date: newIncome.date,
      type: 'otro_ingreso',
      amount: newIncome.amount,
      referenceNumber: newIncome.referenceNumber || `ING-${Date.now().toString().slice(-4)}`,
      description: `${newIncome.categoryLabel}: ${newIncome.description}`,
      isReconciled: true,
      accountingEntryId: entry.id,
    };

    setOtherIncomes((prev) => [newIncome, ...prev]);
    setJournalEntries((prev) => [entry, ...prev]);
    setTreasuryMovements((prev) => [tMovement, ...prev]);

    addNotification(
      'success',
      'Ingreso Registrado en Tesorería',
      `Se acreditó $${newIncome.amount.toFixed(2)} (${newIncome.categoryLabel}) a ${targetAccount?.accountName || 'cuenta'}.`
    );

    return newIncome;
  };

  const deleteOtherIncome = (id: string) => {
    const inc = otherIncomes.find((i) => i.id === id);
    if (!inc) return;

    // Revertir banco
    setBankAccounts((prev) =>
      prev.map((b) =>
        b.id === inc.targetAccountId
          ? { ...b, currentBalance: Math.max(0, Number((b.currentBalance - inc.amount).toFixed(2))) }
          : b
      )
    );

    // Revertir asiento contable
    if (inc.accountingEntryId) {
      setJournalEntries((prev) => prev.filter((j) => j.id !== inc.accountingEntryId));
    }

    // Revertir tesorería
    if (inc.accountingEntryId) {
      setTreasuryMovements((prev) => prev.filter((t) => t.accountingEntryId !== inc.accountingEntryId));
    }

    setOtherIncomes((prev) => prev.filter((i) => i.id !== id));
    addNotification('info', 'Ingreso Eliminado', 'Se ha revertido el movimiento de tesorería y la partida contable.');
  };

  // Cálculo del Flujo de Efectivo Real / Ejecutado
  const realCashFlowSummary: RealCashFlowPeriod = useMemo(() => {
    const totalLiquidCurrent = bankAccounts.reduce((acc, b) => acc + b.currentBalance, 0);

    // Ventas al contado cobradas efectivamente
    const inflowsContado = invoices
      .filter((i) => i.status !== 'anulada' && i.paymentCondition === 'contado')
      .reduce((acc, i) => acc + i.totalPagar, 0);

    // Cobros reales de CxC
    const inflowsCxc = customerPayments.reduce((acc, p) => acc + p.amount, 0);
    const inflowsOther = otherIncomes.reduce((acc, o) => acc + o.amount, 0);
    const totalInflows = inflowsContado + inflowsCxc + inflowsOther;

    // Compras al contado pagadas
    const outflowsContado = purchases
      .filter((p) => p.status === 'pagada')
      .reduce((acc, p) => acc + p.totalPagar, 0);

    // Pagos reales de CxP a proveedores
    const outflowsCxp = supplierPayments.reduce((acc, p) => acc + p.amount, 0);

    // Sueldos netos pagados en planillas pagadas
    const outflowsPayrollNet = payrolls
      .filter((p) => p.status === 'pagada')
      .reduce((acc, p) => acc + p.totalLiquido, 0);

    const outflowsPatronal = payrolls
      .filter((p) => p.status === 'pagada')
      .reduce((acc, p) => acc + p.totalIsssPatronal + p.totalAfpPatronal + p.totalInsaforpPatronal, 0);

    // Impuestos F-07 estimados
    const totalIvaDebito = invoices
      .filter((i) => i.status !== 'anulada')
      .reduce((acc, i) => acc + i.iva13, 0);
    const totalIvaCredito = purchases
      .filter((p) => p.status !== 'anulada')
      .reduce((acc, p) => acc + p.ivaCreditoFiscal, 0);
    const ivaToPay = Math.max(0, totalIvaDebito - totalIvaCredito);
    const pagoCuenta = invoices
      .filter((i) => i.status !== 'anulada')
      .reduce((acc, i) => acc + i.sumasGravadas * fiscalConfig.pagoCuentaRate, 0);
    const outflowsTaxesMH = ivaToPay + pagoCuenta;

    const outflowsOperating = 1200; // Servicios y software

    const totalOutflows = outflowsContado + outflowsCxp + outflowsPayrollNet + outflowsPatronal + outflowsTaxesMH + outflowsOperating;
    const netCashFlow = totalInflows - totalOutflows;
    const openingCash = totalLiquidCurrent - netCashFlow;

    return {
      periodLabel: 'Agosto 2026 (Mes Actual)',
      startDate: '2026-08-01',
      endDate: '2026-08-31',
      openingCash: Math.max(0, openingCash),
      inflowsContadoSales: inflowsContado,
      inflowsCxcCollections: inflowsCxc,
      inflowsOther,
      totalInflows,
      outflowsContadoPurchases: outflowsContado,
      outflowsCxpPayments: outflowsCxp,
      outflowsPayrollNet,
      outflowsPayrollTaxesPatronal: outflowsPatronal,
      outflowsTaxesMH,
      outflowsOperating,
      totalOutflows,
      netCashFlow,
      closingCash: totalLiquidCurrent,
    };
  }, [bankAccounts, invoices, customerPayments, otherIncomes, purchases, supplierPayments, payrolls, fiscalConfig]);

  // Proyecciones de Flujo de Caja (90 días)
  const cashFlowProjections: CashFlowProjectionItem[] = useMemo(() => {
    const currentLiquidity = bankAccounts.reduce((acc, b) => acc + b.currentBalance, 0);
    const totalCxc = invoices
      .filter((i) => i.status !== 'pagada' && i.status !== 'anulada')
      .reduce((acc, i) => acc + i.saldoPendiente, 0);
    const totalCxp = purchases
      .filter((p) => p.status !== 'pagada' && p.status !== 'anulada')
      .reduce((acc, p) => acc + p.saldoPendiente, 0);
    const activeMonthlyPayroll = employees
      .filter((e) => e.isActive)
      .reduce((acc, e) => acc + e.baseSalary, 0);

    const periods = [
      { label: 'Sem 1 (1-7 Sep)', days: 7, salesRatio: 0.25, cxcRatio: 0.40, cxpRatio: 0.30, payrollRatio: 0 },
      { label: 'Sem 2 (8-15 Sep)', days: 15, salesRatio: 0.25, cxcRatio: 0.30, cxpRatio: 0.30, payrollRatio: 0.5 },
      { label: 'Sem 3 (16-22 Sep)', days: 22, salesRatio: 0.25, cxcRatio: 0.20, cxpRatio: 0.20, payrollRatio: 0 },
      { label: 'Sem 4 (23-30 Sep)', days: 30, salesRatio: 0.25, cxcRatio: 0.10, cxpRatio: 0.20, payrollRatio: 0.5 },
      { label: 'Octubre 2026', days: 60, salesRatio: 1.1, cxcRatio: 0.8, cxpRatio: 0.8, payrollRatio: 1.0 },
      { label: 'Noviembre 2026', days: 90, salesRatio: 1.25, cxcRatio: 0.9, cxpRatio: 0.9, payrollRatio: 1.0 },
    ];

    let runningBalance = currentLiquidity;
    return periods.map((p) => {
      const opening = runningBalance;
      const cxcIn = totalCxc * p.cxcRatio;
      const salesIn = 2500 * p.salesRatio;
      const inflows = cxcIn + salesIn;

      const cxpOut = totalCxp * p.cxpRatio;
      const payrollOut = activeMonthlyPayroll * p.payrollRatio;
      const taxesOut = 450 * (p.salesRatio || 1);
      const opOut = 300 * (p.salesRatio || 1);
      const outflows = cxpOut + payrollOut + taxesOut + opOut;

      const net = inflows - outflows;
      runningBalance += net;

      return {
        date: new Date(Date.now() + p.days * 86400000).toISOString().split('T')[0],
        periodLabel: p.label,
        openingBalance: opening,
        cxcInflows: cxcIn,
        projectedSalesInflows: salesIn,
        totalInflows: inflows,
        cxpOutflows: cxpOut,
        payrollOutflows: payrollOut,
        taxesOutflows: taxesOut,
        operatingOutflows: opOut,
        totalOutflows: outflows,
        netCashFlow: net,
        closingBalance: runningBalance,
        status: runningBalance > 5000 ? 'saludable' : runningBalance > 0 ? 'alerta' : 'deficit',
      };
    });
  }, [bankAccounts, invoices, purchases, employees]);

  // ----------------------------------------------------
  // MÓDULO 5: MOTOR CONTABLE & CATÁLOGO CONFIGURABLE
  // ----------------------------------------------------
  const createAccountNode = (node: AccountNode) => {
    if (chartOfAccounts.some((a) => a.code === node.code)) {
      addNotification('error', 'Código Duplicado', `La cuenta ${node.code} ya existe.`);
      return;
    }
    setChartOfAccounts((prev) => [...prev, node].sort((a, b) => a.code.localeCompare(b.code)));
    addNotification('success', 'Cuenta Creada', `Cuenta ${node.code} - ${node.name} añadida al catálogo.`);
  };

  const updateAccountNode = (code: string, updates: Partial<AccountNode>) => {
    setChartOfAccounts((prev) =>
      prev.map((a) => (a.code === code ? { ...a, ...updates } : a))
    );
    addNotification('info', 'Cuenta Modificada', `Cuenta ${code} actualizada con éxito.`);
  };

  const deleteAccountNode = (code: string) => {
    const acc = chartOfAccounts.find((a) => a.code === code);
    if (acc?.isSystem) {
      addNotification('error', 'Cuenta Protegida', 'No se puede eliminar una cuenta de control del sistema.');
      return;
    }
    setChartOfAccounts((prev) => prev.filter((a) => a.code !== code));
    addNotification('warning', 'Cuenta Eliminada', `Cuenta ${code} removida del catálogo.`);
  };

  const loadChartTemplate = (templateType: 'simplified' | 'niif_full') => {
    if (templateType === 'simplified') {
      setChartOfAccounts(SIMPLIFIED_STARTUP_CHART_OF_ACCOUNTS);
      addNotification('success', 'Catálogo Simplificado Aplicado', 'Estructura ágil cargada ideal para startups y microempresas.');
    } else {
      setChartOfAccounts(FULL_NIIF_CHART_OF_ACCOUNTS);
      addNotification('success', 'Catálogo NIIF Completo Aplicado', 'Estructura oficial para auditorías y despachos contables.');
    }
  };

  const createManualJournalEntry = (
    entryData: Omit<
      JournalEntry,
      'id' | 'companyId' | 'createdAt' | 'entryNumber' | 'totalDebit' | 'totalCredit' | 'isBalanced'
    >
  ): JournalEntry => {
    const nextEntryNumber = journalEntries.length + 1;
    const entry = createBalancedJournalEntry({
      id: `entry_man_${Date.now()}`,
      companyId: currentCompany.id,
      entryNumber: nextEntryNumber,
      date: entryData.date,
      concept: entryData.concept,
      sourceModule: 'manual',
      referenceDoc: entryData.referenceDoc,
      lines: entryData.lines,
    });

    setJournalEntries((prev) => [entry, ...prev]);
    addNotification('success', 'Partida Contable Asentada', `Partida #${nextEntryNumber} registrada en el Libro Diario.`);
    return entry;
  };

  // ----------------------------------------------------
  // MÓDULO 6: AI DYNAMIC WIDGETS
  // ----------------------------------------------------
  const addDynamicWidget = (widgetData: Omit<DynamicChartWidget, 'id' | 'createdAt'>) => {
    const newWidget: DynamicChartWidget = {
      ...widgetData,
      id: `dw_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setDynamicWidgets((prev) => [newWidget, ...prev]);
    addNotification('success', 'Widget Creado con IA', `Gráfico "${newWidget.title}" anclado al Dashboard.`);
  };

  const updateDynamicWidget = (id: string, updates: Partial<DynamicChartWidget>) => {
    setDynamicWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, ...updates } : w))
    );
  };

  const deleteDynamicWidget = (id: string) => {
    setDynamicWidgets((prev) => prev.filter((w) => w.id !== id));
    addNotification('info', 'Widget Removido', 'Gráfico eliminado del dashboard.');
  };

  // ----------------------------------------------------
  // BACKUP & RESET
  // ----------------------------------------------------
  const resetAllDataToSample = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    localStorage.removeItem(ANCIENT_STORAGE_KEY);
    setCompanies(SAMPLE_COMPANIES);
    setCurrentCompanyId(SAMPLE_COMPANIES[0].id);
    setBranches(SAMPLE_BRANCHES);
    setSelectedBranchId('all');
    setProducts(SAMPLE_PRODUCTS);
    setCustomers(SAMPLE_CUSTOMERS);
    setInvoices(SAMPLE_INVOICES);
    setCustomerPayments([]);
    setSuppliers(SAMPLE_SUPPLIERS);
    setPurchases(SAMPLE_PURCHASES);
    setSupplierPayments([]);
    setKardexMovements(SAMPLE_KARDEX_MOVEMENTS);
    setEmployees(SAMPLE_EMPLOYEES);
    setPayrolls(SAMPLE_PAYROLLS);
    setBankAccounts(SAMPLE_BANK_ACCOUNTS);
    setTreasuryMovements([]);
    setOtherIncomes(SAMPLE_OTHER_INCOMES);
    setChartOfAccounts(DEFAULT_CHART_OF_ACCOUNTS);
    setJournalEntries([]);
    setDynamicWidgets(INITIAL_DYNAMIC_WIDGETS);
    addNotification('info', 'Datos Restaurados', 'Base de datos de demostración restaurada con éxito.');
  };

  const exportDatabaseJSON = (): string => {
    const fullState = {
      exportedAt: new Date().toISOString(),
      app: 'FinaPyme ERP',
      version: '2.1.0',
      companies,
      branches,
      products,
      customers,
      invoices,
      customerPayments,
      suppliers,
      purchases,
      supplierPayments,
      kardexMovements,
      employees,
      payrolls,
      bankAccounts,
      treasuryMovements,
      otherIncomes,
      chartOfAccounts,
      journalEntries,
      dynamicWidgets,
    };
    return JSON.stringify(fullState, null, 2);
  };

  const importDatabaseJSON = (jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.companies) setCompanies(parsed.companies);
      if (parsed.branches) setBranches(parsed.branches);
      if (parsed.products) setProducts(parsed.products);
      if (parsed.customers) setCustomers(parsed.customers);
      if (parsed.invoices) setInvoices(parsed.invoices);
      if (parsed.customerPayments) setCustomerPayments(parsed.customerPayments);
      if (parsed.suppliers) setSuppliers(parsed.suppliers);
      if (parsed.purchases) setPurchases(parsed.purchases);
      if (parsed.supplierPayments) setSupplierPayments(parsed.supplierPayments);
      if (parsed.kardexMovements) setKardexMovements(parsed.kardexMovements);
      if (parsed.employees) setEmployees(parsed.employees);
      if (parsed.payrolls) setPayrolls(parsed.payrolls);
      if (parsed.bankAccounts) setBankAccounts(parsed.bankAccounts);
      if (parsed.treasuryMovements) setTreasuryMovements(parsed.treasuryMovements);
      if (parsed.otherIncomes) setOtherIncomes(parsed.otherIncomes);
      if (parsed.chartOfAccounts) setChartOfAccounts(parsed.chartOfAccounts);
      if (parsed.journalEntries) setJournalEntries(parsed.journalEntries);
      if (parsed.dynamicWidgets) setDynamicWidgets(parsed.dynamicWidgets);

      addNotification('success', 'Respaldo JSON Importado', 'Todos los datos y configuraciones se han cargado correctamente.');
      return true;
    } catch (err: any) {
      addNotification('error', 'Error al Importar', 'El archivo JSON no tiene un formato válido de FinaPyme ERP.');
      return false;
    }
  };

  return (
    <ERPContext.Provider
      value={{
        isAuthenticated,
        login,
        logout,
        companies,
        currentCompany,
        setCurrentCompanyId,
        createCompany,
        updateCompany,
        createCompanyWithAdmin,
        deleteCompany,
        resetCompanyDataToZero,
        clearAllDemoData,
        isSupportMode,
        enterSupportMode,
        exitSupportMode,
        branches,
        selectedBranchId,
        setSelectedBranchId,
        createBranch,
        updateBranch,
        deleteBranch,
        users,
        currentUser,
        setCurrentUserId,
        userRole,
        createUser,
        updateUser,
        deleteUser,
        personalTransactions,
        personalBudgets,
        personalSavingGoals,
        addPersonalTransaction,
        deletePersonalTransaction,
        updatePersonalBudget,
        depositToSavingGoal,
        addPersonalSavingGoal,
        isExhaustiveCustomizationOpen,
        setIsExhaustiveCustomizationOpen,
        isCloudUserManagerOpen,
        setIsCloudUserManagerOpen,
        saveExhaustiveCustomization,
        toggleDteMode,
        updateRegimeConfig,
        isDarkMode,
        setIsDarkMode,
        activeModule,
        setActiveModule,
        fiscalConfig,
        updateFiscalConfig,
        products,
        customers,
        invoices,
        customerPayments,
        createInvoice,
        updateInvoice,
        deleteInvoice,
        cancelInvoice,
        registerCustomerPayment,
        deleteCustomerPayment,
        createCustomer,
        updateCustomer,
        deleteCustomer,
        addCustomerNote,
        createProduct,
        updateProduct,
        deleteProduct,
        suppliers,
        purchases,
        supplierPayments,
        kardexMovements,
        createPurchase,
        updatePurchase,
        deletePurchase,
        registerSupplierPayment,
        deleteSupplierPayment,
        createSupplier,
        updateSupplier,
        deleteSupplier,
        addSupplierNote,
        employees,
        payrolls,
        createEmployee,
        updateEmployee,
        deleteEmployee,
        addEmployeeEvaluation,
        addDisciplinaryAction,
        generatePayrollForPeriod,
        saveCustomPayroll,
        deletePayroll,
        payPayroll,
        professionalServices,
        createProfessionalService,
        updateProfessionalService,
        deleteProfessionalService,
        candidateFolders,
        candidateApplicants,
        createCandidateFolder,
        deleteCandidateFolder,
        createCandidateApplicant,
        updateCandidateApplicant,
        deleteCandidateApplicant,
        hireCandidateAsEmployee,
        bankAccounts,
        treasuryMovements,
        otherIncomes,
        createOtherIncome,
        deleteOtherIncome,
        createBankAccount,
        transferFunds,
        reconcileMovement,
        cashFlowProjections,
        realCashFlowSummary,
        chartOfAccounts,
        createAccountNode,
        updateAccountNode,
        deleteAccountNode,
        loadChartTemplate,
        journalEntries,
        createManualJournalEntry,
        dynamicWidgets,
        addDynamicWidget,
        updateDynamicWidget,
        deleteDynamicWidget,
        notifications,
        addNotification,
        removeNotification,
        resetAllDataToSample,
        exportDatabaseJSON,
        importDatabaseJSON,
      }}
    >
      {children}
    </ERPContext.Provider>
  );
};

export const useERP = (): ERPContextType => {
  const context = useContext(ERPContext);
  if (!context) {
    throw new Error('useERP must be used within an ERPProvider');
  }
  return context;
};