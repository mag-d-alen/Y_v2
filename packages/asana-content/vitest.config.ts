import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

export default defineConfig(({ mode }) => {
  const rootEnv = loadEnv(mode, "../..", "");
  for (const [key, value] of Object.entries(rootEnv)) {
    process.env[key] = process.env[key] ?? value;
  }
  return {};
});
