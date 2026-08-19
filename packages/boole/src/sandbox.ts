import { spawn } from "child_process";
import { SandboxTimeoutError, SandboxExecutionError } from "./errors.js";

export interface SandboxConfig {
  timeout?: number;
  memoryLimit?: number;
  workingDir?: string;
  env?: Record<string, string>;
}

export interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  timedOut: boolean;
}

export class Sandbox {
  private config: {
    timeout: number;
    memoryLimit?: number;
    workingDir: string;
    env?: Record<string, string>;
  };

  constructor(config: SandboxConfig = {}) {
    this.config = {
      timeout: config.timeout ?? 30000,
      memoryLimit: config.memoryLimit,
      workingDir: config.workingDir ?? process.cwd(),
      env: config.env,
    };
  }

  async exec(command: string, args: string[] = []): Promise<ExecResult> {
    return new Promise((resolve, reject) => {
      const env = {
        ...process.env,
        ...this.config.env,
      };

      const child = spawn(command, args, {
        cwd: this.config.workingDir,
        env,
        shell: true,
        timeout: this.config.timeout,
      });

      let stdout = "";
      let stderr = "";
      let timedOut = false;

      child.stdout?.on("data", (data) => {
        stdout += data.toString();
      });

      child.stderr?.on("data", (data) => {
        stderr += data.toString();
      });

      const timeoutId = setTimeout(() => {
        timedOut = true;
        child.kill("SIGTERM");
        setTimeout(() => {
          if (!child.killed) {
            child.kill("SIGKILL");
          }
        }, 1000);
      }, this.config.timeout);

      child.on("error", (error) => {
        clearTimeout(timeoutId);
        reject(
          new SandboxExecutionError(`Failed to spawn process: ${error.message}`)
        );
      });

      child.on("close", (exitCode) => {
        clearTimeout(timeoutId);
        if (timedOut) {
          reject(new SandboxTimeoutError(this.config.timeout));
          return;
        }
        resolve({
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          exitCode: exitCode ?? 0,
          timedOut: false,
        });
      });
    });
  }

  getConfig(): SandboxConfig {
    return { ...this.config };
  }
}
