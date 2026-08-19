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
    js: `#!/usr/bin/env node
// Check Node version before running
const [major] = process.versions.node.split(".").map(Number);
if (isNaN(major) || major < 22) {
  console.error(
    "Boole requires Node.js 22 or later. You're running Node " + process.versions.node + ".\\n" +
    "Please upgrade: https://nodejs.org/en/download\\n" +
    "If you use nvm: nvm install 22 && nvm use 22"
  );
  process.exit(1);
}`,
  },
  esbuildOptions(options) {
    options.jsx = "transform";
    options.jsxFactory = "React.createElement";
    options.jsxFragment = "React.Fragment";
  },
});
