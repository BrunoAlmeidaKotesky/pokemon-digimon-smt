import type { Item, Source } from '../types';

export const FF_URL = 'ff/list.json';

// Final Fantasy: monstros (inimigos e chefes) da MoogleAPI, de todos os jogos da série principal. A API não manda
// CORS, então a lista fica em public/ff/list.json (gerada pelo ff.mjs) e só as imagens vêm de images.moogleapi.com.
// O mesmo monstro aparece uma vez por jogo; o jogo vai no nome ("Bomb (FF VII)"), que precisa ser único.
async function load(): Promise<Item[]> {
  const list = (await (await fetch(FF_URL)).json()) as [name: string, game: string, img: string][];
  if (!list.length) throw new Error('vazio');
  return list.map(([name, game, img]) => ({ name: `${name} (${game})`, img }));
}

export const ff: Source = { key: 'ff', label: 'Final Fantasy', load };
