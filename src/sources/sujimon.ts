import type { Item, Source } from '../types';

export const SUJIMON_URL = 'sujimon/list.json';

// Sujimon (Like a Dragon: Infinite Wealth): imagens recortadas na pasta sujimon/ (geradas pelo sujimon.mjs).
// Enquanto a pasta não existir a carga falha, e a franquia (opcional) some das opções.
async function load(): Promise<Item[]> {
  const list = (await (await fetch(SUJIMON_URL)).json()) as [name: string, num: string][];
  if (!list.length) throw new Error('vazio');
  return list.map(([name, num]) => ({ name, img: `sujimon/${num}.webp` }));
}

export const sujimon: Source = { key: 'sujimon', label: 'Sujimon', optional: true, load };
