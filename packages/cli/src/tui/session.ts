export type Mode = "chat" | "agent";

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}

export interface SessionState {
  mode: Mode;
  messages: Message[];
  currentModel: string | null;
  isGenerating: boolean;
}

export function createSession(): SessionState {
  return {
    mode: "chat",
    messages: [],
    currentModel: null,
    isGenerating: false,
  };
}

export function addMessage(
  session: SessionState,
  message: Omit<Message, "timestamp">
): SessionState {
  return {
    ...session,
    messages: [
      ...session.messages,
      { ...message, timestamp: Date.now() },
    ],
  };
}

export function setMode(session: SessionState, mode: Mode): SessionState {
  return { ...session, mode };
}

export function setModel(
  session: SessionState,
  model: string
): SessionState {
  return { ...session, currentModel: model };
}

export function setGenerating(
  session: SessionState,
  isGenerating: boolean
): SessionState {
  return { ...session, isGenerating };
}

export function clearMessages(session: SessionState): SessionState {
  return { ...session, messages: [] };
}
