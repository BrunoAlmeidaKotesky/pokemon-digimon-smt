import { afterEach, describe, expect, it, vi } from 'vitest';
import { rnd, shuffle } from './random';
import { SEEDS, seedRandom, sequence } from './test-helpers';

afterEach(() => vi.restoreAllMocks());

// --- referência: cópia literal do site antigo ---
// (só ganhou tipos/casts; a lógica e a ordem das chamadas são as do index antigo)
const refRnd = <T,>(a: T[]): T => a[Math.floor(Math.random()*a.length)] as T;
const refShuffle = <T,>(a: T[]): T[] => { for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j] as T,a[i] as T];} return a; };

describe('rnd', () => {
  it('usa 1 chamada e escolhe pelo índice floor(r * length)', () => {
    const a = ['a', 'b', 'c', 'd'];
    let s = sequence([0]);
    expect(rnd(a)).toBe('a');
    expect(s.calls()).toBe(1);
    s = sequence([0.5]);
    expect(rnd(a)).toBe('c');
    expect(s.calls()).toBe(1);
    s = sequence([0.9999]);
    expect(rnd(a)).toBe('d');
    expect(s.calls()).toBe(1);
  });

  it('lista vazia: undefined (como o antigo), ainda com 1 chamada', () => {
    const s = sequence([0.3]);
    expect(rnd([])).toBeUndefined();
    expect(s.calls()).toBe(1);
  });
});

describe('shuffle', () => {
  it('Fisher-Yates do fim pro começo: length-1 chamadas, in place, devolve o mesmo array', () => {
    const a = [1, 2, 3, 4];
    const s = sequence([0, 0, 0]);
    const r = shuffle(a);
    expect(r).toBe(a);
    // i=3,j=0 -> [4,2,3,1]; i=2,j=0 -> [3,2,4,1]; i=1,j=0 -> [2,3,4,1]
    expect(a).toEqual([2, 3, 4, 1]);
    expect(s.calls()).toBe(3);
  });

  it('r = 0.5: j = floor(0.5*(i+1))', () => {
    const a = [1, 2, 3, 4];
    sequence([0.5, 0.5, 0.5]);
    // i=3,j=2 -> [1,2,4,3]; i=2,j=1 -> [1,4,2,3]; i=1,j=1 -> igual
    expect(shuffle(a)).toEqual([1, 4, 2, 3]);
  });

  it('r ~ 1: j = i, nada muda', () => {
    sequence([0.999, 0.999, 0.999, 0.999]);
    expect(shuffle(['a', 'b', 'c', 'd', 'e'])).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('0 ou 1 elemento: nenhuma chamada', () => {
    const s = sequence([]);
    expect(shuffle([])).toEqual([]);
    expect(shuffle(['x'])).toEqual(['x']);
    expect(s.calls()).toBe(0);
  });

  it('mantém os mesmos elementos', () => {
    seedRandom(5);
    const a = Array.from({ length: 50 }, (_, i) => i);
    expect([...shuffle([...a])].sort((x, y) => x - y)).toEqual(a);
  });
});

describe('equivalência com o site antigo (mulberry32)', () => {
  it.each(SEEDS)('shuffle e rnd, semente %i', seed => {
    const run = (sh: (a: number[]) => number[], r: (a: number[]) => number) => {
      const out: unknown[] = [];
      for (const len of [0, 1, 2, 3, 10, 151, 1025]) out.push([...sh(Array.from({ length: len }, (_, i) => i))]);
      for (let i = 0; i < 20; i++) out.push(r([10, 20, 30, 40, 50, 60, 70]));
      return out;
    };
    let s = seedRandom(seed);
    const ref = run(refShuffle, refRnd);
    const refCalls = s.calls();
    s = seedRandom(seed);
    const got = run(shuffle, rnd);
    expect(got).toEqual(ref);
    expect(s.calls()).toBe(refCalls);
  });
});
