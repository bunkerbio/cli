import { ModelResolver } from "../models/resolver.js";
import { readdir, stat } from "fs/promises";
import { join } from "path";

export async function listCommand(): Promise<void> {
  const resolver = new ModelResolver();
  const cacheDir = resolver.getCacheDir();

  console.log(`Models cached in: ${cacheDir}\n`);

  try {
    const entries = await readdir(cacheDir, { recursive: true, withFileTypes: true });
    const models: Array<{ name: string; path: string; sizeMB: string }> = [];

    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith(".gguf")) {
        const fullPath = join(entry.parentPath || entry.path, entry.name);
        const stats = await stat(fullPath);
        const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
        const relativePath = fullPath.replace(cacheDir + "/", "");

        models.push({
          name: relativePath,
          path: fullPath,
          sizeMB,
        });
      }
    }

    if (models.length === 0) {
      console.log("No cached models found.");
      console.log(`Run 'boole pull <model>' to download a model.`);
      return;
    }

    console.log(`Found ${models.length} cached model(s):\n`);
    for (const model of models) {
      console.log(`  ${model.name}`);
      console.log(`    Size: ${model.sizeMB} MB`);
      console.log(`    Path: ${model.path}\n`);
    }
  } catch (error) {
    if ((error as any).code === "ENOENT") {
      console.log("Cache directory does not exist yet.");
      console.log(`Run 'boole pull <model>' to download a model.`);
      return;
    }
    throw error;
  }
}
