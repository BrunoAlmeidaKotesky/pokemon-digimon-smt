// Kamen Rider: série e usuário já vêm em public/kamenrider/list.json (o kamenrider.mjs da raiz lê tudo da wiki).
// A era sai da série: Showa até o J, Heisei do Kuuga ao Zi-O, Reiwa do Zero-One em diante.

import fs from 'node:fs/promises';

const LISTA = 'public/kamenrider/list.json';

const SHOWA = new Set([
  'Kamen Rider', 'Kamen Rider V3', 'Kamen Rider X', 'Kamen Rider Amazon', 'Kamen Rider Stronger', 'Kamen Rider (Skyrider)',
  'Kamen Rider Super-1', 'Kamen Rider ZX', 'Kamen Rider Black', 'Kamen Rider Black RX', 'Shin Kamen Rider: Prologue', 'Kamen Rider ZO',
  'Kamen Rider J',
]);
const REIWA = new Set([
  'Kamen Rider Zero-One', 'Kamen Rider Saber', 'Kamen Rider Revice', 'Kamen Rider Geats', 'Kamen Rider Outsiders', 'Kamen Rider Black Sun',
  'Shin Kamen Rider', 'Kamen Rider Gotchard', 'Kamen Rider Gavv', 'Kamen Rider Zeztz',
]);
const era = serie => (SHOWA.has(serie) ? 'Showa' : REIWA.has(serie) ? 'Reiwa' : 'Heisei');
/** A primeira série tem o nome da franquia inteira. */
const nomeDaSerie = serie => (serie === 'Kamen Rider' ? 'Kamen Rider (1971)' : serie);

export default {
  chave: 'kamenrider',
  fonte: 'Kamen Rider Wiki',
  campos: [
    { id: 'era', rotulo: 'Era' },
    { id: 'serie', rotulo: 'Série' },
    { id: 'usuario', rotulo: 'Usuário' },
  ],
  async gerar() {
    const lista = JSON.parse(await fs.readFile(LISTA, 'utf8'));
    const itens = {};
    for (const [nome, , serie, usuario] of lista) {
      itens[nome] = { era: era(serie), serie: nomeDaSerie(serie) };
      const u = usuario?.replace(/\s*\([^)]*\)$/, '').replace(/\/.*$/, '');
      if (u) itens[nome].usuario = u;
    }
    return { itens };
  },
};
