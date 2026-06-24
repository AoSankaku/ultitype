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

export function RomajiOtherInputScreenSettings({ controller }: { controller: InputSettingsController }) {
  const { draggedDisplayOrderId, getTargetDisplayElementVisibility, moveTargetDisplayElement, onChange, setDraggedDisplayOrderId, settings, showFuriganaDisplay, showFuriganaMarker, showHiraganaInputProgress, showHiraganaMarker, showKanjiInputProgress, showKanjiMarker, stepTargetDisplayElement, updateFontSize, updateFuriganaFontScale, updateLineHeight, updateMarginBottom, updateProductionLongTextLineCount } = controller;

  return (
    <>
          <section className={css(styles, "settings-subcategory")} aria-labelledby="romaji-input-screen-settings">
            <h4 className={css(styles, "settings-subcategory-title")} id="romaji-input-screen-settings">
              ローマ字
            </h4>
            <div className={css(styles, "settings-subcategory-list")}>
              <section className={css(styles, "settings-row")} aria-labelledby="romaji-marker-setting">
                <div>
                  <h4 id="romaji-marker-setting">ローマ字マーカー</h4>
                  <p>入力中の位置をローマ字表示に下線で表示する。ON推奨</p>
                </div>
                <label className={css(styles, "toggle-control")} aria-label="ローマ字マーカー">
                  <input
                    checked={settings.showRomajiMarker}
                    onChange={(event) =>
                      onChange({ showRomajiMarker: event.currentTarget.checked })
                    }
                    type="checkbox"
                  />
                  <span aria-hidden="true" />
                </label>
              </section>
              <section className={css(styles, "settings-row")} aria-labelledby="romaji-marker-mode-setting">
                <div>
                  <h4 className={css(styles, "font-size-setting")} id="romaji-marker-mode-setting">
                    ローマ字マーカー単位
                  </h4>
                  <p>ローマ字の現在位置を1文字ずつ表示するか、su や shi などの発音単位で表示するかを選ぶ</p>
                </div>
                <div
                  className={css(styles, "marker-mode-segmented")}
                  role="group"
                  aria-label="romaji marker mode"
                >
                  <button
                    aria-pressed={settings.romajiMarkerMode === "character"}
                    className={settings.romajiMarkerMode === "character" ? css(styles, "selected") : ""}
                    onClick={() => onChange({ romajiMarkerMode: "character" })}
                    type="button"
                  >
                    文字単位
                  </button>
                  <button
                    aria-pressed={settings.romajiMarkerMode === "token"}
                    className={settings.romajiMarkerMode === "token" ? css(styles, "selected") : ""}
                    onClick={() => onChange({ romajiMarkerMode: "token" })}
                    type="button"
                  >
                    発音単位
                  </button>
                </div>
              </section>
              <FontSizeSettingRow
                ariaLabel="romaji font size"
                defaultValue={initialSettings.romajiFontSize}
                description="ローマ字の課題文の文字サイズ"
                id="romaji-font-size-setting"
                label="ローマ字フォントサイズ"
                onChange={updateFontSize}
                settingKey="romajiFontSize"
                value={settings.romajiFontSize}
              />
              <TextSpacingSettingRows
                bottomSpacingAriaLabel="romaji bottom spacing"
                bottomSpacingDefaultValue={initialSettings.romajiMarginBottom}
                bottomSpacingDescription="ローマ字行の下に空ける余白"
                bottomSpacingId="romaji-bottom-spacing-setting"
                bottomSpacingKey="romajiMarginBottom"
                bottomSpacingLabel="ローマ字の下余白"
                bottomSpacingValue={settings.romajiMarginBottom}
                lineHeightAriaLabel="romaji line height"
                lineHeightDefaultValue={initialSettings.romajiLineHeight}
                lineHeightDescription="ローマ字行の行間倍率"
                lineHeightId="romaji-line-height-setting"
                lineHeightKey="romajiLineHeight"
                lineHeightLabel="ローマ字の行間"
                lineHeightValue={settings.romajiLineHeight}
                onBottomSpacingChange={updateMarginBottom}
                onLineHeightChange={updateLineHeight}
              />
            </div>
          </section>

          <section className={css(styles, "settings-subcategory")} aria-labelledby="english-space-settings">
            <h4 className={css(styles, "settings-subcategory-title")} id="english-space-settings">
              英文モード
            </h4>
            <div className={css(styles, "settings-subcategory-list")}>
              <section className={css(styles, "settings-row")} aria-labelledby="en-space-display-setting">
                <div>
                  <h4 id="en-space-display-setting">スペース表示</h4>
                  <p>英文モードでスペースを記号として表示する</p>
                </div>
                <div
                  className={css(styles, "romaji-preset-segmented")}
                  role="group"
                  aria-label="スペース表示"
                >
                  <button
                    aria-pressed={settings.enSpaceDisplay === "glyph"}
                    className={settings.enSpaceDisplay === "glyph" ? css(styles, "selected") : ""}
                    onClick={() => onChange({ enSpaceDisplay: "glyph" })}
                    type="button"
                  >
                    {"\u2423"}
                  </button>
                  <button
                    aria-pressed={settings.enSpaceDisplay === "underscore"}
                    className={settings.enSpaceDisplay === "underscore" ? css(styles, "selected") : ""}
                    onClick={() => onChange({ enSpaceDisplay: "underscore" })}
                    type="button"
                  >
                    _
                  </button>
                  <button
                    aria-label="縦長ボックス"
                    aria-pressed={settings.enSpaceDisplay === "box"}
                    className={settings.enSpaceDisplay === "box" ? css(styles, "selected") : ""}
                    onClick={() => onChange({ enSpaceDisplay: "box" })}
                    type="button"
                  >
                    <span aria-hidden="true" className={css(styles, "space-box-preview")} />
                  </button>
                </div>
              </section>
            </div>
          </section>

          <section className={css(styles, "settings-subcategory")} aria-labelledby="other-input-screen-settings">
            <h4 className={css(styles, "settings-subcategory-title")} id="other-input-screen-settings">
              その他の設定
            </h4>
            <div className={css(styles, "settings-subcategory-list")}>
              <section className={css(styles, "settings-row")} aria-labelledby="next-challenge-preview-mode-setting">
                <div>
                  <h4 id="next-challenge-preview-mode-setting">次の課題の表示方式</h4>
                  <p>短文練習で次の課題をどう見せるかを選ぶ</p>
                </div>
                <div
                  className={css(styles, "preview-mode-segmented")}
                  role="group"
                  aria-label="次の課題の表示方式"
                >
                  {nextChallengePreviewModeOptions.map((option) => (
                    <button
                      aria-pressed={settings.nextChallengePreviewMode === option.id}
                      className={settings.nextChallengePreviewMode === option.id ? css(styles, "selected") : ""}
                      key={option.id}
                      onClick={() => onChange({ nextChallengePreviewMode: option.id })}
                      title={option.description}
                      type="button"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </section>
              <NumericSettingRow
                ariaLabel="long text kanji area height"
                defaultValue={initialSettings.productionLongTextLineCount}
                description="本番（IMEなし）の漢字文を表示する行数"
                id="production-long-text-line-count-setting"
                label="長文モードの漢字文エリアの高さ"
                max={12}
                min={3}
                onChange={updateProductionLongTextLineCount}
                step={1}
                unit="行"
                value={settings.productionLongTextLineCount}
              />
              <section className={css(styles, "settings-row")} aria-labelledby="strict-mistake-display-setting">
                <div>
                  <h4 id="strict-mistake-display-setting">正確無比の誤入力表示</h4>
                  <p>誤入力した文字を課題文ローマ字上に表示する方法を選ぶ</p>
                </div>
                <div
                  className={css(styles, "romaji-preset-segmented")}
                  role="group"
                  aria-label="正確無比の誤入力表示"
                >
                  <button
                    aria-pressed={settings.strictMistakeDisplayMode === "overwrite"}
                    className={settings.strictMistakeDisplayMode === "overwrite" ? css(styles, "selected") : ""}
                    onClick={() => onChange({ strictMistakeDisplayMode: "overwrite" })}
                    type="button"
                  >
                    上書き
                  </button>
                  <button
                    aria-pressed={settings.strictMistakeDisplayMode === "insert"}
                    className={settings.strictMistakeDisplayMode === "insert" ? css(styles, "selected") : ""}
                    onClick={() => onChange({ strictMistakeDisplayMode: "insert" })}
                    type="button"
                  >
                    挿入
                  </button>
                  <button
                    aria-pressed={settings.strictMistakeDisplayMode === "none"}
                    className={settings.strictMistakeDisplayMode === "none" ? css(styles, "selected") : ""}
                    onClick={() => onChange({ strictMistakeDisplayMode: "none" })}
                    type="button"
                  >
                    何もしない
                  </button>
                </div>
              </section>
              <section className={css(styles, "settings-row")} aria-labelledby="rank-calculation-mode-setting">
                <div>
                  <h4 id="rank-calculation-mode-setting">ランク算出方式</h4>
                  <p>タイピング中のランク表示に使うスコアの算出方式を選びます。</p>
                </div>
                <div
                  className={css(styles, "rank-calculation-segmented")}
                  role="group"
                  aria-label="ランク算出方式"
                >
                  <button
                    aria-pressed={settings.rankCalculationMode === "projected"}
                    className={settings.rankCalculationMode === "projected" ? css(styles, "selected") : ""}
                    onClick={() => onChange({ rankCalculationMode: "projected" })}
                    type="button"
                  >
                    予測値（変動方式）
                  </button>
                  <button
                    aria-pressed={settings.rankCalculationMode === "actual"}
                    className={settings.rankCalculationMode === "actual" ? css(styles, "selected") : ""}
                    onClick={() => onChange({ rankCalculationMode: "actual" })}
                    type="button"
                  >
                    実値（加点方式）
                  </button>
                </div>
              </section>
            </div>
          </section>
    </>
  );
}
