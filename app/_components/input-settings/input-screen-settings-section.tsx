"use client";

import { ChevronDown, ChevronUp, Lock } from "lucide-react";
import { englishFontFamilyOptions, initialSettings, japaneseFontFamilyOptions, targetDisplayElementOptions } from "../../_lib/constants";
import { css } from "../../_lib/css-module";
import type { AppSettings } from "../../_lib/types";
import styles from "../SettingsScreen.module.css";
import { FontFamilySettingRow, FontScaleSettingRow, FontSizeSettingRow } from "./font-setting-rows";
import { NumericSettingRow } from "./number-control";
import { TextSpacingSettingRows } from "./text-spacing-setting-rows";
import { nextChallengePreviewModeOptions } from "./types";
import { InputScreenLayoutSettings } from "./input-screen-layout-settings";
import { JapaneseInputScreenSettings } from "./japanese-input-screen-settings";
import { RomajiOtherInputScreenSettings } from "./romaji-other-input-screen-settings";

import type { InputSettingsController } from "./controller";

export function InputScreenSettingsSection({ controller }: { controller: InputSettingsController }) {
  const {
    draggedDisplayOrderId,
    getTargetDisplayElementVisibility,
    moveTargetDisplayElement,
    onChange,
    setDraggedDisplayOrderId,
    settings,
    showFuriganaDisplay,
    showFuriganaMarker,
    showHiraganaInputProgress,
    showHiraganaMarker,
    showKanjiInputProgress,
    showKanjiMarker,
    stepTargetDisplayElement,
    updateFontSize,
    updateFuriganaFontScale,
    updateLineHeight,
    updateMarginBottom,
    updateProductionLongTextLineCount,
  } = controller;

  return (
      <section className={css(styles, "settings-category")} aria-labelledby="input-screen-settings">
        <h3 className={css(styles, "settings-category-title")} id="input-screen-settings">
          入力画面
        </h3>
        <div className={css(styles, "settings-category-list input-screen-category-list")}>
          <InputScreenLayoutSettings controller={controller} />
          <JapaneseInputScreenSettings controller={controller} />
          <RomajiOtherInputScreenSettings controller={controller} />        </div>
      </section>
  );
}
