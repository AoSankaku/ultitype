"use client";

import type { ReactNode } from "react";
import { css, cx } from "../../_lib/css-module";
import type { EnSpaceDisplay, MistakeFlash, StrictMistakeDisplayMode } from "../../_lib/types";
import styles from "../TypingPanel.module.css";

export function renderGuideCharacters(
  guide: string,
  input: string,
  mistakeFlash: MistakeFlash | null,
  strictMistakeInput: string,
  strictMistakeDisplayMode: StrictMistakeDisplayMode,
  showMarker: boolean,
  enSpaceDisplay: EnSpaceDisplay = "glyph",
) {
  const mistakeCharacters = getVisibleStrictMistakeCharacters(
    strictMistakeInput,
    strictMistakeDisplayMode,
  );
  const elements: ReactNode[] = [];
  let targetIndex = 0;
  let insertedMistakes = false;

  Array.from(guide).forEach((character, index) => {
    const typed = input[targetIndex];
    const currentIndex = targetIndex;

    if (/\s/.test(character)) {
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
      const displayClass =
        enSpaceDisplay === "glyph"
          ? "visible-space-glyph"
          : enSpaceDisplay === "box"
            ? "visible-space-box"
            : "";
      const className =
        typed === undefined
          ? currentIndex === input.length && showMarker
            ? css(styles, "visual-space", "char current", displayClass)
            : css(styles, "visual-space", "char", displayClass)
          : /\s/.test(typed)
            ? css(styles, "visual-space", "char correct", displayClass)
            : css(styles, "visual-space", "char wrong", displayClass);
      const flashClassName = isMistakeFlash ? cx(className, css(styles, "mistake-flash")) : className;
      const flashKey = isMistakeFlash && mistakeFlash ? mistakeFlash.id : "idle";
      elements.push(
        <span className={flashClassName} key={`space-${index}-${flashKey}`} aria-hidden="true">
          {getVisibleSpaceCharacter(enSpaceDisplay)}
        </span>,
      );
      return;
    }

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

export function getVisibleSpaceCharacter(enSpaceDisplay: EnSpaceDisplay): string {
  if (enSpaceDisplay === "underscore") {
    return "_";
  }

  return enSpaceDisplay === "box" ? "" : "\u2423";
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
