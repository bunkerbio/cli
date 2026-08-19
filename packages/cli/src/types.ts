export interface SamplingParams {
  temperature?: number;
  topP?: number;
  topK?: number;
  maxTokens?: number;
  stopSequences?: string[];
  repeatPenalty?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

export interface GenerateOptions extends SamplingParams {
  stream?: boolean;
}

export interface GenerateResult {
  text: string;
  tokensGenerated: number;
  stopReason?: "max_tokens" | "stop_sequence" | "end_of_text";
}

export interface StreamChunk {
  text: string;
  isComplete: boolean;
  tokensGenerated?: number;
  stopReason?: "max_tokens" | "stop_sequence" | "end_of_text";
}

export interface ModelInfo {
  path: string;
  contextSize: number;
  vocabSize: number;
  layersOffloadedToGpu?: number;
}

export interface InferenceEngine {
  loadModel(modelPath: string): Promise<void>;
  unloadModel(): Promise<void>;
  generate(prompt: string, options?: GenerateOptions): Promise<GenerateResult>;
  generateStream(
    prompt: string,
    options?: GenerateOptions
  ): AsyncGenerator<StreamChunk, void, unknown>;
  getModelInfo(): ModelInfo | null;
  isLoaded(): boolean;
}

export interface FunctionContext {
  llm: {
    generate: (
      prompt: string,
      options?: {
        temperature?: number;
        topP?: number;
        maxTokens?: number;
      }
    ) => Promise<string>;
    generateStream: (
      prompt: string,
      options?: {
        temperature?: number;
        topP?: number;
        maxTokens?: number;
      }
    ) => AsyncGenerator<string, void, unknown>;
  };
}

export type FunctionHandler<TInput = unknown, TOutput = unknown> = (
  ctx: FunctionContext,
  input: TInput
) => Promise<TOutput>;
