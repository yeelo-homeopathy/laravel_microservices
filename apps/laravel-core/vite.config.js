import { defineConfig } from "vite"
import laravel from "laravel-vite-plugin"
import react from "@vitejs/plugin-react"
import { resolve } from "path"

export default defineConfig({
  plugins: [
    laravel({
      input: ["resources/css/app.css", "resources/js/app.tsx"],
      refresh: true,
    }),
    react({
      // Enable React Fast Refresh
      fastRefresh: true,
    }),
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "resources/js"),
      "@components": resolve(__dirname, "resources/js/components"),
      "@pages": resolve(__dirname, "resources/js/pages"),
      "@hooks": resolve(__dirname, "resources/js/hooks"),
      "@utils": resolve(__dirname, "resources/js/utils"),
      "@types": resolve(__dirname, "resources/js/types"),
      "@services": resolve(__dirname, "resources/js/services"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    hmr: {
      host: "localhost",
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          router: ["react-router-dom"],
          ui: ["@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu"],
        },
      },
    },
    sourcemap: process.env.NODE_ENV === "development",
  },
})
