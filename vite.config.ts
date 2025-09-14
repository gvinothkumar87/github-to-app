import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import fs from "fs";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isMobile = process.env.BUILD_TARGET === 'mobile';
  
  return {
    build: {
      outDir: isMobile ? 'dist-mobile' : 'dist',
      rollupOptions: isMobile ? {
        input: {
          main: path.resolve(__dirname, 'mobile-index.html')
        },
        output: {
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]'
        }
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
      // Custom plugin to copy mobile-index.html to index.html for Capacitor
      isMobile && {
        name: 'mobile-index-copy',
        writeBundle() {
          const srcPath = path.resolve(__dirname, 'dist-mobile/mobile-index.html');
          const destPath = path.resolve(__dirname, 'dist-mobile/index.html');
          if (fs.existsSync(srcPath)) {
            fs.copyFileSync(srcPath, destPath);
          }
        }
      }
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
