/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './': o site fica numa subpasta do GitHub Pages (/pokemon-digimon-smt/).
// __VERSAO_CODIGO__: carimbo deste build. A Autobatalha online compara no aperto de mão (src/autobatalha/online/versao.ts):
// anfitrião e convidado precisam da mesma versão, porque o convidado reproduz a luta com o próprio código.
export default defineConfig({
  base: './',
  plugins: [react()],
  define: { __VERSAO_CODIGO__: JSON.stringify(Date.now().toString(36)) },
  build: { outDir: 'dist', emptyOutDir: true },
  preview: { port: 4173, strictPort: true },
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'docs/**/*.test.mjs'],
    environment: 'node',
  },
});
