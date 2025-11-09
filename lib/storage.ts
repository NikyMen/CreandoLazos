import * as SecureStore from 'expo-secure-store';

const isWeb = typeof window !== 'undefined' && typeof document !== 'undefined';

export async function saveItem(key: string, value: string) {
  if (isWeb) {
    window.localStorage.setItem(key, value);
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