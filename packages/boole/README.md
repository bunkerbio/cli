# Boole

**Local-first LLM inference for JavaScript & TypeScript.**
Run GGUF models on your own hardware via llama.cpp — get cloud-SDK ergonomics without the cloud bill.

Boole ships as both a **library** (import `App`/`Function`/`Sandbox` into your code) and a **CLI** (run inference from your terminal without writing code).

[![npm version](https://img.shields.io/npm/v/@boole/boole.svg)](https://www.npmjs.com/package/@boole/boole)
[![license](https://img.shields.io/npm/l/@boole/boole.svg)](./LICENSE)
[![node](https://img.shields.io/node/v/@boole/boole.svg)](package.json)

```bash
npm install @boole/boole
```

---

## Why Boole

Most inference SDKs assume every call leaves your machine. You pay per token, per second of
GPU time, per cold start — even for workloads your own laptop or workstation could handle in
milliseconds. Boole flips the default: **inference runs locally unless you tell it not
to.**

- **~10x cheaper by default** — no metered API calls for work your hardware can already do.
- **No cold starts** — models load once into a long-lived local process, not a fresh
  container on every request.
- **No data leaves your machine** — prompts, context, and outputs stay local unless you
  explicitly opt into remote burst.
- **Familiar shape** — `App`, `Function`, and `Sandbox` primitives will feel immediately
  natural if you've used a serverless inference SDK before.
- **Burst when you need to** — for models too large for local hardware, or workloads that
  need to scale past one machine, the same function can transparently hand off to remote
  compute (opt-in, v1).

## Quickstart

```ts
import { App } from "@boole/boole";

const app = new App({ name: "my-app" });

const generate = app.function(
  { model: "TheBloke/Mistral-7B-Instruct-v0.2-GGUF", quant: "Q4_K_M" },
  async (ctx, prompt: string) => ctx.llm.generate(prompt),
);

const result = await generate.call("Write a haiku about GPUs");
console.log(result);
```

The first call downloads and caches the GGUF weights to `~/.boole/models`; every call
after that loads from disk and runs entirely on your machine.

## CLI

Boole also ships with a command-line interface for running inference without writing code.

### Installation

The CLI is included when you install `@boole/boole`:

```bash
npm install -g @boole/boole
```

### Usage

**One-off generation:**

```bash
boole run TheBloke/Mistral-7B-Instruct-v0.2-GGUF:Q4_K_M.gguf \
  --prompt "Write a haiku about GPUs"
```

Stream tokens as they generate:

```bash
boole run <model> --prompt "..." --stream
```

Control sampling parameters:

```bash
boole run <model> --prompt "..." \
  --max-tokens 512 \
  --temperature 0.8 \
  --top-p 0.95 \
  --top-k 40
```

**Pre-download a model:**

```bash
boole pull TheBloke/Mistral-7B-Instruct-v0.2-GGUF:Q4_K_M.gguf
```

This downloads the model to `~/.boole/models` without running inference, useful for pre-warming before offline use or CI.

**List cached models:**

```bash
boole list
```

Shows all locally cached models with their size on disk.

**Start a local HTTP server:**

```bash
boole serve --port 8080
```

Exposes `POST /generate` with JSON body `{ "prompt": "...", "model": "..." }`. Explicitly local-dev-only — no authentication, no production hardening. See `boole serve --help` for details.

**Get help:**

```bash
boole --help
boole run --help
boole serve --help
```

## Core concepts

| Primitive | What it does |
|---|---|
| `App` | Top-level container that groups functions and shared config. |
| `Function` | A typed, callable unit of inference work, bound to a specific model. |
| `Sandbox` | An isolated local execution context for running arbitrary code with resource limits (timeout, memory cap). |
| `Client` | SDK entry point — model cache directory, default backend, auth for future remote mode. |
| `RemoteBurst` *(opt-in)* | Routes a `Function` call to remote compute when local hardware can't handle it. |

### Streaming generation

```ts
for await (const token of ctx.llm.stream(prompt)) {
  process.stdout.write(token);
}
```

### Running untrusted code in a Sandbox

```ts
const sandbox = app.sandbox({ timeoutMs: 5000, memoryLimitMb: 512 });
const { stdout } = await sandbox.exec("node", ["-e", "console.log(1 + 1)"]);
```

## Platform support

Boole uses native bindings (via `node-llama-cpp`) to talk to llama.cpp directly, with
GPU offload where available.

| Platform | CPU | GPU acceleration |
|---|---|---|
| macOS (Apple Silicon) | ✅ | ✅ Metal |
| macOS (Intel) | ✅ | — |
| Linux (x64/arm64) | ✅ | ✅ CUDA / Vulkan |
| Windows (x64) | ✅ | ✅ CUDA / Vulkan |

Prebuilt binaries are used where available; unsupported platform/architecture combinations
fall back to compiling from source on install.

## Configuration

```ts
import { Client } from "@boole/boole";

const client = new Client({
  modelCacheDir: "~/.boole/models", // where GGUF files are stored
  defaultBackend: "llama-cpp",      // inference backend
});
```

## Roadmap

- [x] Local inference via llama.cpp / GGUF
- [x] `App` / `Function` / `Sandbox` primitives
- [ ] `RemoteBurst` — opt-in remote fallback for oversized models / scaled workloads
- [ ] Structured output / grammar-constrained generation helpers
- [ ] Bun runtime support

## Contributing

Issues and PRs welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md) for local dev setup
(`pnpm install`, `pnpm test`, `pnpm build`).
