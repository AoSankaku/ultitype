"use client";

import { ArrowLeft, FastForward, MonitorCog, Pause, Play, Wrench } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import mockJapaneseText from "@/src/lib/challenge-data/_mock/ja-mock.txt" with { type: "text" };
import {
  createJapaneseDirectChallenges,
  parseJapaneseChallengeText,
} from "@/src/lib/challenges";
import { createRomajiInputTarget, getRank, modes } from "@/src/lib/typing";
import { removeRomajiVisualSpaces } from "../_lib/challenge-utils";
import { css } from "../_lib/css-module";
import { initialStats } from "../_lib/constants";
import type { AppSettings } from "../_lib/types";
import { InputSettingsSections } from "./InputSettingsSections";
import { TypingPanel } from "./TypingPanel";
import styles from "./SettingsScreen.module.css";

type InputScreenSettingsScreenProps = {
  settings: AppSettings;
  onBack: () => void;
  onChange: (settings: Partial<AppSettings>) => void;
};

const fallbackMockJapaneseText = `---
type: "ultitype_sentence_short"
---

[例](れい)[文](ぶん)です。`;

const mockChallenge =
  createJapaneseDirectChallenges(parseJapaneseChallengeText(mockJapaneseText))[0] ??
  createJapaneseDirectChallenges(parseJapaneseChallengeText(fallbackMockJapaneseText))[0]!;

const mockChallenges = createJapaneseDirectChallenges(parseJapaneseChallengeText(mockJapaneseText));
const availableMockChallenges = mockChallenges.length > 0 ? mockChallenges : [mockChallenge];

type StickyPreviewLayout = {
  height: number | null;
  scale: number;
};

const mockInputCharactersPerSecond = 5;
const initialMockElapsedMs = 1400;

export function calculateStickyPreviewScale(contentHeight: number, viewportHeight: number) {
  if (contentHeight <= 0 || viewportHeight <= 0) {
    return 1;
  }

  const maxHeight = viewportHeight * 0.5;
  return contentHeight > maxHeight ? maxHeight / contentHeight : 1;
}

export function calculateAnimatedMockInputProgress(
  guide: string,
  elapsedMs: number,
  charactersPerSecond = mockInputCharactersPerSecond,
) {
  const target = removeRomajiVisualSpaces(guide);

  if (!target) {
    return {
      completedPrompts: 0,
      input: "",
      targetLength: 0,
    };
  }

  const typedCharacters = Math.max(0, Math.floor((elapsedMs / 1000) * charactersPerSecond));

  return {
    completedPrompts: Math.floor(typedCharacters / target.length),
    input: target.slice(0, typedCharacters % target.length),
    targetLength: target.length,
  };
}

export function calculateAnimatedMockChallengeProgress(
  guides: string[],
  elapsedMs: number,
  charactersPerSecond = mockInputCharactersPerSecond,
) {
  const targets = guides.map((guide) => removeRomajiVisualSpaces(guide));
  const totalTargetLength = targets.reduce((total, target) => total + target.length, 0);

  if (targets.length === 0 || totalTargetLength === 0) {
    return {
      completedPrompts: 0,
      currentChallengeIndex: 0,
      input: "",
      nextChallengeIndex: 0,
      previousChallengeIndex: null as number | null,
      targetLength: 0,
    };
  }

  const typedCharacters = Math.max(0, Math.floor((elapsedMs / 1000) * charactersPerSecond));
  const completedCycles = Math.floor(typedCharacters / totalTargetLength);
  let remainingCharacters = typedCharacters % totalTargetLength;
  let completedPromptsInCycle = 0;
  let currentChallengeIndex = 0;

  for (let index = 0; index < targets.length; index += 1) {
    const targetLength = targets[index]?.length ?? 0;

    if (targetLength <= remainingCharacters) {
      remainingCharacters -= targetLength;
      completedPromptsInCycle += 1;
      continue;
    }

    currentChallengeIndex = index;
    break;
  }

  if (completedPromptsInCycle >= targets.length) {
    currentChallengeIndex = 0;
    completedPromptsInCycle = 0;
    remainingCharacters = 0;
  }

  const completedPrompts = completedCycles * targets.length + completedPromptsInCycle;

  return {
    completedPrompts,
    currentChallengeIndex,
    input: (targets[currentChallengeIndex] ?? "").slice(0, remainingCharacters),
    nextChallengeIndex: (currentChallengeIndex + 1) % targets.length,
    previousChallengeIndex:
      completedPrompts > 0
        ? (currentChallengeIndex - 1 + targets.length) % targets.length
        : null,
    targetLength: targets[currentChallengeIndex]?.length ?? 0,
  };
}

export function InputScreenSettingsScreen({
  settings,
  onBack,
  onChange,
}: InputScreenSettingsScreenProps) {
  const previewContentRef = useRef<HTMLDivElement | null>(null);
  const mockElapsedMsRef = useRef(initialMockElapsedMs);
  const mockTickAtRef = useRef<number | null>(null);
  const [mockElapsedMs, setMockElapsedMs] = useState(initialMockElapsedMs);
  const [mockPlaybackMode, setMockPlaybackMode] = useState<"slow" | "fast" | "paused">("slow");
  const isMockPaused = mockPlaybackMode === "paused";
  const currentKeysPerSecond = mockPlaybackMode === "fast" ? 10 : 5;
  const mockSpeedMultiplier = mockPlaybackMode === "fast" ? 2 : 1;
  const [stickyPreviewLayout, setStickyPreviewLayout] = useState<StickyPreviewLayout>({
    height: null,
    scale: 1,
  });
  const mockChallengeItems = availableMockChallenges.map((challenge) => {
    const romajiSource = challenge.romajiSource ?? challenge.input;
    const romajiTarget = createRomajiInputTarget(romajiSource, {
      preset: settings.romajiInputPreset,
      selections: settings.romajiInputSelections,
      allowSplitYoon: settings.allowSplitYoon,
      specialPreset: settings.specialRomajiInputPreset,
      specialSelections: settings.specialRomajiInputSelections,
      sokuon: settings.sokuonInput,
    });

    return {
      challenge,
      romajiTarget,
    };
  });
  const mockInputProgress = calculateAnimatedMockChallengeProgress(
    mockChallengeItems.map((item) => item.romajiTarget.guide),
    mockElapsedMs,
  );
  const currentMockItem =
    mockChallengeItems[mockInputProgress.currentChallengeIndex] ?? mockChallengeItems[0]!;
  const nextMockItem =
    mockChallengeItems[mockInputProgress.nextChallengeIndex] ?? currentMockItem;
  const previousMockItem =
    mockInputProgress.previousChallengeIndex === null
      ? null
      : (mockChallengeItems[mockInputProgress.previousChallengeIndex] ?? null);
  const visibleMockInput = mockInputProgress.input;
  const mockNextChallengePreview =
    settings.nextChallengePreviewMode !== "none" ? nextMockItem.challenge.display : "";
  const stickyPreviewStyle: CSSProperties =
    stickyPreviewLayout.height === null ? {} : { height: stickyPreviewLayout.height };
  const previewScaleStyle: CSSProperties = {
    transform: `scale(${stickyPreviewLayout.scale})`,
  };

  function updateMockElapsedMs(nextElapsedMs: number) {
    mockElapsedMsRef.current = Math.max(0, nextElapsedMs);
    setMockElapsedMs(mockElapsedMsRef.current);
  }

  function handleToggleMockPlayback() {
    setMockPlaybackMode((current) => {
      if (current === "slow") return "fast";
      if (current === "fast") return "paused";
      return "slow";
    });
  }

  function handleResetMockPlayback() {
    updateMockElapsedMs(initialMockElapsedMs);
    mockTickAtRef.current = Date.now();
    setMockPlaybackMode("slow");
  }

  useEffect(() => {
    if (isMockPaused) {
      mockTickAtRef.current = null;
      return;
    }

    mockTickAtRef.current = Date.now();
    const timer = window.setInterval(() => {
      const tickedAt = Date.now();
      const previousTickAt = mockTickAtRef.current ?? tickedAt;
      mockTickAtRef.current = tickedAt;
      updateMockElapsedMs(mockElapsedMsRef.current + (tickedAt - previousTickAt) * mockSpeedMultiplier);
    }, 100);

    return () => window.clearInterval(timer);
  }, [mockPlaybackMode]);

  useEffect(() => {
    const previewContent = previewContentRef.current;
    if (!previewContent) {
      return;
    }

    let animationFrameId: number | null = null;

    const updatePreviewLayout = () => {
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
      }

      animationFrameId = window.requestAnimationFrame(() => {
        const contentHeight = previewContent.scrollHeight;
        const scale = calculateStickyPreviewScale(contentHeight, window.innerHeight);
        setStickyPreviewLayout({
          height: contentHeight * scale,
          scale,
        });
        animationFrameId = null;
      });
    };

    updatePreviewLayout();

    const resizeObserver = new ResizeObserver(updatePreviewLayout);
    resizeObserver.observe(previewContent);
    window.addEventListener("resize", updatePreviewLayout);

    return () => {
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
      }
      resizeObserver.disconnect();
      window.removeEventListener("resize", updatePreviewLayout);
    };
  }, []);

  return (
    <section className={css(styles, "settings-screen input-screen-settings-screen")} aria-label="input screen settings">
      <div className={css(styles, "settings-head")}>
        <div>
          <div className={css(styles, "panel-heading")}>
            <MonitorCog size={18} />
            <span>Screen Settings</span>
          </div>
          <h2>入力画面設定</h2>
        </div>
        <button className={css(styles, "icon-button")} onClick={onBack} title="戻る" type="button">
          <ArrowLeft size={18} />
        </button>
      </div>

      <section className={css(styles, "input-screen-settings-preview")} aria-label="input screen mock">
        <div className={css(styles, "input-screen-settings-preview-sticky")} style={stickyPreviewStyle}>
          <div
            className={css(styles, "input-screen-settings-preview-scale")}
            ref={previewContentRef}
            style={previewScaleStyle}
          >
            <TypingPanel
              acceptsTextInput={false}
              autoFocusDirectInput={false}
              challengeLanguage="ja"
              correctionDebt={0}
              currentAccuracy={1}
              currentDisplay={currentMockItem.challenge.display}
              currentFurigana={currentMockItem.challenge.furigana ?? []}
              currentGuide={currentMockItem.romajiTarget.guide}
              currentReading={currentMockItem.challenge.reading ?? ""}
              currentRomajiTarget={currentMockItem.romajiTarget}
              currentRank={getRank(500)}
              elapsedSeconds={31}
              finishReason={null}
              imeError=""
              input={visibleMockInput}
              inputRef={{ current: null }}
              scoringInput={visibleMockInput}
              isFinished={false}
              isPreview
              isProductionBlocked={false}
              mistakeFlash={null}
              metrics={{
                accuracy: 1,
                consistency: 1,
                kanaCharactersPerSecond: currentKeysPerSecond,
                keysPerSecond: currentKeysPerSecond,
                paceMs: 200,
                promptCharactersPerSecond: 0,
                score: 500,
              }}
              mode={modes[0]!}
              nextChallengeDisplay={nextMockItem.challenge.display}
              nextChallengeFurigana={nextMockItem.challenge.furigana ?? []}
              nextChallengeGuide={nextMockItem.romajiTarget.guide}
              nextChallengePreview={mockNextChallengePreview}
              nextChallengePreviewMode={settings.nextChallengePreviewMode}
              targetDisplayOrder={settings.targetDisplayOrder}
              nextChallengeReading={nextMockItem.challenge.reading ?? ""}
              nextChallengeRomajiTarget={nextMockItem.romajiTarget}
              previousChallengeDisplay={previousMockItem?.challenge.display ?? ""}
              previousChallengeFurigana={previousMockItem?.challenge.furigana ?? []}
              previousChallengeGuide={previousMockItem?.romajiTarget.guide ?? ""}
              previousChallengeReading={previousMockItem?.challenge.reading ?? ""}
              progress={18}
              productionBlockReason=""
              remainingSeconds={104}
              showFuriganaDisplay={settings.showFuriganaDisplay}
              showFuriganaMarker={settings.showFuriganaMarker}
              showHiraganaDisplay={settings.showHiraganaDisplay}
              showHiraganaMarker={settings.showHiraganaMarker}
              showKanjiDisplay={settings.showKanjiDisplay}
              showKanjiMarker={settings.showKanjiMarker}
              showKanjiInputProgress={settings.showKanjiInputProgress}
              showHiraganaInputProgress={settings.showHiraganaInputProgress}
              showRomajiMarker={settings.showRomajiMarker}
              romajiMarkerMode={settings.romajiMarkerMode}
              japaneseFontFamily={settings.japaneseFontFamily}
              englishFontFamily={settings.englishFontFamily}
              kanjiFontSize={settings.kanjiFontSize}
              kanjiInputProgressFontSize={settings.kanjiInputProgressFontSize}
              furiganaFontScale={settings.furiganaFontScale}
              hiraganaFontSize={settings.hiraganaFontSize}
              hiraganaInputProgressFontSize={settings.hiraganaInputProgressFontSize}
              romajiFontSize={settings.romajiFontSize}
              kanjiLineHeight={settings.kanjiLineHeight}
              kanjiMarginBottom={settings.kanjiMarginBottom}
              kanjiInputProgressLineHeight={settings.kanjiInputProgressLineHeight}
              kanjiInputProgressMarginBottom={settings.kanjiInputProgressMarginBottom}
              furiganaLineHeight={settings.furiganaLineHeight}
              furiganaMarginBottom={settings.furiganaMarginBottom}
              hiraganaLineHeight={settings.hiraganaLineHeight}
              hiraganaMarginBottom={settings.hiraganaMarginBottom}
              hiraganaInputProgressLineHeight={settings.hiraganaInputProgressLineHeight}
              hiraganaInputProgressMarginBottom={settings.hiraganaInputProgressMarginBottom}
              romajiLineHeight={settings.romajiLineHeight}
              romajiMarginBottom={settings.romajiMarginBottom}
              productionLongTextLineCount={settings.productionLongTextLineCount}
              soundSettings={settings}
              startedAt={Date.now() - 16000}
              rankCalculationMode={settings.rankCalculationMode}
              sessionModeIcon={Wrench}
              sessionModeLabel="入力画面設定"
              prepareActionIcon={isMockPaused ? Pause : mockPlaybackMode === "fast" ? FastForward : Play}
              prepareActionTitle={isMockPaused ? "一時停止" : mockPlaybackMode === "fast" ? "10.0打鍵/秒プレビュー" : "5.0打鍵/秒プレビュー"}
              stats={{
                ...initialStats,
                characterAttempts: visibleMockInput.length,
                completedPrompts: mockInputProgress.completedPrompts,
                correctCharacters: visibleMockInput.length,
                keystrokes: visibleMockInput.length,
                physicalKeystrokes: visibleMockInput.length,
                scoredInputLength: visibleMockInput.length,
              }}
              strictMistakeDisplayMode={settings.strictMistakeDisplayMode}
              strictMistakeInput=""
              topDisplayMetricIds={settings.topDisplayMetricIds}
              enSpaceDisplay={settings.enSpaceDisplay}
              onBackToModeSelect={() => undefined}
              onImeCompositionEnd={() => undefined}
              onImeCompositionStart={() => undefined}
              onImeInput={() => undefined}
              onImeKeyDown={() => undefined}
              onPrepareSession={handleToggleMockPlayback}
              onPreventDirectTextInput={() => undefined}
              onResetSession={handleResetMockPlayback}
            />
          </div>
        </div>
      </section>

      <div className={css(styles, "settings-list")}>
        <InputSettingsSections settings={settings} onChange={onChange} />
      </div>
    </section>
  );
}
