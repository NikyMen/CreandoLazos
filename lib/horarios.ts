import { getItem, saveItem } from './storage';

export type Dia = 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes';

export type HorariosData = {
  note?: string;
  cells: Record<string, string>;
};

type HorariosStore = {
  global: HorariosData;
  perEmail: Record<string, HorariosData>;
};

const STORAGE_KEY = 'horarios';

export function keyFor(day: Dia, time: string) {
  return `${day}-${time}`;
}

function emptyData(): HorariosData {
  return { note: '', cells: {} };
}

async function getStore(): Promise<HorariosStore> {
  const raw = await getItem(STORAGE_KEY);
  if (!raw) return { global: emptyData(), perEmail: {} };
  try {
    const parsed = JSON.parse(raw) as any;
    if (parsed && parsed.cells) {
      return { global: { note: parsed.note || '', cells: parsed.cells || {} }, perEmail: {} };
    }
    return {
      global: { note: parsed?.global?.note || '', cells: parsed?.global?.cells || {} },
      perEmail: parsed?.perEmail || {},
    } as HorariosStore;
  } catch {
    return { global: emptyData(), perEmail: {} };
  }
}

async function saveStore(store: HorariosStore) {
  await saveItem(STORAGE_KEY, JSON.stringify(store));
}

export async function getHorariosFor(email?: string): Promise<HorariosData> {
  const store = await getStore();
  if (!email) return store.global;
  const data = store.perEmail[email];
  return data ? { note: data.note || '', cells: data.cells || {} } : store.global;
}

export async function setHorarioCellFor(email: string | undefined, day: Dia, time: string, value: string) {
  const store = await getStore();
  if (!email) {
    store.global.cells[keyFor(day, time)] = value;
  } else {
    const current = store.perEmail[email] || emptyData();
    current.cells[keyFor(day, time)] = value;
    store.perEmail[email] = current;
  }
  await saveStore(store);
}

export async function setHorarioNoteFor(email: string | undefined, note: string) {
  const store = await getStore();
  if (!email) {
    store.global.note = note;
  } else {
    const current = store.perEmail[email] || emptyData();
    current.note = note;
    store.perEmail[email] = current;
  }
  await saveStore(store);
}

export const dias: Dia[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

export function timeSlots(startHour = 8, endHour = 18) {
  const slots: string[] = [];
  for (let h = startHour; h <= endHour; h++) {
    const hh = String(h).padStart(2, '0');
    slots.push(`${hh}:00`);
    if (h !== endHour) slots.push(`${hh}:30`);
  }
  return slots;
}

export async function setHorariosFor(email: string | undefined, data: HorariosData) {
  const store = await getStore();
  if (!email) {
    store.global = { note: data.note || '', cells: data.cells || {} };
  } else {
    store.perEmail[email] = { note: data.note || '', cells: data.cells || {} };
  }
  await saveStore(store);
}
