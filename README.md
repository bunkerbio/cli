# @boole/cli

**Run AI models at the edge, from your terminal.**
Zero network round-trip. No cold start. No cloud dependency. Powered by llama.cpp — run
GGUF models directly on your own machine.

[![npm version](https://img.shields.io/npm/v/@boole/cli.svg)](https://www.npmjs.com/package/@boole/cli)
[![CI](https://github.com/boole-ai/boole-npm/actions/workflows/ci.yml/badge.svg)](https://github.com/boole-ai/boole-npm/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/@boole/cli.svg)](./LICENSE)
[![node](https://img.shields.io/node/v/@boole/cli.svg)](package.json)

```bash
npm install -g @boole/cli
```

---

## Usage Modes

Boole CLI works in two ways:

1. **Interactive Mode** — Launch a rich terminal interface for chat and agentic workflows
2. **Command Mode** — Run one-off commands for specific tasks

### Interactive Mode

Launch the TUI (Terminal User Interface) by running `boole` with no arguments:

```bash
boole
```

This starts an interactive session with two modes:

**Chat Mode (default)** — Ask questions and get streaming responses from the local model:
- Type your prompt and press Enter
- Responses stream in real-time with syntax-highlighted code blocks
- Full conversation history maintained

**Agent Mode** — Enable tool use for reading/writing files and running shell commands:
- Type `/agent` to switch to agentic mode
- The model can propose file reads, file writes, and shell commands
- **Every write or shell command requires your explicit approval (y/n)**
- File reads are executed without confirmation but logged visibly
- Type `/chat` to return to chat-only mode

**Slash Commands:**
- `/agent` — Switch to agentic mode (model can use tools)
- `/chat` — Switch to chat-only mode
- `/model <name>` — Switch to a different model mid-session
- `/clear` — Clear conversation history
- `/help` — Show available commands
- `/exit` — Exit the TUI (or press Ctrl+C)

### Command Mode (Quickstart)

Run one-off generations without entering interactive mode:

```bash
boole run mistralai/Mistral-7B-Instruct-v0.2-GGUF:Q4_K_M --prompt "Write a haiku about GPUs"
```

The first run downloads and caches the GGUF weights to `~/.boole/models`; every run after
that loads from disk and runs entirely on your machine — no network call, no API key, no
per-token bill.

## Commands

### `boole run`

Run a single prompt through a local model and print the result.

```bash
boole run <model> --prompt "<text>" [options]
```

| Flag | Description |
|---|---|
| `--prompt <text>` | The prompt to generate from. Required. |
| `--stream` | Stream tokens to stdout as they generate, instead of waiting for the full response. |
| `--max-tokens <n>` | Maximum tokens to generate. |
| `--temperature <n>` | Sampling temperature. |
| `--top-p <n>` | Nucleus sampling threshold. |
| `--top-k <n>` | Top-k sampling cutoff. |

```bash
boole run mistralai/Mistral-7B-Instruct-v0.2-GGUF:Q4_K_M \
  --prompt "Explain recursion in one sentence" \
  --stream \
  --max-tokens 200
```

### `boole pull`

Pre-download a model into the local cache without running inference — useful for warming
the cache ahead of offline use, or in CI.

```bash
boole pull mistralai/Mistral-7B-Instruct-v0.2-GGUF:Q4_K_M
```

### `boole serve`

Start a local HTTP server exposing a loaded model over a simple REST endpoint, so other
tools or languages can hit it without needing a JS runtime.

```bash
boole serve --port 8080
```

```bash
curl -X POST http://localhost:8080/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Say hello"}'
```

> **Local use only.** `boole serve` has no authentication and no production hardening — it's
> a convenience for local development and scripting, not a deployable server. Don't expose
> it to an untrusted network.

### `boole list`

List locally cached models and their size on disk.

```bash
boole list
```

### `boole --help` / `boole --version`

Standard help and version output. Every subcommand also supports `--help`
(e.g. `boole run --help`).

## Model specifiers

Models are referenced as `<huggingface-repo>:<gguf-filename>`, e.g.
`mistralai/Mistral-7B-Instruct-v0.2-GGUF:Q4_K_M.gguf`, or as a local file path to a `.gguf`
file already on disk.

## Platform support

`@boole/cli` uses native bindings (via `node-llama-cpp`) to talk to llama.cpp directly, with
GPU offload where available.

| Platform | CPU | GPU acceleration |
|---|---|---|
| macOS (Apple Silicon) | ✅ | ✅ Metal |
| macOS (Intel) | ✅ | — |
| Linux (x64/arm64) | ✅ | ✅ CUDA / Vulkan |
| Windows (x64) | ✅ | ✅ CUDA / Vulkan |

Prebuilt binaries are used where available; unsupported platform/architecture combinations
fall back to compiling from source on install.

## Contributing

Issues and PRs welcome. See [CONTRIBUTING.md](../../CONTRIBUTING.md) for local dev setup.

## License

MIT © Boole