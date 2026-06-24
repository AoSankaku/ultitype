"use client";

import { Play } from "lucide-react";
import type {
  CompositionEvent,
  FormEvent,
  KeyboardEvent,
  PointerEvent,
} from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { css } from "../../_lib/css-module";
import { getVisibleSessionRank } from "../../_lib/session-rank-visibility";
import { useTypingSounds } from "../../_lib/typing-sounds";
import styles from "../TypingPanel.module.css";

import { productionImeInputWidthStorageKey } from "./common";
import { calculateCenteredProductionImeInputWidth, clampProductionImeInputWidth, getDirectInputFocusRetryDelays, shouldStickProductionImeInputToBottom } from "./ime-input";
import { createCompletedInputProgress, createInputProgress } from "./input-progress";
import { ChallengeAnalysis, ChallengeTip, CorrectionDebtIndicator, createTopDisplayMetrics, getSessionModeIcon } from "./session-summary";
import { LockedPanel, TypingPanelHeader, TypingPanelMeters, TypingPanelResultBand } from "./typing-panel-frame";
import { TypingTargetView } from "./typing-target-view";
import { ProductionImeInputResizeSession, TypingPanelProps } from "./types";
import { TypingInputField } from "./typing-input-field";

export function TypingPanel({
  acceptsTextInput,
  challengeLanguage,
  correctionDebt,
  currentAccuracy,
  currentDisplay,
  currentFurigana,
  currentGuide,
  currentReading,
  currentRomajiTarget,
  currentRank,
  elapsedSeconds,
  finishReason,
  imeError,
  input,
  inputRef,
  scoringInput,
  isFinished,
  isProductionBlocked,
  mistakeFlash,
  metrics,
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
  progress,
  productionBlockReason,
  remainingSeconds,
  showFuriganaDisplay,
  showFuriganaMarker,
  showHiraganaDisplay,
  showHiraganaMarker,
  showKanjiDisplay,
  showKanjiMarker,
  showKanjiInputProgress,
  showHiraganaInputProgress,
  showRomajiMarker,
  romajiMarkerMode,
  japaneseFontFamily,
  englishFontFamily,
  kanjiFontSize,
  kanjiInputProgressFontSize,
  furiganaFontScale,
  hiraganaFontSize,
  hiraganaInputProgressFontSize,
  romajiFontSize,
  kanjiLineHeight,
  kanjiMarginBottom,
  kanjiInputProgressLineHeight,
  kanjiInputProgressMarginBottom,
  furiganaLineHeight,
  furiganaMarginBottom,
  hiraganaLineHeight,
  hiraganaMarginBottom,
  hiraganaInputProgressLineHeight,
  hiraganaInputProgressMarginBottom,
  romajiLineHeight,
  romajiMarginBottom,
  productionLongTextLineCount,
  soundSettings,
  startedAt,
  stats,
  rankCalculationMode,
  strictMistakeDisplayMode,
  strictMistakeInput,
  sessionModeIcon,
  sessionModeLabel,
  prepareActionIcon,
  prepareActionTitle,
  autoFocusDirectInput = true,
  isPreview = false,
  topDisplayMetricIds,
  targetDisplayOrder,
  enSpaceDisplay,
  onBackToModeSelect,
  onImeCompositionEnd,
  onImeCompositionStart,
  onImeInput,
  onImeKeyDown,
  onPrepareSession,
  onPreventDirectTextInput,
  onResetSession,
}: TypingPanelProps) {
  const playTypingSound = useTypingSounds(soundSettings);
  const visibleRank = getVisibleSessionRank({
    concealOpeningRank: rankCalculationMode === "projected",
    elapsedSeconds,
    rankLabel: currentRank.label,
  });
  const topDisplayMetrics = createTopDisplayMetrics({
    metrics,
    mode,
    progress,
    remainingSeconds,
    stats,
    topDisplayMetricIds,
  });
  const SessionModeIcon = sessionModeIcon === undefined ? getSessionModeIcon(mode) : sessionModeIcon;
  const visibleModeLabel = sessionModeLabel ?? mode.label;
  const PrepareActionIcon = prepareActionIcon ?? Play;
  const isProductionImeOn = mode.id === "production-ime-on";
  const productionImeInputShellRef = useRef<HTMLDivElement | null>(null);
  const productionImeLastKeyRef = useRef<string | null>(null);
  const productionImeResizeSessionRef = useRef<ProductionImeInputResizeSession | null>(null);
  const productionImeInputWidthObservedRef = useRef(false);
  const [productionImeInputWidth, setProductionImeInputWidth] = useState<number | null>(null);
  const scorePrefix =
    rankCalculationMode === "projected" && !isFinished && remainingSeconds > 0 ? "\u2248 " : "";
  const scoreLabel = `${scorePrefix}${Math.round(metrics.score).toLocaleString()} pts`;
  const visiblePrepareActionTitle = prepareActionTitle ?? "開始";
  const showDisplayText = challengeLanguage !== "ja" || showKanjiDisplay;
  const inputProgress = createInputProgress({
    acceptsTextInput,
    display: currentDisplay,
    furigana: currentFurigana,
    input,
    reading: currentReading,
    romajiTarget: currentRomajiTarget,
  });
  const previousInputProgress = createCompletedInputProgress({
    display: previousChallengeDisplay,
    reading: previousChallengeReading,
  });
  useLayoutEffect(() => {
    if (!isProductionImeOn || !acceptsTextInput) {
      return;
    }

    const textArea = inputRef.current;
    if (!textArea) {
      return;
    }

    if (
      shouldStickProductionImeInputToBottom({
        key: productionImeLastKeyRef.current,
        selectionEnd: textArea.selectionEnd,
        selectionStart: textArea.selectionStart,
        valueLength: textArea.value.length,
      })
    ) {
      textArea.scrollTop = textArea.scrollHeight;
    }
  }, [acceptsTextInput, input, inputRef, isProductionImeOn]);

  useLayoutEffect(() => {
    if (!isProductionImeOn || typeof ResizeObserver === "undefined") {
      return;
    }

    const shell = productionImeInputShellRef.current;
    if (!shell) {
      return;
    }

    productionImeInputWidthObservedRef.current = false;
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }

      const borderBoxSize = Array.isArray(entry.borderBoxSize)
        ? entry.borderBoxSize[0]
        : entry.borderBoxSize;
      const measuredWidth = borderBoxSize?.inlineSize ?? entry.contentRect.width;
      const nextWidth = clampProductionImeInputWidth(measuredWidth);
      if (nextWidth === null) {
        return;
      }

      if (!productionImeInputWidthObservedRef.current) {
        productionImeInputWidthObservedRef.current = true;
        return;
      }

      setProductionImeInputWidth((currentWidth) =>
        currentWidth === nextWidth ? currentWidth : nextWidth,
      );
      window.localStorage.setItem(productionImeInputWidthStorageKey, String(nextWidth));
    });

    resizeObserver.observe(shell);
    return () => resizeObserver.disconnect();
  }, [inputRef, isProductionImeOn]);

  function handleBackToModeSelect() {
    playTypingSound("back");
    onBackToModeSelect();
  }

  function handleImeInputChange(event: FormEvent<HTMLTextAreaElement>) {
    onImeInput(event.currentTarget.value);
  }

  function handleImeCompositionEnd(event: CompositionEvent<HTMLTextAreaElement>) {
    onPreventDirectTextInput(event);
    onImeCompositionEnd(event.currentTarget.value);
  }

  function handleImeCompositionStart(event: CompositionEvent<HTMLTextAreaElement>) {
    onPreventDirectTextInput(event);
    onImeCompositionStart(event.currentTarget.value);
  }

  function handleImeInputKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.nativeEvent.isComposing) {
      return;
    }

    if (isProductionImeOn) {
      productionImeLastKeyRef.current = event.key;
    }

    onImeKeyDown(event);
  }

  function handleProductionImeInputWidthCommit() {
    if (!isProductionImeOn) {
      return;
    }

    const shell = productionImeInputShellRef.current;
    if (!shell) {
      return;
    }

    const nextWidth = clampProductionImeInputWidth(shell.getBoundingClientRect().width);
    if (nextWidth === null) {
      return;
    }

    setProductionImeInputWidth((currentWidth) =>
      currentWidth === nextWidth ? currentWidth : nextWidth,
    );
    window.localStorage.setItem(productionImeInputWidthStorageKey, String(nextWidth));
  }

  function handleProductionImeResizePointerDown(event: PointerEvent<HTMLButtonElement>) {
    const shell = productionImeInputShellRef.current;
    const parent = shell?.parentElement;
    if (!shell || !parent) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    productionImeResizeSessionRef.current = {
      maxWidth: parent.getBoundingClientRect().width,
      pointerId: event.pointerId,
      startWidth: shell.getBoundingClientRect().width,
      startX: event.clientX,
    };
  }

  function handleProductionImeResizePointerMove(event: PointerEvent<HTMLButtonElement>) {
    const session = productionImeResizeSessionRef.current;
    if (!session || session.pointerId !== event.pointerId) {
      return;
    }

    const nextWidth = calculateCenteredProductionImeInputWidth({
      maxWidth: session.maxWidth,
      pointerDeltaX: event.clientX - session.startX,
      startWidth: session.startWidth,
    });
    setProductionImeInputWidth(nextWidth);
  }

  function handleProductionImeResizePointerUp(event: PointerEvent<HTMLButtonElement>) {
    const session = productionImeResizeSessionRef.current;
    if (!session || session.pointerId !== event.pointerId) {
      return;
    }

    const nextWidth = calculateCenteredProductionImeInputWidth({
      maxWidth: session.maxWidth,
      pointerDeltaX: event.clientX - session.startX,
      startWidth: session.startWidth,
    });
    productionImeResizeSessionRef.current = null;
    setProductionImeInputWidth(nextWidth);
    window.localStorage.setItem(productionImeInputWidthStorageKey, String(nextWidth));
    event.currentTarget.releasePointerCapture(event.pointerId);
  }



  return (
    <section
      className={css(styles, "practice-panel", acceptsTextInput ? "ime-panel" : "direct-panel", isPreview ? "preview-panel" : "")}
      aria-label="typing practice"
    >
      <TypingPanelMeters progress={progress} topDisplayMetrics={topDisplayMetrics} />

      <TypingPanelHeader
        PrepareActionIcon={PrepareActionIcon}
        SessionModeIcon={SessionModeIcon}
        onBackToModeSelect={handleBackToModeSelect}
        onPrepareSession={onPrepareSession}
        onResetSession={onResetSession}
        scoreLabel={scoreLabel}
        visibleModeLabel={visibleModeLabel}
        visiblePrepareActionTitle={visiblePrepareActionTitle}
        visibleRank={visibleRank}
      />

      {isProductionBlocked ? (
        <LockedPanel productionBlockReason={productionBlockReason} />
      ) : (
        <>
          <TypingTargetView
            challengeLanguage={challengeLanguage}
            currentDisplay={currentDisplay}
            currentFurigana={currentFurigana}
            currentGuide={currentGuide}
            currentReading={currentReading}
            currentRomajiTarget={currentRomajiTarget}
            englishFontFamily={englishFontFamily}
            furiganaFontScale={furiganaFontScale}
            furiganaLineHeight={furiganaLineHeight}
            furiganaMarginBottom={furiganaMarginBottom}
            hiraganaFontSize={hiraganaFontSize}
            hiraganaInputProgressFontSize={hiraganaInputProgressFontSize}
            hiraganaInputProgressLineHeight={hiraganaInputProgressLineHeight}
            hiraganaInputProgressMarginBottom={hiraganaInputProgressMarginBottom}
            hiraganaLineHeight={hiraganaLineHeight}
            hiraganaMarginBottom={hiraganaMarginBottom}
            input={input}
            inputProgress={inputProgress}
            isProductionImeOn={isProductionImeOn}
            japaneseFontFamily={japaneseFontFamily}
            kanjiFontSize={kanjiFontSize}
            kanjiInputProgressFontSize={kanjiInputProgressFontSize}
            kanjiInputProgressLineHeight={kanjiInputProgressLineHeight}
            kanjiInputProgressMarginBottom={kanjiInputProgressMarginBottom}
            kanjiLineHeight={kanjiLineHeight}
            kanjiMarginBottom={kanjiMarginBottom}
            mistakeFlash={mistakeFlash}
            mode={mode}
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
            previousInputProgress={previousInputProgress}
            productionLongTextLineCount={productionLongTextLineCount}
            romajiFontSize={romajiFontSize}
            romajiLineHeight={romajiLineHeight}
            romajiMarginBottom={romajiMarginBottom}
            romajiMarkerMode={romajiMarkerMode}
            scoringInput={scoringInput}
            showDisplayText={showDisplayText}
            showFuriganaDisplay={showFuriganaDisplay}
            showFuriganaMarker={showFuriganaMarker}
            showHiraganaDisplay={showHiraganaDisplay}
            showHiraganaInputProgress={showHiraganaInputProgress}
            showHiraganaMarker={showHiraganaMarker}
            showKanjiDisplay={showKanjiDisplay}
            showKanjiInputProgress={showKanjiInputProgress}
            showKanjiMarker={showKanjiMarker}
            showRomajiMarker={showRomajiMarker}
            stats={stats}
            strictMistakeDisplayMode={strictMistakeDisplayMode}
            strictMistakeInput={strictMistakeInput}
            targetDisplayOrder={targetDisplayOrder}
            enSpaceDisplay={enSpaceDisplay}
          />

          {isProductionImeOn ? (
          <TypingInputField
            acceptsTextInput={acceptsTextInput}
            challengeLanguage={challengeLanguage}
            handleImeCompositionEnd={handleImeCompositionEnd}
            handleImeCompositionStart={handleImeCompositionStart}
            handleImeInputChange={handleImeInputChange}
            handleImeInputKeyDown={handleImeInputKeyDown}
            handleProductionImeInputWidthCommit={handleProductionImeInputWidthCommit}
            handleProductionImeResizePointerDown={handleProductionImeResizePointerDown}
            handleProductionImeResizePointerMove={handleProductionImeResizePointerMove}
            handleProductionImeResizePointerUp={handleProductionImeResizePointerUp}
            input={input}
            inputRef={inputRef}
            isFinished={isFinished}
            isProductionImeOn={isProductionImeOn}
            onPreventDirectTextInput={onPreventDirectTextInput}
            productionImeInputShellRef={productionImeInputShellRef}
            productionImeInputWidth={productionImeInputWidth}
            startedAt={startedAt}
          />
          ) : null}

          <ChallengeTip
            completedPrompts={stats.completedPrompts}
            isFinished={isFinished}
            startedAt={startedAt}
          />

          <CorrectionDebtIndicator debt={correctionDebt} />

          <ChallengeAnalysis
            acceptsTextInput={acceptsTextInput}
            currentAccuracy={currentAccuracy}
            currentDisplay={currentDisplay}
            input={mode.id === "production-ime-on" ? scoringInput : input}
            metrics={metrics}
            stats={stats}
          />

          {!isProductionImeOn ? (
          <TypingInputField
            acceptsTextInput={acceptsTextInput}
            challengeLanguage={challengeLanguage}
            handleImeCompositionEnd={handleImeCompositionEnd}
            handleImeCompositionStart={handleImeCompositionStart}
            handleImeInputChange={handleImeInputChange}
            handleImeInputKeyDown={handleImeInputKeyDown}
            handleProductionImeInputWidthCommit={handleProductionImeInputWidthCommit}
            handleProductionImeResizePointerDown={handleProductionImeResizePointerDown}
            handleProductionImeResizePointerMove={handleProductionImeResizePointerMove}
            handleProductionImeResizePointerUp={handleProductionImeResizePointerUp}
            input={input}
            inputRef={inputRef}
            isFinished={isFinished}
            isProductionImeOn={isProductionImeOn}
            onPreventDirectTextInput={onPreventDirectTextInput}
            productionImeInputShellRef={productionImeInputShellRef}
            productionImeInputWidth={productionImeInputWidth}
            startedAt={startedAt}
          />
          ) : null}
          {imeError ? <p className={css(styles, "error-line")}>{imeError}</p> : null}
        </>
      )}

      <TypingPanelResultBand
        currentRankLabel={currentRank.label}
        finishReason={isFinished ? finishReason : null}
        scoreLabel={scoreLabel}
      />
    </section>
  );
}
