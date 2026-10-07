import { deleteApp, initializeApp } from 'firebase/app';
import { createUserWithEmailAndPassword, deleteUser, getAuth, inMemoryPersistence, setPersistence, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, connectAuthEmulator } from 'firebase/auth';
import { doc, getDoc, initializeFirestore, writeBatch, connectFirestoreEmulator } from 'firebase/firestore';
import { auth, db, firebaseConfig, firestoreDatabaseId } from './firebase';
import type { Branch, Company, UserProfile } from '../types';
import { DEFAULT_FISCAL_CONFIG } from '../utils/salvadoranTax';

export function authErrorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code;
  const messages: Record<string, string> = {
    'auth/invalid-credential': 'El correo o la contraseña no son correctos.',
    'auth/user-not-found': 'El correo o la contraseña no son correctos.',
    'auth/wrong-password': 'El correo o la contraseña no son correctos.',
    'auth/email-already-in-use': 'Este usuario ya tiene una cuenta. Inicia sesión o pide al administrador que te asigne una nueva contraseña.',
    'auth/weak-password': 'Usa una contraseña de al menos 6 caracteres.',
    'auth/invalid-email': 'Usa una dirección con formato de correo, por ejemplo usuario@finapyme.sv.',
    'auth/operation-not-allowed': 'Es necesario habilitar Correo/contraseña en Firebase Authentication.',
    'auth/configuration-not-found': 'Es necesario configurar Firebase Authentication para este proyecto.',
    'auth/too-many-requests': 'Hay demasiados intentos. Espera unos minutos y vuelve a intentar.',
    'auth/network-request-failed': 'No se pudo conectar. Comprueba tu conexión a Internet.',
    'permission-denied': 'Firebase rechazó el acceso. Comprueba que estén publicadas las reglas del proyecto.',
  };
  return messages[code || ''] || (error instanceof Error ? error.message : 'No se pudo completar la operación.');
}

export async function loginAccount(email: string, password: string) {
  const credential = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
  const profile = await getDoc(doc(db, 'users', credential.user.uid));
  if (!profile.exists()) {
    await signOut(auth);
    throw new Error('Tu acceso de Firebase todavía no tiene un perfil asociado. Es necesario completar la migración de tu cuenta.');
  }
}

export async function resetAccountPassword(email: string) {
  await sendPasswordResetEmail(auth, email.trim().toLowerCase());
}

// A temporary, memory-only Auth instance avoids replacing the administrator's session.
// Public signup writes with the new identity; administrator provisioning writes with
// the administrator's identity. Passwords never enter Firestore or profile state.
export async function provisionAccount(
  input: Omit<UserProfile, 'id'>,
  companyInput?: Omit<Company, 'id'>,
  publicSignup = false,
): Promise<{ user: UserProfile; company?: Company }> {
  if (!input.password || input.password.length < 6) throw new Error('Usa una contraseña de al menos 6 caracteres.');
  if (!publicSignup && !auth.currentUser) throw new Error('Inicia sesión para crear accesos.');
  const temporaryApp = initializeApp(firebaseConfig, `provision-${crypto.randomUUID()}`);
  const temporaryAuth = getAuth(temporaryApp);
  const emulated = import.meta.env?.DEV && import.meta.env?.VITE_USE_FIREBASE_EMULATORS === 'true';
  if (emulated) connectAuthEmulator(temporaryAuth, 'http://127.0.0.1:9099', { disableWarnings: true });
  await setPersistence(temporaryAuth, inMemoryPersistence);
  let identity: Awaited<ReturnType<typeof createUserWithEmailAndPassword>> | undefined;
  let committed = false;
  try {
    identity = await createUserWithEmailAndPassword(temporaryAuth, input.email.trim().toLowerCase(), input.password);
    const { password: _password, ...fields } = input;
    const user: UserProfile = {
      ...fields, id: identity.user.uid, email: identity.user.email!,
      role: publicSignup || fields.role === 'admin_maestro' ? 'gerente' : fields.role,
      createdAt: new Date().toISOString().split('T')[0], storedInCloud: true,
    };
    const writer = publicSignup
      ? initializeFirestore(temporaryApp, { ignoreUndefinedProperties: true }, firestoreDatabaseId)
      : db;
    if (publicSignup && emulated) connectFirestoreEmulator(writer, '127.0.0.1', 8080);
    const batch = writeBatch(writer);
    let company: Company | undefined;
    if (companyInput) {
      company = {
        ...companyInput, id: `comp_${crypto.randomUUID()}`,
        primaryAdminUserId: user.id, fiscalConfig: companyInput.fiscalConfig || DEFAULT_FISCAL_CONFIG,
        createdAt: new Date().toISOString().split('T')[0],
      };
      user.companyId = company.id;
      batch.set(doc(writer, 'companies', company.id), company);
      const branch: Branch = {
        id: `branch_${crypto.randomUUID()}`, companyId: company.id, code: 'SUC-01', name: 'Casa Matriz',
        address: company.address, department: company.department, municipality: company.municipality,
        phone: company.phone, managerName: user.name, isMain: true, isActive: true,
      };
      batch.set(doc(writer, 'branches', branch.id), branch);
      const cashId = `cash_${company.id}`;
      batch.set(doc(writer, 'bank_accounts', cashId), {
        id: cashId, companyId: company.id, accountName: 'Caja general', bankName: 'Efectivo',
        accountNumber: '', accountType: 'caja_general', accountingCode: '1101-01',
        initialBalance: 0, currentBalance: 0, currency: 'USD',
      });
    } else if (publicSignup) {
      delete user.companyId;
      user.systemArchetype = 'finanzas_personales';
      user.isConfigured = true;
    }
    batch.set(doc(writer, 'users', user.id), user);
    await batch.commit();
    committed = true;
    if (publicSignup) await loginAccount(input.email, input.password);
    return { user, company };
  } catch (error) {
    if (identity && !committed) await deleteUser(identity.user).catch(() => {});
    throw new Error(authErrorMessage(error));
  } finally {
    await signOut(temporaryAuth).catch(() => {});
    await deleteApp(temporaryApp);
  }
}
