import type { Item, Source } from '../types';
import { loadSujidexWiki } from './sujidex';

export const SUJIMON_URL = 'sujimon/list.json';

// Sujimon (Like a Dragon: Infinite Wealth). Primeiro tenta a lista local (public/sujimon/, gerada pelo sujimon.mjs a
// partir dos screenshots do Sujidex); se ela não existir, usa a Yakuza Wiki. Se as duas falharem, a franquia
// (opcional) some das opções.
async function loadLocal(): Promise<Item[]> {
  const list = (await (await fetch(SUJIMON_URL)).json()) as [name: string, num: string][];
  if (!list.length) throw new Error('vazio');
  return list.map(([name, num]) => ({ name, img: `sujimon/${num}.webp` }));
}

async function load(): Promise<Item[]> {
  try {
    return await loadLocal();
  } catch {
    return loadSujidexWiki();
  }
}

export const sujimon: Source = { key: 'sujimon', label: 'Sujimon', optional: true, load };
