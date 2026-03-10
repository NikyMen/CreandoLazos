import { getItem, saveItem } from './storage';
import { api } from './api';

export type ProfileData = {
  nombreApellido?: string;
  cuilDni?: string;
  obraSocial?: string;
  correo?: string;
  escuela?: string;
  diagnostico?: string;
  servicio?: string;
  cudNumero?: string;
  cudVencimiento?: string;
  cudAcompanante?: boolean;
};

type ProfilesStore = {
  perEmail: Record<string, ProfileData>;
};

const STORAGE_KEY = 'profiles';

function emptyProfile(email?: string): ProfileData {
  return { 
    nombreApellido: '', 
    cuilDni: '', 
    obraSocial: '', 
    correo: email || '', 
    escuela: '', 
    diagnostico: '',
    servicio: '',
    cudNumero: '',
    cudVencimiento: '',
    cudAcompanante: false
  };
}

async function getStore(): Promise<ProfilesStore> {
  const raw = await getItem(STORAGE_KEY);
  if (!raw) return { perEmail: {} };
  try {
    const parsed = JSON.parse(raw) as ProfilesStore;
    return { perEmail: parsed?.perEmail || {} };
  } catch {
    return { perEmail: {} };
  }
}

async function saveStore(store: ProfilesStore) {
  await saveItem(STORAGE_KEY, JSON.stringify(store));
}

export async function getProfileFor(email?: string): Promise<ProfileData> {
  const store = await getStore();
  if (!email) return emptyProfile('');
  return store.perEmail[email] || emptyProfile(email);
}

export async function setProfileFor(email: string, data: ProfileData) {
  const store = await getStore();
  store.perEmail[email] = { ...emptyProfile(email), ...data, correo: data.correo || email };
  await saveStore(store);
}

export async function listProfileEmails(): Promise<string[]> {
  const store = await getStore();
  return Object.keys(store.perEmail || {}).filter(Boolean).sort();
}

export async function updateRemoteProfile(email: string, data: ProfileData) {
  const payload = { email, ...data };
  await api.put('/profiles', payload);
}

export async function getRemoteProfile(email: string): Promise<ProfileData | null> {
  const res = await api.get('/profiles', { params: { email } });
  const data = res?.data;
  if (!data) return null;
  const mapped: ProfileData = {
    nombreApellido: data.nombreApellido ?? data.nombre_apellido ?? '',
    cuilDni: data.cuilDni ?? data.cuil_dni ?? '',
    obraSocial: data.obraSocial ?? data.obra_social ?? '',
    correo: data.correo ?? email,
    escuela: data.escuela ?? '',
    diagnostico: data.diagnostico ?? '',
    servicio: data.servicio ?? '',
    cudNumero: data.cudNumero ?? data.cud_numero ?? '',
    cudVencimiento: data.cudVencimiento ?? data.cud_vencimiento ?? '',
    cudAcompanante: !!(data.cudAcompanante ?? data.cud_acompanante),
  };
  return mapped;
}
