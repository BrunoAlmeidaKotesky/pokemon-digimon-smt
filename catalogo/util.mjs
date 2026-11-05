// Ajudantes dos coletores do catálogo (catalogo/<chave>.mjs): pedidos com nova tentativa, lotes e paralelismo.

/** Identificação dos pedidos: só ASCII (caractere acentuado já fez API responder 400) e nada de dado pessoal. */
export const UA = 'catalogo.mjs (script pessoal do site Quem Voce Prefere)';

export const sleep = ms => new Promise(r => setTimeout(r, ms));

/** [a, b, c, d, e] em pedaços de n: [[a, b], [c, d], [e]]. */
export const chunks = (a, n) => Array.from({ length: Math.ceil(a.length / n) }, (_, k) => a.slice(k * n, k * n + n));

/**
 * GET (ou POST com `body`) que devolve JSON. Resposta que não é JSON (a Fandom às vezes manda a página de desafio do
 * Cloudflare) ou erro 429/5xx: espera e tenta de novo, até `tentativas` vezes; depois lança erro.
 */
export async function getJson(url, { body, headers = {}, tentativas = 4 } = {}) {
  let ultimo = '';
  for (let t = 1; t <= tentativas; t++) {
    try {
      const r = await fetch(url, {
        method: body ? 'POST' : 'GET',
        headers: { 'User-Agent': UA, ...(body ? { 'Content-Type': 'application/json' } : {}), ...headers },
        body: body ? JSON.stringify(body) : undefined,
      });
      const text = await r.text();
      if (r.ok && /^\s*[[{]/.test(text)) return JSON.parse(text);
      ultimo = `${r.status} ${text.slice(0, 80).replace(/\s+/g, ' ')}`;
      if (r.status >= 400 && r.status < 500 && r.status !== 403 && r.status !== 429) break;
    } catch (e) {
      ultimo = String(e);
    }
    await sleep(1000 * t * t);
  }
  throw new Error(`falhou: ${url.slice(0, 140)} (${ultimo})`);
}

/** Roda `fn` em cada item com no máximo `n` ao mesmo tempo; devolve os resultados na ordem dos itens. */
export async function pool(items, n, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) {
      const k = i++;
      out[k] = await fn(items[k], k);
    }
  }));
  return out;
}

/** Pedido à API de uma wiki MediaWiki (format=json e origin=* já incluídos). */
export const wiki = (api, params) => getJson(api + '?' + new URLSearchParams({ format: 'json', origin: '*', ...params }));

/** Páginas (namespace 0) de uma categoria da wiki, seguindo a continuação; `extra` escolhe o `prop`. */
export async function membros(api, categoria, extra = {}) {
  const out = new Map();
  let cont = {};
  for (;;) {
    const d = await wiki(api, { action: 'query', generator: 'categorymembers', gcmtitle: categoria, gcmnamespace: '0', gcmlimit: 'max', ...extra, ...cont });
    for (const p of Object.values(d.query?.pages ?? {})) out.set(p.pageid, { ...out.get(p.pageid), ...p });
    if (!d.continue) return [...out.values()];
    cont = d.continue;
  }
}

/** Título da página -> nomes das categorias dela (sem "Category:"), 50 páginas por pedido. */
export async function categoriasDe(api, titulos) {
  const out = new Map(titulos.map(t => [t, []]));
  for (const lote of chunks(titulos, 50)) {
    let cont = {};
    for (;;) {
      const d = await wiki(api, { action: 'query', prop: 'categories', cllimit: 'max', titles: lote.join('|'), ...cont });
      for (const p of Object.values(d.query?.pages ?? {})) out.get(p.title)?.push(...(p.categories ?? []).map(c => c.title.replace(/^Category:/, '')));
      if (!d.continue) break;
      cont = d.continue;
    }
  }
  return out;
}

/** Arquivo pedido ("File:...") -> miniatura com a largura pedida, seguindo redirecionamentos; 50 por pedido. */
export async function miniaturas(api, arquivos, largura = 400) {
  const out = new Map();
  for (const lote of chunks([...new Set(arquivos)], 50)) {
    const d = await wiki(api, { action: 'query', prop: 'imageinfo', iiprop: 'url', iiurlwidth: String(largura), redirects: '1', titles: lote.join('|') });
    const volta = new Map();
    for (const x of d.query?.normalized ?? []) volta.set(x.to, x.from);
    for (const x of d.query?.redirects ?? []) volta.set(x.to, volta.get(x.from) ?? x.from);
    for (const p of Object.values(d.query?.pages ?? {})) {
      const u = p.imageinfo?.[0]?.thumburl ?? p.imageinfo?.[0]?.url;
      if (u) out.set(volta.get(p.title) ?? p.title, u);
    }
  }
  return out;
}
