"use client";

import type { CSSProperties, ReactNode } from "react";
import { getEnglishFontFamilyCss, getJapaneseFontFamilyCss } from "../../_lib/constants";
import { css } from "../../_lib/css-module";
import styles from "../TypingPanel.module.css";
import { DirectChallengeView } from "./challenge-views";
import { ProductionImeChallengeView } from "./production-ime-challenge-view";
import { DisplayText } from "./display-text";
import type { InputProgress, TypingPanelProps } from "./types";

type TypingTargetViewProps = Pick<
  TypingPanelProps,
  | "challengeLanguage"
  | "currentDisplay"
  | "currentFurigana"
  | "currentGuide"
  | "currentReading"
  | "currentRomajiTarget"
  | "englishFontFamily"
  | "furiganaFontScale"
  | "furiganaLineHeight"
  | "furiganaMarginBottom"
  | "hiraganaFontSize"
  | "hiraganaInputProgressFontSize"
  | "hiraganaInputProgressLineHeight"
  | "hiraganaInputProgressMarginBottom"
  | "hiraganaLineHeight"
  | "hiraganaMarginBottom"
  | "input"
  | "japaneseFontFamily"
  | "kanjiFontSize"
  | "kanjiInputProgressFontSize"
  | "kanjiInputProgressLineHeight"
  | "kanjiInputProgressMarginBottom"
  | "kanjiLineHeight"
  | "kanjiMarginBottom"
  | "mistakeFlash"
  | "mode"
  | "nextChallengeDisplay"
  | "nextChallengeFurigana"
  | "nextChallengeGuide"
  | "nextChallengePreview"
  | "nextChallengePreviewMode"
  | "nextChallengeReading"
  | "nextChallengeRomajiTarget"
  | "previousChallengeDisplay"
  | "previousChallengeFurigana"
  | "previousChallengeGuide"
  | "previousChallengeReading"
  | "productionLongTextLineCount"
  | "romajiFontSize"
  | "romajiLineHeight"
  | "romajiMarginBottom"
  | "romajiMarkerMode"
  | "scoringInput"
  | "showFuriganaDisplay"
  | "showFuriganaMarker"
  | "showHiraganaDisplay"
  | "showHiraganaInputProgress"
  | "showHiraganaMarker"
  | "showKanjiDisplay"
  | "showKanjiInputProgress"
  | "showKanjiMarker"
  | "showRomajiMarker"
  | "stats"
  | "strictMistakeDisplayMode"
  | "strictMistakeInput"
  | "targetDisplayOrder"
> & {
  inputProgress: InputProgress;
  isProductionImeOn: boolean;
  previousInputProgress: InputProgress;
  showDisplayText: boolean;
};

export function TypingTargetView({
  challengeLanguage,
  currentDisplay,
  currentFurigana,
  currentGuide,
  currentReading,
  currentRomajiTarget,
  englishFontFamily,
  furiganaFontScale,
  furiganaLineHeight,
  furiganaMarginBottom,
  hiraganaFontSize,
  hiraganaInputProgressFontSize,
  hiraganaInputProgressLineHeight,
  hiraganaInputProgressMarginBottom,
  hiraganaLineHeight,
  hiraganaMarginBottom,
  input,
  inputProgress,
  isProductionImeOn,
  japaneseFontFamily,
  kanjiFontSize,
  kanjiInputProgressFontSize,
  kanjiInputProgressLineHeight,
  kanjiInputProgressMarginBottom,
  kanjiLineHeight,
  kanjiMarginBottom,
  mistakeFlash,
  mode,
  nextChallengeDisplay,
  nextChallengeFurigana,
  nextChallengeGuide,
  nextChallengePreview,
  nextChallengePreviewMode,
  nextChallengeReading,
  nextChallengeRomajiTarget,
  previousChallengeDisplay,
  previousChallengeFurigana,
  previousChallengeGuide,
  previousChallengeReading,
  previousInputProgress,
  productionLongTextLineCount,
  romajiFontSize,
  romajiLineHeight,
  romajiMarginBottom,
  romajiMarkerMode,
  scoringInput,
  showDisplayText,
  showFuriganaDisplay,
  showFuriganaMarker,
  showHiraganaDisplay,
  showHiraganaInputProgress,
  showHiraganaMarker,
  showKanjiDisplay,
  showKanjiInputProgress,
  showKanjiMarker,
  showRomajiMarker,
  stats,
  strictMistakeDisplayMode,
  strictMistakeInput,
  targetDisplayOrder,
}: TypingTargetViewProps) {
  const imeTargetElements: Partial<Record<TypingPanelProps["targetDisplayOrder"][number], ReactNode>> = {
    kanji: showDisplayText ? (
      <DisplayText
        display={currentDisplay}
        furigana={currentFurigana}
        key="kanji"
        markerProgress={null}
        showFurigana={showFuriganaDisplay}
        showFuriganaMarker={showFuriganaMarker}
        showKanjiMarker={showKanjiMarker}
      />
    ) : null,
    kanjiInputProgress:
      showKanjiDisplay && showKanjiInputProgress && inputProgress.kanji ? (
        <p
          className={css(styles, "input-progress-text", "kanji-input-progress-text")}
          aria-label="kanji input progress"
          key="kanjiInputProgress"
        >
          {inputProgress.kanji}
        </p>
      ) : null,
    hiragana:
      showHiraganaDisplay && currentReading ? (
        <p className={css(styles, "reading-text")} key="hiragana">
          {currentReading}
        </p>
      ) : null,
    hiraganaInputProgress:
      showHiraganaDisplay && showHiraganaInputProgress && inputProgress.hiragana ? (
        <p
          className={css(styles, "input-progress-text", "hiragana-input-progress-text")}
          aria-label="hiragana input progress"
          key="hiraganaInputProgress"
        >
          {inputProgress.hiragana}
        </p>
      ) : null,
  };
  const targetViewClassName = css(
    styles,
    "target-view",
    challengeLanguage !== "ja" ? "english-target-view" : "",
  );
  const targetViewStyle = {
    "--target-japanese-font-family": getJapaneseFontFamilyCss(japaneseFontFamily),
    "--target-english-font-family": getEnglishFontFamilyCss(englishFontFamily),
    "--target-kanji-font-size": `${kanjiFontSize}px`,
    "--target-kanji-input-progress-font-size": `${kanjiInputProgressFontSize}px`,
    "--target-furigana-font-scale": `${furiganaFontScale}em`,
    "--target-hiragana-font-size": `${hiraganaFontSize}px`,
    "--target-hiragana-input-progress-font-size": `${hiraganaInputProgressFontSize}px`,
    "--target-romaji-font-size": `${romajiFontSize}px`,
    "--target-kanji-line-height": `${kanjiLineHeight}`,
    "--target-kanji-margin-bottom": `${kanjiMarginBottom}px`,
    "--target-kanji-input-progress-line-height": `${kanjiInputProgressLineHeight}`,
    "--target-kanji-input-progress-margin-bottom": `${kanjiInputProgressMarginBottom}px`,
    "--target-furigana-line-height": `${furiganaLineHeight}`,
    "--target-furigana-margin-bottom": `${furiganaMarginBottom}px`,
    "--target-hiragana-line-height": `${hiraganaLineHeight}`,
    "--target-hiragana-margin-bottom": `${hiraganaMarginBottom}px`,
    "--target-hiragana-input-progress-line-height": `${hiraganaInputProgressLineHeight}`,
    "--target-hiragana-input-progress-margin-bottom": `${hiraganaInputProgressMarginBottom}px`,
    "--target-romaji-line-height": `${romajiLineHeight}`,
    "--target-romaji-margin-bottom": `${romajiMarginBottom}px`,
    "--target-production-long-lines": `${productionLongTextLineCount}`,
  } as CSSProperties;

  return (
    <div className={targetViewClassName} aria-label="current challenge" style={targetViewStyle}>
      {isProductionImeOn ? (
        <ProductionImeChallengeView
          display={currentDisplay}
          furigana={currentFurigana}
          input={scoringInput}
          nextChallengeDisplay={nextChallengeDisplay}
          nextChallengeFurigana={nextChallengeFurigana}
          showDisplayText={showDisplayText}
          showFurigana={showFuriganaDisplay}
          showFuriganaMarker={showFuriganaMarker}
          showKanjiMarker={showKanjiMarker}
        />
      ) : mode.requiresIme ? (
        <>{targetDisplayOrder.map((id) => imeTargetElements[id] ?? null)}</>
      ) : (
        <DirectChallengeView
          display={currentDisplay}
          englishFontFamily={englishFontFamily}
          furigana={currentFurigana}
          guide={currentGuide}
          input={input}
          japaneseFontFamily={japaneseFontFamily}
          mistakeFlash={mistakeFlash}
          nextChallengeDisplay={nextChallengeDisplay}
          nextChallengeFurigana={nextChallengeFurigana}
          nextChallengeGuide={nextChallengeGuide}
          nextChallengePreview={nextChallengePreview}
          nextChallengePreviewMode={nextChallengePreviewMode}
          nextChallengeReading={nextChallengeReading}
          nextChallengeRomajiTarget={nextChallengeRomajiTarget}
          previousChallengeDisplay={previousChallengeDisplay}
          previousChallengeFurigana={previousChallengeFurigana}
          previousChallengeGuide={previousChallengeGuide}
          previousChallengeReading={previousChallengeReading}
          inputProgress={inputProgress}
          previousInputProgress={previousInputProgress}
          reading={currentReading}
          romajiTarget={currentRomajiTarget}
          showFuriganaDisplay={showFuriganaDisplay}
          showFuriganaMarker={showFuriganaMarker}
          showHiraganaDisplay={showHiraganaDisplay}
          showHiraganaMarker={showHiraganaMarker}
          showKanjiMarker={showKanjiMarker}
          showKanjiInputProgress={showKanjiInputProgress}
          showHiraganaInputProgress={showHiraganaInputProgress}
          showRomajiMarker={showRomajiMarker}
          romajiMarkerMode={romajiMarkerMode}
          targetDisplayOrder={targetDisplayOrder}
          showDisplayText={showDisplayText}
          isProductionDirect={mode.group === "production"}
          currentChallengeLane={stats.completedPrompts % 2 === 0 ? "top" : "bottom"}
          completedPrompts={stats.completedPrompts}
          strictMistakeDisplayMode={strictMistakeDisplayMode}
          strictMistakeInput={strictMistakeInput}
        />
      )}
    </div>
  );
}
