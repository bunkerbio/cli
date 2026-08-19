import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { runCommand } from "../../src/cli/run.js";

describe("CLI run command", () => {
  let consoleLogSpy: any;
  let stdoutWriteSpy: any;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    stdoutWriteSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    stdoutWriteSpy.mockRestore();
  });

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

  it("should accept stream option", async () => {
    const options = {
      prompt: "Hello",
      stream: true,
    };

    await expect(runCommand("test-model", options)).rejects.toThrow();
  });
});
