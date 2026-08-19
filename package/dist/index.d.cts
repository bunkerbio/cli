interface ModelResolverConfig {
    cacheDir?: string;
    huggingFaceToken?: string;
}
declare class ModelResolver {
    private cacheDir;
    private huggingFaceToken?;
    constructor(config?: ModelResolverConfig);
    resolve(modelSpec: string): Promise<string>;
    private isLocalPath;
    private resolveFromHub;
    private parseModelSpec;
    private downloadFromHub;
    getCacheDir(): string;
}

interface SamplingParams {
    temperature?: number;
    topP?: number;
    topK?: number;
    maxTokens?: number;
    stopSequences?: string[];
    repeatPenalty?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
}
interface GenerateOptions extends SamplingParams {
    stream?: boolean;
}
interface GenerateResult {
    text: string;
    tokensGenerated: number;
    stopReason?: "max_tokens" | "stop_sequence" | "end_of_text";
}
interface StreamChunk {
    text: string;
    isComplete: boolean;
    tokensGenerated?: number;
    stopReason?: "max_tokens" | "stop_sequence" | "end_of_text";
}
interface ModelInfo {
    path: string;
    contextSize: number;
    vocabSize: number;
    layersOffloadedToGpu?: number;
}
interface InferenceEngine {
    loadModel(modelPath: string): Promise<void>;
    unloadModel(): Promise<void>;
    generate(prompt: string, options?: GenerateOptions): Promise<GenerateResult>;
    generateStream(prompt: string, options?: GenerateOptions): AsyncGenerator<StreamChunk, void, unknown>;
    getModelInfo(): ModelInfo | null;
    isLoaded(): boolean;
}

interface LlamaCppEngineConfig {
    gpuLayers?: number;
    contextSize?: number;
    batchSize?: number;
}
declare class LlamaCppEngine implements InferenceEngine {
    private llama;
    private model;
    private context;
    private config;
    private currentModelPath;
    constructor(config?: LlamaCppEngineConfig);
    loadModel(modelPath: string): Promise<void>;
    unloadModel(): Promise<void>;
    generate(prompt: string, options?: GenerateOptions): Promise<GenerateResult>;
    generateStream(prompt: string, options?: GenerateOptions): AsyncGenerator<StreamChunk, void, unknown>;
    getModelInfo(): ModelInfo | null;
    isLoaded(): boolean;
}

interface ClientConfig {
    modelCache?: ModelResolverConfig;
    engine?: LlamaCppEngineConfig;
    remoteAuthToken?: string;
}
declare class Client {
    private modelResolver;
    private defaultEngineConfig;
    private remoteAuthToken?;
    constructor(config?: ClientConfig);
    createEngine(): InferenceEngine;
    getModelResolver(): ModelResolver;
    getRemoteAuthToken(): string | undefined;
    setRemoteAuthToken(token: string): void;
}

interface FunctionContext {
    llm: {
        generate: (prompt: string, options?: {
            temperature?: number;
            topP?: number;
            maxTokens?: number;
        }) => Promise<string>;
        generateStream: (prompt: string, options?: {
            temperature?: number;
            topP?: number;
            maxTokens?: number;
        }) => AsyncGenerator<string, void, unknown>;
    };
}
type FunctionHandler<TInput = unknown, TOutput = unknown> = (ctx: FunctionContext, input: TInput) => Promise<TOutput>;
interface LocalFunctionConfig {
    model: string;
    quant?: string;
    gpuLayers?: number;
    contextSize?: number;
}
declare class LocalFunction<TInput = unknown, TOutput = unknown> {
    private config;
    private handler;
    private engine;
    private modelResolver;
    constructor(config: LocalFunctionConfig, handler: FunctionHandler<TInput, TOutput>, modelResolver: ModelResolver, engine: InferenceEngine);
    call(input: TInput): Promise<TOutput>;
    private createContext;
    unload(): Promise<void>;
}

interface SandboxConfig {
    timeout?: number;
    memoryLimit?: number;
    workingDir?: string;
    env?: Record<string, string>;
}
interface ExecResult {
    stdout: string;
    stderr: string;
    exitCode: number;
    timedOut: boolean;
}
declare class Sandbox {
    private config;
    constructor(config?: SandboxConfig);
    exec(command: string, args?: string[]): Promise<ExecResult>;
    getConfig(): SandboxConfig;
}

interface RemoteBurstConfig {
    authToken?: string;
    endpoint?: string;
    maxConcurrency?: number;
}
interface BurstResult<TOutput> {
    result: TOutput;
    executedRemotely: boolean;
    costEstimate?: {
        computeTimeMs: number;
        estimatedCostUsd: number;
    };
}
declare class RemoteBurst {
    private config;
    constructor(config?: RemoteBurstConfig);
    executeRemote<TInput, TOutput>(_handler: FunctionHandler<TInput, TOutput>, _input: TInput, _modelSpec: string): Promise<BurstResult<TOutput>>;
    isConfigured(): boolean;
    getConfig(): RemoteBurstConfig;
}

interface AppConfig {
    name: string;
    client?: Client;
}
declare class App {
    private name;
    private client;
    private functions;
    private sandboxes;
    constructor(config: AppConfig);
    function<TInput = unknown, TOutput = unknown>(config: LocalFunctionConfig, handler: FunctionHandler<TInput, TOutput>): LocalFunction<TInput, TOutput>;
    sandbox(config?: SandboxConfig): Sandbox;
    remoteBurst(config?: RemoteBurstConfig): RemoteBurst;
    getName(): string;
    getClient(): Client;
    cleanup(): Promise<void>;
}

declare class LocalforgeError extends Error {
    constructor(message: string);
}
declare class ModelNotFoundError extends LocalforgeError {
    constructor(modelPath: string);
}
declare class ModelDownloadError extends LocalforgeError {
    constructor(modelName: string, reason: string);
}
declare class InferenceError extends LocalforgeError {
    constructor(message: string);
}
declare class SandboxTimeoutError extends LocalforgeError {
    constructor(timeout: number);
}
declare class SandboxExecutionError extends LocalforgeError {
    constructor(message: string, exitCode?: number);
}
declare class NotImplementedError extends LocalforgeError {
    constructor(feature: string);
}
declare class ConfigurationError extends LocalforgeError {
    constructor(message: string);
}

export { App, type AppConfig, type BurstResult, Client, type ClientConfig, ConfigurationError, type ExecResult, type FunctionContext, type FunctionHandler, type GenerateOptions, type GenerateResult, type InferenceEngine, InferenceError, LlamaCppEngine, type LlamaCppEngineConfig, LocalFunction, type LocalFunctionConfig, LocalforgeError, ModelDownloadError, type ModelInfo, ModelNotFoundError, ModelResolver, type ModelResolverConfig, NotImplementedError, RemoteBurst, type RemoteBurstConfig, type SamplingParams, Sandbox, type SandboxConfig, SandboxExecutionError, SandboxTimeoutError, type StreamChunk };
