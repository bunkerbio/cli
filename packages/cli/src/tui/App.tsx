import React, { useState, useEffect } from "react";
import { Box, Text, useInput, useApp } from "ink";
import { ChatView } from "./ChatView.js";
import { InputBox } from "./InputBox.js";
import { StatusBar } from "./StatusBar.js";
import { ToolConfirmation } from "./ToolConfirmation.js";
import {
  createSession,
  addMessage,
  setGenerating,
  setTokensPerSecond,
  setModel,
  type SessionState,
} from "./session.js";
import { handleSlashCommand } from "./slashCommands.js";
import type { PendingConfirmation } from "./AgentTools/types.js";
import { readFile } from "./AgentTools/readFile.js";
import { writeFile } from "./AgentTools/writeFile.js";
import { runShell } from "./AgentTools/runShell.js";
import { theme } from "./theme.js";
import { DEFAULT_MODEL, DEFAULT_MODEL_SIZE_GB } from "../config.js";

interface AppProps {
  initialModel?: string;
}

export function App({ initialModel }: AppProps) {
  const { exit } = useApp();
  const [session, setSession] = useState<SessionState>(() => {
    const s = createSession();
    return initialModel ? { ...s, currentModel: initialModel } : s;
  });
  const [inputValue, setInputValue] = useState("");
  const [streamingContent, setStreamingContent] = useState("");
  const [pendingConfirmation, setPendingConfirmation] =
    useState<PendingConfirmation | null>(null);
  const [helpMessage, setHelpMessage] = useState<string | null>(null);
  const [showFirstRunMessage, setShowFirstRunMessage] = useState(false);

  // Handle confirmation keys (y/n) when there's a pending confirmation
  useInput(
    (input, key) => {
      if (pendingConfirmation) {
        if (input === "y" || input === "Y") {
          pendingConfirmation.resolve(true);
          setPendingConfirmation(null);
        } else if (input === "n" || input === "N") {
          pendingConfirmation.resolve(false);
          setPendingConfirmation(null);
        }
      } else if (key.ctrl && input === "c") {
        exit();
      }
    },
    { isActive: true }
  );

  // Show help message if any
  useEffect(() => {
    if (helpMessage) {
      const timer = setTimeout(() => setHelpMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [helpMessage]);

  const handleInput = async (value: string) => {
    if (!value.trim()) return;

    // Check if it's a slash command
    if (value.startsWith("/")) {
      const result = handleSlashCommand(value, session);

      switch (result.type) {
        case "session_update":
          setSession(result.session);
          break;
        case "exit":
          exit();
          break;
        case "help":
          setHelpMessage(result.message);
          break;
      }

      setInputValue("");
      return;
    }

    // Check if we need to load the default model
    let updatedSession = session;
    if (!session.currentModel) {
      updatedSession = setModel(session, DEFAULT_MODEL);
      setSession(updatedSession);
      // Show first-run message for 5 seconds
      setShowFirstRunMessage(true);
      setTimeout(() => setShowFirstRunMessage(false), 5000);
    }

    // Add user message
    const newSession = addMessage(updatedSession, {
      role: "user",
      content: value,
    });
    setSession(newSession);
    setInputValue("");

    // Start generating (mock for now - in real implementation, call the engine)
    setSession(setGenerating(newSession, true));
    setStreamingContent("");

    // Simulate streaming response
    // In real implementation, this would call LlamaCppEngine.generateStream()
    const mockResponse = `This is a mock response to: "${value}"\n\nIn a real implementation, this would call the LlamaCppEngine to generate a response.`;

    // Track token generation for tok/s calculation
    const startTime = Date.now();
    let tokenCount = 0;

    // Simulate streaming with tok/s tracking
    for (let i = 0; i < mockResponse.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 10));
      setStreamingContent(mockResponse.substring(0, i + 1));

      tokenCount++;
      const elapsed = (Date.now() - startTime) / 1000;

      // Only update tok/s if enough time has passed to avoid huge numbers
      if (elapsed > 0.1) {
        const tokensPerSecond = tokenCount / elapsed;
        setSession((prev) => setTokensPerSecond(prev, tokensPerSecond));
      }
    }

    // Add complete message and clear tok/s
    const finalSession = setTokensPerSecond(
      addMessage(
        setGenerating(newSession, false),
        {
          role: "assistant",
          content: mockResponse,
        }
      ),
      null
    );
    setSession(finalSession);
    setStreamingContent("");
  };

  const handleToolConfirm = () => {
    if (pendingConfirmation) {
      pendingConfirmation.resolve(true);
      setPendingConfirmation(null);
    }
  };

  const handleToolDeny = () => {
    if (pendingConfirmation) {
      pendingConfirmation.resolve(false);
      setPendingConfirmation(null);
    }
  };

  return (
    <Box flexDirection="column" height="100%">
      <Box
        flexDirection="column"
        borderStyle="double"
        borderColor={theme.border}
        padding={1}
        marginBottom={1}
      >
        <Text bold color={theme.accent}>
          {`██████╗  ██████╗  ██████╗ ██╗     ███████╗
██╔══██╗██╔═══██╗██╔═══██╗██║     ██╔════╝
██████╔╝██║   ██║██║   ██║██║     █████╗
██╔══██╗██║   ██║██║   ██║██║     ██╔══╝
██████╔╝╚██████╔╝╚██████╔╝███████╗███████╗
╚═════╝  ╚═════╝  ╚═════╝ ╚══════╝╚══════╝`}
        </Text>
        <Text dimColor>
          Type your prompt or use /help for commands. Ctrl+C to exit.
        </Text>
      </Box>

      {helpMessage && (
        <Box
          borderStyle="round"
          borderColor="yellow"
          padding={1}
          marginBottom={1}
        >
          <Text color="yellow">{helpMessage}</Text>
        </Box>
      )}

      {showFirstRunMessage && (
        <Box
          borderStyle="round"
          borderColor="cyan"
          padding={1}
          marginBottom={1}
        >
          <Text color="cyan">
            No model specified — using Boole's default model (Boole 20B, Q4_K_M).{"\n"}
            This is a one-time download (~{DEFAULT_MODEL_SIZE_GB}GB) and will be cached at ~/.boole/models for future use.{"\n"}
            You can use a different model anytime with: /model &lt;name&gt;
          </Text>
        </Box>
      )}

      {pendingConfirmation && (
        <ToolConfirmation
          call={pendingConfirmation.call}
          onConfirm={handleToolConfirm}
          onDeny={handleToolDeny}
        />
      )}

      <ChatView messages={session.messages} streamingContent={streamingContent} />

      <InputBox
        value={inputValue}
        onChange={setInputValue}
        onSubmit={handleInput}
        disabled={session.isGenerating || !!pendingConfirmation}
      />

      <StatusBar
        model={session.currentModel}
        mode={session.mode}
        isGenerating={session.isGenerating}
        tokensPerSecond={session.tokensPerSecond}
      />
    </Box>
  );
}
