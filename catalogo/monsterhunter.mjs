// Monster Hunter: os monstros de public/monsterhunter/list.json (gerada pelo monsterhunter.mjs da raiz), com as
// informações do monster-hunter-DB (https://github.com/CrimsonNynja/monster-hunter-DB, licença MIT), achadas pelo nome.
// O banco cobre ~340 monstros e vai até o Wilds: quem não está nele fica só com o tamanho, que vem da lista do site.

import fs from 'node:fs/promises';
import { getJson } from './util.mjs';

const DB = 'https://raw.githubusercontent.com/CrimsonNynja/monster-hunter-DB/master/monsters.json';
const LISTA = 'public/monsterhunter/list.json';

const TIPO = {
  Leviathan: 'Leviatã', 'Brute Wyvern': 'Wyvern Bruta', Neopteron: 'Neóptero', 'Fanged Beast': 'Fera com Presas',
  'Flying Wyvern': 'Wyvern Voadora', 'Bird Wyvern': 'Wyvern Ave', 'Elder Dragon': 'Dragão Ancião', Relict: 'Relíquia',
  Relicts: 'Relíquia', Herbivore: 'Herbívoro', 'Fanged Wyvern': 'Wyvern com Presas', Wingdrake: 'Dragão Alado',
  'Piscine Wyvern': 'Wyvern Aquática', Amphibian: 'Anfíbio', Lynian: 'Lyniano', Carapaceon: 'Carapaceon', Fish: 'Peixe',
  'Demi Elder': 'Semiancião', Construct: 'Construto', Temnoceran: 'Temnocerano', 'Snake Wyvern': 'Wyvern Serpente',
  Cephalopod: 'Cefalópode',
};
const ELEMENTO = { Fire: 'Fogo', Water: 'Água', Thunder: 'Trovão', Ice: 'Gelo', Dragon: 'Dragão', Poison: 'Veneno' };

const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
/** Lista traduzida, sem repetir; um valor só vira texto; nada vira undefined. */
const valores = (l, mapa) => {
  const a = [...new Set((l ?? []).map(x => mapa[x] ?? x))];
  return a.length > 1 ? a : a[0];
};

export default {
  chave: 'monsterhunter',
  fonte: 'monster-hunter-DB e Monster Hunter Wiki',
  campos: [
    { id: 'tamanho', rotulo: 'Tamanho' },
    { id: 'tipo', rotulo: 'Tipo' },
    { id: 'elementos', rotulo: 'Elementos' },
    { id: 'fraqueza', rotulo: 'Fraqueza' },
    { id: 'jogos', rotulo: 'Jogos' },
  ],
  async gerar() {
    const lista = JSON.parse(await fs.readFile(LISTA, 'utf8'));
    const db = await getJson(DB);
    const porNome = new Map((Array.isArray(db) ? db : db.monsters).map(m => [norm(m.name), m]));
    const itens = {};
    for (const [nome, , tamanho] of lista) {
      const m = porNome.get(norm(nome));
      const info = { tamanho };
      if (TIPO[m?.type]) info.tipo = TIPO[m.type];
      const elementos = valores(m?.elements, ELEMENTO);
      const fraqueza = valores(m?.weakness, ELEMENTO);
      const jogos = valores(m?.games?.map(g => g.game.replace(/^Monster Hunter/, 'MH')), {});
      if (elementos) info.elementos = elementos;
      if (fraqueza) info.fraqueza = fraqueza;
      if (jogos) info.jogos = jogos;
      itens[nome] = info;
    }
    return { itens };
  },
};
