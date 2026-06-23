import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

describe("ModePage", () => {
  test("keeps the current challenge visible until home navigation completes", () => {
    const source = readFileSync("app/_components/ModePage.tsx", "utf8");
    const backNavigation = "router.push(getModeSelectPath(challengeLanguage, productionDuration));";
    const backHandler = source.slice(
      source.indexOf("onBackToModeSelect={() => {"),
      source.indexOf(backNavigation) + backNavigation.length,
    );

    expect(backHandler).toContain(backNavigation);
    expect(backHandler).not.toContain("session.typingPanelProps.onBackToModeSelect();");
  });
});
