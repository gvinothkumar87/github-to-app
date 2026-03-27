// vite.config.ts
import { defineConfig } from "file:///D:/git/CASH%20LEDGER/github-to-app123/node_modules/vite/dist/node/index.js";
import react from "file:///D:/git/CASH%20LEDGER/github-to-app123/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
import { componentTagger } from "file:///D:/git/CASH%20LEDGER/github-to-app123/node_modules/lovable-tagger/dist/index.js";
import fs from "fs";
import electron from "file:///D:/git/CASH%20LEDGER/github-to-app123/node_modules/vite-plugin-electron/dist/simple.mjs";
var __vite_injected_original_dirname = "D:\\git\\CASH LEDGER\\github-to-app123";
var vite_config_default = defineConfig(({ mode }) => {
  const isMobile = process.env.BUILD_TARGET === "mobile";
  const isElectron = process.env.ELECTRON === "true";
  return {
    base: isElectron || isMobile ? "./" : "/",
    build: {
      outDir: isMobile ? "dist-mobile" : "dist",
      rollupOptions: isMobile ? {
        input: {
          main: path.resolve(__vite_injected_original_dirname, "mobile-index.html")
        },
        output: {
          entryFileNames: "assets/[name]-[hash].js",
          assetFileNames: "assets/[name]-[hash].[ext]"
        }
      } : void 0
    },
    server: {
      host: "::",
      port: 8080
    },
    plugins: [
      react(),
      mode === "development" && componentTagger(),
      // Custom plugin to copy mobile-index.html to index.html for Capacitor
      isMobile && {
        name: "mobile-index-copy",
        writeBundle() {
          const srcPath = path.resolve(__vite_injected_original_dirname, "dist-mobile/mobile-index.html");
          const destPath = path.resolve(__vite_injected_original_dirname, "dist-mobile/index.html");
          if (fs.existsSync(srcPath)) {
            fs.copyFileSync(srcPath, destPath);
          }
        }
      },
      isElectron && electron({
        main: {
          entry: "electron/main.ts"
        },
        preload: {
          input: path.join(__vite_injected_original_dirname, "electron/preload.ts")
        },
        renderer: {}
      })
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__vite_injected_original_dirname, "./src")
      }
    },
    define: {
      __IS_MOBILE__: JSON.stringify(isMobile)
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxnaXRcXFxcQ0FTSCBMRURHRVJcXFxcZ2l0aHViLXRvLWFwcDEyM1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRDpcXFxcZ2l0XFxcXENBU0ggTEVER0VSXFxcXGdpdGh1Yi10by1hcHAxMjNcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0Q6L2dpdC9DQVNIJTIwTEVER0VSL2dpdGh1Yi10by1hcHAxMjMvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xyXG5pbXBvcnQgcmVhY3QgZnJvbSBcIkB2aXRlanMvcGx1Z2luLXJlYWN0LXN3Y1wiO1xyXG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xyXG5pbXBvcnQgeyBjb21wb25lbnRUYWdnZXIgfSBmcm9tIFwibG92YWJsZS10YWdnZXJcIjtcclxuaW1wb3J0IGZzIGZyb20gXCJmc1wiO1xyXG5pbXBvcnQgZWxlY3Ryb24gZnJvbSAndml0ZS1wbHVnaW4tZWxlY3Ryb24vc2ltcGxlJ1xyXG5cclxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4ge1xyXG4gIGNvbnN0IGlzTW9iaWxlID0gcHJvY2Vzcy5lbnYuQlVJTERfVEFSR0VUID09PSAnbW9iaWxlJztcclxuICBjb25zdCBpc0VsZWN0cm9uID0gcHJvY2Vzcy5lbnYuRUxFQ1RST04gPT09ICd0cnVlJztcclxuXHJcbiAgcmV0dXJuIHtcclxuICAgIGJhc2U6IGlzRWxlY3Ryb24gfHwgaXNNb2JpbGUgPyAnLi8nIDogJy8nLFxyXG4gICAgYnVpbGQ6IHtcclxuICAgICAgb3V0RGlyOiBpc01vYmlsZSA/ICdkaXN0LW1vYmlsZScgOiAnZGlzdCcsXHJcbiAgICAgIHJvbGx1cE9wdGlvbnM6IGlzTW9iaWxlID8ge1xyXG4gICAgICAgIGlucHV0OiB7XHJcbiAgICAgICAgICBtYWluOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnbW9iaWxlLWluZGV4Lmh0bWwnKVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgb3V0cHV0OiB7XHJcbiAgICAgICAgICBlbnRyeUZpbGVOYW1lczogJ2Fzc2V0cy9bbmFtZV0tW2hhc2hdLmpzJyxcclxuICAgICAgICAgIGFzc2V0RmlsZU5hbWVzOiAnYXNzZXRzL1tuYW1lXS1baGFzaF0uW2V4dF0nXHJcbiAgICAgICAgfVxyXG4gICAgICB9IDogdW5kZWZpbmVkLFxyXG4gICAgfSxcclxuICAgIHNlcnZlcjoge1xyXG4gICAgICBob3N0OiBcIjo6XCIsXHJcbiAgICAgIHBvcnQ6IDgwODAsXHJcbiAgICB9LFxyXG4gICAgcGx1Z2luczogW1xyXG4gICAgICByZWFjdCgpLFxyXG4gICAgICBtb2RlID09PSAnZGV2ZWxvcG1lbnQnICYmXHJcbiAgICAgIGNvbXBvbmVudFRhZ2dlcigpLFxyXG4gICAgICAvLyBDdXN0b20gcGx1Z2luIHRvIGNvcHkgbW9iaWxlLWluZGV4Lmh0bWwgdG8gaW5kZXguaHRtbCBmb3IgQ2FwYWNpdG9yXHJcbiAgICAgIGlzTW9iaWxlICYmIHtcclxuICAgICAgICBuYW1lOiAnbW9iaWxlLWluZGV4LWNvcHknLFxyXG4gICAgICAgIHdyaXRlQnVuZGxlKCkge1xyXG4gICAgICAgICAgY29uc3Qgc3JjUGF0aCA9IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICdkaXN0LW1vYmlsZS9tb2JpbGUtaW5kZXguaHRtbCcpO1xyXG4gICAgICAgICAgY29uc3QgZGVzdFBhdGggPSBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnZGlzdC1tb2JpbGUvaW5kZXguaHRtbCcpO1xyXG4gICAgICAgICAgaWYgKGZzLmV4aXN0c1N5bmMoc3JjUGF0aCkpIHtcclxuICAgICAgICAgICAgZnMuY29weUZpbGVTeW5jKHNyY1BhdGgsIGRlc3RQYXRoKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH0sXHJcbiAgICAgIGlzRWxlY3Ryb24gJiYgZWxlY3Ryb24oe1xyXG4gICAgICAgIG1haW46IHtcclxuICAgICAgICAgIGVudHJ5OiAnZWxlY3Ryb24vbWFpbi50cycsXHJcbiAgICAgICAgfSxcclxuICAgICAgICBwcmVsb2FkOiB7XHJcbiAgICAgICAgICBpbnB1dDogcGF0aC5qb2luKF9fZGlybmFtZSwgJ2VsZWN0cm9uL3ByZWxvYWQudHMnKSxcclxuICAgICAgICB9LFxyXG4gICAgICAgIHJlbmRlcmVyOiB7fSxcclxuICAgICAgfSksXHJcbiAgICBdLmZpbHRlcihCb29sZWFuKSxcclxuICAgIHJlc29sdmU6IHtcclxuICAgICAgYWxpYXM6IHtcclxuICAgICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKSxcclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgICBkZWZpbmU6IHtcclxuICAgICAgX19JU19NT0JJTEVfXzogSlNPTi5zdHJpbmdpZnkoaXNNb2JpbGUpLFxyXG4gICAgfSxcclxuICB9O1xyXG59KTtcclxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFxUyxTQUFTLG9CQUFvQjtBQUNsVSxPQUFPLFdBQVc7QUFDbEIsT0FBTyxVQUFVO0FBQ2pCLFNBQVMsdUJBQXVCO0FBQ2hDLE9BQU8sUUFBUTtBQUNmLE9BQU8sY0FBYztBQUxyQixJQUFNLG1DQUFtQztBQVF6QyxJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLEtBQUssTUFBTTtBQUN4QyxRQUFNLFdBQVcsUUFBUSxJQUFJLGlCQUFpQjtBQUM5QyxRQUFNLGFBQWEsUUFBUSxJQUFJLGFBQWE7QUFFNUMsU0FBTztBQUFBLElBQ0wsTUFBTSxjQUFjLFdBQVcsT0FBTztBQUFBLElBQ3RDLE9BQU87QUFBQSxNQUNMLFFBQVEsV0FBVyxnQkFBZ0I7QUFBQSxNQUNuQyxlQUFlLFdBQVc7QUFBQSxRQUN4QixPQUFPO0FBQUEsVUFDTCxNQUFNLEtBQUssUUFBUSxrQ0FBVyxtQkFBbUI7QUFBQSxRQUNuRDtBQUFBLFFBQ0EsUUFBUTtBQUFBLFVBQ04sZ0JBQWdCO0FBQUEsVUFDaEIsZ0JBQWdCO0FBQUEsUUFDbEI7QUFBQSxNQUNGLElBQUk7QUFBQSxJQUNOO0FBQUEsSUFDQSxRQUFRO0FBQUEsTUFDTixNQUFNO0FBQUEsTUFDTixNQUFNO0FBQUEsSUFDUjtBQUFBLElBQ0EsU0FBUztBQUFBLE1BQ1AsTUFBTTtBQUFBLE1BQ04sU0FBUyxpQkFDVCxnQkFBZ0I7QUFBQTtBQUFBLE1BRWhCLFlBQVk7QUFBQSxRQUNWLE1BQU07QUFBQSxRQUNOLGNBQWM7QUFDWixnQkFBTSxVQUFVLEtBQUssUUFBUSxrQ0FBVywrQkFBK0I7QUFDdkUsZ0JBQU0sV0FBVyxLQUFLLFFBQVEsa0NBQVcsd0JBQXdCO0FBQ2pFLGNBQUksR0FBRyxXQUFXLE9BQU8sR0FBRztBQUMxQixlQUFHLGFBQWEsU0FBUyxRQUFRO0FBQUEsVUFDbkM7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBLE1BQ0EsY0FBYyxTQUFTO0FBQUEsUUFDckIsTUFBTTtBQUFBLFVBQ0osT0FBTztBQUFBLFFBQ1Q7QUFBQSxRQUNBLFNBQVM7QUFBQSxVQUNQLE9BQU8sS0FBSyxLQUFLLGtDQUFXLHFCQUFxQjtBQUFBLFFBQ25EO0FBQUEsUUFDQSxVQUFVLENBQUM7QUFBQSxNQUNiLENBQUM7QUFBQSxJQUNILEVBQUUsT0FBTyxPQUFPO0FBQUEsSUFDaEIsU0FBUztBQUFBLE1BQ1AsT0FBTztBQUFBLFFBQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLE1BQ3RDO0FBQUEsSUFDRjtBQUFBLElBQ0EsUUFBUTtBQUFBLE1BQ04sZUFBZSxLQUFLLFVBQVUsUUFBUTtBQUFBLElBQ3hDO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
