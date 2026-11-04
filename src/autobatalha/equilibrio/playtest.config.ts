// Config do playtest automático da Autobatalha (docs/tft/matematica/README.md, "Playtest"). Separada do
// vite.config.ts pra o `vitest run` normal (e o CI) não rodar as simulações longas: aqui só entram os *.playtest.ts.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/autobatalha/equilibrio/**/*.playtest.ts'],
    environment: 'node',
    // as simulações levam minutos
    testTimeout: 0,
    hookTimeout: 0,
  },
});
