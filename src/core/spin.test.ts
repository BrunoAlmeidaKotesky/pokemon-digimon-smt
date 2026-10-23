import { afterEach, describe, expect, it, vi } from 'vitest';
import { PICK_MS, PICK_MS_CALM, planSpin, spinDelay, spinIndex } from './spin';
import { SEEDS, seedRandom, sequence } from './test-helpers';

afterEach(() => vi.restoreAllMocks());

describe('planSpin', () => {
  it('3 chamadas: start, voltas extras (0/1), passos extras', () => {
    let r = sequence([0.5, 0.7, 0.25]);
    // start = floor(1.5) = 1; total = 3*(3+floor(1.4)) + floor(0.75) = 12
    expect(planSpin(3)).toEqual({ start: 1, total: 12 });
    expect(r.calls()).toBe(3);

    r = sequence([0, 0, 0]);
    expect(planSpin(2)).toEqual({ start: 0, total: 6 });
    expect(r.calls()).toBe(3);

    r = sequence([0.999, 0.999, 0.999]);
    expect(planSpin(2)).toEqual({ start: 1, total: 9 });
    expect(r.calls()).toBe(3);
  });

  it('a 2ª chamada decide as voltas e a 3ª os passos extras (ordem importa)', () => {
    sequence([0.1, 0.9, 0.6]);
    expect(planSpin(5)).toEqual({ start: 0, total: 5 * 4 + 3 });
    sequence([0.1, 0.6, 0.9]);
    expect(planSpin(5)).toEqual({ start: 0, total: 5 * 4 + 4 });
    sequence([0.1, 0.4, 0.9]);
    expect(planSpin(5)).toEqual({ start: 0, total: 5 * 3 + 4 });
  });

  it('total entre 3n e 5n-1', () => {
    seedRandom(77);
    for (let i = 0; i < 200; i++) {
      const n = 2 + (i % 2);
      const { start, total } = planSpin(n);
      expect(start).toBeGreaterThanOrEqual(0);
      expect(start).toBeLessThan(n);
      expect(total).toBeGreaterThanOrEqual(3 * n);
      expect(total).toBeLessThanOrEqual(5 * n - 1);
    }
  });
});

describe('spinDelay / spinIndex / constantes', () => {
  it('spinDelay = 55 + (k/total)^3 * 420', () => {
    expect(spinDelay(0, 10)).toBe(55);
    expect(spinDelay(10, 10)).toBe(475);
    expect(spinDelay(5, 10)).toBeCloseTo(107.5);
  });
  it('spinIndex = (start + k) % n', () => {
    expect(spinIndex(1, 0, 3)).toBe(1);
    expect(spinIndex(1, 2, 3)).toBe(0);
    expect(spinIndex(2, 12, 3)).toBe(2);
  });
  it('esperas do pick', () => {
    expect(PICK_MS).toBe(1000);
    expect(PICK_MS_CALM).toBe(400);
  });
});

// --- referência: o spin() antigo sem DOM/timers; devolve a sequência de cartas acesas e esperas ---
function refSpin(n: number, calm: boolean) {
  const out: { lit: number[]; delays: number[]; picked: number; wait: number } = { lit: [], delays: [], picked: -1, wait: 0 };
  const start = Math.floor(Math.random()*n);
  const total = n*(3 + Math.floor(Math.random()*2)) + Math.floor(Math.random()*n);
  let k = calm ? total : 0;
  for(;;){
    const idx = (start + k) % n;
    out.lit.push(idx);
    if(k >= total){ out.picked = idx; out.wait = calm ? 400 : 1000; return out; }
    k++;
    out.delays.push(55 + Math.pow(k/total, 3) * 420);
  }
}
function newSpin(n: number, calm: boolean) {
  const out: { lit: number[]; delays: number[]; picked: number; wait: number } = { lit: [], delays: [], picked: -1, wait: 0 };
  const { start, total } = planSpin(n);
  let k = calm ? total : 0;
  for (;;) {
    const idx = spinIndex(start, k, n);
    out.lit.push(idx);
    if (k >= total) {
      out.picked = idx;
      out.wait = calm ? PICK_MS_CALM : PICK_MS;
      return out;
    }
    k++;
    out.delays.push(spinDelay(k, total));
  }
}

describe('equivalência com o site antigo (mulberry32)', () => {
  it.each(SEEDS)('roleta completa (normal e calma, 2 e 3 cartas), semente %i', seed => {
    const run = (f: typeof refSpin) => [2, 3, 2, 3, 3, 2].flatMap(n => [f(n, false), f(n, true)]);
    let r = seedRandom(seed);
    const ref = run(refSpin);
    const refCalls = r.calls();
    r = seedRandom(seed);
    expect(run(newSpin)).toEqual(ref);
    expect(r.calls()).toBe(refCalls);
    expect(refCalls).toBe(12 * 3);
  });
});
