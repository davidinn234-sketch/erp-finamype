import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  Sparkles,
  Building2,
  Receipt,
  Landmark,
  Scale,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Store,
  FileSpreadsheet,
  ScanBarcode,
  Save,
  HelpCircle,
  Zap,
  Info,
  Percent,
} from 'lucide-react';
import { SALVADORAN_DEPARTMENTS, getMunicipalitiesForDepartment } from '../../utils/salvadoranGeography';

interface DeclarativeOnboardingWizardProps {
  onComplete?: () => void;
  isInlineTab?: boolean;
}

export const DeclarativeOnboardingWizard: React.FC<DeclarativeOnboardingWizardProps> = ({
  onComplete,
  isInlineTab = false,
}) => {
  const { currentCompany, updateCompany, updateRegimeConfig, addNotification } = useERP();

  // Step 1: Regime
  const [regimeType, setRegimeType] = useState<'emprendedor_control_interno' | 'general_tributario'>(
    currentCompany?.regimeType || (currentCompany?.dteActive ? 'general_tributario' : 'emprendedor_control_interno')
  );

  // Step 2: DTE Status (One-Click Migration)
  const [dteActive, setDteActive] = useState<boolean>(currentCompany?.dteActive ?? false);

  const safeDeptName = typeof currentCompany?.department === 'string'
    ? currentCompany.department
    : (currentCompany?.department as any)?.name || 'San Salvador';

  // Step 3: Taxes Configuration
  const [declaIva, setDeclaIva] = useState<boolean>(
    currentCompany?.taxesConfig?.declaIva ?? (regimeType === 'general_tributario')
  );
  const [declaPagoCuenta, setDeclaPagoCuenta] = useState<boolean>(
    currentCompany?.taxesConfig?.declaPagoCuenta ?? (regimeType === 'general_tributario')
  );
  const [declaImpuestosMunicipales, setDeclaImpuestosMunicipales] = useState<boolean>(
    currentCompany?.taxesConfig?.declaImpuestosMunicipales ?? true
  );
  const [municipalRateOrFee, setMunicipalRateOrFee] = useState<number>(
    currentCompany?.taxesConfig?.municipalRateOrFee ?? 25.00
  );
  const [alcaldiaName, setAlcaldiaName] = useState<string>(
    currentCompany?.taxesConfig?.alcaldiaName || `Alcaldía Municipal de ${safeDeptName}`
  );

  // Step 4: Company Profile Details
  const [tradeName, setTradeName] = useState<string>(currentCompany?.tradeName || currentCompany?.name || 'Mi Empresa');
  const [giro, setGiro] = useState<string>(currentCompany?.giro || 'Venta al por menor y servicios comerciales');
  const [department, setDepartment] = useState<string>(safeDeptName);
  const [phone, setPhone] = useState<string>(currentCompany?.phone || '+503 ');

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveConfiguration = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    updateRegimeConfig({
      regimeType,
      dteActive,
      taxesConfig: {
        declaIva,
        declaPagoCuenta,
        declaImpuestosMunicipales,
        municipalRateOrFee: Number(municipalRateOrFee) || 0,
        alcaldiaName,
      },
    });

    if (currentCompany?.id) {
      updateCompany(currentCompany.id, {
        tradeName,
        giro,
        department,
        phone,
      });
    }

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);

    if (onComplete) {
      onComplete();
    }
  };

  const municipalities = getMunicipalitiesForDepartment(department);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/30 border border-indigo-400/30 text-indigo-200 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Configuración Declarativa & Personalización Lean</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Adapta FinaPyme a la Realidad de tu Negocio
          </h2>
          <p className="text-indigo-200 text-xs sm:text-sm leading-relaxed">
            Desde un emprendedor que solo lleva control interno de ventas y tasas de alcaldía,
            hasta una empresa formal con Facturación Electrónica DTE ante el Ministerio de Hacienda.
            Puedes migrar con <strong className="text-white">un solo clic</strong> en cualquier momento.
          </p>
        </div>

        {/* Decorative Badge */}
        <div className="absolute right-4 bottom-4 opacity-10 sm:opacity-20 pointer-events-none">
          <Store className="w-48 h-48 text-white" />
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <p className="font-bold text-sm">¡Configuración aplicada con éxito!</p>
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                El sistema ahora opera en modo{' '}
                <strong>{dteActive ? 'Facturación Electrónica DTE Oficial' : 'Control Interno Emprendedor'}</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Declarative Form */}
      <form onSubmit={handleSaveConfiguration} className="space-y-6">
        {/* Section 1: Business Type & Regime */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black">
              1
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                ¿Qué tipo de negocio tienes o estás comenzando?
              </h3>
              <p className="text-xs text-slate-500">
                Elige tu modelo actual. Podrás cambiar o escalar cuando lo desees.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Option A: Emprendedor / Control Interno */}
            <div
              onClick={() => {
                setRegimeType('emprendedor_control_interno');
                setDteActive(false);
                setDeclaIva(false);
                setDeclaPagoCuenta(false);
              }}
              className={`p-5 rounded-xl border-2 transition cursor-pointer relative ${
                regimeType === 'emprendedor_control_interno'
                  ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 dark:border-indigo-400'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="p-2.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 mb-3">
                  <Store className="w-6 h-6" />
                </div>
                {regimeType === 'emprendedor_control_interno' && (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/60 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Seleccionado
                  </span>
                )}
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Emprendedor / Comercio Ágil (Control Interno)
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                Para negocios que van iniciando, tiendas de conveniencia, pupuserías, servicios independientes o
                emprendimientos que no tributan IVA/Hacienda y solo pagan tasas municipales.
              </p>
              <ul className="mt-3 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                <li>✓ Emisión de tickets y notas de venta rápidas</li>
                <li>✓ Control de caja chica, gastos y proveedores</li>
                <li>✓ Sin burocracia de sellos de Hacienda obligatorios</li>
                <li>✓ Gestión de impuestos municipales / Alcaldía</li>
              </ul>
            </div>

            {/* Option B: Empresa Formal / Régimen General DTE */}
            <div
              onClick={() => {
                setRegimeType('general_tributario');
                setDteActive(true);
                setDeclaIva(true);
                setDeclaPagoCuenta(true);
              }}
              className={`p-5 rounded-xl border-2 transition cursor-pointer relative ${
                regimeType === 'general_tributario'
                  ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 dark:border-indigo-400'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="p-2.5 rounded-lg bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 mb-3">
                  <Building2 className="w-6 h-6" />
                </div>
                {regimeType === 'general_tributario' && (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/60 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Seleccionado
                  </span>
                )}
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Empresa Formal / Contribuyente MH (DTE Activo)
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                Para personas naturales con NRC o sociedades (S.A. de C.V.) legalmente inscritas ante el Ministerio de
                Hacienda que emiten Comprobantes de Crédito Fiscal y Facturas Electrónicas.
              </p>
              <ul className="mt-3 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                <li>✓ Facturación Electrónica DTE (CCF, FCF, NC, Exportación)</li>
                <li>✓ Declaración de IVA F-07 y Pago a Cuenta 1.75%</li>
                <li>✓ Libros de IVA oficiales (Compras, Ventas Contribuyente)</li>
                <li>✓ Contabilidad formal con catálogo de cuentas NIIF</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Section 2: One-Click DTE Migration Switch */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black">
              2
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                    Migración a DTE en 1 Clic (Ministerio de Hacienda)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Activa o desactiva la facturación electrónica cuando desees sin perder ni un solo dato.
                  </p>
                </div>

                {/* Big Toggle Switch */}
                <button
                  type="button"
                  id="toggle-dte-switch"
                  onClick={() => setDteActive(!dteActive)}
                  className={`relative inline-flex h-8 w-16 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    dteActive ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      dteActive ? 'translate-x-8' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          <div
            className={`p-4 rounded-xl border transition ${
              dteActive
                ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${dteActive ? 'bg-emerald-500 text-white' : 'bg-slate-400 text-white'}`}>
                <Receipt className="w-5 h-5" />
              </div>
              <div className="space-y-1 flex-1 text-xs">
                <p className="font-bold text-slate-900 dark:text-white">
                  Estado Actual:{' '}
                  <span className={dteActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}>
                    {dteActive ? '⚡ FACTURACIÓN ELECTRÓNICA DTE ACTIVA' : '🏪 MODO CONTROL INTERNO ACTIVO'}
                  </span>
                </p>
                <p className="text-slate-600 dark:text-slate-300">
                  {dteActive
                    ? 'Al registrar una venta, se asignará número de control DTE, generación de código QR, firma digital y compatibilidad directa con el portal JSON de Hacienda SV.'
                    : 'Las ventas se emitirán como comprobantes internos (tickets/recibos). Podrás consultar tus ingresos en reportes y cambiarte a DTE con un solo clic en cuanto Hacienda te autorice.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Declarative Taxes Questions */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black">
              3
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Cuestionario Tributario & Obligaciones Fiscales
              </h3>
              <p className="text-xs text-slate-500">
                Responde con qué obligaciones fiscales cuenta tu negocio actualmente.
              </p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            {/* Question 1: Impuestos Municipales */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                    ¿Pagas impuestos o tasas municipales a la Alcaldía?
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDeclaImpuestosMunicipales(true)}
                    className={`px-3 py-1 rounded-lg font-bold text-xs transition ${
                      declaImpuestosMunicipales
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Sí
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeclaImpuestosMunicipales(false)}
                    className={`px-3 py-1 rounded-lg font-bold text-xs transition ${
                      !declaImpuestosMunicipales
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>

              {declaImpuestosMunicipales && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                      Nombre de la Alcaldía Municipal:
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Alcaldía Municipal de San Salvador Centro"
                      value={alcaldiaName}
                      onChange={(e) => setAlcaldiaName(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                      Cuota o Tasa Municipal Estimada Mensual ($ USD):
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Ej: 25.00"
                      value={municipalRateOrFee}
                      onChange={(e) => setMunicipalRateOrFee(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono font-bold"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Question 2: Pago a Cuenta (1.75%) */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Percent className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                      ¿Declaras anticipo mensual de Pago a Cuenta (1.75%)?
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Obligatorio para contribuyentes formales según Art. 151 del Código Tributario de El Salvador.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDeclaPagoCuenta(true)}
                    className={`px-3 py-1 rounded-lg font-bold text-xs transition ${
                      declaPagoCuenta
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Sí
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeclaPagoCuenta(false)}
                    className={`px-3 py-1 rounded-lg font-bold text-xs transition ${
                      !declaPagoCuenta
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>
            </div>

            {/* Question 3: Declaración de IVA F-07 (13%) */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                      ¿Declaras IVA mensual (Formulario F-07 - 13%)?
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Permite generar automáticamente los libros de Compras, Ventas y el borrador de declaración F-07.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDeclaIva(true)}
                    className={`px-3 py-1 rounded-lg font-bold text-xs transition ${
                      declaIva
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Sí
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeclaIva(false)}
                    className={`px-3 py-1 rounded-lg font-bold text-xs transition ${
                      !declaIva
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Basic Profile Info */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-black">
              4
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Datos Comerciales del Negocio
              </h3>
              <p className="text-xs text-slate-500">
                Información visible en tus comprobantes y tickets impresos.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nombre Comercial del Negocio:
              </label>
              <input
                type="text"
                value={tradeName}
                onChange={(e) => setTradeName(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Giro o Actividad Económica:
              </label>
              <input
                type="text"
                value={giro}
                onChange={(e) => setGiro(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Departamento (Ubicación Central):
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold"
              >
                {SALVADORAN_DEPARTMENTS.map((dept) => (
                  <option key={dept.code} value={dept.name}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Teléfono / WhatsApp de Contacto:
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Info className="w-4 h-4 text-indigo-500" />
            <span>Todos tus cambios se sincronizan en tiempo real.</span>
          </div>

          <button
            type="submit"
            id="save-regime-configuration-btn"
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs shadow-md transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Guardar y Aplicar Personalización</span>
          </button>
        </div>
      </form>
    </div>
  );
};
