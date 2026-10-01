import { afterEach, describe, expect, test } from "bun:test";
import {
  getBrowserLocalStorage, readLocalStorageItem, writeLocalStorageItem, removeLocalStorageItems,
} from "./browser-storage";

const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
afterEach(() => {
  if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow);
  else Reflect.deleteProperty(globalThis, "window");
});

function installStorage(storage: Partial<Storage>) {
  Object.defineProperty(globalThis, "window", { configurable: true, value: { localStorage: storage } });
}

describe("optional browser storage", () => {
  test("continues when even accessing the localStorage property is denied", () => {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: { get localStorage() { throw new DOMException("Denied", "SecurityError"); } },
    });
    expect(getBrowserLocalStorage()).toBeNull();
    expect(readLocalStorageItem("ultitype:v0")).toBeNull();
    expect(writeLocalStorageItem("ultitype:v0", "{}")).toBe(false);
    expect(removeLocalStorageItems(() => true)).toBe(false);
  });

  test("handles storage read, quota, and deletion errors", () => {
    installStorage({
      length: 1, key: () => "ultitype:v0",
      getItem() { throw new Error("read failed"); },
      setItem() { throw new DOMException("Full", "QuotaExceededError"); },
      removeItem() { throw new Error("delete failed"); },
    });
    expect(readLocalStorageItem("ultitype:v0")).toBeNull();
    expect(writeLocalStorageItem("ultitype:v0", "{}")).toBe(false);
    expect(removeLocalStorageItems(() => true)).toBe(false);
  });

  test("writes and deletes only selected application keys", () => {
    const values = new Map<string, string>([["unrelated", "keep"], ["ultitype:v0", "state"]]);
    installStorage({
      get length() { return values.size; },
      key: (index) => [...values.keys()][index] ?? null,
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => { values.set(key, value); },
      removeItem: (key) => { values.delete(key); },
    });
    expect(writeLocalStorageItem("ultitype:width", "640")).toBe(true);
    expect(readLocalStorageItem("ultitype:width")).toBe("640");
    expect(removeLocalStorageItems((key) => key.startsWith("ultitype:") && key !== "ultitype:v0")).toBe(true);
    expect([...values.entries()]).toEqual([["unrelated", "keep"], ["ultitype:v0", "state"]]);
  });

  test("works without a browser during server rendering", () => {
    Reflect.deleteProperty(globalThis, "window");
    expect(getBrowserLocalStorage()).toBeNull();
    expect(writeLocalStorageItem("ultitype:v0", "{}")).toBe(false);
  });
});
