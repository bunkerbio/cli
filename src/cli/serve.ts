import { createServer, IncomingMessage, ServerResponse } from "http";
import { App } from "../app.js";
import { Client } from "../client.js";

export interface ServeOptions {
  port: number;
}

export async function serveCommand(options: ServeOptions): Promise<void> {
  const client = new Client();
  const app = new App({ name: "boole-server", client });

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

          const fn = app.function({ model }, async (ctx, _input) => {
            return await ctx.llm.generate(prompt, {
              maxTokens,
              temperature,
              topP,
            });
          });

          const result = await fn.call(null);

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ text: result }));
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
