import { describe, it, expect } from "vitest";
import {
  createSession,
  addMessage,
  setMode,
  setModel,
  setGenerating,
  clearMessages,
} from "../../src/tui/session.js";

describe("Session state", () => {
  it("should create a new session with default values", () => {
    const session = createSession();
    expect(session.mode).toBe("chat");
    expect(session.messages).toEqual([]);
    expect(session.currentModel).toBeNull();
    expect(session.isGenerating).toBe(false);
  });

  it("should add a message to the session", () => {
    let session = createSession();
    session = addMessage(session, {
      role: "user",
      content: "Hello",
    });

    expect(session.messages).toHaveLength(1);
    expect(session.messages[0].role).toBe("user");
    expect(session.messages[0].content).toBe("Hello");
    expect(session.messages[0].timestamp).toBeTypeOf("number");
  });

  it("should switch modes", () => {
    let session = createSession();
    expect(session.mode).toBe("chat");

    session = setMode(session, "agent");
    expect(session.mode).toBe("agent");

    session = setMode(session, "chat");
    expect(session.mode).toBe("chat");
  });

  it("should set the current model", () => {
    let session = createSession();
    expect(session.currentModel).toBeNull();

    session = setModel(session, "test-model");
    expect(session.currentModel).toBe("test-model");
  });

  it("should toggle generating state", () => {
    let session = createSession();
    expect(session.isGenerating).toBe(false);

    session = setGenerating(session, true);
    expect(session.isGenerating).toBe(true);

    session = setGenerating(session, false);
    expect(session.isGenerating).toBe(false);
  });

  it("should clear all messages", () => {
    let session = createSession();
    session = addMessage(session, { role: "user", content: "Hello" });
    session = addMessage(session, { role: "assistant", content: "Hi" });

    expect(session.messages).toHaveLength(2);

    session = clearMessages(session);
    expect(session.messages).toHaveLength(0);
  });
});
