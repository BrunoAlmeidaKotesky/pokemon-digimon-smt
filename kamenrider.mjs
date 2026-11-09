// Kamen Riders pela Kamen Rider Wiki (https://kamenrider.fandom.com). Gera public/kamenrider/list.json pro site.
//
// A lista é a tabela "Confirmed List" da página List of Kamen Riders: quem as fontes oficiais reconhecem como Kamen
// Rider. A imagem é o render do traje, de corpo inteiro, sem fundo. A API da wiki manda CORS, mas seriam centenas de
// páginas a cada visita: a lista fica salva no repositório e só as imagens vêm de static.wikia.nocookie.net.
// (A kamen-rider-character-api.onrender.com só tem 5 personagens e não manda CORS.)
//
// Uso (na pasta do repositório, Node 18 ou mais novo):
//   node kamenrider.mjs          -> baixa tudo e grava public/kamenrider/list.json
//   git add public/kamenrider/list.json
//
// Formato: [nome, url da imagem, série, usuário]. Série e usuário são só pro catálogo.
//
// A imagem principal das páginas é a foto do ator, então vale o texto da página: um arquivo "KR...-<forma>.png" ou
// "<nome> Profile.png" cujo nome bata com o do Rider. A página pode citar outros Riders (Aka-Rider usa as armas de
// todo mundo), por isso o nome precisa bater; só a página própria do Rider aceita o primeiro render, sem conferir.
// Sem nenhuma imagem do traje, o Rider fica de fora e aparece nos avisos.

import fs from 'node:fs/promises';
import { chunks, miniaturas, wiki } from './catalogo/util.mjs';

const API = 'https://kamenrider.fandom.com/api.php';
const OUT = 'public/kamenrider/list.json';

/** O texto da página não aponta pro render certo: arquivo escolhido à mão. */
const IMAGEM = {
  'Kamen Rider 1': 'KRTOS-Original 1.png', 'Kamen Rider 2': 'KRTOS-Original 2.png',
  'Kamen Rider 1 (The Next)': 'KRTHE-1 (The Next).png', 'Kamen Rider 2 (The Next)': 'KRTHE-2 (The Next).png',
  'Kamen Rider V3 (The Next)': 'KRTHE-V3.png', 'Kamen Rider Lazer': 'Lazer Profile.png',
  'Aka-Rider': 'Aka-Rider (Hero Training School) Profile.png', 'Ao-Rider': 'Ao-Rider (Hero Training School) Profile.png',
  'Mido-Rider': 'Mido-Rider (Hero Training School) Profile.png', 'Ki-Rider': 'Ki-Rider (Hero Training School) Profile.png',
  'Momo-Rider': 'Momo-Rider (Hero Training School) Profile.png', 'Ancient King Kamen Rider OOO': 'Greeed (King) Profile.png',
  'Kamen Rider Dark Necrom Pink': 'KRGh-Dark Necrom P Transient.png', 'Agito Burning Form (Evil)': 'Fake Agito Profile.png',
  'Kamen Rider': 'Kamen Rider (Shin) Profile.png',
};
/** A tabela oficial da wiki para no Gotchard: as séries mais novas entram à mão. */
const RECENTES = [
  { serie: 'Kamen Rider Gavv', alvo: 'Kamen Rider Gavv (Rider)', nome: 'Kamen Rider Gavv', usuario: 'Shoma' },
  { serie: 'Kamen Rider Gavv', alvo: 'Kamen Rider Valen', nome: 'Kamen Rider Valen', usuario: 'Hanto Karakida' },
  { serie: 'Kamen Rider Gavv', alvo: 'Kamen Rider Vram', nome: 'Kamen Rider Vram', usuario: 'Rakia Amarga' },
  { serie: 'Kamen Rider Gavv', alvo: 'Kamen Rider Bitter Gavv', nome: 'Kamen Rider Bitter Gavv', usuario: '' },
  { serie: 'Kamen Rider Gavv', alvo: 'Kamen Rider Caries', nome: 'Kamen Rider Caries', usuario: '' },
  { serie: 'Kamen Rider Zeztz', alvo: 'Kamen Rider Zeztz (Rider)', nome: 'Kamen Rider Zeztz', usuario: 'Baku Yorozu' },
  { serie: 'Kamen Rider Zeztz', alvo: 'Kamen Rider Nox', nome: 'Kamen Rider Nox', usuario: 'Nox' },
];
/** O nome da tabela não diferencia o bastante do nome da franquia. */
export const NOME = { 'Kamen Rider': 'Kamen Rider (Shin)' };

const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
/** "Kamen Rider Ohma Zi-O (Movie)" -> "Ohma Zi-O". */
const curto = n => n.replace(/\s*\([^)]*\)\s*$/, '').replace(/^(Kamen Rider|Masked Rider)\s+/i, '').trim();

/** Linhas da tabela "Confirmed List": { serie, alvo, nome, usuario }. A série só vem na primeira linha do rowspan. */
export function lerTabela(wikitext) {
  const linhas = wikitext.slice(wikitext.indexOf('==Confirmed List==')).split('\n|-').slice(2);
  const link = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/;
  const riders = [];
  let serie = '';
  for (const l of linhas) {
    const cel = l.split('\n').filter(x => x.startsWith('|')).map(x => x.slice(1));
    if (!/^align="center"\|\d/.test(cel[0] ?? '')) continue;
    let i = 1;
    if (/^rowspan/.test(cel[i])) { const m = link.exec(cel[i]); serie = m ? (m[2] ?? m[1]) : cel[i].replace(/^rowspan="\d+"\|/, ''); i++; }
    const m = link.exec(cel[i] ?? '');
    const plano = (cel[i] ?? '').replace(/<[^>]+>.*$/, '').trim();
    if (!m && !plano) continue;
    riders.push({ serie, alvo: m?.[1] ?? plano, nome: m?.[2] ?? m?.[1] ?? plano, usuario: link.exec(cel[i + 1] ?? '')?.[1] ?? '' });
  }
  return riders;
}

/** Texto de cada título (seguindo redirecionamento), 50 por pedido; o que a resposta em lote não trouxe vai um a um. */
async function textos(titulos) {
  const out = new Map();
  for (const lote of chunks([...new Set(titulos)], 50)) {
    const volta = new Map();
    let cont = {};
    for (;;) {
      const d = await wiki(API, { action: 'query', prop: 'revisions', rvprop: 'content', rvslots: 'main', redirects: '1', titles: lote.join('|'), ...cont });
      for (const x of d.query?.normalized ?? []) volta.set(x.to, x.from);
      for (const x of d.query?.redirects ?? []) volta.set(x.to, volta.get(x.from) ?? x.from);
      for (const p of Object.values(d.query?.pages ?? {})) {
        const c = p.revisions?.[0]?.slots?.main?.['*'];
        if (c) out.set(volta.get(p.title) ?? p.title, c);
      }
      if (!d.continue) break;
      cont = d.continue;
    }
  }
  for (const t of new Set(titulos)) {
    if (out.has(t)) continue;
    const d = await wiki(API, { action: 'parse', prop: 'wikitext', redirects: '1', page: t }).catch(() => null);
    const c = d?.parse?.wikitext?.['*'];
    if (c) out.set(t, c);
  }
  return out;
}

/** Arquivos de traje citados no texto, na ordem: "KR...-forma.png" e "... Profile.png". */
const arquivosDeTraje = texto => [...new Set([...texto.matchAll(/(?:File:|Image:|=\s*)([^\]|=\n{}]*\.(?:png|jpe?g|webp))/gi)]
  .map(m => m[1].replace(/^\[\[(?:File|Image):/i, '').trim()))]
  .filter(a => /^KR|Profile/i.test(a) && !/No Image/i.test(a));

/**
 * O melhor arquivo pro Rider, nesta ordem: o nome exato (KRDCD-Decade, e não KRDCD-Dark Decade), o nome no começo
 * (KRKu-Kuugamighty, a forma básica vem primeiro no texto) e o nome em qualquer lugar. Sem o nome no arquivo, só a
 * página própria do Rider aceita o primeiro render (KRTOS-New 1 é o Kamen Rider 1). `nivel` diz como foi achado.
 */
export function escolherImagem(rider, texto, tituloDaPagina = rider.alvo) {
  const arquivos = arquivosDeTraje(texto);
  const n = norm(curto(rider.nome));
  const parte = a => norm(a.replace(/^KR[^-]*-/, '').replace(/\.\w+$/, '').replace(/\s*Profile$/i, '').replace(/^Kamen Rider /i, ''));
  const achar = (f, nivel) => { const arquivo = n ? arquivos.find(a => f(parte(a))) : null; return arquivo ? { arquivo, nivel } : null; };
  const achado = achar(p => p === n, 'exato') ?? achar(p => p.startsWith(n), 'prefixo') ?? achar(p => p.includes(n), 'meio');
  if (achado) return achado;
  const propria = norm(tituloDaPagina.replace(/\s*\(Rider\)$/, '')) === norm(rider.nome.replace(/\s*\(Rider\)$/, ''));
  const primeiro = propria ? arquivos.find(a => /^KR/i.test(a)) : null;
  return primeiro ? { arquivo: primeiro, nivel: 'pagina' } : null;
}

async function main() {
  const lista = await wiki(API, { action: 'parse', prop: 'wikitext', page: 'List of Kamen Riders' });
  const riders = [...lerTabela(lista.parse.wikitext['*']), ...RECENTES];
  const tx = await textos(riders.flatMap(r => [r.alvo, r.usuario].filter(Boolean)));
  for (const r of riders) {
    // a página do Rider, e a do usuário (linhas sem página própria, como "Kamen Rider 1 (The First)")
    const achado = escolherImagem(r, tx.get(r.alvo) ?? '') ?? (r.usuario ? escolherImagem(r, tx.get(r.usuario) ?? '', r.usuario) : null);
    r.arquivo = IMAGEM[r.nome] ?? achado?.arquivo ?? null;
    r.nivel = IMAGEM[r.nome] ? 'manual' : achado?.nivel;
  }
  const arquivo = a => 'File:' + a.replace(/_/g, ' ');
  const com = riders.filter(r => r.arquivo);
  const thumbs = await miniaturas(API, com.map(r => arquivo(r.arquivo)));
  // a mesma imagem em duas linhas e o nome repetido: fica o nome mais curto, pra não haver duas cartas iguais
  const porImagem = new Map();
  for (const r of com) {
    const img = thumbs.get(arquivo(r.arquivo));
    const dono = porImagem.get(img);
    if (img && (!dono || r.nome.length < dono.nome.length)) porImagem.set(img, r);
  }
  const vistos = new Set();
  const list = [...porImagem].map(([img, r]) => [NOME[r.nome] ?? r.nome, img, r.serie, r.usuario])
    .filter(([n]) => !vistos.has(n) && vistos.add(n))
    .sort((a, b) => a[0].localeCompare(b[0], 'en'));
  await fs.mkdir('public/kamenrider', { recursive: true });
  await fs.writeFile(OUT, '[\n' + list.map(x => JSON.stringify(x)).join(',\n') + '\n]\n');
  const fora = riders.filter(r => !list.some(x => x[0] === (NOME[r.nome] ?? r.nome))).map(r => r.nome);
  console.log(`${list.length} de ${riders.length} Riders em ${OUT}.`);
  if (fora.length) console.warn(`fora (sem imagem do traje ou repetidos): ${fora.join(' | ')}`);
  if (process.env.KR_DETALHE) {
    await fs.writeFile(process.env.KR_DETALHE, JSON.stringify(riders.map(r => ({ nome: r.nome, serie: r.serie, arquivo: r.arquivo, nivel: r.nivel, entrou: list.some(x => x[0] === (NOME[r.nome] ?? r.nome)) }))));
  }
}

if (process.argv[1]?.endsWith('kamenrider.mjs')) await main();
