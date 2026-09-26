import { AccountNode } from '../types';

/**
 * Catálogo Completo NIIF para PYMES (El Salvador)
 */
export const FULL_NIIF_CHART_OF_ACCOUNTS: AccountNode[] = [
  // 1. ACTIVO
  { code: '1', name: 'ACTIVO', category: 'activo', level: 1, isMovement: false, debitBalance: 0, creditBalance: 0, balance: 0 },
  { code: '11', name: 'ACTIVO CORRIENTE', category: 'activo', level: 2, parentCode: '1', isMovement: false, debitBalance: 0, creditBalance: 0, balance: 0 },
  { code: '1101', name: 'Efectivo y Equivalentes de Efectivo', category: 'activo', level: 3, parentCode: '11', isMovement: false, debitBalance: 0, creditBalance: 0, balance: 0 },
  { code: '1101-01', name: 'Caja General', category: 'activo', level: 4, parentCode: '1101', isMovement: true, debitBalance: 2450.00, creditBalance: 0, balance: 2450.00 },
  { code: '1101-02', name: 'Caja Chica', category: 'activo', level: 4, parentCode: '1101', isMovement: true, debitBalance: 300.00, creditBalance: 0, balance: 300.00 },
  { code: '1101-03', name: 'Banco Agrícola (Cta. Corriente)', category: 'activo', level: 4, parentCode: '1101', isMovement: true, debitBalance: 18450.00, creditBalance: 0, balance: 18450.00 },
  { code: '1101-04', name: 'BAC Credomatic (Cta. Corriente)', category: 'activo', level: 4, parentCode: '1101', isMovement: true, debitBalance: 9800.00, creditBalance: 0, balance: 9800.00 },
  { code: '1101-05', name: 'Banco Cuscatlán (Cta. Empresarial)', category: 'activo', level: 4, parentCode: '1101', isMovement: true, debitBalance: 5200.00, creditBalance: 0, balance: 5200.00 },
  
  { code: '1103', name: 'Cuentas por Cobrar Comerciales (Clientes)', category: 'activo', level: 3, parentCode: '11', isMovement: false, debitBalance: 0, creditBalance: 0, balance: 0 },
  { code: '1103-01', name: 'Clientes Locales', category: 'activo', level: 4, parentCode: '1103', isMovement: true, debitBalance: 8750.00, creditBalance: 0, balance: 8750.00 },
  { code: '1103-02', name: 'Clientes del Exterior', category: 'activo', level: 4, parentCode: '1103', isMovement: true, debitBalance: 1200.00, creditBalance: 0, balance: 1200.00 },
  
  { code: '1105', name: 'Inventario de Mercaderías', category: 'activo', level: 3, parentCode: '11', isMovement: false, debitBalance: 0, creditBalance: 0, balance: 0 },
  { code: '1105-01', name: 'Mercaderías para la Venta (Bodega Central)', category: 'activo', level: 4, parentCode: '1105', isMovement: true, debitBalance: 14200.00, creditBalance: 0, balance: 14200.00 },
  
  { code: '1107', name: 'Impuestos por Recuperar / Anticipos', category: 'activo', level: 3, parentCode: '11', isMovement: false, debitBalance: 0, creditBalance: 0, balance: 0 },
  { code: '1107-01', name: 'Retención IVA 1% Clientes (Crédito Fiscal)', category: 'activo', level: 4, parentCode: '1107', isMovement: true, debitBalance: 320.00, creditBalance: 0, balance: 320.00 },
  { code: '1107-02', name: 'Pago a Cuenta ISR (1.75%)', category: 'activo', level: 4, parentCode: '1107', isMovement: true, debitBalance: 610.00, creditBalance: 0, balance: 610.00 },
  { code: '1108', name: 'IVA Crédito Fiscal (Compras y Gastos)', category: 'activo', level: 3, parentCode: '11', isMovement: true, debitBalance: 1890.00, creditBalance: 0, balance: 1890.00 },

  { code: '12', name: 'ACTIVO NO CORRIENTE', category: 'activo', level: 2, parentCode: '1', isMovement: false, debitBalance: 0, creditBalance: 0, balance: 0 },
  { code: '1201', name: 'Propiedad, Planta y Equipo', category: 'activo', level: 3, parentCode: '12', isMovement: false, debitBalance: 0, creditBalance: 0, balance: 0 },
  { code: '1201-01', name: 'Mobiliario y Equipo de Oficina', category: 'activo', level: 4, parentCode: '1201', isMovement: true, debitBalance: 6500.00, creditBalance: 0, balance: 6500.00 },
  { code: '1201-02', name: 'Equipo de Cómputo y Servidores', category: 'activo', level: 4, parentCode: '1201', isMovement: true, debitBalance: 12400.00, creditBalance: 0, balance: 12400.00 },
  { code: '1202', name: 'Depreciación Acumulada', category: 'activo', level: 3, parentCode: '12', isMovement: true, debitBalance: 0, creditBalance: 3100.00, balance: -3100.00 },

  // 2. PASIVO
  { code: '2', name: 'PASIVO', category: 'pasivo', level: 1, isMovement: false, debitBalance: 0, creditBalance: 0, balance: 0 },
  { code: '21', name: 'PASIVO CORRIENTE', category: 'pasivo', level: 2, parentCode: '2', isMovement: false, debitBalance: 0, creditBalance: 0, balance: 0 },
  { code: '2101', name: 'Cuentas por Pagar Comerciales (Proveedores)', category: 'pasivo', level: 3, parentCode: '21', isMovement: false, debitBalance: 0, creditBalance: 0, balance: 0 },
  { code: '2101-01', name: 'Proveedores Locales', category: 'pasivo', level: 4, parentCode: '2101', isMovement: true, debitBalance: 0, creditBalance: 6420.00, balance: 6420.00 },
  
  { code: '2107', name: 'Débito Fiscal IVA', category: 'pasivo', level: 3, parentCode: '21', isMovement: false, debitBalance: 0, creditBalance: 0, balance: 0 },
  { code: '2107-01', name: 'IVA Débito Fiscal (Ventas Locales)', category: 'pasivo', level: 4, parentCode: '2107', isMovement: true, debitBalance: 0, creditBalance: 2980.00, balance: 2980.00 },
  { code: '2107-02', name: 'IVA Percibido 1%', category: 'pasivo', level: 4, parentCode: '2107', isMovement: true, debitBalance: 0, creditBalance: 120.00, balance: 120.00 },

  { code: '2108', name: 'Retenciones Tributarias y Legales por Pagar', category: 'pasivo', level: 3, parentCode: '21', isMovement: false, debitBalance: 0, creditBalance: 0, balance: 0 },
  { code: '2108-01', name: 'ISSS Laboral por Pagar (3%)', category: 'pasivo', level: 4, parentCode: '2108', isMovement: true, debitBalance: 0, creditBalance: 210.00, balance: 210.00 },
  { code: '2108-02', name: 'AFP Laboral por Pagar (7.25%)', category: 'pasivo', level: 4, parentCode: '2108', isMovement: true, debitBalance: 0, creditBalance: 507.50, balance: 507.50 },
  { code: '2108-03', name: 'Retención de Renta Empleados (Tabla MH)', category: 'pasivo', level: 4, parentCode: '2108', isMovement: true, debitBalance: 0, creditBalance: 485.00, balance: 485.00 },
  { code: '2108-04', name: 'Retención de Renta 10% Servicios Profesionales', category: 'pasivo', level: 4, parentCode: '2108', isMovement: true, debitBalance: 0, creditBalance: 250.00, balance: 250.00 },
  { code: '2108-05', name: 'Retención IVA 1% Proveedores', category: 'pasivo', level: 4, parentCode: '2108', isMovement: true, debitBalance: 0, creditBalance: 65.00, balance: 65.00 },

  { code: '2109', name: 'Obligaciones y Aportes Patronales por Pagar', category: 'pasivo', level: 3, parentCode: '21', isMovement: false, debitBalance: 0, creditBalance: 0, balance: 0 },
  { code: '2109-01', name: 'ISSS Patronal por Pagar (7.5%)', category: 'pasivo', level: 4, parentCode: '2109', isMovement: true, debitBalance: 0, creditBalance: 525.00, balance: 525.00 },
  { code: '2109-02', name: 'AFP Patronal por Pagar (8.75%)', category: 'pasivo', level: 4, parentCode: '2109', isMovement: true, debitBalance: 0, creditBalance: 612.50, balance: 612.50 },
  { code: '2109-03', name: 'INSAFORP por Pagar (1%)', category: 'pasivo', level: 4, parentCode: '2109', isMovement: true, debitBalance: 0, creditBalance: 70.00, balance: 70.00 },
  { code: '2109-04', name: 'Sueldos y Salarios Netos por Pagar', category: 'pasivo', level: 4, parentCode: '2109', isMovement: true, debitBalance: 0, creditBalance: 0, balance: 0 },

  { code: '2110', name: 'Provisiones para Prestaciones Laborales', category: 'pasivo', level: 3, parentCode: '21', isMovement: false, debitBalance: 0, creditBalance: 0, balance: 0 },
  { code: '2110-01', name: 'Provisión para Aguinaldos', category: 'pasivo', level: 4, parentCode: '2110', isMovement: true, debitBalance: 0, creditBalance: 1250.00, balance: 1250.00 },
  { code: '2110-02', name: 'Provisión para Vacaciones (Recargo 30%)', category: 'pasivo', level: 4, parentCode: '2110', isMovement: true, debitBalance: 0, creditBalance: 1625.00, balance: 1625.00 },
  { code: '2110-03', name: 'Provisión para Indemnizaciones', category: 'pasivo', level: 4, parentCode: '2110', isMovement: true, debitBalance: 0, creditBalance: 2500.00, balance: 2500.00 },

  // 3. PATRIMONIO
  { code: '3', name: 'PATRIMONIO NETO', category: 'patrimonio', level: 1, isMovement: false, debitBalance: 0, creditBalance: 0, balance: 0 },
  { code: '3101', name: 'Capital Social Pagado', category: 'patrimonio', level: 2, parentCode: '3', isMovement: true, debitBalance: 0, creditBalance: 25000.00, balance: 25000.00 },
  { code: '3102', name: 'Reserva Legal (7%)', category: 'patrimonio', level: 2, parentCode: '3', isMovement: true, debitBalance: 0, creditBalance: 2800.00, balance: 2800.00 },
  { code: '3103', name: 'Utilidades Acumuladas de Ejercicios Anteriores', category: 'patrimonio', level: 2, parentCode: '3', isMovement: true, debitBalance: 0, creditBalance: 8900.00, balance: 8900.00 },
  { code: '3104', name: 'Utilidad / Pérdida del Ejercicio Actual', category: 'patrimonio', level: 2, parentCode: '3', isMovement: true, debitBalance: 0, creditBalance: 0, balance: 0 },

  // 4. COSTOS
  { code: '4', name: 'COSTOS DE VENTA Y PRODUCCIÓN', category: 'costos', level: 1, isMovement: false, debitBalance: 0, creditBalance: 0, balance: 0 },
  { code: '4101', name: 'Costo de Mercaderías Vendidas', category: 'costos', level: 2, parentCode: '4', isMovement: true, debitBalance: 12800.00, creditBalance: 0, balance: 12800.00 },
  { code: '4102', name: 'Costos Directos de Servicios', category: 'costos', level: 2, parentCode: '4', isMovement: true, debitBalance: 3400.00, creditBalance: 0, balance: 3400.00 },

  // 5. GASTOS
  { code: '5', name: 'GASTOS OPERACIONALES Y ADMINISTRATIVOS', category: 'gastos', level: 1, isMovement: false, debitBalance: 0, creditBalance: 0, balance: 0 },
  { code: '51', name: 'GASTOS DE ADMINISTRACIÓN', category: 'gastos', level: 2, parentCode: '5', isMovement: false, debitBalance: 0, creditBalance: 0, balance: 0 },
  { code: '5101-01', name: 'Sueldos y Salarios Administrativos', category: 'gastos', level: 3, parentCode: '51', isMovement: true, debitBalance: 4200.00, creditBalance: 0, balance: 4200.00 },
  { code: '5101-02', name: 'Aportes Patronales ISSS Admin (7.5%)', category: 'gastos', level: 3, parentCode: '51', isMovement: true, debitBalance: 315.00, creditBalance: 0, balance: 315.00 },
  { code: '5101-03', name: 'Aportes Patronales AFP Admin (8.75%)', category: 'gastos', level: 3, parentCode: '51', isMovement: true, debitBalance: 367.50, creditBalance: 0, balance: 367.50 },
  { code: '5101-04', name: 'Aportes INSAFORP Admin (1%)', category: 'gastos', level: 3, parentCode: '51', isMovement: true, debitBalance: 42.00, creditBalance: 0, balance: 42.00 },
  { code: '5101-05', name: 'Gastos de Provisiones Laborales Admin', category: 'gastos', level: 3, parentCode: '51', isMovement: true, debitBalance: 752.64, creditBalance: 0, balance: 752.64 },
  { code: '5102-01', name: 'Alquiler de Oficinas y Local', category: 'gastos', level: 3, parentCode: '51', isMovement: true, debitBalance: 1200.00, creditBalance: 0, balance: 1200.00 },
  { code: '5102-02', name: 'Servicios Básicos (Energía, Agua, Internet)', category: 'gastos', level: 3, parentCode: '51', isMovement: true, debitBalance: 380.00, creditBalance: 0, balance: 380.00 },
  { code: '5102-03', name: 'Honorarios Profesionales (Asesoría Contable/Legal)', category: 'gastos', level: 3, parentCode: '51', isMovement: true, debitBalance: 500.00, creditBalance: 0, balance: 500.00 },
  { code: '5102-04', name: 'Software en la Nube y Licencias SaaS', category: 'gastos', level: 3, parentCode: '51', isMovement: true, debitBalance: 280.00, creditBalance: 0, balance: 280.00 },

  { code: '52', name: 'GASTOS DE VENTA Y MERCADEO', category: 'gastos', level: 2, parentCode: '5', isMovement: false, debitBalance: 0, creditBalance: 0, balance: 0 },
  { code: '5201-01', name: 'Sueldos y Comisiones de Ventas', category: 'gastos', level: 3, parentCode: '52', isMovement: true, debitBalance: 2800.00, creditBalance: 0, balance: 2800.00 },
  { code: '5201-02', name: 'Aportes Patronales Ventas (ISSS/AFP/INSAFORP)', category: 'gastos', level: 3, parentCode: '52', isMovement: true, debitBalance: 483.00, creditBalance: 0, balance: 483.00 },
  { code: '5202-01', name: 'Publicidad Digital (Meta Ads, Google Ads)', category: 'gastos', level: 3, parentCode: '52', isMovement: true, debitBalance: 650.00, creditBalance: 0, balance: 650.00 },
  { code: '5202-02', name: 'Envíos y Logística de Entrega Local', category: 'gastos', level: 3, parentCode: '52', isMovement: true, debitBalance: 420.00, creditBalance: 0, balance: 420.00 },

  { code: '53', name: 'GASTOS FINANCIEROS', category: 'gastos', level: 2, parentCode: '5', isMovement: false, debitBalance: 0, creditBalance: 0, balance: 0 },
  { code: '5301-01', name: 'Comisiones Bancarias y POS Wompi/Cuscatlán', category: 'gastos', level: 3, parentCode: '53', isMovement: true, debitBalance: 145.00, creditBalance: 0, balance: 145.00 },

  // 6. INGRESOS
  { code: '6', name: 'INGRESOS OPERACIONALES', category: 'ingresos', level: 1, isMovement: false, debitBalance: 0, creditBalance: 0, balance: 0 },
  { code: '6101', name: 'Ventas de Mercaderías (Comercio)', category: 'ingresos', level: 2, parentCode: '6', isMovement: true, debitBalance: 0, creditBalance: 22400.00, balance: 22400.00 },
  { code: '6102', name: 'Ingresos por Prestación de Servicios', category: 'ingresos', level: 2, parentCode: '6', isMovement: true, debitBalance: 0, creditBalance: 8600.00, balance: 8600.00 },
  { code: '6103', name: 'Ingresos por Exportación de Servicios/Software', category: 'ingresos', level: 2, parentCode: '6', isMovement: true, debitBalance: 0, creditBalance: 4500.00, balance: 4500.00 },
  { code: '6201', name: 'Otros Ingresos no Operacionales', category: 'ingresos', level: 2, parentCode: '6', isMovement: true, debitBalance: 0, creditBalance: 150.00, balance: 150.00 },
];

/**
 * Catálogo Simplificado para Startups, Emprendedores y Microempresas (El Salvador)
 * Diseñado para ser extremadamente simple, ágil y fácil de entender.
 */
export const SIMPLIFIED_STARTUP_CHART_OF_ACCOUNTS: AccountNode[] = [
  // 1. ACTIVO (Lo que tenemos)
  { code: '1', name: 'ACTIVO', category: 'activo', level: 1, isMovement: false, debitBalance: 0, creditBalance: 0, balance: 0 },
  { code: '1101-01', name: 'Caja y Efectivo', category: 'activo', level: 2, parentCode: '1', isMovement: true, debitBalance: 2750.00, creditBalance: 0, balance: 2750.00 },
  { code: '1101-02', name: 'Cuentas de Banco (Agrícola / BAC)', category: 'activo', level: 2, parentCode: '1', isMovement: true, debitBalance: 28250.00, creditBalance: 0, balance: 28250.00 },
  { code: '1103-01', name: 'Cuentas por Cobrar a Clientes', category: 'activo', level: 2, parentCode: '1', isMovement: true, debitBalance: 9950.00, creditBalance: 0, balance: 9950.00 },
  { code: '1105-01', name: 'Inventario de Productos para Venta', category: 'activo', level: 2, parentCode: '1', isMovement: true, debitBalance: 14200.00, creditBalance: 0, balance: 14200.00 },
  { code: '1108', name: 'IVA Crédito Fiscal (Compras)', category: 'activo', level: 2, parentCode: '1', isMovement: true, debitBalance: 1890.00, creditBalance: 0, balance: 1890.00 },
  { code: '1201-01', name: 'Mobiliario, Computadoras y Equipos', category: 'activo', level: 2, parentCode: '1', isMovement: true, debitBalance: 18900.00, creditBalance: 0, balance: 18900.00 },

  // 2. PASIVO (Lo que debemos)
  { code: '2', name: 'PASIVO', category: 'pasivo', level: 1, isMovement: false, debitBalance: 0, creditBalance: 0, balance: 0 },
  { code: '2101-01', name: 'Cuentas por Pagar a Proveedores', category: 'pasivo', level: 2, parentCode: '2', isMovement: true, debitBalance: 0, creditBalance: 6420.00, balance: 6420.00 },
  { code: '2107-01', name: 'IVA Débito Fiscal (Ventas)', category: 'pasivo', level: 2, parentCode: '2', isMovement: true, debitBalance: 0, creditBalance: 2980.00, balance: 2980.00 },
  { code: '2108-01', name: 'ISSS, AFP y Renta por Pagar', category: 'pasivo', level: 2, parentCode: '2', isMovement: true, debitBalance: 0, creditBalance: 2610.00, balance: 2610.00 },
  { code: '2110-01', name: 'Provisiones Aguinaldo y Vacaciones', category: 'pasivo', level: 2, parentCode: '2', isMovement: true, debitBalance: 0, creditBalance: 5375.00, balance: 5375.00 },

  // 3. PATRIMONIO (Capital de los socios)
  { code: '3', name: 'PATRIMONIO', category: 'patrimonio', level: 1, isMovement: false, debitBalance: 0, creditBalance: 0, balance: 0 },
  { code: '3101', name: 'Capital Inicial Aportado', category: 'patrimonio', level: 2, parentCode: '3', isMovement: true, debitBalance: 0, creditBalance: 25000.00, balance: 25000.00 },
  { code: '3103', name: 'Ganancias de Años Anteriores', category: 'patrimonio', level: 2, parentCode: '3', isMovement: true, debitBalance: 0, creditBalance: 11700.00, balance: 11700.00 },

  // 4. COSTOS (Costo directo de lo que vendemos)
  { code: '4', name: 'COSTOS', category: 'costos', level: 1, isMovement: false, debitBalance: 0, creditBalance: 0, balance: 0 },
  { code: '4101', name: 'Costo de Mercadería o Servicio Vendido', category: 'costos', level: 2, parentCode: '4', isMovement: true, debitBalance: 16200.00, creditBalance: 0, balance: 16200.00 },

  // 5. GASTOS (Gastos para operar el negocio)
  { code: '5', name: 'GASTOS', category: 'gastos', level: 1, isMovement: false, debitBalance: 0, creditBalance: 0, balance: 0 },
  { code: '5101-01', name: 'Sueldos y Planilla de Empleados', category: 'gastos', level: 2, parentCode: '5', isMovement: true, debitBalance: 7000.00, creditBalance: 0, balance: 7000.00 },
  { code: '5101-02', name: 'Costo Patronal Planilla (ISSS/AFP/INSAFORP)', category: 'gastos', level: 2, parentCode: '5', isMovement: true, debitBalance: 1207.50, creditBalance: 0, balance: 1207.50 },
  { code: '5102-01', name: 'Alquiler y Servicios Básicos', category: 'gastos', level: 2, parentCode: '5', isMovement: true, debitBalance: 1580.00, creditBalance: 0, balance: 1580.00 },
  { code: '5202-01', name: 'Publicidad Digital y Envíos', category: 'gastos', level: 2, parentCode: '5', isMovement: true, debitBalance: 1070.00, creditBalance: 0, balance: 1070.00 },
  { code: '5301-01', name: 'Comisiones de Tarjeta y Bancarias', category: 'gastos', level: 2, parentCode: '5', isMovement: true, debitBalance: 145.00, creditBalance: 0, balance: 145.00 },

  // 6. INGRESOS (Ventas del negocio)
  { code: '6', name: 'INGRESOS', category: 'ingresos', level: 1, isMovement: false, debitBalance: 0, creditBalance: 0, balance: 0 },
  { code: '6101', name: 'Ventas y Facturación de Servicios/Productos', category: 'ingresos', level: 2, parentCode: '6', isMovement: true, debitBalance: 0, creditBalance: 35500.00, balance: 35500.00 },
];

export const DEFAULT_CHART_OF_ACCOUNTS = FULL_NIIF_CHART_OF_ACCOUNTS;
