// Mobs de Minecraft pela Minecraft Wiki (https://minecraft.wiki). Gera public/minecraft/list.json pro site.
//
// A API manda CORS, mas a lista tem filtros por categoria e variantes escolhidas à mão: fica salva no repositório. As
// imagens continuam vindo de minecraft.wiki.
//
// Uso (na pasta do repositório, Node 18 ou mais novo):
//   node minecraft.mjs          -> baixa tudo e grava public/minecraft/list.json
//   git add public/minecraft/list.json
//
// Formato: [nome, url da imagem].
// Filtros:
//   - Saem jockeys (montaria mais montador), mobs de 1º de abril, os do Minecraft Education e os que não existem no jogo
//     normal (FORA). O Illusioner fica, mesmo sem aparecer sozinho no jogo.
//   - Gato, lobo, cavalo, ovelha, sapo e axolote entram pelas variantes (VARIANTES), no lugar do mob base: cada cor é
//     uma carta (escolha do usuário).

import fs from 'node:fs/promises';
import { categoriasDe, membros, miniaturas } from './catalogo/util.mjs';

const API = 'https://minecraft.wiki/api.php';
const OUT = 'public/minecraft/list.json';

const SEM_ENTRAR = new Set(['Jockeys', 'Joke mobs', 'Minecraft Education', 'Minecraft Education mobs']);
const FORA = new Set(['Elder Guardian Ghost', 'Giant', 'Frostbite', 'Villager (old)']);

const CORES = ['Black', 'Blue', 'Brown', 'Cyan', 'Gray', 'Green', 'Light Blue', 'Light Gray', 'Lime', 'Magenta', 'Orange', 'Pink', 'Purple', 'Red', 'White', 'Yellow'];
/** Mob base -> arquivos das variantes. O nome da carta sai do arquivo, sem a versão ("Persian Cat JE5" -> "Persian Cat"). */
export const VARIANTES = {
  Cat: ['Black Cat', 'British Shorthair Cat', 'Calico Cat', 'Jellie Cat', 'Persian Cat JE5', 'Ragdoll Cat', 'Red Cat', 'Siamese Cat JE3 BE2', 'Tabby Cat', 'Tuxedo Cat JE3', 'White Cat'],
  Wolf: ['Ashen', 'Black', 'Chestnut', 'Rusty', 'Snowy', 'Spotted', 'Striped', 'Woods'].map(c => `${c} Wolf JE1 BE1`).concat('Wolf JE2 BE2'),
  Horse: ['Black', 'Brown', 'Chestnut', 'Creamy', 'Gray', 'White'].map(c => `${c} Horse`),
  Sheep: CORES.map(c => (c === 'White' ? 'White Sheep JE5' : `${c} Sheep JE5 BE5`)),
  Frog: ['Cold Frog JE1 BE1', 'Temperate Frog JE1 BE1', 'Warm Frog JE1'],
  Axolotl: ['Blue Axolotl JE2', 'Cyan Axolotl JE2', 'Gold Axolotl JE2', 'Lucy Axolotl JE2', 'Wild Axolotl JE1'],
};
/** A imagem principal do Skeleton é uma curiosidade (ele canhoto): o render normal é melhor. */
const IMAGEM = { Skeleton: 'Skeleton JE6 BE4' };

/** "Persian Cat JE5" -> "Persian Cat"; o lobo padrão não tem cor no nome do arquivo, mas o jogo chama de Pale. */
export const nomeVariante = a => (a === 'Wolf JE2 BE2' ? 'Pale Wolf' : a.replace(/( [JB]E\d+)+$/, ''));

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
  const extras = [...Object.values(VARIANTES).flat(), ...Object.values(IMAGEM)].map(arquivo);
  const thumbs = await miniaturas(API, extras);
  const faltam = extras.filter(a => !thumbs.has(a));
  const list = [];
  for (const p of mobs) {
    if (VARIANTES[p.title]) {
      for (const a of VARIANTES[p.title]) if (thumbs.has(arquivo(a))) list.push([nomeVariante(a), thumbs.get(arquivo(a))]);
    } else {
      const img = IMAGEM[p.title] ? thumbs.get(arquivo(IMAGEM[p.title])) : p.thumbnail?.source;
      if (img) list.push([p.title, img]);
      else faltam.push(p.title);
    }
  }
  list.sort((a, b) => a[0].localeCompare(b[0], 'en'));
  await fs.mkdir('public/minecraft', { recursive: true });
  await fs.writeFile(OUT, '[\n' + list.map(x => JSON.stringify(x)).join(',\n') + '\n]\n');
  console.log(`${list.length} mobs em ${OUT}.`);
  if (faltam.length) console.warn(`sem imagem: ${faltam.join(', ')}`);
}

if (process.argv[1]?.endsWith('minecraft.mjs')) await main();
