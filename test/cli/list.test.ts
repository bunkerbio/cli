import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { listCommand } from "../../src/cli/list.js";

describe("CLI list command", () => {
  let consoleLogSpy: any;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it("should list cached models or show empty message", async () => {
    await listCommand();

    // Should have logged something (either models or empty message)
    expect(consoleLogSpy).toHaveBeenCalled();
  });
});
