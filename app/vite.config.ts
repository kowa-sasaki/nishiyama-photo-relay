/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig({
  // 位置情報APIはsecure context（HTTPSまたはlocalhost）でしか動かないため、
  // LAN上の実機（スマホ）からの動作確認にはHTTPSが必要。
  // `npm run dev:https` のときだけ有効にする（通常のlocalhost開発では不要）。
  plugins: [react(), ...(process.env.VITE_HTTPS ? [basicSsl()] : [])],
  server: { host: true },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    globals: true,
  },
})
