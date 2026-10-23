import { afterEach, describe, expect, it, vi } from 'vitest';
import { pokemon, POKEMON_URL } from './pokemon';
import { stubFetch, text, urls } from './test-utils';

afterEach(() => { vi.unstubAllGlobals(); });

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
    expect(list).toHaveLength(40);
    expect(list[0]).toEqual({ name: 'Bulbasaur', img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png' });
    expect(list.find(x => x.name === 'Nidoran F')).toEqual({ name: 'Nidoran F', img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/29.png' });
    expect(list.map(x => x.name)).toContain('Nidoran M');
    expect(list.every(x => x.href === undefined)).toBe(true);
    expect(urls(f)).toEqual(['https://pokeapi.co/api/v2/pokemon-species?limit=2000']);
    expect(POKEMON_URL).toBe('https://pokeapi.co/api/v2/pokemon-species?limit=2000');
  });

  it('falha se o fetch rejeitar', async () => {
    stubFetch(() => Promise.reject(new TypeError('sem rede')));
    await expect(pokemon.load()).rejects.toThrow('sem rede');
  });

  it('falha se a resposta não for JSON (ex.: erro 500)', async () => {
    stubFetch(() => text('erro', 500));
    await expect(pokemon.load()).rejects.toThrow();
  });
});
