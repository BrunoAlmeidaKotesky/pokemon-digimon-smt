// Resposta falsa da API da Yakuza Wiki (Sujidex), montada a partir de tests/fixtures/sujidex.json.
// Usada pelos testes do Playwright (tests/helpers.ts) e do Vitest (src/sources/test-utils.ts).

export interface SujidexFixture {
  wikitext: string;
  pageimages: { query: { pages: Record<string, { title: string }> } };
  imageinfo: { query: { pages: Record<string, { title: string }> } };
}

/** Devolve o corpo JSON da resposta pra URL pedida, ou undefined se não for um pedido conhecido. */
export function sujidexResponse(u: URL, fx: SujidexFixture): unknown {
  const action = u.searchParams.get('action');
  if (action === 'parse' && u.searchParams.get('page') === 'Sujidex')
    return { parse: { title: 'Sujidex', pageid: 25501, wikitext: { '*': fx.wikitext } } };
  if (action !== 'query') return undefined;
  const titles = new Set((u.searchParams.get('titles') ?? '').split('|'));
  const src = u.searchParams.get('prop') === 'pageimages' ? fx.pageimages : u.searchParams.get('prop') === 'imageinfo' ? fx.imageinfo : null;
  if (!src) return undefined;
  const pages = Object.fromEntries(Object.entries(src.query.pages).filter(([, p]) => titles.has(p.title)));
  return { batchcomplete: '', query: { pages } };
}
