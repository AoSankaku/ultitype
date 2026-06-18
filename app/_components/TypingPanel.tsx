"use client";

import {
  ArrowLeft,
  CheckCircle2,
  Crosshair,
  Lock,
  Play,
  RotateCcw,
  Timer,
  Waves,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type {
  ClipboardEvent,
  CompositionEvent,
  DragEvent,
  FormEvent,
  KeyboardEvent,
  ReactNode,
  RefObject,
  CSSProperties,
} from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  formatTimer,
  getRomajiInputProgress,
  type Metrics,
  type Rank,
  type RomajiInputTarget,
  type TypingMode,
} from "@/src/lib/typing";
import {
  createJapaneseFuriganaParts,
  type JapaneseFuriganaEntry,
  createJapaneseReadingGuideParts,
  type JapaneseReadingGuidePart,
} from "@/src/lib/challenges";
import { css, cx } from "../_lib/css-module";
import {
  getRandomPostSessionTip,
  getRandomPreSessionTip,
  postSessionTips,
  preSessionTips,
} from "../_lib/challenge-tips";
import {
  getEnglishFontFamilyCss,
  getJapaneseFontFamilyCss,
  topDisplayMetricOptions,
} from "../_lib/constants";
import { getVisibleSessionRank } from "../_lib/session-rank-visibility";
import { type SoundSettings, useTypingSounds } from "../_lib/typing-sounds";
import type {
  ChallengeLanguage,
  EnglishFontFamily,
  FinishReason,
  JapaneseFontFamily,
  KeyStabilitySample,
  MistakeFlash,
  NextChallengePreviewMode,
  RankCalculationMode,
  RomajiMarkerMode,
  RuntimeStats,
  StrictMistakeDisplayMode,
  TopDisplayMetricId,
} from "../_lib/types";
import styles from "./TypingPanel.module.css";

type BlockableTextEvent =
  | FormEvent<HTMLTextAreaElement>
  | ClipboardEvent<HTMLTextAreaElement>
  | CompositionEvent<HTMLTextAreaElement>
  | DragEvent<HTMLTextAreaElement>;

type TypingPanelProps = {
  acceptsTextInput: boolean;
  challengeLanguage: ChallengeLanguage;
  correctionDebt: number;
  currentAccuracy: number;
  currentDisplay: string;
  currentFurigana: JapaneseFuriganaEntry[];
  currentGuide: string;
  currentReading: string;
  currentRomajiTarget: RomajiInputTarget | null;
  currentRank: Rank;
  elapsedSeconds: number | null;
  finishReason: FinishReason | null;
  imeError: string;
  input: string;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  isFinished: boolean;
  isProductionBlocked: boolean;
  mistakeFlash: MistakeFlash | null;
  metrics: Metrics;
  mode: TypingMode;
  nextChallengeDisplay: string;
  nextChallengeFurigana: JapaneseFuriganaEntry[];
  nextChallengeGuide: string;
  nextChallengePreview: string;
  nextChallengePreviewMode: NextChallengePreviewMode;
  nextChallengeReading: string;
  nextChallengeRomajiTarget: RomajiInputTarget | null;
  previousChallengeDisplay: string;
  previousChallengeFurigana: JapaneseFuriganaEntry[];
  previousChallengeGuide: string;
  previousChallengeReading: string;
  progress: number;
  productionBlockReason: string;
  remainingSeconds: number;
  showFuriganaDisplay: boolean;
  showFuriganaMarker: boolean;
  showHiraganaDisplay: boolean;
  showHiraganaMarker: boolean;
  showKanjiDisplay: boolean;
  showKanjiMarker: boolean;
  showRomajiMarker: boolean;
  romajiMarkerMode: RomajiMarkerMode;
  japaneseFontFamily: JapaneseFontFamily;
  englishFontFamily: EnglishFontFamily;
  kanjiFontSize: number;
  furiganaFontScale: number;
  hiraganaFontSize: number;
  romajiFontSize: number;
  kanjiLineHeight: number;
  kanjiMarginBottom: number;
  furiganaLineHeight: number;
  furiganaMarginBottom: number;
  hiraganaLineHeight: number;
  hiraganaMarginBottom: number;
  romajiLineHeight: number;
  romajiMarginBottom: number;
  productionLongTextLineCount: number;
  soundSettings: SoundSettings;
  startedAt: number | null;
  stats: RuntimeStats;
  rankCalculationMode: RankCalculationMode;
  strictMistakeDisplayMode: StrictMistakeDisplayMode;
  strictMistakeInput: string;
  sessionModeIcon?: LucideIcon | null;
  sessionModeLabel?: string;
  prepareActionIcon?: LucideIcon;
  prepareActionTitle?: string;
  autoFocusDirectInput?: boolean;
  isPreview?: boolean;
  topDisplayMetricIds: TopDisplayMetricId[];
  onBackToModeSelect: () => void;
  onImeInput: (input: string) => void;
  onImeKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  onPrepareSession: () => void;
  onPreventDirectTextInput: (event: BlockableTextEvent) => void;
  onResetSession: () => void;
};

type DirectInputFocusRetryInput = {
  acceptsTextInput: boolean;
  autoFocusDirectInput: boolean;
  isDevelopment: boolean;
  isProductionBlocked: boolean;
};

function cssSelector(...classNames: string[]) {
  return css(styles, ...classNames)
    .split(/\s+/)
    .filter(Boolean)
    .map((className) => `.${className}`)
    .join("");
}

const challengeTipFadeMs = 260;

export function getDirectInputFocusRetryDelays({
  acceptsTextInput,
  autoFocusDirectInput,
  isDevelopment,
  isProductionBlocked,
}: DirectInputFocusRetryInput) {
  if (!isDevelopment || !autoFocusDirectInput || acceptsTextInput || isProductionBlocked) {
    return [];
  }

  return [50, 150, 300, 600];
}

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
  showRomajiMarker,
  romajiMarkerMode,
  japaneseFontFamily,
  englishFontFamily,
  kanjiFontSize,
  furiganaFontScale,
  hiraganaFontSize,
  romajiFontSize,
  kanjiLineHeight,
  kanjiMarginBottom,
  furiganaLineHeight,
  furiganaMarginBottom,
  hiraganaLineHeight,
  hiraganaMarginBottom,
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
  onBackToModeSelect,
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
    progress,
    remainingSeconds,
    stats,
    topDisplayMetricIds,
  });
  const SessionModeIcon = sessionModeIcon === undefined ? getSessionModeIcon(mode) : sessionModeIcon;
  const visibleModeLabel = sessionModeLabel ?? mode.label;
  const PrepareActionIcon = prepareActionIcon ?? Play;
  const scorePrefix =
    rankCalculationMode === "projected" && !isFinished && remainingSeconds > 0 ? "\u2248 " : "";
  const scoreLabel = `${scorePrefix}${Math.round(metrics.score).toLocaleString()} pts`;
  const visiblePrepareActionTitle = prepareActionTitle ?? "開始";
  const showDisplayText = challengeLanguage !== "ja" || showKanjiDisplay;
  const targetViewClassName = css(
    styles,
    "target-view",
    challengeLanguage !== "ja" ? "english-target-view" : "",
  );
  const targetViewStyle = {
    "--target-japanese-font-family": getJapaneseFontFamilyCss(japaneseFontFamily),
    "--target-english-font-family": getEnglishFontFamilyCss(englishFontFamily),
    "--target-kanji-font-size": `${kanjiFontSize}px`,
    "--target-furigana-font-scale": `${furiganaFontScale}em`,
    "--target-hiragana-font-size": `${hiraganaFontSize}px`,
    "--target-romaji-font-size": `${romajiFontSize}px`,
    "--target-kanji-line-height": `${kanjiLineHeight}`,
    "--target-kanji-margin-bottom": `${kanjiMarginBottom}px`,
    "--target-furigana-line-height": `${furiganaLineHeight}`,
    "--target-furigana-margin-bottom": `${furiganaMarginBottom}px`,
    "--target-hiragana-line-height": `${hiraganaLineHeight}`,
    "--target-hiragana-margin-bottom": `${hiraganaMarginBottom}px`,
    "--target-romaji-line-height": `${romajiLineHeight}`,
    "--target-romaji-margin-bottom": `${romajiMarginBottom}px`,
    "--target-production-long-lines": `${productionLongTextLineCount}`,
  } as CSSProperties;

  useLayoutEffect(() => {
    if (!autoFocusDirectInput || acceptsTextInput || isProductionBlocked) {
      return;
    }

    const focusDirectInput = () => {
      window.requestAnimationFrame(() => {
        inputRef.current?.focus({ preventScroll: true });
      });
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        focusDirectInput();
      }
    };

    const retryTimers = getDirectInputFocusRetryDelays({
      acceptsTextInput,
      autoFocusDirectInput,
      isDevelopment: process.env.NODE_ENV === "development",
      isProductionBlocked,
    }).map((delay) => window.setTimeout(focusDirectInput, delay));

    focusDirectInput();
    window.addEventListener("focus", focusDirectInput);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      retryTimers.forEach((timer) => window.clearTimeout(timer));
      window.removeEventListener("focus", focusDirectInput);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [acceptsTextInput, autoFocusDirectInput, inputRef, isProductionBlocked, mode.id]);

  function handleBackToModeSelect() {
    playTypingSound("back");
    onBackToModeSelect();
  }

  return (
    <section
      className={css(styles, "practice-panel", acceptsTextInput ? "ime-panel" : "direct-panel", isPreview ? "preview-panel" : "")}
      aria-label="typing practice"
    >
      <div className={css(styles, "meter-row")}>
        {topDisplayMetrics.map((metric) => (
          <Metric
            icon={metric.id === "remainingTime" ? <Timer size={17} /> : undefined}
            key={metric.id}
            label={metric.label}
            value={metric.value}
          />
        ))}
      </div>

      <div className={css(styles, "progress-track")} aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>

      <div className={css(styles, "session-head")}>
        <div>
          <p className={css(styles, "mode-label")}>{visibleModeLabel}</p>
          <h2 className={css(styles, "session-title")}>
            {SessionModeIcon ? (
              <span className={css(styles, "session-mode-symbol")} aria-label={visibleModeLabel}>
                <SessionModeIcon size={72} strokeWidth={1.6} aria-hidden="true" />
              </span>
            ) : null}
            <span
              aria-label={visibleRank.isConcealed ? "Rank hidden for the first 30 seconds" : undefined}
              className={css(styles, "session-rank-value", visibleRank.isConcealed ? "concealed" : "")}
            >
              {visibleRank.label}
            </span>
            <span>{scoreLabel}</span>
          </h2>
        </div>
        <div className={css(styles, "actions")}>
          <button
            className={css(styles, "icon-button")}
            onClick={handleBackToModeSelect}
            title="モード選択"
            type="button"
          >
            <ArrowLeft size={18} />
          </button>
          <button
            className={css(styles, "icon-button primary")}
            onClick={onPrepareSession}
            title={visiblePrepareActionTitle}
            type="button"
          >
            <PrepareActionIcon size={18} />
          </button>
          <button
            className={css(styles, "icon-button")}
            onClick={onResetSession}
            title="リセット"
            type="button"
          >
            <RotateCcw size={18} />
          </button>
        </div>
      </div>

      {isProductionBlocked ? (
        <div className={css(styles, "locked-panel")}>
          <Lock size={28} />
          <p>{productionBlockReason}</p>
        </div>
      ) : (
        <>
          <div className={targetViewClassName} aria-label="current challenge" style={targetViewStyle}>
            {mode.requiresIme ? (
              <>
                {showDisplayText ? (
                  <DisplayText
                    display={currentDisplay}
                    furigana={currentFurigana}
                    markerProgress={null}
                    showFurigana={showFuriganaDisplay}
                    showFuriganaMarker={showFuriganaMarker}
                    showKanjiMarker={showKanjiMarker}
                  />
                ) : null}
                {showHiraganaDisplay && currentReading ? (
                  <p className={css(styles, "reading-text")}>{currentReading}</p>
                ) : null}
              </>
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
                reading={currentReading}
                romajiTarget={currentRomajiTarget}
                showFuriganaDisplay={showFuriganaDisplay}
                showFuriganaMarker={showFuriganaMarker}
                showHiraganaDisplay={showHiraganaDisplay}
                showHiraganaMarker={showHiraganaMarker}
                showKanjiMarker={showKanjiMarker}
                showRomajiMarker={showRomajiMarker}
                romajiMarkerMode={romajiMarkerMode}
                showDisplayText={showDisplayText}
                isProductionDirect={mode.group === "production"}
                currentChallengeLane={stats.completedPrompts % 2 === 0 ? "top" : "bottom"}
                completedPrompts={stats.completedPrompts}
                strictMistakeDisplayMode={strictMistakeDisplayMode}
                strictMistakeInput={strictMistakeInput}
              />
            )}
          </div>

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
            input={input}
            metrics={metrics}
            stats={stats}
          />

          {acceptsTextInput ? (
            <textarea
              aria-label="typing input"
              className={css(styles, "typing-input")}
              onChange={(event) => onImeInput(event.target.value)}
              onBeforeInput={onPreventDirectTextInput}
              onCompositionStart={onPreventDirectTextInput}
              onDrop={onPreventDirectTextInput}
              onKeyDown={onImeKeyDown}
              onPaste={onPreventDirectTextInput}
              placeholder={
                startedAt
                  ? challengeLanguage === "ja"
                    ? "IMEありで入力し、行が一致したら Enter"
                    : "英文を入力し、行が一致したら Enter"
                  : "開始ボタン、またはここで入力を始める"
              }
              ref={inputRef}
              value={input}
            />
          ) : (
            <textarea
              aria-label="direct keyboard capture"
              autoCapitalize="none"
              autoCorrect="off"
              className={css(styles, "direct-input-guard")}
              inputMode="none"
              onBeforeInput={onPreventDirectTextInput}
              onCompositionStart={onPreventDirectTextInput}
              onDrop={onPreventDirectTextInput}
              onPaste={onPreventDirectTextInput}
              readOnly
              ref={inputRef}
              spellCheck={false}
              tabIndex={-1}
              value=""
            />
          )}
          {imeError ? <p className={css(styles, "error-line")}>{imeError}</p> : null}
        </>
      )}

      {isFinished ? (
        <div className={css(styles, "result-band", finishReason === "retired" ? "retired" : "")}>
          <CheckCircle2 size={20} />
          <span>
            {finishReason === "retired"
              ? "無入力が続いたためリタイアしました"
              : `セッション終了: ${currentRank.label} / ${scoreLabel}`}
          </span>
        </div>
      ) : null}
    </section>
  );
}

function ChallengeTip({
  completedPrompts,
  isFinished,
  startedAt,
}: {
  completedPrompts: number;
  isFinished: boolean;
  startedAt: number | null;
}) {
  const phase = isFinished ? "post" : startedAt === null ? "pre" : "running";
  const fallbackTip =
    phase === "post"
      ? postSessionTips[completedPrompts % postSessionTips.length]
      : preSessionTips[completedPrompts % preSessionTips.length];
  const [tipState, setTipState] = useState<{
    isExiting: boolean;
    phase: "pre" | "post";
    text: string;
  } | null>(
    phase === "running"
      ? null
      : {
          isExiting: false,
          phase,
          text: fallbackTip,
        },
  );

  useEffect(() => {
    if (phase === "pre") {
      setTipState({
        isExiting: false,
        phase: "pre",
        text: getRandomPreSessionTip(),
      });
      return;
    }

    if (phase === "post") {
      setTipState({
        isExiting: false,
        phase: "post",
        text: getRandomPostSessionTip(),
      });
      return;
    }

    setTipState((previous) => previous && { ...previous, isExiting: true });
    const fadeTimer = window.setTimeout(() => setTipState(null), challengeTipFadeMs);

    return () => window.clearTimeout(fadeTimer);
  }, [phase]);

  if (!tipState) {
    return null;
  }

  return (
    <p
      className={css(styles, "challenge-tip", tipState.isExiting ? "exiting" : "")}
      aria-label={tipState.phase === "pre" ? "pre-session tip" : "post-session tip"}
    >
      <strong>Tips</strong>
      <span>{tipState.text}</span>
    </p>
  );
}

function ChallengeAnalysis({
  acceptsTextInput,
  currentAccuracy,
  currentDisplay,
  input,
  metrics,
  stats,
}: {
  acceptsTextInput: boolean;
  currentAccuracy: number;
  currentDisplay: string;
  input: string;
  metrics: Metrics;
  stats: RuntimeStats;
}) {
  const tiles = acceptsTextInput
    ? getImeCorrectnessTiles(input, currentDisplay)
    : getDirectCorrectnessTiles(stats.keyStabilityHistory);
  const speedMetric = getSpeedMetric(metrics.keysPerSecond);
  const driftMs = getAverageAbsoluteDrift(stats.keyStabilityHistory, metrics.paceMs);

  return (
    <section className={css(styles, "challenge-analysis")} aria-label="Live Analysis">
      <div className={css(styles, "challenge-analysis-title")}>Live Analysis</div>
      <div className={css(styles, "analysis-column correctness-column")}>
        <div className={css(styles, "analysis-heading")}>
          <span>正誤率</span>
          <strong>{(currentAccuracy * 100).toFixed(1)}%</strong>
          <small>ミス {stats.mistakes}</small>
        </div>
        <div className={css(styles, "correctness-tiles")} aria-label="正誤履歴">
          {tiles.length === 0 ? (
            <span className={css(styles, "analysis-empty")}>入力待ち</span>
          ) : (
            tiles.map((tile) => (
              <span className={css(styles, "correctness-tile", tile.state)} key={tile.id} title={tile.title}>
                {tile.label}
              </span>
            ))
          )}
        </div>
      </div>

      <div className={css(styles, "analysis-column stability-column")}>
        <div className={css(styles, "analysis-heading")}>
          <span>安定度</span>
          <strong>{(metrics.consistency * 100).toFixed(0)}%</strong>
          <small>{speedMetric.label} {speedMetric.value}</small>
        </div>
        <div className={css(styles, "analysis-metrics")}>
          <div>
            <span>平均打鍵間隔</span>
            <strong>{metrics.paceMs ? `${metrics.paceMs.toFixed(0)} ms` : "--"}</strong>
          </div>
          <div>
            <span>ズレ平均</span>
            <strong>{driftMs ? `${driftMs.toFixed(0)} ms` : "--"}</strong>
          </div>
          <div>
            <span>物理打鍵</span>
            <strong>{stats.physicalKeystrokes}</strong>
          </div>
        </div>
        <div className={css(styles, "stability-mini-chart")} aria-label="打鍵間隔の安定度グラフ">
          {stats.keyStabilityHistory.slice(-48).length === 0 ? (
            <span className={css(styles, "analysis-empty")}>入力待ち</span>
          ) : (
            stats.keyStabilityHistory.slice(-48).map((sample) => (
              <span
                className={getStabilityBarClass(sample, metrics.paceMs)}
                key={sample.id}
                style={{ height: `${getBarHeight(sample.intervalMs, metrics.paceMs)}%` }}
                title={formatSampleTitle(sample)}
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
}

function getSessionModeIcon(mode: TypingMode) {
  if (mode.group !== "practice") {
    return null;
  }

  switch (mode.id) {
    case "practice-accuracy":
      return Crosshair;
    case "practice-flow":
      return Waves;
    case "practice-speed":
      return Zap;
    default:
      return null;
  }
}

function CorrectionDebtIndicator({ debt }: { debt: number }) {
  if (debt <= 0) {
    return null;
  }

  const visibleDots = Math.min(debt, 12);

  return (
    <div aria-live="polite" className={css(styles, "correction-debt")} role="status">
      <span className={css(styles, "keycap")}>Backspace</span>
      <span className={css(styles, "debt-count")}>あと {debt} 回</span>
      <span className={css(styles, "debt-dots")} aria-hidden="true">
        {Array.from({ length: visibleDots }, (_, index) => (
          <span key={index} />
        ))}
        {debt > visibleDots ? <em>+{debt - visibleDots}</em> : null}
      </span>
    </div>
  );
}

function createTopDisplayMetrics({
  metrics,
  progress,
  remainingSeconds,
  stats,
  topDisplayMetricIds,
}: {
  metrics: Metrics;
  progress: number;
  remainingSeconds: number;
  stats: RuntimeStats;
  topDisplayMetricIds: TopDisplayMetricId[];
}) {
  const selectedIds = new Set(topDisplayMetricIds);
  return topDisplayMetricOptions
    .map((option) => option.id)
    .filter((id) => selectedIds.has(id))
    .map((id) => {
      switch (id) {
        case "remainingTime":
          return {
            id,
            label: "残り時間",
            value: formatTimer(remainingSeconds),
          };
        case "remainingPercent":
          return {
            id,
            label: "残り時間（％）",
            value: `${Math.round(clampPercent(100 - progress))}%`,
          };
        case "keysPerSecond":
          return {
            id,
            label: "打鍵/秒",
            value: metrics.keysPerSecond.toFixed(2),
          };
        case "keysPerMinute":
          return {
            id,
            label: "打鍵/分",
            value: Math.round(metrics.keysPerSecond * 60).toLocaleString(),
          };
        case "accuracy":
          return {
            id,
            label: "正確率",
            value: `${(metrics.accuracy * 100).toFixed(1)}%`,
          };
        case "mistakes":
          return {
            id,
            label: "ミス数",
            value: stats.mistakes.toString(),
          };
        case "physicalKeystrokes":
          return {
            id,
            label: "物理打鍵",
            value: stats.physicalKeystrokes.toString(),
          };
        case "completedPrompts":
          return {
            id,
            label: "完了課題",
            value: stats.completedPrompts.toString(),
          };
        case "mistakeRate":
          return {
            id,
            label: "ミス/物理打鍵",
            value: <MetricSplitValue left={stats.mistakes} right={stats.physicalKeystrokes} />,
          };
        case "correctRate":
          return {
            id,
            label: "正解/物理打鍵",
            value: <MetricSplitValue left={stats.correctCharacters} right={stats.physicalKeystrokes} />,
          };
      }
    });
}

function clampPercent(value: number) {
  return Math.min(100, Math.max(0, value));
}

type CorrectnessTile = {
  id: string;
  label: string;
  state: "correct" | "wrong" | "correction" | "neutral";
  title: string;
};

function getSpeedMetric(keysPerSecond: number) {
  return {
    label: "打鍵/秒",
    value: keysPerSecond.toFixed(2),
  };
}

function getDirectCorrectnessTiles(history: KeyStabilitySample[]): CorrectnessTile[] {
  return history.slice(-48).map((sample) => {
    const state = sample.kind === "correction" ? "correction" : sample.isCorrect ? "correct" : "wrong";
    const label = formatKeyLabel(sample.key);

    return {
      id: `direct-${sample.id}`,
      label,
      state,
      title: formatSampleTitle(sample),
    };
  });
}

function getImeCorrectnessTiles(input: string, target: string): CorrectnessTile[] {
  const inputCharacters = Array.from(input);
  const targetCharacters = Array.from(target);
  const startIndex = Math.max(0, inputCharacters.length - 48);

  return inputCharacters.slice(startIndex).map((character, offset) => {
    const index = startIndex + offset;
    const expected = targetCharacters[index];
    const isCorrect = expected !== undefined && character === expected;
    const label = formatKeyLabel(character);

    return {
      id: `ime-${index}-${character}`,
      label,
      state: expected === undefined ? "wrong" : isCorrect ? "correct" : "wrong",
      title: `${label} / ${isCorrect ? "正打" : "ミス"}`,
    };
  });
}

function getAverageAbsoluteDrift(history: KeyStabilitySample[], averageMs: number) {
  const intervals = history
    .map((sample) => sample.intervalMs)
    .filter((interval): interval is number => interval !== null);

  if (intervals.length === 0 || averageMs === 0) {
    return 0;
  }

  return intervals.reduce((sum, interval) => sum + Math.abs(interval - averageMs), 0) / intervals.length;
}

function getStabilityBarClass(sample: KeyStabilitySample, averageMs: number) {
  if (!sample.isCorrect) {
    return css(styles, "stability-mini-bar wrong");
  }

  if (sample.kind === "correction") {
    return css(styles, "stability-mini-bar correction");
  }

  if (sample.intervalMs === null || averageMs === 0) {
    return css(styles, "stability-mini-bar neutral");
  }

  const ratio = sample.intervalMs / averageMs;
  if (ratio < 0.72) {
    return css(styles, "stability-mini-bar fast");
  }
  if (ratio > 1.42) {
    return css(styles, "stability-mini-bar slow");
  }
  return css(styles, "stability-mini-bar stable");
}

function getBarHeight(intervalMs: number | null, averageMs: number) {
  if (intervalMs === null || averageMs === 0) {
    return 34;
  }

  return Math.max(16, Math.min(100, (intervalMs / averageMs) * 54));
}

function formatKeyLabel(key: string) {
  if (key === " ") {
    return "SP";
  }

  if (key === "Backspace") {
    return "BS";
  }

  if (key.length > 2) {
    return "IME";
  }

  return key;
}

function formatSampleTitle(sample: KeyStabilitySample) {
  const interval = sample.intervalMs === null ? "開始" : `${sample.intervalMs} ms`;
  const state = sample.kind === "correction" ? "修正" : sample.isCorrect ? "正打" : "ミス";
  return `${formatKeyLabel(sample.key)} / ${interval} / ${state}`;
}

function Metric({
  label,
  value,
  icon,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className={css(styles, "metric")}>
      <span>
        {icon}
        {label}
      </span>
      <strong>{value}</strong>
    </div>
  );
}

function MetricSplitValue({ left, right }: { left: number; right: number }) {
  return (
    <span className={css(styles, "metric-split-value")}>
      <span>{left.toLocaleString()}</span>
      <span>/</span>
      <span>{right.toLocaleString()}</span>
    </span>
  );
}

function DirectChallengeView({
  display,
  englishFontFamily,
  furigana,
  guide,
  input,
  japaneseFontFamily,
  mistakeFlash,
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
  reading,
  romajiTarget,
  showFuriganaDisplay,
  showFuriganaMarker,
  showHiraganaDisplay,
  showHiraganaMarker,
  showDisplayText,
  isProductionDirect,
  currentChallengeLane,
  completedPrompts,
  showKanjiMarker,
  showRomajiMarker,
  romajiMarkerMode,
  strictMistakeDisplayMode,
  strictMistakeInput,
}: {
  display: string;
  englishFontFamily: EnglishFontFamily;
  furigana: JapaneseFuriganaEntry[];
  guide: string;
  input: string;
  japaneseFontFamily: JapaneseFontFamily;
  mistakeFlash: MistakeFlash | null;
  nextChallengeDisplay: string;
  nextChallengeFurigana: JapaneseFuriganaEntry[];
  nextChallengeGuide: string;
  nextChallengePreview: string;
  nextChallengePreviewMode: NextChallengePreviewMode;
  nextChallengeReading: string;
  nextChallengeRomajiTarget: RomajiInputTarget | null;
  previousChallengeDisplay: string;
  previousChallengeFurigana: JapaneseFuriganaEntry[];
  previousChallengeGuide: string;
  previousChallengeReading: string;
  reading: string;
  romajiTarget: RomajiInputTarget | null;
  showFuriganaDisplay: boolean;
  showFuriganaMarker: boolean;
  showHiraganaDisplay: boolean;
  showHiraganaMarker: boolean;
  showDisplayText: boolean;
  isProductionDirect: boolean;
  currentChallengeLane: "top" | "bottom";
  completedPrompts: number;
  showKanjiMarker: boolean;
  showRomajiMarker: boolean;
  romajiMarkerMode: RomajiMarkerMode;
  strictMistakeDisplayMode: StrictMistakeDisplayMode;
  strictMistakeInput: string;
}) {
  const challengeContent = (
    <ChallengeTextStack
      display={display}
      furigana={furigana}
      guide={guide}
      input={input}
      mistakeFlash={mistakeFlash}
      reading={reading}
      renderMarkers={true}
      romajiTarget={romajiTarget}
      showDisplayText={showDisplayText}
      showFuriganaDisplay={showFuriganaDisplay}
      showFuriganaMarker={showFuriganaMarker}
      showHiraganaDisplay={showHiraganaDisplay}
      showHiraganaMarker={showHiraganaMarker}
      showKanjiMarker={showKanjiMarker}
      showRomajiMarker={showRomajiMarker}
      romajiMarkerMode={romajiMarkerMode}
      strictMistakeDisplayMode={strictMistakeDisplayMode}
      strictMistakeInput={strictMistakeInput}
    />
  );
  const nextChallengeContent = (
    <ChallengeTextStack
      display={nextChallengeDisplay}
      furigana={nextChallengeFurigana}
      guide={nextChallengeGuide}
      input=""
      mistakeFlash={null}
      reading={nextChallengeReading}
      renderMarkers={false}
      romajiTarget={nextChallengeRomajiTarget}
      showDisplayText={showDisplayText}
      showFuriganaDisplay={showFuriganaDisplay}
      showFuriganaMarker={false}
      showHiraganaDisplay={showHiraganaDisplay}
      showHiraganaMarker={false}
      showKanjiMarker={false}
      showRomajiMarker={false}
      romajiMarkerMode={romajiMarkerMode}
      strictMistakeDisplayMode="none"
      strictMistakeInput=""
    />
  );

  if (isProductionDirect) {
    return (
      <ProductionDirectChallengeView
        display={display}
        englishFontFamily={englishFontFamily}
        furigana={furigana}
        guide={guide}
        input={input}
        japaneseFontFamily={japaneseFontFamily}
        mistakeFlash={mistakeFlash}
        nextChallengeDisplay={nextChallengeDisplay}
        nextChallengeFurigana={nextChallengeFurigana}
        nextChallengeGuide={nextChallengeRomajiTarget?.guide ?? nextChallengeGuide}
        nextChallengePreviewMode={nextChallengePreviewMode}
        nextChallengeReading={nextChallengeReading}
        nextChallengeRomajiTarget={nextChallengeRomajiTarget}
        completedPrompts={completedPrompts}
        previousChallengeGuide={previousChallengeGuide}
        previousChallengeReading={previousChallengeReading}
        reading={reading}
        romajiTarget={romajiTarget}
        showDisplayText={showDisplayText}
        showFuriganaDisplay={showFuriganaDisplay}
        showFuriganaMarker={showFuriganaMarker}
        showHiraganaDisplay={showHiraganaDisplay}
        showHiraganaMarker={showHiraganaMarker}
        showKanjiMarker={showKanjiMarker}
        showRomajiMarker={showRomajiMarker}
        romajiMarkerMode={romajiMarkerMode}
        strictMistakeDisplayMode={strictMistakeDisplayMode}
        strictMistakeInput={strictMistakeInput}
      />
    );
  }

  if (!nextChallengePreview || nextChallengePreviewMode === "none") {
    return challengeContent;
  }

  if (nextChallengePreviewMode === "center-scroll") {
    return (
      <div className={css(styles, "challenge-preview-layout center-scroll")}>
        <ContinuousChallengeTextStack
          display={display}
          englishFontFamily={englishFontFamily}
          furigana={furigana}
          guide={guide}
          input={input}
          japaneseFontFamily={japaneseFontFamily}
          mistakeFlash={mistakeFlash}
          nextChallengeDisplay={nextChallengeDisplay}
          nextChallengeFurigana={nextChallengeFurigana}
          nextChallengeGuide={nextChallengeRomajiTarget?.guide ?? nextChallengeGuide}
          nextChallengeReading={nextChallengeReading}
          previousChallengeDisplay={previousChallengeDisplay}
          previousChallengeFurigana={previousChallengeFurigana}
          previousChallengeGuide={previousChallengeGuide}
          previousChallengeReading={previousChallengeReading}
          reading={reading}
          romajiTarget={romajiTarget}
          showDisplayText={showDisplayText}
          showFuriganaDisplay={showFuriganaDisplay}
          showFuriganaMarker={showFuriganaMarker}
          showHiraganaDisplay={showHiraganaDisplay}
          showHiraganaMarker={showHiraganaMarker}
          showKanjiMarker={showKanjiMarker}
          showRomajiMarker={showRomajiMarker}
          romajiMarkerMode={romajiMarkerMode}
          startsAtLeft={completedPrompts === 0}
          strictMistakeDisplayMode={strictMistakeDisplayMode}
          strictMistakeInput={strictMistakeInput}
        />
      </div>
    );
  }

  if (nextChallengePreviewMode === "split-alternate") {
    const nextChallengeLane = currentChallengeLane === "top" ? "bottom" : "top";
    const currentLaneContent = (
      <div
        className={css(styles, "challenge-preview-lane current-lane", `${currentChallengeLane}-lane`, "active-lane")}
      >
        {challengeContent}
      </div>
    );
    const nextLaneContent = (
      <NextChallengePreviewLane
        lane={nextChallengeLane}
        nextChallengeContent={nextChallengeContent}
      />
    );

    return (
      <div className={css(styles, "challenge-preview-layout split-alternate")}>
        {currentChallengeLane === "top" ? currentLaneContent : nextLaneContent}
        <div className={css(styles, "challenge-preview-separator")} aria-hidden="true" />
        {currentChallengeLane === "top" ? nextLaneContent : currentLaneContent}
      </div>
    );
  }

  return (
    <div className={css(styles, "challenge-preview-layout split-slide")}>
      <div className={css(styles, "challenge-preview-lane current-lane top-lane")}>{challengeContent}</div>
      <div className={css(styles, "challenge-preview-separator")} aria-hidden="true" />
      <NextChallengePreviewLane lane="bottom" nextChallengeContent={nextChallengeContent} />
    </div>
  );
}

function NextChallengePreviewLane({
  lane,
  nextChallengeContent,
}: {
  lane: "top" | "bottom";
  nextChallengeContent: ReactNode;
}) {
  return (
    <div className={css(styles, "challenge-preview-lane next-lane", `${lane}-lane`)}>
      {nextChallengeContent}
    </div>
  );
}

function ProductionDirectChallengeView({
  display,
  englishFontFamily,
  furigana,
  guide,
  input,
  japaneseFontFamily,
  mistakeFlash,
  nextChallengeDisplay,
  nextChallengeFurigana,
  nextChallengeGuide,
  nextChallengePreviewMode,
  nextChallengeReading,
  nextChallengeRomajiTarget,
  completedPrompts,
  previousChallengeGuide,
  previousChallengeReading,
  reading,
  romajiTarget,
  showDisplayText,
  showFuriganaDisplay,
  showFuriganaMarker,
  showHiraganaDisplay,
  showHiraganaMarker,
  showKanjiMarker,
  showRomajiMarker,
  romajiMarkerMode,
  strictMistakeDisplayMode,
  strictMistakeInput,
}: {
  display: string;
  englishFontFamily: EnglishFontFamily;
  furigana: JapaneseFuriganaEntry[];
  guide: string;
  input: string;
  japaneseFontFamily: JapaneseFontFamily;
  mistakeFlash: MistakeFlash | null;
  nextChallengeDisplay: string;
  nextChallengeFurigana: JapaneseFuriganaEntry[];
  nextChallengeGuide: string;
  nextChallengePreviewMode: NextChallengePreviewMode;
  nextChallengeReading: string;
  nextChallengeRomajiTarget: RomajiInputTarget | null;
  completedPrompts: number;
  previousChallengeGuide: string;
  previousChallengeReading: string;
  reading: string;
  romajiTarget: RomajiInputTarget | null;
  showDisplayText: boolean;
  showFuriganaDisplay: boolean;
  showFuriganaMarker: boolean;
  showHiraganaDisplay: boolean;
  showHiraganaMarker: boolean;
  showKanjiMarker: boolean;
  showRomajiMarker: boolean;
  romajiMarkerMode: RomajiMarkerMode;
  strictMistakeDisplayMode: StrictMistakeDisplayMode;
  strictMistakeInput: string;
}) {
  return (
    <div className={css(styles, "production-direct-layout")}>
      {showDisplayText ? (
        <ProductionLongDisplay
          display={display}
          furigana={furigana}
          input={input}
          nextChallengeDisplay={nextChallengeDisplay}
          nextChallengeFurigana={nextChallengeFurigana}
          romajiTarget={romajiTarget}
          showFurigana={showFuriganaDisplay}
          showFuriganaMarker={showFuriganaMarker}
          showKanjiMarker={showKanjiMarker}
        />
      ) : null}
      {nextChallengePreviewMode === "center-scroll" ? (
        <div className={css(styles, "challenge-preview-layout center-scroll production-direct-inputs")}>
          <ContinuousChallengeTextStack
            display=""
            englishFontFamily={englishFontFamily}
            furigana={[]}
            guide={guide}
            input={input}
            japaneseFontFamily={japaneseFontFamily}
            mistakeFlash={mistakeFlash}
            nextChallengeDisplay=""
            nextChallengeFurigana={[]}
            nextChallengeGuide={nextChallengeGuide}
            nextChallengeReading={nextChallengeReading}
            previousChallengeDisplay=""
            previousChallengeFurigana={[]}
            previousChallengeGuide={previousChallengeGuide}
            previousChallengeReading={previousChallengeReading}
            reading={reading}
            romajiTarget={romajiTarget}
            showDisplayText={false}
            showFuriganaDisplay={false}
            showFuriganaMarker={false}
            showHiraganaDisplay={showHiraganaDisplay}
            showHiraganaMarker={showHiraganaMarker}
            showKanjiMarker={false}
            showRomajiMarker={showRomajiMarker}
            romajiMarkerMode={romajiMarkerMode}
            startsAtLeft={completedPrompts === 0}
            strictMistakeDisplayMode={strictMistakeDisplayMode}
            strictMistakeInput={strictMistakeInput}
          />
        </div>
      ) : (
        <ProductionSegmentedInputStack
          guide={guide}
          input={input}
          mistakeFlash={mistakeFlash}
          nextChallengeGuide={nextChallengeGuide}
          nextChallengeReading={nextChallengeReading}
          nextChallengeRomajiTarget={nextChallengeRomajiTarget}
          previewMode={nextChallengePreviewMode}
          reading={reading}
          romajiTarget={romajiTarget}
          showHiraganaDisplay={showHiraganaDisplay}
          showHiraganaMarker={showHiraganaMarker}
          showRomajiMarker={showRomajiMarker}
          romajiMarkerMode={romajiMarkerMode}
          strictMistakeDisplayMode={strictMistakeDisplayMode}
          strictMistakeInput={strictMistakeInput}
        />
      )}
    </div>
  );
}

function ProductionLongDisplay({
  display,
  furigana,
  input,
  nextChallengeDisplay,
  nextChallengeFurigana,
  romajiTarget,
  showFurigana,
  showFuriganaMarker,
  showKanjiMarker,
}: {
  display: string;
  furigana: JapaneseFuriganaEntry[];
  input: string;
  nextChallengeDisplay: string;
  nextChallengeFurigana: JapaneseFuriganaEntry[];
  romajiTarget: RomajiInputTarget | null;
  showFurigana: boolean;
  showFuriganaMarker: boolean;
  showKanjiMarker: boolean;
}) {
  const markerProgress = romajiTarget ? getRomajiInputProgress(romajiTarget, input) : null;
  const markerKey = `${markerProgress?.currentTokenIndex ?? 0}-${markerProgress?.completedTokens ?? 0}`;
  const { bodyRef, scrollLines } = useProductionLongBodyScroll(markerKey);
  const scrollStyle = {
    "--production-long-scroll-lines": `${scrollLines}`,
  } as CSSProperties;

  return (
    <div className={css(styles, "production-long-body")} ref={bodyRef}>
      <div className={css(styles, "production-long-scroll-content")} style={scrollStyle}>
        <ProductionLongDisplayText
          display={display}
          furigana={furigana}
          markerProgress={showKanjiMarker || showFuriganaMarker ? markerProgress : null}
          scrollMarkerProgress={markerProgress}
          showFurigana={showFurigana}
          showFuriganaMarker={showFuriganaMarker}
          showKanjiMarker={showKanjiMarker}
        />
        {nextChallengeDisplay ? (
          <div className={css(styles, "production-long-next-spacer")}>
            <ProductionLongDisplayText
              display={nextChallengeDisplay}
              furigana={nextChallengeFurigana}
              markerProgress={null}
              scrollMarkerProgress={null}
              showFurigana={showFurigana}
              showFuriganaMarker={false}
              showKanjiMarker={false}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function useProductionLongBodyScroll(markerKey: string) {
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const [scrollLines, setScrollLines] = useState(0);

  useLayoutEffect(() => {
    const body = bodyRef.current;
    if (!body) {
      return;
    }

    let animationFrameId: number | null = null;

    const updateScrollLines = () => {
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
      }

      animationFrameId = window.requestAnimationFrame(() => {
        const content = body.querySelector<HTMLElement>(cssSelector("production-long-scroll-content"));
        const textLine = content?.querySelector<HTMLElement>(
          cssSelector("production-long-display-text"),
        );
        const marker = content?.querySelector<HTMLElement>(
          cssSelector("production-long-scroll-target"),
        );

        if (!content || !textLine || !marker) {
          setScrollLines(0);
          animationFrameId = null;
          return;
        }

        const lineHeight = getProductionLongLineHeight(textLine);
        const markerTop = marker.getBoundingClientRect().top - content.getBoundingClientRect().top;
        const nextScrollLines = calculateProductionLongScrollLines(markerTop, lineHeight);
        setScrollLines((current) => (current === nextScrollLines ? current : nextScrollLines));
        animationFrameId = null;
      });
    };

    updateScrollLines();

    const resizeObserver =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(updateScrollLines);
    const content = body.querySelector<HTMLElement>(".production-long-scroll-content");
    resizeObserver?.observe(body);
    if (content) {
      resizeObserver?.observe(content);
    }
    window.addEventListener("resize", updateScrollLines);

    return () => {
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
      }
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updateScrollLines);
    };
  }, [markerKey]);

  return { bodyRef, scrollLines };
}

function getProductionLongLineHeight(element: HTMLElement) {
  const style = window.getComputedStyle(element);
  const lineHeight = Number.parseFloat(style.lineHeight);
  if (Number.isFinite(lineHeight) && lineHeight > 0) {
    return lineHeight;
  }

  const fontSize = Number.parseFloat(style.fontSize);
  return Number.isFinite(fontSize) && fontSize > 0 ? fontSize * 1.45 : 0;
}

export function calculateProductionLongScrollLines(markerTop: number, lineHeight: number) {
  if (!Number.isFinite(markerTop) || !Number.isFinite(lineHeight) || markerTop <= 0 || lineHeight <= 0) {
    return 0;
  }

  return Math.max(0, Math.floor(markerTop / lineHeight));
}

function ProductionLongDisplayText({
  display,
  furigana,
  markerProgress,
  scrollMarkerProgress,
  showFurigana,
  showFuriganaMarker,
  showKanjiMarker,
}: {
  display: string;
  furigana: JapaneseFuriganaEntry[];
  markerProgress: { completedTokens: number; currentTokenIndex: number } | null;
  scrollMarkerProgress: { completedTokens: number; currentTokenIndex: number } | null;
  showFurigana: boolean;
  showFuriganaMarker: boolean;
  showKanjiMarker: boolean;
}) {
  if (furigana.length === 0) {
    return <p className={css(styles, "display-text production-long-display-text")}>{display}</p>;
  }

  let tokenStart = 0;

  return (
    <p className={css(styles, "display-text production-long-display-text")}>
      {createJapaneseFuriganaParts(display, furigana).map((part, index) => {
        const partTokenStart = tokenStart;
        const tokenCount = countJapaneseReadingTokens(part.ruby ?? part.text);
        const tokenEnd = tokenStart + tokenCount;
        tokenStart = tokenEnd;

        if (part.ruby) {
          const subRubies = splitRubyPart(part.text, part.ruby, partTokenStart);
          return subRubies.map((subRuby, subIndex) => {
            const isScrollTarget = shouldPlaceProductionLongScrollTarget(
              scrollMarkerProgress,
              subRuby.tokenStart,
              subRuby.tokenEnd,
            );

            if (showFurigana) {
              const rubyClassName = getDisplayMarkerClassName(
                "display-ruby",
                showKanjiMarker,
                markerProgress,
                subRuby.tokenStart,
                subRuby.tokenEnd,
              );
              const rubyText =
                showFuriganaMarker && markerProgress !== null
                  ? renderFuriganaMarkerCharacters(
                    subRuby.ruby,
                    subRuby.tokenStart,
                    markerProgress.completedTokens,
                    markerProgress.currentTokenIndex,
                  )
                  : subRuby.ruby;

              return (
                <span
                  className={isScrollTarget ? css(styles, "production-long-scroll-target") : undefined}
                  key={`production-display-ruby-wrapper-${part.text}-${index}-${subIndex}`}
                >
                  <ruby className={rubyClassName}>
                    {subRuby.kanji}
                    <rt>{rubyText}</rt>
                  </ruby>
                </span>
              );
            }

            if (showKanjiMarker && markerProgress !== null) {
              return (
                <span
                  className={isScrollTarget ? css(styles, "production-long-scroll-target") : undefined}
                  key={`production-display-marker-wrapper-${part.text}-${index}-${subIndex}`}
                >
                  {renderDisplayMarkerCharacters(
                    subRuby.kanji,
                    subRuby.tokenStart,
                    markerProgress.completedTokens,
                    markerProgress.currentTokenIndex,
                    `production-display-${index}-${subIndex}`,
                  )}
                </span>
              );
            }

            return (
              <span
                className={css(styles, "display-plain", isScrollTarget ? "production-long-scroll-target" : "")}
                key={`production-display-plain-${part.text}-${index}-${subIndex}`}
              >
                {subRuby.kanji}
              </span>
            );
          });
        }

        const isScrollTarget = shouldPlaceProductionLongScrollTarget(
          scrollMarkerProgress,
          partTokenStart,
          tokenEnd,
        );

        if (showKanjiMarker && markerProgress !== null) {
          return (
            <span
              className={isScrollTarget ? css(styles, "production-long-scroll-target") : undefined}
              key={`production-display-marker-wrapper-${part.text}-${index}`}
            >
              {renderDisplayMarkerCharacters(
                part.text,
                partTokenStart,
                markerProgress.completedTokens,
                markerProgress.currentTokenIndex,
                `production-display-${index}`,
              )}
            </span>
          );
        }

        return (
          <span
            className={css(styles, "display-plain", isScrollTarget ? "production-long-scroll-target" : "")}
            key={`production-display-plain-${part.text}-${index}`}
          >
            {part.text}
          </span>
        );
      })}
    </p>
  );
}

function shouldPlaceProductionLongScrollTarget(
  markerProgress: { completedTokens: number; currentTokenIndex: number } | null,
  tokenStart: number,
  tokenEnd: number,
) {
  return (
    markerProgress !== null &&
    tokenStart <= markerProgress.currentTokenIndex &&
    markerProgress.currentTokenIndex < tokenEnd
  );
}

type ProductionTextSegment = {
  text: string;
  tokenStart: number;
  tokenEnd: number;
};

function ProductionSegmentedInputStack({
  guide,
  input,
  mistakeFlash,
  nextChallengeGuide,
  nextChallengeReading,
  nextChallengeRomajiTarget,
  previewMode,
  reading,
  romajiTarget,
  showHiraganaDisplay,
  showHiraganaMarker,
  showRomajiMarker,
  romajiMarkerMode,
  strictMistakeDisplayMode,
  strictMistakeInput,
}: {
  guide: string;
  input: string;
  mistakeFlash: MistakeFlash | null;
  nextChallengeGuide: string;
  nextChallengeReading: string;
  nextChallengeRomajiTarget: RomajiInputTarget | null;
  previewMode: NextChallengePreviewMode;
  reading: string;
  romajiTarget: RomajiInputTarget | null;
  showHiraganaDisplay: boolean;
  showHiraganaMarker: boolean;
  showRomajiMarker: boolean;
  romajiMarkerMode: RomajiMarkerMode;
  strictMistakeDisplayMode: StrictMistakeDisplayMode;
  strictMistakeInput: string;
}) {
  const readingSegments = createReadingPunctuationSegments(reading);
  const guideSegments = createRomajiPunctuationSegments(romajiTarget, guide);
  const currentTokenIndex = romajiTarget
    ? getRomajiInputProgress(romajiTarget, input).currentTokenIndex
    : Array.from(input).length;
  const activeIndex = getActiveProductionSegmentIndex(guideSegments, currentTokenIndex);
  const nextReadingSegments = createReadingPunctuationSegments(nextChallengeReading);
  const nextGuideSegments = createRomajiPunctuationSegments(nextChallengeRomajiTarget, nextChallengeGuide);
  const currentSegment = {
    reading: readingSegments[activeIndex] ?? createFallbackSegment(reading),
    guide: guideSegments[activeIndex] ?? createFallbackSegment(guide),
  };
  const nextSegment = {
    reading:
      readingSegments[activeIndex + 1] ??
      nextReadingSegments[0] ??
      createFallbackSegment(nextChallengeReading),
    guide:
      guideSegments[activeIndex + 1] ??
      nextGuideSegments[0] ??
      createFallbackSegment(nextChallengeGuide),
  };
  const currentLane = previewMode === "split-alternate" && activeIndex % 2 === 1 ? "bottom" : "top";
  const nextLane = currentLane === "top" ? "bottom" : "top";
  const currentContent = (
    <ProductionSegmentLaneContent
      guideSegment={currentSegment.guide}
      input={input}
      isCurrent
      mistakeFlash={mistakeFlash}
      reading={reading}
      readingSegment={currentSegment.reading}
      romajiTarget={romajiTarget}
      showHiraganaDisplay={showHiraganaDisplay}
      showHiraganaMarker={showHiraganaMarker}
      showRomajiMarker={showRomajiMarker}
      romajiMarkerMode={romajiMarkerMode}
      strictMistakeDisplayMode={strictMistakeDisplayMode}
      strictMistakeInput={strictMistakeInput}
    />
  );
  const nextContent = (
    <ProductionSegmentLaneContent
      guideSegment={nextSegment.guide}
      input=""
      isCurrent={false}
      mistakeFlash={null}
      reading={
        readingSegments[activeIndex + 1] ? reading : nextChallengeReading
      }
      readingSegment={nextSegment.reading}
      romajiTarget={guideSegments[activeIndex + 1] ? romajiTarget : nextChallengeRomajiTarget}
      showHiraganaDisplay={showHiraganaDisplay}
      showHiraganaMarker={false}
      showRomajiMarker={false}
      romajiMarkerMode={romajiMarkerMode}
      strictMistakeDisplayMode="none"
      strictMistakeInput=""
    />
  );

  if (previewMode === "none") {
    return (
      <div className={css(styles, "production-segmented-stack")}>
        <div className={css(styles, "challenge-preview-lane current-lane top-lane active-lane")}>
          {currentContent}
        </div>
      </div>
    );
  }

  const currentLaneContent = (
    <div className={css(styles, "challenge-preview-lane current-lane", `${currentLane}-lane`, "active-lane")}>
      {currentContent}
    </div>
  );
  const nextLaneContent = (
    <div className={css(styles, "challenge-preview-lane next-lane", `${nextLane}-lane`)}>
      {nextContent}
    </div>
  );

  return (
    <div className={css(styles, "production-segmented-stack", previewMode)}>
      {currentLane === "top" ? currentLaneContent : nextLaneContent}
      <div className={css(styles, "challenge-preview-separator")} aria-hidden="true" />
      {currentLane === "top" ? nextLaneContent : currentLaneContent}
    </div>
  );
}

function ProductionSegmentLaneContent({
  guideSegment,
  input,
  isCurrent,
  mistakeFlash,
  reading,
  readingSegment,
  romajiTarget,
  showHiraganaDisplay,
  showHiraganaMarker,
  showRomajiMarker,
  romajiMarkerMode,
  strictMistakeDisplayMode,
  strictMistakeInput,
}: {
  guideSegment: ProductionTextSegment;
  input: string;
  isCurrent: boolean;
  mistakeFlash: MistakeFlash | null;
  reading: string;
  readingSegment: ProductionTextSegment;
  romajiTarget: RomajiInputTarget | null;
  showHiraganaDisplay: boolean;
  showHiraganaMarker: boolean;
  showRomajiMarker: boolean;
  romajiMarkerMode: RomajiMarkerMode;
  strictMistakeDisplayMode: StrictMistakeDisplayMode;
  strictMistakeInput: string;
}) {
  return (
    <>
      {showHiraganaDisplay && readingSegment.text ? (
        <p className={css(styles, "reading-text")}>
          {isCurrent && romajiTarget
            ? renderReadingGuideSegmentCharacters(
              reading,
              readingSegment,
              romajiTarget,
              input,
              mistakeFlash,
              showHiraganaMarker,
            )
            : renderPlainSegmentCharacters(readingSegment.text)}
        </p>
      ) : null}
      <p className={css(styles, "input-target")} aria-label="romaji input target">
        {isCurrent && romajiTarget
          ? renderRomajiGuideSegmentCharacters(
            romajiTarget,
            guideSegment,
            input,
            mistakeFlash,
            strictMistakeInput,
            strictMistakeDisplayMode,
            showRomajiMarker,
            romajiMarkerMode,
          )
          : renderPlainSegmentCharacters(guideSegment.text)}
      </p>
    </>
  );
}

function createFallbackSegment(text: string): ProductionTextSegment {
  return {
    text,
    tokenStart: 0,
    tokenEnd: Math.max(0, Array.from(text).length),
  };
}

function createReadingPunctuationSegments(reading: string): ProductionTextSegment[] {
  const parts = createJapaneseReadingGuideParts(reading);
  const segments: ProductionTextSegment[] = [];
  let text = "";
  let tokenStart: number | null = null;
  let tokenEnd = 0;

  parts.forEach((part) => {
    if (part.kind === "reading") {
      tokenStart ??= part.tokenStart;
      tokenEnd = part.tokenEnd;
    }

    text += part.text;

    if (isProductionSegmentPunctuation(part.text)) {
      segments.push({
        text,
        tokenStart: tokenStart ?? tokenEnd,
        tokenEnd,
      });
      text = "";
      tokenStart = null;
    }
  });

  if (text) {
    segments.push({
      text,
      tokenStart: tokenStart ?? tokenEnd,
      tokenEnd,
    });
  }

  return segments.length > 0 ? segments : [createFallbackSegment(reading)];
}

function createRomajiPunctuationSegments(
  target: RomajiInputTarget | null,
  guide: string,
): ProductionTextSegment[] {
  if (!target) {
    return splitPlainTextPunctuationSegments(guide);
  }

  const segments: ProductionTextSegment[] = [];
  let text = "";
  let tokenStart: number | null = null;
  let tokenEnd = 0;

  target.parts.forEach((part) => {
    if (part.kind === "input") {
      tokenStart ??= part.tokenIndex;
      tokenEnd = part.tokenIndex + 1;
    }

    text += part.text;

    if (isProductionSegmentPunctuation(part.text)) {
      segments.push({
        text,
        tokenStart: tokenStart ?? tokenEnd,
        tokenEnd,
      });
      text = "";
      tokenStart = null;
    }
  });

  if (text) {
    segments.push({
      text,
      tokenStart: tokenStart ?? tokenEnd,
      tokenEnd,
    });
  }

  return segments.length > 0 ? segments : [createFallbackSegment(guide)];
}

function splitPlainTextPunctuationSegments(text: string): ProductionTextSegment[] {
  const segments: ProductionTextSegment[] = [];
  let segment = "";
  let tokenStart = 0;
  let tokenEnd = 0;

  Array.from(text).forEach((character) => {
    segment += character;
    tokenEnd += 1;
    if (isProductionSegmentPunctuation(character)) {
      segments.push({ text: segment, tokenStart, tokenEnd });
      segment = "";
      tokenStart = tokenEnd;
    }
  });

  if (segment) {
    segments.push({ text: segment, tokenStart, tokenEnd });
  }

  return segments.length > 0 ? segments : [createFallbackSegment(text)];
}

function getActiveProductionSegmentIndex(
  segments: ProductionTextSegment[],
  currentTokenIndex: number,
) {
  const activeIndex = segments.findIndex(
    (segment) =>
      segment.tokenStart <= currentTokenIndex && currentTokenIndex < segment.tokenEnd,
  );

  if (activeIndex >= 0) {
    return activeIndex;
  }

  if (segments.length === 0) {
    return 0;
  }

  return currentTokenIndex >= (segments.at(-1)?.tokenEnd ?? 0) ? segments.length - 1 : 0;
}

function isProductionSegmentPunctuation(text: string) {
  return /[、。,.!?！？]/u.test(text);
}

function renderPlainSegmentCharacters(text: string) {
  return Array.from(text).map((character, index) => (
    <span className={css(styles, "char")} key={`segment-plain-${character}-${index}`}>
      {character}
    </span>
  ));
}

function renderReadingGuideSegmentCharacters(
  reading: string,
  segment: ProductionTextSegment,
  target: RomajiInputTarget,
  input: string,
  mistakeFlash: MistakeFlash | null,
  showMarker: boolean,
) {
  const progress = getRomajiInputProgress(target, input);
  const flashTokenIndex = mistakeFlash ? progress.currentTokenIndex : null;

  return createJapaneseReadingGuideParts(reading)
    .filter(
      (part) =>
        part.kind === "visual" ||
        (segment.tokenStart <= part.tokenStart && part.tokenEnd <= segment.tokenEnd),
    )
    .map((part, partIndex) => {
      if (part.kind === "visual") {
        return (
          <span className={css(styles, "visual-space")} key={`segment-reading-space-${partIndex}`} aria-hidden="true">
            {part.text}
          </span>
        );
      }

      const isCompleted = part.tokenEnd <= progress.completedTokens;
      const isCurrent =
        part.tokenStart <= progress.currentTokenIndex &&
        progress.currentTokenIndex < part.tokenEnd;
      const isMistakeFlash = flashTokenIndex !== null && isCurrent && !isCompleted;
      const className = isCompleted
        ? css(styles, "char correct")
        : isCurrent && showMarker
          ? css(styles, "char current")
          : css(styles, "char");
      const flashClassName = isMistakeFlash ? cx(className, css(styles, "mistake-flash")) : className;
      const flashKey = isMistakeFlash && mistakeFlash ? mistakeFlash.id : "idle";

      return (
        <span
          className={flashClassName}
          key={`segment-reading-${part.tokenStart}-${part.text}-${partIndex}-${flashKey}`}
        >
          {part.text}
        </span>
      );
    });
}

function renderRomajiGuideSegmentCharacters(
  target: RomajiInputTarget,
  segment: ProductionTextSegment,
  input: string,
  mistakeFlash: MistakeFlash | null,
  strictMistakeInput: string,
  strictMistakeDisplayMode: StrictMistakeDisplayMode,
  showMarker: boolean,
  markerMode: RomajiMarkerMode,
) {
  if (markerMode === "token") {
    return renderRomajiGuideTokenUnits(
      target,
      input,
      mistakeFlash,
      strictMistakeInput,
      strictMistakeDisplayMode,
      showMarker,
      segment,
    );
  }

  const progress = getRomajiInputProgress(target, input);
  const flashTokenIndex = mistakeFlash ? progress.currentTokenIndex : null;
  const flashCharacterIndex =
    mistakeFlash && progress.currentOption ? progress.currentOptionOffset : 0;
  const mistakeCharacters = getVisibleStrictMistakeCharacters(
    strictMistakeInput,
    strictMistakeDisplayMode,
  );
  const elements: ReactNode[] = [];
  let inputCharacterIndex = 0;
  let insertedMistakes = false;

  target.parts.forEach((part, partIndex) => {
    if (part.kind === "visual") {
      if (segment.text.includes(part.text)) {
        elements.push(
          <span className={css(styles, "visual-space")} key={`segment-romaji-space-${partIndex}`} aria-hidden="true">
            {part.text}
          </span>,
        );
      }
      return;
    }

    const text =
      progress.currentTokenIndex === part.tokenIndex && progress.currentOption
        ? progress.currentOption
        : (progress.selectedOptions[part.tokenIndex] ?? part.text);
    const isInSegment = segment.tokenStart <= part.tokenIndex && part.tokenIndex < segment.tokenEnd;

    Array.from(text).forEach((character, characterIndex) => {
      if (!isInSegment) {
        inputCharacterIndex += 1;
        return;
      }

      if (
        strictMistakeDisplayMode === "insert" &&
        !insertedMistakes &&
        inputCharacterIndex === input.length
      ) {
        elements.push(...renderStrictMistakeCharacters(mistakeCharacters, "segment-romaji-insert"));
        insertedMistakes = true;
      }

      const overwriteMistake = getOverwriteMistakeCharacter(
        mistakeCharacters,
        inputCharacterIndex,
        input.length,
        strictMistakeDisplayMode,
      );
      if (overwriteMistake) {
        elements.push(
          <span
            className={css(styles, "char wrong")}
            key={`segment-romaji-overwrite-${part.tokenIndex}-${characterIndex}`}
          >
            {overwriteMistake}
          </span>,
        );
        inputCharacterIndex += 1;
        return;
      }

      const isCompletedToken = part.tokenIndex < progress.completedTokens;
      const isCurrentToken = part.tokenIndex === progress.currentTokenIndex;
      const isTypedCurrentCharacter =
        isCurrentToken &&
        progress.currentOption !== null &&
        characterIndex < progress.currentOptionOffset;
      const isNextCurrentCharacter =
        isCurrentToken &&
        characterIndex === (progress.currentOption ? progress.currentOptionOffset : 0);
      const isMistakeFlash =
        flashTokenIndex === part.tokenIndex &&
        characterIndex === flashCharacterIndex &&
        !isTypedCurrentCharacter;
      const className = isCompletedToken
        ? css(styles, "char correct")
        : isTypedCurrentCharacter
          ? css(styles, "char correct")
          : isNextCurrentCharacter && showMarker
            ? css(styles, "char current")
            : css(styles, "char");
      const flashClassName = isMistakeFlash ? cx(className, css(styles, "mistake-flash")) : className;
      const flashKey = isMistakeFlash && mistakeFlash ? mistakeFlash.id : "idle";

      elements.push(
        <span
          className={flashClassName}
          key={`segment-romaji-${part.tokenIndex}-${character}-${characterIndex}-${flashKey}`}
        >
          {character}
        </span>,
      );
      inputCharacterIndex += 1;
    });
  });

  if (strictMistakeDisplayMode === "insert" && !insertedMistakes) {
    elements.push(...renderStrictMistakeCharacters(mistakeCharacters, "segment-romaji-insert"));
  }

  if (strictMistakeDisplayMode === "overwrite") {
    elements.push(
      ...renderStrictMistakeCharacters(
        mistakeCharacters.slice(Math.max(0, inputCharacterIndex - input.length)),
        "segment-romaji-overwrite-tail",
      ),
    );
  }

  return elements;
}

function ContinuousChallengeTextStack({
  display,
  englishFontFamily,
  furigana,
  guide,
  input,
  japaneseFontFamily,
  mistakeFlash,
  nextChallengeDisplay,
  nextChallengeFurigana,
  nextChallengeGuide,
  nextChallengeReading,
  previousChallengeDisplay,
  previousChallengeFurigana,
  previousChallengeGuide,
  previousChallengeReading,
  reading,
  romajiTarget,
  showDisplayText,
  showFuriganaDisplay,
  showFuriganaMarker,
  showHiraganaDisplay,
  showHiraganaMarker,
  showKanjiMarker,
  showRomajiMarker,
  romajiMarkerMode,
  startsAtLeft,
  strictMistakeDisplayMode,
  strictMistakeInput,
}: {
  display: string;
  englishFontFamily: EnglishFontFamily;
  furigana: JapaneseFuriganaEntry[];
  guide: string;
  input: string;
  japaneseFontFamily: JapaneseFontFamily;
  mistakeFlash: MistakeFlash | null;
  nextChallengeDisplay: string;
  nextChallengeFurigana: JapaneseFuriganaEntry[];
  nextChallengeGuide: string;
  nextChallengeReading: string;
  previousChallengeDisplay: string;
  previousChallengeFurigana: JapaneseFuriganaEntry[];
  previousChallengeGuide: string;
  previousChallengeReading: string;
  reading: string;
  romajiTarget: RomajiInputTarget | null;
  showDisplayText: boolean;
  showFuriganaDisplay: boolean;
  showFuriganaMarker: boolean;
  showHiraganaDisplay: boolean;
  showHiraganaMarker: boolean;
  showKanjiMarker: boolean;
  showRomajiMarker: boolean;
  romajiMarkerMode: RomajiMarkerMode;
  startsAtLeft: boolean;
  strictMistakeDisplayMode: StrictMistakeDisplayMode;
  strictMistakeInput: string;
}) {
  const hasSeparateDisplay = display !== guide;
  const centerMarkerPosition = getCenterMarkerPosition(romajiTarget, input);
  const centerMarkerKey = createCenterScrollMeasurementKey({
    englishFontFamily,
    input,
    japaneseFontFamily,
    markerPosition: centerMarkerPosition,
  });

  return (
    <div className={css(styles, "center-continuous-stack")}>
      {showDisplayText && hasSeparateDisplay ? (
        <CenterScrollViewport
          kind="display"
          markerKey={centerMarkerKey}
          markerPosition={centerMarkerPosition}
          startsAtLeft={startsAtLeft}
        >
          <p className={css(styles, "display-text center-continuous-line")}>
            <PreviousCenterDisplayText
              display={previousChallengeDisplay}
              furigana={previousChallengeFurigana}
              showFurigana={showFuriganaDisplay}
              showFuriganaMarker={showFuriganaMarker}
              showKanjiMarker={showKanjiMarker}
            />
            {renderCenterDisplayText(
              display,
              furigana,
              centerMarkerPosition,
              showFuriganaDisplay,
              showFuriganaMarker,
              showKanjiMarker,
              renderCenterNextDisplayText(
                nextChallengeDisplay,
                nextChallengeFurigana,
                showFuriganaDisplay,
              ),
            )}
          </p>
        </CenterScrollViewport>
      ) : null}
      {showHiraganaDisplay && (reading || nextChallengeReading) ? (
        <CenterScrollViewport
          kind="reading"
          markerKey={centerMarkerKey}
          markerPosition={centerMarkerPosition}
          startsAtLeft={startsAtLeft}
        >
          <p className={css(styles, "reading-text center-continuous-line")}>
            {previousChallengeReading ? (
              <span className={css(styles, "center-scroll-previous-text")}>
                {showHiraganaMarker
                  ? renderCompletedReadingCharacters(previousChallengeReading)
                  : previousChallengeReading}
              </span>
            ) : null}
            {romajiTarget
              ? insertCenterMarker(
                renderReadingGuideCharacters(
                  reading,
                  romajiTarget,
                  input,
                  mistakeFlash,
                  showHiraganaMarker,
                ),
                getReadingMarkerNodeIndex(reading, centerMarkerPosition),
              )
              : renderCenterTextWithMarker(reading, centerMarkerPosition, "")}
            <span className={css(styles, "center-scroll-next-text")}>{nextChallengeReading}</span>
          </p>
        </CenterScrollViewport>
      ) : null}
      <CenterScrollViewport
        kind="input"
        markerKey={centerMarkerKey}
        markerPosition={centerMarkerPosition}
        startsAtLeft={startsAtLeft}
      >
        <p
          className={css(styles, "input-target center-continuous-line")}
          aria-label={hasSeparateDisplay ? "romaji input target" : "input target"}
        >
          {previousChallengeGuide ? (
            <span className={css(styles, "center-scroll-previous-text")}>
              {renderGuideCharacters(
                previousChallengeGuide,
                getCompletedGuideInput(previousChallengeGuide),
                null,
                "",
                "none",
                false,
              )}
            </span>
          ) : null}
          {romajiTarget
            ? renderRomajiGuideCharacters(
              romajiTarget,
              input,
              mistakeFlash,
              strictMistakeInput,
              strictMistakeDisplayMode,
              showRomajiMarker,
              romajiMarkerMode,
            )
            : renderGuideCharacters(
              guide,
              input,
              mistakeFlash,
              strictMistakeInput,
              strictMistakeDisplayMode,
              showRomajiMarker,
            )}
          <span className={css(styles, "center-scroll-next-text")}>
            {renderGuideCharacters(nextChallengeGuide, "", null, "", "none", false)}
          </span>
        </p>
      </CenterScrollViewport>
    </div>
  );
}

function CenterScrollViewport({
  children,
  kind,
  markerKey,
  markerPosition,
  startsAtLeft,
}: {
  children: ReactNode;
  kind: "display" | "reading" | "input";
  markerKey: string;
  markerPosition: number;
  startsAtLeft: boolean;
}) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [markerTranslatePx, setMarkerTranslatePx] = useState<number | null>(null);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }

    let isCancelled = false;
    let animationFrameId: number | null = null;

    const updateTranslate = () => {
      if (isCancelled) {
        return;
      }

      setMarkerTranslatePx(measureCenterScrollTranslate(viewport, kind, startsAtLeft));
    };

    const scheduleUpdate = () => {
      if (isCancelled || animationFrameId !== null) {
        return;
      }

      animationFrameId = requestAnimationFrame(() => {
        animationFrameId = null;
        updateTranslate();
      });
    };

    updateTranslate();
    scheduleUpdate();

    const fontSet = document.fonts;
    void fontSet?.ready.then(scheduleUpdate);
    fontSet?.addEventListener?.("loadingdone", scheduleUpdate);

    const resizeObserver =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(scheduleUpdate);
    if (resizeObserver) {
      resizeObserver.observe(viewport);

      const line = viewport.querySelector<HTMLElement>(cssSelector("center-continuous-line"));
      if (line) {
        resizeObserver.observe(line);
      }

      const marker = viewport.querySelector<HTMLElement>(centerScrollMarkerSelector);
      if (marker) {
        resizeObserver.observe(marker);
      }
    }

    return () => {
      isCancelled = true;
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
      fontSet?.removeEventListener?.("loadingdone", scheduleUpdate);
      resizeObserver?.disconnect();
    };
  }, [kind, markerKey, markerPosition, startsAtLeft]);

  const style = {
    "--center-marker-position": `${markerPosition}ch`,
    "--center-marker-translate":
      markerTranslatePx === null
        ? startsAtLeft
          ? "calc(-1 * max(0ch, var(--center-marker-position) - 8ch))"
          : "calc(8ch - var(--center-marker-position))"
        : `${markerTranslatePx}px`,
  } as CSSProperties;

  return (
    <div
      className={css(styles, "center-scroll-viewport", `${kind}-center-viewport`)}
      ref={viewportRef}
      style={style}
    >
      {children}
    </div>
  );
}

const centerScrollMarkerSelector = [
  cssSelector("center-scroll-current-marker"),
  cssSelector("furigana-marker-current"),
  cssSelector("kanji-marker-current"),
  `${cssSelector("char", "current")}:not(${cssSelector("correct")})`,
  cssSelector("char", "current"),
].join(", ");

function measureCenterScrollTranslate(
  viewport: HTMLElement,
  kind: "display" | "reading" | "input",
  startsAtLeft: boolean,
) {
  const line = viewport.querySelector<HTMLElement>(cssSelector("center-continuous-line"));
  const marker = viewport.querySelector<HTMLElement>(centerScrollMarkerSelector);
  if (!marker) {
    return null;
  }

  const previousLineTransition = line?.style.transition ?? "";
  const previousLineTransform = line?.style.transform ?? "";
  if (line) {
    line.style.transition = "none";
    line.style.transform = "none";
  }

  const viewportRect = viewport.getBoundingClientRect();
  const markerRect = marker.getBoundingClientRect();
  let targetCenter = markerRect.left - viewportRect.left + markerRect.width / 2;

  // The display (kanji) and reading (kana) lines anchor on a zero-width marker
  // placed right before the unit currently being typed. Centering that marker
  // would put the unit's LEFT EDGE on the center line, leaving the glyph half a
  // character to the right and breaking vertical alignment with the romaji line
  // (which centers the current character's midpoint). Instead, center the unit
  // itself (the element right after the marker) by its measured midpoint, so the
  // current kanji / current kana / current romaji char all stack in one column.
  // Measuring here (vs a fixed CSS offset) also keeps the first challenge flush
  // left under startsAtLeft instead of bleeding off the left edge.
  if (kind === "display" || kind === "reading") {
    const unit = marker.nextElementSibling as HTMLElement | null;
    const isNextChallengeText =
      unit?.classList.contains(css(styles, "center-scroll-next-text")) ?? false;
    if (unit && !isNextChallengeText) {
      const alignmentUnit =
        kind === "display"
          ? (unit.querySelector<HTMLElement>(cssSelector("display-ruby-base")) ?? unit)
          : unit;
      const unitRect = alignmentUnit.getBoundingClientRect();
      if (unitRect.width > 0) {
        targetCenter = unitRect.left - viewportRect.left + unitRect.width / 2;
      }
    }
  }

  const viewportCenter = viewportRect.width / 2;
  const nextTranslate = calculateScaledCenterScrollTranslate({
    scaleX: getElementScaleX(viewport, viewportRect),
    startsAtLeft,
    targetCenter,
    viewportCenter,
  });

  if (line) {
    line.style.transition = previousLineTransition;
    line.style.transform = previousLineTransform;
  }

  return nextTranslate;
}

export function calculateScaledCenterScrollTranslate({
  scaleX,
  startsAtLeft,
  targetCenter,
  viewportCenter,
}: {
  scaleX: number;
  startsAtLeft: boolean;
  targetCenter: number;
  viewportCenter: number;
}) {
  const visualTranslate = startsAtLeft && targetCenter <= viewportCenter ? 0 : viewportCenter - targetCenter;
  const localScaleX = Number.isFinite(scaleX) && scaleX > 0 ? scaleX : 1;

  return Math.round((visualTranslate / localScaleX) * 10) / 10;
}

function getElementScaleX(element: HTMLElement, rect = element.getBoundingClientRect()) {
  return element.offsetWidth > 0 ? rect.width / element.offsetWidth : 1;
}

function getCompletedGuideInput(guide: string) {
  return Array.from(guide)
    .filter((character) => !/\s/.test(character))
    .join("");
}

function getCenterMarkerPosition(target: RomajiInputTarget | null, input: string) {
  if (!target) {
    return Array.from(input).length;
  }

  return getRomajiInputProgress(target, input).currentTokenIndex;
}

export function createCenterScrollMeasurementKey({
  englishFontFamily,
  input,
  japaneseFontFamily,
  markerPosition,
}: {
  englishFontFamily: EnglishFontFamily;
  input: string;
  japaneseFontFamily: JapaneseFontFamily;
  markerPosition: number;
}) {
  return `${markerPosition}-${input}-${japaneseFontFamily}-${englishFontFamily}`;
}

type SplitRubyPart = {
  kanji: string;
  ruby: string;
  tokenStart: number;
  tokenEnd: number;
};

function splitRubyPart(
  kanji: string,
  ruby: string,
  partTokenStart: number
): SplitRubyPart[] {
  const kanjiChars = Array.from(kanji);
  const K = kanjiChars.length;
  if (K === 0) return [];

  const readingParts = createJapaneseReadingGuideParts(ruby);
  const M = readingParts.length;

  if (M === 0) {
    return kanjiChars.map((char) => ({
      kanji: char,
      ruby: "",
      tokenStart: partTokenStart,
      tokenEnd: partTokenStart,
    }));
  }

  const groupedParts: JapaneseReadingGuidePart[][] = Array.from({ length: K }, () => []);
  readingParts.forEach((part, index) => {
    const kanjiIndex = Math.min(K - 1, Math.floor((index * K) / M));
    groupedParts[kanjiIndex]?.push(part);
  });

  return kanjiChars.map((char, j) => {
    const partsForKanji = groupedParts[j] || [];
    const subRuby = partsForKanji.map((p) => p.text).join("");

    let subRubyTokenStart = partTokenStart;
    let subRubyTokenEnd = partTokenStart;

    if (partsForKanji.length > 0) {
      const starts = partsForKanji
        .filter((p) => p.kind === "reading")
        .map((p) => p.tokenStart);
      const ends = partsForKanji
        .filter((p) => p.kind === "reading")
        .map((p) => p.tokenEnd);

      const relStart = starts.length > 0 ? Math.min(...starts) : 0;
      const relEnd = ends.length > 0 ? Math.max(...ends) : 0;

      subRubyTokenStart = partTokenStart + relStart;
      subRubyTokenEnd = partTokenStart + relEnd;
    } else {
      let prevEnd = 0;
      for (let prevIdx = j - 1; prevIdx >= 0; prevIdx--) {
        const prevParts = groupedParts[prevIdx] || [];
        const prevEnds = prevParts.filter((p) => p.kind === "reading").map((p) => p.tokenEnd);
        if (prevEnds.length > 0) {
          prevEnd = Math.max(...prevEnds);
          break;
        }
      }
      subRubyTokenStart = partTokenStart + prevEnd;
      subRubyTokenEnd = partTokenStart + prevEnd;
    }

    return {
      kanji: char,
      ruby: subRuby,
      tokenStart: subRubyTokenStart,
      tokenEnd: subRubyTokenEnd,
    };
  });
}

function PreviousCenterDisplayText({
  display,
  furigana,
  showFurigana,
  showFuriganaMarker,
  showKanjiMarker,
}: {
  display: string;
  furigana: JapaneseFuriganaEntry[];
  showFurigana: boolean;
  showFuriganaMarker: boolean;
  showKanjiMarker: boolean;
}) {
  if (!display) {
    return null;
  }

  if (furigana.length === 0) {
    return (
      <span className={css(styles, "center-scroll-previous-text")}>
        {showKanjiMarker
          ? renderDisplayMarkerCharacters(
            display,
            0,
            Number.MAX_SAFE_INTEGER,
            Number.MAX_SAFE_INTEGER,
            "previous-display",
          )
          : display}
      </span>
    );
  }

  let tokenStart = 0;

  return (
    <span className={css(styles, "center-scroll-previous-text")}>
      {createJapaneseFuriganaParts(display, furigana).flatMap((part, index) => {
        const partTokenStart = tokenStart;
        const tokenCount = countJapaneseReadingTokens(part.ruby ?? part.text);
        const tokenEnd = tokenStart + tokenCount;
        tokenStart = tokenEnd;

        if (part.ruby) {
          return splitRubyPart(part.text, part.ruby, partTokenStart).map((subRuby, subIndex) => {
            if (showFurigana) {
              const rubyClassName = getDisplayMarkerClassName(
                "display-ruby",
                showKanjiMarker,
                {
                  completedTokens: Number.MAX_SAFE_INTEGER,
                  currentTokenIndex: Number.MAX_SAFE_INTEGER,
                },
                subRuby.tokenStart,
                subRuby.tokenEnd,
              );
              const rubyText = showFuriganaMarker
                ? renderFuriganaMarkerCharacters(
                  subRuby.ruby,
                  subRuby.tokenStart,
                  Number.MAX_SAFE_INTEGER,
                  Number.MAX_SAFE_INTEGER,
                )
                : subRuby.ruby;

              return (
                <ruby className={rubyClassName} key={`previous-display-ruby-${part.text}-${index}-${subIndex}`}>
                  {subRuby.kanji}
                  <rt>{rubyText}</rt>
                </ruby>
              );
            }

            if (showKanjiMarker) {
              return renderDisplayMarkerCharacters(
                subRuby.kanji,
                subRuby.tokenStart,
                Number.MAX_SAFE_INTEGER,
                Number.MAX_SAFE_INTEGER,
                `previous-display-${index}-${subIndex}`,
              );
            }

            return (
              <span className={css(styles, "display-plain")} key={`previous-display-plain-${part.text}-${index}-${subIndex}`}>
                {subRuby.kanji}
              </span>
            );
          });
        }

        if (showKanjiMarker) {
          return renderDisplayMarkerCharacters(
            part.text,
            partTokenStart,
            Number.MAX_SAFE_INTEGER,
            Number.MAX_SAFE_INTEGER,
            `previous-display-${index}`,
          );
        }

        return [
          <span className={css(styles, "display-plain")} key={`previous-display-plain-${part.text}-${index}`}>
            {part.text}
          </span>,
        ];
      })}
    </span>
  );
}

function renderCenterNextDisplayText(
  display: string,
  furigana: JapaneseFuriganaEntry[],
  showFurigana: boolean,
) {
  if (!display) {
    return "";
  }

  if (!showFurigana || furigana.length === 0) {
    return display;
  }

  return createJapaneseFuriganaParts(display, furigana).flatMap((part, index) =>
    part.ruby ? (
      splitRubyPart(part.text, part.ruby, 0).map((subRuby, subIndex) => (
        <ruby className={css(styles, "display-ruby")} key={`next-display-ruby-${part.text}-${index}-${subIndex}`}>
          {subRuby.kanji}
          <rt>{subRuby.ruby}</rt>
        </ruby>
      ))
    ) : (
      [
        <span className={css(styles, "display-plain")} key={`next-display-plain-${part.text}-${index}`}>
          {part.text}
        </span>,
      ]
    ),
  );
}

function renderCenterDisplayText(
  display: string,
  furigana: JapaneseFuriganaEntry[],
  currentTokenIndex: number,
  showFurigana: boolean,
  showFuriganaMarker: boolean,
  showKanjiMarker: boolean,
  nextText: ReactNode,
) {
  if (furigana.length === 0) {
    return renderCenterTextWithMarker(
      display,
      currentTokenIndex,
      nextText,
      css(styles, "center-scroll-next-text", showKanjiMarker ? "" : "seamless"),
    );
  }

  let tokenStart = 0;
  let insertedMarker = false;
  const content: ReactNode[] = [];

  createJapaneseFuriganaParts(display, furigana).forEach((part, index) => {
    const partTokenStart = tokenStart;

    if (part.ruby) {
      const subRubies = splitRubyPart(part.text, part.ruby, partTokenStart);
      const parentTokenEnd = partTokenStart + countJapaneseReadingTokens(part.ruby);
      tokenStart = parentTokenEnd;

      subRubies.forEach((subRuby, subIndex) => {
        const isCurrent = subRuby.tokenStart <= currentTokenIndex && currentTokenIndex < subRuby.tokenEnd;

        if (!insertedMarker && isCurrent) {
          content.push(<CenterScrollCurrentMarker key={`center-display-marker-${index}-${subIndex}`} />);
          insertedMarker = true;
        }

        if (showFurigana) {
          const rubyClassName = getDisplayMarkerClassName(
            "display-ruby",
            showKanjiMarker,
            { completedTokens: currentTokenIndex, currentTokenIndex },
            subRuby.tokenStart,
            subRuby.tokenEnd,
          );
          const rubyText = showFuriganaMarker
            ? renderFuriganaMarkerCharacters(
              subRuby.ruby,
              subRuby.tokenStart,
              currentTokenIndex,
              currentTokenIndex,
            )
            : subRuby.ruby;

          content.push(
            <ruby className={rubyClassName} key={`center-display-ruby-${part.text}-${index}-${subIndex}`}>
              <span className={css(styles, "display-ruby-base")}>{subRuby.kanji}</span>
              <rt>{rubyText}</rt>
            </ruby>,
          );
        } else if (showKanjiMarker) {
          content.push(
            ...renderDisplayMarkerCharacters(
              subRuby.kanji,
              subRuby.tokenStart,
              currentTokenIndex,
              currentTokenIndex,
              `center-display-${index}-${subIndex}`,
            ),
          );
        } else {
          content.push(
            <span className={css(styles, "display-plain")} key={`center-display-plain-${part.text}-${index}-${subIndex}`}>
              {subRuby.kanji}
            </span>,
          );
        }
      });
      return;
    }

    const normalizedReading = normalizeKana(part.text);
    const readingGuideParts = createJapaneseReadingGuideParts(normalizedReading);
    const displayChars = Array.from(part.text);
    let displayCharIndex = 0;

    for (const guidePart of readingGuideParts) {
      if (guidePart.kind !== "reading") {
        content.push(
          <span key={`center-display-plain-${index}-v-${displayCharIndex}`} className={css(styles, "display-plain")}>
            {guidePart.text}
          </span>,
        );
        displayCharIndex += Array.from(guidePart.text).length;
        continue;
      }

      const unitTokenEnd = tokenStart + (guidePart.tokenEnd - guidePart.tokenStart);

      if (!insertedMarker && tokenStart <= currentTokenIndex && currentTokenIndex < unitTokenEnd) {
        content.push(<CenterScrollCurrentMarker key={`center-display-marker-${index}`} />);
        insertedMarker = true;
      }

      const unitCharCount = Array.from(guidePart.text).length;
      const unitDisplayChars = displayChars.slice(displayCharIndex, displayCharIndex + unitCharCount).join("");

      if (showKanjiMarker) {
        content.push(
          ...renderDisplayMarkerCharacters(
            unitDisplayChars,
            tokenStart,
            currentTokenIndex,
            currentTokenIndex,
            `center-display-${index}-${displayCharIndex}`,
          ),
        );
      } else {
        content.push(
          <span key={`center-display-plain-${index}-${displayCharIndex}`} className={css(styles, "display-plain")}>
            {unitDisplayChars}
          </span>,
        );
      }

      displayCharIndex += unitCharCount;
      tokenStart = unitTokenEnd;
    }
  });

  if (!insertedMarker) {
    content.push(<CenterScrollCurrentMarker key="center-display-marker" />);
  }

  if (nextText) {
    content.push(
      <span
        className={css(styles, "center-scroll-next-text", showKanjiMarker ? "" : "seamless")}
        key="center-next-text"
      >
        {nextText}
      </span>,
    );
  }

  return content;
}

function renderCenterTextWithMarker(
  text: string,
  markerPosition: number,
  nextText: ReactNode,
  nextTextClassName = css(styles, "center-scroll-next-text"),
) {
  const characters = Array.from(text);
  const markerIndex = Math.min(characters.length, Math.max(0, markerPosition));
  const content: ReactNode[] = [];

  characters.forEach((character, index) => {
    if (index === markerIndex) {
      content.push(<CenterScrollCurrentMarker key="center-marker" />);
    }
    content.push(<span key={`center-character-${index}`}>{character}</span>);
  });

  if (markerIndex === characters.length) {
    content.push(<CenterScrollCurrentMarker key="center-marker" />);
  }

  if (nextText) {
    content.push(
      <span className={nextTextClassName} key="center-next-text">
        {nextText}
      </span>,
    );
  }

  return content;
}

function getReadingMarkerNodeIndex(reading: string, tokenPosition: number) {
  // renderReadingGuideCharacters emits one node per reading-guide part, but a
  // single kana can span multiple romaji tokens, so the token index is not the
  // node-array index. Map the token position to the node that owns it (the same
  // rule the visible current-char highlight uses) so the zero-width marker lines
  // up with the kana actually being typed instead of drifting right.
  const parts = createJapaneseReadingGuideParts(reading);
  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index];
    if (part.kind === "reading" && tokenPosition < part.tokenEnd) {
      return index;
    }
  }
  return parts.length;
}

function insertCenterMarker(nodes: ReactNode, markerPosition: number) {
  const nodeList = Array.isArray(nodes) ? nodes : [nodes];
  const markerIndex = Math.min(nodeList.length, Math.max(0, markerPosition));

  return [
    ...nodeList.slice(0, markerIndex),
    <CenterScrollCurrentMarker key="center-marker" />,
    ...nodeList.slice(markerIndex),
  ];
}

function CenterScrollCurrentMarker() {
  return <span aria-hidden="true" className={css(styles, "center-scroll-current-marker")} />;
}

function ChallengeTextStack({
  display,
  furigana,
  guide,
  input,
  mistakeFlash,
  reading,
  renderMarkers,
  romajiTarget,
  showDisplayText,
  showFuriganaDisplay,
  showFuriganaMarker,
  showHiraganaDisplay,
  showHiraganaMarker,
  showKanjiMarker,
  showRomajiMarker,
  romajiMarkerMode,
  strictMistakeDisplayMode,
  strictMistakeInput,
}: {
  display: string;
  furigana: JapaneseFuriganaEntry[];
  guide: string;
  input: string;
  mistakeFlash: MistakeFlash | null;
  reading: string;
  renderMarkers: boolean;
  romajiTarget: RomajiInputTarget | null;
  showDisplayText: boolean;
  showFuriganaDisplay: boolean;
  showFuriganaMarker: boolean;
  showHiraganaDisplay: boolean;
  showHiraganaMarker: boolean;
  showKanjiMarker: boolean;
  showRomajiMarker: boolean;
  romajiMarkerMode: RomajiMarkerMode;
  strictMistakeDisplayMode: StrictMistakeDisplayMode;
  strictMistakeInput: string;
}) {
  const hasSeparateDisplay = display !== guide;
  const markerProgress = romajiTarget ? getRomajiInputProgress(romajiTarget, input) : null;

  return (
    <>
      {showDisplayText && hasSeparateDisplay ? (
        <DisplayText
          display={display}
          furigana={furigana}
          markerProgress={showKanjiMarker || showFuriganaMarker ? markerProgress : null}
          showFurigana={showFuriganaDisplay}
          showFuriganaMarker={showFuriganaMarker}
          showKanjiMarker={showKanjiMarker}
        />
      ) : null}
      {showHiraganaDisplay && reading ? (
        <p className={css(styles, "reading-text")}>
          {romajiTarget && renderMarkers
            ? renderReadingGuideCharacters(
              reading,
              romajiTarget,
              input,
              mistakeFlash,
              showHiraganaMarker,
            )
            : reading}
        </p>
      ) : null}
      <p
        className={css(styles, "input-target")}
        aria-label={hasSeparateDisplay ? "romaji input target" : "input target"}
      >
        {romajiTarget
          ? renderMarkers
            ? renderRomajiGuideCharacters(
              romajiTarget,
              input,
              mistakeFlash,
              strictMistakeInput,
              strictMistakeDisplayMode,
              showRomajiMarker,
              romajiMarkerMode,
            )
            : renderGuideCharacters(guide, "", null, "", "none", false)
          : renderGuideCharacters(
            guide,
            input,
            mistakeFlash,
            strictMistakeInput,
            strictMistakeDisplayMode,
            showRomajiMarker,
          )}
      </p>
    </>
  );
}

function DisplayText({
  display,
  furigana,
  markerProgress,
  showFurigana,
  showFuriganaMarker,
  showKanjiMarker,
}: {
  display: string;
  furigana: JapaneseFuriganaEntry[];
  markerProgress: { completedTokens: number; currentTokenIndex: number } | null;
  showFurigana: boolean;
  showFuriganaMarker: boolean;
  showKanjiMarker: boolean;
}) {
  let tokenStart = 0;

  return (
    <p className={css(styles, "display-text")}>
      {showFurigana && furigana.length > 0 ? (
        createJapaneseFuriganaParts(display, furigana).flatMap((part, index) => {
          const partTokenStart = tokenStart;
          const tokenCount = countJapaneseReadingTokens(part.ruby ?? part.text);
          const tokenEnd = tokenStart + tokenCount;
          tokenStart = tokenEnd;

          if (part.ruby) {
            const subRubies = splitRubyPart(part.text, part.ruby, partTokenStart);
            return subRubies.map((subRuby, subIndex) => {
              if (showFurigana) {
                const rubyClassName = getDisplayMarkerClassName(
                  "display-ruby",
                  showKanjiMarker,
                  markerProgress,
                  subRuby.tokenStart,
                  subRuby.tokenEnd,
                );
                const rubyText =
                  showFuriganaMarker && markerProgress !== null
                    ? renderFuriganaMarkerCharacters(
                      subRuby.ruby,
                      subRuby.tokenStart,
                      markerProgress.completedTokens,
                      markerProgress.currentTokenIndex,
                    )
                    : subRuby.ruby;

                return (
                  <ruby className={rubyClassName} key={`${part.text}-${index}-${subIndex}`}>
                    {subRuby.kanji}
                    <rt>{rubyText}</rt>
                  </ruby>
                );
              }

              if (showKanjiMarker && markerProgress !== null) {
                return renderDisplayMarkerCharacters(
                  subRuby.kanji,
                  subRuby.tokenStart,
                  markerProgress.completedTokens,
                  markerProgress.currentTokenIndex,
                  `display-${index}-${subIndex}`,
                );
              }

              return (
                <span className={css(styles, "display-plain")} key={`${part.text}-${index}-${subIndex}`}>
                  {subRuby.kanji}
                </span>
              );
            });
          }

          if (showKanjiMarker && markerProgress !== null) {
            return renderDisplayMarkerCharacters(
              part.text,
              partTokenStart,
              markerProgress.completedTokens,
              markerProgress.currentTokenIndex,
              `display-${index}`,
            );
          }

          return [
            <span className={css(styles, "display-plain")} key={`${part.text}-${index}`}>
              {part.text}
            </span>,
          ];
        })
      ) : (
        display
      )}
    </p>
  );
}

function getDisplayMarkerClassName(
  baseClassName: string,
  showMarker: boolean,
  markerProgress: { completedTokens: number; currentTokenIndex: number } | null,
  tokenStart: number,
  tokenEnd: number,
) {
  if (!showMarker || markerProgress === null) {
    return css(styles, baseClassName);
  }

  if (tokenEnd <= markerProgress.completedTokens) {
    return css(styles, baseClassName, "kanji-marker-correct");
  }

  if (tokenStart <= markerProgress.currentTokenIndex && markerProgress.currentTokenIndex < tokenEnd) {
    return css(styles, baseClassName, "kanji-marker-current");
  }

  return css(styles, baseClassName, "kanji-marker-pending");
}

function renderFuriganaMarkerCharacters(
  ruby: string,
  partTokenStart: number,
  completedTokens: number,
  currentTokenIndex: number,
) {
  return createDisplayMarkerTextParts(ruby).map((part, partIndex) => {
    if (part.kind === "visual") {
      return part.text;
    }

    const className = getTextMarkerStateClassName(
      "furigana-marker",
      partTokenStart + part.tokenStart,
      partTokenStart + part.tokenEnd,
      completedTokens,
      currentTokenIndex,
    );

    return (
      <span
        className={className}
        key={`furigana-${partTokenStart}-${part.tokenStart}-${part.text}-${partIndex}`}
      >
        {part.text}
      </span>
    );
  });
}

function renderDisplayMarkerCharacters(
  text: string,
  partTokenStart: number,
  completedTokens: number,
  currentTokenIndex: number,
  keyPrefix: string,
) {
  return createDisplayMarkerTextParts(text).map((part, partIndex) => {
    if (part.kind === "visual") {
      return (
        <span className={css(styles, "display-plain")} key={`${keyPrefix}-visual-${partIndex}`}>
          {part.text}
        </span>
      );
    }

    const className = getTextMarkerStateClassName(
      "kanji-marker",
      partTokenStart + part.tokenStart,
      partTokenStart + part.tokenEnd,
      completedTokens,
      currentTokenIndex,
    );

    return (
      <span
        className={cx(css(styles, "display-plain"), className)}
        key={`${keyPrefix}-${part.tokenStart}-${part.text}-${partIndex}`}
      >
        {part.text}
      </span>
    );
  });
}

function createDisplayMarkerTextParts(text: string) {
  const parts = createJapaneseReadingGuideParts(text);
  const markerParts: typeof parts = [];

  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index];
    const nextPart = parts[index + 1];

    if (
      part?.kind === "reading" &&
      part.text === "っ" &&
      nextPart?.kind === "reading"
    ) {
      markerParts.push({
        kind: "reading",
        text: `${part.text}${nextPart.text}`,
        tokenStart: part.tokenStart,
        tokenEnd: nextPart.tokenEnd,
      });
      index += 1;
      continue;
    }

    if (part) {
      markerParts.push(part);
    }
  }

  return markerParts;
}

function getTextMarkerStateClassName(
  baseClassName: "furigana-marker" | "kanji-marker",
  tokenStart: number,
  tokenEnd: number,
  completedTokens: number,
  currentTokenIndex: number,
) {
  if (tokenEnd <= completedTokens) {
    return css(styles, `${baseClassName}-correct`);
  }

  if (tokenStart <= currentTokenIndex && currentTokenIndex < tokenEnd) {
    return css(styles, `${baseClassName}-current`);
  }

  return css(styles, `${baseClassName}-pending`);
}

function countJapaneseReadingTokens(reading: string) {
  return createJapaneseReadingGuideParts(reading).reduce(
    (tokenCount, part) => (part.kind === "reading" ? Math.max(tokenCount, part.tokenEnd) : tokenCount),
    0,
  );
}

function normalizeKana(value: string): string {
  return Array.from(value)
    .map((character) => {
      const codePoint = character.codePointAt(0) ?? 0;
      return codePoint >= 0x30a1 && codePoint <= 0x30f6
        ? String.fromCodePoint(codePoint - 0x60)
        : character;
    })
    .join("");
}

function renderReadingGuideCharacters(
  reading: string,
  target: RomajiInputTarget,
  input: string,
  mistakeFlash: MistakeFlash | null,
  showMarker: boolean,
) {
  const progress = getRomajiInputProgress(target, input);
  const flashTokenIndex = mistakeFlash ? progress.currentTokenIndex : null;

  return createJapaneseReadingGuideParts(reading).map((part, partIndex) => {
    if (part.kind === "visual") {
      return (
        <span className={css(styles, "visual-space")} key={`reading-space-${partIndex}`} aria-hidden="true">
          {part.text}
        </span>
      );
    }

    const isCompleted = part.tokenEnd <= progress.completedTokens;
    const isCurrent =
      part.tokenStart <= progress.currentTokenIndex &&
      progress.currentTokenIndex < part.tokenEnd;
    const isMistakeFlash = flashTokenIndex !== null && isCurrent && !isCompleted;
    const className = isCompleted
      ? css(styles, "char correct")
      : isCurrent && showMarker
        ? css(styles, "char current")
        : css(styles, "char");
    const flashClassName = isMistakeFlash ? cx(className, css(styles, "mistake-flash")) : className;
    const flashKey = isMistakeFlash && mistakeFlash ? mistakeFlash.id : "idle";

    return (
      <span
        className={flashClassName}
        key={`reading-${part.tokenStart}-${part.text}-${partIndex}-${flashKey}`}
      >
        {part.text}
      </span>
    );
  });
}

function renderCompletedReadingCharacters(reading: string) {
  return createJapaneseReadingGuideParts(reading).map((part, partIndex) => {
    if (part.kind === "visual") {
      return (
        <span className={css(styles, "visual-space")} key={`previous-reading-space-${partIndex}`} aria-hidden="true">
          {part.text}
        </span>
      );
    }

    return (
      <span className={css(styles, "char correct")} key={`previous-reading-${part.tokenStart}-${part.text}-${partIndex}`}>
        {part.text}
      </span>
    );
  });
}

function renderRomajiGuideCharacters(
  target: RomajiInputTarget,
  input: string,
  mistakeFlash: MistakeFlash | null,
  strictMistakeInput: string,
  strictMistakeDisplayMode: StrictMistakeDisplayMode,
  showMarker: boolean,
  markerMode: RomajiMarkerMode,
) {
  if (markerMode === "token") {
    return renderRomajiGuideTokenUnits(
      target,
      input,
      mistakeFlash,
      strictMistakeInput,
      strictMistakeDisplayMode,
      showMarker,
    );
  }

  const progress = getRomajiInputProgress(target, input);
  const flashTokenIndex = mistakeFlash ? progress.currentTokenIndex : null;
  const flashCharacterIndex =
    mistakeFlash && progress.currentOption ? progress.currentOptionOffset : 0;
  const mistakeCharacters = getVisibleStrictMistakeCharacters(
    strictMistakeInput,
    strictMistakeDisplayMode,
  );
  const elements: ReactNode[] = [];
  let inputCharacterIndex = 0;
  let insertedMistakes = false;

  target.parts.forEach((part, partIndex) => {
    if (part.kind === "visual") {
      elements.push(
        <span className={css(styles, "visual-space")} key={`space-${partIndex}`} aria-hidden="true">
          {part.text}
        </span>,
      );
      return;
    }

    const text =
      progress.currentTokenIndex === part.tokenIndex && progress.currentOption
        ? progress.currentOption
        : (progress.selectedOptions[part.tokenIndex] ?? part.text);

    Array.from(text).forEach((character, characterIndex) => {
      if (
        strictMistakeDisplayMode === "insert" &&
        !insertedMistakes &&
        inputCharacterIndex === input.length
      ) {
        elements.push(...renderStrictMistakeCharacters(mistakeCharacters, "romaji-insert"));
        insertedMistakes = true;
      }

      const overwriteMistake = getOverwriteMistakeCharacter(
        mistakeCharacters,
        inputCharacterIndex,
        input.length,
        strictMistakeDisplayMode,
      );
      if (overwriteMistake) {
        elements.push(
          <span
            className={css(styles, "char wrong")}
            key={`romaji-overwrite-${part.tokenIndex}-${characterIndex}`}
          >
            {overwriteMistake}
          </span>,
        );
        inputCharacterIndex += 1;
        return;
      }

      const isCompletedToken = part.tokenIndex < progress.completedTokens;
      const isCurrentToken = part.tokenIndex === progress.currentTokenIndex;
      const isTypedCurrentCharacter =
        isCurrentToken &&
        progress.currentOption !== null &&
        characterIndex < progress.currentOptionOffset;
      const isNextCurrentCharacter =
        isCurrentToken &&
        characterIndex === (progress.currentOption ? progress.currentOptionOffset : 0);
      const isMistakeFlash =
        flashTokenIndex === part.tokenIndex &&
        characterIndex === flashCharacterIndex &&
        !isTypedCurrentCharacter;
      const className = isCompletedToken
        ? css(styles, "char correct")
        : isTypedCurrentCharacter
          ? css(styles, "char correct")
          : isNextCurrentCharacter && showMarker
            ? css(styles, "char current")
          : css(styles, "char");
      const flashClassName = isMistakeFlash ? cx(className, css(styles, "mistake-flash")) : className;
      const flashKey = isMistakeFlash && mistakeFlash ? mistakeFlash.id : "idle";

      elements.push(
        <span
          className={flashClassName}
          key={`${part.tokenIndex}-${character}-${characterIndex}-${flashKey}`}
        >
          {character}
        </span>,
      );
      inputCharacterIndex += 1;
    });
  });

  if (strictMistakeDisplayMode === "insert" && !insertedMistakes) {
    elements.push(...renderStrictMistakeCharacters(mistakeCharacters, "romaji-insert"));
  }

  if (strictMistakeDisplayMode === "overwrite") {
    elements.push(
      ...renderStrictMistakeCharacters(
        mistakeCharacters.slice(Math.max(0, inputCharacterIndex - input.length)),
        "romaji-overwrite-tail",
      ),
    );
  }

  return elements;
}

type RomajiMarkerUnit =
  | {
      kind: "visual";
      text: string;
    }
  | {
      characterStart: number;
      hasVariant: boolean;
      kind: "input";
      text: string;
      tokenStart: number;
      tokenEnd: number;
    };

function renderRomajiGuideTokenUnits(
  target: RomajiInputTarget,
  input: string,
  mistakeFlash: MistakeFlash | null,
  strictMistakeInput: string,
  strictMistakeDisplayMode: StrictMistakeDisplayMode,
  showMarker: boolean,
  segment?: ProductionTextSegment,
) {
  const progress = getRomajiInputProgress(target, input);
  const units = createRomajiMarkerUnits(target, progress);
  const flashTokenIndex = mistakeFlash ? progress.currentTokenIndex : null;
  const mistakeCharacters = getVisibleStrictMistakeCharacters(
    strictMistakeInput,
    strictMistakeDisplayMode,
  );
  const elements: ReactNode[] = [];
  let inputCharacterIndex = 0;
  let insertedMistakes = false;

  units.forEach((unit, unitIndex) => {
    if (unit.kind === "visual") {
      if (!segment || segment.text.includes(unit.text)) {
        elements.push(
          <span className={css(styles, "visual-space")} key={`romaji-token-space-${unitIndex}`} aria-hidden="true">
            {unit.text}
          </span>,
        );
      }
      return;
    }

    const unitLength = Array.from(unit.text).length;
    const isInSegment =
      !segment || (unit.tokenStart < segment.tokenEnd && segment.tokenStart < unit.tokenEnd);

    if (!isInSegment) {
      inputCharacterIndex += unitLength;
      return;
    }

    if (
      strictMistakeDisplayMode === "insert" &&
      !insertedMistakes &&
      inputCharacterIndex >= input.length
    ) {
      elements.push(...renderStrictMistakeCharacters(mistakeCharacters, "romaji-token-insert"));
      insertedMistakes = true;
    }

    const overwriteMistake = getOverwriteMistakeCharacter(
      mistakeCharacters,
      inputCharacterIndex,
      input.length,
      strictMistakeDisplayMode,
    );
    if (overwriteMistake) {
      elements.push(
        <span className={css(styles, "char wrong")} key={`romaji-token-overwrite-${unitIndex}`}>
          {overwriteMistake}
        </span>,
      );
      inputCharacterIndex += unitLength;
      return;
    }

    const isCompleted = unit.tokenEnd <= progress.completedTokens;
    const isCurrent =
      unit.tokenStart <= progress.currentTokenIndex &&
      progress.currentTokenIndex < unit.tokenEnd;
    const isStartedCurrent = isCurrent && input.length > unit.characterStart;
    const isMistakeFlash =
      flashTokenIndex !== null &&
      unit.tokenStart <= flashTokenIndex &&
      flashTokenIndex < unit.tokenEnd &&
      !isCompleted;
    const className = isCompleted
      ? css(styles, "char correct")
      : isCurrent && showMarker
        ? isStartedCurrent
          ? css(styles, "char correct current")
          : css(styles, "char current")
        : css(styles, "char");
    const flashClassName = isMistakeFlash ? cx(className, css(styles, "mistake-flash")) : className;
    const flashKey = isMistakeFlash && mistakeFlash ? mistakeFlash.id : "idle";

    elements.push(
      <span
        className={flashClassName}
        key={`romaji-token-${unit.tokenStart}-${unit.text}-${unitIndex}-${flashKey}`}
      >
        {unit.text}
      </span>,
    );
    inputCharacterIndex += unitLength;
  });

  if (strictMistakeDisplayMode === "insert" && !insertedMistakes) {
    elements.push(...renderStrictMistakeCharacters(mistakeCharacters, "romaji-token-insert"));
  }

  if (strictMistakeDisplayMode === "overwrite") {
    elements.push(
      ...renderStrictMistakeCharacters(
        mistakeCharacters.slice(Math.max(0, inputCharacterIndex - input.length)),
        "romaji-token-overwrite-tail",
      ),
    );
  }

  return elements;
}

function createRomajiMarkerUnits(
  target: RomajiInputTarget,
  progress: ReturnType<typeof getRomajiInputProgress>,
) {
  const units: RomajiMarkerUnit[] = [];
  let inputCharacterIndex = 0;

  target.parts.forEach((part) => {
    if (part.kind === "visual") {
      units.push({ kind: "visual", text: part.text });
      return;
    }

    const text =
      progress.currentTokenIndex === part.tokenIndex && progress.currentOption
        ? progress.currentOption
        : (progress.selectedOptions[part.tokenIndex] ?? part.text);
    const previous = units[units.length - 1];

    if (
      previous?.kind === "input" &&
      shouldMergeRomajiMarkerUnit(previous, text, part.variantId)
    ) {
      previous.text += text;
      previous.tokenEnd = part.tokenIndex + 1;
      previous.hasVariant = previous.hasVariant || part.variantId !== undefined;
    } else {
      units.push({
        characterStart: inputCharacterIndex,
        hasVariant: part.variantId !== undefined,
        kind: "input",
        text,
        tokenStart: part.tokenIndex,
        tokenEnd: part.tokenIndex + 1,
      });
    }

    inputCharacterIndex += Array.from(text).length;
  });

  return units;
}

function shouldMergeRomajiMarkerUnit(
  previous: Extract<RomajiMarkerUnit, { kind: "input" }>,
  nextText: string,
  nextVariantId: string | undefined,
) {
  if (previous.hasVariant || nextVariantId !== undefined || Array.from(nextText).length !== 1) {
    return false;
  }

  const previousText = previous.text.toLowerCase();
  const nextCharacter = nextText.toLowerCase();

  return /^[bcdfghjklmnpqrstvwxyz]+$/.test(previousText) && /^[aeiouy]$/.test(nextCharacter);
}

function renderGuideCharacters(
  guide: string,
  input: string,
  mistakeFlash: MistakeFlash | null,
  strictMistakeInput: string,
  strictMistakeDisplayMode: StrictMistakeDisplayMode,
  showMarker: boolean,
) {
  const mistakeCharacters = getVisibleStrictMistakeCharacters(
    strictMistakeInput,
    strictMistakeDisplayMode,
  );
  const elements: ReactNode[] = [];
  let targetIndex = 0;
  let insertedMistakes = false;

  Array.from(guide).forEach((character, index) => {
    if (/\s/.test(character)) {
      elements.push(
        <span className={css(styles, "visual-space")} key={`space-${index}`} aria-hidden="true">
          {character}
        </span>,
      );
      return;
    }

    const typed = input[targetIndex];
    const currentIndex = targetIndex;

    if (
      strictMistakeDisplayMode === "insert" &&
      !insertedMistakes &&
      currentIndex === input.length
    ) {
      elements.push(...renderStrictMistakeCharacters(mistakeCharacters, "direct-insert"));
      insertedMistakes = true;
    }

    const overwriteMistake = getOverwriteMistakeCharacter(
      mistakeCharacters,
      currentIndex,
      input.length,
      strictMistakeDisplayMode,
    );
    targetIndex += 1;
    if (overwriteMistake) {
      elements.push(
        <span className={css(styles, "char wrong")} key={`direct-overwrite-${index}`}>
          {overwriteMistake}
        </span>,
      );
      return;
    }

    const isMistakeFlash =
      mistakeFlash !== null && typed === undefined && currentIndex === input.length;

    const className =
      typed === undefined
        ? currentIndex === input.length && showMarker
          ? css(styles, "char current")
          : css(styles, "char")
        : typed === character
          ? css(styles, "char correct")
          : css(styles, "char wrong");
    const flashClassName = isMistakeFlash ? cx(className, css(styles, "mistake-flash")) : className;
    const flashKey = isMistakeFlash && mistakeFlash ? mistakeFlash.id : "idle";

    elements.push(
      <span className={flashClassName} key={`${character}-${index}-${flashKey}`}>
        {character}
      </span>,
    );
  });

  if (strictMistakeDisplayMode === "insert" && !insertedMistakes) {
    elements.push(...renderStrictMistakeCharacters(mistakeCharacters, "direct-insert"));
  }

  if (strictMistakeDisplayMode === "overwrite") {
    elements.push(
      ...renderStrictMistakeCharacters(
        mistakeCharacters.slice(Math.max(0, targetIndex - input.length)),
        "direct-overwrite-tail",
      ),
    );
  }

  return elements;
}

function getVisibleStrictMistakeCharacters(
  strictMistakeInput: string,
  strictMistakeDisplayMode: StrictMistakeDisplayMode,
) {
  return strictMistakeDisplayMode === "none" ? [] : Array.from(strictMistakeInput);
}

function getOverwriteMistakeCharacter(
  mistakeCharacters: string[],
  currentIndex: number,
  inputLength: number,
  strictMistakeDisplayMode: StrictMistakeDisplayMode,
) {
  if (strictMistakeDisplayMode !== "overwrite") {
    return null;
  }

  const mistakeIndex = currentIndex - inputLength;
  return mistakeIndex >= 0 ? (mistakeCharacters[mistakeIndex] ?? null) : null;
}

function renderStrictMistakeCharacters(mistakeCharacters: string[], keyPrefix: string) {
  return mistakeCharacters.map((character, index) => (
    <span className={css(styles, "char wrong")} key={`${keyPrefix}-${index}`}>
      {character}
    </span>
  ));
}
