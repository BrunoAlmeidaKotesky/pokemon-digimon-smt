import type { Item, Source } from '../types';
import { collectPages, wikiItems, type WikiPage } from './mediawiki';

export const JOJO_API = 'https://jojowiki.com/api.php';
export const JOJO_CATEGORIES = ['Part 3 Stands', 'Part 4 Stands', 'Part 5 Stands', 'Part 6 Stands', 'Part 7 Stands', 'Part 8 Stands', 'Part 9 Stands',
  'Thus Spoke Kishibe Rohan Stands'];

// Stands de JoJo: categorias da JoJo Wiki (jojowiki.com), com a imagem principal de cada página. Só anime e mangá:
// Partes 3 a 9 e Thus Spoke Kishibe Rohan. Ficam de fora (pedido do usuário em 21/11/2026) Light Novel Stands e Other
// Stands (romances, jogos e eventos) e Evolved Stands, cujas evoluções canônicas (Gold Experience Requiem, Made in
// Heaven) já estão nas Partes; as que sobram são dos romances (JORGE JOESTAR, Purple Haze Feedback).
async function load(): Promise<Item[]> {
  const map = new Map<number, WikiPage>();
  await Promise.all(JOJO_CATEGORIES.map(c => collectPages(JOJO_API,
    { action: 'query', generator: 'categorymembers', gcmtitle: 'Category:' + c, gcmlimit: '500', gcmnamespace: '0' }, map)));
  return wikiItems(map);
}

export const jojo: Source = { key: 'jojo', label: 'JoJo', load };
