import { writeFile as fsWriteFile, mkdir } from "fs/promises";
import { dirname } from "path";
import type { ToolResult } from "./types.js";

export async function writeFile(
  path: string,
  content: string
): Promise<ToolResult> {
  try {
    // Ensure directory exists
    await mkdir(dirname(path), { recursive: true });
    await fsWriteFile(path, content, "utf-8");
    return {
      success: true,
      output: `File written: ${path}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
