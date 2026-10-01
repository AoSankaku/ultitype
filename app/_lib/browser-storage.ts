// Browser storage is optional: private settings and quotas can deny even property access.
export function getBrowserLocalStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function readLocalStorageItem(key: string): string | null {
  try {
    return getBrowserLocalStorage()?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function writeLocalStorageItem(key: string, value: string): boolean {
  try {
    const storage = getBrowserLocalStorage();
    if (!storage) return false;
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function removeLocalStorageItems(shouldRemove: (key: string) => boolean): boolean {
  try {
    const storage = getBrowserLocalStorage();
    if (!storage) return false;
    for (let index = storage.length - 1; index >= 0; index -= 1) {
      const key = storage.key(index);
      if (key !== null && shouldRemove(key)) storage.removeItem(key);
    }
    return true;
  } catch {
    return false;
  }
}
