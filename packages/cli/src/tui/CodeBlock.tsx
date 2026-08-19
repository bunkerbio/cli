import React from "react";
import { Box, Text } from "ink";

interface CodeBlockProps {
  language: string;
  code: string;
}

export function CodeBlock({ language, code }: CodeBlockProps) {
  // For now, simple rendering without syntax highlighting
  // Can be enhanced with ink-syntax-highlight or similar
  return (
    <Box
      borderStyle="round"
      borderColor="blue"
      flexDirection="column"
      paddingX={1}
      marginY={1}
    >
      <Text color="blue" dimColor>
        {language}
      </Text>
      <Text>{code}</Text>
    </Box>
  );
}
