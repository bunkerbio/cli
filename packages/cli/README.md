# @boole/cli

**CLI for local-first LLM inference.** Run GGUF models from your terminal with zero network latency, no cold starts, no cloud dependency.

## Installation

**Use with npx (recommended)** — no installation needed, always up to date:

```bash
npx @boole/cli run TheBloke/Mistral-7B-Instruct-v0.2-GGUF:Q4_K_M \
  --prompt "Write a haiku about GPUs"
```

**Or install globally** if you use Boole often and want the shorter `boole` command:

```bash
npm install -g @boole/cli
```

Once installed globally, you can use `boole` instead of `npx @boole/cli`.

## Usage

**One-off generation:**

```bash
npx @boole/cli run TheBloke/Mistral-7B-Instruct-v0.2-GGUF:Q4_K_M \
  --prompt "Write a haiku about GPUs"
```

The part after the colon can be either an exact filename (like `mistral-7b-instruct-v0.2.Q4_K_M.gguf`) or a quant pattern (like `Q4_K_M`). If the pattern matches multiple files, Boole will list them so you can pick the exact one.

Stream tokens as they generate:

```bash
npx @boole/cli run <model> --prompt "..." --stream
```

Control sampling parameters:

```bash
npx @boole/cli run <model> --prompt "..." \
  --max-tokens 512 \
  --temperature 0.8 \
  --top-p 0.95 \
  --top-k 40
```

**Pre-download a model:**

```bash
npx @boole/cli pull TheBloke/Mistral-7B-Instruct-v0.2-GGUF:Q4_K_M
```

Downloads the model to `~/.boole/models` without running inference.

**List cached models:**

```bash
npx @boole/cli list
```

**Start a local HTTP server:**

```bash
npx @boole/cli serve --port 8080
```

Exposes `POST /generate` with JSON body `{ "prompt": "...", "model": "..." }`.

**⚠️ Local development only** - no authentication, no production hardening.

**Get help:**

```bash
npx @boole/cli --help
npx @boole/cli run --help
```

If you've installed globally, replace `npx @boole/cli` with `boole` in any of the above commands.

## Relationship to @boole/boole

`@boole/cli` and [`@boole/boole`](https://npmjs.com/package/@boole/boole) (the library) are separate packages. The CLI bundles its own inference logic and does not depend on the library package.

- Use `@boole/cli` for running inference from the terminal
- Use `@boole/boole` for embedding inference into your JavaScript/TypeScript applications

Both use the same underlying llama.cpp engine and cache models in `~/.boole/models`.

## License

BSD-2-Clause
