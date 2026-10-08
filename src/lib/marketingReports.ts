import type { Invoice, Customer } from '../types';

export function marketingSaleAmount(invoice: Invoice) {
  const base = (invoice.sumasGravadas || 0) + (invoice.sumasExentas || 0) + (invoice.sumasNoSujetas || 0);
  return (invoice.type === 'nota_credito' ? -1 : 1) * (base || invoice.totalPagar || 0);
}

export function recordedMarketingInvoices(invoices: Invoice[]) {
  return invoices.filter(invoice => invoice && invoice.status !== 'anulada');
}

// Acquisition channels describe the customer source. They do not prove that a
// sale came from a paid campaign, and cannot supply advertising costs or ROAS.
export function marketingChannels(invoices: Invoice[], customers: Customer[]) {
  const definitions = [
    { id: 'meta_ads', name: 'Facebook / Instagram', sources: ['facebook', 'instagram'], color: '#0F766E' },
    { id: 'google_ads', name: 'Sitio web', sources: ['web'], color: '#115E59' },
    { id: 'whatsapp', name: 'WhatsApp', sources: ['whatsapp'], color: '#059669' },
    { id: 'tiktok', name: 'TikTok', sources: ['tiktok'], color: '#334155' },
    { id: 'referidos', name: 'Referidos', sources: ['referido'], color: '#0D9488' },
    { id: 'tienda_fisica', name: 'Tienda física', sources: ['tienda_fisica'], color: '#64748B' },
    { id: 'sin_canal', name: 'Sin canal registrado', sources: [], color: '#475569' },
  ];
  const result = definitions.map(channel => ({ ...channel, sales: 0, orders: 0, spend: 0, roas: 0, leads: 0 }));
  const customerMap = new Map(customers.map(customer => [customer.id, customer]));
  for (const invoice of recordedMarketingInvoices(invoices)) {
    const source = customerMap.get(invoice.customerId)?.acquisitionChannel || '';
    const channel = result.find(item => item.sources.includes(source)) || result[result.length - 1];
    channel.sales += marketingSaleAmount(invoice);
    if (invoice.type !== 'nota_credito') channel.orders++;
  }
  return result;
}
