"use client";

import type { JapaneseFuriganaEntry } from "@/src/lib/challenges";
import { css } from "../../_lib/css-module";
import styles from "../TypingPanel.module.css";
import { useStableProductionImePromptScrollMarkerPosition } from "./production-ime-scroll";
import { ProductionLongDisplay } from "./production-long-display";

export function ProductionImeChallengeView({
  display,
  furigana,
  input,
  nextChallengeDisplay,
  nextChallengeFurigana,
  showDisplayText,
  showFurigana,
  showFuriganaMarker,
  showKanjiMarker,
}: {
  display: string;
  furigana: JapaneseFuriganaEntry[];
  input: string;
  nextChallengeDisplay: string;
  nextChallengeFurigana: JapaneseFuriganaEntry[];
  showDisplayText: boolean;
  showFurigana: boolean;
  showFuriganaMarker: boolean;
  showKanjiMarker: boolean;
}) {
  const scrollMarkerCharacterIndex = useStableProductionImePromptScrollMarkerPosition(input, display);

  return (
    <div className={css(styles, "production-ime-layout")}>
      {showDisplayText ? (
        <ProductionLongDisplay
          display={display}
          furigana={furigana}
          input=""
          nextChallengeDisplay={nextChallengeDisplay}
          nextChallengeFurigana={nextChallengeFurigana}
          romajiTarget={null}
          scrollAnchorLine={1}
          scrollMarkerCharacterIndex={scrollMarkerCharacterIndex}
          showFurigana={showFurigana}
          showFuriganaMarker={showFuriganaMarker}
          showKanjiMarker={showKanjiMarker}
        />
      ) : null}
    </div>
  );
}
