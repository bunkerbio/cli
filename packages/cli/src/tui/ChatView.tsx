import React from "react";
import { Box } from "ink";
import { MessageList } from "./MessageList.js";
import type { Message } from "./session.js";

interface ChatViewProps {
  messages: Message[];
  streamingContent?: string;
}

export function ChatView({ messages, streamingContent }: ChatViewProps) {
  return (
    <Box flexDirection="column" flexGrow={1} paddingBottom={1}>
      <MessageList messages={messages} streamingContent={streamingContent} />
    </Box>
  );
}
