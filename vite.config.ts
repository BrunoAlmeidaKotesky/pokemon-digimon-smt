/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './': o site fica numa subpasta do GitHub Pages (/pokemon-digimon-smt/).
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { outDir: 'dist', emptyOutDir: true },
  preview: { port: 4173, strictPort: true },
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'docs/**/*.test.mjs'],
    environment: 'node',
  },
});
