# Boole

**Local-first LLM inference for JavaScript & TypeScript.**

Boole ships as two separate npm packages:

## [@boole/boole](./packages/boole) - Library

The SDK for embedding LLM inference into your JavaScript/TypeScript applications.

```bash
npm install @boole/boole
```

```ts
import { App } from "@boole/boole";

const app = new App({ name: "my-app" });

const generate = app.function(
  { model: "TheBloke/Mistral-7B-Instruct-v0.2-GGUF:Q4_K_M.gguf" },
  async (ctx, prompt: string) => ctx.llm.generate(prompt),
);

const result = await generate.call("Write a haiku about GPUs");
console.log(result);
```

[Full library documentation →](./packages/boole/README.md)

## [@boole/cli](./packages/cli) - Command-line tool

Run LLM inference from your terminal without writing code.

```bash
npm install -g @boole/cli
```

```bash
boole run TheBloke/Mistral-7B-Instruct-v0.2-GGUF:Q4_K_M.gguf \
  --prompt "Write a haiku about GPUs"
```

[Full CLI documentation →](./packages/cli/README.md)

## Key Features

- **~10x cheaper by default** — no metered API calls for work your hardware can already do
- **No cold starts** — models load once into a long-lived local process
- **No data leaves your machine** — prompts, context, and outputs stay local
- **Zero network latency** — inference runs on your own hardware

## Relationship Between Packages

`@boole/boole` and `@boole/cli` are independent packages:

- They **do not depend on each other** - you can install one without the other
- They **share the model cache** (`~/.boole/models`) - models downloaded by one are available to the other
- They **use the same inference engine** (llama.cpp) under the hood
- The CLI bundles its own copy of the inference logic, so there is some intentional code duplication

## Development

This is a pnpm monorepo:

```bash
# Install dependencies for all packages
pnpm install

# Build all packages
pnpm build

# Test all packages
pnpm test

# Work on a specific package
cd packages/boole
pnpm build
pnpm test
```

## License

BSD-2-Clause
