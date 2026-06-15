import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { createRomajiInputTarget, getRank, modes } from "@/src/lib/typing";
import { initialSettings, initialStats } from "../_lib/constants";
import {
  TypingPanel,
  calculateProductionLongScrollLines,
  getDirectInputFocusRetryDelays,
} from "./TypingPanel";

type TypingPanelProps = Parameters<typeof TypingPanel>[0];

function renderTypingPanel(overrides: Partial<TypingPanelProps> = {}) {
  const props: TypingPanelProps = {
    acceptsTextInput: false,
    challengeLanguage: "en",
    correctionDebt: 0,
    currentAccuracy: 1,
    currentDisplay: "ab",
    currentFurigana: [],
    currentGuide: "ab",
    currentReading: "",
    currentRomajiTarget: null,
    currentRank: getRank(0),
    elapsedSeconds: null,
    finishReason: null,
    imeError: "",
    input: "",
    inputRef: { current: null },
    isFinished: false,
    isProductionBlocked: false,
    mistakeFlash: null,
    metrics: {
      accuracy: 1,
      consistency: 1,
      keysPerSecond: 0,
      paceMs: 0,
      score: 0,
    },
    mode: modes[0]!,
    nextChallengeDisplay: "",
    nextChallengeFurigana: [],
    nextChallengeGuide: "",
    nextChallengePreview: "",
    nextChallengePreviewMode: initialSettings.nextChallengePreviewMode,
    nextChallengeReading: "",
    nextChallengeRomajiTarget: null,
    previousChallengeDisplay: "",
    previousChallengeFurigana: [],
    previousChallengeGuide: "",
    previousChallengeReading: "",
    progress: 0,
    productionBlockReason: "本番モードは仮レーティング A0 以上で解放されます。",
    remainingSeconds: 120,
    showFuriganaDisplay: true,
    showFuriganaMarker: false,
    showHiraganaDisplay: true,
    showHiraganaMarker: true,
    showKanjiDisplay: true,
    showKanjiMarker: false,
    showRomajiMarker: true,
    romajiMarkerMode: "character",
    kanjiFontSize: initialSettings.kanjiFontSize,
    furiganaFontScale: initialSettings.furiganaFontScale,
    hiraganaFontSize: initialSettings.hiraganaFontSize,
    romajiFontSize: initialSettings.romajiFontSize,
    kanjiLineHeight: initialSettings.kanjiLineHeight,
    kanjiMarginBottom: initialSettings.kanjiMarginBottom,
    furiganaLineHeight: initialSettings.furiganaLineHeight,
    furiganaMarginBottom: initialSettings.furiganaMarginBottom,
    hiraganaLineHeight: initialSettings.hiraganaLineHeight,
    hiraganaMarginBottom: initialSettings.hiraganaMarginBottom,
    romajiLineHeight: initialSettings.romajiLineHeight,
    romajiMarginBottom: initialSettings.romajiMarginBottom,
    productionLongTextLineCount: initialSettings.productionLongTextLineCount,
    soundSettings: initialSettings,
    startedAt: null,
    stats: initialStats,
    rankCalculationMode: initialSettings.rankCalculationMode,
    strictMistakeDisplayMode: "overwrite",
    strictMistakeInput: "",
    topDisplayMetricIds: initialSettings.topDisplayMetricIds,
    onBackToModeSelect: () => undefined,
    onImeInput: () => undefined,
    onImeKeyDown: () => undefined,
    onPrepareSession: () => undefined,
    onPreventDirectTextInput: () => undefined,
    onResetSession: () => undefined,
    ...overrides,
  };

  return renderToStaticMarkup(<TypingPanel {...props} />);
}

function createTestRomajiTarget(value: string) {
  return createRomajiInputTarget(value, {
    preset: initialSettings.romajiInputPreset,
    selections: initialSettings.romajiInputSelections,
    allowSplitYoon: initialSettings.allowSplitYoon,
    sokuon: initialSettings.sokuonInput,
  });
}

describe("TypingPanel", () => {
  test("renders only the selected top display metrics", () => {
    const markup = renderTypingPanel({
      metrics: {
        accuracy: 0.875,
        consistency: 1,
        keysPerSecond: 2.5,
        paceMs: 400,
        score: 0,
      },
      progress: 25,
      remainingSeconds: 90,
      stats: {
        ...initialStats,
        correctCharacters: 18,
        mistakes: 2,
        physicalKeystrokes: 20,
      },
      topDisplayMetricIds: [
        "remainingPercent",
        "keysPerMinute",
        "mistakeRate",
        "correctRate",
      ],
    });

    expect(markup).toContain(">残り時間（％）</span><strong>75%</strong>");
    expect(markup).toContain(">打鍵/分</span><strong>150</strong>");
    expect(markup).toContain(
      '>ミス/物理打鍵</span><strong><span class="metric-split-value"><span>2</span><span>/</span><span>20</span></span></strong>',
    );
    expect(markup).toContain(
      '>正解/物理打鍵</span><strong><span class="metric-split-value"><span>18</span><span>/</span><span>20</span></span></strong>',
    );
    expect(markup).not.toContain(">残り時間</span>");
    expect(markup).not.toContain(">打鍵/秒</span>");
    expect(markup).toContain('class="progress-track"');
  });

  test("shows only the practice mode icon before the in-session rank", () => {
    const markup = renderTypingPanel({
      currentRank: getRank(500),
      elapsedSeconds: 31,
      mode: modes.find((mode) => mode.id === "practice-flow")!,
    });

    expect(markup).toContain('<span class="session-mode-symbol"');
    expect(markup).toContain("lucide-waves-horizontal");
    expect(markup).toContain('width="72"');
    expect(markup).toContain('height="72"');
    expect(markup).not.toContain(
      `<span class="session-mode-symbol">${modes.find((mode) => mode.id === "practice-flow")!.shortLabel}</span>`,
    );
    expect(markup.indexOf("session-mode-symbol")).toBeLessThan(
      markup.indexOf("session-rank-value"),
    );
  });

  test("does not show a mode symbol before production ranks", () => {
    const markup = renderTypingPanel({
      currentRank: getRank(500),
      elapsedSeconds: 31,
      mode: modes.find((mode) => mode.id === "production-ime-off")!,
    });

    expect(markup).not.toContain("session-mode-symbol");
  });

  test("marks projected in-progress score as approximate", () => {
    const markup = renderTypingPanel({
      currentRank: getRank(1234),
      elapsedSeconds: 30,
      metrics: {
        accuracy: 1,
        consistency: 1,
        keysPerSecond: 5,
        paceMs: 200,
        score: 1234,
      },
      rankCalculationMode: "projected",
      remainingSeconds: 90,
    });

    expect(markup).toContain("\u2248 1,234 pts");
  });

  test("does not mark actual or finished scores as approximate", () => {
    const actualMarkup = renderTypingPanel({
      currentRank: getRank(1234),
      elapsedSeconds: 30,
      metrics: {
        accuracy: 1,
        consistency: 1,
        keysPerSecond: 5,
        paceMs: 200,
        score: 1234,
      },
      rankCalculationMode: "actual",
      remainingSeconds: 90,
    });
    const finishedMarkup = renderTypingPanel({
      currentRank: getRank(1234),
      elapsedSeconds: 120,
      isFinished: true,
      metrics: {
        accuracy: 1,
        consistency: 1,
        keysPerSecond: 5,
        paceMs: 200,
        score: 1234,
      },
      rankCalculationMode: "projected",
      remainingSeconds: 0,
    });

    expect(actualMarkup).toContain(">1,234 pts</span>");
    expect(finishedMarkup).toContain(">1,234 pts</span>");
    expect(actualMarkup).not.toContain("\u2248 1,234 pts");
    expect(finishedMarkup).not.toContain("\u2248 1,234 pts");
  });

  test("shows the full in-progress rank in actual calculation mode", () => {
    const actualMarkup = renderTypingPanel({
      currentRank: getRank(4280),
      elapsedSeconds: 12,
      rankCalculationMode: "actual",
      remainingSeconds: 108,
    });
    const projectedMarkup = renderTypingPanel({
      currentRank: getRank(4280),
      elapsedSeconds: 12,
      rankCalculationMode: "projected",
      remainingSeconds: 108,
    });

    expect(actualMarkup).toContain('<span class="session-rank-value">A0</span>');
    expect(actualMarkup).not.toContain("concealed");
    expect(projectedMarkup).toContain(">A?</span>");
  });

  test("renders a direct-mode keyboard capture field that asks browsers not to use IME", () => {
    const markup = renderTypingPanel({
      acceptsTextInput: false,
      mode: modes.find((mode) => mode.id === "production-ime-off")!,
    });

    expect(markup).toContain('class="direct-input-guard"');
    expect(markup).toContain('aria-label="direct keyboard capture"');
    expect(markup).toContain('inputMode="none"');
    expect(markup).toContain('readOnly=""');
    expect(markup).toContain('tabindex="-1"');
    expect(markup).not.toContain('class="typing-input"');
  });

  test("keeps the visible IME textarea only in IME-on mode", () => {
    const markup = renderTypingPanel({
      acceptsTextInput: true,
      mode: modes.find((mode) => mode.id === "production-ime-on")!,
    });

    expect(markup).toContain('class="typing-input"');
    expect(markup).not.toContain('class="direct-input-guard"');
  });

  test("schedules direct input focus retries only during development direct typing", () => {
    expect(
      getDirectInputFocusRetryDelays({
        acceptsTextInput: false,
        autoFocusDirectInput: true,
        isDevelopment: true,
        isProductionBlocked: false,
      }),
    ).toEqual([50, 150, 300, 600]);

    expect(
      getDirectInputFocusRetryDelays({
        acceptsTextInput: true,
        autoFocusDirectInput: true,
        isDevelopment: true,
        isProductionBlocked: false,
      }),
    ).toEqual([]);
    expect(
      getDirectInputFocusRetryDelays({
        acceptsTextInput: false,
        autoFocusDirectInput: true,
        isDevelopment: false,
        isProductionBlocked: false,
      }),
    ).toEqual([]);
    expect(
      getDirectInputFocusRetryDelays({
        acceptsTextInput: false,
        autoFocusDirectInput: true,
        isDevelopment: true,
        isProductionBlocked: true,
      }),
    ).toEqual([]);
  });

  test("applies configured input screen font sizes to the target view", () => {
    const markup = renderTypingPanel({
      kanjiFontSize: 34,
      furiganaFontScale: 0.45,
      hiraganaFontSize: 25,
      romajiFontSize: 21,
    });

    expect(markup).toContain("--target-kanji-font-size:34px");
    expect(markup).toContain("--target-furigana-font-scale:0.45em");
    expect(markup).toContain("--target-hiragana-font-size:25px");
    expect(markup).toContain("--target-romaji-font-size:21px");
  });

  test("applies configured input screen spacing to the target view", () => {
    const markup = renderTypingPanel({
      kanjiLineHeight: 1.5,
      kanjiMarginBottom: 7,
      furiganaLineHeight: 1.2,
      furiganaMarginBottom: 2,
      hiraganaLineHeight: 1.35,
      hiraganaMarginBottom: 8,
      romajiLineHeight: 1.4,
      romajiMarginBottom: 3,
    });

    expect(markup).toContain("--target-kanji-line-height:1.5");
    expect(markup).toContain("--target-kanji-margin-bottom:7px");
    expect(markup).toContain("--target-furigana-line-height:1.2");
    expect(markup).toContain("--target-furigana-margin-bottom:2px");
    expect(markup).toContain("--target-hiragana-line-height:1.35");
    expect(markup).toContain("--target-hiragana-margin-bottom:8px");
    expect(markup).toContain("--target-romaji-line-height:1.4");
    expect(markup).toContain("--target-romaji-margin-bottom:3px");
  });

  test("marks only English challenge targets as compact", () => {
    const englishMarkup = renderTypingPanel({
      challengeLanguage: "en",
      currentDisplay: "short text",
      currentGuide: "short text",
    });
    const japaneseMarkup = renderTypingPanel({
      challengeLanguage: "ja",
      currentDisplay: "短文",
      currentGuide: "tanbun",
      currentReading: "たんぶん",
      currentRomajiTarget: createTestRomajiTarget("tanbun"),
    });

    expect(englishMarkup).toContain('class="target-view english-target-view"');
    expect(japaneseMarkup).toContain('class="target-view"');
    expect(japaneseMarkup).not.toContain("english-target-view");
  });

  test("shows split slide next challenge with the same text stack in the lower lane", () => {
    const nextRomajiTarget = createTestRomajiTarget("tsugi");
    const markup = renderTypingPanel({
      challengeLanguage: "ja",
      currentDisplay: "現在",
      currentGuide: "genzai",
      currentReading: "げんざい",
      currentRomajiTarget: createTestRomajiTarget("genzai"),
      nextChallengeDisplay: "次文",
      nextChallengeFurigana: [{ text: "次", ruby: "つぎ" }],
      nextChallengeGuide: nextRomajiTarget.guide,
      nextChallengePreview: "次文",
      nextChallengePreviewMode: "split-slide",
      nextChallengeReading: "つぎぶん",
      nextChallengeRomajiTarget: nextRomajiTarget,
    });
    const targetStart = markup.indexOf('class="target-view"');
    const analysisStart = markup.indexOf('class="challenge-analysis"');
    const targetMarkup = markup.slice(targetStart, analysisStart);

    expect(targetMarkup).toContain('class="challenge-preview-layout split-slide"');
    expect(targetMarkup).toContain('class="challenge-preview-lane current-lane top-lane"');
    expect(targetMarkup).toContain('class="challenge-preview-lane next-lane bottom-lane"');
    expect(targetMarkup).toContain('<ruby class="display-ruby">次<rt>つぎ</rt></ruby>');
    expect(targetMarkup).toContain('<p class="reading-text">つぎぶん</p>');
    expect(targetMarkup).toContain('<p class="input-target" aria-label="romaji input target"><span class="char">t</span>');
    expect(targetMarkup).not.toContain("<strong>次文</strong>");
  });

  test("uses a production long-form body while center scrolling only hiragana and romaji", () => {
    const currentRomajiTarget = createTestRomajiTarget("honbunichi.honbunni.");
    const nextRomajiTarget = createTestRomajiTarget("tsugi.");
    const markup = renderTypingPanel({
      challengeLanguage: "ja",
      currentDisplay: "本文一。本文二。",
      currentFurigana: [{ text: "本", ruby: "ほん" }],
      currentGuide: currentRomajiTarget.guide,
      currentReading: "ほんぶんいち。ほんぶんに。",
      currentRomajiTarget,
      mode: modes.find((mode) => mode.id === "production-ime-off")!,
      nextChallengeDisplay: "次本文。",
      nextChallengeFurigana: [{ text: "次", ruby: "つぎ" }],
      nextChallengeGuide: nextRomajiTarget.guide,
      nextChallengePreviewMode: "center-scroll",
      nextChallengeReading: "つぎ。",
      nextChallengeRomajiTarget: nextRomajiTarget,
    });

    expect(markup).toContain('class="production-direct-layout"');
    expect(markup).toContain('class="production-long-body"');
    expect(markup).toContain('class="production-long-scroll-content"');
    expect(markup).toContain("--production-long-scroll-lines:0");
    expect(markup).toContain('class="production-long-scroll-target"');
    expect(markup).not.toContain("production-long-scroll-marker");
    expect(markup).toContain('class="production-long-next-spacer"');
    expect(markup).toContain("<ruby class=\"display-ruby\">本<rt>ほん</rt></ruby>");
    expect(markup).toContain("文一。本文二。");
    expect(markup).toContain("<ruby class=\"display-ruby\">次<rt>つぎ</rt></ruby>");
    expect(markup).toContain("本文。");
    expect(markup).not.toContain("production-long-scroll-anchor");
    expect(markup).toContain('class="challenge-preview-layout center-scroll production-direct-inputs"');
    expect(markup).toContain('class="reading-text center-continuous-line"');
    expect(markup).toContain('class="input-target center-continuous-line"');
    expect(markup).not.toContain('class="display-text center-continuous-line"');
  });

  test("centers production direct hiragana and romaji from the start after the first challenge", () => {
    const currentRomajiTarget = createTestRomajiTarget("tsugi.");
    const nextRomajiTarget = createTestRomajiTarget("sonoato.");
    const markup = renderTypingPanel({
      challengeLanguage: "ja",
      currentDisplay: "次本文。",
      currentGuide: currentRomajiTarget.guide,
      currentReading: "つぎ。",
      currentRomajiTarget,
      mode: modes.find((mode) => mode.id === "production-ime-off")!,
      nextChallengeDisplay: "その後。",
      nextChallengeGuide: nextRomajiTarget.guide,
      nextChallengePreviewMode: "center-scroll",
      nextChallengeReading: "そのあと。",
      nextChallengeRomajiTarget: nextRomajiTarget,
      previousChallengeGuide: "mae.",
      previousChallengeReading: "まえ。",
      stats: {
        ...initialStats,
        completedPrompts: 1,
      },
    });

    expect(markup).toContain('class="challenge-preview-layout center-scroll production-direct-inputs"');
    expect(markup).toContain("--center-marker-position:0ch");
    expect(
      markup.match(
        /--center-marker-translate:calc\(8ch - var\(--center-marker-position\)\)/g,
      )?.length,
    ).toBe(2);
    expect(markup).not.toContain(
      "--center-marker-translate:calc(-1 * max(0ch, var(--center-marker-position) - 8ch))",
    );
    expect(markup).toContain('class="center-scroll-previous-text">まえ。</span>');
    expect(markup).toContain(
      'class="center-scroll-previous-text"><span class="char">m</span><span class="char">a</span><span class="char">e</span><span class="char">.</span></span>',
    );
  });

  test("splits production slide hiragana and romaji by punctuation units", () => {
    const currentRomajiTarget = createTestRomajiTarget("aiu,eo.");
    const markup = renderTypingPanel({
      challengeLanguage: "ja",
      currentDisplay: "本文。",
      currentGuide: currentRomajiTarget.guide,
      currentReading: "あいう、えお。",
      currentRomajiTarget,
      mode: modes.find((mode) => mode.id === "production-ime-off")!,
      nextChallengePreviewMode: "split-slide",
    });

    expect(markup).toContain('class="production-segmented-stack split-slide"');
    expect(markup).toContain('class="challenge-preview-lane current-lane top-lane active-lane"');
    expect(markup).toContain('class="challenge-preview-lane next-lane bottom-lane"');
    expect(markup).toContain('<p class="reading-text"><span class="char current">あ</span>');
    expect(markup).toContain("あ</span><span");
    expect(markup).toContain(">、</span></p>");
    expect(markup).toContain(">え</span><span");
    expect(markup).toContain(">。</span></p>");
    expect(markup).toContain('aria-label="romaji input target"><span class="char current">a</span>');
    expect(markup).toContain('<span class="char">e</span><span class="char">o</span><span class="char">.</span>');
  });

  test("alternates production segmented input lanes after a punctuation unit is completed", () => {
    const currentRomajiTarget = createTestRomajiTarget("aiu,eo.");
    const nextRomajiTarget = createTestRomajiTarget("tsugi.");
    const markup = renderTypingPanel({
      challengeLanguage: "ja",
      currentDisplay: "本文。",
      currentGuide: currentRomajiTarget.guide,
      currentReading: "あいう、えお。",
      currentRomajiTarget,
      input: "aiu,",
      mode: modes.find((mode) => mode.id === "production-ime-off")!,
      nextChallengeDisplay: "次。",
      nextChallengeGuide: nextRomajiTarget.guide,
      nextChallengePreviewMode: "split-alternate",
      nextChallengeReading: "つぎ。",
      nextChallengeRomajiTarget: nextRomajiTarget,
    });

    expect(markup).toContain('class="production-segmented-stack split-alternate"');
    expect(markup).toContain('class="challenge-preview-lane next-lane top-lane"');
    expect(markup).toContain('class="challenge-preview-lane current-lane bottom-lane active-lane"');
    expect(markup).toContain('<p class="reading-text"><span class="char current">え</span>');
    expect(markup).toContain('<span class="char">つ</span><span class="char">ぎ</span><span class="char">。</span>');
  });

  test("shows split alternate next challenge with the same text stack on the opposite lane", () => {
    const nextRomajiTarget = createTestRomajiTarget("ue");
    const markup = renderTypingPanel({
      challengeLanguage: "ja",
      nextChallengeDisplay: "上文",
      nextChallengeGuide: nextRomajiTarget.guide,
      nextChallengePreview: "上文",
      nextChallengePreviewMode: "split-alternate",
      nextChallengeReading: "うえぶん",
      nextChallengeRomajiTarget: nextRomajiTarget,
      stats: {
        ...initialStats,
        completedPrompts: 1,
      },
    });

    expect(markup).toContain('class="challenge-preview-layout split-alternate"');
    expect(markup).toContain('class="challenge-preview-lane next-lane top-lane"');
    expect(markup).toContain('class="challenge-preview-lane current-lane bottom-lane active-lane"');
    expect(markup).toContain('<p class="display-text">上文</p>');
    expect(markup).toContain('<p class="reading-text">うえぶん</p>');
    expect(markup).toContain('<p class="input-target" aria-label="romaji input target"><span class="char">u</span>');
    expect(markup).not.toContain("<strong>上文</strong>");
  });

  test("shows center scroll next challenge as one continuous challenge flow", () => {
    const currentRomajiTarget = createTestRomajiTarget("ima");
    const nextRomajiTarget = createTestRomajiTarget("tsugi");
    const markup = renderTypingPanel({
      challengeLanguage: "ja",
      currentDisplay: "今",
      currentGuide: currentRomajiTarget.guide,
      currentReading: "いま",
      currentRomajiTarget,
      nextChallengeDisplay: "次",
      nextChallengeGuide: nextRomajiTarget.guide,
      nextChallengePreview: "次",
      nextChallengePreviewMode: "center-scroll",
      nextChallengeReading: "つぎ",
      nextChallengeRomajiTarget: nextRomajiTarget,
    });

    expect(markup).toContain('class="challenge-preview-layout center-scroll"');
    expect(markup).toContain('class="display-text center-continuous-line"');
    expect(markup).toContain('class="reading-text center-continuous-line"');
    expect(markup).toContain('class="input-target center-continuous-line"');
    expect(markup).toContain('class="center-scroll-next-text"');
    expect(markup).toContain("今");
    expect(markup).toContain("次");
    expect(markup).not.toContain("next-lane");
    expect(markup).not.toContain("challenge-preview-separator");
    expect(markup).not.toContain("center-scroll-run");
  });

  test("keeps the center scroll marker at the left until it reaches the center threshold", () => {
    const currentRomajiTarget = createTestRomajiTarget("abcdefghi");
    const markup = renderTypingPanel({
      challengeLanguage: "ja",
      currentDisplay: "表示abcdefghi",
      currentGuide: currentRomajiTarget.guide,
      currentReading: "abcdefghi",
      currentRomajiTarget,
      input: "a",
      nextChallengeDisplay: "next",
      nextChallengeGuide: "next",
      nextChallengePreview: "next",
      nextChallengePreviewMode: "center-scroll",
      nextChallengeReading: "next",
      nextChallengeRomajiTarget: createTestRomajiTarget("next"),
    });

    expect(markup).toContain("--center-marker-position:1ch");
    expect(markup.match(/center-scroll-current-marker/g)?.length).toBe(2);
    expect(markup).toContain('class="center-scroll-viewport display-center-viewport"');
    expect(markup).toContain('class="center-scroll-viewport reading-center-viewport"');
    expect(markup).toContain('class="center-scroll-viewport input-center-viewport"');
  });

  test("shows furigana in center scroll and anchors the display line by reading progress", () => {
    const currentRomajiTarget = createTestRomajiTarget("kyou");
    const markup = renderTypingPanel({
      challengeLanguage: "ja",
      currentDisplay: "今日",
      currentFurigana: [{ text: "今日", ruby: "きょう" }],
      currentGuide: currentRomajiTarget.guide,
      currentReading: "きょう",
      currentRomajiTarget,
      input: "k",
      nextChallengeDisplay: "明日",
      nextChallengeGuide: "asu",
      nextChallengePreview: "明日",
      nextChallengePreviewMode: "center-scroll",
      nextChallengeReading: "あす",
      nextChallengeRomajiTarget: createTestRomajiTarget("asu"),
    });

    expect(markup).toContain('<ruby class="display-ruby">今<rt>きょ</rt></ruby>');
    expect(markup).toContain('<ruby class="display-ruby">日<rt>う</rt></ruby>');
    expect(markup).toContain(
      '<span aria-hidden="true" class="center-scroll-current-marker"></span><ruby',
    );
  });

  test("shows next challenge furigana in center scroll when furigana is enabled", () => {
    const currentRomajiTarget = createTestRomajiTarget("ima");
    const markup = renderTypingPanel({
      challengeLanguage: "ja",
      currentDisplay: "今",
      currentGuide: currentRomajiTarget.guide,
      currentReading: "いま",
      currentRomajiTarget,
      nextChallengeDisplay: "次文",
      nextChallengeFurigana: [{ text: "次", ruby: "つぎ" }],
      nextChallengeGuide: "tsugibun",
      nextChallengePreview: "次文",
      nextChallengePreviewMode: "center-scroll",
      nextChallengeReading: "つぎぶん",
      nextChallengeRomajiTarget: createTestRomajiTarget("tsugibun"),
      showFuriganaDisplay: true,
    });

    expect(markup).toContain('class="center-scroll-next-text"');
    expect(markup).toContain('<ruby class="display-ruby">次<rt>つぎ</rt></ruby>');
  });

  test("keeps center scroll next display text seamless when kanji marker is hidden", () => {
    const currentRomajiTarget = createTestRomajiTarget("ima");
    const markup = renderTypingPanel({
      challengeLanguage: "ja",
      currentDisplay: "current",
      currentGuide: currentRomajiTarget.guide,
      currentReading: "ima",
      currentRomajiTarget,
      nextChallengeDisplay: "next",
      nextChallengeGuide: "next",
      nextChallengePreview: "next",
      nextChallengePreviewMode: "center-scroll",
      nextChallengeReading: "next",
      nextChallengeRomajiTarget: createTestRomajiTarget("next"),
      showKanjiMarker: false,
    });
    const displayLine = markup.slice(
      markup.indexOf('class="display-text center-continuous-line"'),
      markup.indexOf("</p>", markup.indexOf('class="display-text center-continuous-line"')),
    );

    expect(displayLine).toContain('class="center-scroll-next-text seamless"');
  });

  test("keeps center scroll next display text muted when kanji marker is shown", () => {
    const currentRomajiTarget = createTestRomajiTarget("ima");
    const markup = renderTypingPanel({
      challengeLanguage: "ja",
      currentDisplay: "current",
      currentGuide: currentRomajiTarget.guide,
      currentReading: "ima",
      currentRomajiTarget,
      nextChallengeDisplay: "next",
      nextChallengeGuide: "next",
      nextChallengePreview: "next",
      nextChallengePreviewMode: "center-scroll",
      nextChallengeReading: "next",
      nextChallengeRomajiTarget: createTestRomajiTarget("next"),
      showKanjiMarker: true,
    });
    const displayLine = markup.slice(
      markup.indexOf('class="display-text center-continuous-line"'),
      markup.indexOf("</p>", markup.indexOf('class="display-text center-continuous-line"')),
    );

    expect(displayLine).toContain('class="center-scroll-next-text"');
    expect(displayLine).not.toContain('class="center-scroll-next-text seamless"');
  });

  test("centers the romaji line by the actual current romaji character", () => {
    const currentRomajiTarget = createTestRomajiTarget("kyou");
    const markup = renderTypingPanel({
      challengeLanguage: "ja",
      currentDisplay: "今日",
      currentGuide: currentRomajiTarget.guide,
      currentReading: "きょう",
      currentRomajiTarget,
      input: "k",
      nextChallengeDisplay: "next",
      nextChallengeGuide: "next",
      nextChallengePreview: "next",
      nextChallengePreviewMode: "center-scroll",
      nextChallengeReading: "next",
      nextChallengeRomajiTarget: createTestRomajiTarget("next"),
    });
    const inputLine = markup.slice(
      markup.indexOf('class="input-target center-continuous-line"'),
      markup.indexOf("</p>", markup.indexOf('class="input-target center-continuous-line"')),
    );

    expect(inputLine).not.toContain("center-scroll-current-marker");
    expect(inputLine).toContain('<span class="char current">y</span>');
  });

  test("keeps the previous challenge visible before the current center scroll challenge", () => {
    const currentRomajiTarget = createTestRomajiTarget("ima");
    const markup = renderTypingPanel({
      challengeLanguage: "ja",
      currentDisplay: "今",
      currentFurigana: [{ text: "今", ruby: "いま" }],
      currentGuide: currentRomajiTarget.guide,
      currentReading: "いま",
      currentRomajiTarget,
      nextChallengeDisplay: "次",
      nextChallengeGuide: "tsugi",
      nextChallengePreview: "次",
      nextChallengePreviewMode: "center-scroll",
      nextChallengeReading: "つぎ",
      nextChallengeRomajiTarget: createTestRomajiTarget("tsugi"),
      previousChallengeDisplay: "前",
      previousChallengeFurigana: [{ text: "前", ruby: "まえ" }],
      previousChallengeGuide: "mae",
      previousChallengeReading: "まえ",
      stats: {
        ...initialStats,
        completedPrompts: 1,
      },
    });

    expect(markup).toContain('class="center-scroll-previous-text"');
    expect(markup).toContain('<ruby class="display-ruby">前<rt>まえ</rt></ruby>');
    expect(markup).toContain('class="center-scroll-previous-text">まえ</span>');
    expect(markup).toContain(
      'class="center-scroll-previous-text"><span class="char">m</span><span class="char">a</span><span class="char">e</span></span>',
    );
    expect(markup.indexOf("前")).toBeLessThan(markup.indexOf("今"));
  });

  test("centers the center scroll marker from the start after the first challenge", () => {
    const currentRomajiTarget = createTestRomajiTarget("abcdefghijklmnop");
    const markup = renderTypingPanel({
      challengeLanguage: "ja",
      currentDisplay: "displayabcdefghijklmnop",
      currentGuide: currentRomajiTarget.guide,
      currentReading: "abcdefghijklmnop",
      currentRomajiTarget,
      input: "",
      nextChallengeDisplay: "next",
      nextChallengeGuide: "next",
      nextChallengePreview: "next",
      nextChallengePreviewMode: "center-scroll",
      nextChallengeReading: "next",
      nextChallengeRomajiTarget: createTestRomajiTarget("next"),
      stats: {
        ...initialStats,
        completedPrompts: 1,
      },
    });

    expect(markup).toContain("--center-marker-position:0ch");
    expect(
      markup.match(
        /--center-marker-translate:calc\(8ch - var\(--center-marker-position\)\)/g,
      )?.length,
    ).toBe(3);
  });

  test("moves every center scroll line by the same marker offset after the marker reaches center", () => {
    const currentRomajiTarget = createTestRomajiTarget("abcdefghijklmnop");
    const markup = renderTypingPanel({
      challengeLanguage: "ja",
      currentDisplay: "表示abcdefghijklmnop",
      currentGuide: currentRomajiTarget.guide,
      currentReading: "abcdefghijklmnop",
      currentRomajiTarget,
      input: "abcdefghij",
      nextChallengeDisplay: "next",
      nextChallengeGuide: "next",
      nextChallengePreview: "next",
      nextChallengePreviewMode: "center-scroll",
      nextChallengeReading: "next",
      nextChallengeRomajiTarget: createTestRomajiTarget("next"),
    });

    expect(markup).toContain("--center-marker-position:10ch");
    expect(markup.match(/--center-marker-position:10ch/g)?.length).toBe(3);
  });

  test("does not animate center scroll text on each typed key", () => {
    const css = readFileSync("app/_components/TypingPanel.module.css", "utf8");
    const centerScrollRule = css.match(
      /\.centerScroll \.displayText,[\s\S]+?\.centerScroll \.inputTarget \{(?<body>[\s\S]+?)\n\}/,
    );

    expect(centerScrollRule?.groups?.body).toContain("transition: none");
  });

  test("calculates production long body scroll lines from the current marker offset", () => {
    expect(calculateProductionLongScrollLines(-1, 46.4)).toBe(0);
    expect(calculateProductionLongScrollLines(0, 46.4)).toBe(0);
    expect(calculateProductionLongScrollLines(46.3, 46.4)).toBe(0);
    expect(calculateProductionLongScrollLines(46.4, 46.4)).toBe(1);
    expect(calculateProductionLongScrollLines(100, 46.4)).toBe(2);
    expect(calculateProductionLongScrollLines(100, 0)).toBe(0);
  });

  test("clips and fades the production long body at the configured line count", () => {
    const css = readFileSync("app/_components/TypingPanel.module.css", "utf8");
    const longBodyRule = css.match(
      /\.productionLongBody \{(?<body>[\s\S]+?)\n\}/,
    );
    const longBodyFadeRule = css.match(
      /\.productionLongBody::after \{(?<body>[\s\S]+?)\n\}/,
    );
    const longBodyContentRule = css.match(
      /\.productionLongScrollContent \{(?<body>[\s\S]+?)\n\}/,
    );
    const nextSpacerRule = css.match(
      /\.productionLongNextSpacer \{(?<body>[\s\S]+?)\n\}/,
    );
    const markup = renderTypingPanel({
      challengeLanguage: "ja",
      currentDisplay: "長い漢字文",
      mode: modes[2]!,
      productionLongTextLineCount: 7,
    });

    expect(longBodyRule?.groups?.body).toContain(
      "height: calc(var(--target-kanji-font-size, 32px) * var(--target-kanji-line-height, 1.45) * var(--target-production-long-lines, 5))",
    );
    expect(longBodyRule?.groups?.body).toContain("overflow: hidden");
    expect(longBodyRule?.groups?.body).not.toContain("overflow-y: auto");
    expect(longBodyFadeRule?.groups?.body).toContain("linear-gradient");
    expect(longBodyContentRule?.groups?.body).toContain(
      "transform: translateY(calc(-1 * var(--production-long-scroll-lines, 0) * var(--target-kanji-font-size, 32px) * var(--target-kanji-line-height, 1.45)))",
    );
    expect(css).not.toContain(".productionLongScrollMarker");
    expect(nextSpacerRule?.groups?.body).toContain(
      "margin-top: calc(var(--target-kanji-font-size, 32px) * var(--target-kanji-line-height, 1.45) * 0.5)",
    );
    expect(markup).toContain("--target-production-long-lines:7");
  });

  test("uses the full next challenge in center scroll instead of the preview length", () => {
    const currentRomajiTarget = createTestRomajiTarget("ima");
    const nextRomajiTarget = createTestRomajiTarget("nagai");
    const markup = renderTypingPanel({
      challengeLanguage: "ja",
      currentDisplay: "今",
      currentGuide: currentRomajiTarget.guide,
      currentReading: "いま",
      currentRomajiTarget,
      nextChallengeDisplay: "長い次の課題",
      nextChallengeGuide: nextRomajiTarget.guide,
      nextChallengePreview: "長い",
      nextChallengePreviewMode: "center-scroll",
      nextChallengeReading: "ながいつぎのかだい",
      nextChallengeRomajiTarget: nextRomajiTarget,
    });

    expect(markup).toContain("長い次の課題");
    expect(markup).toContain("ながいつぎのかだい");
    expect(markup).not.toContain("<strong>長い</strong>");
  });

  test("hides the next challenge preview when preview mode is none", () => {
    const markup = renderTypingPanel({
      nextChallengePreview: "次文",
      nextChallengePreviewMode: "none",
    });

    expect(markup).not.toContain("next-lane");
    expect(markup).not.toContain("center-scroll-run");
    expect(markup).not.toContain("<strong>次文</strong>");
  });

  test("shows the split preview even when kanji display is hidden", () => {
    const markup = renderTypingPanel({
      challengeLanguage: "ja",
      currentDisplay: "解析結果",
      currentGuide: "kaiseki",
      currentReading: "かいせき",
      nextChallengeDisplay: "次文",
      nextChallengeGuide: "tsugibun",
      nextChallengePreview: "次文",
      nextChallengePreviewMode: "split-slide",
      nextChallengeReading: "つぎぶん",
      showKanjiDisplay: false,
    });

    expect(markup).not.toContain("解析結果");
    expect(markup).toContain('class="challenge-preview-lane next-lane bottom-lane"');
    expect(markup).not.toContain('<p class="display-text">次文</p>');
    expect(markup).toContain('<p class="reading-text">つぎぶん</p>');
    expect(markup).toContain('<p class="input-target" aria-label="romaji input target"><span class="char">t</span>');
  });

  test("hides the next challenge preview when there is no preview text", () => {
    const markup = renderTypingPanel({
      nextChallengePreview: "",
      nextChallengePreviewMode: "split-slide",
    });

    expect(markup).not.toContain("next-lane");
  });

  test("flashes the current direct character after a mistake", () => {
    const markup = renderTypingPanel({
      mistakeFlash: { id: 1, input: "" },
    });

    expect(markup).toContain('<span class="char current mistake-flash">a</span>');
  });

  test("flashes the next romaji character inside the active token", () => {
    const romajiTarget = createRomajiInputTarget("shi", {
      allowSplitYoon: true,
      preset: "hepburn",
      selections: {},
    });
    const markup = renderTypingPanel({
      currentDisplay: "し",
      currentGuide: romajiTarget.guide,
      currentRomajiTarget: romajiTarget,
      input: "s",
      mistakeFlash: { id: 2, input: "s" },
    });

    expect(markup).toContain('<span class="char current mistake-flash">h</span>');
  });

  test("can highlight romaji by character inside a multi-character token", () => {
    const romajiTarget = createRomajiInputTarget("shi", {
      allowSplitYoon: true,
      preset: "hepburn",
      selections: {},
    });
    const markup = renderTypingPanel({
      currentDisplay: "shi",
      currentGuide: romajiTarget.guide,
      currentRomajiTarget: romajiTarget,
      input: "s",
      romajiMarkerMode: "character",
    });

    expect(markup).toContain(
      '<span class="char correct">s</span><span class="char current">h</span><span class="char">i</span>',
    );
  });

  test("keeps only one romaji character current in character marker mode before typing a multi-character token", () => {
    const romajiTarget = createRomajiInputTarget("tsu", {
      allowSplitYoon: true,
      preset: "hepburn",
      selections: {},
    });
    const markup = renderTypingPanel({
      currentDisplay: "tsu",
      currentGuide: romajiTarget.guide,
      currentRomajiTarget: romajiTarget,
      input: "",
      romajiMarkerMode: "character",
    });

    expect(markup).toContain(
      '<span class="char current">t</span><span class="char">s</span><span class="char">u</span>',
    );
  });

  test("can highlight romaji by token across regular kana tokens", () => {
    const romajiTarget = createRomajiInputTarget("sushi", {
      allowSplitYoon: true,
      preset: "hepburn",
      selections: {},
    });
    const markup = renderTypingPanel({
      currentDisplay: "sushi",
      currentGuide: romajiTarget.guide,
      currentRomajiTarget: romajiTarget,
      input: "s",
      romajiMarkerMode: "token",
    });

    expect(markup).toContain(
      '<span class="char correct current">su</span><span class="char">shi</span>',
    );
  });

  test("overwrites the next direct guide character with strict mistake input", () => {
    const markup = renderTypingPanel({
      currentDisplay: "abc",
      currentGuide: "abc",
      input: "a",
      strictMistakeDisplayMode: "overwrite",
      strictMistakeInput: "x",
    });

    expect(markup).toContain('<span class="char correct">a</span>');
    expect(markup).toContain('<span class="char wrong">x</span>');
    expect(markup).not.toContain('<span class="char current">b</span>');
  });

  test("inserts strict mistake input before the next direct guide character", () => {
    const markup = renderTypingPanel({
      currentDisplay: "abc",
      currentGuide: "abc",
      input: "a",
      strictMistakeDisplayMode: "insert",
      strictMistakeInput: "x",
    });

    expect(markup.indexOf('<span class="char correct">a</span>')).toBeLessThan(
      markup.indexOf('<span class="char wrong">x</span>'),
    );
    expect(markup.indexOf('<span class="char wrong">x</span>')).toBeLessThan(
      markup.indexOf('<span class="char current">b</span>'),
    );
  });

  test("hides strict mistake input when display mode is none", () => {
    const markup = renderTypingPanel({
      currentDisplay: "abc",
      currentGuide: "abc",
      input: "a",
      strictMistakeDisplayMode: "none",
      strictMistakeInput: "x",
    });

    expect(markup).not.toContain('<span class="char wrong">x</span>');
    expect(markup).toContain('<span class="char current">b</span>');
  });

  test("shows the hiragana reading between Japanese display text and romaji target", () => {
    const romajiTarget = createRomajiInputTarget("kaisekikekka", {
      allowSplitYoon: true,
      preset: "hepburn",
      selections: {},
    });
    const markup = renderTypingPanel({
      challengeLanguage: "ja",
      currentDisplay: "解析結果",
      currentGuide: romajiTarget.guide,
      currentReading: "かいせきけっか",
      currentRomajiTarget: romajiTarget,
    });

    expect(markup).toContain('<p class="display-text">解析結果</p>');
    expect(markup).toContain('<p class="reading-text">');
    expect(markup).toContain(">か</span>");
    expect(markup).toContain(">い</span>");
    expect(markup).toContain(">せ</span>");
    expect(markup.indexOf("解析結果")).toBeLessThan(markup.indexOf("reading-text"));
    expect(markup.indexOf("reading-text")).toBeLessThan(
      markup.indexOf('aria-label="romaji input target"'),
    );
  });

  test("shows a pre-session specification tip below the challenge target before the session starts", () => {
    const markup = renderTypingPanel({
      currentDisplay: "abc",
      currentGuide: "abc",
    });
    const targetEnd = markup.indexOf("</div>", markup.indexOf('class="target-view"'));
    const tipsStart = markup.indexOf('class="challenge-tip"');
    const analysisStart = markup.indexOf('class="challenge-analysis"');

    expect(markup).toContain('class="challenge-tip" aria-label="pre-session tip"');
    expect(markup).toContain("<strong>Tips</strong>");
    expect(markup).toContain("本番モードは開始後の入力だけを採点します。");
    expect(targetEnd).toBeLessThan(tipsStart);
    expect(tipsStart).toBeLessThan(analysisStart);
  });

  test("hides tips while the session is running", () => {
    const markup = renderTypingPanel({
      currentDisplay: "abc",
      currentGuide: "abc",
      startedAt: 1000,
    });

    expect(markup).not.toContain('class="challenge-tip"');
    expect(markup).not.toContain('aria-label="pre-session tip"');
    expect(markup).not.toContain('aria-label="post-session tip"');
  });

  test("shows a post-session typing advice tip after the session finishes", () => {
    const markup = renderTypingPanel({
      currentDisplay: "abc",
      currentGuide: "abc",
      isFinished: true,
      startedAt: 1000,
    });

    expect(markup).toContain('class="challenge-tip" aria-label="post-session tip"');
    expect(markup).toContain("肩と手首の力を抜き");
    expect(markup).not.toContain("本番モードは開始後の入力だけを採点します。");
  });

  test("shows furigana above the Japanese display text by default", () => {
    const romajiTarget = createRomajiInputTarget("kaisekikekka", {
      allowSplitYoon: true,
      preset: "hepburn",
      selections: {},
    });
    const markup = renderTypingPanel({
      challengeLanguage: "ja",
      currentDisplay: "解析結果を見てから判断する。",
      currentFurigana: [
        { text: "解", ruby: "かい" },
        { text: "析", ruby: "せき" },
        { text: "結", ruby: "けっ" },
        { text: "果", ruby: "か" },
        { text: "見", ruby: "み" },
        { text: "判", ruby: "はん" },
        { text: "断", ruby: "だん" },
      ],
      currentGuide: romajiTarget.guide,
      currentReading: "かいせき けっか を みてから はんだん する。",
      currentRomajiTarget: romajiTarget,
    });

    expect(markup).toContain('<ruby class="display-ruby">解<rt>かい</rt></ruby>');
    expect(markup).toContain('<ruby class="display-ruby">析<rt>せき</rt></ruby>');
    expect(markup).toContain('<ruby class="display-ruby">結<rt>けっ</rt></ruby>');
    expect(markup).toContain('<ruby class="display-ruby">果<rt>か</rt></ruby>');
    expect(markup).toContain('<span class="display-plain">を</span>');
    expect(markup).toContain('<ruby class="display-ruby">見<rt>み</rt></ruby>');
    expect(markup).toContain('<span class="display-plain">てから</span>');
    expect(markup).toContain('<ruby class="display-ruby">判<rt>はん</rt></ruby>');
    expect(markup).toContain('<ruby class="display-ruby">断<rt>だん</rt></ruby>');
  });

  test("can show kanji and furigana markers on the active ruby group", () => {
    const romajiTarget = createRomajiInputTarget("kaisekikekka", {
      allowSplitYoon: true,
      preset: "hepburn",
      selections: {},
    });
    const markup = renderTypingPanel({
      challengeLanguage: "ja",
      currentDisplay: "解析結果",
      currentFurigana: [
        { text: "解", ruby: "かい" },
        { text: "析", ruby: "せき" },
        { text: "結", ruby: "けっ" },
        { text: "果", ruby: "か" },
      ],
      currentGuide: romajiTarget.guide,
      currentReading: "かいせきけっか",
      currentRomajiTarget: romajiTarget,
      showFuriganaMarker: true,
      showKanjiMarker: true,
    });

    expect(markup).toContain(
      '<ruby class="display-ruby kanji-marker-current">解<rt><span class="furigana-marker-current">か</span><span class="furigana-marker-pending">い</span></rt></ruby>',
    );
    expect(markup).toContain(
      '<ruby class="display-ruby kanji-marker-pending">析<rt><span class="furigana-marker-pending">せ</span><span class="furigana-marker-pending">き</span></rt></ruby>',
    );
  });

  test("moves the furigana marker by character inside the active ruby group", () => {
    const romajiTarget = createRomajiInputTarget("kai", {
      allowSplitYoon: true,
      preset: "hepburn",
      selections: {},
    });
    const markup = renderTypingPanel({
      challengeLanguage: "ja",
      currentDisplay: "貝",
      currentFurigana: [{ text: "貝", ruby: "かい" }],
      currentGuide: romajiTarget.guide,
      currentReading: "かい",
      currentRomajiTarget: romajiTarget,
      input: "ka",
      showFuriganaMarker: true,
      showKanjiMarker: true,
    });

    expect(markup).toContain(
      '<ruby class="display-ruby kanji-marker-current">貝<rt><span class="furigana-marker-correct">か</span><span class="furigana-marker-current">い</span></rt></ruby>',
    );
  });

  test("colors completed and pending kanji while the kanji marker is enabled", () => {
    const romajiTarget = createRomajiInputTarget("kaisekikekka", {
      allowSplitYoon: true,
      preset: "hepburn",
      selections: {},
    });
    const markup = renderTypingPanel({
      challengeLanguage: "ja",
      currentDisplay: "解析結果",
      currentFurigana: [
        { text: "解", ruby: "かい" },
        { text: "析", ruby: "せき" },
        { text: "結", ruby: "けっ" },
        { text: "果", ruby: "か" },
      ],
      currentGuide: romajiTarget.guide,
      currentReading: "かいせきけっか",
      currentRomajiTarget: romajiTarget,
      input: "kaiseki",
      showFuriganaMarker: true,
      showKanjiMarker: true,
    });

    expect(markup).toContain(
      '<ruby class="display-ruby kanji-marker-correct">解<rt><span class="furigana-marker-correct">か</span><span class="furigana-marker-correct">い</span></rt></ruby>',
    );
    expect(markup).toContain(
      '<ruby class="display-ruby kanji-marker-correct">析<rt><span class="furigana-marker-correct">せ</span><span class="furigana-marker-correct">き</span></rt></ruby>',
    );
    expect(markup).toContain(
      '<ruby class="display-ruby kanji-marker-current">結<rt><span class="furigana-marker-current">け</span><span class="furigana-marker-pending">っ</span></rt></ruby>',
    );
    expect(markup).toContain(
      '<ruby class="display-ruby kanji-marker-pending">果<rt><span class="furigana-marker-pending">か</span></rt></ruby>',
    );
  });

  test("splits plain kana display markers by character", () => {
    const romajiTarget = createRomajiInputTarget("mitekarakaeru", {
      allowSplitYoon: true,
      preset: "hepburn",
      selections: {},
    });
    const markup = renderTypingPanel({
      challengeLanguage: "ja",
      currentDisplay: "見てから帰る",
      currentFurigana: [
        { text: "見", ruby: "み" },
        { text: "帰", ruby: "かえ" },
      ],
      currentGuide: romajiTarget.guide,
      currentReading: "みてからかえる",
      currentRomajiTarget: romajiTarget,
      input: "mi",
      showKanjiMarker: true,
    });

    expect(markup).toContain(
      '<span class="display-plain kanji-marker-current">て</span><span class="display-plain kanji-marker-pending">か</span><span class="display-plain kanji-marker-pending">ら</span>',
    );
  });

  test("keeps sokuon with the following kana for display markers", () => {
    const romajiTarget = createRomajiInputTarget("kekkakan", {
      allowSplitYoon: true,
      preset: "hepburn",
      selections: {},
    });
    const markup = renderTypingPanel({
      challengeLanguage: "ja",
      currentDisplay: "けっか漢",
      currentFurigana: [{ text: "漢", ruby: "かん" }],
      currentGuide: romajiTarget.guide,
      currentReading: "けっかかん",
      currentRomajiTarget: romajiTarget,
      input: "ke",
      showKanjiMarker: true,
    });

    expect(markup).toContain(
      '<span class="display-plain kanji-marker-correct">け</span><span class="display-plain kanji-marker-current">っか</span>',
    );
  });

  test("can hide hiragana and romaji current markers independently", () => {
    const romajiTarget = createRomajiInputTarget("kai", {
      allowSplitYoon: true,
      preset: "hepburn",
      selections: {},
    });
    const markup = renderTypingPanel({
      challengeLanguage: "ja",
      currentDisplay: "貝",
      currentFurigana: [{ text: "貝", ruby: "かい" }],
      currentGuide: romajiTarget.guide,
      currentReading: "かい",
      currentRomajiTarget: romajiTarget,
      input: "k",
      showHiraganaMarker: false,
      showRomajiMarker: false,
    });

    expect(markup).toContain('<p class="reading-text"><span class="char">か</span><span class="char">い</span></p>');
    expect(markup).not.toContain('<span class="char current">a</span>');
  });

  test("can hide furigana while keeping the Japanese display text", () => {
    const romajiTarget = createRomajiInputTarget("kaisekikekka", {
      allowSplitYoon: true,
      preset: "hepburn",
      selections: {},
    });
    const markup = renderTypingPanel({
      challengeLanguage: "ja",
      currentDisplay: "解析結果",
      currentFurigana: [
        { text: "解", ruby: "かい" },
        { text: "析", ruby: "せき" },
        { text: "結", ruby: "けっ" },
        { text: "果", ruby: "か" },
      ],
      currentGuide: romajiTarget.guide,
      currentReading: "かいせきけっか",
      currentRomajiTarget: romajiTarget,
      showFuriganaDisplay: false,
    });

    expect(markup).toContain('<p class="display-text">解析結果</p>');
    expect(markup).not.toContain("<rt>");
  });

  test("can hide the Japanese kanji display while keeping the hiragana reading", () => {
    const romajiTarget = createRomajiInputTarget("kaisekikekka", {
      allowSplitYoon: true,
      preset: "hepburn",
      selections: {},
    });
    const markup = renderTypingPanel({
      challengeLanguage: "ja",
      currentDisplay: "解析結果",
      currentGuide: romajiTarget.guide,
      currentReading: "かいせきけっか",
      currentRomajiTarget: romajiTarget,
      showKanjiDisplay: false,
    });

    expect(markup).not.toContain('<p class="display-text">解析結果</p>');
    expect(markup).toContain('<p class="reading-text">');
    expect(markup).toContain('aria-label="romaji input target"');
  });

  test("can hide the hiragana reading while keeping the Japanese kanji display", () => {
    const romajiTarget = createRomajiInputTarget("kaisekikekka", {
      allowSplitYoon: true,
      preset: "hepburn",
      selections: {},
    });
    const markup = renderTypingPanel({
      currentDisplay: "解析結果",
      currentGuide: romajiTarget.guide,
      currentReading: "かいせきけっか",
      currentRomajiTarget: romajiTarget,
      showHiraganaDisplay: false,
    });

    expect(markup).toContain('<p class="display-text">解析結果</p>');
    expect(markup).not.toContain('<p class="reading-text">');
    expect(markup).toContain('aria-label="romaji input target"');
  });

  test("keeps English IME challenges visible when the kanji display is hidden", () => {
    const markup = renderTypingPanel({
      challengeLanguage: "en",
      currentDisplay: "hello world",
      currentGuide: "hello world",
      mode: modes.find((mode) => mode.id === "production-ime-on")!,
      showKanjiDisplay: false,
    });

    expect(markup).toContain('<p class="display-text">hello world</p>');
  });

  test("highlights the hiragana reading with the current romaji progress", () => {
    const romajiTarget = createRomajiInputTarget("kai", {
      allowSplitYoon: true,
      preset: "hepburn",
      selections: {},
    });
    const markup = renderTypingPanel({
      currentDisplay: "貝",
      currentGuide: romajiTarget.guide,
      currentReading: "かい",
      currentRomajiTarget: romajiTarget,
      input: "ka",
    });

    expect(markup).toContain(
      '<p class="reading-text"><span class="char correct">か</span><span class="char current">い</span></p>',
    );
  });
});
