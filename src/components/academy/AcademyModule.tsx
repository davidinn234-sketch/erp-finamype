import React, { useState } from 'react';
import {
  BookOpen,
  HelpCircle,
  Sparkles,
  Receipt,
  ShoppingBag,
  Users,
  Landmark,
  Scale,
  Settings,
  ChevronRight,
  CheckCircle2,
  FileText,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface ManualTopic {
  id: string;
  title: string;
  category: string;
  summary: string;
  icon: any;
  steps: Array<{
    stepNumber: number;
    stepTitle: string;
    description: string;
    tip?: string;
  }>;
  legalBasis?: string;
}

const MANUAL_TOPICS: ManualTopic[] = [
  {
    id: 'dte_invoicing',
    title: 'Emisión de Facturación Electrónica (DTE) en El Salvador',
    category: 'Ventas & DTE',
    summary: 'Aprende a emitir Créditos Fiscales (CCF) y Facturas Consumidor Final cumpliendo con la normativa del Ministerio de Hacienda.',
    icon: Receipt,
    legalBasis: 'Ley del IVA Art. 29, 65 y Código Tributario Art. 107 y 114 (El Salvador).',
    steps: [
      {
        stepNumber: 1,
        stepTitle: 'Acceder al Módulo de Ventas',
        description: 'Haz clic en "Ventas & DTE" en la barra de navegación lateral y presiona el botón "Nueva Venta / DTE".',
      },
      {
        stepNumber: 2,
        stepTitle: 'Seleccionar el Tipo de Documento',
        description: 'Elige "Comprobante de Crédito Fiscal (CCF)" si tu cliente es contribuyente de IVA y tiene NRC registrado, o "Factura Consumidor Final" para clientes finales.',
        tip: 'Si emites CCF, asegúrate de ingresar el NRC y NIT del cliente para que el sistema valide el crédito fiscal.',
      },
      {
        stepNumber: 3,
        stepTitle: 'Agregar Productos o Servicios',
        description: 'Selecciona los ítems de tu catálogo o escribe la descripción. El sistema calculará automáticamente el 13% de IVA.',
      },
      {
        stepNumber: 4,
        stepTitle: 'Condición de Pago y Percepción/Retención',
        description: 'Si tu empresa está catalogada como Gran Contribuyente y tu cliente no lo es, el sistema aplicará automáticamente la Percepción del 1% de IVA (Art. 163 CT).',
      },
      {
        stepNumber: 5,
        stepTitle: 'Emisión & Asiento Contable Automático',
        description: 'Al guardar, se genera el código DTE correlativo y se asienta automáticamente la partida de Débito Fiscal IVA y Cuentas por Cobrar/Caja.',
      },
    ],
  },
  {
    id: 'purchases_withholding',
    title: 'Compras, Sujetos Excluidos & Retención 10% Renta',
    category: 'Compras & SCM',
    summary: 'Cómo registrar facturas de compras, aplicar retenciones del 1% de IVA y retener el 10% de Impuesto sobre la Renta a profesionales independientes.',
    icon: ShoppingBag,
    legalBasis: 'Art. 156-A y Art. 162 del Código Tributario de El Salvador.',
    steps: [
      {
        stepNumber: 1,
        stepTitle: 'Abrir el Módulo de Compras & Proveedores',
        description: 'Dirígete a "Compras & SCM" y presiona "Nueva Compra / Factura de Proveedor".',
      },
      {
        stepNumber: 2,
        stepTitle: 'Elegir el Tipo de Compra',
        description: 'Selecciona "Crédito Fiscal de Compra" si compraste a una empresa con CCF, o "Factura de Sujeto Excluido" si contrataste a una persona natural sin NRC (ej: abogado, diseñador, plomero).',
      },
      {
        stepNumber: 3,
        stepTitle: 'Cálculo de la Retención del 10% de Renta',
        description: 'Al seleccionar "Factura de Sujeto Excluido", el sistema descuenta automáticamente el 10% del total en concepto de Retención de Renta para declararse en el F-14 del Ministerio de Hacienda.',
        tip: 'El cheque o transferencia bancaria al profesional se liquida por el 90% restante.',
      },
      {
        stepNumber: 4,
        stepTitle: 'Ingreso al Kardex y Costo Promedio Ponderado',
        description: 'Si la compra contiene productos de inventario, el stock se incrementa inmediatamente y se recalcula el costo unitario promedio en el Kardex.',
      },
    ],
  },
  {
    id: 'payroll_sv',
    title: 'Cálculo y Generación de Planilla Legal (ISSS, AFP, Renta)',
    category: 'Recursos Humanos',
    summary: 'Guía paso a paso para procesar la nómina quincenal o mensual, retener ISSS (3%), AFP (7.25%) y Renta según las tablas del Ministerio de Hacienda.',
    icon: Users,
    legalBasis: 'Código de Trabajo de El Salvador, Ley del ISSS y Ley del Sistema de Ahorro para Pensiones (SAP).',
    steps: [
      {
        stepNumber: 1,
        stepTitle: 'Verificar Colaboradores Activos',
        description: 'Ingresa a "RRHH & Planilla" y confirma que todos los colaboradores tengan sus salarios base, DUI, NIT y número de afiliación de AFP (Crecer/Confía) registrados.',
      },
      {
        stepNumber: 2,
        stepTitle: 'Generar Planilla del Período',
        description: 'Presiona "Generar Planilla", selecciona si es período Quincenal o Mensual y el mes correspondiente.',
      },
      {
        stepNumber: 3,
        stepTitle: 'Revisión de Deducciones y Aportes Patronales',
        description: 'El motor calcula automáticamente: ISSS Laboral (3% hasta techo de $1,000), AFP Laboral (7.25%), Base Imponible y Renta según tabla oficial. También calcula los aportes patronales (ISSS 7.5%, AFP 8.75%, INSAFORP 1%) y las provisiones de aguinaldo y vacaciones.',
      },
      {
        stepNumber: 4,
        stepTitle: 'Dispersión y Asiento Contable',
        description: 'Al aprobar la nómina, se genera el asiento de devengo en el Libro Diario y puedes marcar la planilla como pagada seleccionando la cuenta bancaria de origen.',
      },
    ],
  },
  {
    id: 'crm_segmentation',
    title: 'Segmentación de Clientes y CRM Comercial',
    category: 'CRM & Clientes',
    summary: 'Cómo utilizar los datos demográficos (edad, género, departamentos de El Salvador, canales) para impulsar las ventas de tu startup.',
    icon: Users,
    steps: [
      {
        stepNumber: 1,
        stepTitle: 'Registrar Perfil Completo del Cliente',
        description: 'Al crear un cliente en el CRM, indica su rango de edad (18-25, 26-35, 36-50, 50+), género (femenino, masculino, corporativo) y canal de adquisición (Instagram, referidos, web).',
      },
      {
        stepNumber: 2,
        stepTitle: 'Bitácora y Notas de Seguimiento',
        description: 'Añade notas de reuniones, llamadas o mensajes de WhatsApp en el expediente del cliente para no perder oportunidades de venta.',
      },
      {
        stepNumber: 3,
        stepTitle: 'Visualizar Gráficos con Inteligencia Artificial',
        description: 'En el Dashboard Ejecutivo, puedes ver widgets dinámicos con la proporción de ingresos por segmento de edad y género para enfocar tus campañas publicitarias.',
      },
    ],
  },
  {
    id: 'treasury_cashflow',
    title: 'Control de Tesorería y Flujo de Caja Real vs Proyectado',
    category: 'Finanzas & Caja',
    summary: 'Diferencia entre el flujo de efectivo real ejecutado y las proyecciones a 90 días para asegurar que nunca te quedes sin liquidez.',
    icon: Landmark,
    steps: [
      {
        stepNumber: 1,
        stepTitle: 'Administrar Cuentas Bancarias y Cajas',
        description: 'Registra tus cuentas corrientes en bancos locales (Banco Agrícola, BAC Credomatic, Cuscatlán) y tus fondos de caja chica.',
      },
      {
        stepNumber: 2,
        stepTitle: 'Flujo de Efectivo Real',
        description: 'Muestra exactamente el dinero cobrado al contado, cobros de CxC, menos compras pagadas, sueldos y aportes de planilla.',
      },
      {
        stepNumber: 3,
        stepTitle: 'Proyecciones a 90 Días',
        description: 'El algoritmo calcula los cobros futuros según los plazos de crédito de tus facturas y descuenta las cuentas por pagar y planillas fijas para alertarte si hay riesgo de déficit.',
      },
    ],
  },
  {
    id: 'customization_taxes',
    title: 'Personalización de Tasas Fiscales y Catálogo de Cuentas',
    category: 'Configuración',
    summary: 'Ajusta los porcentajes de impuestos (ISSS, AFP, Renta, IVA) y simplifica o expande las cuentas contables de acuerdo con el tamaño de tu empresa.',
    icon: Settings,
    steps: [
      {
        stepNumber: 1,
        stepTitle: 'Ingresar a Configuración > Parámetros Fiscales',
        description: 'Si en el futuro la Asamblea Legislativa aprueba cambios en las tasas del ISSS o AFP, puedes modificarlas directamente desde este panel.',
      },
      {
        stepNumber: 2,
        stepTitle: 'Elegir Plantilla de Catálogo Contable',
        description: 'Para una pequeña empresa o startup que viene de Excel, carga el "Catálogo Startup (Simplificado)". Si tu contador requiere auditoría formal, carga el "Catálogo NIIF Completo".',
      },
      {
        stepNumber: 3,
        stepTitle: 'Respaldos Automáticos en JSON',
        description: 'Descarga copias de seguridad de toda la base de datos con un solo clic para tener tranquilidad y control de tu información.',
      },
    ],
  },
];

export const AcademyModule: React.FC = () => {
  const [selectedTopicId, setSelectedTopicId] = useState<string>(MANUAL_TOPICS[0].id);

  const selectedTopic = MANUAL_TOPICS.find((t) => t.id === selectedTopicId) || MANUAL_TOPICS[0];
  const Icon = selectedTopic.icon;

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Academia & Manuales Paso a Paso
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
              Guías Interactivas SV
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manuales detallados para emprendedores, gerentes y contadores sobre cómo operar el ERP y cumplir la ley salvadoreña.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Topics List */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block px-2 mb-2">
            Temas de Capacitación
          </span>
          {MANUAL_TOPICS.map((topic) => {
            const TopicIcon = topic.icon;
            const isSelected = topic.id === selectedTopicId;
            return (
              <button
                key={topic.id}
                onClick={() => setSelectedTopicId(topic.id)}
                className={`w-full text-left p-3.5 rounded-2xl border transition flex items-start gap-3 cursor-pointer ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200 shadow-xs ring-1 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <TopicIcon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
                    {topic.category}
                  </span>
                  <h4 className="text-xs font-bold truncate text-slate-900 dark:text-white">
                    {topic.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                    {topic.summary}
                  </p>
                </div>
                <ChevronRight className={`w-4 h-4 mt-1 transition ${isSelected ? 'text-indigo-600' : 'text-slate-300'}`} />
              </button>
            );
          })}
        </div>

        {/* Right Step-by-step Reader */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-5">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold mb-2">
              <Icon className="w-3.5 h-3.5" />
              <span>{selectedTopic.category}</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              {selectedTopic.title}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              {selectedTopic.summary}
            </p>

            {selectedTopic.legalBasis && (
              <div className="mt-3 p-3 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 rounded-xl flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-300">
                <ShieldCheck className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div>
                  <span className="font-bold block">Fundamento Legal (El Salvador):</span>
                  <span>{selectedTopic.legalBasis}</span>
                </div>
              </div>
            )}
          </div>

          {/* Steps Timeline */}
          <div className="space-y-6">
            {selectedTopic.steps.map((step) => (
              <div key={step.stepNumber} className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                  {step.stepNumber}
                </div>
                <div className="flex-1 space-y-1.5 pt-0.5">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {step.stepTitle}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {step.description}
                  </p>
                  {step.tip && (
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-[11px] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-start gap-2">
                      <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span>
                        <strong className="font-semibold text-slate-800 dark:text-slate-200">Consejo Práctico: </strong>
                        {step.tip}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
