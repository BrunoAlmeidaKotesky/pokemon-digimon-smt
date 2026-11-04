// Set 1 da Autobatalha (o modo estilo TFT do site): lê a exportação da aba Catálogo (o set1.json com as classes,
// habilidade, custo e linha evolutiva de cada personagem marcado) e grava public/autobatalha/set1.json no formato
// SetDados de src/autobatalha/tipos.ts. As regras (estrelas, alternativas, ult, Stands) estão em
// docs/tft/autobatalha.md, seção Set.
//
// Uso (na pasta do repositório, Node 22 ou mais novo):
//   node autobatalha.mjs                              -> lê docs/tft/set1-escolhas-v5.json
//   node autobatalha.mjs caminho/da/exportacao.json   -> lê outra exportação
//
// Além da exportação, o script lê:
//   - public/catalogo/<chave>.json: informações das formas que só existem como ult (Mega Charizard X, Omegamon);
//   - public/ff/list.json e public/catalogo/ff.json: monstros do Final Fantasy (inimigos e chefes);
//   - docs/tft/base/receitas-bakugan.json: os Bakugan dos itens completos.
// E busca na internet a imagem das formas de ult (Pokémon: PokeAPI; Digimon: Digi-API) e dos Bakugan (Bakugan Wiki).
// Personagem sem custo no Catálogo fica fora do set (é assim que o usuário tira alguém). Linha do plano sem nenhuma
// forma marcada entra com os dados do plano (classes, custo, habilidade), a info do catálogo e a imagem da fonte.
// Confira os avisos no fim: personagem que saiu, linha que saiu, imagem que não achou.

import fs from 'node:fs';
import path from 'node:path';
import { chunks, getJson } from './catalogo/util.mjs';

const ENTRADA = process.argv[2] ?? 'docs/tft/set1-escolhas-v5.json';
const SAIDA = 'public/autobatalha/set1.json';
/** Só ASCII e nada de dado pessoal (regra do projeto). */
const HEADERS = { 'User-Agent': 'autobatalha.mjs (script pessoal do site Quem Voce Prefere)' };

/** As origens, na ordem de src/autobatalha/tipos.ts. Final Fantasy (monstros) e Bakugan (itens) não são campeões. */
const ORIGENS = ['pokemon', 'digimon', 'smt', 'persona', 'jojo', 'ygo', 'lol', 'overwatch', 'deadlock', 'sujimon'];
const SEM_HABILIDADE = '[Nenhuma Habilidade Especial]';
/** Nome no jogo diferente do da fonte: o Zygarde da PokeAPI é a forma 50%. */
const RENOMEAR = { 'pokemon:Zygarde': 'Zygarde (50%)' };
/** Franquias em que a forma não final não lança nada (só ataca), salvo habilidade própria. */
const SO_ATACA_SE_NAO_FINAL = new Set(['pokemon', 'digimon']);

const POKEAPI = 'https://pokeapi.co/api/v2/pokemon?limit=2000';
const artePokemon = url => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${url.split('/').filter(Boolean).pop()}.png`;
const imagemDigiApi = nome => `https://digi-api.com/images/digimon/w/${nome.replace(/ /g, '_')}.png`;
const BAKUGAN_API = 'https://bakugan.fandom.com/api.php';

const avisos = [];
const avisar = m => { avisos.push(m); };
const lerJson = c => JSON.parse(fs.readFileSync(c, 'utf8'));
const normalizar = s => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
/** Igual ao slug() de src/catalog/plano.ts: 'Hey Ya!' -> 'hey-ya'. */
const slug = s => normalizar(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'x';
const temHabilidade = p => typeof p?.habilidade === 'string' && p.habilidade.trim() !== '' && p.habilidade.trim() !== SEM_HABILIDADE;

// ---------------------------------------------------------------------------------------------------
// Nome das variedades da PokeAPI (porte do formName() de src/sources/pokemon.ts)
// ---------------------------------------------------------------------------------------------------

/** Igual ao nice() de src/core/text.ts: 'mr-mime' -> 'Mr Mime'. */
const nice = s => s.split('-').map(w => (w ? w[0].toUpperCase() + w.slice(1) : w)).join(' ');
const REGIAO = { alola: 'Alolan', galar: 'Galarian', hisui: 'Hisuian', paldea: 'Paldean' };
const OUTRAS = lerJson('src/sources/pokemon-formas.json');

/** Igual ao formName() de src/sources/pokemon.ts: 'charizard-mega-x' -> 'Mega Charizard X', 'machamp-gmax' ->
 *  'Gigantamax Machamp', 'kyogre-primal' -> 'Primal Kyogre', 'typhlosion-hisui' -> 'Hisuian Typhlosion'; null pras
 *  variedades que o site não usa. */
function formName(name) {
  if (OUTRAS[name]) return OUTRAS[name];
  if (/totem|-cap|cosplay|starter|busted|eternamax/.test(name)) return null;
  const p = name.split('-');
  if (p.at(-1) === 'gmax') return `Gigantamax ${nice(p.slice(0, -1).join('-'))}`;
  const mega = p.indexOf('mega');
  if (mega > 0) return `Mega ${nice(p.slice(0, mega).join('-'))}${p.slice(mega + 1).map(s => ' ' + s.toUpperCase()).join('')}`;
  if (p.at(-1) === 'primal') return `Primal ${nice(p.slice(0, -1).join('-'))}`;
  const r = p.findIndex(s => s in REGIAO);
  if (r <= 0) return null;
  const extra = p.slice(r + 1).filter(s => s !== 'standard');
  return `${REGIAO[p[r]]} ${nice(p.slice(0, r).join('-'))}${extra.length ? ` (${nice(extra.join('-'))})` : ''}`;
}

// ---------------------------------------------------------------------------------------------------
// Imagem e informações das formas de ult (as que não estão na exportação)
// ---------------------------------------------------------------------------------------------------

let pokeapi = null;
/** Arte oficial pelo nome do site: as variedades (Megas, Gigantamax, regionais) e as espécies (Raging Bolt). */
async function imagemPokemon(nome) {
  pokeapi ??= getJson(POKEAPI, { headers: HEADERS })
    .then(j => {
      const m = new Map();
      for (const x of j.results) { const n = formName(x.name); if (n && !m.has(n)) m.set(n, artePokemon(x.url)); }
      for (const x of j.results) { const n = nice(x.name); if (!m.has(n)) m.set(n, artePokemon(x.url)); }
      return m;
    })
    .catch(e => { avisar(`PokeAPI falhou (${e.message})`); return new Map(); });
  return (await pokeapi).get(nome);
}

/** Imagem da Digi-API, se ela existir (HEAD). */
async function imagemDigimon(nome) {
  const url = imagemDigiApi(nome);
  try {
    const r = await fetch(url, { method: 'HEAD', headers: HEADERS });
    return r.ok ? url : undefined;
  } catch {
    return undefined;
  }
}

const catalogos = {};
/** Itens de public/catalogo/<fr>.json (vazio se o arquivo não existir). */
function catalogo(fr) {
  const c = `public/catalogo/${fr}.json`;
  catalogos[fr] ??= fs.existsSync(c) ? lerJson(c).itens : {};
  return catalogos[fr];
}

// ---------------------------------------------------------------------------------------------------
// Leitura da exportação
// ---------------------------------------------------------------------------------------------------

const exp = lerJson(ENTRADA);
const tracos = exp.plano.classes.map(c => ({ id: c.id, nome: c.nome }));
const classePorNome = new Map();
for (const t of tracos) { classePorNome.set(normalizar(t.nome), t.id); classePorNome.set(normalizar(t.id), t.id); }
const campos = Object.fromEntries(Object.entries(exp.franquias).map(([fr, f]) => [fr, f.campos ?? []]));

/** Formas em montagem: id -> { ...FormaDados, p (personagem da exportação), nivel, niveis } */
const formas = new Map();
const campeoes = [];
const idsCampeao = new Set();

function classesDe(fr, p) {
  const out = [];
  for (const n of p.classes ?? []) {
    const id = classePorNome.get(normalizar(n));
    if (!id) { avisar(`${fr}:${p.nome}: a classe "${n}" não está em plano.classes e ficou de fora`); continue; }
    if (!out.includes(id)) out.push(id);
  }
  return out;
}

/** Campos do catálogo com rótulo, na ordem da franquia; lista vira "a, b" e campo vazio fica de fora. */
function infoDe(fr, item) {
  const out = [];
  for (const c of campos[fr] ?? []) {
    const v = item[c.id];
    if (v == null || v === '' || (Array.isArray(v) && !v.length)) continue;
    out.push({ rotulo: c.rotulo, valor: Array.isArray(v) ? v.join(', ') : String(v) });
  }
  return out;
}

function novaForma(fr, p, nivel, niveis) {
  const id = `${fr}:${p.nome}`;
  if (formas.has(id)) { avisar(`${id} está em duas linhas: valeu a primeira`); return formas.get(id); }
  if (!p.img) avisar(`${id}: sem imagem na exportação`);
  const f = { id, nome: p.nome, img: p.img ?? '', fr, classes: classesDe(fr, p), info: infoDe(fr, p), p, nivel, niveis };
  formas.set(id, f);
  return f;
}

/** Custo do campeão: o da forma de nível 1 (`base`); avisa se faltar ou se as formas discordarem. */
function custoDe(id, fr, base, todas) {
  const chave = `${fr}:${base.nome}`;
  let custo = base.custo;
  if (custo == null) {
    custo = todas.find(p => p.custo != null)?.custo ?? 1;
    avisar(`${chave} veio sem custo do Catálogo: usei ${custo}`);
  }
  const outros = [...new Set(todas.map(p => p.custo).filter(c => c != null && c !== custo))];
  if (outros.length) avisar(`${id}: formas com custos diferentes (${todas.map(p => `${p.nome} ${p.custo ?? '-'}`).join(', ')}); valeu o do nível 1, ${custo}`);
  if (![1, 2, 3, 4, 5].includes(custo)) { avisar(`${id}: custo inválido (${custo}), usei 1`); custo = 1; }
  return custo;
}

function idLivre(id) {
  if (!idsCampeao.has(id)) return id;
  let n = 2;
  while (idsCampeao.has(`${id}-${n}`)) n++;
  avisar(`id de campeão repetido: ${id} virou ${id}-${n}`);
  return `${id}-${n}`;
}

function campeaoSolto(fr, p) {
  const f = novaForma(fr, p, 1, 1);
  const id = idLivre(`${fr}:${slug(p.nome)}`);
  idsCampeao.add(id);
  return { id, fr, nome: p.nome, custo: custoDe(id, fr, p, [p]), ...(fr === 'jojo' ? { stand: true } : {}), niveis: [[f.id]] };
}

function campeaoDaLinha(fr, l, P) {
  const faltam = l.niveis.flat().filter(n => !P.has(n));
  if (faltam.length) avisar(`linha ${l.id}: ${faltam.join(', ')} não está entre os personagens e ficou de fora`);
  let niveis = l.niveis.map(n => n.filter(x => P.has(x)));
  if (niveis.some(n => !n.length)) {
    avisar(`linha ${l.id}: nível sem nenhuma forma saiu`);
    niveis = niveis.filter(n => n.length);
  }
  // 4ª forma (Digimon): não é estrela, é a ult (transformação) da forma de nível 3
  let quarto = [];
  if (niveis.length > 3) {
    if (fr !== 'digimon') avisar(`linha ${l.id} tem ${niveis.length} níveis: o 4º virou a ult do 3º, como no Digimon`);
    if (niveis.length > 4) avisar(`linha ${l.id}: do 5º nível em diante ficou de fora`);
    quarto = niveis[3];
    niveis = niveis.slice(0, 3);
  }
  const ids = niveis.map((n, i) => n.map(nome => novaForma(fr, P.get(nome), i + 1, niveis.length).id));
  const ult = quarto.map(nome => { const f = novaForma(fr, P.get(nome), 4, niveis.length); f.soUlt = true; return f.id; });
  if (ult.length) for (const id of ids.at(-1)) formas.get(id).transforma = [...ult];

  let de;
  for (const [a, b] of Object.entries(l.de ?? {})) {
    const [ia, ib] = [`${fr}:${a}`, `${fr}:${b}`];
    if (ids[2]?.includes(ia) && ids[1]?.includes(ib)) (de ??= {})[ia] = ib;
    else avisar(`linha ${l.id}: "de" ${a} <- ${b} não bate com os níveis 3 e 2 e ficou de fora`);
  }

  const primeira = niveis[0][0];
  const id = idLivre(l.id);
  idsCampeao.add(id);
  let linha = l.nome;
  if (!linha || /^nova linha/i.test(linha)) {
    avisar(`linha ${l.id} sem nome no Catálogo ("${l.nome ?? ''}"): o nome da linha ficou "${primeira}"`);
    linha = primeira;
  }
  const todas = [...niveis.flat(), ...quarto].map(n => P.get(n));
  return {
    id, fr, nome: primeira, linha, custo: custoDe(id, fr, P.get(primeira), todas),
    ...(fr === 'jojo' ? { stand: true } : {}), niveis: ids, ...(de ? { de } : {}),
  };
}

// Renomeia (na exportação inteira) e tira quem veio sem custo.
for (const [fr, F] of Object.entries(exp.franquias)) {
  const nomeNovo = n => RENOMEAR[`${fr}:${n}`] ?? n;
  for (const p of F.personagens) p.nome = nomeNovo(p.nome);
  for (const l of exp.linhas?.[fr] ?? []) {
    l.niveis = l.niveis.map(n => n.map(nomeNovo));
    if (l.de) l.de = Object.fromEntries(Object.entries(l.de).map(([a, b]) => [nomeNovo(a), nomeNovo(b)]));
  }
  const unidades = exp.plano?.unidades?.[fr];
  if (unidades) {
    for (const [velho, novo] of Object.entries(RENOMEAR)) {
      const [f, n] = [velho.slice(0, velho.indexOf(':')), velho.slice(velho.indexOf(':') + 1)];
      if (f === fr && unidades[n]) { unidades[novo] = unidades[n]; delete unidades[n]; }
    }
  }
  for (const p of F.personagens) if (p.custo == null) avisar(`${fr}:${p.nome} veio sem custo do Catálogo e ficou fora do set`);
  F.personagens = F.personagens.filter(p => p.custo != null);
}

// Linha do plano sem nenhuma forma marcada: monta os personagens com o plano, o catálogo e a imagem da fonte.
const nomeClasse = id => tracos.find(t => t.id === id)?.nome ?? id;
for (const fr of ORIGENS) {
  const F = exp.franquias[fr];
  if (!F) continue;
  const unidades = exp.plano?.unidades?.[fr] ?? {};
  const marcados = new Set(F.personagens.map(p => p.nome));
  for (const l of exp.linhas?.[fr] ?? []) {
    const nomes = l.niveis.flat();
    if (nomes.some(n => marcados.has(n))) continue;
    const custo = unidades[nomes[0]]?.custo;
    if (custo == null) continue;
    for (const nome of nomes) {
      const u = unidades[nome] ?? {};
      const img = fr === 'pokemon' ? await imagemPokemon(nome) : fr === 'digimon' ? await imagemDigimon(nome) : undefined;
      if (!img) avisar(`${fr}:${nome} (linha ${l.id} sem marcados): sem imagem`);
      F.personagens.push({
        ...(catalogo(fr)[nome] ?? {}), nome, img: img ?? '', classes: (u.classes ?? []).map(nomeClasse),
        ...(u.habilidade ? { habilidade: u.habilidade } : {}), ...(u.ult ? { ult: u.ult } : {}), custo,
      });
    }
    avisar(`linha ${l.id} (${nomes.join(', ')}) não tinha forma marcada: entrou com os dados do plano`);
  }
}

for (const fr of Object.keys(exp.franquias)) if (!ORIGENS.includes(fr)) avisar(`franquia ${fr} da exportação não é origem e ficou de fora`);

// Campeões na ordem da exportação (que já vem na ordem das linhas): a linha entra onde aparece a primeira forma dela.
for (const fr of ORIGENS) {
  const F = exp.franquias[fr];
  if (!F) { avisar(`a exportação não tem a franquia ${fr}`); continue; }
  const P = new Map(F.personagens.map(p => [p.nome, p]));
  const linhas = exp.linhas?.[fr] ?? [];
  const linhaDe = new Map();
  for (const l of linhas) for (const n of l.niveis.flat()) if (!linhaDe.has(n)) linhaDe.set(n, l);
  // reserva os ids das linhas que vão entrar, pra campeão solto não pegar o id de uma linha
  for (const l of linhas) if (l.niveis.flat().some(n => P.has(n))) idsCampeao.add(l.id);
  const feitas = new Set();
  for (const p of F.personagens) {
    const l = linhaDe.get(p.nome);
    if (!l) { campeoes.push(campeaoSolto(fr, p)); continue; }
    if (feitas.has(l.id)) continue;
    feitas.add(l.id);
    idsCampeao.delete(l.id);
    campeoes.push(campeaoDaLinha(fr, l, P));
  }
  for (const l of linhas) if (!feitas.has(l.id)) avisar(`linha ${l.id} (${l.niveis.flat().join(', ')}) saiu: nenhuma forma dela está entre os personagens`);
}

// ---------------------------------------------------------------------------------------------------
// Ult: forma não final só ataca; ult de transformação; habilidade própria
// ---------------------------------------------------------------------------------------------------

for (const f of formas.values()) {
  if (f.soUlt || !SO_ATACA_SE_NAO_FINAL.has(f.fr) || f.nivel >= f.niveis || temHabilidade(f.p)) continue;
  f.semUlt = true;
  if (f.p.ult) avisar(`${f.id} não é a forma final da linha e tem a ult "${f.p.ult}": valeu a regra (forma não final só ataca) e a ult ficou de fora`);
}

const transformacoes = [];
for (const f of [...formas.values()]) {
  const alvo = f.p?.ult;
  if (!alvo || f.semUlt) continue;
  const id = `${f.fr}:${alvo}`;
  if (!formas.has(id)) {
    const item = catalogo(f.fr)[alvo];
    let img = f.fr === 'pokemon' ? await imagemPokemon(alvo) : f.fr === 'digimon' ? await imagemDigimon(alvo) : undefined;
    if (!img) { avisar(`${id}: imagem não encontrada, usei a de ${f.nome}`); img = f.img; }
    if (!item) avisar(`${id}: não está em public/catalogo/${f.fr}.json e ficou sem informações`);
    formas.set(id, { id, nome: alvo, img, fr: f.fr, classes: [...f.classes], info: item ? infoDe(f.fr, item) : [], soUlt: true });
  } else if (!formas.get(id).soUlt) {
    avisar(`${f.id}: a ult "${alvo}" é uma forma vendida (não só de ult)`);
  }
  f.transforma = [...new Set([...(f.transforma ?? []), id])];
}
for (const f of formas.values()) for (const t of f.transforma ?? []) transformacoes.push(`${f.nome} → ${formas.get(t).nome}`);

for (const f of formas.values()) {
  if (f.soUlt) continue;
  if (temHabilidade(f.p)) { f.habilidade = f.id; f.habilidadeOriginal = f.p.habilidade; }
  else if (f.classes.includes('unicos') && !f.semUlt && !f.transforma) f.habilidade = f.id;
}

// ---------------------------------------------------------------------------------------------------
// Bakugan (itens) e Final Fantasy (monstros)
// ---------------------------------------------------------------------------------------------------

/** Imagem original da página de cada Bakugan na Bakugan Wiki (50 títulos por pedido, seguindo redirecionamentos). */
async function imagensBakugan(nomes) {
  const achadas = {};
  for (const lote of chunks(nomes, 50)) {
    const q = new URLSearchParams({ action: 'query', format: 'json', titles: lote.join('|'), prop: 'pageimages', piprop: 'original', pilimit: '50', redirects: '1' });
    try {
      const j = await getJson(`${BAKUGAN_API}?${q}`, { headers: HEADERS });
      const volta = new Map();
      for (const x of j.query?.normalized ?? []) volta.set(x.to, x.from);
      for (const x of j.query?.redirects ?? []) volta.set(x.to, volta.get(x.from) ?? x.from);
      for (const pg of Object.values(j.query?.pages ?? {})) if (pg.original?.source) achadas[volta.get(pg.title) ?? pg.title] = pg.original.source;
    } catch (e) {
      avisar(`Bakugan Wiki falhou (${e.message})`);
    }
  }
  return Object.fromEntries(nomes.map(n => {
    if (!achadas[n]) avisar(`Bakugan ${n}: sem imagem na Bakugan Wiki`);
    return [n, achadas[n] ?? ''];
  }));
}

/** Símbolo clássico de cada atributo (File:<Atributo>.svg na Bakugan Wiki): a imagem dos componentes dos itens. */
const ATRIBUTOS_BAKUGAN = ['Pyrus', 'Aquos', 'Haos', 'Darkus', 'Subterra', 'Ventus', 'Aurelus'];
async function simbolosAtributos() {
  const q = new URLSearchParams({
    action: 'query', format: 'json', prop: 'imageinfo', iiprop: 'url', titles: ATRIBUTOS_BAKUGAN.map(a => `File:${a}.svg`).join('|'),
  });
  const achados = {};
  try {
    const j = await getJson(`${BAKUGAN_API}?${q}`, { headers: HEADERS });
    for (const pg of Object.values(j.query?.pages ?? {})) {
      const url = pg.imageinfo?.[0]?.url;
      if (url) achados[pg.title.replace(/^File:/, '').replace(/\.svg$/, '')] = url;
    }
  } catch (e) {
    avisar(`Bakugan Wiki falhou nos símbolos (${e.message})`);
  }
  return Object.fromEntries(ATRIBUTOS_BAKUGAN.map(a => {
    if (!achados[a]) avisar(`símbolo do atributo ${a}: não achei na Bakugan Wiki`);
    return [a, achados[a] ?? ''];
  }));
}

const nomesBakugan = [...new Set(lerJson('docs/tft/base/receitas-bakugan.json').map(r => r[2]))];
const bakugan = { ...await simbolosAtributos(), ...await imagensBakugan(nomesBakugan) };

const catFF = lerJson('public/catalogo/ff.json').itens;
const ff = { inimigos: [], chefes: [] };
let ffSemCategoria = 0;
for (const [nome, jogo, img] of lerJson('public/ff/list.json')) {
  if (!img) continue;
  const it = catFF[`${nome} (${jogo})`];
  const m = { nome, jogo, img, ...(typeof it?.nivel === 'number' ? { nivel: it.nivel } : {}) };
  if (it?.categoria === 'Chefe') ff.chefes.push(m);
  else if (it?.categoria === 'Inimigo') ff.inimigos.push(m);
  else ffSemCategoria++;
}
if (ffSemCategoria) avisar(`${ffSemCategoria} monstros do Final Fantasy sem categoria em public/catalogo/ff.json ficaram de fora`);

// ---------------------------------------------------------------------------------------------------
// Saída
// ---------------------------------------------------------------------------------------------------

/** FormaDados com as chaves sempre na mesma ordem (e sem os campos de trabalho). */
const formaFinal = f => ({
  id: f.id, nome: f.nome, img: f.img, fr: f.fr, classes: f.classes,
  ...(f.habilidade ? { habilidade: f.habilidade } : {}),
  ...(f.habilidadeOriginal ? { habilidadeOriginal: f.habilidadeOriginal } : {}),
  ...(f.semUlt ? { semUlt: true } : {}),
  ...(f.transforma ? { transforma: f.transforma } : {}),
  ...(f.soUlt ? { soUlt: true } : {}),
  info: f.info,
});

// conferência: tudo que um campeão ou forma cita existe
for (const c of campeoes) for (const id of [...c.niveis.flat(), ...Object.entries(c.de ?? {}).flat()]) if (!formas.has(id)) throw new Error(`${c.id} cita a forma ${id}, que não existe`);
for (const f of formas.values()) for (const t of f.transforma ?? []) if (!formas.has(t)) throw new Error(`${f.id} transforma em ${t}, que não existe`);

const fonte = path.relative(process.cwd(), path.resolve(ENTRADA)).replaceAll('\\', '/');
const geradoEm = new Date().toISOString().slice(0, 10);
const umPorLinha = xs => xs.map(x => JSON.stringify(x)).join(',\n');
const objPorLinha = o => Object.entries(o).map(([k, v]) => `${JSON.stringify(k)}:${JSON.stringify(v)}`).join(',\n');
const texto = `{"versao":1,"geradoEm":${JSON.stringify(geradoEm)},"fonte":${JSON.stringify(fonte)},
"tracos":[
${umPorLinha(tracos)}
],
"campeoes":[
${umPorLinha(campeoes)}
],
"formas":{
${objPorLinha(Object.fromEntries([...formas.values()].map(f => [f.id, formaFinal(f)])))}
},
"bakugan":{
${objPorLinha(bakugan)}
},
"ff":{"inimigos":[
${umPorLinha(ff.inimigos)}
],
"chefes":[
${umPorLinha(ff.chefes)}
]}}
`;
JSON.parse(texto); // a montagem à mão tem de dar JSON válido
fs.mkdirSync(path.dirname(SAIDA), { recursive: true });
fs.writeFileSync(SAIDA, texto);

// ---------------------------------------------------------------------------------------------------
// Resumo
// ---------------------------------------------------------------------------------------------------

const contar = (xs, f) => Object.entries(Object.groupBy(xs, f)).map(([k, v]) => `${k}: ${v.length}`).join(' · ');
const todasFormas = [...formas.values()];
const comHabilidade = todasFormas.filter(f => f.habilidade);
console.log(`${SAIDA} (${(texto.length / 1024).toFixed(0)} KB), a partir de ${fonte}`);
console.log(`\n${campeoes.length} campeões`);
console.log(`  por custo: ${contar(campeoes, c => c.custo)}`);
console.log(`  por origem: ${contar(campeoes, c => c.fr)}`);
console.log(`  linhas: ${campeoes.filter(c => c.linha).length} · soltos: ${campeoes.filter(c => !c.linha).length} · Stands: ${campeoes.filter(c => c.stand).length}`);
console.log(`\n${todasFormas.length} formas (${todasFormas.filter(f => !f.soUlt).length} vendidas, ${todasFormas.filter(f => f.soUlt).length} só de ult, ${todasFormas.filter(f => f.semUlt).length} só atacam)`);
console.log(`\n${comHabilidade.length} formas com habilidade própria:`);
for (const fr of ORIGENS) {
  const xs = comHabilidade.filter(f => f.fr === fr);
  if (xs.length) console.log(`  ${fr} (${xs.length}): ${xs.map(f => f.nome + (f.habilidadeOriginal ? '' : ' [Únicos, sem texto]')).join(', ')}`);
}
console.log(`\n${transformacoes.length} transformações: ${transformacoes.join(', ')}`);
console.log(`\nBakugan: ${Object.values(bakugan).filter(Boolean).length} de ${nomesBakugan.length + ATRIBUTOS_BAKUGAN.length} com imagem (com os 7 símbolos dos atributos)`);
console.log(`Final Fantasy: ${ff.inimigos.length} inimigos, ${ff.chefes.length} chefes`);
console.log(`\n${avisos.length} avisos${avisos.length ? ':' : ''}`);
for (const a of avisos) console.log(`  - ${a}`);
