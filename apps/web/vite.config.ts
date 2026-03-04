import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

export default defineConfig({
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true
    }),
    react()
  ],
  server: {
    port: 3000,
    allowedHosts: true,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path, // explicitly preserve the full path
      }
    }
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "~types": fileURLToPath(new URL("./src/types", import.meta.url)),
      "~components": fileURLToPath(new URL("./src/components", import.meta.url)),
      "~features": fileURLToPath(new URL("./src/features", import.meta.url)),
      "~hooks": fileURLToPath(new URL("./src/hooks", import.meta.url)),
      "~lib": fileURLToPath(new URL("./src/lib", import.meta.url)),
      "~providers": fileURLToPath(new URL("./src/providers", import.meta.url)),
      "~theme": fileURLToPath(new URL("./src/theme", import.meta.url))
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          router: ["@tanstack/react-router", "@tanstack/react-query"],
          mui: ["@mui/material", "@mui/icons-material", "@emotion/react", "@emotion/styled"]
        }
      }
    }
  }
});

