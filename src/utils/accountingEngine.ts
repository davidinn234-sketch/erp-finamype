import {
  Invoice,
  JournalEntry,
  JournalEntryLine,
  Purchase,
  Payroll,
  CustomerPayment,
  SupplierPayment,
  TreasuryMovement,
} from '../types';

/**
 * Helper to ensure a journal entry is perfectly balanced
 */
export function createBalancedJournalEntry(params: {
  id: string;
  companyId: string;
  entryNumber: number;
  date: string;
  concept: string;
  sourceModule: JournalEntry['sourceModule'];
  referenceDoc?: string;
  lines: JournalEntryLine[];
}): JournalEntry {
  const totalDebit = Number(params.lines.reduce((acc, l) => acc + (l.debit || 0), 0).toFixed(2));
  const totalCredit = Number(params.lines.reduce((acc, l) => acc + (l.credit || 0), 0).toFixed(2));
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  return {
    id: params.id,
    companyId: params.companyId,
    entryNumber: params.entryNumber,
    date: params.date,
    concept: params.concept,
    sourceModule: params.sourceModule,
    referenceDoc: params.referenceDoc,
    lines: params.lines,
    totalDebit,
    totalCredit,
    isBalanced,
    status: 'asentada',
    createdAt: new Date().toISOString(),
  };
}

/**
 * Genera el asiento contable automático para una VENTA (CCF / Consumidor Final)
 */
export function generateSaleAccountingEntry(invoice: Invoice, entryNumber: number): JournalEntry {
  const lines: JournalEntryLine[] = [];
  const isCash = invoice.paymentCondition === 'contado';

  // 1. CARGO: Efectivo (1101) o Cuentas por Cobrar (1103-01)
  const debitAccountCode = isCash ? '1101-01' : '1103-01';
  const debitAccountName = isCash ? 'Caja General' : 'Clientes Locales (CxC)';
  
  lines.push({
    accountCode: debitAccountCode,
    accountName: debitAccountName,
    debit: invoice.totalPagar,
    credit: 0,
    concept: `Venta s/g ${invoice.type.toUpperCase()} N° ${invoice.correlativeNumber} - ${invoice.customerName}`,
  });

  // 2. CARGO: Si hubo Retención IVA 1% (Cliente Gran Contribuyente) -> 1107-01
  if (invoice.ivaRetenido1 > 0) {
    lines.push({
      accountCode: '1107-01',
      accountName: 'Retención IVA 1% Clientes (Crédito Fiscal)',
      debit: invoice.ivaRetenido1,
      credit: 0,
      concept: `Retención 1% IVA efectuada por Gran Contribuyente ${invoice.customerName}`,
    });
  }

  // 3. ABONO: Ingresos por Ventas (5101)
  const taxableSale = invoice.sumasGravadas + invoice.sumasExentas + invoice.sumasNoSujetas;
  lines.push({
    accountCode: invoice.type === 'exportacion' ? '5102' : '5101',
    accountName: invoice.type === 'exportacion' ? 'Ingresos por Exportación (Tasa 0%)' : 'Ingresos por Ventas Locales Gravadas',
    debit: 0,
    credit: taxableSale,
    concept: `Reconocimiento de ingresos por ventas netas ${invoice.correlativeNumber}`,
  });

  // 4. ABONO: Débito Fiscal IVA 13% (2107-01)
  if (invoice.iva13 > 0) {
    lines.push({
      accountCode: '2107-01',
      accountName: 'IVA Débito Fiscal (Ventas Locales)',
      debit: 0,
      credit: invoice.iva13,
      concept: `Débito Fiscal IVA 13% s/g ${invoice.correlativeNumber}`,
    });
  }

  // 5. ABONO: Si hubo Percepción IVA 1% -> 2107-02
  if (invoice.ivaPercibido1 > 0) {
    lines.push({
      accountCode: '2107-02',
      accountName: 'IVA Percibido 1%',
      debit: 0,
      credit: invoice.ivaPercibido1,
      concept: `Percepción 1% IVA aplicada al cliente ${invoice.customerName}`,
    });
  }

  // 6. Costo de Ventas & Salida de Inventario (si aplica)
  const totalCost = invoice.items.reduce((acc, item) => acc + (item.unitCost * item.quantity), 0);
  if (totalCost > 0) {
    lines.push({
      accountCode: '4101',
      accountName: 'Costo de Ventas (Mercaderías)',
      debit: Number(totalCost.toFixed(2)),
      credit: 0,
      concept: `Reconocimiento costo de venta mercaderías ${invoice.correlativeNumber}`,
    });
    lines.push({
      accountCode: '1105-01',
      accountName: 'Mercaderías para la Venta (Bodega Central)',
      debit: 0,
      credit: Number(totalCost.toFixed(2)),
      concept: `Descargo de inventario por venta ${invoice.correlativeNumber}`,
    });
  }

  return createBalancedJournalEntry({
    id: `entry_sale_${invoice.id}`,
    companyId: invoice.companyId,
    entryNumber,
    date: invoice.date,
    concept: `Venta s/g ${invoice.type.replace('_', ' ').toUpperCase()} N° ${invoice.correlativeNumber} a ${invoice.customerName}`,
    sourceModule: 'ventas',
    referenceDoc: invoice.correlativeNumber,
    lines,
  });
}

/**
 * Genera asiento contable para una COMPRA (CCF / Sujeto Excluido)
 */
export function generatePurchaseAccountingEntry(purchase: Purchase, entryNumber: number): JournalEntry {
  const lines: JournalEntryLine[] = [];

  // 1. CARGO: Inventario (1105-01) o Gasto de Administración (4201-04)
  const purchaseCostAccountCode = purchase.isServicesPurchase ? '4201-04' : '1105-01';
  const purchaseCostAccountName = purchase.isServicesPurchase ? 'Honorarios y Servicios Profesionales' : 'Mercaderías para la Venta (Bodega Central)';
  const netPurchase = purchase.comprasGravadas + purchase.comprasExentas + purchase.comprasSujetoExcluido;

  lines.push({
    accountCode: purchaseCostAccountCode,
    accountName: purchaseCostAccountName,
    debit: netPurchase,
    credit: 0,
    concept: `Compra s/g ${purchase.docType.toUpperCase()} N° ${purchase.documentNumber} - ${purchase.supplierName}`,
  });

  // 2. CARGO: IVA Crédito Fiscal 13% (1108)
  if (purchase.ivaCreditoFiscal > 0) {
    lines.push({
      accountCode: '1108',
      accountName: 'IVA Crédito Fiscal (Compras y Gastos)',
      debit: purchase.ivaCreditoFiscal,
      credit: 0,
      concept: `IVA Crédito Fiscal 13% en compra a ${purchase.supplierName}`,
    });
  }

  // 3. CARGO: Si proveedor nos percibió 1% IVA -> 1107-01
  if (purchase.percepcionIva1 > 0) {
    lines.push({
      accountCode: '1107-01',
      accountName: 'Retención IVA 1% Clientes (Crédito Fiscal)',
      debit: purchase.percepcionIva1,
      credit: 0,
      concept: `Percepción 1% IVA soportada de ${purchase.supplierName}`,
    });
  }

  // 4. ABONO: Cuentas por Pagar Proveedores (2101-01)
  lines.push({
    accountCode: '2101-01',
    accountName: 'Proveedores Locales (CxP)',
    debit: 0,
    credit: purchase.totalPagar,
    concept: `Obligación por pagar s/g ${purchase.documentNumber}`,
  });

  // 5. ABONO: Retención de Renta 10% (si fue servicio sujeto excluido) -> 2108-04
  if (purchase.retencionRenta10 > 0) {
    lines.push({
      accountCode: '2108-04',
      accountName: 'Retención de Renta 10% Servicios Profesionales',
      debit: 0,
      credit: purchase.retencionRenta10,
      concept: `Retención 10% Impuesto sobre la Renta a ${purchase.supplierName}`,
    });
  }

  // 6. ABONO: Retención IVA 1% si nuestra empresa es Gran Contribuyente -> 2108-05
  if (purchase.retencionIva1 > 0) {
    lines.push({
      accountCode: '2108-05',
      accountName: 'Retención IVA 1% Proveedores',
      debit: 0,
      credit: purchase.retencionIva1,
      concept: `Retención 1% IVA efectuada a ${purchase.supplierName}`,
    });
  }

  return createBalancedJournalEntry({
    id: `entry_purchase_${purchase.id}`,
    companyId: purchase.companyId,
    entryNumber,
    date: purchase.date,
    concept: `Compra s/g ${purchase.docType.replace('_', ' ').toUpperCase()} N° ${purchase.documentNumber} a ${purchase.supplierName}`,
    sourceModule: 'compras',
    referenceDoc: purchase.documentNumber,
    lines,
  });
}

/**
 * Genera el asiento contable de PLANILLA DE SUELDOS (Normativa Legal SV)
 */
export function generatePayrollAccountingEntry(payroll: Payroll, entryNumber: number): JournalEntry {
  const lines: JournalEntryLine[] = [];

  // 1. CARGO: Gasto de Sueldos y Salarios (4201-01)
  lines.push({
    accountCode: '4201-01',
    accountName: 'Sueldos y Salarios Administrativos',
    debit: payroll.totalDevengado,
    credit: 0,
    concept: `Planilla ${payroll.periodType} mes ${payroll.month}/${payroll.year}`,
  });

  // 2. CARGO: Gasto Aportes Patronales ISSS y AFP (4201-02)
  const totalAportesPatronales = Number((payroll.totalIsssPatronal + payroll.totalAfpPatronal + payroll.totalInsaforpPatronal).toFixed(2));
  lines.push({
    accountCode: '4201-02',
    accountName: 'Aportes Patronales ISSS y AFP',
    debit: totalAportesPatronales,
    credit: 0,
    concept: `Aportes Patronales ISSS (7.5%), AFP (8.75%) e INSAFORP (1%)`,
  });

  // 3. CARGO: Gasto de Provisiones Laborales (4201-03)
  lines.push({
    accountCode: '4201-03',
    accountName: 'Provisiones Laborales (Aguinaldo/Vacaciones)',
    debit: payroll.totalProvisiones,
    credit: 0,
    concept: `Provisión proporcional de Aguinaldo, Vacaciones e Indemnizaciones`,
  });

  // 4. ABONO: Retenciones Laborales por Pagar
  // ISSS Laboral (3%) -> 2108-01
  lines.push({
    accountCode: '2108-01',
    accountName: 'ISSS Laboral por Pagar (3%)',
    debit: 0,
    credit: payroll.totalIsssLaboral,
    concept: `Retención ISSS 3% a empleados`,
  });

  // AFP Laboral (7.25%) -> 2108-02
  lines.push({
    accountCode: '2108-02',
    accountName: 'AFP Laboral por Pagar (7.25%)',
    debit: 0,
    credit: payroll.totalAfpLaboral,
    concept: `Retención AFP Crecer/Confía 7.25% a empleados`,
  });

  // Retención Renta (Tabla MH) -> 2108-03
  if (payroll.totalRentaRetenida > 0) {
    lines.push({
      accountCode: '2108-03',
      accountName: 'Retención de Renta Empleados (Tabla MH)',
      debit: 0,
      credit: payroll.totalRentaRetenida,
      concept: `Retención de Impuesto Sobre la Renta según Tabla Oficial MH`,
    });
  }

  // 5. ABONO: Aportes Patronales por Pagar
  lines.push({
    accountCode: '2109-01',
    accountName: 'ISSS Patronal por Pagar (7.5%)',
    debit: 0,
    credit: payroll.totalIsssPatronal,
    concept: `Aporte Patronal ISSS 7.5%`,
  });

  lines.push({
    accountCode: '2109-02',
    accountName: 'AFP Patronal por Pagar (8.75%)',
    debit: 0,
    credit: payroll.totalAfpPatronal,
    concept: `Aporte Patronal AFP 8.75%`,
  });

  if (payroll.totalInsaforpPatronal > 0) {
    lines.push({
      accountCode: '2109-03',
      accountName: 'INSAFORP por Pagar (1%)',
      debit: 0,
      credit: payroll.totalInsaforpPatronal,
      concept: `Aporte Patronal INSAFORP 1%`,
    });
  }

  // 6. ABONO: Provisiones en Pasivo
  lines.push({
    accountCode: '2110-01',
    accountName: 'Provisión para Aguinaldos',
    debit: 0,
    credit: Number((payroll.totalProvisiones * 0.35).toFixed(2)),
    concept: `Reserva para Aguinaldo proporcional`,
  });
  lines.push({
    accountCode: '2110-02',
    accountName: 'Provisión para Vacaciones (Recargo 30%)',
    debit: 0,
    credit: Number((payroll.totalProvisiones * 0.35).toFixed(2)),
    concept: `Reserva para Vacación Anual y recargo 30%`,
  });
  lines.push({
    accountCode: '2110-03',
    accountName: 'Provisión para Indemnizaciones',
    debit: 0,
    credit: Number((payroll.totalProvisiones * 0.30).toFixed(2)),
    concept: `Reserva para Indemnizaciones laborales`,
  });

  // 7. ABONO: Sueldos Netos Pagados (Banco Agrícola / Efectivo)
  lines.push({
    accountCode: '1101-03',
    accountName: 'Banco Agrícola (Cta. Corriente)',
    debit: 0,
    credit: payroll.totalLiquido,
    concept: `Pago líquido de planilla vía transferencia bancaria`,
  });

  return createBalancedJournalEntry({
    id: `entry_payroll_${payroll.id}`,
    companyId: payroll.companyId,
    entryNumber,
    date: payroll.paymentDate,
    concept: `Liquidación y Pago de Planilla ${payroll.periodType.toUpperCase()} - Período ${payroll.startDate} al ${payroll.endDate}`,
    sourceModule: 'planilla',
    referenceDoc: `PLN-${payroll.year}-${payroll.month}`,
    lines,
  });
}

/**
 * Asiento por Abono de Cliente (CxC)
 */
export function generateCustomerPaymentEntry(
  payment: CustomerPayment,
  entryNumber: number,
  targetAccountCode?: string,
  targetAccountName?: string
): JournalEntry {
  const code = targetAccountCode || (payment.targetAccountId.startsWith('1101-') ? payment.targetAccountId : '1101-03');
  const name = targetAccountName || (code.includes('01') ? 'Caja General' : 'Banco Agrícola (Cta. Corriente)');

  const lines: JournalEntryLine[] = [
    {
      accountCode: code,
      accountName: name,
      debit: payment.amount,
      credit: 0,
      concept: `Ingreso por abono de ${payment.customerName} a factura ${payment.invoiceNumber}`,
    },
    {
      accountCode: '1103-01',
      accountName: 'Clientes Locales (CxC)',
      debit: 0,
      credit: payment.amount,
      concept: `Disminución de saldo pendiente CxC s/g Recibo ${payment.receiptNumber}`,
    },
  ];

  return createBalancedJournalEntry({
    id: `entry_cxc_${payment.id}`,
    companyId: payment.companyId,
    entryNumber,
    date: payment.date,
    concept: `Abono de Cliente ${payment.customerName} - Recibo N° ${payment.receiptNumber}`,
    sourceModule: 'tesoreria',
    referenceDoc: payment.receiptNumber,
    lines,
  });
}

/**
 * Asiento por Pago a Proveedor (CxP)
 */
export function generateSupplierPaymentEntry(
  payment: SupplierPayment,
  entryNumber: number,
  sourceAccountCode?: string,
  sourceAccountName?: string
): JournalEntry {
  const code = sourceAccountCode || (payment.sourceAccountId.startsWith('1101-') ? payment.sourceAccountId : '1101-03');
  const name = sourceAccountName || (code.includes('01') ? 'Caja General' : 'Banco Agrícola (Cta. Corriente)');

  const lines: JournalEntryLine[] = [
    {
      accountCode: '2101-01',
      accountName: 'Proveedores Locales (CxP)',
      debit: payment.amount,
      credit: 0,
      concept: `Cancelación de cuenta por pagar a ${payment.supplierName} ref. compra ${payment.purchaseNumber}`,
    },
    {
      accountCode: code,
      accountName: name,
      debit: 0,
      credit: payment.amount,
      concept: `Egreso bancario/caja pago a proveedor ref. ${payment.referenceNumber || 'N/A'}`,
    },
  ];

  return createBalancedJournalEntry({
    id: `entry_cxp_${payment.id}`,
    companyId: payment.companyId,
    entryNumber,
    date: payment.date,
    concept: `Pago a Proveedor ${payment.supplierName} - Ref. Compra ${payment.purchaseNumber}`,
    sourceModule: 'tesoreria',
    referenceDoc: payment.referenceNumber || payment.purchaseNumber,
    lines,
  });
}
