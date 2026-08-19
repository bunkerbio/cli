import { ModelResolver, type ModelResolverConfig } from "./models/resolver.js";
import {
  LlamaCppEngine,
  type LlamaCppEngineConfig,
} from "./engine/llama-cpp.js";
import type { InferenceEngine } from "./types.js";

export interface ClientConfig {
  modelCache?: ModelResolverConfig;
  engine?: LlamaCppEngineConfig;
  remoteAuthToken?: string;
}

export class Client {
  private modelResolver: ModelResolver;
  private defaultEngineConfig: LlamaCppEngineConfig;
  private remoteAuthToken?: string;

  constructor(config: ClientConfig = {}) {
    this.modelResolver = new ModelResolver(config.modelCache);
    this.defaultEngineConfig = config.engine ?? {};
    this.remoteAuthToken = config.remoteAuthToken;
  }

  createEngine(): InferenceEngine {
    return new LlamaCppEngine(this.defaultEngineConfig);
  }

  getModelResolver(): ModelResolver {
    return this.modelResolver;
  }

  getRemoteAuthToken(): string | undefined {
    return this.remoteAuthToken;
  }

  setRemoteAuthToken(token: string): void {
    this.remoteAuthToken = token;
  }
}
