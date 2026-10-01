import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";

function mountWidth(raw: string | null, direct = false) {
  const child = spawnSync(process.execPath, [
    "run", `${import.meta.dir}/test-fixtures/ime-width.ts`, JSON.stringify(raw), direct ? "direct" : "ime",
  ], { encoding: "utf8", timeout: 15000 });
  expect(child.status, child.stderr || child.error?.message).toBe(0);
  return JSON.parse(child.stdout) as { mounted: number | null; remounted: number | null };
}

describe("production IME input width persistence", () => {
  test("restores saved width on mounting and returning to the typing page", () => {
    expect(mountWidth("640")).toEqual({ mounted: 640, remounted: 640 });
  });

  test("clamps saved width to the minimum and rounds fractional values", () => {
    expect(mountWidth("100")).toEqual({ mounted: 240, remounted: 240 });
    expect(mountWidth("255.8")).toEqual({ mounted: 256, remounted: 256 });
  });

  test("leaves direct typing unaffected by IME width", () => {
    expect(mountWidth("640", true)).toEqual({ mounted: null, remounted: null });
  });

  test("ignores missing, empty, and malformed saved width", () => {
    for (const raw of [null, "", "  ", "invalid", "Infinity", "-50", "0"]) {
      expect(mountWidth(raw)).toEqual({ mounted: null, remounted: null });
    }
  });
});
