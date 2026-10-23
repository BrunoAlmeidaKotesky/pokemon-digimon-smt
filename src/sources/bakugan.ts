import type { Item, Source } from '../types';
import { collectPages, wikiItems, type WikiPage } from './mediawiki';

export const BAKUGAN_API = 'https://bakugan.fandom.com/api.php';

// Bakugan: páginas da Bakugan Wiki (Fandom) que usam a ficha de Bakugan.
async function load(): Promise<Item[]> {
  const map = new Map<number, WikiPage>();
  await collectPages(BAKUGAN_API,
    { action: 'query', generator: 'embeddedin', geititle: 'Template:Infobox Bakugan', geilimit: '500', geinamespace: '0' }, map);
  return wikiItems(map);
}

export const bakugan: Source = { key: 'bakugan', label: 'Bakugan', load };
