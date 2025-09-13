import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isMobile = process.env.BUILD_TARGET === 'mobile';
  
  return {
    build: {
      outDir: isMobile ? 'dist-mobile' : 'dist',
      rollupOptions: isMobile ? {
        input: path.resolve(__dirname, 'index.html')
      } : undefined,
    },
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
      mode === 'development' &&
      componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      __IS_MOBILE__: JSON.stringify(isMobile),
    },
  };
});
