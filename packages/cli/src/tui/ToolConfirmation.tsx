import React from "react";
import { Box, Text } from "ink";
import type { ToolCall } from "./AgentTools/types.js";

interface ToolConfirmationProps {
  call: ToolCall;
  onConfirm: () => void;
  onDeny: () => void;
}

export function ToolConfirmation({
  call,
  onConfirm,
  onDeny,
}: ToolConfirmationProps) {
  const getCallDescription = () => {
    switch (call.type) {
      case "read_file":
        return `Read file: ${call.path}`;
      case "write_file":
        return `Write file: ${call.path}\n\nContent preview:\n${call.content.substring(0, 200)}${call.content.length > 200 ? "..." : ""}`;
      case "run_shell":
        return `Run shell command: ${call.command}`;
    }
  };

  const needsConfirmation = call.type === "write_file" || call.type === "run_shell";

  if (!needsConfirmation) {
    return null;
  }

  return (
    <Box
      borderStyle="bold"
      borderColor="yellow"
      flexDirection="column"
      padding={1}
      marginY={1}
    >
      <Text bold color="yellow">
        ⚠️  ACTION REQUIRES CONFIRMATION
      </Text>
      <Text>{"\n"}</Text>
      <Text>{getCallDescription()}</Text>
      <Text>{"\n"}</Text>
      <Text>
        Press <Text bold color="green">y</Text> to approve or{" "}
        <Text bold color="red">n</Text> to deny
      </Text>
    </Box>
  );
}
