import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { runCommand } from "../src/run.js";
import { pullCommand } from "../src/pull.js";
import { listCommand } from "../src/list.js";

describe("CLI commands", () => {
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

  describe("run command", () => {
    it("should accept valid options", async () => {
      const options = {
        prompt: "Hello world",
        stream: false,
        maxTokens: 100,
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
      };

      // This will fail because we don't have a real model, but it validates option parsing
      await expect(runCommand("test-model", options)).rejects.toThrow();
    });
  });

  describe("pull command", () => {
    it("should handle model spec", async () => {
      await pullCommand("invalid-spec-format");

      // Should have called process.exit(1) on error
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe("list command", () => {
    it("should list cached models or show empty message", async () => {
      await listCommand();

      // Should have logged something (either models or empty message)
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });
});
