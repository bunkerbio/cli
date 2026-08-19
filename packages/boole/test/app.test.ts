import { describe, it, expect, vi, beforeEach } from "vitest";
import { App } from "../src/app.js";
import type { InferenceEngine } from "../src/types.js";

describe("App", () => {
  it("should create an app with a name", () => {
    const app = new App({ name: "test-app" });
    expect(app.getName()).toBe("test-app");
  });

  it("should create a local function", () => {
    const app = new App({ name: "test-app" });
    const fn = app.function(
      { model: "test-model" },
      async (ctx, input: string) => {
        return input.toUpperCase();
      }
    );
    expect(fn).toBeDefined();
  });

  it("should create a sandbox", () => {
    const app = new App({ name: "test-app" });
    const sandbox = app.sandbox();
    expect(sandbox).toBeDefined();
    expect(sandbox.getConfig()).toBeDefined();
  });

  it("should create a remote burst", () => {
    const app = new App({ name: "test-app" });
    const burst = app.remoteBurst();
    expect(burst).toBeDefined();
    expect(burst.isConfigured()).toBe(false);
  });

  it("should cleanup functions on cleanup", async () => {
    const app = new App({ name: "test-app" });
    await app.cleanup();
    expect(app.getName()).toBe("test-app");
  });
});
