// Final Fantasy: os monstros de public/ff/list.json (gerada pelo ff.mjs da raiz; o site mostra "Bomb (FF VII)"), com
// as informações da MoogleAPI. Cada monstro da lista é achado pela URL da imagem (única por monstro na API).

import fs from 'node:fs/promises';
import { getJson, sleep } from './util.mjs';

const API = 'https://moogleapi.com/api/monsters';
const LISTA = 'public/ff/list.json';

const CATEGORIA = { Boss: 'Chefe', Enemy: 'Inimigo' };
const ELEMENTO = {
  Fire: 'Fogo', Ice: 'Gelo', Thunder: 'Trovão', Water: 'Água', Wind: 'Vento', Earth: 'Terra', Holy: 'Sagrado',
  Dark: 'Trevas', Gravity: 'Gravidade',
};

/** "Final Fantasy VII" -> "FF VII"; "Final Fantasy" (o primeiro) -> "FF I" (igual ao ff.mjs da raiz). */
const jogo = g => {
  const r = /^Final Fantasy(?: ([IVX]+))?$/.exec(g ?? '');
  return r ? 'FF ' + (r[1] ?? 'I') : null;
};

/** "Fire, Holy" -> "Fogo" ou ["Fogo", "Sagrado"]; vazio -> undefined. */
function elementos(s) {
  const a = [...new Set(String(s ?? '').split(',').map(t => t.trim()).filter(Boolean).map(t => ELEMENTO[t] ?? t))];
  return a.length > 1 ? a : a[0];
}

async function baixar() {
  const todos = [];
  for (let page = 1; ; page++) {
    const j = await getJson(`${API}?page=${page}&pageSize=5000`);
    todos.push(...j.items);
    if (!j.items.length || todos.length >= j.totalCount) return todos;
    await sleep(1500); // a API aceita 60 pedidos por minuto sem chave
  }
}

export default {
  chave: 'ff',
  fonte: 'MoogleAPI',
  campos: [
    { id: 'jogo', rotulo: 'Jogo' },
    { id: 'categoria', rotulo: 'Categoria' },
    { id: 'fraqueza', rotulo: 'Fraqueza' },
    { id: 'absorve', rotulo: 'Absorve' },
    { id: 'nivel', rotulo: 'Nível' },
    { id: 'local', rotulo: 'Local' },
  ],
  async gerar() {
    const lista = JSON.parse(await fs.readFile(LISTA, 'utf8'));
    const porImagem = new Map((await baixar()).filter(m => m.imageUrl).map(m => [m.imageUrl, m]));
    const itens = {};
    let semDados = 0;
    for (const [nome, j, img] of lista) {
      const info = { jogo: j };
      const m = porImagem.get(img);
      if (!m) semDados++;
      else {
        if (jogo(m.gameName) !== j) console.warn(`  ff: ${nome} (${j}) veio da API como ${m.gameName}`);
        if (CATEGORIA[m.category] ?? m.category) info.categoria = CATEGORIA[m.category] ?? m.category;
        const fraqueza = elementos(m.weaknesses);
        if (fraqueza) info.fraqueza = fraqueza;
        const absorve = elementos(m.absorbs);
        if (absorve) info.absorve = absorve;
        if (Number.isFinite(Number(m.level)) && m.level !== null && m.level !== '') info.nivel = Number(m.level);
        if (m.location?.trim()) info.local = m.location.trim();
      }
      itens[`${nome} (${j})`] = info;
    }
    if (semDados) console.warn(`  ff: ${semDados} monstros da lista não vieram da API (ficam só com o jogo)`);
    return { itens };
  },
};
