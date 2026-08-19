import { describe, it, expect } from "vitest";
import { handleSlashCommand } from "../../src/tui/slashCommands.js";
import { createSession } from "../../src/tui/session.js";

describe("Slash commands", () => {
  it("should return none for non-command input", () => {
    const session = createSession();
    const result = handleSlashCommand("Hello world", session);
    expect(result.type).toBe("none");
  });

  it("should switch to agent mode", () => {
    const session = createSession();
    const result = handleSlashCommand("/agent", session);

    expect(result.type).toBe("session_update");
    if (result.type === "session_update") {
      expect(result.session.mode).toBe("agent");
    }
  });

  it("should switch to chat mode", () => {
    const session = { ...createSession(), mode: "agent" as const };
    const result = handleSlashCommand("/chat", session);

    expect(result.type).toBe("session_update");
    if (result.type === "session_update") {
      expect(result.session.mode).toBe("chat");
    }
  });

  it("should set a new model", () => {
    const session = createSession();
    const result = handleSlashCommand("/model test-model", session);

    expect(result.type).toBe("session_update");
    if (result.type === "session_update") {
      expect(result.session.currentModel).toBe("test-model");
    }
  });

  it("should require model argument", () => {
    const session = createSession();
    const result = handleSlashCommand("/model", session);

    expect(result.type).toBe("help");
    if (result.type === "help") {
      expect(result.message).toContain("Usage: /model");
    }
  });

  it("should clear messages", () => {
    const session = createSession();
    // Add a message first
    const sessionWithMessage = {
      ...session,
      messages: [{ role: "user" as const, content: "Test", timestamp: Date.now() }],
    };

    const result = handleSlashCommand("/clear", sessionWithMessage);

    expect(result.type).toBe("session_update");
    if (result.type === "session_update") {
      expect(result.session.messages).toHaveLength(0);
    }
  });

  it("should return help message", () => {
    const session = createSession();
    const result = handleSlashCommand("/help", session);

    expect(result.type).toBe("help");
    if (result.type === "help") {
      expect(result.message).toContain("/agent");
      expect(result.message).toContain("/chat");
      expect(result.message).toContain("/model");
    }
  });

  it("should exit on /exit command", () => {
    const session = createSession();
    const result = handleSlashCommand("/exit", session);

    expect(result.type).toBe("exit");
  });

  it("should show error for unknown command", () => {
    const session = createSession();
    const result = handleSlashCommand("/unknown", session);

    expect(result.type).toBe("help");
    if (result.type === "help") {
      expect(result.message).toContain("Unknown command");
    }
  });
});
