import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  Eye,
  FileText,
  DollarSign,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  Building,
  Printer,
  QrCode,
  ShieldCheck,
  X,
  CreditCard,
  ArrowDownLeft,
  Trash2,
  Edit2,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Tag,
  Star,
  Clock,
  ChevronRight,
  Database,
  History,
  Users,
  MessageSquare,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ShoppingBag,
  Layers,
  ScanBarcode,
  Camera,
  Zap,
  Store,
  ThumbsDown,
  Percent,
} from 'lucide-react';
import {
  Invoice,
  InvoiceType,
  PaymentCondition,
  Customer,
  CustomerStage,
  CustomerGender,
  CustomerAgeRange,
  AcquisitionChannel,
  CustomerNote,
  LeadStatus,
  Product,
} from '../../types';
import { formatCurrencyUSD, calculateSaleTaxes } from '../../utils/salvadoranTax';
import {
  SALVADORAN_DEPARTMENTS,
  getMunicipalitiesForDepartment,
} from '../../utils/salvadoranGeography';
import { CustomerMiniDashboardModal } from './CustomerMiniDashboardModal';
import { BarcodeScannerModal } from '../common/BarcodeScannerModal';

interface SalesModuleProps {
  isNewSaleModalOpen: boolean;
  onCloseNewSaleModal: () => void;
  onOpenNewSaleModal: () => void;
}

export const SalesModule: React.FC<SalesModuleProps> = ({
  isNewSaleModalOpen,
  onCloseNewSaleModal,
  onOpenNewSaleModal,
}) => {
  const {
    invoices,
    customers,
    products,
    currentCompany,
    branches,
    selectedBranchId,
    setSelectedBranchId,
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
    bankAccounts,
    toggleDteMode,
    setActiveModule,
  } = useERP();

  const [activeTab, setActiveTab] = useState<'invoices' | 'cxc' | 'payments' | 'crm' | 'database'>('invoices');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [leadStatusFilter, setLeadStatusFilter] = useState<string>('all');
  const [deptFilter, setDeptFilter] = useState<string>('all');

  // Barcode Scanner & Feedback State
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [barcodeScanInput, setBarcodeScanInput] = useState('');
  const [scanFeedbackToast, setScanFeedbackToast] = useState<string | null>(null);

  // Viewing / Modals state
  const [selectedInvoiceForView, setSelectedInvoiceForView] = useState<Invoice | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);

  // Customer Modals & Details
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomerForDetail, setSelectedCustomerForDetail] = useState<Customer | null>(null);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteType, setNewNoteType] = useState<'llamada' | 'whatsapp' | 'reunion' | 'acuerdo' | 'reclamo'>('whatsapp');

  // Customer Form State
  const [customerForm, setCustomerForm] = useState<Omit<Customer, 'id'>>({
    name: '',
    tradeName: '',
    nrc: '',
    nit: '',
    dui: '',
    giro: '',
    address: '',
    department: 'San Salvador',
    municipality: 'San Salvador Centro (San Salvador, Mejicanos, Ayutuxtepeque, Cuscatancingo, Ciudad Delgado)',
    phone: '',
    email: '',
    gender: 'femenino',
    ageRange: '26-35',
    acquisitionChannel: 'whatsapp',
    stage: 'prospecto',
    rating: 5,
    isGranContribuyente: false,
    creditLimit: 1000,
    paymentTermDays: 30,
  });

  // Payment Modal State
  const [paymentModalInvoice, setPaymentModalInvoice] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentTargetAccount, setPaymentTargetAccount] = useState<string>(bankAccounts[0]?.id || '');
  const [paymentMethod, setPaymentMethod] = useState<'transferencia' | 'efectivo' | 'cheque' | 'tarjeta'>('transferencia');
  const [paymentReceiptNumber, setPaymentReceiptNumber] = useState<string>('');
  const [paymentToDeleteId, setPaymentToDeleteId] = useState<string | null>(null);

  // New Invoice Form State
  const [invoiceType, setInvoiceType] = useState<InvoiceType>('credito_fiscal');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || '');
  const [invoiceBranchId, setInvoiceBranchId] = useState<string>(branches[0]?.id || '');
  const [paymentCondition, setPaymentCondition] = useState<PaymentCondition>('credito_30');
  const [invoiceNotes, setInvoiceNotes] = useState<string>('');
  
  // Quick Add Customer Inline inside Sale Modal
  const [isQuickCustomerOpen, setIsQuickCustomerOpen] = useState(false);
  const [quickCustomerName, setQuickCustomerName] = useState('');
  const [quickCustomerNit, setQuickCustomerNit] = useState('');
  const [quickCustomerNrc, setQuickCustomerNrc] = useState('');
  const [quickCustomerPhone, setQuickCustomerPhone] = useState('');
  const [quickCustomerDept, setQuickCustomerDept] = useState('San Salvador');

  const [invoiceItems, setInvoiceItems] = useState<
    Array<{
      productId: string;
      productCode: string;
      description: string;
      quantity: number;
      unitPrice: number;
      unitCost: number;
      total: number;
    }>
  >([
    {
      productId: products[0]?.id || '',
      productCode: products[0]?.code || '',
      description: products[0]?.name || '',
      quantity: 1,
      unitPrice: products[0]?.salePrice || 100,
      unitCost: products[0]?.currentCost || 50,
      total: products[0]?.salePrice || 100,
    },
  ]);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) || customers[0];

  // Calculated taxes for modal form
  const subtotalGravado = invoiceItems.reduce((acc, it) => acc + it.total, 0);
  const taxCalculations = calculateSaleTaxes({
    type: invoiceType,
    subtotalGravado,
    subtotalExento: 0,
    subtotalNoSujeto: 0,
    isCompanyGranContribuyente: currentCompany.isGranContribuyente,
    isCustomerGranContribuyente: selectedCustomer?.isGranContribuyente || false,
  });

  // Handle Dynamic Geography Change
  const handleDepartmentChange = (deptName: string) => {
    const munis = getMunicipalitiesForDepartment(deptName);
    setCustomerForm((prev) => ({
      ...prev,
      department: deptName,
      municipality: munis[0] || '',
    }));
  };

  const handleAddItem = () => {
    const defaultProd = products[0];
    if (!defaultProd) return;
    setInvoiceItems((prev) => [
      ...prev,
      {
        productId: defaultProd.id,
        productCode: defaultProd.code,
        description: defaultProd.name,
        quantity: 1,
        unitPrice: defaultProd.salePrice,
        unitCost: defaultProd.currentCost,
        total: defaultProd.salePrice,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (invoiceItems.length > 1) {
      setInvoiceItems((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleProductChange = (index: number, productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;
    setInvoiceItems((prev) =>
      prev.map((it, i) =>
        i === index
          ? {
              ...it,
              productId: prod.id,
              productCode: prod.code,
              description: prod.name,
              unitPrice: prod.salePrice,
              unitCost: prod.currentCost,
              total: prod.salePrice * it.quantity,
            }
          : it
      )
    );
  };

  const handleQuantityChange = (index: number, qty: number) => {
    const validQty = Math.max(1, qty);
    setInvoiceItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, quantity: validQty, total: it.unitPrice * validQty } : it))
    );
  };

  const handlePriceChange = (index: number, price: number) => {
    const validPrice = Math.max(0, price);
    setInvoiceItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, unitPrice: validPrice, total: validPrice * it.quantity } : it))
    );
  };

  // Audio Confirmation Beep
  const playBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1150, ctx.currentTime);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      }
    } catch (e) {}
  };

  // Barcode Product Scanner Dispatcher
  const handleProductScanned = (product: Product) => {
    playBeep();
    setInvoiceItems((prev) => {
      const existingIdx = prev.findIndex((item) => item.productId === product.id);
      if (existingIdx >= 0) {
        const copy = [...prev];
        const updatedQty = copy[existingIdx].quantity + 1;
        copy[existingIdx] = {
          ...copy[existingIdx],
          quantity: updatedQty,
          total: Number((updatedQty * copy[existingIdx].unitPrice).toFixed(2)),
        };
        return copy;
      } else {
        const filtered = prev.filter((it) => it.productId && it.productId.trim() !== '');
        return [
          ...filtered,
          {
            productId: product.id,
            productCode: product.code,
            description: product.name,
            quantity: 1,
            unitPrice: product.salePrice,
            unitCost: product.currentCost,
            total: product.salePrice,
          },
        ];
      }
    });

    setScanFeedbackToast(`✓ Escaneado: [${product.code}] ${product.name} ($${product.salePrice.toFixed(2)})`);
    setTimeout(() => setScanFeedbackToast(null), 3000);
  };

  const handleBarcodeQuickSubmit = (rawCode: string) => {
    const trimmed = rawCode.trim();
    if (!trimmed) return;
    const found = products.find(
      (p) =>
        (p.barcode && p.barcode.toLowerCase() === trimmed.toLowerCase()) ||
        p.code.toLowerCase() === trimmed.toLowerCase()
    );
    if (found) {
      handleProductScanned(found);
      setBarcodeScanInput('');
    } else {
      setScanFeedbackToast(`❌ Código "${trimmed}" no encontrado en el catálogo.`);
      setTimeout(() => setScanFeedbackToast(null), 3000);
    }
  };

  const handleQuickCreateCustomer = () => {
    if (!quickCustomerName.trim()) return;
    const newCust = createCustomer({
      name: quickCustomerName,
      nit: quickCustomerNit || '0614-000000-000-0',
      nrc: quickCustomerNrc || '',
      phone: quickCustomerPhone || '+503 2200-0000',
      address: quickCustomerDept + ', El Salvador',
      department: quickCustomerDept,
      municipality: getMunicipalitiesForDepartment(quickCustomerDept)[0] || '',
      email: `${quickCustomerName.toLowerCase().replace(/\s+/g, '')}@cliente.sv`,
      isGranContribuyente: false,
      creditLimit: 1000,
      paymentTermDays: 30,
      stage: 'primer_compra',
      gender: 'corporativo',
      acquisitionChannel: 'tienda_fisica',
    });
    setSelectedCustomerId(newCust.id);
    setIsQuickCustomerOpen(false);
    setQuickCustomerName('');
    setQuickCustomerNit('');
    setQuickCustomerNrc('');
  };

  const handleSubmitInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    const correlativePrefix =
      invoiceType === 'credito_fiscal'
        ? 'CCF'
        : invoiceType === 'factura_consumidor_final'
        ? 'FAC'
        : invoiceType === 'exportacion'
        ? 'EXP'
        : 'NC';
    const nextNumber = String(invoices.length + 101).padStart(6, '0');
    const correlativeNumber = `${correlativePrefix}-${nextNumber}`;
    const dteCode = `DTE-${invoiceType === 'credito_fiscal' ? '03' : '01'}-M001P001-${nextNumber.padStart(15, '0')}`;

    const now = new Date();
    const dueDate = new Date();
    if (paymentCondition === 'credito_15') dueDate.setDate(now.getDate() + 15);
    else if (paymentCondition === 'credito_30') dueDate.setDate(now.getDate() + 30);
    else if (paymentCondition === 'credito_60') dueDate.setDate(now.getDate() + 60);

    const isPaidNow = paymentCondition === 'contado';
    const branchObj = branches.find((b) => b.id === invoiceBranchId) || branches[0];

    const created = createInvoice({
      branchId: branchObj?.id,
      branchName: branchObj?.name,
      type: invoiceType,
      correlativeNumber,
      dteCode,
      controlNumber: `DTE-SV-2026-${nextNumber}`,
      date: now.toISOString().split('T')[0],
      dueDate: dueDate.toISOString().split('T')[0],
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      customerNrc: selectedCustomer.nrc,
      customerNit: selectedCustomer.nit,
      customerIsGranContribuyente: selectedCustomer.isGranContribuyente,
      paymentCondition,
      status: isPaidNow ? 'pagada' : 'emitida',
      notes: invoiceNotes,
      items: invoiceItems.map((item, idx) => ({
        id: `item_${Date.now()}_${idx}`,
        ...item,
      })),
      sumasGravadas: taxCalculations.sumasGravadas,
      sumasExentas: taxCalculations.sumasExentas,
      sumasNoSujetas: taxCalculations.sumasNoSujetas,
      iva13: taxCalculations.iva13,
      ivaRetenido1: taxCalculations.ivaRetenido1,
      ivaPercibido1: taxCalculations.ivaPercibido1,
      totalPagar: taxCalculations.totalPagar,
      saldoPendiente: isPaidNow ? 0 : taxCalculations.totalPagar,
    });

    onCloseNewSaleModal();
    setSelectedInvoiceForView(created);
  };

  const handleOpenPayment = (inv: Invoice) => {
    setPaymentModalInvoice(inv);
    setPaymentAmount(inv.saldoPendiente);
    setPaymentReceiptNumber(`REC-${Date.now().toString().slice(-5)}`);
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalInvoice) return;

    registerCustomerPayment({
      invoiceId: paymentModalInvoice.id,
      invoiceNumber: paymentModalInvoice.correlativeNumber,
      customerId: paymentModalInvoice.customerId,
      customerName: paymentModalInvoice.customerName,
      date: new Date().toISOString().split('T')[0],
      amount: Number(paymentAmount),
      paymentMethod,
      targetAccountId: paymentTargetAccount,
      receiptNumber: paymentReceiptNumber,
    });

    setPaymentModalInvoice(null);
  };

  const handleOpenCreateCustomer = () => {
    setEditingCustomer(null);
    setCustomerForm({
      name: '',
      tradeName: '',
      nrc: '',
      nit: '',
      dui: '',
      giro: '',
      address: '',
      department: 'San Salvador',
      municipality: 'San Salvador Centro (San Salvador, Mejicanos, Ayutuxtepeque, Cuscatancingo, Ciudad Delgado)',
      phone: '',
      email: '',
      gender: 'femenino',
      ageRange: '26-35',
      acquisitionChannel: 'whatsapp',
      stage: 'prospecto',
      rating: 5,
      isGranContribuyente: false,
      creditLimit: 1000,
      paymentTermDays: 30,
    });
    setIsCustomerModalOpen(true);
  };

  const handleOpenEditCustomer = (c: Customer) => {
    setEditingCustomer(c);
    setCustomerForm({
      name: c.name,
      tradeName: c.tradeName || '',
      nrc: c.nrc || '',
      nit: c.nit,
      dui: c.dui || '',
      giro: c.giro || '',
      address: c.address,
      department: c.department || 'San Salvador',
      municipality: c.municipality || getMunicipalitiesForDepartment(c.department)[0] || '',
      phone: c.phone,
      email: c.email,
      gender: c.gender || 'femenino',
      ageRange: c.ageRange || '26-35',
      acquisitionChannel: c.acquisitionChannel || 'whatsapp',
      stage: c.stage || 'prospecto',
      rating: c.rating || 5,
      isGranContribuyente: c.isGranContribuyente,
      creditLimit: c.creditLimit,
      paymentTermDays: c.paymentTermDays,
    });
    setIsCustomerModalOpen(true);
  };

  const handleSaveCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCustomer) {
      updateCustomer(editingCustomer.id, customerForm);
    } else {
      createCustomer(customerForm);
    }
    setIsCustomerModalOpen(false);
  };

  const handleAddNoteToCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerForDetail || !newNoteContent.trim()) return;
    addCustomerNote(selectedCustomerForDetail.id, {
      type: newNoteType,
      content: newNoteContent.trim(),
      author: 'Usuario Activo',
    });
    setNewNoteContent('');
    // refresh selected customer reference
    const updated = customers.find((c) => c.id === selectedCustomerForDetail.id);
    if (updated) setSelectedCustomerForDetail(updated);
  };

  // Filtered invoices
  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.correlativeNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customerNit.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    const matchesBranch = branchFilter === 'all' || inv.branchId === branchFilter;
    return matchesSearch && matchesStatus && matchesBranch;
  });

  // Filtered CxC
  const cxcInvoices = invoices.filter(
    (inv) => inv.status !== 'pagada' && inv.status !== 'anulada' && (inv.saldoPendiente ?? inv.totalPagar) > 0
  );

  // Filtered Customers
  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.tradeName && c.tradeName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      c.nit.includes(searchTerm) ||
      (c.phone && c.phone.includes(searchTerm));
    const matchesStage = stageFilter === 'all' || c.stage === stageFilter;
    const matchesLeadStatus = leadStatusFilter === 'all' || (c.leadStatus || 'contactado') === leadStatusFilter;
    const matchesDept = deptFilter === 'all' || c.department === deptFilter;
    return matchesSearch && matchesStage && matchesDept && matchesLeadStatus;
  });

  const getLeadStatusBadge = (leadStatus?: LeadStatus) => {
    switch (leadStatus) {
      case 'nuevo':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">🆕 Nuevo</span>;
      case 'contactado':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">📞 Contactado</span>;
      case 'cotizado':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">📄 Cotizado</span>;
      case 'negociacion':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">🤝 Negociación</span>;
      case 'ganado_cerrado':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">🎉 Vendido / Cerrado</span>;
      case 'perdido':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">❌ No Vendido</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">Contactado</span>;
    }
  };

  const getStageBadge = (stage?: CustomerStage) => {
    switch (stage) {
      case 'vip':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">🌟 VIP</span>;
      case 'frecuente':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">✓ Frecuente</span>;
      case 'primer_compra':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300">🛒 1ra Compra</span>;
      case 'negociacion':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">💬 Negociación</span>;
      case 'cotizacion':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">📄 Cotización</span>;
      case 'contactado':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">📞 Contactado</span>;
      case 'inactivo':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400">⏸ Inactivo</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">🎯 Prospecto</span>;
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header & Sub-Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Ventas, Facturación Electrónica & CRM
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
              DTE El Salvador
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestión comercial 360°: Cartera de clientes con geografía de El Salvador, emisión de CCF/Facturas, CxC, cobros y base de datos auditada.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Branch Filter Header Pill */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold">
            <Building className="w-3.5 h-3.5 text-indigo-500" />
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="bg-transparent border-none text-xs outline-none text-slate-800 dark:text-slate-200 cursor-pointer font-bold"
            >
              <option value="all">🏢 Todas las Sucursales</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <button
            id="sales-open-pos-btn"
            type="button"
            onClick={() => setActiveModule('pos_terminal')}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition cursor-pointer"
            title="Abrir Terminal de Ventas POS con Lector de Código de Barras"
          >
            <ScanBarcode className="w-4 h-4" />
            <span>Terminal POS (Escáner)</span>
          </button>

          <button
            onClick={handleOpenCreateCustomer}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-indigo-500" />
            <span>Nuevo Cliente CRM</span>
          </button>

          <button
            onClick={onOpenNewSaleModal}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Emitir DTE / Factura</span>
          </button>
        </div>
      </div>

      {/* Quick POS Terminal Callout Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 rounded-2xl p-4 border border-indigo-800/80 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/30">
            <ScanBarcode className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">
                Terminal de Ventas Rápida con Lector de Código de Barras
              </h3>
              <span className="text-[10px] bg-emerald-500 text-white font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                Activo
              </span>
            </div>
            <p className="text-xs text-indigo-200 mt-0.5">
              Pase la pistola de código de barras para sumar automáticamente productos, calcular IVA 13% y vuelto en efectivo al instante.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setActiveModule('pos_terminal')}
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white hover:bg-indigo-50 text-indigo-950 font-black text-xs transition flex items-center justify-center gap-1.5 shadow-md shrink-0 cursor-pointer"
        >
          <Zap className="w-3.5 h-3.5 text-indigo-600 fill-indigo-600" />
          <span>Ir a Caja POS (Venta Rápida)</span>
        </button>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'invoices'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Documentos Emitidos ({invoices.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('cxc')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'cxc'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Cuentas por Cobrar (CxC)</span>
          {cxcInvoices.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-mono">
              {cxcInvoices.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'payments'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Historial de Abonos ({customerPayments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('crm')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'crm'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Cartera & CRM Clientes ({customers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('database')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'database'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Database className="w-3.5 h-3.5 text-indigo-400" />
          <span>Base de Datos & Auditoría</span>
        </button>
      </div>

      {/* ---------------------------------------------------- */}
      {/* TAB 1: INVOICES LIST (Documentos Emitidos) */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 flex-1">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por N° Correlativo, Cliente o NIT..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none outline-none text-xs w-full text-slate-800 dark:text-slate-200 placeholder-slate-400"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400">Sucursal:</span>
                <select
                  value={branchFilter}
                  onChange={(e) => setBranchFilter(e.target.value)}
                  className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none font-medium"
                >
                  <option value="all">Todas</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400">Estado:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none"
                >
                  <option value="all">Todos</option>
                  <option value="emitida">Emitida</option>
                  <option value="pagada">Pagada</option>
                  <option value="parcial">Parcial</option>
                  <option value="anulada">Anulada</option>
                </select>
              </div>
            </div>
          </div>

          {/* Invoices Table */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5">Correlativo / Tipo</th>
                    <th className="p-3.5">Sucursal</th>
                    <th className="p-3.5">Cliente</th>
                    <th className="p-3.5">Fecha / Venc.</th>
                    <th className="p-3.5 text-right">Sumas Gravadas</th>
                    <th className="p-3.5 text-right">IVA 13%</th>
                    <th className="p-3.5 text-right">Total Pagar</th>
                    <th className="p-3.5 text-right">Saldo</th>
                    <th className="p-3.5 text-center">Estado</th>
                    <th className="p-3.5 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredInvoices.map((inv) => (
                    <tr
                      key={inv.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition"
                    >
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Receipt className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{inv.correlativeNumber}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 capitalize">
                          {inv.type.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {inv.branchName || 'Sucursal Principal'}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{inv.customerName}</p>
                        <p className="text-[10px] text-slate-400">NIT: {inv.customerNit}</p>
                      </td>
                      <td className="p-3.5">
                        <p className="text-slate-700 dark:text-slate-300 font-medium">{inv.date}</p>
                        <p className="text-[10px] text-slate-400">Vence: {inv.dueDate}</p>
                      </td>
                      <td className="p-3.5 text-right font-mono font-medium text-slate-700 dark:text-slate-300">
                        {formatCurrencyUSD(inv.sumasGravadas)}
                      </td>
                      <td className="p-3.5 text-right font-mono font-medium text-indigo-600 dark:text-indigo-400">
                        {formatCurrencyUSD(inv.iva13)}
                      </td>
                      <td className="p-3.5 text-right font-mono font-black text-slate-900 dark:text-white">
                        {formatCurrencyUSD(inv.totalPagar)}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-rose-600">
                        {inv.saldoPendiente > 0 ? formatCurrencyUSD(inv.saldoPendiente) : '$0.00'}
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            inv.status === 'pagada'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : inv.status === 'parcial'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : inv.status === 'anulada'
                              ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 line-through'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          }`}
                        >
                          {inv.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedInvoiceForView(inv)}
                            className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 transition cursor-pointer"
                            title="Ver DTE Oficial"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {inv.saldoPendiente > 0 && inv.status !== 'anulada' && (
                            <button
                              onClick={() => handleOpenPayment(inv)}
                              className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-100 transition cursor-pointer"
                              title="Registrar Abono"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 2: CUENTAS POR COBRAR (CxC) */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'cxc' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20">
              <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                Total Cartera Pendiente (CxC)
              </span>
              <h3 className="text-xl font-black text-amber-950 dark:text-amber-100 mt-1 font-mono">
                {formatCurrencyUSD(cxcInvoices.reduce((acc, i) => acc + (i.saldoPendiente ?? i.totalPagar), 0))}
              </h3>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <span className="text-xs font-semibold text-slate-500">Facturas con Saldo Activo</span>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                {cxcInvoices.length} créditos activos
              </h3>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <span className="text-xs font-semibold text-slate-500">Plazo Promedio Otorgado</span>
              <h3 className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                30 Días Crédito
              </h3>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5">Documento</th>
                    <th className="p-3.5">Cliente</th>
                    <th className="p-3.5">Condición</th>
                    <th className="p-3.5">Fecha Vencimiento</th>
                    <th className="p-3.5 text-right">Total Factura</th>
                    <th className="p-3.5 text-right">Saldo Pendiente</th>
                    <th className="p-3.5 text-center">Acción de Cobro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {cxcInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                        {inv.correlativeNumber}
                      </td>
                      <td className="p-3.5 font-semibold text-slate-800 dark:text-slate-200">
                        {inv.customerName}
                      </td>
                      <td className="p-3.5 capitalize text-slate-600 dark:text-slate-300">
                        {inv.paymentCondition.replace('_', ' ')}
                      </td>
                      <td className="p-3.5 text-slate-600 font-mono">
                        {inv.dueDate}
                      </td>
                      <td className="p-3.5 text-right font-mono text-slate-600">
                        {formatCurrencyUSD(inv.totalPagar)}
                      </td>
                      <td className="p-3.5 text-right font-mono font-black text-rose-600">
                        {formatCurrencyUSD(inv.saldoPendiente)}
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => handleOpenPayment(inv)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1 mx-auto shadow-xs"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>Registrar Abono</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 3: HISTORIAL DE ABONOS & COBROS */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-600" />
                <span>Registro de Abonos y Cobranzas Recibidas</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Control y conciliación de cada pago recibido de clientes con número de recibo y cuenta bancaria de ingreso.
              </p>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-400 font-semibold block">Total Cobrado Registrado:</span>
              <span className="text-lg font-black text-emerald-600 font-mono">
                {formatCurrencyUSD(customerPayments.reduce((sum, p) => sum + p.amount, 0))}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5">N° Recibo</th>
                    <th className="p-3.5">Fecha</th>
                    <th className="p-3.5">Cliente</th>
                    <th className="p-3.5">Factura Aplicada</th>
                    <th className="p-3.5">Método de Pago</th>
                    <th className="p-3.5">Cuenta Destino</th>
                    <th className="p-3.5 text-right">Monto Abonado</th>
                    <th className="p-3.5 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {customerPayments.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        No hay abonos registrados aún. Los cobros que realices aparecerán en esta bitácora.
                      </td>
                    </tr>
                  ) : (
                    customerPayments.map((p) => {
                      const account = bankAccounts.find((b) => b.id === p.targetAccountId);
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                          <td className="p-3.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            {p.receiptNumber}
                          </td>
                          <td className="p-3.5 text-slate-600 font-mono">{p.date}</td>
                          <td className="p-3.5 font-semibold text-slate-800 dark:text-slate-200">
                            {p.customerName}
                          </td>
                          <td className="p-3.5 font-mono text-slate-600">{p.invoiceNumber}</td>
                          <td className="p-3.5 capitalize">
                            <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                              {p.paymentMethod}
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-600">{account?.accountName || 'Caja General'}</td>
                          <td className="p-3.5 text-right font-mono font-black text-emerald-600 text-sm">
                            {formatCurrencyUSD(p.amount)}
                          </td>
                          <td className="p-3.5 text-center">
                            <button
                              onClick={() => {
                                if (confirm(`¿Revertir y eliminar el abono ${p.receiptNumber} por ${formatCurrencyUSD(p.amount)}?`)) {
                                  deleteCustomerPayment(p.id);
                                }
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                              title="Revertir este abono"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 4: CARTERA & CRM DE CLIENTES */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'crm' && (
        <div className="space-y-6">
          {/* CRM Demographics Summary Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Clientes CRM</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">{customers.length}</span>
                <span className="text-xs text-emerald-600 font-semibold">100% Activos</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] font-bold text-pink-600 dark:text-pink-400 uppercase tracking-wider">Mujeres (Femenino)</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-pink-600 dark:text-pink-400 font-mono">
                  {customers.filter((c) => c.gender === 'femenino').length}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  ({customers.length > 0 ? ((customers.filter((c) => c.gender === 'femenino').length / customers.length) * 100).toFixed(0) : 0}%)
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">Hombres (Masculino)</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-cyan-600 dark:text-cyan-400 font-mono">
                  {customers.filter((c) => c.gender === 'masculino').length}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  ({customers.length > 0 ? ((customers.filter((c) => c.gender === 'masculino').length / customers.length) * 100).toFixed(0) : 0}%)
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Empresas / B2B</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                  {customers.filter((c) => c.gender === 'corporativo').length}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  ({customers.length > 0 ? ((customers.filter((c) => c.gender === 'corporativo').length / customers.length) * 100).toFixed(0) : 0}%)
                </span>
              </div>
            </div>
          </div>

          {/* CRM Filter Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por Nombre, Giro, NIT, Teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none outline-none text-xs w-full text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400">Estado Lead:</span>
                <select
                  value={leadStatusFilter}
                  onChange={(e) => setLeadStatusFilter(e.target.value)}
                  className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold"
                >
                  <option value="all">Todos los Estados Lead</option>
                  <option value="nuevo">Nuevo</option>
                  <option value="contactado">Contactado</option>
                  <option value="cotizado">Cotizado</option>
                  <option value="negociacion">Negociación</option>
                  <option value="ganado_cerrado">Vendido / Ganado</option>
                  <option value="perdido">No Vendido / Perdido</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400">Fase CRM:</span>
                <select
                  value={stageFilter}
                  onChange={(e) => setStageFilter(e.target.value)}
                  className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                >
                  <option value="all">Todas las Fases</option>
                  <option value="prospecto">Prospecto</option>
                  <option value="contactado">Contactado</option>
                  <option value="cotizacion">Cotización</option>
                  <option value="negociacion">Negociación</option>
                  <option value="primer_compra">Primera Compra</option>
                  <option value="frecuente">Frecuente</option>
                  <option value="vip">VIP</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400">Departamento:</span>
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                >
                  <option value="all">Todos los Departamentos</option>
                  {SALVADORAN_DEPARTMENTS.map((d) => (
                    <option key={d.code} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Customer Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCustomers.map((c) => {
              const genderLabel =
                c.gender === 'femenino'
                  ? 'Mujer (Femenino)'
                  : c.gender === 'masculino'
                  ? 'Hombre (Masculino)'
                  : c.gender === 'corporativo'
                  ? 'Empresa / B2B'
                  : 'Otro';
              const genderColor =
                c.gender === 'femenino'
                  ? 'bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-300'
                  : c.gender === 'masculino'
                  ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300'
                  : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300';

              const customerSalesCount = invoices.filter((i) => i.customerId === c.id).length;
              const customerTotalSpent = invoices
                .filter((i) => i.customerId === c.id && i.status !== 'anulada')
                .reduce((sum, i) => sum + i.totalPagar, 0);

              return (
                <div
                  key={c.id}
                  className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3 relative flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white">{c.name}</h3>
                        <p className="text-xs text-slate-500">{c.tradeName || c.giro || 'Cliente General'}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {getLeadStatusBadge(c.leadStatus)}
                        {getStageBadge(c.stage)}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${genderColor}`}>
                          {genderLabel}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs space-y-1.5 text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800 mt-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" /> Depto / Municipio:
                        </span>
                        <span className="font-semibold text-slate-700 dark:text-slate-200 text-right truncate max-w-[170px]">
                          {typeof c.department === 'string' ? c.department : (c.department as any)?.name || 'San Salvador'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Canal Captación:</span>
                        <span className="capitalize font-semibold text-indigo-600 dark:text-indigo-400">
                          {c.acquisitionChannel?.replace('_', ' ') || 'Directo'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Compras Realizadas:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                          {customerSalesCount} facturas ({formatCurrencyUSD(customerTotalSpent)})
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">NIT / DUI:</span>
                        <span className="font-mono text-slate-700 dark:text-slate-300">{c.nit}</span>
                      </div>

                      {c.phone && (
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Teléfono:</span>
                          <span className="text-slate-700 dark:text-slate-300">{c.phone}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[11px] pt-1">
                        <span className="text-slate-400">Límite Crédito:</span>
                        <span className="font-semibold text-emerald-600 font-mono">
                          {formatCurrencyUSD(c.creditLimit)} ({c.paymentTermDays} días)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Detail / Notes */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setSelectedCustomerForDetail(c)}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 hover:text-indigo-900 dark:hover:bg-indigo-900/60 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer border border-indigo-200 dark:border-indigo-800/60"
                    >
                      <Eye className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Mini-Dashboard CRM</span>
                      {c.notesTimeline && c.notesTimeline.length > 0 && (
                        <span className="bg-indigo-200 dark:bg-indigo-850 text-indigo-900 dark:text-indigo-200 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                          {c.notesTimeline.length}
                        </span>
                      )}
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditCustomer(c)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                        title="Editar Cliente"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`¿Eliminar cliente ${c.name} del CRM?`)) {
                            deleteCustomer(c.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                        title="Eliminar Cliente"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 5: BASE DE DATOS & AUDITORÍA DE VENTAS */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'database' && (
        <div className="space-y-4">
          <div className="bg-amber-50/60 dark:bg-amber-950/20 p-4 rounded-2xl border border-amber-200 dark:border-amber-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2">
                <Database className="w-4 h-4 text-amber-600" />
                <span>Base de Datos Central & Panel de Auditoría de Ventas</span>
              </h3>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                Panel avanzado para consultar, editar o eliminar registros de venta. Cualquier eliminación o anulación revierte automáticamente el inventario (Kardex) y las partidas contables.
              </p>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-amber-600 text-white text-xs font-bold font-mono">
              {invoices.length} Registros en Base de Datos
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5">ID / Correlativo</th>
                    <th className="p-3.5">Sucursal</th>
                    <th className="p-3.5">Cliente</th>
                    <th className="p-3.5">Fecha</th>
                    <th className="p-3.5 text-right">Monto Total</th>
                    <th className="p-3.5 text-center">Estado</th>
                    <th className="p-3.5 text-center">Acciones de Base de Datos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                        {inv.correlativeNumber}
                        <span className="block text-[10px] text-slate-400 font-sans">{inv.type}</span>
                      </td>
                      <td className="p-3.5 font-sans text-slate-700 dark:text-slate-300">
                        {inv.branchName || 'Principal'}
                      </td>
                      <td className="p-3.5 font-sans font-semibold text-slate-800 dark:text-slate-200">
                        {inv.customerName}
                      </td>
                      <td className="p-3.5 text-slate-600">{inv.date}</td>
                      <td className="p-3.5 text-right font-black text-slate-900 dark:text-white">
                        {formatCurrencyUSD(inv.totalPagar)}
                      </td>
                      <td className="p-3.5 text-center font-sans">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            inv.status === 'pagada'
                              ? 'bg-emerald-100 text-emerald-800'
                              : inv.status === 'anulada'
                              ? 'bg-slate-100 text-slate-500 line-through'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-center font-sans">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedInvoiceForView(inv)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition cursor-pointer"
                            title="Ver DTE"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {inv.status !== 'anulada' && (
                            <button
                              onClick={() => {
                                if (confirm(`¿Anular DTE ${inv.correlativeNumber}? Esto revertirá las existencias en Kardex.`)) {
                                  cancelInvoice(inv.id);
                                }
                              }}
                              className="p-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition cursor-pointer"
                              title="Anular Venta"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (confirm(`¿ELIMINAR DEFINITIVAMENTE la venta ${inv.correlativeNumber}? Se revertirá todo movimiento de stock y partida contable.`)) {
                                deleteInvoice(inv.id);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition cursor-pointer"
                            title="Eliminar de Base de Datos"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: REGISTRAR / EDITAR CLIENTE (CRM) */}
      {/* ---------------------------------------------------- */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl my-8 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl p-6 space-y-4 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <UserPlus className="w-5 h-5 text-indigo-500" />
                <span>{editingCustomer ? 'Editar Ficha de Cliente' : 'Registrar Nuevo Cliente (CRM)'}</span>
              </h3>
              <button onClick={() => setIsCustomerModalOpen(false)} className="cursor-pointer">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomerSubmit} className="space-y-4">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Nombre Completo o Razón Social (según DUI / NIT / NRC):
                </label>
                <input
                  type="text"
                  placeholder="Ej: Inversiones Los Volcanes S.A. de C.V."
                  value={customerForm.name}
                  onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Nombre Comercial (Fantasía):
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Distribuidora El Sol"
                    value={customerForm.tradeName}
                    onChange={(e) => setCustomerForm({ ...customerForm, tradeName: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Giro o Actividad Comercial:
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Servicios de Tecnología y Consultoría"
                    value={customerForm.giro}
                    onChange={(e) => setCustomerForm({ ...customerForm, giro: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-slate-700 dark:text-slate-300">
                      NIT / DUI:
                    </label>
                    <span className="text-[10px] text-slate-400 font-normal">Opcional</span>
                  </div>
                  <input
                    type="text"
                    placeholder="Opcional (ej: 0614-010190-101-1)"
                    value={customerForm.nit}
                    onChange={(e) => setCustomerForm({ ...customerForm, nit: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono text-xs"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-slate-700 dark:text-slate-300">
                      NRC (Crédito Fiscal):
                    </label>
                    <span className="text-[10px] text-slate-400 font-normal">Si aplica</span>
                  </div>
                  <input
                    type="text"
                    placeholder="123456-7"
                    value={customerForm.nrc}
                    onChange={(e) => setCustomerForm({ ...customerForm, nrc: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono text-xs"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-slate-700 dark:text-slate-300">
                      DUI (Persona Natural):
                    </label>
                    <span className="text-[10px] text-slate-400 font-normal">Opcional</span>
                  </div>
                  <input
                    type="text"
                    placeholder="Opcional (01234567-8)"
                    value={customerForm.dui}
                    onChange={(e) => setCustomerForm({ ...customerForm, dui: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono text-xs"
                  />
                </div>
              </div>

              {/* CRM Segment, Stage, and Official Geography */}
              <div className="p-4 bg-indigo-50/50 dark:bg-slate-800/70 rounded-2xl border border-indigo-100 dark:border-slate-700 space-y-3">
                <span className="font-bold text-[11px] text-indigo-700 dark:text-indigo-400 uppercase tracking-wider block">
                  Segmentación CRM & Geografía de El Salvador
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      Departamento (El Salvador):
                    </label>
                    <select
                      value={customerForm.department || 'San Salvador'}
                      onChange={(e) => handleDepartmentChange(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold"
                    >
                      {SALVADORAN_DEPARTMENTS.map((d) => (
                        <option key={d.code} value={d.name}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      Municipio / Distrito Oficial:
                    </label>
                    <select
                      value={customerForm.municipality || ''}
                      onChange={(e) => setCustomerForm({ ...customerForm, municipality: e.target.value })}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                    >
                      {getMunicipalitiesForDepartment(customerForm.department).map((m, idx) => (
                        <option key={idx} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      Fase CRM / Ciclo de Vida:
                    </label>
                    <select
                      value={customerForm.stage || 'prospecto'}
                      onChange={(e) => setCustomerForm({ ...customerForm, stage: e.target.value as any })}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                    >
                      <option value="prospecto">🎯 Prospecto Inicial</option>
                      <option value="contactado">📞 Contactado</option>
                      <option value="cotizacion">📄 En Cotización</option>
                      <option value="negociacion">💬 En Negociación</option>
                      <option value="primer_compra">🛒 Primera Compra</option>
                      <option value="frecuente">✓ Cliente Frecuente</option>
                      <option value="vip">🌟 Cliente VIP</option>
                      <option value="inactivo">⏸ Inactivo / Pausado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      Canal de Captación:
                    </label>
                    <select
                      value={customerForm.acquisitionChannel || 'whatsapp'}
                      onChange={(e) => setCustomerForm({ ...customerForm, acquisitionChannel: e.target.value as any })}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                    >
                      <option value="whatsapp">WhatsApp Business</option>
                      <option value="instagram">Instagram</option>
                      <option value="facebook">Facebook Ads</option>
                      <option value="tienda_fisica">Tienda Física / Sucursal</option>
                      <option value="referido">Referido / Boca a Boca</option>
                      <option value="web">Página Web / E-Commerce</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      Tipo / Perfil Demográfico:
                    </label>
                    <select
                      value={customerForm.gender || 'femenino'}
                      onChange={(e) => setCustomerForm({ ...customerForm, gender: e.target.value as any })}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                    >
                      <option value="femenino">👩 Mujer (Femenino)</option>
                      <option value="masculino">👨 Hombre (Masculino)</option>
                      <option value="corporativo">🏢 Empresa / Corporativo (B2B)</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Teléfono / WhatsApp:
                  </label>
                  <input
                    type="text"
                    placeholder="+503 2200-0000"
                    value={customerForm.phone}
                    onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Correo Electrónico:
                  </label>
                  <input
                    type="email"
                    placeholder="contacto@empresa.sv"
                    value={customerForm.email}
                    onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Dirección Exacta:
                </label>
                <input
                  type="text"
                  placeholder="Calle Principal, Colonia Escalón, #123"
                  value={customerForm.address}
                  onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Límite de Crédito ($ USD):
                  </label>
                  <input
                    type="number"
                    step="50"
                    value={customerForm.creditLimit}
                    onChange={(e) => setCustomerForm({ ...customerForm, creditLimit: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Plazo de Crédito (Días):
                  </label>
                  <select
                    value={customerForm.paymentTermDays}
                    onChange={(e) => setCustomerForm({ ...customerForm, paymentTermDays: parseInt(e.target.value) || 30 })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  >
                    <option value={0}>Contado (0 días)</option>
                    <option value={15}>15 Días</option>
                    <option value={30}>30 Días</option>
                    <option value={60}>60 Días</option>
                    <option value={90}>90 Días</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isGranContribuyenteCheck"
                  checked={customerForm.isGranContribuyente}
                  onChange={(e) => setCustomerForm({ ...customerForm, isGranContribuyente: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <label htmlFor="isGranContribuyenteCheck" className="font-semibold text-slate-700 dark:text-slate-300">
                  ¿Es Gran Contribuyente designado por MH? (Retiene 1% IVA en compras &gt; $100)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 cursor-pointer font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer shadow-md"
                >
                  {editingCustomer ? 'Actualizar Cliente' : 'Guardar Cliente en CRM'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: MINI-DASHBOARD CRM 360° DE CLIENTE */}
      {/* ---------------------------------------------------- */}
      {selectedCustomerForDetail && (
        <CustomerMiniDashboardModal
          customer={selectedCustomerForDetail}
          onClose={() => setSelectedCustomerForDetail(null)}
          onOpenNewSaleForCustomer={(cust) => {
            setSelectedCustomerId(cust.id);
            onOpenNewSaleModal();
          }}
        />
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: EMITIR DOCUMENTO TRIBUTARIO (DTE SV) */}
      {/* ---------------------------------------------------- */}
      {isNewSaleModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-3xl my-8 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {currentCompany.dteActive
                      ? 'Emisión de Documento Tributario Electrónico (DTE SV)'
                      : 'Nueva Venta (Modo Control Interno Emprendedor)'}
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    {currentCompany.dteActive
                      ? 'Sellado digital y transmisión directa con Ministerio de Hacienda'
                      : 'Registro directo en contabilidad, inventario y cuentas por cobrar (sin firma tributaria)'}
                  </p>
                </div>
              </div>
              <button
                onClick={onCloseNewSaleModal}
                aria-label="Cerrar formulario de venta"
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitInvoice} className="p-6 space-y-5 text-xs">
              {/* Regime Notification Banner */}
              {!currentCompany.dteActive && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Store className="w-4 h-4 text-amber-600 shrink-0" />
                    <div>
                      <p className="font-bold text-xs">Régimen Emprendedor / Control Interno</p>
                      <p className="text-[11px] text-amber-700 dark:text-amber-400">
                        Venta registrada al instante sin retenciones ni firma de Hacienda. Puedes activar Facturación DTE en 1 clic.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={toggleDteMode}
                    className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] shrink-0 cursor-pointer"
                  >
                    Activar DTE Ahora
                  </button>
                </div>
              )}

              {/* Top Row: Type, Branch & Customer */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tipo de Documento:
                  </label>
                  <select
                    value={invoiceType}
                    onChange={(e) => setInvoiceType(e.target.value as InvoiceType)}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold"
                  >
                    {!currentCompany.dteActive && (
                      <option value="ticket_interno">Ticket / Nota de Venta (Control Interno)</option>
                    )}
                    <option value="credito_fiscal">Comprobante Crédito Fiscal (CCF)</option>
                    <option value="factura_consumidor_final">Factura Consumidor Final</option>
                    {currentCompany.dteActive && (
                      <option value="ticket_interno">Ticket Interno (Uso Administrativo)</option>
                    )}
                    <option value="exportacion">Factura de Exportación (0% IVA)</option>
                    <option value="nota_credito">Nota de Crédito</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Sucursal Emisora:
                  </label>
                  <select
                    value={invoiceBranchId}
                    onChange={(e) => setInvoiceBranchId(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      Cliente Receptor:
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsQuickCustomerOpen(!isQuickCustomerOpen)}
                      className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                    >
                      + Cliente Rápido
                    </button>
                  </div>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.nrc ? `[NRC: ${c.nrc}]` : `[NIT: ${c.nit}]`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quick Customer Inline Drawer */}
              {isQuickCustomerOpen && (
                <div className="p-3.5 bg-indigo-50/70 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/50 space-y-2">
                  <span className="font-bold text-[11px] text-indigo-900 dark:text-indigo-300 block">
                    Auto-Registro Rápido de Cliente CRM
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <input
                      type="text"
                      placeholder="Nombre o Razón Social *"
                      value={quickCustomerName}
                      onChange={(e) => setQuickCustomerName(e.target.value)}
                      className="p-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs sm:col-span-2"
                    />
                    <input
                      type="text"
                      placeholder="NIT / DUI"
                      value={quickCustomerNit}
                      onChange={(e) => setQuickCustomerNit(e.target.value)}
                      className="p-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-mono"
                    />
                    <input
                      type="text"
                      placeholder="NRC"
                      value={quickCustomerNrc}
                      onChange={(e) => setQuickCustomerNrc(e.target.value)}
                      className="p-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-mono"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsQuickCustomerOpen(false)}
                      className="px-2.5 py-1 text-slate-500 hover:text-slate-700 text-[11px]"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleQuickCreateCustomer}
                      className="px-3 py-1 rounded bg-indigo-600 text-white font-bold text-[11px]"
                    >
                      Crear & Seleccionar
                    </button>
                  </div>
                </div>
              )}

              {/* Payment Condition */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Condición de Operación / Pago:
                  </label>
                  <select
                    value={paymentCondition}
                    onChange={(e) => setPaymentCondition(e.target.value as PaymentCondition)}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  >
                    <option value="contado">💵 Contado (Efectivo / Transferencia Inmediata)</option>
                    <option value="credito_15">💳 Crédito 15 Días</option>
                    <option value="credito_30">💳 Crédito 30 Días (Comercial)</option>
                    <option value="credito_60">💳 Crédito 60 Días</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Observaciones / Notas de la Venta:
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Entregar en sucursal Santa Tecla, factura según orden #402"
                    value={invoiceNotes}
                    onChange={(e) => setInvoiceNotes(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              {/* Feedback Toast for Scans */}
              {scanFeedbackToast && (
                <div className="p-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-between shadow-lg">
                  <div className="flex items-center gap-2">
                    <ScanBarcode className="w-4 h-4" />
                    <span>{scanFeedbackToast}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setScanFeedbackToast(null)}
                    className="text-white/80 hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Barcode Quick Scan Bar */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-[260px]">
                  <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0">
                    <ScanBarcode className="w-4 h-4" />
                  </div>
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="Escanear con pistola (USB/Bluetooth) o escribir código..."
                      value={barcodeScanInput}
                      onChange={(e) => setBarcodeScanInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleBarcodeQuickSubmit(barcodeScanInput);
                        }
                      }}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleBarcodeQuickSubmit(barcodeScanInput)}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs transition cursor-pointer"
                  >
                    Agregar
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsBarcodeModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-750 text-xs font-semibold shadow-xs transition cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Escanear con Cámara</span>
                </button>
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-900 dark:text-white">
                    Detalle de Productos / Servicios
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-2.5 py-1 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Agregar Ítem</span>
                  </button>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-[10px] uppercase font-bold text-slate-500">
                      <tr>
                        <th className="p-2">Producto / Código</th>
                        <th className="p-2 text-center w-16">Cant.</th>
                        <th className="p-2 text-right w-24">Precio ($)</th>
                        <th className="p-2 text-right w-24">Total</th>
                        <th className="p-2 text-center w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {invoiceItems.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-2">
                            <select
                              value={item.productId}
                              onChange={(e) => handleProductChange(idx, e.target.value)}
                              className="w-full p-1.5 rounded border border-slate-200 dark:border-slate-700 bg-transparent text-slate-800 dark:text-slate-200"
                            >
                              {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                  [{p.code}] {p.name} - Stock: {p.stock}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-2 text-center">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleQuantityChange(idx, parseInt(e.target.value) || 1)}
                              className="w-16 p-1.5 rounded border border-slate-200 dark:border-slate-700 text-center bg-transparent text-slate-800 dark:text-slate-200 font-bold"
                            />
                          </td>
                          <td className="p-2 text-right">
                            <input
                              type="number"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => handlePriceChange(idx, parseFloat(e.target.value) || 0)}
                              className="w-24 p-1.5 rounded border border-slate-200 dark:border-slate-700 text-right bg-transparent text-slate-800 dark:text-slate-200 font-mono"
                            />
                          </td>
                          <td className="p-2 text-right font-mono font-bold text-slate-900 dark:text-white">
                            {formatCurrencyUSD(item.total)}
                          </td>
                          <td className="p-2 text-center">
                            {invoiceItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Salvadoran Tax Breakdown Box */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Sumas Gravadas:</span>
                  <span className="font-mono">{formatCurrencyUSD(taxCalculations.sumasGravadas)}</span>
                </div>

                {invoiceType === 'credito_fiscal' && (
                  <div className="flex justify-between text-indigo-600 dark:text-indigo-400 font-semibold">
                    <span>IVA Débito Fiscal (13%):</span>
                    <span className="font-mono">+{formatCurrencyUSD(taxCalculations.iva13)}</span>
                  </div>
                )}

                {taxCalculations.ivaRetenido1 > 0 && (
                  <div className="flex justify-between text-amber-600 dark:text-amber-400 font-semibold">
                    <span>Retención 1% IVA (Cliente Gran Contribuyente):</span>
                    <span className="font-mono">-{formatCurrencyUSD(taxCalculations.ivaRetenido1)}</span>
                  </div>
                )}

                {taxCalculations.ivaPercibido1 > 0 && (
                  <div className="flex justify-between text-blue-600 dark:text-blue-400 font-semibold">
                    <span>Percepción 1% IVA (Emisor Gran Contribuyente):</span>
                    <span className="font-mono">+{formatCurrencyUSD(taxCalculations.ivaPercibido1)}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between text-sm font-black text-slate-900 dark:text-white">
                  <span>Total a Pagar (USD):</span>
                  <span className="font-mono text-base text-emerald-600 dark:text-emerald-400">
                    {formatCurrencyUSD(taxCalculations.totalPagar)}
                  </span>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onCloseNewSaleModal}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Emitir Documento & Asentar en Kardex/Contabilidad</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: ESCÁNER DE CÓDIGO DE BARRAS / CÁMARA */}
      {/* ---------------------------------------------------- */}
      {isBarcodeModalOpen && (
        <BarcodeScannerModal
          onClose={() => setIsBarcodeModalOpen(false)}
          onProductScanned={(prod) => {
            handleProductScanned(prod);
            setIsBarcodeModalOpen(false);
          }}
        />
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: VER DTE OFICIAL DE EL SALVADOR */}
      {/* ---------------------------------------------------- */}
      {selectedInvoiceForView && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl my-8 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white text-slate-900 shadow-2xl p-6 space-y-6">
            {/* Action Bar */}
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded bg-indigo-100 text-indigo-800 font-bold text-xs">
                  DOCUMENTO TRIBUTARIO ELECTRÓNICO (DTE)
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  {selectedInvoiceForView.dteCode}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> Imprimir
                </button>
                <button
                  onClick={() => setSelectedInvoiceForView(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Official Header */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <h2 className="font-black text-base text-indigo-900">
                  {currentCompany.tradeName || currentCompany.name}
                </h2>
                <p className="text-slate-600">{currentCompany.giro}</p>
                <p className="text-slate-600">{currentCompany.address}</p>
                <div className="mt-2 space-y-0.5 font-mono text-[11px]">
                  <p><span className="font-bold">NRC:</span> {currentCompany.nrc}</p>
                  <p><span className="font-bold">NIT:</span> {currentCompany.nit}</p>
                  <p><span className="font-bold">Sucursal:</span> {selectedInvoiceForView.branchName || 'Central'}</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-right">
                <h3 className="font-black text-sm uppercase text-slate-900">
                  {selectedInvoiceForView.type.replace(/_/g, ' ')}
                </h3>
                <p className="text-sm font-mono font-bold text-indigo-600">
                  {selectedInvoiceForView.correlativeNumber}
                </p>
                <p className="text-[11px] text-slate-500">
                  Fecha de Emisión: {selectedInvoiceForView.date}
                </p>
                <p className="text-[11px] text-slate-500">
                  Condición: {selectedInvoiceForView.paymentCondition.replace('_', ' ').toUpperCase()}
                </p>
              </div>
            </div>

            {/* Customer Box */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between font-bold text-slate-900">
                <span>Cliente: {selectedInvoiceForView.customerName}</span>
                {selectedInvoiceForView.customerIsGranContribuyente && (
                  <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                    Gran Contribuyente
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-600 text-[11px] font-mono">
                <p>NIT/DUI: {selectedInvoiceForView.customerNit}</p>
                {selectedInvoiceForView.customerNrc && <p>NRC: {selectedInvoiceForView.customerNrc}</p>}
              </div>
            </div>

            {/* Items */}
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-600">
                <tr>
                  <th className="p-2">Descripción</th>
                  <th className="p-2 text-center w-14">Cant.</th>
                  <th className="p-2 text-right w-24">Precio Unit.</th>
                  <th className="p-2 text-right w-24">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {selectedInvoiceForView.items.map((it, idx) => (
                  <tr key={idx}>
                    <td className="p-2 font-sans font-medium text-slate-800">{it.description}</td>
                    <td className="p-2 text-center">{it.quantity}</td>
                    <td className="p-2 text-right">{formatCurrencyUSD(it.unitPrice)}</td>
                    <td className="p-2 text-right font-bold">{formatCurrencyUSD(it.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Fiscal Totals & QR Code */}
            <div className="grid grid-cols-2 gap-4 items-end pt-4 border-t border-slate-200">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <QrCode className="w-16 h-16 text-slate-800 shrink-0" />
                <div className="text-[10px] text-slate-500">
                  <p className="font-bold text-slate-700">Sello de Recepción MH</p>
                  <p className="font-mono truncate max-w-[150px]">{selectedInvoiceForView.dteCode}</p>
                  <p className="text-emerald-700 font-semibold mt-1">✓ Transmisión DTE Válida</p>
                </div>
              </div>

              <div className="space-y-1 text-xs text-right font-mono">
                <div className="flex justify-between text-slate-600">
                  <span>Sumas Gravadas:</span>
                  <span>{formatCurrencyUSD(selectedInvoiceForView.sumasGravadas)}</span>
                </div>
                {selectedInvoiceForView.iva13 > 0 && (
                  <div className="flex justify-between text-indigo-700 font-semibold">
                    <span>IVA 13%:</span>
                    <span>+{formatCurrencyUSD(selectedInvoiceForView.iva13)}</span>
                  </div>
                )}
                {selectedInvoiceForView.ivaRetenido1 > 0 && (
                  <div className="flex justify-between text-amber-700">
                    <span>Retención 1% IVA:</span>
                    <span>-{formatCurrencyUSD(selectedInvoiceForView.ivaRetenido1)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black text-slate-900 pt-1 border-t border-slate-200">
                  <span>Total a Pagar:</span>
                  <span className="text-indigo-600">{formatCurrencyUSD(selectedInvoiceForView.totalPagar)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: REGISTRAR ABONO CXC */}
      {/* ---------------------------------------------------- */}
      {paymentModalInvoice && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>Registrar Abono a Factura (CxC)</span>
              </h3>
              <button onClick={() => setPaymentModalInvoice(null)} className="cursor-pointer">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleConfirmPayment} className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {paymentModalInvoice.customerName}
                </p>
                <p className="text-slate-500">Documento: {paymentModalInvoice.correlativeNumber}</p>
                <p className="text-rose-600 font-bold mt-1 font-mono">
                  Saldo Pendiente Actual: {formatCurrencyUSD(paymentModalInvoice.saldoPendiente)}
                </p>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Monto a Abonar ($ USD):
                </label>
                <input
                  type="number"
                  step="0.01"
                  max={paymentModalInvoice.saldoPendiente}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-sm font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Método de Pago:
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  >
                    <option value="transferencia">Transferencia Bancaria</option>
                    <option value="efectivo">Efectivo en Caja</option>
                    <option value="cheque">Cheque</option>
                    <option value="tarjeta">Tarjeta Débito/Crédito</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    N° de Recibo de Abono:
                  </label>
                  <input
                    type="text"
                    value={paymentReceiptNumber}
                    onChange={(e) => setPaymentReceiptNumber(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Cuenta de Ingreso (Caja / Banco):
                </label>
                <select
                  value={paymentTargetAccount}
                  onChange={(e) => setPaymentTargetAccount(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                >
                  {bankAccounts.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.accountName} (Saldo: ${b.currentBalance.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setPaymentModalInvoice(null)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 cursor-pointer font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer shadow-md"
                >
                  Confirmar Cobro & Asentar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
