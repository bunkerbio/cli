import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: false,
  splitting: false,
  sourcemap: false,
  clean: true,
  outDir: "dist",
  shims: true,
  banner: {
    js: "#!/usr/bin/env node",
  },
  esbuildOptions(options) {
    options.jsx = "transform";
    options.jsxFactory = "React.createElement";
    options.jsxFragment = "React.Fragment";
  },
});
