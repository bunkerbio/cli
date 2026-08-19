import { describe, it, expect, vi } from "vitest";
import { readFile } from "../../src/tui/AgentTools/readFile.js";
import { writeFile } from "../../src/tui/AgentTools/writeFile.js";
import { runShell } from "../../src/tui/AgentTools/runShell.js";
import { readFile as fsReadFile, writeFile as fsWriteFile } from "fs/promises";
import { exec } from "child_process";

// Mock fs/promises
vi.mock("fs/promises", () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  mkdir: vi.fn(),
}));

// Mock child_process
vi.mock("child_process", () => ({
  exec: vi.fn(),
}));

describe("Agent Tools", () => {
  describe("readFile", () => {
    it("should read file successfully", async () => {
      vi.mocked(fsReadFile).mockResolvedValue("file content");

      const result = await readFile("/test/file.txt");

      expect(result.success).toBe(true);
      expect(result.output).toBe("file content");
    });

    it("should handle read errors", async () => {
      vi.mocked(fsReadFile).mockRejectedValue(new Error("File not found"));

      const result = await readFile("/test/missing.txt");

      expect(result.success).toBe(false);
      expect(result.error).toContain("File not found");
    });
  });

  describe("writeFile", () => {
    it("should write file successfully", async () => {
      vi.mocked(fsWriteFile).mockResolvedValue();

      const result = await writeFile("/test/file.txt", "new content");

      expect(result.success).toBe(true);
      expect(result.output).toContain("File written");
    });

    it("should handle write errors", async () => {
      vi.mocked(fsWriteFile).mockRejectedValue(new Error("Permission denied"));

      const result = await writeFile("/test/file.txt", "content");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Permission denied");
    });
  });

  describe("runShell", () => {
    it("should execute shell command successfully", async () => {
      const mockExec = vi.fn((cmd, opts, callback: any) => {
        callback(null, { stdout: "command output", stderr: "" });
      });
      vi.mocked(exec).mockImplementation(mockExec as any);

      const result = await runShell("echo test");

      expect(result.success).toBe(true);
      expect(result.output).toContain("command output");
    });

    it("should handle shell errors", async () => {
      const mockExec = vi.fn((cmd, opts, callback: any) => {
        callback(new Error("Command failed"), null);
      });
      vi.mocked(exec).mockImplementation(mockExec as any);

      const result = await runShell("invalid-command");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Command failed");
    });
  });
});
