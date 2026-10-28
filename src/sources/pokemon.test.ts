import { afterEach, describe, expect, it, vi } from 'vitest';
import { formName, pokemon, POKEMON_FORMS_URL, POKEMON_URL } from './pokemon';
import { json, stubFetch, text, urls } from './test-utils';

afterEach(() => { vi.unstubAllGlobals(); });

const ART = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/';

describe('pokemon', () => {
  it('rótulo e chave', () => {
    expect(pokemon.key).toBe('pokemon');
    expect(pokemon.label).toBe('Pokémon');
    expect(pokemon.optional).toBeUndefined();
    expect(pokemon.initial).toBeUndefined();
  });

  it('carrega as 40 espécies com nome formatado e arte oficial pelo id da URL', async () => {
    const f = stubFetch();
    const list = await pokemon.load();
    expect(list.slice(0, 40)).toHaveLength(40);
    expect(list[0]).toEqual({ name: 'Bulbasaur', img: ART + '1.png' });
    expect(list.find(x => x.name === 'Nidoran F')).toEqual({ name: 'Nidoran F', img: ART + '29.png' });
    expect(list.map(x => x.name)).toContain('Nidoran M');
    expect(list.every(x => x.href === undefined)).toBe(true);
    expect(urls(f)).toEqual([POKEMON_URL, POKEMON_FORMS_URL]);
    expect(POKEMON_URL).toBe('https://pokeapi.co/api/v2/pokemon-species?limit=2000');
    expect(POKEMON_FORMS_URL).toBe('https://pokeapi.co/api/v2/pokemon?limit=2000');
  });

  it('depois das espécies vêm as Megas, Gigantamax, Primais e formas regionais; totem e afins ficam de fora', async () => {
    stubFetch();
    const list = await pokemon.load();
    expect(list.slice(40)).toEqual([
      { name: 'Alolan Raichu', img: ART + '10100.png' },
      { name: 'Mega Charizard X', img: ART + '10034.png' },
      { name: 'Primal Kyogre', img: ART + '10077.png' },
      { name: 'Paldean Tauros (Combat Breed)', img: ART + '10250.png' },
      { name: 'Galarian Darmanitan', img: ART + '10177.png' },
      { name: 'Galarian Mr Mime', img: ART + '10168.png' },
      { name: 'Gigantamax Charizard', img: ART + '10196.png' },
    ]);
  });

  it('se a lista das formas falhar, ficam só as espécies', async () => {
    stubFetch(u => (u.pathname === '/api/v2/pokemon' ? text('erro', 500) : undefined));
    expect(await pokemon.load()).toHaveLength(40);
    stubFetch(u => (u.pathname === '/api/v2/pokemon' ? Promise.reject(new TypeError('sem rede')) : undefined));
    expect(await pokemon.load()).toHaveLength(40);
  });

  it('forma com nome igual ao de uma espécie não entra duas vezes', async () => {
    stubFetch(u => (u.pathname === '/api/v2/pokemon'
      ? json({ results: [{ name: 'raichu-alola', url: 'x/10100/' }, { name: 'raichu-alola', url: 'x/10100/' }] })
      : undefined));
    expect((await pokemon.load()).filter(x => x.name === 'Alolan Raichu')).toHaveLength(1);
  });

  it('falha se o fetch das espécies rejeitar', async () => {
    stubFetch(() => Promise.reject(new TypeError('sem rede')));
    await expect(pokemon.load()).rejects.toThrow('sem rede');
  });

  it('falha se a resposta das espécies não for JSON (ex.: erro 500)', async () => {
    stubFetch(() => text('erro', 500));
    await expect(pokemon.load()).rejects.toThrow();
  });
});

describe('formName', () => {
  it('Megas, com X, Y e Z no fim', () => {
    expect(formName('venusaur-mega')).toBe('Mega Venusaur');
    expect(formName('charizard-mega-x')).toBe('Mega Charizard X');
    expect(formName('mewtwo-mega-y')).toBe('Mega Mewtwo Y');
    expect(formName('absol-mega-z')).toBe('Mega Absol Z');
    expect(formName('meowstic-male-mega')).toBe('Mega Meowstic Male');
  });

  it('Primais e formas regionais, com o nome da espécie igual ao do site', () => {
    expect(formName('kyogre-primal')).toBe('Primal Kyogre');
    expect(formName('raichu-alola')).toBe('Alolan Raichu');
    expect(formName('mr-mime-galar')).toBe('Galarian Mr Mime');
    expect(formName('zorua-hisui')).toBe('Hisuian Zorua');
    expect(formName('wooper-paldea')).toBe('Paldean Wooper');
    expect(formName('darmanitan-galar-standard')).toBe('Galarian Darmanitan');
    expect(formName('darmanitan-galar-zen')).toBe('Galarian Darmanitan (Zen)');
    expect(formName('tauros-paldea-aqua-breed')).toBe('Paldean Tauros (Aqua Breed)');
  });

  it('Gigantamax', () => {
    expect(formName('machamp-gmax')).toBe('Gigantamax Machamp');
    expect(formName('toxtricity-low-key-gmax')).toBe('Gigantamax Toxtricity Low Key');
  });

  it('outras formas que mudam de verdade, pela lista', () => {
    expect(formName('giratina-origin')).toBe('Giratina (Origin)');
    expect(formName('zygarde-10')).toBe('Zygarde (10%)');
    expect(formName('rotom-wash')).toBe('Rotom (Wash)');
    expect(formName('necrozma-dusk')).toBe('Necrozma (Dusk Mane)');
  });

  it('o resto das variedades fica de fora', () => {
    for (const n of ['bulbasaur', 'eternatus-eternamax', 'raticate-totem-alola', 'pikachu-alola-cap', 'pikachu-rock-star', 'eevee-starter', 'zygarde-10-power-construct', 'minior-red', 'squawkabilly-blue-plumage'])
      expect(formName(n), n).toBeNull();
  });
});
