import { describe, expect, it } from 'vitest';
import type { Entry, Item } from '../types';
import { RANK_SIZE, rankCounts, rankDone, rankEntry, rankFree, rankPlace, rankSize, rankTop, startRank, type RankDraw } from './rank';
import { mulberry32 } from './test-helpers';

const list = (p: string, n: number): Item[] => Array.from({ length: n }, (_, i) => ({ name: `${p}${i + 1}`, img: `${p}${i + 1}.png` }));
const LISTS: Record<string, Item[]> = { pokemon: list('P', 30), digimon: list('D', 30), mini: list('M', 4) };

/** Sorteio de teste: percorre a lista em ordem, pulando quem está em `avoid` (como o saco faz com as 20 tentativas). */
function seqDraw(): RankDraw & { calls: string[] } {
  const next: Record<string, number> = {};
  const calls: string[] = [];
  const fn = ((k: string, avoid: Entry[]) => {
    calls.push(k);
    const l = LISTS[k]!;
    for (let t = 0; t < l.length; t++) {
      const it = l[(next[k] = ((next[k] ?? -1) + 1) % l.length)]!;
      if (!avoid.some(a => a.name === it.name)) return { ...it, fr: k };
    }
    return { ...l[0]!, fr: k };
  }) as RankDraw & { calls: string[] };
  fn.calls = calls;
  return fn;
}

describe('rankSize', () => {
  it('fica entre o mínimo e o máximo; o que não é número vira o padrão', () => {
    expect(rankSize(10)).toBe(10);
    expect(rankSize(1)).toBe(RANK_SIZE.min);
    expect(rankSize(99)).toBe(RANK_SIZE.max);
    expect(rankSize(7.6)).toBe(8);
    expect(rankSize('10')).toBe(RANK_SIZE.def);
    expect(rankSize(NaN)).toBe(RANK_SIZE.def);
  });
});

describe('rankCounts (misturado, dividido igual)', () => {
  const rand = mulberry32(1);
  it('divide igual e a sobra vai pra franquias sorteadas', () => {
    const c = rankCounts(['a', 'b', 'c'], 10, { a: 99, b: 99, c: 99 }, rand);
    expect(Object.values(c).sort()).toEqual([3, 3, 4]);
    expect(c.a! + c.b! + c.c!).toBe(10);
  });

  it('franquia pequena dá o que tem e o resto vai pras outras', () => {
    const c = rankCounts(['a', 'b'], 10, { a: 2, b: 99 }, rand);
    expect(c).toEqual({ a: 2, b: 8 });
  });

  it('se ninguém tem mais, o top fica menor', () => {
    const c = rankCounts(['a', 'b'], 10, { a: 2, b: 3 }, rand);
    expect(c).toEqual({ a: 2, b: 3 });
  });
});

describe('startRank', () => {
  it('separado: um top por franquia, na ordem, com o tamanho pedido', () => {
    const draw = seqDraw();
    const r = startRank({ frs: ['digimon', 'pokemon'], size: 5, mix: false, lists: LISTS, draw, rand: mulberry32(2) });
    expect(r.size).toBe(5);
    expect(r.mix).toBe(false);
    expect(r.cur).toBe(0);
    expect(r.tops.map(t => t.fr)).toEqual(['digimon', 'pokemon']);
    expect(r.tops.map(t => t.slots)).toEqual([[null, null, null, null, null], [null, null, null, null, null]]);
    expect(r.tops[0]!.queue.map(e => e.name)).toEqual(['D1', 'D2', 'D3', 'D4', 'D5']);
    expect(r.tops[0]!.queue.every(e => e.fr === 'digimon')).toBe(true);
    expect(draw.calls).toEqual([...Array(5).fill('digimon'), ...Array(5).fill('pokemon')]);
  });

  it('separado: franquia com menos personagens que o top fica com top menor', () => {
    const r = startRank({ frs: ['mini'], size: 10, mix: false, lists: LISTS, draw: seqDraw(), rand: mulberry32(3) });
    expect(r.tops[0]!.slots).toHaveLength(4);
    expect(new Set(r.tops[0]!.queue.map(e => e.name)).size).toBe(4);
  });

  it('misturado: um top só, vagas divididas igual, ordem embaralhada e sem nome repetido', () => {
    const r = startRank({ frs: ['pokemon', 'digimon'], size: 10, mix: true, lists: LISTS, draw: seqDraw(), rand: mulberry32(4) });
    expect(r.tops).toHaveLength(1);
    expect(r.tops[0]!.fr).toBeNull();
    const q = r.tops[0]!.queue;
    expect(q).toHaveLength(10);
    expect(q.filter(e => e.fr === 'pokemon')).toHaveLength(5);
    expect(q.filter(e => e.fr === 'digimon')).toHaveLength(5);
    expect(q.map(e => e.fr)).not.toEqual([...Array(5).fill('pokemon'), ...Array(5).fill('digimon')]);
    expect(new Set(q.map(e => e.name)).size).toBe(10);
  });

  it('tamanho fora dos limites é corrigido', () => {
    const r = startRank({ frs: ['pokemon'], size: 99, mix: false, lists: LISTS, draw: seqDraw(), rand: mulberry32(5) });
    expect(r.size).toBe(RANK_SIZE.max);
    expect(r.tops[0]!.slots).toHaveLength(RANK_SIZE.max);
  });

  it('franquia sem personagens não vira top', () => {
    const r = startRank({ frs: ['pokemon', 'vazia'], size: 3, mix: false, lists: { ...LISTS, vazia: [] }, draw: seqDraw(), rand: mulberry32(6) });
    expect(r.tops.map(t => t.fr)).toEqual(['pokemon']);
  });
});

describe('rankPlace', () => {
  const novo = () => startRank({ frs: ['pokemon', 'digimon'], size: 3, mix: false, lists: LISTS, draw: seqDraw(), rand: mulberry32(7) });

  it('põe o da vez na posição livre, trava e passa pro próximo', () => {
    const r = novo();
    expect(rankEntry(r)!.name).toBe('P1');
    expect(rankPlace(r, 2)).toBe(true);
    expect(rankTop(r)!.slots.map(e => e?.name ?? null)).toEqual([null, null, 'P1']);
    expect(rankFree(rankTop(r)!)).toEqual([0, 1]);
    expect(rankEntry(r)!.name).toBe('P2');
    // posição ocupada, fora do top ou não inteira: nada muda
    expect(rankPlace(r, 2)).toBe(false);
    expect(rankPlace(r, 3)).toBe(false);
    expect(rankPlace(r, -1)).toBe(false);
    expect(rankPlace(r, 0.5)).toBe(false);
    expect(rankEntry(r)!.name).toBe('P2');
  });

  it('top cheio passa pro próximo; no fim acabou', () => {
    const r = novo();
    rankPlace(r, 0); rankPlace(r, 1); rankPlace(r, 2);
    expect(r.cur).toBe(1);
    expect(r.tops[0]!.slots.map(e => e!.name)).toEqual(['P1', 'P2', 'P3']);
    expect(rankTop(r)!.fr).toBe('digimon');
    expect(rankEntry(r)!.name).toBe('D1');
    rankPlace(r, 1); rankPlace(r, 0); rankPlace(r, 2);
    expect(rankDone(r)).toBe(true);
    expect(rankTop(r)).toBeNull();
    expect(rankEntry(r)).toBeNull();
    expect(r.tops[1]!.slots.map(e => e!.name)).toEqual(['D2', 'D1', 'D3']);
    expect(rankPlace(r, 0)).toBe(false);
  });
});
