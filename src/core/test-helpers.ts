// Utilidades só dos testes de src/core (não é importado pelo app).
import { vi } from 'vitest';

/** Mesmo gerador dos testes de ponta a ponta (tests/helpers.ts). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface RandomSpy {
  /** quantas vezes Math.random foi chamado desde o último seed/sequence */
  calls(): number;
}

/** Troca Math.random por mulberry32(seed), contando as chamadas. Desfazer com vi.restoreAllMocks(). */
export function seedRandom(seed: number): RandomSpy {
  vi.restoreAllMocks();
  const g = mulberry32(seed);
  let n = 0;
  vi.spyOn(Math, 'random').mockImplementation(() => {
    n++;
    return g();
  });
  return { calls: () => n };
}

/** Math.random devolve exatamente estes valores, nesta ordem (erro se pedir mais). */
export function sequence(values: number[]): RandomSpy {
  vi.restoreAllMocks();
  let n = 0;
  vi.spyOn(Math, 'random').mockImplementation(() => {
    if (n >= values.length) throw new Error(`Math.random chamado mais de ${values.length} vezes`);
    return values[n++] as number;
  });
  return { calls: () => n };
}

/** localStorage falso em memória. */
export class MemoryStorage {
  readonly data = new Map<string, string>();
  constructor(init: Record<string, string> = {}) {
    Object.entries(init).forEach(([k, v]) => this.data.set(k, v));
  }
  get length(): number {
    return this.data.size;
  }
  clear(): void {
    this.data.clear();
  }
  getItem(k: string): string | null {
    return this.data.has(k) ? (this.data.get(k) as string) : null;
  }
  key(i: number): string | null {
    return [...this.data.keys()][i] ?? null;
  }
  removeItem(k: string): void {
    this.data.delete(k);
  }
  setItem(k: string, v: string): void {
    this.data.set(k, String(v));
  }
}

/** Instala um localStorage falso (vi.stubGlobal). Desfazer com vi.unstubAllGlobals(). */
export function installStorage(init: Record<string, string> = {}): MemoryStorage {
  const s = new MemoryStorage(init);
  vi.stubGlobal('localStorage', s);
  return s;
}

/** Lista de personagens 'P0'..'P{n-1}' de mentira. */
export function makeList(prefix: string, n: number): { name: string; img: string }[] {
  return Array.from({ length: n }, (_, i) => ({ name: `${prefix}${i}`, img: `${prefix.toLowerCase()}/${i}.png` }));
}

export const SEEDS = [1, 7, 42, 1234, 99999, 2026];
