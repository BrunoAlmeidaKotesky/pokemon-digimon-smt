import { defineConfig } from '@playwright/test';

// ALVO=antigo serve o index.html original da raiz; o padrão é a versão nova (build + vite preview).
const antigo = process.env.ALVO === 'antigo';
const PORT = antigo ? 4174 : 4173;

export default defineConfig({
  testDir: './tests',
  testMatch: /.*\.spec\.ts$/,
  fullyParallel: true,
  workers: process.env.CI ? 2 : 4,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 8_000 },
  reporter: process.env.CI ? 'line' : [['list']],
  use: {
    baseURL: `http://localhost:${PORT}/`,
    browserName: 'chromium',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'celular', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 } },
    { name: 'computador', use: { viewport: { width: 1280, height: 800 } } },
  ],
  webServer: {
    command: antigo ? `node tests/serve.mjs . ${PORT}` : `node node_modules/vite/bin/vite.js preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
