export class LocalforgeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ModelNotFoundError extends LocalforgeError {
  constructor(modelPath: string) {
    super(`Model not found: ${modelPath}`);
  }
}

export class ModelDownloadError extends LocalforgeError {
  constructor(modelName: string, reason: string) {
    super(`Failed to download model "${modelName}": ${reason}`);
  }
}

export class InferenceError extends LocalforgeError {
  constructor(message: string) {
    super(`Inference failed: ${message}`);
  }
}

export class SandboxTimeoutError extends LocalforgeError {
  constructor(timeout: number) {
    super(`Sandbox execution exceeded timeout of ${timeout}ms`);
  }
}

export class SandboxExecutionError extends LocalforgeError {
  constructor(message: string, exitCode?: number) {
    super(
      `Sandbox execution failed${exitCode !== undefined ? ` with exit code ${exitCode}` : ""}: ${message}`
    );
  }
}

export class NotImplementedError extends LocalforgeError {
  constructor(feature: string) {
    super(`Not yet implemented: ${feature}`);
  }
}

export class ConfigurationError extends LocalforgeError {
  constructor(message: string) {
    super(`Configuration error: ${message}`);
  }
}
