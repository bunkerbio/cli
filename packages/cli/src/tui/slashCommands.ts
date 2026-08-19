import type { SessionState } from "./session.js";
import { setMode, setModel, clearMessages } from "./session.js";

export type SlashCommandResult =
  | { type: "session_update"; session: SessionState }
  | { type: "exit" }
  | { type: "help"; message: string }
  | { type: "none" };

export function handleSlashCommand(
  input: string,
  session: SessionState
): SlashCommandResult {
  const trimmed = input.trim();

  if (!trimmed.startsWith("/")) {
    return { type: "none" };
  }

  const parts = trimmed.slice(1).split(/\s+/);
  const command = parts[0].toLowerCase();
  const args = parts.slice(1);

  switch (command) {
    case "agent":
      return {
        type: "session_update",
        session: setMode(session, "agent"),
      };

    case "chat":
      return {
        type: "session_update",
        session: setMode(session, "chat"),
      };

    case "model":
      if (args.length === 0) {
        return {
          type: "help",
          message: "Usage: /model <model-name>",
        };
      }
      return {
        type: "session_update",
        session: setModel(session, args.join(" ")),
      };

    case "clear":
      return {
        type: "session_update",
        session: clearMessages(session),
      };

    case "help":
      return {
        type: "help",
        message: getHelpMessage(),
      };

    case "exit":
      return { type: "exit" };

    default:
      return {
        type: "help",
        message: `Unknown command: /${command}. Type /help for available commands.`,
      };
  }
}

function getHelpMessage(): string {
  return `Available commands:
  /agent     Switch to agentic mode (model can use tools)
  /chat      Switch to chat-only mode
  /model <name>  Switch to a different model
  /clear     Clear conversation history
  /help      Show this help message
  /exit      Exit the TUI (or press Ctrl+C)`;
}
