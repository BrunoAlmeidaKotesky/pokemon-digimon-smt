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
// Monstro sem imagem fica de fora, e personagem também (lista PESSOAS abaixo).

import fs from 'node:fs/promises';

const API = 'https://moogleapi.com/api/monsters';
const OUT = 'public/ff/list.json';
const POR_PAGINA = 1000;
const PAUSA_MS = 1500; // a API aceita 60 pedidos por minuto sem chave; isto fica bem abaixo

// A API lista como monstro todo mundo que se enfrenta numa luta, inclusive gente da história: heróis jogáveis
// (Freya, Zidane, Terra), vilões (Kefka, Sephiroth, Kuja) e NPCs (Turks, Biggs e Wedge). Personagem não vale: sai toda
// pessoa com nome, junto com as formas dela ("Safer∙Sephiroth", "Seymour Natus", "Xande's Clone"). Criatura com nome
// fica (Chaos, Ultros, Zeromus, Necron, Jenova, Typhon, as invocações), e também as construções (Black Waltz, Barnabas,
// Calco e Brina). Nome exato, por jogo: palavra solta pegaria inimigo genérico ("Shadow", "Judge", "Snow", "Yang").
// Montada cruzando os monstros com /api/characters e uma busca pelos nomes dos personagens da série.
const PESSOAS = {
  'FF I': ['Astos', 'Garland', 'Gilgamesh'],
  'FF II': ['Borghen', 'Zombie Borghen', 'Deumion', 'Emperor'],
  'FF III': ['Doga', "Doga's Clone", 'Goldor', 'Gutsco', 'Hein', 'Unei', "Unei's Clone", 'Xande', "Xande's Clone"],
  'FF IV': ['Baigan', 'Dark Kain', 'Dr. Lugae', 'Girl', 'Golbez', 'Zemus', "Zemus's Breath", "Zemus's Malice", "Zemus's Mind"],
  'FF V': ['Exdeath', "Exdeath's Soul", 'Neo Exdeath', 'Famed Mimic Gogo', 'Gilgamesh'],
  'FF VI': ['Cyan', 'Gau', 'Gilgamesh', 'Kefka', 'Shadow', 'Siegfried', 'Terra', 'Vargas'],
  'FF VII': ['Bizarro∙Sephiroth', 'Dyne', 'Elena', 'Gi Nattak', 'Godo', 'Helletic Hojo', 'Hojo', 'Lifeform-Hojo N', 'Palmer',
    'Reno', 'Rude', 'Rufus', 'Safer∙Sephiroth', 'Scotch', 'Sephiroth'],
  'FF VIII': ['Adel', 'Biggs', 'Edea', 'Fujin', 'NORG', 'NORG Pod', 'Raijin', 'Rinoa', 'Seifer', 'Ultimecia', 'Wedge'],
  'FF IX': ['Amarant', 'Baku', 'Beatrix', 'Dagger', 'Eiko', 'Freya', 'Garland', 'Garnet', 'King Leo', 'Kuja', 'Lani', 'Quale',
    'Quina', 'Scarlet Hair', 'Steiner', 'Thorn', 'Trance Kuja', 'Vivi', 'Zidane', 'Zorn'],
  'FF X': ['Belgemine', 'Biran Ronso', 'Cid', 'Ginnem', 'Isaaru', 'Seymour', 'Seymour Flux', 'Seymour Natus', 'Seymour Omnis',
    'Yenke Ronso', 'Yunalesca'],
  'FF XI': ['D. Shantotto', "Eald'narche", "Kam'lanaut", 'Raubahn', 'Razfahd', 'Riko Kupenreich', 'Shadow Lord', 'Shantotto',
    'Zeid'],
  'FF XII': ["Ba'Gamnan", 'Bwagi', 'Daguza', 'Doctor Cid', 'Elza', 'Gabranth', 'Gijuk', 'Gilgamesh', 'Judge Bergan', 'Judge Drace',
    'Judge Ghis', 'Judge Zargabaath', 'Rikken', 'Rinok', 'Vayne', 'Vayne Novus', 'Vossler'],
  'FF XIII': ['Cid Raines'],
  'FF XV': ['Aranea', 'Ardyn', 'Cor', 'Gilgamesh', 'Gladiolus', 'Ignis', 'Prompto', 'Ravus', 'Regis Lucis Caelum'],
};

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
const pessoas = new Set(Object.entries(PESSOAS).flatMap(([j, ns]) => ns.map(n => n + '|' + j)));
const tiradas = new Set();
const list = [];
for (const m of comImagem) {
  const j = jogo(m.gameName);
  const chave = m.name.trim() + '|' + j;
  if (pessoas.has(chave)) { tiradas.add(chave); continue; }
  if (vistos.has(chave)) { console.log(`  repetido no mesmo jogo, fica o primeiro: ${m.name} (${j})`); continue; }
  vistos.add(chave);
  list.push([m.name.trim(), j, m.imageUrl]);
}
// nome da lista que a API não tem mais (ou foi digitado errado): avisa pra conferir
for (const p of pessoas) if (!tiradas.has(p)) console.log(`  aviso: "${p.replace('|', '" do ')} está em PESSOAS mas não veio da API`);
list.sort((a, b) => ROMANOS.indexOf(a[1].slice(3)) - ROMANOS.indexOf(b[1].slice(3)) || a[0].localeCompare(b[0]));

await fs.mkdir('public/ff', { recursive: true });
await fs.writeFile(OUT, '[\n' + list.map(x => JSON.stringify(x)).join(',\n') + '\n]\n');
const porJogo = Object.entries(Object.groupBy(list, x => x[1])).map(([k, v]) => `${k}: ${v.length}`).join(' · ');
console.log(`\n${list.length} monstros em ${OUT} (${todos.length - comImagem.length} sem imagem e ${tiradas.size} personagens ficaram de fora)\n${porJogo}`);
