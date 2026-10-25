import type { Source } from '../types';
import data from './persona.json';
import { localList } from './smt';

// Personas dos personagens de P3, P4 e P5 (no pacote megaten: raça "Persona", com dono, mais as versões Picaro do
// P5 Royal). As imagens dividem a pasta public/smt/ com os demônios.
const list = localList(data as [string, string][]);

export const persona: Source = {
  key: 'persona',
  label: 'Persona',
  initial: list,
  load: async () => list,
};
