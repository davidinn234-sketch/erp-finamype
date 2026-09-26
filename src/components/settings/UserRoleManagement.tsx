import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  Users,
  Shield,
  ShieldAlert,
  UserPlus,
  Key,
  CheckCircle2,
  Trash2,
  Edit2,
  Lock,
  UserCheck,
  Building2,
  X,
  AlertTriangle,
} from 'lucide-react';
import { UserProfile, UserRole } from '../../types';

export const UserRoleManagement: React.FC = () => {
  const {
    users,
    currentUser,
    setCurrentUserId,
    createUser,
    updateUser,
    deleteUser,
  } = useERP();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('cajero');
  const [formPermissions, setFormPermissions] = useState<string[]>([
    'pos_sales',
    'customer_view',
  ]);

  const AVAILABLE_PERMISSIONS = [
    { id: 'pos_sales', label: 'Emitir Ventas & Tickets / DTE', desc: 'Permite registrar ventas y cobrar' },
    { id: 'inventory_view', label: 'Ver Inventario & Stock', desc: 'Consultar existencia de productos' },
    { id: 'inventory_edit', label: 'Modificar Catálogo & Costos', desc: 'Editar precios, costos y compras' },
    { id: 'cxc_management', label: 'Gestionar Créditos & Cobros (CxC)', desc: 'Registrar abonos y límites de crédito' },
    { id: 'cancel_invoices', label: 'Anular Facturas / DTE', desc: 'Requiere supervisión o rol de gerencia' },
    { id: 'payroll_access', label: 'Acceso a Planillas & Salarios SV', desc: 'Ver deducciones ISSS/AFP y pagar' },
    { id: 'accounting_access', label: 'Libros de IVA & Contabilidad', desc: 'Partidas, balances y F-07' },
    { id: 'system_admin', label: 'Configuración General & Respaldo', desc: 'Control total de la empresa' },
  ];

  const handleOpenNewModal = () => {
    setEditingUserId(null);
    setFormName('');
    setFormEmail('');
    setFormRole('cajero');
    setFormPermissions(['pos_sales', 'customer_view', 'inventory_view']);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: UserProfile) => {
    setEditingUserId(user.id);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormRole(user.role);
    setFormPermissions(user.permissions || getDefaultPermissionsForRole(user.role));
    setIsModalOpen(true);
  };

  const getDefaultPermissionsForRole = (role: UserRole): string[] => {
    switch (role) {
      case 'admin_maestro':
        return AVAILABLE_PERMISSIONS.map((p) => p.id);
      case 'gerente':
        return ['pos_sales', 'inventory_view', 'inventory_edit', 'cxc_management', 'cancel_invoices'];
      case 'contador':
        return ['pos_sales', 'cxc_management', 'payroll_access', 'accounting_access'];
      case 'cajero':
        return ['pos_sales', 'customer_view', 'inventory_view'];
      default:
        return ['pos_sales'];
    }
  };

  const handleRoleChange = (role: UserRole) => {
    setFormRole(role);
    setFormPermissions(getDefaultPermissionsForRole(role));
  };

  const togglePermission = (permId: string) => {
    if (formPermissions.includes(permId)) {
      setFormPermissions(formPermissions.filter((p) => p !== permId));
    } else {
      setFormPermissions([...formPermissions, permId]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingUserId) {
      updateUser(editingUserId, {
        name: formName.trim(),
        email: formEmail.trim() || `${formName.toLowerCase().replace(/\s+/g, '')}@empresa.sv`,
        role: formRole,
        permissions: formPermissions,
      });
    } else {
      createUser({
        name: formName.trim(),
        email: formEmail.trim() || `${formName.toLowerCase().replace(/\s+/g, '')}@empresa.sv`,
        role: formRole,
        permissions: formPermissions,
      });
    }

    setIsModalOpen(false);
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin_maestro':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            Administrador Maestro
          </span>
        );
      case 'gerente':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            Gerente de Tienda / Ventas
          </span>
        );
      case 'contador':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            Contador / Fiscal
          </span>
        );
      case 'cajero':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            Cajero / Vendedor
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Control de Acceso y Roles (RBAC)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Diferencia entre Administradores y Cajeros/Vendedores para restringir reportes sensibles, costos y anulaciones.
          </p>
        </div>

        <button
          type="button"
          id="add-user-btn"
          onClick={handleOpenNewModal}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs shadow-sm transition cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Nuevo Usuario / Cajero</span>
        </button>
      </div>

      {/* Current Active Session Indicator */}
      <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm">
            {currentUser.name.charAt(0)}
          </div>
          <div>
            <p className="font-bold text-slate-900 dark:text-white">
              Sesión Activa: <span className="text-indigo-600 dark:text-indigo-400">{currentUser.name}</span>
            </p>
            <p className="text-slate-500">
              Estás operando con permisos de <strong>{currentUser.role.replace('_', ' ').toUpperCase()}</strong>.
            </p>
          </div>
        </div>
        <div className="text-right">
          {getRoleBadge(currentUser.role)}
        </div>
      </div>

      {/* Users Table */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="font-bold text-xs text-slate-700 dark:text-slate-300">
            Usuarios Registrados ({users.length})
          </span>
          <span className="text-[11px] text-slate-400">
            Haz clic en "Cambiar a este usuario" para simular su punto de vista
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-[10px] uppercase font-bold text-slate-400">
              <tr>
                <th className="p-3">Nombre & Correo</th>
                <th className="p-3">Rol Asignado</th>
                <th className="p-3">Permisos Habilitados</th>
                <th className="p-3 text-center">Estado Sesión</th>
                <th className="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.map((u) => {
                const isActive = u.id === currentUser.id;
                const permissionsList = u.permissions || getDefaultPermissionsForRole(u.role);

                return (
                  <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition">
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-xs">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{u.name}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="p-3">{getRoleBadge(u.role)}</td>

                    <td className="p-3">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {permissionsList.slice(0, 3).map((pid) => (
                          <span
                            key={pid}
                            className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-300 font-mono"
                          >
                            {pid.replace('_', ' ')}
                          </span>
                        ))}
                        {permissionsList.length > 3 && (
                          <span className="px-1 py-0.5 text-[10px] text-slate-400 font-bold">
                            +{permissionsList.length - 3} más
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-3 text-center">
                      {isActive ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                          <CheckCircle2 className="w-3 h-3" /> Activo Ahora
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setCurrentUserId(u.id)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300 transition cursor-pointer"
                        >
                          Usar Sesión
                        </button>
                      )}
                    </td>

                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(u)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                          title="Editar permisos"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {users.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`¿Revocar acceso al usuario ${u.name}?`)) {
                                deleteUser(u.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                            title="Eliminar usuario"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl p-6 space-y-4 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>{editingUserId ? 'Editar Acceso & Permisos' : 'Crear Nuevo Usuario / Cajero'}</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre Completo del Colaborador: *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: David Miranda (Cajero Sucursal Centro)"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Correo Electrónico (Acceso):
                </label>
                <input
                  type="email"
                  placeholder="cajero@mitienda.sv"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Rol Asignado:
                </label>
                <select
                  value={formRole}
                  onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold"
                >
                  <option value="cajero">Cajero / Vendedor (Punto de Venta únicamente)</option>
                  <option value="gerente">Gerente de Tienda (Ventas, inventario y autorización)</option>
                  <option value="contador">Contador / Administrador Fiscal (Planillas e IVA)</option>
                  <option value="admin_maestro">Administrador Maestro (Acceso sin restricciones)</option>
                </select>
              </div>

              {/* Granular Permissions Checkboxes */}
              <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                <label className="block font-bold text-slate-800 dark:text-slate-200">
                  Permisos Específicos para este Usuario:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {AVAILABLE_PERMISSIONS.map((perm) => {
                    const isChecked = formPermissions.includes(perm.id);
                    return (
                      <div
                        key={perm.id}
                        onClick={() => togglePermission(perm.id)}
                        className={`p-2 rounded-lg border text-left cursor-pointer transition ${
                          isChecked
                            ? 'bg-indigo-50/70 border-indigo-300 dark:bg-indigo-950/40 dark:border-indigo-700'
                            : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 opacity-70'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}} // handled by parent div
                            className="rounded text-indigo-600 focus:ring-0"
                          />
                          <span className="font-bold text-slate-900 dark:text-white text-[11px]">
                            {perm.label}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 pl-4">{perm.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer"
                >
                  {editingUserId ? 'Guardar Cambios' : 'Registrar Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
