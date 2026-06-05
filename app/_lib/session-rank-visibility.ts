const concealedOpeningSeconds = 30;

export function getVisibleSessionRank({
  concealOpeningRank = true,
  elapsedSeconds,
  rankLabel,
}: {
  concealOpeningRank?: boolean;
  elapsedSeconds: number | null;
  rankLabel: string;
}) {
  const isConcealed =
    concealOpeningRank &&
    (elapsedSeconds === null || elapsedSeconds < concealedOpeningSeconds);

  return {
    isConcealed,
    label: isConcealed ? getConcealedRankLabel(rankLabel) : rankLabel,
  };
}

function getConcealedRankLabel(rankLabel: string) {
  const normalizedRankLabel = rankLabel.trim().toUpperCase();
  if (normalizedRankLabel === "NR") {
    return "NR";
  }

  if (normalizedRankLabel.startsWith("UM")) {
    return "UM?";
  }

  const rankBand = normalizedRankLabel.match(/^[A-Z]/)?.[0];
  return rankBand ? `${rankBand}?` : "?";
}
