"use client";

import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { css } from "../_lib/css-module";
import { readLocalStorageItem, writeLocalStorageItem } from "../_lib/browser-storage";
import styles from "./MobileViewportWarning.module.css";

export const mobileViewportWarningStorageKey = "ultitype:mobile-viewport-warning-dismissed";
export const mobileViewportWarningMediaQuery = "(max-width: 519px)";
export const mobileViewportWarningInset = 14;
export const mobileViewportWarningMaxWidth = 420;

type MobileViewportWarningBounds = {
  offsetLeft: number;
  offsetTop: number;
  width: number;
  height: number;
  layoutHeight: number;
};

export function shouldShowMobileViewportWarning({
  dismissed,
  isNarrowViewport,
}: {
  dismissed: boolean;
  isNarrowViewport: boolean;
}) {
  return isNarrowViewport && !dismissed;
}

export function calculateMobileViewportWarningStyle({
  offsetLeft,
  offsetTop,
  width,
  height,
  layoutHeight,
}: MobileViewportWarningBounds) {
  const warningWidth = Math.max(
    0,
    Math.min(mobileViewportWarningMaxWidth, width - mobileViewportWarningInset * 2),
  );
  const left = offsetLeft + width - warningWidth - mobileViewportWarningInset;
  const minLeft = offsetLeft + mobileViewportWarningInset;
  const bottom = layoutHeight - offsetTop - height + mobileViewportWarningInset;

  return {
    "--mobile-viewport-warning-left": `${Math.max(minLeft, left)}px`,
    "--mobile-viewport-warning-bottom": `${Math.max(mobileViewportWarningInset, bottom)}px`,
    "--mobile-viewport-warning-width": `${warningWidth}px`,
  } as CSSProperties;
}

export function MobileViewportWarning() {
  const [isNarrowViewport, setIsNarrowViewport] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [dismissOnClose, setDismissOnClose] = useState(false);
  const [viewportStyle, setViewportStyle] = useState<CSSProperties>({});

  useEffect(() => {
    const mediaQuery = window.matchMedia(mobileViewportWarningMediaQuery);

    function updateViewportStyle() {
      const viewport = window.visualViewport;

      setViewportStyle(
        calculateMobileViewportWarningStyle({
          offsetLeft: viewport?.offsetLeft ?? 0,
          offsetTop: viewport?.offsetTop ?? 0,
          width: viewport?.width ?? window.innerWidth,
          height: viewport?.height ?? window.innerHeight,
          layoutHeight: window.innerHeight,
        }),
      );
    }

    updateViewportStyle();
    setIsNarrowViewport(mediaQuery.matches);
    setDismissed(readLocalStorageItem(mobileViewportWarningStorageKey) === "true");

    const handleViewportChange = (event: MediaQueryListEvent) => {
      setIsNarrowViewport(event.matches);
      updateViewportStyle();
    };

    mediaQuery.addEventListener("change", handleViewportChange);
    window.addEventListener("resize", updateViewportStyle);
    window.visualViewport?.addEventListener("resize", updateViewportStyle);
    window.visualViewport?.addEventListener("scroll", updateViewportStyle);

    return () => {
      mediaQuery.removeEventListener("change", handleViewportChange);
      window.removeEventListener("resize", updateViewportStyle);
      window.visualViewport?.removeEventListener("resize", updateViewportStyle);
      window.visualViewport?.removeEventListener("scroll", updateViewportStyle);
    };
  }, []);

  if (!shouldShowMobileViewportWarning({ dismissed, isNarrowViewport })) {
    return null;
  }

  function closeWarning() {
    if (dismissOnClose) {
      writeLocalStorageItem(mobileViewportWarningStorageKey, "true");
      setDismissed(true);
    } else {
      setIsNarrowViewport(false);
    }
  }

  return (
    <aside
      className={css(styles, "mobile-viewport-warning")}
      role="status"
      aria-live="polite"
      style={viewportStyle}
    >
      <div className={css(styles, "mobile-viewport-warning-icon")} aria-hidden="true">
        <AlertTriangle size={20} />
      </div>
      <div className={css(styles, "mobile-viewport-warning-copy")}>
        <strong>この画面幅はサポート対象外です</strong>
        <p>
          UltiType は 520px 以上のデスクトップ画面向けです。現在の表示ではデスクトップ向けレイアウトを維持します。
        </p>
        <label className={css(styles, "mobile-viewport-warning-check")}>
          <input
            checked={dismissOnClose}
            type="checkbox"
            onChange={(event) => setDismissOnClose(event.currentTarget.checked)}
          />
          <span>以後表示しない</span>
        </label>
      </div>
      <button
        className={css(styles, "mobile-viewport-warning-close")}
        type="button"
        aria-label="警告を閉じる"
        onClick={closeWarning}
      >
        <X size={18} />
      </button>
    </aside>
  );
}
