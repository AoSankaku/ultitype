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
import type { InputSettingsController } from "./controller";

export function InputScreenLayoutSettings({ controller }: { controller: InputSettingsController }) {
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
              フォント
            </h4>
            <div className={css(styles, "settings-subcategory-list")}>
              <FontFamilySettingRow
                ariaLabel="Japanese font family"
                description="漢字・ふりがな・ひらがな表示に使うGoogle Fonts"
                id="japanese-font-family-setting"
                label="日本語フォント"
                onChange={(value) =>
                  onChange({
                    japaneseFontFamily: value as AppSettings["japaneseFontFamily"],
                  })
                }
                options={japaneseFontFamilyOptions}
                value={settings.japaneseFontFamily}
              />
              <FontFamilySettingRow
                ariaLabel="English font family"
                description="ローマ字・英語課題文に使うGoogle Fonts"
                id="english-font-family-setting"
                label="英語フォント"
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
              表示順
            </h4>
            <div className={css(styles, "settings-subcategory-list")}>
              <section
                className={css(styles, "settings-row target-display-order-row")}
                aria-labelledby="target-display-order-setting"
              >
                <div>
                  <h4 id="target-display-order-setting">入力画面の表示順</h4>
                  <p>ドラッグで入力画面の行順を変更する。非表示中の項目も順序を保持する</p>
                </div>
                <div className={css(styles, "target-display-order-list")} aria-label="target display order">
                  {settings.targetDisplayOrder.map((id) => {
                    const option = targetDisplayElementOptions.find((item) => item.id === id);
                    if (!option) {
                      return null;
                    }

                    const isVisible = getTargetDisplayElementVisibility(id);

                    return (
                      <div
                        aria-label={`${option.label} display order item`}
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
                        <span>{option.label}</span>
                        <small>{isVisible ? "表示中" : "非表示中"}</small>
                        <div className={css(styles, "target-display-order-buttons")}>
                          <button
                            aria-label={`${option.label} を上へ移動`}
                            disabled={settings.targetDisplayOrder.indexOf(id) === 0}
                            onClick={() => stepTargetDisplayElement(id, -1)}
                            type="button"
                          >
                            <ChevronUp size={16} />
                          </button>
                          <button
                            aria-label={`${option.label} を下へ移動`}
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
