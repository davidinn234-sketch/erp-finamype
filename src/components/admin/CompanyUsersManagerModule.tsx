import React, { useState, useMemo } from 'react';
import { AssignPasswordButton } from './UserAccessControls';
import { useERP } from '../../context/ERPContext';
import { db } from '../../lib/firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { UserProfile, UserRole } from '../../types';
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  Key,
  Copy,
  Check,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  UserCheck,
  Building,
  CheckCircle2,
  AlertCircle,
  X,
  Lock,
  ScanBarcode,
  Receipt,
  ShoppingBag,
  BookOpenCheck,
  Landmark,
  Layers,
  Sparkles,
  Phone,
  Mail,
  User,
  ArrowRight,
  Send,
  MessageCircle,
} from 'lucide-react';

interface PermissionOption {
  id: string;
  name: string;
  desc: string;
  icon: any;
}

const SYSTEM_PERMISSIONS: PermissionOption[] = [
  { id: 'pos_sales', name: 'Punto de Venta POS', desc: 'Cobro rápido, escáner de código de barras y tickets', icon: ScanBarcode },
  { id: 'sales_crm', name: 'Ventas, Clientes & DTE', desc: 'Emisión de Facturas, Créditos Fiscales y cartera de clientes', icon: Receipt },
  { id: 'purchases_scm', name: 'Compras & Proveedores', desc: 'Kárdex de inventario, registro de compras y gastos', icon: ShoppingBag },
  { id: 'payroll_access', name: 'Planilla & RRHH', desc: 'Expedientes de empleados, ISSS, AFP y boletas de pago', icon: Users },
  { id: 'attendance_kiosk', name: 'Control Asistencia Tablet', desc: 'Terminal táctil con PIN para entradas y salidas', icon: Sparkles },
  { id: 'treasury_access', name: 'Tesorería & Bancos', desc: 'Cajas físicas, cuentas bancarias y flujo de efectivo', icon: Landmark },
  { id: 'accounting_access', name: 'Contabilidad NIIF & IVA', desc: 'Libro diario, libros de IVA (F-07) y balance general', icon: BookOpenCheck },
  { id: 'cancel_invoices', name: 'Anular Facturas / DTE', desc: 'Permiso especial para anulación de documentos fiscales', icon: AlertCircle },
];

export const CompanyUsersManagerModule: React.FC = () => {
  const {
    users,
    currentUser,
    setCurrentUserId,
    createUser,
    updateUser,
    deleteUser,
    currentCompany,
    branches,
    addNotification,
    userRole,
  } = useERP();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('123456');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('cajero');
  const [formBranchId, setFormBranchId] = useState<string>(branches[0]?.id || '');
  const [formPermissions, setFormPermissions] = useState<string[]>(['pos_sales']);

  // Success Credential Card modal
  const [createdCredential, setCreatedCredential] = useState<{
    name: string;
    email: string;
    pass: string;
    role: string;
  } | null>(null);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Filtrar los usuarios que pertenecen a ESTA empresa
  const companyUsers = useMemo(() => {
    return (users || []).filter((u) => {
      // Si el usuario tiene companyId, debe coincidir con la empresa activa
      if (u.companyId) {
        return u.companyId === currentCompany.id;
      }
      return false;
    });
  }, [users, currentCompany, currentUser]);

  const filteredUsers = useMemo(() => {
    return companyUsers.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.phone && u.phone.includes(q))
        );
      }
      return true;
    });
  }, [companyUsers, roleFilter, searchQuery]);

  const handleRolePreset = (role: UserRole) => {
    setFormRole(role);
    if (role === 'cajero') {
      setFormPermissions(['pos_sales']);
    } else if (role === 'vendedor') {
      setFormPermissions(['pos_sales', 'sales_crm']);
    } else if (role === 'kiosko_asistencia') {
      setFormPermissions(['attendance_kiosk']);
    } else if (role === 'gerente') {
      setFormPermissions([
        'pos_sales',
        'sales_crm',
        'purchases_scm',
        'payroll_access',
        'attendance_kiosk',
        'treasury_access',
        'accounting_access',
        'cancel_invoices',
      ]);
    } else if (role === 'contador') {
      setFormPermissions(['sales_crm', 'purchases_scm', 'payroll_access', 'treasury_access', 'accounting_access']);
    } else {
      setFormPermissions(['pos_sales', 'sales_crm']);
    }
  };

  const togglePermission = (permId: string) => {
    if (formPermissions.includes(permId)) {
      setFormPermissions(formPermissions.filter((p) => p !== permId));
    } else {
      setFormPermissions([...formPermissions, permId]);
    }
  };

  const handleGeneratePassword = () => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghkmnpqrstuvwxyz';
    let res = '';
    for (let i = 0; i < 6; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormPassword(res);
  };

  const handleOpenNewModal = () => {
    setEditingUserId(null);
    setFormName('');
    const baseSlug = (currentCompany.tradeName || currentCompany.name || 'empresa')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
    const randomNum = Math.floor(10 + Math.random() * 90);
    setFormEmail(`cajero${randomNum}@${baseSlug}.sv`);
    setFormPassword('123456');
    setFormPhone('');
    setFormRole('cajero');
    setFormBranchId(branches[0]?.id || '');
    setFormPermissions(['pos_sales']);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: UserProfile) => {
    setEditingUserId(user.id);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormPassword('');
    setFormPhone(user.phone || '');
    setFormRole(user.role);
    setFormBranchId(branches[0]?.id || '');
    setFormPermissions(user.permissions || ['pos_sales']);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim() || (!editingUserId && !formPassword.trim())) {
      addNotification('error', 'Campos Obligatorios', 'Por favor ingresa el nombre, correo y contraseña.');
      return;
    }
    if (editingUserId && formPassword) { addNotification('error', 'Contraseña protegida', 'Para cambiarla, usa Asignar contraseña en la tarjeta del usuario.'); return; }

    const trimmedEmail = formEmail.trim().toLowerCase();
    const finalPermissions = [...formPermissions];

    if (editingUserId) {
      const updates: Partial<UserProfile> = {
        name: formName.trim(),
        email: trimmedEmail,
        phone: formPhone.trim() || undefined,
        role: formRole,
        companyId: currentCompany.id,
        permissions: finalPermissions,
      };

      try { await updateUser(editingUserId, updates); }
      catch (error) { addNotification('error', 'No se actualizó', error instanceof Error ? error.message : 'Comprueba la conexión.'); return; }

      addNotification('success', 'Usuario Actualizado', `Los accesos de ${formName} han sido actualizados.`);
    } else {
      const newUserId = `usr_${Date.now()}`;
      const newUser: UserProfile = {
        id: newUserId,
        companyId: currentCompany.id,
        name: formName.trim(),
        email: trimmedEmail,
        password: formPassword.trim(),
        phone: formPhone.trim() || undefined,
        role: formRole,
        permissions: finalPermissions,
        systemArchetype: currentCompany.systemArchetype || 'emprendedor_control_interno',
        isConfigured: true,
        createdAt: new Date().toISOString().split('T')[0],
        storedInCloud: true,
      };

      try { await createUser({ ...newUser, password: formPassword }); }
      catch (error) { addNotification('error', 'No se creó el acceso', error instanceof Error ? error.message : 'Comprueba la conexión.'); return; }

      setCreatedCredential({
        name: newUser.name,
        email: newUser.email,
        pass: formPassword,
        role: newUser.role,
      });

      addNotification(
        'success',
        '¡Perfil Creado Exitosamente!',
        `El usuario ${newUser.name} está listo para iniciar sesión.`
      );
    }

    setIsModalOpen(false);
  };

  const handleCopyCredentials = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'cajero':
        return { label: 'Cajero / Punto de Venta', badge: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300' };
      case 'vendedor':
        return { label: 'Vendedor / CRM Comercial', badge: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-300' };
      case 'kiosko_asistencia':
        return { label: 'Tablet Kiosko Asistencia (PIN)', badge: 'bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-950 dark:text-cyan-300' };
      case 'gerente':
        return { label: 'Gerente / Administrador', badge: 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-300' };
      case 'contador':
        return { label: 'Contador / NIIF', badge: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300' };
      case 'admin_maestro':
        return { label: 'Administrador Maestro', badge: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300' };
      default:
        return { label: role, badge: 'bg-slate-100 text-slate-800 border-slate-300' };
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 lg:p-6 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-purple-950 text-white rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-800/80 border border-indigo-600/60 text-indigo-200 text-xs font-bold mb-3">
              <Building className="w-3.5 h-3.5" />
              <span>{currentCompany.tradeName || currentCompany.name} • Control de Accesos & Colaboradores</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <Users className="w-8 h-8 text-indigo-400" />
              <span>Gestor de Perfiles, Cajeros & Permisos</span>
            </h1>
            <p className="text-indigo-200/90 text-xs sm:text-sm mt-1.5 max-w-3xl leading-relaxed">
              Crea perfiles independientes para tus cajeros, vendedores, contadores y supervisores de sucursal. Asigna contraseñas y limita el acceso únicamente a los módulos autorizados (como Punto de Venta POS o Facturación).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenNewModal}
              className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-black flex items-center gap-2 shadow-lg transition cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Crear Nuevo Perfil / Cajero</span>
            </button>
          </div>
        </div>

        {/* Resumen de equipo */}
        <div className="mt-6 pt-5 border-t border-indigo-800/60 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-[10px] text-indigo-200 font-bold block">Colaboradores Totales</span>
            <span className="text-xl font-black font-mono mt-0.5 block">{companyUsers.length}</span>
          </div>
          <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-[10px] text-emerald-300 font-bold block">Cajeros / Vendedores</span>
            <span className="text-xl font-black font-mono mt-0.5 block">
              {companyUsers.filter((u) => u.role === 'cajero').length}
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-[10px] text-amber-300 font-bold block">Contadores / NIIF</span>
            <span className="text-xl font-black font-mono mt-0.5 block">
              {companyUsers.filter((u) => u.role === 'contador').length}
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-[10px] text-purple-300 font-bold block">Sucursales Activas</span>
            <span className="text-xl font-black font-mono mt-0.5 block">{branches.length}</span>
          </div>
        </div>
      </div>

      {/* Modal / Banner de Credencial Recién Creada */}
      {createdCredential && (
        <div className="bg-emerald-50 dark:bg-emerald-950/50 border-2 border-emerald-400 dark:border-emerald-700 rounded-3xl p-6 shadow-md animate-in fade-in slide-in-from-top-4 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  ¡Credenciales de Acceso Listas para el Empleado!
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Copia estos datos y entrégaselos a <strong>{createdCredential.name}</strong> para que inicie sesión en su terminal:
                </p>
              </div>
            </div>

            <button
              onClick={() => setCreatedCredential(null)}
              className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 font-bold block">CORREO / USUARIO:</span>
              <span className="text-sm font-mono font-black text-slate-900 dark:text-white block select-all">
                {createdCredential.email}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block">CONTRASEÑA:</span>
              <span className="text-sm font-mono font-black text-emerald-600 dark:text-emerald-400 block select-all">
                {createdCredential.pass}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block">ROL ASIGNADO:</span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 capitalize block">
                {createdCredential.role}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() =>
                handleCopyCredentials(
                  `Hola ${createdCredential.name}, aquí están tus accesos a ${currentCompany.tradeName || currentCompany.name}:\nUsuario: ${createdCredential.email}\nContraseña: ${createdCredential.pass}\nIngreso: https://ais-pre-zt5ox4j3ww7wbwalmkdubu-128537300182.us-east1.run.app`,
                  'banner'
                )
              }
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition cursor-pointer"
            >
              {copiedId === 'banner' ? <Check className="w-4 h-4 text-emerald-200" /> : <Copy className="w-4 h-4" />}
              <span>{copiedId === 'banner' ? '¡Copiado al Portapapeles!' : 'Copiar Credenciales para WhatsApp'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 shadow-2xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar colaborador por nombre o correo..."
              className="w-72 pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:border-indigo-500 font-medium"
            />
            <Users className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
            <span className="font-bold text-slate-500 text-[11px]">Rol:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-transparent border-none text-xs font-bold outline-none text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              <option value="all">Todos los Roles</option>
              <option value="cajero">Cajeros POS</option>
              <option value="vendedor">Vendedores CRM</option>
              <option value="gerente">Gerentes / Admin</option>
              <option value="contador">Contadores</option>
              <option value="kiosko_asistencia">Tablet Kiosko Asistencia</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Mostrando <strong>{filteredUsers.length}</strong> de <strong>{companyUsers.length}</strong> perfiles en {currentCompany.tradeName || currentCompany.name}
        </div>
      </div>

      {/* Grid de Tarjetas de Colaboradores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map((user) => {
          const isCurrent = user.id === currentUser.id;
          const roleInfo = getRoleLabel(user.role);
          const showPass = showPasswords[user.id] || false;
          const userPermissions = user.permissions || (user.role === 'cajero' ? ['pos_sales'] : ['pos_sales', 'sales_crm']);

          return (
            <div
              key={user.id}
              className={`p-5 rounded-3xl border transition shadow-xs flex flex-col justify-between ${
                isCurrent
                  ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-300 dark:border-indigo-800 ring-2 ring-indigo-500/20'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="space-y-4">
                {/* Cabecera de la tarjeta */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{user.name}</span>
                        {isCurrent && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-emerald-500 text-white uppercase">
                            Tú
                          </span>
                        )}
                      </h4>
                      <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${roleInfo.badge}`}>
                        {roleInfo.label}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(user)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                      title="Editar usuario o contraseña"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {!isCurrent && (
                      <button
                        onClick={() => {
                          if (confirm(`¿Eliminar al colaborador ${user.name} y revocar su acceso?`)) {
                            deleteUser(user.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                        title="Eliminar colaborador"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Credenciales de Acceso */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400">Correo / Login:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200 select-all truncate max-w-[170px]">
                      {user.email}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400">Contraseña:</span>
                    <div className="flex items-center gap-1.5 font-mono">
                      <span className="font-black text-slate-900 dark:text-white select-all">
                        {showPass ? 'Protegida por Firebase' : '••••••'}
                      </span>
                      <button
                        onClick={() =>
                          setShowPasswords((prev) => ({ ...prev, [user.id]: !prev[user.id] }))
                        }
                        className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                        title={showPass ? 'Ocultar contraseña' : 'Ver contraseña'}
                      >
                        {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {user.phone && (
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                      <span className="text-[10px] font-bold text-slate-400">Teléfono:</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">{user.phone}</span>
                    </div>
                  )}
                </div>

                {/* Módulos Habilitados */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Módulos Autorizados ({userPermissions.length})
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {userPermissions.map((permKey) => {
                      const pInfo = SYSTEM_PERMISSIONS.find((p) => p.id === permKey);
                      return (
                        <span
                          key={permKey}
                          className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                        >
                          {pInfo?.name || permKey}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Botones de acción al pie de la tarjeta */}
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <AssignPasswordButton user={user} />
                <button
                  type="button"
                  onClick={() =>
                    handleCopyCredentials(
                      `Usuario: ${user.email} | Clave: ${'Protegida por Firebase'}`,
                      user.id
                    )
                  }
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition cursor-pointer"
                >
                  {copiedId === user.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600">¡Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar Datos</span>
                    </>
                  )}
                </button>

                {!isCurrent && (
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentUserId(user.id);
                      addNotification(
                        'info',
                        'Modo Auditoría Activado',
                        `Ahora estás viendo el sistema con los permisos de ${user.name} (${user.role.toUpperCase()}).`
                      );
                    }}
                    className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                    title="Simular cómo ve el sistema este colaborador"
                  >
                    <span>Auditar Sesión</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal para Crear o Editar Colaborador */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-xl rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl p-6 sm:p-8 space-y-5 text-xs max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-4 border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {editingUserId ? 'Editar Colaborador / Cajero' : 'Crear Nuevo Colaborador para la Empresa'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Empresa: <strong>{currentCompany.tradeName || currentCompany.name}</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Presets Rápidos de Rol */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  1. Selecciona el Tipo de Cargo / Rol: *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <button
                    type="button"
                    onClick={() => handleRolePreset('cajero')}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                      formRole === 'cajero'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-900 dark:text-emerald-200 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="font-black text-xs block">💳 Cajero</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Solo POS y cobro</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRolePreset('vendedor')}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                      formRole === 'vendedor'
                        ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-500 ring-2 ring-purple-500/20 text-purple-900 dark:text-purple-200 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="font-black text-xs block">🛒 Vendedor</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">CRM, Ventas & POS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRolePreset('gerente')}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                      formRole === 'gerente'
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/20 text-indigo-900 dark:text-indigo-200 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="font-black text-xs block">👔 Gerente</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Gestión operativa</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRolePreset('contador')}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                      formRole === 'contador'
                        ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 ring-2 ring-amber-500/20 text-amber-900 dark:text-amber-200 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="font-black text-xs block">📊 Contador</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">NIIF & Libros IVA</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRolePreset('kiosko_asistencia')}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                      formRole === 'kiosko_asistencia'
                        ? 'bg-cyan-50 dark:bg-cyan-950/60 border-cyan-500 ring-2 ring-cyan-500/20 text-cyan-900 dark:text-cyan-200 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="font-black text-xs block">📱 Tablet PIN</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Kiosko Asistencia</span>
                  </button>
                </div>
              </div>

              {/* Datos Personales & Credenciales */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nombre Completo del Empleado: *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Sofía Hernández"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Teléfono / WhatsApp:
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: +503 7123-4567"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Correo o Usuario para Iniciar Sesión: *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="cajero@mitienda.sv"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">
                      Contraseña de Acceso: *
                    </label>
                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                    >
                      Generar al Azar
                    </button>
                  </div>
                  <input
                    type="text"
                    required={!editingUserId}
                    disabled={!!editingUserId}
                    placeholder={editingUserId ? 'Usa Asignar contraseña en la tarjeta' : 'Mínimo 6 caracteres'}
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-black"
                  />
                </div>
              </div>

              {/* Sucursal asignada */}
              {branches.length > 1 && (
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Sucursal de Operación:
                  </label>
                  <select
                    value={formBranchId}
                    onChange={(e) => setFormBranchId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Permisos Granulares */}
              <div className="pt-2">
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  2. Permisos y Módulos Autorizados:
                </label>
                <div className="space-y-2 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 bg-slate-50 dark:bg-slate-800/40">
                  {SYSTEM_PERMISSIONS.map((perm) => {
                    const isChecked = formPermissions.includes(perm.id);
                    const Icon = perm.icon;
                    return (
                      <label
                        key={perm.id}
                        className={`flex items-start gap-3 p-2.5 rounded-xl border transition cursor-pointer ${
                          isChecked
                            ? 'bg-white dark:bg-slate-800 border-indigo-300 dark:border-indigo-700 shadow-2xs'
                            : 'bg-transparent border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => togglePermission(perm.id)}
                          className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <Icon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                            <span className="font-black text-slate-900 dark:text-white text-xs">{perm.name}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5">{perm.desc}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Botones de acción */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black shadow-md transition cursor-pointer flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingUserId ? 'Guardar Cambios' : 'Crear Colaborador'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
