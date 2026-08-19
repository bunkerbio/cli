import { describe, it, expect, vi } from "vitest";
import { LocalFunction } from "../src/function.js";
import { ModelResolver } from "../src/models/resolver.js";
import type { InferenceEngine } from "../src/types.js";
import { InferenceError } from "../src/errors.js";

describe("LocalFunction", () => {
  it("should throw error if engine is not initialized", async () => {
    const fn = new LocalFunction(
      { model: "test" },
      async (ctx, input: string) => input,
      new ModelResolver(),
      null as any
    );

    await expect(fn.call("test")).rejects.toThrow(InferenceError);
  });

  it("should call handler with context", async () => {
    const mockEngine: InferenceEngine = {
      loadModel: vi.fn(),
      unloadModel: vi.fn(),
      generate: vi.fn().mockResolvedValue({
        text: "generated text",
        tokensGenerated: 10,
        stopReason: "end_of_text",
      }),
      generateStream: vi.fn(),
      getModelInfo: vi.fn().mockReturnValue(null),
      isLoaded: vi.fn().mockReturnValue(true),
    };

    const mockResolver = {
      resolve: vi.fn().mockResolvedValue("/path/to/model"),
    } as any;

    const fn = new LocalFunction(
      { model: "test" },
      async (ctx, input: string) => {
        const result = await ctx.llm.generate(`Echo: ${input}`);
        return result;
      },
      mockResolver,
      mockEngine
    );

    const result = await fn.call("hello");
    expect(result).toBe("generated text");
  });

  it("should load model if not loaded", async () => {
    const mockEngine: InferenceEngine = {
      loadModel: vi.fn(),
      unloadModel: vi.fn(),
      generate: vi.fn().mockResolvedValue({
        text: "output",
        tokensGenerated: 5,
      }),
      generateStream: vi.fn(),
      getModelInfo: vi.fn().mockReturnValue(null),
      isLoaded: vi.fn().mockReturnValue(false),
    };

    const mockResolver = {
      resolve: vi.fn().mockResolvedValue("/path/to/model"),
    } as any;

    const fn = new LocalFunction(
      { model: "test-model", quant: "Q4_K_M" },
      async (ctx, input: string) => input,
      mockResolver,
      mockEngine
    );

    await fn.call("input");
    expect(mockResolver.resolve).toHaveBeenCalledWith("test-model:Q4_K_M");
    expect(mockEngine.loadModel).toHaveBeenCalledWith("/path/to/model");
  });
});
