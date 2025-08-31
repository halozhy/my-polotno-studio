import { sentryVitePlugin } from '@sentry/vite-plugin';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import analyzer from 'vite-bundle-analyzer';

import { VitePWA } from "vite-plugin-pwa";


export default defineConfig({
  plugins: [
    react(),
    // sentryVitePlugin({
    //   org: 'polotno',
    //   project: 'polotno-studio',
    // }),
    analyzer(),

    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "robots.txt"],
      devOptions: {
        enabled: true
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        // globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
      },
      // injectRegister: 'inline',
      // strategies: "injectManifest", // 如果有这一行，配置不会生效
      // strategies: "generateSW",
      
      // injectManifest: {
      //   maximumFileSizeToCacheInBytes: 10000000
      // }
      manifest: {
        name: "Polotno Studio",
        short_name: "Polotno",
        start_url: ".",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#2196f3",
        icons: [
          { src: "/icon.png", sizes: "512x512", type: "image/png" }
        ],
      }
    })
  ],

  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          polotno: ["polotno"]
        }
      }
    }
  },
});
