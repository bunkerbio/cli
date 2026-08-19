import React from "react";
import { Box, Text } from "ink";
import TextInput from "ink-text-input";
import { theme } from "./theme.js";

interface InputBoxProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  disabled?: boolean;
}

export function InputBox({
  value,
  onChange,
  onSubmit,
  disabled = false,
}: InputBoxProps) {
  return (
    <Box borderStyle="single" borderColor={theme.border} padding={0} paddingX={1}>
      <Text bold color={theme.accent}>
        &gt;{" "}
      </Text>
      {disabled ? (
        <Text dimColor>{value || "(waiting...)"}</Text>
      ) : (
        <TextInput
          value={value}
          onChange={onChange}
          onSubmit={onSubmit}
        />
      )}
    </Box>
  );
}
