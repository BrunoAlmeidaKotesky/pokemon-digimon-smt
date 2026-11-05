import type { Source } from '../types';
import { listaLocal } from './lista-local';

export const BRAINROT_URL = 'brainrot/list.json';

// Brainrot: os bichos do Animal Brainrot. O site não tem API aberta: a lista fica em public/brainrot/list.json, gerada
// pelo brainrot.mjs a partir do sitemap, e só as imagens vêm de static.animalbrainrot.com.
export const brainrot: Source = { key: 'brainrot', label: 'Brainrot', load: listaLocal(BRAINROT_URL) };
