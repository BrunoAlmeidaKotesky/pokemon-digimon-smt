// Sujimon pela Yakuza Wiki (Fandom): lista "List of Sujimon (LaD:IW)" da página Sujidex, com a imagem principal da
// página de cada Sujimon ou, se não houver, o ícone da tabela. Quem não tem nenhuma imagem na wiki fica de fora.
import type { Item } from '../types';
import { fileThumbs, pageThumbs } from './mediawiki';

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

const api = async <T>(p: Record<string, string>): Promise<T> =>
  (await fetch(YAKUZA_API + '?' + new URLSearchParams({ format: 'json', origin: '*', ...p }))).json() as Promise<T>;

export async function loadSujidexWiki(): Promise<Item[]> {
  const j = await api<{ parse?: { wikitext?: { '*': string } } }>({ action: 'parse', page: 'Sujidex', prop: 'wikitext' });
  const rows = parseSujidex(j.parse?.wikitext?.['*'] ?? '');
  const thumbs = await pageThumbs(YAKUZA_API, rows.flatMap(r => r.page ? [r.page] : []));
  const semFoto = rows.filter(r => !(r.page && thumbs.has(r.page)) && r.icon);
  const icons = await fileThumbs(YAKUZA_API, semFoto.map(r => 'File:' + r.icon), 300);
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
