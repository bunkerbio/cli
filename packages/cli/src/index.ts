import { Command } from "commander";
import { runCommand } from "./run.js";
import { pullCommand } from "./pull.js";
import { serveCommand } from "./serve.js";
import { listCommand } from "./list.js";
import { launchTUI } from "./tui/index.js";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageJsonPath = join(__dirname, "../package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));

const program = new Command();

program
  .name("boole")
  .description("Local-first LLM inference CLI for JavaScript & TypeScript")
  .version(packageJson.version);

program
  .command("run <model>")
  .description("Run a one-off generation with a model")
  .requiredOption("-p, --prompt <text>", "The prompt to generate from")
  .option("-s, --stream", "Stream tokens as they generate", false)
  .option("--max-tokens <n>", "Maximum tokens to generate", parseInt)
  .option("--temperature <n>", "Sampling temperature", parseFloat)
  .option("--top-p <n>", "Top-p sampling", parseFloat)
  .option("--top-k <n>", "Top-k sampling", parseInt)
  .action(async (model: string, options) => {
    try {
      await runCommand(model, options);
    } catch (error) {
      console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  });

program
  .command("pull <model>")
  .description("Download a GGUF model to local cache")
  .action(async (model: string) => {
    try {
      await pullCommand(model);
    } catch (error) {
      console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  });

program
  .command("serve")
  .description(
    "Start a local HTTP server (local dev only - no auth, no production hardening)"
  )
  .option("-p, --port <n>", "Port to listen on", "8080")
  .action(async (options) => {
    try {
      await serveCommand({ port: parseInt(options.port) });
    } catch (error) {
      console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  });

program
  .command("list")
  .description("List locally cached models")
  .action(async () => {
    try {
      await listCommand();
    } catch (error) {
      console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  });

// Check if any command or option was provided
const args = process.argv.slice(2);
const hasArgs = args.length > 0;

// If no args at all, launch TUI
if (!hasArgs) {
  try {
    await launchTUI();
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
} else {
  // Parse commands normally (including --version, --help, etc.)
  program.parse();
}
