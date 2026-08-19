export type ToolCallType = "read_file" | "write_file" | "run_shell";

export interface ReadFileCall {
  type: "read_file";
  path: string;
}

export interface WriteFileCall {
  type: "write_file";
  path: string;
  content: string;
}

export interface RunShellCall {
  type: "run_shell";
  command: string;
}

export type ToolCall = ReadFileCall | WriteFileCall | RunShellCall;

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
}

export interface PendingConfirmation {
  call: ToolCall;
  resolve: (approved: boolean) => void;
}
