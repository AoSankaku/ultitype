"use client";

import { specialRomajiVariantOptions, standardRomajiVariantOptions, sokuonInputOptions, type SokuonInputId } from "@/src/lib/typing";
import { css } from "../../_lib/css-module";
import styles from "../SettingsScreen.module.css";

import type { InputSettingsController } from "./controller";

export function InputMethodSettingsSection({ controller }: { controller: InputSettingsController }) {
  const { getRomajiSelection, getSpecialRomajiSelection, onChange, preferRomaji, preferSokuon, preferSpecialRomaji, settings, toggleRomajiAccepted, toggleSokuonAccepted, toggleSpecialRomajiAccepted, updateSpecialRomajiPreset } = controller;

  return (
      <section className={css(styles, "settings-category")} aria-labelledby="input-settings">
        <h3 className={css(styles, "settings-category-title")} id="input-settings">
          入力方式
        </h3>
        <div className={css(styles, "settings-category-list")}>
          <section
            className={css(styles, "settings-row romaji-method-row")}
            aria-labelledby="romaji-method-setting"
          >
            <div>
              <h4 id="romaji-method-setting">ローマ字入力法</h4>
              <p>許容する派生と、ガイドで優先表示する表記を選ぶ</p>
            </div>
            <div className={css(styles, "romaji-method-controls")}>
              <div className={css(styles, "romaji-preset-segmented")} role="group" aria-label="ローマ字入力法">
                <button
                  aria-pressed={settings.romajiInputPreset === "hepburn"}
                  className={settings.romajiInputPreset === "hepburn" ? css(styles, "selected") : ""}
                  onClick={() => onChange({ romajiInputPreset: "hepburn" })}
                  type="button"
                >
                  ヘボン式優先
                </button>
                <button
                  aria-pressed={settings.romajiInputPreset === "shortest"}
                  className={settings.romajiInputPreset === "shortest" ? css(styles, "selected") : ""}
                  onClick={() => onChange({ romajiInputPreset: "shortest" })}
                  type="button"
                >
                  最短優先
                </button>
                <button
                  aria-pressed={settings.romajiInputPreset === "custom"}
                  className={settings.romajiInputPreset === "custom" ? css(styles, "selected") : ""}
                  onClick={() => onChange({ romajiInputPreset: "custom" })}
                  type="button"
                >
                  個別設定
                </button>
              </div>

              {settings.romajiInputPreset === "custom" ? (
                <div className={css(styles, "romaji-custom-list")}>
                  {standardRomajiVariantOptions.map((option) => {
                    const selection = getRomajiSelection(option);

                    return (
                      <div className={css(styles, "romaji-custom-item")} key={option.id}>
                        <span>{option.label}</span>
                        <div className={css(styles, "romaji-choice-list")}>
                          {option.alternatives.map((alternative) => (
                            <label key={alternative}>
                              <input
                                checked={selection.accepted.includes(alternative)}
                                onChange={(event) =>
                                  toggleRomajiAccepted(
                                    option,
                                    alternative,
                                    event.currentTarget.checked,
                                  )
                                }
                                type="checkbox"
                              />
                              {alternative}
                            </label>
                          ))}
                        </div>
                        <label className={css(styles, "romaji-preferred-select")}>
                          <span>表示</span>
                          <select
                            onChange={(event) => preferRomaji(option, event.currentTarget.value)}
                            value={selection.preferred}
                          >
                            {option.alternatives.map((alternative) => (
                              <option key={alternative} value={alternative}>
                                {alternative}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </section>

          <section className={css(styles, "settings-row sokuon-method-row")} aria-labelledby="sokuon-setting">
            <div>
              <h4 id="sokuon-setting">促音入力</h4>
              <p>「っ」の子音重複と ltsu / xtsu / ltu / xtu の扱いを選ぶ</p>
            </div>
            <div className={css(styles, "sokuon-setting-controls")}>
              <label className={css(styles, "sokuon-split-toggle")}>
                <span>促音分割を許可</span>
                <span className={css(styles, "toggle-control")}>
                  <input
                    checked={settings.sokuonInput.allowSplit}
                    onChange={(event) =>
                      onChange({
                        sokuonInput: {
                          ...settings.sokuonInput,
                          allowSplit: event.currentTarget.checked,
                        },
                      })
                    }
                    type="checkbox"
                  />
                  <span aria-hidden="true" />
                </span>
              </label>
              <div className={css(styles, "romaji-choice-list")} aria-label="促音入力候補">
                {sokuonInputOptions.map((option) => (
                  <label key={option}>
                    <input
                      checked={settings.sokuonInput.accepted.includes(option)}
                      onChange={(event) => toggleSokuonAccepted(option, event.currentTarget.checked)}
                      type="checkbox"
                    />
                    {option}
                  </label>
                ))}
              </div>
              <label className={css(styles, "romaji-preferred-select")}>
                <span>表示</span>
                <select
                  onChange={(event) => preferSokuon(event.currentTarget.value as SokuonInputId)}
                  value={settings.sokuonInput.preferred}
                >
                  {sokuonInputOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className={css(styles, "settings-row")} aria-labelledby="split-yoon-setting">
            <div>
              <h4 id="split-yoon-setting">一般拗音分割入力</h4>
              <p>「きゃ」を kya だけでなく kila / kixa でも入力できるようにする</p>
            </div>
            <label className={css(styles, "toggle-control")}>
              <input
                checked={settings.allowSplitYoon}
                onChange={(event) => onChange({ allowSplitYoon: event.currentTarget.checked })}
                type="checkbox"
              />
              <span aria-hidden="true" />
            </label>
          </section>

          <section className={css(styles, "settings-row")} aria-labelledby="special-yoon-method-setting">
            <div>
              <h4 id="special-yoon-method-setting">特殊拗音入力法</h4>
              <p>出現頻度の低い外来語カナを統合形で打つか、分割形で打つかを選ぶ</p>
            </div>
            <div className={css(styles, "romaji-method-controls")}>
              <div className={css(styles, "romaji-preset-segmented")} role="group" aria-label="特殊拗音入力法">
                <button
                  aria-pressed={settings.specialRomajiInputPreset === "split"}
                  className={settings.specialRomajiInputPreset === "split" ? css(styles, "selected") : ""}
                  onClick={() => updateSpecialRomajiPreset("split")}
                  type="button"
                >
                  すべて分割
                </button>
                <button
                  aria-pressed={settings.specialRomajiInputPreset === "integrated"}
                  className={settings.specialRomajiInputPreset === "integrated" ? css(styles, "selected") : ""}
                  onClick={() => updateSpecialRomajiPreset("integrated")}
                  type="button"
                >
                  すべて統合
                </button>
                <button
                  aria-pressed={settings.specialRomajiInputPreset === "custom"}
                  className={settings.specialRomajiInputPreset === "custom" ? css(styles, "selected") : ""}
                  onClick={() => updateSpecialRomajiPreset("custom")}
                  type="button"
                >
                  個別設定
                </button>
              </div>

              {settings.specialRomajiInputPreset === "custom" ? (
                <div className={css(styles, "romaji-custom-list")}>
                  {specialRomajiVariantOptions.map((option) => {
                    const selection = getSpecialRomajiSelection(option);

                    return (
                      <div className={css(styles, "romaji-custom-item")} key={option.id}>
                        <span>{option.label}</span>
                        <div className={css(styles, "romaji-choice-list")}>
                          {option.alternatives.map((alternative) => (
                            <label key={alternative}>
                              <input
                                checked={selection.accepted.includes(alternative)}
                                onChange={(event) =>
                                  toggleSpecialRomajiAccepted(
                                    option,
                                    alternative,
                                    event.currentTarget.checked,
                                  )
                                }
                                type="checkbox"
                              />
                              {alternative}
                            </label>
                          ))}
                        </div>
                        <label className={css(styles, "romaji-preferred-select")}>
                          <span>表示</span>
                          <select
                            onChange={(event) =>
                              preferSpecialRomaji(option, event.currentTarget.value)
                            }
                            value={selection.preferred}
                          >
                            {option.alternatives.map((alternative) => (
                              <option key={alternative} value={alternative}>
                                {alternative}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </section>
  );
}
