import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const configuredApiBase = env.VITE_API_BASE_URL?.trim();
  const proxyTarget =
    env.VITE_DEV_API_TARGET?.trim() ||
    (configuredApiBase?.startsWith("http") ? configuredApiBase : "http://localhost:8000");

  return {
    plugins: [react(), tailwindcss()],
    server: {
      host: "0.0.0.0",
      port: 3000,
      proxy: {
        "/api": {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
    preview: {
      host: "0.0.0.0",
      port: 3000,
    },
  };
});
