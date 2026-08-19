import React from "react";
import { Box, Text } from "ink";
import type { Message } from "./session.js";
import { CodeBlock } from "./CodeBlock.js";

interface MessageListProps {
  messages: Message[];
  streamingContent?: string;
}

export function MessageList({ messages, streamingContent }: MessageListProps) {
  const renderMessage = (message: Message, index: number) => {
    const isUser = message.role === "user";
    const color = isUser ? "cyan" : "green";

    // Parse code blocks
    const parts: Array<{ type: "text" | "code"; content: string; language?: string }> = [];
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(message.content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: "text",
          content: message.content.substring(lastIndex, match.index),
        });
      }
      parts.push({
        type: "code",
        language: match[1] || "text",
        content: match[2],
      });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < message.content.length) {
      parts.push({
        type: "text",
        content: message.content.substring(lastIndex),
      });
    }

    return (
      <Box key={index} flexDirection="column" marginBottom={1}>
        <Text bold color={color}>
          {isUser ? "You" : "Assistant"}:
        </Text>
        {parts.map((part, i) =>
          part.type === "code" ? (
            <CodeBlock
              key={i}
              language={part.language || "text"}
              code={part.content}
            />
          ) : (
            <Text key={i}>{part.content}</Text>
          )
        )}
      </Box>
    );
  };

  return (
    <Box flexDirection="column" paddingX={1}>
      {messages.map(renderMessage)}
      {streamingContent && (
        <Box flexDirection="column">
          <Text bold color="green">
            Assistant:
          </Text>
          <Text>{streamingContent}</Text>
        </Box>
      )}
    </Box>
  );
}
