import type { Item, Source } from '../types';

interface Card {
  name: string;
  type: string;
  card_images?: { id: number }[];
  misc_info?: { views?: number; formats?: string[] }[];
}
type CacheEntry = [name: string, id: number];
interface YgoCache { t: number; list: CacheEntry[] }

export const YGO_URL = 'https://db.ygoprodeck.com/api/v7/cardinfo.php?misc=yes';
export const YGO_CACHE_KEY = 'pdx-ygo-v1';
export const YGO_CACHE_MS = 7 * 864e5;
export const YGO_LIMIT = 3000;

const toItems = (list: CacheEntry[]): Item[] =>
  list.map(([name, id]) => ({ name, img: `https://images.ygoprodeck.com/images/cards_cropped/${id}.jpg` }));

// Yu-Gi-Oh!: monstros oficiais (TCG/OCG) da API da YGOPRODeck, os 3000 mais vistos, com a arte direto do site deles.
// A resposta completa da API é grande, então a lista já filtrada fica guardada no navegador por 7 dias.
async function load(): Promise<Item[]> {
  try {
    const c = JSON.parse(localStorage.getItem(YGO_CACHE_KEY) ?? 'null') as YgoCache | null;
    if (c && c.list.length && Date.now() - c.t < YGO_CACHE_MS) return toItems(c.list);
  } catch { /* cache ilegível ou sem localStorage: busca de novo */ }
  const j = (await (await fetch(YGO_URL)).json()) as { data: Card[] };
  const views = (c: Card) => c.misc_info?.[0]?.views ?? 0;
  const official = (c: Card) => (c.misc_info?.[0]?.formats || []).some(f => f === 'TCG' || f === 'OCG');
  const seen = new Set<string>(), list: CacheEntry[] = [];
  j.data
    .filter((c): c is Card & { card_images: { id: number }[] } => /Monster/.test(c.type) && !/Token/.test(c.type) && official(c) && !!c.card_images?.length)
    .sort((a, b) => views(b) - views(a))
    .forEach(c => { if (list.length < YGO_LIMIT && !seen.has(c.name)) { seen.add(c.name); list.push([c.name, c.card_images[0]!.id]); } });
  if (!list.length) throw new Error('vazio');
  try { localStorage.setItem(YGO_CACHE_KEY, JSON.stringify({ t: Date.now(), list })); } catch { /* sem espaço ou sem localStorage */ }
  return toItems(list);
}

export const ygo: Source = { key: 'ygo', label: 'Yu-Gi-Oh!', load };
