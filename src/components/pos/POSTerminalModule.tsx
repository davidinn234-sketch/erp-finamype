import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useERP } from '../../context/ERPContext';
import { Product, Customer, Invoice, InvoiceType, PaymentCondition } from '../../types';
import { formatCurrencyUSD, calculateSaleTaxes } from '../../utils/salvadoranTax';
import {
  ScanBarcode,
  Volume2,
  VolumeX,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Zap,
  Printer,
  RotateCcw,
  Search,
  User,
  CreditCard,
  Banknote,
  QrCode,
  Store,
  FileText,
  Clock,
  Sparkles,
  ArrowRight,
  Receipt,
  Check,
  Percent,
  X,
  Layers,
  History,
  TrendingUp,
  Package,
  Camera,
} from 'lucide-react';
import { CameraBarcodeScannerModal } from './CameraBarcodeScannerModal';

interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  total: number;
}

export const POSTerminalModule: React.FC = () => {
  const {
    products,
    customers,
    currentCompany,
    currentUser,
    branches,
    selectedBranchId,
    setSelectedBranchId,
    createInvoice,
    createProduct,
    invoices,
    bankAccounts,
  } = useERP();

  // Selected POS Branch State
  const [posBranchId, setPosBranchId] = useState<string>(() => {
    if (selectedBranchId !== 'all' && branches.some((b) => b.id === selectedBranchId)) {
      return selectedBranchId;
    }
    return branches[0]?.id || '';
  });

  useEffect(() => {
    if (branches.length > 0 && (!posBranchId || !branches.some((b) => b.id === posBranchId))) {
      setPosBranchId(branches[0].id);
    }
  }, [branches, posBranchId]);

  const activeBranch = useMemo(() => {
    return branches.find((b) => b.id === posBranchId) || branches[0];
  }, [branches, posBranchId]);

  // State: Cart & Sale
  const [cart, setCart] = useState<CartItem[]>([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('walk_in');
  const [invoiceType, setInvoiceType] = useState<InvoiceType>('factura_consumidor_final');
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'tarjeta' | 'transferencia' | 'chivo_wallet'>('efectivo');
  const [cashGiven, setCashGiven] = useState<string>('');
  const [saleDiscountPercent, setSaleDiscountPercent] = useState<number>(0);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [catalogSearch, setCatalogSearch] = useState<string>('');

  // Quick Product Registration Modal
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);
  const [newProductForm, setNewProductForm] = useState<Omit<Product, 'id' | 'companyId'>>({
    code: '',
    barcode: '',
    name: '',
    category: 'General',
    unit: 'Unidad',
    salePrice: 1.0,
    currentCost: 0.6,
    stock: 20,
    minStock: 5,
    location: 'Tienda / Estante A1',
    isService: false,
  });

  // UI / Feedback states
  const [lastScannedFeedback, setLastScannedFeedback] = useState<{
    text: string;
    product?: Product;
    type: 'success' | 'error' | 'info';
  } | null>({
    text: 'Escáner activado. Pase el lector sobre el código de barras o haga clic en un producto.',
    type: 'info',
  });
  const [isCompletedSaleModalOpen, setIsCompletedSaleModalOpen] = useState(false);
  const [completedInvoice, setCompletedInvoice] = useState<Invoice | null>(null);
  const [lastSaleTender, setLastSaleTender] = useState<{
    method: string;
    received: number;
    change: number;
  } | null>(null);
  const [showShiftSummaryModal, setShowShiftSummaryModal] = useState(false);
  const [showCustomerPickerModal, setShowCustomerPickerModal] = useState(false);
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const [cameraScanTarget, setCameraScanTarget] = useState<'cart' | 'newProduct'>('cart');

  // References
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const cashInputRef = useRef<HTMLInputElement>(null);
  const ticketEndRef = useRef<HTMLDivElement>(null);

  // Audio synthesizer for crisp supermarket POS beeps
  const playAudioCue = (type: 'scan' | 'error' | 'cash_chime') => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      if (type === 'scan') {
        // High crisp scanner beep (1760 Hz - A6)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1760, ctx.currentTime);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } else if (type === 'error') {
        // Low error buzz
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else if (type === 'cash_chime') {
        // Double cash register chime
        const now = ctx.currentTime;
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(987.77, now); // B5
        gain1.gain.setValueAtTime(0.15, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.25);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1318.51, now + 0.12); // E6
        gain2.gain.setValueAtTime(0.2, now + 0.12);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.12);
        osc2.stop(now + 0.45);
      }
    } catch (e) {
      // Audio context might be restricted before gesture
    }
  };

  // Focus scanner safely without stealing focus when typing in other inputs
  useEffect(() => {
    const timer = setTimeout(() => {
      if (barcodeInputRef.current && !isCompletedSaleModalOpen && !showCustomerPickerModal && !showShiftSummaryModal) {
        barcodeInputRef.current.focus();
      }
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  // Selected customer resolution (Default: Cliente de Mostrador)
  const activeCustomer = useMemo(() => {
    if (selectedCustomerId === 'walk_in') {
      return {
        id: 'cust_walk_in',
        name: 'Consumidor Final / Cliente de Mostrador',
        tradeName: 'Cliente General (Contado)',
        nit: '0000-000000-000-0',
        dui: '00000000-0',
        nrc: '',
        address: 'Mostrador Central',
        phone: 'N/A',
        email: 'ventas@sivarflow.sv',
        isGranContribuyente: false,
        creditLimit: 0,
        paymentTermDays: 0,
      } as Customer;
    }
    return customers.find((c) => c.id === selectedCustomerId) || customers[0];
  }, [selectedCustomerId, customers]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  // Filtered catalog products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = filterCategory === 'all' || p.category === filterCategory;
      const q = catalogSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.includes(q));
      return matchCat && matchSearch;
    });
  }, [products, filterCategory, catalogSearch]);

  // Calculations
  const calculations = useMemo(() => {
    const subtotalRaw = cart.reduce((acc, item) => acc + item.total, 0);
    const discountAmount = Number(((subtotalRaw * saleDiscountPercent) / 100).toFixed(2));
    const netSubtotal = Math.max(0, subtotalRaw - discountAmount);

    const isCCF = invoiceType === 'credito_fiscal';
    let gravadas = netSubtotal;
    let iva13 = 0;

    if (currentCompany.dteActive || currentCompany.taxesConfig?.declaIva) {
      if (isCCF) {
        // En CCF, los precios no llevan IVA, se suma 13%
        iva13 = Number((gravadas * 0.13).toFixed(2));
      } else {
        // En Factura Consumidor Final, el precio al cliente ya incluye IVA (art. 65 Ley del IVA)
        // Se desglosa internamente
        const baseSinIva = gravadas / 1.13;
        iva13 = Number((gravadas - baseSinIva).toFixed(2));
        gravadas = Number(baseSinIva.toFixed(2));
      }
    }

    // Retención 1% si el cliente es Gran Contribuyente y venta >= $100
    let retencion1 = 0;
    if (activeCustomer?.isGranContribuyente && (isCCF ? gravadas : netSubtotal) >= 100) {
      retencion1 = Number(((isCCF ? gravadas : gravadas) * 0.01).toFixed(2));
    }

    const totalToPay = isCCF
      ? Number((gravadas + iva13 - retencion1).toFixed(2))
      : Number((netSubtotal - retencion1).toFixed(2));

    // Live Cash & Change calculations
    const cleanCash = cashGiven.trim().replace(',', '.');
    const isCashEmpty = cleanCash === '';
    const parsedCash = parseFloat(cleanCash);
    // If empty, default to exact cash payment
    const cashNum = isCashEmpty ? totalToPay : (isNaN(parsedCash) ? 0 : parsedCash);
    const changeDue = Math.max(0, Number((cashNum - totalToPay).toFixed(2)));
    const isSufficientCash = paymentMethod !== 'efectivo' || isCashEmpty || cashNum >= totalToPay - 0.001;
    const cashShortfall = Math.max(0, Number((totalToPay - cashNum).toFixed(2)));

    return {
      subtotalRaw,
      discountAmount,
      gravadas,
      iva13,
      retencion1,
      totalToPay,
      cashNum,
      isCashEmpty,
      changeDue,
      isSufficientCash,
      cashShortfall,
    };
  }, [cart, saleDiscountPercent, invoiceType, currentCompany, activeCustomer, cashGiven, paymentMethod]);

  // Core Barcode Scan / SKU / Name Handler
  const handleScanProduct = (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) return;
    const lower = trimmed.toLowerCase();

    // Search exact barcode or SKU or fuzzy name match
    let found = products.find(
      (p) =>
        (p.barcode && p.barcode.toLowerCase() === lower) ||
        p.code.toLowerCase() === lower
    );

    if (!found) {
      found = products.find((p) => p.name.toLowerCase() === lower);
    }

    if (!found) {
      found = products.find(
        (p) =>
          p.name.toLowerCase().includes(lower) ||
          p.code.toLowerCase().includes(lower) ||
          (p.barcode && p.barcode.toLowerCase().includes(lower))
      );
    }

    if (found) {
      playAudioCue('scan');
      addProductToCart(found);
      setLastScannedFeedback({
        text: `✓ Agregado al ticket: [${found.barcode || found.code}] ${found.name}`,
        product: found,
        type: 'success',
      });
    } else {
      playAudioCue('error');
      setLastScannedFeedback({
        text: `Código o producto "${trimmed}" no encontrado en el inventario.`,
        type: 'error',
      });
    }

    setBarcodeInput('');
    if (barcodeInputRef.current) {
      barcodeInputRef.current.value = '';
    }
  };

  // Add Product to Cart (or increment quantity if already present)
  const addProductToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.product.id === product.id);
      if (existingIndex >= 0) {
        // Increment quantity
        const updated = [...prevCart];
        const newQty = updated[existingIndex].quantity + 1;
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          total: Number((newQty * updated[existingIndex].unitPrice).toFixed(2)),
        };
        return updated;
      } else {
        // Add new line
        const newItem: CartItem = {
          product,
          quantity: 1,
          unitPrice: product.salePrice,
          unitCost: product.currentCost,
          total: product.salePrice,
        };
        return [...prevCart, newItem];
      }
    });

    // Auto scroll ticket table
    setTimeout(() => {
      ticketEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  const updateItemQuantity = (productId: string, newQty: number) => {
    if (newQty <= 0) {
      removeItemFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          return {
            ...item,
            quantity: newQty,
            total: Number((newQty * item.unitPrice).toFixed(2)),
          };
        }
        return item;
      })
    );
  };

  const removeItemFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    if (cart.length === 0) return;
    setCart([]);
    setCashGiven('');
    setSaleDiscountPercent(0);
    setLastScannedFeedback({
      text: 'Venta cancelada. Listo para nuevo cliente.',
      type: 'info',
    });
  };

  // Quick cash bill shortcuts
  const handleQuickCash = (amount: number) => {
    setCashGiven(amount.toFixed(2));
    playAudioCue('scan');
  };

  const setExactCash = () => {
    setCashGiven(calculations.totalToPay.toFixed(2));
    playAudioCue('scan');
  };

  // Finalize Sale & Emit Official Invoice
  const handleCompleteSale = () => {
    if (cart.length === 0) {
      setLastScannedFeedback({
        text: 'El ticket está vacío. Escanee al menos un producto.',
        type: 'error',
      });
      playAudioCue('error');
      return;
    }

    if (paymentMethod === 'efectivo' && !calculations.isSufficientCash) {
      setLastScannedFeedback({
        text: `Monto en efectivo insuficiente. Faltan ${formatCurrencyUSD(
          calculations.totalToPay - calculations.cashNum
        )}`,
        type: 'error',
      });
      playAudioCue('error');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const prefix = invoiceType === 'credito_fiscal' ? 'CCF' : invoiceType === 'ticket_interno' ? 'TCK' : 'FCF';
    const nextCorrelative = `${prefix}-${String(invoices.length + 101).padStart(6, '0')}`;
    const dteCode = currentCompany.dteActive
      ? `DTE-01-${currentCompany.dteEstablishmentCode || 'SUC01'}-${Date.now().toString(36).toUpperCase()}`
      : undefined;

    const items = cart.map((item) => ({
      id: `item_${Date.now()}_${item.product.id}`,
      productId: item.product.id,
      productCode: item.product.code,
      description: item.product.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.total,
      unitCost: item.unitCost,
    }));

    const invoicePayload = {
      branchId: activeBranch?.id,
      branchName: activeBranch?.name || 'Casa Matriz',
      type: invoiceType,
      correlativeNumber: nextCorrelative,
      dteCode,
      date: today,
      dueDate: today,
      customerId: activeCustomer.id,
      customerName: activeCustomer.name,
      customerNit: activeCustomer.nit,
      customerNrc: activeCustomer.nrc,
      customerIsGranContribuyente: activeCustomer.isGranContribuyente,
      paymentCondition: 'contado' as PaymentCondition,
      status: 'pagada' as const,
      items,
      sumasGravadas: calculations.gravadas,
      sumasExentas: 0,
      sumasNoSujetas: 0,
      iva13: calculations.iva13,
      ivaRetenido1: calculations.retencion1,
      ivaPercibido1: 0,
      totalPagar: calculations.totalToPay,
      saldoPendiente: 0,
      notes: `Venta Terminal POS de Caja Rápida - Pago con ${paymentMethod.toUpperCase()}${
        paymentMethod === 'efectivo'
          ? ` (Recibido: $${calculations.cashNum.toFixed(2)}, Vuelto: $${calculations.changeDue.toFixed(2)})`
          : ''
      }`,
    };

    const newInv = createInvoice(invoicePayload);
    playAudioCue('cash_chime');
    setCompletedInvoice(newInv);
    setLastSaleTender({
      method: paymentMethod,
      received: paymentMethod === 'efectivo' ? calculations.cashNum : calculations.totalToPay,
      change: paymentMethod === 'efectivo' ? calculations.changeDue : 0,
    });
    setIsCompletedSaleModalOpen(true);
  };

  // Keyboard shortcut listener: F12 or Enter to complete sale
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isCompletedSaleModalOpen || showCustomerPickerModal || showShiftSummaryModal) {
        if (e.key === 'Escape') {
          setIsCompletedSaleModalOpen(false);
          setShowCustomerPickerModal(false);
          setShowShiftSummaryModal(false);
        }
        return;
      }

      const target = e.target as HTMLElement | null;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT');

      if (e.key === 'F12' || (e.key === 'Enter' && target?.id === 'pos-cash-input')) {
        e.preventDefault();
        if (cart.length > 0 && (paymentMethod !== 'efectivo' || calculations.isSufficientCash)) {
          handleCompleteSale();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, paymentMethod, calculations, isCompletedSaleModalOpen, showCustomerPickerModal, showShiftSummaryModal]);

  const handleNextSale = () => {
    setIsCompletedSaleModalOpen(false);
    setCompletedInvoice(null);
    setCart([]);
    setCashGiven('');
    setSaleDiscountPercent(0);
    setSelectedCustomerId('walk_in');
    setLastScannedFeedback({
      text: 'Listo para el siguiente cliente. Pase el lector de código de barras.',
      type: 'info',
    });
    setTimeout(() => {
      barcodeInputRef.current?.focus();
    }, 100);
  };

  // Today shift statistics
  const todayInvoices = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return invoices.filter((i) => i.date === todayStr && i.status !== 'anulada');
  }, [invoices]);

  const todayTotalSales = useMemo(() => {
    return todayInvoices.reduce((acc, i) => acc + i.totalPagar, 0);
  }, [todayInvoices]);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col bg-[#F6F8F7] dark:bg-slate-950 p-2 sm:p-4 gap-3 font-sans">
      {/* Top Banner: Status & Cashier Info */}
      <header className="bg-white dark:bg-slate-900 rounded-[8px] border border-[#E3E8E6] dark:border-slate-800 p-3 sm:p-4 shadow-none flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[6px] bg-[#0F766E] text-white flex items-center justify-center shadow-xs">
            <ScanBarcode className="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Terminal de Ventas POS
              </h1>
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[#059669] dark:text-emerald-300 text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                TERMINAL ACTIVA
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
              <span>Cajero: <strong className="text-slate-800 dark:text-slate-200">{currentUser.name}</strong></span>
              <span>•</span>
              <div className="flex items-center gap-1.5 bg-[#F6F8F7] dark:bg-slate-800 px-2 py-0.5 rounded-[6px] border border-[#E3E8E6] dark:border-slate-700">
                <Store className="w-3.5 h-3.5 text-[#0F766E] dark:text-teal-400 shrink-0" />
                <span className="font-semibold text-slate-700 dark:text-slate-300">Sucursal:</span>
                {branches.length > 1 ? (
                  <select
                    id="pos-branch-selector"
                    value={posBranchId}
                    onChange={(e) => {
                      setPosBranchId(e.target.value);
                      setSelectedBranchId(e.target.value);
                    }}
                    className="bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-[#E3E8E6] dark:border-slate-700 font-semibold text-[#0F766E] dark:text-teal-300 focus:outline-none cursor-pointer text-xs"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id} className="text-slate-900 dark:text-white">
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                ) : (
                  <strong className="text-[#0F766E] dark:text-teal-300 font-semibold">
                    {activeBranch?.name || 'Casa Matriz - Sede Central'} ({activeBranch?.code || 'SUC-01'})
                  </strong>
                )}
              </div>
              <span>•</span>
              <span className="font-mono text-[11px] px-2 py-0.5 rounded-[4px] bg-[#F6F8F7] dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-[#E3E8E6] dark:border-slate-700">
                {currentCompany.dteActive ? 'Modo DTE MH Oficial' : 'Modo Control Interno'}
              </span>
            </div>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2">
          {/* Quick Register Product with Barcode */}
          <button
            type="button"
            id="pos-register-product-btn"
            onClick={() => {
              setNewProductForm({
                code: `PRD-${Date.now().toString().slice(-4)}`,
                barcode: barcodeInput.trim() || '',
                name: '',
                category: 'General',
                unit: 'Unidad',
                salePrice: 1.0,
                currentCost: 0.6,
                stock: 25,
                minStock: 5,
                location: 'Estante Principal',
                isService: false,
              });
              setIsNewProductModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-[#E3E8E6] dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-[#F6F8F7] dark:hover:bg-slate-750 transition cursor-pointer shadow-none"
            title="Registrar nuevo producto asignándole su código de barras"
          >
            <Package className="w-3.5 h-3.5 text-[#0F766E] dark:text-teal-400" />
            <span>+ Crear Producto & Código</span>
          </button>

          {/* Shift summary button */}
          <button
            type="button"
            onClick={() => setShowShiftSummaryModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-[#E3E8E6] dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-[#F6F8F7] dark:hover:bg-slate-750 transition cursor-pointer shadow-none"
            title="Ver resumen y corte de caja del turno"
          >
            <History className="w-3.5 h-3.5 text-[#0F766E]" />
            <span className="hidden sm:inline">Corte del Turno:</span>
            <span className="font-mono font-bold text-[#059669] dark:text-emerald-400">
              {formatCurrencyUSD(todayTotalSales)}
            </span>
          </button>

          {/* Sound toggle */}
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-[6px] border transition cursor-pointer ${
              soundEnabled
                ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800 text-[#0F766E] dark:text-teal-300'
                : 'bg-white dark:bg-slate-800 border-[#E3E8E6] dark:border-slate-700 text-slate-400'
            }`}
            title={soundEnabled ? 'Sonido de escaneo activo (Clic para silenciar)' : 'Silenciado (Clic para activar)'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Barcode Scanner Bar (Orderly & Clean) */}
      <section className="bg-slate-900 rounded-[8px] p-3 sm:p-4 text-white border border-slate-800 shadow-none">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleScanProduct(barcodeInput);
          }}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
        >
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-teal-400">
              <ScanBarcode className="w-5 h-5 stroke-[2]" />
            </div>
            <input
              ref={barcodeInputRef}
              id="pos-barcode-scanner-input"
              type="text"
              autoFocus
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              placeholder="Escanee código de barras o digite SKU / Código..."
              className="w-full pl-11 pr-28 py-2.5 rounded-[6px] bg-slate-950 border border-slate-700 text-white placeholder-slate-400 text-sm font-mono font-semibold tracking-wider focus:outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E]"
            />
            <div className="absolute inset-y-0 right-1.5 flex items-center gap-1">
              <span className="hidden md:inline text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                [ENTER]
              </span>
              <button
                type="submit"
                id="pos-barcode-add-btn"
                className="px-2.5 py-1.5 rounded-[4px] bg-[#0F766E] hover:bg-[#115E59] active:scale-95 text-white text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar</span>
              </button>
            </div>
          </div>

          {/* Quick Camera Barcode Scanner Button for Phones & Tablets */}
          <button
            type="button"
            id="pos-camera-scan-btn"
            onClick={() => {
              setCameraScanTarget('cart');
              setIsCameraScannerOpen(true);
            }}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-[6px] bg-slate-800 hover:bg-slate-750 text-white font-semibold text-xs border border-slate-700 transition cursor-pointer shrink-0"
            title="Usar la cámara de su teléfono o tableta para escanear productos"
          >
            <Camera className="w-4 h-4 text-teal-400" />
            <span>📷 Cámara Móvil</span>
          </button>

          {/* Document type selector: Factura FCF vs CCF vs Ticket */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-[6px] border border-slate-800 flex-wrap">
            <button
              type="button"
              id="pos-doc-fcf-btn"
              onClick={() => setInvoiceType('factura_consumidor_final')}
              className={`px-2.5 py-1.5 rounded-[4px] text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                invoiceType === 'factura_consumidor_final'
                  ? 'bg-[#0F766E] text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Factura (FCF)</span>
              {invoiceType === 'factura_consumidor_final' && <Check className="w-3 h-3 ml-0.5 text-white" />}
            </button>
            <button
              type="button"
              id="pos-doc-ccf-btn"
              onClick={() => {
                setInvoiceType('credito_fiscal');
                if (selectedCustomerId === 'walk_in') {
                  setShowCustomerPickerModal(true);
                }
              }}
              className={`px-2.5 py-1.5 rounded-[4px] text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                invoiceType === 'credito_fiscal'
                  ? 'bg-slate-750 text-white shadow-xs border border-slate-600'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Crédito Fiscal (CCF)</span>
              {invoiceType === 'credito_fiscal' && <Check className="w-3 h-3 ml-0.5 text-white" />}
            </button>
            <button
              type="button"
              id="pos-doc-ticket-btn"
              onClick={() => setInvoiceType('ticket_interno')}
              className={`px-2.5 py-1.5 rounded-[4px] text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                invoiceType === 'ticket_interno'
                  ? 'bg-slate-750 text-white shadow-xs border border-slate-600'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Ticket Interno</span>
              {invoiceType === 'ticket_interno' && <Check className="w-3 h-3 ml-0.5 text-white" />}
            </button>
          </div>
        </form>

        {/* Live scanner status feedback message */}
        {lastScannedFeedback && (
          <div
            className={`mt-2 text-xs flex items-center gap-2 py-1 px-2.5 rounded-[4px] font-medium transition-all ${
              lastScannedFeedback.type === 'success'
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                : lastScannedFeedback.type === 'error'
                ? 'bg-rose-950/80 text-rose-300 border border-rose-850'
                : 'bg-slate-800 text-teal-300 border border-slate-700'
            }`}
          >
            {lastScannedFeedback.type === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
            {lastScannedFeedback.type === 'error' && <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
            {lastScannedFeedback.type === 'info' && <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
            <span className="flex-1">{lastScannedFeedback.text}</span>
            {lastScannedFeedback.type === 'error' && (
              <button
                type="button"
                onClick={() => {
                  const attemptedCode = lastScannedFeedback.text.match(/"([^"]+)"/)?.[1] || '';
                  setNewProductForm({
                    code: `PRD-${Date.now().toString().slice(-4)}`,
                    barcode: attemptedCode,
                    name: '',
                    category: 'General',
                    unit: 'Unidad',
                    salePrice: 1.0,
                    currentCost: 0.6,
                    stock: 20,
                    minStock: 5,
                    location: 'Estante Principal',
                    isService: false,
                  });
                  setIsNewProductModalOpen(true);
                }}
                className="px-2 py-0.5 rounded bg-rose-800 hover:bg-rose-700 text-white text-[10px] font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Plus className="w-3 h-3" />
                <span>Registrar este código ahora</span>
              </button>
            )}
          </div>
        )}
      </section>

      {/* Workspace Grid: Left = Active Ticket/Cart, Right = Touch Catalog */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0">
        {/* LEFT 7 COLS: Current Invoice Ticket / Carrito */}
        <div className="lg:col-span-7 flex flex-col bg-white dark:bg-slate-900 rounded-[8px] border border-[#E3E8E6] dark:border-slate-800 shadow-none overflow-hidden">
          {/* Ticket Header & Customer Tag */}
          <div className="p-3 border-b border-[#E3E8E6] dark:border-slate-800 flex items-center justify-between bg-[#F6F8F7] dark:bg-slate-850">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-[#0F766E] dark:text-teal-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Ticket en Curso ({cart.reduce((acc, i) => acc + i.quantity, 0)} artículos)
              </span>
            </div>

            {/* Customer Pill / Quick Selector */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowCustomerPickerModal(true)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-[6px] border border-[#E3E8E6] dark:border-slate-700 text-xs font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-[#0F766E] transition cursor-pointer"
              >
                <User className="w-3 h-3 text-[#0F766E]" />
                <span className="truncate max-w-[140px] sm:max-w-[200px]">
                  {activeCustomer.name}
                </span>
                <span className="text-[10px] text-[#0F766E] dark:text-teal-400 underline ml-1">Cambiar</span>
              </button>

              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  className="p-1 text-slate-400 hover:text-rose-500 transition"
                  title="Limpiar ticket"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Table of Scanned Products */}
          <div className="flex-1 overflow-y-auto max-h-[360px] p-2 space-y-1.5 divide-y divide-slate-100 dark:divide-slate-800">
            {cart.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <ScanBarcode className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-2 animate-bounce" />
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Ningún producto escaneado todavía
                </p>
                <p className="text-xs text-slate-400 max-w-xs mt-1">
                  Pase el lector de código de barras físico o haga clic en los productos del catálogo de la derecha.
                </p>
              </div>
            ) : (
              cart.map((item, idx) => (
                <div
                  key={item.product.id}
                  className="pt-2 flex items-center justify-between gap-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-850 p-2 rounded-xl transition"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold">
                        #{idx + 1}
                      </span>
                      <p className="font-bold text-slate-900 dark:text-white truncate">
                        {item.product.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                      <span className="font-mono text-slate-400">
                        {item.product.barcode || item.product.code}
                      </span>
                      <span>•</span>
                      <span>Precio Unit: {formatCurrencyUSD(item.unitPrice)}</span>
                    </div>
                  </div>

                  {/* Quantity Stepper (+ / -) */}
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => updateItemQuantity(item.product.id, item.quantity - 1)}
                      className="w-6 h-6 rounded flex items-center justify-center bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition font-bold"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center font-mono font-bold text-slate-900 dark:text-white">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        updateItemQuantity(item.product.id, item.quantity + 1);
                        playAudioCue('scan');
                      }}
                      className="w-6 h-6 rounded flex items-center justify-center bg-indigo-600 text-white hover:bg-indigo-500 transition font-bold"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Line Total & Delete */}
                  <div className="text-right min-w-[70px]">
                    <p className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                      {formatCurrencyUSD(item.total)}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeItemFromCart(item.product.id)}
                      className="text-[10px] text-rose-500 hover:underline"
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              ))
            )}
            <div ref={ticketEndRef} />
          </div>

          {/* Financial Calculation & Tender / Payment Section */}
          <div className="p-3.5 bg-[#F6F8F7] dark:bg-slate-850 border-t border-[#E3E8E6] dark:border-slate-800 space-y-3">
            {/* Totals Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 rounded-[6px] bg-white dark:bg-slate-800 border border-[#E3E8E6] dark:border-slate-700">
                <span className="text-[10px] uppercase text-[#6B7280] font-semibold block">Subtotal</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm">
                  {formatCurrencyUSD(calculations.subtotalRaw)}
                </span>
              </div>

              <div className="p-2.5 rounded-[6px] bg-white dark:bg-slate-800 border border-[#E3E8E6] dark:border-slate-700">
                <span className="text-[10px] uppercase text-[#6B7280] font-semibold block">IVA 13% (Débito)</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm">
                  {formatCurrencyUSD(calculations.iva13)}
                </span>
              </div>

              <div className="p-2.5 rounded-[6px] bg-white dark:bg-slate-800 border border-[#E3E8E6] dark:border-slate-700">
                <span className="text-[10px] uppercase text-[#6B7280] font-semibold block">Descuento (%)</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={saleDiscountPercent || ''}
                    onChange={(e) => setSaleDiscountPercent(Math.min(100, Math.max(0, Number(e.target.value))))}
                    placeholder="0"
                    className="w-12 text-xs font-mono font-bold bg-transparent border-b border-slate-300 dark:border-slate-600 focus:outline-none"
                  />
                  <span className="text-slate-400 text-xs">%</span>
                </div>
              </div>

              <div className="p-2.5 rounded-[6px] bg-teal-50 dark:bg-teal-950/60 border border-teal-300 dark:border-teal-800">
                <span className="text-[10px] uppercase text-[#0F766E] dark:text-teal-400 font-bold block">
                  TOTAL A COBRAR
                </span>
                <span className="font-mono font-black text-[#0F766E] dark:text-teal-300 text-base sm:text-lg">
                  {formatCurrencyUSD(calculations.totalToPay)}
                </span>
              </div>
            </div>

            {/* Payment Methods Tabs */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-[6px] border border-[#E3E8E6] dark:border-slate-700">
              <button
                type="button"
                onClick={() => setPaymentMethod('efectivo')}
                className={`flex-1 py-1.5 px-2 rounded-[4px] text-xs font-semibold transition flex items-center justify-center gap-1 cursor-pointer ${
                  paymentMethod === 'efectivo'
                    ? 'bg-[#0F766E] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-[#F6F8F7] dark:hover:bg-slate-700'
                }`}
              >
                <Banknote className="w-3.5 h-3.5" />
                <span>Efectivo</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('tarjeta')}
                className={`flex-1 py-1.5 px-2 rounded-[4px] text-xs font-semibold transition flex items-center justify-center gap-1 cursor-pointer ${
                  paymentMethod === 'tarjeta'
                    ? 'bg-slate-800 text-white shadow-xs dark:bg-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-[#F6F8F7] dark:hover:bg-slate-700'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Tarjeta</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('transferencia')}
                className={`flex-1 py-1.5 px-2 rounded-[4px] text-xs font-semibold transition flex items-center justify-center gap-1 cursor-pointer ${
                  paymentMethod === 'transferencia'
                    ? 'bg-slate-800 text-white shadow-xs dark:bg-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-[#F6F8F7] dark:hover:bg-slate-700'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Transferencia</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('chivo_wallet')}
                className={`flex-1 py-1.5 px-2 rounded-[4px] text-xs font-semibold transition flex items-center justify-center gap-1 cursor-pointer ${
                  paymentMethod === 'chivo_wallet'
                    ? 'bg-slate-800 text-white shadow-xs dark:bg-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-[#F6F8F7] dark:hover:bg-slate-700'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Chivo / BTC</span>
              </button>
            </div>

            {/* Cash Tendering & Live Change Calculation */}
            {paymentMethod === 'efectivo' && (
              <div className="p-3 rounded-[6px] bg-white dark:bg-slate-800 border border-[#E3E8E6] dark:border-slate-700 shadow-none space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Banknote className="w-4 h-4 text-[#0F766E]" />
                    Pago en Efectivo & Vuelto
                  </span>
                  {calculations.isCashEmpty ? (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-[4px] bg-teal-50 dark:bg-teal-950 text-[#0F766E] dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                      Modo: Efectivo Exacto ({formatCurrencyUSD(calculations.totalToPay)})
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-[4px] bg-[#F6F8F7] dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-[#E3E8E6] dark:border-slate-700">
                      Entregó: {formatCurrencyUSD(calculations.cashNum)}
                    </span>
                  )}
                </div>

                {/* Cash Input & Quick Bill Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
                  <div className="flex-1">
                    <label htmlFor="pos-cash-input" className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Monto recibido: <span className="font-normal opacity-75">(digite o pulse billete)</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center font-mono font-bold text-slate-400 text-sm">
                        $
                      </span>
                      <input
                        ref={cashInputRef}
                        id="pos-cash-input"
                        type="text"
                        inputMode="decimal"
                        value={cashGiven}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9.,]/g, '');
                          setCashGiven(val);
                        }}
                        placeholder={`${calculations.totalToPay.toFixed(2)} (Exacto)`}
                        className="w-full pl-8 pr-16 py-2 rounded-[6px] border border-[#CBD5E1] dark:border-slate-600 bg-[#F6F8F7] dark:bg-slate-900 font-mono font-bold text-slate-900 dark:text-white text-base focus:outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E]"
                      />
                      {cashGiven && (
                        <button
                          type="button"
                          onClick={() => setCashGiven('')}
                          className="absolute inset-y-0 right-1.5 px-2 my-1.5 rounded-[4px] bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-300 text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                          title="Restablecer a monto exacto"
                        >
                          <X className="w-3 h-3" />
                          <span>Exacto</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Quick bill buttons */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold uppercase text-slate-500 block">Billetes Rápidos:</span>
                    <div className="flex items-center gap-1 flex-wrap">
                      <button
                        type="button"
                        id="pos-cash-exact-btn"
                        onClick={setExactCash}
                        className={`px-2.5 py-1.5 rounded-[4px] text-xs font-semibold transition border cursor-pointer ${
                          calculations.isCashEmpty || calculations.cashNum === calculations.totalToPay
                            ? 'bg-[#0F766E] text-white border-[#0F766E] shadow-xs'
                            : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-[#E3E8E6] dark:border-slate-600 hover:bg-[#F6F8F7]'
                        }`}
                      >
                        Exacto
                      </button>
                      {[1, 5, 10, 20, 50, 100].map((bill) => (
                        <button
                          key={bill}
                          type="button"
                          id={`pos-cash-bill-${bill}`}
                          onClick={() => handleQuickCash(bill)}
                          className={`px-2.5 py-1.5 rounded-[4px] text-xs font-semibold transition border cursor-pointer ${
                            !calculations.isCashEmpty && calculations.cashNum === bill
                              ? 'bg-[#0F766E] text-white border-[#0F766E] shadow-xs'
                              : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-[#E3E8E6] dark:border-slate-600 hover:bg-teal-50 hover:text-[#0F766E]'
                          }`}
                        >
                          ${bill}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Live Change / Vuelto or Shortfall Banner */}
                {calculations.cashShortfall > 0 && !calculations.isCashEmpty ? (
                  <div className="p-2.5 rounded-[6px] bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <div>
                        <p className="font-semibold text-xs">Monto en Efectivo Insuficiente</p>
                        <p className="text-[11px] text-amber-700 dark:text-amber-300">
                          Entregó {formatCurrencyUSD(calculations.cashNum)}. Faltan {formatCurrencyUSD(calculations.cashShortfall)} para completar el total de {formatCurrencyUSD(calculations.totalToPay)}.
                        </p>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-amber-700 dark:text-amber-300 text-base">
                      -{formatCurrencyUSD(calculations.cashShortfall)}
                    </span>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-[6px] bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-[4px] bg-[#059669] text-white flex items-center justify-center font-bold text-sm">
                        $
                      </div>
                      <div>
                        <p className="font-bold text-xs uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                          Vuelto / Cambio a entregar:
                        </p>
                        <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-mono">
                          {calculations.isCashEmpty
                            ? `Pago exacto de ${formatCurrencyUSD(calculations.totalToPay)} (Sin cambio)`
                            : `Recibió: ${formatCurrencyUSD(calculations.cashNum)} — Total: ${formatCurrencyUSD(calculations.totalToPay)}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-black text-emerald-700 dark:text-emerald-300 text-xl sm:text-2xl block leading-tight">
                        {formatCurrencyUSD(calculations.changeDue)}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">
                        {calculations.changeDue > 0 ? '✓ Entregar Vuelto' : '✓ Cabal / Exacto'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* BIG ACTION: COBRAR Y EMITIR FACTURA / CCF / TICKET */}
            <button
              type="button"
              id="pos-checkout-btn"
              disabled={cart.length === 0 || (paymentMethod === 'efectivo' && !calculations.isSufficientCash)}
              onClick={handleCompleteSale}
              className={`w-full py-3 px-4 rounded-[6px] font-bold text-sm tracking-wide shadow-none transition flex items-center justify-center gap-2 cursor-pointer ${
                cart.length === 0
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                  : paymentMethod === 'efectivo' && !calculations.isSufficientCash
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-[#0F766E] hover:bg-[#115E59] active:bg-[#134E4A] text-white active:scale-[0.99]'
              }`}
            >
              <Check className="w-4 h-4 shrink-0" />
              <span>
                {cart.length === 0
                  ? 'AGREGUE PRODUCTOS AL TICKET PARA COBRAR'
                  : paymentMethod === 'efectivo' && !calculations.isSufficientCash
                  ? `FALTAN ${formatCurrencyUSD(calculations.cashShortfall)} — INGRESE MONTO SUFICIENTE`
                  : `COBRAR ${formatCurrencyUSD(calculations.totalToPay)}${
                      paymentMethod === 'efectivo' && calculations.changeDue > 0
                        ? ` (VUELTO: ${formatCurrencyUSD(calculations.changeDue)})`
                        : ''
                    } Y EMITIR ${
                      invoiceType === 'factura_consumidor_final'
                        ? 'FACTURA (FCF)'
                        : invoiceType === 'credito_fiscal'
                        ? 'CRÉDITO FISCAL (CCF)'
                        : 'TICKET'
                    }`}
              </span>
              <span className="text-xs font-mono font-normal opacity-80 shrink-0 hidden sm:inline">
                (F12 / Enter)
              </span>
            </button>
          </div>
        </div>

        {/* RIGHT 5 COLS: Quick Touch Catalog / Simulator */}
        <div className="lg:col-span-5 flex flex-col bg-white dark:bg-slate-900 rounded-[8px] border border-[#E3E8E6] dark:border-slate-800 shadow-none overflow-hidden">
          {/* Header with Search and Category Filter */}
          <div className="p-3 border-b border-[#E3E8E6] dark:border-slate-800 bg-[#F6F8F7] dark:bg-slate-850 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Store className="w-4 h-4 text-[#0F766E]" />
                Catálogo Táctil de Productos
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="pos-catalog-add-prod-btn"
                  onClick={() => {
                    setNewProductForm({
                      code: `PRD-${Date.now().toString().slice(-4)}`,
                      barcode: barcodeInput.trim() || '',
                      name: '',
                      category: 'General',
                      unit: 'Unidad',
                      salePrice: 1.0,
                      currentCost: 0.6,
                      stock: 25,
                      minStock: 5,
                      location: 'Estante Principal',
                      isService: false,
                    });
                    setIsNewProductModalOpen(true);
                  }}
                  className="px-2 py-0.5 rounded-[4px] bg-white dark:bg-slate-800 hover:bg-[#F6F8F7] text-slate-700 dark:text-slate-300 border border-[#E3E8E6] dark:border-slate-700 text-[10px] font-semibold flex items-center gap-1 transition cursor-pointer"
                  title="Registrar producto y asignar código de barras"
                >
                  <Plus className="w-3 h-3 text-[#0F766E]" />
                  <span>Nuevo Prod.</span>
                </button>
                <span className="text-[10px] text-slate-400">
                  {filteredProducts.length} productos
                </span>
              </div>
            </div>

            {/* Catalog search bar */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                placeholder="Buscar por nombre, SKU o código..."
                className="w-full pl-9 pr-3 py-1.5 rounded-[6px] border border-[#CBD5E1] dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0F766E]"
              />
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-[11px]">
              <button
                type="button"
                onClick={() => setFilterCategory('all')}
                className={`px-2.5 py-1 rounded-[4px] font-semibold shrink-0 transition cursor-pointer ${
                  filterCategory === 'all'
                    ? 'bg-[#0F766E] text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-[#E3E8E6] dark:border-slate-700'
                }`}
              >
                Todos
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFilterCategory(cat)}
                  className={`px-2.5 py-1 rounded-[4px] font-medium shrink-0 transition cursor-pointer ${
                    filterCategory === cat
                      ? 'bg-[#0F766E] text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-[#E3E8E6] dark:border-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Grid of Clickable Product Cards (Instant Scan Simulator) */}
          <div className="flex-1 overflow-y-auto p-2 grid grid-cols-2 sm:grid-cols-2 gap-2 max-h-[500px]">
            {filteredProducts.map((prod) => (
              <button
                key={prod.id}
                type="button"
                id={`pos-quick-prod-${prod.id}`}
                onClick={() => {
                  addProductToCart(prod);
                  playAudioCue('scan');
                  setLastScannedFeedback({
                    text: `✓ Agregado al ticket: ${prod.name}`,
                    product: prod,
                    type: 'success',
                  });
                }}
                className="text-left p-2.5 rounded-[6px] border border-[#E3E8E6] dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-[#0F766E] dark:hover:border-teal-700 transition flex flex-col justify-between group active:scale-[0.98] cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[9px] px-1 py-0.5 rounded bg-[#F6F8F7] dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:text-[#0F766E] transition truncate max-w-[100px]">
                      ||| {prod.barcode || prod.code}
                    </span>
                    <span
                      className={`text-[9px] font-semibold px-1 rounded ${
                        prod.stock <= prod.minStock
                          ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                          : 'bg-[#F6F8F7] dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {prod.stock} stk
                    </span>
                  </div>
                  <p className="font-semibold text-xs text-slate-900 dark:text-white line-clamp-2 leading-tight">
                    {prod.name}
                  </p>
                </div>

                <div className="mt-2 pt-1 border-t border-[#E3E8E6] dark:border-slate-800 flex items-center justify-between">
                  <span className="font-mono font-bold text-[#0F766E] dark:text-teal-400 text-sm">
                    {formatCurrencyUSD(prod.salePrice)}
                  </span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-teal-50 dark:bg-teal-950 text-[#0F766E] dark:text-teal-400 opacity-0 group-hover:opacity-100 transition">
                    + Agregar
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MODAL 1: Thermal Receipt & Sale Completed Modal */}
      {isCompletedSaleModalOpen && completedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 bg-emerald-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                <div>
                  <h3 className="text-sm font-black tracking-wide uppercase">
                    ¡Venta Registrada Exitosamente!
                  </h3>
                  <p className="text-[11px] text-emerald-100">
                    Comprobante: {completedInvoice.correlativeNumber}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleNextSale}
                className="text-white hover:bg-emerald-700 p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Thermal Ticket Preview (80mm Paper Styling) */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-100 dark:bg-slate-950">
              <div
                id="thermal-ticket-print-area"
                className="bg-white text-slate-900 p-5 rounded-xl border border-dashed border-slate-300 shadow-sm font-mono text-xs max-w-xs mx-auto"
              >
                <div className="text-center pb-3 border-b border-dashed border-slate-300">
                  <h4 className="font-black text-sm uppercase tracking-wide">
                    {currentCompany.name}
                  </h4>
                  <p className="text-[11px] font-bold text-slate-600">{currentCompany.tradeName}</p>
                  {completedInvoice.branchName && (
                    <p className="text-[11px] font-bold text-indigo-700">
                      Sucursal: {completedInvoice.branchName}
                    </p>
                  )}
                  <p className="text-[10px] text-slate-500">{currentCompany.address}</p>
                  <p className="text-[10px] text-slate-500">
                    NIT: {currentCompany.nit} | NRC: {currentCompany.nrc}
                  </p>
                  <p className="text-[10px] text-slate-500">Giro: {currentCompany.giro}</p>
                  <p className="text-[10px] font-bold mt-1 text-indigo-700">
                    {currentCompany.dteActive ? 'DOCUMENTO TRIBUTARIO ELECTRÓNICO (DTE)' : 'TICKET DE CONTROL INTERNO'}
                  </p>
                </div>

                <div className="py-2.5 border-b border-dashed border-slate-300 text-[10px] space-y-0.5">
                  <div className="flex justify-between">
                    <span>N° Correlativo:</span>
                    <span className="font-bold">{completedInvoice.correlativeNumber}</span>
                  </div>
                  {completedInvoice.dteCode && (
                    <div className="flex justify-between">
                      <span>Cód. Generación:</span>
                      <span className="font-bold truncate max-w-[150px]">{completedInvoice.dteCode}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Fecha & Hora:</span>
                    <span>{completedInvoice.date} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cliente:</span>
                    <span className="font-bold truncate max-w-[150px]">{completedInvoice.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Atendió:</span>
                    <span>{currentUser.name}</span>
                  </div>
                  {completedInvoice.branchName && (
                    <div className="flex justify-between">
                      <span>Sucursal:</span>
                      <span className="font-bold text-indigo-700">{completedInvoice.branchName}</span>
                    </div>
                  )}
                </div>

                {/* Item list */}
                <div className="py-2 border-b border-dashed border-slate-300 space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-slate-500">
                    <span>CANT / DESCRIPCIÓN</span>
                    <span>TOTAL</span>
                  </div>
                  {completedInvoice.items.map((it) => (
                    <div key={it.id} className="flex justify-between text-[11px]">
                      <div className="truncate max-w-[180px]">
                        <span>{it.quantity} x {it.description}</span>
                      </div>
                      <span className="font-bold">{formatCurrencyUSD(it.total)}</span>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="pt-2 text-right space-y-0.5 text-[11px]">
                  <div className="flex justify-between">
                    <span>Sumas Gravadas:</span>
                    <span>{formatCurrencyUSD(completedInvoice.sumasGravadas)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>IVA 13%:</span>
                    <span>{formatCurrencyUSD(completedInvoice.iva13)}</span>
                  </div>
                  <div className="flex justify-between font-black text-sm pt-1 border-t border-slate-300">
                    <span>TOTAL PAGAR:</span>
                    <span>{formatCurrencyUSD(completedInvoice.totalPagar)}</span>
                  </div>

                  {/* Tender details if available */}
                  {lastSaleTender && (
                    <div className="pt-2 mt-1 border-t border-dotted border-slate-300 space-y-0.5 text-[10px] text-slate-700">
                      <div className="flex justify-between">
                        <span>Forma de Pago:</span>
                        <span className="font-bold uppercase">{lastSaleTender.method}</span>
                      </div>
                      {lastSaleTender.method === 'efectivo' && (
                        <>
                          <div className="flex justify-between">
                            <span>Efectivo Entregado:</span>
                            <span className="font-mono font-bold">{formatCurrencyUSD(lastSaleTender.received)}</span>
                          </div>
                          <div className="flex justify-between text-[11px] font-black text-emerald-800">
                            <span>Vuelto / Cambio:</span>
                            <span className="font-mono">{formatCurrencyUSD(lastSaleTender.change)}</span>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-dashed border-slate-300 text-center text-[9px] text-slate-500 space-y-1">
                  <p>¡Gracias por su compra en El Salvador!</p>
                  <p className="font-mono">Resolución MH N° 2026-DTE-SV</p>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Ticket (80mm)</span>
              </button>
              <button
                type="button"
                id="pos-next-sale-btn"
                onClick={handleNextSale}
                className="flex-1 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black transition flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20"
              >
                <span>Nueva Venta (Escáner)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Customer Picker (For CCF or specific clients) */}
      {showCustomerPickerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-600" />
                Seleccionar Cliente para la Venta
              </h3>
              <button
                type="button"
                onClick={() => setShowCustomerPickerModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Default: Walk-in / Consumidor Final */}
            <button
              type="button"
              onClick={() => {
                setSelectedCustomerId('walk_in');
                setShowCustomerPickerModal(false);
              }}
              className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition ${
                selectedCustomerId === 'walk_in'
                  ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <div>
                <p className="font-bold text-xs">Consumidor Final / Cliente de Mostrador</p>
                <p className="text-[11px] text-slate-500">Venta rápida al contado sin datos fiscales</p>
              </div>
              {selectedCustomerId === 'walk_in' && <Check className="w-4 h-4 text-indigo-600" />}
            </button>

            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
                Clientes Registrados en el CRM ({customers.length})
              </p>
              {customers.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setSelectedCustomerId(c.id);
                    setShowCustomerPickerModal(false);
                  }}
                  className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition text-xs ${
                    selectedCustomerId === c.id
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{c.name}</p>
                    <p className="text-[10px] text-slate-500">
                      NIT: {c.nit} {c.nrc ? `| NRC: ${c.nrc}` : ''} {c.isGranContribuyente ? '• Gran Contribuyente' : ''}
                    </p>
                  </div>
                  {selectedCustomerId === c.id && <Check className="w-4 h-4 text-indigo-600" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Shift / Corte de Caja Summary */}
      {showShiftSummaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Resumen & Corte de Caja (Turno de Hoy)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowShiftSummaryModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 block font-bold">VENTAS TOTALES HOY</span>
                <span className="font-mono font-black text-emerald-600 text-base">
                  {formatCurrencyUSD(todayTotalSales)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 block font-bold">COMPROBANTES EMITIDOS</span>
                <span className="font-mono font-black text-slate-800 dark:text-slate-200 text-base">
                  {todayInvoices.length} facturas
                </span>
              </div>
            </div>

            <div className="space-y-1.5 max-h-52 overflow-y-auto text-xs">
              <p className="text-[11px] font-bold text-slate-500">Últimas transacciones:</p>
              {todayInvoices.slice(0, 8).map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800"
                >
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{inv.correlativeNumber}</span>
                    <span className="text-[10px] text-slate-400 block truncate max-w-[160px]">{inv.customerName}</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-600">
                    {formatCurrencyUSD(inv.totalPagar)}
                  </span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowShiftSummaryModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs cursor-pointer"
            >
              Cerrar Resumen
            </button>
          </div>
        </div>
      )}

      {/* MODAL 4: Registrar Nuevo Producto con Código de Barras Directo */}
      {isNewProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <ScanBarcode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Registrar Producto con Código de Barras
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Asigne el código de barras físico (EAN-13, UPC o personalizado) para escanearlo en caja
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewProductModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createProduct({
                  ...newProductForm,
                  barcode: newProductForm.barcode?.trim() || undefined,
                });
                setIsNewProductModalOpen(false);
                playAudioCue('cash_chime');
                setLastScannedFeedback({
                  text: `✓ Producto "${newProductForm.name}" guardado exitosamente con código ${newProductForm.barcode || newProductForm.code}`,
                  type: 'success',
                });
              }}
              className="space-y-3.5"
            >
              {/* Barcode & SKU Highlight Box */}
              <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                    <ScanBarcode className="w-4 h-4 text-indigo-600" />
                    Código de Barras del Producto (EAN / UPC / Código):
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setCameraScanTarget('newProduct');
                      setIsCameraScannerOpen(true);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold shadow-xs transition cursor-pointer"
                    title="Abrir la cámara del dispositivo para capturar el código del producto"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Leer con Cámara</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Ej: 7411002345678 (Pase el lector o cámara)"
                    value={newProductForm.barcode || ''}
                    onChange={(e) => setNewProductForm({ ...newProductForm, barcode: e.target.value })}
                    className="w-full pl-3 pr-24 py-2 rounded-xl border-2 border-indigo-400 dark:border-indigo-600 bg-white dark:bg-slate-900 font-mono font-black text-indigo-950 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="absolute inset-y-0 right-2 flex items-center">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-200 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
                      |||| BARCODE
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Código Interno / SKU:
                  </label>
                  <input
                    type="text"
                    value={newProductForm.code}
                    onChange={(e) => setNewProductForm({ ...newProductForm, code: e.target.value })}
                    placeholder="PRD-001"
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Categoría:
                  </label>
                  <input
                    type="text"
                    value={newProductForm.category}
                    onChange={(e) => setNewProductForm({ ...newProductForm, category: e.target.value })}
                    placeholder="Bebidas / Abarrotes / Hardware / Farmacia"
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Nombre del Producto:
                </label>
                <input
                  type="text"
                  value={newProductForm.name}
                  onChange={(e) => setNewProductForm({ ...newProductForm, name: e.target.value })}
                  placeholder="Ej: Leche Salud Entera 1 Litro"
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Precio Venta ($):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProductForm.salePrice}
                    onChange={(e) =>
                      setNewProductForm({ ...newProductForm, salePrice: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-emerald-600"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Costo Compra ($):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProductForm.currentCost}
                    onChange={(e) =>
                      setNewProductForm({ ...newProductForm, currentCost: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Stock Inicial:
                  </label>
                  <input
                    type="number"
                    value={newProductForm.stock}
                    onChange={(e) =>
                      setNewProductForm({ ...newProductForm, stock: parseInt(e.target.value) || 0 })
                    }
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewProductModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  id="pos-save-new-product-btn"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar Producto en Catálogo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL 5: Escáner de Código de Barras con Cámara del Móvil / Tablet */}
      <CameraBarcodeScannerModal
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        continuous={cameraScanTarget === 'cart'}
        title={
          cameraScanTarget === 'cart'
            ? 'Escanear Productos al Ticket'
            : 'Escanear Código de Barras para Registro'
        }
        description={
          cameraScanTarget === 'cart'
            ? 'Alinee el código de barras en el marco. Cada producto se agregará de inmediato al ticket.'
            : 'Alinee el código de barras del producto físico para vincularlo a este nuevo artículo.'
        }
        onScan={(decodedText) => {
          if (cameraScanTarget === 'cart') {
            handleScanProduct(decodedText);
          } else {
            setNewProductForm((prev) => ({ ...prev, barcode: decodedText }));
            setIsCameraScannerOpen(false);
            playAudioCue('scan');
          }
        }}
      />
    </div>
  );
};