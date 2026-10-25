// Gera tests/fixtures/wiki-renders.json com as respostas de verdade das wikis dos renders (Overwatch e Deadlock),
// só pros personagens das fixtures. Formato: { host: { título pedido: url da imagem } }, lido por
// tests/wiki-renders-mock.ts. Rode de novo se mudar overwatch-heroes.json, deadlock-heroes.json ou os parâmetros das
// fontes (tamanho da miniatura).
//
// Uso (na pasta do repositório): node tests/gerar-wiki-renders.mjs

import fs from 'node:fs';

const fx = n => JSON.parse(fs.readFileSync('tests/fixtures/' + n, 'utf8'));
const chunks = (a, n) => Array.from({ length: Math.ceil(a.length / n) }, (_, k) => a.slice(k * n, k * n + n));

/** Mesma consulta de src/sources/mediawiki.ts (50 títulos por pedido), devolvendo título pedido -> imagem. */
async function grab(api, titles, params, pick) {
  const out = {};
  for (const c of chunks(titles, 50)) {
    const url = api + '?' + new URLSearchParams({ format: 'json', origin: '*', action: 'query', titles: c.join('|'), ...params });
    const res = await fetch(url);
    const text = await res.text();
    // a Fandom às vezes responde com a página de desafio do Cloudflare: melhor parar do que gravar fixture pela metade
    if (!text.startsWith('{')) throw new Error(`${res.status} sem JSON em ${url.slice(0, 120)}... (tente de novo)`);
    const r = JSON.parse(text);
    const back = new Map();
    (r.query.normalized ?? []).forEach(x => back.set(x.to, x.from));
    (r.query.redirects ?? []).forEach(x => back.set(x.to, back.get(x.from) ?? x.from));
    Object.values(r.query.pages).forEach(p => { const u = pick(p); if (u) out[back.get(p.title) ?? p.title] = u; });
  }
  return out;
}

const ow = fx('overwatch-heroes.json').map(h => h.name);
const dl = fx('deadlock-heroes.json').filter(h => h.player_selectable && !h.disabled).map(h => `File:${h.name} Render.png`);
const out = {
  'overwatch.fandom.com': await grab('https://overwatch.fandom.com/api.php', ow,
    { prop: 'pageimages', piprop: 'thumbnail', pithumbsize: '600', pilimit: '50', redirects: '1' }, p => p.thumbnail?.source),
  'deadlock.wiki': await grab('https://deadlock.wiki/api.php', dl,
    { prop: 'imageinfo', iiprop: 'url', iiurlwidth: '500' }, p => p.imageinfo?.[0]?.thumburl),
};
for (const [k, v] of Object.entries(out)) console.log(k, Object.keys(v).length);
fs.writeFileSync('tests/fixtures/wiki-renders.json', JSON.stringify(out, null, 1) + '\n');
