'use strict';

var os = require('os');
var path = require('path');
var promises = require('fs/promises');
var fs = require('fs');
var promises$1 = require('stream/promises');
var nodeLlamaCpp = require('node-llama-cpp');
var child_process = require('child_process');

// src/models/resolver.ts

// src/errors.ts
var LocalforgeError = class extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
};
var ModelNotFoundError = class extends LocalforgeError {
  constructor(modelPath) {
    super(`Model not found: ${modelPath}`);
  }
};
var ModelDownloadError = class extends LocalforgeError {
  constructor(modelName, reason) {
    super(`Failed to download model "${modelName}": ${reason}`);
  }
};
var InferenceError = class extends LocalforgeError {
  constructor(message) {
    super(`Inference failed: ${message}`);
  }
};
var SandboxTimeoutError = class extends LocalforgeError {
  constructor(timeout) {
    super(`Sandbox execution exceeded timeout of ${timeout}ms`);
  }
};
var SandboxExecutionError = class extends LocalforgeError {
  constructor(message, exitCode) {
    super(
      `Sandbox execution failed${exitCode !== void 0 ? ` with exit code ${exitCode}` : ""}: ${message}`
    );
  }
};
var NotImplementedError = class extends LocalforgeError {
  constructor(feature) {
    super(`Not yet implemented: ${feature}`);
  }
};
var ConfigurationError = class extends LocalforgeError {
  constructor(message) {
    super(`Configuration error: ${message}`);
  }
};

// src/models/resolver.ts
var ModelResolver = class {
  cacheDir;
  huggingFaceToken;
  constructor(config = {}) {
    this.cacheDir = config.cacheDir ?? path.join(os.homedir(), ".localforge", "models");
    this.huggingFaceToken = config.huggingFaceToken;
  }
  async resolve(modelSpec) {
    if (await this.isLocalPath(modelSpec)) {
      return modelSpec;
    }
    return this.resolveFromHub(modelSpec);
  }
  async isLocalPath(path) {
    try {
      await promises.access(path);
      return true;
    } catch {
      return false;
    }
  }
  async resolveFromHub(modelSpec) {
    const [repoId, filename] = this.parseModelSpec(modelSpec);
    const localPath = path.join(this.cacheDir, repoId, filename);
    if (await this.isLocalPath(localPath)) {
      return localPath;
    }
    await this.downloadFromHub(repoId, filename, localPath);
    return localPath;
  }
  parseModelSpec(spec) {
    const parts = spec.split(":");
    if (parts.length === 1) {
      throw new ModelNotFoundError(
        `Invalid model spec "${spec}". Expected format: "repo/model:filename.gguf"`
      );
    }
    const repoId = parts[0];
    const filename = parts.slice(1).join(":");
    return [repoId, filename];
  }
  async downloadFromHub(repoId, filename, destinationPath) {
    const url = `https://huggingface.co/${repoId}/resolve/main/${filename}`;
    try {
      await promises.mkdir(path.join(destinationPath, ".."), { recursive: true });
      const headers = {};
      if (this.huggingFaceToken) {
        headers["Authorization"] = `Bearer ${this.huggingFaceToken}`;
      }
      const response = await fetch(url, { headers });
      if (!response.ok) {
        throw new ModelDownloadError(
          `${repoId}:${filename}`,
          `HTTP ${response.status}: ${response.statusText}`
        );
      }
      if (!response.body) {
        throw new ModelDownloadError(
          `${repoId}:${filename}`,
          "Response body is null"
        );
      }
      const fileStream = fs.createWriteStream(destinationPath);
      await promises$1.pipeline(
        response.body,
        fileStream
      );
    } catch (error) {
      throw new ModelDownloadError(
        `${repoId}:${filename}`,
        error instanceof Error ? error.message : String(error)
      );
    }
  }
  getCacheDir() {
    return this.cacheDir;
  }
};
var LlamaCppEngine = class {
  llama = null;
  model = null;
  context = null;
  config;
  currentModelPath = null;
  constructor(config = {}) {
    this.config = {
      gpuLayers: config.gpuLayers ?? 99,
      contextSize: config.contextSize ?? 4096,
      batchSize: config.batchSize ?? 512
    };
  }
  async loadModel(modelPath) {
    try {
      if (this.isLoaded()) {
        await this.unloadModel();
      }
      this.llama = await nodeLlamaCpp.getLlama();
      this.model = await this.llama.loadModel({
        modelPath,
        gpuLayers: this.config.gpuLayers
      });
      this.context = await this.model.createContext({
        contextSize: this.config.contextSize,
        batchSize: this.config.batchSize
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
  async unloadModel() {
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
  async generate(prompt, options = {}) {
    if (!this.isLoaded() || !this.context || !this.model) {
      throw new InferenceError("Model not loaded");
    }
    try {
      const session = this.context.getSequence();
      let generatedText = "";
      let tokensGenerated = 0;
      const maxTokens = options.maxTokens ?? 512;
      const response = await session.evaluate(
        this.model.tokenize(prompt),
        {
          temperature: options.temperature ?? 0.7,
          topP: options.topP ?? 0.95,
          topK: options.topK ?? 40,
          repeatPenalty: {
            penalty: options.repeatPenalty ?? 1.1,
            punishTokens: () => []
          }
        }
      );
      for await (const token of response) {
        if (tokensGenerated >= maxTokens) break;
        generatedText += this.model.detokenize([token]);
        tokensGenerated++;
      }
      return {
        text: generatedText,
        tokensGenerated,
        stopReason: tokensGenerated >= maxTokens ? "max_tokens" : "end_of_text"
      };
    } catch (error) {
      throw new InferenceError(
        `Generation failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  async *generateStream(prompt, options = {}) {
    if (!this.isLoaded() || !this.context || !this.model) {
      throw new InferenceError("Model not loaded");
    }
    try {
      const session = this.context.getSequence();
      let tokensGenerated = 0;
      const maxTokens = options.maxTokens ?? 512;
      const response = await session.evaluate(
        this.model.tokenize(prompt),
        {
          temperature: options.temperature ?? 0.7,
          topP: options.topP ?? 0.95,
          topK: options.topK ?? 40,
          repeatPenalty: {
            penalty: options.repeatPenalty ?? 1.1,
            punishTokens: () => []
          }
        }
      );
      for await (const token of response) {
        if (tokensGenerated >= maxTokens) break;
        const text = this.model.detokenize([token]);
        tokensGenerated++;
        yield {
          text,
          isComplete: tokensGenerated >= maxTokens,
          tokensGenerated,
          stopReason: tokensGenerated >= maxTokens ? "max_tokens" : void 0
        };
      }
      yield {
        text: "",
        isComplete: true,
        tokensGenerated,
        stopReason: tokensGenerated >= maxTokens ? "max_tokens" : "end_of_text"
      };
    } catch (error) {
      throw new InferenceError(
        `Stream generation failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  getModelInfo() {
    if (!this.isLoaded() || !this.model || !this.currentModelPath) {
      return null;
    }
    return {
      path: this.currentModelPath,
      contextSize: this.config.contextSize,
      vocabSize: 0,
      layersOffloadedToGpu: this.config.gpuLayers
    };
  }
  isLoaded() {
    return this.model !== null && this.context !== null;
  }
};

// src/client.ts
var Client = class {
  modelResolver;
  defaultEngineConfig;
  remoteAuthToken;
  constructor(config = {}) {
    this.modelResolver = new ModelResolver(config.modelCache);
    this.defaultEngineConfig = config.engine ?? {};
    this.remoteAuthToken = config.remoteAuthToken;
  }
  createEngine() {
    return new LlamaCppEngine(this.defaultEngineConfig);
  }
  getModelResolver() {
    return this.modelResolver;
  }
  getRemoteAuthToken() {
    return this.remoteAuthToken;
  }
  setRemoteAuthToken(token) {
    this.remoteAuthToken = token;
  }
};

// src/function.ts
var LocalFunction = class {
  config;
  handler;
  engine = null;
  modelResolver;
  constructor(config, handler, modelResolver, engine) {
    this.config = config;
    this.handler = handler;
    this.modelResolver = modelResolver;
    this.engine = engine;
  }
  async call(input) {
    if (!this.engine) {
      throw new InferenceError("Engine not initialized");
    }
    if (!this.engine.isLoaded()) {
      const modelSpec = this.config.quant ? `${this.config.model}:${this.config.quant}` : this.config.model;
      const modelPath = await this.modelResolver.resolve(modelSpec);
      await this.engine.loadModel(modelPath);
    }
    const ctx = this.createContext();
    return this.handler(ctx, input);
  }
  createContext() {
    if (!this.engine) {
      throw new InferenceError("Engine not initialized");
    }
    const engine = this.engine;
    return {
      llm: {
        generate: async (prompt, options = {}) => {
          const result = await engine.generate(prompt, {
            temperature: options.temperature,
            topP: options.topP,
            maxTokens: options.maxTokens
          });
          return result.text;
        },
        generateStream: async function* (prompt, options = {}) {
          for await (const chunk of engine.generateStream(prompt, {
            temperature: options.temperature,
            topP: options.topP,
            maxTokens: options.maxTokens
          })) {
            yield chunk.text;
          }
        }
      }
    };
  }
  async unload() {
    if (this.engine) {
      await this.engine.unloadModel();
    }
  }
};
var Sandbox = class {
  config;
  constructor(config = {}) {
    this.config = {
      timeout: config.timeout ?? 3e4,
      memoryLimit: config.memoryLimit,
      workingDir: config.workingDir ?? process.cwd(),
      env: config.env
    };
  }
  async exec(command, args = []) {
    return new Promise((resolve, reject) => {
      const env = {
        ...process.env,
        ...this.config.env
      };
      const child = child_process.spawn(command, args, {
        cwd: this.config.workingDir,
        env,
        shell: true,
        timeout: this.config.timeout
      });
      let stdout = "";
      let stderr = "";
      let timedOut = false;
      child.stdout?.on("data", (data) => {
        stdout += data.toString();
      });
      child.stderr?.on("data", (data) => {
        stderr += data.toString();
      });
      const timeoutId = setTimeout(() => {
        timedOut = true;
        child.kill("SIGTERM");
        setTimeout(() => {
          if (!child.killed) {
            child.kill("SIGKILL");
          }
        }, 1e3);
      }, this.config.timeout);
      child.on("error", (error) => {
        clearTimeout(timeoutId);
        reject(
          new SandboxExecutionError(
            `Failed to spawn process: ${error.message}`
          )
        );
      });
      child.on("close", (exitCode) => {
        clearTimeout(timeoutId);
        if (timedOut) {
          reject(new SandboxTimeoutError(this.config.timeout));
          return;
        }
        resolve({
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          exitCode: exitCode ?? 0,
          timedOut: false
        });
      });
    });
  }
  getConfig() {
    return { ...this.config };
  }
};

// src/remote/burst.ts
var RemoteBurst = class {
  config;
  constructor(config = {}) {
    this.config = config;
  }
  async executeRemote(_handler, _input, _modelSpec) {
    throw new NotImplementedError(
      "Remote burst execution is not yet implemented. This will be available in a future release."
    );
  }
  isConfigured() {
    return !!(this.config.authToken && this.config.endpoint);
  }
  getConfig() {
    return { ...this.config };
  }
};

// src/app.ts
var App = class {
  name;
  client;
  functions;
  sandboxes;
  constructor(config) {
    this.name = config.name;
    this.client = config.client ?? new Client();
    this.functions = /* @__PURE__ */ new Map();
    this.sandboxes = /* @__PURE__ */ new Map();
  }
  function(config, handler) {
    const engine = this.client.createEngine();
    const modelResolver = this.client.getModelResolver();
    const fn = new LocalFunction(
      config,
      handler,
      modelResolver,
      engine
    );
    return fn;
  }
  sandbox(config = {}) {
    return new Sandbox(config);
  }
  remoteBurst(config = {}) {
    const remoteBurst = new RemoteBurst({
      ...config,
      authToken: config.authToken ?? this.client.getRemoteAuthToken()
    });
    return remoteBurst;
  }
  getName() {
    return this.name;
  }
  getClient() {
    return this.client;
  }
  async cleanup() {
    await Promise.all(
      Array.from(this.functions.values()).map((fn) => fn.unload())
    );
    this.functions.clear();
    this.sandboxes.clear();
  }
};

exports.App = App;
exports.Client = Client;
exports.ConfigurationError = ConfigurationError;
exports.InferenceError = InferenceError;
exports.LlamaCppEngine = LlamaCppEngine;
exports.LocalFunction = LocalFunction;
exports.LocalforgeError = LocalforgeError;
exports.ModelDownloadError = ModelDownloadError;
exports.ModelNotFoundError = ModelNotFoundError;
exports.ModelResolver = ModelResolver;
exports.NotImplementedError = NotImplementedError;
exports.RemoteBurst = RemoteBurst;
exports.Sandbox = Sandbox;
exports.SandboxExecutionError = SandboxExecutionError;
exports.SandboxTimeoutError = SandboxTimeoutError;
//# sourceMappingURL=index.cjs.map
//# sourceMappingURL=index.cjs.map