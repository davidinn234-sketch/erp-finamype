import type { Invoice, Purchase, FiscalDocumentMetadata } from '../types';
import { cents, money } from './accountingReports';

// F07 v14, manual DGII actualizado 24/07/2025. Los archivos no llevan encabezado.
export type VatBook = 'contributors' | 'consumers' | 'purchases';
export interface ExportIssue { id: string; document: string; message: string }
export function prepareVatExport(book: VatBook, invoices: Invoice[], purchases: Purchase[], month: string) {
  const issues: ExportIssue[] = [], rows: string[][] = [];
  const addIssue = (id: string, document: string, message: string) => issues.push({ id, document, message });
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month) || month < '2025-01') {
    addIssue('', '', 'Selecciona un mes desde enero de 2025. El formato implementado corresponde al F07 vigente desde 2025.');
  }
  const amount = (value: number) => money(value).toFixed(2);
  const date = (value: string) => value.slice(0, 10).split('-').reverse().join('/');
  const cleanId = (value?: string) => (value || '').replace(/[-/\s]/g, '');
  const validOperations = ['1', '2', '3', '4', '12', '13'];
  const validIncomes = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '12', '13'];
  const uuid = /^[A-Fa-f0-9]{8}-[A-Fa-f0-9]{4}-[A-Fa-f0-9]{4}-[A-Fa-f0-9]{4}-[A-Fa-f0-9]{12}$/;
  const seen = new Set<string>();
  function validate(doc: Invoice | Purchase, meta: FiscalDocumentMetadata, number: string, supplier: boolean) {
    const label = 'correlativeNumber' in doc ? doc.correlativeNumber : doc.documentNumber;
    const issue = (message: string) => addIssue(doc.id, label, message);
    if (!['1', '2', '4'].includes(meta.documentClass || '')) issue('Indica si el documento es impreso, formulario único o DTE.');
    if (!number.trim()) issue('Falta el número del documento.');
    if (meta.documentClass !== '4' && !/^\d+$/.test(number)) issue('El número del documento impreso debe ser numérico; copia el correlativo fiscal original.');
    if (meta.documentClass === '4') {
      if (!uuid.test(number)) issue('El código de generación DTE debe ser un UUID válido del documento recibido por Hacienda.');
      if (!meta.receiptSeal || !/^[A-Fa-f0-9]{40}$/.test(meta.receiptSeal)) issue('Falta el sello de recepción real de Hacienda (40 caracteres hexadecimales).');
      if (!supplier && !/^DTE-\d{2}-[A-Za-z0-9]{8}-\d{15}$/.test((doc as Invoice).controlNumber || meta.resolution || '')) issue('Falta un número de control DTE válido.');
    } else {
      if (!supplier && (!meta.resolution?.trim() || !meta.series?.trim())) issue('Completa la resolución y serie autorizadas del documento impreso.');
      if (meta.documentClass === '2' && !supplier && !meta.internalControl?.trim()) issue('Completa el control interno del formulario único.');
    }
    if (!supplier && (!validOperations.includes(meta.operationType || '') || !validIncomes.includes(meta.incomeType || ''))) issue('Selecciona el tipo de operación y de ingreso.');
    const key = `${supplier ? (doc as Purchase).supplierId : (doc as Invoice).customerId}:${meta.documentClass}:${number}`;
    if (seen.has(key)) issue('Número repetido: revisa los documentos duplicados.');
    seen.add(key);
    const values = supplier ? [(doc as Purchase).comprasGravadas, (doc as Purchase).comprasExentas, (doc as Purchase).ivaCreditoFiscal] : [(doc as Invoice).sumasGravadas, (doc as Invoice).sumasExentas, (doc as Invoice).sumasNoSujetas, (doc as Invoice).iva13];
    if (values.some(value => !Number.isFinite(value) || value < 0)) issue('Revisa los importes: deben ser números positivos o cero.');
    if (supplier && !(doc as Purchase).supplierName?.trim() || !supplier && !(doc as Invoice).customerName?.trim()) issue('Falta el nombre del cliente o proveedor.');
    const documentDate = new Date(`${doc.date}T12:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(doc.date) || !Number.isFinite(documentDate.getTime()) || documentDate.toISOString().slice(0, 10) !== doc.date) issue('La fecha del documento no es válida.');
    return issue;
  }
  function identifier(doc: Invoice | Purchase, meta: FiscalDocumentMetadata, issue: (message: string) => void, supplier: boolean) {
    const nit = cleanId(supplier ? (doc as Purchase).supplierNit : (doc as Invoice).customerNit);
    const nrc = cleanId(supplier ? (doc as Purchase).supplierNrc : (doc as Invoice).customerNrc);
    const dui = cleanId(meta.dui);
    if (dui) { if (!/^\d{9}$/.test(dui)) issue('El DUI debe contener 9 dígitos.'); return { id: '', dui }; }
    if (nit && !/^\d{14}$/.test(nit)) issue('El NIT debe contener 14 dígitos. Si usas DUI, escríbelo en el campo DUI.');
    if (!nit && !/^\d{1,8}$/.test(nrc)) issue('Completa el NIT, NRC o DUI del contribuyente.');
    return { id: nit || nrc, dui: '' };
  }
  if (book === 'purchases') {
    for (const doc of purchases.filter(p => p.status !== 'anulada' && p.date.startsWith(month))) {
      const meta = doc.taxReporting || {}, number = meta.documentNumber || doc.documentNumber;
      const issue = validate(doc, meta, number, true);
      if (!['ccf_compra', 'nota_credito_compra'].includes(doc.docType)) issue('Este documento necesita otro anexo o datos de importación. El anexo 3 admite aquí CCF y notas de crédito locales.');
      const id = identifier(doc, meta, issue, true);
      if (!['1', '2', '3', '4'].includes(meta.operationType || '')) issue('Selecciona el tipo de operación de compra.');
      if (!['1', '2'].includes(meta.classification || '') || !['1', '2', '3', '4'].includes(meta.sector || '') || !['1', '2', '3', '4', '5', '6', '7'].includes(meta.costType || '')) issue('Completa clasificación, sector y tipo de costo o gasto.');
      if (meta.classification === '1' && !['4', '5', '6', '7'].includes(meta.costType || '') || meta.classification === '2' && !['1', '2', '3'].includes(meta.costType || '')) issue('El tipo elegido debe corresponder a costo o gasto.');
      if (meta.classification === '1' && ['2', '3'].includes(meta.sector || '') && !['4', '5'].includes(meta.costType || '') || meta.classification === '1' && meta.sector === '4' && !['4', '5', '7'].includes(meta.costType || '')) issue('El tipo de costo no corresponde al sector seleccionado.');
      rows.push([date(doc.date), meta.documentClass || '', doc.docType === 'nota_credito_compra' ? '05' : '03', meta.documentClass === '4' ? cleanId(number) : number, id.id, doc.supplierName, amount(doc.comprasExentas), '0.00', '0.00', amount(doc.comprasGravadas), '0.00', '0.00', '0.00', amount(doc.ivaCreditoFiscal), amount(doc.comprasExentas + doc.comprasGravadas + doc.ivaCreditoFiscal), id.dui, meta.operationType || '', meta.classification || '', meta.sector || '', meta.costType || '', '3']);
    }
  } else {
    const types = book === 'contributors' ? ['credito_fiscal', 'nota_credito', 'nota_debito'] : ['factura_consumidor_final', 'exportacion', 'ticket_interno'];
    const docs = invoices.filter(i => i.status !== 'anulada' && i.date.startsWith(month) && types.includes(i.type)).sort((a, b) => a.date.localeCompare(b.date) || a.correlativeNumber.localeCompare(b.correlativeNumber));
    const groups = new Map<string, { first: Invoice; last: Invoice; count: number; exempt: number; nonSubject: number; taxable: number }>();
    for (const doc of docs) {
      const meta = doc.taxReporting || {}, number = meta.documentNumber || (meta.documentClass === '4' ? doc.dteCode : doc.correlativeNumber) || '';
      const issue = validate(doc, meta, number, false);
      if (book === 'contributors') {
        const id = identifier(doc, meta, issue, false);
        rows.push([date(doc.date), meta.documentClass || '', doc.type === 'credito_fiscal' ? '03' : doc.type === 'nota_credito' ? '05' : '06', meta.documentClass === '4' ? cleanId(doc.controlNumber || meta.resolution) : meta.resolution || '', meta.documentClass === '4' ? meta.receiptSeal || '' : meta.series || '', meta.documentClass === '4' ? cleanId(number) : number, meta.documentClass === '4' ? '' : meta.documentClass === '2' ? meta.internalControl || '' : number, id.id, doc.customerName, amount(doc.sumasExentas), amount(doc.sumasNoSujetas), amount(doc.sumasGravadas), amount(doc.iva13), '0.00', '0.00', amount(doc.sumasExentas + doc.sumasNoSujetas + doc.sumasGravadas + doc.iva13), id.dui, meta.operationType || '', meta.incomeType || '', '1']);
      } else {
        if (doc.type !== 'factura_consumidor_final') issue('Exportaciones y tickets internos necesitan datos fiscales adicionales. No pueden exportarse como factura local.');
        if (meta.documentClass === '4') {
          const key = `${doc.date}:${meta.operationType}:${meta.incomeType}`;
          const group = groups.get(key);
          if (group) { group.last = doc; group.count++; group.exempt += cents(doc.sumasExentas); group.nonSubject += cents(doc.sumasNoSujetas); group.taxable += cents(doc.sumasGravadas) + cents(doc.iva13); }
          else groups.set(key, { first: doc, last: doc, count: 1, exempt: cents(doc.sumasExentas), nonSubject: cents(doc.sumasNoSujetas), taxable: cents(doc.sumasGravadas) + cents(doc.iva13) });
        } else {
          rows.push([date(doc.date), meta.documentClass || '', '01', meta.resolution || '', meta.series || '', meta.documentClass === '2' ? meta.internalControl || '' : number, meta.documentClass === '2' ? meta.internalControl || '' : number, number, number, '', amount(doc.sumasExentas), '0.00', amount(doc.sumasNoSujetas), amount(doc.sumasGravadas + doc.iva13), '0.00', '0.00', '0.00', '0.00', '0.00', amount(doc.sumasExentas + doc.sumasNoSujetas + doc.sumasGravadas + doc.iva13), meta.operationType || '', meta.incomeType || '', '2']);
        }
      }
    }
    for (const group of groups.values()) {
      const meta = group.first.taxReporting!;
      rows.push([date(group.first.date), '4', '01', 'N/A', 'N/A', 'N/A', 'N/A', meta.documentNumber || group.first.dteCode || '', group.last.taxReporting?.documentNumber || group.last.dteCode || '', '', amount(group.exempt / 100), '0.00', amount(group.nonSubject / 100), amount(group.taxable / 100), '0.00', '0.00', '0.00', '0.00', '0.00', amount((group.exempt + group.nonSubject + group.taxable) / 100), meta.operationType || '', meta.incomeType || '', '2']);
    }
  }
  for (const row of rows) if (row.some(cell => /[;\r\n]/.test(cell))) addIssue('', '', 'Un campo contiene punto y coma o saltos de línea. Corrígelo antes de exportar.');
  return { rows, issues };
}
export function haciendaCsv(result: ReturnType<typeof prepareVatExport>) {
  if (result.issues.length) throw new Error('Completa y revisa los datos fiscales antes de exportar.');
  if (!result.rows.length) throw new Error('No hay documentos en este libro y mes.');
  return result.rows.map(row => row.join(';')).join('\r\n');
}
