"use client";

import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  MonitorCog,
  Moon,
  Settings,
  Sun,
  Trash2,
} from "lucide-react";
import { clampInteger } from "../_lib/challenge-utils";
import { useChromeActiveTabMuted, useTypingSounds } from "../_lib/typing-sounds";
import type { AppSettings } from "../_lib/types";
import { SelectSoundLink } from "./SelectSoundLink";

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

  function updateIdleRetireSeconds(nextValue: number) {
    onChange({
      idleRetireSeconds: Math.min(120, Math.max(0, nextValue)),
    });
  }

  function updateConsecutiveMistypeRetireCount(nextValue: number) {
    onChange({
      consecutiveMistypeRetireCount: Math.min(50, Math.max(0, nextValue)),
    });
  }

  function updateAccuracyRetireBorderPercent(nextValue: number) {
    onChange({
      accuracyRetireBorderPercent: Math.min(100, Math.max(0, nextValue)),
    });
  }

  function updateNextChallengePreviewLength(nextValue: number) {
    onChange({
      nextChallengePreviewLength: Math.min(40, Math.max(0, nextValue)),
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

            <section className="settings-row settings-link-row" aria-labelledby="screen-preview-setting">
              <div>
                <h4 id="screen-preview-setting">入力画面と入力方式</h4>
                <p>練習画面のモックを見ながら入力方式と表示を調整する</p>
              </div>
              <SelectSoundLink
                aria-label="入力画面と入力方式"
                className="settings-row-link"
                href="/settings/screen"
                soundSettings={settings}
              >
                <MonitorCog size={18} />
                開く
              </SelectSoundLink>
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

            <section
              className="settings-row"
              aria-labelledby="consecutive-mistype-retire-setting"
            >
              <div>
                <h4 id="consecutive-mistype-retire-setting">連続誤打鍵リタイア</h4>
                <p>0 打鍵で無効</p>
              </div>
              <div className="number-control">
                <input
                  aria-label="連続誤打鍵数"
                  min={0}
                  max={50}
                  onChange={(event) =>
                    updateConsecutiveMistypeRetireCount(
                      clampInteger(event.currentTarget.value, 0, 50),
                    )
                  }
                  step={1}
                  type="number"
                  value={settings.consecutiveMistypeRetireCount}
                />
                <span>打鍵</span>
              </div>
            </section>

            <section className="settings-row" aria-labelledby="accuracy-retire-border-setting">
              <div>
                <h4 id="accuracy-retire-border-setting">正誤率ボーダー</h4>
                <p>0% で無効</p>
              </div>
              <div className="number-control">
                <input
                  aria-label="正誤率ボーダー"
                  min={0}
                  max={100}
                  onChange={(event) =>
                    updateAccuracyRetireBorderPercent(
                      clampInteger(event.currentTarget.value, 0, 100),
                    )
                  }
                  step={1}
                  type="number"
                  value={settings.accuracyRetireBorderPercent}
                />
                <span>%</span>
              </div>
            </section>
          </div>
        </section>

        <section className="settings-category" aria-labelledby="other-settings">
          <h3 className="settings-category-title" id="other-settings">
            その他の設定
          </h3>
          <div className="settings-category-list">
            <section className="settings-row" aria-labelledby="next-challenge-preview-setting">
              <div>
                <h4 id="next-challenge-preview-setting">次の課題の表示文字数</h4>
                <p>短文練習モードで次に出る課題文の冒頭を表示する。0文字で非表示</p>
              </div>
              <div className="number-control">
                <input
                  aria-label="次の課題の表示文字数"
                  min={0}
                  max={40}
                  onChange={(event) =>
                    onChange({
                      nextChallengePreviewLength: clampInteger(
                        event.currentTarget.value,
                        0,
                        40,
                      ),
                    })
                  }
                  step={1}
                  type="number"
                  value={settings.nextChallengePreviewLength}
                />
                <span>文字</span>
                <div className="number-stepper" aria-label="次の課題の表示文字数を調整">
                  <button
                    aria-label="次の課題の表示文字数を増やす"
                    disabled={settings.nextChallengePreviewLength >= 40}
                    onClick={() =>
                      updateNextChallengePreviewLength(
                        settings.nextChallengePreviewLength + 1,
                      )
                    }
                    type="button"
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    aria-label="次の課題の表示文字数を減らす"
                    disabled={settings.nextChallengePreviewLength <= 0}
                    onClick={() =>
                      updateNextChallengePreviewLength(
                        settings.nextChallengePreviewLength - 1,
                      )
                    }
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
