import { afterEach, describe, expect, it, vi } from 'vitest';
import { BAGS_KEY, readJSON, STATS_KEY, writeJSON, YGO_KEY } from './storage';
import { installStorage } from './test-helpers';

afterEach(() => vi.unstubAllGlobals());

describe('chaves', () => {
  it('são as do site antigo', () => {
    expect(STATS_KEY).toBe('pdx-stats');
    expect(BAGS_KEY).toBe('pdx-bags');
    expect(YGO_KEY).toBe('pdx-ygo-v1');
  });
});

describe('readJSON', () => {
  it('lê o JSON guardado', () => {
    installStorage({ x: '{"a":[1,2]}', n: '3' });
    expect(readJSON<{ a: number[] }>('x')).toEqual({ a: [1, 2] });
    expect(readJSON<number>('n')).toBe(3);
  });
  it('chave ausente -> null', () => {
    installStorage();
    expect(readJSON('nada')).toBeNull();
  });
  it('JSON inválido -> null', () => {
    installStorage({ x: '{quebrado' });
    expect(readJSON('x')).toBeNull();
  });
  it('sem localStorage -> null', () => {
    vi.stubGlobal('localStorage', undefined);
    expect(readJSON('x')).toBeNull();
  });
  it('getItem que lança -> null', () => {
    vi.stubGlobal('localStorage', { getItem: () => { throw new Error('negado'); } });
    expect(readJSON('x')).toBeNull();
  });
});

describe('writeJSON', () => {
  it('guarda como JSON', () => {
    const s = installStorage();
    writeJSON('k', { a: 1, b: ['x'] });
    expect(s.getItem('k')).toBe('{"a":1,"b":["x"]}');
  });
  it('sem localStorage ou setItem que lança: não quebra', () => {
    vi.stubGlobal('localStorage', undefined);
    expect(() => writeJSON('k', 1)).not.toThrow();
    vi.stubGlobal('localStorage', { setItem: () => { throw new Error('cota'); } });
    expect(() => writeJSON('k', 1)).not.toThrow();
  });
});
