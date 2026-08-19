import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { pullCommand } from "../../src/cli/pull.js";

describe("CLI pull command", () => {
  let consoleLogSpy: any;
  let consoleErrorSpy: any;
  let processExitSpy: any;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    processExitSpy = vi.spyOn(process, "exit").mockImplementation((() => {}) as any);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  it("should handle model spec", async () => {
    await pullCommand("user/model:file.gguf");

    // Should have logged something about pulling
    expect(consoleLogSpy).toHaveBeenCalled();
  });

  it("should handle errors gracefully", async () => {
    await pullCommand("invalid-spec-format");

    // Should have called process.exit(1) on error
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });
});
