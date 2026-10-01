import { type RefObject, useEffect, useLayoutEffect, useRef, useState } from "react";
import { readLocalStorageItem, writeLocalStorageItem } from "../../_lib/browser-storage";
import { productionImeInputWidthStorageKey } from "./common";
import { clampProductionImeInputWidth } from "./ime-input";

export function useProductionImeInputWidth(enabled: boolean, shellRef: RefObject<HTMLDivElement | null>) {
  const [width, setWidth] = useState<number | null>(null);
  const observedRef = useRef(false);
  useEffect(() => {
    if (!enabled) return;
    const raw = readLocalStorageItem(productionImeInputWidthStorageKey);
    if (raw === null || raw.trim() === "") return;
    const value = Number(raw);
    const savedWidth = value > 0 ? clampProductionImeInputWidth(value) : null;
    if (savedWidth !== null) setWidth(savedWidth);
  }, [enabled]);

  useLayoutEffect(() => {
    const shell = shellRef.current;
    if (!enabled || !shell || typeof ResizeObserver === "undefined") return;
    observedRef.current = false;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const borderBoxSize = Array.isArray(entry.borderBoxSize)
        ? entry.borderBoxSize[0] : entry.borderBoxSize;
      const nextWidth = clampProductionImeInputWidth(borderBoxSize?.inlineSize ?? entry.contentRect.width);
      if (nextWidth === null) return;
      if (!observedRef.current) {
        observedRef.current = true;
        return;
      }
      setWidth((current) => current === nextWidth ? current : nextWidth);
      writeLocalStorageItem(productionImeInputWidthStorageKey, String(nextWidth));
    });
    observer.observe(shell);
    return () => observer.disconnect();
  }, [enabled, shellRef]);
  return [width, setWidth] as const;
}
