import React from "react";
import { Box, Text } from "ink";
import Spinner from "ink-spinner";
import type { Mode } from "./session.js";

interface StatusBarProps {
  model: string | null;
  mode: Mode;
  isGenerating: boolean;
}

export function StatusBar({ model, mode, isGenerating }: StatusBarProps) {
  return (
    <Box borderStyle="single" borderColor="gray" padding={0} paddingX={1}>
      <Text>
        <Text bold color="cyan">
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
            <Text color="magenta">
              <Spinner type="dots" />
              {" Generating..."}
            </Text>
          </>
        )}
      </Text>
    </Box>
  );
}
