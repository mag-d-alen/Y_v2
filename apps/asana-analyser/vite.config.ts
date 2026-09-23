import type { IncomingMessage, ServerResponse } from "node:http";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react";

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req as AsyncIterable<Buffer>) {
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf-8"));
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function modelPhotoDetectionBridge(): Plugin {
  return {
    name: "model-photo-detection-bridge",
    configureServer(server: ViteDevServer) {
      server.middlewares.use("/api/list-photos", async (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end();
          return;
        }
        try {
          const { folderPath } = (await readJsonBody(req)) as { folderPath: string };
          const mod = (await server.ssrLoadModule(
            "@y-v2/asana-content/detection/listPhotoPathsInFolder.js",
          )) as typeof import("@y-v2/asana-content/detection/listPhotoPathsInFolder.js");
          sendJson(res, 200, { photoPaths: mod.listPhotoPathsInFolder(folderPath) });
        } catch (error) {
          sendJson(res, 500, { error: error instanceof Error ? error.message : String(error) });
        }
      });

      server.middlewares.use("/api/detect-pose", async (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end();
          return;
        }
        try {
          const { photoPaths } = (await readJsonBody(req)) as { photoPaths: string[] };
          const mod = (await server.ssrLoadModule(
            "@y-v2/asana-content/detection/BlazePoseJointDetector.js",
          )) as typeof import("@y-v2/asana-content/detection/BlazePoseJointDetector.js");
          const detector = new mod.BlazePoseJointDetector();
          const detectedJoints = await detector.detect(photoPaths);
          sendJson(res, 200, detectedJoints);
        } catch (error) {
          sendJson(res, 500, { error: error instanceof Error ? error.message : String(error) });
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), modelPhotoDetectionBridge()],
  envDir: fileURLToPath(new URL("../..", import.meta.url)),
  publicDir: fileURLToPath(new URL("../../packages/asana-content/assets", import.meta.url)),
});
