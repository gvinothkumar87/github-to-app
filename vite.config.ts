import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import fs from "fs";
import electron from 'vite-plugin-electron/simple'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isMobile = process.env.BUILD_TARGET === 'mobile';
  const isElectron = process.env.ELECTRON === 'true';

  return {
    base: isElectron || isMobile ? './' : '/',
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
      proxy: {
        '/api-gsp-sandbox': {
          target: 'https://gstsandbox.charteredinfo.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api-gsp-sandbox/, '')
        },
        '/api-gsp-prod-primary': {
          target: 'https://einvapi.charteredinfo.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api-gsp-prod-primary/, '')
        },
        '/api-gsp-prod-backup1': {
          target: 'https://einvapimum1.charteredinfo.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api-gsp-prod-backup1/, '')
        },
        '/api-gsp-prod-backup2': {
          target: 'https://einvapidel2.charteredinfo.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api-gsp-prod-backup2/, '')
        }
      }
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
      },
      isElectron && electron({
        main: {
          entry: 'electron/main.ts',
        },
        preload: {
          input: path.join(__dirname, 'electron/preload.ts'),
        },
        renderer: {},
      }),
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
