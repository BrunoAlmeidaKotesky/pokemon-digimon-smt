import { defineConfig } from '@playwright/test';

// Teste de fumaça contra o site publicado (internet de verdade). URL: REAL_URL ou o GitHub Pages.
export default defineConfig({
  testDir: './tests/real',
  timeout: 180_000,
  reporter: [['list']],
  use: { baseURL: process.env.REAL_URL ?? 'https://brunoalmeidakotesky.github.io/pokemon-digimon-smt/', browserName: 'chromium' },
  projects: [
    { name: 'computador', use: { viewport: { width: 1280, height: 800 } } },
  ],
});
