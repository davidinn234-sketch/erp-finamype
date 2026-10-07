import { useAuthSession } from './AuthSession';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { accountRequest } from '../lib/api';
import { auth } from '../lib/firebase';
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
  AttendanceRecord,
  EmployeeLeaveRequest,
  CompanyAttendanceConfig,
  PurchaseStatus,
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
  DEFAULT_ATTENDANCE_CONFIG,
  SAMPLE_ATTENDANCE_RECORDS,
  SAMPLE_LEAVE_REQUESTS,
  getSamplePersonalFinancesData,
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
import { doc, setDoc, getDoc, getDocs, collection, deleteDoc, onSnapshot, query, where, documentId } from 'firebase/firestore';

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
  createUser: (user: Omit<UserProfile, 'id'>) => Promise<void>;
  updateUser: (id: string, updates: Partial<UserProfile>) => Promise<void>;
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
  resetPersonalFinancesToSampleData: () => void;

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
  generatePayrollForPeriod: (
    periodType: 'quincenal' | 'mensual',
    month: number,
    year: number,
    branchId?: string,
    periodNumber?: number
  ) => Payroll;
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

  // Control de Asistencia & Horarios (Tablet Kiosk PIN)
  attendanceRecords: AttendanceRecord[];
  leaveRequests: EmployeeLeaveRequest[];
  attendanceConfig: CompanyAttendanceConfig;
  recordAttendanceCheck: (
    employeeId: string,
    type: 'check_in' | 'lunch_start' | 'lunch_end' | 'check_out',
    method?: 'pin_tablet' | 'manual_admin',
    timeStr?: string,
    dateStr?: string
  ) => { status: 'success' | 'warning' | 'error'; message: string; record?: AttendanceRecord; timeStr: string };
  updateAttendanceConfig: (config: Partial<CompanyAttendanceConfig>) => void;
  createLeaveRequest: (req: Omit<EmployeeLeaveRequest, 'id' | 'companyId' | 'createdAt'>) => EmployeeLeaveRequest;
  updateLeaveRequestStatus: (id: string, status: 'aprobado' | 'rechazado' | 'pendiente') => void;
  
  // Módulo 4: Tesorería, Bancos & Flujo de Caja Real / Proyectado
  bankAccounts: BankAccount[];
  treasuryMovements: TreasuryMovement[];
  otherIncomes: OtherIncome[];
  createOtherIncome: (income: Omit<OtherIncome, 'id' | 'companyId' | 'createdAt'>) => OtherIncome;
  deleteOtherIncome: (id: string) => void;
  createBankAccount: (account: Omit<BankAccount, 'id' | 'companyId' | 'currentBalance'>) => void;
  transferFunds: (fromAccountId: string, toAccountId: string, amount: number, reference: string, description: string) => void;
  reconcileMovement: (movementId: string) => void;
  deleteTreasuryMovement: (id: string) => void;
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

function scopedCollection(name: string, profile: UserProfile) {
  const ref = collection(db, name);
  if (name === 'personal_finances') return query(ref, where('userId', '==', profile.id));
  if (profile.role === 'admin_maestro') return query(ref);
  if (name === 'users' && profile.role !== 'gerente') return query(ref, where('id', '==', profile.id));
  return query(ref, where(name === 'companies' ? documentId() : 'companyId', '==', profile.companyId || '__no_company__'));
}

// Espejo bidireccional lista local <-> colección de Firestore, para datos que se
// modifican en muchos lugares (kardex, tesorería, otros ingresos) sin tocar cada función.
function useCloudMirror<T extends { id: string }>(
  name: string,
  items: T[],
  setItems: React.Dispatch<React.SetStateAction<T[]>>,
  skipIds: Set<string>,
  onError: (e: any) => void,
  profile: UserProfile | null
) {
  const known = React.useRef<Map<string, string>>(new Map());
  const [hydrated, setHydrated] = React.useState(false);

  useEffect(() => {
    if (!profile || (profile.role !== 'admin_maestro' && !profile.companyId)) return;
    const unsub = onSnapshot(
      scopedCollection(name, profile),
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
  }, [name, profile?.id, profile?.companyId, profile?.role]);

  useEffect(() => {
    if (!hydrated || !profile) return;
    const current = new Set(items.map((i) => i.id));
    items.forEach((it) => {
      if (skipIds.has(it.id)) return;
      const sig = stableStringify(it);
      if (known.current.get(it.id) !== sig) {
        known.current.set(it.id, sig);
        setDoc(doc(db, name, it.id), it as any).catch(onError);
      }
    });
    Array.from(known.current.keys()).forEach((id: string) => {
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

export const cleanDepartmentStr = (val: any): string => {
  if (!val) return 'San Salvador';
  if (typeof val === 'string') return val;
  if (typeof val === 'object' && val.name && typeof val.name === 'string') return val.name;
  return 'San Salvador';
};

export const sanitizeCompany = (c: any): Company => ({
  ...c,
  department: cleanDepartmentStr(c?.department),
  municipality: typeof c?.municipality === 'string' ? c.municipality : '',
});

export const sanitizeBranch = (b: any): Branch => ({
  ...b,
  department: cleanDepartmentStr(b?.department),
  municipality: typeof b?.municipality === 'string' ? b.municipality : '',
});

export const ensureEmployeesHavePins = (list: Employee[]): Employee[] => {
  if (!Array.isArray(list)) return [];
  const usedPins = new Set<string>();

  // Pass 1: gather all pre-assigned valid 4-digit numeric pins
  list.forEach((e) => {
    const clean = e.pinCode ? String(e.pinCode).replace(/\D/g, '').slice(0, 4) : '';
    if (clean.length === 4 && !usedPins.has(clean)) {
      usedPins.add(clean);
    }
  });

  // Pass 2: assign unique pins to any employee without a valid 4-digit PIN
  return list.map((e, idx) => {
    let pin = e.pinCode ? String(e.pinCode).replace(/\D/g, '').slice(0, 4) : '';
    if (pin.length !== 4) {
      for (let n = 1001; n <= 9999; n++) {
        const candidate = String(n);
        if (!usedPins.has(candidate)) {
          pin = candidate;
          usedPins.add(pin);
          break;
        }
      }
    }
    return {
      ...e,
      pinCode: pin || `10${(idx + 1).toString().padStart(2, '0')}`,
      isActive: e.isActive !== false,
      department: cleanDepartmentStr(e.department),
    };
  });
};

export const ERPProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { profile: sessionProfile } = useAuthSession();
  const isAuthenticated = !!sessionProfile;
  // Multitenancy & Auth State
  const [companies, setCompanies] = useState<Company[]>([]);

  const [currentCompanyId, setCurrentCompanyId] = useState<string>(sessionProfile?.companyId || '');

  const [rawBranches, setRawBranches] = useState<Branch[]>([]);

  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');

  const [users, setUsers] = useState<UserProfile[]>(sessionProfile ? [sessionProfile] : []);

  const currentUserId = sessionProfile?.id || '';
  const setCurrentUserId = (_id: string) => { throw new Error('Cierra sesión para cambiar de usuario.'); };

  // Auth Login State (Protected App Gate)

  // Personal Finances State


  const [personalTransactions, setPersonalTransactions] = useState<PersonalTransaction[]>([]);

  const [personalBudgets, setPersonalBudgets] = useState<PersonalBudgetCategory[]>([]);

  const [personalSavingGoals, setPersonalSavingGoals] = useState<PersonalSavingGoal[]>([]);

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

  const [activeModule, setActiveModule] = useState<string>(sessionProfile?.role === 'admin_maestro' ? 'admin_profiles' : sessionProfile?.role === 'cajero' ? 'pos_terminal' : 'dashboard');

  // Módulo 1: CRM & Ventas
  const [rawProducts, setRawProducts] = useState<Product[]>([]);

  const [rawCustomers, setRawCustomers] = useState<Customer[]>([]);

  const [rawInvoices, setRawInvoices] = useState<Invoice[]>([]);

  const [customerPayments, setCustomerPayments] = useState<CustomerPayment[]>([]);

  // Módulo 2: CRM Proveedores & Compras
  const [rawSuppliers, setRawSuppliers] = useState<Supplier[]>([]);

  const [rawPurchases, setRawPurchases] = useState<Purchase[]>([]);

  const [supplierPayments, setSupplierPayments] = useState<SupplierPayment[]>([]);

  const [rawKardexMovements, setRawKardexMovements] = useState<KardexMovement[]>([]);

  // Módulo 3: RRHH & Planilla
  const [rawEmployees, setRawEmployees] = useState<Employee[]>([]);

  const [rawPayrolls, setRawPayrolls] = useState<Payroll[]>([]);

  // Servicios Profesionales (Art. 156 Código Tributario SV)
  const [rawProfessionalServices, setRawProfessionalServices] = useState<ProfessionalServiceRecord[]>([]);

  // Bolsa de Trabajo & Base de Currículum Vitae (CV)
  const [rawCandidateFolders, setRawCandidateFolders] = useState<CandidateFolder[]>([]);

  const [rawCandidateApplicants, setRawCandidateApplicants] = useState<CandidateApplicant[]>([]);

  // Control de Asistencia & Horarios (Tablet Kiosk PIN)
  const [rawAttendanceConfig, setRawAttendanceConfig] = useState<CompanyAttendanceConfig>(DEFAULT_ATTENDANCE_CONFIG);

  const [rawAttendanceRecords, setRawAttendanceRecords] = useState<AttendanceRecord[]>([]);

  const [rawLeaveRequests, setRawLeaveRequests] = useState<EmployeeLeaveRequest[]>([]);

  // Módulo 4: Tesorería & Bancos
  const [rawBankAccounts, setRawBankAccounts] = useState<BankAccount[]>([]);

  const [rawTreasuryMovements, setRawTreasuryMovements] = useState<TreasuryMovement[]>([]);

  const [rawOtherIncomes, setRawOtherIncomes] = useState<OtherIncome[]>([]);

  // Módulo 5: Motor Contable
  const [chartOfAccounts, setChartOfAccounts] = useState<AccountNode[]>(DEFAULT_CHART_OF_ACCOUNTS);

  const [rawJournalEntries, setRawJournalEntries] = useState<JournalEntry[]>([]);

  // Módulo 6: AI Dynamic Widgets
  const [rawDynamicWidgets, setDynamicWidgets] = useState<DynamicChartWidget[]>([]);

  // Notifications
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);

  // Selected current Company & User
  const currentCompany = useMemo(() => {
    return companies.find((c) => c.id === currentCompanyId) || companies[0] || { ...SAMPLE_COMPANIES[0], id: '', name: '', tradeName: '' };
  }, [companies, currentCompanyId]);

  const dynamicWidgets = useMemo(() => rawDynamicWidgets.filter((w) => w.companyId === currentCompany.id), [rawDynamicWidgets, currentCompany.id]);

  const currentUser: UserProfile = sessionProfile || { id: '', name: '', email: '', role: 'vendedor', systemArchetype: 'finanzas_personales' };
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
  const attendanceRecords = useMemo(
    () => rawAttendanceRecords.filter((r) => r.companyId === currentCompany.id),
    [rawAttendanceRecords, currentCompany.id]
  );
  const leaveRequests = useMemo(
    () => rawLeaveRequests.filter((l) => l.companyId === currentCompany.id),
    [rawLeaveRequests, currentCompany.id]
  );
  const attendanceConfig = rawAttendanceConfig;

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
    if (sessionProfile?.role !== 'admin_maestro') return;
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

    const newUser = {
      ...adminData, email: adminData.email.trim().toLowerCase(), role: 'gerente',
      systemArchetype: newComp.systemArchetype || 'emprendedor_control_interno', isConfigured: false,
    };

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

    const result = await saveAccount({ user: newUser, company: newComp, branch: initialBranch });
    setCompanies((prev) => [...prev, result.company]);
    setUsers((prev) => [...prev, result.user]);
    setBranches((prev) => [...prev, result.branch]);
    addNotification('success', 'Empresa Registrada', `"${result.company.name}" creada en cero.`);
    return { company: result.company, user: result.user };

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
  useCloudMirror<KardexMovement>('kardex_movements', rawKardexMovements, setRawKardexMovements, new Set(SAMPLE_KARDEX_MOVEMENTS.map((k) => k.id)), reportCloudError, sessionProfile);
  useCloudMirror<TreasuryMovement>('treasury_movements', rawTreasuryMovements, setRawTreasuryMovements, new Set<string>(), reportCloudError, sessionProfile);
  useCloudMirror<OtherIncome>('other_incomes', rawOtherIncomes, setRawOtherIncomes, new Set(SAMPLE_OTHER_INCOMES.map((o) => o.id)), reportCloudError, sessionProfile);

  useCloudMirror<JournalEntry>('journal_entries', rawJournalEntries, setRawJournalEntries, new Set<string>(), reportCloudError, sessionProfile);
  useCloudMirror<BankAccount>('bank_accounts', rawBankAccounts, setRawBankAccounts, new Set<string>(), reportCloudError, sessionProfile);

  useCloudMirror<DynamicChartWidget>('dynamic_widgets', rawDynamicWidgets, setDynamicWidgets, new Set<string>(), reportCloudError, sessionProfile);

  // Retain unsynced legacy business data for export, but remove old plaintext credentials.
  // This cache is never loaded into an authenticated session.
  useEffect(() => {
    localStorage.removeItem('sivarflow_auth_user');
    for (const key of [STORAGE_KEY, LEGACY_STORAGE_KEY, ANCIENT_STORAGE_KEY]) {
      try {
        const cached = JSON.parse(localStorage.getItem(key) || 'null');
        if (cached?.users) {
          cached.users = cached.users.map(({ password, ...profile }: any) => profile);
          localStorage.setItem(key, JSON.stringify(cached));
        }
      } catch { /* Leave unreadable legacy data intact for manual recovery. */ }
    }
  }, []);

  // Company management
  const createCompany = (companyData: Omit<Company, 'id'>) => {
    const sanitized = sanitizeCompany(companyData as any);
    const newComp: Company = {
      ...sanitized,
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
    const sanitizedUpdates = { ...updates };
    if (sanitizedUpdates.department !== undefined) {
      sanitizedUpdates.department = cleanDepartmentStr(sanitizedUpdates.department);
    }
    setCompanies((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...sanitizedUpdates } : c))
    );
    try {
      setDoc(doc(db, 'companies', id), sanitizedUpdates, { merge: true }).catch(reportCloudError);
    } catch (e) {}
  };

  const [settingsCompanyId, setSettingsCompanyId] = useState('');
  const settingsSignature = React.useRef('');
  useEffect(() => {
    if (!sessionProfile || !currentCompany.id) return;
    let active = true;
    const companyId = currentCompany.id;
    const stop = onSnapshot(doc(db, 'company_settings', companyId), (snapshot) => {
      if (!active) return;
      const accounts = snapshot.data()?.chartOfAccounts || DEFAULT_CHART_OF_ACCOUNTS;
      settingsSignature.current = stableStringify(accounts);
      setChartOfAccounts(accounts);
      setSettingsCompanyId(companyId);
    }, reportCloudError);
    return () => { active = false; stop(); };
  }, [sessionProfile?.id, currentCompany.id]);
  useEffect(() => {
    if (!sessionProfile || !currentCompany.id || settingsCompanyId !== currentCompany.id ||
        !['admin_maestro', 'gerente', 'contador'].includes(currentUser.role)) return;
    const signature = stableStringify(chartOfAccounts);
    if (signature === settingsSignature.current) return;
    const timer = setTimeout(() => {
      void setDoc(doc(db, 'company_settings', currentCompany.id), {
        id: currentCompany.id, companyId: currentCompany.id, chartOfAccounts,
      }).catch(reportCloudError);
    }, 500);
    return () => clearTimeout(timer);
  }, [chartOfAccounts, settingsCompanyId, currentCompany.id, sessionProfile?.id]);

  const [personalMetaReady, setPersonalMetaReady] = useState(false);
  const personalMetaSignature = React.useRef('');
  useEffect(() => {
    if (!sessionProfile) return;
    let active = true;
    const sync = (name: string, setter: React.Dispatch<any>) => onSnapshot(
      scopedCollection(name, sessionProfile),
      (snap) => { if (active) setter(snap.docs.map((d) => {
        const { password, ...data } = d.data();
        return name === 'companies' ? sanitizeCompany(data) : name === 'branches' ? sanitizeBranch(data) : data;
      })); }, reportCloudError);
    const stops = [sync('users', setUsers), sync('personal_finances', setPersonalTransactions)];
    if (sessionProfile.role === 'admin_maestro' || sessionProfile.companyId) {
      for (const [name, setter] of [
        ['companies', setCompanies], ['products', setRawProducts], ['customers', setRawCustomers],
        ['invoices', setRawInvoices], ['suppliers', setRawSuppliers], ['purchases', setRawPurchases],
        ['customer_payments', setCustomerPayments], ['supplier_payments', setSupplierPayments],
        ['employees', setRawEmployees], ['payrolls', setRawPayrolls],
        ['professional_services', setRawProfessionalServices], ['candidate_folders', setRawCandidateFolders],
        ['candidates', setRawCandidateApplicants], ['branches', setRawBranches],
        ['attendance', setRawAttendanceRecords], ['leave_requests', setRawLeaveRequests],
      ] as [string, React.Dispatch<any>][]) stops.push(sync(name, setter));
    }
    stops.push(onSnapshot(doc(db, 'personal_finance_meta', sessionProfile.id), (snap) => {
      if (!active) return;
      const data = snap.data();
      personalMetaSignature.current = stableStringify({ personalBudgets: data?.personalBudgets || [], personalSavingGoals: data?.personalSavingGoals || [] });
      setPersonalBudgets(data?.personalBudgets || []);
      setPersonalSavingGoals(data?.personalSavingGoals || []);
      setPersonalMetaReady(true);
    }, reportCloudError));
    return () => { active = false; stops.forEach((stop) => stop()); };
  }, [sessionProfile?.id]);

  useEffect(() => {
    if (!sessionProfile || !personalMetaReady) return;
    const signature = stableStringify({ personalBudgets, personalSavingGoals });
    if (signature === personalMetaSignature.current) return;
    const timer = setTimeout(() => {
      void setDoc(doc(db, 'personal_finance_meta', sessionProfile.id), {
        personalBudgets, personalSavingGoals, updatedAt: new Date().toISOString(),
      }).catch(reportCloudError);
    }, 500);
    return () => clearTimeout(timer);
  }, [personalBudgets, personalSavingGoals, personalMetaReady, sessionProfile?.id]);

  async function saveAccount(body: unknown) {
    if (sessionProfile) return accountRequest('/api/accounts', body);
    const response = await fetch('/api/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'No se pudo crear la cuenta.');
    return data;
  }

  const createUser = async (user: Omit<UserProfile, 'id'> & { id?: string }) => {
    const result = await saveAccount({ user });
    setUsers((prev) => [...prev, result.user]);
    addNotification('success', 'Cuenta creada', 'El usuario ya puede iniciar sesión.');
  };

  const updateUser = async (id: string, updates: Partial<UserProfile>) => {
    if (id === currentUser.id && currentUser.role !== 'admin_maestro' && (!currentUser.companyId || currentUser.role !== 'gerente')) {
      // Only cosmetic/onboarding fields are allowed by Firestore for self-service.
      const { name, avatar, phone, address, department, municipality, isConfigured } = updates;
      const safe = { name, avatar, phone, address, department, municipality, isConfigured };
      await setDoc(doc(db, 'users', id), safe, { merge: true });
    } else {
      const result = await accountRequest(`/api/accounts/${encodeURIComponent(id)}`, updates, 'PATCH');
      setUsers((prev) => prev.map((u) => u.id === id ? result.user : u));
    }
    addNotification('success', 'Cuenta actualizada', 'Los cambios se guardaron.');
  };

  const deleteUser = async (id: string) => {
    try {
      await accountRequest(`/api/accounts/${encodeURIComponent(id)}`, undefined, 'DELETE');
      setUsers((prev) => prev.filter((u) => u.id !== id));
      addNotification('success', 'Acceso revocado', 'La cuenta fue deshabilitada.');
    } catch (error) {
      addNotification('error', 'No se revocó el acceso', error instanceof Error ? error.message : 'Intenta nuevamente.');
      throw error;
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { user } = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      const profile = await getDoc(doc(db, 'users', user.uid));
      if (!profile.exists() || profile.data().disabled === true) {
        await signOut(auth);
        return { success: false, error: 'Solicita al administrador que habilite tu cuenta en el ERP.' };
      }
      return { success: true };
    } catch {
      return { success: false, error: 'No se pudo iniciar sesión. Verifica tus credenciales y la conexión.' };
    }
  };

  const logout = () => { void signOut(auth); };

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

  const resetPersonalFinancesToSampleData = () => {
    addNotification('warning', 'Datos reales protegidos', 'Usa un proyecto de pruebas para cargar datos de demostración.');
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
    const sanitized = sanitizeBranch(branchData as any);
    const newBranch: Branch = {
      ...sanitized,
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
    const sanitizedUpdates = { ...updates };
    if (sanitizedUpdates.department !== undefined) {
      sanitizedUpdates.department = cleanDepartmentStr(sanitizedUpdates.department);
    }
    setBranches((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...sanitizedUpdates } : b))
    );
    try {
      setDoc(doc(db, 'branches', id), sanitizedUpdates, { merge: true }).catch(reportCloudError);
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
          const restoredStatus: PurchaseStatus = restoredSaldo >= pur.totalPagar ? 'registrada' : 'parcial';
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

    let assignedPin = employeeData.pinCode ? String(employeeData.pinCode).replace(/\D/g, '').slice(0, 4) : '';
    if (assignedPin.length !== 4) {
      const usedPins = new Set(rawEmployees.map((e) => e.pinCode?.trim()).filter(Boolean));
      for (let n = 1001; n <= 9999; n++) {
        const candidate = String(n);
        if (!usedPins.has(candidate)) {
          assignedPin = candidate;
          break;
        }
      }
    }

    const newEmp: Employee = {
      ...employeeData,
      pinCode: assignedPin || '1001',
      isActive: employeeData.isActive !== false,
      department: cleanDepartmentStr(employeeData.department),
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
    addNotification('success', 'Colaborador Registrado', `"${newEmp.firstName} ${newEmp.lastName}" ingresado con PIN ${newEmp.pinCode}.`);
  };

  const updateEmployee = (id: string, updates: Partial<Employee>) => {
    const sanitizedUpdates = { ...updates };
    if (sanitizedUpdates.department !== undefined) {
      sanitizedUpdates.department = cleanDepartmentStr(sanitizedUpdates.department);
    }
    if (sanitizedUpdates.pinCode) {
      sanitizedUpdates.pinCode = String(sanitizedUpdates.pinCode).replace(/\D/g, '').slice(0, 4);
    }
    setEmployees((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...sanitizedUpdates } : e))
    );
    try {
      setDoc(doc(db, 'employees', id), sanitizedUpdates, { merge: true }).catch(reportCloudError);
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
    branchId?: string,
    periodNumber?: number
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

    const finalPeriodNumber = periodNumber || 1;
    const isSecondFortnight = periodType === 'quincenal' && finalPeriodNumber === 2;
    const startDay = isSecondFortnight ? '16' : '01';
    const lastDayOfMonth = new Date(year, month, 0).getDate();
    const endDay = periodType === 'quincenal' ? (isSecondFortnight ? String(lastDayOfMonth) : '15') : String(lastDayOfMonth);
    const startDateStr = `${year}-${month.toString().padStart(2, '0')}-${startDay}`;
    const endDateStr = `${year}-${month.toString().padStart(2, '0')}-${endDay}`;
    const isCompanyOver10 = targetEmployees.length >= fiscalConfig.insaforpMinEmployees;

    const details = targetEmployees.map((emp) => {
      const baseSalaryPeriod = periodType === 'quincenal' ? emp.baseSalary / 2 : emp.baseSalary;
      const calc = calculateEmployeePayroll({
        baseSalary: baseSalaryPeriod,
        period: periodType,
        isCompanyOver10Employees: isCompanyOver10,
        config: fiscalConfig,
      });

      // Connect attendance records to employee payroll
      const empAttendance = attendanceRecords.filter((att) => {
        if (att.employeeId !== emp.id) return false;
        return att.date >= startDateStr && att.date <= endDateStr;
      });

      const lateRecords = empAttendance.filter(
        (att) => att.status === 'tardanza' || (att.minutesLate && att.minutesLate > (att.toleranceApplied || 10))
      );
      const attendanceLateDays = lateRecords.length;
      const attendanceTotalLateMinutes = lateRecords.reduce((acc, r) => acc + (r.minutesLate || 0), 0);
      const attendancePresentDays = empAttendance.filter((att) => att.checkInTime).length;

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
        attendanceLateDays,
        attendanceTotalLateMinutes,
        attendancePresentDays,
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
      periodNumber: finalPeriodNumber,
      periodType,
      year,
      month,
      startDate: `${year}-${month.toString().padStart(2, '0')}-${startDay}`,
      endDate: `${year}-${month.toString().padStart(2, '0')}-${endDay}`,
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
  // CONTROL DE ASISTENCIA & HORARIOS (TABLET KIOSK PIN)
  // ----------------------------------------------------
  const updateAttendanceConfig = (configUpdates: Partial<CompanyAttendanceConfig>) => {
    setRawAttendanceConfig((prev) => {
      const updated = { ...prev, ...configUpdates };
      try {
        setDoc(doc(db, 'companies', currentCompany.id), { attendanceConfig: updated }, { merge: true }).catch(reportCloudError);
      } catch (e) {}
      return updated;
    });
  };

  const recordAttendanceCheck = (
    employeeId: string,
    type: 'check_in' | 'lunch_start' | 'lunch_end' | 'check_out',
    method: 'pin_tablet' | 'manual_admin' = 'pin_tablet',
    customTimeStr?: string,
    customDateStr?: string
  ): { status: 'success' | 'warning' | 'error'; message: string; record?: AttendanceRecord; timeStr: string } => {
    const emp = rawEmployees.find((e) => e.id === employeeId);
    if (!emp) {
      return { status: 'error', message: 'Colaborador no encontrado.', timeStr: '' };
    }

    const todayDate = customDateStr || new Date().toISOString().split('T')[0];
    const now = new Date();
    const timeStr = customTimeStr || now.toLocaleTimeString('es-SV', { hour12: false });

    const existingIndex = rawAttendanceRecords.findIndex(
      (r) => r.employeeId === employeeId && r.date === todayDate
    );

    const schedStart = emp.workSchedule?.startTime || attendanceConfig.defaultStartTime || '08:00';
    const schedEnd = emp.workSchedule?.endTime || attendanceConfig.defaultEndTime || '17:00';
    const tolerance = emp.workSchedule?.toleranceMinutes || attendanceConfig.toleranceMinutes || 10;

    let targetRecord: AttendanceRecord;

    if (existingIndex >= 0) {
      targetRecord = { ...rawAttendanceRecords[existingIndex] };
    } else {
      targetRecord = {
        id: `att_${Date.now()}`,
        companyId: currentCompany.id,
        employeeId: emp.id,
        employeeCode: emp.code,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        date: todayDate,
        scheduledStartTime: schedStart,
        scheduledEndTime: schedEnd,
        toleranceApplied: tolerance,
        status: 'a_tiempo',
        minutesLate: 0,
        method,
      };
    }

    if (type === 'check_in') {
      targetRecord.checkInTime = timeStr;
      const [nowHours, nowMins] = timeStr.split(':').map((v) => parseInt(v, 10) || 0);
      const [schedHours, schedMins] = schedStart.split(':').map((v) => parseInt(v, 10) || 0);
      const totalNowMins = nowHours * 60 + nowMins;
      const totalSchedMins = schedHours * 60 + schedMins;

      const diff = totalNowMins - totalSchedMins;
      if (diff > tolerance) {
        targetRecord.status = 'tardanza';
        targetRecord.minutesLate = diff - tolerance;
      } else {
        targetRecord.status = 'a_tiempo';
        targetRecord.minutesLate = 0;
      }
    } else if (type === 'lunch_start') {
      targetRecord.lunchStartTime = timeStr;
    } else if (type === 'lunch_end') {
      targetRecord.lunchEndTime = timeStr;
    } else if (type === 'check_out') {
      targetRecord.checkOutTime = timeStr;
    }

    setRawAttendanceRecords((prev) => {
      if (existingIndex >= 0) {
        const copy = [...prev];
        copy[existingIndex] = targetRecord;
        return copy;
      }
      return [targetRecord, ...prev];
    });

    try {
      setDoc(doc(db, 'attendance', targetRecord.id), targetRecord).catch(reportCloudError);
    } catch (e) {}

    return {
      status: targetRecord.status === 'tardanza' ? 'warning' : 'success',
      message: 'Marcaje procesado.',
      record: targetRecord,
      timeStr,
    };
  };

  const createLeaveRequest = (req: Omit<EmployeeLeaveRequest, 'id' | 'companyId' | 'createdAt'>): EmployeeLeaveRequest => {
    const newLeave: EmployeeLeaveRequest = {
      ...req,
      id: `leave_${Date.now()}`,
      companyId: currentCompany.id,
      createdAt: new Date().toISOString(),
    };
    setRawLeaveRequests((prev) => [newLeave, ...prev]);
    try {
      setDoc(doc(db, 'leave_requests', newLeave.id), newLeave).catch(reportCloudError);
    } catch (e) {}
    return newLeave;
  };

  const updateLeaveRequestStatus = (id: string, status: 'aprobado' | 'rechazado' | 'pendiente') => {
    setRawLeaveRequests((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status, approvedAt: new Date().toISOString() } : l))
    );
    try {
      setDoc(doc(db, 'leave_requests', id), { status, approvedAt: new Date().toISOString() }, { merge: true }).catch(reportCloudError);
    } catch (e) {}
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

  const deleteTreasuryMovement = (movementId: string) => {
    const mov = treasuryMovements.find((m) => m.id === movementId);
    if (!mov) return;

    // Revert bank balance
    const isIncome = ['ingreso_venta', 'abono_cxc', 'otro_ingreso'].includes(mov.type);
    setBankAccounts((prev) =>
      prev.map((b) => {
        if (b.id === mov.bankAccountId) {
          const newBal = isIncome
            ? Number((b.currentBalance - mov.amount).toFixed(2))
            : Number((b.currentBalance + mov.amount).toFixed(2));
          try {
            setDoc(doc(db, 'bank_accounts', b.id), { currentBalance: newBal }, { merge: true }).catch(reportCloudError);
          } catch (e) {}
          return { ...b, currentBalance: newBal };
        }
        return b;
      })
    );

    // Remove journal entry if linked
    if (mov.accountingEntryId) {
      setJournalEntries((prev) => prev.filter((j) => j.id !== mov.accountingEntryId));
    }

    setTreasuryMovements((prev) => prev.filter((m) => m.id !== movementId));
    try {
      deleteDoc(doc(db, 'treasury_movements', movementId)).catch(reportCloudError);
    } catch (e) {}

    addNotification('info', 'Movimiento Revertido', `Movimiento #${mov.referenceNumber} eliminado y saldo bancario restaurado.`);
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
      companyId: currentCompany.id,
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
    addNotification('warning', 'Datos reales protegidos', 'Los datos de demostración solo deben cargarse en un proyecto de pruebas separado.');
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
        resetPersonalFinancesToSampleData,
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
        attendanceRecords,
        leaveRequests,
        attendanceConfig,
        recordAttendanceCheck,
        updateAttendanceConfig,
        createLeaveRequest,
        updateLeaveRequestStatus,
        bankAccounts,
        treasuryMovements,
        otherIncomes,
        createOtherIncome,
        deleteOtherIncome,
        createBankAccount,
        transferFunds,
        reconcileMovement,
        deleteTreasuryMovement,
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