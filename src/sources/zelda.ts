import type { Source } from '../types';
import { listaLocal } from './lista-local';

export const ZELDA_URL = 'zelda/list.json';

// The Legend of Zelda: inimigos e chefes da série inteira, pela Zelda Wiki. A API manda CORS, mas a lista filtrada
// custaria ~25 pedidos a cada visita: fica em public/zelda/list.json (gerada pelo zelda.mjs) e só as imagens vêm de
// cdn.wikimg.net. Só modelo, render ou arte: sprite, print e ícone ficam de fora.
export const zelda: Source = { key: 'zelda', label: 'Zelda', load: listaLocal(ZELDA_URL) };
