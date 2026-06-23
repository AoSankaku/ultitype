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
  PointerEvent,
  ReactNode,
  RefObject,
  CSSProperties,
} from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  formatTimer,
  getRomajiInputProgress,
  scoreImeProductionInput,
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
import { css, cx } from "../../_lib/css-module";
import {
  getRandomPostSessionTip,
  getRandomPreSessionTip,
  postSessionTips,
  preSessionTips,
} from "../../_lib/challenge-tips";
import {
  getEnglishFontFamilyCss,
  getJapaneseFontFamilyCss,
  topDisplayMetricOptions,
} from "../../_lib/constants";
import { getVisibleSessionRank } from "../../_lib/session-rank-visibility";
import { type SoundSettings, useTypingSounds } from "../../_lib/typing-sounds";
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
  TargetDisplayElementId,
  TopDisplayMetricId,
} from "../../_lib/types";
import styles from "../TypingPanel.module.css";

import { ProductionTextSegment, RomajiMarkerUnit } from "./types";

export function renderReadingGuideCharacters(
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

export function renderCompletedReadingCharacters(reading: string) {
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

export function renderRomajiGuideCharacters(
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

export function renderRomajiGuideTokenUnits(
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

export function createRomajiMarkerUnits(
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

export function shouldMergeRomajiMarkerUnit(
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

export function renderGuideCharacters(
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

export function getVisibleStrictMistakeCharacters(
  strictMistakeInput: string,
  strictMistakeDisplayMode: StrictMistakeDisplayMode,
) {
  return strictMistakeDisplayMode === "none" ? [] : Array.from(strictMistakeInput);
}

export function getOverwriteMistakeCharacter(
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

export function renderStrictMistakeCharacters(mistakeCharacters: string[], keyPrefix: string) {
  return mistakeCharacters.map((character, index) => (
    <span className={css(styles, "char wrong")} key={`${keyPrefix}-${index}`}>
      {character}
    </span>
  ));
}
