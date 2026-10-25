import type { Item, Source } from '../types';

interface Hero {
  name: string;
  player_selectable?: boolean;
  disabled?: boolean;
  images?: { icon_hero_card_webp?: string; icon_hero_card?: string };
}

export const DEADLOCK_URL = 'https://api.deadlock-api.com/v1/assets/heroes?only_active=true';

// Deadlock: heróis jogáveis da Deadlock API (assets do jogo), com a arte da carta de seleção.
async function load(): Promise<Item[]> {
  const j = (await (await fetch(DEADLOCK_URL)).json()) as Hero[];
  const list = j
    .filter(h => h.player_selectable && !h.disabled)
    .map(h => ({ name: h.name, img: h.images?.icon_hero_card_webp ?? h.images?.icon_hero_card ?? '' }))
    .filter(x => x.img);
  if (!list.length) throw new Error('vazio');
  return list;
}

export const deadlock: Source = { key: 'deadlock', label: 'Deadlock', load };
