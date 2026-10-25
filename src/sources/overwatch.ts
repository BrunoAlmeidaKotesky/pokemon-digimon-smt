import type { Item, Source } from '../types';
import { pageThumbs } from './mediawiki';

interface Hero { key: string; name: string; portrait?: string }

export const OVERWATCH_URL = 'https://overfast-api.tekrop.fr/heroes';
export const OVERWATCH_WIKI = 'https://overwatch.fandom.com/api.php';

// Overwatch: heróis da OverFast API (lê o site da Blizzard). A imagem é o render de corpo inteiro da Overwatch Wiki
// (imagem principal da página do herói); sem ele, ou se a wiki falhar, fica o retrato oficial.
async function load(): Promise<Item[]> {
  const j = (await (await fetch(OVERWATCH_URL)).json()) as Hero[];
  const renders = await pageThumbs(OVERWATCH_WIKI, j.map(h => h.name), 600).catch(() => new Map<string, string>());
  const list = j.map(h => ({ name: h.name, img: renders.get(h.name) ?? h.portrait ?? '' })).filter(x => x.img);
  if (!list.length) throw new Error('vazio');
  return list;
}

export const overwatch: Source = { key: 'overwatch', label: 'Overwatch', load };
