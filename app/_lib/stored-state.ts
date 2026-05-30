import { initialSettings, initialStoredState, storageKey } from "./constants";
import type { StoredState } from "./types";

let cachedStoredState: StoredState | null = null;

export function getInitialStoredState() {
  return cachedStoredState ?? initialStoredState;
}

export function cacheStoredState(storedState: StoredState) {
  cachedStoredState = storedState;
}

export function resetStoredStateCache() {
  cachedStoredState = null;
}

export function normalizeStoredState(storedState: Partial<StoredState> | null | undefined) {
  return {
    ...initialStoredState,
    ...storedState,
    settings: {
      ...initialSettings,
      ...storedState?.settings,
      speedDisplayUnit: storedState?.settings?.speedDisplayUnit ?? initialSettings.speedDisplayUnit,
      sokuonInput: {
        ...initialSettings.sokuonInput,
        ...storedState?.settings?.sokuonInput,
      },
    },
  };
}

export function readStoredState(
  storage: Pick<Storage, "getItem" | "removeItem">,
): StoredState {
  const raw = storage.getItem(storageKey);
  if (!raw) {
    return initialStoredState;
  }

  try {
    return normalizeStoredState(JSON.parse(raw) as Partial<StoredState>);
  } catch {
    storage.removeItem(storageKey);
    return initialStoredState;
  }
}

export function shouldPersistStoredState({
  hasLoadedStoredState,
  skipNextPersist,
}: {
  hasLoadedStoredState: boolean;
  skipNextPersist: boolean;
}) {
  return hasLoadedStoredState && !skipNextPersist;
}
