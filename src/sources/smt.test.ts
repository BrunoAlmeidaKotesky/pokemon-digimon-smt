import { afterEach, describe, expect, it, vi } from 'vitest';
import { smt } from './smt';
import data from './smt.json';
import { stubFetch } from './test-utils';

afterEach(() => { vi.unstubAllGlobals(); });

describe('smt', () => {
  it('rótulo e chave', () => {
    expect(smt.key).toBe('smt');
    expect(smt.label).toBe('SMT/Persona');
    expect(smt.optional).toBeUndefined();
  });

  it('já nasce com os 392 demônios, imagem local smt/<arquivo>.webp', () => {
    expect(smt.initial).toHaveLength(392);
    expect(smt.initial?.[0]).toEqual({ name: 'Abaddon', img: 'smt/abaddon.webp' });
    expect(smt.initial?.find(x => x.name === 'Abdiel -Fallen-')).toEqual({ name: 'Abdiel -Fallen-', img: 'smt/abdielfallen.webp' });
    expect(smt.initial?.map(x => x.name)).toEqual(data.map(([n]) => n));
  });

  it('load() devolve a mesma lista, sem rede', async () => {
    const f = stubFetch();
    const list = await smt.load();
    expect(list).toBe(smt.initial);
    expect(f).not.toHaveBeenCalled();
  });
});
