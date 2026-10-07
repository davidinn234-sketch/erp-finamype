import { buildAccountingReports, money } from '../lib/accountingReports';
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
import { auth, db, testFirebaseConnection } from '../lib/firebase';
import { doc, setDoc, getDoc, getDocs, collection, deleteDoc, onSnapshot, query, where, writeBatch } from 'firebase/firestore';
import { emptyChart, ensureEngineAccounts } from '../lib/chartDefaults';
import { recordPayment, moveFunds, settlePayroll, reversePayment } from '../lib/financialOperations';
import { signOut } from 'firebase/auth';
import { useAuthSession } from '../lib/useAuthSession';
import { provisionAccount, loginAccount, authErrorMessage, resetAccountPassword } from '../lib/authService';
import { useTenantCollection } from '../lib/useTenantCollection';
import { canReadCompanyCollection, assertTenantRecords, validatePayment, COMPANY_COLLECTIONS } from '../lib/tenantPolicy';

interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
}

interface ERPContextType {
  // Multitenancy & Auth & Sucursales
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  authError?: string;
  resetPassword: (email: string) => Promise<void>;
  registerPersonalAccount: (data: Omit<UserProfile, 'id'>) => Promise<void>;
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
  createUser: (user: Omit<UserProfile, 'id'>) => Promise<UserProfile>;
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
  const session = useAuthSession();
  return <ERPStateProvider key={session.profile?.id || 'guest'} session={session}>{children}</ERPStateProvider>;
};

const ERPStateProvider: React.FC<{ children: ReactNode; session: ReturnType<typeof useAuthSession> }> = ({ children, session }) => {
  // Data is memory-only and this provider remounts when the authenticated UID changes.
  // Legacy localStorage is deliberately never loaded into a new identity.
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);
  const reportCloudError = (error: unknown) => {
    const id = crypto.randomUUID();
    setNotifications(prev => [...prev, { id, type: 'error', title: 'No se pudo guardar o cargar', message: authErrorMessage(error) }]);
    setTimeout(() => setNotifications(prev => prev.filter(item => item.id !== id)), 8000);
  };
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<UserProfile[]>(session.profile ? [session.profile] : []);
  const currentUser = session.profile || { id: '', name: '', email: '', role: 'gerente' as UserRole };
  const currentUserId = currentUser.id;
  const isAuthenticated = !!session.profile;
  const [requestedCompanyId, setRequestedCompanyId] = useState(session.profile?.companyId || '');
  const currentCompanyId = session.platformAdmin ? requestedCompanyId : session.profile?.companyId || '';
  const setCurrentCompanyId = (id: string) => {
    if (session.platformAdmin || id === session.profile?.companyId) { setRequestedCompanyId(id); setSelectedBranchId('all'); }
  };
  const setCurrentUserId = (id: string) => {
    if (id !== currentUserId) addNotification('error', 'Acceso protegido', 'Para cambiar de persona, cierra sesión e inicia con su correo y contraseña.');
  };
  const [selectedBranchId, setSelectedBranchId] = useState('all');
  const companyScope = (name: string) => isAuthenticated && currentCompanyId && canReadCompanyCollection(session.profile, name) ? currentCompanyId : null;
  const [personalTransactions, setPersonalTransactions] = useTenantCollection<PersonalTransaction>('personal_finances', currentUserId || null, reportCloudError, 'userId');
  const emptyBudgets = getSamplePersonalFinancesData().budgets.map(budget => ({ ...budget, budgetedAmount: 0 }));
  const [personalBudgets, setPersonalBudgets] = useState<PersonalBudgetCategory[]>(emptyBudgets);
  const [personalSavingGoals, setPersonalSavingGoals] = useState<PersonalSavingGoal[]>([]);
  const [personalMetaReady, setPersonalMetaReady] = useState(false);

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

  const [rawBranches, setRawBranches] = useTenantCollection<Branch>('branches', companyScope('branches'), reportCloudError);
  const [rawProducts, setRawProducts] = useTenantCollection<Product>('products', companyScope('products'), reportCloudError);
  const [rawCustomers, setRawCustomers] = useTenantCollection<Customer>('customers', companyScope('customers'), reportCloudError);
  const [rawInvoices, setRawInvoices] = useTenantCollection<Invoice>('invoices', companyScope('invoices'), reportCloudError);
  const [customerPayments, setCustomerPayments] = useTenantCollection<CustomerPayment>('customer_payments', companyScope('customer_payments'), reportCloudError);
  const [rawSuppliers, setRawSuppliers] = useTenantCollection<Supplier>('suppliers', companyScope('suppliers'), reportCloudError);
  const [rawPurchases, setRawPurchases] = useTenantCollection<Purchase>('purchases', companyScope('purchases'), reportCloudError);
  const [supplierPayments, setSupplierPayments] = useTenantCollection<SupplierPayment>('supplier_payments', companyScope('supplier_payments'), reportCloudError);
  const [rawKardexMovements, setRawKardexMovements] = useTenantCollection<KardexMovement>('kardex_movements', companyScope('kardex_movements'), reportCloudError);
  const employeeCollection = currentUser.role === 'kiosko_asistencia' ? 'attendance_directory' : 'employees';
  const [rawEmployees, setRawEmployees] = useTenantCollection<Employee>(employeeCollection, companyScope(employeeCollection), reportCloudError);
  const [rawPayrolls, setRawPayrolls] = useTenantCollection<Payroll>('payrolls', companyScope('payrolls'), reportCloudError);
  const [rawProfessionalServices, setRawProfessionalServices] = useTenantCollection<ProfessionalServiceRecord>('professional_services', companyScope('professional_services'), reportCloudError);
  const [rawCandidateFolders, setRawCandidateFolders] = useTenantCollection<CandidateFolder>('candidate_folders', companyScope('candidate_folders'), reportCloudError);
  const [rawCandidateApplicants, setRawCandidateApplicants] = useTenantCollection<CandidateApplicant>('candidates', companyScope('candidates'), reportCloudError);
  const [rawAttendanceRecords, setRawAttendanceRecords] = useTenantCollection<AttendanceRecord>('attendance', companyScope('attendance'), reportCloudError);
  const [rawLeaveRequests, setRawLeaveRequests] = useTenantCollection<EmployeeLeaveRequest>('leave_requests', companyScope('leave_requests'), reportCloudError);
  const [rawBankAccounts, setRawBankAccounts] = useTenantCollection<BankAccount>('bank_accounts', companyScope('bank_accounts'), reportCloudError);
  const [rawTreasuryMovements, setRawTreasuryMovements] = useTenantCollection<TreasuryMovement>('treasury_movements', companyScope('treasury_movements'), reportCloudError);
  const [rawOtherIncomes, setRawOtherIncomes] = useTenantCollection<OtherIncome>('other_incomes', companyScope('other_incomes'), reportCloudError);
  const [rawJournalEntries, setRawJournalEntries] = useTenantCollection<JournalEntry>('journal_entries', companyScope('journal_entries'), reportCloudError);
  const [dynamicWidgets, setDynamicWidgets] = useTenantCollection<DynamicChartWidget>('dynamic_widgets', companyScope('dynamic_widgets'), reportCloudError);
  const rawAttendanceConfig = companies.find(company => company.id === currentCompanyId)?.attendanceConfig || DEFAULT_ATTENDANCE_CONFIG;
  const setRawAttendanceConfig: React.Dispatch<React.SetStateAction<CompanyAttendanceConfig>> = action => {
    const next = typeof action === 'function' ? action(rawAttendanceConfig) : action;
    updateCompany(currentCompanyId, { attendanceConfig: next });
  };
  const [chartOfAccounts, setChartState] = useState<AccountNode[]>(() => emptyChart(DEFAULT_CHART_OF_ACCOUNTS));
  const [settingsScope, setSettingsScope] = useState('');
  const setChartOfAccounts: React.Dispatch<React.SetStateAction<AccountNode[]>> = action => {
    if (!currentCompanyId || settingsScope !== currentCompanyId) { reportCloudError(new Error('Espera a que cargue el catálogo de esta empresa.')); return; }
    const next = typeof action === 'function' ? action(chartOfAccounts) : action;
    setChartState(next);
    setDoc(doc(db, 'company_settings', currentCompanyId), { companyId: currentCompanyId, chartOfAccounts: next }, { merge: true }).catch(reportCloudError);
  };

  // Selected current Company & User
  const currentCompany = useMemo(() => {
    return companies.find(company => company.id === currentCompanyId) || {
      ...SAMPLE_COMPANIES[0], id: '', name: '', tradeName: '', primaryAdminUserId: undefined,
    };
  }, [companies, currentCompanyId]);
  const userRole = currentUser.role;
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
  const setJournalEntries: React.Dispatch<React.SetStateAction<JournalEntry[]>> = action => {
    if (canReadCompanyCollection(session.profile, 'journal_entries')) { setRawJournalEntries(action); return; }
    // Sales staff can post generated entries without reading the company's ledger.
    const entries = typeof action === 'function' ? action([]) : action;
    entries.forEach(entry => {
      if (entry.companyId === currentCompanyId) setDoc(doc(db, 'journal_entries', entry.id), entry).catch(reportCloudError);
    });
  };

  const enterSupportMode = (companyId: string) => {
    if (!session.platformAdmin || !companies.some(company => company.id === companyId)) return;
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

  const resetCompanyDataToZero = async (companyId: string) => {
    if (!session.platformAdmin && (currentUser.role !== 'gerente' || currentUser.companyId !== companyId)) return;
    try {
      const names = [...COMPANY_COLLECTIONS.filter(name => name !== 'branches'), 'attendance_directory'];
      const snapshots = await Promise.all(names.map(name => getDocs(query(collection(db, name), where('companyId', '==', companyId)))));
      const documents = snapshots.flatMap(snapshot => snapshot.docs);
      for (let offset = 0; offset < documents.length; offset += 400) {
        const batch = writeBatch(db);
        documents.slice(offset, offset + 400).forEach(document => batch.delete(document.ref));
        await batch.commit();
      }
      addNotification('success', 'Operaciones eliminadas', 'La empresa conserva su perfil, usuarios y sucursales. Sus operaciones se eliminaron en Firebase.');
    } catch (error) { reportCloudError(error); throw error; }
  };

  const deleteCompany = async (companyId: string) => {
    if (!session.platformAdmin) return;
    if (companyId === currentUser.companyId) { reportCloudError(new Error('No puedes revocar la empresa asociada a tu propia cuenta de administrador.')); return; }
    try {
      // Revoking the company document immediately denies access to its operations.
      const profiles = await getDocs(query(collection(db, 'users'), where('companyId', '==', companyId)));
      for (const profile of profiles.docs) await deleteDoc(profile.ref);
      await deleteDoc(doc(db, 'companies', companyId));
      setCompanies(prev => prev.filter(company => company.id !== companyId));
      setUsers(prev => prev.filter(user => user.companyId !== companyId));
      addNotification('info', 'Empresa revocada', 'La empresa ya no es accesible. Sus operaciones se conservan para revisión y respaldo.');
    } catch (error) { reportCloudError(error); }
  };

  const clearAllDemoData = () => addNotification('info', 'Demostración separada', 'Las empresas demo no se cargan automáticamente en esta versión.');

  const createCompanyWithAdmin = async (
    companyData: Omit<Company, 'id'>,
    adminData: { name: string; email: string; password?: string; phone?: string }
  ): Promise<{ company: Company; user: UserProfile }> => {
    if (isAuthenticated && !session.platformAdmin) throw new Error('Solo el administrador de la plataforma puede crear otra empresa.');
    const result = await provisionAccount({
      ...adminData, role: 'gerente', systemArchetype: companyData.systemArchetype || 'emprendedor_control_interno', isConfigured: false,
    }, companyData, !isAuthenticated);
    if (isAuthenticated) {
      setCompanies(prev => [...prev.filter(company => company.id !== result.company!.id), result.company!]);
      setUsers(prev => [...prev.filter(user => user.id !== result.user.id), result.user]);
    }
    addNotification('success', 'Empresa registrada', 'La cuenta y su empresa se crearon correctamente.');
    return { company: result.company!, user: result.user };
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

  // Company management
  const createCompany = (companyData: Omit<Company, 'id'>) => {
    if (!session.platformAdmin) { reportCloudError(new Error('Solo el administrador de la plataforma puede crear empresas.')); return; }
    const sanitized = sanitizeCompany(companyData as any);
    const newComp: Company = {
      ...sanitized,
      id: `comp_${crypto.randomUUID()}`,
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
    if (!id || (!session.platformAdmin && id !== currentUser.companyId)) return;
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

  // Metadata only: administrators see company/profile directories. Operations
  // are always queried for the selected company by useTenantCollection.
  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;
    const stop: (() => void)[] = [];
    if (session.platformAdmin) {
      stop.push(onSnapshot(collection(db, 'companies'), snapshot => {
        if (active) setCompanies(snapshot.docs.map(d => sanitizeCompany({ ...d.data(), id: d.id })));
      }, reportCloudError));
      stop.push(onSnapshot(collection(db, 'users'), snapshot => {
        if (active) setUsers(snapshot.docs.map(d => { const { password, ...data } = d.data(); return { ...data, id: d.id } as UserProfile; }));
      }, reportCloudError));
    } else if (currentUser.companyId) {
      stop.push(onSnapshot(doc(db, 'companies', currentUser.companyId), snapshot => {
        if (active) setCompanies(snapshot.exists() ? [sanitizeCompany({ ...snapshot.data(), id: snapshot.id })] : []);
      }, reportCloudError));
      if (currentUser.role === 'gerente') stop.push(onSnapshot(query(collection(db, 'users'), where('companyId', '==', currentUser.companyId)), snapshot => {
        if (active) setUsers(snapshot.docs.map(d => { const { password, ...data } = d.data(); return { ...data, id: d.id } as UserProfile; }));
      }, reportCloudError));
    } else setCompanies([]);
    return () => { active = false; stop.forEach(unsubscribe => unsubscribe()); };
  }, [isAuthenticated, currentUser.companyId, currentUser.role, session.platformAdmin]);

  useEffect(() => {
    let active = true;
    setPersonalMetaReady(false);
    setPersonalBudgets(emptyBudgets);
    setPersonalSavingGoals([]);
    if (!currentUserId) return;
    const unsubscribe = onSnapshot(doc(db, 'personal_finance_meta', currentUserId), snapshot => {
      if (!active) return;
      const data = snapshot.data();
      setPersonalBudgets(Array.isArray(data?.personalBudgets) ? data.personalBudgets : emptyBudgets);
      setPersonalSavingGoals(Array.isArray(data?.personalSavingGoals) ? data.personalSavingGoals : []);
      setPersonalMetaReady(true);
    }, reportCloudError);
    return () => { active = false; unsubscribe(); };
  }, [currentUserId]);

  const savePersonalMeta = (patch: { personalBudgets?: PersonalBudgetCategory[]; personalSavingGoals?: PersonalSavingGoal[] }) => {
    if (!currentUserId || !personalMetaReady) { reportCloudError(new Error('Espera a que carguen tus presupuestos y metas.')); return; }
    if (patch.personalBudgets) setPersonalBudgets(patch.personalBudgets);
    if (patch.personalSavingGoals) setPersonalSavingGoals(patch.personalSavingGoals);
    setDoc(doc(db, 'personal_finance_meta', currentUserId), { ...patch, userId: currentUserId, updatedAt: new Date().toISOString() }, { merge: true }).catch(reportCloudError);
  };

  useEffect(() => {
    let active = true;
    setSettingsScope('');
    setChartState(emptyChart(DEFAULT_CHART_OF_ACCOUNTS));
    if (!companyScope('journal_entries')) return;
    const unsubscribe = onSnapshot(doc(db, 'company_settings', currentCompanyId), snapshot => {
      if (!active) return;
      const saved = snapshot.data()?.chartOfAccounts as AccountNode[] | undefined;
      setChartState(saved ? ensureEngineAccounts(saved) : emptyChart(DEFAULT_CHART_OF_ACCOUNTS));
      setSettingsScope(currentCompanyId);
    }, reportCloudError);
    return () => { active = false; unsubscribe(); };
  }, [currentCompanyId, isAuthenticated, currentUser.role]);

  // User & Access Management (Admin vs Cajero / Roles)
  const registerPersonalAccount = async (data: Omit<UserProfile, 'id'>) => {
    await provisionAccount({ ...data, role: 'gerente', systemArchetype: 'finanzas_personales', isConfigured: true }, undefined, true);
  };

  const createUser = async (data: Omit<UserProfile, 'id'>): Promise<UserProfile> => {
    if (!session.platformAdmin && (currentUser.role !== 'gerente' || data.companyId !== currentUser.companyId)) throw new Error('Solo el administrador de esta empresa puede crear sus accesos.');
    const { user } = await provisionAccount(data);
    setUsers(prev => [...prev.filter(item => item.id !== user.id), user]);
    addNotification('success', 'Acceso creado', 'La cuenta está registrada en Firebase Authentication.');
    return user;
  };

  const updateUser = async (id: string, updates: Partial<UserProfile>) => {
    if (updates.password) throw new Error('Usa el botón Asignar contraseña para cambiar el acceso sin enviar un correo.');
    const { password, id: ignoredId, ...safe } = updates;
    const target = users.find(user => user.id === id);
    if (safe.email && safe.email !== target?.email) throw new Error('El cambio de correo requiere actualizar Firebase Authentication.');
    await setDoc(doc(db, 'users', id), safe, { merge: true });
    setUsers(prev => prev.map(user => user.id === id ? { ...user, ...safe } : user));
    addNotification('success', 'Perfil actualizado', 'Los cambios se guardaron correctamente.');
  };

  const deleteUser = async (id: string) => {
    if (id === currentUserId) { addNotification('error', 'Acción denegada', 'No puedes revocar tu propio acceso desde esta pantalla.'); return; }
    try {
      await deleteDoc(doc(db, 'users', id));
      setUsers(prev => prev.filter(user => user.id !== id));
      addNotification('info', 'Acceso revocado', 'El perfil fue eliminado. La identidad de Authentication se conserva para auditoría.');
    } catch (error) { reportCloudError(error); }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try { await loginAccount(email, password); return { success: true }; }
    catch (error) { return { success: false, error: authErrorMessage(error) }; }
  };
  const logout = () => { signOut(auth).catch(reportCloudError); };

  useEffect(() => {
    if (!isAuthenticated) return;
    setActiveModule(currentUser.systemArchetype === 'finanzas_personales' ? 'personal_finances' : currentUser.role === 'cajero' ? 'pos_terminal' : session.platformAdmin ? 'admin_profiles' : 'dashboard');
  }, [isAuthenticated, currentUser.systemArchetype, currentUser.role]);

  // Personal Finances Methods
  const addPersonalTransaction = (txData: Omit<PersonalTransaction, 'id' | 'userId'>) => {
    if (!Number.isFinite(txData.amount) || txData.amount <= 0) { reportCloudError(new Error('El monto debe ser mayor que cero.')); return; }
    const newTx: PersonalTransaction = {
      ...txData,
      id: `pt_${crypto.randomUUID()}`,
      userId: currentUser.id,
    };
    setPersonalTransactions((prev) => [newTx, ...prev]);

    addNotification(
      'success',
      txData.type === 'ingreso' ? 'Ingreso Registrado' : 'Gasto Registrado',
      `$${txData.amount.toFixed(2)} en "${txData.category}" - ${txData.concept}`
    );
  };

  const deletePersonalTransaction = (id: string) => {
    setPersonalTransactions((prev) => prev.filter((t) => t.id !== id));

    addNotification('info', 'Movimiento Eliminado', 'El registro de finanzas personales fue removido.');
  };

  const updatePersonalBudget = (id: string, newAmount: number) => {
    if (!Number.isFinite(newAmount) || newAmount < 0) return;
    savePersonalMeta({ personalBudgets: personalBudgets.map(b => b.id === id ? { ...b, budgetedAmount: newAmount } : b) });
    addNotification('success', 'Presupuesto Actualizado', 'El límite mensual fue reconfigurado.');
  };

  const depositToSavingGoal = (id: string, amount: number) => {
    if (!Number.isFinite(amount) || amount <= 0) { reportCloudError(new Error('El abono debe ser mayor que cero.')); return; }
    savePersonalMeta({ personalSavingGoals: personalSavingGoals.map((g) => {
        if (g.id !== id) return g;
        const newTotal = g.currentAmount + amount;
        return { ...g, currentAmount: newTotal };
      }) });
    addNotification('success', 'Abono a Meta de Ahorro', `Se sumaron $${amount.toFixed(2)} a tu meta.`);
  };

  const addPersonalSavingGoal = (goalData: Omit<PersonalSavingGoal, 'id'>) => {
    if (!Number.isFinite(goalData.targetAmount) || goalData.targetAmount <= 0 || !Number.isFinite(goalData.currentAmount) || goalData.currentAmount < 0) return;
    const newGoal: PersonalSavingGoal = {
      ...goalData,
      id: `pg_${crypto.randomUUID()}`,
    };
    savePersonalMeta({ personalSavingGoals: [...personalSavingGoals, newGoal] });
    addNotification('success', 'Nueva Meta de Ahorro', `"${newGoal.title}" creada con objetivo de $${newGoal.targetAmount.toFixed(2)}.`);
  };

  const resetPersonalFinancesToSampleData = () => {
    const fresh = getSamplePersonalFinancesData();
    setPersonalTransactions(fresh.transactions.map(tx => ({ ...tx, id: crypto.randomUUID(), userId: currentUserId })));
    savePersonalMeta({ personalBudgets: fresh.budgets, personalSavingGoals: fresh.goals });
    addNotification(
      'info',
      'Datos de Demostración Cargados',
      'Se han generado registros del mes actual, mes anterior y arrastre patrimonial.'
    );
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

      });
      staleBranches.forEach((b) => {

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
        ? 'Modo de demostración DTE: los documentos no se transmiten a Hacienda y no tienen validación fiscal.'
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
      id: `branch_${crypto.randomUUID()}`,
      companyId: currentCompany.id,
    };
    setBranches((prev) => [...prev, newBranch]);

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

    addNotification('info', 'Sucursal Actualizada', 'Datos de la sucursal guardados.');
  };

  const deleteBranch = (id: string) => {
    setBranches((prev) => prev.filter((b) => b.id !== id));
    if (selectedBranchId === id) setSelectedBranchId('all');

    addNotification('warning', 'Sucursal Eliminada', 'La sucursal ha sido removida.');
  };

  // ----------------------------------------------------
  // MÓDULO 1: CRM & VENTAS & CXC
  // ----------------------------------------------------
  const createCustomer = (customerData: Omit<Customer, 'id'>): Customer => {
    const newCustomer: Customer = {
      ...customerData,
      id: `cust_${crypto.randomUUID()}`,
      companyId: currentCompany.id, // sin esto el filtro por empresa lo ocultaba al instante
      rating: customerData.rating || 5,
      stage: customerData.stage || 'prospecto',
      notesTimeline: customerData.notesTimeline || [],
    };
    setCustomers((prev) => [...prev, newCustomer]);

    addNotification('success', 'Cliente Registrado', `"${newCustomer.name}" añadido al CRM y sincronizado en la nube.`);
    return newCustomer;
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );

    addNotification('info', 'Cliente Actualizado', 'Información del cliente sincronizada en la nube.');
  };

  const deleteCustomer = (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));

    addNotification('warning', 'Cliente Eliminado', 'El registro del cliente ha sido removido del CRM.');
  };

  const addCustomerNote = (customerId: string, noteData: Omit<CustomerNote, 'id' | 'date'>) => {
    const newNote: CustomerNote = {
      ...noteData,
      id: `cn_${crypto.randomUUID()}`,
      date: new Date().toISOString().split('T')[0],
    };
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === customerId) {
          const notes = c.notesTimeline ? [newNote, ...c.notesTimeline] : [newNote];
          const updated = { ...c, notesTimeline: notes };

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
      id: `prod_${crypto.randomUUID()}`,
      companyId: currentCompany.id,
    };
    setProducts((prev) => [...prev, newProd]);

    addNotification('success', 'Producto Creado', `"${newProd.name}" registrado en inventario y guardado en la nube.`);
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );

  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));

    addNotification('warning', 'Producto Eliminado', 'El producto ha sido removido del catálogo.');
  };

  const createInvoice = (invoiceData: Omit<Invoice, 'id' | 'companyId' | 'createdAt'>): Invoice => {
    const invoiceId = `inv_${crypto.randomUUID()}`;
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
        companyId: currentCompany.id,
        id: newInvoice.customerId && newInvoice.customerId.startsWith('cust_') ? newInvoice.customerId : `cust_${crypto.randomUUID()}`,
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
            id: `cn_${crypto.randomUUID()}`,
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
              id: `cn_${crypto.randomUUID()}`,
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
          id: `tmov_${crypto.randomUUID()}`,
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


    addNotification('warning', 'Venta Eliminada', `Documento #${inv.correlativeNumber} y sus asientos/kardex han sido revertidos.`);
  };

  const deleteCustomerPayment = async (paymentId: string) => {
    try {
      await reversePayment(currentCompany.id, paymentId, 'customer');
      addNotification('info', 'Abono revertido', 'La deuda, el banco y los registros asociados se actualizaron juntos.');
    } catch (error) { reportCloudError(error); }
  };

  const registerCustomerPayment = async (payment: Omit<CustomerPayment, 'id' | 'companyId'>) => {
    try {
      await recordPayment(currentCompany.id, payment, 'customer', journalEntries.length + 1);
      addNotification('success', 'Cobro guardado', 'Se actualizaron la deuda, el banco y la contabilidad.');
    } catch (error) { reportCloudError(error); }
  };

  const cancelInvoice = (id: string) => {
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, status: 'anulada', saldoPendiente: 0 } : inv))
    );

    addNotification('warning', 'Factura Anulada', 'El documento DTE ha sido marcado como anulado.');
  };

  // ----------------------------------------------------
  // MÓDULO 2: CRM PROVEEDORES & COMPRAS & SCM
  // ----------------------------------------------------
  const createSupplier = (supplierData: Omit<Supplier, 'id'>) => {
    const newSupp: Supplier = {
      ...supplierData,
      id: `supp_${crypto.randomUUID()}`,
      companyId: currentCompany.id, // sin esto el proveedor "no se guardaba" (el filtro por empresa lo ocultaba)
      rating: supplierData.rating || 5,
      qualityScore: supplierData.qualityScore || 5,
      timelinessScore: supplierData.timelinessScore || 5,
      pricingScore: supplierData.pricingScore || 5,
      notesTimeline: supplierData.notesTimeline || [],
    };
    setSuppliers((prev) => [...prev, newSupp]);

    addNotification('success', 'Proveedor Registrado', `"${newSupp.name}" añadido al catálogo.`);
  };

  const updateSupplier = (id: string, updates: Partial<Supplier>) => {
    setSuppliers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );

    addNotification('info', 'Proveedor Actualizado', 'Información del proveedor sincronizada.');
  };

  const addSupplierNote = (supplierId: string, noteData: Omit<SupplierNote, 'id' | 'date'>) => {
    const newNote: SupplierNote = {
      ...noteData,
      id: `sn_${crypto.randomUUID()}`,
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
    const purchaseId = `pur_${crypto.randomUUID()}`;
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



    addNotification(
      'success',
      'Compra Registrada',
      `Documento ${newPurchase.docType.toUpperCase()} #${newPurchase.documentNumber} por $${newPurchase.totalPagar.toFixed(2)} registrado en Kardex e IVA Compras.`
    );

    return newPurchase;
  };

  const registerSupplierPayment = async (payment: Omit<SupplierPayment, 'id' | 'companyId'>) => {
    try {
      await recordPayment(currentCompany.id, payment, 'supplier', journalEntries.length + 1);
      addNotification('success', 'Abono guardado', 'Se actualizaron la deuda, el banco y la contabilidad.');
    } catch (error) { reportCloudError(error); }
  };

  const updatePurchase = (id: string, updates: Partial<Purchase>) => {
    setPurchases((prev) =>
      prev.map((pur) => (pur.id === id ? { ...pur, ...updates } : pur))
    );

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


    addNotification('warning', 'Compra Eliminada', `Documento #${pur.documentNumber} y sus efectos contables han sido revertidos.`);
  };

  const deleteSupplierPayment = async (paymentId: string) => {
    try {
      await reversePayment(currentCompany.id, paymentId, 'supplier');
      addNotification('info', 'Abono revertido', 'La deuda, el banco y los registros asociados se actualizaron juntos.');
    } catch (error) { reportCloudError(error); }
  };

  const deleteSupplier = (id: string) => {
    setSuppliers((prev) => prev.filter((s) => s.id !== id));

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
      id: `emp_${crypto.randomUUID()}`,
      companyId: currentCompany.id,
      rating: 5,
      evaluations: [],
      disciplinaryActions: [],
    };
    setEmployees((prev) => [...prev, newEmp]);

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

    addNotification('info', 'Empleado Actualizado', 'Ficha de colaborador modificada con éxito.');
  };

  const deleteEmployee = (id: string) => {
    setEmployees((prev) => prev.filter((e) => e.id !== id));

    addNotification('warning', 'Colaborador Retirado', 'El colaborador ha sido removido del directorio.');
  };

  const addEmployeeEvaluation = (employeeId: string, evalData: Omit<EmployeeEvaluation, 'id' | 'date'>) => {
    const newEval: EmployeeEvaluation = {
      ...evalData,
      id: `eval_${crypto.randomUUID()}`,
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
      id: `disc_${crypto.randomUUID()}`,
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
      id: `pay_${crypto.randomUUID()}`,
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



    addNotification(
      'success',
      'Planilla Legal SV Generada',
      `Planilla ${periodType.toUpperCase()} de ${details.length} colaboradores procesada con retenciones ISSS, AFP y Renta calculadas.`
    );

    return newPayroll;
  };

  const saveCustomPayroll = (payroll: Payroll) => {
    if (payrolls.some(existing => existing.id === payroll.id && existing.status === 'pagada')) { reportCloudError(new Error('No se puede editar una planilla pagada.')); return; }
    const entry = generatePayrollAccountingEntry(payroll, journalEntries.find(existing => existing.id === payroll.accountingEntryId)?.entryNumber || journalEntries.length + 1);
    if (!entry.isBalanced) { reportCloudError(new Error('La planilla no produce una partida contable equilibrada. Revisa sus totales.')); return; }
    payroll = { ...payroll, accountingEntryId: entry.id };
    setJournalEntries(prev => [entry, ...prev.filter(existing => existing.id !== entry.id)]);
    setPayrolls((prev) => {
      const idx = prev.findIndex((p) => p.id === payroll.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = payroll;
        return copy;
      }
      return [payroll, ...prev];
    });

    addNotification('success', 'Planilla Actualizada', `Cambios en la planilla ${payroll.periodType.toUpperCase()} guardados.`);
  };

  const deletePayroll = (id: string) => {
    const payroll = payrolls.find(existing => existing.id === id);
    if (payroll?.status === 'pagada') { reportCloudError(new Error('Una planilla pagada requiere una reversión contable; no puede borrarse directamente.')); return; }
    if (payroll?.accountingEntryId) setJournalEntries(prev => prev.filter(entry => entry.id !== payroll.accountingEntryId));
    setPayrolls((prev) => prev.filter((p) => p.id !== id));

    addNotification('warning', 'Planilla Eliminada', 'El registro de planilla fue removido del historial.');
  };

  const payPayroll = async (payrollId: string, bankAccountId: string) => {
    try {
      await settlePayroll(currentCompany.id, payrollId, bankAccountId, journalEntries.length + 1);
      addNotification('success', 'Planilla pagada', 'La cuenta, la planilla y la contabilidad se actualizaron juntas.');
    } catch (error) { reportCloudError(error); }
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
      id: `prof_${crypto.randomUUID()}`,
      companyId: currentCompany.id,
      grossAmount: gross,
      retentionRate: rate,
      retentionAmount: retention,
      netAmount: net,
      status: serviceData.status || 'pendiente',
      createdAt: new Date().toISOString(),
    };

    setRawProfessionalServices((prev) => [newRecord, ...prev]);


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

          return updated;
        }
        return s;
      })
    );
    addNotification('info', 'Servicio Actualizado', 'El registro de honorarios fue actualizado.');
  };

  const deleteProfessionalService = (id: string) => {
    setRawProfessionalServices((prev) => prev.filter((s) => s.id !== id));

    addNotification('warning', 'Servicio Eliminado', 'El registro de servicios profesionales fue removido.');
  };

  // ----------------------------------------------------
  // BOLSA DE TRABAJO & BASE DE CURRÍCULUM VITAE (CV)
  // ----------------------------------------------------
  const createCandidateFolder = (folderData: Omit<CandidateFolder, 'id' | 'companyId' | 'createdAt'>): CandidateFolder => {
    const newFolder: CandidateFolder = {
      ...folderData,
      id: `cf_${crypto.randomUUID()}`,
      companyId: currentCompany.id,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setRawCandidateFolders((prev) => [...prev, newFolder]);

    addNotification('success', 'Carpeta Creada', `Vacante / Carpeta "${newFolder.name}" habilitada.`);
    return newFolder;
  };

  const deleteCandidateFolder = (id: string) => {
    setRawCandidateFolders((prev) => prev.filter((f) => f.id !== id));
    setRawCandidateApplicants((prev) => prev.filter((a) => a.folderId !== id));

    addNotification('info', 'Carpeta Eliminada', 'La carpeta de selección y sus candidatos fueron removidos.');
  };

  const createCandidateApplicant = (applicantData: Omit<CandidateApplicant, 'id' | 'companyId' | 'createdAt'>): CandidateApplicant => {
    const newApp: CandidateApplicant = {
      ...applicantData,
      id: `cand_${crypto.randomUUID()}`,
      companyId: currentCompany.id,
      createdAt: new Date().toISOString(),
    };
    setRawCandidateApplicants((prev) => [newApp, ...prev]);

    addNotification('success', 'Candidato Registrado', `"${newApp.fullName}" agregado a la vacante ${newApp.folderName}.`);
    return newApp;
  };

  const updateCandidateApplicant = (id: string, updates: Partial<CandidateApplicant>) => {
    setRawCandidateApplicants((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updates } : a))
    );

    addNotification('info', 'Candidato Actualizado', 'Estado y datos de postulación guardados.');
  };

  const deleteCandidateApplicant = (id: string) => {
    setRawCandidateApplicants((prev) => prev.filter((a) => a.id !== id));

    addNotification('warning', 'Postulante Eliminado', 'El candidato fue retirado del proceso.');
  };

  const hireCandidateAsEmployee = (applicantId: string, baseSalary?: number, position?: string) => {
    const applicant = rawCandidateApplicants.find((a) => a.id === applicantId);
    if (!applicant) return;

    // Create Employee record
    const [firstName, ...lastParts] = applicant.fullName.split(' ');
    const lastName = lastParts.join(' ') || 'General';

    const newEmp: Employee = {
      id: `emp_${crypto.randomUUID()}`,
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
        id: `att_${crypto.randomUUID()}`,
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
      id: `leave_${crypto.randomUUID()}`,
      companyId: currentCompany.id,
      createdAt: new Date().toISOString(),
    };
    setRawLeaveRequests((prev) => [newLeave, ...prev]);

    return newLeave;
  };

  const updateLeaveRequestStatus = (id: string, status: 'aprobado' | 'rechazado' | 'pendiente') => {
    setRawLeaveRequests((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status, approvedAt: new Date().toISOString() } : l))
    );

  };

  // ----------------------------------------------------
  // MÓDULO 4: TESORERÍA, BANCOS & FLUJO DE CAJA REAL
  // ----------------------------------------------------
  const createBankAccount = (accountData: Omit<BankAccount, 'id' | 'companyId' | 'currentBalance'>) => {
    const newAcc: BankAccount = {
      ...accountData,
      id: `bank_${crypto.randomUUID()}`,
      companyId: currentCompany.id,
      currentBalance: accountData.initialBalance,
    };
    setBankAccounts((prev) => [...prev, newAcc]);

    addNotification('success', 'Cuenta Bancaria Registrada', `"${newAcc.accountName}" añadida a tesorería.`);
  };

  const transferFunds = async (from: string, to: string, amount: number, reference: string, description: string) => {
    try {
      await moveFunds(currentCompany.id, from, to, amount, reference, description, journalEntries.length + 1);
      addNotification('success', 'Transferencia guardada', 'Los saldos y la partida contable se guardaron juntos.');
    } catch (error) { reportCloudError(error); }
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
    if (mov.accountingEntryId || mov.type === 'transferencia_interna') {
      reportCloudError(new Error('Este movimiento está vinculado a una operación. Corrígela desde su módulo de origen para conservar los saldos y la contabilidad.')); return;
    }

    // Revert bank balance
    const isIncome = ['ingreso_venta', 'abono_cxc', 'otro_ingreso'].includes(mov.type);
    setBankAccounts((prev) =>
      prev.map((b) => {
        if (b.id === mov.bankAccountId) {
          const newBal = isIncome
            ? Number((b.currentBalance - mov.amount).toFixed(2))
            : Number((b.currentBalance + mov.amount).toFixed(2));

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


    addNotification('info', 'Movimiento Revertido', `Movimiento #${mov.referenceNumber} eliminado y saldo bancario restaurado.`);
  };

  const createOtherIncome = (incomeData: Omit<OtherIncome, 'id' | 'companyId' | 'createdAt'>): OtherIncome => {
    const incomeId = `inc_oth_${crypto.randomUUID()}`;
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
      id: `entry_inc_${crypto.randomUUID()}`,
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
          accountCode: '6201',
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
      id: `tmov_${crypto.randomUUID()}`,
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
    const now = new Date(), start = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-01', end = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(new Date(now.getFullYear(),now.getMonth()+1,0).getDate());
    const report = buildAccountingReports(chartOfAccounts,journalEntries,bankAccounts,start,end);
    const amount=(source: string, positive:boolean)=>money(report.cashMovements.filter(row=>row.amount*(positive?1:-1)>0 && report.period.find(entry=>entry.id===row.id)?.sourceModule===source).reduce((sum,row)=>sum+Math.abs(row.amount),0));
    const totalInflows=money(report.cashMovements.filter(row=>row.amount>0).reduce((sum,row)=>sum+row.amount,0)), totalOutflows=money(report.cashMovements.filter(row=>row.amount<0).reduce((sum,row)=>sum-row.amount,0));
    const sales=amount('ventas',true),other=money(totalInflows-sales), purchases=amount('compras',false), payroll=amount('planilla',false);
    return {periodLabel:now.toLocaleDateString('es-SV',{month:'long',year:'numeric'}),startDate:start,endDate:end,openingCash:report.openingCash,closingCash:report.closingCash,inflowsContadoSales:sales,inflowsCxcCollections:0,inflowsOther:other,totalInflows,outflowsContadoPurchases:purchases,outflowsCxpPayments:0,outflowsPayrollNet:payroll,outflowsPayrollTaxesPatronal:0,outflowsTaxesMH:0,outflowsOperating:money(totalOutflows-purchases-payroll),totalOutflows,netCashFlow:report.netCash};
  },[chartOfAccounts,journalEntries,bankAccounts]);
  // Scheduled outstanding invoices and purchases, counted once by due date.
  const cashFlowProjections: CashFlowProjectionItem[] = useMemo(() => {
    const now=new Date(), dateKey=(date:Date)=>date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0');
    const today=dateKey(now); let previous=today, balance=bankAccounts.reduce((sum,account)=>sum+account.currentBalance,0);
    return [30,60,90].map((days,index)=>{const end=dateKey(new Date(now.getFullYear(),now.getMonth(),now.getDate()+days)); const due=(date:string)=>index===0 ? date<=end : date>previous&&date<=end;
      const inflows=money(invoices.filter(doc=>doc.status!=='anulada'&&doc.saldoPendiente>0&&doc.dueDate&&due(doc.dueDate)).reduce((sum,doc)=>sum+doc.saldoPendiente,0));
      const outflows=money(purchases.filter(doc=>doc.status!=='anulada'&&doc.saldoPendiente>0&&doc.dueDate&&due(doc.dueDate)).reduce((sum,doc)=>sum+doc.saldoPendiente,0));
      const opening=balance; balance=money(balance+inflows-outflows);previous=end;
      return {date:end,periodLabel:'Hasta '+days+' días',openingBalance:opening,cxcInflows:inflows,projectedSalesInflows:0,totalInflows:inflows,cxpOutflows:outflows,payrollOutflows:0,taxesOutflows:0,operatingOutflows:0,totalOutflows:outflows,netCashFlow:money(inflows-outflows),closingBalance:balance,status:balance<0?'deficit':balance===0?'alerta':'saludable'};
    });
  },[bankAccounts,invoices,purchases]);

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
    if (updates.code && updates.code !== code && journalEntries.some(entry => entry.lines.some(line => line.accountCode === code))) { reportCloudError(new Error('No se puede cambiar el código de una cuenta con movimientos.')); return; }
    setChartOfAccounts((prev) =>
      prev.map((a) => (a.code === code ? { ...a, ...updates } : a))
    );
    addNotification('info', 'Cuenta Modificada', `Cuenta ${code} actualizada con éxito.`);
  };

  const deleteAccountNode = (code: string) => {
    if (journalEntries.some(entry => entry.lines.some(line => line.accountCode === code))) { reportCloudError(new Error('Esta cuenta tiene movimientos contables y no puede eliminarse.')); return; }
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
      setChartOfAccounts(emptyChart(SIMPLIFIED_STARTUP_CHART_OF_ACCOUNTS));
      addNotification('success', 'Catálogo Simplificado Aplicado', 'Estructura ágil cargada ideal para startups y microempresas.');
    } else {
      setChartOfAccounts(emptyChart(FULL_NIIF_CHART_OF_ACCOUNTS));
      addNotification('success', 'Catálogo NIIF Completo Aplicado', 'Estructura oficial para auditorías y despachos contables.');
    }
  };

  const createManualJournalEntry = (
    entryData: Omit<
      JournalEntry,
      'id' | 'companyId' | 'createdAt' | 'entryNumber' | 'totalDebit' | 'totalCredit' | 'isBalanced'
    >
  ): JournalEntry => {
    if (!['admin_maestro', 'gerente', 'contador'].includes(currentUser.role)) throw new Error('No tienes permiso para registrar partidas.');
    const date = new Date(entryData.date + 'T12:00:00Z');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(entryData.date) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0,10) !== entryData.date || !entryData.concept.trim()) throw new Error('Indica fecha válida y concepto.');
    if (entryData.lines.length < 2 || entryData.lines.some(line => !chartOfAccounts.some(account => account.code === line.accountCode && account.isMovement) || ![line.debit,line.credit].every(value => Number.isFinite(value) && value >= 0 && Math.abs(value * 100 - Math.round(value * 100)) < 0.000001) || (line.debit > 0 && line.credit > 0))) throw new Error('Selecciona cuentas de movimiento y valores positivos con hasta dos decimales.');
    const debit = entryData.lines.reduce((sum,line) => sum + Math.round(line.debit*100),0), credit = entryData.lines.reduce((sum,line) => sum + Math.round(line.credit*100),0);
    if (!debit || debit !== credit) throw new Error('El debe y el haber deben ser iguales y mayores que cero.');
    const nextEntryNumber = Math.max(0, ...journalEntries.map(entry => entry.entryNumber)) + 1;
    const entry = createBalancedJournalEntry({
      id: `entry_man_${crypto.randomUUID()}`,
      companyId: currentCompany.id,
      entryNumber: nextEntryNumber,
      date: entryData.date,
      concept: entryData.concept,
      sourceModule: 'manual',
      referenceDoc: entryData.referenceDoc,
      lines: entryData.lines,
    });

    if (entryData.cashFlowActivity) entry.cashFlowActivity = entryData.cashFlowActivity;
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
      id: `dw_${crypto.randomUUID()}`,
      companyId: currentCompany.id,
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
    addNotification('info', 'Demostración separada', 'La restauración global de datos demo está deshabilitada para proteger las empresas registradas.');
  };

  const exportDatabaseJSON = (): string => {
    const fullState = {
      exportedAt: new Date().toISOString(),
      app: 'FinaPyme ERP',
      version: '2.1.0',
      companies: currentCompany.id ? [currentCompany] : [],
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
      companyId: currentCompany.id,
      professionalServices,
      candidateFolders,
      candidateApplicants,
      attendanceRecords,
      leaveRequests,
      personalTransactions,
      personalBudgets,
      personalSavingGoals,
      userId: currentUserId,
    };
    return JSON.stringify(fullState, null, 2);
  };

  const importDatabaseJSON = (jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!currentCompany.id || !['gerente', 'admin_maestro'].includes(userRole)) throw new Error('Solo el administrador puede importar datos de su empresa.');
      for (const key of ['branches', 'products', 'customers', 'invoices', 'customerPayments', 'suppliers', 'purchases', 'supplierPayments', 'kardexMovements', 'employees', 'payrolls', 'bankAccounts', 'treasuryMovements', 'otherIncomes', 'journalEntries', 'dynamicWidgets', 'professionalServices', 'candidateFolders', 'candidateApplicants', 'attendanceRecords', 'leaveRequests']) {
        if (parsed[key] !== undefined) assertTenantRecords(parsed[key], currentCompany.id);
      }
      if (parsed.companies?.some((company: Company) => company.id !== currentCompany.id)) throw new Error('El respaldo pertenece a otra empresa.');
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
      if (parsed.professionalServices) setRawProfessionalServices(parsed.professionalServices);
      if (parsed.candidateFolders) setRawCandidateFolders(parsed.candidateFolders);
      if (parsed.candidateApplicants) setRawCandidateApplicants(parsed.candidateApplicants);
      if (parsed.attendanceRecords) setRawAttendanceRecords(parsed.attendanceRecords);
      if (parsed.leaveRequests) setRawLeaveRequests(parsed.leaveRequests);

      addNotification('success', 'Respaldo JSON Importado', 'Todos los datos y configuraciones se han cargado correctamente.');
      return true;
    } catch (err: any) {
      addNotification('error', 'Error al importar', err instanceof Error ? err.message : 'El respaldo no es válido.');
      return false;
    }
  };

  return (
    <ERPContext.Provider
      value={{
        isAuthenticated,
        isAuthLoading: session.loading,
        authError: session.error,
        resetPassword: resetAccountPassword,
        registerPersonalAccount,
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
