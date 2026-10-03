import React, { useState, useMemo } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  Database,
  Search,
  RotateCcw,
  Download,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  ShoppingBag,
  Landmark,
  CreditCard,
  FileCode,
  X,
  Filter,
  RefreshCw,
  Eye,
  SlidersHorizontal,
  Cloud,
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { testFirebaseConnection, firestoreDatabaseId } from '../../lib/firebase';

type OperationCategory = 'todas' | 'ventas' | 'abonos_clientes' | 'compras' | 'pagos_proveedores' | 'tesoreria';

interface MasterOperationRecord {
  id: string;
  sourceType: 'invoice' | 'customer_payment' | 'purchase' | 'supplier_payment' | 'treasury_movement';
  categoryLabel: string;
  correlative: string;
  date: string;
  thirdPartyName: string;
  amount: number;
  status: string;
  systemImpactSummary: string;
  rawData: any;
  accountingEntryId?: string;
}

export const MasterDatabaseModule: React.FC = () => {
  const {
    currentCompany,
    currentUser,
    invoices,
    customerPayments,
    purchases,
    supplierPayments,
    treasuryMovements,
    products,
    customers,
    suppliers,
    bankAccounts,
    deleteInvoice,
    deleteCustomerPayment,
    deletePurchase,
    deleteSupplierPayment,
    deleteTreasuryMovement,
    addNotification,
  } = useERP();

  // Active filter tab
  const [activeTab, setActiveTab] = useState<OperationCategory>('todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [sortBy, setSortBy] = useState<'recientes' | 'antiguos' | 'mayor_monto' | 'menor_monto'>('recientes');

  // Inspect Modal
  const [inspectedRecord, setInspectedRecord] = useState<MasterOperationRecord | null>(null);

  // Rollback / Undo Confirmation Modal
  const [rollbackTarget, setRollbackTarget] = useState<MasterOperationRecord | null>(null);
  const [isRollbacking, setIsRollbacking] = useState(false);

  // Cloud sync test status
  const [isVerifyingCloud, setIsVerifyingCloud] = useState(false);
  const [cloudStatusResult, setCloudStatusResult] = useState<string | null>(null);

  // Compile all operations into unified audit list
  const masterOperations = useMemo<MasterOperationRecord[]>(() => {
    const list: MasterOperationRecord[] = [];

    // 1. Invoices (Sales)
    invoices.forEach((inv) => {
      list.push({
        id: inv.id,
        sourceType: 'invoice',
        categoryLabel: inv.type === 'credito_fiscal' ? 'Crédito Fiscal (CCF)' : 'Factura Venta',
        correlative: inv.correlativeNumber || inv.dteCode || inv.id,
        date: inv.date || inv.createdAt || '',
        thirdPartyName: inv.customerName || 'Cliente Consumidor Final',
        amount: inv.totalPagar,
        status: inv.status,
        systemImpactSummary: `Ítems: ${inv.items.length} · Saldo pendiente: $${(inv.saldoPendiente || 0).toFixed(2)}`,
        rawData: inv,
        accountingEntryId: inv.accountingEntryId,
      });
    });

    // 2. Customer Payments (CxC)
    customerPayments.forEach((cp) => {
      const parentInv = invoices.find((i) => i.id === cp.invoiceId);
      list.push({
        id: cp.id,
        sourceType: 'customer_payment',
        categoryLabel: 'Abono de Cliente (CxC)',
        correlative: cp.referenceNumber || cp.receiptNumber || cp.id,
        date: cp.date,
        thirdPartyName: parentInv?.customerName || cp.customerName || 'Cliente',
        amount: cp.amount,
        status: 'aplicado',
        systemImpactSummary: `Aplicado a Factura #${parentInv?.correlativeNumber || cp.invoiceNumber || 'N/A'}`,
        rawData: cp,
        accountingEntryId: undefined,
      });
    });

    // 3. Purchases
    purchases.forEach((pur) => {
      list.push({
        id: pur.id,
        sourceType: 'purchase',
        categoryLabel: pur.docType === 'ccf_compra' ? 'CCF Compra' : 'Factura Compra',
        correlative: pur.documentNumber || pur.id,
        date: pur.date,
        thirdPartyName: pur.supplierName,
        amount: pur.totalPagar,
        status: pur.status,
        systemImpactSummary: `Ítems ingresados: ${pur.items.length} · Saldo a pagar: $${(pur.saldoPendiente || 0).toFixed(2)}`,
        rawData: pur,
        accountingEntryId: pur.accountingEntryId,
      });
    });

    // 4. Supplier Payments (CxP)
    supplierPayments.forEach((sp) => {
      const parentPur = purchases.find((p) => p.id === sp.purchaseId);
      list.push({
        id: sp.id,
        sourceType: 'supplier_payment',
        categoryLabel: 'Pago a Proveedor (CxP)',
        correlative: sp.referenceNumber || sp.id,
        date: sp.date,
        thirdPartyName: parentPur?.supplierName || sp.supplierName || 'Proveedor',
        amount: sp.amount,
        status: 'aplicado',
        systemImpactSummary: `Aplicado a Compra #${parentPur?.documentNumber || sp.purchaseNumber || 'N/A'}`,
        rawData: sp,
        accountingEntryId: undefined,
      });
    });

    // 5. Treasury movements
    treasuryMovements.forEach((tm) => {
      const isIngreso = ['ingreso_venta', 'abono_cxc', 'otro_ingreso'].includes(tm.type);
      list.push({
        id: tm.id,
        sourceType: 'treasury_movement',
        categoryLabel: isIngreso ? 'Ingreso Tesorería' : 'Egreso Tesorería',
        correlative: tm.referenceNumber || tm.id,
        date: tm.date,
        thirdPartyName: tm.bankAccountName || 'Cuenta Bancaria / Caja',
        amount: tm.amount,
        status: tm.isReconciled ? 'conciliado' : 'pendiente',
        systemImpactSummary: tm.description || 'Movimiento directo en cuenta',
        rawData: tm,
        accountingEntryId: tm.accountingEntryId,
      });
    });

    return list;
  }, [invoices, customerPayments, purchases, supplierPayments, treasuryMovements]);

  // Filtered & Sorted Operations
  const filteredOperations = useMemo(() => {
    return masterOperations
      .filter((op) => {
        // Tab Category filter
        if (activeTab === 'ventas' && op.sourceType !== 'invoice') return false;
        if (activeTab === 'abonos_clientes' && op.sourceType !== 'customer_payment') return false;
        if (activeTab === 'compras' && op.sourceType !== 'purchase') return false;
        if (activeTab === 'pagos_proveedores' && op.sourceType !== 'supplier_payment') return false;
        if (activeTab === 'tesoreria' && op.sourceType !== 'treasury_movement') return false;

        // Status filter
        if (statusFilter !== 'todos' && op.status !== statusFilter) return false;

        // Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchesCorrelative = op.correlative.toLowerCase().includes(q);
          const matchesThirdParty = op.thirdPartyName.toLowerCase().includes(q);
          const matchesCategory = op.categoryLabel.toLowerCase().includes(q);
          const matchesAmount = op.amount.toString().includes(q);
          return matchesCorrelative || matchesThirdParty || matchesCategory || matchesAmount;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'recientes') return (b.date || '').localeCompare(a.date || '');
        if (sortBy === 'antiguos') return (a.date || '').localeCompare(b.date || '');
        if (sortBy === 'mayor_monto') return b.amount - a.amount;
        if (sortBy === 'menor_monto') return a.amount - b.amount;
        return 0;
      });
  }, [masterOperations, activeTab, statusFilter, searchQuery, sortBy]);

  // Aggregate stats
  const stats = useMemo(() => {
    const totalOps = masterOperations.length;
    const totalVentas = invoices.reduce((sum, i) => sum + (i.status !== 'anulada' ? i.totalPagar : 0), 0);
    const totalCxC = invoices.reduce((sum, i) => sum + (i.status !== 'anulada' ? i.saldoPendiente || 0 : 0), 0);
    const totalCompras = purchases.reduce((sum, p) => sum + p.totalPagar, 0);
    const totalCxP = purchases.reduce((sum, p) => sum + (p.saldoPendiente || 0), 0);
    return { totalOps, totalVentas, totalCxC, totalCompras, totalCxP };
  }, [masterOperations, invoices, purchases]);

  // Execute Rollback / Undo
  const handleExecuteRollback = async () => {
    if (!rollbackTarget) return;
    setIsRollbacking(true);

    try {
      if (rollbackTarget.sourceType === 'invoice') {
        deleteInvoice(rollbackTarget.id);
      } else if (rollbackTarget.sourceType === 'customer_payment') {
        deleteCustomerPayment(rollbackTarget.id);
      } else if (rollbackTarget.sourceType === 'purchase') {
        deletePurchase(rollbackTarget.id);
      } else if (rollbackTarget.sourceType === 'supplier_payment') {
        deleteSupplierPayment(rollbackTarget.id);
      } else if (rollbackTarget.sourceType === 'treasury_movement') {
        deleteTreasuryMovement(rollbackTarget.id);
      }

      addNotification(
        'success',
        'Operación Revertida',
        `La operación #${rollbackTarget.correlative} ha sido revertida y eliminada de la base de datos.`
      );
      setRollbackTarget(null);
    } catch {
      addNotification(
        'error',
        'Fallo de Reversión',
        'Ocurrió un error al intentar deshacer la operación.'
      );
    } finally {
      setIsRollbacking(false);
    }
  };

  // Verify Cloud Connection
  const handleVerifyCloud = async () => {
    setIsVerifyingCloud(true);
    setCloudStatusResult(null);
    try {
      const ok = await testFirebaseConnection();
      if (ok) {
        setCloudStatusResult('✓ Conectado exitosamente con Firestore Cloud SV. Persistencia activa.');
        addNotification('success', 'Nube Verificada', 'Base de datos de Firebase Firestore conectada en tiempo real.');
      } else {
        setCloudStatusResult('Modo local/cache disponible. Verifique conectividad.');
      }
    } catch {
      setCloudStatusResult('Error al verificar conexión con la nube.');
    } finally {
      setIsVerifyingCloud(false);
    }
  };

  // Export full company database snapshot as JSON
  const handleDownloadFullDatabaseBackup = () => {
    const backupPayload = {
      empresa: currentCompany,
      exportadoPor: currentUser.email,
      fechaExportacion: new Date().toISOString(),
      firestoreDatabaseId,
      estadisticas: stats,
      datos: {
        facturasVenta: invoices,
        abonosClientes: customerPayments,
        compras: purchases,
        pagosProveedores: supplierPayments,
        movimientosBancarios: treasuryMovements,
        cuentasBancarias: bankAccounts,
        productos: products,
        clientes: customers,
        proveedores: suppliers,
      },
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `backup_db_${(currentCompany.tradeName || currentCompany.name).replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    addNotification('info', 'Copia de Seguridad Descargada', 'Se ha guardado el archivo JSON completo de su base de datos.');
  };

  return (
    <div id="master-database-module" className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* Top Header: Quiet, Executive & Crisp */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>Base de Datos General</span>
            <span aria-hidden="true">·</span>
            <span>Auditoría & Centro de Reversión (Ctrl+Z)</span>
            <span aria-hidden="true">·</span>
            <span>{currentCompany.tradeName || currentCompany.name}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
            Explorador de Base de Datos & Registro Maestro
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Vista unificada de todas las transacciones generadas en el sistema. Puedes inspeccionar los datos exactos almacenados en la nube y deshacer o revertir operaciones que requieran corrección.
          </p>
        </div>

        {/* Database Sync & Backup Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleVerifyCloud}
            disabled={isVerifyingCloud}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
            title="Verificar conexión directa con Firebase Firestore"
          >
            <Cloud className={`w-3.5 h-3.5 ${isVerifyingCloud ? 'animate-spin text-indigo-500' : 'text-emerald-500'}`} />
            <span>{isVerifyingCloud ? 'Verificando...' : 'Comprobar Nube'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadFullDatabaseBackup}
            className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-2 transition cursor-pointer shadow-xs"
            title="Descargar copia de seguridad JSON completa"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar Backup BD</span>
          </button>
        </div>
      </div>

      {/* Cloud Status Banner if checked */}
      {cloudStatusResult && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{cloudStatusResult}</span>
          </div>
          <span className="font-mono text-[11px] opacity-75">
            DB: {firestoreDatabaseId.substring(0, 18)}...
          </span>
        </div>
      )}

      {/* HubSpot-Inspired Metrics Grid: Clean, Crisp, Zero Clutter */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Operaciones */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Operaciones en BD</span>
            <Database className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {stats.totalOps}
          </p>
          <p className="text-[11px] text-slate-500">
            Transacciones maestras registradas
          </p>
        </div>

        {/* Total Ventas Facturadas */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Ventas Facturadas</span>
            <Receipt className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            ${stats.totalVentas.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-slate-500">
            Pendiente por cobrar (CxC): ${stats.totalCxC.toFixed(2)}
          </p>
        </div>

        {/* Total Compras Realizadas */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Compras & Gastos</span>
            <ShoppingBag className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            ${stats.totalCompras.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-slate-500">
            Pendiente por pagar (CxP): ${stats.totalCxP.toFixed(2)}
          </p>
        </div>

        {/* Estado de Persistencia Nube */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Persistencia en Nube</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-base font-bold text-slate-900 dark:text-white">
              Firebase Firestore
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-mono truncate" title={firestoreDatabaseId}>
            ID: {firestoreDatabaseId}
          </p>
        </div>
      </div>

      {/* Tabs & Controls Bar */}
      <div className="space-y-3">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl overflow-x-auto">
          {[
            { id: 'todas', label: 'Todas las Operaciones', count: masterOperations.length },
            { id: 'ventas', label: 'Ventas & DTE', count: invoices.length },
            { id: 'abonos_clientes', label: 'Abonos CxC', count: customerPayments.length },
            { id: 'compras', label: 'Compras', count: purchases.length },
            { id: 'pagos_proveedores', label: 'Pagos CxP', count: supplierPayments.length },
            { id: 'tesoreria', label: 'Tesorería & Bancos', count: treasuryMovements.length },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as OperationCategory)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isActive
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-200'
                      : 'bg-slate-200/60 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por correlativo, cliente, proveedor o monto..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
            >
              <option value="todos">Todos los Estados</option>
              <option value="emitida">Emitida / Registrada</option>
              <option value="pagada">Pagada</option>
              <option value="parcial">Parcial</option>
              <option value="aplicado">Aplicado</option>
              <option value="conciliado">Conciliado</option>
              <option value="anulada">Anulada</option>
            </select>

            {/* Sort Filter */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
            >
              <option value="recientes">Más Recientes</option>
              <option value="antiguos">Más Antiguos</option>
              <option value="mayor_monto">Mayor Monto</option>
              <option value="menor_monto">Menor Monto</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Operations Audit Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Operación & Correlativo</th>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Tercero / Cuenta</th>
                <th className="py-3 px-4">Impacto Sistémico</th>
                <th className="py-3 px-4 text-right">Monto (USD)</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredOperations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <Database className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-medium">No se encontraron operaciones registradas</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Intenta ajustar los filtros de búsqueda o categoría
                    </p>
                  </td>
                </tr>
              ) : (
                filteredOperations.map((op) => {
                  const isIncome = op.sourceType === 'invoice' || op.sourceType === 'customer_payment';
                  return (
                    <tr
                      key={`${op.sourceType}_${op.id}`}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Correlativo & Type */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                              op.sourceType === 'invoice'
                                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                                : op.sourceType === 'customer_payment'
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                                : op.sourceType === 'purchase'
                                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {op.sourceType === 'invoice' && <Receipt className="w-3.5 h-3.5" />}
                            {op.sourceType === 'customer_payment' && <ArrowDownLeft className="w-3.5 h-3.5" />}
                            {op.sourceType === 'purchase' && <ShoppingBag className="w-3.5 h-3.5" />}
                            {op.sourceType === 'supplier_payment' && <ArrowUpRight className="w-3.5 h-3.5" />}
                            {op.sourceType === 'treasury_movement' && <Landmark className="w-3.5 h-3.5" />}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white font-mono leading-tight">
                              #{op.correlative}
                            </p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">
                              {op.categoryLabel}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-mono whitespace-nowrap">
                        {op.date ? op.date.substring(0, 10) : 'Sin fecha'}
                      </td>

                      {/* Third Party */}
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                          {op.thirdPartyName}
                        </p>
                      </td>

                      {/* System Impact */}
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-[11px]">
                        <span className="truncate max-w-[220px] block">
                          {op.systemImpactSummary}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 text-right font-mono font-bold">
                        <span
                          className={
                            isIncome
                              ? 'text-slate-900 dark:text-white'
                              : 'text-slate-700 dark:text-slate-300'
                          }
                        >
                          ${op.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                            op.status === 'pagada' || op.status === 'aplicado' || op.status === 'conciliado'
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                              : op.status === 'emitida' || op.status === 'registrada'
                              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400'
                              : op.status === 'parcial'
                              ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                              : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {op.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setInspectedRecord(op)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition cursor-pointer"
                            title="Ver datos en base de datos (JSON)"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setRollbackTarget(op)}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-[11px] font-semibold transition cursor-pointer"
                            title="Revertir y deshacer esta operación (Control-Z)"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Revertir</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* INSPECT RECORD MODAL (JSON VIEWER) */}
      {inspectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-indigo-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                  Registro #{inspectedRecord.correlative} ({inspectedRecord.categoryLabel})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectedRecord(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Colección Origen</span>
                  <p className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">{inspectedRecord.sourceType}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Document ID</span>
                  <p className="font-mono text-slate-800 dark:text-slate-200 mt-0.5 truncate">{inspectedRecord.id}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Payload Almacenado en Firestore:
                </p>
                <pre className="p-3 rounded-xl bg-slate-950 text-emerald-400 text-xs font-mono overflow-x-auto max-h-80 custom-scrollbar border border-slate-800">
                  {JSON.stringify(inspectedRecord.rawData, null, 2)}
                </pre>
              </div>
            </div>

            <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setInspectedRecord(null)}
                className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ROLLBACK CONFIRMATION MODAL (THE 'CONTROL-Z' SYSTEM) */}
      {rollbackTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-900 shadow-2xl w-full max-w-lg p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-800">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  ¿Revertir y Deshacer Operación? (Ctrl+Z)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Acción de control total sobre la base de datos de tu empresa
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Operación:</span>
                <span className="font-bold text-slate-900 dark:text-white">{rollbackTarget.categoryLabel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Correlativo / Ref:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">#{rollbackTarget.correlative}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tercero Asociado:</span>
                <span className="text-slate-800 dark:text-slate-200 font-medium">{rollbackTarget.thirdPartyName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Monto:</span>
                <span className="font-bold text-slate-900 dark:text-white">${rollbackTarget.amount.toFixed(2)}</span>
              </div>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
              <p className="font-bold text-slate-800 dark:text-slate-200">
                Esta acción ejecutará automáticamente las siguientes reversiones:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-500 dark:text-slate-400 text-[11px]">
                {rollbackTarget.sourceType === 'invoice' && (
                  <>
                    <li>Devolverá los productos y unidades vendidas de vuelta al inventario físico.</li>
                    <li>Eliminará el movimiento en el Kardex y asientos contables generados.</li>
                    <li>Anulará los cobros o cuentas por cobrar asociadas a este documento.</li>
                    <li>Eliminará el registro del documento de Firebase Firestore.</li>
                  </>
                )}
                {rollbackTarget.sourceType === 'customer_payment' && (
                  <>
                    <li>Restaurará el saldo pendiente en la factura de venta correspondiente.</li>
                    <li>Revertirá el ingreso en la cuenta bancaria o caja registrada.</li>
                    <li>Eliminará el comprobante de abono de la base de datos.</li>
                  </>
                )}
                {rollbackTarget.sourceType === 'purchase' && (
                  <>
                    <li>Descontará las unidades ingresadas al stock para mantener el inventario real.</li>
                    <li>Anulará la deuda y saldo pendiente con el proveedor.</li>
                    <li>Limpiará el asiento contable en el libro diario.</li>
                    <li>Eliminará la compra de Firebase Firestore.</li>
                  </>
                )}
                {rollbackTarget.sourceType === 'supplier_payment' && (
                  <>
                    <li>Restaurará la cuenta por pagar a favor del proveedor.</li>
                    <li>Revertirá el egreso en bancos o caja.</li>
                    <li>Eliminará el pago de la base de datos.</li>
                  </>
                )}
                {rollbackTarget.sourceType === 'treasury_movement' && (
                  <>
                    <li>Restaurará el saldo exacto en la cuenta bancaria o caja afectada.</li>
                    <li>Anulará cualquier asiento contable directo vinculado al movimiento.</li>
                    <li>Eliminará el registro de tesorería en la nube.</li>
                  </>
                )}
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setRollbackTarget(null)}
                disabled={isRollbacking}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-xs font-medium transition cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleExecuteRollback}
                disabled={isRollbacking}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-semibold transition cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isRollbacking ? 'Revirtiendo...' : 'Sí, Revertir Operación'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
