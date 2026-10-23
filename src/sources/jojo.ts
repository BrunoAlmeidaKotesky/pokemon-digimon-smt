import type { Item, Source } from '../types';
import { collectPages, wikiItems, type WikiPage } from './mediawiki';

export const JOJO_API = 'https://jojowiki.com/api.php';
export const JOJO_CATEGORIES = ['Part 3 Stands', 'Part 4 Stands', 'Part 5 Stands', 'Part 6 Stands', 'Part 7 Stands', 'Part 8 Stands', 'Part 9 Stands',
  'Light Novel Stands', 'Other Stands', 'Thus Spoke Kishibe Rohan Stands', 'Evolved Stands'];

// Stands de JoJo: categorias da JoJo Wiki (jojowiki.com), com a imagem principal de cada página.
async function load(): Promise<Item[]> {
  const map = new Map<number, WikiPage>();
  await Promise.all(JOJO_CATEGORIES.map(c => collectPages(JOJO_API,
    { action: 'query', generator: 'categorymembers', gcmtitle: 'Category:' + c, gcmlimit: '500', gcmnamespace: '0' }, map)));
  return wikiItems(map);
}

export const jojo: Source = { key: 'jojo', label: 'JoJo', load };
