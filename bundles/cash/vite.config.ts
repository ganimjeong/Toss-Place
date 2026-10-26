/// <reference types="vitest/config" />
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';

export default defineConfig({
  // Electron 셸이 file:// 로 번들을 열기 때문에 상대 경로로 빌드함
  base: './',
  plugins: [react({ jsxImportSource: '@emotion/react' }), vanillaExtractPlugin()],
  server: { port: 5174, strictPort: true },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
});
