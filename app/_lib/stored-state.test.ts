import { describe, expect, test } from "bun:test";
import { initialStoredState } from "./constants";
import {
  cacheStoredState,
  getInitialStoredState,
  normalizeStoredState,
  resetStoredStateCache,
  shouldPersistStoredState,
} from "./stored-state";

describe("stored state persistence", () => {
  test("does not persist the initial state before storage hydration finishes", () => {
    expect(
      shouldPersistStoredState({
        hasLoadedStoredState: false,
        skipNextPersist: false,
      }),
    ).toBe(false);
  });

  test("persists after hydration unless the next persist was explicitly skipped", () => {
    expect(
      shouldPersistStoredState({
        hasLoadedStoredState: true,
        skipNextPersist: false,
      }),
    ).toBe(true);

    expect(
      shouldPersistStoredState({
        hasLoadedStoredState: true,
        skipNextPersist: true,
      }),
    ).toBe(false);
  });

  test("reuses the last loaded state while the next route hydrates storage", () => {
    resetStoredStateCache();

    const loadedState = {
      ...initialStoredState,
      bestPracticeScore: 1200,
      bestProductionScore: 2400,
    };

    cacheStoredState(loadedState);

    expect(getInitialStoredState()).toEqual(loadedState);
  });

  test("fills the strict mistake display setting when loading older stored state", () => {
    const stored = normalizeStoredState({
      settings: {
        ...initialStoredState.settings,
        strictMistakeDisplayMode: undefined,
      },
    });

    expect(stored.settings.strictMistakeDisplayMode).toBe("overwrite");
  });

  test("fills the rank calculation mode when loading older stored state", () => {
    const stored = normalizeStoredState({
      settings: {
        ...initialStoredState.settings,
        rankCalculationMode: undefined,
      },
    });

    expect(stored.settings.rankCalculationMode).toBe("projected");
  });

  test("keeps the actual rank calculation mode from stored state", () => {
    const stored = normalizeStoredState({
      settings: {
        ...initialStoredState.settings,
        rankCalculationMode: "actual",
      },
    });

    expect(stored.settings.rankCalculationMode).toBe("actual");
  });

  test("fills top display metrics when loading older stored state", () => {
    const stored = normalizeStoredState({
      settings: {
        ...initialStoredState.settings,
        topDisplayMetricIds: undefined,
      },
    });

    expect(stored.settings.topDisplayMetricIds).toEqual([
      "remainingTime",
      "keysPerSecond",
      "kanaCharactersPerSecond",
      "promptCharactersPerSecond",
      "accuracy",
      "mistakes",
      "physicalKeystrokes",
      "completedPrompts",
    ]);
  });

  test("fills and validates the English space display setting", () => {
    const migrated = normalizeStoredState({
      settings: {
        ...initialStoredState.settings,
        enSpaceDisplay: undefined,
      },
    });
    const normalized = normalizeStoredState({
      settings: {
        ...initialStoredState.settings,
        enSpaceDisplay: "invalid" as typeof initialStoredState.settings.enSpaceDisplay,
      },
    });
    const underscore = normalizeStoredState({
      settings: {
        ...initialStoredState.settings,
        enSpaceDisplay: "underscore",
      },
    });
    const box = normalizeStoredState({
      settings: {
        ...initialStoredState.settings,
        enSpaceDisplay: "box",
      },
    });

    expect(migrated.settings.enSpaceDisplay).toBe("glyph");
    expect(normalized.settings.enSpaceDisplay).toBe("glyph");
    expect(underscore.settings.enSpaceDisplay).toBe("underscore");
    expect(box.settings.enSpaceDisplay).toBe("box");
  });

  test("keeps an explicitly empty top display metric selection", () => {
    const stored = normalizeStoredState({
      settings: {
        ...initialStoredState.settings,
        topDisplayMetricIds: [],
      },
    });

    expect(stored.settings.topDisplayMetricIds).toEqual([]);
  });

  test("fills and validates the target display order when loading stored state", () => {
    const migrated = normalizeStoredState({
      settings: {
        ...initialStoredState.settings,
        targetDisplayOrder: undefined,
      },
    });
    const normalized = normalizeStoredState({
      settings: {
        ...initialStoredState.settings,
        targetDisplayOrder: [
          "romaji",
          "kanji",
          "romaji",
          "unknown",
          "hiraganaInputProgress",
        ] as typeof initialStoredState.settings.targetDisplayOrder,
      },
    });

    expect(migrated.settings.targetDisplayOrder).toEqual([
      "kanji",
      "kanjiInputProgress",
      "hiragana",
      "hiraganaInputProgress",
      "romaji",
    ]);
    expect(normalized.settings.targetDisplayOrder).toEqual([
      "romaji",
      "kanji",
      "hiraganaInputProgress",
      "kanjiInputProgress",
      "hiragana",
    ]);
  });

  test("fills input screen visibility settings when loading older stored state", () => {
    const stored = normalizeStoredState({
      settings: {
        ...initialStoredState.settings,
        showKanjiDisplay: undefined,
        showFuriganaDisplay: undefined,
        showHiraganaDisplay: undefined,
      },
    });

    expect(stored.settings.showKanjiDisplay).toBe(true);
    expect(stored.settings.showFuriganaDisplay).toBe(true);
    expect(stored.settings.showHiraganaDisplay).toBe(true);
  });

  test("fills marker visibility settings when loading older stored state", () => {
    const stored = normalizeStoredState({
      settings: {
        ...initialStoredState.settings,
        showKanjiMarker: undefined,
        showFuriganaMarker: undefined,
        showHiraganaMarker: undefined,
        showRomajiMarker: undefined,
        showKanjiInputProgress: undefined,
        showHiraganaInputProgress: undefined,
      },
    });

    expect(stored.settings.showKanjiMarker).toBe(false);
    expect(stored.settings.showFuriganaMarker).toBe(false);
    expect(stored.settings.showHiraganaMarker).toBe(true);
    expect(stored.settings.showRomajiMarker).toBe(true);
    expect(stored.settings.showKanjiInputProgress).toBe(false);
    expect(stored.settings.showHiraganaInputProgress).toBe(false);
  });

  test("fills the romaji marker mode when loading older stored state", () => {
    const stored = normalizeStoredState({
      settings: {
        ...initialStoredState.settings,
        romajiMarkerMode: undefined,
      },
    });

    expect(stored.settings.romajiMarkerMode).toBe("character");
  });

  test("keeps the token romaji marker mode from stored state", () => {
    const stored = normalizeStoredState({
      settings: {
        ...initialStoredState.settings,
        romajiMarkerMode: "token",
      },
    });

    expect(stored.settings.romajiMarkerMode).toBe("token");
  });

  test("fills special split yoon setting when loading older stored state", () => {
    const stored = normalizeStoredState({
      settings: {
        ...initialStoredState.settings,
        allowSplitSpecialYoon: undefined,
        specialRomajiInputPreset: undefined,
        specialRomajiInputSelections: undefined,
      },
    });

    expect(stored.settings.allowSplitYoon).toBe(true);
    expect(stored.settings.allowSplitSpecialYoon).toBe(false);
    expect(stored.settings.specialRomajiInputPreset).toBe("integrated");
    expect(stored.settings.specialRomajiInputSelections).toEqual({});
  });

  test("migrates legacy special split yoon setting to the split special romaji preset", () => {
    const stored = normalizeStoredState({
      settings: {
        ...initialStoredState.settings,
        allowSplitSpecialYoon: true,
        specialRomajiInputPreset: undefined,
      },
    });

    expect(stored.settings.specialRomajiInputPreset).toBe("split");
  });

  test("fills input screen font sizes when loading older stored state", () => {
    const stored = normalizeStoredState({
      settings: {
        ...initialStoredState.settings,
        kanjiFontSize: undefined,
        kanjiInputProgressFontSize: undefined,
        furiganaFontScale: undefined,
        hiraganaFontSize: undefined,
        hiraganaInputProgressFontSize: undefined,
        romajiFontSize: undefined,
      },
    });

    expect(stored.settings.kanjiFontSize).toBe(32);
    expect(stored.settings.kanjiInputProgressFontSize).toBe(24);
    expect(stored.settings.furiganaFontScale).toBe(0.42);
    expect(stored.settings.hiraganaFontSize).toBe(24);
    expect(stored.settings.hiraganaInputProgressFontSize).toBe(20);
    expect(stored.settings.romajiFontSize).toBe(20);
  });

  test("fills and validates input screen font families when loading stored state", () => {
    const migrated = normalizeStoredState({
      settings: {
        ...initialStoredState.settings,
        englishFontFamily: undefined,
        japaneseFontFamily: undefined,
      },
    });
    const valid = normalizeStoredState({
      settings: {
        ...initialStoredState.settings,
        englishFontFamily: "source-code-pro",
        japaneseFontFamily: "noto-serif-jp",
      },
    });
    const invalid = normalizeStoredState({
      settings: {
        ...initialStoredState.settings,
        englishFontFamily: "comic-sans",
        japaneseFontFamily: "invalid-font",
      },
    });
    const legacyKosugi = normalizeStoredState({
      settings: {
        ...initialStoredState.settings,
        japaneseFontFamily: "kosugi-maru",
      },
    });

    expect(migrated.settings.japaneseFontFamily).toBe("noto-sans-jp");
    expect(migrated.settings.englishFontFamily).toBe("inter");
    expect(valid.settings.japaneseFontFamily).toBe("noto-serif-jp");
    expect(valid.settings.englishFontFamily).toBe("source-code-pro");
    expect(invalid.settings.japaneseFontFamily).toBe("noto-sans-jp");
    expect(invalid.settings.englishFontFamily).toBe("inter");
    expect(legacyKosugi.settings.japaneseFontFamily).toBe("noto-serif-jp");
  });

  test("migrates legacy furigana pixel font size into a kanji-relative scale", () => {
    const stored = normalizeStoredState({
      settings: {
        ...initialStoredState.settings,
        kanjiFontSize: 40,
        furiganaFontScale: undefined,
        furiganaFontSize: 16,
      },
    });

    expect(stored.settings.furiganaFontScale).toBe(0.4);
  });

  test("fills input screen line heights and bottom spacing when loading older stored state", () => {
    const stored = normalizeStoredState({
      settings: {
        ...initialStoredState.settings,
        kanjiLineHeight: undefined,
        kanjiMarginBottom: undefined,
        kanjiInputProgressLineHeight: undefined,
        kanjiInputProgressMarginBottom: undefined,
        furiganaLineHeight: undefined,
        furiganaMarginBottom: undefined,
        hiraganaLineHeight: undefined,
        hiraganaMarginBottom: undefined,
        hiraganaInputProgressLineHeight: undefined,
        hiraganaInputProgressMarginBottom: undefined,
        romajiLineHeight: undefined,
        romajiMarginBottom: undefined,
      },
    });

    expect(stored.settings.kanjiLineHeight).toBe(1.45);
    expect(stored.settings.kanjiMarginBottom).toBe(6);
    expect(stored.settings.kanjiInputProgressLineHeight).toBe(1.3);
    expect(stored.settings.kanjiInputProgressMarginBottom).toBe(0);
    expect(stored.settings.furiganaLineHeight).toBe(1.1);
    expect(stored.settings.furiganaMarginBottom).toBe(0);
    expect(stored.settings.hiraganaLineHeight).toBe(1.4);
    expect(stored.settings.hiraganaMarginBottom).toBe(10);
    expect(stored.settings.hiraganaInputProgressLineHeight).toBe(1.3);
    expect(stored.settings.hiraganaInputProgressMarginBottom).toBe(0);
    expect(stored.settings.romajiLineHeight).toBe(1.45);
    expect(stored.settings.romajiMarginBottom).toBe(0);
  });

  test("fills and clamps the production long text line count when loading stored state", () => {
    const migrated = normalizeStoredState({
      settings: {
        ...initialStoredState.settings,
        productionLongTextLineCount: undefined,
      },
    });
    const clampedLow = normalizeStoredState({
      settings: {
        ...initialStoredState.settings,
        productionLongTextLineCount: 1,
      },
    });
    const clampedHigh = normalizeStoredState({
      settings: {
        ...initialStoredState.settings,
        productionLongTextLineCount: 99,
      },
    });

    expect(migrated.settings.productionLongTextLineCount).toBe(5);
    expect(clampedLow.settings.productionLongTextLineCount).toBe(3);
    expect(clampedHigh.settings.productionLongTextLineCount).toBe(12);
  });

  test("turns furigana display off when kanji display is off in stored settings", () => {
    const stored = normalizeStoredState({
      settings: {
        ...initialStoredState.settings,
        showKanjiDisplay: false,
        showFuriganaDisplay: true,
      },
    });

    expect(stored.settings.showKanjiDisplay).toBe(false);
    expect(stored.settings.showFuriganaDisplay).toBe(false);
  });

  test("turns markers off when their display targets are hidden in stored settings", () => {
    const stored = normalizeStoredState({
      settings: {
        ...initialStoredState.settings,
        showFuriganaDisplay: false,
        showFuriganaMarker: true,
        showHiraganaDisplay: false,
        showHiraganaMarker: true,
        showHiraganaInputProgress: true,
        showKanjiDisplay: false,
        showKanjiMarker: true,
        showKanjiInputProgress: true,
        showRomajiMarker: true,
      },
    });

    expect(stored.settings.showKanjiMarker).toBe(false);
    expect(stored.settings.showFuriganaMarker).toBe(false);
    expect(stored.settings.showHiraganaMarker).toBe(false);
    expect(stored.settings.showKanjiInputProgress).toBe(false);
    expect(stored.settings.showHiraganaInputProgress).toBe(false);
    expect(stored.settings.showRomajiMarker).toBe(true);
  });

  test("fills auto retire performance settings when loading older stored state", () => {
    const stored = normalizeStoredState({
      settings: {
        ...initialStoredState.settings,
        consecutiveMistypeRetireCount: undefined,
        accuracyRetireBorderPercent: undefined,
      },
    });

    expect(stored.settings.consecutiveMistypeRetireCount).toBe(0);
    expect(stored.settings.accuracyRetireBorderPercent).toBe(0);
  });

  test("fills the next challenge preview length when loading older stored state", () => {
    const stored = normalizeStoredState({
      settings: {
        ...initialStoredState.settings,
        nextChallengePreviewLength: undefined,
        nextChallengePreviewMode: undefined,
      },
    });

    expect(stored.settings.nextChallengePreviewLength).toBe(8);
    expect(stored.settings.nextChallengePreviewMode).toBe("split-slide");
  });
});
