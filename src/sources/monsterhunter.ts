import type { Source } from '../types';
import { listaLocal } from './lista-local';

export const MONSTERHUNTER_URL = 'monsterhunter/list.json';

// Monster Hunter: monstros grandes e pequenos da Monster Hunter Wiki, só os que têm render. A API manda CORS, mas são
// ~520 páginas: a lista fica em public/monsterhunter/list.json (gerada pelo monsterhunter.mjs) e só as imagens vêm da
// wiki. As APIs de jogo (mhw-db.com, wilds.mhdb.io) não têm imagem de monstro.
export const monsterhunter: Source = { key: 'monsterhunter', label: 'Monster Hunter', load: listaLocal(MONSTERHUNTER_URL) };
