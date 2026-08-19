import { readFile as fsReadFile } from "fs/promises";
import type { ToolResult } from "./types.js";

export async function readFile(path: string): Promise<ToolResult> {
  try {
    const content = await fsReadFile(path, "utf-8");
    return {
      success: true,
      output: content,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
