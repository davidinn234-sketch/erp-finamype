import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { ProfessionalServiceRecord } from '../../types';
import { formatCurrencyUSD } from '../../utils/salvadoranTax';
import {
  FileText,
  PlusCircle,
  Printer,
  CheckCircle2,
  Trash2,
  Search,
  DollarSign,
  AlertCircle,
  ShieldCheck,
  Building,
  User,
  X,
} from 'lucide-react';

export const ProfessionalServicesTab: React.FC = () => {
  const {
    professionalServices,
    createProfessionalService,
    updateProfessionalService,
    deleteProfessionalService,
    currentCompany,
  } = useERP();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedForPrint, setSelectedForPrint] = useState<ProfessionalServiceRecord | null>(null);
  const [isPrintAllOpen, setIsPrintAllOpen] = useState(false);

  // New record form state
  const [formData, setFormData] = useState({
    providerName: '',
    dui: '',
    nit: '',
    serviceConcept: '',
    periodMonth: new Date().getMonth() + 1,
    periodYear: 2026,
    date: new Date().toISOString().split('T')[0],
    grossAmount: 500.0,
    receiptNumber: '',
    paymentMethod: 'Transferencia Bancaria',
    notes: '',
  });

  const handleSubmitNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.providerName.trim() || formData.grossAmount <= 0) return;

    createProfessionalService({
      ...formData,
      retentionRate: 0.10,
      retentionAmount: Number((formData.grossAmount * 0.10).toFixed(2)),
      netAmount: Number((formData.grossAmount * 0.90).toFixed(2)),
      status: 'pendiente',
    });

    setIsNewModalOpen(false);
    setFormData({
      providerName: '',
      dui: '',
      nit: '',
      serviceConcept: '',
      periodMonth: new Date().getMonth() + 1,
      periodYear: 2026,
      date: new Date().toISOString().split('T')[0],
      grossAmount: 500.0,
      receiptNumber: '',
      paymentMethod: 'Transferencia Bancaria',
      notes: '',
    });
  };

  const filteredRecords = professionalServices.filter((r) => {
    const matchesSearch =
      r.providerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.serviceConcept.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.nit && r.nit.includes(searchTerm));
    const matchesMonth = selectedMonth === 0 || r.periodMonth === selectedMonth;
    return matchesSearch && matchesMonth;
  });

  const totalGross = filteredRecords.reduce((s, r) => s + r.grossAmount, 0);
  const totalRetention = filteredRecords.reduce((s, r) => s + r.retentionAmount, 0);
  const totalNet = filteredRecords.reduce((s, r) => s + r.netAmount, 0);
  const pendingCount = filteredRecords.filter((r) => r.status === 'pendiente').length;

  return (
    <div className="space-y-4">
      {/* Header Banner & Legal explanation */}
      <div className="p-4 rounded-[8px] bg-white dark:bg-slate-900 border border-[#E3E8E6] dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-teal-50 dark:bg-teal-950/60 text-[#0F766E] dark:text-teal-300 border border-teal-200 dark:border-teal-800">
              Art. 156 Código Tributario SV
            </span>
            <h2 className="text-base font-bold text-[#111827] dark:text-white">
              Planilla de Servicios Profesionales & Honorarios
            </h2>
          </div>
          <p className="text-xs text-[#6B7280] mt-1 max-w-2xl">
            Toda persona jurídica o comerciante que pague honorarios por servicios profesionales o técnicos a personas naturales en El Salvador debe retener el <strong>10% en concepto de Impuesto sobre la Renta (ISR)</strong> y enterarlo al Ministerio de Hacienda.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPrintAllOpen(true)}
            className="px-3 py-1.5 rounded-[6px] border border-[#E3E8E6] dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-[#F6F8F7] text-xs font-medium flex items-center gap-1.5 cursor-pointer text-[#111827] dark:text-slate-200"
          >
            <Printer className="w-4 h-4 text-[#0F766E]" />
            <span>Imprimir Planilla 10%</span>
          </button>
          <button
            type="button"
            onClick={() => setIsNewModalOpen(true)}
            className="px-3 py-1.5 rounded-[6px] bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Registrar Servicio Profesional</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-[8px] border border-[#E3E8E6] dark:border-slate-800 bg-white dark:bg-slate-900 shadow-none">
          <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block">Total Honorarios Brutos</span>
          <h4 className="text-lg font-bold text-[#111827] dark:text-white mt-1 font-mono">
            {formatCurrencyUSD(totalGross)}
          </h4>
          <span className="text-[10px] text-[#6B7280] mt-0.5 block">{filteredRecords.length} servicios registrados</span>
        </div>

        <div className="p-3.5 rounded-[8px] border border-[#E3E8E6] dark:border-slate-800 bg-white dark:bg-slate-900 shadow-none">
          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
            (-) Retención Legal 10% ISR
          </span>
          <h4 className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-1 font-mono">
            {formatCurrencyUSD(totalRetention)}
          </h4>
          <span className="text-[10px] text-amber-600 mt-0.5 block">Declarar en F-14 / F-07 MH</span>
        </div>

        <div className="p-3.5 rounded-[8px] border border-[#E3E8E6] dark:border-slate-800 bg-white dark:bg-slate-900 shadow-none">
          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
            (=) Líquido Neto Pagado
          </span>
          <h4 className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
            {formatCurrencyUSD(totalNet)}
          </h4>
          <span className="text-[10px] text-emerald-600 mt-0.5 block">Transferido a profesionales</span>
        </div>

        <div className="p-3.5 rounded-[8px] border border-[#E3E8E6] dark:border-slate-800 bg-white dark:bg-slate-900 shadow-none">
          <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block">Pendientes de Pago</span>
          <h4 className="text-lg font-bold text-[#111827] dark:text-white mt-1 font-mono">
            {pendingCount}
          </h4>
          <span className="text-[10px] text-[#6B7280] mt-0.5 block">Por desembolsar</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-[8px] bg-white dark:bg-slate-900 border border-[#E3E8E6] dark:border-slate-800 shadow-none">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por profesional, concepto o NIT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-[6px] border border-[#E3E8E6] dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-[#111827] dark:text-white outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-[#6B7280]">Filtrar por Mes:</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
            className="p-1.5 rounded-[6px] border border-[#E3E8E6] dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-[#111827] dark:text-slate-200 outline-none"
          >
            <option value={0}>Todos los Meses</option>
            <option value={1}>Enero</option>
            <option value={2}>Febrero</option>
            <option value={3}>Marzo</option>
            <option value={4}>Abril</option>
            <option value={5}>Mayo</option>
            <option value={6}>Junio</option>
            <option value={7}>Julio</option>
            <option value={8}>Agosto</option>
            <option value={9}>Septiembre</option>
            <option value={10}>Octubre</option>
            <option value={11}>Noviembre</option>
            <option value={12}>Diciembre</option>
          </select>
        </div>
      </div>

      {/* Records Table */}
      <div className="rounded-[8px] border border-[#E3E8E6] dark:border-slate-800 bg-white dark:bg-slate-900 shadow-none overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#F6F8F7] dark:bg-slate-800 text-[#6B7280] dark:text-slate-400 uppercase text-[10px] font-bold border-b border-[#E3E8E6] dark:border-slate-700">
              <tr>
                <th className="p-3 font-sans">Profesional / DUI / NIT</th>
                <th className="p-3 font-sans">Concepto del Servicio</th>
                <th className="p-3 text-center">Fecha / Recibo</th>
                <th className="p-3 text-right">Honorario Bruto</th>
                <th className="p-3 text-right text-amber-600">Retención 10%</th>
                <th className="p-3 text-right text-emerald-600 font-bold">Líquido a Pagar</th>
                <th className="p-3 text-center">Estado</th>
                <th className="p-3 text-center font-sans">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 font-sans">
                    No se encontraron registros de servicios profesionales en este período.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-sans">
                      <p className="font-bold text-slate-900 dark:text-white">{record.providerName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {record.dui ? `DUI: ${record.dui}` : ''} {record.nit ? `• NIT: ${record.nit}` : ''}
                      </p>
                    </td>
                    <td className="p-3 font-sans max-w-xs text-slate-700 dark:text-slate-300">
                      {record.serviceConcept}
                    </td>
                    <td className="p-3 text-center text-slate-500">
                      <p>{record.date}</p>
                      <p className="text-[10px] text-indigo-500">{record.receiptNumber || 'S/N'}</p>
                    </td>
                    <td className="p-3 text-right font-semibold text-slate-900 dark:text-white">
                      {formatCurrencyUSD(record.grossAmount)}
                    </td>
                    <td className="p-3 text-right text-amber-600 font-bold">
                      -{formatCurrencyUSD(record.retentionAmount)}
                    </td>
                    <td className="p-3 text-right text-emerald-600 font-black text-sm">
                      {formatCurrencyUSD(record.netAmount)}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          record.status === 'pagado'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {record.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3 text-center font-sans">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setSelectedForPrint(record)}
                          title="Imprimir Comprobante de Retención 10%"
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        {record.status === 'pendiente' && (
                          <button
                            onClick={() => updateProfessionalService(record.id, { status: 'pagado' })}
                            title="Marcar como Pagado"
                            className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 hover:bg-emerald-100 transition cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (confirm(`¿Eliminar honorario de ${record.providerName}?`)) {
                              deleteProfessionalService(record.id);
                            }
                          }}
                          title="Eliminar registro"
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: New Record */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg my-4 rounded-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-base">Registrar Servicio Profesional (10% Renta)</h3>
              <button onClick={() => setIsNewModalOpen(false)} className="p-1 text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitNew} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Nombre Completo del Profesional:</label>
                <input
                  type="text"
                  placeholder="Lic. o Ing. Nombre y Apellido"
                  required
                  value={formData.providerName}
                  onChange={(e) => setFormData({ ...formData, providerName: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">DUI (Opcional):</label>
                  <input
                    type="text"
                    placeholder="01234567-8"
                    value={formData.dui}
                    onChange={(e) => setFormData({ ...formData, dui: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">NIT (Para Hacienda):</label>
                  <input
                    type="text"
                    placeholder="0614-010190-101-1"
                    value={formData.nit}
                    onChange={(e) => setFormData({ ...formData, nit: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Concepto del Servicio / Asesoría:</label>
                <input
                  type="text"
                  placeholder="Ej: Asesoría Contable NIIF, Mantenimiento de Servidores, Diseño Web..."
                  required
                  value={formData.serviceConcept}
                  onChange={(e) => setFormData({ ...formData, serviceConcept: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Honorario Bruto Pactado ($):</label>
                  <input
                    type="number"
                    step="10"
                    min="1"
                    required
                    value={formData.grossAmount}
                    onChange={(e) => setFormData({ ...formData, grossAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-sm"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Número de Recibo / Factura:</label>
                  <input
                    type="text"
                    placeholder="REC-001 o N/A"
                    value={formData.receiptNumber}
                    onChange={(e) => setFormData({ ...formData, receiptNumber: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              {/* Automatic Calculation Preview */}
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-1 font-mono text-xs">
                <div className="flex justify-between text-slate-700 dark:text-slate-300">
                  <span>Honorario Bruto:</span>
                  <span>{formatCurrencyUSD(formData.grossAmount)}</span>
                </div>
                <div className="flex justify-between text-amber-700 dark:text-amber-400 font-bold">
                  <span>(-) Retención 10% Impuesto sobre la Renta:</span>
                  <span>-{formatCurrencyUSD(formData.grossAmount * 0.10)}</span>
                </div>
                <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-black border-t border-amber-200 pt-1 text-sm">
                  <span>(=) Líquido Neto a Desembolsar:</span>
                  <span>{formatCurrencyUSD(formData.grossAmount * 0.90)}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-xs font-bold shadow cursor-pointer"
                >
                  Guardar Servicio Profesional
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Print Single Retention Slip */}
      {selectedForPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/80 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl my-4 rounded-2xl bg-white text-slate-900 p-6 sm:p-8 shadow-2xl border border-slate-300 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b-2 border-slate-900 print:hidden">
              <span className="font-bold text-sm">Comprobante de Retención de Impuesto sobre la Renta 10%</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir</span>
                </button>
                <button onClick={() => setSelectedForPrint(null)} className="p-1 text-slate-400 hover:text-slate-800 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="text-center space-y-1">
              <h2 className="text-lg font-black uppercase text-slate-900">{currentCompany.name}</h2>
              <p className="text-xs text-slate-500 font-mono">NIT: {currentCompany.nit || '0614-010190-101-1'} • NRC: {currentCompany.nrc || '123456-7'}</p>
              <h3 className="font-bold text-sm text-amber-800 pt-2 uppercase">
                COMPROBANTE DE RETENCIÓN DE IMPUESTO SOBRE LA RENTA (10%)
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">Art. 156 Código Tributario de El Salvador</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-300 bg-slate-50 space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-slate-500 block">Sujeto Retenido:</span><strong>{selectedForPrint.providerName}</strong></div>
                <div><span className="text-slate-500 block">DUI / NIT:</span><strong className="font-mono">{selectedForPrint.dui || 'N/A'} / {selectedForPrint.nit}</strong></div>
              </div>
              <div className="pt-1 border-t border-slate-200">
                <span className="text-slate-500 block">Concepto de Honorarios:</span>
                <p>{selectedForPrint.serviceConcept}</p>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 font-mono text-center">
                <div><span className="text-slate-500 text-[10px] block">Honorario Bruto:</span><strong>{formatCurrencyUSD(selectedForPrint.grossAmount)}</strong></div>
                <div className="text-amber-700 font-bold"><span className="text-amber-700 text-[10px] block">10% Retención ISR:</span>-{formatCurrencyUSD(selectedForPrint.retentionAmount)}</div>
                <div className="text-emerald-700 font-black"><span className="text-emerald-700 text-[10px] block">Líquido Pagado:</span>{formatCurrencyUSD(selectedForPrint.netAmount)}</div>
              </div>
            </div>

            <div className="pt-8 grid grid-cols-2 gap-10 text-center text-[10px] text-slate-600">
              <div>
                <div className="h-10 border-b border-slate-400 mb-1" />
                <p className="font-bold text-slate-900">Firma y Sello Agente de Retención</p>
                <p>{currentCompany.name}</p>
              </div>
              <div>
                <div className="h-10 border-b border-slate-400 mb-1" />
                <p className="font-bold text-slate-900">Firma y Recibido del Prestador</p>
                <p>{selectedForPrint.providerName}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Print All Professional Services List */}
      {isPrintAllOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/80 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-4xl my-4 rounded-2xl bg-white text-slate-900 p-6 sm:p-8 shadow-2xl border border-slate-300 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b-2 border-slate-900 print:hidden">
              <span className="font-bold text-sm">Planilla Consolidada de Honorarios y Servicios Profesionales</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Planilla</span>
                </button>
                <button onClick={() => setIsPrintAllOpen(false)} className="p-1 text-slate-400 hover:text-slate-800 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex items-start justify-between border-b pb-3">
              <div>
                <h2 className="text-base font-black uppercase text-slate-900">{currentCompany.name}</h2>
                <p className="text-xs text-slate-500 font-mono">NIT: {currentCompany.nit || '0614-010190-101-1'} • NRC: {currentCompany.nrc || '123456-7'}</p>
              </div>
              <div className="text-right">
                <span className="font-bold text-xs uppercase block text-amber-800">
                  Planilla Servicios Profesionales (Art. 156 C.T.)
                </span>
                <span className="text-[11px] text-slate-500 font-mono">{filteredRecords.length} registros</span>
              </div>
            </div>

            <table className="w-full text-left text-[11px] font-mono border-collapse border border-slate-300">
              <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 text-[10px] uppercase">
                <tr>
                  <th className="p-2 border-r border-slate-200">#</th>
                  <th className="p-2 border-r border-slate-200 font-sans">Profesional / Asesor</th>
                  <th className="p-2 border-r border-slate-200 font-mono">NIT</th>
                  <th className="p-2 border-r border-slate-200 font-sans">Concepto</th>
                  <th className="p-2 border-r border-slate-200 text-right">Honorario Bruto</th>
                  <th className="p-2 border-r border-slate-200 text-right text-amber-700">10% Retención</th>
                  <th className="p-2 border-r border-slate-200 text-right font-black text-emerald-800">Líquido Pagado</th>
                  <th className="p-2 text-center font-sans">Firma Recibido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredRecords.map((r, i) => (
                  <tr key={r.id}>
                    <td className="p-2 border-r border-slate-200 text-center">{i + 1}</td>
                    <td className="p-2 border-r border-slate-200 font-bold font-sans">{r.providerName}</td>
                    <td className="p-2 border-r border-slate-200 font-mono text-[10px]">{r.nit}</td>
                    <td className="p-2 border-r border-slate-200 font-sans text-[10px]">{r.serviceConcept}</td>
                    <td className="p-2 border-r border-slate-200 text-right font-semibold">{formatCurrencyUSD(r.grossAmount)}</td>
                    <td className="p-2 border-r border-slate-200 text-right text-amber-700 font-bold">-{formatCurrencyUSD(r.retentionAmount)}</td>
                    <td className="p-2 border-r border-slate-200 text-right font-black text-emerald-800">{formatCurrencyUSD(r.netAmount)}</td>
                    <td className="p-2 border-b border-slate-300 text-center text-[9px] text-slate-400">Firma</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-400 text-xs">
                <tr>
                  <td colSpan={4} className="p-2 text-right uppercase">TOTALES:</td>
                  <td className="p-2 text-right font-black">{formatCurrencyUSD(totalGross)}</td>
                  <td className="p-2 text-right font-black text-amber-800">-{formatCurrencyUSD(totalRetention)}</td>
                  <td className="p-2 text-right font-black text-emerald-800">{formatCurrencyUSD(totalNet)}</td>
                  <td className="p-2"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
