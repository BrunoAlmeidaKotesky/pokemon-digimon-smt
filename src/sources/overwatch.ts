import type { Item, Source } from '../types';

interface Hero { key: string; name: string; portrait?: string }

export const OVERWATCH_URL = 'https://overfast-api.tekrop.fr/heroes';

// Overwatch: heróis da OverFast API (lê o site da Blizzard), com o retrato oficial de cada um.
async function load(): Promise<Item[]> {
  const j = (await (await fetch(OVERWATCH_URL)).json()) as Hero[];
  const list = j.filter((h): h is Hero & { portrait: string } => !!h.portrait).map(h => ({ name: h.name, img: h.portrait }));
  if (!list.length) throw new Error('vazio');
  return list;
}

export const overwatch: Source = { key: 'overwatch', label: 'Overwatch', load };
