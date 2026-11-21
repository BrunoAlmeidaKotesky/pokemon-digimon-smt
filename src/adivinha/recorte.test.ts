import { describe, expect, it } from 'vitest';
import { grupoDe, type Grupo } from './grupos';
import { alternarRecorte, ligado, limparRecorte, noRecorte, textoRecorte } from './recorte';

const POKE = grupoDe('pokemon') as Grupo, JOJO = grupoDe('jojo') as Grupo, LOL = grupoDe('lol') as Grupo;

describe('recorte (gerações, partes)', () => {
  it('só Pokémon e JoJo têm, com os valores pedidos', () => {
    expect(POKE.recorte?.campo).toBe('geracao');
    expect(POKE.recorte?.valores.map(v => v.id)).toEqual(['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX']);
    expect(JOJO.recorte?.campo).toBe('parte');
    expect(JOJO.recorte?.valores.map(v => v.rotulo)).toEqual(['Parte 3', 'Parte 4', 'Parte 5', 'Parte 6', 'Parte 7', 'Parte 8', 'Parte 9', 'Kishibe Rohan']);
    expect(JOJO.recorte?.valores.at(-1)?.id).toBe('Thus Spoke Kishibe Rohan');
    expect(LOL.recorte).toBeUndefined();
  });

  it('limpar: só os válidos, na ordem; nenhum, todos, ou grupo sem recorte = null (todos)', () => {
    expect(limparRecorte(POKE, ['III', 'I', 'X'])).toEqual(['I', 'III']);
    expect(limparRecorte(POKE, [])).toBeNull();
    expect(limparRecorte(POKE, ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'])).toBeNull();
    expect(limparRecorte(POKE, 'I')).toBeNull();
    expect(limparRecorte(LOL, ['I'])).toBeNull();
    expect(limparRecorte(undefined, ['I'])).toBeNull();
  });

  it('alternar: pelo menos um fica ligado; ligar todos volta pra null', () => {
    let r = alternarRecorte(POKE, null, 'I');
    expect(r).toEqual(['II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX']);
    r = alternarRecorte(POKE, r, 'I');
    expect(r).toBeNull();
    expect(alternarRecorte(POKE, ['IV'], 'IV')).toEqual(['IV']);
    expect(alternarRecorte(POKE, ['IV'], 'I')).toEqual(['I', 'IV']);
    expect(alternarRecorte(POKE, ['IV'], 'X')).toEqual(['IV']);
    expect(ligado(null, 'I')).toBe(true);
    expect(ligado(['II'], 'I')).toBe(false);
  });

  it('quem entra: o campo tem um dos ligados (campo de lista: basta um)', () => {
    expect(noRecorte(POKE, { geracao: 'I' }, ['I', 'III'])).toBe(true);
    expect(noRecorte(POKE, { geracao: 'II' }, ['I', 'III'])).toBe(false);
    expect(noRecorte(POKE, {}, ['I'])).toBe(false);
    expect(noRecorte(POKE, {}, null)).toBe(true);
    // Echoes: Part 4, Part 5 e The Book
    const echoes = { parte: ['Part 4', 'Part 5', 'The Book'] };
    expect(noRecorte(JOJO, echoes, ['Part 5'])).toBe(true);
    expect(noRecorte(JOJO, echoes, ['Part 3', 'Part 6'])).toBe(false);
    expect(noRecorte(LOL, { classe: 'Mago' }, ['I'])).toBe(true);
  });

  it('texto do resumo', () => {
    expect(textoRecorte(POKE, ['I', 'III'])).toBe('gerações I e III');
    expect(textoRecorte(POKE, ['IV'])).toBe('geração IV');
    expect(textoRecorte(JOJO, ['Part 4', 'Part 5', 'Thus Spoke Kishibe Rohan'])).toBe('Parte 4, Parte 5 e Kishibe Rohan');
    expect(textoRecorte(JOJO, ['Part 7'])).toBe('Parte 7');
    expect(textoRecorte(POKE, null)).toBe('');
  });
});
