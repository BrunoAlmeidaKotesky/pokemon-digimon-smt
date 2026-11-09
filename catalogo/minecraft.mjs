// Minecraft: os mobs de public/minecraft/list.json (gerada pelo minecraft.mjs da raiz), com as categorias da Minecraft
// Wiki.

import fs from 'node:fs/promises';
import { paginas } from '../minecraft.mjs';

const LISTA = 'public/minecraft/list.json';

const COMPORTAMENTO = { 'Hostile mobs': 'Hostil', 'Neutral mobs': 'Neutro', 'Passive mobs': 'Passivo' };
const TRACO = {
  'Undead mobs': 'Morto-vivo', 'Nether mobs': 'Nether', 'End mobs': 'End', 'Aquatic mobs': 'Aquático', 'Arthropod mobs': 'Artrópode',
  'Tameable mobs': 'Domesticável', 'Flying mobs': 'Voador', 'Boss mobs': 'Chefe', Illagers: 'Illager', 'Constructible mobs': 'Construível',
  Villagers: 'Aldeão',
};

const presentes = (cats, mapa) => [...new Set(cats.map(c => mapa[c]).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt'));
/** Texto só se houver um valor, lista se houver mais, nada se não houver. */
const valor = a => (a.length > 1 ? a : a[0]);

export default {
  chave: 'minecraft',
  fonte: 'Minecraft Wiki',
  campos: [
    { id: 'comportamento', rotulo: 'Comportamento' },
    { id: 'traco', rotulo: 'Traços' },
  ],
  async gerar() {
    const lista = JSON.parse(await fs.readFile(LISTA, 'utf8'));
    const { cats } = await paginas();
    const itens = {};
    for (const [nome] of lista) {
      const c = cats.get(nome) ?? [];
      const info = {};
      const comportamento = valor(presentes(c, COMPORTAMENTO));
      const traco = valor(presentes(c, TRACO));
      if (comportamento) info.comportamento = comportamento;
      if (traco) info.traco = traco;
      itens[nome] = info;
    }
    return { itens };
  },
};
