// Bestiário de Final Fantasy pela MoogleAPI (https://github.com/jackfperryjr/moogleapi): só monstros (inimigos e
// chefes), de todos os jogos da série principal. Gera public/ff/list.json pro site.
//
// A API não manda cabeçalho CORS, então o site não consegue ler direto dela: a lista fica salva no repositório e as
// imagens continuam vindo de images.moogleapi.com (imagem em <img> não precisa de CORS).
//
// Uso (na pasta do repositório, Node 18 ou mais novo):
//   node ff.mjs          -> baixa tudo e grava public/ff/list.json
//   git add public/ff/list.json
//
// Formato: [nome, jogo, url da imagem], ex.: ["Bomb", "FF VII", "https://images.moogleapi.com/gen/monsters/10316.webp"].
// O mesmo monstro em jogos diferentes vale como monstros diferentes (o site mostra "Bomb (FF VII)").
// Monstro sem imagem fica de fora.

import fs from 'node:fs/promises';

const API = 'https://moogleapi.com/api/monsters';
const OUT = 'public/ff/list.json';
const POR_PAGINA = 1000;
const PAUSA_MS = 1500; // a API aceita 60 pedidos por minuto sem chave; isto fica bem abaixo

const sleep = ms => new Promise(r => setTimeout(r, ms));
const ROMANOS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI'];

/** "Final Fantasy VII" -> "FF VII"; "Final Fantasy" (o primeiro) -> "FF I". */
function jogo(gameName) {
  const r = /^Final Fantasy(?: ([IVX]+))?$/.exec(gameName ?? '');
  if (!r) throw new Error(`jogo que o script não conhece: "${gameName}"`);
  return 'FF ' + (r[1] ?? 'I');
}

async function baixar() {
  const todos = [];
  for (let page = 1; ; page++) {
    const url = `${API}?page=${page}&pageSize=${POR_PAGINA}`;
    const r = await fetch(url, { headers: { 'User-Agent': 'ff.mjs (script pessoal do site Quem Voce Prefere)' } });
    if (!r.ok) throw new Error(`${r.status} em ${url}`);
    const j = await r.json();
    todos.push(...j.items);
    console.log(`página ${page}: ${todos.length} de ${j.totalCount}`);
    if (!j.items.length || todos.length >= j.totalCount) break;
    await sleep(PAUSA_MS);
  }
  return todos;
}

const todos = await baixar();
const comImagem = todos.filter(m => m.imageUrl);
const vistos = new Set();
const list = [];
for (const m of comImagem) {
  const j = jogo(m.gameName);
  const chave = m.name + '|' + j;
  if (vistos.has(chave)) { console.log(`  repetido no mesmo jogo, fica o primeiro: ${m.name} (${j})`); continue; }
  vistos.add(chave);
  list.push([m.name.trim(), j, m.imageUrl]);
}
list.sort((a, b) => ROMANOS.indexOf(a[1].slice(3)) - ROMANOS.indexOf(b[1].slice(3)) || a[0].localeCompare(b[0]));

await fs.mkdir('public/ff', { recursive: true });
await fs.writeFile(OUT, '[\n' + list.map(x => JSON.stringify(x)).join(',\n') + '\n]\n');
const porJogo = Object.entries(Object.groupBy(list, x => x[1])).map(([k, v]) => `${k}: ${v.length}`).join(' · ');
console.log(`\n${list.length} monstros em ${OUT} (${todos.length - comImagem.length} sem imagem ficaram de fora)\n${porJogo}`);
