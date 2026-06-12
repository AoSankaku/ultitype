import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

describe("ModePage", () => {
  test("keeps the current challenge visible until home navigation completes", () => {
    const source = readFileSync("app/_components/ModePage.tsx", "utf8");
    const backHandler = source.slice(
      source.indexOf("onBackToModeSelect={() => {"),
      source.indexOf("router.push(getModeSelectPath(challengeLanguage));") +
        "router.push(getModeSelectPath(challengeLanguage));".length,
    );

    expect(backHandler).toContain("router.push(getModeSelectPath(challengeLanguage));");
    expect(backHandler).not.toContain("session.typingPanelProps.onBackToModeSelect();");
  });
});
