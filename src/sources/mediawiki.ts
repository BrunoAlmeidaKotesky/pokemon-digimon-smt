// Consulta paginada da API do MediaWiki (JoJo Wiki, Bakugan Wiki) e o filtro comum das páginas.
import type { Item } from '../types';

export interface WikiPage {
  pageid: number;
  title: string;
  thumbnail?: { source: string };
}
interface WikiResponse {
  query?: { pages?: Record<string, WikiPage> };
  continue?: Record<string, string>;
}

/** Segue o `continue` até o fim, guardando cada página em `map` por pageid. */
export async function collectPages(api: string, params: Record<string, string>, map: Map<number, WikiPage>): Promise<void> {
  let cont: Record<string, string> | null = {};
  do {
    const p = new URLSearchParams({ ...params, prop: 'pageimages', piprop: 'thumbnail', pithumbsize: '400', pilimit: '500', format: 'json', origin: '*', ...cont });
    const j = (await (await fetch(api + '?' + p)).json()) as WikiResponse;
    Object.values(j.query?.pages || {}).forEach(x => map.set(x.pageid, x));
    cont = j.continue || null;
  } while (cont);
}

/** Tira páginas sem imagem, subpáginas ("X/Gallery") e listas ("List of ..."); lança erro se não sobrar nada. */
export function wikiItems(map: Map<number, WikiPage>): Item[] {
  const list = [...map.values()]
    .filter((x): x is WikiPage & { thumbnail: { source: string } } => !!x.thumbnail && !x.title.includes('/') && !/^List of/i.test(x.title))
    .map(x => ({ name: x.title, img: x.thumbnail.source }));
  if (!list.length) throw new Error('vazio');
  return list;
}
