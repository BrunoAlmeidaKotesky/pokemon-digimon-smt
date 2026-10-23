// Sujimon (Like a Dragon: Infinite Wealth) a partir de screenshots da Sujidex.
// Recorta o painel do meio do screenshot (onde fica só o personagem) e gera public/sujimon/ pro site.
// Enquanto public/sujimon/list.json não existir, o site usa a Yakuza Wiki.
//
// Passo a passo (na pasta do repositório, Node 18 ou mais novo):
//   1. npm install   (sharp e cheerio já estão nas devDependencies do projeto)
//   2. No jogo, abra a Sujidex e tire um screenshot da tela de cada Sujimon (com o personagem no painel do meio).
//      Também serve salvar as imagens à mão pelo navegador.
//   3. Coloque os arquivos em sujimon/_orig/ com o número e o nome do Sujimon:
//        001 Burnout Bully.png   ou   001 - Burnout Bully.png
//      Extensão png, jpg, jpeg, webp ou img; o número pode ter de 1 a 3 dígitos (5 vira 005) e "_" no nome vira
//      espaço. Se existir sujimon/_orig/nomes.json ({ "001": "Burnout Bully", ... }), o nome de lá tem prioridade, e
//      aí o arquivo pode ser só o número (001.png, 001.img). Número repetido: vale o primeiro arquivo em ordem
//      alfabética. Arquivo fora do padrão fica de fora. O script avisa nos dois casos.
//   4. node sujimon.mjs recortar --teste  -> recorta só alguns (os 3 primeiros e 050, 100, 150...) e salva em
//                                            public/sujimon/_teste/NNN-conferir.jpg o screenshot inteiro com o
//                                            retângulo do recorte desenhado; ajuste RECORTE até ficar bom
//   5. node sujimon.mjs recortar          -> recorta todos e gera public/sujimon/NNN.webp e public/sujimon/list.json
//   6. git add public/sujimon/*.webp public/sujimon/list.json (a pasta sujimon/_orig/ fica fora do git).
//
// node sujimon.mjs baixar [--teste]: lê o Sujidex da gamerguides.com e salva em sujimon/_orig/NNN.img + nomes.json
// (--teste: só os 3 primeiros). O site responde 403 pra acesso automatizado: no primeiro 401, 403 ou 429 o script
// para na hora e explica as alternativas. Ele não tenta contornar o bloqueio (não imita navegador nem tenta de novo).

import fs from 'node:fs/promises';

// ---------- ajustes ----------
const BASE = 'https://www.gamerguides.com';
const LIST_URL = BASE + '/like-a-dragon-infinite-wealth/database/sujidex/sujimon';
const ORIG = 'sujimon/_orig';
const OUT = 'public/sujimon';
const PAUSA_MS = 2500;        // espera entre um pedido e outro, pra não sobrecarregar o site
const ALTURA_FINAL = 640;     // altura da imagem salva (a largura acompanha a proporção)

// Recorte, em fração do screenshot (0 = borda esquerda/topo, 1 = borda direita/baixo).
// Rode "recortar --teste", abra public/sujimon/_teste/*-conferir.jpg e ajuste até o retângulo pegar só o painel do
// meio, sem borda das caixas da esquerda e da direita e sem cortar cabeça, pés ou objetos.
// Medido nos screenshots do Sujidex (1920x1080 e 3840x2160): o painel da lista termina em ~34% da largura, a barrinha
// branca de rolagem fica em ~35% e o painel da ficha começa em ~64,5%; os botões "Rotate / Play Animation" ficam a ~88%
// da altura.
const RECORTE = { esquerda: 0.36, direita: 0.643, topo: 0.02, baixo: 0.87 };

// Screenshots com layout diferente: recorte próprio, ou null pra deixar de fora. Ex.: { '123': { esquerda: 0.3, ... } }
const EXCECOES = {
  // escavadeiras, tubarão e lula: mais largos que o normal; começam logo depois do painel da lista
  '297': { ...RECORTE, esquerda: 0.345 },
  '298': { ...RECORTE, esquerda: 0.345 },
  '299': { ...RECORTE, esquerda: 0.338, direita: 0.65 },
  '300': { ...RECORTE, esquerda: 0.345 },
};

// Números conferidos no --teste (além dos 3 primeiros)
const AMOSTRA = ['001', '019', '100', '200', '250', '300', '305', '310', '317'];
// -----------------------------

const [cmd] = process.argv.slice(2);
const TESTE = process.argv.includes('--teste');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const existe = f => fs.access(f).then(() => true, () => false);

/** Importa um pacote; se faltar, explica o que fazer em vez de mostrar o erro cru do Node. */
async function pacote(nome) {
  try {
    return await import(nome);
  } catch {
    console.error(`Falta o pacote "${nome}". Rode "npm install" na pasta do repositório e tente de novo.`);
    process.exit(1);
  }
}

async function lerJSON(arquivo, padrao) {
  try { return JSON.parse(await fs.readFile(arquivo, 'utf8')); } catch { return padrao; }
}

// ---------- baixar (GamerGuides) ----------
// Respostas que querem dizer "acesso automatizado não": o script para na hora, sem tentar de novo.
const BLOQUEIO = { 401: 'não autorizado', 403: 'acesso negado', 429: 'pedidos demais' };

class Bloqueado extends Error {
  constructor(status, url) {
    super(`${status} (${BLOQUEIO[status]}) em ${url}`);
    this.status = status;
  }
}

function explicarBloqueio(status) {
  console.error([
    '',
    `A gamerguides.com respondeu ${status} (${BLOQUEIO[status]}): o site bloqueia acesso automatizado.`,
    'Este script não tenta contornar o bloqueio (não imita navegador e não tenta de novo). Alternativas:',
    '  (a) tire seus próprios screenshots da Sujidex no jogo, ou',
    '  (b) salve as imagens à mão pelo navegador;',
    `      nos dois casos, coloque os arquivos em ${ORIG}/ com o número de 3 dígitos + espaço + nome,`,
    '      ex.: "001 Burnout Bully.png", e depois rode: node sujimon.mjs recortar --teste',
    '  (c) enquanto isso, o site continua usando a Yakuza Wiki.',
  ].join('\n'));
}

async function baixar() {
  const cheerio = await pacote('cheerio');
  // O script se identifica como script: não finge ser navegador.
  const HEADERS = { 'User-Agent': 'sujimon.mjs (script pessoal de uso único)', 'Accept-Language': 'en' };
  const abs = u => (u.startsWith('//') ? 'https:' + u : u.startsWith('/') ? BASE + u : u);
  async function get(url, tipo = 'text') {
    for (let tentativa = 1; tentativa <= 3; tentativa++) {
      const r = await fetch(url, { headers: HEADERS });
      if (r.ok) return tipo === 'text' ? r.text() : Buffer.from(await r.arrayBuffer());
      if (r.status in BLOQUEIO) throw new Bloqueado(r.status, url); // bloqueio: nada de nova tentativa
      console.log(`  ${r.status} em ${url} (tentativa ${tentativa})`);
      if (tentativa < 3) await sleep(PAUSA_MS * tentativa * 2);
    }
    throw new Error('não consegui baixar ' + url);
  }
  // Procura a imagem da aba "Screenshot" na página do Sujimon.
  function acharScreenshot($) {
    const imgs = $('img').toArray().map(el => {
      const $el = $(el);
      const srcset = ($el.attr('srcset') || $el.attr('data-srcset') || '').split(',').map(s => s.trim().split(' ')[0]).filter(Boolean);
      const src = srcset.at(-1) || $el.attr('data-src') || $el.attr('src') || '';
      const perto = $el.closest('[id],[class],[data-tab],[aria-labelledby]');
      const contexto = [$el.attr('alt'), $el.attr('title'), src, perto.attr('id'), perto.attr('class'),
        $el.closest('[data-tab]').attr('data-tab'), $el.closest('[aria-labelledby]').attr('aria-labelledby')].join(' ');
      return { src: abs(src), contexto, largura: Number($el.attr('width')) || 0 };
    }).filter(i => i.src && !i.src.startsWith('data:') && !/\.svg(\?|$)/i.test(i.src));
    const porNome = imgs.find(i => /screenshot/i.test(i.contexto));
    if (porNome) return { url: porNome.src, como: 'marcada como screenshot' };
    const og = $('meta[property="og:image"]').attr('content');
    if (og) return { url: abs(og), como: 'og:image (confira no recortar --teste)' };
    const maior = imgs.sort((a, b) => b.largura - a.largura)[0];
    return maior ? { url: maior.src, como: 'maior imagem da página (confira no recortar --teste)' } : null;
  }

  console.log('Lendo a lista do Sujidex…');
  let htmlLista;
  try {
    htmlLista = await get(LIST_URL);
  } catch (e) {
    if (!(e instanceof Bloqueado)) throw e;
    explicarBloqueio(e.status);
    process.exit(1);
  }
  const $lista = cheerio.load(htmlLista);
  const vistos = new Set(), itens = [];
  $lista('a[href*="/database/sujidex/sujimon/"]').each((_, a) => {
    const href = $lista(a).attr('href');
    const slug = href.split('/').filter(Boolean).pop();
    const m = slug.match(/^(\d{3})-/);
    if (!m || vistos.has(slug)) return;
    vistos.add(slug);
    itens.push({ numero: m[1], url: abs(href), nomeLista: $lista(a).text().trim() });
  });
  itens.sort((a, b) => a.numero.localeCompare(b.numero));
  console.log(`${itens.length} Sujimon na lista.`);

  await fs.mkdir(ORIG, { recursive: true });
  const nomes = await lerJSON(`${ORIG}/nomes.json`, {});
  const alvo = TESTE ? itens.slice(0, 3) : itens;
  const falhas = [];
  let bloqueio = null;
  for (const [i, it] of alvo.entries()) {
    const arquivo = `${ORIG}/${it.numero}.img`;
    if (await existe(arquivo) && nomes[it.numero]) continue;
    process.stdout.write(`[${i + 1}/${alvo.length}] ${it.numero} `);
    try {
      await sleep(PAUSA_MS);
      const $ = cheerio.load(await get(it.url));
      const nome = ($('h1').first().text().trim() || it.nomeLista || it.numero).replace(/\s+/g, ' ');
      const shot = acharScreenshot($);
      if (!shot) throw new Error('sem imagem na página');
      console.log(`${nome}  (${shot.como})`);
      await sleep(PAUSA_MS);
      await fs.writeFile(arquivo, await get(shot.url, 'buffer'));
      nomes[it.numero] = nome;
      await fs.writeFile(`${ORIG}/nomes.json`, JSON.stringify(nomes, null, 1));
    } catch (e) {
      if (e instanceof Bloqueado) { console.log(`PAREI: ${e.message}`); bloqueio = e; break; }
      console.log(`FALHOU: ${e.message}`);
      falhas.push(`${it.numero} ${it.url}`);
    }
  }
  console.log(`\n${bloqueio ? 'Parei' : 'Pronto'}: ${Object.keys(nomes).length} screenshots em ${ORIG}/.`);
  if (falhas.length) console.log('Falharam (rode de novo pra tentar só esses):\n' + falhas.join('\n'));
  if (bloqueio) { explicarBloqueio(bloqueio.status); process.exit(1); }
  console.log('Agora: node sujimon.mjs recortar --teste');
}

// ---------- recortar (só arquivos locais) ----------
// "001 Burnout Bully.png", "001 - Burnout Bully.png" ou só "001.img" (com o nome no nomes.json). "_" já virou espaço.
const PADRAO_ARQUIVO = /^(\d{1,3})(?:(?:\s*-\s*|\s+)(.*\S.*))?\.(?:png|jpe?g|webp|img)$/i;

/** Junta os screenshots de ORIG por número (arquivo + nome) e os avisos do que ficou de fora. */
async function lerOriginais() {
  const nomesJson = {};
  for (const [num, nome] of Object.entries(await lerJSON(`${ORIG}/nomes.json`, {}))) {
    nomesJson[num.padStart(3, '0')] = String(nome).replace(/\s+/g, ' ').trim();
  }
  let arquivos = [];
  try {
    arquivos = (await fs.readdir(ORIG, { withFileTypes: true })).filter(d => d.isFile()).map(d => d.name);
  } catch { /* sem a pasta: fica vazio e o recortar explica o que fazer */ }
  arquivos.sort((a, b) => a.localeCompare(b));

  const porNumero = new Map(), ignorados = [], repetidos = [];
  for (const arquivo of arquivos) {
    if (arquivo === 'nomes.json') continue;
    const m = arquivo.replace(/_/g, ' ').match(PADRAO_ARQUIVO);
    if (!m) { ignorados.push(arquivo); continue; }
    const num = m[1].padStart(3, '0');
    const primeiro = porNumero.get(num);
    if (primeiro) { repetidos.push(`${num}: usei "${primeiro.arquivo}" e ignorei "${arquivo}"`); continue; }
    // "007-retrato.png" (retrato baixado quando a página não tem screenshot): o nome vem do nomes.json
    const nome = (m[2] ?? '').replace(/\s+/g, ' ').trim();
    porNumero.set(num, { arquivo, nome: /^retrato$/i.test(nome) ? '' : nome });
  }

  const itens = [], semArquivo = [], semNome = [];
  for (const num of [...new Set([...porNumero.keys(), ...Object.keys(nomesJson)])].sort()) {
    const achado = porNumero.get(num);
    if (!achado) { semArquivo.push(num); continue; }
    const nome = nomesJson[num] || achado.nome; // o nomes.json tem prioridade
    if (!nome) { semNome.push(achado.arquivo); continue; }
    itens.push({ num, arquivo: achado.arquivo, nome });
  }
  const avisos = [
    ignorados.length && `ignorei (o nome não segue o padrão "001 Nome.png"): ${ignorados.join(', ')}`,
    ...repetidos.map(r => `número repetido, vale o primeiro em ordem alfabética: ${r}`),
    semNome.length && `sem nome (nem no arquivo nem no nomes.json): ${semNome.join(', ')}`,
    semArquivo.length && `no nomes.json, mas sem screenshot: ${semArquivo.join(', ')}`,
  ].filter(Boolean);
  return { itens, avisos };
}

function retangulo(meta, r) {
  const left = Math.round(meta.width * r.esquerda), top = Math.round(meta.height * r.topo);
  const width = Math.round(meta.width * (r.direita - r.esquerda)), height = Math.round(meta.height * (r.baixo - r.topo));
  return { left, top, width: Math.min(width, meta.width - left), height: Math.min(height, meta.height - top) };
}

async function recortar() {
  const sharp = (await pacote('sharp')).default;
  const { itens, avisos } = await lerOriginais();
  const mostrarAvisos = () => avisos.forEach(a => console.log('Aviso: ' + a));
  if (!itens.length) {
    mostrarAvisos();
    throw new Error(`não achei nenhum screenshot em ${ORIG}/. Coloque os arquivos lá com o número e o nome, ` +
      'ex.: "001 Burnout Bully.png" (passo a passo no topo do sujimon.mjs).');
  }
  const alvo = TESTE ? itens.filter((it, i) => i < 3 || AMOSTRA.includes(it.num)) : itens;
  await fs.mkdir(TESTE ? `${OUT}/_teste` : OUT, { recursive: true });

  const lista = [], foraDeProposito = [], falhas = [];
  for (const { num, arquivo, nome } of alvo) {
    const r = num in EXCECOES ? EXCECOES[num] : RECORTE;
    if (r === null) { foraDeProposito.push(num); continue; }
    try {
      const buf = await fs.readFile(`${ORIG}/${arquivo}`);
      const meta = await sharp(buf).metadata();
      // retrato (rosto com fundo transparente, ~168px): não tem o que cortar; só amplia 2x com suavização
      if (/-retrato\./i.test(arquivo) || meta.width < 600) {
        const destino = TESTE ? `${OUT}/_teste/${num}.webp` : `${OUT}/${num}.webp`;
        await sharp(buf).resize({ width: Math.min(meta.width * 2, 336), kernel: 'lanczos3' }).webp({ quality: 85, alphaQuality: 90 }).toFile(destino);
        if (TESTE) console.log(`${num} ${nome} (${arquivo}): retrato ${meta.width}x${meta.height}, sem recorte`);
        else lista.push([nome, num]);
        continue;
      }
      const box = retangulo(meta, r);
      if (TESTE) {
        const svg = `<svg width="${meta.width}" height="${meta.height}"><rect x="${box.left}" y="${box.top}" width="${box.width}" height="${box.height}" fill="none" stroke="#ff0040" stroke-width="${Math.max(3, Math.round(meta.width / 300))}"/></svg>`;
        await sharp(buf).composite([{ input: Buffer.from(svg) }]).jpeg({ quality: 85 }).toFile(`${OUT}/_teste/${num}-conferir.jpg`);
        await sharp(buf).extract(box).resize({ height: ALTURA_FINAL, withoutEnlargement: true }).webp({ quality: 80 }).toFile(`${OUT}/_teste/${num}.webp`);
        console.log(`${num} ${nome} (${arquivo}): ${meta.width}x${meta.height}, recorte x=${box.left} y=${box.top} ${box.width}x${box.height}`);
      } else {
        await sharp(buf).extract(box).resize({ height: ALTURA_FINAL, withoutEnlargement: true }).webp({ quality: 80 }).toFile(`${OUT}/${num}.webp`);
        lista.push([nome, num]);
      }
    } catch (e) {
      falhas.push(`${num} ${arquivo} (${e.message})`);
    }
  }
  if (TESTE) {
    console.log(`\nAbra ${OUT}/_teste/: *-conferir.jpg mostra o retângulo do recorte; *.webp é o resultado.`);
    console.log('Ajuste RECORTE (ou EXCECOES) no topo do script e rode de novo. Quando estiver bom: node sujimon.mjs recortar');
  } else {
    await fs.writeFile(`${OUT}/list.json`, JSON.stringify(lista));
    console.log(`\nPronto: ${lista.length} Sujimon em ${OUT}/ (list.json + .webp).`);
  }
  if (foraDeProposito.length) console.log('Fora de propósito (EXCECOES = null): ' + foraDeProposito.join(', '));
  if (falhas.length) console.log('Falharam: ' + falhas.join(', '));
  mostrarAvisos();
}

const comandos = { baixar, recortar };
if (!comandos[cmd]) {
  console.log('Uso: node sujimon.mjs baixar [--teste] | node sujimon.mjs recortar [--teste]');
  process.exit(1);
}
comandos[cmd]().catch(e => { console.error(e.message ?? e); process.exit(1); });
