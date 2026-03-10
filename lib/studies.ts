import { getItem, saveItem } from './storage';
import { api } from './api';

export type Study = {
  id: string;
  name: string;
  mimeType: string; // e.g. application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document
  dataUrl: string; // data:...;base64,..
  createdAt: number;
  forEmail?: string; // correo del paciente asignado
};

export type RemoteStudy = {
  id: string;
  name: string;
  mimeType: string; // 'application/pdf'
  fileUrl: string;  // backend-served URL
  createdAt: string; // ISO from DB
  forEmail?: string;
};

const STORAGE_KEY = 'studies';

function generateId() {
  try {
    // @ts-ignore
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  } catch {}
  return `st_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function getStudies(): Promise<Study[]> {
  const raw = await getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Study[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function addStudy(input: Omit<Study, 'id' | 'createdAt'>): Promise<Study> {
  const all = await getStudies();
  const study: Study = { id: generateId(), createdAt: Date.now(), ...input };
  const next = [study, ...all];
  await saveItem(STORAGE_KEY, JSON.stringify(next));
  return study;
}

export async function deleteStudy(id: string) {
  const all = await getStudies();
  const next = all.filter((s) => s.id !== id);
  await saveItem(STORAGE_KEY, JSON.stringify(next));
}

export async function getStudiesFor(email?: string): Promise<Study[]> {
  const all = await getStudies();
  if (!email) return all;
  // Solo mostrar estudios asignados al correo indicado
  return all.filter((s) => s.forEmail === email);
}

// Backend helpers (PDF)
export async function uploadPdfStudy(name: string, dataBase64: string, forEmail?: string): Promise<RemoteStudy> {
  const res = await api.post('/studies', { name, mimeType: 'application/pdf', dataBase64, forEmail });
  return res.data as RemoteStudy;
}

export async function getRemoteStudies(forEmail?: string): Promise<RemoteStudy[]> {
  const res = await api.get('/studies', { params: { forEmail } });
  return res.data as RemoteStudy[];
}

export async function deleteRemoteStudy(id: string): Promise<void> {
  await api.delete(`/studies/${id}`);
}