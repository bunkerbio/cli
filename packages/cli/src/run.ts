import { LlamaCppEngine } from "./engine/llama-cpp.js";
import { ModelResolver } from "./models/resolver.js";

export interface RunOptions {
  prompt: string;
  stream?: boolean;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  topK?: number;
}

export async function runCommand(
  modelSpec: string,
  options: RunOptions
): Promise<void> {
  const resolver = new ModelResolver();
  const engine = new LlamaCppEngine();

  try {
    const modelPath = await resolver.resolve(modelSpec);
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
