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

export function JapaneseInputScreenSettings({ controller }: { controller: InputSettingsController }) {
  const { draggedDisplayOrderId, getTargetDisplayElementVisibility, moveTargetDisplayElement, onChange, setDraggedDisplayOrderId, settings, showFuriganaDisplay, showFuriganaMarker, showHiraganaInputProgress, showHiraganaMarker, showKanjiInputProgress, showKanjiMarker, stepTargetDisplayElement, updateFontSize, updateFuriganaFontScale, updateLineHeight, updateMarginBottom, updateProductionLongTextLineCount } = controller;

  return (
    <>
          <section className={css(styles, "settings-subcategory")} aria-labelledby="kanji-input-screen-settings">
            <h4 className={css(styles, "settings-subcategory-title")} id="kanji-input-screen-settings">
              漢字
            </h4>
            <div className={css(styles, "settings-subcategory-list")}>
              <section className={css(styles, "settings-row")} aria-labelledby="kanji-display-setting">
                <div>
                  <h4 id="kanji-display-setting">漢字表示</h4>
                  <p>入力画面に漢字混じりの課題文を表示する</p>
                </div>
                <label className={css(styles, "toggle-control")} aria-label="漢字表示">
                  <input
                    checked={settings.showKanjiDisplay}
                    onChange={(event) =>
                      onChange({
                        showFuriganaDisplay: event.currentTarget.checked
                          ? settings.showFuriganaDisplay
                          : false,
                        showFuriganaMarker: event.currentTarget.checked
                          ? settings.showFuriganaMarker
                          : false,
                        showKanjiDisplay: event.currentTarget.checked,
                        showKanjiMarker: event.currentTarget.checked
                          ? settings.showKanjiMarker
                          : false,
                        showKanjiInputProgress: event.currentTarget.checked
                          ? settings.showKanjiInputProgress
                          : false,
                      })
                    }
                    type="checkbox"
                  />
                  <span aria-hidden="true" />
                </label>
              </section>
              {settings.showKanjiDisplay ? (
                <>
                  <FontSizeSettingRow
                    ariaLabel="kanji font size"
                    defaultValue={initialSettings.kanjiFontSize}
                    description="漢字混じりの課題文の文字サイズ"
                    id="kanji-font-size-setting"
                    label="漢字フォントサイズ"
                    onChange={updateFontSize}
                    settingKey="kanjiFontSize"
                    value={settings.kanjiFontSize}
                  />
                  <TextSpacingSettingRows
                    bottomSpacingAriaLabel="kanji bottom spacing"
                    bottomSpacingDefaultValue={initialSettings.kanjiMarginBottom}
                    bottomSpacingDescription="漢字行の下に空ける余白"
                    bottomSpacingId="kanji-bottom-spacing-setting"
                    bottomSpacingKey="kanjiMarginBottom"
                    bottomSpacingLabel="漢字の下余白"
                    bottomSpacingValue={settings.kanjiMarginBottom}
                    lineHeightAriaLabel="kanji line height"
                    lineHeightDefaultValue={initialSettings.kanjiLineHeight}
                    lineHeightDescription="漢字行の行間倍率"
                    lineHeightId="kanji-line-height-setting"
                    lineHeightKey="kanjiLineHeight"
                    lineHeightLabel="漢字の行間"
                    lineHeightValue={settings.kanjiLineHeight}
                    onBottomSpacingChange={updateMarginBottom}
                    onLineHeightChange={updateLineHeight}
                  />
                  <section className={css(styles, "settings-row")} aria-labelledby="kanji-marker-setting">
                    <div>
                      <h4 id="kanji-marker-setting">漢字マーカー</h4>
                      <p>入力中の位置を漢字表示に下線で表示する</p>
                    </div>
                    <label className={css(styles, "toggle-control")} aria-label="漢字マーカー">
                      <input
                        checked={showKanjiMarker}
                        onChange={(event) =>
                          onChange({ showKanjiMarker: event.currentTarget.checked })
                        }
                        type="checkbox"
                      />
                      <span aria-hidden="true" />
                    </label>
                  </section>
                </>
              ) : null}
            </div>
          </section>

          <section
            className={css(styles, "settings-subcategory")}
            aria-labelledby="kanji-input-progress-screen-settings"
          >
            <h4
              className={css(styles, "settings-subcategory-title")}
              id="kanji-input-progress-screen-settings"
            >
              入力途中経過（漢字）
            </h4>
            <div className={css(styles, "settings-subcategory-list")}>
              <section className={css(styles, "settings-row")} aria-labelledby="kanji-input-progress-setting">
                <div>
                  <h4 id="kanji-input-progress-setting">入力途中経過（漢字）表示</h4>
                  <p>入力済みの途中経過を漢字表示の下に追加する</p>
                </div>
                <label
                  className={css(styles, "toggle-control", settings.showKanjiDisplay ? "" : "locked")}
                  aria-label="入力途中経過（漢字）表示"
                >
                  <input
                    checked={showKanjiInputProgress}
                    disabled={!settings.showKanjiDisplay}
                    onChange={(event) =>
                      onChange({ showKanjiInputProgress: event.currentTarget.checked })
                    }
                    type="checkbox"
                  />
                  <span aria-hidden="true" />
                  {!settings.showKanjiDisplay ? (
                    <b className={css(styles, "toggle-lock-icon")} aria-label="漢字表示オフのためロック">
                      <Lock aria-hidden="true" size={15} strokeWidth={2.6} />
                    </b>
                  ) : null}
                </label>
              </section>
              {showKanjiInputProgress ? (
                <>
                  <FontSizeSettingRow
                    ariaLabel="kanji input progress font size"
                    defaultValue={initialSettings.kanjiInputProgressFontSize}
                    description="入力途中経過（漢字）の文字サイズ"
                    id="kanji-input-progress-font-size-setting"
                    label="入力途中経過（漢字）フォントサイズ"
                    onChange={updateFontSize}
                    settingKey="kanjiInputProgressFontSize"
                    value={settings.kanjiInputProgressFontSize}
                  />
                  <TextSpacingSettingRows
                    bottomSpacingAriaLabel="kanji input progress bottom spacing"
                    bottomSpacingDefaultValue={initialSettings.kanjiInputProgressMarginBottom}
                    bottomSpacingDescription="入力途中経過（漢字）の下に空ける余白"
                    bottomSpacingId="kanji-input-progress-bottom-spacing-setting"
                    bottomSpacingKey="kanjiInputProgressMarginBottom"
                    bottomSpacingLabel="入力途中経過（漢字）の下余白"
                    bottomSpacingValue={settings.kanjiInputProgressMarginBottom}
                    lineHeightAriaLabel="kanji input progress line height"
                    lineHeightDefaultValue={initialSettings.kanjiInputProgressLineHeight}
                    lineHeightDescription="入力途中経過（漢字）の行間倍率"
                    lineHeightId="kanji-input-progress-line-height-setting"
                    lineHeightKey="kanjiInputProgressLineHeight"
                    lineHeightLabel="入力途中経過（漢字）の行間"
                    lineHeightValue={settings.kanjiInputProgressLineHeight}
                    onBottomSpacingChange={updateMarginBottom}
                    onLineHeightChange={updateLineHeight}
                  />
                </>
              ) : null}
            </div>
          </section>

          <section
            className={css(styles, "settings-subcategory")}
            aria-labelledby="furigana-input-screen-settings"
          >
            <h4 className={css(styles, "settings-subcategory-title")} id="furigana-input-screen-settings">
              ふりがな
            </h4>
            <div className={css(styles, "settings-subcategory-list")}>
              <section className={css(styles, "settings-row")} aria-labelledby="furigana-display-setting">
                <div>
                  <h4 id="furigana-display-setting">ふりがな表示</h4>
                  <p>漢字混じりの課題文の上にふりがなを表示する</p>
                </div>
                <label
                  className={css(styles, "toggle-control", settings.showKanjiDisplay ? "" : "locked")}
                  aria-label="ふりがな表示"
                >
                  <input
                    checked={showFuriganaDisplay}
                    disabled={!settings.showKanjiDisplay}
                    onChange={(event) =>
                      onChange({
                        showFuriganaDisplay: event.currentTarget.checked,
                        showFuriganaMarker: event.currentTarget.checked
                          ? settings.showFuriganaMarker
                          : false,
                      })
                    }
                    type="checkbox"
                  />
                  <span aria-hidden="true" />
                  {!settings.showKanjiDisplay ? (
                    <b className={css(styles, "toggle-lock-icon")} aria-label="漢字表示オフのためロック">
                      <Lock aria-hidden="true" size={15} strokeWidth={2.6} />
                    </b>
                  ) : null}
                </label>
              </section>
              {showFuriganaDisplay ? (
                <>
                  <FontScaleSettingRow
                    disabled={false}
                    onChange={updateFuriganaFontScale}
                    value={settings.furiganaFontScale}
                  />
                  <TextSpacingSettingRows
                    bottomSpacingAriaLabel="furigana bottom spacing"
                    bottomSpacingDefaultValue={initialSettings.furiganaMarginBottom}
                    bottomSpacingDescription="ふりがな側に追加する下余白"
                    bottomSpacingId="furigana-bottom-spacing-setting"
                    bottomSpacingKey="furiganaMarginBottom"
                    bottomSpacingLabel="ふりがなの下余白"
                    bottomSpacingValue={settings.furiganaMarginBottom}
                    lineHeightAriaLabel="furigana line height"
                    lineHeightDefaultValue={initialSettings.furiganaLineHeight}
                    lineHeightDescription="ふりがなの行間倍率"
                    lineHeightId="furigana-line-height-setting"
                    lineHeightKey="furiganaLineHeight"
                    lineHeightLabel="ふりがなの行間"
                    lineHeightValue={settings.furiganaLineHeight}
                    onBottomSpacingChange={updateMarginBottom}
                    onLineHeightChange={updateLineHeight}
                  />
                  <section className={css(styles, "settings-row")} aria-labelledby="furigana-marker-setting">
                    <div>
                      <h4 id="furigana-marker-setting">ふりがなマーカー</h4>
                      <p>入力中の位置をふりがな表示に下線で表示する</p>
                    </div>
                    <label className={css(styles, "toggle-control")} aria-label="ふりがなマーカー">
                      <input
                        checked={showFuriganaMarker}
                        onChange={(event) =>
                          onChange({ showFuriganaMarker: event.currentTarget.checked })
                        }
                        type="checkbox"
                      />
                      <span aria-hidden="true" />
                    </label>
                  </section>
                </>
              ) : null}
            </div>
          </section>

          <section
            className={css(styles, "settings-subcategory")}
            aria-labelledby="hiragana-input-screen-settings"
          >
            <h4 className={css(styles, "settings-subcategory-title")} id="hiragana-input-screen-settings">
              ひらがな
            </h4>
            <div className={css(styles, "settings-subcategory-list")}>
              <section className={css(styles, "settings-row")} aria-labelledby="hiragana-display-setting">
                <div>
                  <h4 id="hiragana-display-setting">ひらがな表示</h4>
                  <p>入力画面にひらがなの読みを表示する</p>
                </div>
                <label className={css(styles, "toggle-control")} aria-label="ひらがな表示">
                  <input
                    checked={settings.showHiraganaDisplay}
                    onChange={(event) =>
                      onChange({
                        showHiraganaDisplay: event.currentTarget.checked,
                        showHiraganaMarker: event.currentTarget.checked
                          ? settings.showHiraganaMarker
                          : false,
                        showHiraganaInputProgress: event.currentTarget.checked
                          ? settings.showHiraganaInputProgress
                          : false,
                      })
                    }
                    type="checkbox"
                  />
                  <span aria-hidden="true" />
                </label>
              </section>
              {settings.showHiraganaDisplay ? (
                <>
                  <FontSizeSettingRow
                    ariaLabel="hiragana font size"
                    defaultValue={initialSettings.hiraganaFontSize}
                    description="ひらがなの読みの文字サイズ"
                    id="hiragana-font-size-setting"
                    label="ひらがなフォントサイズ"
                    onChange={updateFontSize}
                    settingKey="hiraganaFontSize"
                    value={settings.hiraganaFontSize}
                  />
                  <TextSpacingSettingRows
                    bottomSpacingAriaLabel="hiragana bottom spacing"
                    bottomSpacingDefaultValue={initialSettings.hiraganaMarginBottom}
                    bottomSpacingDescription="ひらがな行の下に空ける余白"
                    bottomSpacingId="hiragana-bottom-spacing-setting"
                    bottomSpacingKey="hiraganaMarginBottom"
                    bottomSpacingLabel="ひらがなの下余白"
                    bottomSpacingValue={settings.hiraganaMarginBottom}
                    lineHeightAriaLabel="hiragana line height"
                    lineHeightDefaultValue={initialSettings.hiraganaLineHeight}
                    lineHeightDescription="ひらがな行の行間倍率"
                    lineHeightId="hiragana-line-height-setting"
                    lineHeightKey="hiraganaLineHeight"
                    lineHeightLabel="ひらがなの行間"
                    lineHeightValue={settings.hiraganaLineHeight}
                    onBottomSpacingChange={updateMarginBottom}
                    onLineHeightChange={updateLineHeight}
                  />
                  <section className={css(styles, "settings-row")} aria-labelledby="hiragana-marker-setting">
                    <div>
                      <h4 id="hiragana-marker-setting">ひらがなマーカー</h4>
                      <p>入力中の位置をひらがな表示に下線で表示する</p>
                    </div>
                    <label className={css(styles, "toggle-control")} aria-label="ひらがなマーカー">
                      <input
                        checked={showHiraganaMarker}
                        onChange={(event) =>
                          onChange({ showHiraganaMarker: event.currentTarget.checked })
                        }
                        type="checkbox"
                      />
                      <span aria-hidden="true" />
                    </label>
                  </section>
                </>
              ) : null}
            </div>
          </section>

          <section
            className={css(styles, "settings-subcategory")}
            aria-labelledby="hiragana-input-progress-screen-settings"
          >
            <h4
              className={css(styles, "settings-subcategory-title")}
              id="hiragana-input-progress-screen-settings"
            >
              入力途中経過（ひらがな）
            </h4>
            <div className={css(styles, "settings-subcategory-list")}>
              <section className={css(styles, "settings-row")} aria-labelledby="hiragana-input-progress-setting">
                <div>
                  <h4 id="hiragana-input-progress-setting">入力途中経過（ひらがな）表示</h4>
                  <p>入力済みの途中経過をひらがな表示の下に追加する</p>
                </div>
                <label
                  className={css(styles, "toggle-control", settings.showHiraganaDisplay ? "" : "locked")}
                  aria-label="入力途中経過（ひらがな）表示"
                >
                  <input
                    checked={showHiraganaInputProgress}
                    disabled={!settings.showHiraganaDisplay}
                    onChange={(event) =>
                      onChange({ showHiraganaInputProgress: event.currentTarget.checked })
                    }
                    type="checkbox"
                  />
                  <span aria-hidden="true" />
                  {!settings.showHiraganaDisplay ? (
                    <b className={css(styles, "toggle-lock-icon")} aria-label="ひらがな表示オフのためロック">
                      <Lock aria-hidden="true" size={15} strokeWidth={2.6} />
                    </b>
                  ) : null}
                </label>
              </section>
              {showHiraganaInputProgress ? (
                <>
                  <FontSizeSettingRow
                    ariaLabel="hiragana input progress font size"
                    defaultValue={initialSettings.hiraganaInputProgressFontSize}
                    description="入力途中経過（ひらがな）の文字サイズ"
                    id="hiragana-input-progress-font-size-setting"
                    label="入力途中経過（ひらがな）フォントサイズ"
                    onChange={updateFontSize}
                    settingKey="hiraganaInputProgressFontSize"
                    value={settings.hiraganaInputProgressFontSize}
                  />
                  <TextSpacingSettingRows
                    bottomSpacingAriaLabel="hiragana input progress bottom spacing"
                    bottomSpacingDefaultValue={initialSettings.hiraganaInputProgressMarginBottom}
                    bottomSpacingDescription="入力途中経過（ひらがな）の下に空ける余白"
                    bottomSpacingId="hiragana-input-progress-bottom-spacing-setting"
                    bottomSpacingKey="hiraganaInputProgressMarginBottom"
                    bottomSpacingLabel="入力途中経過（ひらがな）の下余白"
                    bottomSpacingValue={settings.hiraganaInputProgressMarginBottom}
                    lineHeightAriaLabel="hiragana input progress line height"
                    lineHeightDefaultValue={initialSettings.hiraganaInputProgressLineHeight}
                    lineHeightDescription="入力途中経過（ひらがな）の行間倍率"
                    lineHeightId="hiragana-input-progress-line-height-setting"
                    lineHeightKey="hiraganaInputProgressLineHeight"
                    lineHeightLabel="入力途中経過（ひらがな）の行間"
                    lineHeightValue={settings.hiraganaInputProgressLineHeight}
                    onBottomSpacingChange={updateMarginBottom}
                    onLineHeightChange={updateLineHeight}
                  />
                </>
              ) : null}
            </div>
          </section>
    </>
  );
}
