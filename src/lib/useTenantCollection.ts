import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { collection, doc, onSnapshot, query, where, writeBatch } from 'firebase/firestore';
import { auth, db } from './firebase';
import { assertTenantRecords } from './tenantPolicy';

// Remote hydration never triggers writes or deletions. Only explicit user edits
// write a document diff. Changing the scope immediately hides the previous data.
export function useTenantCollection<T extends { id: string; companyId?: string }>(
  name: string, companyId: string | null, onError: (error: unknown) => void, scopeField = 'companyId',
): [T[], Dispatch<SetStateAction<T[]>>] {
  const [state, setState] = useState<{ scope: string | null; items: T[] }>({ scope: null, items: [] });
  const current = useRef<{ scope: string | null; items: T[]; ready: boolean }>({ scope: null, items: [], ready: false });
  const errorHandler = useRef(onError);
  errorHandler.current = onError;
  useEffect(() => {
    let active = true;
    current.current = { scope: companyId, items: [], ready: false };
    setState({ scope: companyId, items: [] });
    if (!companyId || !auth.currentUser) return;
    const unsubscribe = onSnapshot(query(collection(db, name), where(scopeField, '==', companyId)), snapshot => {
      if (!active) return;
      const items = snapshot.docs.map(document => ({ ...document.data(), id: document.id } as T));
      current.current = { scope: companyId, items, ready: true };
      setState({ scope: companyId, items });
    }, error => { if (active) errorHandler.current(error); });
    return () => { active = false; unsubscribe(); };
  }, [name, companyId, scopeField]);

  const edit: Dispatch<SetStateAction<T[]>> = action => {
    const previous = current.current;
    if (!companyId || !auth.currentUser || previous.scope !== companyId || !previous.ready) {
      errorHandler.current(new Error('Espera a que se carguen los datos de esta empresa antes de modificarlos.'));
      return;
    }
    const items = typeof action === 'function' ? action(previous.items) : action;
    try {
      if (scopeField === 'companyId') assertTenantRecords(items, companyId);
      else if (items.some(item => (item as Record<string, unknown>)[scopeField] !== companyId)) throw new Error('El registro pertenece a otra cuenta.');
    } catch (error) { errorHandler.current(error); return; }
    const before = new Map(previous.items.map(item => [item.id, JSON.stringify(item)]));
    const after = new Set(items.map(item => item.id));
    const writes: ((batch: ReturnType<typeof writeBatch>) => void)[] = [];
    items.forEach(item => {
      if (before.get(item.id) !== JSON.stringify(item)) writes.push(batch => batch.set(doc(db, name, item.id), item));
      if (name === 'employees' && before.get(item.id) !== JSON.stringify(item)) {
        const employee = item as Record<string, unknown>;
        const attendanceProfile = Object.fromEntries(['id', 'companyId', 'firstName', 'lastName', 'position', 'pinCode', 'isActive', 'branchId', 'branchName', 'avatar'].filter(key => employee[key] !== undefined).map(key => [key, employee[key]]));
        writes.push(batch => batch.set(doc(db, 'attendance_directory', item.id), attendanceProfile));
      }
    });
    previous.items.forEach(item => {
      if (!after.has(item.id)) {
        writes.push(batch => batch.delete(doc(db, name, item.id)));
        if (name === 'employees') writes.push(batch => batch.delete(doc(db, 'attendance_directory', item.id)));
      }
    });
    current.current = { scope: companyId, items, ready: true };
    setState({ scope: companyId, items });
    // Keep each batch below Firestore's write limit; no full-collection mirroring.
    for (let start = 0; start < writes.length; start += 400) {
      const batch = writeBatch(db);
      writes.slice(start, start + 400).forEach(write => write(batch));
      batch.commit().catch(error => errorHandler.current(error));
    }
  };
  return [state.scope === companyId ? state.items : [], edit];
}
