import { App } from "../app.js";
import { Client } from "../client.js";

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
  const client = new Client();
  const app = new App({ name: "boole-cli", client });

  const fn = app.function({ model: modelSpec }, async (ctx, _input) => {
    if (options.stream) {
      let fullText = "";
      for await (const chunk of ctx.llm.generateStream(options.prompt, {
        maxTokens: options.maxTokens,
        temperature: options.temperature,
        topP: options.topP,
      })) {
        process.stdout.write(chunk);
        fullText += chunk;
      }
      console.log();
      return fullText;
    } else {
      const result = await ctx.llm.generate(options.prompt, {
        maxTokens: options.maxTokens,
        temperature: options.temperature,
        topP: options.topP,
      });
      console.log(result);
      return result;
    }
  });

  try {
    await fn.call(null);
  } finally {
    await app.cleanup();
  }
}
