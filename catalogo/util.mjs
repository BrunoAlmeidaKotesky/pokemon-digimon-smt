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
