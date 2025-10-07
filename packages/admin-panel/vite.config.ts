import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    server: {
      host: "0.0.0.0",
      port: Number.parseInt(env.VITE_PORT || "5173", 10),
    },
    preview: {
      port: Number.parseInt(env.VITE_PORT || "4173", 10),
    },
  };
});
