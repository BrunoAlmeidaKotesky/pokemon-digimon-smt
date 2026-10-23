import type { Item, Source } from '../types';
import data from './smt.json';

// Lista fixa: as imagens ficam em public/smt/, então a franquia já nasce pronta (sem rede).
const list: Item[] = (data as [string, string][]).map(([n, f]) => ({ name: n, img: 'smt/' + f + '.webp' }));

export const smt: Source = {
  key: 'smt',
  label: 'SMT/Persona',
  initial: list,
  load: async () => list,
};
