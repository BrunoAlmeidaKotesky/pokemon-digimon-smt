// Roleta: acende as cartas em sequência, desacelerando, e para numa delas.

/** Espera entre acender a carta escolhida e escolher de fato. */
export const PICK_MS = 1000;
/** O mesmo, com prefers-reduced-motion. */
export const PICK_MS_CALM = 400;

/** Onde começa e quantos passos dá (3 chamadas a Math.random, nesta ordem). */
export function planSpin(n: number): { start: number; total: number } {
  const start = Math.floor(Math.random() * n);
  const total = n * (3 + Math.floor(Math.random() * 2)) + Math.floor(Math.random() * n);
  return { start, total };
}

/** Espera até o próximo passo; `k` é o passo já incrementado (k++ antes do setTimeout, como no antigo). */
export function spinDelay(k: number, total: number): number {
  return 55 + Math.pow(k / total, 3) * 420;
}

/** Carta acesa no passo k. */
export function spinIndex(start: number, k: number, n: number): number {
  return (start + k) % n;
}
