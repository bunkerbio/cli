import { exec } from "child_process";
import { promisify } from "util";
import type { ToolResult } from "./types.js";

const execAsync = promisify(exec);

export async function runShell(command: string): Promise<ToolResult> {
  try {
    const { stdout, stderr } = await execAsync(command, {
      timeout: 30000, // 30 second timeout
      maxBuffer: 1024 * 1024, // 1MB buffer
    });
    return {
      success: true,
      output: stdout + (stderr ? `\nStderr: ${stderr}` : ""),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
