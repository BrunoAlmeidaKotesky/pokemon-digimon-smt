// Resposta falsa das wikis com os renders de Overwatch e Deadlock, montada a partir de
// tests/fixtures/wiki-renders.json ({ host: { título pedido: url da imagem } }).
// Usada pelos testes do Playwright (tests/helpers.ts) e do Vitest (src/sources/test-utils.ts).

export type RendersFixture = Record<string, Record<string, string>>;
export const RENDER_HOSTS = ['overwatch.fandom.com', 'deadlock.wiki'];

/** Devolve o corpo JSON da resposta pra URL pedida, ou undefined se não for um pedido conhecido. */
export function rendersResponse(u: URL, fx: RendersFixture): unknown {
  const map = fx[u.hostname];
  if (!map || u.pathname !== '/api.php' || u.searchParams.get('action') !== 'query') return undefined;
  const prop = u.searchParams.get('prop');
  if (prop !== 'pageimages' && prop !== 'imageinfo') return undefined;
  const titles = (u.searchParams.get('titles') ?? '').split('|');
  const pages = Object.fromEntries(titles.map((title, i) => {
    const src = map[title];
    if (!src) return [String(-1 - i), { ns: 0, title, missing: '' }];
    return [String(1000 + i), prop === 'pageimages'
      ? { pageid: 1000 + i, ns: 0, title, thumbnail: { source: src } }
      : { pageid: 1000 + i, ns: 6, title, imageinfo: [{ url: src, thumburl: src }] }];
  }));
  return { batchcomplete: '', query: { pages } };
}
