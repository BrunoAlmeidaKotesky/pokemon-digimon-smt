// Inimigos e chefes de The Legend of Zelda pela Zelda Wiki (https://zeldawiki.wiki), a série inteira. Gera
// public/zelda/list.json pro site.
//
// A API manda CORS, mas a lista sai de duas categorias com centenas de páginas e cada imagem principal precisa de um
// segundo pedido (~25 no total, mais os filtros abaixo): pesado demais pra cada visita, então ela fica salva no
// repositório. As imagens continuam vindo de cdn.wikimg.net.
//
// Uso (na pasta do repositório, Node 18 ou mais novo):
//   node zelda.mjs          -> baixa tudo e grava public/zelda/list.json
//   git add public/zelda/list.json
//
// Formato: [nome, url da imagem].
// Filtros:
//   - Só modelo, render ou arte. Sprite, print e ícone ficam de fora (escolha do usuário): a página sem nada disso sai.
//   - PERSONAGENS: aliados e heróis que aparecem como chefe (Zelda, Darunia). Vilão fica: Ganon, Zant e Ghirahim são
//     chefes da série.
//   - A categoria Traps tem armadilha e terreno (Lava, Quicksand, Trap Door): sai, menos as criaturas de CRIATURA_TRAP.
//   - Mesma imagem em duas páginas (Bari e Blue Bari): fica o título mais curto, pra não haver duas cartas iguais.

import fs from 'node:fs/promises';
import { categoriasDe, membros, miniaturas } from './catalogo/util.mjs';

const API = 'https://zeldawiki.wiki/w/api.php';
const OUT = 'public/zelda/list.json';

const PERSONAGENS = new Set([
  'Princess Zelda', 'Possessed Zelda', 'Princess Ruto', 'Darunia', 'Impa', 'Midna', 'Great Fairy', 'Agitha', 'Linebeck',
  'Possessed Nayru', 'Link', 'Red Link', 'Blue Link', 'Green Link', 'Fi', 'Levias', 'Lana', 'Gramps',
  // cópias sombrias dos aliados no Hyrule Warriors (as dos vilões e dos monstros ficam)
  'Dark Agitha', 'Dark Darunia', 'Dark Fi', 'Dark Impa', 'Dark King Daphnes', 'Dark Lana', 'Dark Linkle', 'Dark Marin',
  'Dark Medli', 'Dark Midna', 'Dark Ravio', 'Dark Ruto', 'Dark Sheik', 'Dark Tetra', 'Dark Tingle', 'Dark Toon Link',
  'Dark Toon Zelda', 'Dark Twili Midna', 'Dark Young Link', 'Dark Zelda',
]);
/** Página que não é criatura nenhuma: nome genérico de um grupo, modo de jogo, objeto ou pedaço do cenário. */
const NAO_CRIATURA = new Set([
  'Gold Enemy', 'Giant Boss', 'Elemental Enemy', 'Gloom-Wreathed Enemy', 'Keep Boss', 'Horde Battle', 'Forces', 'Cold Water',
  'Compactor', 'Moving Ceiling', 'Rock', 'Snowball', 'Star', 'Spike', 'Vine', 'Lotus Leaf Root', 'Pool of Malice',
  'Bomb Flower', 'Stone Statue', 'Sentrobe Bomb', 'Sarcophagus',
]);
const CRIATURA_TRAP = new Set([
  'Bubble', 'Medusa', 'Mau', 'Ra', 'Burr', 'Link-Eating Plant', 'Mole', 'Mega Thwomp', 'Spiked Thwomp', 'Flying Tile',
  'Flying Pot', 'Tricky Chest', 'Pathblade', 'Spiked Roller',
]);
/** A imagem principal destas páginas não serve (capa de livro), mas a wiki tem o modelo. */
const IMAGEM = { 'Windblight Ganon': 'BotW Windblight Ganon Model.png' };
/** O título da wiki explica a página, não o bicho. */
export const NOME = { "Majora's Mask (Item)": "Majora's Mask" };

const arquivo = p => 'File:' + (IMAGEM[p.title] ?? p.pageprops?.image ?? '').replace(/^File:/, '').replace(/_/g, ' ');
const imagemBoa = a => /Model|Render|Artwork|\bArt\b/i.test(a) && !/Sprite|Screenshot|Icon/i.test(a);

/** Inimigos e chefes da wiki que passam nos filtros: [{ title, arquivo }]. */
async function selecionar() {
  const paginas = new Map();
  for (const c of ['Category:Enemies', 'Category:Bosses']) {
    for (const p of await membros(API, c, { prop: 'pageprops', ppprop: 'image' })) paginas.set(p.pageid, p);
  }
  const lista = [...paginas.values()];
  const cats = await categoriasDe(API, lista.map(p => p.title));
  const armadilha = p => cats.get(p.title)?.includes('Traps') && !CRIATURA_TRAP.has(p.title);
  const escolhidos = lista
    .filter(p => imagemBoa(arquivo(p)) && !PERSONAGENS.has(p.title) && !NAO_CRIATURA.has(p.title) && !armadilha(p))
    .map(p => ({ title: p.title, arquivo: arquivo(p) }));
  return { escolhidos, total: lista.length };
}

async function main() {
  const { escolhidos, total } = await selecionar();
  const thumbs = await miniaturas(API, escolhidos.map(x => x.arquivo));
  const semThumb = escolhidos.filter(x => !thumbs.has(x.arquivo)).map(x => x.title);
  // pela miniatura, não pelo arquivo: dois nomes de arquivo podem redirecionar pra mesma imagem
  const porImagem = new Map();
  for (const x of escolhidos) {
    const img = thumbs.get(x.arquivo);
    const dono = porImagem.get(img);
    if (img && (!dono || x.title.length < dono.length)) porImagem.set(img, x.title);
  }
  const list = [...porImagem].map(([img, title]) => [NOME[title] ?? title, img]).sort((a, b) => a[0].localeCompare(b[0], 'en'));
  await fs.mkdir('public/zelda', { recursive: true });
  await fs.writeFile(OUT, '[\n' + list.map(x => JSON.stringify(x)).join(',\n') + '\n]\n');
  console.log(`${list.length} de ${total} páginas em ${OUT}.`);
  if (semThumb.length) console.warn(`sem miniatura: ${semThumb.join(', ')}`);
}

if (process.argv[1]?.endsWith('zelda.mjs')) await main();
