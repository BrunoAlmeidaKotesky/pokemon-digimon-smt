// Mobs de Minecraft pela Minecraft Wiki (https://minecraft.wiki). Gera public/minecraft/list.json pro site.
//
// A API manda CORS, mas a lista tem filtros por categoria: fica salva no repositório. As imagens continuam vindo de
// minecraft.wiki.
//
// Uso (na pasta do repositório, Node 18 ou mais novo):
//   node minecraft.mjs          -> baixa tudo e grava public/minecraft/list.json
//   git add public/minecraft/list.json
//
// Formato: [nome, url da imagem].
// Filtros:
//   - Saem jockeys (montaria mais montador), mobs de 1º de abril, os do Minecraft Education e os que não existem no jogo
//     normal (FORA). O Illusioner fica, mesmo sem aparecer sozinho no jogo.
//   - Sem variantes de cor: um gato, um lobo, uma ovelha (decisão do usuário).

import fs from 'node:fs/promises';
import { categoriasDe, membros, miniaturas } from './catalogo/util.mjs';

const API = 'https://minecraft.wiki/api.php';
const OUT = 'public/minecraft/list.json';

const SEM_ENTRAR = new Set(['Jockeys', 'Joke mobs', 'Minecraft Education', 'Minecraft Education mobs']);
const FORA = new Set(['Elder Guardian Ghost', 'Giant', 'Frostbite', 'Villager (old)']);

/** A imagem principal do Skeleton é uma curiosidade (ele canhoto): o render normal é melhor. */
const IMAGEM = { Skeleton: 'Skeleton JE6 BE4' };

/** Páginas dos mobs que entram, com a imagem principal. */
export async function paginas() {
  const todas = new Map();
  for (const c of ['Hostile', 'Neutral', 'Passive']) {
    for (const p of await membros(API, `Category:${c} mobs`, { prop: 'pageimages', piprop: 'thumbnail', pithumbsize: '400', pilimit: 'max' })) todas.set(p.title, p);
  }
  const cats = await categoriasDe(API, [...todas.keys()]);
  return { cats, mobs: [...todas.values()].filter(p => !FORA.has(p.title) && !cats.get(p.title).some(c => SEM_ENTRAR.has(c))) };
}

async function main() {
  const { mobs } = await paginas();
  const arquivo = a => `File:${a}.png`;
  const extras = Object.values(IMAGEM).map(arquivo);
  const thumbs = await miniaturas(API, extras);
  const faltam = extras.filter(a => !thumbs.has(a));
  const list = [];
  for (const p of mobs) {
    const img = IMAGEM[p.title] ? thumbs.get(arquivo(IMAGEM[p.title])) : p.thumbnail?.source;
    if (img) list.push([p.title, img]);
    else faltam.push(p.title);
  }
  list.sort((a, b) => a[0].localeCompare(b[0], 'en'));
  await fs.mkdir('public/minecraft', { recursive: true });
  await fs.writeFile(OUT, '[\n' + list.map(x => JSON.stringify(x)).join(',\n') + '\n]\n');
  console.log(`${list.length} mobs em ${OUT}.`);
  if (faltam.length) console.warn(`sem imagem: ${faltam.join(', ')}`);
}

if (process.argv[1]?.endsWith('minecraft.mjs')) await main();
