import { ModelResolver } from "./models/resolver.js";
import { stat } from "fs/promises";

export async function pullCommand(modelSpec: string): Promise<void> {
  const resolver = new ModelResolver();

  console.log(`Pulling model: ${modelSpec}`);

  try {
    const modelPath = await resolver.resolve(modelSpec);
    const stats = await stat(modelPath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

    console.log(`✓ Model cached at: ${modelPath}`);
    console.log(`  Size: ${sizeMB} MB`);
  } catch (error) {
    console.error(`✗ Failed to pull model: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}
