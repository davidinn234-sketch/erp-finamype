export type UserRole = 'admin_maestro' | 'contador' | 'gerente' | 'cajero';

export type SystemArchetype =
  | 'finanzas_personales'
  | 'emprendedor_control_interno'
  | 'negocio_transicion'
  | 'empresa_consolidada_dte';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  companyId?: string; // ID de la empresa a la que pertenece este usuario
  avatar?: string;
  permissions?: string[];
  dui?: string;
  nit?: string;
  phone?: string;
  address?: string;
  department?: string;
  municipality?: string;
  jobTitle?: string;
  systemArchetype?: SystemArchetype;
  isConfigured?: boolean;
  createdAt?: string;
  enabledServices?: string[];
  storedInCloud?: boolean;
}

// ----------------------------------------------------
// MÓDULO PERSONAL: FINANZAS PERSONALES
// ----------------------------------------------------
export interface PersonalTransaction {
  id: string;
  userId: string;
  type: 'ingreso' | 'gasto';
  amount: number;
  category: string;
  concept: string;
  date: string;
  paymentMethod: 'efectivo' | 'debito' | 'credito' | 'transferencia' | 'chivo_wallet';
  notes?: string;
}

export interface PersonalBudgetCategory {
  id: string;
  category: string;
  budgetedAmount: number;
  icon?: string;
}

export interface PersonalSavingGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  category: string;
}

export interface RentaBracket {
  id: string;
  from: number;
  to: number; // 999999 for infinity
  rate: number; // e.g. 0.10, 0.20, 0.30
  fixedAmount: number; // e.g. 17.67, 60.00
  excessFrom: number; // e.g. 472.00
  label: string;
}

export interface FiscalConfig {
  // IVA
  ivaRate: number; // 0.13 (13%)
  retencionIvaRate: number; // 0.01 (1%)
  percepcionIvaRate: number; // 0.01 (1%)
  retencionRentaServiciosRate: number; // 0.10 (10%)
  pagoCuentaRate: number; // 0.0175 (1.75%)
  
  // ISSS
  isssLaboralRate: number; // 0.03 (3%)
  isssPatronalRate: number; // 0.075 (7.5%)
  isssTechoMensual: number; // 1000.00
  isssMaxLaboralMensual: number; // 30.00
  isssMaxPatronalMensual: number; // 75.00
  
  // AFP & INSAFORP
  afpLaboralRate: number; // 0.0725 (7.25%)
  afpPatronalRate: number; // 0.0875 (8.75%)
  insaforpPatronalRate: number; // 0.01 (1%)
  insaforpMinEmployees: number; // 10
  
  // Provisiones de Ley
  provisionAguinaldoRate: number; // 0.0417 (~15 días anuales)
  provisionVacacionRate: number; // 0.0542 (15 días + 30% recargo)
  provisionIndemnizacionRate: number; // 0.0833 (1 mes por año)
  
  // Renta Brackets
  rentaMonthlyBrackets: RentaBracket[];
  rentaBiweeklyBrackets: RentaBracket[];
}

export interface Branch {
  id: string;
  companyId: string;
  code: string; // e.g. SUC-01
  name: string; // e.g. Sucursal Central Escalón, Sucursal Santa Tecla
  address: string;
  department: string;
  municipality?: string;
  phone: string;
  managerName?: string;
  isMain: boolean;
  isActive: boolean;
}

export interface Company {
  id: string;
  name: string;
  tradeName: string; // Nombre comercial
  nit: string; // Número de Identificación Tributaria
  nrc: string; // Número de Registro de Contribuyente
  dui?: string; // Para personas naturales
  giro: string; // Actividad económica
  address: string;
  department: string;
  municipality?: string;
  phone: string;
  email: string;
  isGranContribuyente: boolean;
  currency: string; // USD ($) oficial en El Salvador
  logoUrl?: string;
  fiscalYear: number;
  fiscalConfig?: FiscalConfig;
  branches?: Branch[];
  
  // Régimen y Onboarding Declarativo (Lean Startup)
  regimeType?: 'emprendedor_control_interno' | 'general_tributario';
  systemArchetype?: SystemArchetype;
  dteActive?: boolean; // Activar o desactivar facturación electrónica DTE (MH)
  dteEnvironment?: 'pruebas' | 'produccion';
  dtePrivateKey?: string;
  dteApiPassword?: string;
  dteEstablishmentCode?: string;
  dtePointOfSaleCode?: string;
  economicActivityCode?: string; // Código CIIU (ej: 47110)
  hasEmployees?: boolean;
  taxesConfig?: {
    declaIva: boolean; // Declara IVA 13% mensual (F-07)
    declaPagoCuenta: boolean; // Declara Pago a Cuenta 1.75%
    declaImpuestosMunicipales: boolean; // Tasas municipales a Alcaldía
    municipalRateOrFee?: number; // Cuota mensual o % (ej: $15.00)
    alcaldiaName?: string; // Ej: Alcaldía Municipal de San Salvador Centro
    isRetencionAgent?: boolean;
    retainsIncomeTax10?: boolean;
  };

  // FINAMIPE SV SaaS & Suscripción
  subscriptionPlan?: 'emprendedor' | 'pyme_dte' | 'personal' | 'corporativo' | 'personalizado';
  subscriptionStatus?: 'activo' | 'prueba' | 'suspendido' | 'vencido';
  subscriptionPrice?: number;
  subscriptionRenewalDate?: string;
  primaryAdminUserId?: string;
  contactPerson?: string;
  contactPhone?: string;
  notes?: string;
  createdAt?: string;
}

// ----------------------------------------------------
// MÓDULO 1: CRM & VENTAS & CXC
// ----------------------------------------------------
export type InvoiceType = 'factura_consumidor_final' | 'credito_fiscal' | 'nota_credito' | 'nota_debito' | 'exportacion' | 'ticket_interno';
export type PaymentCondition = 'contado' | 'credito_15' | 'credito_30' | 'credito_60';
export type InvoiceStatus = 'emitida' | 'pagada' | 'parcial' | 'anulada';

export type CustomerAgeRange = '18-25' | '26-35' | '36-50' | '50+';
export type CustomerGender = 'femenino' | 'masculino' | 'corporativo' | 'otro';
export type AcquisitionChannel = 'whatsapp' | 'instagram' | 'facebook' | 'tienda_fisica' | 'referido' | 'web';
export type CustomerStage = 'prospecto' | 'contactado' | 'cotizacion' | 'negociacion' | 'primer_compra' | 'frecuente' | 'vip' | 'inactivo';
export type LeadStatus = 'nuevo' | 'contactado' | 'cotizado' | 'negociacion' | 'ganado_cerrado' | 'perdido';

export interface CustomerNote {
  id: string;
  date: string;
  type: 'llamada' | 'whatsapp' | 'reunion' | 'acuerdo' | 'reclamo';
  content: string;
  author: string;
}

export interface Customer {
  id: string;
  name: string;
  tradeName?: string;
  nrc?: string;
  nit: string;
  dui?: string;
  giro?: string;
  address: string;
  phone: string;
  email: string;
  isGranContribuyente: boolean;
  creditLimit: number;
  paymentTermDays: number;
  
  // Enhanced CRM & Pipeline fields
  ageRange?: CustomerAgeRange;
  gender?: CustomerGender;
  acquisitionChannel?: AcquisitionChannel;
  department?: string; // e.g. San Salvador, La Libertad, Santa Ana, San Miguel
  municipality?: string; // e.g. San Salvador Centro, Santa Tecla, etc.
  preferences?: string[]; // e.g. ["Preferencia pago con transferencia", "Pedidos los viernes", "Facturación CCF"]
  stage?: CustomerStage;
  leadStatus?: LeadStatus;
  lostReason?: string; // Motivo si se perdió el lead
  rating?: number; // 1 - 5 stars
  notesTimeline?: CustomerNote[];
}

export interface InvoiceItem {
  id: string;
  productId: string;
  productCode: string;
  description: string;
  quantity: number;
  unitPrice: number; // Precio sin IVA para CCF, o con IVA para FC
  discountPercent?: number;
  total: number;
  unitCost: number; // Para asiento de costo de venta
}

export interface Invoice {
  id: string;
  companyId: string;
  branchId?: string;
  branchName?: string;
  type: InvoiceType;
  correlativeNumber: string; // Ej: CCF-000104
  dteCode?: string; // Código de Generación DTE MH
  controlNumber?: string;
  date: string;
  dueDate: string;
  customerId: string;
  customerName: string;
  customerNrc?: string;
  customerNit: string;
  customerIsGranContribuyente: boolean;
  paymentCondition: PaymentCondition;
  status: InvoiceStatus;
  
  items: InvoiceItem[];
  
  sumasGravadas: number;
  sumasExentas: number;
  sumasNoSujetas: number;
  iva13: number; // Débito Fiscal
  ivaRetenido1: number; // Retención 1% si cliente es Gran Contribuyente y venta >= $100
  ivaPercibido1: number; // Percepción 1% si emisor es Gran Contribuyente y cliente no
  totalPagar: number;
  saldoPendiente: number;
  
  accountingEntryId?: string;
  notes?: string;
  createdAt: string;
}

export interface CustomerPayment {
  id: string;
  companyId: string;
  branchId?: string;
  branchName?: string;
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  date: string;
  amount: number;
  paymentMethod: 'efectivo' | 'transferencia' | 'cheque' | 'tarjeta';
  targetAccountId: string; // Caja o Banco
  referenceNumber?: string;
  receiptNumber: string;
  notes?: string;
}

export type OtherIncomeCategory =
  | 'remanente_hacienda'
  | 'venta_activo_fijo'
  | 'rendimiento_financiero'
  | 'devolucion_seguro'
  | 'subsidio_gubernamental'
  | 'otros_ingresos_no_operacionales';

export interface OtherIncome {
  id: string;
  companyId: string;
  branchId?: string;
  branchName?: string;
  date: string;
  category: OtherIncomeCategory;
  categoryLabel: string;
  description: string;
  amount: number;
  paymentMethod: 'transferencia' | 'cheque' | 'efectivo' | 'deposito';
  targetAccountId: string;
  targetAccountName?: string;
  referenceNumber?: string;
  notes?: string;
  accountingEntryId?: string;
  createdAt: string;
}

// ----------------------------------------------------
// MÓDULO 2: CRM PROVEEDORES & COMPRAS & SCM
// ----------------------------------------------------
export type PurchaseDocType = 'ccf_compra' | 'factura_sujeto_excluido' | 'declaracion_mercancias' | 'nota_credito_compra';
export type PurchaseStatus = 'registrada' | 'pagada' | 'parcial' | 'anulada';
export type ValuationMethod = 'promedio_ponderado' | 'peps';

export interface SupplierNote {
  id: string;
  date: string;
  type: 'negociacion' | 'visita' | 'acuerdo_credito' | 'incidencia';
  content: string;
  author: string;
}

export interface Supplier {
  id: string;
  name: string;
  tradeName?: string;
  nrc: string;
  nit: string;
  giro: string;
  address: string;
  department?: string;
  municipality?: string;
  phone: string;
  email: string;
  isGranContribuyente: boolean;
  isSujetoExcluido?: boolean; // Servicios profesionales
  paymentTermDays: number;
  
  // Enhanced Supplier CRM fields
  category?: string; // e.g. "Tecnología", "Materia Prima", "Logística", "Empaque", "Servicios"
  leadTimeDays?: number; // Días promedio de entrega
  rating?: number; // 1 - 5 stars
  qualityScore?: number; // 1 - 5
  timelinessScore?: number; // 1 - 5
  pricingScore?: number; // 1 - 5
  notesTimeline?: SupplierNote[];
  suppliedProducts?: string[];
}

export interface PurchaseItem {
  id: string;
  productId: string;
  description: string;
  quantity: number;
  unitCost: number;
  total: number;
}

export interface Purchase {
  id: string;
  companyId: string;
  branchId?: string;
  branchName?: string;
  docType: PurchaseDocType;
  documentNumber: string; // N° Factura / CCF del proveedor
  date: string;
  dueDate: string;
  supplierId: string;
  supplierName: string;
  supplierNrc: string;
  supplierNit: string;
  supplierIsGranContribuyente: boolean;
  status: PurchaseStatus;
  
  items: PurchaseItem[];
  
  comprasGravadas: number;
  comprasExentas: number;
  comprasSujetoExcluido: number;
  ivaCreditoFiscal: number; // 13%
  retencionRenta10: number; // 10% en servicios profesionales / sujeto excluido
  retencionIva1: number; // Si nuestra empresa retiene 1%
  percepcionIva1: number; // Si proveedor nos percibe 1%
  totalPagar: number;
  saldoPendiente: number;
  
  isServicesPurchase?: boolean;
  accountingEntryId?: string;
  createdAt: string;
}

export interface SupplierPayment {
  id: string;
  companyId: string;
  branchId?: string;
  branchName?: string;
  purchaseId: string;
  purchaseNumber: string;
  supplierId: string;
  supplierName: string;
  date: string;
  amount: number;
  paymentMethod: 'transferencia' | 'cheque' | 'efectivo';
  sourceAccountId: string;
  referenceNumber?: string;
  notes?: string;
}

export interface Product {
  id: string;
  companyId: string;
  code: string;
  barcode?: string; // Código de barras para escáner físico de mano o cámara
  name: string;
  category: string;
  unit: string; // Unidad, Caja, Libra, Metro, Servicio
  salePrice: number; // Sin IVA
  currentCost: number;
  stock: number;
  minStock: number;
  location?: string;
  isService?: boolean;
}

export interface KardexMovement {
  id: string;
  companyId: string;
  productId: string;
  productName: string;
  date: string;
  type: 'entrada_compra' | 'salida_venta' | 'ajuste_positivo' | 'ajuste_negativo' | 'merma';
  referenceDoc: string; // Ej: CCF-0012 o CMP-4401
  quantity: number;
  unitCost: number;
  totalCost: number;
  balanceQuantity: number;
  balanceUnitCost: number;
  balanceTotalCost: number;
  notes?: string;
}

// ----------------------------------------------------
// MÓDULO 3: RRHH 360° & PLANILLA LEGAL EL SALVADOR
// ----------------------------------------------------
export type ContractType = 'permanente' | 'servicios_profesionales' | 'plazo_fijo' | 'temporal';
export type PayrollPeriod = 'quincenal' | 'mensual';

export interface EmployeeEvaluation {
  id: string;
  date: string;
  score: number; // 1 - 5
  punctuality: number; // 1 - 5
  teamwork: number; // 1 - 5
  productivity: number; // 1 - 5
  feedback: string;
  evaluator: string;
}

export interface DisciplinaryAction {
  id: string;
  date: string;
  type: 'amonestacion_verbal' | 'amonestacion_escrita' | 'suspension_con_causa';
  reason: string;
  legalReference: string; // Art. Código de Trabajo SV
  notes?: string;
}

export interface Employee {
  id: string;
  companyId: string;
  branchId?: string;
  branchName?: string;
  code: string;
  firstName: string;
  lastName: string;
  dui: string;
  nit: string;
  isssNumber: string;
  afpNumber: string;
  afpName: 'Crecer' | 'Confía' | 'IPSFA' | 'UPISSS';
  position: string;
  department: string;
  baseSalary: number;
  contractType: ContractType;
  hireDate: string;
  bankName: string;
  bankAccountNumber: string;
  isActive: boolean;
  
  // HR 360 features
  rating?: number; // 1 - 5 overall score
  evaluations?: EmployeeEvaluation[];
  disciplinaryActions?: DisciplinaryAction[];
}

export interface PayrollDetail {
  employeeId: string;
  employeeName: string;
  dui: string;
  position: string;
  baseSalary: number; // Salario nominal del período
  overtimePay: number;
  bonuses: number;
  otherIncome: number;
  totalDevengado: number; // Total Ingresos
  
  // Detalle extendido interactivo (Código de Trabajo El Salvador)
  overtimeDiurnaHours?: number; // Horas extra diurnas (+100%)
  overtimeDiurnaAmount?: number;
  overtimeNocturnaHours?: number; // Horas extra nocturnas (+125%)
  overtimeNocturnaAmount?: number;
  nightHours?: number; // Nocturnidad ordinaria (+25%)
  nightHoursAmount?: number;
  tardinessDiscount?: number; // Descuento llegadas tardías / faltas
  advancesOrLoansDiscount?: number; // Anticipos o cuotas préstamo
  isIncluded?: boolean; // Marcar/desmarcar de planilla
  
  // Descuentos Legales Laborales
  isssLaboral: number; // Configurable % (Tope configurable)
  afpLaboral: number; // Configurable %
  baseImponibleRenta: number; // Devengado - ISSS - AFP
  rentaRetencion: number; // Tabla Configurable MH
  otherDeductions: number;
  totalDeducciones: number;
  
  liquidoPagar: number; // Neto a pagar al trabajador
  
  // Aportes Patronales
  isssPatronal: number; // Configurable %
  afpPatronal: number; // Configurable %
  insaforpPatronal: number; // Configurable %
  
  // Provisiones Laborales proporcionales
  provisionAguinaldo: number;
  provisionVacacion: number;
  provisionIndemnizacion: number;
}

export interface ProfessionalServiceRecord {
  id: string;
  companyId: string;
  providerName: string; // Nombre del profesional independiente
  dui?: string;
  nit: string;
  serviceConcept: string; // Concepto de los honorarios o asesoría
  periodMonth: number;
  periodYear: number;
  date: string;
  grossAmount: number; // Honorarios brutos pactados
  retentionRate: number; // 0.10 (10% Renta según Art. 156 Código Tributario SV)
  retentionAmount: number; // Monto retenido al fisco
  netAmount: number; // Líquido pagado al prestador
  receiptNumber?: string;
  status: 'pendiente' | 'pagado';
  paymentMethod?: string;
  notes?: string;
  createdAt: string;
}

export interface CandidateFolder {
  id: string;
  companyId: string;
  name: string; // Ej: Asistente Administrativo, Diseño Gráfico, Ventas & POS
  department: string;
  description?: string;
  createdAt: string;
}

export interface CandidateApplicant {
  id: string;
  companyId: string;
  folderId: string; // ID de la vacante / carpeta
  folderName: string;
  fullName: string;
  email: string;
  phone: string;
  appliedDate: string;
  expectedSalary?: number;
  experienceYears?: number;
  educationLevel?: string;
  status: 'recibido' | 'en_revision' | 'entrevista' | 'seleccionado' | 'descartado';
  rating: number; // 1 a 5 estrellas
  notes?: string;
  cvFileName?: string;
  cvSummaryOrUrl?: string; // Enlace, resumen o contenido de CV
  skills?: string[];
  createdAt: string;
}

export interface Payroll {
  id: string;
  companyId: string;
  periodNumber: number;
  periodType: PayrollPeriod;
  year: number;
  month: number;
  startDate: string;
  endDate: string;
  paymentDate: string;
  status: 'borrador' | 'aprobada' | 'pagada';
  
  details: PayrollDetail[];
  
  totalDevengado: number;
  totalIsssLaboral: number;
  totalAfpLaboral: number;
  totalRentaRetenida: number;
  totalLiquido: number;
  
  totalIsssPatronal: number;
  totalAfpPatronal: number;
  totalInsaforpPatronal: number;
  totalProvisiones: number;
  costoTotalEmpresa: number;
  
  accountingEntryId?: string;
  createdAt: string;
}

// ----------------------------------------------------
// MÓDULO 4: TESORERÍA, BANCOS & FLUJO DE CAJA
// ----------------------------------------------------
export type AccountType = 'caja_general' | 'caja_chica' | 'banco_corriente' | 'banco_ahorro';

export interface BankAccount {
  id: string;
  companyId: string;
  accountName: string;
  bankName: string;
  accountNumber: string;
  accountType: AccountType;
  accountingCode: string; // Ej: 1101-01, 1101-02
  initialBalance: number;
  currentBalance: number;
  currency: string;
}

export interface TreasuryMovement {
  id: string;
  companyId: string;
  branchId?: string;
  branchName?: string;
  bankAccountId: string;
  bankAccountName: string;
  date: string;
  type: 'ingreso_venta' | 'abono_cxc' | 'pago_proveedor' | 'pago_planilla' | 'transferencia_interna' | 'gasto_menor' | 'otro_ingreso';
  amount: number;
  referenceNumber: string;
  description: string;
  isReconciled: boolean;
  reconciliationDate?: string;
  accountingEntryId?: string;
}

export interface RealCashFlowPeriod {
  periodLabel: string;
  startDate: string;
  endDate: string;
  openingCash: number;
  
  // Real Inflows
  inflowsContadoSales: number;
  inflowsCxcCollections: number;
  inflowsOther: number;
  totalInflows: number;
  
  // Real Outflows
  outflowsContadoPurchases: number;
  outflowsCxpPayments: number;
  outflowsPayrollNet: number;
  outflowsPayrollTaxesPatronal: number; // ISSS + AFP + INSAFORP
  outflowsTaxesMH: number; // IVA F07 + Pago a cuenta
  outflowsOperating: number;
  totalOutflows: number;
  
  netCashFlow: number;
  closingCash: number;
}

export interface CashFlowProjectionItem {
  date: string;
  periodLabel: string;
  openingBalance: number;
  cxcInflows: number;
  projectedSalesInflows: number;
  totalInflows: number;
  cxpOutflows: number;
  payrollOutflows: number;
  taxesOutflows: number; // IVA, Pago a Cuenta
  operatingOutflows: number;
  totalOutflows: number;
  netCashFlow: number;
  closingBalance: number;
  status: 'saludable' | 'alerta' | 'deficit';
}

// ----------------------------------------------------
// MÓDULO 5: MOTOR CONTABLE & CATÁLOGO CONFIGURABLE
// ----------------------------------------------------
export type AccountCategory = 'activo' | 'pasivo' | 'patrimonio' | 'costos' | 'gastos' | 'ingresos';

export interface AccountNode {
  code: string; // Ej: "1101-01"
  name: string;
  category: AccountCategory;
  level: number;
  parentCode?: string;
  isMovement: boolean; // Si acepta transacciones directas
  isSystem?: boolean; // Cuentas protegidas del motor contable
  debitBalance: number;
  creditBalance: number;
  balance: number;
}

export interface JournalEntryLine {
  accountCode: string;
  accountName: string;
  debit: number; // Debe (Cargo)
  credit: number; // Haber (Abono)
  concept: string;
}

export interface JournalEntry {
  id: string;
  companyId: string;
  entryNumber: number; // Correlativo de partida
  date: string;
  concept: string;
  sourceModule: 'ventas' | 'compras' | 'planilla' | 'tesoreria' | 'inventario' | 'manual' | 'cierre';
  referenceDoc?: string;
  lines: JournalEntryLine[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
  status: 'asentada' | 'borrador';
  createdAt: string;
}

// ----------------------------------------------------
// MÓDULO 6: AI BUSINESS COPILOT & DYNAMIC CHARTS
// ----------------------------------------------------
export interface DynamicChartWidget {
  id: string;
  title: string;
  description: string;
  chartType: 'bar' | 'area' | 'pie' | 'line';
  data: Array<{
    name: string;
    value: number;
    secondaryValue?: number;
    color?: string;
  }>;
  insights: string[];
  createdAt: string;
  createdByAI?: boolean;
}

export interface FinancialDiagnosis {
  healthScore: number;
  statusLabel: string;
  summary: string;
  keyStrengths: string[];
  criticalAlerts: string[];
  recommendations: string[];
}
