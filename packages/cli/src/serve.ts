import { createServer, IncomingMessage, ServerResponse } from "http";
import { LlamaCppEngine } from "./engine/llama-cpp.js";
import { ModelResolver } from "./models/resolver.js";

export interface ServeOptions {
  port: number;
}

export async function serveCommand(options: ServeOptions): Promise<void> {
  const resolver = new ModelResolver();
  const engineCache = new Map<string, LlamaCppEngine>();

  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    // CORS headers for local development
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.method === "POST" && req.url === "/generate") {
      let body = "";

      req.on("data", (chunk) => {
        body += chunk.toString();
      });

      req.on("end", async () => {
        try {
          const { prompt, model, maxTokens, temperature, topP } = JSON.parse(body);

          if (!prompt || !model) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Missing required fields: prompt, model" }));
            return;
          }

          let engine = engineCache.get(model);
          if (!engine || !engine.isLoaded()) {
            engine = new LlamaCppEngine();
            const modelPath = await resolver.resolve(model);
            await engine.loadModel(modelPath);
            engineCache.set(model, engine);
          }

          const result = await engine.generate(prompt, {
            maxTokens,
            temperature,
            topP,
          });

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ text: result.text }));
        } catch (error) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              error: error instanceof Error ? error.message : String(error),
            })
          );
        }
      });
    } else {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not found. Use POST /generate" }));
    }
  });

  server.listen(options.port, () => {
    console.log(`Boole server listening on http://localhost:${options.port}`);
    console.log(`POST to /generate with JSON body: { "prompt": "...", "model": "..." }`);
    console.log(`\nWARNING: This server is for local development only.`);
    console.log(`         No authentication or production hardening.`);
  });

  // Keep the process alive
  await new Promise(() => {});
}
