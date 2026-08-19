import { LlamaCppEngine } from "./engine/llama-cpp.js";
import { ModelResolver } from "./models/resolver.js";
import { DEFAULT_MODEL, DEFAULT_MODEL_SIZE_GB } from "./config.js";
import { homedir } from "os";
import { join } from "path";
import { access } from "fs/promises";

export interface RunOptions {
  prompt: string;
  stream?: boolean;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  topK?: number;
  hfToken?: string;
}

async function isModelCached(_modelSpec: string, cacheDir: string): Promise<boolean> {
  try {
    // Parse model spec to get repo and filename
    const [repoId] = _modelSpec.split(":");
    const modelPath = join(cacheDir, repoId);
    await access(modelPath);
    return true;
  } catch {
    return false;
  }
}

function showFirstRunMessage(_modelSpec: string): void {
  console.log(
    `No model specified — using Boole's default model (Boole 20B, Q4_K_M).\n` +
    `This is a one-time download (~${DEFAULT_MODEL_SIZE_GB}GB) and will be cached at ~/.boole/models for future use.\n` +
    `You can use a different model anytime with: boole run <model> --prompt "..."\n`
  );
}

export async function runCommand(
  modelSpec: string | undefined,
  options: RunOptions
): Promise<void> {
  const resolver = new ModelResolver({ huggingFaceToken: options.hfToken });
  const engine = new LlamaCppEngine();

  // Use default model if none specified
  const actualModelSpec = modelSpec || DEFAULT_MODEL;
  const usingDefault = !modelSpec;

  // Show first-run message if using default and not cached
  if (usingDefault) {
    const cacheDir = join(homedir(), ".boole", "models");
    const isCached = await isModelCached(actualModelSpec, cacheDir);
    if (!isCached) {
      showFirstRunMessage(actualModelSpec);
    }
  }

  try {
    const modelPath = await resolver.resolve(actualModelSpec);
    await engine.loadModel(modelPath);

    if (options.stream) {
      for await (const chunk of engine.generateStream(options.prompt, {
        maxTokens: options.maxTokens,
        temperature: options.temperature,
        topP: options.topP,
        topK: options.topK,
      })) {
        process.stdout.write(chunk.text);
      }
      console.log();
    } else {
      const result = await engine.generate(options.prompt, {
        maxTokens: options.maxTokens,
        temperature: options.temperature,
        topP: options.topP,
        topK: options.topK,
      });
      console.log(result.text);
    }
  } finally {
    await engine.unloadModel();
  }
}
