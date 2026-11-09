import type { Source } from '../types';
import { listaLocal } from './lista-local';

export const KAMENRIDER_URL = 'kamenrider/list.json';

// Kamen Rider: os Riders reconhecidos oficialmente, pela Kamen Rider Wiki, com o render do traje. A API da wiki manda
// CORS, mas seriam centenas de páginas a cada visita: a lista fica em public/kamenrider/list.json (gerada pelo
// kamenrider.mjs) e só as imagens vêm da wiki.
export const kamenrider: Source = { key: 'kamenrider', label: 'Kamen Rider', load: listaLocal(KAMENRIDER_URL) };
