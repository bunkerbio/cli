import React from "react";
import { Box, Text } from "ink";
import TextInput from "ink-text-input";

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
    <Box borderStyle="single" borderColor="blue" padding={0} paddingX={1}>
      <Text bold color="blue">
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
