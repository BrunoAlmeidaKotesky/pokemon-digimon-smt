// Sujimon pela Yakuza Wiki (Fandom): lista "List of Sujimon (LaD:IW)" da página Sujidex, com a imagem principal da
// página de cada Sujimon ou, se não houver, o ícone da tabela. Quem não tem nenhuma imagem na wiki fica de fora.
import type { Item } from '../types';

export const YAKUZA_API = 'https://yakuza.fandom.com/api.php';

export interface SujidexRow {
  num: number;
  name: string;
  /** página da wiki ligada ao nome (null se o nome não tem link) */
  page: string | null;
  /** arquivo do ícone na tabela (sem "File:") */
  icon: string | null;
}

/** Lê a tabela de Infinite Wealth do wikitext da página Sujidex. */
export function parseSujidex(wikitext: string): SujidexRow[] {
  const i = wikitext.search(/==\s*List of Sujimon \(\[\[[^\]]*\|LaD:IW\]\]\)\s*==/);
  if (i < 0) return [];
  const end = wikitext.indexOf('|}', i);
  const sec = wikitext.slice(i, end < 0 ? undefined : end);
  return sec.split(/\n\|-[^\n]*/).slice(2).map(r => {
    const cells = r.replace(/^\s*\n?\|/, '').split(/\|\||\n\|/).map(s => s.trim());
    const [iconCell = '', numCell = '', ...rest] = cells;
    const nameCell = rest.join('|');
    const link = nameCell.match(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/);
    const name = (link ? link[2] ?? link[1]! : nameCell).replace(/\s+/g, ' ').trim();
    return {
      num: Number(numCell),
      name,
      page: link?.[1]?.trim() ?? null,
      icon: iconCell.match(/\[\[File:([^\]|]+)/)?.[1]?.trim() ?? null,
    };
  }).filter(x => x.num > 0 && x.name);
}

interface QueryPage { title: string; thumbnail?: { source: string }; imageinfo?: { url?: string; thumburl?: string }[] }
interface QueryResult { query?: { pages?: Record<string, QueryPage>; normalized?: { from: string; to: string }[]; redirects?: { from: string; to: string }[] } }

const api = async <T>(p: Record<string, string>): Promise<T> =>
  (await fetch(YAKUZA_API + '?' + new URLSearchParams({ format: 'json', origin: '*', ...p }))).json() as Promise<T>;
const chunks = <T>(a: T[], n: number) => Array.from({ length: Math.ceil(a.length / n) }, (_, k) => a.slice(k * n, k * n + n));

/** Busca várias páginas de uma vez (50 por pedido) e devolve título pedido -> url da imagem. */
async function images(titles: string[], params: Record<string, string>, pick: (p: QueryPage) => string | undefined) {
  const out = new Map<string, string>();
  await Promise.all(chunks([...new Set(titles)], 50).map(async c => {
    const r = await api<QueryResult>({ action: 'query', titles: c.join('|'), ...params });
    const back = new Map<string, string>();
    (r.query?.normalized ?? []).forEach(x => back.set(x.to, x.from));
    (r.query?.redirects ?? []).forEach(x => back.set(x.to, back.get(x.from) ?? x.from));
    Object.values(r.query?.pages ?? {}).forEach(p => { const u = pick(p); if (u) out.set(back.get(p.title) ?? p.title, u); });
  }));
  return out;
}

export async function loadSujidexWiki(): Promise<Item[]> {
  const j = await api<{ parse?: { wikitext?: { '*': string } } }>({ action: 'parse', page: 'Sujidex', prop: 'wikitext' });
  const rows = parseSujidex(j.parse?.wikitext?.['*'] ?? '');
  const thumbs = await images(rows.flatMap(r => r.page ? [r.page] : []),
    { prop: 'pageimages', piprop: 'thumbnail', pithumbsize: '400', pilimit: '50', redirects: '1' }, p => p.thumbnail?.source);
  const semFoto = rows.filter(r => !(r.page && thumbs.has(r.page)) && r.icon);
  const icons = await images(semFoto.map(r => 'File:' + r.icon),
    { prop: 'imageinfo', iiprop: 'url', iiurlwidth: '300' }, p => p.imageinfo?.[0]?.thumburl ?? p.imageinfo?.[0]?.url);
  const seen = new Set<string>();
  const list: Item[] = [];
  for (const r of rows) {
    const img = (r.page && thumbs.get(r.page)) || (r.icon && icons.get('File:' + r.icon)) || '';
    if (!img || seen.has(r.name)) continue;
    seen.add(r.name);
    list.push({ name: r.name, img });
  }
  if (!list.length) throw new Error('vazio');
  return list;
}
