import {
	defaultTopDisplayMetricIds,
	initialSettings,
	initialStoredState,
	storageKey,
	topDisplayMetricOptions,
} from "./constants";
import type { AppSettings, StoredState } from "./types";

let cachedStoredState: StoredState | null = null;

type LegacyAppSettings = Partial<AppSettings> & {
	furiganaFontSize?: number;
};

export function getInitialStoredState() {
	return cachedStoredState ?? initialStoredState;
}

export function cacheStoredState(storedState: StoredState) {
	cachedStoredState = storedState;
}

export function resetStoredStateCache() {
	cachedStoredState = null;
}

export function normalizeAppSettings(settings: AppSettings): AppSettings {
	const showFuriganaDisplay =
		settings.showKanjiDisplay && settings.showFuriganaDisplay;

	return {
		...settings,
		showFuriganaDisplay,
		showKanjiMarker: settings.showKanjiDisplay && settings.showKanjiMarker,
		showFuriganaMarker: showFuriganaDisplay && settings.showFuriganaMarker,
		showHiraganaMarker:
			settings.showHiraganaDisplay && settings.showHiraganaMarker,
		romajiMarkerMode: normalizeRomajiMarkerMode(settings.romajiMarkerMode),
		kanjiFontSize: normalizeFontSize(
			settings.kanjiFontSize,
			initialSettings.kanjiFontSize,
		),
		furiganaFontScale: normalizeFontScale(
			settings.furiganaFontScale,
			initialSettings.furiganaFontScale,
		),
		hiraganaFontSize: normalizeFontSize(
			settings.hiraganaFontSize,
			initialSettings.hiraganaFontSize,
		),
		romajiFontSize: normalizeFontSize(
			settings.romajiFontSize,
			initialSettings.romajiFontSize,
		),
		kanjiLineHeight: normalizeLineHeight(
			settings.kanjiLineHeight,
			initialSettings.kanjiLineHeight,
		),
		kanjiMarginBottom: normalizeSpacing(
			settings.kanjiMarginBottom,
			initialSettings.kanjiMarginBottom,
		),
		furiganaLineHeight: normalizeLineHeight(
			settings.furiganaLineHeight,
			initialSettings.furiganaLineHeight,
		),
		furiganaMarginBottom: normalizeSpacing(
			settings.furiganaMarginBottom,
			initialSettings.furiganaMarginBottom,
		),
		hiraganaLineHeight: normalizeLineHeight(
			settings.hiraganaLineHeight,
			initialSettings.hiraganaLineHeight,
		),
		hiraganaMarginBottom: normalizeSpacing(
			settings.hiraganaMarginBottom,
			initialSettings.hiraganaMarginBottom,
		),
		romajiLineHeight: normalizeLineHeight(
			settings.romajiLineHeight,
			initialSettings.romajiLineHeight,
		),
		romajiMarginBottom: normalizeSpacing(
			settings.romajiMarginBottom,
			initialSettings.romajiMarginBottom,
		),
		productionLongTextLineCount: normalizeProductionLongTextLineCount(
			settings.productionLongTextLineCount,
			initialSettings.productionLongTextLineCount,
		),
		nextChallengePreviewLength: normalizePreviewLength(
			settings.nextChallengePreviewLength,
			initialSettings.nextChallengePreviewLength,
		),
		nextChallengePreviewMode: normalizeNextChallengePreviewMode(
			settings.nextChallengePreviewMode,
		),
		rankCalculationMode: normalizeRankCalculationMode(
			settings.rankCalculationMode,
		),
		specialRomajiInputPreset: normalizeSpecialRomajiInputPreset(
			settings.specialRomajiInputPreset,
		),
		topDisplayMetricIds: normalizeTopDisplayMetricIds(
			settings.topDisplayMetricIds,
		),
		enSpaceDisplay: normalizeEnSpaceDisplay(settings.enSpaceDisplay),
	};
}

export function normalizeStoredState(
	storedState: Partial<StoredState> | null | undefined,
) {
	const storedSettings = storedState?.settings as LegacyAppSettings | undefined;
	const kanjiFontSize =
		storedSettings?.kanjiFontSize ?? initialSettings.kanjiFontSize;

	return {
		...initialStoredState,
		...storedState,
		settings: normalizeAppSettings({
			...initialSettings,
			...storedSettings,
			showKanjiDisplay:
				storedSettings?.showKanjiDisplay ?? initialSettings.showKanjiDisplay,
			showFuriganaDisplay:
				storedSettings?.showFuriganaDisplay ??
				initialSettings.showFuriganaDisplay,
			showHiraganaDisplay:
				storedSettings?.showHiraganaDisplay ??
				initialSettings.showHiraganaDisplay,
			showKanjiMarker:
				storedSettings?.showKanjiMarker ?? initialSettings.showKanjiMarker,
			showFuriganaMarker:
				storedSettings?.showFuriganaMarker ??
				initialSettings.showFuriganaMarker,
			showHiraganaMarker:
				storedSettings?.showHiraganaMarker ??
				initialSettings.showHiraganaMarker,
			showRomajiMarker:
				storedSettings?.showRomajiMarker ?? initialSettings.showRomajiMarker,
			romajiMarkerMode:
				storedSettings?.romajiMarkerMode ?? initialSettings.romajiMarkerMode,
			kanjiFontSize,
			furiganaFontScale:
				storedSettings?.furiganaFontScale ??
				getLegacyFuriganaFontScale(storedSettings, kanjiFontSize) ??
				initialSettings.furiganaFontScale,
			hiraganaFontSize:
				storedSettings?.hiraganaFontSize ?? initialSettings.hiraganaFontSize,
			romajiFontSize:
				storedSettings?.romajiFontSize ?? initialSettings.romajiFontSize,
			kanjiLineHeight:
				storedSettings?.kanjiLineHeight ?? initialSettings.kanjiLineHeight,
			kanjiMarginBottom:
				storedSettings?.kanjiMarginBottom ?? initialSettings.kanjiMarginBottom,
			furiganaLineHeight:
				storedSettings?.furiganaLineHeight ??
				initialSettings.furiganaLineHeight,
			furiganaMarginBottom:
				storedSettings?.furiganaMarginBottom ??
				initialSettings.furiganaMarginBottom,
			hiraganaLineHeight:
				storedSettings?.hiraganaLineHeight ??
				initialSettings.hiraganaLineHeight,
			hiraganaMarginBottom:
				storedSettings?.hiraganaMarginBottom ??
				initialSettings.hiraganaMarginBottom,
			romajiLineHeight:
				storedSettings?.romajiLineHeight ?? initialSettings.romajiLineHeight,
			romajiMarginBottom:
				storedSettings?.romajiMarginBottom ??
				initialSettings.romajiMarginBottom,
			productionLongTextLineCount:
				storedSettings?.productionLongTextLineCount ??
				initialSettings.productionLongTextLineCount,
			strictMistakeDisplayMode:
				storedSettings?.strictMistakeDisplayMode ??
				initialSettings.strictMistakeDisplayMode,
			nextChallengePreviewLength:
				storedSettings?.nextChallengePreviewLength ??
				initialSettings.nextChallengePreviewLength,
			nextChallengePreviewMode:
				storedSettings?.nextChallengePreviewMode ??
				initialSettings.nextChallengePreviewMode,
			rankCalculationMode:
				storedSettings?.rankCalculationMode ??
				initialSettings.rankCalculationMode,
			allowSplitSpecialYoon:
				storedSettings?.allowSplitSpecialYoon ??
				initialSettings.allowSplitSpecialYoon,
			specialRomajiInputPreset:
				storedSettings?.specialRomajiInputPreset ??
				(storedSettings?.allowSplitSpecialYoon
					? "split"
					: initialSettings.specialRomajiInputPreset),
			specialRomajiInputSelections:
				storedSettings?.specialRomajiInputSelections ??
				initialSettings.specialRomajiInputSelections,
			enSpaceDisplay:
				storedSettings?.enSpaceDisplay ?? initialSettings.enSpaceDisplay,
			topDisplayMetricIds: storedSettings?.topDisplayMetricIds ?? [
				...defaultTopDisplayMetricIds,
			],
			consecutiveMistypeRetireCount:
				storedSettings?.consecutiveMistypeRetireCount ??
				initialSettings.consecutiveMistypeRetireCount,
			accuracyRetireBorderPercent:
				storedSettings?.accuracyRetireBorderPercent ??
				initialSettings.accuracyRetireBorderPercent,
			sokuonInput: {
				...initialSettings.sokuonInput,
				...storedSettings?.sokuonInput,
			},
		}),
	};
}

function normalizeFontSize(value: number, fallback: number) {
	if (!Number.isFinite(value)) {
		return fallback;
	}

	return Math.min(48, Math.max(10, Math.round(value)));
}

function normalizeFontScale(value: number, fallback: number) {
	if (!Number.isFinite(value)) {
		return fallback;
	}

	return Math.min(1, Math.max(0.2, Math.round(value * 100) / 100));
}

function normalizeLineHeight(value: number, fallback: number) {
	if (!Number.isFinite(value)) {
		return fallback;
	}

	return Math.min(2.5, Math.max(0.8, Math.round(value * 100) / 100));
}

function normalizeSpacing(value: number, fallback: number) {
	if (!Number.isFinite(value)) {
		return fallback;
	}

	return Math.min(48, Math.max(0, Math.round(value)));
}

function normalizeProductionLongTextLineCount(value: number, fallback: number) {
	if (!Number.isFinite(value)) {
		return fallback;
	}

	return Math.min(12, Math.max(3, Math.round(value)));
}

function normalizePreviewLength(value: number, fallback: number) {
	if (!Number.isFinite(value)) {
		return fallback;
	}

	return Math.min(40, Math.max(0, Math.round(value)));
}

function normalizeNextChallengePreviewMode(
	value: AppSettings["nextChallengePreviewMode"],
) {
	if (
		value === "none" ||
		value === "split-slide" ||
		value === "split-alternate" ||
		value === "center-scroll"
	) {
		return value;
	}

	return initialSettings.nextChallengePreviewMode;
}

function normalizeRankCalculationMode(
	value: AppSettings["rankCalculationMode"],
) {
	return value === "actual" || value === "projected"
		? value
		: initialSettings.rankCalculationMode;
}

function normalizeRomajiMarkerMode(value: AppSettings["romajiMarkerMode"]) {
	return value === "token" || value === "character"
		? value
		: initialSettings.romajiMarkerMode;
}

function normalizeSpecialRomajiInputPreset(
	value: AppSettings["specialRomajiInputPreset"],
) {
	return value === "split" || value === "integrated" || value === "custom"
		? value
		: initialSettings.specialRomajiInputPreset;
}

function getLegacyFuriganaFontScale(
	settings: LegacyAppSettings | undefined,
	kanjiFontSize: number,
) {
	const legacyFontSize = settings?.furiganaFontSize;

	if (
		!Number.isFinite(legacyFontSize) ||
		legacyFontSize === undefined ||
		kanjiFontSize <= 0
	) {
		return null;
	}

	return legacyFontSize / kanjiFontSize;
}

function normalizeEnSpaceDisplay(value: AppSettings["enSpaceDisplay"]) {
	return value === "glyph" || value === "underscore"
		? value
		: initialSettings.enSpaceDisplay;
}

function normalizeTopDisplayMetricIds(
	value: AppSettings["topDisplayMetricIds"],
) {
	if (!Array.isArray(value)) {
		return [...defaultTopDisplayMetricIds];
	}

	const validIds = new Set(topDisplayMetricOptions.map((option) => option.id));
	return value.filter((id) => validIds.has(id));
}

export function readStoredState(
	storage: Pick<Storage, "getItem" | "removeItem">,
): StoredState {
	const raw = storage.getItem(storageKey);
	if (!raw) {
		return initialStoredState;
	}

	try {
		return normalizeStoredState(JSON.parse(raw) as Partial<StoredState>);
	} catch {
		storage.removeItem(storageKey);
		return initialStoredState;
	}
}

export function shouldPersistStoredState({
	hasLoadedStoredState,
	skipNextPersist,
}: {
	hasLoadedStoredState: boolean;
	skipNextPersist: boolean;
}) {
	return hasLoadedStoredState && !skipNextPersist;
}
