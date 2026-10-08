import type { UserProfile } from '../types';

export const PLATFORM_OWNER_EMAIL = 'davidinn234@gmail.com';
export function isPlatformOwner(email: unknown, claims: Record<string, unknown>) {
  return typeof email === 'string' && email.toLowerCase() === PLATFORM_OWNER_EMAIL && claims.platformAdmin === true;
}
export function profilePermissions(profile: UserProfile) {
  return profile.permissions ?? (profile.role === 'contador'
    ? ['dashboard', 'marketing', 'pos_sales', 'sales_crm', 'purchases_scm', 'payroll_access', 'treasury_access', 'accounting_access', 'forecasting', 'master_database']
    : profile.role === 'cajero' ? ['pos_sales'] : profile.role === 'vendedor' ? ['pos_sales', 'sales_crm'] : []);
}
const modulePermissions: Record<string, string[]> = {
  dashboard: ['dashboard'], marketing: ['marketing'], pos_terminal: ['pos_terminal', 'pos_sales'],
  sales: ['sales', 'sales_crm', 'customer_view', 'cxc_management'],
  purchases: ['purchases', 'purchases_scm', 'inventory_edit'], inventory: ['inventory', 'inventory_view', 'inventory_edit', 'purchases_scm'],
  payroll: ['payroll', 'payroll_access'], treasury: ['treasury', 'treasury_access'],
  accounting: ['accounting', 'accounting_access', 'iva_books'], forecasting: ['forecasting'], master_database: ['master_database'],
};
export function canAccessModule(profile: UserProfile | null, module: string) {
  if (!profile) return false;
  if (module === 'admin_profiles') return profile.role === 'admin_maestro' && profile.email.toLowerCase() === PLATFORM_OWNER_EMAIL;
  if (profile.role === 'admin_maestro') return profile.email.toLowerCase() === PLATFORM_OWNER_EMAIL;
  if (profile.systemArchetype === 'finanzas_personales') return module === 'personal_finances';
  if (profile.role === 'gerente') return module in modulePermissions || ['settings', 'company_users', 'academy'].includes(module);
  if (module === 'academy') return true;
  const permissions = profilePermissions(profile);
  return (modulePermissions[module] || []).some(key => permissions.includes(key));
}
export function initialModule(profile: UserProfile) {
  return ['admin_profiles', 'personal_finances', 'dashboard', 'pos_terminal', 'sales', 'purchases', 'inventory', 'payroll', 'treasury', 'accounting', 'forecasting', 'academy'].find(module => canAccessModule(profile, module)) || 'academy';
}
