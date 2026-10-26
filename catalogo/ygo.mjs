// Yu-Gi-Oh!: monstros oficiais (TCG/OCG) da YGOPRODeck, com o mesmo filtro e ordem de src/sources/ygo.ts. O site
// mostra os 3000 mais vistos, mas as visualizações mudam com o tempo: o catálogo guarda os 4000 primeiros pra
// continuar cobrindo a lista do site por um bom tempo. Um pedido só (resposta de ~25 MB).

import { getJson } from './util.mjs';

const API = 'https://db.ygoprodeck.com/api/v7/cardinfo.php?misc=yes';
const LIMITE = 4000;

export default {
  chave: 'ygo',
  fonte: 'YGOPRODeck',
  campos: [
    { id: 'atributo', rotulo: 'Atributo' },
    { id: 'raca', rotulo: 'Tipo de monstro' },
    { id: 'carta', rotulo: 'Tipo de carta' },
    { id: 'nivel', rotulo: 'Nível / Rank / Link' },
    { id: 'arquetipo', rotulo: 'Arquétipo' },
  ],
  async gerar() {
    const j = await getJson(API);
    const views = c => c.misc_info?.[0]?.views ?? 0;
    const official = c => (c.misc_info?.[0]?.formats || []).some(f => f === 'TCG' || f === 'OCG');
    const lista = [];
    const vistos = new Set();
    j.data
      .filter(c => /Monster/.test(c.type) && !/Token/.test(c.type) && official(c) && c.card_images?.length)
      .sort((a, b) => views(b) - views(a))
      .forEach(c => { if (lista.length < LIMITE && !vistos.has(c.name)) { vistos.add(c.name); lista.push(c); } });
    const itens = {};
    for (const c of lista) {
      // typeline: ["Spellcaster", "Pendulum", "Effect"] -> o que não é a raça: ["Pendulum", "Effect"]
      const carta = (c.typeline ?? c.type.replace(/ Monster$/, '').split(' ')).filter(x => x !== c.race);
      const nivel = /Link/.test(c.type) ? (c.linkval != null ? `Link ${c.linkval}` : undefined)
        : c.level == null ? undefined : /XYZ/.test(c.type) ? `Rank ${c.level}` : `Nível ${c.level}`;
      const info = { atributo: c.attribute, raca: c.race, carta: carta.length ? carta : undefined, nivel, arquetipo: c.archetype };
      itens[c.name] = Object.fromEntries(Object.entries(info).filter(([, v]) => v != null && v !== ''));
    }
    return { itens };
  },
};
