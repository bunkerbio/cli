import { describe, it, expect } from "vitest";
import {
  LocalforgeError,
  ModelNotFoundError,
  ModelDownloadError,
  InferenceError,
  SandboxTimeoutError,
  SandboxExecutionError,
  NotImplementedError,
  ConfigurationError,
} from "../src/errors.js";

describe("Errors", () => {
  it("should create LocalforgeError", () => {
    const error = new LocalforgeError("test error");
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("LocalforgeError");
    expect(error.message).toBe("test error");
  });

  it("should create ModelNotFoundError", () => {
    const error = new ModelNotFoundError("/path/to/model");
    expect(error).toBeInstanceOf(LocalforgeError);
    expect(error.message).toContain("/path/to/model");
  });

  it("should create ModelDownloadError", () => {
    const error = new ModelDownloadError("model-name", "network error");
    expect(error).toBeInstanceOf(LocalforgeError);
    expect(error.message).toContain("model-name");
    expect(error.message).toContain("network error");
  });

  it("should create InferenceError", () => {
    const error = new InferenceError("inference failed");
    expect(error).toBeInstanceOf(LocalforgeError);
    expect(error.message).toContain("inference failed");
  });

  it("should create SandboxTimeoutError", () => {
    const error = new SandboxTimeoutError(5000);
    expect(error).toBeInstanceOf(LocalforgeError);
    expect(error.message).toContain("5000");
  });

  it("should create SandboxExecutionError", () => {
    const error = new SandboxExecutionError("exec failed", 1);
    expect(error).toBeInstanceOf(LocalforgeError);
    expect(error.message).toContain("exec failed");
    expect(error.message).toContain("exit code 1");
  });

  it("should create NotImplementedError", () => {
    const error = new NotImplementedError("feature-name");
    expect(error).toBeInstanceOf(LocalforgeError);
    expect(error.message).toContain("feature-name");
  });

  it("should create ConfigurationError", () => {
    const error = new ConfigurationError("invalid config");
    expect(error).toBeInstanceOf(LocalforgeError);
    expect(error.message).toContain("invalid config");
  });
});
