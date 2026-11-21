import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseCatalogo, type Catalogo } from '../catalog/model';
import type { Item } from '../types';
import { grupoDe, PARTES_JOJO, SUBMODOS, type Grupo } from './grupos';
import { acharNoPool, montarPool, porNome, sugerir, type EmojiMapa } from './pool';

const raiz = new URL('../../public/catalogo/', import.meta.url);
const real = (k: string) => parseCatalogo(JSON.parse(fs.readFileSync(new URL(`${k}.json`, raiz), 'utf8'))) as Catalogo;
const G = (id: string) => grupoDe(id) as Grupo;
/** lista do site com todos os nomes do catálogo (imagem de mentira) */
const listaDe = (c: Catalogo): Item[] => [...c.itens.keys()].map(n => ({ name: n, img: `img/${n}.png` }));
const cat = (itens: Record<string, Record<string, unknown>>): Catalogo =>
  parseCatalogo({ campos: [{ id: 'parte' }, { id: 'tipo' }, { id: 'variante' }, { id: 'jogo' }, { id: 'raca' }], itens }) as Catalogo;

describe('montarPool', () => {
  it('só quem está na lista do site e no catálogo, em ordem de nome (sem depender do idioma)', () => {
    const c = cat({ Zed: { tipo: 'a' }, Ahri: { tipo: 'b' }, 'Bel\'Veth': { tipo: 'c' }, Ninguem: { tipo: 'd' } });
    const lista = [{ name: 'Zed', img: 'z' }, { name: 'Ahri', img: 'a' }, { name: "Bel'Veth", img: 'b' }, { name: 'Sem Catalogo', img: 's' }];
    const pool = montarPool(G('lol'), 'classico', { listas: { lol: lista }, catalogos: { lol: c }, emojis: {} });
    expect(pool.map(x => x.name)).toEqual(['Ahri', "Bel'Veth", 'Zed']);
    expect(pool[0]).toEqual({ name: 'Ahri', img: 'a', fr: 'lol', info: { tipo: 'b' }, emoji: null });
    expect(['b', 'a', 'B'].map(name => ({ name })).sort(porNome).map(x => x.name)).toEqual(['B', 'a', 'b']);
  });

  it('sem lista ou sem catálogo: a franquia fica de fora (SMT + Persona joga com a que tiver)', () => {
    const smt = cat({ Pixie: { jogo: 'SMT V', raca: 'Fairy' } });
    const persona = cat({ Arsene: { jogo: 'Persona 5' } });
    const listas = { smt: [{ name: 'Pixie', img: 'p' }], persona: [{ name: 'Arsene', img: 'a' }] };
    expect(montarPool(G('megaten'), 'classico', { listas, catalogos: { smt, persona }, emojis: {} }).map(x => [x.name, x.fr])).toEqual([['Arsene', 'persona'], ['Pixie', 'smt']]);
    expect(montarPool(G('megaten'), 'classico', { listas, catalogos: { smt, persona: null }, emojis: {} }).map(x => x.name)).toEqual(['Pixie']);
    expect(montarPool(G('megaten'), 'classico', { listas: { smt: null }, catalogos: { smt, persona }, emojis: {} })).toEqual([]);
  });

  it('Emoji: só quem tem emoji; sem arquivo da franquia, ninguém', () => {
    const c = cat({ Ahri: {}, Zed: {} });
    const lista = [{ name: 'Ahri', img: 'a' }, { name: 'Zed', img: 'z' }];
    const emojis: EmojiMapa = new Map([['Ahri', ['🦊', '💖']]]);
    expect(montarPool(G('lol'), 'emoji', { listas: { lol: lista }, catalogos: { lol: c }, emojis: { lol: emojis } }).map(x => [x.name, x.emoji])).toEqual([['Ahri', ['🦊', '💖']]]);
    expect(montarPool(G('lol'), 'emoji', { listas: { lol: lista }, catalogos: { lol: c }, emojis: { lol: null } })).toEqual([]);
    // nos outros submodos o emoji vem junto, mas não filtra
    expect(montarPool(G('lol'), 'imagem', { listas: { lol: lista }, catalogos: { lol: c }, emojis: { lol: emojis } }).map(x => x.name)).toEqual(['Ahri', 'Zed']);
  });
});

describe('filtros do Adivinha (valem em todos os submodos e no autocompletar)', () => {
  it('Pokémon: só as 1025 espécies, sem Mega, Gigantamax nem formas alternativas', () => {
    const c = real('pokemon');
    expect(c.itens.size).toBe(1270);
    const lista = listaDe(c);
    for (const { id } of SUBMODOS.filter(s => s.id !== 'emoji')) {
      const pool = montarPool(G('pokemon'), id, { listas: { pokemon: lista }, catalogos: { pokemon: c }, emojis: {} });
      expect(pool).toHaveLength(1025);
      const nomes = new Set(pool.map(x => x.name));
      for (const fora of ['Mega Charizard X', 'Gigantamax Charizard', 'Alolan Raichu', 'Giratina (Origin)', 'Rotom (Wash)']) expect(nomes.has(fora), fora).toBe(false);
      for (const fica of ['Charizard', 'Raichu', 'Giratina', 'Rotom', 'Pikachu']) expect(nomes.has(fica), fica).toBe(true);
      // o autocompletar só sugere o que está no pool
      expect(sugerir(pool, 'charizard', new Set()).map(x => x.name)).toEqual(['Charizard']);
      expect(acharNoPool(pool, 'Mega Charizard X')).toBeUndefined();
    }
    // no Emoji, o mesmo filtro: uma Mega com emoji continua de fora
    const emojis: EmojiMapa = new Map([['Charizard', ['🔥']], ['Mega Charizard X', ['🔥', '🐉']]]);
    expect(montarPool(G('pokemon'), 'emoji', { listas: { pokemon: lista }, catalogos: { pokemon: c }, emojis: { pokemon: emojis } }).map(x => x.name)).toEqual(['Charizard']);
  });

  it('JoJo: só Stands do anime e do mangá (Part 3 a 9 ou Kishibe Rohan); sai quem é só de romance, jogo ou evento', () => {
    const c = real('jojo');
    const pool = montarPool(G('jojo'), 'classico', { listas: { jojo: listaDe(c) }, catalogos: { jojo: c }, emojis: {} });
    // o catálogo de agora já vem só com os do anime e do mangá: entram todos os 181
    expect(c.itens.size).toBe(181);
    expect(pool).toHaveLength(181);
    expect(pool.every(x => [x.info.parte ?? []].flat().some(p => PARTES_JOJO.includes(String(p))))).toBe(true);
    // Echoes tem Part 4, Part 5 e The Book: fica; Heaven's Door (Part 4 e Kishibe Rohan) também
    expect(pool.find(x => x.name === 'Echoes')?.info.parte).toEqual(['Part 4', 'Part 5', 'The Book']);
    expect(pool.some(x => x.name === "Heaven's Door")).toBe(true);
    // um catálogo com os de fora (como o antigo): saem
    const misto = cat({
      Echoes: { parte: ['Part 4', 'Part 5', 'The Book'] },
      'Hummingbird Stand': { parte: ['Light Novel'] },
      "Pet Sounds's Stand": { parte: ['Light Novel', 'Other'] },
      'Purple Haze Feedback': { parte: ['Purple Haze Feedback'] },
      Sem: {},
      "Cheap Trick": { parte: ['Thus Spoke Kishibe Rohan'] },
    });
    const lista = [...misto.itens.keys()].map(name => ({ name, img: '' }));
    for (const { id } of SUBMODOS.filter(s => s.id !== 'emoji')) {
      expect(montarPool(G('jojo'), id, { listas: { jojo: lista }, catalogos: { jojo: misto }, emojis: {} }).map(x => x.name)).toEqual(['Cheap Trick', 'Echoes']);
    }
    const emojis: EmojiMapa = new Map([['Echoes', ['🥚']], ['Hummingbird Stand', ['🐦']]]);
    expect(montarPool(G('jojo'), 'emoji', { listas: { jojo: lista }, catalogos: { jojo: misto }, emojis: { jojo: emojis } }).map(x => x.name)).toEqual(['Echoes']);
  });
});

describe('autocompletar', () => {
  const c = cat({ 'Jack Frost': {}, "Jack-o'-Lantern": {}, Pixie: {}, 'Black Frost': {}, Jatayu: {}, Ângela: {} });
  const pool = montarPool(G('megaten'), 'classico', { listas: { smt: [...c.itens.keys()].map(name => ({ name, img: '' })) }, catalogos: { smt: c }, emojis: {} });

  it('sem diferenciar acento e maiúscula; começa com o texto primeiro, depois começo de palavra, depois o resto', () => {
    expect(sugerir(pool, 'ja', new Set()).map(x => x.name)).toEqual(['Jack Frost', "Jack-o'-Lantern", 'Jatayu']);
    expect(sugerir(pool, 'FROST', new Set()).map(x => x.name)).toEqual(['Black Frost', 'Jack Frost']);
    expect(sugerir(pool, 'angela', new Set()).map(x => x.name)).toEqual(['Ângela']);
    expect(sugerir(pool, 'ix', new Set()).map(x => x.name)).toEqual(['Pixie']);
    expect(sugerir(pool, 'lantern', new Set()).map(x => x.name)).toEqual(["Jack-o'-Lantern"]);
  });

  it('sem quem já foi chutado, vazio sem texto, no máximo `max`', () => {
    expect(sugerir(pool, 'ja', new Set(['Jack Frost'])).map(x => x.name)).toEqual(["Jack-o'-Lantern", 'Jatayu']);
    expect(sugerir(pool, '  ', new Set())).toEqual([]);
    expect(sugerir(pool, 'a', new Set(), 2)).toHaveLength(2);
  });

  it('achar pelo nome exato ou sem acento (se só um bater)', () => {
    expect(acharNoPool(pool, 'Pixie')?.name).toBe('Pixie');
    expect(acharNoPool(pool, ' angela ')?.name).toBe('Ângela');
    expect(acharNoPool(pool, 'Pix')).toBeUndefined();
    expect(acharNoPool(pool, 3 as unknown as string)).toBeUndefined();
  });
});
