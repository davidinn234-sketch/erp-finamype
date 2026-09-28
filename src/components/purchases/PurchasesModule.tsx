import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  ShoppingBag,
  Plus,
  Search,
  Building,
  Layers,
  AlertTriangle,
  FileText,
  DollarSign,
  Package,
  X,
  CheckCircle2,
  TrendingDown,
  Warehouse,
  Camera,
  Edit,
  Trash2,
} from 'lucide-react';
import { Purchase, PurchaseDocType, Supplier, Product, ValuationMethod } from '../../types';
import { formatCurrencyUSD, calculatePurchaseTaxes } from '../../utils/salvadoranTax';
import { CameraBarcodeScannerModal } from '../pos/CameraBarcodeScannerModal';

interface PurchasesModuleProps {
  isNewPurchaseModalOpen: boolean;
  onCloseNewPurchaseModal: () => void;
  onOpenNewPurchaseModal: () => void;
  initialTab?: 'purchases' | 'cxp' | 'kardex' | 'suppliers' | 'inventory';
}

export const PurchasesModule: React.FC<PurchasesModuleProps> = ({
  isNewPurchaseModalOpen,
  onCloseNewPurchaseModal,
  onOpenNewPurchaseModal,
  initialTab = 'purchases',
}) => {
  const {
    purchases,
    suppliers,
    products,
    kardexMovements,
    currentCompany,
    createPurchase,
    updatePurchase,
    deletePurchase,
    registerSupplierPayment,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    createProduct,
    updateProduct,
    bankAccounts,
  } = useERP();

  const [activeTab, setActiveTab] = useState<'purchases' | 'cxp' | 'kardex' | 'suppliers' | 'inventory'>(initialTab);

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [valuationMethod, setValuationMethod] = useState<ValuationMethod>('promedio_ponderado');
  const [searchTerm, setSearchTerm] = useState('');
  const [listSearch, setListSearch] = useState('');
  const matchList = (...vals: (string | number | undefined)[]) =>
    vals.join(' ').toLowerCase().includes(listSearch.trim().toLowerCase());
  const [selectedProductForKardex, setSelectedProductForKardex] = useState<string>('all');

  // Supplier Payment Modal
  const [paymentModalPurchase, setPaymentModalPurchase] = useState<Purchase | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentSourceAccount, setPaymentSourceAccount] = useState<string>(bankAccounts[0]?.id || '');
  const [paymentRefNumber, setPaymentRefNumber] = useState<string>('');

  // Editing Modals State
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Supplier Modal State
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [newSupplierForm, setNewSupplierForm] = useState<Omit<Supplier, 'id'>>({
    name: '',
    tradeName: '',
    nrc: '',
    nit: '',
    giro: '',
    address: '',
    phone: '',
    email: '',
    isGranContribuyente: false,
    isSujetoExcluido: false,
    paymentTermDays: 30,
  });

  // Product Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [newProductForm, setNewProductForm] = useState<Omit<Product, 'id' | 'companyId'>>({
    code: '',
    name: '',
    category: 'Hardware',
    unit: 'Unidad',
    salePrice: 100,
    currentCost: 60,
    stock: 10,
    minStock: 5,
    location: 'Bodega Central',
    isService: false,
  });

  // New Purchase Form State
  const [purchaseDocType, setPurchaseDocType] = useState<PurchaseDocType>('ccf_compra');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(suppliers[0]?.id || '');
  const [purchaseDocNumber, setPurchaseDocNumber] = useState<string>('');
  const [purchaseItems, setPurchaseItems] = useState<
    Array<{
      productId: string;
      description: string;
      quantity: number;
      unitCost: number;
      total: number;
    }>
  >([
    {
      productId: products[0]?.id || '',
      description: products[0]?.name || '',
      quantity: 1,
      unitCost: products[0]?.currentCost || 50,
      total: products[0]?.currentCost || 50,
    },
  ]);

  const selectedSupplier = suppliers.find((s) => s.id === selectedSupplierId) || suppliers[0];

  // Purchase Tax Calculations
  const comprasGravadas = purchaseDocType === 'ccf_compra' ? purchaseItems.reduce((acc, it) => acc + it.total, 0) : 0;
  const comprasSujetoExcluido = purchaseDocType === 'factura_sujeto_excluido' ? purchaseItems.reduce((acc, it) => acc + it.total, 0) : 0;

  const taxCalculations = calculatePurchaseTaxes({
    docType: purchaseDocType,
    comprasGravadas,
    comprasExentas: 0,
    comprasSujetoExcluido,
    isCompanyGranContribuyente: currentCompany.isGranContribuyente,
    isSupplierGranContribuyente: selectedSupplier?.isGranContribuyente || false,
    isServicesPurchase: selectedSupplier?.isSujetoExcluido,
  });

  const handleAddPurchaseItem = () => {
    const defaultProd = products[0];
    if (!defaultProd) return;
    setPurchaseItems((prev) => [
      ...prev,
      {
        productId: defaultProd.id,
        description: defaultProd.name,
        quantity: 1,
        unitCost: defaultProd.currentCost,
        total: defaultProd.currentCost,
      },
    ]);
  };

  const handleRemovePurchaseItem = (index: number) => {
    if (purchaseItems.length > 1) {
      setPurchaseItems((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleProductSelect = (index: number, productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;
    setPurchaseItems((prev) =>
      prev.map((it, i) =>
        i === index
          ? {
              ...it,
              productId: prod.id,
              description: prod.name,
              unitCost: prod.currentCost,
              total: prod.currentCost * it.quantity,
            }
          : it
      )
    );
  };

  const handleQtyChange = (index: number, qty: number) => {
    const validQty = Math.max(1, qty);
    setPurchaseItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, quantity: validQty, total: it.unitCost * validQty } : it))
    );
  };

  const handleCostChange = (index: number, cost: number) => {
    const validCost = Math.max(0, cost);
    setPurchaseItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, unitCost: validCost, total: validCost * it.quantity } : it))
    );
  };

  const handleSubmitPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier) return;

    const now = new Date();
    const dueDate = new Date();
    dueDate.setDate(now.getDate() + (selectedSupplier.paymentTermDays || 15));

    createPurchase({
      docType: purchaseDocType,
      documentNumber: purchaseDocNumber || `CCF-${Date.now().toString().slice(-6)}`,
      date: now.toISOString().split('T')[0],
      dueDate: dueDate.toISOString().split('T')[0],
      supplierId: selectedSupplier.id,
      supplierName: selectedSupplier.name,
      supplierNrc: selectedSupplier.nrc,
      supplierNit: selectedSupplier.nit,
      supplierIsGranContribuyente: selectedSupplier.isGranContribuyente,
      status: 'registrada',
      items: purchaseItems.map((item, idx) => ({
        id: `pitem_${Date.now()}_${idx}`,
        ...item,
      })),
      comprasGravadas: taxCalculations.comprasGravadas,
      comprasExentas: taxCalculations.comprasExentas,
      comprasSujetoExcluido: taxCalculations.comprasSujetoExcluido,
      ivaCreditoFiscal: taxCalculations.ivaCreditoFiscal,
      retencionRenta10: taxCalculations.retencionRenta10,
      retencionIva1: taxCalculations.retencionIva1,
      percepcionIva1: taxCalculations.percepcionIva1,
      totalPagar: taxCalculations.totalPagar,
      saldoPendiente: taxCalculations.totalPagar,
      isServicesPurchase: selectedSupplier.isSujetoExcluido,
    });

    onCloseNewPurchaseModal();
  };

  const handleOpenPayment = (pur: Purchase) => {
    setPaymentModalPurchase(pur);
    setPaymentAmount(pur.saldoPendiente);
    setPaymentRefNumber(`TRF-${Date.now().toString().slice(-6)}`);
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalPurchase) return;

    registerSupplierPayment({
      purchaseId: paymentModalPurchase.id,
      purchaseNumber: paymentModalPurchase.documentNumber,
      supplierId: paymentModalPurchase.supplierId,
      supplierName: paymentModalPurchase.supplierName,
      date: new Date().toISOString().split('T')[0],
      amount: Number(paymentAmount),
      paymentMethod: 'transferencia',
      sourceAccountId: paymentSourceAccount,
      referenceNumber: paymentRefNumber,
    });

    setPaymentModalPurchase(null);
  };

  const cxpPurchases = purchases.filter((p) => p.status !== 'pagada' && p.status !== 'anulada');

  const filteredKardex = kardexMovements.filter(
    (k) => selectedProductForKardex === 'all' || k.productId === selectedProductForKardex
  );

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Compras, Proveedores & Kardex Valorado
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
              SCM & F-07 IVA
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro de Crédito Fiscal IVA (13%), Retención Renta 10%, valuación de inventario y control de CxP.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsProductModalOpen(true)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Package className="w-4 h-4 text-blue-500" />
            <span>Nuevo Producto</span>
          </button>
          <button
            onClick={() => setIsSupplierModalOpen(true)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Building className="w-4 h-4 text-indigo-500" />
            <span>Nuevo Proveedor</span>
          </button>
          <button
            onClick={onOpenNewPurchaseModal}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Compra / Factura</span>
          </button>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('purchases')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
            activeTab === 'purchases'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Registro de Compras ({purchases.length})
        </button>
        <button
          onClick={() => setActiveTab('cxp')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === 'cxp'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <span>Cuentas por Pagar (CxP)</span>
          {cxpPurchases.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-mono">
              {cxpPurchases.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('kardex')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
            activeTab === 'kardex'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Kardex Permanente Valorado
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
            activeTab === 'inventory'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Inventario & Stock ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
            activeTab === 'suppliers'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Directorio de Proveedores ({suppliers.length})
        </button>
      </div>

      {/* Tab 1: Compras */}
      {activeTab === 'purchases' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={listSearch}
              onChange={(e) => setListSearch(e.target.value)}
              placeholder="Buscar compra por N° de documento, proveedor, NIT, estado o fecha..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200"
            />
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5">N° Documento</th>
                    <th className="p-3.5">Proveedor</th>
                    <th className="p-3.5">Fecha / Vence</th>
                    <th className="p-3.5 text-right">Compras Gravadas</th>
                    <th className="p-3.5 text-right">IVA Crédito 13%</th>
                    <th className="p-3.5 text-right">Retenciones</th>
                    <th className="p-3.5 text-right">Total a Pagar</th>
                    <th className="p-3.5 text-center">Estado</th>
                    <th className="p-3.5 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {purchases.filter((p) => matchList(p.documentNumber, p.supplierName, p.supplierNit, p.docType, p.status, p.date)).map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                        {p.documentNumber}
                        <p className="text-[10px] text-slate-400 font-normal uppercase">
                          {p.docType.replace('_', ' ')}
                        </p>
                      </td>
                      <td className="p-3.5">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{p.supplierName}</p>
                        <p className="text-[10px] text-slate-400">NIT: {p.supplierNit}</p>
                      </td>
                      <td className="p-3.5">
                        <p className="text-slate-700 dark:text-slate-300 font-medium">{p.date}</p>
                        <p className="text-[10px] text-slate-400">Vence: {p.dueDate}</p>
                      </td>
                      <td className="p-3.5 text-right font-mono text-slate-700 dark:text-slate-300">
                        {formatCurrencyUSD(p.comprasGravadas + p.comprasSujetoExcluido)}
                      </td>
                      <td className="p-3.5 text-right font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                        {formatCurrencyUSD(p.ivaCreditoFiscal)}
                      </td>
                      <td className="p-3.5 text-right font-mono text-amber-600">
                        {p.retencionRenta10 > 0 && `Renta: $${p.retencionRenta10.toFixed(2)} `}
                        {p.retencionIva1 > 0 && `IVA: $${p.retencionIva1.toFixed(2)}`}
                        {p.retencionRenta10 === 0 && p.retencionIva1 === 0 && '$0.00'}
                      </td>
                      <td className="p-3.5 text-right font-mono font-black text-slate-900 dark:text-white">
                        {formatCurrencyUSD(p.totalPagar)}
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                            p.status === 'pagada'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {p.status !== 'pagada' && (
                            <button
                              onClick={() => handleOpenPayment(p)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] cursor-pointer"
                              title="Abonar o liquidar compra"
                            >
                              Pagar
                            </button>
                          )}
                          <button
                            onClick={() => setEditingPurchase(p)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                            title="Editar número de documento o vencimiento"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`¿Estás seguro de eliminar la compra #${p.documentNumber}? Se revertirá el stock de Kardex y saldo.`)) {
                                deletePurchase(p.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                            title="Eliminar compra"
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

      {/* Tab 2: CxP (Cuentas por Pagar) */}
      {activeTab === 'cxp' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/70 dark:bg-rose-950/40 flex justify-between items-center">
            <div>
              <span className="text-xs font-semibold text-rose-800 dark:text-rose-300">
                Total Compromisos por Pagar (CxP Proveedores)
              </span>
              <h3 className="text-2xl font-black text-rose-950 dark:text-rose-100 mt-1">
                {formatCurrencyUSD(cxpPurchases.reduce((acc, p) => acc + p.saldoPendiente, 0))}
              </h3>
            </div>
            <span className="text-xs font-semibold text-rose-700">
              {cxpPurchases.length} facturas pendientes de pago
            </span>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={listSearch}
              onChange={(e) => setListSearch(e.target.value)}
              placeholder="Buscar cuenta por pagar por proveedor, N° documento o fecha de vencimiento..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200"
            />
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3.5">N° Documento</th>
                  <th className="p-3.5">Proveedor</th>
                  <th className="p-3.5">Fecha Vencimiento</th>
                  <th className="p-3.5 text-right">Saldo Pendiente</th>
                  <th className="p-3.5 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {cxpPurchases.filter((p) => matchList(p.documentNumber, p.supplierName, p.dueDate)).map((p) => (
                  <tr key={p.id}>
                    <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                      {p.documentNumber}
                    </td>
                    <td className="p-3.5 font-semibold text-slate-800 dark:text-slate-200">
                      {p.supplierName}
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-300">
                      {p.dueDate}
                    </td>
                    <td className="p-3.5 text-right font-mono font-black text-rose-600">
                      {formatCurrencyUSD(p.saldoPendiente)}
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => handleOpenPayment(p)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer"
                      >
                        Pagar Proveedor
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Kardex Valorado */}
      {activeTab === 'kardex' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Filtrar por Producto:
              </span>
              <select
                value={selectedProductForKardex}
                onChange={(e) => setSelectedProductForKardex(e.target.value)}
                className="text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              >
                <option value="all">Todos los Productos Físicos</option>
                {products
                  .filter((p) => !p.isService)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.code}] {p.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Método de Valuación:</span>
              <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-50 dark:bg-slate-800">
                <button
                  onClick={() => setValuationMethod('promedio_ponderado')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-md cursor-pointer ${
                    valuationMethod === 'promedio_ponderado' ? 'bg-blue-600 text-white' : 'text-slate-500'
                  }`}
                >
                  Costo Promedio
                </button>
                <button
                  onClick={() => setValuationMethod('peps')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-md cursor-pointer ${
                    valuationMethod === 'peps' ? 'bg-blue-600 text-white' : 'text-slate-500'
                  }`}
                >
                  PEPS (FIFO)
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3.5">Fecha</th>
                  <th className="p-3.5">Producto</th>
                  <th className="p-3.5">Tipo / Ref.</th>
                  <th className="p-3.5 text-center">Entrada / Salida</th>
                  <th className="p-3.5 text-right">Costo Unit.</th>
                  <th className="p-3.5 text-right">Total Transac.</th>
                  <th className="p-3.5 text-right">Saldo Cantidad</th>
                  <th className="p-3.5 text-right">Valor Total Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {filteredKardex.map((k) => (
                  <tr key={k.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                    <td className="p-3.5 font-sans">{k.date}</td>
                    <td className="p-3.5 font-sans font-semibold text-slate-800 dark:text-slate-200">
                      {k.productName}
                    </td>
                    <td className="p-3.5 font-sans">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          k.type.includes('entrada')
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {k.type.replace('_', ' ').toUpperCase()} ({k.referenceDoc})
                      </span>
                    </td>
                    <td className="p-3.5 text-center font-bold">
                      {k.type.includes('entrada') ? `+${k.quantity}` : `-${k.quantity}`}
                    </td>
                    <td className="p-3.5 text-right">{formatCurrencyUSD(k.unitCost)}</td>
                    <td className="p-3.5 text-right font-semibold">{formatCurrencyUSD(k.totalCost)}</td>
                    <td className="p-3.5 text-right font-bold text-indigo-600 dark:text-indigo-400">
                      {k.balanceQuantity} uds
                    </td>
                    <td className="p-3.5 text-right font-black text-slate-900 dark:text-white">
                      {formatCurrencyUSD(k.balanceTotalCost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Inventario & Stock */}
      {activeTab === 'inventory' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="col-span-full relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={listSearch}
              onChange={(e) => setListSearch(e.target.value)}
              placeholder="Buscar producto por nombre, código, categoría o código de barras..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
            />
          </div>
          {products.filter((p) => matchList(p.name, p.code, p.category, p.barcode)).map((p) => (
            <div
              key={p.id}
              className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-slate-400">{p.code}</span>
                    {p.barcode && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                        ||| {p.barcode}
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">{p.name}</h3>
                  <span className="text-xs text-slate-500">{p.category}</span>
                </div>
                {p.stock <= p.minStock && !p.isService && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Stock Bajo
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400">Precio Venta:</span>
                  <p className="font-bold text-emerald-600">{formatCurrencyUSD(p.salePrice)}</p>
                </div>
                <div>
                  <span className="text-slate-400">Costo Actual:</span>
                  <p className="font-bold text-slate-700 dark:text-slate-300">{formatCurrencyUSD(p.currentCost)}</p>
                </div>
                <div>
                  <span className="text-slate-400">Existencias:</span>
                  <p className="font-black text-slate-900 dark:text-white">
                    {p.isService ? 'Ilimitado (Servicio)' : `${p.stock} ${p.unit}`}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Stock Mínimo (Editable):</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <input
                      type="number"
                      min="0"
                      key={`min-${p.id}-${p.minStock}`}
                      defaultValue={p.minStock}
                      onBlur={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        if (val !== p.minStock) {
                          updateProduct(p.id, { minStock: val });
                        }
                      }}
                      className="w-16 px-1.5 py-0.5 text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-md bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:ring-1 focus:ring-emerald-500 outline-none"
                    />
                    <span className="text-[11px] text-slate-400">{p.unit}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 5: Suppliers */}
      {activeTab === 'suppliers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="col-span-full relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={listSearch}
              onChange={(e) => setListSearch(e.target.value)}
              placeholder="Buscar proveedor por nombre, giro, NIT, NRC o teléfono..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
            />
          </div>
          {suppliers.filter((s) => matchList(s.name, s.tradeName, s.giro, s.nit, s.nrc, s.phone)).map((s) => (
            <div
              key={s.id}
              className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">{s.name}</h3>
                  <p className="text-xs text-slate-500">{s.giro}</p>
                </div>
                {s.isGranContribuyente && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                    Gran Contribuyente
                  </span>
                )}
                {s.isSujetoExcluido && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                    Sujeto Excluido (Renta 10%)
                  </span>
                )}
              </div>

              <div className="text-xs space-y-1 text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800">
                <p><span className="text-slate-400">NIT:</span> <span className="font-mono">{s.nit}</span></p>
                {s.nrc && <p><span className="text-slate-400">NRC:</span> <span className="font-mono">{s.nrc}</span></p>}
                <p><span className="text-slate-400">Plazo Pago:</span> {s.paymentTermDays} Días</p>
                <p><span className="text-slate-400">Tel:</span> {s.phone}</p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingSupplier(s)}
                  className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer flex items-center gap-1"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Editar</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`¿Eliminar al proveedor "${s.name}"? Esta acción no se puede deshacer.`)) deleteSupplier(s.id);
                  }}
                  className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: Registrar Compra */}
      {isNewPurchaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-3xl my-8 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-blue-600" />
                <span>Registro de Compra / Gasto con Validación Fiscal SV</span>
              </h3>
              <button onClick={onCloseNewPurchaseModal} className="cursor-pointer">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmitPurchase} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Tipo de Documento:
                  </label>
                  <select
                    value={purchaseDocType}
                    onChange={(e) => setPurchaseDocType(e.target.value as PurchaseDocType)}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  >
                    <option value="ccf_compra">CCF Compra (Crédito Fiscal 13%)</option>
                    <option value="factura_sujeto_excluido">Factura Sujeto Excluido (Renta 10%)</option>
                    <option value="declaracion_mercancias">Declaración de Importación</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Proveedor:
                  </label>
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.isGranContribuyente ? '(Gran Contrib.)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    N° Factura / CCF Proveedor:
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: CCF-849201"
                    value={purchaseDocNumber}
                    onChange={(e) => setPurchaseDocNumber(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                    required
                  />
                </div>
              </div>

              {/* Items */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    Artículos o Servicios Comprados:
                  </span>
                  <button
                    type="button"
                    onClick={handleAddPurchaseItem}
                    className="text-blue-600 font-bold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Agregar Ítem
                  </button>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] text-slate-500 uppercase font-bold">
                      <tr>
                        <th className="p-2.5">Producto</th>
                        <th className="p-2.5 w-20 text-center">Cant.</th>
                        <th className="p-2.5 w-28 text-right">Costo Unit. ($)</th>
                        <th className="p-2.5 w-28 text-right">Total ($)</th>
                        <th className="p-2.5 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {purchaseItems.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-2">
                            <select
                              value={item.productId}
                              onChange={(e) => handleProductSelect(idx, e.target.value)}
                              className="w-full p-1.5 rounded border border-slate-200 dark:border-slate-700 bg-transparent text-slate-800 dark:text-slate-200"
                            >
                              {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                  [{p.code}] {p.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-2 text-center">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleQtyChange(idx, parseInt(e.target.value) || 1)}
                              className="w-16 p-1.5 rounded border border-slate-200 dark:border-slate-700 text-center bg-transparent text-slate-800 dark:text-slate-200"
                            />
                          </td>
                          <td className="p-2 text-right">
                            <input
                              type="number"
                              step="0.01"
                              value={item.unitCost}
                              onChange={(e) => handleCostChange(idx, parseFloat(e.target.value) || 0)}
                              className="w-24 p-1.5 rounded border border-slate-200 dark:border-slate-700 text-right bg-transparent text-slate-800 dark:text-slate-200"
                            />
                          </td>
                          <td className="p-2 text-right font-mono font-bold text-slate-900 dark:text-white">
                            {formatCurrencyUSD(item.total)}
                          </td>
                          <td className="p-2 text-center">
                            {purchaseItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemovePurchaseItem(idx)}
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

              {/* Fiscal Breakdown */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 space-y-2">
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Compras Gravadas Netas:</span>
                  <span className="font-mono">{formatCurrencyUSD(taxCalculations.comprasGravadas + taxCalculations.comprasSujetoExcluido)}</span>
                </div>
                {taxCalculations.ivaCreditoFiscal > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>IVA Crédito Fiscal (13%):</span>
                    <span className="font-mono">+{formatCurrencyUSD(taxCalculations.ivaCreditoFiscal)}</span>
                  </div>
                )}
                {taxCalculations.retencionRenta10 > 0 && (
                  <div className="flex justify-between text-purple-600 font-semibold">
                    <span>Retención 10% Renta (Servicios Profesionales):</span>
                    <span className="font-mono">-{formatCurrencyUSD(taxCalculations.retencionRenta10)}</span>
                  </div>
                )}
                {taxCalculations.retencionIva1 > 0 && (
                  <div className="flex justify-between text-amber-600 font-semibold">
                    <span>Retención 1% IVA (Nuestra empresa Gran Contribuyente):</span>
                    <span className="font-mono">-{formatCurrencyUSD(taxCalculations.retencionIva1)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between font-black text-sm text-slate-900 dark:text-white">
                  <span>Total por Pagar al Proveedor:</span>
                  <span className="font-mono text-base text-blue-600 dark:text-blue-400">
                    {formatCurrencyUSD(taxCalculations.totalPagar)}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onCloseNewPurchaseModal}
                  className="px-4 py-2 rounded-xl border cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
                >
                  Guardar Compra & Actualizar Kardex
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Pagar a Proveedor */}
      {paymentModalPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Cancelar Factura de Proveedor (CxP)
              </h3>
              <button onClick={() => setPaymentModalPurchase(null)} className="cursor-pointer">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleConfirmPayment} className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {paymentModalPurchase.supplierName}
                </p>
                <p className="text-slate-500">Documento: {paymentModalPurchase.documentNumber}</p>
                <p className="text-rose-600 font-bold mt-1">
                  Saldo Pendiente: {formatCurrencyUSD(paymentModalPurchase.saldoPendiente)}
                </p>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Monto a Pagar ($ USD):
                </label>
                <input
                  type="number"
                  step="0.01"
                  max={paymentModalPurchase.saldoPendiente}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono font-bold"
                  required
                />
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className="text-[10px] text-slate-400 font-semibold">Abono rápido:</span>
                  <button
                    type="button"
                    onClick={() => setPaymentAmount(Number((paymentModalPurchase.saldoPendiente * 0.25).toFixed(2)))}
                    className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold cursor-pointer transition"
                  >
                    25%
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentAmount(Number((paymentModalPurchase.saldoPendiente * 0.50).toFixed(2)))}
                    className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold cursor-pointer transition"
                  >
                    50%
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentAmount(Number((paymentModalPurchase.saldoPendiente * 0.75).toFixed(2)))}
                    className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold cursor-pointer transition"
                  >
                    75%
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentAmount(paymentModalPurchase.saldoPendiente)}
                    className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 hover:bg-emerald-200 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold cursor-pointer transition"
                  >
                    100% Saldo Total
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Cuenta Origen del Desembolso:
                </label>
                <select
                  value={paymentSourceAccount}
                  onChange={(e) => setPaymentSourceAccount(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                >
                  {bankAccounts.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.accountName} (Disponible: ${b.currentBalance.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  N° Transferencia / Cheque:
                </label>
                <input
                  type="text"
                  value={paymentRefNumber}
                  onChange={(e) => setPaymentRefNumber(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPaymentModalPurchase(null)}
                  className="px-3 py-1.5 rounded-lg border cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
                >
                  Confirmar Pago & Asentar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Crear Producto */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Package className="w-4 h-4 text-blue-500" />
                <span>Registrar Producto en Catálogo</span>
              </h3>
              <button onClick={() => setIsProductModalOpen(false)} className="cursor-pointer">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createProduct(newProductForm);
                setIsProductModalOpen(false);
              }}
              className="space-y-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Código Interno (SKU):</label>
                  <input
                    type="text"
                    placeholder="HW-POS-01"
                    value={newProductForm.code}
                    onChange={(e) => setNewProductForm({ ...newProductForm, code: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                    required
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">Código de Barras (EAN/UPC):</label>
                    <button
                      type="button"
                      onClick={() => setIsCameraModalOpen(true)}
                      className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      <Camera className="w-3 h-3" />
                      <span>Cámara</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="7410001234567"
                    value={newProductForm.barcode || ''}
                    onChange={(e) => setNewProductForm({ ...newProductForm, barcode: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Categoría:</label>
                <input
                  type="text"
                  placeholder="Hardware / Bebidas / Abarrotes / Farmacia"
                  value={newProductForm.category}
                  onChange={(e) => setNewProductForm({ ...newProductForm, category: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Nombre:</label>
                <input
                  type="text"
                  placeholder="Terminal POS Android"
                  value={newProductForm.name}
                  onChange={(e) => setNewProductForm({ ...newProductForm, name: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Precio Venta ($):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProductForm.salePrice}
                    onChange={(e) => setNewProductForm({ ...newProductForm, salePrice: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Costo Unitario ($):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProductForm.currentCost}
                    onChange={(e) => setNewProductForm({ ...newProductForm, currentCost: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsProductModalOpen(false)} className="px-3 py-1.5 rounded-lg border">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-1.5 rounded-lg bg-blue-600 text-white font-bold">
                  Guardar Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Crear Proveedor */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Building className="w-4 h-4 text-indigo-500" />
                <span>Registrar Proveedor (SCM)</span>
              </h3>
              <button onClick={() => setIsSupplierModalOpen(false)} className="cursor-pointer">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createSupplier(newSupplierForm);
                setIsSupplierModalOpen(false);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Razón Social:</label>
                <input
                  type="text"
                  placeholder="Mayorista Tecnológico S.A. de C.V."
                  value={newSupplierForm.name}
                  onChange={(e) => setNewSupplierForm({ ...newSupplierForm, name: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">NIT:</label>
                  <input
                    type="text"
                    placeholder="0614-010195-102-1"
                    value={newSupplierForm.nit}
                    onChange={(e) => setNewSupplierForm({ ...newSupplierForm, nit: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">NRC:</label>
                  <input
                    type="text"
                    placeholder="192834-5"
                    value={newSupplierForm.nrc}
                    onChange={(e) => setNewSupplierForm({ ...newSupplierForm, nrc: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="supSujetoExcluidoCheck"
                  checked={newSupplierForm.isSujetoExcluido}
                  onChange={(e) => setNewSupplierForm({ ...newSupplierForm, isSujetoExcluido: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <label htmlFor="supSujetoExcluidoCheck" className="font-semibold text-slate-700 dark:text-slate-300">
                  Es Sujeto Excluido / Servicios Profesionales (Aplica 10% Retención de Renta)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsSupplierModalOpen(false)} className="px-3 py-1.5 rounded-lg border">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-1.5 rounded-lg bg-blue-600 text-white font-bold">
                  Guardar Proveedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Editar Compra */}
      {editingPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit className="w-4 h-4 text-emerald-600" />
                <span>Editar Compra / Factura Proveedor</span>
              </h3>
              <button onClick={() => setEditingPurchase(null)} className="cursor-pointer">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updatePurchase(editingPurchase.id, {
                  documentNumber: editingPurchase.documentNumber,
                  dueDate: editingPurchase.dueDate,
                  status: editingPurchase.status,
                });
                setEditingPurchase(null);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Proveedor:
                </label>
                <input
                  type="text"
                  disabled
                  value={editingPurchase.supplierName}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  N° Factura / CCF:
                </label>
                <input
                  type="text"
                  value={editingPurchase.documentNumber}
                  onChange={(e) => setEditingPurchase({ ...editingPurchase, documentNumber: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Fecha de Vencimiento:
                </label>
                <input
                  type="date"
                  value={editingPurchase.dueDate}
                  onChange={(e) => setEditingPurchase({ ...editingPurchase, dueDate: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Estado:
                </label>
                <select
                  value={editingPurchase.status}
                  onChange={(e) => setEditingPurchase({ ...editingPurchase, status: e.target.value as any })}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                >
                  <option value="registrada">Registrada (Pendiente)</option>
                  <option value="parcial">Parcial</option>
                  <option value="pagada">Pagada</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditingPurchase(null)} className="px-3 py-1.5 rounded-lg border cursor-pointer">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer">
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Editar Proveedor */}
      {editingSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit className="w-4 h-4 text-emerald-600" />
                <span>Editar Ficha de Proveedor</span>
              </h3>
              <button onClick={() => setEditingSupplier(null)} className="cursor-pointer">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateSupplier(editingSupplier.id, {
                  name: editingSupplier.name,
                  tradeName: editingSupplier.tradeName,
                  giro: editingSupplier.giro,
                  nit: editingSupplier.nit,
                  nrc: editingSupplier.nrc,
                  phone: editingSupplier.phone,
                  email: editingSupplier.email,
                  paymentTermDays: editingSupplier.paymentTermDays,
                });
                setEditingSupplier(null);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Razón Social:
                </label>
                <input
                  type="text"
                  value={editingSupplier.name}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, name: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    NIT:
                  </label>
                  <input
                    type="text"
                    value={editingSupplier.nit}
                    onChange={(e) => setEditingSupplier({ ...editingSupplier, nit: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    NRC:
                  </label>
                  <input
                    type="text"
                    value={editingSupplier.nrc || ''}
                    onChange={(e) => setEditingSupplier({ ...editingSupplier, nrc: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Teléfono:
                  </label>
                  <input
                    type="text"
                    value={editingSupplier.phone || ''}
                    onChange={(e) => setEditingSupplier({ ...editingSupplier, phone: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Plazo de Pago (Días):
                  </label>
                  <input
                    type="number"
                    value={editingSupplier.paymentTermDays}
                    onChange={(e) => setEditingSupplier({ ...editingSupplier, paymentTermDays: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditingSupplier(null)} className="px-3 py-1.5 rounded-lg border cursor-pointer">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer">
                  Actualizar Proveedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Camera Barcode Scanner Modal */}
      <CameraBarcodeScannerModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        continuous={false}
        title="Capturar Código de Barras con Cámara"
        description="Alinee la cámara del teléfono con el código de barras impreso en el producto físico."
        onScan={(code) => {
          setNewProductForm((prev) => ({ ...prev, barcode: code }));
          setIsCameraModalOpen(false);
        }}
      />
    </div>
  );
};