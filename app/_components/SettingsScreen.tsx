"use client";

import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Moon,
  Settings,
  Sun,
  Trash2,
} from "lucide-react";
import {
  romajiVariantOptions,
  sokuonInputOptions,
  type RomajiVariantOption,
  type SokuonInputId,
} from "@/src/lib/typing";
import { clampInteger } from "../_lib/challenge-utils";
import { useChromeActiveTabMuted, useTypingSounds } from "../_lib/typing-sounds";
import type { AppSettings } from "../_lib/types";

type SettingsScreenProps = {
  browserTabMuted?: boolean | null;
  settings: AppSettings;
  onBack: () => void;
  onChange: (settings: Partial<AppSettings>) => void;
  onClearLocalData: () => void;
};

export function SettingsScreen({
  browserTabMuted,
  settings,
  onBack,
  onChange,
  onClearLocalData,
}: SettingsScreenProps) {
  const playTypingSound = useTypingSounds(settings);
  const detectedBrowserTabMuted = useChromeActiveTabMuted();
  const soundControlsDisabled = browserTabMuted ?? detectedBrowserTabMuted ?? false;

  function handleBack() {
    playTypingSound("back");
    onBack();
  }

  function getRomajiSelection(option: RomajiVariantOption) {
    return (
      settings.romajiInputSelections[option.id] ?? {
        accepted: option.alternatives,
        preferred: option.hepburn,
      }
    );
  }

  function updateRomajiSelection(
    option: RomajiVariantOption,
    selection: { accepted: string[]; preferred: string },
  ) {
    onChange({
      romajiInputSelections: {
        ...settings.romajiInputSelections,
        [option.id]: selection,
      },
    });
  }

  function toggleRomajiAccepted(option: RomajiVariantOption, value: string, checked: boolean) {
    const selection = getRomajiSelection(option);
    const accepted = checked
      ? Array.from(new Set([...selection.accepted, value]))
      : selection.accepted.filter((candidate) => candidate !== value);

    if (accepted.length === 0) {
      return;
    }

    updateRomajiSelection(option, {
      accepted,
      preferred: accepted.includes(selection.preferred) ? selection.preferred : accepted[0],
    });
  }

  function preferRomaji(option: RomajiVariantOption, preferred: string) {
    const selection = getRomajiSelection(option);
    updateRomajiSelection(option, {
      accepted: selection.accepted.includes(preferred)
        ? selection.accepted
        : [...selection.accepted, preferred],
      preferred,
    });
  }

  function toggleSokuonAccepted(value: SokuonInputId, checked: boolean) {
    const accepted = checked
      ? Array.from(new Set([...settings.sokuonInput.accepted, value]))
      : settings.sokuonInput.accepted.filter((candidate) => candidate !== value);

    if (accepted.length === 0) {
      return;
    }

    onChange({
      sokuonInput: {
        ...settings.sokuonInput,
        accepted,
        preferred: accepted.includes(settings.sokuonInput.preferred)
          ? settings.sokuonInput.preferred
          : accepted[0],
      },
    });
  }

  function preferSokuon(preferred: SokuonInputId) {
    onChange({
      sokuonInput: {
        ...settings.sokuonInput,
        accepted: settings.sokuonInput.accepted.includes(preferred)
          ? settings.sokuonInput.accepted
          : [...settings.sokuonInput.accepted, preferred],
        preferred,
      },
    });
  }

  function updateIdleRetireSeconds(nextValue: number) {
    onChange({
      idleRetireSeconds: Math.min(120, Math.max(0, nextValue)),
    });
  }

  function updateSoundVolume(nextValue: string) {
    onChange({
      soundVolume: clampInteger(nextValue, 0, 100) / 100,
    });
  }

  function handleClearLocalData() {
    if (window.confirm("ローカルデータをすべて削除します。よろしいですか？")) {
      onClearLocalData();
    }
  }

  return (
    <section className="settings-screen" aria-label="settings">
      <div className="settings-head">
        <div>
          <div className="panel-heading">
            <Settings size={18} />
            <span>Settings</span>
          </div>
          <h2>設定</h2>
        </div>
        <button className="icon-button" onClick={handleBack} title="戻る" type="button">
          <ArrowLeft size={18} />
        </button>
      </div>

      <div className="settings-list">
        <section className="settings-category" aria-labelledby="screen-settings">
          <h3 className="settings-category-title" id="screen-settings">
            画面
          </h3>
          <div className="settings-category-list">
            <section className="settings-row" aria-labelledby="theme-setting">
              <div>
                <h4 id="theme-setting">テーマ</h4>
                <p>表示テーマを切り替える</p>
              </div>
              <div className="theme-segmented" role="group" aria-label="theme">
                <button
                  aria-pressed={settings.theme === "dark"}
                  className={settings.theme === "dark" ? "selected" : ""}
                  onClick={() => onChange({ theme: "dark" })}
                  type="button"
                >
                  <Moon size={17} />
                  Dark
                </button>
                <button
                  aria-pressed={settings.theme === "light"}
                  className={settings.theme === "light" ? "selected" : ""}
                  onClick={() => onChange({ theme: "light" })}
                  type="button"
                >
                  <Sun size={17} />
                  Light
                </button>
              </div>
            </section>

            <section className="settings-row" aria-labelledby="speed-display-setting">
              <div>
                <h4 id="speed-display-setting">速度表示</h4>
                <p>練習中に表示する速度の単位を切り替える</p>
              </div>
              <div className="theme-segmented" role="group" aria-label="速度表示">
                <button
                  aria-pressed={settings.speedDisplayUnit === "keysPerSecond"}
                  className={settings.speedDisplayUnit === "keysPerSecond" ? "selected" : ""}
                  onClick={() => onChange({ speedDisplayUnit: "keysPerSecond" })}
                  type="button"
                >
                  打鍵/秒
                </button>
                <button
                  aria-pressed={settings.speedDisplayUnit === "keysPerMinute"}
                  className={settings.speedDisplayUnit === "keysPerMinute" ? "selected" : ""}
                  onClick={() => onChange({ speedDisplayUnit: "keysPerMinute" })}
                  type="button"
                >
                  打鍵/分
                </button>
              </div>
            </section>

            <section className="settings-row" aria-labelledby="romaji-space-setting">
              <div>
                <h4 id="romaji-space-setting">日本語ローマ字のスペース</h4>
                <p>ローマ字ガイドの単語間スペースを表示する</p>
              </div>
              <label className="toggle-control">
                <input
                  checked={settings.showRomajiWordSpaces}
                  onChange={(event) =>
                    onChange({ showRomajiWordSpaces: event.currentTarget.checked })
                  }
                  type="checkbox"
                />
                <span aria-hidden="true" />
              </label>
            </section>
          </div>
        </section>

        <section className="settings-category" aria-labelledby="sound-settings">
          <h3 className="settings-category-title" id="sound-settings">
            サウンド
          </h3>
          <div className="settings-category-list">
            <section className="settings-row sound-settings-row" aria-labelledby="sound-setting">
              <div>
                <h4 id="sound-setting">サウンド</h4>
                <p>タイプ音とUI/結果音の音量、カテゴリ別のON/OFFを調整します。</p>
              </div>
              <div className="sound-settings-controls" aria-disabled={soundControlsDisabled}>
                <label className="sound-volume-control">
                  <span>音量</span>
                  <input
                    aria-label="音量"
                    disabled={soundControlsDisabled}
                    max={100}
                    min={0}
                    onChange={(event) => updateSoundVolume(event.currentTarget.value)}
                    step={1}
                    type="range"
                    value={Math.round(settings.soundVolume * 100)}
                  />
                  <strong>{Math.round(settings.soundVolume * 100)}%</strong>
                </label>
                <div className="sound-toggle-list">
                  <label className="sound-toggle-item">
                    <span>タイプ音</span>
                    <span className="toggle-control">
                      <input
                        checked={settings.typingSoundEnabled}
                        disabled={soundControlsDisabled}
                        onChange={(event) =>
                          onChange({ typingSoundEnabled: event.currentTarget.checked })
                        }
                        type="checkbox"
                      />
                      <span aria-hidden="true" />
                    </span>
                  </label>
                  <label className="sound-toggle-item">
                    <span>UI/結果音</span>
                    <span className="toggle-control">
                      <input
                        checked={settings.uiSoundEnabled}
                        disabled={soundControlsDisabled}
                        onChange={(event) =>
                          onChange({ uiSoundEnabled: event.currentTarget.checked })
                        }
                        type="checkbox"
                      />
                      <span aria-hidden="true" />
                    </span>
                  </label>
                </div>
              </div>
            </section>
          </div>
        </section>

        <section className="settings-category" aria-labelledby="input-settings">
          <h3 className="settings-category-title" id="input-settings">
            入力方式
          </h3>
          <div className="settings-category-list">
            <section
              className="settings-row romaji-method-row"
              aria-labelledby="romaji-method-setting"
            >
              <div>
                <h4 id="romaji-method-setting">ローマ字入力法</h4>
                <p>許容する派生と、ガイドで優先表示する表記を選ぶ</p>
              </div>
              <div className="romaji-method-controls">
                <div className="romaji-preset-segmented" role="group" aria-label="ローマ字入力法">
                  <button
                    aria-pressed={settings.romajiInputPreset === "hepburn"}
                    className={settings.romajiInputPreset === "hepburn" ? "selected" : ""}
                    onClick={() => onChange({ romajiInputPreset: "hepburn" })}
                    type="button"
                  >
                    ヘボン式優先
                  </button>
                  <button
                    aria-pressed={settings.romajiInputPreset === "shortest"}
                    className={settings.romajiInputPreset === "shortest" ? "selected" : ""}
                    onClick={() => onChange({ romajiInputPreset: "shortest" })}
                    type="button"
                  >
                    最短優先
                  </button>
                  <button
                    aria-pressed={settings.romajiInputPreset === "custom"}
                    className={settings.romajiInputPreset === "custom" ? "selected" : ""}
                    onClick={() => onChange({ romajiInputPreset: "custom" })}
                    type="button"
                  >
                    個別設定
                  </button>
                </div>

                {settings.romajiInputPreset === "custom" ? (
                  <div className="romaji-custom-list">
                    {romajiVariantOptions.map((option) => {
                      const selection = getRomajiSelection(option);

                      return (
                        <div className="romaji-custom-item" key={option.id}>
                          <span>{option.label}</span>
                          <div className="romaji-choice-list">
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
                          <label className="romaji-preferred-select">
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

            <section className="settings-row sokuon-method-row" aria-labelledby="sokuon-setting">
              <div>
                <h4 id="sokuon-setting">促音入力</h4>
                <p>「っ」の子音重複と ltsu / xtsu / ltu / xtu の扱いを選ぶ</p>
              </div>
              <div className="sokuon-setting-controls">
                <label className="sokuon-split-toggle">
                  <span>促音分割を許可</span>
                  <span className="toggle-control">
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
                <div className="romaji-choice-list" aria-label="促音入力候補">
                  {sokuonInputOptions.map((option) => (
                    <label key={option}>
                      <input
                        checked={settings.sokuonInput.accepted.includes(option)}
                        onChange={(event) =>
                          toggleSokuonAccepted(option, event.currentTarget.checked)
                        }
                        type="checkbox"
                      />
                      {option}
                    </label>
                  ))}
                </div>
                <label className="romaji-preferred-select">
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

            <section className="settings-row" aria-labelledby="split-yoon-setting">
              <div>
                <h4 id="split-yoon-setting">拗音分割入力</h4>
                <p>「きゃ」を kya だけでなく kila / kixa でも入力できるようにする</p>
              </div>
              <label className="toggle-control">
                <input
                  checked={settings.allowSplitYoon}
                  onChange={(event) => onChange({ allowSplitYoon: event.currentTarget.checked })}
                  type="checkbox"
                />
                <span aria-hidden="true" />
              </label>
            </section>
          </div>
        </section>

        <section className="settings-category" aria-labelledby="auto-retire-settings">
          <h3 className="settings-category-title" id="auto-retire-settings">
            自動リタイア
          </h3>
          <div className="settings-category-list">
            <section className="settings-row" aria-labelledby="idle-retire-setting">
              <div>
                <h4 id="idle-retire-setting">無入力リタイア</h4>
                <p>0 秒で無効</p>
              </div>
              <div className="number-control">
                <input
                  aria-label="無入力リタイア秒数"
                  min={0}
                  max={120}
                  onChange={(event) =>
                    onChange({
                      idleRetireSeconds: clampInteger(event.currentTarget.value, 0, 120),
                    })
                  }
                  step={1}
                  type="number"
                  value={settings.idleRetireSeconds}
                />
                <span>秒</span>
                <div className="number-stepper" aria-label="秒数を調整">
                  <button
                    aria-label="1秒増やす"
                    onClick={() => updateIdleRetireSeconds(settings.idleRetireSeconds + 1)}
                    type="button"
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    aria-label="1秒減らす"
                    disabled={settings.idleRetireSeconds <= 0}
                    onClick={() => updateIdleRetireSeconds(settings.idleRetireSeconds - 1)}
                    type="button"
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>
              </div>
            </section>
          </div>
        </section>

        <section className="settings-category" aria-labelledby="danger-settings">
          <h3 className="settings-category-title" id="danger-settings">
            危険な操作
          </h3>
          <div className="settings-category-list">
            <section className="settings-row danger-row" aria-labelledby="clear-local-data-setting">
              <div>
                <h4 id="clear-local-data-setting">ローカルデータをすべて削除</h4>
                <p>スコア、履歴、設定をこのブラウザから削除する</p>
              </div>
              <button className="danger-button" onClick={handleClearLocalData} type="button">
                <Trash2 size={17} />
                削除
              </button>
            </section>
          </div>
        </section>
      </div>
    </section>
  );
}
