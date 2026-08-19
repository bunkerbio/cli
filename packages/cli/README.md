# @boole/cli

**Run AI models at the edge, from your terminal.**
Zero network round-trip. No cold start. No cloud dependency. Powered by llama.cpp — run
GGUF models directly on your own machine.

[![npm version](https://img.shields.io/npm/v/@boole/cli.svg)](https://www.npmjs.com/package/@boole/cli)
[![CI](https://github.com/boole-ai/boole-npm/actions/workflows/ci.yml/badge.svg)](https://github.com/boole-ai/boole-npm/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/@boole/cli.svg)](./LICENSE)
[![node](https://img.shields.io/node/v/@boole/cli.svg)](package.json)

```bash
npx @boole/cli
```

This launches an interactive TUI (text user interface) where you can chat with Boole's default model. No model specification needed — just type your prompt and press enter.

No install needed — this always runs the latest version. If you use Boole often and want
the shorter `boole` command without the `npx` prefix, install it globally:

```bash
npm install -g @boole/cli
```

---

## Requirements

- Node.js >= 22 (some dependencies require Node 22+)
- macOS, Linux, or Windows (x64/arm64)

## Quickstart

**Option 1: Use the default model (Boole 20B)**

```bash
npx @boole/cli run --prompt "Write a haiku about GPUs"
```

The first run downloads Boole's default model (~TBD GB) to `~/.boole/models`; subsequent runs load from disk instantly.

**Option 2: Use any other GGUF model**

```bash
npx @boole/cli run TheBloke/Mistral-7B-Instruct-v0.2-GGUF:Q4_K_M --prompt "Write a haiku about GPUs"
```

Same behavior — first run downloads, then runs entirely on your machine with no network call, API key, or per-token bill.

> Every command below is shown with `npx @boole/cli`. If you've installed globally
> (`npm install -g @boole/cli`), drop the `npx @boole/cli` prefix and use `boole` directly —
> both forms behave identically.

## Commands

### `boole run`

Run a single prompt through a local model and print the result.

```bash
npx @boole/cli run [model] --prompt "<text>" [options]
```

If you omit `[model]`, Boole uses its default model (Boole 20B, Q4_K_M). The default model downloads automatically on first use and is cached locally.

| Flag | Description |
|---|---|
| `--prompt <text>` | The prompt to generate from. Required. |
| `--stream` | Stream tokens to stdout as they generate, instead of waiting for the full response. |
| `--max-tokens <n>` | Maximum tokens to generate. |
| `--temperature <n>` | Sampling temperature. |
| `--top-p <n>` | Nucleus sampling threshold. |
| `--top-k <n>` | Top-k sampling cutoff. |

**Examples:**

```bash
# Use default model
npx @boole/cli run --prompt "Explain recursion in one sentence" --stream

# Use specific model
npx @boole/cli run TheBloke/Mistral-7B-Instruct-v0.2-GGUF:Q4_K_M \
  --prompt "Explain recursion in one sentence" \
  --stream \
  --max-tokens 200
```

### `boole pull`

Pre-download a model into the local cache without running inference — useful for warming
the cache ahead of offline use, or in CI.

```bash
npx @boole/cli pull TheBloke/Mistral-7B-Instruct-v0.2-GGUF:Q4_K_M
```

### `boole serve`

Start a local HTTP server exposing a loaded model over a simple REST endpoint, so other
tools or languages can hit it without needing a JS runtime.

```bash
npx @boole/cli serve --port 8080
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
npx @boole/cli list
```

### `--help` / `--version`

Standard help and version output. Every subcommand also supports `--help`
(e.g. `npx @boole/cli run --help`).

## Model specifiers

Models are referenced as `<huggingface-repo>:<pattern>`, where `<pattern>` can be either:

- An exact GGUF filename (e.g. `mistral-7b-instruct-v0.2.Q4_K_M.gguf`)
- A quant pattern like `Q4_K_M` — Boole will find the matching GGUF file automatically

If the pattern matches multiple files, Boole lists them so you can pick the exact one. If no files match, it shows all available GGUF files in the repo.

You can also pass a local file path to a `.gguf` file already on disk.

## Authentication

Some Hugging Face repositories are gated and require authentication. If you encounter a 401 error, provide your Hugging Face token:

**Via command-line flag:**
```bash
npx @boole/cli run mistralai/Mistral-7B-Instruct-v0.2-GGUF:Q4_K_M \
  --hf-token hf_xxxx \
  --prompt "Hello"
```

**Via environment variable:**
```bash
export HF_TOKEN=hf_xxxx
npx @boole/cli run mistralai/Mistral-7B-Instruct-v0.2-GGUF:Q4_K_M --prompt "Hello"
```

Get your token from [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens).

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