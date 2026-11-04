// Aleatoriedade da partida: cada sorteio (loja, bots, luta, monstros...) usa um gerador novo derivado da semente e
// de um contador guardado na partida (Partida.sorteios). A mesma semente com as mesmas ações dá a mesma partida, e
// a partida salva e carregada continua igual.
import { criarRng, type Rng } from '../rng';
import type { Partida } from '../tipos';

/** Mistura dois inteiros num terceiro bem espalhado (finalizador do murmur3). */
export function misturar(a: number, b: number): number {
  let h = (a ^ Math.imul(b + 0x632be5ab, 0x9e3779b1)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}

/** Gerador pro próximo sorteio da partida (avança o contador). */
export function rngDa(p: Partida): Rng {
  const n = (p.sorteios ?? 0) + 1;
  p.sorteios = n;
  return criarRng(misturar(p.semente >>> 0, n));
}
