import { afterEach, describe, expect, it, vi } from 'vitest';
import { smt } from './smt';
import { persona } from './persona';
import data from './smt.json';
import personaData from './persona.json';
import { stubFetch } from './test-utils';

afterEach(() => { vi.unstubAllGlobals(); });

describe('smt', () => {
  it('rótulo e chave', () => {
    expect(smt.key).toBe('smt');
    expect(smt.label).toBe('SMT');
    expect(smt.optional).toBeUndefined();
  });

  it('já nasce com os 297 demônios (com os tesouros do P5), imagem local smt/<arquivo>.webp', () => {
    expect(smt.initial).toHaveLength(297);
    expect(smt.initial?.[0]).toEqual({ name: 'Abaddon', img: 'smt/abaddon.webp' });
    expect(smt.initial?.find(x => x.name === 'Abdiel -Fallen-')).toEqual({ name: 'Abdiel -Fallen-', img: 'smt/abdielfallen.webp' });
    expect(smt.initial?.map(x => x.name)).toEqual(data.map(([n]) => n));
    expect(smt.initial?.map(x => x.name)).toEqual(expect.arrayContaining(['Pixie', 'Jack Frost', 'Regent', 'Hope Diamond']));
  });

  it('load() devolve a mesma lista, sem rede', async () => {
    const f = stubFetch();
    const list = await smt.load();
    expect(list).toBe(smt.initial);
    expect(f).not.toHaveBeenCalled();
  });
});

describe('persona', () => {
  it('rótulo e chave', () => {
    expect(persona.key).toBe('persona');
    expect(persona.label).toBe('Persona');
    expect(persona.optional).toBeUndefined();
  });

  it('já nasce com as 95 personas dos personagens (com as Picaro), imagem na mesma pasta smt/', () => {
    expect(persona.initial).toHaveLength(95);
    expect(persona.initial?.find(x => x.name === 'Arsène')).toEqual({ name: 'Arsène', img: 'smt/arsene.webp' });
    expect(persona.initial?.map(x => x.name)).toEqual(personaData.map(([n]) => n));
    expect(persona.initial?.map(x => x.name)).toEqual(expect.arrayContaining(['Izanagi', 'Orpheus', 'Thanatos', 'Satanael', 'Izanagi Picaro', 'Valjean']));
  });

  it('load() devolve a mesma lista, sem rede', async () => {
    const f = stubFetch();
    expect(await persona.load()).toBe(persona.initial);
    expect(f).not.toHaveBeenCalled();
  });

  it('nenhum nome nas duas listas, e juntas são os 392 de antes', () => {
    const a = new Set(data.map(([n]) => n));
    expect(personaData.filter(([n]) => a.has(n))).toEqual([]);
    expect(a.size + personaData.length).toBe(392);
  });
});
