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

/** Gerador do sorteio número n da partida da semente (o mesmo que rngDa dá quando o contador chega em n). */
export const rngDoSorteio = (semente: number, n: number): Rng => criarRng(misturar(semente >>> 0, n));

/** Gerador pro próximo sorteio da partida (avança o contador). */
export function rngDa(p: Partida): Rng {
  const n = (p.sorteios ?? 0) + 1;
  p.sorteios = n;
  return rngDoSorteio(p.semente, n);
}
