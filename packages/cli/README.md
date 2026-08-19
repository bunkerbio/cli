# @boole/cli

**CLI for local-first LLM inference.** Run GGUF models from your terminal with zero network latency, no cold starts, no cloud dependency.

## Installation

```bash
npm install -g @boole/cli
```

This installs the `boole` command globally.

## Usage

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

Downloads the model to `~/.boole/models` without running inference.

**List cached models:**

```bash
boole list
```

**Start a local HTTP server:**

```bash
boole serve --port 8080
```

Exposes `POST /generate` with JSON body `{ "prompt": "...", "model": "..." }`.

**⚠️ Local development only** - no authentication, no production hardening.

**Get help:**

```bash
boole --help
boole run --help
```

## Relationship to @boole/boole

`@boole/cli` and [`@boole/boole`](https://npmjs.com/package/@boole/boole) (the library) are separate packages. The CLI bundles its own inference logic and does not depend on the library package.

- Use `@boole/cli` for running inference from the terminal
- Use `@boole/boole` for embedding inference into your JavaScript/TypeScript applications

Both use the same underlying llama.cpp engine and cache models in `~/.boole/models`.

## License

BSD-2-Clause
