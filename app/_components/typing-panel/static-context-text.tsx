"use client";

import type { ReactNode } from "react";
import { createJapaneseReadingGuideParts } from "@/src/lib/challenges";
import { css } from "../../_lib/css-module";
import type { EnSpaceDisplay } from "../../_lib/types";
import { getVisibleSpaceCharacter } from "./direct-guide-characters";
import styles from "../TypingPanel.module.css";

export function renderStaticGuideText(guide: string, completed: boolean, enSpaceDisplay: EnSpaceDisplay) {
  const nodes: ReactNode[] = [];
  const characters = Array.from(guide);
  let textRun = "";
  let runIndex = 0;

  const flushTextRun = () => {
    if (!textRun) return;
    nodes.push(
      <span className={css(styles, "char", completed && "correct")} key={`run-${runIndex++}`}>
        {textRun}
      </span>,
    );
    textRun = "";
  };

  characters.forEach((character, index) => {
    if (!/\s/.test(character)) {
      textRun += character;
      return;
    }

    flushTextRun();
    const spaceClass = enSpaceDisplay === "glyph"
      ? "visible-space-glyph"
      : enSpaceDisplay === "box"
        ? "visible-space-box"
        : "";
    nodes.push(
      <span
        aria-hidden="true"
        className={css(styles, "visual-space", "char", completed && "correct", spaceClass)}
        key={`space-${index}`}
      >
        {getVisibleSpaceCharacter(enSpaceDisplay)}
      </span>,
    );
  });

  flushTextRun();
  return nodes;
}

export function renderCompactCompletedReading(reading: string) {
  const nodes: ReactNode[] = [];
  let readingRun = "";
  let runIndex = 0;

  const flushReadingRun = () => {
    if (!readingRun) return;
    nodes.push(
      <span className={css(styles, "char correct")} key={`reading-${runIndex++}`}>
        {readingRun}
      </span>,
    );
    readingRun = "";
  };

  createJapaneseReadingGuideParts(reading).forEach((part, index) => {
    if (part.kind === "reading") {
      readingRun += part.text;
      return;
    }

    flushReadingRun();
    nodes.push(
      <span className={css(styles, "visual-space")} key={`visual-${index}`} aria-hidden="true">
        {part.text}
      </span>,
    );
  });

  flushReadingRun();
  return nodes;
}
