import type { Item, Source } from '../types';
import { fileThumbs } from './mediawiki';

interface Hero {
  name: string;
  player_selectable?: boolean;
  disabled?: boolean;
  images?: { icon_hero_card_webp?: string; icon_hero_card?: string };
}

export const DEADLOCK_URL = 'https://api.deadlock-api.com/v1/assets/heroes?only_active=true';
export const DEADLOCK_WIKI = 'https://deadlock.wiki/api.php';

// Deadlock: heróis jogáveis da Deadlock API (assets do jogo). A imagem é o render de corpo inteiro da Deadlock Wiki
// ("File:{nome} Render.png", miniatura de 500px porque o original tem uns 2 MB); sem ele, ou se a wiki falhar, fica a
// arte da carta de seleção.
async function load(): Promise<Item[]> {
  const j = (await (await fetch(DEADLOCK_URL)).json()) as Hero[];
  const heroes = j.filter(h => h.player_selectable && !h.disabled);
  const file = (h: Hero) => `File:${h.name} Render.png`;
  const renders = await fileThumbs(DEADLOCK_WIKI, heroes.map(file), 500).catch(() => new Map<string, string>());
  const list = heroes
    .map(h => ({ name: h.name, img: renders.get(file(h)) ?? h.images?.icon_hero_card_webp ?? h.images?.icon_hero_card ?? '' }))
    .filter(x => x.img);
  if (!list.length) throw new Error('vazio');
  return list;
}

export const deadlock: Source = { key: 'deadlock', label: 'Deadlock', load };
