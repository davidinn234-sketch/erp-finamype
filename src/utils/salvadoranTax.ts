import { PayrollPeriod, FiscalConfig, RentaBracket } from '../types';

export const DEFAULT_MONTHLY_RENTA_BRACKETS: RentaBracket[] = [
  {
    id: 'tramo_1_m',
    from: 0.01,
    to: 472.00,
    rate: 0,
    fixedAmount: 0,
    excessFrom: 0,
    label: 'Tramo I: $0.01 a $472.00 (Sin retención)',
  },
  {
    id: 'tramo_2_m',
    from: 472.01,
    to: 895.24,
    rate: 0.10,
    fixedAmount: 17.67,
    excessFrom: 472.00,
    label: 'Tramo II: $472.01 a $895.24 (10% sobre exceso + $17.67)',
  },
  {
    id: 'tramo_3_m',
    from: 895.25,
    to: 2038.10,
    rate: 0.20,
    fixedAmount: 60.00,
    excessFrom: 895.24,
    label: 'Tramo III: $895.25 a $2,038.10 (20% sobre exceso + $60.00)',
  },
  {
    id: 'tramo_4_m',
    from: 2038.11,
    to: 9999999.00,
    rate: 0.30,
    fixedAmount: 288.57,
    excessFrom: 2038.10,
    label: 'Tramo IV: Más de $2,038.10 (30% sobre exceso + $288.57)',
  },
];

export const DEFAULT_BIWEEKLY_RENTA_BRACKETS: RentaBracket[] = [
  {
    id: 'tramo_1_q',
    from: 0.01,
    to: 236.00,
    rate: 0,
    fixedAmount: 0,
    excessFrom: 0,
    label: 'Tramo I: $0.01 a $236.00 (Sin retención)',
  },
  {
    id: 'tramo_2_q',
    from: 236.01,
    to: 447.62,
    rate: 0.10,
    fixedAmount: 8.83,
    excessFrom: 236.00,
    label: 'Tramo II: $236.01 a $447.62 (10% sobre exceso + $8.83)',
  },
  {
    id: 'tramo_3_q',
    from: 447.63,
    to: 1019.05,
    rate: 0.20,
    fixedAmount: 30.00,
    excessFrom: 447.62,
    label: 'Tramo III: $447.63 a $1,019.05 (20% sobre exceso + $30.00)',
  },
  {
    id: 'tramo_4_q',
    from: 1019.06,
    to: 9999999.00,
    rate: 0.30,
    fixedAmount: 144.28,
    excessFrom: 1019.05,
    label: 'Tramo IV: Más de $1,019.05 (30% sobre exceso + $144.28)',
  },
];

export const DEFAULT_FISCAL_CONFIG: FiscalConfig = {
  ivaRate: 0.13,
  retencionIvaRate: 0.01,
  percepcionIvaRate: 0.01,
  retencionRentaServiciosRate: 0.10,
  pagoCuentaRate: 0.0175,
  isssLaboralRate: 0.03,
  isssPatronalRate: 0.075,
  isssTechoMensual: 1000.00,
  isssMaxLaboralMensual: 30.00,
  isssMaxPatronalMensual: 75.00,
  afpLaboralRate: 0.0725,
  afpPatronalRate: 0.0875,
  insaforpPatronalRate: 0.01,
  insaforpMinEmployees: 10,
  provisionAguinaldoRate: 0.0417,
  provisionVacacionRate: 0.0542,
  provisionIndemnizacionRate: 0.0833,
  rentaMonthlyBrackets: DEFAULT_MONTHLY_RENTA_BRACKETS,
  rentaBiweeklyBrackets: DEFAULT_BIWEEKLY_RENTA_BRACKETS,
};

// Export legacy constants referencing default config
export const IVA_RATE = DEFAULT_FISCAL_CONFIG.ivaRate;
export const RETENCION_IVA_RATE = DEFAULT_FISCAL_CONFIG.retencionIvaRate;
export const PERCEPCION_IVA_RATE = DEFAULT_FISCAL_CONFIG.percepcionIvaRate;
export const RETENCION_RENTA_SERVICIOS_RATE = DEFAULT_FISCAL_CONFIG.retencionRentaServiciosRate;
export const PAGO_A_CUENTA_RATE = DEFAULT_FISCAL_CONFIG.pagoCuentaRate;

export const ISSS_LABORAL_RATE = DEFAULT_FISCAL_CONFIG.isssLaboralRate;
export const ISSS_PATRONAL_RATE = DEFAULT_FISCAL_CONFIG.isssPatronalRate;
export const ISSS_TECHO_MENSUAL = DEFAULT_FISCAL_CONFIG.isssTechoMensual;
export const ISSS_MAX_LABORAL_MENSUAL = DEFAULT_FISCAL_CONFIG.isssMaxLaboralMensual;
export const ISSS_MAX_PATRONAL_MENSUAL = DEFAULT_FISCAL_CONFIG.isssMaxPatronalMensual;

export const AFP_LABORAL_RATE = DEFAULT_FISCAL_CONFIG.afpLaboralRate;
export const AFP_PATRONAL_RATE = DEFAULT_FISCAL_CONFIG.afpPatronalRate;
export const INSAFORP_PATRONAL_RATE = DEFAULT_FISCAL_CONFIG.insaforpPatronalRate;

export const PROVISION_AGUINALDO_RATE = DEFAULT_FISCAL_CONFIG.provisionAguinaldoRate;
export const PROVISION_VACACION_RATE = DEFAULT_FISCAL_CONFIG.provisionVacacionRate;
export const PROVISION_INDEMNIZACION_RATE = DEFAULT_FISCAL_CONFIG.provisionIndemnizacionRate;

/**
 * Calcula ISSS Laboral con configuración dinámica y respeto a topes
 */
export function calculateIsssLaboral(
  grossSalary: number,
  period: PayrollPeriod = 'mensual',
  config: FiscalConfig = DEFAULT_FISCAL_CONFIG
): number {
  const maxDeduction =
    period === 'quincenal'
      ? config.isssMaxLaboralMensual / 2
      : config.isssMaxLaboralMensual;
  const isss = grossSalary * config.isssLaboralRate;
  return Number(Math.min(isss, maxDeduction).toFixed(2));
}

/**
 * Calcula ISSS Patronal con configuración dinámica y respeto a topes
 */
export function calculateIsssPatronal(
  grossSalary: number,
  period: PayrollPeriod = 'mensual',
  config: FiscalConfig = DEFAULT_FISCAL_CONFIG
): number {
  const maxDeduction =
    period === 'quincenal'
      ? config.isssMaxPatronalMensual / 2
      : config.isssMaxPatronalMensual;
  const isss = grossSalary * config.isssPatronalRate;
  return Number(Math.min(isss, maxDeduction).toFixed(2));
}

/**
 * Calcula AFP Laboral
 */
export function calculateAfpLaboral(
  grossSalary: number,
  config: FiscalConfig = DEFAULT_FISCAL_CONFIG
): number {
  return Number((grossSalary * config.afpLaboralRate).toFixed(2));
}

/**
 * Calcula AFP Patronal
 */
export function calculateAfpPatronal(
  grossSalary: number,
  config: FiscalConfig = DEFAULT_FISCAL_CONFIG
): number {
  return Number((grossSalary * config.afpPatronalRate).toFixed(2));
}

/**
 * Tabla Oficial / Personalizable de Retención de Renta (Ministerio de Hacienda)
 */
export function calculateRentaElSalvador(
  baseImponible: number,
  period: PayrollPeriod = 'mensual',
  config: FiscalConfig = DEFAULT_FISCAL_CONFIG
): number {
  if (baseImponible <= 0) return 0;

  const brackets =
    period === 'quincenal'
      ? config.rentaBiweeklyBrackets || DEFAULT_BIWEEKLY_RENTA_BRACKETS
      : config.rentaMonthlyBrackets || DEFAULT_MONTHLY_RENTA_BRACKETS;

  for (const b of brackets) {
    if (baseImponible >= b.from && (baseImponible <= b.to || b.to >= 999999)) {
      if (b.rate === 0) return 0;
      const exceso = Math.max(0, baseImponible - b.excessFrom);
      return Number((exceso * b.rate + b.fixedAmount).toFixed(2));
    }
  }

  // Fallback a último tramo si excede el rango
  const last = brackets[brackets.length - 1];
  if (last && baseImponible > last.from) {
    const exceso = Math.max(0, baseImponible - last.excessFrom);
    return Number((exceso * last.rate + last.fixedAmount).toFixed(2));
  }

  return 0;
}

/**
 * Calcula la liquidación y costos patronales completos de un empleado
 */
export function calculateEmployeePayroll(params: {
  baseSalary: number;
  overtimePay?: number;
  bonuses?: number;
  otherIncome?: number;
  period: PayrollPeriod;
  isCompanyOver10Employees?: boolean;
  config?: FiscalConfig;
}) {
  const {
    baseSalary,
    overtimePay = 0,
    bonuses = 0,
    otherIncome = 0,
    period,
    isCompanyOver10Employees = true,
    config = DEFAULT_FISCAL_CONFIG,
  } = params;

  const totalDevengado = Number((baseSalary + overtimePay + bonuses + otherIncome).toFixed(2));

  const isssLaboral = calculateIsssLaboral(totalDevengado, period, config);
  const afpLaboral = calculateAfpLaboral(totalDevengado, config);

  // Base Imponible de Renta = Total Devengado - ISSS - AFP
  const baseImponibleRenta = Number(Math.max(0, totalDevengado - isssLaboral - afpLaboral).toFixed(2));
  const rentaRetencion = calculateRentaElSalvador(baseImponibleRenta, period, config);

  const totalDeducciones = Number((isssLaboral + afpLaboral + rentaRetencion).toFixed(2));
  const liquidoPagar = Number((totalDevengado - totalDeducciones).toFixed(2));

  // Aportes patronales
  const isssPatronal = calculateIsssPatronal(totalDevengado, period, config);
  const afpPatronal = calculateAfpPatronal(totalDevengado, config);
  const insaforpPatronal =
    isCompanyOver10Employees
      ? Number((totalDevengado * config.insaforpPatronalRate).toFixed(2))
      : 0;

  // Provisiones legales proporcionales
  const provisionAguinaldo = Number((totalDevengado * config.provisionAguinaldoRate).toFixed(2));
  const provisionVacacion = Number((totalDevengado * config.provisionVacacionRate).toFixed(2));
  const provisionIndemnizacion = Number((totalDevengado * config.provisionIndemnizacionRate).toFixed(2));

  const totalAportesPatronales = Number((isssPatronal + afpPatronal + insaforpPatronal).toFixed(2));
  const totalProvisiones = Number((provisionAguinaldo + provisionVacacion + provisionIndemnizacion).toFixed(2));
  const costoEmpresaTotal = Number((totalDevengado + totalAportesPatronales + totalProvisiones).toFixed(2));

  return {
    totalDevengado,
    isssLaboral,
    afpLaboral,
    baseImponibleRenta,
    rentaRetencion,
    totalDeducciones,
    liquidoPagar,
    isssPatronal,
    afpPatronal,
    insaforpPatronal,
    totalAportesPatronales,
    provisionAguinaldo,
    provisionVacacion,
    provisionIndemnizacion,
    totalProvisiones,
    costoEmpresaTotal,
  };
}

/**
 * Calcula el salario por hora ordinario según Código de Trabajo El Salvador
 * Jornada ordinaria diurna de 8 horas diarias y base de 30 días mensuales
 */
export function calculateHourlyRate(baseSalary: number, period: PayrollPeriod = 'mensual'): number {
  if (baseSalary <= 0) return 0;
  const daysInPeriod = period === 'quincenal' ? 15 : 30;
  const dailyRate = baseSalary / daysInPeriod;
  return Number((dailyRate / 8).toFixed(4));
}

/**
 * Calcula Horas Extra Diurnas: recargo del 100% sobre salario hora ordinario (2x)
 */
export function calculateOvertimeDiurna(hours: number, baseSalary: number, period: PayrollPeriod = 'mensual'): number {
  if (hours <= 0 || baseSalary <= 0) return 0;
  const hourlyRate = calculateHourlyRate(baseSalary, period);
  return Number((hours * (hourlyRate * 2)).toFixed(2));
}

/**
 * Calcula Horas Extra Nocturnas: recargo del 125% sobre salario hora ordinario (2.25x)
 */
export function calculateOvertimeNocturna(hours: number, baseSalary: number, period: PayrollPeriod = 'mensual'): number {
  if (hours <= 0 || baseSalary <= 0) return 0;
  const hourlyRate = calculateHourlyRate(baseSalary, period);
  return Number((hours * (hourlyRate * 2.25)).toFixed(2));
}

/**
 * Calcula Recargo de Nocturnidad Ordinaria: 25% de recargo sobre las horas trabajadas en horario nocturno (7:00pm - 6:00am)
 */
export function calculateNightRecargo(hours: number, baseSalary: number, period: PayrollPeriod = 'mensual'): number {
  if (hours <= 0 || baseSalary <= 0) return 0;
  const hourlyRate = calculateHourlyRate(baseSalary, period);
  return Number((hours * (hourlyRate * 0.25)).toFixed(2));
}

/**
 * Calcula la retención del 10% de Impuesto sobre la Renta para Servicios Profesionales / Honorarios
 * según Artículo 156 del Código Tributario de El Salvador
 */
export function calculateProfessionalServiceRetention(grossAmount: number, rate: number = 0.10): {
  grossAmount: number;
  retentionRate: number;
  retentionAmount: number;
  netAmount: number;
} {
  const safeGross = Math.max(0, grossAmount || 0);
  const retention = Number((safeGross * rate).toFixed(2));
  const net = Number((safeGross - retention).toFixed(2));
  return {
    grossAmount: safeGross,
    retentionRate: rate,
    retentionAmount: retention,
    netAmount: net,
  };
}

/**
 * Cálculos fiscales para Facturación en El Salvador con tasas dinámicas
 */
export function calculateSaleTaxes(params: {
  type: 'factura_consumidor_final' | 'credito_fiscal' | 'nota_credito' | 'nota_debito' | 'exportacion' | 'ticket_interno';
  subtotalGravado: number;
  subtotalExento: number;
  subtotalNoSujeto: number;
  isCompanyGranContribuyente: boolean;
  isCustomerGranContribuyente: boolean;
  config?: FiscalConfig;
}) {
  const {
    type,
    subtotalGravado,
    subtotalExento,
    subtotalNoSujeto,
    isCompanyGranContribuyente,
    isCustomerGranContribuyente,
    config = DEFAULT_FISCAL_CONFIG,
  } = params;

  let iva13 = 0;
  let ivaRetenido1 = 0;
  let ivaPercibido1 = 0;

  if (type === 'credito_fiscal' || type === 'nota_credito' || type === 'nota_debito') {
    iva13 = Number((subtotalGravado * config.ivaRate).toFixed(2));

    // Regla Gran Contribuyente El Salvador:
    // Si el cliente es Gran Contribuyente y el emisor NO lo es, y la venta gravada es >= $100.00, se retiene el 1% de IVA
    if (isCustomerGranContribuyente && !isCompanyGranContribuyente && subtotalGravado >= 100.00) {
      ivaRetenido1 = Number((subtotalGravado * config.retencionIvaRate).toFixed(2));
    }

    // Si el emisor es Gran Contribuyente y el cliente NO lo es, se percibe el 1% de IVA
    if (isCompanyGranContribuyente && !isCustomerGranContribuyente && subtotalGravado >= 100.00) {
      ivaPercibido1 = Number((subtotalGravado * config.percepcionIvaRate).toFixed(2));
    }
  } else if (type === 'factura_consumidor_final') {
    // Factura Consumidor Final
    iva13 = Number((subtotalGravado * config.ivaRate).toFixed(2));
  } else if (type === 'exportacion') {
    // Exportación tasa 0% IVA
    iva13 = 0;
  }

  const totalPagar = Number(
    (subtotalGravado + subtotalExento + subtotalNoSujeto + iva13 - ivaRetenido1 + ivaPercibido1).toFixed(2)
  );

  return {
    sumasGravadas: Number(subtotalGravado.toFixed(2)),
    sumasExentas: Number(subtotalExento.toFixed(2)),
    sumasNoSujetas: Number(subtotalNoSujeto.toFixed(2)),
    iva13,
    ivaRetenido1,
    ivaPercibido1,
    totalPagar,
  };
}

/**
 * Cálculos fiscales para Compras en El Salvador con tasas dinámicas
 */
export function calculatePurchaseTaxes(params: {
  docType: 'ccf_compra' | 'factura_sujeto_excluido' | 'declaracion_mercancias' | 'nota_credito_compra';
  comprasGravadas: number;
  comprasExentas: number;
  comprasSujetoExcluido: number;
  isCompanyGranContribuyente: boolean;
  isSupplierGranContribuyente: boolean;
  isServicesPurchase?: boolean;
  config?: FiscalConfig;
}) {
  const {
    docType,
    comprasGravadas,
    comprasExentas,
    comprasSujetoExcluido,
    isCompanyGranContribuyente,
    isSupplierGranContribuyente,
    config = DEFAULT_FISCAL_CONFIG,
  } = params;

  let ivaCreditoFiscal = 0;
  let retencionRenta10 = 0;
  let retencionIva1 = 0;
  let percepcionIva1 = 0;

  if (docType === 'ccf_compra') {
    ivaCreditoFiscal = Number((comprasGravadas * config.ivaRate).toFixed(2));

    // Si nuestra empresa es Gran Contribuyente y el proveedor NO lo es, retenemos 1%
    if (isCompanyGranContribuyente && !isSupplierGranContribuyente && comprasGravadas >= 100.00) {
      retencionIva1 = Number((comprasGravadas * config.retencionIvaRate).toFixed(2));
    }

    // Si el proveedor es Gran Contribuyente y nosotros NO, nos percibe 1%
    if (isSupplierGranContribuyente && !isCompanyGranContribuyente && comprasGravadas >= 100.00) {
      percepcionIva1 = Number((comprasGravadas * config.percepcionIvaRate).toFixed(2));
    }
  } else if (docType === 'factura_sujeto_excluido') {
    // Servicios profesionales de persona natural -> Retención de Renta del 10%
    retencionRenta10 = Number((comprasSujetoExcluido * config.retencionRentaServiciosRate).toFixed(2));
  }

  const totalPagar = Number(
    (
      comprasGravadas +
      comprasExentas +
      comprasSujetoExcluido +
      ivaCreditoFiscal -
      retencionRenta10 -
      retencionIva1 +
      percepcionIva1
    ).toFixed(2)
  );

  return {
    comprasGravadas: Number(comprasGravadas.toFixed(2)),
    comprasExentas: Number(comprasExentas.toFixed(2)),
    comprasSujetoExcluido: Number(comprasSujetoExcluido.toFixed(2)),
    ivaCreditoFiscal,
    retencionRenta10,
    retencionIva1,
    percepcionIva1,
    totalPagar,
  };
}

export function formatCurrencyUSD(amount: number | string | null | undefined): string {
  const num = typeof amount === 'number' && !isNaN(amount)
    ? amount
    : typeof amount === 'string'
    ? parseFloat(amount)
    : 0;
  const safeNum = isNaN(num) ? 0 : num;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safeNum);
}
