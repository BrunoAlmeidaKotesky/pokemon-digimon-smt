// Monstros de Monster Hunter pela Monster Hunter Wiki (https://monsterhunterwiki.org). Gera
// public/monsterhunter/list.json pro site.
//
// A API manda CORS, mas são ~520 páginas e cada imagem precisa de um segundo pedido: pesado demais pra cada visita,
// então a lista fica salva no repositório. As imagens continuam vindo da wiki.
//
// Uso (na pasta do repositório, Node 18 ou mais novo):
//   node monsterhunter.mjs          -> baixa tudo e grava public/monsterhunter/list.json
//   git add public/monsterhunter/list.json
//
// Formato: [nome, url da imagem, tamanho]. O tamanho ("Grande" ou "Pequeno") é só pro catálogo.
// Só entra monstro com render: a página sem imagem, com ícone, print ou o marcador "Wiki.png" fica de fora.
// `prop=pageimages` não funciona nesta wiki (volta vazio): a imagem vem de pageprops.image, que às vezes tem "File:" e
// às vezes não, e pode ser um redirecionamento (a miniatura sai com outro nome) ou um arquivo que não existe.

import fs from 'node:fs/promises';
import { chunks, membros, miniaturas, wiki } from './catalogo/util.mjs';

const API = 'https://monsterhunterwiki.org/api.php';
const OUT = 'public/monsterhunter/list.json';

const TAMANHOS = { 'Category:Large_Monsters': 'Grande', 'Category:Small_Monsters': 'Pequeno' };
/** Página genérica, não um monstro. */
const FORA = new Set(['Fish']);

/** Título -> outros renders usados na própria página ("File:..."). */
async function rendersDaPagina(titulos) {
  const out = new Map(titulos.map(t => [t, []]));
  for (const lote of chunks(titulos, 10)) {
    let cont = {};
    for (;;) {
      const d = await wiki(API, { action: 'query', prop: 'images', imlimit: 'max', titles: lote.join('|'), ...cont });
      for (const p of Object.values(d.query?.pages ?? {})) {
        out.get(p.title)?.push(...(p.images ?? []).map(i => i.title).filter(a => /Render/i.test(a) && !/Icon/i.test(a)));
      }
      if (!d.continue) break;
      cont = d.continue;
    }
  }
  return out;
}

async function main() {
  const paginas = [];
  for (const [categoria, tamanho] of Object.entries(TAMANHOS)) {
    for (const p of await membros(API, categoria, { prop: 'pageprops', ppprop: 'image' })) paginas.push({ ...p, tamanho });
  }
  const arquivo = p => 'File:' + (p.pageprops?.image ?? '').replace(/^File:/, '').replace(/_/g, ' ');
  const comRender = paginas.filter(p => /Render/i.test(arquivo(p)) && !FORA.has(p.title));
  const thumbs = await miniaturas(API, comRender.map(arquivo));
  // a infobox de algumas páginas aponta pra um arquivo que não existe: vale outro render da mesma página
  const quebradas = comRender.filter(p => !thumbs.has(arquivo(p))).map(p => p.title);
  const outros = await rendersDaPagina(quebradas);
  const thumbsOutros = await miniaturas(API, [...outros.values()].flat());
  const imagemDe = p => thumbs.get(arquivo(p)) ?? outros.get(p.title)?.map(a => thumbsOutros.get(a)).find(Boolean);
  const semThumb = comRender.filter(p => !imagemDe(p)).map(p => p.title);
  // mesma imagem em duas páginas: fica o título mais curto, pra não haver duas cartas iguais
  const porImagem = new Map();
  for (const p of comRender) {
    const img = imagemDe(p);
    const dono = porImagem.get(img);
    if (img && (!dono || p.title.length < dono.title.length)) porImagem.set(img, p);
  }
  // uma página nas duas categorias conta como grande (a primeira que entrou)
  const vistos = new Set();
  const list = [...porImagem].map(([img, p]) => [p.title, img, p.tamanho])
    .filter(([n]) => !vistos.has(n) && vistos.add(n))
    .sort((a, b) => a[0].localeCompare(b[0], 'en'));
  await fs.mkdir('public/monsterhunter', { recursive: true });
  await fs.writeFile(OUT, '[\n' + list.map(x => JSON.stringify(x)).join(',\n') + '\n]\n');
  console.log(`${list.length} de ${paginas.length} páginas em ${OUT}.`);
  if (semThumb.length) console.warn(`sem miniatura: ${semThumb.join(', ')}`);
}

if (process.argv[1]?.endsWith('monsterhunter.mjs')) await main();
