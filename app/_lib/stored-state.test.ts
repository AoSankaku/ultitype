import { describe, expect, test } from "bun:test";
import { initialStoredState } from "./constants";
import {
  cacheStoredState,
  getInitialStoredState,
  normalizeStoredState,
  resetStoredStateCache,
  shouldPersistStoredState,
} from "./stored-state";

describe("stored state persistence", () => {
  test("does not persist the initial state before storage hydration finishes", () => {
    expect(
      shouldPersistStoredState({
        hasLoadedStoredState: false,
        skipNextPersist: false,
      }),
    ).toBe(false);
  });

  test("persists after hydration unless the next persist was explicitly skipped", () => {
    expect(
      shouldPersistStoredState({
        hasLoadedStoredState: true,
        skipNextPersist: false,
      }),
    ).toBe(true);

    expect(
      shouldPersistStoredState({
        hasLoadedStoredState: true,
        skipNextPersist: true,
      }),
    ).toBe(false);
  });

  test("reuses the last loaded state while the next route hydrates storage", () => {
    resetStoredStateCache();

    const loadedState = {
      ...initialStoredState,
      bestPracticeScore: 1200,
      bestProductionScore: 2400,
    };

    cacheStoredState(loadedState);

    expect(getInitialStoredState()).toEqual(loadedState);
  });

  test("fills the speed display setting when loading older stored state", () => {
    const stored = normalizeStoredState({
      settings: {
        ...initialStoredState.settings,
        speedDisplayUnit: undefined,
      },
    });

    expect(stored.settings.speedDisplayUnit).toBe("keysPerSecond");
  });
});
