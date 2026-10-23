import type { Item } from '../types';

interface Detail { images?: { href?: string }[] }

/** Item sem imagem mas com `href` (Digimon): busca o detalhe e preenche `img` no próprio item. Erro é ignorado. */
export async function resolve(item: Item): Promise<Item> {
  if (!item.img && item.href) {
    try {
      const d = (await (await fetch(item.href)).json()) as Detail;
      item.img = d.images?.[0]?.href || '';
    } catch { /* fica sem imagem */ }
  }
  return item;
}
