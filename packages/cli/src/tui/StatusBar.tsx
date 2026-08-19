import React from "react";
import { Box, Text } from "ink";
import Spinner from "ink-spinner";
import type { Mode } from "./session.js";
import { theme } from "./theme.js";

interface StatusBarProps {
  model: string | null;
  mode: Mode;
  isGenerating: boolean;
  tokensPerSecond: number | null;
}

export function StatusBar({ model, mode, isGenerating, tokensPerSecond }: StatusBarProps) {
  return (
    <Box borderStyle="single" borderColor="gray" padding={0} paddingX={1}>
      <Text>
        <Text bold color={theme.accent}>
          Model:{" "}
        </Text>
        <Text>{model || "none"}</Text>
        <Text dimColor> | </Text>
        <Text bold color={mode === "agent" ? "yellow" : "green"}>
          Mode:{" "}
        </Text>
        <Text>{mode === "agent" ? "Agent" : "Chat"}</Text>
        {isGenerating && (
          <>
            <Text dimColor> | </Text>
            <Text color={theme.accent}>
              <Spinner type="dots" />
              {" Generating..."}
              {tokensPerSecond !== null && tokensPerSecond > 0 && (
                <Text> {tokensPerSecond.toFixed(1)} tok/s</Text>
              )}
            </Text>
          </>
        )}
      </Text>
    </Box>
  );
}
