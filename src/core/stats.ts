// Placar: vitórias/aparições por franquia, histórico dos últimos 30 confrontos e a maior sequência.
import type { Entry, Stats } from '../types';
import { readJSON, STATS_KEY, writeJSON } from './storage';

export function emptyStats(): Stats {
  return { w: {}, n: {}, hist: [], best: null };
}

/** Lê localStorage['pdx-stats'] como o antigo: inválido/ausente vira placar zerado; sem `best` vira best: null. */
export function loadStats(): Stats {
  let stats = (readJSON<Stats>(STATS_KEY) || null) as Stats | null;
  if (!stats) stats = { w: {}, n: {}, hist: [] } as unknown as Stats;
  stats.best = stats.best || null;
  return stats;
}

export function saveStats(s: Stats): void {
  writeJSON(STATS_KEY, s);
}

/** Conta um confronto (muta `s`, não salva). `all` inclui o vencedor; perdedores = todos os outros (por identidade). */
export function record(s: Stats, winner: Entry, all: Entry[], label: (k: string) => string): void {
  s.w[winner.fr] = (s.w[winner.fr] || 0) + 1;
  all.forEach(x => (s.n[x.fr] = (s.n[x.fr] || 0) + 1));
  const losers = all
    .filter(x => x !== winner)
    .map(x => `${x.name} (${label(x.fr)})`)
    .join(', ');
  s.hist.unshift(`${winner.name} (${label(winner.fr)}) venceu ${losers}`);
  s.hist = s.hist.slice(0, 30);
}

/** Troca a maior sequência se não houver nenhuma ou se `streak` for maior. Devolve se trocou (aí quem chama salva). */
export function updateBest(s: Stats, e: Entry, streak: number): boolean {
  if (!s.best || streak > s.best.streak) {
    s.best = { name: e.name, fr: e.fr, streak };
    return true;
  }
  return false;
}

/** Barra do placar de uma franquia. */
export function meter(s: Stats, k: string): { w: number; n: number; pct: number } {
  const w = s.w[k] || 0;
  const n = s.n[k] || 0;
  const pct = n ? Math.round((w / n) * 100) : 0;
  return { w, n, pct };
}
