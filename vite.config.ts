import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      include: ['buffer', 'process', 'crypto', 'stream', 'util'],
      globals: {
        Buffer: true,
        process: true,
        global: true,
      },
    }),
  ],
  resolve: {
    alias: {
      swapchat: path.resolve(__dirname, '../swapchat_engine/src/index.ts'),
      'vite-plugin-node-polyfills/shims/buffer': path.resolve(__dirname, 'node_modules/vite-plugin-node-polyfills/shims/buffer/dist/index.js'),
      'vite-plugin-node-polyfills/shims/global': path.resolve(__dirname, 'node_modules/vite-plugin-node-polyfills/shims/global/dist/index.js'),
      'vite-plugin-node-polyfills/shims/process': path.resolve(__dirname, 'node_modules/vite-plugin-node-polyfills/shims/process/dist/index.js'),
    },
  },
  server: {
    port: 3000,
  },
})
