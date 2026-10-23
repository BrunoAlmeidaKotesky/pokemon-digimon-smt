import { describe, expect, it } from 'vitest';
import { KEYS, LABELS, SOURCES, nice, resolve } from './index';
import { resolve as resolveDireto } from './resolve';
import { nice as niceDireto } from './text';

describe('SOURCES / KEYS / LABELS', () => {
  it('as sete franquias, na ordem do site', () => {
    expect(KEYS).toEqual(['pokemon', 'digimon', 'smt', 'jojo', 'ygo', 'bakugan', 'sujimon']);
    expect(SOURCES.map(s => s.key)).toEqual(KEYS);
  });

  it('rótulos', () => {
    expect(LABELS).toEqual({
      pokemon: 'Pokémon', digimon: 'Digimon', smt: 'SMT/Persona', jojo: 'JoJo', ygo: 'Yu-Gi-Oh!', bakugan: 'Bakugan', sujimon: 'Sujimon',
    });
  });

  it('só Sujimon é opcional, só SMT tem lista pronta', () => {
    expect(SOURCES.filter(s => s.optional).map(s => s.key)).toEqual(['sujimon']);
    expect(SOURCES.filter(s => s.initial).map(s => s.key)).toEqual(['smt']);
  });

  it('reexporta nice e resolve', () => {
    expect(nice).toBe(niceDireto);
    expect(resolve).toBe(resolveDireto);
  });
});
