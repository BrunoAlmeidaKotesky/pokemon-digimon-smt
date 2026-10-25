import type { Item, Source } from '../types';
import data from './smt.json';

// Listas fixas do pacote megaten (SMT V, P3, P4 e P5): as imagens ficam em public/smt/, então a franquia já nasce
// pronta (sem rede). SMT fica com os demônios (inclusive os tesouros do P5); as personas dos personagens estão em
// persona.json (persona.ts).
export const localList = (rows: [string, string][]): Item[] => rows.map(([n, f]) => ({ name: n, img: 'smt/' + f + '.webp' }));

const list = localList(data as [string, string][]);

export const smt: Source = {
  key: 'smt',
  label: 'SMT',
  initial: list,
  load: async () => list,
};
