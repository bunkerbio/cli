import { describe, it, expect } from "vitest";
import { Client } from "../src/client.js";
import { LlamaCppEngine } from "../src/engine/llama-cpp.js";

describe("Client", () => {
  it("should create a client with default config", () => {
    const client = new Client();
    expect(client).toBeDefined();
    expect(client.getModelResolver()).toBeDefined();
  });

  it("should create an engine", () => {
    const client = new Client();
    const engine = client.createEngine();
    expect(engine).toBeInstanceOf(LlamaCppEngine);
  });

  it("should manage remote auth token", () => {
    const client = new Client({ remoteAuthToken: "test-token" });
    expect(client.getRemoteAuthToken()).toBe("test-token");
    client.setRemoteAuthToken("new-token");
    expect(client.getRemoteAuthToken()).toBe("new-token");
  });
});
