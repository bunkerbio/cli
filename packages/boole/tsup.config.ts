import { defineConfig } from "tsup";

export default defineConfig([
  // Library build
  {
    entry: ["src/index.ts"],
    format: ["esm", "cjs"],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    outDir: "dist",
    outExtension({ format }) {
      return {
        js: format === "esm" ? ".js" : ".cjs",
      };
    },
  },
  // CLI build
  {
    entry: ["src/cli/index.ts"],
    format: ["esm"],
    dts: false,
    splitting: false,
    sourcemap: false,
    outDir: "dist/cli",
    shims: true,
    banner: {
      js: "#!/usr/bin/env node",
    },
  },
]);
