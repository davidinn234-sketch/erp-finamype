import React, { useState } from 'react';
import { authenticatedFetch } from '../../lib/authenticatedFetch';
import type { UserProfile } from '../../types';

type Access = Pick<UserProfile, 'name' | 'email'> & { password: string };

export function AccessCredentialsDialog({ access, onClose }: { access: Access | null; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  if (!access) return null;
  const message = `Hola ${access.name}, tu acceso a Fina Pyme está listo.\nEnlace: ${window.location.origin}\nUsuario: ${access.email}\nContraseña: ${access.password}`;
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-label="Acceso listo">
    <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 space-y-4 text-slate-900 dark:text-white">
      <h2 className="text-xl font-bold">Acceso listo para entregar</h2>
      <p>El usuario puede entrar directamente con estos datos, aunque el correo no tenga un buzón.</p>
      <pre className="whitespace-pre-wrap break-all rounded-xl bg-slate-100 dark:bg-slate-800 p-4 text-sm">{message}</pre>
      <p className="text-sm text-slate-500">Copia la contraseña ahora. Al cerrar, deja de mostrarse; después puedes asignar una nueva.</p>
      <div className="flex gap-3">
        <button type="button" className="rounded-lg bg-indigo-600 text-white px-4 py-2" onClick={async () => { await navigator.clipboard.writeText(message); setCopied(true); }}>{copied ? 'Copiado' : 'Copiar acceso'}</button>
        <button type="button" className="rounded-lg border px-4 py-2" onClick={() => { setCopied(false); onClose(); }}>Cerrar</button>
      </div>
    </div>
  </div>;
}

export function AssignPasswordButton({ user }: { user: Pick<UserProfile, 'id' | 'name' | 'email'> }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [access, setAccess] = useState<Access | null>(null);
  return <>
    <button type="button" className="rounded-lg border border-indigo-400/40 px-2 py-1 text-xs text-indigo-500 hover:bg-indigo-500/10" onClick={() => { setPassword(''); setError(''); setOpen(true); }}>Asignar contraseña</button>
    {open && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-label={`Asignar contraseña a ${user.name}`}>
      <form className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 space-y-4 text-slate-900 dark:text-white" onSubmit={async e => {
        e.preventDefault(); setBusy(true); setError('');
        try {
          const response = await authenticatedFetch(`/api/admin/users/${encodeURIComponent(user.id)}/password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error || 'No se pudo asignar la contraseña.');
          setAccess({ name: user.name, email: user.email, password }); setPassword(''); setOpen(false);
        } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo asignar la contraseña.'); }
        finally { setBusy(false); }
      }}>
        <h2 className="text-xl font-bold">Asignar contraseña</h2>
        <p className="break-all">Usuario: {user.email}</p>
        <label className="block">Nueva contraseña<input aria-label="Nueva contraseña" type="password" minLength={6} maxLength={128} required autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} className="mt-2 block w-full rounded-lg border bg-transparent px-3 py-2" /></label>
        <p className="text-sm text-slate-500">Podrá entrar con esta contraseña sin recibir un correo. Reemplaza la contraseña anterior.</p>
        {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
        <div className="flex gap-3"><button disabled={busy} className="rounded-lg bg-indigo-600 text-white px-4 py-2">{busy ? 'Guardando…' : 'Guardar contraseña'}</button><button disabled={busy} type="button" className="rounded-lg border px-4 py-2" onClick={() => { setPassword(''); setOpen(false); }}>Cancelar</button></div>
      </form>
    </div>}
    <AccessCredentialsDialog access={access} onClose={() => setAccess(null)} />
  </>;
}
