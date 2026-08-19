import type { FunctionHandler } from "../types.js";
import { NotImplementedError } from "../errors.js";

export interface RemoteBurstConfig {
  authToken?: string;
  endpoint?: string;
  maxConcurrency?: number;
}

export interface BurstResult<TOutput> {
  result: TOutput;
  executedRemotely: boolean;
  costEstimate?: {
    computeTimeMs: number;
    estimatedCostUsd: number;
  };
}

export class RemoteBurst {
  private config: RemoteBurstConfig;

  constructor(config: RemoteBurstConfig = {}) {
    this.config = config;
  }

  async executeRemote<TInput, TOutput>(
    _handler: FunctionHandler<TInput, TOutput>,
    _input: TInput,
    _modelSpec: string
  ): Promise<BurstResult<TOutput>> {
    throw new NotImplementedError(
      "Remote burst execution is not yet implemented. This will be available in a future release."
    );
  }

  isConfigured(): boolean {
    return !!(this.config.authToken && this.config.endpoint);
  }

  getConfig(): RemoteBurstConfig {
    return { ...this.config };
  }
}
