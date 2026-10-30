"use client";

import { useI18n } from "../../_lib/i18n";

import { ChevronDown, ChevronUp, Lock } from "lucide-react";
import { englishFontFamilyOptions, initialSettings, japaneseFontFamilyOptions, targetDisplayElementOptions } from "../../_lib/constants";
import { css } from "../../_lib/css-module";
import type { AppSettings } from "../../_lib/types";
import styles from "../SettingsScreen.module.css";
import { FontFamilySettingRow, FontScaleSettingRow, FontSizeSettingRow } from "./font-setting-rows";
import { NumericSettingRow } from "./number-control";
import { TextSpacingSettingRows } from "./text-spacing-setting-rows";
import { nextChallengePreviewModeOptions } from "./types";
import type { InputSettingsController } from "./controller";

export function InputScreenLayoutSettings({ controller }: { controller: InputSettingsController }) {
  const { t } = useI18n();
  const { draggedDisplayOrderId, getTargetDisplayElementVisibility, moveTargetDisplayElement, onChange, setDraggedDisplayOrderId, settings, showFuriganaDisplay, showFuriganaMarker, showHiraganaInputProgress, showHiraganaMarker, showKanjiInputProgress, showKanjiMarker, stepTargetDisplayElement, updateFontSize, updateFuriganaFontScale, updateLineHeight, updateMarginBottom, updateProductionLongTextLineCount } = controller;

  return (
    <>
          <section
            className={css(styles, "settings-subcategory")}
            aria-labelledby="font-family-input-screen-settings"
          >
            <h4
              className={css(styles, "settings-subcategory-title")}
              id="font-family-input-screen-settings"
            >
              {t("フォント")}
            </h4>
            <div className={css(styles, "settings-subcategory-list")}>
              <FontFamilySettingRow
                ariaLabel={t("日本語フォント")}
                description={t("漢字・ふりがな・ひらがな表示に使うGoogle Fonts")}
                id="japanese-font-family-setting"
                label={t("日本語フォント")}
                onChange={(value) =>
                  onChange({
                    japaneseFontFamily: value as AppSettings["japaneseFontFamily"],
                  })
                }
                options={japaneseFontFamilyOptions}
                value={settings.japaneseFontFamily}
              />
              <FontFamilySettingRow
                ariaLabel={t("英語フォント")}
                description={t("ローマ字・英語課題文に使うGoogle Fonts")}
                id="english-font-family-setting"
                label={t("英語フォント")}
                onChange={(value) =>
                  onChange({
                    englishFontFamily: value as AppSettings["englishFontFamily"],
                  })
                }
                options={englishFontFamilyOptions}
                value={settings.englishFontFamily}
              />
            </div>
          </section>

          <section
            className={css(styles, "settings-subcategory")}
            aria-labelledby="target-display-order-input-screen-settings"
          >
            <h4
              className={css(styles, "settings-subcategory-title")}
              id="target-display-order-input-screen-settings"
            >
              {t("表示順")}
            </h4>
            <div className={css(styles, "settings-subcategory-list")}>
              <section
                className={css(styles, "settings-row target-display-order-row")}
                aria-labelledby="target-display-order-setting"
              >
                <div>
                  <h4 id="target-display-order-setting">{t("入力画面の表示順")}</h4>
                  <p>{t("ドラッグで入力画面の行順を変更する。非表示中の項目も順序を保持する")}</p>
                </div>
                <div className={css(styles, "target-display-order-list")} aria-label={t("入力画面の表示順")}>
                  {settings.targetDisplayOrder.map((id) => {
                    const option = targetDisplayElementOptions.find((item) => item.id === id);
                    if (!option) {
                      return null;
                    }

                    const isVisible = getTargetDisplayElementVisibility(id);

                    return (
                      <div
                        aria-label={t("{label} display order item", { label: t(option.label) })}
                        className={css(
                          styles,
                          "target-display-order-item",
                          isVisible ? "" : "hidden-item",
                          draggedDisplayOrderId === id && "dragging",
                        )}
                        draggable
                        key={id}
                        onDragEnd={() => setDraggedDisplayOrderId(null)}
                        onDragOver={(event) => event.preventDefault()}
                        onDragStart={() => setDraggedDisplayOrderId(id)}
                        onDrop={(event) => {
                          event.preventDefault();
                          if (draggedDisplayOrderId) {
                            moveTargetDisplayElement(draggedDisplayOrderId, id);
                          }
                          setDraggedDisplayOrderId(null);
                        }}
                      >
                        <span className={css(styles, "target-display-drag-handle")} aria-hidden="true">
                          ⋮⋮
                        </span>
                        <span>{t(option.label)}</span>
                        <small>{isVisible ? t("表示中") : t("非表示中")}</small>
                        <div className={css(styles, "target-display-order-buttons")}>
                          <button
                            aria-label={t("{label} を上へ移動", { label: t(option.label) })}
                            disabled={settings.targetDisplayOrder.indexOf(id) === 0}
                            onClick={() => stepTargetDisplayElement(id, -1)}
                            type="button"
                          >
                            <ChevronUp size={16} />
                          </button>
                          <button
                            aria-label={t("{label} を下へ移動", { label: t(option.label) })}
                            disabled={settings.targetDisplayOrder.indexOf(id) === settings.targetDisplayOrder.length - 1}
                            onClick={() => stepTargetDisplayElement(id, 1)}
                            type="button"
                          >
                            <ChevronDown size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          </section>
    </>
  );
}
