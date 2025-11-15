import * as SecureStore from 'expo-secure-store';

const isWeb = typeof window !== 'undefined' && typeof document !== 'undefined';

export async function saveItem(key: string, value: string) {
  if (isWeb) {
    try {
      window.localStorage.setItem(key, value);
    } catch (e) {
      // Posible QuotaExceededError por tamaño de datos (p.ej., PDFs grandes)
      throw new Error('No se pudo guardar en almacenamiento local (tamaño excedido).');
    }
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

export async function getItem(key: string) {
  if (isWeb) {
    return window.localStorage.getItem(key);
  } else {
    return await SecureStore.getItemAsync(key);
  }
}

export async function deleteItem(key: string) {
  if (isWeb) {
    window.localStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}