import type { Item, Source } from '../types';
import { nice } from './text';

interface Species { name: string; url: string }
interface SpeciesPage { results: Species[] }

export const POKEMON_URL = 'https://pokeapi.co/api/v2/pokemon-species?limit=2000';

async function load(): Promise<Item[]> {
  const j = (await (await fetch(POKEMON_URL)).json()) as SpeciesPage;
  return j.results.map(x => {
    const id = x.url.split('/').filter(Boolean).pop();
    return { name: nice(x.name), img: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png` };
  });
}

export const pokemon: Source = { key: 'pokemon', label: 'Pokémon', load };
