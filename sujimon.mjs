// Sujimon (Like a Dragon: Infinite Wealth) a partir dos screenshots do Sujidex da GamerGuides.
// Recorta o painel do meio do screenshot (onde fica só o personagem) e gera public/sujimon/ pro site.
// Enquanto public/sujimon/list.json não existir, o site usa a Yakuza Wiki.
//
// Uso (na pasta do repositório, Node 18 ou mais novo):
//   npm install --no-save sharp@0.33.5 cheerio@1.0.0
//
//   node sujimon.mjs baixar            -> lê o Sujidex da GamerGuides e salva cada screenshot original em
//                                         sujimon/_orig/NNN.img e os nomes em sujimon/_orig/nomes.json
//                                         (pula o que já baixou: dá pra parar e continuar)
//   node sujimon.mjs baixar --teste    -> só os 3 primeiros
//
//   node sujimon.mjs recortar --teste  -> recorta só alguns (001, 050, 150, 300...) e salva em
//                                         public/sujimon/_teste/NNN-conferir.jpg o screenshot inteiro com o
//                                         retângulo do recorte desenhado, pra ajustar RECORTE
//   node sujimon.mjs recortar          -> recorta todos e gera public/sujimon/NNN.webp e public/sujimon/list.json
//
// Depois: git add public/sujimon/*.webp public/sujimon/list.json (a pasta sujimon/_orig/ fica fora do git).
// O "baixar" acessa a gamerguides.com: rode você mesmo, com calma (há uma pausa entre os pedidos).

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
const RECORTE = { esquerda: 0.33, direita: 0.67, topo: 0.03, baixo: 0.97 };

// Screenshots com layout diferente: recorte próprio, ou null pra deixar de fora. Ex.: { '123': { esquerda: 0.3, ... } }
const EXCECOES = {};

// Números conferidos no --teste (além dos 3 primeiros)
const AMOSTRA = ['001', '050', '100', '150', '200', '250', '300'];
// -----------------------------

const [cmd] = process.argv.slice(2);
const TESTE = process.argv.includes('--teste');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const existe = f => fs.access(f).then(() => true, () => false);

async function lerJSON(arquivo, padrao) {
  try { return JSON.parse(await fs.readFile(arquivo, 'utf8')); } catch { return padrao; }
}

// ---------- baixar (GamerGuides) ----------
async function baixar() {
  const cheerio = await import('cheerio');
  const HEADERS = { 'User-Agent': 'Mozilla/5.0 (script pessoal de uso único)', 'Accept-Language': 'en' };
  const abs = u => (u.startsWith('//') ? 'https:' + u : u.startsWith('/') ? BASE + u : u);
  async function get(url, tipo = 'text') {
    for (let tentativa = 1; tentativa <= 3; tentativa++) {
      const r = await fetch(url, { headers: HEADERS });
      if (r.ok) return tipo === 'text' ? r.text() : Buffer.from(await r.arrayBuffer());
      console.log(`  ${r.status} em ${url} (tentativa ${tentativa})`);
      await sleep(PAUSA_MS * tentativa * 2);
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

  await fs.mkdir(ORIG, { recursive: true });
  console.log('Lendo a lista do Sujidex…');
  const $lista = cheerio.load(await get(LIST_URL));
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

  const nomes = await lerJSON(`${ORIG}/nomes.json`, {});
  const alvo = TESTE ? itens.slice(0, 3) : itens;
  const falhas = [];
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
      console.log(`FALHOU: ${e.message}`);
      falhas.push(`${it.numero} ${it.url}`);
    }
  }
  console.log(`\nPronto: ${Object.keys(nomes).length} screenshots em ${ORIG}/.`);
  if (falhas.length) console.log('Falharam (rode de novo pra tentar só esses):\n' + falhas.join('\n'));
  console.log('Agora: node sujimon.mjs recortar --teste');
}

// ---------- recortar (só arquivos locais) ----------
function retangulo(meta, r) {
  const left = Math.round(meta.width * r.esquerda), top = Math.round(meta.height * r.topo);
  const width = Math.round(meta.width * (r.direita - r.esquerda)), height = Math.round(meta.height * (r.baixo - r.topo));
  return { left, top, width: Math.min(width, meta.width - left), height: Math.min(height, meta.height - top) };
}

async function recortar() {
  const sharp = (await import('sharp')).default;
  const nomes = await lerJSON(`${ORIG}/nomes.json`, null);
  if (!nomes) throw new Error(`não achei ${ORIG}/nomes.json (rode "node sujimon.mjs baixar" antes)`);
  const numeros = Object.keys(nomes).sort();
  const alvo = TESTE ? numeros.filter((n, i) => i < 3 || AMOSTRA.includes(n)) : numeros;
  await fs.mkdir(TESTE ? `${OUT}/_teste` : OUT, { recursive: true });

  const lista = [], foraDeProposito = [], semArquivo = [], falhas = [];
  for (const num of alvo) {
    const r = num in EXCECOES ? EXCECOES[num] : RECORTE;
    if (r === null) { foraDeProposito.push(num); continue; }
    const arquivo = `${ORIG}/${num}.img`;
    if (!await existe(arquivo)) { semArquivo.push(num); continue; }
    try {
      const buf = await fs.readFile(arquivo);
      const meta = await sharp(buf).metadata();
      const box = retangulo(meta, r);
      if (TESTE) {
        const svg = `<svg width="${meta.width}" height="${meta.height}"><rect x="${box.left}" y="${box.top}" width="${box.width}" height="${box.height}" fill="none" stroke="#ff0040" stroke-width="${Math.max(3, Math.round(meta.width / 300))}"/></svg>`;
        await sharp(buf).composite([{ input: Buffer.from(svg) }]).jpeg({ quality: 85 }).toFile(`${OUT}/_teste/${num}-conferir.jpg`);
        await sharp(buf).extract(box).resize({ height: ALTURA_FINAL, withoutEnlargement: true }).webp({ quality: 80 }).toFile(`${OUT}/_teste/${num}.webp`);
        console.log(`${num} ${nomes[num]}: ${meta.width}x${meta.height}, recorte x=${box.left} y=${box.top} ${box.width}x${box.height}`);
      } else {
        await sharp(buf).extract(box).resize({ height: ALTURA_FINAL, withoutEnlargement: true }).webp({ quality: 80 }).toFile(`${OUT}/${num}.webp`);
        lista.push([nomes[num], num]);
      }
    } catch (e) {
      falhas.push(`${num} (${e.message})`);
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
  if (semArquivo.length) console.log('Sem screenshot baixado: ' + semArquivo.join(', '));
  if (falhas.length) console.log('Falharam: ' + falhas.join(', '));
}

const comandos = { baixar, recortar };
if (!comandos[cmd]) {
  console.log('Uso: node sujimon.mjs baixar [--teste] | node sujimon.mjs recortar [--teste]');
  process.exit(1);
}
comandos[cmd]().catch(e => { console.error(e.message ?? e); process.exit(1); });
