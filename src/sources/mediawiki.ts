// Consulta paginada da API do MediaWiki (JoJo Wiki, Bakugan Wiki) e o filtro comum das páginas.
// Também busca a imagem de vários títulos de uma vez (Sujidex e os renders de LoL, Overwatch e Deadlock).
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

interface QueryPage { title: string; thumbnail?: { source: string }; imageinfo?: { url?: string; thumburl?: string }[] }
interface QueryResult { query?: { pages?: Record<string, QueryPage>; normalized?: { from: string; to: string }[]; redirects?: { from: string; to: string }[] } }

const chunks = <T>(a: T[], n: number) => Array.from({ length: Math.ceil(a.length / n) }, (_, k) => a.slice(k * n, k * n + n));

/** Busca vários títulos de uma vez (50 por pedido) e devolve título pedido -> url da imagem. */
async function titleImages(api: string, titles: string[], params: Record<string, string>, pick: (p: QueryPage) => string | undefined) {
  const out = new Map<string, string>();
  await Promise.all(chunks([...new Set(titles)], 50).map(async c => {
    const p = new URLSearchParams({ format: 'json', origin: '*', action: 'query', titles: c.join('|'), ...params });
    const r = (await (await fetch(api + '?' + p)).json()) as QueryResult;
    const back = new Map<string, string>();
    (r.query?.normalized ?? []).forEach(x => back.set(x.to, x.from));
    (r.query?.redirects ?? []).forEach(x => back.set(x.to, back.get(x.from) ?? x.from));
    Object.values(r.query?.pages ?? {}).forEach(p => { const u = pick(p); if (u) out.set(back.get(p.title) ?? p.title, u); });
  }));
  return out;
}

/** Imagem principal de cada página (lado maior com até `size` px), seguindo redirecionamentos. */
export const pageThumbs = (api: string, titles: string[], size = 400) =>
  titleImages(api, titles, { prop: 'pageimages', piprop: 'thumbnail', pithumbsize: String(size), pilimit: '50', redirects: '1' }, p => p.thumbnail?.source);

/** Miniatura de cada arquivo ("File:..."), com a largura pedida. */
export const fileThumbs = (api: string, files: string[], width: number) =>
  titleImages(api, files, { prop: 'imageinfo', iiprop: 'url', iiurlwidth: String(width) }, p => p.imageinfo?.[0]?.thumburl ?? p.imageinfo?.[0]?.url);
