import { afterEach, describe, expect, it, vi } from "vitest";
import { clearAppCache } from "./app-cache";

afterEach(() => {
  Reflect.deleteProperty(window, "caches");
});

describe("clearAppCache", () => {
  it("deletes Workbox app caches without touching unrelated caches", async () => {
    const deleteCache = vi.fn().mockResolvedValue(true);
    Object.defineProperty(window, "caches", {
      configurable: true,
      value: {
        keys: vi.fn().mockResolvedValue([
          "workbox-precache-v2-example",
          "workbox-runtime-example",
          "other-app-cache",
        ]),
        delete: deleteCache,
      },
    });

    await expect(clearAppCache()).resolves.toBe(2);
    expect(deleteCache.mock.calls).toEqual([
      ["workbox-precache-v2-example"],
      ["workbox-runtime-example"],
    ]);
  });

  it("returns zero when no app cache exists", async () => {
    Object.defineProperty(window, "caches", {
      configurable: true,
      value: {
        keys: vi.fn().mockResolvedValue(["other-app-cache"]),
        delete: vi.fn(),
      },
    });

    await expect(clearAppCache()).resolves.toBe(0);
  });

  it("reports when a cache could not be deleted", async () => {
    Object.defineProperty(window, "caches", {
      configurable: true,
      value: {
        keys: vi.fn().mockResolvedValue(["workbox-precache-v2-example"]),
        delete: vi.fn().mockResolvedValue(false),
      },
    });

    await expect(clearAppCache()).rejects.toThrow("Some app cache files could not be cleared.");
  });
});
