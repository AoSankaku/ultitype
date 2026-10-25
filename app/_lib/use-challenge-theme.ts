"use client";

import { useCallback, useEffect, useState } from "react";
import {
  firstWeeklyThemeAt,
  getNextThemeChangeAt,
  getWeeklyChallengeThemeId,
  isChallengeThemeId,
  type ChallengeThemeId,
} from "./challenge-theme-schedule";
import {
  readLocalStorageItem,
  removeLocalStorageItems,
  writeLocalStorageItem,
} from "./browser-storage";

export const challengeThemeStorageKey = "ultitype:challenge-theme";
const isDevelopment = process.env.NODE_ENV === "development";
let hasRuntimeThemeOverride = false;
let runtimeThemeOverride: ChallengeThemeId | null = null;

export function getChallengeThemeOverride(
  value: unknown,
  environment: string,
): ChallengeThemeId | null {
  return environment === "development" && isChallengeThemeId(value) ? value : null;
}

export function useChallengeTheme() {
  const [now, setNow] = useState<number | null>(null);
  const [themeOverride, setThemeOverride] = useState<ChallengeThemeId | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const savedOverride = !isDevelopment
      ? null
      : hasRuntimeThemeOverride
        ? runtimeThemeOverride
        : getChallengeThemeOverride(
            readLocalStorageItem(challengeThemeStorageKey),
            process.env.NODE_ENV,
          );
    setThemeOverride(savedOverride);
    setNow(Date.now());
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady || now === null) return;

    const nextChangeAt = getNextThemeChangeAt(new Date(now)).getTime();
    const timeout = window.setTimeout(() => setNow(Date.now()), Math.max(0, nextChangeAt - Date.now() + 1));
    const refresh = () => setNow(Date.now());
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };

    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [isReady, now]);

  const selectTheme = useCallback((themeId: ChallengeThemeId | null) => {
    if (!isDevelopment) return;
    hasRuntimeThemeOverride = true;
    runtimeThemeOverride = themeId;
    setThemeOverride(themeId);
    if (themeId) {
      writeLocalStorageItem(challengeThemeStorageKey, themeId);
    } else {
      removeLocalStorageItems((key) => key === challengeThemeStorageKey);
    }
    setNow(Date.now());
  }, []);

  const scheduleTimestamp = now ?? firstWeeklyThemeAt.getTime() - 1;
  const weeklyThemeId = getWeeklyChallengeThemeId(new Date(scheduleTimestamp));
  const selectedThemeId = themeOverride ?? weeklyThemeId;

  return {
    isReady,
    isThemeOverride: themeOverride !== null,
    isThemeSelectorEnabled: isDevelopment,
    nextThemeChangeAt: getNextThemeChangeAt(new Date(scheduleTimestamp)),
    selectedThemeId,
    selectTheme,
    themeOverride,
    weeklyThemeId,
  };
}
