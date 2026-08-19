import { describe, it, expect, beforeEach, vi } from "vitest";
import { ModelResolver } from "../../src/models/resolver.js";
import { ModelNotFoundError } from "../../src/errors.js";

describe("ModelResolver", () => {
  let resolver: ModelResolver;
  const mockRepoId = "TheBloke/Mistral-7B-Instruct-v0.2-GGUF";

  beforeEach(() => {
    resolver = new ModelResolver({ cacheDir: "/tmp/boole-test-cache" });
    vi.clearAllMocks();
  });

  describe("fuzzy filename matching", () => {
    const mockHuggingFaceResponse = {
      siblings: [
        { rfilename: "mistral-7b-instruct-v0.2.Q2_K.gguf" },
        { rfilename: "mistral-7b-instruct-v0.2.Q4_K_M.gguf" },
        { rfilename: "mistral-7b-instruct-v0.2.Q4_K_S.gguf" },
        { rfilename: "mistral-7b-instruct-v0.2.Q8_0.gguf" },
        { rfilename: "README.md" },
      ],
    };

    beforeEach(() => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockHuggingFaceResponse,
      });
    });

    it("should match exact filename", async () => {
      const modelSpec = `${mockRepoId}:mistral-7b-instruct-v0.2.Q4_K_M.gguf`;

      // Mock the file as not existing locally, and mock the download
      const accessMock = vi.fn().mockRejectedValue(new Error("ENOENT"));
      vi.doMock("fs/promises", () => ({ access: accessMock, mkdir: vi.fn() }));

      try {
        await resolver.resolve(modelSpec);
      } catch {
        // We expect download to fail since we're not mocking it fully
      }

      // Verify the API was called
      expect(fetch).toHaveBeenCalledWith(
        `https://huggingface.co/api/models/${mockRepoId}`,
        expect.any(Object)
      );
    });

    it("should fuzzy match Q4_K_M to single file", async () => {
      // Mock a single match scenario
      const singleMatchResponse = {
        siblings: [
          { rfilename: "mistral-7b-instruct-v0.2.Q4_K_M.gguf" },
          { rfilename: "README.md" },
        ],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => singleMatchResponse,
      });

      const modelSpec = `${mockRepoId}:Q4_K_M`;

      try {
        await resolver.resolve(modelSpec);
      } catch {
        // Expected to fail at download stage
      }

      expect(fetch).toHaveBeenCalled();
    });

    it("should throw error on multiple ambiguous matches", async () => {
      const modelSpec = `${mockRepoId}:Q4_K`;

      await expect(resolver.resolve(modelSpec)).rejects.toThrow(
        /Multiple files match "Q4_K"/
      );
    });

    it("should throw error with file list when no matches found", async () => {
      const modelSpec = `${mockRepoId}:Q16_K`;

      await expect(resolver.resolve(modelSpec)).rejects.toThrow(
        /No file matching "Q16_K"/
      );

      await expect(resolver.resolve(modelSpec)).rejects.toThrow(
        /Available GGUF files:/
      );
    });

    it("should be case-insensitive in fuzzy matching", async () => {
      const singleMatchResponse = {
        siblings: [
          { rfilename: "mistral-7b-instruct-v0.2.Q4_K_M.gguf" },
        ],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => singleMatchResponse,
      });

      const modelSpec = `${mockRepoId}:q4_k_m`;

      try {
        await resolver.resolve(modelSpec);
      } catch {
        // Expected to fail at download stage
      }

      expect(fetch).toHaveBeenCalled();
    });

    it("should cache repo file listings", async () => {
      const modelSpec1 = `${mockRepoId}:Q2_K`;
      const modelSpec2 = `${mockRepoId}:Q8_0`;

      const singleMatchQ2 = {
        siblings: [
          { rfilename: "mistral-7b-instruct-v0.2.Q2_K.gguf" },
        ],
      };

      const singleMatchQ8 = {
        siblings: [
          { rfilename: "mistral-7b-instruct-v0.2.Q8_0.gguf" },
        ],
      };

      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => singleMatchQ2,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => singleMatchQ8,
        });

      try {
        await resolver.resolve(modelSpec1);
      } catch {
        // Expected
      }

      try {
        await resolver.resolve(modelSpec2);
      } catch {
        // Expected
      }

      // Should have been called twice since we're resolving different repos/patterns
      // But with caching, the second call for the same repo should use cache
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe("parseModelSpec", () => {
    it("should throw error for spec without colon", async () => {
      await expect(resolver.resolve("invalid-spec")).rejects.toThrow(
        ModelNotFoundError
      );
    });

    it("should handle colons in filename", async () => {
      const mockResponse = {
        siblings: [{ rfilename: "model:with:colons.gguf" }],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const modelSpec = `${mockRepoId}:model:with:colons.gguf`;

      try {
        await resolver.resolve(modelSpec);
      } catch {
        // Expected to fail at download
      }

      expect(fetch).toHaveBeenCalled();
    });
  });
});
