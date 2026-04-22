import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      swapchat: path.resolve(__dirname, '../swapchat_engine/src/index.ts'),
      buffer: 'buffer',
      stream: 'stream-browserify',
      crypto: 'crypto-browserify',
    },
  },
  server: {
    port: 3000,
  },
  optimizeDeps: {
    include: ['buffer', 'process'],
  },
})
