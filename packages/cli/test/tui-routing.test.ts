import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { spawn } from "child_process";
import { join } from "path";

describe("TUI routing", () => {
  const cliPath = join(__dirname, "../dist/index.js");

  // Helper to run the CLI with specific args and capture output
  async function runCLI(args: string[]): Promise<{ stdout: string; stderr: string; exitCode: number | null }> {
    return new Promise((resolve) => {
      const child = spawn("node", [cliPath, ...args], {
        env: { ...process.env, FORCE_COLOR: "0" },
        stdio: ["ignore", "pipe", "pipe"],
      });

      let stdout = "";
      let stderr = "";

      child.stdout?.on("data", (data) => {
        stdout += data.toString();
      });

      child.stderr?.on("data", (data) => {
        stderr += data.toString();
      });

      // Kill after short timeout to prevent hanging
      const timeout = setTimeout(() => {
        child.kill();
      }, 2000);

      child.on("close", (code) => {
        clearTimeout(timeout);
        resolve({ stdout, stderr, exitCode: code });
      });
    });
  }

  describe("bare invocation", () => {
    it("should launch TUI when called with no arguments", async () => {
      const result = await runCLI([]);

      // TUI will fail with "Raw mode is not supported" in test env,
      // but we can verify it attempted to launch (not showing help/version)
      expect(result.stderr).toContain("Raw mode is not supported");
    });
  });

  describe("subcommand invocations", () => {
    it("should NOT launch TUI for 'run' command", async () => {
      const result = await runCLI(["run"]);

      // Should show commander's required option error, not TUI error
      expect(result.stderr).not.toContain("Raw mode is not supported");
      expect(result.stderr.toLowerCase()).toContain("required");
    });

    it("should NOT launch TUI for 'pull' command", async () => {
      const result = await runCLI(["pull"]);

      // Should show commander's required argument error, not TUI error
      expect(result.stderr).not.toContain("Raw mode is not supported");
      expect(result.stderr.toLowerCase()).toMatch(/missing.*argument|required/);
    });

    it("should NOT launch TUI for 'list' command", async () => {
      const result = await runCLI(["list"]);

      // list command should run successfully (or at least not launch TUI)
      expect(result.stderr).not.toContain("Raw mode is not supported");
    });

    it("should NOT launch TUI for 'serve' command", async () => {
      const result = await runCLI(["serve"]);

      // serve will fail to bind port, but shouldn't launch TUI
      expect(result.stderr).not.toContain("Raw mode is not supported");
    });
  });

  describe("help and version", () => {
    it("should NOT launch TUI for --help", async () => {
      const result = await runCLI(["--help"]);

      expect(result.stdout).toContain("Usage:");
      expect(result.stderr).not.toContain("Raw mode is not supported");
      expect(result.exitCode).toBe(0);
    });

    it("should NOT launch TUI for --version", async () => {
      const result = await runCLI(["--version"]);

      expect(result.stdout).toMatch(/\d+\.\d+\.\d+/);
      expect(result.stderr).not.toContain("Raw mode is not supported");
      expect(result.exitCode).toBe(0);
    });
  });
});
