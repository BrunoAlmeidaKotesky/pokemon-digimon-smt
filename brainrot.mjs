// Brainrot: os bichos do Animal Brainrot (https://animalbrainrot.com). Gera public/brainrot/list.json pro site.
//
// O site não tem API aberta (/api/ está barrada no robots.txt): este script lê o sitemap e abre a página de cada bicho,
// um por vez, com pausa. As imagens continuam vindo de static.animalbrainrot.com (imagem em <img> não precisa de CORS).
//
// O llms.txt do site libera a leitura por IA e pede pra usar o sitemap e respeitar o noindex de alguns bichos; o
// crawler-guidance.json pede frequência semanal, no máximo. Por isso: bicho com noindex fica de fora, nada de /api/ nem
// /_next/, e 403, 429 ou 503 param a coleta na hora (o que já veio fica salvo). Não rode isto à toa: leva meia hora.
//
// Uso (na pasta do repositório, Node 18 ou mais novo):
//   node brainrot.mjs        -> baixa tudo e grava public/brainrot/list.json
//   git add public/brainrot/list.json
//
// Formato: [nome, url da imagem, categoria, votos]. O site usa os dois primeiros; catalogo/brainrot.mjs, os outros.

import fs from 'node:fs/promises';

const SITE = 'https://animalbrainrot.com';
const OUT = 'public/brainrot/list.json';
const PAUSA_MS = 800;
const UA = 'brainrot.mjs (script pessoal do site Quem Voce Prefere)';

const sleep = ms => new Promise(r => setTimeout(r, ms));

const ENTIDADES = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ' };
const limpa = s => s
  .replace(/<!--.*?-->/g, '')
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
  .replace(/&(\w+);/g, (m, e) => ENTIDADES[e] ?? m)
  .replace(/\s+/g, ' ').trim();

const meta = (html, re) => re.exec(html)?.[1] ?? '';

/** Nome, imagem, categoria e votos de uma página de bicho; 'noindex' se ela pede pra ficar de fora; null se não tem imagem própria. */
export function lerPagina(html) {
  const robots = meta(html, /<meta name="robots" content="([^"]*)"/);
  if (/noindex/i.test(robots)) return 'noindex';
  const nome = limpa(meta(html, /<h1[^>]*>(.*?)<\/h1>/s).replace(/<[^>]+>/g, ''));
  const img = meta(html, /<meta property="og:image" content="([^"]*)"/);
  // só a imagem do próprio bicho (nas duas pastas do site), não a imagem genérica de compartilhamento
  if (!nome || !/^https:\/\/static\.animalbrainrot\.com\/(images|animals)\//.test(img)) return null;
  const categoria = limpa(meta(html, /<p[^>]*>Category<\/p><p[^>]*>(.*?)<\/p>/s));
  const votos = Number(meta(html, /<p[^>]*>Popularity<\/p><p[^>]*>(\d+)/s) || 0);
  return [nome, img, categoria, votos];
}

async function pedir(url) {
  const r = await fetch(url, { headers: { 'User-Agent': UA } });
  if ([403, 429, 503].includes(r.status)) throw Object.assign(new Error(`o site respondeu ${r.status}`), { parar: true });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.text();
}

async function main() {
  const xml = await pedir(`${SITE}/sitemap.xml`);
  const urls = [...new Set([...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map(m => m[1]))]
    .filter(u => /\/animals\/[^/?#]+\/?$/.test(u) && !/\/animals\/category\//.test(u));
  console.log(`${urls.length} bichos no sitemap.`);

  const saida = [];
  const vistos = new Set();
  const falhas = [];
  const semImagem = [];
  let noindex = 0;
  const salvar = async () => {
    await fs.mkdir('public/brainrot', { recursive: true });
    const ordenada = [...saida].sort((a, b) => a[0].localeCompare(b[0], 'en'));
    await fs.writeFile(OUT, '[\n' + ordenada.map(x => JSON.stringify(x)).join(',\n') + '\n]\n');
  };

  for (const [i, u] of urls.entries()) {
    try {
      const b = lerPagina(await pedir(u));
      if (b === 'noindex') noindex++;
      else if (!b) semImagem.push(u);
      else if (!vistos.has(b[0].toLowerCase())) { vistos.add(b[0].toLowerCase()); saida.push(b); }
    } catch (e) {
      if (e.parar) { console.error(`parando em ${i + 1}/${urls.length}: ${e.message}`); await salvar(); process.exit(1); }
      falhas.push(u);
      console.warn(`falhou ${u}: ${e.message}`);
    }
    if ((i + 1) % 100 === 0) {
      console.log(`${i + 1}/${urls.length}: ${saida.length} bichos, ${noindex} noindex, ${semImagem.length} sem imagem`);
      await salvar();
    }
    await sleep(PAUSA_MS);
  }
  await salvar();
  console.log(`Pronto: ${saida.length} bichos; ${noindex} noindex; ${semImagem.length} sem imagem própria; ${falhas.length} falhas.`);
  if (semImagem.length) console.log('sem imagem:\n' + semImagem.join('\n'));
  if (falhas.length) console.log('falhas:\n' + falhas.join('\n'));
}

if (process.argv[1]?.endsWith('brainrot.mjs')) await main();
