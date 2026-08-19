import { getLlama } from "node-llama-cpp";
import type {
  InferenceEngine,
  GenerateOptions,
  GenerateResult,
  StreamChunk,
  ModelInfo,
} from "../types.js";
import { InferenceError } from "../errors.js";

export interface LlamaCppEngineConfig {
  gpuLayers?: number;
  contextSize?: number;
  batchSize?: number;
}

export class LlamaCppEngine implements InferenceEngine {
  private llama: any = null;
  private model: any = null;
  private context: any = null;
  private config: Required<LlamaCppEngineConfig>;
  private currentModelPath: string | null = null;

  constructor(config: LlamaCppEngineConfig = {}) {
    this.config = {
      gpuLayers: config.gpuLayers ?? 99,
      contextSize: config.contextSize ?? 4096,
      batchSize: config.batchSize ?? 512,
    };
  }

  async loadModel(modelPath: string): Promise<void> {
    try {
      if (this.isLoaded()) {
        await this.unloadModel();
      }

      this.llama = await getLlama();
      this.model = await this.llama.loadModel({
        modelPath,
        gpuLayers: this.config.gpuLayers,
      });

      this.context = await this.model.createContext({
        contextSize: this.config.contextSize,
        batchSize: this.config.batchSize,
      });

      this.currentModelPath = modelPath;
    } catch (error) {
      this.model = null;
      this.context = null;
      this.currentModelPath = null;
      throw new InferenceError(
        `Failed to load model: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async unloadModel(): Promise<void> {
    if (this.context) {
      await this.context.dispose();
      this.context = null;
    }
    if (this.model) {
      await this.model.dispose();
      this.model = null;
    }
    this.currentModelPath = null;
  }

  async generate(
    prompt: string,
    options: GenerateOptions = {}
  ): Promise<GenerateResult> {
    if (!this.isLoaded() || !this.context || !this.model) {
      throw new InferenceError("Model not loaded");
    }

    try {
      const session = this.context.getSequence();
      let generatedText = "";
      let tokensGenerated = 0;
      const maxTokens = options.maxTokens ?? 512;

      const response = await session.evaluate(this.model.tokenize(prompt), {
        temperature: options.temperature ?? 0.7,
        topP: options.topP ?? 0.95,
        topK: options.topK ?? 40,
        repeatPenalty: {
          penalty: options.repeatPenalty ?? 1.1,
          punishTokens: () => [],
        },
      });

      for await (const token of response) {
        if (tokensGenerated >= maxTokens) break;
        generatedText += this.model.detokenize([token]);
        tokensGenerated++;
      }

      return {
        text: generatedText,
        tokensGenerated,
        stopReason: tokensGenerated >= maxTokens ? "max_tokens" : "end_of_text",
      };
    } catch (error) {
      throw new InferenceError(
        `Generation failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async *generateStream(
    prompt: string,
    options: GenerateOptions = {}
  ): AsyncGenerator<StreamChunk, void, unknown> {
    if (!this.isLoaded() || !this.context || !this.model) {
      throw new InferenceError("Model not loaded");
    }

    try {
      const session = this.context.getSequence();
      let tokensGenerated = 0;
      const maxTokens = options.maxTokens ?? 512;

      const response = await session.evaluate(this.model.tokenize(prompt), {
        temperature: options.temperature ?? 0.7,
        topP: options.topP ?? 0.95,
        topK: options.topK ?? 40,
        repeatPenalty: {
          penalty: options.repeatPenalty ?? 1.1,
          punishTokens: () => [],
        },
      });

      for await (const token of response) {
        if (tokensGenerated >= maxTokens) break;
        const text = this.model.detokenize([token]);
        tokensGenerated++;
        yield {
          text,
          isComplete: tokensGenerated >= maxTokens,
          tokensGenerated,
          stopReason: tokensGenerated >= maxTokens ? "max_tokens" : undefined,
        };
      }

      yield {
        text: "",
        isComplete: true,
        tokensGenerated,
        stopReason: tokensGenerated >= maxTokens ? "max_tokens" : "end_of_text",
      };
    } catch (error) {
      throw new InferenceError(
        `Stream generation failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  getModelInfo(): ModelInfo | null {
    if (!this.isLoaded() || !this.model || !this.currentModelPath) {
      return null;
    }
    return {
      path: this.currentModelPath,
      contextSize: this.config.contextSize,
      vocabSize: 0,
      layersOffloadedToGpu: this.config.gpuLayers,
    };
  }

  isLoaded(): boolean {
    return this.model !== null && this.context !== null;
  }
}
