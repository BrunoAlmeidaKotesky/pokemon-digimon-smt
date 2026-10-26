// Ranking às cegas: aparece um personagem por vez e ele vai pra uma posição livre do top; a posição fica travada e
// ninguém vê quem vem depois. Separado = um top por franquia, um depois do outro; misturado = um top só com todas,
// com as vagas divididas igualmente. Lógica pura: o modo solo (state/app.ts) e a sala online (online/rank.ts) usam
// a mesma, cada um com o próprio sorteio.
import type { Entry, FranchiseKey, Item } from '../types';
import { shuffle } from './random';

/** Tamanho do top: mínimo, máximo e padrão. */
export const RANK_SIZE = { min: 3, max: 20, def: 10 } as const;

/** Tamanho dentro dos limites (o que não for número vira o padrão). */
export function rankSize(n: unknown): number {
  return typeof n === 'number' && Number.isFinite(n) ? Math.min(RANK_SIZE.max, Math.max(RANK_SIZE.min, Math.round(n))) : RANK_SIZE.def;
}

export interface RankTop {
  /** franquia do top (separado) ou null (misturado) */
  fr: FranchiseKey | null;
  /** posições do 1º lugar (0) ao último; null = livre */
  slots: (Entry | null)[];
  /** quem ainda vai aparecer neste top, na ordem: o primeiro é o da vez */
  queue: Entry[];
}

export interface Rank {
  size: number;
  mix: boolean;
  tops: RankTop[];
  /** top da vez (índice em tops); igual a tops.length quando acabou */
  cur: number;
}

/** Próximo personagem da franquia `k`, evitando os nomes de `avoid` (o solo usa o saco do navegador; o online, o da sala). */
export type RankDraw = (k: FranchiseKey, avoid: Entry[]) => Entry;

/**
 * Quantos de cada franquia no top misturado: `size` dividido igual, e a sobra da divisão vai pra franquias sorteadas.
 * Franquia com menos personagens que a parte dela dá o que tem, e a diferença vai pras outras que ainda têm.
 */
export function rankCounts(frs: FranchiseKey[], size: number, have: Record<FranchiseKey, number>, rand: () => number): Record<FranchiseKey, number> {
  const counts: Record<FranchiseKey, number> = {};
  frs.forEach(k => (counts[k] = Math.floor(size / frs.length)));
  shuffle([...frs], rand).slice(0, size % frs.length).forEach(k => (counts[k] = (counts[k] as number) + 1));
  let extra = 0;
  for (const k of frs) {
    const cap = have[k] ?? 0;
    if ((counts[k] as number) > cap) { extra += (counts[k] as number) - cap; counts[k] = cap; }
  }
  for (let i = 0; extra > 0 && frs.some(k => (counts[k] as number) < (have[k] ?? 0)); i++) {
    const k = frs[i % frs.length] as FranchiseKey;
    if ((counts[k] as number) < (have[k] ?? 0)) { counts[k] = (counts[k] as number) + 1; extra--; }
  }
  return counts;
}

/** `n` sorteios da franquia, sem repetir nome dentro do mesmo top (`avoid` cresce a cada sorteio). */
function drawMany(k: FranchiseKey, n: number, draw: RankDraw, avoid: Entry[]): Entry[] {
  const out: Entry[] = [];
  for (let i = 0; i < n; i++) {
    const e = draw(k, [...avoid, ...out]);
    out.push({ ...e, fr: k });
  }
  return out;
}

/**
 * Monta o ranking já com a fila de cada top sorteada. `frs` = franquias carregadas, na ordem em que os tops separados
 * aparecem; `lists` = lista de cada uma (só o tamanho importa: top maior que a lista fica do tamanho da lista).
 */
export function startRank(o: { frs: FranchiseKey[]; size: number; mix: boolean; lists: Record<FranchiseKey, Item[]>; draw: RankDraw; rand: () => number }): Rank {
  const size = rankSize(o.size);
  const have = Object.fromEntries(o.frs.map(k => [k, o.lists[k]?.length ?? 0]));
  const top = (fr: FranchiseKey | null, queue: Entry[]): RankTop => ({ fr, slots: queue.map(() => null), queue });
  let tops: RankTop[];
  if (o.mix) {
    const counts = rankCounts(o.frs, size, have, o.rand);
    const queue: Entry[] = [];
    o.frs.forEach(k => queue.push(...drawMany(k, counts[k] ?? 0, o.draw, queue)));
    tops = [top(null, shuffle(queue, o.rand))];
  } else {
    tops = o.frs.map(k => top(k, drawMany(k, Math.min(size, have[k] ?? 0), o.draw, [])));
  }
  tops = tops.filter(t => t.queue.length > 0);
  return { size, mix: o.mix, tops, cur: 0 };
}

/** Top da vez, ou null quando acabou. */
export function rankTop(r: Rank): RankTop | null {
  return r.tops[r.cur] ?? null;
}

/** Personagem da vez (o que vai ser posicionado agora), ou null quando acabou. */
export function rankEntry(r: Rank): Entry | null {
  return rankTop(r)?.queue[0] ?? null;
}

/** Posições livres do top (0 = 1º lugar). */
export function rankFree(t: RankTop): number[] {
  return t.slots.flatMap((e, i) => (e ? [] : [i]));
}

export function rankDone(r: Rank): boolean {
  return r.cur >= r.tops.length;
}

/**
 * Põe o personagem da vez na posição `pos` (0 = 1º lugar) do top da vez e passa pro próximo; top cheio passa pro
 * próximo top. Muda `r`; false = posição ocupada, fora do top ou ranking já acabou.
 */
export function rankPlace(r: Rank, pos: number): boolean {
  const t = rankTop(r);
  if (!t || !Number.isInteger(pos) || pos < 0 || pos >= t.slots.length || t.slots[pos] || !t.queue.length) return false;
  t.slots[pos] = t.queue.shift() as Entry;
  if (!t.queue.length) r.cur++;
  return true;
}
